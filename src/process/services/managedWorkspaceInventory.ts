/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  WORKSPACE_AUTHORITY_SOURCES,
  type ManagedWorkspaceEvidence,
  type ManagedWorkspaceInventoryEntry,
  type ManagedWorkspaceInventoryReport,
  type WorkspaceAuthorityCompleteness,
  type WorkspaceAuthorityState,
  type WorkspaceReferenceAuthoritySource,
} from '@/common/types/managedWorkspaceRetention';
import { classifyManagedWorkspaceRetention } from './workspaceRetention';
import type { ManagedWorkspaceProvenanceRecord } from './managedWorkspaceProvenance';

export type {
  ManagedWorkspaceInventoryEntry,
  ManagedWorkspaceInventoryReport,
  WorkspaceAuthorityCompleteness,
  WorkspaceAuthorityState,
  WorkspaceReferenceAuthoritySource as WorkspaceAuthoritySource,
} from '@/common/types/managedWorkspaceRetention';

export type WorkspaceAuthorityReference = {
  source: WorkspaceReferenceAuthoritySource;
  id: string;
  workspace: string;
  /** Only conversation/Project collectors may assert explicit user promotion. */
  userPromoted?: boolean;
};

export type CollectManagedWorkspaceInventoryInput = {
  /** Must be Desktop's app-owned `getSystemDir().workDir`, never a user Project. */
  workDir: string;
  references: WorkspaceAuthorityReference[];
  authorityCompleteness: WorkspaceAuthorityCompleteness;
  installationId: string;
  provenanceRecords: ManagedWorkspaceProvenanceRecord[];
  retentionWindowMs: number;
  nowMs?: number;
};

type CanonicalWorkspaceReference = WorkspaceAuthorityReference & { canonicalWorkspace: string };
type CanonicalWorkspaceReferenceResult = {
  reference: CanonicalWorkspaceReference | null;
  error: string | null;
};

const TEMP_WORKSPACE_NAME = /^[a-z0-9_-]+-temp-\d{10,}$/i;
const REFERENCE_AUTHORITY_SOURCES = new Set<WorkspaceReferenceAuthoritySource>([
  'conversation',
  'project',
  'schedule',
  'artifact',
  'receipt',
  'active-process',
]);
const MAX_DATE_MS = 8_640_000_000_000_000;
const compareCodeUnits = (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0);

const isAuthorityComplete = (states: WorkspaceAuthorityCompleteness): boolean => {
  try {
    if (!states || typeof states !== 'object') return false;
    const keys = Object.keys(states);
    return (
      keys.length === WORKSPACE_AUTHORITY_SOURCES.length &&
      WORKSPACE_AUTHORITY_SOURCES.every((source) => keys.includes(source) && states[source] === 'complete')
    );
  } catch {
    return false;
  }
};

const unavailableAuthorities = (): WorkspaceAuthorityCompleteness => ({
  conversation: 'error',
  project: 'error',
  schedule: 'error',
  artifact: 'error',
  receipt: 'error',
  'active-process': 'error',
  provenance: 'error',
  snapshot: 'unavailable',
});

const pathIsDirectChild = (root: string, candidate: string): boolean => path.dirname(candidate) === root;

function emptyUnknownEvidence(retentionWindowMs: number): ManagedWorkspaceEvidence {
  return {
    managedProvenance: false,
    inventoryComplete: false,
    referenceCount: null,
    scheduleCount: null,
    activeProcessCount: null,
    artifactCount: null,
    userPromoted: null,
    userContent: 'unknown',
    modified: null,
    abandonedForMs: null,
    retentionWindowMs,
  };
}

function summarize(entries: ManagedWorkspaceInventoryEntry[]): ManagedWorkspaceInventoryReport['summary'] {
  return {
    discovered: entries.length,
    preserved: entries.filter((entry) => entry.decision.disposition === 'preserve').length,
    reviewCandidate: entries.filter((entry) => entry.decision.disposition === 'review-candidate').length,
    unknown: entries.filter((entry) => entry.decision.classifications.includes('unknown')).length,
  };
}

/**
 * Build a read-only dry-run inventory of app-generated temporary workspaces.
 *
 * This function contains no write, rename, quarantine, or delete operation.
 * Any root/candidate/reference canonicalization failure makes the relevant
 * evidence incomplete and therefore fail-closed to `preserve`.
 */
export async function collectManagedWorkspaceInventory(
  unsafeInput: CollectManagedWorkspaceInventoryInput | unknown
): Promise<ManagedWorkspaceInventoryReport> {
  let input: CollectManagedWorkspaceInventoryInput;
  try {
    if (!unsafeInput || typeof unsafeInput !== 'object' || Array.isArray(unsafeInput)) {
      throw new Error('inventory input is not an object');
    }
    input = { ...(unsafeInput as CollectManagedWorkspaceInventoryInput) };
  } catch (error) {
    return {
      generatedAt: new Date(0).toISOString(),
      root: '',
      canonicalRoot: null,
      authorityCompleteness: unavailableAuthorities(),
      complete: false,
      entries: [],
      summary: summarize([]),
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
  const errors: string[] = [];
  let root = '';
  try {
    if (typeof input.workDir !== 'string' || !input.workDir) throw new Error('work root path is malformed');
    root = path.resolve(input.workDir);
  } catch (error) {
    return {
      generatedAt: new Date(0).toISOString(),
      root: '',
      canonicalRoot: null,
      authorityCompleteness: unavailableAuthorities(),
      complete: false,
      entries: [],
      summary: summarize([]),
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
  const nowMs = input.nowMs ?? Date.now();
  let authorityCompleteness: WorkspaceAuthorityCompleteness;
  try {
    authorityCompleteness = { ...input.authorityCompleteness, snapshot: 'unavailable' };
  } catch {
    authorityCompleteness = unavailableAuthorities();
    errors.push('authority completeness is malformed');
  }

  const nowValid = Number.isSafeInteger(nowMs) && nowMs >= 0 && nowMs <= MAX_DATE_MS;
  if (!nowValid) errors.push('invalid inventory timestamp');
  if (!Number.isSafeInteger(input.retentionWindowMs) || input.retentionWindowMs < 0) {
    errors.push('invalid retention window');
  }

  let canonicalRoot: string;
  try {
    const rootStat = await fs.lstat(root);
    if (!rootStat.isSymbolicLink() && !rootStat.isDirectory()) {
      throw new Error('Desktop work root is not a directory or directory alias');
    }
    canonicalRoot = await fs.realpath(root);
    const canonicalRootStat = await fs.lstat(canonicalRoot);
    if (canonicalRootStat.isSymbolicLink() || !canonicalRootStat.isDirectory()) {
      throw new Error('Desktop work root alias does not resolve to a real directory');
    }
  } catch (error) {
    errors.push(`work root unavailable: ${error instanceof Error ? error.message : String(error)}`);
    return {
      generatedAt: new Date(nowValid ? nowMs : 0).toISOString(),
      root,
      canonicalRoot: null,
      authorityCompleteness,
      complete: false,
      entries: [],
      summary: summarize([]),
      errors,
    };
  }

  let children: string[];
  try {
    children = (await fs.readdir(canonicalRoot)).filter((name) => TEMP_WORKSPACE_NAME.test(name)).toSorted();
  } catch (error) {
    errors.push(`work root inventory failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      generatedAt: new Date(nowValid ? nowMs : 0).toISOString(),
      root,
      canonicalRoot,
      authorityCompleteness,
      complete: false,
      entries: [],
      summary: summarize([]),
      errors,
    };
  }

  let referenceResults: CanonicalWorkspaceReferenceResult[] = [];
  try {
    // Array.from materializes sparse holes as explicit undefined values. Using
    // Array#map directly would preserve holes and Promise.all would return
    // undefined slots that the result loop could later dereference and throw.
    const rawReferences: unknown[] = Array.isArray(input.references) ? Array.from(input.references) : [];
    referenceResults = await Promise.all(
      rawReferences.map(async (reference): Promise<CanonicalWorkspaceReferenceResult> => {
        try {
          if (
            !reference ||
            typeof reference !== 'object' ||
            !REFERENCE_AUTHORITY_SOURCES.has((reference as WorkspaceAuthorityReference).source) ||
            typeof (reference as WorkspaceAuthorityReference).id !== 'string' ||
            !(reference as WorkspaceAuthorityReference).id.trim() ||
            typeof (reference as WorkspaceAuthorityReference).workspace !== 'string' ||
            !path.isAbsolute((reference as WorkspaceAuthorityReference).workspace) ||
            ((reference as WorkspaceAuthorityReference).userPromoted !== undefined &&
              typeof (reference as WorkspaceAuthorityReference).userPromoted !== 'boolean')
          ) {
            return {
              reference: null,
              error: 'authority reference is malformed or has no absolute workspace path',
            };
          }
          const validReference = reference as WorkspaceAuthorityReference;
          return {
            reference: { ...validReference, canonicalWorkspace: await fs.realpath(validReference.workspace) },
            error: null,
          };
        } catch (error) {
          return {
            reference: null,
            error: `authority reference cannot be canonicalized: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      })
    );
  } catch (error) {
    errors.push(`authority references cannot be enumerated: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(input.references)) errors.push('authority references are malformed');
  const canonicalReferences: CanonicalWorkspaceReference[] = [];
  let referenceCanonicalizationComplete = true;
  for (const result of referenceResults) {
    if (result.reference) canonicalReferences.push(result.reference);
    if (result.error) {
      referenceCanonicalizationComplete = false;
      errors.push(result.error);
    }
  }
  canonicalReferences.sort(
    (left, right) =>
      compareCodeUnits(left.source, right.source) ||
      compareCodeUnits(left.id, right.id) ||
      compareCodeUnits(left.canonicalWorkspace, right.canonicalWorkspace)
  );
  const deduplicatedReferences: CanonicalWorkspaceReference[] = [];
  for (const reference of canonicalReferences) {
    const previous = deduplicatedReferences.at(-1);
    if (previous && previous.source === reference.source && previous.id === reference.id) {
      if (
        previous.canonicalWorkspace !== reference.canonicalWorkspace ||
        previous.userPromoted !== reference.userPromoted
      ) {
        referenceCanonicalizationComplete = false;
        errors.push(`authority reference ${reference.source}:${reference.id} is contradictory`);
      }
      continue;
    }
    deduplicatedReferences.push(reference);
  }

  const authorityInventoryComplete =
    isAuthorityComplete(authorityCompleteness) && referenceCanonicalizationComplete && errors.length === 0;
  const entries = await Promise.all(
    children.map(async (name): Promise<ManagedWorkspaceInventoryEntry> => {
      const candidatePath = path.join(canonicalRoot, name);
      const entryErrors: string[] = [];
      let candidateCanonicalPath: string | null = null;
      let evidence = emptyUnknownEvidence(input.retentionWindowMs);

      try {
        const candidateStat = await fs.lstat(candidatePath);
        if (candidateStat.isSymbolicLink()) throw new Error('candidate is a symbolic link');
        if (!candidateStat.isDirectory()) throw new Error('candidate is not a directory');

        candidateCanonicalPath = await fs.realpath(candidatePath);
        if (!pathIsDirectChild(canonicalRoot, candidateCanonicalPath)) {
          throw new Error('candidate escapes the Desktop work root');
        }

        const matchedReferences = deduplicatedReferences.filter(
          (reference) => reference.canonicalWorkspace === candidateCanonicalPath
        );
        const content = await fs.readdir(candidateCanonicalPath);
        const contentKnown = Array.isArray(content);
        const finalStat = await fs.lstat(candidatePath);
        const finalCanonicalPath = await fs.realpath(candidatePath);
        if (
          finalStat.isSymbolicLink() ||
          !finalStat.isDirectory() ||
          finalCanonicalPath !== candidateCanonicalPath ||
          finalStat.dev !== candidateStat.dev ||
          finalStat.ino !== candidateStat.ino ||
          finalStat.mtimeMs !== candidateStat.mtimeMs ||
          finalStat.ctimeMs !== candidateStat.ctimeMs
        ) {
          throw new Error('candidate changed during inventory');
        }
        const userContent = contentKnown && content.length === 0 ? 'absent' : 'present';
        let managedProvenance = false;
        try {
          const matches = (Array.isArray(input.provenanceRecords) ? input.provenanceRecords : []).filter(
            (record) =>
              record.installationId === input.installationId &&
              record.canonicalRoot === canonicalRoot &&
              record.canonicalPath === candidateCanonicalPath &&
              record.device === candidateStat.dev &&
              record.inode === candidateStat.ino
          );
          managedProvenance = authorityCompleteness.provenance === 'complete' && matches.length === 1;
          if (matches.length > 1) entryErrors.push('workspace provenance is duplicated');
        } catch (error) {
          entryErrors.push(
            `workspace provenance cannot be inspected: ${error instanceof Error ? error.message : String(error)}`
          );
        }
        // Node has no portable openat/no-follow immutable directory snapshot.
        // Never promote an observed empty listing into cleanup-adjacent evidence.
        const candidateInventoryComplete = false;
        const observedReferenceCount = matchedReferences.filter((reference) =>
          ['conversation', 'project'].includes(reference.source)
        ).length;
        const observedScheduleCount = matchedReferences.filter((reference) => reference.source === 'schedule').length;
        const observedActiveProcessCount = matchedReferences.filter(
          (reference) => reference.source === 'active-process'
        ).length;
        const observedArtifactCount = matchedReferences.filter((reference) =>
          ['artifact', 'receipt'].includes(reference.source)
        ).length;
        const observedUserPromotion = matchedReferences.some(
          (reference) =>
            (reference.source === 'conversation' || reference.source === 'project') && reference.userPromoted === true
        );

        // Positive observations are safe to report even when another authority
        // is unavailable: one live reference is enough to preserve. Zero is only
        // authoritative when the entire inventory is complete.
        const referenceCount = candidateInventoryComplete || observedReferenceCount > 0 ? observedReferenceCount : null;
        const scheduleCount = candidateInventoryComplete || observedScheduleCount > 0 ? observedScheduleCount : null;
        const activeProcessCount =
          candidateInventoryComplete || observedActiveProcessCount > 0 ? observedActiveProcessCount : null;
        const artifactCount = candidateInventoryComplete || observedArtifactCount > 0 ? observedArtifactCount : null;
        const userPromoted = candidateInventoryComplete || observedUserPromotion ? observedUserPromotion : null;

        evidence = {
          managedProvenance,
          inventoryComplete: candidateInventoryComplete,
          referenceCount,
          scheduleCount,
          activeProcessCount,
          artifactCount,
          userPromoted,
          userContent,
          modified: contentKnown ? content.length > 0 : null,
          abandonedForMs: nowValid && nowMs >= candidateStat.mtimeMs ? Math.floor(nowMs - candidateStat.mtimeMs) : null,
          retentionWindowMs: input.retentionWindowMs,
        };

        return {
          path: candidatePath,
          canonicalPath: candidateCanonicalPath,
          evidence,
          decision: classifyManagedWorkspaceRetention(evidence),
          references: matchedReferences.map(({ source, id }) => ({ source, id })),
          errors: entryErrors,
        };
      } catch (error) {
        entryErrors.push(error instanceof Error ? error.message : String(error));
      }

      return {
        path: candidatePath,
        canonicalPath: candidateCanonicalPath,
        evidence,
        decision: classifyManagedWorkspaceRetention(evidence),
        references: [],
        errors: entryErrors,
      };
    })
  );

  return {
    generatedAt: new Date(nowValid ? nowMs : 0).toISOString(),
    root,
    canonicalRoot,
    authorityCompleteness,
    complete: authorityInventoryComplete && entries.every((entry) => entry.errors.length === 0),
    entries,
    summary: summarize(entries),
    errors,
  };
}
