/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExecutionSnapshot } from './types';

export function selectExecutionProgress(snapshot: ExecutionSnapshot): Readonly<{
  completed: number;
  total: number;
  percent: number;
}> {
  const total = snapshot.plan.length;
  const completed = snapshot.plan.filter((step) => step.status === 'completed').length;
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function selectExecutionNeedsAttention(snapshot: ExecutionSnapshot): boolean {
  return (
    snapshot.integrity.status === 'invalid' ||
    snapshot.lifecycle === 'blocked' ||
    snapshot.lifecycle === 'failed' ||
    snapshot.validation.status === 'invalid' ||
    snapshot.handoffs.some((handoff) => handoff.unresolvedSideEffects.length > 0)
  );
}

export function selectAuthoritativeSpend(snapshot: ExecutionSnapshot): number | null {
  return snapshot.costLedger.status === 'authoritative' ? (snapshot.costLedger.total ?? null) : null;
}

/** Canonical view consumed by both the conversation thread and mission rail. */
export function selectCanonicalRunSnapshot(snapshot: ExecutionSnapshot) {
  return {
    identity: snapshot.identity,
    lifecycle: snapshot.lifecycle,
    integrity: snapshot.integrity,
    progress: selectExecutionProgress(snapshot),
    plan: snapshot.plan,
    planHistory: snapshot.planHistory,
    activities: snapshot.activities,
    outcomes: snapshot.outcomes,
    handoffs: snapshot.handoffs,
    costLedger: snapshot.costLedger,
    needsAttention: selectExecutionNeedsAttention(snapshot),
  } as const;
}
