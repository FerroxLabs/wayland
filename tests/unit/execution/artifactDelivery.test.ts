/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * COW-05 — type-aware validation and scoped revision. Delivery of a declared
 * DOCX/PDF target is gated behind executable `officecli` validation for that
 * exact type, honest validation limits are surfaced, and accepted content is
 * never silently rewritten.
 */

import { describe, expect, it } from 'vitest';
import {
  evaluateArtifactDelivery,
  projectExecution,
  type ArtifactDeliveryRequest,
  type ExecutionEvent,
  type ExecutionReceipt,
  type ExecutionSeed,
  type ExecutionValidation,
} from '@/common/execution';

const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const now = 7_000;
const digest = (char: string): `sha256:${string}` => `sha256:${char.repeat(64)}`;
const seed: ExecutionSeed = {
  identity,
  actor: { backend: 'wcore', agentId: 'core' },
  scope: { workspaceId: 'workspace-1', host: 'desktop', trust: 'trusted', scheduled: false },
  requestedGovernance: { mode: 'trusted-edits', enforceability: 'enforced' },
};

function validationEvent(sequence: number, validation: ExecutionValidation, receipt?: ExecutionReceipt): ExecutionEvent {
  return {
    eventId: `validation-${sequence}`,
    sequence,
    identity,
    observedAt: now,
    type: 'validation',
    validation,
    ...(receipt ? { receipt } : {}),
  };
}

const request = (overrides: Partial<ArtifactDeliveryRequest> = {}): ArtifactDeliveryRequest => ({
  identity,
  outcomeId: 'artifact-1',
  declaredType: 'docx',
  artifactDigest: digest('a'),
  ...overrides,
});

describe('COW-05 type-aware validation and scoped revision', () => {
  it('records the declared type and blocks delivery until validation actually ran', () => {
    const unvalidated = projectExecution(seed, [], { now });
    const blocked = evaluateArtifactDelivery(unvalidated, request());
    expect(blocked.status).toBe('blocked');
    expect(blocked.reasons).toContain('type-aware-validation-missing');

    const validated = projectExecution(
      seed,
      [validationEvent(0, { status: 'valid', declaredType: 'docx', method: 'officecli' })],
      { now }
    );
    expect(validated.validation).toMatchObject({ status: 'valid', declaredType: 'docx', method: 'officecli' });
    expect(evaluateArtifactDelivery(validated, request())).toMatchObject({ status: 'ready', reasons: [] });
  });

  it('refuses delivery when validation covered a different type or a non-type-aware method', () => {
    const wrongType = projectExecution(
      seed,
      [validationEvent(0, { status: 'valid', declaredType: 'pdf', method: 'officecli' })],
      { now }
    );
    expect(evaluateArtifactDelivery(wrongType, request({ declaredType: 'docx' })).reasons).toContain(
      'declared-type-mismatch'
    );

    const wrongMethod = projectExecution(
      seed,
      [validationEvent(0, { status: 'valid', declaredType: 'docx', method: 'render' })],
      { now }
    );
    expect(evaluateArtifactDelivery(wrongMethod, request()).reasons).toContain('validation-method-not-type-aware');
  });

  it('blocks a failed validation and surfaces honest validation limits on every decision', () => {
    const limits = [{ check: 'embedded-chart-render', reason: 'No renderer available in this environment' }];
    const invalid = projectExecution(
      seed,
      [validationEvent(0, { status: 'invalid', declaredType: 'pdf', method: 'officecli', reason: 'EOF missing', limits })],
      { now }
    );
    const decision = evaluateArtifactDelivery(invalid, request({ declaredType: 'pdf' }));
    expect(decision.status).toBe('blocked');
    expect(decision.reasons).toContain('type-aware-validation-failed');
    expect(decision.limits).toEqual(limits);
  });

  it('guards revisions so accepted content is not silently rewritten', () => {
    const validated = projectExecution(
      seed,
      [validationEvent(0, { status: 'valid', declaredType: 'docx', method: 'officecli' })],
      { now }
    );
    const silentRewrite = evaluateArtifactDelivery(
      validated,
      request({ acceptedArtifactDigest: digest('b'), artifactDigest: digest('c') })
    );
    expect(silentRewrite.status).toBe('blocked');
    expect(silentRewrite.reasons).toContain('accepted-content-silent-rewrite');

    const authorized = evaluateArtifactDelivery(
      validated,
      request({ acceptedArtifactDigest: digest('b'), artifactDigest: digest('c'), revisionAuthorized: true })
    );
    expect(authorized.status).toBe('ready');
  });

  it('does not gate prose or non-native output behind officecli validation', () => {
    const noValidation = projectExecution(seed, [], { now });
    expect(evaluateArtifactDelivery(noValidation, request({ declaredType: 'markdown' }))).toMatchObject({
      status: 'ready',
    });
  });

  it('rejects a malformed validation payload instead of trusting it', () => {
    const malformed = projectExecution(
      seed,
      [validationEvent(0, { status: 'valid', declaredType: 'zip' as unknown as 'docx', method: 'officecli' })],
      { now }
    );
    expect(malformed.integrity.reasons).toContain('invalid-validation:validation-0');
    expect(malformed.validation.status).toBe('unvalidated');
  });
});
