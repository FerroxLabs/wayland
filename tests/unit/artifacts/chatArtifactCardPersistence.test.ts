/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE CARD HAS NEVER SURVIVED A RESTART PAST TURN ONE, AND NOTHING SAID SO.
 *
 * `chatArtifactCardMsgId` is derived from the conversation id, so turn 5's card
 * carries the SAME `msg_id` - and the same primary key - as turn 3's. That is
 * the right decision: one report, one card. But `messages.id` is UNIQUE, and
 * `insertMessage` wraps its INSERT in a try/catch and returns
 * `{ success: false }`, which `message.ts` then DISCARDS. So every card after
 * the first failed to persist, in complete silence, and the conversation
 * reloaded showing turn 1's stale card forever.
 *
 * THE DATABASE HALF OF THIS PROOF IS NOT HERE, AND THAT IS NOT A GAP.
 * `better-sqlite3` in this tree is compiled for Electron
 * (NODE_MODULE_VERSION 145) and Vitest runs on plain Node (127), so a real
 * database cannot be opened from a `.test.ts` at all. The real-database proof -
 * the silent UNIQUE failure, the clean replace after a delete, and the delete
 * being a no-op on turn one - lives in the sibling
 * `chatArtifactCardPersistence.bun.test.ts`, which the repo's Bun-native runner
 * collects automatically and which opens a real database through `bun:sqlite`.
 *
 * What IS here is the ordering, which is the part that is easy to get wrong and
 * has nothing to do with SQLite.
 */

import { describe, expect, it, vi } from 'vitest';

import type { TMessage } from '@/common/chat/chatLib';
import {
  buildChatArtifactCardMessage,
  chatArtifactCardMsgId,
  persistChatArtifactCard,
  type ChatArtifactCardPersistence,
} from '@process/services/artifacts/chatArtifactCard';
import type { ArtifactSummary } from '@/common/types/artifacts';

const CONVERSATION = 'c-restart';

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

describe('persistChatArtifactCard drains, deletes, then inserts', () => {
  const recorder = () => {
    const calls: string[] = [];
    const persistence: ChatArtifactCardPersistence = {
      flush: vi.fn(async () => {
        calls.push('flush');
      }),
      deleteMessage: vi.fn((id: string) => {
        calls.push(`delete:${id}`);
      }),
      addMessage: vi.fn(() => {
        calls.push('add');
      }),
    };
    return { calls, persistence };
  };

  it('runs the three steps in the order that makes them safe', async () => {
    const { calls, persistence } = recorder();

    await persistChatArtifactCard(CONVERSATION, cardAt('v2.md', 200, 2000), persistence);

    // THE DRAIN IS FIRST AND IT IS NOT COSMETIC. addMessage is QUEUED behind a
    // debounce, so a delete racing a queued insert deletes the row the queue is
    // about to write and the card is lost. Draining first empties that queue.
    expect(calls).toEqual(['flush', `delete:${chatArtifactCardMsgId(CONVERSATION)}`, 'add']);
  });

  it('deletes the CARD id, never the whole conversation', async () => {
    const { persistence } = recorder();
    await persistChatArtifactCard(CONVERSATION, cardAt('v2.md', 200, 2000), persistence);
    expect(persistence.deleteMessage).toHaveBeenCalledTimes(1);
    expect(persistence.deleteMessage).toHaveBeenCalledWith(`artifact-card:${CONVERSATION}`);
  });
});


describe('the message it persists is the one the card renders', () => {
  it('carries the stable card id, the artifact_card type and the new content', async () => {
    let captured: TMessage | null = null;
    const persistence: ChatArtifactCardPersistence = {
      flush: async () => {},
      deleteMessage: () => {},
      addMessage: (_conversationId, message) => {
        captured = message;
      },
    };

    await persistChatArtifactCard(CONVERSATION, cardAt('v3.md', 300, 3000), persistence);

    expect(captured).not.toBeNull();
    const message = captured as unknown as TMessage;
    expect(message.id).toBe(`artifact-card:${CONVERSATION}`);
    expect(message.msg_id).toBe(chatArtifactCardMsgId(CONVERSATION));
    expect(message.type).toBe('artifact_card');
    expect(message.createdAt).toBe(3000);
    expect((message.content as { artifacts: ArtifactSummary[] }).artifacts[0].fileName).toBe('v3.md');
  });
});
