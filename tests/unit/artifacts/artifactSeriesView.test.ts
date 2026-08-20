/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE RUN HISTORY, ASSEMBLED FROM REAL RUNS ON A REAL FILESYSTEM.
 *
 * Nothing here mocks `listRuns`, the ledger, or the journal. Every run in every
 * case below is published by the same `beginTaskRun` / `commitTaskRun` the cron
 * executor calls, so what is under test is the merge the card actually renders
 * and not a fixture's idea of one. A test that stubbed the data source would
 * only prove the stub.
 *
 * The claims that matter:
 *
 *  - a run that FAILED is visible and distinguishable from one that succeeded
 *    and from one that produced nothing;
 *  - the FILESYSTEM outranks the journal, which lives inside a workspace an
 *    agent can write to, so a forged entry cannot rewrite a published run;
 *  - every run carries artifact IDS, because opening yesterday's brief has to
 *    go through the same resolution and type gate as opening today's;
 *  - the list is CAPPED and says so, because a daily task runs forever.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { artifactLedgerPath, readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { recordRunOutcome } from '@process/services/artifacts/artifactRunJournal';
import { buildArtifactSeriesView, MAX_SERIES_RUNS } from '@process/services/artifacts/artifactSeriesView';
import { beginTaskRun, commitTaskRun } from '@process/services/artifacts/taskRun';

const SERIES = 'market';
const TASK = 'cron_morning_brief';

let root = '';
let workspace = '';
let seriesDir = '';
let ledgerPath = '';

const effects = { readLedger: () => readArtifactLedger(ledgerPath) };

/** One whole run, published for real. Returns the run id. */
async function publishRun(contents: Record<string, string>, now = new Date()): Promise<string> {
  const handle = await beginTaskRun({ workspace, taskId: TASK, series: SERIES, now });
  for (const [relative, body] of Object.entries(contents)) {
    const target = path.join(handle.stagingDir, ...relative.split('/'));
    // eslint-disable-next-line no-await-in-loop -- a couple of small files per run
    await fs.mkdir(path.dirname(target), { recursive: true });
    // eslint-disable-next-line no-await-in-loop -- see above
    await fs.writeFile(target, body, 'utf8');
  }
  await commitTaskRun(handle, { ledgerPath, declaredBy: 'Morning Brief', now });
  return handle.runId;
}

/** The id of some artifact belonging to `runId`, which is how the card asks. */
async function anArtifactOf(runId: string): Promise<string> {
  const record = (await readArtifactLedger(ledgerPath)).find((entry) => entry.runId === runId);
  if (!record) throw new Error(`no ledger record for run ${runId}`);
  return record.artifactId;
}

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-series-view-'));
  workspace = path.join(root, 'workspace');
  seriesDir = path.join(workspace, 'artifacts', SERIES);
  ledgerPath = artifactLedgerPath(path.join(root, 'data'));
  await fs.mkdir(workspace, { recursive: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('the run history behind a deliverable', () => {
  it('reports a single run as the newest one, with no earlier history to offer', async () => {
    const runId = await publishRun({ 'brief.md': 'day one' });

    const view = await buildArtifactSeriesView(await anArtifactOf(runId), effects);

    expect(view).not.toBeNull();
    expect(view!.taskId).toBe(TASK);
    expect(view!.series).toBe(SERIES);
    expect(view!.totalRuns).toBe(1);
    expect(view!.runs).toHaveLength(1);
    expect(view!.runs[0]).toMatchObject({ runId, status: 'published', current: true });
    expect(view!.runs[0].artifacts.map((entry) => entry.fileName)).toEqual(['brief.md']);
  });

  it('lists three real runs newest first, each addressable by ARTIFACT ID and not by path', async () => {
    const first = await publishRun({ 'brief.md': 'monday' }, new Date('2026-08-18T07:00:00Z'));
    const second = await publishRun({ 'brief.md': 'tuesday' }, new Date('2026-08-19T07:00:00Z'));
    const third = await publishRun({ 'brief.md': 'wednesday' }, new Date('2026-08-20T07:00:00Z'));

    const view = await buildArtifactSeriesView(await anArtifactOf(third), effects);

    expect(view!.runs.map((entry) => entry.runId)).toEqual([third, second, first]);
    expect(view!.runs.map((entry) => entry.date)).toEqual(['2026-08-20', '2026-08-19', '2026-08-18']);
    expect(view!.runs.map((entry) => entry.current ?? false)).toEqual([true, false, false]);
    // The earlier runs are openable, and what they hand back is an id.
    for (const entry of view!.runs) {
      expect(entry.artifacts).toHaveLength(1);
      expect(entry.artifacts[0].artifactId).toMatch(/^[0-9a-f]{32}$/);
      expect(entry.artifacts[0].canonicalPath.startsWith(seriesDir)).toBe(true);
    }
    // Yesterday's id is not today's: an earlier run really is a different artifact.
    const ids = view!.runs.map((entry) => entry.artifacts[0].artifactId);
    expect(new Set(ids).size).toBe(3);
  });

  it('SHOWS a run that failed, and dates the series from the last one that worked', async () => {
    // This is the bug the lane exists to fix. Before the journal, a run whose
    // turn threw left nothing on disk at all, so the series simply stopped
    // advancing and the user had no way to tell "today has not run yet" from
    // "today ran and broke".
    const good = await publishRun({ 'brief.md': 'monday' }, new Date('2026-08-19T07:00:00Z'));
    await recordRunOutcome(seriesDir, {
      runId: 'rfailed-0001',
      taskId: TASK,
      status: 'failed',
      message: 'engine died on start',
      now: new Date('2026-08-20T07:00:00Z'),
    });

    const view = await buildArtifactSeriesView(await anArtifactOf(good), effects);

    expect(view!.totalRuns).toBe(2);
    expect(view!.runs[0]).toMatchObject({ runId: 'rfailed-0001', status: 'failed', message: 'engine died on start' });
    expect(view!.runs[0].artifacts).toEqual([]);
    expect(view!.runs[0].date).toBeUndefined();
    // The deliverable on screen is the older one, and it is marked as such.
    expect(view!.runs[1]).toMatchObject({ runId: good, status: 'published', current: true });
  });

  it('distinguishes a run that produced NOTHING from one that FAILED', async () => {
    const good = await publishRun({ 'brief.md': 'monday' }, new Date('2026-08-18T07:00:00Z'));
    await recordRunOutcome(seriesDir, {
      runId: 'rempty-0001',
      taskId: TASK,
      status: 'no-output',
      now: new Date('2026-08-19T07:00:00Z'),
    });
    await recordRunOutcome(seriesDir, {
      runId: 'rbroken-001',
      taskId: TASK,
      status: 'failed',
      message: 'engine died on start',
      now: new Date('2026-08-20T07:00:00Z'),
    });

    const view = await buildArtifactSeriesView(await anArtifactOf(good), effects);

    expect(view!.runs.map((entry) => entry.status)).toEqual(['failed', 'no-output', 'published']);
  });

  it('treats a published run with no VERIFIED deliverable as no-output, not as a success', async () => {
    const good = await publishRun({ 'brief.md': 'monday' }, new Date('2026-08-19T07:00:00Z'));

    // A run whose only staged entry is a symlink: the directory publishes, the
    // ledger refuses the file, and the user has a run with nothing in it. A
    // row that claimed "published" here would be a lie about a real failure.
    const handle = await beginTaskRun({ workspace, taskId: TASK, series: SERIES, now: new Date('2026-08-20T07:00:00Z') });
    await fs.writeFile(path.join(root, 'outside.md'), 'not a deliverable', 'utf8');
    await fs.symlink(path.join(root, 'outside.md'), path.join(handle.stagingDir, 'brief.md'));
    const outcome = await commitTaskRun(handle, {
      ledgerPath,
      declaredBy: 'Morning Brief',
      now: new Date('2026-08-20T07:00:00Z'),
    });
    expect(outcome.published).toBe(true);

    const view = await buildArtifactSeriesView(await anArtifactOf(good), effects);

    expect(view!.runs[0]).toMatchObject({ runId: handle.runId, status: 'no-output' });
    expect(view!.runs[0].artifacts).toEqual([]);
    expect(view!.runs[0].date).toBe('2026-08-20');
  });

  it('lets the FILESYSTEM beat a forged journal entry claiming a published run', async () => {
    // `.runs.jsonl` sits inside the workspace, so a skill with shell access can
    // write it. It may only ever ADD runs the filesystem cannot know about; if
    // it could overwrite one, an agent could mark its own successful run failed
    // - or, worse, restyle a real run's history after the fact.
    const good = await publishRun({ 'brief.md': 'monday' });
    await recordRunOutcome(seriesDir, {
      runId: good,
      taskId: TASK,
      status: 'failed',
      message: 'FORGED: this run never happened',
    });

    const view = await buildArtifactSeriesView(await anArtifactOf(good), effects);

    expect(view!.totalRuns).toBe(1);
    expect(view!.runs[0]).toMatchObject({ runId: good, status: 'published' });
    expect(view!.runs[0].message).toBeUndefined();
    expect(view!.runs[0].artifacts.map((entry) => entry.fileName)).toEqual(['brief.md']);
  });

  it('CAPS the runs it returns while still reporting how many there are', async () => {
    const total = MAX_SERIES_RUNS + 5;
    const runIds: string[] = [];
    for (let index = 0; index < total; index += 1) {
      // eslint-disable-next-line no-await-in-loop -- publication is sequential by construction; a parallel burst would not model a schedule
      runIds.push(await publishRun({ 'brief.md': `run ${index}` }, new Date(Date.UTC(2026, 6, index + 1, 7))));
    }

    const view = await buildArtifactSeriesView(await anArtifactOf(runIds[total - 1]), effects);

    expect(view!.totalRuns).toBe(total);
    expect(view!.runs).toHaveLength(MAX_SERIES_RUNS);
    // The cap keeps the NEWEST, which is the half a user ever looks at.
    expect(view!.runs[0].runId).toBe(runIds[total - 1]);
    expect(view!.runs.map((entry) => entry.runId)).not.toContain(runIds[0]);
  });

  it('reports a run a SECOND task published into the same series with its real files', async () => {
    // `listRuns` reports every run in the directory, so a per-task filter on the
    // ledger would leave this row claiming "no deliverable" over a file that is
    // sitting right there. The series directory is the unit, not the task.
    const mine = await publishRun({ 'brief.md': 'mine' });
    const otherHandle = await beginTaskRun({ workspace, taskId: 'cron_other_task', series: SERIES });
    await fs.writeFile(path.join(otherHandle.stagingDir, 'other.md'), 'theirs', 'utf8');
    await commitTaskRun(otherHandle, { ledgerPath, declaredBy: 'Other' });

    const view = await buildArtifactSeriesView(await anArtifactOf(mine), effects);

    const otherRow = view!.runs.find((entry) => entry.runId === otherHandle.runId);
    expect(otherRow).toBeDefined();
    expect(otherRow!.status).toBe('published');
    expect(otherRow!.artifacts.map((entry) => entry.fileName)).toEqual(['other.md']);
    expect(view!.runs.find((entry) => entry.runId === mine)!.artifacts.map((e) => e.fileName)).toEqual(['brief.md']);
  });

  it('never shows a deliverable belonging to a DIFFERENT workspace', async () => {
    // The ledger spans every workspace on the machine, and two workspaces can
    // hold a series of the same name. Matching on the relative path alone would
    // pull another folder's brief into this history - and hand the card an id
    // that opens a file the user did not ask about.
    const mine = await publishRun({ 'brief.md': 'mine' });
    const otherWorkspace = path.join(root, 'other-workspace');
    await fs.mkdir(otherWorkspace, { recursive: true });
    const otherHandle = await beginTaskRun({ workspace: otherWorkspace, taskId: TASK, series: SERIES });
    await fs.writeFile(path.join(otherHandle.stagingDir, 'brief.md'), 'somewhere else', 'utf8');
    await commitTaskRun(otherHandle, { ledgerPath, declaredBy: 'Morning Brief' });

    const view = await buildArtifactSeriesView(await anArtifactOf(mine), effects);

    expect(view!.runs.map((entry) => entry.runId)).toEqual([mine]);
    for (const entry of view!.runs) {
      for (const deliverable of entry.artifacts) {
        expect(deliverable.canonicalPath.startsWith(workspace)).toBe(true);
      }
    }
  });

  it('answers null for an unknown id and for an artifact that is not filed in a series', async () => {
    await publishRun({ 'brief.md': 'monday' });

    expect(await buildArtifactSeriesView('f'.repeat(32), effects)).toBeNull();
    expect(await buildArtifactSeriesView(undefined, effects)).toBeNull();
    expect(await buildArtifactSeriesView('', effects)).toBeNull();
  });
});
