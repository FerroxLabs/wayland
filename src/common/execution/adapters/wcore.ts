/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ActivityNode, IMessageExecutionEvidence, IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
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
    if (message.type === 'execution_evidence') {
      const evidence = (message as IMessageExecutionEvidence).content;
      if (evidence.acceptedBy !== 'desktop-core-v1-consumer') continue;
      const event = evidence.event;
      try {
        if (event.type === 'execution_policy') {
          append({
            eventId: `${message.id}:policy:${event.revision}`,
            identity: context.identity,
            observedAt,
            type: 'policy-revision',
            policy: {
              status: 'trusted',
              contractVersion: event.contract_version,
              revision: event.revision,
              reason: event.reason,
              effectiveAt: event.effective_at_unix_ms,
              posture: event.policy.posture,
              approvals: event.policy.approvals,
              sandbox: event.policy.sandbox,
              source: event.policy.source,
              managedFloorActive: event.policy.managed_floor_active,
              ...(event.policy.dangerous_activation_id
                ? { dangerousActivationId: event.policy.dangerous_activation_id }
                : {}),
              ...(event.policy.dangerous_expires_at_unix_ms
                ? { dangerousExpiresAt: event.policy.dangerous_expires_at_unix_ms }
                : {}),
            },
          });
        } else if (event.type === 'anvil_receipt') {
          const data = event as typeof event & {
            desktop_trust_status?: string;
            source_dependency_digest?: string;
          };
          if (data.desktop_trust_status !== 'active') continue;
          append({
            eventId: event.event_id,
            identity: context.identity,
            observedAt,
            type: 'trusted-receipt',
            receipt: {
              id: event.receipt_id,
              kind: 'artifact',
              authority: 'core',
              identity: context.identity,
              observedAt,
              origin: 'core/anvil',
              contractVersion: event.contract_version,
              producerSessionId: event.session_id,
              producerRunId: event.run_id,
              producerTaskId: event.task_id,
              producerSequence: event.sequence,
              artifactDigest: event.artifact_digest,
              gateClosureDigest: event.gate_closure_digest,
              bodyDigest: event.receipt_body_digest,
              ...(data.source_dependency_digest ? { sourceDependencyDigest: data.source_dependency_digest } : {}),
              status: 'verified',
            },
          });
        } else if (event.type === 'anvil_receipt_invalidated') {
          append({
            eventId: event.event_id,
            identity: context.identity,
            observedAt,
            type: 'receipt-invalidated',
            receiptId: event.receipt_id,
            status: event.reason === 'gate_revoked' ? 'source-dependency-stale' : 'receipt-stale',
            reason: event.reason,
            priorArtifactDigest: event.prior_artifact_digest,
            ...('observed_artifact_digest' in event && typeof event.observed_artifact_digest === 'string'
              ? { observedArtifactDigest: event.observed_artifact_digest }
              : {}),
          });
        } else if (event.type === 'anvil_trust_changed') {
          for (const receiptId of event.receipt_ids) {
            append({
              eventId: `${message.id}:trust:${receiptId}`,
              identity: context.identity,
              observedAt,
              type: 'receipt-invalidated',
              receiptId,
              status: event.reason.includes('source') ? 'source-dependency-stale' : 'receipt-stale',
              reason: event.reason,
            });
          }
        }
      } catch {
        append({
          eventId: `${message.id}:rejected`,
          identity: context.identity,
          observedAt,
          type: 'evidence-rejected',
          reason: 'malformed-persisted-core-evidence',
        });
      }
    } else if (message.type === 'cron_trigger') {
      append({
        eventId: `${message.id}:cron-trigger`,
        identity: context.identity,
        observedAt,
        type: 'activity',
        activity: {
          id: message.id,
          kind: 'system',
          name: `Scheduled run: ${message.content.cronJobName}`,
          status: 'completed',
          detail: `cron ${message.content.cronJobId} triggered at ${message.content.triggeredAt}`,
        },
      });
    } else if (message.type === 'activity') {
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
