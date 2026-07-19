/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Evidence collected by the managed-workspace inventory.
 *
 * This module is deliberately pure and cannot delete, move, or mutate a
 * workspace. Filesystem and authority collectors remain separate so an
 * incomplete scan can never be mistaken for an empty directory.
 */
import type {
  ManagedWorkspaceClassification,
  ManagedWorkspaceEvidence,
  ManagedWorkspaceRetentionDecision,
} from '@/common/types/managedWorkspaceRetention';

export type {
  ManagedWorkspaceEvidence,
  ManagedWorkspaceRetentionDecision,
} from '@/common/types/managedWorkspaceRetention';

const isKnownCount = (value: number | null): value is number =>
  value !== null && Number.isSafeInteger(value) && value >= 0;

/**
 * Classify one generated workspace conservatively.
 *
 * Missing, malformed, contradictory, or incomplete evidence always preserves
 * the workspace. There is intentionally no delete/prune operation in this
 * module.
 */
export function classifyManagedWorkspaceRetention(evidence: unknown): ManagedWorkspaceRetentionDecision {
  const classifications: ManagedWorkspaceClassification[] = [];
  const reasons: string[] = [];

  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return {
      classifications: ['unknown'],
      disposition: 'preserve',
      reasons: ['managed-workspace evidence is malformed or unavailable'],
    };
  }
  let candidate: Partial<ManagedWorkspaceEvidence>;
  try {
    candidate = { ...(evidence as Record<string, unknown>) } as Partial<ManagedWorkspaceEvidence>;
  } catch {
    return {
      classifications: ['unknown'],
      disposition: 'preserve',
      reasons: ['managed-workspace evidence could not be inspected safely'],
    };
  }

  if (isKnownCount(candidate.referenceCount ?? null) && Number(candidate.referenceCount) > 0) {
    classifications.push('referenced');
    reasons.push(`${candidate.referenceCount} live conversation or Project reference(s)`);
  }
  if (isKnownCount(candidate.scheduleCount ?? null) && Number(candidate.scheduleCount) > 0) {
    classifications.push('scheduled');
    reasons.push(`${candidate.scheduleCount} schedule reference(s)`);
  }
  if (isKnownCount(candidate.activeProcessCount ?? null) && Number(candidate.activeProcessCount) > 0) {
    classifications.push('active');
    reasons.push(`${candidate.activeProcessCount} active process reference(s)`);
  }
  if (isKnownCount(candidate.artifactCount ?? null) && Number(candidate.artifactCount) > 0) {
    classifications.push('artifact-bearing');
    reasons.push(`${candidate.artifactCount} registered artifact or receipt reference(s)`);
  }
  if (candidate.modified === true || candidate.userContent === 'present') {
    classifications.push('modified');
    reasons.push('user content or post-creation mutation is present');
  }
  if (candidate.userPromoted === true) {
    classifications.push('user-promoted');
    reasons.push('the user promoted or selected this workspace as durable');
  }

  const evidenceShapeValid =
    typeof candidate.managedProvenance === 'boolean' &&
    typeof candidate.inventoryComplete === 'boolean' &&
    (candidate.userPromoted === null || typeof candidate.userPromoted === 'boolean') &&
    ['present', 'absent', 'unknown'].includes(String(candidate.userContent)) &&
    (candidate.modified === null || typeof candidate.modified === 'boolean') &&
    Number(candidate.retentionWindowMs) >= 0 &&
    Number.isSafeInteger(candidate.retentionWindowMs) &&
    (candidate.abandonedForMs === null ||
      (Number.isSafeInteger(candidate.abandonedForMs) && Number(candidate.abandonedForMs) >= 0)) &&
    isKnownCount(candidate.referenceCount ?? null) &&
    isKnownCount(candidate.scheduleCount ?? null) &&
    isKnownCount(candidate.activeProcessCount ?? null) &&
    isKnownCount(candidate.artifactCount ?? null);

  const provablyEmptyAbandoned =
    candidate.managedProvenance &&
    candidate.inventoryComplete &&
    evidenceShapeValid &&
    candidate.referenceCount === 0 &&
    candidate.scheduleCount === 0 &&
    candidate.activeProcessCount === 0 &&
    candidate.artifactCount === 0 &&
    candidate.userPromoted === false &&
    candidate.userContent === 'absent' &&
    candidate.modified === false &&
    candidate.abandonedForMs !== null &&
    Number(candidate.abandonedForMs) >= Number(candidate.retentionWindowMs);

  if (provablyEmptyAbandoned) {
    return {
      classifications: ['empty-abandoned'],
      disposition: 'review-candidate',
      reasons: ['complete evidence proves an empty app-managed shell beyond the retention window'],
    };
  }

  if (classifications.length === 0) {
    classifications.push('unknown');
  }
  if (!candidate.managedProvenance) reasons.push('Wayland-managed provenance is not proven');
  if (!candidate.inventoryComplete) reasons.push('the authority inventory is incomplete');
  if (!evidenceShapeValid) reasons.push('one or more evidence fields are missing or invalid');
  if (candidate.userPromoted === null) reasons.push('user-promotion state is unknown');
  if (candidate.userContent === 'unknown') reasons.push('user-content state is unknown');
  if (candidate.modified === null) reasons.push('mutation state is unknown');
  if (candidate.abandonedForMs === null) reasons.push('abandonment age is unknown');
  if (
    candidate.abandonedForMs !== null &&
    Number.isSafeInteger(candidate.abandonedForMs) &&
    Number(candidate.abandonedForMs) >= 0 &&
    Number(candidate.abandonedForMs) < Number(candidate.retentionWindowMs)
  ) {
    reasons.push('the visible retention window has not elapsed');
  }

  return { classifications, disposition: 'preserve', reasons };
}
