/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import { selectCanonicalRunSnapshot, type ExecutionBackend, type ExecutionSeed } from '@/common/execution';
import { useBackendExecutionSnapshot } from '@/renderer/hooks/execution';
import { useObservabilitySettings } from '@renderer/hooks/settings/useObservabilitySettings';
import ObservabilityPanel, {
  isObservable,
} from '@renderer/pages/conversation/Messages/components/ObservabilityPanel';
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
  useWorkbenchSection(missionSection);

  /**
   * Observability lives here, not in a platform chat. It used to be registered
   * at exactly ONE site - WCoreChat - so Claude Code and Codex (ACP) and Gemini
   * had no Observability tab at all, while Progress (registered above) was
   * already shared by all three. ExecutionSpine is rendered by AcpChat,
   * GeminiChat and WCoreChat inside the same MessageListProvider, and already
   * reads that stream via useMessageList, so one registration here gives every
   * backend the same surface with no per-platform copy.
   *
   * Availability is gated on there being something to show. This is a
   * DELIBERATE change for wcore, which previously passed `available: true`
   * unconditionally: an empty conversation offered an Observability tab whose
   * whole content was the "Activity ... will appear here." hint. A tab that
   * can only disappoint is worse than no tab, and the mission section beside it
   * already gates on content the same way.
   */
  const { settings: obs, update: updateObs } = useObservabilitySettings();
  const observable = useMemo(() => messages.filter(isObservable), [messages]);
  const hasObservable = observable.length > 0;
  const observabilitySection = useMemo<WorkbenchSectionRegistration>(
    () => ({
      id: 'observability',
      label: t('conversation.observability.title', { defaultValue: 'Observability' }),
      priority: 50,
      available: hasObservable,
      requestedOpen: obs.panelOpen && hasObservable,
      activationKey: obs.panelOpen ? 'open' : 'closed',
      onActivate: () => updateObs('panelOpen', true),
      onDismiss: () => updateObs('panelOpen', false),
      testId: 'workbench-observability',
      content: <ObservabilityPanel messages={messages} />,
    }),
    [hasObservable, messages, obs.panelOpen, t, updateObs]
  );
  useWorkbenchSection(observabilitySection);

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
