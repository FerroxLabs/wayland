/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import type { ExecutionActivity, ExecutionEvent, ExecutionPlanStep } from '../types';
import type { ExecutionAdapterContext } from './types';

type UnsequencedEvent = ExecutionEvent extends infer Event
  ? Event extends ExecutionEvent
    ? Omit<Event, 'sequence'>
    : never
  : never;

function toolStatus(status: 'pending' | 'in_progress' | 'completed' | 'failed'): ExecutionActivity['status'] {
  if (status === 'pending') return 'queued';
  if (status === 'in_progress') return 'running';
  return status;
}

function planStatus(status: 'pending' | 'in_progress' | 'completed'): ExecutionPlanStep['status'] {
  return status === 'in_progress' ? 'in-progress' : status;
}

export function adaptAcpMessages(
  messages: readonly TMessage[],
  context: ExecutionAdapterContext
): readonly ExecutionEvent[] {
  const events: ExecutionEvent[] = [];
  let sequence = context.startSequence ?? 0;
  let lifecycle: 'queued' | 'running' | 'waiting' = 'queued';
  let lastTool: 'pending' | 'in_progress' | 'completed' | 'failed' | undefined;
  let errorAfterLastWork = false;
  const append = (event: UnsequencedEvent): void => {
    events.push({ ...event, sequence } as ExecutionEvent);
    sequence += 1;
  };

  for (const message of messages) {
    const observedAt = message.createdAt ?? context.observedAt;
    if (message.type === 'acp_tool_call') {
      const update = message.content.update;
      if (lifecycle !== 'running') {
        append({
          eventId: `${message.id}:lifecycle:running`,
          identity: context.identity,
          observedAt,
          type: 'lifecycle',
          lifecycle: 'running',
          ...(lifecycle === 'waiting' ? { action: 'resume' as const } : {}),
        });
        lifecycle = 'running';
      }
      append({
        eventId: `${message.id}:tool:${update.toolCallId}`,
        identity: context.identity,
        observedAt,
        type: 'activity',
        activity: {
          id: update.toolCallId,
          kind: 'tool',
          name: update.title,
          status: toolStatus(update.status),
          // `update.kind` is a typed protocol enum, so it belongs in the
          // structured slot. It used to be written into `detail`, where the
          // workbench could not tell it apart from a free-text tool
          // description - and `update.title`, the only thing left in `name`, is
          // a sentence the agent writes, so nothing structured survived and
          // every ACP lane went dark.
          toolKind: update.kind,
        },
      });
      // A failed TOOL is an activity, never the run's verdict. The reducer treats
      // a terminal lifecycle as absorbing, so settling `failed` here pinned the
      // whole turn to "failed · The run stopped before it finished" from the
      // first refused read onward, while the engine kept working for minutes.
      lastTool = update.status;
      errorAfterLastWork = false;
    } else if (message.type === 'acp_permission') {
      errorAfterLastWork = false;
      append({
        eventId: `${message.id}:waiting`,
        identity: context.identity,
        observedAt,
        type: 'lifecycle',
        lifecycle: 'waiting',
      });
      lifecycle = 'waiting';
      append({
        eventId: `${message.id}:approval:${message.content.toolCall.toolCallId}`,
        identity: context.identity,
        observedAt,
        type: 'activity',
        activity: {
          id: message.content.toolCall.toolCallId,
          kind: 'approval',
          name: message.content.toolCall.title ?? 'Permission required',
          status: 'waiting',
          detail: message.content.toolCall.kind,
        },
      });
    } else if (message.type === 'tips' && message.content.type === 'error') {
      errorAfterLastWork = true;
    } else if (message.type === 'plan') {
      errorAfterLastWork = false;
      append({
        eventId: `${message.id}:plan`,
        identity: context.identity,
        observedAt,
        type: 'plan',
        steps: message.content.entries.map((entry, index) => ({
          id: `${message.id}:${index}`,
          content: entry.content,
          status: planStatus(entry.status),
          priority: entry.priority,
        })),
      });
    }
  }

  // ── Turn settlement ────────────────────────────────────────────────
  //
  // Once, at the tail, and only for a run that started. A turn the caller
  // reports as still in flight never settles. A turn FAILS only when a
  // turn-level error (the persisted `tips` error) is the last thing it did;
  // otherwise it completes - when the caller says the turn is over, or, with
  // no turn signal, when the latest tool reached a terminal status.
  if (lifecycle !== 'queued' && context.turnActive !== true) {
    const settled = errorAfterLastWork
      ? 'failed'
      : lifecycle === 'running' && (context.turnActive === false || lastTool === 'completed' || lastTool === 'failed')
        ? 'completed'
        : undefined;
    if (settled) {
      append({
        eventId: `${context.identity.runId}:lifecycle:${settled}`,
        identity: context.identity,
        observedAt: context.observedAt,
        type: 'lifecycle',
        lifecycle: settled,
      });
    }
  }
  return events;
}
