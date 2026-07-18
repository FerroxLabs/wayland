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
  return snapshot.cost.status === 'authoritative' ? snapshot.cost.amount : null;
}
