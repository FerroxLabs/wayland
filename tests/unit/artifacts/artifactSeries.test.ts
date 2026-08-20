/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  RunAlreadyPublishedError,
  abandonRun,
  beginRun,
  commitRun,
  listRuns,
  newRunId,
  readLatest,
  seriesDateFor,
  STAGING_DIR_NAME,
} from '../../../src/process/services/artifacts/artifactSeries';

/**
 * P2-5. The layout that lets "tomorrow, show me both days" be true.
 *
 * The rule that shapes everything here: A DATE IS PRESENTATION METADATA, NOT
 * IDENTITY. Naming a run folder after its date reads well and is wrong - a
 * retry after a partial failure, or a second manual run because the first came
 * back thin, both land on the same date and the second silently destroys the
 * first. The run id is identity; the date is a drawer to file it in.
 *
 * The second rule: a crash must leave the old state or the new state, never a
 * half-written run. A deliverable is assembled over many tool calls, so the
 * assembly is done in a staging directory the workspace scanners cannot see
 * (a dot directory) and made visible by ONE rename. `latest` is a separate
 * atomic write, so the worst crash window shows a published run that `latest`
 * has not caught up to - a stale pointer, never a torn one.
 */

const tmpRoots: string[] = [];

function tmpSeries(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'wl-series-'));
  tmpRoots.push(root);
  return path.join(root, 'artifacts', 'market');
}

afterAll(() => {
  for (const root of tmpRoots) {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Temp dirs are reaped by the OS.
    }
  }
});

describe('run ids are identity; dates are presentation', () => {
  it('mints unique ids even inside the same millisecond', () => {
    const now = new Date('2026-08-20T07:00:00.000Z');
    const ids = new Set(Array.from({ length: 500 }, () => newRunId(now)));
    expect(ids.size).toBe(500);
  });

  it('mints ids that are safe as a single path segment', () => {
    for (let i = 0; i < 50; i += 1) {
      const id = newRunId();
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(path.basename(id)).toBe(id);
    }
  });

  it('renders a local calendar date, not a UTC one', () => {
    // 2026-08-20T02:30 local time is the 20th wherever the user is standing.
    const local = new Date(2026, 7, 20, 2, 30, 0);
    expect(seriesDateFor(local)).toBe('2026-08-20');
  });
});

describe('publishing a run', () => {
  it('stages out of sight, then publishes with a single rename', async () => {
    const series = tmpSeries();
    const runId = newRunId();

    const staging = await beginRun(series, runId);
    expect(staging.split(path.sep)).toContain(STAGING_DIR_NAME);
    expect(STAGING_DIR_NAME.startsWith('.')).toBe(true);
    writeFileSync(path.join(staging, 'brief.html'), '<h1>brief</h1>', 'utf-8');

    // Before the commit the run is invisible: nothing publishable exists.
    expect(await listRuns(series)).toEqual([]);

    const published = await commitRun(series, runId, { now: new Date(2026, 7, 20, 7, 0, 0) });

    expect(published.date).toBe('2026-08-20');
    expect(published.runId).toBe(runId);
    expect(published.relativePath).toBe(path.posix.join('2026-08-20', runId));
    expect(readFileSync(path.join(published.runDir, 'brief.html'), 'utf-8')).toBe('<h1>brief</h1>');
    expect(existsSync(staging)).toBe(false);
  });

  it('records latest atomically and points it at the newest run', async () => {
    const series = tmpSeries();
    expect(await readLatest(series)).toBeNull();

    const first = newRunId();
    writeFileSync(path.join(await beginRun(series, first), 'a.md'), 'a', 'utf-8');
    await commitRun(series, first, { now: new Date(2026, 7, 19, 7, 0, 0) });

    const second = newRunId();
    writeFileSync(path.join(await beginRun(series, second), 'b.md'), 'b', 'utf-8');
    await commitRun(series, second, { now: new Date(2026, 7, 20, 7, 0, 0) });

    const latest = await readLatest(series);
    expect(latest?.runId).toBe(second);
    expect(latest?.date).toBe('2026-08-20');
  });
});

describe('a date is not an identity', () => {
  it('keeps BOTH runs when two publish on the same date', async () => {
    const series = tmpSeries();
    const sameDay = new Date(2026, 7, 20, 7, 0, 0);

    const morning = newRunId();
    writeFileSync(path.join(await beginRun(series, morning), 'brief.md'), 'morning', 'utf-8');
    const first = await commitRun(series, morning, { now: sameDay });

    const rerun = newRunId();
    writeFileSync(path.join(await beginRun(series, rerun), 'brief.md'), 'rerun', 'utf-8');
    const second = await commitRun(series, rerun, { now: new Date(2026, 7, 20, 9, 30, 0) });

    // The first run's bytes are the assertion that matters: a date-keyed layout
    // would have overwritten them here.
    expect(readFileSync(path.join(first.runDir, 'brief.md'), 'utf-8')).toBe('morning');
    expect(readFileSync(path.join(second.runDir, 'brief.md'), 'utf-8')).toBe('rerun');
    expect(first.runDir).not.toBe(second.runDir);

    const runs = await listRuns(series);
    expect(runs.map((r) => r.runId).toSorted()).toEqual([morning, rerun].toSorted());
    expect(new Set(runs.map((r) => r.date))).toEqual(new Set(['2026-08-20']));
    expect((await readLatest(series))?.runId).toBe(rerun);
  });

  it('refuses to republish an id that is already published, leaving the original intact', async () => {
    const series = tmpSeries();
    const runId = newRunId();
    const day = new Date(2026, 7, 20, 7, 0, 0);

    writeFileSync(path.join(await beginRun(series, runId), 'brief.md'), 'original', 'utf-8');
    const original = await commitRun(series, runId, { now: day });

    writeFileSync(path.join(await beginRun(series, runId), 'brief.md'), 'clobber', 'utf-8');
    await expect(commitRun(series, runId, { now: day })).rejects.toBeInstanceOf(RunAlreadyPublishedError);

    expect(readFileSync(path.join(original.runDir, 'brief.md'), 'utf-8')).toBe('original');
    expect((await listRuns(series)).length).toBe(1);
  });
});

describe('a crash leaves the old state or the new state, never a half-written run', () => {
  it('leaves no publishable run and no latest when the process dies mid-assembly', async () => {
    const series = tmpSeries();
    const runId = newRunId();
    const staging = await beginRun(series, runId);
    writeFileSync(path.join(staging, 'partial.html'), '<h1>half a', 'utf-8');
    // ... process dies here. No commitRun.

    expect(await listRuns(series)).toEqual([]);
    expect(await readLatest(series)).toBeNull();
    // The debris is hidden from the workspace scanners, not sitting beside the
    // deliverables looking like one.
    expect(readdirSync(series).filter((e) => !e.startsWith('.'))).toEqual([]);
  });

  it('keeps the previous run and the previous latest when a later publish fails', async () => {
    const series = tmpSeries();
    const good = newRunId();
    writeFileSync(path.join(await beginRun(series, good), 'brief.md'), 'good', 'utf-8');
    const published = await commitRun(series, good, { now: new Date(2026, 7, 19, 7, 0, 0) });

    const doomed = newRunId();
    await beginRun(series, doomed);
    // A directory already sitting on the target name is the observable form of
    // "the publish cannot complete". Nothing may be destroyed to make room.
    const target = path.join(series, '2026-08-20', doomed);
    mkdirSync(target, { recursive: true });
    writeFileSync(path.join(target, 'squatter.md'), 'not mine', 'utf-8');

    await expect(commitRun(series, doomed, { now: new Date(2026, 7, 20, 7, 0, 0) })).rejects.toBeTruthy();

    expect(readFileSync(path.join(published.runDir, 'brief.md'), 'utf-8')).toBe('good');
    expect(readFileSync(path.join(target, 'squatter.md'), 'utf-8')).toBe('not mine');
    expect((await readLatest(series))?.runId).toBe(good);
  });

  /**
   * Executed, not assumed: `renameSync(src, emptyExistingDir)` SUCCEEDS on
   * POSIX and swallows the target. So relying on rename to reject a collision
   * would let an empty leftover - the residue of a previous interrupted
   * publish - silently absorb a real run. The existence check before the
   * rename is what makes the refusal real.
   */
  it('refuses an id whose target already exists as an EMPTY directory', async () => {
    const series = tmpSeries();
    const runId = newRunId();
    const staging = await beginRun(series, runId);
    writeFileSync(path.join(staging, 'brief.md'), 'mine', 'utf-8');
    mkdirSync(path.join(series, '2026-08-20', runId), { recursive: true });

    await expect(commitRun(series, runId, { now: new Date(2026, 7, 20, 7, 0, 0) })).rejects.toBeInstanceOf(
      RunAlreadyPublishedError
    );
    // The staged bytes are still staged - nothing was consumed by the failure.
    expect(readFileSync(path.join(staging, 'brief.md'), 'utf-8')).toBe('mine');
  });

  it('abandonRun clears the staging debris and touches nothing published', async () => {
    const series = tmpSeries();
    const kept = newRunId();
    writeFileSync(path.join(await beginRun(series, kept), 'brief.md'), 'kept', 'utf-8');
    const published = await commitRun(series, kept, { now: new Date(2026, 7, 20, 7, 0, 0) });

    const dead = newRunId();
    const staging = await beginRun(series, dead);
    writeFileSync(path.join(staging, 'junk.md'), 'junk', 'utf-8');
    await abandonRun(series, dead);

    expect(existsSync(staging)).toBe(false);
    expect(existsSync(published.runDir)).toBe(true);
    expect((await listRuns(series)).map((r) => r.runId)).toEqual([kept]);
  });

  it('survives a torn latest record rather than taking the whole series down', async () => {
    const series = tmpSeries();
    const runId = newRunId();
    writeFileSync(path.join(await beginRun(series, runId), 'brief.md'), 'x', 'utf-8');
    await commitRun(series, runId, { now: new Date(2026, 7, 20, 7, 0, 0) });

    writeFileSync(path.join(series, '.latest.json'), '{"version":1,"runId":', 'utf-8');

    expect(await readLatest(series)).toBeNull();
    expect((await listRuns(series)).map((r) => r.runId)).toEqual([runId]);
  });
});

describe('a run id is never a path', () => {
  for (const bad of ['..', '.', 'a/b', 'a\\b', '', '  ', 'a\0b', '../../escape']) {
    it(`rejects ${JSON.stringify(bad)}`, async () => {
      const series = tmpSeries();
      await expect(beginRun(series, bad)).rejects.toBeTruthy();
      await expect(commitRun(series, bad)).rejects.toBeTruthy();
    });
  }
});
