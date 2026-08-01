/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  createExecutionSnapshot,
  projectExecution,
  type ExecutionEvent,
  type ExecutionLifecycle,
  type ExecutionSeed,
} from '@/common/execution';

const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const seed: ExecutionSeed = {
  identity,
  actor: { backend: 'wcore', agentId: 'core', providerId: 'openai', modelId: 'gpt-test' },
  scope: { projectId: 'project-1', workspaceId: 'workspace-1', host: 'desktop', trust: 'trusted', scheduled: false },
  requestedGovernance: { mode: 'autopilot', enforceability: 'enforced' },
};
const now = 1_000;

function lifecycle(
  sequence: number,
  next: ExecutionLifecycle,
  action?: 'stop' | 'retry' | 'reopen' | 'resume'
): ExecutionEvent {
  return {
    eventId: `event-${sequence}-${next}-${action ?? 'normal'}`,
    sequence,
    identity,
    observedAt: now,
    type: 'lifecycle',
    lifecycle: next,
    action,
  };
}

describe('execution reducer', () => {
  it('projects the golden queued, waiting, resume, and completion journey', () => {
    const events = [
      lifecycle(0, 'running'),
      lifecycle(1, 'waiting'),
      lifecycle(2, 'running', 'resume'),
      lifecycle(3, 'completed'),
    ];
    const result = projectExecution(seed, events, { now });
    expect(result.lifecycle).toBe('completed');
    expect(result.integrity).toEqual({ status: 'valid', reasons: [], lastSequence: 3 });
  });

  it('requires explicit retry, stop, and reopen transitions', () => {
    const result = projectExecution(
      seed,
      [
        lifecycle(0, 'running'),
        lifecycle(1, 'failed'),
        lifecycle(2, 'queued', 'retry'),
        lifecycle(3, 'running'),
        lifecycle(4, 'cancelled', 'stop'),
        lifecycle(5, 'queued', 'reopen'),
      ],
      { now }
    );
    expect(result.lifecycle).toBe('queued');
    expect(result.integrity.status).toBe('valid');
  });

  it('sorts out-of-order events and ignores exact duplicates idempotently', () => {
    const first = lifecycle(0, 'running');
    const second = lifecycle(1, 'waiting');
    const result = projectExecution(seed, [second, first, structuredClone(first)], { now });
    expect(result.lifecycle).toBe('waiting');
    expect(result.integrity.status).toBe('valid');
    expect(result.integrity.lastSequence).toBe(1);
  });

  it('fails closed on gaps, conflicting duplicates, and post-terminal events', () => {
    const conflicting = { ...lifecycle(0, 'waiting'), eventId: lifecycle(0, 'running').eventId };
    const postTerminal: ExecutionEvent = {
      eventId: 'post-terminal',
      sequence: 2,
      identity,
      observedAt: now,
      type: 'outcome',
      outcome: { id: 'file-1', kind: 'file', label: 'report' },
    };
    const result = projectExecution(
      seed,
      [lifecycle(0, 'running'), conflicting, lifecycle(1, 'completed'), postTerminal],
      {
        now,
      }
    );
    expect(result.integrity.status).toBe('invalid');
    expect(result.integrity.reasons).toEqual(
      expect.arrayContaining(['conflicting-event-id:event-0-running-normal', 'post-terminal-event:post-terminal'])
    );

    const gap = projectExecution(seed, [lifecycle(1, 'running')], { now });
    expect(gap.integrity.reasons).toContain('sequence-gap:0->1');
  });

  it('fails closed instead of crashing on malformed or unknown critical events', () => {
    const malformed = { eventId: 'bad', sequence: 0, type: 'future-critical-event' } as unknown as ExecutionEvent;
    const result = projectExecution(seed, [malformed], { now });
    expect(result.integrity.reasons).toContain('malformed-or-unknown-critical-event');
    expect(result.lifecycle).toBe('queued');
  });

  it('enforces bounds and does not mutate caller-owned values', () => {
    const mutable = [lifecycle(0, 'running'), lifecycle(1, 'waiting')];
    const before = structuredClone(mutable);
    const result = projectExecution(seed, mutable, { now, maxEvents: 1 });
    expect(result.integrity.reasons).toContain('event-bound-exceeded');
    expect(mutable).toEqual(before);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.identity)).toBe(true);
  });

  it('starts without inventing MCP, usage, cost, latency, or policy authority', () => {
    const result = createExecutionSnapshot(seed);
    expect(result.mcp).toEqual({ status: 'unsupported', reason: 'versioned M1M evidence unavailable' });
    expect(result.usage.status).toBe('unavailable');
    expect(result.cost.status).toBe('unavailable');
    expect(result.latency.status).toBe('unavailable');
    expect(result.governance.effective.status).toBe('unavailable');
  });

  it('accepts observed provider economics and fails closed on missing receipt evidence', () => {
    const usageReceipt = {
      id: 'usage-receipt',
      kind: 'usage' as const,
      authority: 'provider' as const,
      identity,
      observedAt: now,
    };
    const valid: ExecutionEvent = {
      eventId: 'usage-1',
      sequence: 0,
      identity,
      observedAt: now,
      type: 'usage',
      usage: {
        status: 'authoritative',
        inputTokens: 10,
        outputTokens: 5,
        cachedTokens: 2,
        receiptId: usageReceipt.id,
      },
      receipt: usageReceipt,
    };
    const accepted = projectExecution(seed, [valid], { now });
    expect(accepted.usage).toMatchObject({ status: 'authoritative', inputTokens: 10 });
    expect(accepted.integrity.status).toBe('valid');

    const missingReceipt = { ...valid, eventId: 'usage-missing', receipt: undefined } as unknown as ExecutionEvent;
    const rejected = projectExecution(seed, [missingReceipt], { now });
    expect(rejected.usage.status).toBe('unavailable');
    expect(rejected.integrity.reasons).toContain('invalid-authoritative-receipt:usage-missing');
  });

  it('keeps append-only plan provenance and rejects a conflicting revision', () => {
    const first: ExecutionEvent = {
      eventId: 'plan-event-1',
      sequence: 0,
      identity,
      observedAt: now,
      type: 'plan',
      revisionId: 'revision-1',
      source: 'producer',
      steps: [{ id: 'step-1', content: 'Research', status: 'in-progress' }],
    };
    const conflict: ExecutionEvent = {
      ...first,
      eventId: 'plan-event-2',
      sequence: 1,
      steps: [{ id: 'step-1', content: 'Delete evidence', status: 'completed' }],
    };
    const result = projectExecution(seed, [first, conflict], { now });
    expect(result.planHistory).toHaveLength(1);
    expect(result.planHistory[0].steps[0].content).toBe('Research');
    expect(result.plan[0].content).toBe('Research');
    expect(result.integrity.reasons).toContain('conflicting-plan-revision:revision-1');
  });

  it('reconciles receipt-backed primary, retry, and fallback cost attempts', () => {
    const costEvent = (sequence: number, role: 'primary' | 'retry' | 'fallback', amount: number): ExecutionEvent => ({
      eventId: `cost-${sequence}`,
      sequence,
      identity,
      observedAt: now,
      type: 'cost',
      cost: { status: 'authoritative', amount, currency: 'USD', receiptId: `receipt-${sequence}` },
      receipt: {
        id: `receipt-${sequence}`,
        kind: 'cost',
        authority: 'flux',
        identity,
        observedAt: now,
      },
      attempt: { id: `attempt-${sequence}`, providerId: 'flux', role },
      conversationTotal: sequence === 2 ? 0.6 : undefined,
    });
    const result = projectExecution(
      seed,
      [costEvent(0, 'primary', 0.1), costEvent(1, 'retry', 0.2), costEvent(2, 'fallback', 0.3)],
      { now }
    );
    expect(result.costLedger).toMatchObject({ status: 'authoritative', total: 0.6, currency: 'USD' });
    expect(result.costLedger.attempts.map((attempt) => attempt.role)).toEqual(['primary', 'retry', 'fallback']);
  });

  it('fails closed on an authoritative cost total mismatch and supports spend pause', () => {
    const mismatch: ExecutionEvent = {
      eventId: 'cost-mismatch',
      sequence: 0,
      identity,
      observedAt: now,
      type: 'cost',
      cost: { status: 'authoritative', amount: 1, currency: 'USD', receiptId: 'receipt-cost' },
      receipt: { id: 'receipt-cost', kind: 'cost', authority: 'provider', identity, observedAt: now },
      conversationTotal: 99,
    };
    const rejected = projectExecution(seed, [mismatch], { now });
    expect(rejected.costLedger.status).toBe('mismatch');
    expect(rejected.integrity.reasons).toContain('cost-total-mismatch:cost-mismatch');

    const paused = projectExecution(
      seed,
      [
        {
          eventId: 'pause-1',
          sequence: 0,
          identity,
          observedAt: now,
          type: 'spend-pause',
          limit: 5,
          reason: 'User budget reached',
        },
      ],
      { now }
    );
    expect(paused.costLedger).toMatchObject({ status: 'paused', spendLimit: 5, reason: 'User budget reached' });
  });

  it('rejects negative cost and receipt reuse without exposing an authoritative total', () => {
    const receipt = { id: 'one-receipt', kind: 'cost' as const, authority: 'flux' as const, identity, observedAt: now };
    const negative: ExecutionEvent = {
      eventId: 'negative-cost',
      sequence: 0,
      identity,
      observedAt: now,
      type: 'cost',
      cost: { status: 'authoritative', amount: -1, currency: 'USD', receiptId: receipt.id },
      receipt,
    };
    const rejected = projectExecution(seed, [negative], { now });
    expect(rejected.costLedger.status).toBe('unavailable');
    expect(rejected.integrity.reasons).toContain('invalid-authoritative-cost:negative-cost');

    const first: ExecutionEvent = {
      eventId: 'cost-1',
      sequence: 0,
      identity,
      observedAt: now,
      type: 'cost',
      cost: { status: 'authoritative', amount: 1, currency: 'USD', receiptId: receipt.id },
      receipt,
      attempt: { id: 'attempt-1', providerId: 'flux', role: 'primary' },
    };
    const replay: ExecutionEvent = {
      ...first,
      eventId: 'cost-2',
      sequence: 1,
      attempt: { id: 'attempt-2', providerId: 'flux', role: 'retry' },
    };
    const reused = projectExecution(seed, [first, replay], { now });
    expect(reused.costLedger.status).toBe('mismatch');
    expect(reused.integrity.reasons).toContain('reused-cost-receipt:one-receipt');
  });
});
