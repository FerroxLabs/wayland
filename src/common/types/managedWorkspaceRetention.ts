/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** Closed wire contract for the read-only managed-workspace projection. */

export const WORKSPACE_AUTHORITY_SOURCES = [
  'conversation',
  'project',
  'schedule',
  'artifact',
  'receipt',
  'active-process',
  'provenance',
  'snapshot',
] as const;

export type WorkspaceAuthoritySource = (typeof WORKSPACE_AUTHORITY_SOURCES)[number];
export type WorkspaceReferenceAuthoritySource = Exclude<WorkspaceAuthoritySource, 'provenance' | 'snapshot'>;
export type WorkspaceAuthorityState = 'complete' | 'unavailable' | 'error';
export type WorkspaceAuthorityCompleteness = Record<WorkspaceAuthoritySource, WorkspaceAuthorityState>;

export type ManagedWorkspaceEvidence = {
  managedProvenance: boolean;
  inventoryComplete: boolean;
  referenceCount: number | null;
  scheduleCount: number | null;
  activeProcessCount: number | null;
  artifactCount: number | null;
  userPromoted: boolean | null;
  userContent: 'present' | 'absent' | 'unknown';
  modified: boolean | null;
  abandonedForMs: number | null;
  retentionWindowMs: number;
};

export type ManagedWorkspaceClassification =
  | 'referenced'
  | 'scheduled'
  | 'active'
  | 'artifact-bearing'
  | 'modified'
  | 'user-promoted'
  | 'empty-abandoned'
  | 'unknown';

export type ManagedWorkspaceRetentionDecision = {
  classifications: ManagedWorkspaceClassification[];
  disposition: 'preserve' | 'review-candidate';
  reasons: string[];
};

export type ManagedWorkspaceInventoryEntry = {
  path: string;
  canonicalPath: string | null;
  evidence: ManagedWorkspaceEvidence;
  decision: ManagedWorkspaceRetentionDecision;
  references: Array<{ source: WorkspaceReferenceAuthoritySource; id: string }>;
  errors: string[];
};

export type ManagedWorkspaceInventoryReport = {
  generatedAt: string;
  root: string;
  canonicalRoot: string | null;
  authorityCompleteness: WorkspaceAuthorityCompleteness;
  complete: boolean;
  entries: ManagedWorkspaceInventoryEntry[];
  summary: {
    discovered: number;
    preserved: number;
    reviewCandidate: number;
    unknown: number;
  };
  errors: string[];
};

const CLASSIFICATIONS = [
  'referenced',
  'scheduled',
  'active',
  'artifact-bearing',
  'modified',
  'user-promoted',
  'empty-abandoned',
  'unknown',
] as const;

const exactObject = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).toSorted();
  const expected = [...keys].toSorted();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const nullableSafeCount = (value: unknown): boolean =>
  value === null || (Number.isSafeInteger(value) && Number(value) >= 0);

function validEvidence(value: unknown): value is ManagedWorkspaceEvidence {
  if (
    !exactObject(value, [
      'managedProvenance',
      'inventoryComplete',
      'referenceCount',
      'scheduleCount',
      'activeProcessCount',
      'artifactCount',
      'userPromoted',
      'userContent',
      'modified',
      'abandonedForMs',
      'retentionWindowMs',
    ])
  ) {
    return false;
  }
  return (
    typeof value.managedProvenance === 'boolean' &&
    typeof value.inventoryComplete === 'boolean' &&
    nullableSafeCount(value.referenceCount) &&
    nullableSafeCount(value.scheduleCount) &&
    nullableSafeCount(value.activeProcessCount) &&
    nullableSafeCount(value.artifactCount) &&
    (value.userPromoted === null || typeof value.userPromoted === 'boolean') &&
    ['present', 'absent', 'unknown'].includes(String(value.userContent)) &&
    (value.modified === null || typeof value.modified === 'boolean') &&
    nullableSafeCount(value.abandonedForMs) &&
    Number.isSafeInteger(value.retentionWindowMs) &&
    Number(value.retentionWindowMs) >= 0
  );
}

function validDecision(value: unknown): value is ManagedWorkspaceRetentionDecision {
  return (
    exactObject(value, ['classifications', 'disposition', 'reasons']) &&
    Array.isArray(value.classifications) &&
    value.classifications.every((item) => CLASSIFICATIONS.includes(item as ManagedWorkspaceClassification)) &&
    (value.disposition === 'preserve' || value.disposition === 'review-candidate') &&
    stringArray(value.reasons)
  );
}

function validEntry(value: unknown): value is ManagedWorkspaceInventoryEntry {
  return (
    exactObject(value, ['path', 'canonicalPath', 'evidence', 'decision', 'references', 'errors']) &&
    typeof value.path === 'string' &&
    (value.canonicalPath === null || typeof value.canonicalPath === 'string') &&
    validEvidence(value.evidence) &&
    validDecision(value.decision) &&
    Array.isArray(value.references) &&
    value.references.every(
      (reference) =>
        exactObject(reference, ['source', 'id']) &&
        WORKSPACE_AUTHORITY_SOURCES.includes(reference.source as WorkspaceAuthoritySource) &&
        reference.source !== 'provenance' &&
        reference.source !== 'snapshot' &&
        typeof reference.id === 'string'
    ) &&
    stringArray(value.errors)
  );
}

/** Reject malformed or expanded IPC payloads before renderer state admission. */
export function parseManagedWorkspaceInventoryReport(value: unknown): ManagedWorkspaceInventoryReport | null {
  if (
    !exactObject(value, [
      'generatedAt',
      'root',
      'canonicalRoot',
      'authorityCompleteness',
      'complete',
      'entries',
      'summary',
      'errors',
    ]) ||
    typeof value.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    typeof value.root !== 'string' ||
    (value.canonicalRoot !== null && typeof value.canonicalRoot !== 'string') ||
    typeof value.complete !== 'boolean' ||
    !Array.isArray(value.entries) ||
    !value.entries.every(validEntry) ||
    !stringArray(value.errors) ||
    !exactObject(value.authorityCompleteness, WORKSPACE_AUTHORITY_SOURCES) ||
    !exactObject(value.summary, ['discovered', 'preserved', 'reviewCandidate', 'unknown'])
  ) {
    return null;
  }
  const completeness = value.authorityCompleteness as Record<string, unknown>;
  const summary = value.summary as Record<string, unknown>;
  if (
    !WORKSPACE_AUTHORITY_SOURCES.every((source) =>
      ['complete', 'unavailable', 'error'].includes(String(completeness[source]))
    ) ||
    !['discovered', 'preserved', 'reviewCandidate', 'unknown'].every(
      (key) => Number.isSafeInteger(summary[key]) && Number(summary[key]) >= 0
    )
  ) {
    return null;
  }
  return value as ManagedWorkspaceInventoryReport;
}
