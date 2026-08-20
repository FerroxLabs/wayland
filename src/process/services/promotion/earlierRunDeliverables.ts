/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Earlier runs, from before the task had a durable workspace.
 *
 * A recurring task that ran in `new_conversation` mode left one throwaway
 * `wcore-temp-<ts>` workspace per run, each holding a real report. Promotion
 * only moves the CURRENT workspace, so without this the acceptance bar's "and
 * tomorrow show me both days" is false for every run that already happened.
 *
 * Two things we deliberately do NOT do:
 *
 *  - **Link to them.** The product calls that storage "Temporary Space" and the
 *    retention system exists to reclaim it, so a link would rot into a dead
 *    click at some unpredictable future date.
 *  - **Copy the whole tree.** Those workspaces are mostly the copied bundled
 *    skill library. Promoting all of it multiplies the riskiest operation in
 *    the milestone across N stranded folders and uploads the skill tree to
 *    iCloud N times over.
 *
 * So: find CANDIDATES, show them to the user, copy only what they keep, and
 * leave every source workspace exactly as it was.
 *
 * Finding them is the awkward part. Pre-fix runs wrote their output INTO
 * `.wayland-core/skills/<name>/`, a hidden machinery directory, next to the
 * bundled `SKILL.md` that was copied there when the workspace was created. The
 * file extension proves nothing (`.log` can be the deliverable, `.md` can be
 * machinery), so the only honest discriminator available is WHEN it was
 * written: setup copies land at workspace-creation time, a run's output lands
 * later. That heuristic decides what is SHOWN and nothing else - the user
 * chooses what is actually copied.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { WORKSPACE_MARKER_FILE } from '@process/services/workspaceIdentity';
import { copyFileWithQuiesce } from './promotionCopy';

/** Anything written this long after workspace creation was written by a RUN. */
const SETUP_SETTLE_MS = 2_000;
/** Never build an unbounded list for the picker. */
const DEFAULT_MAX_CANDIDATES = 500;
/** The post-fix deliverable directory: always offered, whatever the mtime says. */
const ARTIFACTS_DIR = 'artifacts';

export type EarlierRunWorkspace = Readonly<{
  conversationId: string;
  workspace: string;
  /** The conversation's creation time: when the setup copy landed. */
  createdAtMs: number;
}>;

export type DeliverableCandidate = Readonly<{
  conversationId: string;
  sourceWorkspace: string;
  relPath: string;
  size: number;
  modifiedAtMs: number;
  /** It sat in `artifacts/`, i.e. a post-fix run declared it. */
  declared: boolean;
  /** It sat inside `.wayland-core/`, i.e. a pre-fix run hid it in machinery. */
  hidden: boolean;
}>;

export type ImportSelection = Readonly<{ conversationId: string; sourceWorkspace: string; relPath: string }>;

export type ImportedDeliverable = Readonly<{ relPath: string; sha256: string; sourceWorkspace: string }>;

export type ImportFailure = Readonly<{
  relPath: string;
  /** `not-offered`: the selection was not one of the files the OFFER listed. */
  reason: 'outside-workspace' | 'not-a-file' | 'copy-failed' | 'not-offered';
}>;

const toRel = (rel: string): string => rel.split(path.sep).join('/');

function isInside(root: string, candidate: string): boolean {
  const r = path.resolve(root);
  const c = path.resolve(candidate);
  return c === r || c.startsWith(r.endsWith(path.sep) ? r : r + path.sep);
}

export async function findEarlierRunDeliverables(input: {
  workspaces: readonly EarlierRunWorkspace[];
  /** The workspace the task now uses; never offer its own files back to it. */
  excludeWorkspace?: string;
  maxCandidates?: number;
}): Promise<{ candidates: DeliverableCandidate[]; truncated: boolean }> {
  const limit = input.maxCandidates ?? DEFAULT_MAX_CANDIDATES;
  const candidates: DeliverableCandidate[] = [];
  let truncated = false;

  for (const source of input.workspaces) {
    if (!source.workspace) continue;
    if (input.excludeWorkspace && path.resolve(source.workspace) === path.resolve(input.excludeWorkspace)) continue;
    if (candidates.length >= limit) {
      truncated = true;
      break;
    }
    const found = await scanWorkspace(source, limit - candidates.length);
    truncated = truncated || found.truncated;
    candidates.push(...found.candidates);
  }

  return { candidates, truncated };
}

async function scanWorkspace(
  source: EarlierRunWorkspace,
  budget: number
): Promise<{ candidates: DeliverableCandidate[]; truncated: boolean }> {
  const candidates: DeliverableCandidate[] = [];
  const settledAfter = source.createdAtMs + SETUP_SETTLE_MS;
  let truncated = false;

  const walk = async (relDir: string): Promise<void> => {
    if (truncated) return;
    const absDir = relDir ? path.join(source.workspace, relDir) : source.workspace;
    const names = await fs.readdir(absDir).catch((): null => null);
    if (!names) return;
    for (const name of names.toSorted()) {
      if (truncated) return;
      const rel = toRel(relDir ? path.join(relDir, name) : name);
      if (rel === WORKSPACE_MARKER_FILE) continue;
      const abs = path.join(source.workspace, rel);
      // lstat, so a link is never followed out of the workspace.
      const st = await fs.lstat(abs).catch((): null => null);
      if (!st) continue;
      if (st.isDirectory()) {
        await walk(rel);
        continue;
      }
      if (!st.isFile()) continue;
      const declared = rel === ARTIFACTS_DIR || rel.startsWith(`${ARTIFACTS_DIR}/`);
      if (!declared && st.mtimeMs < settledAfter) continue;
      if (candidates.length >= budget) {
        truncated = true;
        return;
      }
      candidates.push({
        conversationId: source.conversationId,
        sourceWorkspace: source.workspace,
        relPath: rel,
        size: st.size,
        modifiedAtMs: st.mtimeMs,
        declared,
        hidden: rel.startsWith('.wayland-core/'),
      });
    }
  };

  await walk('');
  return { candidates, truncated };
}

/**
 * Copy the chosen files into the durable task's `artifacts/<date>/<run-id>/`
 * series, digest-verified, via a staging name so a half-written file never
 * appears under the published one. Nothing is read from a path that resolves
 * outside its own source workspace, and nothing in the source is modified.
 */
export async function importEarlierRunDeliverables(
  targetWorkspace: string,
  selections: readonly ImportSelection[]
): Promise<{ imported: ImportedDeliverable[]; failed: ImportFailure[] }> {
  const imported: ImportedDeliverable[] = [];
  const failed: ImportFailure[] = [];

  for (const selection of selections) {
    const abs = path.resolve(selection.sourceWorkspace, selection.relPath);
    if (path.isAbsolute(selection.relPath) || !isInside(selection.sourceWorkspace, abs)) {
      failed.push({ relPath: selection.relPath, reason: 'outside-workspace' });
      continue;
    }
    const st = await fs.lstat(abs).catch((): null => null);
    if (!st?.isFile()) {
      failed.push({ relPath: selection.relPath, reason: 'not-a-file' });
      continue;
    }

    const runDir = path.join(
      targetWorkspace,
      ARTIFACTS_DIR,
      seriesDate(st.mtimeMs),
      `imported-${selection.conversationId}`
    );
    await fs.mkdir(runDir, { recursive: true });
    const destination = await freeName(runDir, path.basename(selection.relPath));
    const staging = `${destination}.importing-${process.pid}-${Date.now()}`;
    try {
      const sha256 = await copyFileWithQuiesce(abs, staging, selection.relPath, {});
      await fs.rename(staging, destination);
      imported.push({
        relPath: path.relative(targetWorkspace, destination),
        sha256,
        sourceWorkspace: selection.sourceWorkspace,
      });
    } catch {
      await fs.rm(staging, { force: true }).catch((): undefined => undefined);
      failed.push({ relPath: selection.relPath, reason: 'copy-failed' });
    }
  }

  return { imported, failed };
}

/** `YYYY-MM-DD` in UTC: the series folder is presentation, not identity. */
function seriesDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Never overwrite something already published; suffix instead. */
async function freeName(dir: string, basename: string): Promise<string> {
  const ext = path.extname(basename);
  const stem = basename.slice(0, basename.length - ext.length);
  for (let n = 1; n < 1000; n += 1) {
    const candidate = path.join(dir, n === 1 ? basename : `${stem} (${n})${ext}`);
    if (!(await fs.lstat(candidate).catch((): null => null))) return candidate;
  }
  throw new Error(`cannot publish ${basename}: too many collisions`);
}
