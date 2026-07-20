/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration proof for backend state-authority capture admission.
 *
 * Attacks the closed adapter ledger with untrusted capture claims. Only a fully
 * authenticated request against a proven, resumable adapter (ACP) is admitted.
 * Every hostile vector named in the threat model fails closed, an unproven Core
 * capture is deferred to #896, and a non-resumable Gemini capture degrades to
 * read-only instead of being normalized into success.
 */

import { describe, expect, it } from 'vitest';
import {
  evaluateBackendCaptureRequest,
  resolveCohortEligibleAdapters,
  STATE_AUTHORITY_LEDGER,
  type BackendCaptureRequest,
} from '@process/services/recovery/authority/authorityAdapters';

const NOW = Date.parse('2026-07-20T00:00:00Z');
const FUTURE = '2026-08-01T00:00:00Z';

/** A fully authenticated ACP capture request. */
const acpRequest = (overrides: Partial<BackendCaptureRequest> = {}): BackendCaptureRequest => ({
  adapterId: 'acp.session',
  producer: 'acp-backend',
  handleSource: 'acp.conversation-extra.acpSessionId',
  captureMethod: 'backend-session-replay',
  assertedBy: 'acp-backend',
  epoch: { start: 'epoch-1', end: 'epoch-1' },
  quiescedAt: '2026-07-20T00:00:00Z',
  lastMutationAt: '2026-07-19T23:59:00Z',
  leaseExpiresAt: FUTURE,
  rootComplete: true,
  nowMs: NOW,
  ...overrides,
});

describe('authenticated backend capture admission', () => {
  it('admits a fully authenticated ACP capture', () => {
    const disposition = evaluateBackendCaptureRequest(acpRequest());
    expect(disposition).toEqual({ admitted: true, adapterId: 'acp.session' });
  });

  it('only ACP is cohort eligible', () => {
    expect(resolveCohortEligibleAdapters()).toEqual(['acp.session']);
  });
});

describe('hostile capture claims fail closed', () => {
  it('rejects an unknown adapter', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ adapterId: 'phantom.session' }));
    expect(d).toMatchObject({ admitted: false, code: 'UNKNOWN_PRODUCER' });
  });

  it('rejects an unknown producer', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ producer: 'rogue-cli' }));
    expect(d).toMatchObject({ admitted: false, code: 'UNKNOWN_PRODUCER' });
  });

  it('rejects a producer that does not own the adapter', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ producer: 'wayland-core' }));
    expect(d).toMatchObject({ admitted: false, code: 'WRONG_OWNER' });
  });

  it('rejects a wrong session handle', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ handleSource: 'core.conversation-id' }));
    expect(d).toMatchObject({ admitted: false, code: 'WRONG_HANDLE' });
  });

  it('rejects a generic filesystem-copy substitution', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ captureMethod: 'filesystem-copy' }));
    expect(d).toMatchObject({ admitted: false, code: 'GENERIC_FILESYSTEM_COPY' });
  });

  it('rejects adapter self-assertion of the validation receipt', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ assertedBy: 'acp.session' }));
    expect(d).toMatchObject({ admitted: false, code: 'ADAPTER_SELF_ASSERTION' });
  });

  it('rejects an absent epoch', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ epoch: null }));
    expect(d).toMatchObject({ admitted: false, code: 'ABSENT_EPOCH' });
  });

  it('rejects a mixed epoch (state changed during capture)', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ epoch: { start: 'epoch-1', end: 'epoch-2' } }));
    expect(d).toMatchObject({ admitted: false, code: 'MIXED_EPOCH' });
  });

  it('rejects an expired epoch lease', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ leaseExpiresAt: '2026-07-01T00:00:00Z' }));
    expect(d).toMatchObject({ admitted: false, code: 'EXPIRED_EPOCH' });
  });

  it('rejects mutation after quiescence', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ lastMutationAt: '2026-07-20T00:00:05Z' }));
    expect(d).toMatchObject({ admitted: false, code: 'MUTATION_AFTER_QUIESCENCE' });
  });

  it('rejects a partial authority root', () => {
    const d = evaluateBackendCaptureRequest(acpRequest({ rootComplete: false }));
    expect(d).toMatchObject({ admitted: false, code: 'PARTIAL_ROOT' });
  });
});

describe('non-Core degraded behavior is truthful', () => {
  it('defers Core capture to #896 rather than admitting it', () => {
    const d = evaluateBackendCaptureRequest({
      adapterId: 'core.session',
      producer: 'wayland-core',
      handleSource: 'core.conversation-id',
      captureMethod: 'producer-quiescence-lease',
      assertedBy: 'wayland-core',
      epoch: { start: 'e', end: 'e' },
      quiescedAt: null,
      lastMutationAt: null,
      leaseExpiresAt: FUTURE,
      rootComplete: true,
      nowMs: NOW,
    });
    expect(d).toMatchObject({ admitted: false, code: 'DEFERRED_BLOCKER' });
    expect((d as { reason: string }).reason).toContain('FerroxLabs/wayland#896');
  });

  it('degrades a Gemini capture to read-only instead of admitting it', () => {
    const d = evaluateBackendCaptureRequest({
      adapterId: 'gemini.session',
      producer: 'gemini-cli',
      handleSource: 'gemini.none',
      captureMethod: 'backend-session-replay',
      assertedBy: 'gemini-cli',
      epoch: { start: 'e', end: 'e' },
      quiescedAt: null,
      lastMutationAt: null,
      leaseExpiresAt: FUTURE,
      rootComplete: true,
      nowMs: NOW,
    });
    expect(d).toMatchObject({ admitted: false, code: 'NON_RESUMABLE_EXCLUDED', degraded: true });
  });

  it('keeps Desktop SQLite and Office/artifact stores as non-substitutable storage authorities', () => {
    const storageIds = STATE_AUTHORITY_LEDGER.storageAuthorities.map((s) => s.id);
    expect(storageIds).toContain('desktop.sqlite');
    expect(storageIds).toContain('office.artifact-workspace');
    for (const storage of STATE_AUTHORITY_LEDGER.storageAuthorities) {
      expect(storage.substitutesBackendAdapter).toBe(false);
    }
  });
});
