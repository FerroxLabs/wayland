/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ActivityNode, IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
import type { ExecutionActivity, ExecutionEvent, ExecutionPlanStep } from '../types';
import type { ExecutionAdapterContext } from './types';

type UnsequencedEvent = ExecutionEvent extends infer Event
  ? Event extends ExecutionEvent
    ? Omit<Event, 'sequence'>
    : never
  : never;

function activityKind(kind: ActivityNode['kind']): ExecutionActivity['kind'] {
  if (kind === 'sub_agent') return 'sub-agent';
  if (kind === 'browser') return 'browser';
  if (kind === 'cua') return 'computer';
  if (kind === 'thinking') return 'thinking';
  if (kind === 'tool') return 'tool';
  return 'system';
}

function activityStatus(status: ActivityNode['status']): ExecutionActivity['status'] {
  if (status === 'done') return 'completed';
  return status;
}

function planStatus(status: 'pending' | 'in_progress' | 'completed'): ExecutionPlanStep['status'] {
  return status === 'in_progress' ? 'in-progress' : status;
}

function toolGroupStatus(status: IMessageToolGroup['content'][number]['status']): ExecutionActivity['status'] {
  if (status === 'Success') return 'completed';
  if (status === 'Error') return 'failed';
  if (status === 'Canceled') return 'cancelled';
  if (status === 'Confirming') return 'waiting';
  if (status === 'Pending') return 'queued';
  return 'running';
}

export function adaptWCoreMessages(
  messages: readonly TMessage[],
  context: ExecutionAdapterContext
): readonly ExecutionEvent[] {
  const events: ExecutionEvent[] = [];
  let sequence = context.startSequence ?? 0;
  const append = (event: UnsequencedEvent): void => {
    events.push({ ...event, sequence } as ExecutionEvent);
    sequence += 1;
  };

  for (const message of messages) {
    const observedAt = message.createdAt ?? context.observedAt;
    if (message.type === 'activity') {
      append({
        eventId: `${message.id}:lifecycle:running`,
        identity: context.identity,
        observedAt,
        type: 'lifecycle',
        lifecycle: 'running',
      });
      for (const node of message.content.nodes) {
        append({
          eventId: `${message.id}:activity:${node.id}`,
          identity: context.identity,
          observedAt,
          type: 'activity',
          activity: {
            id: node.id,
            kind: activityKind(node.kind),
            name: node.name,
            status: activityStatus(node.status),
            detail: node.detail,
          },
        });
      }
      if (message.content.status !== 'running') {
        append({
          eventId: `${message.id}:lifecycle:${message.content.status}`,
          identity: context.identity,
          observedAt,
          type: 'lifecycle',
          lifecycle: message.content.status === 'done' ? 'completed' : 'failed',
        });
      }
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
    } else if (message.type === 'tool_group') {
      for (const tool of message.content) {
        append({
          eventId: `${message.id}:tool:${tool.callId}`,
          identity: context.identity,
          observedAt,
          type: 'activity',
          activity: {
            id: tool.callId,
            kind: tool.confirmationDetails?.type === 'mcp' ? 'system' : 'tool',
            name: tool.name,
            status: toolGroupStatus(tool.status),
            detail: tool.description,
          },
        });
      }
    }
  }
  return events;
}
