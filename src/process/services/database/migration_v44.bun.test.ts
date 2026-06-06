// src/process/services/database/migration_v44.bun.test.ts
// Run with: bun test src/process/services/database/migration_v44.bun.test.ts
//
// Bun-runtime test for migration_v44 (drop legacy provider_catalogs /
// provider_models / default_models tables - SEC-DATA-01). Verifies the drop
// removes the residual weak-key ciphertext, is idempotent on a fresh DB, and
// leaves the model_registry_* tables untouched. Uses BunSqliteDriver so it runs
// on dev machines where better-sqlite3 native bindings ABI-mismatch under Bun.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v44 = ALL_MIGRATIONS.find((m) => m.version === 44) as IMigration | undefined;

/** Recreate the legacy v33 schema so up() has something to drop. */
function createLegacyTables(driver: BunSqliteDriver): void {
  driver.exec(`CREATE TABLE provider_catalogs (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    display_name TEXT,
    api_key_encrypted TEXT NOT NULL,
    additional_fields TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'connected',
    last_refreshed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  driver.exec('CREATE INDEX idx_provider_catalogs_provider_id ON provider_catalogs(provider_id)');
  driver.exec(`CREATE TABLE provider_models (
    id TEXT PRIMARY KEY,
    catalog_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    tier TEXT NOT NULL,
    capabilities TEXT NOT NULL DEFAULT '[]',
    enabled INTEGER NOT NULL DEFAULT 1,
    deprecated INTEGER NOT NULL DEFAULT 0,
    deprecated_at INTEGER,
    context_window INTEGER,
    pricing TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (catalog_id) REFERENCES provider_catalogs(id) ON DELETE CASCADE
  )`);
  driver.exec('CREATE INDEX idx_provider_models_catalog_id ON provider_models(catalog_id)');
  driver.exec('CREATE UNIQUE INDEX idx_provider_models_catalog_model ON provider_models(catalog_id, model_id)');
  driver.exec(`CREATE TABLE default_models (
    scope TEXT PRIMARY KEY,
    catalog_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
}

function tableExists(driver: BunSqliteDriver, name: string): boolean {
  const rows = driver.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).all(name) as Array<{
    name: string;
  }>;
  return rows.length > 0;
}

describe('Migration v44 - drop legacy provider tables (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v44).toBeDefined();
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 44', () => {
    expect(migration_v44).toBeDefined();
    expect(migration_v44!.version).toBe(44);
    expect(migration_v44!.name).toMatch(/legacy provider/i);
  });

  it('drops all three legacy tables and their indexes, removing weak-key ciphertext', () => {
    createLegacyTables(driver);
    // Seed a row holding the legacy weak-key ciphertext.
    driver
      .prepare(
        `INSERT INTO provider_catalogs (id, provider_id, api_key_encrypted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run('c-1', 'openai', 'iv:tag:ciphertext', 1, 1);
    expect(tableExists(driver, 'provider_catalogs')).toBe(true);

    migration_v44!.up(driver);

    expect(tableExists(driver, 'provider_catalogs')).toBe(false);
    expect(tableExists(driver, 'provider_models')).toBe(false);
    expect(tableExists(driver, 'default_models')).toBe(false);
    const indexes = driver
      .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_provider_%'`)
      .all() as Array<{ name: string }>;
    expect(indexes.length).toBe(0);
  });

  it('up() is idempotent on a fresh DB that never had the legacy tables', () => {
    expect(tableExists(driver, 'provider_catalogs')).toBe(false);
    // Must not throw on a DB where the tables/indexes are already absent.
    expect(() => migration_v44!.up(driver)).not.toThrow();
    expect(() => migration_v44!.up(driver)).not.toThrow();
    expect(tableExists(driver, 'provider_catalogs')).toBe(false);
  });

  it('does NOT touch the model_registry_* tables', () => {
    createLegacyTables(driver);
    driver.exec(`CREATE TABLE model_registry_providers (
      provider_id TEXT PRIMARY KEY,
      connected_via TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'connected',
      creds_encrypted TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);
    driver
      .prepare(
        `INSERT INTO model_registry_providers (provider_id, connected_via, creds_encrypted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run('openai', 'api-key', 'safe-storage-blob', 1, 1);

    migration_v44!.up(driver);

    expect(tableExists(driver, 'model_registry_providers')).toBe(true);
    const row = driver
      .prepare(`SELECT creds_encrypted FROM model_registry_providers WHERE provider_id = ?`)
      .get('openai') as { creds_encrypted: string };
    expect(row.creds_encrypted).toBe('safe-storage-blob');
  });

  it('rollback recreates the legacy table shape (empty, no ciphertext)', () => {
    createLegacyTables(driver);
    migration_v44!.up(driver);
    expect(tableExists(driver, 'provider_catalogs')).toBe(false);

    migration_v44!.down(driver);

    expect(tableExists(driver, 'provider_catalogs')).toBe(true);
    expect(tableExists(driver, 'provider_models')).toBe(true);
    expect(tableExists(driver, 'default_models')).toBe(true);
    const count = driver.prepare('SELECT COUNT(*) AS n FROM provider_catalogs').get() as { n: number };
    expect(count.n).toBe(0);
  });
});
