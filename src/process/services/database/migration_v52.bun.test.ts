// src/process/services/database/migration_v52.bun.test.ts
// Run with: bun test src/process/services/database/migration_v52.bun.test.ts
//
// Bun-runtime test for migration_v52 (heal orphaned team-child rows). Verifies
// it deletes mailbox / team_tasks / team_event_log rows that reference a
// non-existent team, keeps valid rows, leaves PRAGMA foreign_key_check clean,
// is idempotent, and is safe when a child table is absent.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v52 = ALL_MIGRATIONS.find((m) => m.version === 52) as IMigration | undefined;

/** Build a minimal teams + child-table schema, then insert valid + orphaned rows with FK enforcement OFF. */
function seed(driver: BunSqliteDriver, opts: { withTeamTasks?: boolean; withEventLog?: boolean } = {}): void {
  driver.pragma('foreign_keys = OFF');
  driver.exec(`CREATE TABLE teams (id TEXT PRIMARY KEY, name TEXT)`);
  driver.exec(`CREATE TABLE mailbox (
    id TEXT PRIMARY KEY, team_id TEXT NOT NULL, content TEXT,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  )`);
  if (opts.withTeamTasks !== false) {
    driver.exec(`CREATE TABLE team_tasks (
      id TEXT PRIMARY KEY, team_id TEXT NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    )`);
  }
  if (opts.withEventLog !== false) {
    driver.exec(`CREATE TABLE team_event_log (
      id TEXT PRIMARY KEY, team_id TEXT NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    )`);
  }
  driver.prepare(`INSERT INTO teams (id, name) VALUES (?, ?)`).run('team-live', 'Live');
  // Valid child rows (team exists)
  driver.prepare(`INSERT INTO mailbox (id, team_id, content) VALUES (?, ?, ?)`).run('m-ok', 'team-live', 'hi');
  // Orphaned child rows (team-gone never existed / was deleted with FK off)
  driver.prepare(`INSERT INTO mailbox (id, team_id, content) VALUES (?, ?, ?)`).run('m-orphan1', 'team-gone', 'x');
  driver.prepare(`INSERT INTO mailbox (id, team_id, content) VALUES (?, ?, ?)`).run('m-orphan2', 'team-gone', 'y');
  if (opts.withTeamTasks !== false) {
    driver.prepare(`INSERT INTO team_tasks (id, team_id) VALUES (?, ?)`).run('t-ok', 'team-live');
    driver.prepare(`INSERT INTO team_tasks (id, team_id) VALUES (?, ?)`).run('t-orphan', 'team-gone');
  }
  if (opts.withEventLog !== false) {
    driver.prepare(`INSERT INTO team_event_log (id, team_id) VALUES (?, ?)`).run('e-orphan', 'team-gone');
  }
  driver.pragma('foreign_keys = ON');
}

describe('Migration v52 - heal orphaned team-child rows (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v52).toBeDefined();
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 52', () => {
    expect(migration_v52!.version).toBe(52);
    expect(migration_v52!.name).toMatch(/orphan/i);
  });

  it('starts with orphans that fail foreign_key_check', () => {
    seed(driver);
    const before = driver.pragma('foreign_key_check') as unknown[];
    expect(before.length).toBeGreaterThan(0);
  });

  it('deletes orphaned rows, keeps valid rows, leaves foreign_key_check clean', () => {
    seed(driver);
    migration_v52!.up(driver);

    const after = driver.pragma('foreign_key_check') as unknown[];
    expect(after.length).toBe(0);

    // valid rows survive
    expect(driver.prepare(`SELECT 1 FROM mailbox WHERE id='m-ok'`).get()).toBeDefined();
    expect(driver.prepare(`SELECT 1 FROM team_tasks WHERE id='t-ok'`).get()).toBeDefined();
    // orphans gone (bun:sqlite .get() returns null when no row matches)
    expect(driver.prepare(`SELECT 1 FROM mailbox WHERE id='m-orphan1'`).get()).toBeNull();
    expect(driver.prepare(`SELECT 1 FROM mailbox WHERE id='m-orphan2'`).get()).toBeNull();
    expect(driver.prepare(`SELECT 1 FROM team_tasks WHERE id='t-orphan'`).get()).toBeNull();
    expect(driver.prepare(`SELECT 1 FROM team_event_log WHERE id='e-orphan'`).get()).toBeNull();
  });

  it('is idempotent (re-run is a no-op, does not throw)', () => {
    seed(driver);
    migration_v52!.up(driver);
    expect(() => migration_v52!.up(driver)).not.toThrow();
    expect((driver.pragma('foreign_key_check') as unknown[]).length).toBe(0);
  });

  it('is safe when a child table does not exist', () => {
    seed(driver, { withTeamTasks: false, withEventLog: false });
    expect(() => migration_v52!.up(driver)).not.toThrow();
    expect((driver.pragma('foreign_key_check') as unknown[]).length).toBe(0);
  });
});
