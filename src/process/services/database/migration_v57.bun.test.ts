// src/process/services/database/migration_v57.bun.test.ts
// Run with: bun test src/process/services/database/migration_v57.bun.test.ts
//
// Bun-runtime test for migration_v57 (#999 - add project_id to teams). Verifies
// the column is added nullable with a NULL default (a team outside any project
// really has none), that a project id round-trips, and that up() is idempotent.
// Uses BunSqliteDriver so it runs on machines where better-sqlite3's native
// binding is built for the Electron ABI, which is where the vitest gate skips
// every native-sqlite suite.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v57 = ALL_MIGRATIONS.find((m) => m.version === 57) as IMigration | undefined;

/** The baseline teams schema this migration alters. */
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

const projectOf = (driver: BunSqliteDriver, id: string): string | null =>
  (driver.prepare(`SELECT project_id FROM teams WHERE id = ?`).get(id) as { project_id: string | null }).project_id;

describe('Migration v57 - teams project_id column (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v57).toBeDefined();
    createTeams(driver);
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 57', () => {
    expect(migration_v57!.version).toBe(57);
    expect(migration_v57!.name).toMatch(/project_id/i);
  });

  it('adds the project_id column', () => {
    migration_v57!.up(driver);
    expect(columnNames(driver).has('project_id')).toBe(true);
  });

  it('leaves an existing team with NULL - no project is a real answer', () => {
    driver
      .prepare(`INSERT INTO teams (id, user_id, name, workspace, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('t-1', 'user-1', 'pre-project team', '/ws', 1, 1);

    migration_v57!.up(driver);

    expect(projectOf(driver, 't-1')).toBeNull();
  });

  it('stores and reads back a project id', () => {
    migration_v57!.up(driver);
    driver
      .prepare(
        `INSERT INTO teams (id, user_id, name, workspace, project_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run('t-2', 'user-1', 'project team', '/ws', 'proj-7', 1, 1);

    expect(projectOf(driver, 't-2')).toBe('proj-7');
  });

  it('up() is idempotent (a re-run does not throw or duplicate the column)', () => {
    migration_v57!.up(driver);
    expect(() => migration_v57!.up(driver)).not.toThrow();
    expect([...columnNames(driver)].filter((c) => c === 'project_id').length).toBe(1);
  });
});
