/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** Closed wire contract for the read-only managed-workspace projection. */

export const MANAGED_WORKSPACE_NAME_PATTERN = /^[a-z0-9_-]+-temp-\d{10,}$/i;

export function isManagedWorkspaceName(value: string): boolean {
  return MANAGED_WORKSPACE_NAME_PATTERN.test(value);
}

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

const isKnownCount = (value: number | null): value is number =>
  value !== null && Number.isSafeInteger(value) && value >= 0;

/**
 * Shared pure classifier used by both the producer and the IPC parser. Keeping
 * one implementation prevents renderer admission from accepting a decision
 * that the process-side classifier could never have produced.
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

  if (classifications.length === 0) classifications.push('unknown');
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
    value.classifications.length > 0 &&
    new Set(value.classifications).size === value.classifications.length &&
    value.classifications.every((item) => CLASSIFICATIONS.includes(item as ManagedWorkspaceClassification)) &&
    (value.disposition === 'preserve' || value.disposition === 'review-candidate') &&
    stringArray(value.reasons)
  );
}

function isSemanticallyValidReviewCandidate(
  entry: ManagedWorkspaceInventoryEntry,
  reportComplete: boolean,
  authoritiesComplete: boolean
): boolean {
  const evidence = entry.evidence;
  return (
    reportComplete &&
    authoritiesComplete &&
    entry.canonicalPath !== null &&
    entry.errors.length === 0 &&
    entry.references.length === 0 &&
    evidence.managedProvenance &&
    evidence.inventoryComplete &&
    evidence.referenceCount === 0 &&
    evidence.scheduleCount === 0 &&
    evidence.activeProcessCount === 0 &&
    evidence.artifactCount === 0 &&
    evidence.userPromoted === false &&
    evidence.userContent === 'absent' &&
    evidence.modified === false &&
    evidence.abandonedForMs !== null &&
    evidence.abandonedForMs >= evidence.retentionWindowMs &&
    entry.decision.classifications.length === 1 &&
    entry.decision.classifications[0] === 'empty-abandoned'
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
        typeof reference.id === 'string' &&
        reference.id.trim().length > 0
    ) &&
    stringArray(value.errors)
  );
}

const stringArraysEqual = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((item, index) => item === right[index]);

function isSemanticallyValidEntry(entry: ManagedWorkspaceInventoryEntry): boolean {
  const identities = entry.references.map(({ source, id }) => `${source}\0${id}`);
  if (new Set(identities).size !== identities.length) return false;

  const observed = {
    referenceCount: entry.references.filter(({ source }) => source === 'conversation' || source === 'project').length,
    scheduleCount: entry.references.filter(({ source }) => source === 'schedule').length,
    activeProcessCount: entry.references.filter(({ source }) => source === 'active-process').length,
    artifactCount: entry.references.filter(({ source }) => source === 'artifact' || source === 'receipt').length,
  };
  for (const key of Object.keys(observed) as Array<keyof typeof observed>) {
    const declared = entry.evidence[key];
    if (declared === null ? observed[key] !== 0 : declared !== observed[key]) return false;
  }

  const expectedDecision = classifyManagedWorkspaceRetention(entry.evidence);
  return (
    entry.decision.disposition === expectedDecision.disposition &&
    stringArraysEqual(entry.decision.classifications, expectedDecision.classifications) &&
    stringArraysEqual(entry.decision.reasons, expectedDecision.reasons)
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
  const report = value as ManagedWorkspaceInventoryReport;
  const authoritiesComplete = WORKSPACE_AUTHORITY_SOURCES.every((source) => completeness[source] === 'complete');
  if (report.entries.some((entry) => !isSemanticallyValidEntry(entry))) return null;
  const expectedSummary: ManagedWorkspaceInventoryReport['summary'] = {
    discovered: report.entries.length,
    preserved: report.entries.filter((entry) => entry.decision.disposition === 'preserve').length,
    reviewCandidate: report.entries.filter((entry) => entry.decision.disposition === 'review-candidate').length,
    unknown: report.entries.filter((entry) => entry.decision.classifications.includes('unknown')).length,
  };
  if (
    report.summary.discovered !== expectedSummary.discovered ||
    report.summary.preserved !== expectedSummary.preserved ||
    report.summary.reviewCandidate !== expectedSummary.reviewCandidate ||
    report.summary.unknown !== expectedSummary.unknown
  ) {
    return null;
  }
  const expectedComplete =
    authoritiesComplete &&
    report.errors.length === 0 &&
    report.entries.every((entry) => entry.errors.length === 0 && entry.evidence.inventoryComplete);
  if (report.complete !== expectedComplete) return null;
  if (
    report.entries.some(
      (entry) =>
        entry.decision.disposition === 'review-candidate' &&
        !isSemanticallyValidReviewCandidate(entry, report.complete, authoritiesComplete)
    )
  ) {
    return null;
  }
  return report;
}
