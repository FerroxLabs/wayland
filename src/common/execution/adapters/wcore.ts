/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { toolGroupCommand } from '@/common/chat/activity/projectMessages';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';
import type { ActivityNode, IMessageExecutionEvidence, IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
import type { DeclaredArtifactType, ExecutionActivity, ExecutionEvent, ExecutionPlanStep } from '../types';
import type { ExecutionAdapterContext } from './types';

type OfficeCliValidation = Readonly<{ declaredType: DeclaredArtifactType; status: 'valid' | 'invalid' }>;

/**
 * Recognise an `officecli validate` tool run and map its terminal outcome onto
 * the canonical type-aware validation slot (COW-05). Only a completed run with
 * an inferable native target type is promoted; anything still running, or a
 * different tool, produces no validation evidence. This is desktop-observable
 * (officecli is a bundled tool) and needs no Core protocol change.
 */
function detectOfficeCliValidation(tool: IMessageToolGroup['content'][number]): OfficeCliValidation | null {
  const text = `${tool.name} ${tool.description ?? ''}`;
  if (!/officecli/i.test(text) || !/\bvalidate\b/i.test(text)) return null;
  const typeMatch = text.match(/\.(docx|pdf|xlsx|pptx)\b/i);
  if (!typeMatch) return null;
  const declaredType = typeMatch[1].toLowerCase() as DeclaredArtifactType;
  if (tool.status === 'Success') return { declaredType, status: 'valid' };
  if (tool.status === 'Error') return { declaredType, status: 'invalid' };
  return null;
}

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

/** Tool states from which a tool cannot leave. Used to settle a tool-only turn. */
const TERMINAL_TOOL_STATUSES = new Set<string>(['Success', 'Error', 'Canceled']);

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
            // Same masking obligation as the tool_group branch below: `detail`
            // reaches a rendered label. `command` was being dropped entirely,
            // which also cost these steps their real labels ("Running a
            // command" instead of the command).
            detail: node.detail ? redactCommandSecrets(node.detail) : undefined,
            ...(node.command ? { command: redactCommandSecrets(node.command) } : {}),
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
      // A tool that has been dispatched proves the run left the queue. WCore
      // emits lifecycle only via `activity` messages, which a plain tool-running
      // turn never produces - so the rail sat on "queued" while the work was
      // visibly finishing. Advance to `running` only; completion is a claim this
      // message cannot support, and the reducer ignores a repeat.
      if (message.content.length > 0) {
        append({
          eventId: `${message.id}:lifecycle:running`,
          identity: context.identity,
          observedAt,
          type: 'lifecycle',
          lifecycle: 'running',
        });
      }
      for (const tool of message.content) {
        const command = toolGroupCommand(tool);
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
            // Both fields reach a rendered label, so both are masked (#610).
            // A cross-audit reproduced the gap: a web_search whose detail read
            // `query: client_secret=...` rendered the live secret in the label
            // even though `command` beside it was correctly redacted.
            detail: tool.description ? redactCommandSecrets(tool.description) : undefined,
            ...(command ? { command } : {}),
          },
        });
        const officeValidation = detectOfficeCliValidation(tool);
        if (officeValidation) {
          append({
            eventId: `${message.id}:validation:${tool.callId}`,
            identity: context.identity,
            observedAt,
            type: 'validation',
            validation: {
              status: officeValidation.status,
              declaredType: officeValidation.declaredType,
              method: 'officecli',
              ...(tool.description ? { reason: tool.description } : {}),
            },
          });
        }
      }
    }
  }

  // Settle a tool-only turn. WCore emits a terminal lifecycle only through
  // `activity` messages, which such a turn never produces, so without this a
  // run that finished hours ago still reloads from the DB wearing a blue
  // "running" tag - the same class of lie as the "queued" it replaced.
  //
  // Safe because the projection is rebuilt from the whole window on every
  // render rather than accumulated: mid-turn, the next tool re-enters the
  // window and the run reads `running` again on its own.
  const toolStatuses = messages
    .filter((message): message is IMessageToolGroup => message.type === 'tool_group')
    .flatMap((message) => message.content.map((tool) => tool.status));
  const settled =
    toolStatuses.length > 0 && toolStatuses.every((status) => TERMINAL_TOOL_STATUSES.has(status as string));
  if (settled && !messages.some((message) => message.type === 'activity')) {
    append({
      eventId: `${context.identity.runId}:lifecycle:completed`,
      identity: context.identity,
      observedAt: context.observedAt,
      type: 'lifecycle',
      lifecycle: 'completed',
    });
  }
  return events;
}
