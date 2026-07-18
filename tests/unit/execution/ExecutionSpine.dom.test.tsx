/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import ExecutionSpine from '@/renderer/pages/conversation/components/ExecutionSpine';
import WorkbenchHost from '@/renderer/pages/conversation/components/WorkbenchHost';
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
      <WorkbenchHost conversationId='conversation-1'>
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
      </WorkbenchHost>
    );
    const thread = screen.getByTestId('execution-thread-summary');
    const rail = screen.getByTestId('execution-mission-rail');
    expect(thread.dataset.runId).toBe(rail.dataset.runId);
    expect(screen.getAllByText('Build the report')).toHaveLength(2);
  });

  it('does not overwhelm an ordinary chat with an empty mission rail', () => {
    render(
      <WorkbenchHost conversationId='conversation-1'>
        <MessageListProvider value={[]}>
          <ExecutionSpine backend='gemini' conversationId='conversation-1' workspaceId='workspace-1' agentId='gemini'>
            <div>ordinary chat</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    expect(screen.queryByTestId('execution-mission-rail')).toBeNull();
    expect(screen.getByText('ordinary chat')).toBeTruthy();
  });

  it('renders only the current ACP plan when the session id is reused after a completed turn', () => {
    const messages = [
      {
        id: 'old-user',
        conversation_id: 'conversation-1',
        type: 'text',
        position: 'right',
        content: { content: 'Old turn' },
      },
      {
        id: 'old-tool',
        conversation_id: 'conversation-1',
        type: 'acp_tool_call',
        content: {
          sessionId: 'same-session',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'old-tool',
            status: 'completed',
            title: 'Historical completed tool',
            kind: 'execute',
          },
        },
      },
      {
        id: 'new-user',
        conversation_id: 'conversation-1',
        type: 'text',
        position: 'right',
        content: { content: 'New turn' },
      },
      {
        id: 'new-plan',
        conversation_id: 'conversation-1',
        type: 'plan',
        content: {
          sessionId: 'same-session',
          entries: [{ content: 'Current plan step', status: 'in_progress', priority: 'high' }],
        },
      },
    ] as TMessage[];

    render(
      <WorkbenchHost conversationId='conversation-1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='acp' conversationId='conversation-1' workspaceId='workspace-1' agentId='codex'>
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );

    expect(screen.getAllByText('Current plan step')).toHaveLength(2);
    expect(screen.queryByText('Historical completed tool')).toBeNull();
  });
});
