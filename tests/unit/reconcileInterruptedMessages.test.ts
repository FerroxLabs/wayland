/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #665 — on startup, a chat message left in a non-terminal state ('work' /
 * 'pending') by a crash / kill / power loss is a lie (nothing is running), so
 * reconcileInterruptedMessages() flips those to 'error' and leaves already
 * terminal messages ('finish' / 'error') untouched.
 */

import { afterEach, beforeEach, expect, it } from 'vitest';
import { describeNativeSqlite } from './helpers/nativeSqlite';
import { WaylandUIDatabase } from '@process/services/database/index';
import type { TChatConversation } from '@/common/config/storage';
import type { TMessage } from '@/common/chat/chatLib';

const CONV_ID = 'conv-665';

function conversation(): TChatConversation {
  return {
    id: CONV_ID,
    name: 'Test',
    type: 'chat',
    extra: {},
    status: 'finished',
    createTime: 1000,
    modifyTime: 1000,
  } as unknown as TChatConversation;
}

function message(id: string, status: 'work' | 'pending' | 'finish' | 'error'): TMessage {
  return {
    id,
    conversation_id: CONV_ID,
    msg_id: id,
    type: 'text',
    content: { type: 'text', content: '' },
    position: 'left',
    status,
    createdAt: 1000,
  } as unknown as TMessage;
}

describeNativeSqlite('reconcileInterruptedMessages (#665)', () => {
  let db: WaylandUIDatabase;

  beforeEach(async () => {
    db = await WaylandUIDatabase.create(':memory:');
    db.createConversation(conversation());
  });

  afterEach(() => {
    db.close();
  });

  it('flips work/pending to error and leaves terminal messages untouched', () => {
    db.insertMessage(message('m-work', 'work'));
    db.insertMessage(message('m-pending', 'pending'));
    db.insertMessage(message('m-finish', 'finish'));
    db.insertMessage(message('m-error', 'error'));

    const result = db.reconcileInterruptedMessages();
    expect(result.success).toBe(true);
    expect(result.data).toBe(2);

    const byId = new Map(db.getConversationMessages(CONV_ID).data.map((m) => [m.id, m.status]));
    expect(byId.get('m-work')).toBe('error');
    expect(byId.get('m-pending')).toBe('error');
    expect(byId.get('m-finish')).toBe('finish');
    expect(byId.get('m-error')).toBe('error');
  });

  it('reconciles nothing (count 0) when all messages are terminal', () => {
    db.insertMessage(message('m-finish', 'finish'));
    db.insertMessage(message('m-error', 'error'));

    const result = db.reconcileInterruptedMessages();
    expect(result.success).toBe(true);
    expect(result.data).toBe(0);
    expect(db.getConversationMessages(CONV_ID).data.find((m) => m.id === 'm-finish')?.status).toBe('finish');
  });
});
