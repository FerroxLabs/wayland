/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import { selectCanonicalRunSnapshot, type ExecutionBackend, type ExecutionSeed } from '@/common/execution';
import { useBackendExecutionSnapshot } from '@/renderer/hooks/execution';
import { useMessageList } from '@/renderer/pages/conversation/Messages/messageListContext';
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

/**
 * THE LIVE STATUS LINE'S DOT.
 *
 * The line used to lead with a filled Arco `Tag`, which put a BLUE block at the
 * top of an interface whose accent is orange, and gave the row a second box to
 * be misaligned inside. A dot states the same thing in a tenth of the space and
 * sits on the text baseline, so the row reads as one line instead of a chip
 * with a caption next to it.
 *
 * Running takes the BRAND colour, because the thing that is happening is the
 * thing the eye should land on, and it PULSES - which is what separates it from
 * `waiting` rather than a second orange-ish hue nobody can tell apart on a dark
 * ground. Waiting keeps warning amber because it usually means waiting on the
 * user. The pulse is dropped under `prefers-reduced-motion`.
 */
const statusDotClass = (status: string): string => {
  if (status === 'completed' || status === 'authoritative') return 'bg-success';
  if (status === 'failed' || status === 'mismatch') return 'bg-danger';
  if (status === 'waiting' || status === 'blocked' || status === 'paused') return 'bg-warning';
  if (status === 'running') return 'bg-primary animate-pulse motion-reduce:animate-none';
  return 'bg-t-tertiary';
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
    return <>{children}</>;
  }

  return (
    <>
      <div className='flex flex-1 min-h-0' data-testid='execution-spine' data-run-id={run.identity.runId}>
        <section className='flex flex-col flex-1 min-w-0'>
          {/*
              ONE ROW, ONE BASELINE.

              This card never actually rendered: `border border-1` sets a border
              WIDTH and a border COLOUR and no border STYLE, and the initial
              style is `none` - so the container was invisible and its contents
              read as a stray chip with some text floating beside it. The colour
              was wrong even so; `border-1` resolves to `--bg-1`, a BACKGROUND
              token, which is the same value as the surface it sat on.
              The colour is bound to `--border-light` directly, because the numeric
              border tokens (`b-border-2`, `b-border-3`) both resolve to the same
              #222 as `bg-fill-1` on this theme - a border the same colour as the
              card it outlines. Measured in the running app, not assumed.

              The label is a plain span rather than `Typography.Text`, whose
              bottom margin was what pushed the text off the dot's centre line.
              Truncation is `truncate`, which needs the `min-w-0` beside it to
              survive a flex parent.
          */}
          {!settled && (
            <div
              className='mx-20px mt-8px flex items-center gap-10px rd-8px bg-fill-1 b-1 b-solid b-[var(--border-light)] px-12px py-8px'
              data-testid='execution-thread-summary'
              data-run-id={run.identity.runId}
              data-lifecycle={run.lifecycle}
            >
              <span className='flex shrink-0 items-center gap-6px text-12px font-medium text-t-secondary'>
                <span
                  className={`inline-block size-6px shrink-0 rd-full ${statusDotClass(run.lifecycle)}`}
                  data-testid='execution-thread-status-dot'
                  aria-hidden='true'
                />
                {lifecycleLabel}
              </span>
              <span className='min-w-0 flex-1 truncate text-t-secondary'>{activityLabel}</span>
              {run.progress.total > 0 && (
                <span className='shrink-0 text-12px text-t-tertiary tabular-nums'>{progressLabel}</span>
              )}
            </div>
          )}
          <div className='flex flex-1 min-h-0'>{children}</div>
        </section>
      </div>
    </>
  );
};

export default ExecutionSpine;
