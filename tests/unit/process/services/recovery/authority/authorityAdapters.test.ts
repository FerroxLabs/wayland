/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit proof for the closed state-authority adapter ledger.
 *
 * Verifies that Core, Gemini, and ACP each bind an explicit producer-owned
 * session/handle authority to exact capture/resume/degraded behavior, that the
 * ledger stays in lockstep with the live managers, that Desktop SQLite and
 * Office/artifact stores remain separately inventoried storage authorities, and
 * that unproven or non-resumable backends cannot be widened into cohort
 * eligibility. Every hostile mutation fails closed.
 */

import { describe, expect, it } from 'vitest';
import { ACP_SESSION_AUTHORITY } from '@process/task/AcpAgentManager';
import { GEMINI_SESSION_AUTHORITY } from '@process/task/GeminiAgentManager';
import {
  assertCohortEligible,
  getAdapter,
  isCohortEligible,
  parseStateAuthorityLedger,
  resolveCohortEligibleAdapters,
  STATE_AUTHORITY_LEDGER,
  STATE_AUTHORITY_LEDGER_DIGEST,
  stateAuthorityLedgerDigest,
  type StateAuthorityLedger,
} from '@process/services/recovery/authority/authorityAdapters';

// A mutable deep copy of the sealed, validated ledger. Every attack starts from
// a structurally valid ledger and mutates exactly one fact.
const clone = (): StateAuthorityLedger =>
  JSON.parse(JSON.stringify(STATE_AUTHORITY_LEDGER)) as StateAuthorityLedger;

describe('sealed state-authority ledger', () => {
  it('binds an explicit authority for Core, Gemini, and ACP plus the separate storage authorities', () => {
    expect(stateAuthorityLedgerDigest(STATE_AUTHORITY_LEDGER)).toBe(STATE_AUTHORITY_LEDGER_DIGEST);
    expect(STATE_AUTHORITY_LEDGER.adapters.map((a) => a.id)).toEqual(['acp.session', 'core.session', 'gemini.session']);
    expect(STATE_AUTHORITY_LEDGER.storageAuthorities.map((s) => s.id)).toEqual([
      'desktop.sqlite',
      'office.artifact-workspace',
    ]);
    for (const storage of STATE_AUTHORITY_LEDGER.storageAuthorities) {
      expect(storage.substitutesBackendAdapter).toBe(false);
    }
  });

  it('gives ACP a resumable backend handle with a bound epoch and fail-closed behavior', () => {
    const acp = getAdapter('acp.session');
    expect(acp.resumability).toBe('backend-session-replay');
    expect(acp.mutationEpoch).toEqual({ source: 'backend-session-updated-at', bound: true });
    expect(acp.validationReceipt).toBe('acp-wrapper-version-pin');
    expect(acp.failureBehavior).toBe('fail-closed');
    expect(acp.cohortEligible).toBe(true);
  });

  it('keeps Core producer-quiescence dependent and deferred to #896', () => {
    const core = getAdapter('core.session');
    expect(core.resumability).toBe('producer-quiesced');
    expect(core.proven).toBe(false);
    expect(core.cohortEligible).toBe(false);
    expect(core.deferredBlocker).toBe('FerroxLabs/wayland#896');
    expect(core.failureBehavior).toBe('fail-closed');
  });

  it('marks Gemini non-resumable, degraded to read-only, and cohort-excluded', () => {
    const gemini = getAdapter('gemini.session');
    expect(gemini.resumability).toBe('non-resumable');
    expect(gemini.sessionHandle.source).toBe('gemini.none');
    expect(gemini.failureBehavior).toBe('degraded-read-only');
    expect(gemini.cohortEligible).toBe(false);
  });
});

describe('cohort eligibility is mechanically derived', () => {
  it('admits only the proven resumable adapter', () => {
    expect(resolveCohortEligibleAdapters()).toEqual(['acp.session']);
    expect(isCohortEligible('acp.session')).toBe(true);
    expect(isCohortEligible('core.session')).toBe(false);
    expect(isCohortEligible('gemini.session')).toBe(false);
  });

  it('lets an eligible adapter pass and rejects excluded ones with a reason', () => {
    expect(() => assertCohortEligible('acp.session')).not.toThrow();
    expect(() => assertCohortEligible('core.session')).toThrow(/FerroxLabs\/wayland#896/);
    expect(() => assertCohortEligible('gemini.session')).toThrow(/non-resumable/);
  });
});

describe('ledger stays in lockstep with the live managers', () => {
  it('sources ACP and Gemini facts from the production managers', () => {
    const acp = getAdapter('acp.session');
    expect(acp.producer).toBe(ACP_SESSION_AUTHORITY.producer);
    expect(acp.sessionHandle.source).toBe(ACP_SESSION_AUTHORITY.handleSource);
    expect(acp.resumability).toBe(ACP_SESSION_AUTHORITY.resumability);
    expect(acp.proven).toBe(ACP_SESSION_AUTHORITY.proven);

    const gemini = getAdapter('gemini.session');
    expect(gemini.producer).toBe(GEMINI_SESSION_AUTHORITY.producer);
    expect(gemini.sessionHandle.source).toBe(GEMINI_SESSION_AUTHORITY.handleSource);
    expect(gemini.resumability).toBe(GEMINI_SESSION_AUTHORITY.resumability);
  });

  it('rejects a ledger whose adapter handle drifts from its runtime fact', () => {
    const drifted = clone();
    drifted.adapters[2] = { ...drifted.adapters[2]!, sessionHandle: { source: 'gemini.forged', identity: 'x' } };
    expect(() => parseStateAuthorityLedger(drifted)).toThrow(/out of lockstep/);
  });
});

describe('ledger validation fails closed', () => {
  it('accepts an unmutated round-trip of the sealed ledger', () => {
    expect(() => parseStateAuthorityLedger(clone())).not.toThrow();
  });

  it('rejects an unknown adapter id', () => {
    const bad = clone();
    bad.adapters[0] = { ...bad.adapters[0]!, id: 'phantom.session' as never };
    expect(() => parseStateAuthorityLedger(bad)).toThrow(/id is not a permitted value/);
  });

  it('rejects a duplicate adapter', () => {
    const bad = clone();
    bad.adapters[1] = JSON.parse(JSON.stringify(bad.adapters[0]));
    expect(() => parseStateAuthorityLedger(bad)).toThrow(/duplicate identity|ascending order/);
  });

  it('rejects a missing field', () => {
    const bad = clone();
    const { note: _note, ...withoutNote } = bad.adapters[0] as Record<string, unknown>;
    void _note;
    bad.adapters[0] = withoutNote as never;
    expect(() => parseStateAuthorityLedger(bad)).toThrow(/missing or unknown fields/);
  });

  it('rejects an unknown producer', () => {
    const bad = clone();
    bad.adapters[0] = { ...bad.adapters[0]!, producer: 'rogue-cli' as never };
    expect(() => parseStateAuthorityLedger(bad)).toThrow(/producer is not a permitted value/);
  });

  it('rejects silent widening of a non-resumable backend into cohort eligibility', () => {
    const bad = clone();
    bad.adapters[2] = { ...bad.adapters[2]!, cohortEligible: true };
    expect(() => parseStateAuthorityLedger(bad)).toThrow(/cohortEligible must equal/);
  });

  it('rejects a non-resumable adapter that claims fail-closed instead of degraded', () => {
    const bad = clone();
    bad.adapters[2] = { ...bad.adapters[2]!, failureBehavior: 'fail-closed' };
    expect(() => parseStateAuthorityLedger(bad)).toThrow(/failureBehavior must be degraded-read-only/);
  });

  it('rejects a storage authority that tries to substitute for a backend adapter', () => {
    const bad = clone();
    bad.storageAuthorities[0] = { ...bad.storageAuthorities[0]!, substitutesBackendAdapter: true as never };
    expect(() => parseStateAuthorityLedger(bad)).toThrow(/may not substitute/);
  });

  it('rejects an eligible adapter that still carries a deferred blocker', () => {
    const bad = clone();
    bad.adapters[0] = { ...bad.adapters[0]!, deferredBlocker: 'FerroxLabs/wayland#999' };
    expect(() => parseStateAuthorityLedger(bad)).toThrow(/cannot be cohort eligible while a blocker is deferred/);
  });
});
