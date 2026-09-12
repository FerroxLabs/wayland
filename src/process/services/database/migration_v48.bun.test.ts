// src/process/services/database/migration_v48.bun.test.ts
// Run with: bun test src/process/services/database/migration_v48.bun.test.ts
//
// Bun-runtime test for migration_v48 (add cost_events table for per-turn cost
// observability). Verifies the table is created, has NO foreign keys (so
// PRAGMA foreign_key_check stays clean), the expected indexes exist, up() is
// idempotent, down() drops it, and a row inserts/reads back. Uses
// BunSqliteDriver so it runs where better-sqlite3 ABI-mismatches under Bun.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v48 = ALL_MIGRATIONS.find((m) => m.version === 48) as IMigration | undefined;

function tableExists(driver: BunSqliteDriver, name: string): boolean {
  try {
    driver.prepare(`SELECT 1 FROM ${name} LIMIT 1`).get();
    return true;
  } catch {
    return false;
  }
}

describe('Migration v48 - cost_events table (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v48).toBeDefined();
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 48', () => {
    expect(migration_v48!.version).toBe(48);
    expect(migration_v48!.name).toMatch(/cost_events/i);
  });

  it('creates the cost_events table', () => {
    migration_v48!.up(driver);
    expect(tableExists(driver, 'cost_events')).toBe(true);
  });

  it('declares NO foreign keys (foreign_key_check stays clean)', () => {
    migration_v48!.up(driver);
    const fks = driver.pragma('foreign_key_list(cost_events)') as unknown[];
    expect(fks.length).toBe(0);
    const violations = driver.pragma('foreign_key_check') as unknown[];
    expect(violations.length).toBe(0);
  });

  it('creates the four expected indexes', () => {
    migration_v48!.up(driver);
    const indexes = (driver.pragma('index_list(cost_events)') as Array<{ name: string }>).map((i) => i.name);
    expect(indexes).toContain('idx_cost_events_created_at');
    expect(indexes).toContain('idx_cost_events_conversation');
    expect(indexes).toContain('idx_cost_events_model');
    expect(indexes).toContain('idx_cost_events_backend');
  });

  it('stores and reads back a cost_event row', () => {
    migration_v48!.up(driver);
    driver
      .prepare(
        `INSERT INTO cost_events (conversation_id, backend, model_id, cost_usd, tokens_total, cost_source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run('conv-1', 'claude', 'opus-4', 0.42, 1500, 'engine', 1_700_000_000);

    const row = driver
      .prepare('SELECT cost_usd, tokens_total, cost_source FROM cost_events WHERE conversation_id = ?')
      .get('conv-1') as { cost_usd: number; tokens_total: number; cost_source: string };
    expect(row.cost_usd).toBeCloseTo(0.42, 6);
    expect(row.tokens_total).toBe(1500);
    expect(row.cost_source).toBe('engine');
  });

  it('allows NULL model_id / cron_id / team_id (soft references, no FKs)', () => {
    migration_v48!.up(driver);
    expect(() => {
      driver
        .prepare(
          `INSERT INTO cost_events (conversation_id, backend, cost_usd, tokens_total, cost_source, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run('conv-2', 'fuigo', 0, 0, 'unknown', 1);
    }).not.toThrow();
  });

  it('up() is idempotent (re-run does not throw or drop existing rows)', () => {
    migration_v48!.up(driver);
    driver
      .prepare(
        `INSERT INTO cost_events (conversation_id, backend, cost_usd, tokens_total, cost_source, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run('conv-3', 'gemini', 0.1, 100, 'computed', 1);

    expect(() => migration_v48!.up(driver)).not.toThrow();
    const row = driver.prepare('SELECT 1 FROM cost_events WHERE conversation_id = ?').get('conv-3');
    expect(row).toBeDefined();
  });

  it('down() drops the table', () => {
    migration_v48!.up(driver);
    expect(tableExists(driver, 'cost_events')).toBe(true);
    migration_v48!.down(driver);
    expect(tableExists(driver, 'cost_events')).toBe(false);
  });
});
