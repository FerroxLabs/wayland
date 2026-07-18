/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ICronJob } from '@/common/adapter/ipcBridge';
import type { TMessage } from '@/common/chat/chatLib';
import { adaptWCoreMessages, projectExecution, type ExecutionSeed } from '@/common/execution';
import type { ScheduleRunReceipt, ScheduleRunRecord, ScheduleRunResult } from '@/common/types/missionControl';

export type ScheduleConversationEvidence = {
  conversationId: string;
  messages: TMessage[];
};

type AcceptedAnvilReceipt = {
  receipt_id: string;
  event_id: string;
  origin: 'core/anvil';
  run_id: string;
  task_id: string;
  sequence: number;
};

/**
 * Projects persisted cron triggers, results and accepted Core evidence into
 * individual runs. A schedule definition or model-authored claim can never
 * create a verified receipt: only the hidden main-process acceptance envelope,
 * correlated to the persisted cron prompt's task id, is eligible.
 */
export function projectScheduleRuns(
  job: ICronJob,
  conversations: readonly ScheduleConversationEvidence[]
): ScheduleRunRecord[] {
  const runs: ScheduleRunRecord[] = [];

  for (const conversation of conversations) {
    const messages = conversation.messages.toSorted(compareMessages);
    const canonicalReceiptTrust = projectCanonicalReceiptTrust(messages, conversation.conversationId, job.id);
    const triggerIndexes = messages.flatMap((message, index) =>
      isMatchingTrigger(message, job.id) ? [{ index, message }] : []
    );

    triggerIndexes.forEach(({ index, message }, triggerPosition) => {
      const triggeredAt = message.content.triggeredAt;
      const nextIndex = triggerIndexes[triggerPosition + 1]?.index ?? messages.length;
      const slice = messages.slice(index, nextIndex);
      const promptIds = new Set(
        slice
          .filter((candidate) => isMatchingPrompt(candidate, job.id, triggeredAt))
          .flatMap((candidate) => [candidate.id, candidate.msg_id].filter((id): id is string => Boolean(id)))
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
        receipt: readReceipt(slice, promptIds, conversation.conversationId, canonicalReceiptTrust),
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

function readReceipt(
  runMessages: readonly TMessage[],
  promptIds: ReadonlySet<string>,
  conversationId: string,
  canonical: CanonicalReceiptTrust
): ScheduleRunReceipt {
  const observed: Array<{ event: AcceptedAnvilReceipt; messageId: string }> = [];

  for (const message of runMessages) {
    if (message.type !== 'execution_evidence' || message.content.acceptedBy !== 'desktop-core-v1-consumer') continue;
    const event = message.content.event;
    if (event.type !== 'anvil_receipt' || !isAcceptedReceipt(event)) continue;
    observed.push({ event, messageId: message.id });
  }

  const correlated = observed.filter(({ event }) => promptIds.has(event.task_id));
  if (correlated.length === 0) {
    if (observed.length > 0) {
      return {
        status: 'partial',
        ...(observed.length === 1 ? { receiptId: observed[0].event.receipt_id } : {}),
        reason:
          promptIds.size === 0 ? 'cron prompt correlation is missing' : 'receipt task id does not match cron prompt',
      };
    }
    return { status: 'unavailable', reason: 'no accepted receipt is correlated to this run' };
  }
  if (correlated.length !== 1) {
    return { status: 'partial', reason: 'multiple accepted receipts claim the same scheduled run' };
  }
  const { event, messageId } = correlated[0];
  if (canonical.integrity !== 'valid') {
    return { status: 'unavailable', reason: 'canonical receipt projection rejected persisted evidence' };
  }
  if (canonical.superseded.has(event.receipt_id)) {
    return { status: 'unavailable', reason: 'the correlated receipt was superseded' };
  }
  const trust = canonical.trust.get(event.receipt_id);
  if (!trust) {
    return { status: 'unavailable', reason: 'canonical Desktop receipt trust is not active' };
  }
  if (trust.status !== 'verified') {
    return {
      status: 'unavailable',
      reason: trust.reason
        ? `canonical receipt trust is ${trust.status}: ${trust.reason}`
        : `canonical receipt trust is ${trust.status}`,
    };
  }
  return {
    status: 'verified',
    receiptId: event.receipt_id,
    authority: 'core/anvil',
    runId: event.run_id,
    taskId: event.task_id,
    eventId: event.event_id,
    conversationId,
    evidenceMessageId: messageId,
  };
}

type CanonicalReceiptTrust = {
  integrity: 'valid' | 'invalid';
  trust: Map<string, { status: string; reason?: string }>;
  superseded: Set<string>;
};

function projectCanonicalReceiptTrust(
  messages: readonly TMessage[],
  conversationId: string,
  jobId: string
): CanonicalReceiptTrust {
  const identity = {
    runId: `schedule:${jobId}`,
    turnId: `conversation:${conversationId}`,
    correlationId: `${jobId}:${conversationId}`,
  } as const;
  const seed: ExecutionSeed = {
    identity,
    actor: { backend: 'wcore', agentId: 'wayland-core' },
    scope: {
      workspaceId: conversationId,
      host: 'desktop',
      trust: 'trusted',
      scheduled: true,
      surface: 'automation',
    },
    requestedGovernance: { mode: 'ask', enforceability: 'advisory' },
  };
  const observedAt = messages.reduce(
    (latest, message) =>
      Math.max(latest, message.createdAt ?? 0, message.type === 'execution_evidence' ? message.content.acceptedAt : 0),
    Date.now()
  );
  const events = adaptWCoreMessages(messages, { identity, observedAt });
  const snapshot = projectExecution(seed, events, { now: observedAt });
  const superseded = new Set<string>();
  for (const message of messages) {
    if (message.type !== 'execution_evidence' || message.content.acceptedBy !== 'desktop-core-v1-consumer') continue;
    const event = message.content.event;
    if (
      event.type === 'anvil_receipt' &&
      'supersedes_receipt_id' in event &&
      typeof event.supersedes_receipt_id === 'string'
    ) {
      superseded.add(event.supersedes_receipt_id);
    }
  }
  return {
    integrity: snapshot.integrity.status,
    trust: new Map(
      snapshot.outcomeTrust.map((trust) => [
        trust.receiptId,
        { status: trust.status, ...(trust.reason ? { reason: trust.reason } : {}) },
      ])
    ),
    superseded,
  };
}

function isAcceptedReceipt(event: Record<string, unknown>): event is AcceptedAnvilReceipt {
  return (
    event.origin === 'core/anvil' &&
    typeof event.receipt_id === 'string' &&
    event.receipt_id.length > 0 &&
    typeof event.event_id === 'string' &&
    event.event_id.length > 0 &&
    typeof event.run_id === 'string' &&
    event.run_id.length > 0 &&
    typeof event.task_id === 'string' &&
    event.task_id.length > 0 &&
    Number.isSafeInteger(event.sequence)
  );
}
