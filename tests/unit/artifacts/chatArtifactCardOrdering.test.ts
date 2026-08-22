/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE CARD FOLLOWS THE CONVERSATION.
 *
 * The reported symptom was "there is no card at the bottom". The cause is that
 * the card's `msg_id` is derived from the CONVERSATION rather than the turn -
 * deliberately, so a chat that revises one report ends up with one card - and
 * every merge path in the app treats a repeated msg_id as "rewrite it where it
 * is". So turn 5's card lands under turn 2, with the transcript grown past it.
 *
 * There are TWO merge paths and they behaved DIFFERENTLY, which is why one test
 * over one of them would have proved nothing:
 *
 *   composeMessageWithIndex  (renderer, indexed)  replaced IN PLACE
 *   composeMessage           (host, non-indexed)  APPENDED A DUPLICATE
 *
 * Both are driven here through their real implementations, with the real
 * message built by the real host builder from a real sweep - no hand-written
 * card fixture, because a fixture would prove the fixture.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { composeMessage, type TMessage } from '@/common/chat/chatLib';
import { resolveOutputDir } from '@process/agent/wcore/envBuilder';
import {
  buildChatArtifactCardContent,
  buildChatArtifactCardMessage,
  chatArtifactCardMsgId,
} from '@process/services/artifacts/chatArtifactCard';
import { clearChatSweepMemo, sweepChatRun } from '@process/services/artifacts/chatRun';
import { buildMessageIndex, composeMessageWithIndex } from '@renderer/pages/conversation/Messages/hooks';

const CONVERSATION = 'convorder0001';

let root = '';
let workspace = '';
let ledgerPath = '';

/** A real card for a real file the real sweep really registered. */
async function realCard(fileName: string, body: string): Promise<TMessage> {
  const outputDir = resolveOutputDir(workspace, undefined, CONVERSATION);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, fileName), body, 'utf8');
  clearChatSweepMemo();
  const result = await sweepChatRun({ conversationId: CONVERSATION, workspace, ledgerPath, declaredBy: 'Chat' });
  const content = buildChatArtifactCardContent(result);
  if (!content) throw new Error('the sweep produced no card');
  return buildChatArtifactCardMessage(CONVERSATION, content);
}

const text = (id: string): TMessage =>
  ({
    id,
    msg_id: id,
    type: 'text',
    position: 'left',
    conversation_id: CONVERSATION,
    content: { content: id },
  }) as unknown as TMessage;

beforeEach(async () => {
  clearChatSweepMemo();
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-card-order-')));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
});

afterEach(async () => {
  clearChatSweepMemo();
  await fs.rm(root, { recursive: true, force: true });
});

describe('the artifact card follows the conversation', () => {
  it('is built with a conversation-derived id, which is WHY the merge has to move it', async () => {
    const first = await realCard('brief.md', '# one\n');
    const second = await realCard('brief.md', '# one, revised\n');

    expect(first.msg_id).toBe(chatArtifactCardMsgId(CONVERSATION));
    expect(second.msg_id).toBe(first.msg_id);
  });

  it('ends up LAST on the indexed renderer path, not pinned where it first appeared', async () => {
    const first = await realCard('brief.md', '# one\n');
    const second = await realCard('brief.md', '# one, revised, and longer than before\n');

    let list: TMessage[] = [];
    let index = buildMessageIndex(list);
    list = composeMessageWithIndex(first, list, index);
    index = buildMessageIndex(list);
    list = composeMessageWithIndex(text('reply-1'), list, index);
    index = buildMessageIndex(list);
    list = composeMessageWithIndex(text('reply-2'), list, index);
    index = buildMessageIndex(list);
    list = composeMessageWithIndex(second, list, index);

    const cards = list.filter((message) => message.type === 'artifact_card');
    expect(cards.length).toBe(1);
    expect(list[list.length - 1].type).toBe('artifact_card');
    expect(list.length).toBe(3);
    // ...and it is the NEW content, not the old card relocated.
    expect(JSON.stringify(list[list.length - 1].content)).toBe(JSON.stringify(second.content));
  });

  it('ends up LAST on the non-indexed host path, which used to append a DUPLICATE', async () => {
    const first = await realCard('brief.md', '# one\n');
    const second = await realCard('brief.md', '# one, revised, and longer than before\n');

    const operations: Array<'insert' | 'update'> = [];
    const record = (type: 'insert' | 'update') => operations.push(type);

    let list: TMessage[] = [];
    list = composeMessage(first, list, record);
    list = composeMessage(text('reply-1'), list, record);
    list = composeMessage(text('reply-2'), list, record);
    list = composeMessage(second, list, record);

    const cards = list.filter((message) => message.type === 'artifact_card');
    expect(cards.length).toBe(1);
    expect(list[list.length - 1].type).toBe('artifact_card');
    expect(list.length).toBe(3);
    expect(JSON.stringify(list[list.length - 1].content)).toBe(JSON.stringify(second.content));
    // The move keeps the persisted row's identity, so the database sees an
    // UPDATE. Reporting a second insert here is what would put two rows under
    // one UNIQUE id and lose the card the way the host path already did.
    expect(operations).toEqual(['insert', 'insert', 'insert', 'update']);
    expect(list[list.length - 1].id).toBe(first.id);
  });

  it('keeps the FIRST card exactly where it is when nothing has moved yet', async () => {
    const first = await realCard('brief.md', '# one\n');

    let list: TMessage[] = [];
    let index = buildMessageIndex(list);
    list = composeMessageWithIndex(first, list, index);
    index = buildMessageIndex(list);
    list = composeMessageWithIndex(text('reply-1'), list, index);

    expect(list.length).toBe(2);
    expect(list[0].type).toBe('artifact_card');
  });

  it('does not move somebody else conversation card', async () => {
    const mine = await realCard('brief.md', '# one\n');
    const theirs = { ...mine, id: 'other', msg_id: chatArtifactCardMsgId('someoneelse') } as TMessage;

    let list: TMessage[] = [];
    let index = buildMessageIndex(list);
    list = composeMessageWithIndex(mine, list, index);
    index = buildMessageIndex(list);
    list = composeMessageWithIndex(text('reply-1'), list, index);
    index = buildMessageIndex(list);
    list = composeMessageWithIndex(theirs, list, index);

    // Two distinct cards, and the first one did NOT get rewritten by the second.
    expect(list.filter((message) => message.type === 'artifact_card').length).toBe(2);
    expect(list[0].msg_id).toBe(chatArtifactCardMsgId(CONVERSATION));
  });
});
