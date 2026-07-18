/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import ExecutionSpine from '@/renderer/pages/conversation/components/ExecutionSpine';
import { MessageListProvider } from '@/renderer/pages/conversation/Messages/hooks';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; completed?: number; total?: number; count?: number }) =>
      options?.defaultValue
        ?.replace('{{completed}}', String(options.completed))
        .replace('{{total}}', String(options.total))
        .replace('{{count}}', String(options.count)) ?? _key,
  }),
}));

describe('ExecutionSpine', () => {
  it('renders thread and rail from the exact same canonical run', () => {
    const messages = [
      {
        id: 'plan-1',
        conversation_id: 'conversation-1',
        type: 'plan',
        content: {
          sessionId: 'session-1',
          entries: [{ content: 'Build the report', status: 'in_progress', priority: 'high' }],
        },
        createdAt: 1_000,
      },
      {
        id: 'activity-1',
        conversation_id: 'conversation-1',
        type: 'activity',
        content: { turnId: 'turn-1', status: 'running', nodes: [] },
        createdAt: 1_000,
      },
    ] as TMessage[];
    render(
      <MessageListProvider value={messages}>
        <ExecutionSpine
          backend='wcore'
          conversationId='conversation-1'
          workspaceId='workspace-1'
          projectId='project-1'
          agentId='wcore'
        >
          <div>conversation</div>
        </ExecutionSpine>
      </MessageListProvider>
    );
    const thread = screen.getByTestId('execution-thread-summary');
    const rail = screen.getByTestId('execution-mission-rail');
    expect(thread.dataset.runId).toBe(rail.dataset.runId);
    expect(screen.getAllByText('Build the report')).toHaveLength(2);
  });

  it('does not overwhelm an ordinary chat with an empty mission rail', () => {
    render(
      <MessageListProvider value={[]}>
        <ExecutionSpine backend='gemini' conversationId='conversation-1' workspaceId='workspace-1' agentId='gemini'>
          <div>ordinary chat</div>
        </ExecutionSpine>
      </MessageListProvider>
    );
    expect(screen.queryByTestId('execution-mission-rail')).toBeNull();
    expect(screen.getByText('ordinary chat')).toBeTruthy();
  });
});
