/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE REAL-DATABASE HALF OF THE CARD PERSISTENCE PROOF.
 *
 * Bun-native rather than Vitest because `better-sqlite3` in this tree is
 * compiled for Electron (NODE_MODULE_VERSION 145) and Vitest runs on plain Node
 * (127), so a `.test.ts` cannot open a database at all. Under Bun,
 * `createDriver` picks `BunSqliteDriver` and this is a real SQLite file with
 * the real schema and the real UNIQUE constraint.
 *
 * The failure being pinned is specifically that NOTHING THROWS: `insertMessage`
 * catches the UNIQUE violation and returns `{ success: false }`, and
 * `message.ts` discards that boolean. Asserting it from the source would prove
 * nothing, which is why this file exists.
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import type { TMessage } from '../../../src/common/chat/chatLib';
import type { ArtifactSummary } from '../../../src/common/types/artifacts';

// The database module reaches `electron` transitively (`@process/utils` ->
// `app`, `safeStorage`). Bun cannot load Electron's entry point, so the surface
// the import chain touches is stubbed BEFORE the modules under test are loaded.
// Nothing in this file exercises Electron; the subject is SQLite.
mock.module('electron', () => ({
  app: {
    getPath: () => os.tmpdir(),
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

const { WaylandUIDatabase } = await import('../../../src/process/services/database/index');
const { buildChatArtifactCardMessage, chatArtifactCardMsgId, persistChatArtifactCard } = await import(
  '../../../src/process/services/artifacts/chatArtifactCard'
);
type ChatArtifactCardPersistence =
  import('../../../src/process/services/artifacts/chatArtifactCard').ChatArtifactCardPersistence;
type WaylandUIDatabaseType = InstanceType<typeof WaylandUIDatabase>;

const CONVERSATION = 'c-restart';

let root = '';
let db: WaylandUIDatabaseType;

const summary = (fileName: string, sizeBytes: number): ArtifactSummary => ({
  artifactId: 'a'.repeat(32),
  taskId: `chat:${CONVERSATION}`,
  runId: CONVERSATION,
  fileName,
  canonicalPath: `/tmp/ws/artifacts/chat/${CONVERSATION}/${fileName}`,
  sizeBytes,
  runAt: '2026-08-22T09:00:00.000Z',
  declaredBy: 'chat',
});

const cardAt = (fileName: string, sizeBytes: number, now: number): TMessage =>
  buildChatArtifactCardMessage(CONVERSATION, { artifacts: [summary(fileName, sizeBytes)] }, now);

const cardRows = () =>
  db.getConversationMessages(CONVERSATION, 0, 100, 'ASC').data.filter((row) => row.type === 'artifact_card');

const fileNameOf = (row: TMessage): string => (row.content as { artifacts: ArtifactSummary[] }).artifacts[0].fileName;

beforeEach(async () => {
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-cardpersist-')));
  db = await WaylandUIDatabase.create(path.join(root, 'wayland.db'));
  db.createConversation({
    id: CONVERSATION,
    type: 'gemini',
    name: 'restart',
    createTime: Date.now(),
    modifyTime: Date.now(),
    extra: { workspace: '/tmp/ws' },
  } as never);
});

afterEach(async () => {
  db.close();
  await fs.rm(root, { recursive: true, force: true });
});

describe('the shipped defect, established against a real database', () => {
  it('SILENTLY keeps the old card when the same id is inserted twice', () => {
    expect(db.insertMessage(cardAt('v1.md', 100, 1000)).success).toBe(true);

    const second = db.insertMessage(cardAt('v2.md', 200, 2000));

    // No throw. A boolean nobody was reading. This is why nothing noticed.
    expect(second.success).toBe(false);
    expect(String(second.error)).toContain('UNIQUE');
    const rows = cardRows();
    expect(rows.length).toBe(1);
    expect(fileNameOf(rows[0])).toBe('v1.md');
  });

  it('replaces the row cleanly once the old one is deleted first', () => {
    db.insertMessage(cardAt('v1.md', 100, 1000));

    expect(db.deleteMessage(chatArtifactCardMsgId(CONVERSATION)).data).toBe(true);
    expect(db.insertMessage(cardAt('v2.md', 200, 2000)).success).toBe(true);

    const rows = cardRows();
    expect(rows.length).toBe(1);
    expect(fileNameOf(rows[0])).toBe('v2.md');
    expect(rows[0].createdAt).toBe(2000);
  });

  it('deleteMessage is a clean no-op on turn one, when there is nothing to replace', () => {
    // The delete runs on EVERY card, including the first. If it threw or
    // reported failure on a missing id, turn one would break.
    const result = db.deleteMessage(chatArtifactCardMsgId(CONVERSATION));
    expect(result.success).toBe(true);
    expect(result.data).toBe(false);
  });
});

/**
 * B5. THE CORRECTION HAS TO BE THERE TOMORROW.
 *
 * The whole reason the "this reply named a file that was never written" line
 * rides the PERSISTED card rather than a toast is that the failure it describes
 * is silent: the user finds out by going looking for their file, which may be
 * hours later and is certainly after a restart. A correction that only exists
 * in a live renderer would be gone by then.
 *
 * This is the same real SQLite file with the real schema as everything above,
 * so it is the round trip, not a claim about it.
 */
describe('a card that carries only a correction', () => {
  const b5Card = (fileName: string, now: number): TMessage =>
    buildChatArtifactCardMessage(CONVERSATION, { artifacts: [], unsupported: [{ fileName, verdict: 'absent' }] }, now);

  it('survives the round trip through the database with the correction intact', () => {
    expect(db.insertMessage(b5Card('chart-brief.md', 1000)).success).toBe(true);

    const rows = cardRows();
    expect(rows.length).toBe(1);
    const content = rows[0].content as { artifacts: unknown[]; unsupported?: { fileName: string; verdict: string }[] };
    // The one card shape that is written with nothing in the namespace at all.
    expect(content.artifacts).toEqual([]);
    expect(content.unsupported).toEqual([{ fileName: 'chart-brief.md', verdict: 'absent' }]);
  });

  it('is replaced in place by the next turn, exactly as a file card is', async () => {
    await persistChatArtifactCard(CONVERSATION, b5Card('chart-brief.md', 1000), {
      flush: async () => {},
      deleteMessage: (id) => {
        db.deleteMessage(id);
      },
      addMessage: (_conversationId, message) => {
        db.insertMessage(message);
      },
    });
    await persistChatArtifactCard(CONVERSATION, cardAt('v1.md', 100, 2000), {
      flush: async () => {},
      deleteMessage: (id) => {
        db.deleteMessage(id);
      },
      addMessage: (_conversationId, message) => {
        db.insertMessage(message);
      },
    });

    const rows = cardRows();
    expect(rows.length).toBe(1);
    // The turn that really produced a file clears the correction, because the
    // card is the CURRENT state of this conversation's deliverables.
    expect((rows[0].content as { unsupported?: unknown }).unsupported).toBeUndefined();
    expect(fileNameOf(rows[0])).toBe('v1.md');
  });
});

describe('the real helper against the real database', () => {
  const persistence = (): ChatArtifactCardPersistence => ({
    flush: async () => {},
    deleteMessage: (id) => {
      db.deleteMessage(id);
    },
    addMessage: (_conversationId, message) => {
      db.insertMessage(message);
    },
  });

  it('leaves exactly ONE card row, holding the newest turn, with a later created_at', async () => {
    await persistChatArtifactCard(CONVERSATION, cardAt('v1.md', 100, 1000), persistence());
    await persistChatArtifactCard(CONVERSATION, cardAt('v2.md', 200, 2000), persistence());
    await persistChatArtifactCard(CONVERSATION, cardAt('v3.md', 300, 3000), persistence());

    const rows = cardRows();
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(`artifact-card:${CONVERSATION}`);
    expect(fileNameOf(rows[0])).toBe('v3.md');
    expect((rows[0].content as { artifacts: ArtifactSummary[] }).artifacts[0].sizeBytes).toBe(300);
    expect(rows[0].createdAt).toBe(3000);
  });

  it('leaves the conversation other messages alone', () => {
    db.insertMessage({
      id: 'text-1',
      msg_id: 'text-1',
      type: 'text',
      position: 'left',
      conversation_id: CONVERSATION,
      content: { content: 'hello' },
      createdAt: 500,
    } as TMessage);

    return persistChatArtifactCard(CONVERSATION, cardAt('v1.md', 100, 1000), persistence()).then(() =>
      persistChatArtifactCard(CONVERSATION, cardAt('v2.md', 200, 2000), persistence()).then(() => {
        const all = db.getConversationMessages(CONVERSATION, 0, 100, 'ASC').data;
        expect(all.length).toBe(2);
        expect(all.filter((row) => row.type === 'text').length).toBe(1);
      })
    );
  });
});
