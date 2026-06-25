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

import SubAgentActivityCard from '@/renderer/pages/conversation/Messages/components/SubAgentActivityCard';
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

// #252 Phase 2: SubAgentActivityCard switches between the new depth-N tree
// (content.nodes present) and the legacy flat body (nodes absent). Both branches
// are renderer-only and previously had no DOM test.
describe('SubAgentActivityCard (#252 Phase 2)', () => {
  it('renders the activity tree (with nested child) when content.nodes is present', () => {
    render(
      <SubAgentActivityCard
        message={make({
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
        })}
      />
    );
    // Tree branch: the sub-agent node name renders (card is expanded by default).
    expect(screen.getByText('nested-worker')).toBeTruthy();
    // Drill into the nested sub-agent to reveal its grandchild tool subtree.
    fireEvent.click(screen.getByText('nested-worker'));
    expect(screen.getByText('GrandchildTool')).toBeTruthy();
  });

  it('falls back to the legacy flat body when nodes are absent', () => {
    render(
      <SubAgentActivityCard
        message={make({
          status: 'done',
          body: 'legacy flat output',
          nodes: undefined,
        })}
      />
    );
    // Legacy body branch renders the accumulated text.
    expect(screen.getByText('legacy flat output')).toBeTruthy();
    // The tree container is not rendered without nodes.
    expect(screen.getByTestId('sub-agent-activity-card').getAttribute('data-sub-agent-status')).toBe('done');
  });
});
