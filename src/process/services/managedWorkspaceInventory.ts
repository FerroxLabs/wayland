/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  classifyManagedWorkspaceRetention,
  type ManagedWorkspaceEvidence,
  type ManagedWorkspaceRetentionDecision,
} from './workspaceRetention';

export type WorkspaceAuthoritySource =
  | 'conversation'
  | 'project'
  | 'schedule'
  | 'artifact'
  | 'receipt'
  | 'active-process';

export type WorkspaceAuthorityState = 'complete' | 'unavailable' | 'error';

export type WorkspaceAuthorityCompleteness = Record<WorkspaceAuthoritySource, WorkspaceAuthorityState>;

export type WorkspaceAuthorityReference = {
  source: WorkspaceAuthoritySource;
  id: string;
  workspace: string;
  /** Only conversation/Project collectors may assert explicit user promotion. */
  userPromoted?: boolean;
};

export type ManagedWorkspaceInventoryEntry = {
  path: string;
  canonicalPath: string | null;
  evidence: ManagedWorkspaceEvidence;
  decision: ManagedWorkspaceRetentionDecision;
  references: Array<Pick<WorkspaceAuthorityReference, 'source' | 'id'>>;
  errors: string[];
};

export type ManagedWorkspaceInventoryReport = {
  generatedAt: string;
  root: string;
  canonicalRoot: string | null;
  /** Per-source truth used to decide whether any cleanup candidate is provable. */
  authorityCompleteness: WorkspaceAuthorityCompleteness;
  complete: boolean;
  entries: ManagedWorkspaceInventoryEntry[];
  summary: {
    discovered: number;
    preserved: number;
    quarantineEligible: number;
    unknown: number;
  };
  errors: string[];
};

export type CollectManagedWorkspaceInventoryInput = {
  /** Must be Desktop's app-owned `getSystemDir().workDir`, never a user Project. */
  workDir: string;
  references: WorkspaceAuthorityReference[];
  authorityCompleteness: WorkspaceAuthorityCompleteness;
  retentionWindowMs: number;
  nowMs?: number;
};

type CanonicalWorkspaceReference = WorkspaceAuthorityReference & { canonicalWorkspace: string };
type CanonicalWorkspaceReferenceResult = {
  reference: CanonicalWorkspaceReference | null;
  error: string | null;
};

const TEMP_WORKSPACE_NAME = /^[a-z0-9_-]+-temp-\d{10,}$/i;

const isAuthorityComplete = (states: WorkspaceAuthorityCompleteness): boolean =>
  Object.values(states).every((state) => state === 'complete');

const pathIsDirectChild = (root: string, candidate: string): boolean => path.dirname(candidate) === root;

function emptyUnknownEvidence(retentionWindowMs: number): ManagedWorkspaceEvidence {
  return {
    managedProvenance: false,
    inventoryComplete: false,
    referenceCount: null,
    scheduleCount: null,
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
    quarantineEligible: entries.filter((entry) => entry.decision.disposition === 'quarantine-eligible').length,
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
  input: CollectManagedWorkspaceInventoryInput
): Promise<ManagedWorkspaceInventoryReport> {
  const nowMs = input.nowMs ?? Date.now();
  const root = path.resolve(input.workDir);
  const errors: string[] = [];

  if (!Number.isSafeInteger(nowMs) || nowMs < 0) errors.push('invalid inventory timestamp');
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
      generatedAt: new Date(Number.isSafeInteger(nowMs) && nowMs >= 0 ? nowMs : 0).toISOString(),
      root,
      canonicalRoot: null,
      authorityCompleteness: { ...input.authorityCompleteness },
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
      generatedAt: new Date(Number.isSafeInteger(nowMs) && nowMs >= 0 ? nowMs : 0).toISOString(),
      root,
      canonicalRoot,
      authorityCompleteness: { ...input.authorityCompleteness },
      complete: false,
      entries: [],
      summary: summarize([]),
      errors,
    };
  }

  const referenceResults = await Promise.all(
    input.references.map(async (reference): Promise<CanonicalWorkspaceReferenceResult> => {
      if (!reference.workspace || !path.isAbsolute(reference.workspace)) {
        return {
          reference: null,
          error: `reference ${reference.source}:${reference.id} has no absolute workspace path`,
        };
      }
      try {
        return {
          reference: { ...reference, canonicalWorkspace: await fs.realpath(reference.workspace) },
          error: null,
        };
      } catch (error) {
        return {
          reference: null,
          error: `reference ${reference.source}:${reference.id} cannot be canonicalized: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    })
  );
  const canonicalReferences: CanonicalWorkspaceReference[] = [];
  let referenceCanonicalizationComplete = true;
  for (const result of referenceResults) {
    if (result.reference) canonicalReferences.push(result.reference);
    if (result.error) {
      referenceCanonicalizationComplete = false;
      errors.push(result.error);
    }
  }

  const authorityInventoryComplete =
    isAuthorityComplete(input.authorityCompleteness) && referenceCanonicalizationComplete && errors.length === 0;
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

        const matchedReferences = canonicalReferences.filter(
          (reference) => reference.canonicalWorkspace === candidateCanonicalPath
        );
        const content = await fs.readdir(candidateCanonicalPath);
        const contentKnown = Array.isArray(content);
        const userContent = contentKnown && content.length === 0 ? 'absent' : 'present';
        const candidateInventoryComplete = authorityInventoryComplete && contentKnown;
        const observedReferenceCount = matchedReferences.filter((reference) =>
          ['conversation', 'project', 'active-process'].includes(reference.source)
        ).length;
        const observedScheduleCount = matchedReferences.filter((reference) => reference.source === 'schedule').length;
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
        const artifactCount = candidateInventoryComplete || observedArtifactCount > 0 ? observedArtifactCount : null;
        const userPromoted = candidateInventoryComplete || observedUserPromotion ? observedUserPromotion : null;

        evidence = {
          managedProvenance: true,
          inventoryComplete: candidateInventoryComplete,
          referenceCount,
          scheduleCount,
          artifactCount,
          userPromoted,
          userContent,
          modified: contentKnown ? content.length > 0 : null,
          abandonedForMs:
            Number.isSafeInteger(nowMs) && nowMs >= candidateStat.mtimeMs
              ? Math.floor(nowMs - candidateStat.mtimeMs)
              : null,
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
    generatedAt: new Date(Number.isSafeInteger(nowMs) && nowMs >= 0 ? nowMs : 0).toISOString(),
    root,
    canonicalRoot,
    authorityCompleteness: { ...input.authorityCompleteness },
    complete: authorityInventoryComplete && entries.every((entry) => entry.errors.length === 0),
    entries,
    summary: summarize(entries),
    errors,
  };
}
