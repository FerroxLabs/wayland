// src/process/services/database/migration_v46.bun.test.ts
// Run with: bun test src/process/services/database/migration_v46.bun.test.ts
//
// Bun-runtime test for migration_v46 (add verification_policy column to teams).
// Verifies the column is added (nullable, NULL default so existing teams resolve
// to the `advisory` gate default), up() is idempotent on a re-run, and the three
// policy values (off | advisory | blocking) insert and read back cleanly. Uses
// BunSqliteDriver so it runs on dev machines where better-sqlite3 native bindings
// ABI-mismatch under Bun.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v46 = ALL_MIGRATIONS.find((m) => m.version === 46) as IMigration | undefined;

/** Recreate the baseline teams schema (pre-policy) so up() has a table to alter. */
function createTeams(driver: BunSqliteDriver): void {
  driver.exec(`CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    workspace TEXT NOT NULL,
    workspace_mode TEXT NOT NULL DEFAULT 'shared',
    lead_agent_id TEXT NOT NULL DEFAULT '',
    agents TEXT NOT NULL DEFAULT '[]',
    is_sandboxed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
}

function columnNames(driver: BunSqliteDriver): Set<string> {
  const rows = driver.prepare(`PRAGMA table_info(teams)`).all() as Array<{ name: string }>;
  return new Set(rows.map((r) => r.name));
}

function insertTeam(driver: BunSqliteDriver, id: string, policy: string | null): void {
  driver
    .prepare(
      `INSERT INTO teams (id, user_id, name, workspace, verification_policy, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, 'user-1', 'team', '/ws', policy, 1, 1);
}

describe('Migration v46 - teams verification_policy column (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v46).toBeDefined();
    createTeams(driver);
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 46', () => {
    expect(migration_v46!.version).toBe(46);
    expect(migration_v46!.name).toMatch(/verification_policy/i);
  });

  it('adds the verification_policy column', () => {
    migration_v46!.up(driver);
    expect(columnNames(driver).has('verification_policy')).toBe(true);
  });

  it('defaults existing rows to NULL (resolves to advisory at the gate)', () => {
    driver
      .prepare(
        `INSERT INTO teams (id, user_id, name, workspace, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run('t-1', 'user-1', 'pre-policy team', '/ws', 1, 1);

    migration_v46!.up(driver);

    const row = driver
      .prepare(`SELECT verification_policy FROM teams WHERE id = ?`)
      .get('t-1') as { verification_policy: string | null };
    expect(row.verification_policy).toBeNull();
  });

  it('stores and reads back each policy value (off | advisory | blocking)', () => {
    migration_v46!.up(driver);
    insertTeam(driver, 't-off', 'off');
    insertTeam(driver, 't-adv', 'advisory');
    insertTeam(driver, 't-blk', 'blocking');

    const read = (id: string) =>
      (driver.prepare(`SELECT verification_policy FROM teams WHERE id = ?`).get(id) as {
        verification_policy: string | null;
      }).verification_policy;

    expect(read('t-off')).toBe('off');
    expect(read('t-adv')).toBe('advisory');
    expect(read('t-blk')).toBe('blocking');
  });

  it('up() is idempotent (re-run does not throw or duplicate the column)', () => {
    migration_v46!.up(driver);
    expect(() => migration_v46!.up(driver)).not.toThrow();
    const cols = [...columnNames(driver)].filter((c) => c === 'verification_policy');
    expect(cols.length).toBe(1);
  });
});
