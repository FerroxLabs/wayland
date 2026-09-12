import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { composeMessage, type TMessage } from '../../../../../src/common/chat/chatLib';
import { BunSqliteDriver } from '../../../../../src/process/services/database/drivers/BunSqliteDriver';

const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-ingest-order-')));

mock.module('electron', () => ({
  app: {
    getPath: () => root,
    getName: () => 'wayland-test',
    isPackaged: false,
    getAppPath: () => process.cwd(),
    on: () => {},
  },
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: (value: string) => Buffer.from(value, 'utf8'),
    decryptString: (value: Buffer) => value.toString('utf8'),
  },
  ipcMain: { handle: () => {}, on: () => {} },
  shell: {},
  dialog: {},
}));

const { WaylandUIDatabase } = await import('../../../../../src/process/services/database/index');
type Database = InstanceType<typeof WaylandUIDatabase>;

const conversationId = 'transcript-order';
let db: Database;
let directory = '';
let databasePath = '';

const message = (id: string, type: 'text' | 'tool_group', ingestOrder: number): TMessage =>
  ({
    id,
    msg_id: 'turn-1',
    conversation_id: conversationId,
    type,
    position: 'left',
    content: type === 'text' ? { content: id } : [{ callId: id, name: 'Bash', description: id, status: 'Success' }],
    createdAt: 1000,
    segment_id: `segment:${id}`,
    ingest_order: ingestOrder,
  }) as TMessage;

beforeEach(async () => {
  directory = await fs.realpath(await fs.mkdtemp(path.join(root, 'run-')));
  databasePath = path.join(directory, 'wayland.db');
  db = await WaylandUIDatabase.create(databasePath);
  db.createConversation({
    id: conversationId,
    type: 'acp',
    name: 'ordered transcript',
    createTime: 1,
    modifyTime: 1,
    extra: { workspace: '/tmp/ws' },
  } as never);
});

afterEach(async () => {
  db.close();
  await fs.rm(directory, { recursive: true, force: true });
});

afterAll(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('durable transcript ingest ordering', () => {
  it('opens a version-57 database without indexing the column before migration', async () => {
    const legacyPath = path.join(directory, 'legacy.db');
    const legacy = new BunSqliteDriver(legacyPath);
    legacy.exec(`CREATE TABLE messages (
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
    legacy
      .prepare(
        `INSERT INTO messages (id, conversation_id, msg_id, type, content, position, created_at)
         VALUES ('legacy-message', 'legacy-conversation', 'legacy-turn', 'text', '{"content":"kept"}', 'left', 1)`
      )
      .run();
    legacy.pragma('user_version = 57');
    legacy.close();

    const upgraded = await WaylandUIDatabase.create(legacyPath);
    try {
      const rows = upgraded.getConversationMessages('legacy-conversation').data;
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe('legacy-message');
      expect(rows[0].segment_id).toBeNull();
      expect(rows[0].ingest_order).toBe(0);
    } finally {
      upgraded.close();
    }
  });

  it('preserves timestamp ties, updates, pagination, reopen, and a lower restart proposal', async () => {
    const ids = ['text-a', 'tool-1', 'text-b', 'tool-2', 'tool-3', 'tool-4', 'text-final'];
    ids.forEach((id, index) => {
      const type = id.startsWith('tool') ? 'tool_group' : 'text';
      expect(db.insertMessage(message(id, type, 100 + index)).success).toBe(true);
    });

    const middle = db.getConversationMessages(conversationId, 0, 20, 'ASC').data[2];
    expect(db.updateMessage(middle.id, { ...middle, ingest_order: 999, status: 'finish' }).success).toBe(true);
    expect(db.getConversationMessages(conversationId, 0, 20, 'ASC').data.map((entry) => entry.id)).toEqual(ids);

    const paged = [0, 1, 2].flatMap((page) =>
      db.getConversationMessages(conversationId, page, 3, 'ASC').data.map((entry) => entry.id)
    );
    expect(paged).toEqual(ids);

    db.close();
    db = await WaylandUIDatabase.create(databasePath);
    expect(db.getConversationMessages(conversationId, 0, 20, 'ASC').data.map((entry) => entry.id)).toEqual(ids);

    expect(db.insertMessage(message('after-reopen', 'text', 0)).success).toBe(true);
    const reopened = db.getConversationMessages(conversationId, 0, 20, 'ASC').data;
    expect(reopened.map((entry) => entry.id)).toEqual([...ids, 'after-reopen']);
    expect(reopened.map((entry) => entry.segment_id)).toEqual([...ids, 'after-reopen'].map((id) => `segment:${id}`));
    expect(reopened.at(-1)?.ingest_order).toBe(107);

    const persistedFirst = reopened.find((entry) => entry.id === 'text-a')!;
    const continued = composeMessage(
      {
        ...message('text-a-delta', 'text', 100),
        msg_id: persistedFirst.msg_id,
        segment_id: persistedFirst.segment_id,
        content: { content: '+tail' },
      } as TMessage,
      [persistedFirst]
    );
    expect(continued).toHaveLength(1);
    expect((continued[0].content as { content: string }).content).toBe('text-a+tail');
  });
});
