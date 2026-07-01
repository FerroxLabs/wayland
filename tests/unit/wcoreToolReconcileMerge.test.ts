/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #486: the finish-time reconcile in useWCoreMessage emits a STATUS-ONLY
 * tool_group update per dangling callId. This guards the two guarantees that
 * makes safe, at the composeMessage merge layer it relies on:
 *   1. flipping status preserves the card's name / resultDisplay / description,
 *   2. a real completion frame that arrives AFTER the synthetic finish update
 *      still wins (status + result get overwritten by the real frame).
 */

import { describe, expect, it } from 'vitest';
import { composeMessage, transformMessage } from '@/common/chat/chatLib';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';

const toolGroup = (data: unknown): IResponseMessage => ({
  type: 'tool_group',
  data,
  msg_id: 'm1',
  conversation_id: 'conv1',
});

const firstCard = (list: ReturnType<typeof composeMessage>) => {
  const msg = list.find((m) => m.type === 'tool_group') as { content: Array<Record<string, unknown>> } | undefined;
  return msg?.content[0];
};

describe('#486 finish-time tool reconcile — composeMessage merge guarantees', () => {
  it('a status-only update flips status but preserves name/result/description', () => {
    let list = composeMessage(
      transformMessage(
        toolGroup([
          {
            callId: 'c1',
            name: 'read_file',
            description: 'Reading handoff.md',
            status: 'Executing',
            resultDisplay: 'partial output',
          },
        ])
      ),
      []
    );

    // The finish reconcile emits status-only (what useWCoreMessage now sends).
    list = composeMessage(transformMessage(toolGroup([{ callId: 'c1', status: 'Success' }])), list);

    const card = firstCard(list)!;
    expect(card.status).toBe('Success');
    expect(card.name).toBe('read_file');
    expect(card.description).toBe('Reading handoff.md');
    expect(card.resultDisplay).toBe('partial output');
  });

  it('a real completion frame arriving after the synthetic update still wins', () => {
    let list = composeMessage(
      transformMessage(toolGroup([{ callId: 'c1', name: 'skill_view', status: 'Executing' }])),
      []
    );
    // synthetic finish reconcile
    list = composeMessage(transformMessage(toolGroup([{ callId: 'c1', status: 'Success' }])), list);
    // late REAL frame from the engine
    list = composeMessage(
      transformMessage(toolGroup([{ callId: 'c1', status: 'Error', resultDisplay: 'boom' }])),
      list
    );

    const card = firstCard(list)!;
    expect(card.status).toBe('Error');
    expect(card.resultDisplay).toBe('boom');
    expect(card.name).toBe('skill_view');
  });
});
