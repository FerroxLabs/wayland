// src/process/services/database/migration_v51.bun.test.ts
// Run with: bun test src/process/services/database/migration_v51.bun.test.ts
//
// Bun-runtime test for migration_v51 (add audit_log table). Verifies the table
// is created, has NO foreign keys (so PRAGMA foreign_key_check stays clean), the
// indexes exist, up() is idempotent, down() drops it, and a row inserts/reads
// back including NULL user_id. Uses BunSqliteDriver so it runs where
// better-sqlite3 ABI-mismatches under Bun.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v51 = ALL_MIGRATIONS.find((m) => m.version === 51) as IMigration | undefined;

function tableExists(driver: BunSqliteDriver, name: string): boolean {
  try {
    driver.prepare(`SELECT 1 FROM ${name} LIMIT 1`).get();
    return true;
  } catch {
    return false;
  }
}

describe('Migration v51 - audit_log table (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v51).toBeDefined();
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 51', () => {
    expect(migration_v51!.version).toBe(51);
    expect(migration_v51!.name).toMatch(/audit/i);
  });

  it('creates the audit_log table', () => {
    migration_v51!.up(driver);
    expect(tableExists(driver, 'audit_log')).toBe(true);
  });

  it('declares NO foreign keys (foreign_key_check stays clean)', () => {
    migration_v51!.up(driver);
    const fks = driver.pragma('foreign_key_list(audit_log)') as unknown[];
    expect(fks.length).toBe(0);
    const violations = driver.pragma('foreign_key_check') as unknown[];
    expect(violations.length).toBe(0);
  });

  it('creates the created_at and user indexes', () => {
    migration_v51!.up(driver);
    const indexes = (driver.pragma('index_list(audit_log)') as Array<{ name: string }>).map((i) => i.name);
    expect(indexes).toContain('idx_audit_log_created_at');
    expect(indexes).toContain('idx_audit_log_user');
  });

  it('stores and reads back an audit row', () => {
    migration_v51!.up(driver);
    driver
      .prepare(
        `INSERT INTO audit_log (user_id, action, target, ip, reached_via, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run('user-1', 'provider.connect', 'openai', '100.64.0.1', 'tailscale', 1_700_000_000);

    const row = driver
      .prepare('SELECT user_id, action, target, ip, reached_via FROM audit_log WHERE action = ?')
      .get('provider.connect') as {
      user_id: string;
      action: string;
      target: string;
      ip: string;
      reached_via: string;
    };
    expect(row.user_id).toBe('user-1');
    expect(row.action).toBe('provider.connect');
    expect(row.target).toBe('openai');
    expect(row.ip).toBe('100.64.0.1');
    expect(row.reached_via).toBe('tailscale');
  });

  it('allows NULL user_id / target / ip / reached_via (soft references, no FKs)', () => {
    migration_v51!.up(driver);
    expect(() => {
      driver
        .prepare(
          `INSERT INTO audit_log (user_id, action, target, ip, reached_via, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(null, 'storage.restore', null, null, null, 1);
    }).not.toThrow();
  });

  it('up() is idempotent (re-run does not throw or drop existing rows)', () => {
    migration_v51!.up(driver);
    driver
      .prepare(`INSERT INTO audit_log (action, created_at) VALUES (?, ?)`)
      .run('provider.connect', 1);

    expect(() => migration_v51!.up(driver)).not.toThrow();
    const row = driver.prepare('SELECT 1 FROM audit_log WHERE action = ?').get('provider.connect');
    expect(row).toBeDefined();
  });

  it('down() drops the table', () => {
    migration_v51!.up(driver);
    expect(tableExists(driver, 'audit_log')).toBe(true);
    migration_v51!.down(driver);
    expect(tableExists(driver, 'audit_log')).toBe(false);
  });
});
