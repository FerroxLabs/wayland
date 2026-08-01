/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { transformMessage, type IMessageExecutionEvidence, type TMessage } from '@/common/chat/chatLib';
import {
  adaptWCoreMessages,
  evaluateConsequentialAction,
  projectExecution,
  selectCurrentExecutionMessages,
  type ExecutionEvent,
  type ExecutionSeed,
} from '@/common/execution';
import { describe, expect, it } from 'vitest';

const now = 2_000;
const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const digest = (char: string): string => `sha256:${char.repeat(64)}`;
const seed: ExecutionSeed = {
  identity,
  actor: { backend: 'wcore', agentId: 'core' },
  scope: {
    workspaceId: 'workspace-1',
    host: 'desktop',
    trust: 'trusted',
    scheduled: false,
    teamId: 'team-1',
    browserSessionId: 'browser-1',
    surface: 'browser',
  },
  requestedGovernance: { mode: 'trusted-edits', enforceability: 'enforced' },
};

function evidence(event: IMessageExecutionEvidence['content']['event'], acceptedAt = now): TMessage {
  const transformed = transformMessage({
    type: 'execution_evidence',
    conversation_id: 'conversation-1',
    msg_id: '',
    data: { acceptedBy: 'desktop-core-v1-consumer', acceptedAt, event },
  });
  if (!transformed) throw new Error('expected accepted evidence');
  return transformed;
}

const receiptEvent = {
  type: 'anvil_receipt' as const,
  receipt_id: 'receipt-1',
  event_id: 'receipt-event-1',
  origin: 'core/anvil' as const,
  contract_version: '1.0',
  session_id: 'session-1',
  run_id: 'producer-run-1',
  task_id: 'task-1',
  sequence: 0,
  artifact_digest: digest('a'),
  gate_closure_digest: digest('b'),
  receipt_body_digest: digest('c'),
  desktop_trust_status: 'active',
};

const policyEvent = {
  type: 'execution_policy' as const,
  critical: true as const,
  contract_version: '1.0',
  revision: 0,
  reason: 'launch' as const,
  effective_at_unix_ms: now,
  policy: {
    posture: 'managed' as const,
    approvals: 'auto_edit' as const,
    sandbox: 'required' as const,
    source: 'wayland-core',
    managed_floor_active: true,
  },
};

describe('trusted Core outcome transport and projection', () => {
  it('keeps raw renderer IPC inert and accepts only the main-process envelope', () => {
    expect(
      transformMessage({
        type: 'anvil_receipt',
        conversation_id: 'conversation-1',
        msg_id: '',
        data: receiptEvent,
      })
    ).toBeUndefined();
    expect(
      transformMessage({
        type: 'execution_evidence',
        conversation_id: 'conversation-1',
        msg_id: '',
        data: { acceptedBy: 'forged-renderer', acceptedAt: now, event: receiptEvent },
      })
    ).toBeUndefined();
    expect(evidence(receiptEvent)).toMatchObject({ type: 'execution_evidence', hidden: true });
  });

  it('fails closed instead of crashing on malformed persisted evidence', () => {
    const malformed = {
      id: 'execution-evidence:malformed',
      type: 'execution_evidence',
      conversation_id: 'conversation-1',
      hidden: true,
      createdAt: now,
      content: {
        acceptedBy: 'desktop-core-v1-consumer',
        acceptedAt: now,
        event: { type: 'execution_policy', contract_version: 7 },
      },
    } as unknown as TMessage;
    const result = projectExecution(seed, adaptWCoreMessages([malformed], { identity, observedAt: now }), { now });
    expect(result.integrity).toMatchObject({
      status: 'invalid',
      reasons: ['rejected-evidence:malformed-persisted-core-evidence'],
    });
  });

  it('replays policy and receipt evidence into verified canonical state', () => {
    const events = adaptWCoreMessages([evidence(policyEvent), evidence(receiptEvent)], {
      identity,
      observedAt: now,
    });
    const result = projectExecution(seed, events, { now });
    expect(result.integrity.status).toBe('valid');
    expect(result.trustedPolicy).toMatchObject({ status: 'trusted', revision: 0, approvals: 'auto_edit' });
    expect(result.outcomeTrust).toEqual([
      expect.objectContaining({ receiptId: 'receipt-1', artifactDigest: digest('a'), status: 'verified' }),
    ]);
  });

  it('replays the latest trusted policy but never an old turn receipt into a new turn', () => {
    const policy = evidence(policyEvent);
    const oldReceipt = evidence(receiptEvent);
    const messages = [
      policy,
      {
        id: 'user-old',
        type: 'text',
        position: 'right',
        conversation_id: 'conversation-1',
        content: { content: 'old' },
      },
      oldReceipt,
      {
        id: 'user-new',
        type: 'text',
        position: 'right',
        conversation_id: 'conversation-1',
        content: { content: 'new' },
      },
      {
        id: 'activity-new',
        type: 'activity',
        conversation_id: 'conversation-1',
        content: { turnId: 'turn-new', nodes: [], status: 'running' },
      },
    ] as TMessage[];
    const selected = selectCurrentExecutionMessages('wcore', messages);
    expect(selected).toContain(policy);
    expect(selected).not.toContain(oldReceipt);
    expect(selected.map((message) => message.id)).toContain('activity-new');
  });

  it('fails closed on mutation, reconnect, and source dependency invalidation', () => {
    const invalidated = evidence({
      type: 'anvil_receipt_invalidated',
      receipt_id: 'receipt-1',
      event_id: 'invalidation-1',
      origin: 'core/anvil',
      contract_version: '1.0',
      session_id: 'session-1',
      run_id: 'producer-run-1',
      task_id: 'task-1',
      sequence: 1,
      reason: 'artifact_mutated',
      prior_artifact_digest: digest('a'),
      invalidation_body_digest: digest('d'),
    });
    const mutationResult = projectExecution(
      seed,
      adaptWCoreMessages([evidence(receiptEvent), invalidated], { identity, observedAt: now }),
      { now }
    );
    expect(mutationResult.outcomeTrust[0]).toMatchObject({ status: 'receipt-stale', reason: 'artifact_mutated' });

    const reconnectResult = projectExecution(
      seed,
      adaptWCoreMessages(
        [
          evidence(receiptEvent),
          evidence({
            type: 'anvil_trust_changed',
            receipt_ids: ['receipt-1'],
            status: 'historical',
            reason: 'disconnected',
            requires_fresh_core_validation: true,
          }),
        ],
        { identity, observedAt: now }
      ),
      { now }
    );
    expect(reconnectResult.outcomeTrust[0]).toMatchObject({ status: 'receipt-stale', reason: 'disconnected' });

    const gateRevoked = evidence({
      type: 'anvil_receipt_invalidated',
      receipt_id: 'receipt-1',
      event_id: 'invalidation-2',
      origin: 'core/anvil',
      contract_version: '1.0',
      session_id: 'session-1',
      run_id: 'producer-run-1',
      task_id: 'task-1',
      sequence: 1,
      reason: 'gate_revoked',
      prior_artifact_digest: digest('a'),
      invalidation_body_digest: digest('e'),
    });
    const sourceResult = projectExecution(
      seed,
      adaptWCoreMessages([evidence(receiptEvent), gateRevoked], { identity, observedAt: now }),
      { now }
    );
    expect(sourceResult.outcomeTrust[0]).toMatchObject({ status: 'source-dependency-stale' });
  });

  it('refuses unsupported contracts and mismatched artifact bindings', () => {
    const unsupported = adaptWCoreMessages([evidence({ ...receiptEvent, contract_version: '2.0' })], {
      identity,
      observedAt: now,
    });
    expect(projectExecution(seed, unsupported, { now }).integrity.reasons).toContain(
      'invalid-trusted-receipt:receipt-event-1'
    );

    const receipt = adaptWCoreMessages([evidence(receiptEvent)], { identity, observedAt: now })[0];
    const outcome: ExecutionEvent = {
      eventId: 'outcome-1',
      sequence: 1,
      identity,
      observedAt: now,
      type: 'outcome',
      outcome: {
        id: 'artifact-1',
        kind: 'artifact',
        label: 'Report',
        receiptId: 'receipt-1',
        artifactDigest: digest('f'),
      },
    };
    const result = projectExecution(seed, [receipt, outcome], { now });
    expect(result.outcomeTrust[0]).toMatchObject({ status: 'receipt-stale', reason: 'artifact-digest-mismatch' });
  });
});

describe('consequential policy decision', () => {
  function acceptedSnapshot() {
    const constraint = (source: 'workspace' | 'backend' | 'host') => ({
      source,
      mode: 'trusted-edits' as const,
      enforceability: 'enforced' as const,
      identity,
      host: 'desktop' as const,
      observedAt: now - 10,
      expiresAt: now + 10_000,
      receiptId: `${source}-policy`,
    });
    const events = adaptWCoreMessages([evidence(policyEvent)], { identity, observedAt: now });
    const governance: ExecutionEvent = {
      eventId: 'governance-1',
      sequence: 1,
      identity,
      observedAt: now,
      type: 'governance',
      constraints: [constraint('workspace'), constraint('backend'), constraint('host')],
    };
    return projectExecution(seed, [events[0], governance], { now });
  }

  it('allows an exact-scope action and requires the user for authority widening', () => {
    const snapshot = acceptedSnapshot();
    const action = {
      identity,
      destination: 'https://example.test/publish',
      effect: 'Publish the approved report',
      requestedMode: 'trusted-edits' as const,
      scope: {
        host: 'desktop' as const,
        scheduled: false,
        teamId: 'team-1',
        browserSessionId: 'browser-1',
        surface: 'browser' as const,
      },
    };
    expect(evaluateConsequentialAction(snapshot, action, now)).toEqual({ status: 'allowed', reasons: [] });
    expect(
      evaluateConsequentialAction(
        snapshot,
        { ...action, scope: { ...action.scope, scheduled: true, teamId: 'other-team' } },
        now
      )
    ).toMatchObject({
      status: 'needs-you',
      reasons: expect.arrayContaining(['schedule-scope-widening', 'team-scope-widening']),
    });
  });
});
