/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ICronJob } from '@/common/adapter/ipcBridge';
import type { TMessage } from '@/common/chat/chatLib';
import type { ScheduleRunReceipt, ScheduleRunRecord, ScheduleRunResult } from '@/common/types/missionControl';

export type ScheduleConversationEvidence = {
  conversationId: string;
  messages: TMessage[];
};

/**
 * Projects persisted cron triggers and results into individual runs. A
 * schedule definition or model-authored claim can never create a verified
 * receipt; no bundled engine publishes a receipt authority today, so every
 * run's receipt is reported unavailable rather than inferred.
 */
export function projectScheduleRuns(
  job: ICronJob,
  conversations: readonly ScheduleConversationEvidence[]
): ScheduleRunRecord[] {
  const runs: ScheduleRunRecord[] = [];

  for (const conversation of conversations) {
    const messages = conversation.messages.toSorted(compareMessages);
    const triggerIndexes = messages.flatMap((message, index) =>
      isMatchingTrigger(message, job.id) ? [{ index, message }] : []
    );

    triggerIndexes.forEach(({ index, message }, triggerPosition) => {
      const triggeredAt = message.content.triggeredAt;
      const nextIndex = triggerIndexes[triggerPosition + 1]?.index ?? messages.length;
      const slice = messages.slice(index, nextIndex);
      const matchingPrompts = slice.filter((candidate) => isMatchingPrompt(candidate, job.id, triggeredAt));
      const promptIds = new Set(
        matchingPrompts.flatMap((candidate) =>
          [candidate.id, candidate.msg_id].filter((id): id is string => Boolean(id))
        )
      );
      // CronService supplies this exact timestamp to the executor, which persists
      // it in the trigger/prompt envelope. Anything other than equality is not
      // per-run evidence and must not be back- or forward-attributed.
      const isLatestKnownRun = job.state.lastRunAtMs !== undefined && job.state.lastRunAtMs === triggeredAt;

      runs.push({
        jobId: job.id,
        runId: `${job.id}:${triggeredAt}`,
        title: `${job.name} run`,
        triggeredAt,
        outcome:
          isLatestKnownRun && job.state.lastStatus
            ? { status: 'available', value: job.state.lastStatus, source: 'scheduler-state' }
            : { status: 'unavailable', reason: 'per-run scheduler outcome is not retained' },
        result: readResult(slice, promptIds, conversation.conversationId, job.id, triggeredAt),
        receipt: readReceipt(matchingPrompts.length === 1),
        action: {
          kind: 'navigate',
          path: `/conversation/${conversation.conversationId}`,
          label: 'Inspect scheduled run',
        },
      });
    });
  }

  return runs.toSorted((left, right) => right.triggeredAt - left.triggeredAt || left.runId.localeCompare(right.runId));
}

function isMatchingTrigger(message: TMessage, jobId: string): message is Extract<TMessage, { type: 'cron_trigger' }> {
  return message.type === 'cron_trigger' && message.content.cronJobId === jobId;
}

function isMatchingPrompt(message: TMessage, jobId: string, triggeredAt: number): boolean {
  return (
    message.type === 'text' &&
    message.content.cronMeta?.cronJobId === jobId &&
    message.content.cronMeta.triggeredAt === triggeredAt
  );
}

function compareMessages(left: TMessage, right: TMessage): number {
  const time = (left.createdAt ?? 0) - (right.createdAt ?? 0);
  return time !== 0 ? time : left.id.localeCompare(right.id);
}

function readResult(
  messages: readonly TMessage[],
  promptIds: ReadonlySet<string>,
  conversationId: string,
  jobId: string,
  triggeredAt: number
): ScheduleRunResult {
  const promptIndexes = messages.flatMap((message, index) =>
    message.position === 'right' && isMatchingPrompt(message, jobId, triggeredAt) ? [index] : []
  );
  if (promptIndexes.length !== 1) {
    return { status: 'unavailable', reason: 'no unique persisted cron prompt is correlated to this run' };
  }

  const promptIndex = promptIndexes[0];
  const nextUserTurnOffset = messages
    .slice(promptIndex + 1)
    .findIndex((message) => message.type === 'text' && message.position === 'right');
  const resultBoundary = nextUserTurnOffset === -1 ? messages.length : promptIndex + 1 + nextUserTurnOffset;
  const result = messages
    .slice(promptIndex + 1, resultBoundary)
    .toReversed()
    .find(
      (message) =>
        message.type === 'text' &&
        message.position === 'left' &&
        message.hidden !== true &&
        message.status !== 'pending' &&
        typeof message.msg_id === 'string' &&
        promptIds.has(message.msg_id) &&
        message.content.content.trim().length > 0
    );
  if (!result || result.type !== 'text') {
    return { status: 'unavailable', reason: 'no persisted assistant result is correlated to this run' };
  }
  const text = result.content.content.trim();
  return {
    status: 'available',
    summary: text.length > 240 ? `${text.slice(0, 237)}...` : text,
    conversationId,
    messageId: result.id,
  };
}

function readReceipt(hasUniquePrompt: boolean): ScheduleRunReceipt {
  if (!hasUniquePrompt) {
    return { status: 'unavailable', reason: 'no unique persisted cron prompt is correlated to this run' };
  }
  return { status: 'unavailable', reason: 'no receipt authority is available for this run' };
}
