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

  // A plain WCore turn emits no `plan` message at all - it just runs tools. The
  // rail rendered plan steps, outcomes and cost but never the activity stream,
  // so such a turn showed the word "running" over an empty panel while the chat
  // beside it plainly listed the tools. Steps taken ARE the progress.
  it('shows the steps taken when a WCore turn carries tools but no plan', () => {
    const messages = [
      {
        id: 'user',
        conversation_id: 'conversation-1',
        type: 'text',
        position: 'right',
        content: { content: 'Run the probe' },
        createdAt: 1_000,
      },
      {
        id: 'tools',
        conversation_id: 'conversation-1',
        type: 'tool_group',
        content: [
          { callId: 'a', name: 'Bash', description: "Execute: printf 'ok'", status: 'Success' },
          { callId: 'b', name: 'ReadFile', description: 'Read config.ts', status: 'Executing' },
        ],
        createdAt: 1_100,
      },
    ] as TMessage[];
    render(
      <WorkbenchHost conversationId='conversation-1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='wcore' conversationId='conversation-1' workspaceId='workspace-1' agentId='wcore'>
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    // Labels come from the same humanizer the chat timeline uses, so a step
    // reads as the work done ("Running printf 'ok'"), not the tool's name.
    const steps = screen.getByTestId('execution-mission-steps');
    expect(steps.textContent).toContain("Running printf 'ok'");
    expect(steps.textContent).toContain('Reading config.ts');
    // A dispatched tool proves the run left the queue.
    expect(screen.getByTestId('execution-mission-rail').textContent).toContain('running');
  });

  // The rail renders the real invocation, so it inherits #610's obligation: an
  // inline credential must be masked before it reaches the label.
  it('masks an inline secret in a rendered step command', () => {
    const messages = [
      { id: 'user', conversation_id: 'c1', type: 'text', position: 'right', content: { content: 'go' } },
      {
        id: 'tools',
        conversation_id: 'c1',
        type: 'tool_group',
        content: [
          {
            callId: 'a',
            name: 'Bash',
            description: 'Execute: curl -H "Authorization: Bearer sk-ant-secretvalue123456" https://x.test',
            status: 'Success',
          },
        ],
      },
    ] as TMessage[];
    render(
      <WorkbenchHost conversationId='c1'>
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='wcore' conversationId='c1' workspaceId='workspace-1' agentId='wcore'>
            <div>conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );
    const steps = screen.getByTestId('execution-mission-steps');
    expect(steps.textContent).not.toContain('sk-ant-secretvalue123456');
    expect(steps.textContent).toContain('••••••');
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

  it('registers the Automation lane for a persisted scheduled WCore run', async () => {
    const messages = [
      {
        id: 'trigger',
        msg_id: 'trigger',
        type: 'cron_trigger',
        position: 'center',
        conversation_id: 'conversation-1',
        content: { cronJobId: 'job-1', cronJobName: 'Daily', triggeredAt: 100 },
        createdAt: 100,
        status: 'finish',
      },
      {
        id: 'prompt',
        msg_id: 'prompt',
        type: 'text',
        position: 'right',
        conversation_id: 'conversation-1',
        content: {
          content: 'Run',
          cronMeta: { source: 'cron', cronJobId: 'job-1', cronJobName: 'Daily', triggeredAt: 100 },
        },
        createdAt: 101,
        hidden: true,
        status: 'finish',
      },
    ] as TMessage[];

    render(
      <WorkbenchHost
        conversationId='conversation-1'
        requestedSectionId='projection:automation'
        requestKey='desktop:schedule-run:job-1:100'
      >
        <MessageListProvider value={messages}>
          <ExecutionSpine backend='wcore' conversationId='conversation-1' workspaceId='workspace-1' agentId='wcore'>
            <div>scheduled conversation</div>
          </ExecutionSpine>
        </MessageListProvider>
      </WorkbenchHost>
    );

    expect(await screen.findByTestId('workbench-panel')).toHaveAttribute('data-section-id', 'projection:automation');
    expect(screen.getByTestId('workbench-projection-automation')).toHaveTextContent('Scheduled run');
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
