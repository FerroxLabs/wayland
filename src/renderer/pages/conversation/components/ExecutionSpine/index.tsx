/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import { selectCanonicalRunSnapshot, type ExecutionBackend, type ExecutionSeed } from '@/common/execution';
import { useBackendExecutionSnapshot } from '@/renderer/hooks/execution';
import { useMessageList } from '@/renderer/pages/conversation/Messages/messageListContext';
import { Tag, Typography } from '@arco-design/web-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkbenchSection, type WorkbenchSectionRegistration } from '../WorkbenchHost';
import ExecutionWorkbenchProjections from '../WorkbenchHost/projections';
import MissionProgressPanel from './MissionProgressPanel';

function latestTurnId(messages: readonly TMessage[], fallback: string): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.type === 'activity' && message.content.turnId) return message.content.turnId;
    if (
      (message.type === 'plan' || message.type === 'acp_permission' || message.type === 'acp_tool_call') &&
      message.content.sessionId
    ) {
      return message.content.sessionId;
    }
  }
  return fallback;
}

const statusColor = (status: string): 'green' | 'red' | 'orange' | 'blue' | 'gray' => {
  if (status === 'completed' || status === 'authoritative') return 'green';
  if (status === 'failed' || status === 'mismatch') return 'red';
  if (status === 'waiting' || status === 'blocked' || status === 'paused') return 'orange';
  if (status === 'running') return 'blue';
  return 'gray';
};

const ExecutionSpine: React.FC<{
  backend: ExecutionBackend;
  conversationId: string;
  workspaceId: string;
  projectId?: string;
  agentId: string;
  children: React.ReactNode;
}> = ({ backend, conversationId, workspaceId, projectId, agentId, children }) => {
  const { t } = useTranslation();
  const messages = useMessageList();
  const turnId = latestTurnId(messages, conversationId);
  const seed = useMemo<ExecutionSeed>(
    () => ({
      identity: { runId: `${conversationId}:${turnId}`, turnId, correlationId: conversationId },
      actor: { backend, agentId },
      scope: {
        ...(projectId ? { projectId } : {}),
        workspaceId,
        host: 'desktop',
        trust: 'unknown',
        scheduled: false,
      },
      requestedGovernance: { mode: 'ask', enforceability: 'advisory' },
    }),
    [agentId, backend, conversationId, projectId, turnId, workspaceId]
  );
  const options = useMemo(() => ({ now: Date.now() }), [messages]);
  const snapshot = useBackendExecutionSnapshot(backend, seed, messages, options);
  const run = selectCanonicalRunSnapshot(snapshot);
  const currentStep =
    run.plan.find((step) => step.status === 'in-progress') ?? run.plan.find((step) => step.status === 'pending');
  const visible =
    run.plan.length > 0 ||
    run.activities.length > 0 ||
    run.outcomes.length > 0 ||
    run.handoffs.length > 0 ||
    run.lifecycle !== 'queued' ||
    run.costLedger.status !== 'unavailable';

  const progressLabel = t('conversation.execution.progressCount', {
    defaultValue: '{{completed}} of {{total}} complete',
    completed: run.progress.completed,
    total: run.progress.total,
  });
  const missionSection = useMemo<WorkbenchSectionRegistration>(
    () => ({
      id: 'mission',
      label: t('conversation.execution.progress', { defaultValue: 'Progress' }),
      priority: 60,
      available: visible,
      requestedOpen: visible,
      activationKey: `${run.identity.runId}:${visible ? 'visible' : 'hidden'}`,
      testId: 'workbench-mission',
      content: <MissionProgressPanel run={run} progressLabel={progressLabel} />,
    }),
    [progressLabel, run, t, visible]
  );
  useWorkbenchSection(missionSection);

  const projections = <ExecutionWorkbenchProjections snapshot={snapshot} />;

  if (!visible) {
    return (
      <>
        {projections}
        {children}
      </>
    );
  }

  return (
    <>
      {projections}
      <div className='flex flex-1 min-h-0' data-testid='execution-spine' data-run-id={run.identity.runId}>
        <section className='flex flex-col flex-1 min-w-0'>
          <div
            className='mx-20px mt-8px px-12px py-8px rounded-8px bg-fill-1 border border-border-1 flex items-center gap-10px'
            data-testid='execution-thread-summary'
            data-run-id={run.identity.runId}
          >
            <Tag size='small' color={statusColor(run.lifecycle)}>
              {run.lifecycle}
            </Tag>
            <Typography.Text ellipsis className='min-w-0 text-t-secondary'>
              {currentStep?.content ??
                t('conversation.execution.currentActivity', { defaultValue: 'Working through the current task' })}
            </Typography.Text>
            {run.progress.total > 0 && <span className='ml-auto text-12px text-t-secondary'>{progressLabel}</span>}
          </div>
          <div className='flex flex-1 min-h-0'>{children}</div>
        </section>
      </div>
    </>
  );
};

export default ExecutionSpine;
