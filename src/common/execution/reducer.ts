/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveEffectiveGovernance } from './policy';
import type {
  ExecutionEvent,
  ExecutionIdentity,
  ExecutionLifecycle,
  ExecutionProjectionOptions,
  ExecutionReceipt,
  ExecutionSeed,
  ExecutionSnapshot,
  GovernanceConstraint,
} from './types';

const DEFAULT_MAX_EVENTS = 4096;
const DEFAULT_MAX_ACTIVITIES = 512;
const DEFAULT_MAX_PLAN_STEPS = 256;
const DEFAULT_MAX_RECEIPTS = 512;
const DEFAULT_MAX_OUTCOMES = 256;
const DEFAULT_MAX_HANDOFFS = 32;
const EVENT_TYPES = new Set([
  'lifecycle',
  'activity',
  'plan',
  'spend-pause',
  'governance',
  'usage',
  'cost',
  'latency',
  'validation',
  'outcome',
  'handoff',
]);

function isExecutionEventEnvelope(value: unknown): value is ExecutionEvent {
  if (value === null || typeof value !== 'object') return false;
  const event = value as Partial<ExecutionEvent>;
  const identity = event.identity as Partial<ExecutionIdentity> | undefined;
  return (
    typeof event.eventId === 'string' &&
    Number.isSafeInteger(event.sequence) &&
    Number(event.sequence) >= 0 &&
    Number.isFinite(event.observedAt) &&
    typeof event.type === 'string' &&
    EVENT_TYPES.has(event.type) &&
    typeof identity?.runId === 'string' &&
    typeof identity.turnId === 'string' &&
    typeof identity.correlationId === 'string'
  );
}

function sameIdentity(left: ExecutionIdentity, right: ExecutionIdentity): boolean {
  return left.runId === right.runId && left.turnId === right.turnId && left.correlationId === right.correlationId;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function cloneAndFreeze<T>(value: T): Readonly<T> {
  return deepFreeze(structuredClone(value));
}

function transitionAllowed(
  current: ExecutionLifecycle,
  next: ExecutionLifecycle,
  action?: 'stop' | 'retry' | 'reopen' | 'resume'
): boolean {
  if (current === next) return true;
  if (action === 'stop') return next === 'cancelled' && !['completed', 'failed', 'cancelled'].includes(current);
  if (action === 'resume') return next === 'running' && (current === 'waiting' || current === 'blocked');
  if (action === 'retry') return next === 'queued' && (current === 'failed' || current === 'cancelled');
  if (action === 'reopen') return next === 'queued' && ['completed', 'failed', 'cancelled'].includes(current);

  const allowed: Readonly<Record<ExecutionLifecycle, readonly ExecutionLifecycle[]>> = {
    queued: ['running', 'waiting', 'blocked', 'cancelled'],
    running: ['waiting', 'blocked', 'completed', 'failed', 'cancelled'],
    waiting: ['failed', 'cancelled'],
    blocked: ['failed', 'cancelled'],
    completed: [],
    failed: [],
    cancelled: [],
  };
  return allowed[current].includes(next);
}

function authoritativeReceiptValid(event: ExecutionEvent, receipt: ExecutionReceipt | undefined): boolean {
  if (!receipt) return false;
  if (!sameIdentity(event.identity, receipt.identity)) return false;
  if (receipt.observedAt > event.observedAt) return false;
  if ((event.type === 'usage' || event.type === 'cost') && !['provider', 'flux'].includes(receipt.authority)) {
    return false;
  }
  if (event.type === 'usage' && (event.usage.receiptId !== receipt.id || receipt.kind !== 'usage')) return false;
  if (event.type === 'cost' && (event.cost.receiptId !== receipt.id || receipt.kind !== 'cost')) return false;
  if (event.type === 'latency' && (event.latency.receiptId !== receipt.id || receipt.kind !== 'latency')) return false;
  if (event.type === 'handoff' && (event.handoff.receiptId !== receipt.id || receipt.kind !== 'handoff')) return false;
  if (event.type === 'validation' && event.receipt && receipt.kind !== 'validation') return false;
  return true;
}

function costPayloadValid(event: Extract<ExecutionEvent, { type: 'cost' }>): boolean {
  const payload = event as unknown as {
    cost?: { status?: unknown; amount?: unknown; currency?: unknown; receiptId?: unknown };
    attempt?: { id?: unknown; providerId?: unknown; modelId?: unknown; role?: unknown };
    conversationTotal?: unknown;
  };
  const cost = payload.cost;
  const attempt = payload.attempt;
  return Boolean(
    cost?.status === 'authoritative' &&
    typeof cost.amount === 'number' &&
    Number.isFinite(cost.amount) &&
    cost.amount >= 0 &&
    typeof cost.currency === 'string' &&
    cost.currency.trim() &&
    typeof cost.receiptId === 'string' &&
    cost.receiptId.trim() &&
    (payload.conversationTotal === undefined ||
      (typeof payload.conversationTotal === 'number' &&
        Number.isFinite(payload.conversationTotal) &&
        payload.conversationTotal >= 0)) &&
    (attempt === undefined ||
      (typeof attempt.id === 'string' &&
        attempt.id.trim() &&
        typeof attempt.providerId === 'string' &&
        attempt.providerId.trim() &&
        (attempt.modelId === undefined || (typeof attempt.modelId === 'string' && attempt.modelId.trim())) &&
        ['primary', 'retry', 'fallback'].includes(String(attempt.role))))
  );
}

export function createExecutionSnapshot(seed: ExecutionSeed): ExecutionSnapshot {
  return cloneAndFreeze({
    identity: seed.identity,
    actor: seed.actor,
    scope: seed.scope,
    lifecycle: 'queued' as const,
    governance: {
      requested: seed.requestedGovernance,
      effective: {
        status: 'unavailable' as const,
        mode: 'ask' as const,
        enforceability: 'advisory' as const,
        receiptIds: [],
        reasons: ['policy-not-observed'],
      },
    },
    activities: [],
    plan: [],
    planHistory: [],
    usage: { status: 'unavailable' as const, reason: 'authoritative-usage-not-observed' },
    cost: { status: 'unavailable' as const, reason: 'authoritative-cost-not-observed' },
    costLedger: {
      status: 'unavailable' as const,
      attempts: [],
      reason: 'authoritative-cost-not-observed',
    },
    latency: { status: 'unavailable' as const, reason: 'authoritative-latency-not-observed' },
    validation: { status: 'unvalidated' as const },
    receipts: [],
    outcomes: [],
    handoffs: [],
    integrity: { status: 'valid' as const, reasons: [], lastSequence: -1 },
    mcp: { status: 'unsupported' as const, reason: 'versioned M1M evidence unavailable' as const },
  });
}

export function projectExecution(
  seed: ExecutionSeed,
  inputEvents: readonly ExecutionEvent[],
  options: ExecutionProjectionOptions
): ExecutionSnapshot {
  const maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
  const maxActivities = options.maxActivities ?? DEFAULT_MAX_ACTIVITIES;
  const maxPlanSteps = options.maxPlanSteps ?? DEFAULT_MAX_PLAN_STEPS;
  const maxReceipts = options.maxReceipts ?? DEFAULT_MAX_RECEIPTS;
  const maxOutcomes = options.maxOutcomes ?? DEFAULT_MAX_OUTCOMES;
  const maxHandoffs = options.maxHandoffs ?? DEFAULT_MAX_HANDOFFS;
  const initial = createExecutionSnapshot(seed);
  const reasons: string[] = [];
  const acceptedById = new Map<string, ExecutionEvent>();
  const acceptedBySequence = new Map<number, ExecutionEvent>();

  if (inputEvents.length > maxEvents) reasons.push('event-bound-exceeded');
  for (const rawEvent of inputEvents.slice(0, maxEvents) as readonly unknown[]) {
    if (!isExecutionEventEnvelope(rawEvent)) {
      reasons.push('malformed-or-unknown-critical-event');
      continue;
    }
    const event = rawEvent;
    const byId = acceptedById.get(event.eventId);
    const bySequence = acceptedBySequence.get(event.sequence);
    if (byId && JSON.stringify(byId) !== JSON.stringify(event)) {
      reasons.push(`conflicting-event-id:${event.eventId}`);
      continue;
    }
    if (bySequence && JSON.stringify(bySequence) !== JSON.stringify(event)) {
      reasons.push(`conflicting-sequence:${event.sequence}`);
      continue;
    }
    if (byId || bySequence) continue;
    acceptedById.set(event.eventId, event);
    acceptedBySequence.set(event.sequence, event);
  }

  const events = [...acceptedBySequence.values()].toSorted((left, right) => left.sequence - right.sequence);
  let lifecycle = initial.lifecycle;
  let governance = initial.governance.effective;
  let governanceConstraints: readonly GovernanceConstraint[] = [];
  let activities = [...initial.activities];
  let plan = [...initial.plan];
  let planHistory = [...initial.planHistory];
  let usage = initial.usage;
  let cost = initial.cost;
  let costLedger = initial.costLedger;
  let latency = initial.latency;
  let validation = initial.validation;
  let receipts = [...initial.receipts];
  let outcomes = [...initial.outcomes];
  let handoffs = [...initial.handoffs];
  let expectedSequence = 0;
  let lastSequence = -1;

  for (const event of events) {
    if (event.sequence !== expectedSequence) {
      reasons.push(`sequence-gap:${expectedSequence}->${event.sequence}`);
      break;
    }
    expectedSequence += 1;
    lastSequence = event.sequence;
    if (!sameIdentity(event.identity, seed.identity)) {
      reasons.push(`identity-mismatch:${event.eventId}`);
      continue;
    }
    if (event.observedAt > options.now) {
      reasons.push(`future-event:${event.eventId}`);
      continue;
    }

    const terminal = ['completed', 'failed', 'cancelled'].includes(lifecycle);
    if (terminal && event.type !== 'lifecycle') {
      reasons.push(`post-terminal-event:${event.eventId}`);
      continue;
    }

    if (event.type === 'lifecycle') {
      if (!transitionAllowed(lifecycle, event.lifecycle, event.action)) {
        reasons.push(`invalid-transition:${lifecycle}->${event.lifecycle}`);
        continue;
      }
      lifecycle = event.lifecycle;
    } else if (event.type === 'activity') {
      const index = activities.findIndex((activity) => activity.id === event.activity.id);
      if (index >= 0) activities[index] = structuredClone(event.activity);
      else activities = [...activities, structuredClone(event.activity)].slice(-maxActivities);
    } else if (event.type === 'plan') {
      if (!Array.isArray(event.steps)) {
        reasons.push(`malformed-plan:${event.eventId}`);
        continue;
      }
      if (event.steps.length > maxPlanSteps) reasons.push('plan-bound-exceeded');
      const revision = {
        id: event.revisionId ?? event.eventId,
        source: event.source ?? ('producer' as const),
        observedAt: event.observedAt,
        ...(event.reason ? { reason: event.reason } : {}),
        steps: structuredClone(event.steps.slice(0, maxPlanSteps)),
      };
      const existingRevision = planHistory.find((item) => item.id === revision.id);
      if (existingRevision && JSON.stringify(existingRevision) !== JSON.stringify(revision)) {
        reasons.push(`conflicting-plan-revision:${revision.id}`);
      } else {
        plan = structuredClone(event.steps.slice(0, maxPlanSteps));
        if (!existingRevision) planHistory = [...planHistory, revision].slice(-maxEvents);
      }
    } else if (event.type === 'spend-pause') {
      if (
        typeof event.limit !== 'number' ||
        !Number.isFinite(event.limit) ||
        event.limit < 0 ||
        typeof event.reason !== 'string' ||
        !event.reason.trim()
      ) {
        reasons.push(`invalid-spend-pause:${event.eventId}`);
        continue;
      }
      costLedger = {
        status: 'paused',
        attempts: costLedger.attempts,
        spendLimit: event.limit,
        reason: event.reason,
      };
    } else if (event.type === 'governance') {
      governanceConstraints = structuredClone(event.constraints);
      governance = resolveEffectiveGovernance(
        seed.requestedGovernance,
        governanceConstraints,
        seed.identity,
        seed.scope,
        options.now
      );
      if (governance.status === 'unavailable') reasons.push(...governance.reasons.map((reason) => `policy:${reason}`));
    } else if (event.type === 'usage' || event.type === 'cost' || event.type === 'latency') {
      if (event.type === 'cost' && !costPayloadValid(event)) {
        reasons.push(`invalid-authoritative-cost:${event.eventId}`);
        continue;
      }
      if (!authoritativeReceiptValid(event, event.receipt)) {
        reasons.push(`invalid-authoritative-receipt:${event.eventId}`);
        continue;
      }
      if (event.type === 'usage') usage = structuredClone(event.usage);
      if (event.type === 'cost') {
        cost = structuredClone(event.cost);
        const attemptInput = event.attempt;
        const attempt = {
          id: attemptInput?.id ?? event.eventId,
          providerId: attemptInput?.providerId ?? event.receipt.authority,
          ...(attemptInput?.modelId ? { modelId: attemptInput.modelId } : {}),
          role: attemptInput?.role ?? ('primary' as const),
          status: 'authoritative' as const,
          amount: event.cost.amount,
          currency: event.cost.currency,
          receiptId: event.receipt.id,
        };
        const existingAttempt = costLedger.attempts.find((item) => item.id === attempt.id);
        const reusedReceipt = costLedger.attempts.find(
          (item) => item.receiptId === attempt.receiptId && item.id !== attempt.id
        );
        let attempts = [...costLedger.attempts];
        if (reusedReceipt) {
          reasons.push(`reused-cost-receipt:${attempt.receiptId}`);
          costLedger = { status: 'mismatch', attempts: costLedger.attempts, reason: 'reused-cost-receipt' };
        } else if (existingAttempt && JSON.stringify(existingAttempt) !== JSON.stringify(attempt)) {
          reasons.push(`conflicting-cost-attempt:${attempt.id}`);
          costLedger = { status: 'mismatch', attempts: costLedger.attempts, reason: 'conflicting-cost-attempt' };
        } else if (!existingAttempt) {
          attempts = [...attempts, attempt];
          const currencies = new Set(attempts.flatMap((item) => (item.currency ? [item.currency] : [])));
          const total = Math.round(attempts.reduce((sum, item) => sum + (item.amount ?? 0), 0) * 1e12) / 1e12;
          const declaredMismatch =
            event.conversationTotal !== undefined &&
            (!Number.isFinite(event.conversationTotal) || Math.abs(event.conversationTotal - total) > 0.000001);
          if (currencies.size !== 1 || declaredMismatch || !Number.isFinite(total)) {
            reasons.push(`cost-total-mismatch:${event.eventId}`);
            costLedger = { status: 'mismatch', attempts, reason: 'authoritative-cost-reconciliation-failed' };
          } else {
            costLedger = {
              status: 'authoritative',
              attempts,
              total,
              currency: [...currencies][0],
            };
          }
        }
      }
      if (event.type === 'latency') latency = structuredClone(event.latency);
      receipts = [...receipts, structuredClone(event.receipt)].slice(-maxReceipts);
    } else if (event.type === 'validation') {
      if (event.receipt && !authoritativeReceiptValid(event, event.receipt)) {
        reasons.push(`invalid-validation-receipt:${event.eventId}`);
        continue;
      }
      validation = structuredClone(event.validation);
      if (event.receipt) receipts = [...receipts, structuredClone(event.receipt)].slice(-maxReceipts);
    } else if (event.type === 'outcome') {
      outcomes = [...outcomes, structuredClone(event.outcome)].slice(-maxOutcomes);
    } else if (event.type === 'handoff') {
      if (!authoritativeReceiptValid(event, event.receipt) || !sameIdentity(event.identity, event.handoff.identity)) {
        reasons.push(`invalid-handoff-receipt:${event.eventId}`);
        continue;
      }
      handoffs = [...handoffs, structuredClone(event.handoff)].slice(-maxHandoffs);
      receipts = [...receipts, structuredClone(event.receipt)].slice(-maxReceipts);
    }
  }

  if (governanceConstraints.length === 0) governance = initial.governance.effective;
  return cloneAndFreeze({
    identity: seed.identity,
    actor: seed.actor,
    scope: seed.scope,
    lifecycle,
    governance: { requested: seed.requestedGovernance, effective: governance },
    activities,
    plan,
    planHistory,
    usage,
    cost,
    costLedger,
    latency,
    validation,
    receipts,
    outcomes,
    handoffs,
    integrity: {
      status: reasons.length === 0 ? ('valid' as const) : ('invalid' as const),
      reasons: [...new Set(reasons)].toSorted(),
      lastSequence,
    },
    mcp: { status: 'unsupported' as const, reason: 'versioned M1M evidence unavailable' as const },
  });
}
