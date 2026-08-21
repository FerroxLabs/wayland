/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE RUN HISTORY OF A DELIVERABLE.
 *
 * The publishing layer has kept a dated series of runs since P2-6 and nothing
 * has ever shown it: `listRuns` had no consumer outside its own module, and
 * `artifacts.list` returned a flat, run-blind array. The user could see today's
 * brief and had no way to reach yesterday's, or to learn that today's did not
 * run at all. This assembles the answer, host-side.
 *
 * THREE SOURCES, IN A FIXED ORDER OF AUTHORITY.
 *
 *  1. `listRuns` - the published `<date>/<run-id>/` directories. The filesystem
 *     is the authority on which runs EXIST, because it survives a lost ledger,
 *     a stale `.latest.json`, and the user rearranging things in Finder.
 *  2. The artifact ledger - which VERIFIED deliverables belong to each of those
 *     runs, and their ids. A run directory with no ledger records produced
 *     files that nothing could verify, which is a real state the user needs to
 *     see rather than an empty row.
 *  3. The run journal - the runs that left NO directory, because they failed or
 *     produced nothing. It can only ADD runs; a journal entry claiming a run id
 *     the filesystem already has is discarded, so the weakest source (a file an
 *     agent can write) can never overwrite the strongest.
 *
 * THE RENDERER SENDS AN ID AND GETS IDS BACK. The series is resolved from the
 * requested artifact's own LEDGER RECORD - its workspace, its task, the series
 * segment of its host-validated relative path - never from anything the caller
 * supplies. Every run in the result carries artifact IDs, so "open yesterday's"
 * goes through exactly the same resolution, re-verification and type gate as
 * "open today's". An earlier run is an artifact, not a path.
 */

import type {
  ArtifactRunStatus,
  ArtifactSeriesRun,
  ArtifactSeriesView,
  ArtifactSummary,
} from '@/common/types/artifacts';

import { toArtifactSummary } from './artifactActions';
import { isChatNamespace, type ArtifactRecord } from './artifactLedger';
import { readRunJournal } from './artifactRunJournal';
import { listRuns } from './artifactSeries';
import { ARTIFACTS_DIR_NAME, seriesDirFor } from './taskRun';

/**
 * Runs returned at once.
 *
 * A daily task runs forever, so "every run" is a number that only grows. The
 * card shows recent history; the archive is the folder, which Reveal already
 * opens. `totalRuns` reports the true count so the UI never implies the cap is
 * the whole story.
 */
export const MAX_SERIES_RUNS = 30;

/** Deliverables listed per run. A run is a report, not a build output tree. */
export const MAX_ARTIFACTS_PER_RUN = 20;

export interface ArtifactSeriesEffects {
  readLedger(): Promise<ArtifactRecord[]>;
}

/**
 * Where in a series a ledger record sits.
 *
 * The ledger already proved this path is relative, `..`-free and inside the
 * workspace. The remaining question is whether it has the shape publication
 * produces - `artifacts/<series>/<date>/<run-id>/<file>` - because an artifact
 * registered outside that shape (a job that predates P2-6, a chat-owned run
 * writing into the series root) has no series to show.
 */
function locateInSeries(record: ArtifactRecord): { series: string; runId: string; prefix: string } | null {
  const segments = record.relativePath.split('/');
  if (segments.length < 5 || segments[0] !== ARTIFACTS_DIR_NAME) return null;
  const [, series, , runId] = segments;
  if (!series || !runId) return null;
  // T1: the chat namespace has the series shape and is not a series. A chat
  // deliverable has no run history, and reporting one would invent runs out of
  // whatever directories the conversation happened to create.
  if (isChatNamespace(series)) return null;
  return { series, runId, prefix: `${ARTIFACTS_DIR_NAME}/${series}/` };
}

/**
 * The newest timestamp among a run's deliverables, which is the moment the run
 * was committed. Falls back to the run directory's own time when the ledger has
 * nothing for it - a published run with no verified deliverable still happened,
 * and dropping it from the history would hide the case worth seeing.
 */
function runTimestamp(artifacts: readonly ArtifactSummary[], fallback: string): string {
  let newest = '';
  for (const artifact of artifacts) if (artifact.runAt > newest) newest = artifact.runAt;
  return newest || fallback;
}

/**
 * The run history for the series the given artifact belongs to.
 *
 * Null when the id is unknown, or when the artifact is not filed inside a
 * series - both mean "there is no history to show", which the card renders by
 * showing no history rather than an error.
 */
export async function buildArtifactSeriesView(
  artifactId: unknown,
  effects: ArtifactSeriesEffects
): Promise<ArtifactSeriesView | null> {
  if (typeof artifactId !== 'string' || !artifactId) return null;
  const records = await effects.readLedger();
  const subject = records.find((record) => record.artifactId === artifactId);
  if (!subject) return null;

  const location = locateInSeries(subject);
  if (!location) return null;

  let seriesDir: string;
  try {
    seriesDir = seriesDirFor(subject.workspace, location.series);
  } catch {
    // An unusable series name cannot address a directory, so there is nothing
    // to list. `seriesDirFor` is the same validator publication used.
    return null;
  }

  const [published, journal] = await Promise.all([listRuns(seriesDir), readRunJournal(seriesDir)]);

  // THE SERIES DIRECTORY IS THE UNIT, NOT THE TASK. `listRuns` reports every run
  // published into this directory, so filtering the ledger by task id would
  // leave any run a second task published into the same series showing as a row
  // with nothing in it - a real deliverable reported as "no deliverable". The
  // workspace filter stays: the ledger spans every workspace on the machine.
  const byRunId = new Map<string, ArtifactSummary[]>();
  for (const record of records) {
    if (record.workspace !== subject.workspace) continue;
    if (!record.relativePath.startsWith(location.prefix)) continue;
    const bucket = byRunId.get(record.runId);
    if (bucket) bucket.push(toArtifactSummary(record));
    else byRunId.set(record.runId, [toArtifactSummary(record)]);
  }

  const runs: ArtifactSeriesRun[] = published.map((publication) => {
    const artifacts = (byRunId.get(publication.runId) ?? [])
      .toSorted((left, right) => left.fileName.localeCompare(right.fileName))
      .slice(0, MAX_ARTIFACTS_PER_RUN);
    // A published directory with nothing verified in it is NOT a success. The
    // run happened and the user has no deliverable from it, which reads the
    // same way as a run that staged nothing.
    const status: ArtifactRunStatus = artifacts.length > 0 ? 'published' : 'no-output';
    return {
      runId: publication.runId,
      status,
      at: runTimestamp(artifacts, publication.publishedAt),
      date: publication.date,
      artifacts,
      ...(publication.runId === location.runId ? { current: true } : {}),
    };
  });

  const publishedRunIds = new Set(published.map((publication) => publication.runId));
  for (const entry of journal) {
    // The filesystem wins. A journal entry for a run that did publish is stale
    // (or forged) and must never displace the directory that exists.
    if (publishedRunIds.has(entry.runId)) continue;
    runs.push({
      runId: entry.runId,
      status: entry.status,
      at: entry.at,
      artifacts: [],
      ...(entry.message ? { message: entry.message } : {}),
    });
  }

  // Newest first. The run id breaks a tie: two runs can settle inside the same
  // millisecond (a retry loop, a manual run racing the cron), and an unstable
  // order there would reshuffle the history between two reads of the same data.
  const ordered = runs.toSorted(
    (left, right) => right.at.localeCompare(left.at) || right.runId.localeCompare(left.runId)
  );

  return {
    taskId: subject.taskId,
    series: location.series,
    totalRuns: ordered.length,
    runs: ordered.slice(0, MAX_SERIES_RUNS),
  };
}
