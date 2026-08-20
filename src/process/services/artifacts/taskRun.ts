/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ONE RUN OF A RECURRING TASK, from "the agent is about to start" to "the user
 * can see what it produced".
 *
 * The spine (P2-2) gives a task a durable workspace. The publishing layer
 * (P2-6) gives a series a staging directory, an atomic publish and a ledger.
 * Neither calls the other, and the run path calls neither. This is that seam,
 * and it is the whole feature: without it a routine has a folder it can write
 * to and no notion of a run, so run 2 overwrites run 1 and "show me both days"
 * has nothing to show.
 *
 * THE RUN WORKSPACE STAYS THE TASK ROOT. Core sandboxes the engine on the
 * workspace, so making each run's workspace a per-run subdirectory would put
 * the shared `artifacts/` series OUTSIDE the sandbox root and yesterday's brief
 * would be unreadable - the exact thing this exists to make possible. Per-run
 * isolation comes from the staging directory and `WAYLAND_OUTPUT_DIR`, never
 * from moving the workspace.
 *
 * WHAT COUNTS AS THIS RUN'S OUTPUT. Everything the run left in its staging
 * directory, and nothing else. The staging directory is handed to the agent as
 * `WAYLAND_OUTPUT_DIR` and is the only destination a skill is told about, so
 * "what is in there" is the declaration - made by a skill, therefore UNTRUSTED,
 * therefore still passed through `registerArtifacts`, which is what refuses a
 * symlink that a renamed staging directory would otherwise carry into the
 * published run. Rejections are returned, never swallowed.
 *
 * THE STABLE ALIAS. Four bundled routines read a PRIOR RUN'S output from a
 * fixed workspace-relative path (`artifacts/ops/last-weekly-review.md`), which
 * is the only shape a prompt written once at seed time can name. A dated run
 * directory cannot be named that way, so publication also refreshes an alias at
 * the series root for each verified deliverable. It is a real file copy, not a
 * symlink: the ledger refuses symlinks by design, and a symlink needs a
 * privilege on Windows that Wayland does not ask for.
 *
 * The alias is refreshed AFTER the run publishes, which is what makes the read
 * side correct without any resolution logic in the agent: during run N the
 * alias still holds run N-1, so a run can never read itself or a half-written
 * run, and before the first run it simply does not exist - the routine prompt
 * already instructs the agent to skip rather than fabricate when an input path
 * is missing.
 */

import { promises as fs, type Dirent } from 'fs';
import path from 'path';

import {
  MAX_DECLARATIONS_PER_RUN,
  registerArtifacts,
  type ArtifactRejection,
  type ArtifactRecord,
} from './artifactLedger';
import { beginRun, commitRun, abandonRun, newRunId, seriesDateFor, type RunPublication } from './artifactSeries';
import { closeRunOutputDir, openRunOutputDir } from './runOutputDir';

/** The workspace subdirectory every series lives under. Mirrors `WAYLAND_OUTPUT_DIR`. */
export const ARTIFACTS_DIR_NAME = 'artifacts';

/**
 * A series name is ONE path segment the user will read in Finder. Dot-prefixed
 * is refused outright: `.staging` and `.latest.json` already mean something
 * here, and a dot directory is invisible to every workspace scanner.
 */
const SERIES_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/** Stop walking a staging tree this deep. A deliverable set is not a source tree. */
const MAX_STAGING_DEPTH = 8;

/** Stop collecting this many staged paths. The ledger caps records separately. */
const MAX_STAGING_ENTRIES = 512;

export class InvalidSeriesNameError extends Error {
  constructor(series: string) {
    super(`Invalid artifact series ${JSON.stringify(series)}: expected 1-64 chars of [A-Za-z0-9._-], not dot-leading`);
    this.name = 'InvalidSeriesNameError';
  }
}

/** An open run. Opaque to the executor apart from `stagingDir`. */
export interface TaskRunHandle {
  taskId: string;
  workspace: string;
  series: string;
  seriesDir: string;
  runId: string;
  stagingDir: string;
  startedAt: Date;
}

export type TaskRunOutcome =
  | { published: false; reason: 'no-output' }
  | {
      published: true;
      publication: RunPublication;
      registered: ArtifactRecord[];
      rejected: ArtifactRejection[];
      aliases: string[];
    };

export function seriesDirFor(workspace: string, series: string): string {
  if (!SERIES_PATTERN.test(series)) throw new InvalidSeriesNameError(series);
  return path.join(path.resolve(workspace), ARTIFACTS_DIR_NAME, series);
}

/**
 * Open a run: create its staging directory and make it the workspace's active
 * output directory, so the engine spawned for this run writes there instead of
 * straight into the series the user reads.
 */
export async function beginTaskRun(input: {
  workspace: string;
  taskId: string;
  series: string;
  now?: Date;
  runId?: string;
}): Promise<TaskRunHandle> {
  const now = input.now ?? new Date();
  const seriesDir = seriesDirFor(input.workspace, input.series);
  const runId = input.runId ?? newRunId(now);
  const stagingDir = await beginRun(seriesDir, runId);
  openRunOutputDir(input.workspace, stagingDir);
  return {
    taskId: input.taskId,
    workspace: path.resolve(input.workspace),
    series: input.series,
    seriesDir,
    runId,
    stagingDir,
    startedAt: now,
  };
}

/**
 * Throw the run away. Nothing published, the previous run and the previous
 * `latest` untouched, the alias still pointing at the last run that worked.
 */
export async function abandonTaskRun(handle: TaskRunHandle): Promise<void> {
  closeRunOutputDir(handle.workspace);
  await abandonRun(handle.seriesDir, handle.runId);
}

/**
 * Publish the run.
 *
 * A run that staged NOTHING is abandoned rather than published: an empty dated
 * directory in the series reads as "the task ran and produced this", and moving
 * `latest` onto it would hide the last real deliverable behind a blank.
 */
export async function commitTaskRun(
  handle: TaskRunHandle,
  input: { ledgerPath: string; declaredBy: string; now?: Date; date?: string }
): Promise<TaskRunOutcome> {
  closeRunOutputDir(handle.workspace);

  const staged = await collectStagedPaths(handle.stagingDir);
  if (staged.length === 0) {
    await abandonRun(handle.seriesDir, handle.runId);
    return { published: false, reason: 'no-output' };
  }

  const now = input.now ?? new Date();
  const publication = await commitRun(handle.seriesDir, handle.runId, {
    now,
    date: input.date ?? seriesDateFor(handle.startedAt),
  });

  const { registered, rejected } = await registerArtifacts({
    ledgerPath: input.ledgerPath,
    workspace: handle.workspace,
    runDir: publication.runDir,
    taskId: handle.taskId,
    runId: handle.runId,
    declaredBy: input.declaredBy,
    declarations: staged.slice(0, MAX_DECLARATIONS_PER_RUN).map((relative) => ({ path: relative })),
    now,
  });

  const aliases = await refreshSeriesAliases(handle.seriesDir, publication.runDir, registered, handle.workspace);
  return { published: true, publication, registered, rejected, aliases };
}

/**
 * Every path a run staged, relative to the staging root, POSIX-separated.
 *
 * A symlink is COLLECTED, not skipped, so the ledger gets to refuse it out loud
 * instead of it disappearing silently. Directory recursion uses the dirent's
 * own type, which `readdir` does not resolve through a symlink, so a symlinked
 * directory is a leaf here and cannot walk us out of the staging tree.
 */
async function collectStagedPaths(stagingDir: string): Promise<string[]> {
  const found: string[] = [];

  async function walk(dir: string, prefix: string, depth: number): Promise<void> {
    if (depth > MAX_STAGING_DEPTH || found.length >= MAX_STAGING_ENTRIES) return;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.toSorted((a, b) => a.name.localeCompare(b.name))) {
      if (found.length >= MAX_STAGING_ENTRIES) return;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        // eslint-disable-next-line no-await-in-loop -- depth-first walk of a small deliverable tree; parallelism would open the whole tree at once for no gain
        await walk(path.join(dir, entry.name), relative, depth + 1);
      } else {
        found.push(relative);
      }
    }
  }

  await walk(stagingDir, '', 0);
  return found;
}

/**
 * Refresh the fixed-path alias for each verified deliverable, so a routine that
 * names `artifacts/<series>/<file>` in a prompt written at seed time reads the
 * newest published run.
 *
 * Only files the ledger ACCEPTED are aliased, so the alias namespace can never
 * hold a symlink or anything that failed verification. Each alias lands by
 * copy-then-rename, so a reader mid-refresh sees the old file or the new one.
 */
async function refreshSeriesAliases(
  seriesDir: string,
  runDir: string,
  registered: ArtifactRecord[],
  workspace: string
): Promise<string[]> {
  const runRelativeRoot = path.relative(workspace, runDir);
  const aliases: string[] = [];

  for (const record of registered) {
    const relativeToRun = path.relative(runRelativeRoot, record.relativePath);
    if (!relativeToRun || relativeToRun.startsWith('..') || path.isAbsolute(relativeToRun)) continue;
    const source = path.join(workspace, record.relativePath);
    const target = path.join(seriesDir, relativeToRun);
    const temporary = `${target}.tmp-${record.artifactId.slice(0, 8)}`;
    try {
      // eslint-disable-next-line no-await-in-loop -- one small report at a time; the rename must land before the next alias is staged into the same directory
      await fs.mkdir(path.dirname(target), { recursive: true });
      // eslint-disable-next-line no-await-in-loop -- see above
      await fs.copyFile(source, temporary);
      // eslint-disable-next-line no-await-in-loop -- see above
      await fs.rename(temporary, target);
      aliases.push(path.relative(workspace, target).split(path.sep).join('/'));
    } catch {
      // eslint-disable-next-line no-await-in-loop -- see above
      await fs.rm(temporary, { force: true }).catch(() => {});
    }
  }

  return aliases;
}
