// src/process/services/database/migration_v45.bun.test.ts
// Run with: bun test src/process/services/database/migration_v45.bun.test.ts
//
// Bun-runtime test for migration_v45 (add lease/heartbeat/retry columns to
// team_tasks for durable execution). Verifies the columns are added with the
// right defaults, up() is idempotent on a re-run, and the migration is a no-op
// for the status column (status stays plain TEXT, no CHECK). Uses BunSqliteDriver
// so it runs on dev machines where better-sqlite3 native bindings ABI-mismatch
// under Bun.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v45 = ALL_MIGRATIONS.find((m) => m.version === 45) as IMigration | undefined;

/** Recreate the v20 team_tasks schema so up() has a table to alter. */
function createTeamTasks(driver: BunSqliteDriver): void {
  driver.exec(`CREATE TABLE team_tasks (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    owner TEXT,
    blocked_by TEXT NOT NULL DEFAULT '[]',
    blocks TEXT NOT NULL DEFAULT '[]',
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  driver.exec('CREATE INDEX idx_tasks_team ON team_tasks(team_id, status)');
}

function columnNames(driver: BunSqliteDriver): Set<string> {
  const rows = driver.prepare(`PRAGMA table_info(team_tasks)`).all() as Array<{ name: string }>;
  return new Set(rows.map((r) => r.name));
}

describe('Migration v45 - team_tasks lease/heartbeat/retry columns (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v45).toBeDefined();
    createTeamTasks(driver);
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 45', () => {
    expect(migration_v45!.version).toBe(45);
    expect(migration_v45!.name).toMatch(/lease|durable/i);
  });

  it('adds all five durable-execution columns', () => {
    migration_v45!.up(driver);
    const cols = columnNames(driver);
    expect(cols.has('lease_owner')).toBe(true);
    expect(cols.has('lease_expires_at')).toBe(true);
    expect(cols.has('last_heartbeat')).toBe(true);
    expect(cols.has('retry_budget')).toBe(true);
    expect(cols.has('retries_used')).toBe(true);
  });

  it('applies the retry defaults (budget 3, used 0) to existing rows', () => {
    driver
      .prepare(
        `INSERT INTO team_tasks (id, team_id, subject, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run('t-1', 'team-1', 'do the thing', 'in_progress', 1, 1);

    migration_v45!.up(driver);

    const row = driver
      .prepare(`SELECT retry_budget, retries_used, lease_owner FROM team_tasks WHERE id = ?`)
      .get('t-1') as { retry_budget: number; retries_used: number; lease_owner: string | null };
    expect(row.retry_budget).toBe(3);
    expect(row.retries_used).toBe(0);
    expect(row.lease_owner).toBeNull();
  });

  it('up() is idempotent (re-run does not throw or duplicate columns)', () => {
    migration_v45!.up(driver);
    expect(() => migration_v45!.up(driver)).not.toThrow();
    const cols = columnNames(driver);
    expect([...cols].filter((c) => c === 'lease_owner').length).toBe(1);
  });

  it('leaves status as a constraint-free TEXT column (verifying/zombie allowed)', () => {
    migration_v45!.up(driver);
    // No CHECK on status - arbitrary new statuses must insert cleanly.
    expect(() =>
      driver
        .prepare(
          `INSERT INTO team_tasks (id, team_id, subject, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run('t-2', 'team-1', 'verify me', 'verifying', 1, 1)
    ).not.toThrow();
    expect(() =>
      driver
        .prepare(
          `INSERT INTO team_tasks (id, team_id, subject, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run('t-3', 'team-1', 'zombie task', 'zombie', 1, 1)
    ).not.toThrow();
  });
});
