/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExecutionCitation, ExecutionSnapshot } from './types';

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

/**
 * The effective source/citation ledger: the durable per-claim entries with
 * superseded revisions folded out, so the current cited state is what renders.
 * Superseded entries stay in `snapshot.citations` for provenance history.
 */
export function selectCitationLedger(snapshot: ExecutionSnapshot): readonly ExecutionCitation[] {
  const superseded = new Set(
    snapshot.citations.flatMap((citation) => (citation.supersedes ? [citation.supersedes] : []))
  );
  return snapshot.citations.filter((citation) => !superseded.has(citation.id));
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
