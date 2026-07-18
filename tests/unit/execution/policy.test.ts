/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { resolveEffectiveGovernance, type GovernanceConstraint, type PolicySource } from '@/common/execution';

const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const now = 1_000;
const scope = {
  workspaceId: 'workspace-1',
  host: 'hosted-pro',
  trust: 'trusted',
  scheduled: true,
  channel: 'email',
} as const;

function constraint(source: PolicySource, over: Partial<GovernanceConstraint> = {}): GovernanceConstraint {
  return {
    source,
    mode: 'autopilot',
    enforceability: 'enforced',
    identity,
    host: 'hosted-pro',
    observedAt: 900,
    expiresAt: 2_000,
    receiptId: `receipt-${source}`,
    ...over,
  };
}

const all = (): GovernanceConstraint[] =>
  ['workspace', 'backend', 'host', 'scheduler', 'channel'].map((source) => constraint(source as PolicySource));

function replace(
  constraints: GovernanceConstraint[],
  source: PolicySource,
  replacement: GovernanceConstraint
): GovernanceConstraint[] {
  const copy = [...constraints];
  copy[copy.findIndex((item) => item.source === source)] = replacement;
  return copy;
}

describe('effective governance intersection', () => {
  it('uses the most conservative host, channel, and schedule constraint', () => {
    let constraints = replace(all(), 'host', constraint('host', { mode: 'trusted-edits' }));
    constraints = replace(constraints, 'channel', constraint('channel', { mode: 'ask' }));
    constraints = replace(constraints, 'scheduler', constraint('scheduler', { enforceability: 'brokered' }));
    const result = resolveEffectiveGovernance(
      { mode: 'autopilot', enforceability: 'enforced' },
      constraints,
      identity,
      scope,
      now
    );
    expect(result).toMatchObject({ status: 'effective', mode: 'ask', enforceability: 'brokered' });
  });

  it('never upgrades advisory authority into enforced authority', () => {
    const constraints = replace(all(), 'backend', constraint('backend', { enforceability: 'advisory' }));
    expect(
      resolveEffectiveGovernance({ mode: 'autopilot', enforceability: 'enforced' }, constraints, identity, scope, now)
        .enforceability
    ).toBe('advisory');
  });

  it.each([
    ['missing', all().filter((item) => item.source !== 'channel')],
    ['stale', replace(all(), 'host', constraint('host', { expiresAt: now }))],
    [
      'mismatched',
      replace(
        all(),
        'backend',
        constraint('backend', { identity: { ...identity, correlationId: 'wrong-correlation' } })
      ),
    ],
  ])('fails closed for %s policy evidence', (_label, constraints) => {
    const result = resolveEffectiveGovernance(
      { mode: 'autopilot', enforceability: 'enforced' },
      constraints,
      identity,
      scope,
      now
    );
    expect(result).toMatchObject({ status: 'unavailable', mode: 'ask', enforceability: 'advisory' });
  });
});
