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

// useMessageList is the only data dependency: the panel filters the live message
// stream for `activity` turns. Mock it so each test controls the list directly.
let messageList: TMessage[] = [];
vi.mock('@/renderer/pages/conversation/Messages/hooks', () => ({
  useMessageList: () => messageList,
}));

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

describe('ObservabilityPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    messageList = [];
  });

  it('renders the empty hint when there are no activity turns', () => {
    messageList = [text('t1')];
    render(<ObservabilityPanel onClose={() => {}} />);
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
    render(<ObservabilityPanel onClose={() => {}} />);
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
    render(<ObservabilityPanel onClose={() => {}} />);
    // The activity card still renders.
    expect(screen.getByText('ReadFile')).toBeTruthy();
    // The sub-agent card is now surfaced in the panel (was previously inline-only).
    expect(screen.getByText(/compute-2plus2/)).toBeTruthy();
  });

  it('fires onClose when the close control is clicked', () => {
    const onClose = vi.fn();
    render(<ObservabilityPanel onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close panel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides per-turn cost by default and shows it after toggling Show cost on', () => {
    messageList = [
      activity('a1', {
        nodes: [{ id: 'n1', kind: 'tool', callId: 'n1', name: 'Bash', status: 'running', startTime: 1 }],
        perTurnCost: [{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.0123 }],
      }),
    ];
    render(<ObservabilityPanel onClose={() => {}} />);
    // Off by default: cost rows hidden.
    expect(screen.queryByText('gpt-x')).toBeNull();

    // Flip the Show cost switch; the persisted setting drives MessageActivity's gate.
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByText('gpt-x')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ showCost: true });
  });
});
