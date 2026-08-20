/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The on-disk layout of a recurring task's deliverables - a SERIES.
 *
 * A recurring task produces one set of files per run. The user's question is
 * never "what is in this folder", it is "show me today and yesterday", so the
 * layout has to answer that without the caller rescanning and guessing.
 *
 *   <workspace>/artifacts/<series>/<date>/<run-id>/   published deliverables
 *   <workspace>/artifacts/<series>/.staging/<run-id>/ assembly, invisible
 *   <workspace>/artifacts/<series>/.latest.json       pointer to the newest run
 *
 * TWO RULES SHAPE ALL OF IT.
 *
 * 1. A DATE IS PRESENTATION METADATA, NOT IDENTITY. `2026-08-20/` reads well
 *    and is the wrong key. A retry after a partial failure, and a second manual
 *    run because the first came back thin, both land on the same date; keying
 *    on the date makes the second silently destroy the first, which is the
 *    exact history loss this milestone exists to fix. The RUN ID is identity.
 *    The date is the drawer we file it in so a human can find it.
 *
 * 2. A CRASH LEAVES THE OLD STATE OR THE NEW STATE, NEVER A HALF-WRITTEN RUN.
 *    A deliverable is assembled over many tool calls with no transaction around
 *    them, so assembly happens in `.staging/<run-id>/` - a DOT directory, which
 *    `fsBridge.ts` and `fileWatchBridge.ts` skip, so a half-built brief is never
 *    visible as a deliverable - and becomes visible through exactly one
 *    `rename`. POSIX rename of a directory within one filesystem is atomic, and
 *    staging is a sibling of the target so it is always the same filesystem.
 *
 * `.latest.json` is a SEPARATE atomic write, deliberately. Making it part of
 * the same transaction is not possible without a transaction, so the failure
 * mode is chosen instead: the worst crash window leaves a published run that
 * `latest` has not caught up to. That is a STALE pointer, and `listRuns` still
 * finds the run. The alternative ordering (pointer first) would produce a
 * DANGLING pointer, which is worse: it names a run that does not exist.
 *
 * Nothing here writes outside `seriesDir`, and `seriesDir` is always under the
 * workspace, so no confinement boundary is crossed.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

import { writeFileAtomic } from '@process/utils/atomicWrite';

/** Assembly area. Dot-prefixed so the workspace file scanners skip it. */
export const STAGING_DIR_NAME = '.staging';

/** Pointer file. Dot-prefixed for the same reason: it is metadata, not a deliverable. */
export const LATEST_RECORD_NAME = '.latest.json';

/**
 * The stable-alias manifest: exactly which entries at the series root the LAST
 * publication put there. Dot-prefixed for the same reason as the other two.
 *
 * Without it, "which files at this root are aliases" is unanswerable, and the
 * only way to retire a stale alias would be to delete whatever is sitting at
 * the name - which would eat a file the user dropped in the folder themselves.
 */
export const ALIAS_RECORD_NAME = '.aliases.json';

/**
 * How long a staging tree may sit unclaimed before a later run of the same
 * series reaps it. A run that never settled left its directory behind, and
 * nothing else ever removes it.
 */
export const STAGING_REAP_AFTER_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD`, the only shape a date drawer may take. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A run id must be usable verbatim as ONE path segment, on every platform. */
const RUN_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** A published run, as the caller sees it. */
export interface RunPublication {
  runId: string;
  /** Presentation only. Never used to decide whether two runs are the same run. */
  date: string;
  /** Absolute path of the published run directory. */
  runDir: string;
  /** `<date>/<run-id>`, POSIX-separated, relative to the series directory. */
  relativePath: string;
  publishedAt: string;
}

/** The contents of `.latest.json`. */
export interface SeriesLatest {
  version: 1;
  runId: string;
  date: string;
  relativePath: string;
  publishedAt: string;
}

/** Thrown when a run id that is already published is published again. */
export class RunAlreadyPublishedError extends Error {
  constructor(
    readonly runId: string,
    readonly runDir: string
  ) {
    super(`Run ${runId} is already published at ${runDir}`);
    this.name = 'RunAlreadyPublishedError';
  }
}

/** Thrown when a run id would not survive being used as a path segment. */
export class InvalidRunIdError extends Error {
  constructor(runId: string) {
    super(`Invalid run id ${JSON.stringify(runId)}: expected 1-128 chars of [A-Za-z0-9_-]`);
    this.name = 'InvalidRunIdError';
  }
}

function assertRunId(runId: string): void {
  if (typeof runId !== 'string' || !RUN_ID_PATTERN.test(runId)) throw new InvalidRunIdError(runId);
}

/**
 * A fresh run id.
 *
 * Sortable by creation (base36 epoch millis) so a listing is chronological
 * without reading any metadata, and salted with 5 random bytes so two runs that
 * start inside the same millisecond - a retry loop, a manual run racing the
 * cron - can never collide. Identity is never derived from the date.
 */
export function newRunId(now: Date = new Date()): string {
  return `r${now.getTime().toString(36)}-${randomBytes(5).toString('hex')}`;
}

/**
 * The LOCAL calendar date, which is the one the user means by "yesterday".
 * `toISOString().slice(0,10)` would file an 8pm run in Los Angeles under the
 * following day.
 */
export function seriesDateFor(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function stagingDirFor(seriesDir: string, runId: string): string {
  return path.join(seriesDir, STAGING_DIR_NAME, runId);
}

/**
 * THE SERIES ROOT'S RESERVED NAMESPACE.
 *
 * The ledger proves a staged path is a real, in-workspace, non-symlink FILE. It
 * says nothing about what that file is CALLED, and the publication path then
 * copies accepted files into the series root under their own names. A name is
 * the whole attack surface for anything downstream that reads this directory by
 * name, and two names in here are load-bearing:
 *
 *  - `.latest.json` is the pointer to the newest run. A run that staged a file
 *    called `.latest.json` would have that copy land on the pointer and destroy
 *    it - the newest brief becomes unfindable by every reader that trusts it.
 *    Same for `.staging`, and for `.aliases.json` below.
 *  - `<YYYY-MM-DD>/` is where PUBLISHED RUNS live, and `listRuns` derives the
 *    history from those directories rather than from any record a skill can
 *    write. A staged subtree shaped like `2026-01-01/rXXXX/brief.md`, copied in
 *    verbatim, therefore APPEARS IN THE HISTORY as a run that never happened.
 *    A skill that can forge history can antedate a deliverable.
 *
 * Reserved by SHAPE, not by an exact-name list: a dot-leading segment anywhere
 * covers every control file this layout has or will have (and is invisible to
 * the workspace scanners anyway, so it could never be a useful alias), and a
 * date-shaped FIRST segment covers the whole run-directory namespace, not just
 * the dates that happen to exist today.
 */
export function isReservedSeriesEntry(relativePosixPath: string): boolean {
  const segments = relativePosixPath.split('/').filter((segment) => segment.length > 0);
  if (segments.length === 0) return true;
  if (segments.some((segment) => segment === '..' || segment === '.' || segment.startsWith('.'))) return true;
  return DATE_PATTERN.test(segments[0]);
}

/**
 * The entries the last publication aliased at the series root, series-relative
 * and POSIX-separated. A missing, torn or hand-edited manifest reads as empty:
 * the worst that costs is a stale alias surviving one more run, which is
 * strictly better than deleting something on the strength of a corrupt record.
 *
 * The manifest is NOT trusted to name what may be deleted - anything that can
 * write into the workspace can rewrite it, and a manifest naming `.latest.json`
 * would turn retirement into a pointer-destroying primitive. That check belongs
 * to the one caller that deletes, and lives there.
 */
export async function readAliasManifest(seriesDir: string): Promise<string[]> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(seriesDir, ALIAS_RECORD_NAME), 'utf-8');
  } catch {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as { version?: number; aliases?: unknown };
    if (parsed?.version !== 1 || !Array.isArray(parsed.aliases)) return [];
    return parsed.aliases.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  } catch {
    return [];
  }
}

/** Record the alias set this publication left behind. */
export async function writeAliasManifest(seriesDir: string, aliases: readonly string[]): Promise<void> {
  await writeFileAtomic(
    path.join(seriesDir, ALIAS_RECORD_NAME),
    `${JSON.stringify({ version: 1, aliases: [...aliases] }, null, 2)}\n`,
    'utf-8'
  );
}

/**
 * Discard staging trees left by runs that never settled.
 *
 * `abandonRun` and `commitRun` between them remove a staging directory for
 * every run that reaches an end. A run that does not - the app quit, the
 * machine slept through the turn, the engine was killed - leaves its tree
 * forever, and nothing else in this layout ever looks at `.staging` again.
 * Reaped from the NEXT run of the same series, which is the only moment we know
 * the series is live and are already touching the directory.
 *
 * `keepRunId` is never reaped regardless of age: it is the run asking.
 */
export async function reapStaleStagingRuns(
  seriesDir: string,
  opts: { keepRunId?: string; now?: Date; maxAgeMs?: number } = {}
): Promise<string[]> {
  const now = (opts.now ?? new Date()).getTime();
  const maxAgeMs = opts.maxAgeMs ?? STAGING_REAP_AFTER_MS;
  const stagingRoot = path.join(seriesDir, STAGING_DIR_NAME);

  let entries: string[];
  try {
    entries = await fs.readdir(stagingRoot);
  } catch {
    return [];
  }

  const reaped: string[] = [];
  for (const name of entries) {
    if (name === opts.keepRunId) continue;
    if (!RUN_ID_PATTERN.test(name)) continue;
    const target = path.join(stagingRoot, name);
    try {
      // eslint-disable-next-line no-await-in-loop -- a handful of leftovers at most, and each rm must finish before the next stat
      const stat = await fs.lstat(target);
      if (!stat.isDirectory()) continue;
      if (now - stat.mtime.getTime() < maxAgeMs) continue;
      // eslint-disable-next-line no-await-in-loop -- see above
      await fs.rm(target, { recursive: true, force: true });
      reaped.push(name);
    } catch {
      // A leftover we cannot stat or remove is left alone; it is invisible to
      // every reader anyway, and failing here would fail the run that asked.
    }
  }
  return reaped;
}

/**
 * Open a run for assembly and return the directory to write deliverables into.
 *
 * Re-opening an id that is still staging is deliberately allowed: a run that
 * crashed part-way is resumed by overwriting, not by failing. Re-opening an id
 * that is already PUBLISHED is not - that is caught at commit.
 */
export async function beginRun(seriesDir: string, runId: string): Promise<string> {
  assertRunId(runId);
  const staging = stagingDirFor(seriesDir, runId);
  await fs.mkdir(staging, { recursive: true });
  return staging;
}

/** Discard a staged run. Published runs are never touched. */
export async function abandonRun(seriesDir: string, runId: string): Promise<void> {
  assertRunId(runId);
  await fs.rm(stagingDirFor(seriesDir, runId), { recursive: true, force: true });
}

/**
 * Make a staged run visible, then move the `latest` pointer.
 *
 * The rename is the whole publication. Everything before it is invisible;
 * everything after it is committed. The target is checked for existence first
 * and NEVER cleared: `rename` onto an existing EMPTY directory succeeds on
 * POSIX, so relying on rename to fail would let an empty leftover swallow a
 * real run, and clearing the target to make room would destroy exactly the
 * history we are here to keep.
 */
export async function commitRun(
  seriesDir: string,
  runId: string,
  opts: { now?: Date; date?: string } = {}
): Promise<RunPublication> {
  assertRunId(runId);
  const now = opts.now ?? new Date();
  const date = opts.date ?? seriesDateFor(now);
  if (!DATE_PATTERN.test(date)) throw new Error(`Invalid series date ${JSON.stringify(date)}: expected YYYY-MM-DD`);

  const staging = stagingDirFor(seriesDir, runId);
  const dateDir = path.join(seriesDir, date);
  const runDir = path.join(dateDir, runId);

  if (await pathExists(runDir)) throw new RunAlreadyPublishedError(runId, runDir);

  await fs.mkdir(dateDir, { recursive: true });
  await fs.rename(staging, runDir);

  const publication: RunPublication = {
    runId,
    date,
    runDir,
    relativePath: path.posix.join(date, runId),
    publishedAt: now.toISOString(),
  };

  // Second, separate write. A crash between the rename and here leaves a
  // published run with a stale pointer - recoverable, and `listRuns` still
  // sees it. The reverse order would leave a pointer to nothing.
  const latest: SeriesLatest = {
    version: 1,
    runId,
    date,
    relativePath: publication.relativePath,
    publishedAt: publication.publishedAt,
  };
  await writeFileAtomic(path.join(seriesDir, LATEST_RECORD_NAME), `${JSON.stringify(latest, null, 2)}\n`, 'utf-8');

  return publication;
}

/**
 * The newest published run, or null when the series has none.
 *
 * A torn or hand-edited record reads as null rather than throwing: the pointer
 * is a convenience over `listRuns`, and losing it must not take the series -
 * and the Workbench panel rendering it - down with it.
 */
export async function readLatest(seriesDir: string): Promise<SeriesLatest | null> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(seriesDir, LATEST_RECORD_NAME), 'utf-8');
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as SeriesLatest;
    if (parsed?.version !== 1) return null;
    if (!RUN_ID_PATTERN.test(parsed.runId ?? '')) return null;
    if (!DATE_PATTERN.test(parsed.date ?? '')) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Every published run, oldest first. Derived from the directories themselves,
 * so it stays correct when `.latest.json` is stale, missing or corrupt, and
 * when the user has moved things around in Finder.
 */
export async function listRuns(seriesDir: string): Promise<RunPublication[]> {
  let dateEntries: string[];
  try {
    dateEntries = (await fs.readdir(seriesDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && DATE_PATTERN.test(entry.name))
      .map((entry) => entry.name)
      .toSorted();
  } catch {
    return [];
  }

  const perDate = await Promise.all(dateEntries.map((date) => listRunsForDate(seriesDir, date)));
  return perDate.flat();
}

async function listRunsForDate(seriesDir: string, date: string): Promise<RunPublication[]> {
  const dateDir = path.join(seriesDir, date);
  const runIds = (await fs.readdir(dateDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && RUN_ID_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .toSorted();

  return Promise.all(
    runIds.map(async (runId) => {
      const runDir = path.join(dateDir, runId);
      const stat = await fs.stat(runDir);
      return {
        runId,
        date,
        runDir,
        relativePath: path.posix.join(date, runId),
        publishedAt: stat.mtime.toISOString(),
      };
    })
  );
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.lstat(target);
    return true;
  } catch {
    return false;
  }
}
