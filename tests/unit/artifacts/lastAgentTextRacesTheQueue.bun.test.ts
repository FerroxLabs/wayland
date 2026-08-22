/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE CLAIM CHECK READS THE TURN'S TEXT OUT OF THE DATABASE. THE TEXT MAY NOT
 * BE THERE YET.
 *
 * `onChatTurnCompleted` compares what the assistant said against what is on
 * disk, and it gets "what the assistant said" from `getLastAgentText`, which
 * queries `messages` DIRECTLY. Streamed assistant text does not go into that
 * table directly: it goes through `addOrUpdateMessage`, which queues an
 * `accumulate` behind a **2000 ms debounce** in `message.ts`. That file's own
 * header says it out loud - "anything that reads the row DIRECTLY from the
 * database is racing them".
 *
 * So a turn that ends inside the debounce window hands the claim check the
 * PREVIOUS turn's reply. For B5 that is not a cosmetic ordering problem: the
 * host would compare turn N's files against turn N-1's words, which can both
 * miss a real fabrication and - far worse - contradict a model that told the
 * truth this turn because the last turn's sentence no longer holds.
 *
 * BUN-NATIVE because this needs the real queue against a real SQLite file:
 * `better-sqlite3` here is compiled for Electron and a vitest `.test.ts` cannot
 * open a database at all. The race is DEMONSTRATED, not described - the first
 * assertion is the defect and it fails if the debounce ever goes away, which is
 * the honest way to pin a fix to a mechanism.
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import type { TMessage } from '../../../src/common/chat/chatLib';

const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-lastagent-')));

// `message.ts` reaches Electron transitively through the database module. The
// surface the import chain touches is stubbed BEFORE anything under test loads;
// the subject here is the write queue, not Electron.
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

const { WaylandUIDatabase } = await import('../../../src/process/services/database/index');

type WaylandUIDatabaseType = InstanceType<typeof WaylandUIDatabase>;

/** Set in `beforeEach`; the queue and the reader must share one file. */
const current: { db: WaylandUIDatabaseType | null } = { db: null };

// The queue resolves its handle through the database module singleton, and
// `initStorage` reaches the platform service registry the moment it is
// imported. Both are stubbed so the subject is the write queue and nothing else.
mock.module('../../../src/process/services/database/export', () => ({
  getDatabase: async () => current.db,
}));
mock.module('../../../src/process/utils/initStorage', () => ({
  ProcessChat: { get: async () => [] },
}));

const { addOrUpdateMessage, flushConversationMessages, removeFromMessageCache } = await import(
  '../../../src/process/utils/message'
);

const CONVERSATION = 'c-lastagent';

let db: WaylandUIDatabaseType;
let dir = '';

/**
 * What `getLastAgentText` does, transcribed exactly: five rows newest-first,
 * first `text` row that is not the user's own.
 */
function lastAgentText(): string | null {
  const result = db.getConversationMessages(CONVERSATION, 0, 5, 'DESC');
  for (const message of result.data ?? []) {
    if (message.type === 'text' && message.position !== 'right') {
      const content = (message.content as { content?: unknown }).content;
      return typeof content === 'string' ? content : null;
    }
  }
  return null;
}

/** The streaming path: what the engine's text deltas actually call. */
function assistantSays(msgId: string, text: string, createdAt: number): void {
  addOrUpdateMessage(CONVERSATION, {
    id: msgId,
    msg_id: msgId,
    type: 'text',
    position: 'left',
    conversation_id: CONVERSATION,
    content: { content: text },
    createdAt,
    status: 'finish',
  } as TMessage);
}

/**
 * Wait for the queue to finish its own asynchronous start-up.
 *
 * A SECOND REAL CAVEAT, WORTH KNOWING RATHER THAN HIDING: `drain()` bails while
 * the queue is `!initialized`, so on a conversation whose queue has only just
 * been constructed a drain writes nothing at all. In the product that window is
 * a brand-new conversation before its first flush, and a conversation whose
 * agent has just streamed a whole reply is long past it - but it does mean the
 * drain is not a guarantee, only a very large improvement. Getting nothing back
 * is the safe direction: no text means no claim and therefore no correction.
 */
async function queueIsReady(): Promise<void> {
  assistantSays('warm-up', 'warming the queue', 1);
  for (let attempt = 0; attempt < 200; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop -- bounded start-up poll
    await flushConversationMessages(CONVERSATION);
    if (lastAgentText() === 'warming the queue') return;
    // eslint-disable-next-line no-await-in-loop -- see above
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('the message queue never initialised');
}

beforeEach(async () => {
  dir = await fs.realpath(await fs.mkdtemp(path.join(root, 'run-')));
  db = await WaylandUIDatabase.create(path.join(dir, 'wayland.db'));
  current.db = db;
  db.createConversation({
    id: CONVERSATION,
    type: 'gemini',
    name: 'claims',
    createTime: Date.now(),
    modifyTime: Date.now(),
    extra: { workspace: '/tmp/ws' },
  } as never);
  await queueIsReady();
});

afterEach(async () => {
  removeFromMessageCache(CONVERSATION);
  db.close();
  await fs.rm(dir, { recursive: true, force: true });
});

describe('reading the turn text at turn end races the message write queue', () => {
  it('THE DEFECT: a direct read right after the reply sees the PREVIOUS turn', async () => {
    assistantSays('turn-1', 'Nothing saved. Here is what your chart shows.', 1000);
    await flushConversationMessages(CONVERSATION);
    expect(lastAgentText()).toBe('Nothing saved. Here is what your chart shows.');

    // Turn 2 - the B5 turn - streams its reply and ends immediately.
    assistantSays('turn-2', 'File saved to artifacts/chat/42d0fd61/chart-brief.md.', 2000);

    // No drain. This is what `getLastAgentText` did at `turnCompleted`, and the
    // answer is turn ONE's sentence: 2000 ms of debounce still to run.
    expect(lastAgentText()).toBe('Nothing saved. Here is what your chart shows.');
  });

  it('THE FIX: draining the conversation first returns THIS turn', async () => {
    assistantSays('turn-1', 'Nothing saved. Here is what your chart shows.', 1000);
    await flushConversationMessages(CONVERSATION);
    assistantSays('turn-2', 'File saved to artifacts/chat/42d0fd61/chart-brief.md.', 2000);

    await flushConversationMessages(CONVERSATION);

    expect(lastAgentText()).toBe('File saved to artifacts/chat/42d0fd61/chart-brief.md.');
  });

  it('draining a conversation with nothing queued is cheap, not a stall', async () => {
    // It runs on every terminal turn, including the many that queue nothing.
    const started = Date.now();
    await flushConversationMessages(CONVERSATION);
    expect(Date.now() - started).toBeLessThan(500);
  });
});
