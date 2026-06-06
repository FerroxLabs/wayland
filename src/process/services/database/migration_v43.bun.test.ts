// src/process/services/database/migration_v43.bun.test.ts
// Run with: bun test src/process/services/database/migration_v43.bun.test.ts
//
// Bun-runtime test for migration_v43 (projects table) plus the json_extract /
// json_remove SQL that backs getConversationsByProjectId and the detach-on-
// delete behaviour in removeProject. Uses BunSqliteDriver so it runs on dev
// machines where better-sqlite3 native bindings ABI-mismatch under Bun.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v43 = ALL_MIGRATIONS.find((m) => m.version === 43) as IMigration | undefined;

describe('Migration v43 - projects table (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v43).toBeDefined();
    migration_v43!.up(driver);
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 43', () => {
    expect(migration_v43).toBeDefined();
    expect(migration_v43!.version).toBe(43);
    expect(migration_v43!.name).toMatch(/projects/i);
  });

  it('creates the projects table with the expected columns', () => {
    const cols = driver.pragma('table_info(projects)') as Array<{ name: string }>;
    const colNames = cols.map((c) => c.name);
    for (const expected of [
      'id',
      'user_id',
      'name',
      'description',
      'workspace',
      'icon',
      'icon_color',
      'pinned',
      'pinned_at',
      'created_at',
      'updated_at',
    ]) {
      expect(colNames).toContain(expected);
    }
  });

  it('does NOT create a Foundry-style execution lock column', () => {
    const cols = driver.pragma('table_info(projects)') as Array<{ name: string }>;
    const colNames = cols.map((c) => c.name);
    // active_conversation_id was the per-project lock that serialized chats -
    // deliberately omitted so projects allow concurrent conversations.
    expect(colNames).not.toContain('active_conversation_id');
  });

  it('insert + select round-trips a project row', () => {
    driver
      .prepare(
        `INSERT INTO projects (id, user_id, name, description, workspace, icon, icon_color, pinned, pinned_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run('p-1', 'u-1', 'Launch', 'desc', '/ws', 'Folder', '#f60', 1, 1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_001);
    const row = driver.prepare('SELECT * FROM projects WHERE id = ?').get('p-1') as Record<string, unknown>;
    expect(row.name).toBe('Launch');
    expect(row.pinned).toBe(1);
    expect(row.workspace).toBe('/ws');
  });

  it('json_extract filters conversations by extra.projectId', () => {
    driver.exec(
      `CREATE TABLE conversations (id TEXT PRIMARY KEY, extra TEXT NOT NULL, updated_at INTEGER NOT NULL)`
    );
    driver.prepare('INSERT INTO conversations (id, extra, updated_at) VALUES (?, ?, ?)').run(
      'c-1',
      JSON.stringify({ projectId: 'p-1', backend: 'claude' }),
      2
    );
    driver.prepare('INSERT INTO conversations (id, extra, updated_at) VALUES (?, ?, ?)').run(
      'c-2',
      JSON.stringify({ projectId: 'p-2' }),
      1
    );
    driver.prepare('INSERT INTO conversations (id, extra, updated_at) VALUES (?, ?, ?)').run(
      'c-3',
      JSON.stringify({ backend: 'gemini' }),
      3
    );
    const rows = driver
      .prepare(`SELECT id FROM conversations WHERE json_extract(extra, '$.projectId') = ? ORDER BY updated_at DESC`)
      .all('p-1') as Array<{ id: string }>;
    expect(rows.map((r) => r.id)).toEqual(['c-1']);
  });

  it('json_remove detaches conversations from a project without deleting them', () => {
    driver.exec(`CREATE TABLE conversations (id TEXT PRIMARY KEY, extra TEXT NOT NULL, updated_at INTEGER NOT NULL)`);
    driver.prepare('INSERT INTO conversations (id, extra, updated_at) VALUES (?, ?, ?)').run(
      'c-1',
      JSON.stringify({ projectId: 'p-1', backend: 'claude' }),
      1
    );
    driver
      .prepare(`UPDATE conversations SET extra = json_remove(extra, '$.projectId') WHERE json_extract(extra, '$.projectId') = ?`)
      .run('p-1');
    const row = driver.prepare('SELECT extra FROM conversations WHERE id = ?').get('c-1') as { extra: string };
    const extra = JSON.parse(row.extra);
    expect(extra.projectId).toBeUndefined();
    // The conversation itself survives - deleting a project must not destroy chats.
    expect(extra.backend).toBe('claude');
  });

  it('rollback drops the projects table', () => {
    migration_v43!.down(driver);
    const tables = driver
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='projects'`)
      .all() as Array<{ name: string }>;
    expect(tables.length).toBe(0);
  });
});
