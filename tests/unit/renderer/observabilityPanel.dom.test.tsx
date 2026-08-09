/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

import type { IMessageActivity, IMessageSubAgent, TMessage } from '@/common/chat/chatLib';

let messageList: TMessage[] = [];

import ObservabilityPanel from '@/renderer/pages/conversation/Messages/components/ObservabilityPanel';

const STORAGE_KEY = 'wayland.observability.settings';

const activity = (id: string, content: Partial<IMessageActivity['content']>): IMessageActivity => ({
  id,
  msg_id: `turn-${id}`,
  conversation_id: 'c1',
  type: 'activity',
  position: 'left',
  content: {
    turnId: `turn-${id}`,
    nodes: [],
    status: 'running',
    ...content,
  },
});

const text = (id: string): TMessage =>
  ({
    id,
    msg_id: `text-${id}`,
    conversation_id: 'c1',
    type: 'text',
    position: 'left',
    content: { content: 'hi' },
  }) as unknown as TMessage;

const subAgent = (id: string, agentName: string): IMessageSubAgent => ({
  id,
  msg_id: `sub-${id}`,
  conversation_id: 'c1',
  type: 'sub_agent',
  position: 'left',
  content: {
    parentCallId: `call-${id}`,
    agentName,
    status: 'running',
    body: '',
    nodes: [{ id: `n-${id}`, kind: 'tool', callId: `n-${id}`, name: 'Bash', status: 'running', startTime: 1 }],
  },
});

/** An ACP session update as it reaches the renderer (fields nest under `.update`). */
const acpToolCall = (id: string, title: string, kind: string, status: string): TMessage =>
  ({
    id,
    msg_id: `m-${id}`,
    conversation_id: 'c1',
    type: 'acp_tool_call',
    position: 'left',
    content: {
      sessionId: 's1',
      update: { sessionUpdate: 'tool_call', toolCallId: id, title, kind, status },
    },
  }) as unknown as TMessage;

const toolGroupMsg = (id: string, content: unknown[]): TMessage =>
  ({
    id,
    msg_id: `turn-${id}`,
    conversation_id: 'c1',
    type: 'tool_group',
    position: 'left',
    content,
  }) as unknown as TMessage;

describe('ObservabilityPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    messageList = [];
  });

  it('renders the empty hint when there are no activity turns', () => {
    messageList = [text('t1')];
    render(<ObservabilityPanel messages={messageList} />);
    expect(screen.getByText('Activity from this conversation will appear here.')).toBeTruthy();
    expect(screen.queryByTestId('activity-card')).toBeNull();
  });

  it('renders one activity card per activity turn (ignores plain text/user messages)', () => {
    messageList = [
      text('t1'),
      activity('a1', {
        nodes: [{ id: 'n1', kind: 'tool', callId: 'n1', name: 'ReadFile', status: 'running', startTime: 1 }],
      }),
      text('t2'),
      activity('a2', {
        nodes: [{ id: 'n2', kind: 'tool', callId: 'n2', name: 'Bash', status: 'running', startTime: 1 }],
      }),
    ];
    render(<ObservabilityPanel messages={messageList} />);
    expect(screen.getAllByTestId('activity-card')).toHaveLength(2);
    expect(screen.getByText('ReadFile')).toBeTruthy();
    expect(screen.getByText('Bash')).toBeTruthy();
  });

  it('also renders the sub-agent tree (swarm/delegation turns) in the panel', () => {
    messageList = [
      text('t1'),
      activity('a1', {
        nodes: [{ id: 'n1', kind: 'tool', callId: 'n1', name: 'ReadFile', status: 'running', startTime: 1 }],
      }),
      subAgent('s1', 'compute-2plus2'),
    ];
    render(<ObservabilityPanel messages={messageList} />);
    // The activity card still renders.
    expect(screen.getByText('ReadFile')).toBeTruthy();
    // The sub-agent card is now surfaced in the panel (was previously inline-only).
    expect(screen.getByText(/compute-2plus2/)).toBeTruthy();
  });

  // The close control moved to the workbench card, which now owns the only
  // title and the only close in the panel. That behaviour - closing clears
  // panelOpen and unmounts the panel - is covered end to end by
  // wcoreChatObservability.dom.test.tsx, "closing the panel from the card".

  // WCore (and Gemini) report tool work as `tool_group`, never as `activity`.
  // The panel filtered for `activity` + `sub_agent` only, so a real WCore turn
  // showed "Activity from this conversation will appear here." while the chat
  // next to it listed the tools - measured live against the engine. The chat
  // renders those same messages through toolSummaryToSteps; the panel must too.
  //
  // RETARGETED (DEFECT B): the old title claimed tool_group was "the only
  // activity WCore reports". That was wrong on both halves - `activity` and
  // `sub_agent` are WCore-EXCLUSIVE shapes (executed proof: the ACP
  // MessageTranslator emits neither), and Gemini emits `tool_group` too. The
  // assertions were and remain correct; only the claim in the title was false.
  it('renders tool_group turns (WCore and Gemini) through the shared timeline', () => {
    messageList = [
      text('t1'),
      {
        id: 'tg1',
        msg_id: 'turn-1',
        conversation_id: 'c1',
        type: 'tool_group',
        content: [
          { callId: 'a', name: 'Bash', description: "Execute: printf 'ok'", status: 'Success' },
          { callId: 'b', name: 'ReadFile', description: 'Read config.ts', status: 'Executing' },
        ],
      } as unknown as TMessage,
    ];
    render(<ObservabilityPanel messages={messageList} />);
    expect(screen.queryByText('Activity from this conversation will appear here.')).toBeNull();
    const panel = screen.getByTestId('observability-panel');
    expect(panel.textContent).toContain("Running printf 'ok'");
    // The same label the Progress rail shows for the same tool - the humanizer
    // builds from the invocation, not from the tool's output.
    expect(panel.textContent).toContain('Reading config.ts');
  });

  // DEFECT B: ACP (Claude Code, Codex) reports tool work as `acp_tool_call` and
  // emits neither `activity` nor `tool_group`, so `isObservable` dropped every
  // ACP turn on the floor and the panel would have been permanently empty on
  // those backends. `toolSummaryToSteps` already accepts a mixed
  // tool_group/acp_tool_call list - the filter was the only thing excluding it.
  it('renders ACP acp_tool_call turns (Claude Code / Codex) through the same timeline', () => {
    messageList = [
      text('t1'),
      acpToolCall('tc1', 'Read config.ts', 'read', 'completed'),
      acpToolCall('tc2', 'Search the web for kittens', 'execute', 'completed'),
    ];
    render(<ObservabilityPanel messages={messageList} />);
    expect(screen.queryByText('Activity from this conversation will appear here.')).toBeNull();
    const panel = screen.getByTestId('observability-panel');
    // Identical humanization to the wcore tool_group case above, from the same
    // projection - "Read config.ts" reads "Reading config.ts" on both backends.
    expect(panel.textContent).toContain('Reading config.ts');
    expect(panel.textContent).toContain('Search the web for kittens');
  });

  // Consecutive tool turns collapse into ONE timeline, exactly as the chat
  // transcript groups them (MessageList's pushToolList). ACP emits one message
  // per tool call, so without grouping an ACP turn rendered as N separate
  // one-step cards where wcore rendered a single "Did N things" timeline.
  it('groups consecutive tool turns into one timeline, mixing wcore and ACP', () => {
    messageList = [
      toolGroupMsg('tg1', [{ callId: 'a', name: 'ReadFile', description: 'Read config.ts', status: 'Success' }]),
      acpToolCall('tc1', 'Search the web for kittens', 'execute', 'completed'),
    ];
    render(<ObservabilityPanel messages={messageList} />);
    expect(screen.getAllByTestId('activity-timeline')).toHaveLength(1);
    const panel = screen.getByTestId('observability-panel');
    expect(panel.textContent).toContain('Reading config.ts');
    expect(panel.textContent).toContain('Search the web for kittens');
  });

  it('hides per-turn cost by default and shows it after toggling Show cost on', () => {
    messageList = [
      activity('a1', {
        nodes: [{ id: 'n1', kind: 'tool', callId: 'n1', name: 'Bash', status: 'running', startTime: 1 }],
        perTurnCost: [{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.0123 }],
      }),
    ];
    render(<ObservabilityPanel messages={messageList} />);
    // Off by default: cost rows hidden.
    expect(screen.queryByText('gpt-x')).toBeNull();

    // Flip the Show cost switch; the persisted setting drives MessageActivity's gate.
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByText('gpt-x')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ showCost: true });
  });
});
