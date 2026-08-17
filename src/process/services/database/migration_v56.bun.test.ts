import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';
import { TASK_DEDUPE_INDEX_NAME } from './teamTaskDedupe';

const migrationV56 = ALL_MIGRATIONS.find((migration) => migration.version === 56) as IMigration;

/** The v9 shape of team_tasks is enough for the dedupe migration. */
function createLegacyTaskTable(driver: BunSqliteDriver): void {
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
}

type TaskSeed = {
  id: string;
  teamId?: string;
  subject: string;
  status?: string;
  owner?: string | null;
  createdAt: number;
  metadata?: string;
};

function seed(driver: BunSqliteDriver, task: TaskSeed): void {
  driver
    .prepare(
      `INSERT INTO team_tasks (id, team_id, subject, status, owner, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      task.id,
      task.teamId ?? 'team-1',
      task.subject,
      task.status ?? 'pending',
      task.owner ?? null,
      task.metadata ?? '{}',
      task.createdAt,
      task.createdAt
    );
}

function statuses(driver: BunSqliteDriver): Record<string, string> {
  const rows = driver.prepare('SELECT id, status FROM team_tasks ORDER BY id').all() as Array<{
    id: string;
    status: string;
  }>;
  return Object.fromEntries(rows.map((r) => [r.id, r.status]));
}

describe('Migration v56 - team task dedupe', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    createLegacyTaskTable(driver);
  });

  afterEach(() => driver.close());

  it('keeps the oldest live duplicate, parks the rest and stamps where they went', () => {
    seed(driver, { id: 'keep', subject: 'Ship the release', owner: 'slot-1', createdAt: 100 });
    seed(driver, { id: 'dup-1', subject: '  SHIP the   release ', owner: 'slot-1', createdAt: 200 });
    seed(driver, { id: 'dup-2', subject: 'ship the release', owner: 'slot-1', status: 'in_progress', createdAt: 300 });

    migrationV56.up(driver);

    expect(statuses(driver)).toEqual({ keep: 'pending', 'dup-1': 'deleted', 'dup-2': 'deleted' });
    const stamped = driver
      .prepare(`SELECT id, json_extract(metadata, '$.dedupedInto') AS into_id FROM team_tasks WHERE id <> 'keep'`)
      .all() as Array<{ id: string; into_id: string }>;
    expect(stamped.every((row) => row.into_id === 'keep')).toBe(true);
  });

  it('leaves distinct tasks alone - different owner, different team, different subject', () => {
    seed(driver, { id: 'a', subject: 'Review', owner: 'slot-1', createdAt: 100 });
    seed(driver, { id: 'b', subject: 'Review', owner: 'slot-2', createdAt: 200 });
    seed(driver, { id: 'c', subject: 'Review', owner: null, createdAt: 300 });
    seed(driver, { id: 'd', subject: 'Review', owner: 'slot-1', teamId: 'team-2', createdAt: 400 });
    seed(driver, { id: 'e', subject: 'Review the diff', owner: 'slot-1', createdAt: 500 });

    migrationV56.up(driver);

    expect(Object.values(statuses(driver)).every((s) => s === 'pending')).toBe(true);
  });

  it('never resurrects or re-parks a terminal task', () => {
    seed(driver, { id: 'done', subject: 'Write docs', owner: 'slot-1', status: 'completed', createdAt: 100 });
    seed(driver, { id: 'live', subject: 'Write docs', owner: 'slot-1', createdAt: 200 });

    migrationV56.up(driver);

    expect(statuses(driver)).toEqual({ done: 'completed', live: 'pending' });
  });

  it('installs a partial unique index that refuses a second live duplicate', () => {
    migrationV56.up(driver);

    const index = driver
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?`)
      .get(TASK_DEDUPE_INDEX_NAME);
    expect(index).toBeTruthy();

    seed(driver, { id: 'x', subject: 'One task', owner: 'slot-1', createdAt: 100 });
    expect(() => seed(driver, { id: 'y', subject: 'one   TASK', owner: 'slot-1', createdAt: 200 })).toThrow();
    // ...but the same subject is free again once the first one is terminal.
    driver.exec(`UPDATE team_tasks SET status = 'completed' WHERE id = 'x'`);
    expect(() => seed(driver, { id: 'y', subject: 'One task', owner: 'slot-1', createdAt: 200 })).not.toThrow();
  });

  it('tolerates non-JSON metadata rather than aborting startup', () => {
    seed(driver, { id: 'keep', subject: 'Fix it', owner: 'slot-1', createdAt: 100 });
    seed(driver, { id: 'dup', subject: 'Fix it', owner: 'slot-1', createdAt: 200, metadata: 'not json' });

    expect(() => migrationV56.up(driver)).not.toThrow();
    expect(statuses(driver).dup).toBe('deleted');
  });

  it('is idempotent', () => {
    seed(driver, { id: 'keep', subject: 'Fix it', owner: 'slot-1', createdAt: 100 });
    seed(driver, { id: 'dup', subject: 'Fix it', owner: 'slot-1', createdAt: 200 });

    migrationV56.up(driver);
    expect(() => migrationV56.up(driver)).not.toThrow();
    expect(statuses(driver)).toEqual({ keep: 'pending', dup: 'deleted' });
  });

  it('down() drops the index and leaves the parked rows parked', () => {
    seed(driver, { id: 'keep', subject: 'Fix it', owner: 'slot-1', createdAt: 100 });
    seed(driver, { id: 'dup', subject: 'Fix it', owner: 'slot-1', createdAt: 200 });
    migrationV56.up(driver);

    migrationV56.down(driver);

    expect(
      driver.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?`).get(TASK_DEDUPE_INDEX_NAME)
    ).toBeNull();
    expect(statuses(driver).dup).toBe('deleted');
  });
});
