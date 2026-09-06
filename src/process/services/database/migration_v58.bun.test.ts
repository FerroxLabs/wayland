// Run with: bun test src/process/services/database/migration_v58.bun.test.ts

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration = ALL_MIGRATIONS.find((candidate) => candidate.version === 58) as IMigration | undefined;

function createLegacyMessages(driver: BunSqliteDriver): void {
  driver.exec(`CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    msg_id TEXT,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    position TEXT,
    status TEXT,
    hidden INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  )`);
}

function columnNames(driver: BunSqliteDriver): Set<string> {
  return new Set((driver.pragma('table_info(messages)') as Array<{ name: string }>).map((column) => column.name));
}

describe('Migration v58 - transcript ingest order', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    createLegacyMessages(driver);
    expect(migration).toBeDefined();
  });

  afterEach(() => driver.close());

  it('is registered as the current additive segment/order migration', () => {
    expect(migration!.name).toMatch(/segment identity.*ingest order/i);
  });

  it('preserves every historical row and assigns a deterministic per-conversation fallback', () => {
    const insert = driver.prepare(
      `INSERT INTO messages (id, conversation_id, msg_id, type, content, position, created_at)
       VALUES (?, ?, ?, 'text', ?, 'left', ?)`
    );
    insert.run('b', 'conv-1', 'turn-1', '{"content":"second by id"}', 1000);
    insert.run('a', 'conv-1', 'turn-1', '{"content":"first by id"}', 1000);
    insert.run('c', 'conv-1', 'turn-2', '{"content":"later timestamp"}', 1001);
    insert.run('z', 'conv-2', 'turn-x', '{"content":"other conversation"}', 1000);

    migration!.up(driver);

    expect(columnNames(driver).has('segment_id')).toBe(true);
    expect(columnNames(driver).has('ingest_order')).toBe(true);

    const rows = driver
      .prepare(
        'SELECT id, conversation_id, segment_id, ingest_order FROM messages ORDER BY conversation_id, ingest_order'
      )
      .all() as Array<{ id: string; conversation_id: string; segment_id: string | null; ingest_order: number }>;
    expect(rows).toEqual([
      { id: 'a', conversation_id: 'conv-1', segment_id: null, ingest_order: 0 },
      { id: 'b', conversation_id: 'conv-1', segment_id: null, ingest_order: 1 },
      { id: 'c', conversation_id: 'conv-1', segment_id: null, ingest_order: 2 },
      { id: 'z', conversation_id: 'conv-2', segment_id: null, ingest_order: 0 },
    ]);
    expect(driver.prepare('SELECT COUNT(*) AS count FROM messages').get()).toEqual({ count: 4 });
  });

  it('enforces one ordinal per conversation while allowing the same ordinal in another conversation', () => {
    migration!.up(driver);
    const insert = driver.prepare(
      `INSERT INTO messages (id, conversation_id, type, content, ingest_order, created_at)
       VALUES (?, ?, 'text', '{}', ?, 1)`
    );
    insert.run('one', 'conv-1', 0);
    expect(() => insert.run('duplicate', 'conv-1', 0)).toThrow();
    expect(() => insert.run('other', 'conv-2', 0)).not.toThrow();
  });

  it('is idempotent and retains assigned ordinals', () => {
    driver
      .prepare(
        `INSERT INTO messages (id, conversation_id, type, content, created_at)
         VALUES ('one', 'conv-1', 'text', '{}', 1)`
      )
      .run();
    migration!.up(driver);
    expect(() => migration!.up(driver)).not.toThrow();
    expect(columnNames(driver).has('segment_id')).toBe(true);
    expect(columnNames(driver).has('ingest_order')).toBe(true);
    expect(driver.prepare("SELECT ingest_order FROM messages WHERE id = 'one'").get()).toEqual({ ingest_order: 0 });
  });
});
