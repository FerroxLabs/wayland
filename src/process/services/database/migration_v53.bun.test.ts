// src/process/services/database/migration_v53.bun.test.ts
// Run with: bun test src/process/services/database/migration_v53.bun.test.ts
//
// Bun-runtime test for migration_v53 (add model_registry_custom_models). Verifies
// the table is created, is keyed by (provider_id, model_id), cascades on provider
// delete, up() is idempotent, and down() drops it. Uses BunSqliteDriver so it runs
// where better-sqlite3 ABI-mismatches under Bun.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v53 = ALL_MIGRATIONS.find((m) => m.version === 53) as IMigration | undefined;

function tableExists(driver: BunSqliteDriver, name: string): boolean {
  try {
    driver.prepare(`SELECT 1 FROM ${name} LIMIT 1`).get();
    return true;
  } catch {
    return false;
  }
}

/** Minimal providers table so the FK target exists. */
function seedProviders(driver: BunSqliteDriver): void {
  driver.exec(`CREATE TABLE model_registry_providers (
    provider_id TEXT PRIMARY KEY,
    connected_via TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'connected',
    error TEXT,
    creds_encrypted TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  driver
    .prepare(
      `INSERT INTO model_registry_providers (provider_id, connected_via, creds_encrypted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run('openrouter', 'api-key', 'enc', 1, 1);
}

describe('Migration v53 - model_registry_custom_models (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v53).toBeDefined();
    seedProviders(driver);
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 53', () => {
    expect(migration_v53!.version).toBe(53);
    expect(migration_v53!.name).toMatch(/custom/i);
  });

  it('creates the model_registry_custom_models table', () => {
    migration_v53!.up(driver);
    expect(tableExists(driver, 'model_registry_custom_models')).toBe(true);
  });

  it('stores and reads back a custom model id verbatim (preset with @ and /)', () => {
    migration_v53!.up(driver);
    driver
      .prepare(`INSERT INTO model_registry_custom_models (provider_id, model_id, created_at) VALUES (?, ?, ?)`)
      .run('openrouter', '@preset/myfusion', 1);
    const row = driver
      .prepare('SELECT model_id FROM model_registry_custom_models WHERE provider_id = ?')
      .get('openrouter') as { model_id: string };
    expect(row.model_id).toBe('@preset/myfusion');
  });

  it('enforces the (provider_id, model_id) primary key', () => {
    migration_v53!.up(driver);
    driver
      .prepare(`INSERT INTO model_registry_custom_models (provider_id, model_id, created_at) VALUES (?, ?, ?)`)
      .run('openrouter', '@preset/myfusion', 1);
    expect(() => {
      driver
        .prepare(`INSERT INTO model_registry_custom_models (provider_id, model_id, created_at) VALUES (?, ?, ?)`)
        .run('openrouter', '@preset/myfusion', 2);
    }).toThrow();
  });

  it('cascades on provider delete (FK ON DELETE CASCADE)', () => {
    migration_v53!.up(driver);
    driver.pragma('foreign_keys = ON');
    driver
      .prepare(`INSERT INTO model_registry_custom_models (provider_id, model_id, created_at) VALUES (?, ?, ?)`)
      .run('openrouter', '@preset/myfusion', 1);
    driver.prepare(`DELETE FROM model_registry_providers WHERE provider_id = ?`).run('openrouter');
    const remaining = driver.prepare('SELECT COUNT(*) AS n FROM model_registry_custom_models').get() as { n: number };
    expect(remaining.n).toBe(0);
  });

  it('up() is idempotent (re-run does not throw or drop existing rows)', () => {
    migration_v53!.up(driver);
    driver
      .prepare(`INSERT INTO model_registry_custom_models (provider_id, model_id, created_at) VALUES (?, ?, ?)`)
      .run('openrouter', '@preset/myfusion', 1);
    expect(() => migration_v53!.up(driver)).not.toThrow();
    const row = driver.prepare('SELECT 1 FROM model_registry_custom_models WHERE model_id = ?').get('@preset/myfusion');
    expect(row).toBeDefined();
  });

  it('down() drops the table', () => {
    migration_v53!.up(driver);
    expect(tableExists(driver, 'model_registry_custom_models')).toBe(true);
    migration_v53!.down(driver);
    expect(tableExists(driver, 'model_registry_custom_models')).toBe(false);
  });
});
