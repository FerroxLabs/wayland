/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * WHAT A RUN IS ALLOWED TO CALL ITS OUTPUT, AND WHAT THE SERIES ROOT KEEPS.
 *
 * The ledger answers "is this a real, in-workspace, non-symlink file?". It does
 * NOT answer "is this a safe NAME", and publication then copies every accepted
 * file into the series root under the name the skill chose. Two names in that
 * directory are load-bearing - the `latest` pointer, and the `<date>/` drawers
 * `listRuns` derives the whole history from - so an unguarded copy lets
 * model-authored text destroy the pointer to the newest run, or invent runs
 * that never happened.
 *
 * Every attack here is run against the REAL ledger and the REAL filesystem, and
 * every one is paired with a control in the same test: a legitimate deliverable
 * that must still be aliased. A guard that refused everything would pass the
 * attack half alone.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  listRuns,
  readLatest,
  reapStaleStagingRuns,
  STAGING_DIR_NAME,
} from '@process/services/artifacts/artifactSeries';
import { beginTaskRun, bindTaskRunOutput, commitTaskRun, abandonTaskRun } from '@process/services/artifacts/taskRun';
import { activeRunOutputDir, clearRunOutputDirs } from '@process/services/artifacts/runOutputDir';

const SERIES = 'market';
const TASK = 'cron_morning_brief';

let root = '';
let workspace = '';
let seriesDir = '';
let ledgerPath = '';

async function openRun(opts: { conversationId?: string; now?: Date } = {}) {
  const handle = await beginTaskRun({ workspace, taskId: TASK, series: SERIES, now: opts.now });
  if (opts.conversationId) bindTaskRunOutput(handle, opts.conversationId);
  return handle;
}

/** Stage `contents` into an open run, creating directories as a skill would. */
async function stage(stagingDir: string, contents: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(contents).map(async ([relative, body]) => {
      const target = path.join(stagingDir, ...relative.split('/'));
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, body, 'utf8');
    })
  );
}

/** One whole run: open, stage, publish. */
async function runOnce(contents: Record<string, string>, opts: { conversationId?: string; now?: Date } = {}) {
  const handle = await openRun(opts);
  await stage(handle.stagingDir, contents);
  return commitTaskRun(handle, { ledgerPath, declaredBy: 'Morning Brief', now: opts.now });
}

const read = (relative: string) => fs.readFile(path.join(seriesDir, ...relative.split('/')), 'utf8');
const exists = (relative: string) =>
  fs
    .lstat(path.join(seriesDir, ...relative.split('/')))
    .then(() => true)
    .catch(() => false);

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-taskrun-'));
  workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  seriesDir = path.join(workspace, 'artifacts', SERIES);
  ledgerPath = path.join(root, 'artifact-ledger.jsonl');
  clearRunOutputDirs();
});

afterEach(async () => {
  clearRunOutputDirs();
  await fs.rm(root, { recursive: true, force: true });
});

describe('the series root reserves its own control namespace', () => {
  it('a run cannot destroy the pointer to the newest run by naming a file .latest.json', async () => {
    const first = await runOnce({ 'last-brief.md': 'MONDAY' });
    expect(first.published).toBe(true);
    const pointerBefore = await readLatest(seriesDir);
    expect(pointerBefore?.runId).toBeTruthy();

    // The attack: a deliverable named exactly like the pointer. The ledger
    // accepts it - it IS a real regular file inside the workspace - and the
    // alias copy would then land it on `.latest.json`.
    const second = await runOnce({ 'last-brief.md': 'TUESDAY', '.latest.json': 'not json at all' });
    expect(second.published).toBe(true);

    const pointerAfter = await readLatest(seriesDir);
    expect(pointerAfter).not.toBeNull();
    expect(pointerAfter?.runId).toBe((second as { publication: { runId: string } }).publication.runId);
    expect(await read('.latest.json')).not.toBe('not json at all');
    // Control, same run: the legitimate deliverable next to it WAS aliased.
    expect(await read('last-brief.md')).toBe('TUESDAY');
    // The file itself is not lost - it is published inside the run, where it
    // is only ever read as that run's output.
    expect(
      await fs.readFile(
        path.join((second as { publication: { runDir: string } }).publication.runDir, '.latest.json'),
        'utf8'
      )
    ).toBe('not json at all');
  });

  it('a run cannot alias into the staging namespace or any other dot entry', async () => {
    const outcome = await runOnce({
      'brief.md': 'REAL',
      '.staging/rsomething/brief.md': 'shadow',
      '.aliases.json': 'forged manifest',
    });
    expect(outcome.published).toBe(true);

    expect(await exists('.staging/rsomething')).toBe(false);
    expect(await read('.aliases.json')).not.toBe('forged manifest');
    expect(await read('brief.md')).toBe('REAL');
  });

  it('a run cannot forge a published run by staging a date/run-id tree', async () => {
    const real = await runOnce({ 'brief.md': 'THE ONLY REAL RUN' });
    expect(real.published).toBe(true);
    const before = await listRuns(seriesDir);
    expect(before).toHaveLength(1);

    // The attack: a subtree shaped exactly like the published layout. Copied
    // verbatim into the series root it becomes a run in the history - one that
    // never executed, dated whenever its author liked.
    const second = await runOnce({
      'brief.md': 'REAL AGAIN',
      '2019-01-01/rforgedbackdated/brief.md': 'I was here first',
    });
    expect(second.published).toBe(true);

    const after = await listRuns(seriesDir);
    expect(after.map((r) => r.runId)).not.toContain('rforgedbackdated');
    expect(after.map((r) => r.date)).not.toContain('2019-01-01');
    // Control: both REAL runs are there, so the assertion above is not just an
    // empty history.
    expect(after).toHaveLength(2);
    expect(await exists('2019-01-01')).toBe(false);
    expect(await read('brief.md')).toBe('REAL AGAIN');
  });

  it('still aliases an ordinary nested deliverable, so the guard is not refusing everything', async () => {
    const outcome = await runOnce({ 'brief.md': 'top', 'charts/spx.svg': '<svg/>' });
    expect(outcome.published).toBe(true);
    expect(await read('brief.md')).toBe('top');
    expect(await read('charts/spx.svg')).toBe('<svg/>');
  });
});

describe('the stable alias mirrors the newest published run, and nothing else', () => {
  it('retires an alias the newest run did not produce, instead of serving a stale one', async () => {
    await runOnce({ 'last-brief.md': 'MONDAY', 'weekly-roundup.md': 'WEEK 33' });
    expect(await read('last-brief.md')).toBe('MONDAY');
    expect(await read('weekly-roundup.md')).toBe('WEEK 33');

    // Tuesday's run produces the daily brief and nothing else. Left in place,
    // `weekly-roundup.md` reads as this week's roundup forever, with nothing in
    // the file to say it is four days old.
    await runOnce({ 'last-brief.md': 'TUESDAY' });

    expect(await read('last-brief.md')).toBe('TUESDAY');
    expect(await exists('weekly-roundup.md')).toBe(false);
    // ...and the retired file is not DELETED, only un-aliased: its own run
    // still holds it, so "show me both days" still shows it.
    const runs = await listRuns(seriesDir);
    expect(await fs.readFile(path.join(runs[0].runDir, 'weekly-roundup.md'), 'utf8')).toBe('WEEK 33');
  });

  it('will not delete a control file just because a tampered manifest names one', async () => {
    // The manifest is the ONLY thing licensed to delete at the series root, so
    // it is itself a target: anything that can write into the workspace can
    // rewrite it, and a manifest naming `.latest.json` would turn the retire
    // step into the pointer-destroying primitive the alias guard just closed.
    const first = await runOnce({ 'last-brief.md': 'MONDAY' });
    expect(first.published).toBe(true);
    const pointerBefore = await read('.latest.json');

    await fs.writeFile(
      path.join(seriesDir, '.aliases.json'),
      JSON.stringify({ version: 1, aliases: ['.latest.json', '.aliases.json', 'last-brief.md'] }),
      'utf8'
    );

    const second = await runOnce({ 'something-else.md': 'TUESDAY' });
    expect(second.published).toBe(true);

    // The pointer survived, and it moved to the newest run rather than being
    // deleted or left on Monday.
    const pointerAfter = await read('.latest.json');
    expect(pointerAfter).not.toBe(pointerBefore);
    expect(await readLatest(seriesDir)).not.toBeNull();
    // The ordinary alias named alongside them WAS retired, so the filter is
    // refusing the reserved names specifically and not ignoring the manifest.
    expect(await exists('last-brief.md')).toBe(false);
    expect(await read('something-else.md')).toBe('TUESDAY');
  });

  it('never touches a file the user put in the series folder themselves', async () => {
    await runOnce({ 'last-brief.md': 'MONDAY' });
    await fs.writeFile(path.join(seriesDir, 'my-notes.md'), 'mine', 'utf8');

    await runOnce({ 'last-brief.md': 'TUESDAY' });

    expect(await read('my-notes.md')).toBe('mine');
    expect(await read('last-brief.md')).toBe('TUESDAY');
  });

  it('leaves the previous alias standing when a run publishes nothing at all', async () => {
    await runOnce({ 'last-brief.md': 'MONDAY' });
    const empty = await runOnce({});
    expect(empty.published).toBe(false);
    // Nothing was published, so nothing became "the newest run". Serving
    // Monday's brief is correct; serving an empty file would not be.
    expect(await read('last-brief.md')).toBe('MONDAY');
  });
});

describe('two runs of one task never share an output cell', () => {
  it('settling the first run leaves the second run own destination intact', async () => {
    const first = await openRun({ conversationId: 'conv-A' });
    const second = await openRun({ conversationId: 'conv-B' });

    expect(activeRunOutputDir('conv-A')).toBe(first.stagingDir);
    expect(activeRunOutputDir('conv-B')).toBe(second.stagingDir);
    expect(first.stagingDir).not.toBe(second.stagingDir);

    await stage(first.stagingDir, { 'brief.md': 'FIRST' });
    await commitTaskRun(first, { ledgerPath, declaredBy: 'Morning Brief' });

    // The first run has settled. The second is still open, and a respawn for
    // it must still land in staging - not in the series root the user reads,
    // which is where an unguarded delete sent it.
    expect(activeRunOutputDir('conv-A')).toBeUndefined();
    expect(activeRunOutputDir('conv-B')).toBe(second.stagingDir);

    await stage(second.stagingDir, { 'brief.md': 'SECOND' });
    const outcome = await commitTaskRun(second, { ledgerPath, declaredBy: 'Morning Brief' });
    expect(outcome.published).toBe(true);
    expect(activeRunOutputDir('conv-B')).toBeUndefined();

    const runs = await listRuns(seriesDir);
    expect(runs).toHaveLength(2);
    const bodies = await Promise.all(runs.map((r) => fs.readFile(path.join(r.runDir, 'brief.md'), 'utf8')));
    expect(bodies.toSorted()).toEqual(['FIRST', 'SECOND']);
  });

  it('a superseded run cannot evict the run that replaced it on the same conversation', async () => {
    const superseded = await openRun({ conversationId: 'conv-A' });
    const replacement = await openRun({ conversationId: 'conv-A' });
    expect(activeRunOutputDir('conv-A')).toBe(replacement.stagingDir);

    await abandonTaskRun(superseded);

    expect(activeRunOutputDir('conv-A')).toBe(replacement.stagingDir);
  });

  it('an unrelated chat in the task folder is never redirected into a run', async () => {
    const run = await openRun({ conversationId: 'conv-scheduled' });
    expect(activeRunOutputDir('conv-scheduled')).toBe(run.stagingDir);
    expect(activeRunOutputDir('conv-the-user-opened')).toBeUndefined();
    expect(activeRunOutputDir(undefined)).toBeUndefined();
  });

  it('opens no cell at all until the run is bound to a conversation', async () => {
    const unbound = await openRun();
    expect(activeRunOutputDir('conv-anything')).toBeUndefined();
    bindTaskRunOutput(unbound, 'conv-anything');
    expect(activeRunOutputDir('conv-anything')).toBe(unbound.stagingDir);
  });
});

describe('staging left by a run that never settled is reaped', () => {
  it('the next run of the series clears an abandoned staging tree', async () => {
    const dead = await openRun();
    await stage(dead.stagingDir, { 'half.md': 'HALF WRIT' });
    // ...the process died. Nothing else in this layout ever looks here again.
    const stagingRoot = path.join(seriesDir, STAGING_DIR_NAME);
    expect(await fs.readdir(stagingRoot)).toEqual([dead.runId]);

    // Age it past the window by hand: `mtime` is what the reaper reads.
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await fs.utimes(dead.stagingDir, old, old);

    const live = await openRun();
    expect(await fs.readdir(stagingRoot)).toEqual([live.runId]);
  });

  /**
   * A staging tree whose mtime is in the FUTURE.
   *
   * Not hypothetical: filesystem timestamps and `Date.now()` are not read from
   * the same clock, and Windows' default system timer granularity is 15.6ms, so
   * a directory created microseconds ago routinely stats a few milliseconds
   * ahead of `now`. Unclamped, `now - mtime` is negative, the entry is younger
   * than EVERY threshold, and it can never be reaped at all - staging
   * accumulates forever on any machine with clock skew.
   *
   * Clamped, a future mtime simply means "brand new": kept under a real window,
   * reaped when the caller forces it.
   */
  it('treats a FUTURE mtime as brand new rather than as unreapable', async () => {
    const dead = await openRun();
    const stagingRoot = path.join(seriesDir, STAGING_DIR_NAME);
    const future = new Date(Date.now() + 60 * 60 * 1000);
    await fs.utimes(dead.stagingDir, future, future);

    // Kept under a real window - it is "new", which is the honest reading.
    expect(await reapStaleStagingRuns(seriesDir, { maxAgeMs: 60 * 1000 })).toEqual([]);
    expect(await fs.readdir(stagingRoot)).toEqual([dead.runId]);

    // ...and still reapable when the caller forces it. Unclamped this returns
    // [] instead, because a negative age is below every threshold.
    expect(await reapStaleStagingRuns(seriesDir, { maxAgeMs: 0 })).toEqual([dead.runId]);
    expect(await fs.readdir(stagingRoot)).toEqual([]);
  });

  it('never reaps a fresh tree, nor the run doing the asking', async () => {
    const recent = await openRun();
    const asking = await openRun();

    const reaped = await reapStaleStagingRuns(seriesDir, { keepRunId: asking.runId });
    expect(reaped).toEqual([]);
    expect((await fs.readdir(path.join(seriesDir, STAGING_DIR_NAME))).toSorted()).toEqual(
      [recent.runId, asking.runId].toSorted()
    );

    // Control: the reaper DOES find something when the age rule is met, so the
    // empty result above is a decision and not a broken scan.
    // NEGATIVE_INFINITY, not -1. The intent is "no age is too young"; -1 was a
    // ONE-MILLISECOND margin against a clock that moves in 15.6ms steps on a
    // Windows CI runner, which red-lit this shard twice in eight runs.
    const forced = await reapStaleStagingRuns(seriesDir, {
      keepRunId: asking.runId,
      maxAgeMs: Number.NEGATIVE_INFINITY,
    });
    expect(forced).toEqual([recent.runId]);
  });
});
