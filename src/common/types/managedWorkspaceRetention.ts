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
  reasons: ManagedWorkspaceRetentionReason[];
};

export const MANAGED_WORKSPACE_RETENTION_REASONS = [
  'malformed-evidence',
  'uninspectable-evidence',
  'referenced',
  'scheduled',
  'active',
  'artifact-bearing',
  'modified',
  'user-promoted',
  'empty-abandoned',
  'provenance-unproven',
  'inventory-incomplete',
  'evidence-invalid',
  'promotion-unknown',
  'content-unknown',
  'mutation-unknown',
  'age-unknown',
  'retention-window-pending',
] as const;

export type ManagedWorkspaceRetentionReason = (typeof MANAGED_WORKSPACE_RETENTION_REASONS)[number];

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
  const reasons: ManagedWorkspaceRetentionReason[] = [];

  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return {
      classifications: ['unknown'],
      disposition: 'preserve',
      reasons: ['malformed-evidence'],
    };
  }
  let candidate: Partial<ManagedWorkspaceEvidence>;
  try {
    candidate = { ...(evidence as Record<string, unknown>) } as Partial<ManagedWorkspaceEvidence>;
  } catch {
    return {
      classifications: ['unknown'],
      disposition: 'preserve',
      reasons: ['uninspectable-evidence'],
    };
  }

  if (isKnownCount(candidate.referenceCount ?? null) && Number(candidate.referenceCount) > 0) {
    classifications.push('referenced');
    reasons.push('referenced');
  }
  if (isKnownCount(candidate.scheduleCount ?? null) && Number(candidate.scheduleCount) > 0) {
    classifications.push('scheduled');
    reasons.push('scheduled');
  }
  if (isKnownCount(candidate.activeProcessCount ?? null) && Number(candidate.activeProcessCount) > 0) {
    classifications.push('active');
    reasons.push('active');
  }
  if (isKnownCount(candidate.artifactCount ?? null) && Number(candidate.artifactCount) > 0) {
    classifications.push('artifact-bearing');
    reasons.push('artifact-bearing');
  }
  if (candidate.modified === true || candidate.userContent === 'present') {
    classifications.push('modified');
    reasons.push('modified');
  }
  if (candidate.userPromoted === true) {
    classifications.push('user-promoted');
    reasons.push('user-promoted');
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
      reasons: ['empty-abandoned'],
    };
  }

  if (classifications.length === 0) classifications.push('unknown');
  if (!candidate.managedProvenance) reasons.push('provenance-unproven');
  if (!candidate.inventoryComplete) reasons.push('inventory-incomplete');
  if (!evidenceShapeValid) reasons.push('evidence-invalid');
  if (candidate.userPromoted === null) reasons.push('promotion-unknown');
  if (candidate.userContent === 'unknown') reasons.push('content-unknown');
  if (candidate.modified === null) reasons.push('mutation-unknown');
  if (candidate.abandonedForMs === null) reasons.push('age-unknown');
  if (
    candidate.abandonedForMs !== null &&
    Number.isSafeInteger(candidate.abandonedForMs) &&
    Number(candidate.abandonedForMs) >= 0 &&
    Number(candidate.abandonedForMs) < Number(candidate.retentionWindowMs)
  ) {
    reasons.push('retention-window-pending');
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
    Array.isArray(value.reasons) &&
    value.reasons.every((reason) =>
      MANAGED_WORKSPACE_RETENTION_REASONS.includes(reason as ManagedWorkspaceRetentionReason)
    )
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
  if (
    entry.evidence.inventoryComplete &&
    [
      entry.evidence.referenceCount,
      entry.evidence.scheduleCount,
      entry.evidence.activeProcessCount,
      entry.evidence.artifactCount,
    ].some((count) => count === null)
  ) {
    return false;
  }
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

function normalizedAbsolutePath(value: string): string | null {
  if (value.length === 0 || value.trim() !== value || value.includes('\0')) return null;
  const slashPath = value.replace(/\\/g, '/');
  const drivePrefix = /^[a-z]:\//i.exec(slashPath)?.[0];
  if (!slashPath.startsWith('/') && !drivePrefix) return null;

  const prefix = drivePrefix ? drivePrefix.toLowerCase() : '/';
  const rest = drivePrefix ? slashPath.slice(drivePrefix.length) : slashPath.slice(1);
  const segments = rest.split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) return null;
  return `${prefix}${segments.join('/')}`;
}

function isDirectManagedChild(root: string, candidate: string): boolean {
  const normalizedRoot = normalizedAbsolutePath(root);
  const normalizedCandidate = normalizedAbsolutePath(candidate);
  if (!normalizedRoot || !normalizedCandidate) return false;
  const prefix = `${normalizedRoot}/`;
  if (!normalizedCandidate.startsWith(prefix)) return false;
  const name = normalizedCandidate.slice(prefix.length);
  return !name.includes('/') && isManagedWorkspaceName(name);
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
  const normalizedRoot = normalizedAbsolutePath(report.root);
  const normalizedCanonicalRoot = report.canonicalRoot === null ? null : normalizedAbsolutePath(report.canonicalRoot);
  if (!normalizedRoot || (report.canonicalRoot !== null && !normalizedCanonicalRoot)) return null;
  if (
    report.entries.some(
      (entry) =>
        !isDirectManagedChild(report.root, entry.path) ||
        (entry.canonicalPath !== null &&
          (!report.canonicalRoot || !isDirectManagedChild(report.canonicalRoot, entry.canonicalPath)))
    )
  ) {
    return null;
  }
  const entryPaths = report.entries.map((entry) => normalizedAbsolutePath(entry.path));
  const canonicalPaths = report.entries
    .map((entry) => (entry.canonicalPath === null ? null : normalizedAbsolutePath(entry.canonicalPath)))
    .filter((entry): entry is string => entry !== null);
  if (new Set(entryPaths).size !== entryPaths.length || new Set(canonicalPaths).size !== canonicalPaths.length)
    return null;
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
    report.entries.every(
      (entry) =>
        entry.errors.length === 0 &&
        entry.evidence.inventoryComplete &&
        isKnownCount(entry.evidence.referenceCount) &&
        isKnownCount(entry.evidence.scheduleCount) &&
        isKnownCount(entry.evidence.activeProcessCount) &&
        isKnownCount(entry.evidence.artifactCount)
    );
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
