/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * COW-04 — the structured source/citation ledger folded into the canonical
 * execution model (no parallel store): captured on write, surviving revision
 * and delivery, and fail-closed on manufactured or malformed provenance.
 */

import { describe, expect, it } from 'vitest';
import {
  projectExecution,
  selectCitationLedger,
  type ExecutionCitation,
  type ExecutionEvent,
  type ExecutionSeed,
} from '@/common/execution';

const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const now = 5_000;
const seed: ExecutionSeed = {
  identity,
  actor: { backend: 'wcore', agentId: 'core' },
  scope: { workspaceId: 'workspace-1', host: 'desktop', trust: 'trusted', scheduled: false },
  requestedGovernance: { mode: 'trusted-edits', enforceability: 'enforced' },
};

function citationEvent(sequence: number, citation: ExecutionCitation): ExecutionEvent {
  return {
    eventId: `citation-${sequence}`,
    sequence,
    identity,
    observedAt: now,
    type: 'citation',
    citation,
  };
}

const claimA: ExecutionCitation = {
  id: 'claim-1',
  claim: 'Cycle time fell from 19 hours to 7 hours',
  source: {
    sourceId: 'metrics.xlsx',
    label: 'Q3 metrics',
    uri: 'file:///work/metrics.xlsx',
    contentDigest: 'sha256:aa',
  },
  locator: { kind: 'sheet', sheet: 'Summary', cell: 'B7' },
  observedAt: now,
  outcomeId: 'artifact-1',
};

const claimB: ExecutionCitation = {
  id: 'claim-2',
  claim: 'Adoption reached 84 percent',
  source: { sourceId: 'brief.pdf', label: 'Adoption brief' },
  locator: { kind: 'page', page: 3 },
  observedAt: now,
  outcomeId: 'artifact-1',
};

const lifecycle = (sequence: number, next: 'running' | 'completed'): ExecutionEvent => ({
  eventId: `lifecycle-${sequence}-${next}`,
  sequence,
  identity,
  observedAt: now,
  type: 'lifecycle',
  lifecycle: next,
});

describe('COW-04 source/citation ledger', () => {
  it('captures typed per-claim provenance into the canonical snapshot on write', () => {
    const result = projectExecution(seed, [citationEvent(0, claimA), citationEvent(1, claimB)], { now });
    expect(result.integrity.status).toBe('valid');
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0]).toMatchObject({
      id: 'claim-1',
      source: { sourceId: 'metrics.xlsx' },
      locator: { kind: 'sheet', sheet: 'Summary', cell: 'B7' },
    });
  });

  it('survives revision and delivery, folding a superseded claim out of the effective ledger', () => {
    const revised: ExecutionCitation = {
      ...claimB,
      id: 'claim-2b',
      claim: 'Adoption reached 84 percent (corrected from 71 percent)',
      supersedes: 'claim-2',
    };
    const result = projectExecution(
      seed,
      [
        lifecycle(0, 'running'),
        citationEvent(1, claimA),
        citationEvent(2, claimB),
        citationEvent(3, revised),
        lifecycle(4, 'completed'), // delivery: terminal lifecycle
      ],
      { now }
    );
    expect(result.lifecycle).toBe('completed');
    // History is append-only: all three entries remain for provenance.
    expect(result.citations.map((citation) => citation.id)).toEqual(['claim-1', 'claim-2', 'claim-2b']);
    // The effective ledger drops the superseded claim.
    expect(selectCitationLedger(result).map((citation) => citation.id)).toEqual(['claim-1', 'claim-2b']);
  });

  it('is idempotent on an exact duplicate and fails closed on a conflicting claim id', () => {
    const conflicting = citationEvent(1, { ...claimA, claim: 'Fabricated different claim under the same id' });
    const result = projectExecution(seed, [citationEvent(0, claimA), conflicting], { now });
    expect(result.citations).toHaveLength(1);
    expect(result.integrity.reasons).toContain('conflicting-citation:claim-1');

    const dup = projectExecution(seed, [citationEvent(0, claimA), { ...citationEvent(1, claimA) }], { now });
    expect(dup.citations).toHaveLength(1);
    expect(dup.integrity.status).toBe('valid');
  });

  it('rejects a manufactured citation with no source identity or an empty locator', () => {
    const noSource = citationEvent(0, {
      ...claimA,
      source: { sourceId: '   ' },
    });
    const noLocator = citationEvent(0, {
      ...claimA,
      locator: { kind: 'page', page: 0 },
    });
    expect(projectExecution(seed, [noSource], { now }).integrity.reasons).toContain('invalid-citation:citation-0');
    expect(projectExecution(seed, [noLocator], { now }).integrity.reasons).toContain('invalid-citation:citation-0');
    expect(projectExecution(seed, [noSource], { now }).citations).toHaveLength(0);
  });

  it('refuses to capture a citation after delivery is terminal', () => {
    const result = projectExecution(
      seed,
      [lifecycle(0, 'running'), lifecycle(1, 'completed'), citationEvent(2, claimA)],
      { now }
    );
    expect(result.citations).toHaveLength(0);
    expect(result.integrity.reasons).toContain('post-terminal-event:citation-2');
  });
});
