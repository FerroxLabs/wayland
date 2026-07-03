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

const subAgentEvent = (agentName: string, toolName: string): IResponseMessage => ({
  type: 'sub_agent_event',
  msg_id: 'turn1',
  conversation_id: 'conv1',
  data: {
    parentCallId: `p:${agentName}`,
    agentName,
    inner: { type: 'tool_running', call_id: `x:${toolName}`, tool_name: toolName },
  },
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

describe('foldConversationActivity - sub-agent tree', () => {
  it('surfaces a spawned sub-agent with its current inner action', () => {
    const snap = foldConversationActivity(null, subAgentEvent('researcher', 'web_search'));
    expect(snap!.agents).toHaveLength(1);
    expect(snap!.agents[0]).toMatchObject({
      name: 'researcher',
      label: 'Searching the web',
      glyph: 'web',
      status: 'running',
    });
    // Top-level label reflects the active sub-agent's real action.
    expect(snap!.label).toBe('Searching the web');
  });

  it('tracks multiple concurrent sub-agents as distinct tree entries', () => {
    let snap = foldConversationActivity(null, subAgentEvent('researcher', 'web_search'));
    snap = foldConversationActivity(snap, subAgentEvent('coder', 'Read'));
    expect(snap!.agents).toHaveLength(2);
    expect(snap!.agents.map((a) => a.name).toSorted()).toEqual(['coder', 'researcher']);
  });

  it('updates an existing sub-agent in place when its action changes (no duplicate)', () => {
    let snap = foldConversationActivity(null, subAgentEvent('researcher', 'web_search'));
    snap = foldConversationActivity(snap, subAgentEvent('researcher', 'Read'));
    expect(snap!.agents).toHaveLength(1);
    expect(snap!.agents[0].label).toBe('Reading a file');
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
