/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExecutionHost, ExecutionIdentity, ExecutionSnapshot, GovernanceMode } from './types';

export type ConsequentialActionPreview = Readonly<{
  identity: ExecutionIdentity;
  destination: string;
  effect: string;
  requestedMode: GovernanceMode;
  scope: Readonly<{
    host: ExecutionHost;
    scheduled: boolean;
    channel?: string;
    teamId?: string;
    browserSessionId?: string;
    surface?: 'chat' | 'team' | 'browser' | 'automation' | 'channel';
  }>;
}>;

export type ConsequentialPolicyDecision = Readonly<{
  status: 'allowed' | 'needs-you';
  reasons: readonly string[];
}>;

const MODE_RANK: Readonly<Record<GovernanceMode, number>> = {
  ask: 0,
  'trusted-edits': 1,
  autopilot: 2,
};

function sameIdentity(left: ExecutionIdentity, right: ExecutionIdentity): boolean {
  return left.runId === right.runId && left.turnId === right.turnId && left.correlationId === right.correlationId;
}

/**
 * Fail-closed policy check for consequential actions. It never upgrades
 * authority: every action scope must be equal to, or narrower than, the scope
 * that produced the canonical run snapshot.
 */
export function evaluateConsequentialAction(
  snapshot: ExecutionSnapshot,
  action: ConsequentialActionPreview,
  now: number
): ConsequentialPolicyDecision {
  const reasons: string[] = [];
  const runScope = snapshot.scope;

  if (!sameIdentity(snapshot.identity, action.identity)) reasons.push('identity-mismatch');
  if (!action.destination.trim()) reasons.push('destination-missing');
  if (!action.effect.trim()) reasons.push('effect-missing');
  if (snapshot.integrity.status !== 'valid') reasons.push('run-integrity-invalid');
  if (snapshot.trustedPolicy.status !== 'trusted') reasons.push('trusted-core-policy-unavailable');
  if (snapshot.governance.effective.status !== 'effective') reasons.push('effective-governance-unavailable');

  if (action.scope.host !== runScope.host) reasons.push('host-scope-widening');
  if (action.scope.scheduled && !runScope.scheduled) reasons.push('schedule-scope-widening');
  if (action.scope.channel && action.scope.channel !== runScope.channel) reasons.push('channel-scope-widening');
  if (action.scope.teamId && action.scope.teamId !== runScope.teamId) reasons.push('team-scope-widening');
  if (action.scope.browserSessionId && action.scope.browserSessionId !== runScope.browserSessionId) {
    reasons.push('browser-scope-widening');
  }
  if (action.scope.surface && action.scope.surface !== runScope.surface) reasons.push('surface-scope-widening');

  if (snapshot.trustedPolicy.status === 'trusted') {
    const policy = snapshot.trustedPolicy;
    if (policy.dangerousExpiresAt !== undefined && policy.dangerousExpiresAt <= now) {
      reasons.push('dangerous-policy-expired');
    }
    const policyMode: GovernanceMode =
      policy.approvals === 'bypass' ? 'autopilot' : policy.approvals === 'auto_edit' ? 'trusted-edits' : 'ask';
    if (MODE_RANK[action.requestedMode] > MODE_RANK[policyMode]) reasons.push('core-policy-authority-widening');
    if (policy.approvals === 'prompt') reasons.push('core-policy-requires-prompt');
  }

  if (
    snapshot.governance.effective.status === 'effective' &&
    MODE_RANK[action.requestedMode] > MODE_RANK[snapshot.governance.effective.mode]
  ) {
    reasons.push('effective-governance-authority-widening');
  }

  return {
    status: reasons.length === 0 ? 'allowed' : 'needs-you',
    reasons: [...new Set(reasons)].toSorted(),
  };
}
