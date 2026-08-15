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
  let lifecycle: 'queued' | 'running' | 'waiting' | 'completed' | 'failed' = 'queued';
  const lastToolMessageId = messages.findLast((message) => message.type === 'acp_tool_call')?.id;
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
          // workbench could not tell it apart from WCore's free-text tool
          // description - and `update.title`, the only thing left in `name`, is
          // a sentence the agent writes, so nothing structured survived and
          // every ACP lane went dark.
          toolKind: update.kind,
        },
      });
      if (update.status === 'failed' || (update.status === 'completed' && message.id === lastToolMessageId)) {
        append({
          eventId: `${message.id}:lifecycle:${update.status}`,
          identity: context.identity,
          observedAt,
          type: 'lifecycle',
          lifecycle: update.status,
        });
        lifecycle = update.status;
      }
    } else if (message.type === 'acp_permission') {
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
    } else if (message.type === 'plan') {
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
  return events;
}
