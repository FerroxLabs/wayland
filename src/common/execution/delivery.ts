/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DeclaredArtifactType, ExecutionIdentity, ExecutionSnapshot, ValidationLimit } from './types';

/**
 * Native target types whose delivery is gated behind executable, type-aware
 * validation (`officecli validate`). Prose and other output degrade honestly
 * but are not blocked by this gate.
 */
export const VALIDATION_REQUIRED_TYPES: readonly DeclaredArtifactType[] = ['docx', 'pdf'];

export type ArtifactDeliveryRequest = Readonly<{
  identity: ExecutionIdentity;
  outcomeId: string;
  declaredType: DeclaredArtifactType;
  artifactDigest: string;
  /**
   * Digest of content the user already accepted, when this delivery revises a
   * previously accepted artifact. Present only on a revision.
   */
  acceptedArtifactDigest?: string;
  /**
   * True only when the user explicitly authorized rewriting accepted content.
   * Absent or false blocks a silent rewrite of accepted work.
   */
  revisionAuthorized?: boolean;
}>;

export type ArtifactDeliveryDecision = Readonly<{
  status: 'ready' | 'blocked';
  reasons: readonly string[];
  /** Honest, specific validation limits surfaced whether or not delivery is ready. */
  limits: readonly ValidationLimit[];
}>;

function sameIdentity(left: ExecutionIdentity, right: ExecutionIdentity): boolean {
  return left.runId === right.runId && left.turnId === right.turnId && left.correlationId === right.correlationId;
}

/**
 * Fail-closed delivery gate for a declared-type artifact. It never marks an
 * artifact deliverable unless type-aware validation actually ran for that exact
 * declared type, and it refuses to silently rewrite content the user already
 * accepted. Validation limits are surfaced in every decision so the honesty of
 * the check is visible even when delivery is allowed.
 */
export function evaluateArtifactDelivery(
  snapshot: ExecutionSnapshot,
  request: ArtifactDeliveryRequest
): ArtifactDeliveryDecision {
  const reasons: string[] = [];
  const validation = snapshot.validation;
  const limits = validation.limits ?? [];

  if (!sameIdentity(snapshot.identity, request.identity)) reasons.push('identity-mismatch');
  if (snapshot.integrity.status !== 'valid') reasons.push('run-integrity-invalid');
  if (!request.outcomeId.trim()) reasons.push('outcome-missing');
  if (!/^sha256:[0-9a-f]{64}$/.test(request.artifactDigest)) reasons.push('artifact-digest-invalid');

  if (VALIDATION_REQUIRED_TYPES.includes(request.declaredType)) {
    if (validation.status === 'unvalidated') reasons.push('type-aware-validation-missing');
    if (validation.status === 'invalid') reasons.push('type-aware-validation-failed');
    if (validation.status === 'valid' && validation.declaredType !== request.declaredType) {
      reasons.push('declared-type-mismatch');
    }
    if (validation.status === 'valid' && validation.method !== 'officecli') {
      reasons.push('validation-method-not-type-aware');
    }
  }

  // Scoped-revision guard: a revision that changes an already-accepted artifact
  // must be explicitly authorized, never a silent overwrite of accepted content.
  if (
    request.acceptedArtifactDigest &&
    request.acceptedArtifactDigest !== request.artifactDigest &&
    request.revisionAuthorized !== true
  ) {
    reasons.push('accepted-content-silent-rewrite');
  }

  // A verified outcome that has since gone stale can never be re-delivered as
  // current without a fresh run producing new trusted evidence.
  const trust = snapshot.outcomeTrust.find(
    (item) => item.outcomeId === request.outcomeId || item.artifactDigest === request.artifactDigest
  );
  if (trust && (trust.status === 'receipt-stale' || trust.status === 'source-dependency-stale')) {
    reasons.push('outcome-trust-stale');
  }

  return {
    status: reasons.length === 0 ? 'ready' : 'blocked',
    reasons: [...new Set(reasons)].toSorted(),
    limits,
  };
}
