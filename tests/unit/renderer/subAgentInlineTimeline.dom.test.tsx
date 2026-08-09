/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * RETARGETED from subAgentActivityCard.dom.test.tsx.
 *
 * SubAgentActivityCard was rendered by exactly one thing - the Observability
 * panel - and both are now deleted. The BEHAVIOUR those cases pinned is not:
 * a spawned sub-agent still renders in the transcript, through
 * `subAgentToStep` into ActivityTimeline (MessageList.tsx:178). So the two
 * guarantees are re-pointed at that surviving surface rather than dropped:
 *
 *   1. depth-N tree  - `content.nodes` becomes step children, and drilling in
 *                      reaches a nested sub-agent's own grandchild tool.
 *   2. flat fallback - a sub-agent whose inner stream never parsed into nodes
 *                      still surfaces its accumulated `body` text.
 *
 * The render below is exactly MessageList's `sub_agent` case, so this measures
 * the real inline path, not a re-mock of it.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

import { subAgentToStep } from '@/common/chat/activity/projectMessages';
import ActivityTimeline from '@/renderer/components/chat/observability/ActivityTimeline';
import type { IMessageSubAgent } from '@/common/chat/chatLib';

const make = (content: Partial<IMessageSubAgent['content']>): IMessageSubAgent => ({
  id: 'm1',
  msg_id: 'spawn:1:worker',
  conversation_id: 'c1',
  type: 'sub_agent',
  position: 'left',
  content: {
    parentCallId: 'spawn:1:worker',
    agentName: 'worker',
    status: 'running',
    body: '',
    ...content,
  },
});

/** Exactly what MessageList renders for a `sub_agent` message. */
const renderInline = (message: IMessageSubAgent) => render(<ActivityTimeline steps={[subAgentToStep(message.content)]} />);

describe('sub-agent turns render inline through ActivityTimeline', () => {
  it('renders the activity tree (with nested child) when content.nodes is present', () => {
    const { container } = renderInline(
      make({
        status: 'running',
        nodes: [
          {
            id: 'sub:spawn:2',
            kind: 'sub_agent',
            callId: 'spawn:2',
            name: 'nested-worker',
            status: 'running',
            startTime: 1,
            children: [
              { id: 'g1', kind: 'tool', callId: 'g1', name: 'GrandchildTool', status: 'running', startTime: 2 },
            ],
          },
        ],
      })
    );

    // The spawned agent is the step, and it is identified as one.
    const step = container.querySelector('[data-step-kind="sub_agent"]');
    expect(step).toBeTruthy();

    // Its subtree is behind the expander, not on screen by default.
    expect(screen.queryByText('nested-worker')).toBeNull();

    // Drill into the sub-agent to reveal its own nested sub-agent...
    fireEvent.click(screen.getAllByText('worker')[0]);
    expect(screen.getAllByText('nested-worker').length).toBeGreaterThan(0);

    // ...and again to reveal that one's grandchild tool.
    expect(container.textContent).not.toContain('GrandchildTool');
    fireEvent.click(screen.getAllByText('nested-worker')[0]);
    expect(container.textContent).toContain('GrandchildTool');
  });

  it('falls back to the accumulated body when nodes are absent', () => {
    const { container } = renderInline(
      make({
        status: 'done',
        body: 'legacy flat output',
        nodes: undefined,
      })
    );

    // The status the e2e used to read off the card is carried by the step row.
    const step = container.querySelector('[data-step-kind="sub_agent"]');
    expect(step?.getAttribute('data-step-status')).toBe('done');

    // No tree, but the flat body is still reachable as the step's detail.
    expect(screen.queryByText('legacy flat output')).toBeNull();
    fireEvent.click(screen.getAllByText('worker')[0]);
    expect(screen.getByText('legacy flat output')).toBeTruthy();
  });
});
