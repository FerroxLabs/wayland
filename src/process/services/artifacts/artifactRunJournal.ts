/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE RUNS THAT LEFT NOTHING BEHIND.
 *
 * `listRuns` derives a series' history from the published `<date>/<run-id>/`
 * directories, which is the right authority for a run that WORKED: it survives
 * a lost `.latest.json`, a lost ledger, and the user moving things in Finder.
 *
 * It is structurally blind to the runs that matter most when something is
 * wrong. A run whose turn threw, and a run whose publication itself failed, are
 * both ABANDONED - their staging tree is removed and no directory is ever
 * created - so afterwards the filesystem holds no evidence they happened at
 * all. `settleArtifactRun` wrote the reason to `console.warn` and returned, and
 * the user was left looking at a series whose newest entry is yesterday's,
 * with nothing anywhere to say that today's run was attempted and failed.
 * "Nothing was produced" and "nothing was attempted" looked identical, and
 * they are the two states a person needs to tell apart.
 *
 * So the non-publishing outcomes are recorded here, one JSON line per settled
 * run, in a dot-prefixed file at the series root:
 *
 *   <workspace>/artifacts/<series>/.runs.jsonl
 *
 * WHY ONLY THE NON-PUBLISHING ONES. A published run already has a directory,
 * and duplicating it here would create a second, weaker source of truth that
 * can disagree with the first. The merge rule downstream is therefore trivial
 * and always safe: the filesystem wins, and this file only ever ADDS the runs
 * the filesystem cannot know about.
 *
 * WHY DOT-PREFIXED. The same reason as `.latest.json` and `.staging`: the
 * workspace file scanners skip dot entries, so a control file never appears as
 * a deliverable, and `isReservedSeriesEntry` already refuses every dot-leading
 * alias name - which means a run cannot land a staged file on top of this one.
 *
 * THIS FILE IS INSIDE THE AGENT'S WORKSPACE, SO IT IS UNTRUSTED INPUT.
 * A skill with shell access can write anything into its own workspace, this
 * file included. That is tolerable only because nothing here is ever used to
 * resolve, open or verify a file: a journal entry names a run and carries a
 * message, and the worst a forged one can do is show a run in the history that
 * did not happen. It is still parsed defensively - run ids must match the same
 * pattern the series layout enforces, messages are stripped of control
 * characters and truncated - so a forged entry cannot smuggle terminal escapes
 * or an unbounded string into the UI, and a published run always beats a
 * journal entry claiming the same id.
 */

import { promises as fs } from 'fs';
import path from 'path';

import { writeFileAtomic } from '@process/utils/atomicWrite';

/** The journal file. Dot-prefixed: metadata, never a deliverable. */
export const RUN_JOURNAL_NAME = '.runs.jsonl';

/** Same shape the series layout enforces for a run directory name. */
const RUN_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** A failure message is a label in a card, not a log. */
export const MAX_JOURNAL_MESSAGE_LENGTH = 300;

/**
 * Entries kept after a compaction, and the most a read will ever return.
 *
 * A task that fails every five minutes would otherwise append forever, so the
 * append path compacts once the file passes {@link MAX_JOURNAL_BYTES}. Losing
 * the oldest failures is the correct trade: nobody debugs a task from the
 * failure it had four months ago, and the alternative is an unbounded file in
 * the user's Documents folder.
 */
export const MAX_JOURNAL_ENTRIES = 200;

/** Compact once the file passes this. ~200 entries of headroom either side. */
export const MAX_JOURNAL_BYTES = 128 * 1024;

/** Why a run produced no published directory. */
export type RunJournalStatus = 'failed' | 'no-output';

export interface RunJournalEntry {
  version: 1;
  runId: string;
  taskId: string;
  status: RunJournalStatus;
  /** ISO timestamp of the settle, not of the run's start. */
  at: string;
  /** Host-authored explanation. Sanitised on read - see the file comment. */
  message?: string;
}

function journalPath(seriesDir: string): string {
  return path.join(seriesDir, RUN_JOURNAL_NAME);
}

/**
 * Flatten a message to one printable line of bounded length.
 *
 * Applied on the way IN so a well-behaved writer stores something sane, and
 * again on the way OUT because the file lives where an agent can rewrite it.
 */
export function sanitizeJournalMessage(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex -- stripping control characters is the point: this text reaches a card and a log
  const flattened = raw.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim();
  if (!flattened) return undefined;
  return flattened.length > MAX_JOURNAL_MESSAGE_LENGTH
    ? `${flattened.slice(0, MAX_JOURNAL_MESSAGE_LENGTH - 1)}…`
    : flattened;
}

/**
 * Record that a run settled WITHOUT publishing.
 *
 * Append-only, for the same reason the artifact ledger is: no read-modify-write
 * means two runs settling at once cannot lose each other's records, and a crash
 * can only truncate the final line, which the reader drops.
 *
 * Never throws. This is called from the settle path, and a run that already
 * failed must not fail a second time because its epitaph could not be written.
 */
export async function recordRunOutcome(
  seriesDir: string,
  entry: { runId: string; taskId: string; status: RunJournalStatus; message?: unknown; now?: Date }
): Promise<void> {
  if (!RUN_ID_PATTERN.test(entry.runId ?? '')) return;
  const message = sanitizeJournalMessage(entry.message);
  const record: RunJournalEntry = {
    version: 1,
    runId: entry.runId,
    taskId: entry.taskId,
    status: entry.status,
    at: (entry.now ?? new Date()).toISOString(),
    ...(message ? { message } : {}),
  };

  const target = journalPath(seriesDir);
  try {
    await fs.mkdir(seriesDir, { recursive: true });
    await fs.appendFile(target, `${JSON.stringify(record)}\n`, 'utf-8');
    await compactIfOversized(target);
  } catch {
    // A journal that cannot be written costs visibility, never a run.
  }
}

/**
 * Rewrite the journal with its newest entries once it grows past the cap.
 *
 * Atomic, so a reader sees the old file or the new one. A concurrent append
 * racing the rewrite can lose an entry; that is acceptable for an advisory
 * record and is the only cost of not holding a lock in a path that must never
 * fail a run.
 */
async function compactIfOversized(target: string): Promise<void> {
  const stat = await fs.stat(target).catch((): null => null);
  if (!stat || stat.size <= MAX_JOURNAL_BYTES) return;
  const raw = await fs.readFile(target, 'utf-8');
  const lines = raw.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length <= MAX_JOURNAL_ENTRIES) return;
  await writeFileAtomic(target, `${lines.slice(-MAX_JOURNAL_ENTRIES).join('\n')}\n`, 'utf-8');
}

/**
 * Every recorded non-publishing run, newest first, capped.
 *
 * Later entries supersede earlier ones with the same run id - a settle is
 * one-shot in the executor, but a retried write must not double-count. A
 * missing, torn or hand-edited file reads as empty rather than throwing: the
 * journal is a convenience over the filesystem and losing it must not take the
 * series view down with it.
 */
export async function readRunJournal(seriesDir: string): Promise<RunJournalEntry[]> {
  let raw: string;
  try {
    raw = await fs.readFile(journalPath(seriesDir), 'utf-8');
  } catch {
    return [];
  }

  const byRunId = new Map<string, RunJournalEntry>();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    const entry = parsed as RunJournalEntry;
    if (
      entry?.version !== 1 ||
      typeof entry.runId !== 'string' ||
      !RUN_ID_PATTERN.test(entry.runId) ||
      typeof entry.taskId !== 'string' ||
      (entry.status !== 'failed' && entry.status !== 'no-output') ||
      typeof entry.at !== 'string' ||
      Number.isNaN(Date.parse(entry.at))
    ) {
      continue;
    }
    const message = sanitizeJournalMessage(entry.message);
    byRunId.set(entry.runId, {
      version: 1,
      runId: entry.runId,
      taskId: entry.taskId,
      status: entry.status,
      at: entry.at,
      ...(message ? { message } : {}),
    });
  }

  return [...byRunId.values()]
    .toSorted((left, right) => right.at.localeCompare(left.at))
    .slice(0, MAX_JOURNAL_ENTRIES);
}
