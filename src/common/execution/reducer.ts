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
    usage: { status: 'unavailable' as const, reason: 'authoritative-usage-not-observed' },
    cost: { status: 'unavailable' as const, reason: 'authoritative-cost-not-observed' },
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
  let usage = initial.usage;
  let cost = initial.cost;
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
      if (event.steps.length > maxPlanSteps) reasons.push('plan-bound-exceeded');
      plan = structuredClone(event.steps.slice(0, maxPlanSteps));
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
      if (!authoritativeReceiptValid(event, event.receipt)) {
        reasons.push(`invalid-authoritative-receipt:${event.eventId}`);
        continue;
      }
      if (event.type === 'usage') usage = structuredClone(event.usage);
      if (event.type === 'cost') cost = structuredClone(event.cost);
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
    usage,
    cost,
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
