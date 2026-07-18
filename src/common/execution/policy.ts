/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  EffectiveGovernance,
  Enforceability,
  ExecutionIdentity,
  ExecutionScope,
  GovernanceConstraint,
  GovernanceMode,
  GovernanceRequest,
  PolicySource,
} from './types';

const MODE_RANK: Readonly<Record<GovernanceMode, number>> = {
  ask: 0,
  'trusted-edits': 1,
  autopilot: 2,
};

const ENFORCEABILITY_RANK: Readonly<Record<Enforceability, number>> = {
  advisory: 0,
  brokered: 1,
  enforced: 2,
};

function sameIdentity(left: ExecutionIdentity, right: ExecutionIdentity): boolean {
  return left.runId === right.runId && left.turnId === right.turnId && left.correlationId === right.correlationId;
}

function minimumMode(values: readonly GovernanceMode[]): GovernanceMode {
  return values.reduce((current, next) => (MODE_RANK[next] < MODE_RANK[current] ? next : current));
}

function minimumEnforceability(values: readonly Enforceability[]): Enforceability {
  return values.reduce((current, next) => (ENFORCEABILITY_RANK[next] < ENFORCEABILITY_RANK[current] ? next : current));
}

function requiredSources(scope: ExecutionScope): readonly PolicySource[] {
  const sources: PolicySource[] = ['workspace', 'backend', 'host'];
  if (scope.scheduled) sources.push('scheduler');
  if (scope.channel) sources.push('channel');
  return sources;
}

export function resolveEffectiveGovernance(
  requested: GovernanceRequest,
  constraints: readonly GovernanceConstraint[],
  identity: ExecutionIdentity,
  scope: ExecutionScope,
  now: number
): EffectiveGovernance {
  const reasons: string[] = [];
  const bySource = new Map<PolicySource, GovernanceConstraint>();

  for (const constraint of constraints) {
    const existing = bySource.get(constraint.source);
    if (existing && JSON.stringify(existing) !== JSON.stringify(constraint)) {
      reasons.push(`conflicting-${constraint.source}-constraint`);
      continue;
    }
    if (!sameIdentity(constraint.identity, identity)) reasons.push(`${constraint.source}-identity-mismatch`);
    if (constraint.host !== scope.host) reasons.push(`${constraint.source}-host-mismatch`);
    if (constraint.observedAt > now || constraint.expiresAt <= now) reasons.push(`${constraint.source}-stale`);
    if (!constraint.receiptId) reasons.push(`${constraint.source}-missing-receipt`);
    bySource.set(constraint.source, constraint);
  }

  for (const source of requiredSources(scope)) {
    if (!bySource.has(source)) reasons.push(`missing-${source}-constraint`);
  }

  if (reasons.length > 0) {
    return {
      status: 'unavailable',
      mode: 'ask',
      enforceability: 'advisory',
      receiptIds: [],
      reasons: [...new Set(reasons)].toSorted(),
    };
  }

  const accepted = [...bySource.values()];
  return {
    status: 'effective',
    mode: minimumMode([requested.mode, ...accepted.map((constraint) => constraint.mode)]),
    enforceability: minimumEnforceability([
      requested.enforceability,
      ...accepted.map((constraint) => constraint.enforceability),
    ]),
    receiptIds: accepted.map((constraint) => constraint.receiptId).toSorted(),
    reasons: [],
  };
}
