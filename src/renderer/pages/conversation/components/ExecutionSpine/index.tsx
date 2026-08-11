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

function isScheduledConversation(messages: readonly TMessage[]): boolean {
  return messages.some(
    (message) =>
      message.type === 'cron_trigger' || (message.type === 'text' && message.content.cronMeta?.source === 'cron')
  );
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
  const scheduled = isScheduledConversation(messages);
  const seed = useMemo<ExecutionSeed>(
    () => ({
      identity: { runId: `${conversationId}:${turnId}`, turnId, correlationId: conversationId },
      actor: { backend, agentId },
      scope: {
        ...(projectId ? { projectId } : {}),
        workspaceId,
        host: 'desktop',
        trust: 'unknown',
        scheduled,
        ...(scheduled ? { surface: 'automation' as const } : {}),
      },
      requestedGovernance: { mode: 'ask', enforceability: 'advisory' },
    }),
    [agentId, backend, conversationId, projectId, scheduled, turnId, workspaceId]
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
  // The workbench is Workspace ONLY.
  //
  // Progress and the Engine projections were both removed deliberately: the
  // panel told the user "valid / queued" and a step count they could already
  // read in the transcript, which is engine telemetry wearing a panel rather
  // than something anyone can act on. Claude's own side panel dropped the same
  // two things. Workspace stays because a file tree tied to the conversation is
  // a thing people actually reach for.
  //
  // `missionSection` is still COMPUTED - the in-thread summary strip below uses
  // the same run data - it is simply no longer published to the right rail.
  void missionSection;

  /**
   * There is deliberately NO Observability section here.
   *
   * It rendered the same ActivityTimeline, from the same message stream, that
   * the transcript already shows inline under the turn it belongs to - so the
   * panel's whole job was to say a second time what the conversation had
   * already said, one pane to the right and detached from the turn that
   * produced it. "Observability" is also a developer's word in a product whose
   * user is explicitly not one; neither Claude Code nor Codex offers such a
   * surface, and Sean asked for it gone rather than merely gated.
   *
   * The inline timeline is NOT lost with it: MessageList renders
   * ActivityTimeline directly for sub_agent, activity and tool_summary
   * messages (MessageList.tsx:178, :182, :545), so the steps still appear
   * under the turn that produced them.
   *
   * The panel this registration used to mount, and the components it alone
   * rendered, have since been deleted along with it - there is nothing left to
   * re-register. The per-backend projection it exercised (tool_group and
   * acp_tool_call humanized through one `toolSummaryToSteps`) was never the
   * panel's: it lives in common/chat/activity/projectMessages.ts and is covered
   * directly by tests/unit/projectMessages.test.ts.
   */

  // The bar is a LIVE status line. `currentStep` is the first in-progress or
  // pending step, so a finished run has none and the label fell through to its
  // present-tense default: the bar read "Working through the current task"
  // beside a `completed` badge, on every completed run, by construction - with
  // that same badge repeated in the Progress panel a few pixels to its right.
  // A finished run is the panel's story, so the bar stands down. A FAILED run
  // keeps it: a failure the user has to notice is what an inline bar is for.
  const settled = run.lifecycle === 'completed';
  const lifecycleLabel = t(`conversation.execution.lifecycle.${run.lifecycle}`, { defaultValue: run.lifecycle });
  const activityLabel =
    currentStep?.content ??
    (run.lifecycle === 'failed'
      ? t('conversation.execution.failedActivity', { defaultValue: 'The run stopped before it finished' })
      : t('conversation.execution.currentActivity', { defaultValue: 'Working through the current task' }));


  if (!visible) {
    return (
      <>{children}</>
    );
  }

  return (
    <>
      <div className='flex flex-1 min-h-0' data-testid='execution-spine' data-run-id={run.identity.runId}>
        <section className='flex flex-col flex-1 min-w-0'>
          {!settled && (
            <div
              className='mx-20px mt-8px px-12px py-8px rounded-8px bg-fill-1 border border-1 flex items-center gap-10px'
              data-testid='execution-thread-summary'
              data-run-id={run.identity.runId}
              data-lifecycle={run.lifecycle}
            >
              <Tag size='small' color={statusColor(run.lifecycle)}>
                {lifecycleLabel}
              </Tag>
              <Typography.Text ellipsis className='min-w-0 text-t-secondary'>
                {activityLabel}
              </Typography.Text>
              {run.progress.total > 0 && <span className='ml-auto text-12px text-t-secondary'>{progressLabel}</span>}
            </div>
          )}
          <div className='flex flex-1 min-h-0'>{children}</div>
        </section>
      </div>
    </>
  );
};

export default ExecutionSpine;
