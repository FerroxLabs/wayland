/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type { IResponseMessage } from '../../src/common/adapter/ipcBridge';
import { foldConversationActivity } from '../../src/common/chat/activity/conversationActivity';

const toolGroupEvent = (): IResponseMessage => ({
  type: 'tool_group',
  msg_id: 'turn1',
  conversation_id: 'conv1',
  data: [
    {
      callId: 'c1',
      name: 'Read',
      description: '',
      renderOutputAsMarkdown: false,
      status: 'Success',
      resultDisplay: '/src/config.ts',
    },
    { callId: 'c2', name: 'Bash', description: '', renderOutputAsMarkdown: false, status: 'Executing' },
  ],
});

const thinkingEvent = (): IResponseMessage => ({
  type: 'thinking',
  msg_id: 'turn1',
  conversation_id: 'conv1',
  data: { content: 'weighing options', status: 'thinking' },
});

describe('foldConversationActivity - top-level tool activity', () => {
  it('projects the last running tool_group item into a humanized label + glyph', () => {
    const snap = foldConversationActivity(null, toolGroupEvent());
    expect(snap).not.toBeNull();
    expect(snap!.label).toBe('Running a command'); // Bash is the running item
    expect(snap!.glyph).toBe('command');
    expect(snap!.agents).toEqual([]);
  });

  it('projects a thinking event into the Reasoning label', () => {
    const snap = foldConversationActivity(null, thinkingEvent());
    expect(snap!.label).toBe('Reasoning');
    expect(snap!.glyph).toBe('reasoning');
  });
});

describe('foldConversationActivity - stability and pass-through', () => {
  it('returns the same reference when a repeated event yields no change (dedupe)', () => {
    const first = foldConversationActivity(null, thinkingEvent());
    const second = foldConversationActivity(first, thinkingEvent());
    expect(second).toBe(first);
  });

  it('leaves the prior snapshot untouched for non-activity events', () => {
    const prior = foldConversationActivity(null, toolGroupEvent());
    const after = foldConversationActivity(prior, {
      type: 'content',
      msg_id: 'turn1',
      conversation_id: 'conv1',
      data: 'streamed assistant text',
    });
    expect(after).toBe(prior);
  });

  it('returns null unchanged when there is nothing to project from null', () => {
    const snap = foldConversationActivity(null, {
      type: 'content',
      msg_id: 'turn1',
      conversation_id: 'conv1',
      data: 'hello',
    });
    expect(snap).toBeNull();
  });
});
