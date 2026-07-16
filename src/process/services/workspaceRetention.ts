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
export type ManagedWorkspaceEvidence = {
  /** The path is proven to have been created and owned by this Wayland install. */
  managedProvenance: boolean;
  /** Every required authority was inspected without truncation or error. */
  inventoryComplete: boolean;
  /** Live conversation or Project references to this exact canonical path. */
  referenceCount: number | null;
  /** Enabled or disabled schedules that retain this exact canonical path. */
  scheduleCount: number | null;
  /** Registered outputs, reports, receipts, or other artifacts rooted here. */
  artifactCount: number | null;
  /** Whether the user explicitly promoted/selected this as durable storage. */
  userPromoted: boolean | null;
  /** User-authored content after excluding known Wayland-managed scaffolding. */
  userContent: 'present' | 'absent' | 'unknown';
  /** Mutation evidence relative to the app-created baseline. */
  modified: boolean | null;
  /** Age of the abandoned shell; null when creation/last-reference time is unknown. */
  abandonedForMs: number | null;
  /** Declared visible retention window. */
  retentionWindowMs: number;
};

export type ManagedWorkspaceClassification =
  | 'referenced'
  | 'scheduled'
  | 'artifact-bearing'
  | 'modified'
  | 'user-promoted'
  | 'empty-abandoned'
  | 'unknown';

export type ManagedWorkspaceRetentionDecision = {
  classifications: ManagedWorkspaceClassification[];
  /**
   * `quarantine-eligible` is not deletion authority. A later dry-run, visible
   * review, recoverable quarantine, and receipt are still mandatory.
   */
  disposition: 'preserve' | 'quarantine-eligible';
  reasons: string[];
};

const isKnownCount = (value: number | null): value is number =>
  value !== null && Number.isSafeInteger(value) && value >= 0;

/**
 * Classify one generated workspace conservatively.
 *
 * Missing, malformed, contradictory, or incomplete evidence always preserves
 * the workspace. There is intentionally no delete/prune operation in this
 * module.
 */
export function classifyManagedWorkspaceRetention(
  evidence: ManagedWorkspaceEvidence
): ManagedWorkspaceRetentionDecision {
  const classifications: ManagedWorkspaceClassification[] = [];
  const reasons: string[] = [];

  if (isKnownCount(evidence.referenceCount) && evidence.referenceCount > 0) {
    classifications.push('referenced');
    reasons.push(`${evidence.referenceCount} live conversation or Project reference(s)`);
  }
  if (isKnownCount(evidence.scheduleCount) && evidence.scheduleCount > 0) {
    classifications.push('scheduled');
    reasons.push(`${evidence.scheduleCount} schedule reference(s)`);
  }
  if (isKnownCount(evidence.artifactCount) && evidence.artifactCount > 0) {
    classifications.push('artifact-bearing');
    reasons.push(`${evidence.artifactCount} registered artifact or receipt reference(s)`);
  }
  if (evidence.modified === true || evidence.userContent === 'present') {
    classifications.push('modified');
    reasons.push('user content or post-creation mutation is present');
  }
  if (evidence.userPromoted === true) {
    classifications.push('user-promoted');
    reasons.push('the user promoted or selected this workspace as durable');
  }

  const evidenceShapeValid =
    evidence.retentionWindowMs >= 0 &&
    Number.isSafeInteger(evidence.retentionWindowMs) &&
    (evidence.abandonedForMs === null ||
      (Number.isSafeInteger(evidence.abandonedForMs) && evidence.abandonedForMs >= 0)) &&
    isKnownCount(evidence.referenceCount) &&
    isKnownCount(evidence.scheduleCount) &&
    isKnownCount(evidence.artifactCount);

  const provablyEmptyAbandoned =
    evidence.managedProvenance &&
    evidence.inventoryComplete &&
    evidenceShapeValid &&
    evidence.referenceCount === 0 &&
    evidence.scheduleCount === 0 &&
    evidence.artifactCount === 0 &&
    evidence.userPromoted === false &&
    evidence.userContent === 'absent' &&
    evidence.modified === false &&
    evidence.abandonedForMs !== null &&
    evidence.abandonedForMs >= evidence.retentionWindowMs;

  if (provablyEmptyAbandoned) {
    return {
      classifications: ['empty-abandoned'],
      disposition: 'quarantine-eligible',
      reasons: ['complete evidence proves an empty app-managed shell beyond the retention window'],
    };
  }

  if (classifications.length === 0) {
    classifications.push('unknown');
  }
  if (!evidence.managedProvenance) reasons.push('Wayland-managed provenance is not proven');
  if (!evidence.inventoryComplete) reasons.push('the authority inventory is incomplete');
  if (!evidenceShapeValid) reasons.push('one or more evidence fields are missing or invalid');
  if (evidence.userPromoted === null) reasons.push('user-promotion state is unknown');
  if (evidence.userContent === 'unknown') reasons.push('user-content state is unknown');
  if (evidence.modified === null) reasons.push('mutation state is unknown');
  if (evidence.abandonedForMs === null) reasons.push('abandonment age is unknown');
  if (
    evidence.abandonedForMs !== null &&
    Number.isSafeInteger(evidence.abandonedForMs) &&
    evidence.abandonedForMs >= 0 &&
    evidence.abandonedForMs < evidence.retentionWindowMs
  ) {
    reasons.push('the visible retention window has not elapsed');
  }

  return { classifications, disposition: 'preserve', reasons };
}
