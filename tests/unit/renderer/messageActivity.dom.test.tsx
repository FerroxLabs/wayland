/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

import MessageActivity from '@/renderer/pages/conversation/Messages/components/MessageActivity';
import type { IMessageActivity } from '@/common/chat/chatLib';

const make = (content: Partial<IMessageActivity['content']>): IMessageActivity => ({
  id: 'm1',
  msg_id: 'turn-1',
  conversation_id: 'c1',
  type: 'activity',
  position: 'left',
  content: {
    turnId: 'turn-1',
    nodes: [],
    status: 'running',
    ...content,
  },
});

describe('MessageActivity', () => {
  it('renders nothing when there are no nodes and no cost', () => {
    const { container } = render(<MessageActivity message={make({ nodes: [] })} />);
    expect(container.querySelector('[data-testid="activity-card"]')).toBeNull();
  });

  it('renders a node row and auto-expands while running', () => {
    render(
      <MessageActivity
        message={make({
          status: 'running',
          nodes: [{ id: 'c1', kind: 'tool', callId: 'c1', name: 'ReadFile', status: 'running', startTime: 1 }],
        })}
      />
    );
    const card = screen.getByTestId('activity-card');
    expect(card.getAttribute('data-activity-status')).toBe('running');
    expect(screen.getByText('ReadFile')).toBeTruthy();
  });

  it('drills into a node detail on click (streamed tool stdout)', () => {
    render(
      <MessageActivity
        message={make({
          status: 'running',
          nodes: [
            {
              id: 'c1',
              kind: 'tool',
              callId: 'c1',
              name: 'Bash',
              status: 'running',
              startTime: 1,
              detail: 'hello stdout',
            },
          ],
        })}
      />
    );
    // Detail hidden until the node row is clicked.
    expect(screen.queryByText('hello stdout')).toBeNull();
    fireEvent.click(screen.getByText('Bash'));
    expect(screen.getByText('hello stdout')).toBeTruthy();
  });

  it('shows a duration badge for a completed node', () => {
    render(
      <MessageActivity
        message={make({
          status: 'running',
          nodes: [
            { id: 'c1', kind: 'tool', callId: 'c1', name: 'Bash', status: 'done', startTime: 1000, endTime: 2500 },
          ],
        })}
      />
    );
    expect(screen.getByText('1.5s')).toBeTruthy();
  });

  it('renders per-turn cost rows when expanded and showCost is on', () => {
    render(
      <MessageActivity
        showCost
        message={make({
          status: 'running',
          nodes: [{ id: 'c1', kind: 'tool', callId: 'c1', name: 'Bash', status: 'running', startTime: 1 }],
          perTurnCost: [{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.0123 }],
        })}
      />
    );
    // Card auto-expands while running, so cost rows are visible.
    expect(screen.getByText('gpt-x')).toBeTruthy();
    expect(screen.getByText('openai')).toBeTruthy();
  });

  // #252 reframe: cost is opt-in (off by default). With showCost omitted, the
  // cost chip must NOT render even on a turn that carries perTurnCost.
  it('hides per-turn cost by default (showCost off)', () => {
    render(
      <MessageActivity
        message={make({
          status: 'running',
          nodes: [{ id: 'c1', kind: 'tool', callId: 'c1', name: 'Bash', status: 'running', startTime: 1 }],
          perTurnCost: [{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.0123 }],
        })}
      />
    );
    // The node still renders, but no cost rows.
    expect(screen.getByText('Bash')).toBeTruthy();
    expect(screen.queryByText('gpt-x')).toBeNull();
    expect(screen.queryByText('openai')).toBeNull();
  });

  // A cost-only turn (no nodes) renders nothing when showCost is off...
  it('renders nothing for a cost-only turn when showCost is off', () => {
    const { container } = render(
      <MessageActivity
        message={make({
          status: 'done',
          nodes: [],
          perTurnCost: [{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.0123 }],
        })}
      />
    );
    expect(container.querySelector('[data-testid="activity-card"]')).toBeNull();
  });

  // ...but shows the cost card when showCost is on (running keeps it expanded).
  it('renders a cost-only turn when showCost is on', () => {
    render(
      <MessageActivity
        showCost
        message={make({
          status: 'running',
          nodes: [],
          perTurnCost: [{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.0123 }],
        })}
      />
    );
    expect(screen.getByTestId('activity-card')).toBeTruthy();
    expect(screen.getByText('gpt-x')).toBeTruthy();
  });

  // #252 cross-audit fix: a completed turn auto-collapses, but with Show cost on
  // the final spend must stay visible in the collapsed summary (mock attaches
  // cost to the completed answer, not gated behind re-expanding).
  it('keeps per-turn cost visible after a turn auto-collapses (showCost on)', () => {
    const { rerender } = render(
      <MessageActivity
        showCost
        message={make({
          status: 'running',
          nodes: [{ id: 'c1', kind: 'tool', callId: 'c1', name: 'Bash', status: 'running', startTime: 1000 }],
          perTurnCost: [{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.0123 }],
        })}
      />
    );
    // While running: expanded, cost visible.
    expect(screen.getByText('gpt-x')).toBeTruthy();

    // Turn finishes on the same instance -> auto-collapses.
    rerender(
      <MessageActivity
        showCost
        message={make({
          status: 'done',
          nodes: [{ id: 'c1', kind: 'tool', callId: 'c1', name: 'Bash', status: 'done', startTime: 1000, endTime: 2000 }],
          perTurnCost: [{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.0123 }],
        })}
      />
    );

    // Collapsed (node body hidden) but cost still shown alongside the summary.
    expect(screen.queryByText('Bash')).toBeNull();
    expect(screen.getByText(/Completed .* steps/)).toBeTruthy();
    expect(screen.getByText('gpt-x')).toBeTruthy();
    expect(screen.getByText('openai')).toBeTruthy();
  });

  it('reflects failed status on the card', () => {
    render(
      <MessageActivity
        message={make({
          status: 'failed',
          nodes: [{ id: 'c1', kind: 'tool', callId: 'c1', name: 'Bash', status: 'failed', startTime: 1, endTime: 2 }],
        })}
      />
    );
    expect(screen.getByTestId('activity-card').getAttribute('data-activity-status')).toBe('failed');
  });

  // #252 cross-audit: the auto-collapse state machine (prevHadRunning ref) is
  // the trickiest logic in the card. Verify the running -> done transition on
  // the SAME instance auto-collapses (not just static single-state snapshots).
  it('auto-collapses when the turn transitions from running to done', () => {
    const { rerender } = render(
      <MessageActivity
        message={make({
          status: 'running',
          nodes: [{ id: 'c1', kind: 'tool', callId: 'c1', name: 'Bash', status: 'running', startTime: 1000 }],
        })}
      />
    );
    // While running: expanded (node body visible, no completed-summary).
    expect(screen.getByTestId('activity-card').getAttribute('data-activity-status')).toBe('running');
    expect(screen.getByText('Bash')).toBeTruthy();
    expect(screen.queryByText(/Completed .* steps/)).toBeNull();

    // Same instance, turn finishes: status done + node flips terminal.
    rerender(
      <MessageActivity
        message={make({
          status: 'done',
          nodes: [
            { id: 'c1', kind: 'tool', callId: 'c1', name: 'Bash', status: 'done', startTime: 1000, endTime: 2000 },
          ],
        })}
      />
    );

    // Auto-collapsed: the node body is hidden and the completed-summary shows.
    expect(screen.getByTestId('activity-card').getAttribute('data-activity-status')).toBe('done');
    expect(screen.queryByText('Bash')).toBeNull();
    expect(screen.getByText(/Completed .* steps/)).toBeTruthy();
  });

  // #252 cross-audit: the depth-N drill-down TREE is the Phase-2 headline, but
  // no DOM test renders a node WITH children. Render a sub_agent node whose
  // child holds a nested tool, expand it, assert the nested name surfaces in an
  // indented subtree.
  it('renders a sub-agent node child subtree on expand (recursive tree)', () => {
    render(
      <MessageActivity
        message={make({
          status: 'running',
          nodes: [
            {
              id: 'sub:spawn:1',
              kind: 'sub_agent',
              callId: 'spawn:1',
              name: 'worker',
              status: 'running',
              startTime: 1,
              children: [
                { id: 'child-1', kind: 'tool', callId: 'child-1', name: 'NestedRead', status: 'running', startTime: 2 },
              ],
            },
          ],
        })}
      />
    );
    // Parent sub-agent node visible (card auto-expanded while running).
    const parent = screen.getByText('worker');
    expect(parent).toBeTruthy();
    // Expand the sub-agent node to reveal its child subtree.
    fireEvent.click(parent);
    expect(screen.getByText('NestedRead')).toBeTruthy();
  });
});
