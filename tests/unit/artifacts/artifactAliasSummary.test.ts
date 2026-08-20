/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE STABLE COPY IS A DELIVERABLE TOO.
 *
 * A publication mirrors the newest run's files to the series root, and that
 * shallow, undated copy is the one a person clicks in the workspace tree: it is
 * two levels above the dated run directory and it is the path a prior-run reader
 * is pointed at. The preview matches a previewed file against the summaries the
 * host hands it, so a summary that lists only the dated canonical path leaves
 * the most discoverable file in the layout with no Open, no Reveal, no history.
 *
 * `listArtifactSummaries` DERIVES those copies from the ledger rather than
 * reading `.aliases.json`, which is only sound while the derivation and
 * `refreshSeriesAliases` agree. So nothing here asserts against a hand-written
 * expected string: every case publishes for real and then requires the derived
 * alias to be a file that publication actually left on disk.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listArtifactSummaries, type ArtifactHostEffects } from '@process/services/artifacts/artifactActions';
import { artifactLedgerPath, readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { beginTaskRun, commitTaskRun } from '@process/services/artifacts/taskRun';

const TASK = 'cron_morning_brief';

let root = '';
let workspace = '';
let ledgerPath = '';

/** One whole run, published through the real begin/commit path. */
async function publishRun(series: string, contents: Record<string, string>, now = new Date()): Promise<string> {
  const handle = await beginTaskRun({ workspace, taskId: TASK, series, now });
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

function effects(): ArtifactHostEffects {
  return {
    readLedger: () => readArtifactLedger(ledgerPath),
    confine: async (target: string) => target,
    launch: async () => ({ ok: true }),
    reveal: async () => ({ ok: true }),
    chooseSaveDestination: async () => null,
  };
}

beforeEach(async () => {
  // realpath: the ledger records the realpath-collapsed workspace, and macOS
  // collapses `/var` to `/private/var`.
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'wl-alias-summary-')));
  workspace = path.join(root, 'workspace');
  ledgerPath = artifactLedgerPath(path.join(root, 'data'));
  await fs.mkdir(workspace, { recursive: true });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe('the stable copy at the series root is listed as the same deliverable', () => {
  it('gives the newest run an alias that is a REAL file publication wrote', async () => {
    const runId = await publishRun('market', { 'brief.html': '<h1>day one</h1>' });

    const summaries = await listArtifactSummaries(effects());
    expect(summaries).toHaveLength(1);
    const [summary] = summaries;
    expect(summary.runId).toBe(runId);

    const aliases = summary.aliasPaths ?? [];
    expect(aliases).toHaveLength(1);
    // Not "equals a string I typed": the derived path has to be the file the
    // publication actually left at the series root, with the same bytes as the
    // canonical target it stands in for.
    await expect(fs.readFile(aliases[0], 'utf8')).resolves.toBe('<h1>day one</h1>');
    await expect(fs.readFile(summary.canonicalPath, 'utf8')).resolves.toBe('<h1>day one</h1>');
    expect(aliases[0]).not.toBe(summary.canonicalPath);
    // And it is shallower - that is the whole reason it is the one clicked.
    expect(path.dirname(aliases[0])).toBe(path.join(workspace, 'artifacts', 'market'));
  });

  it('moves the alias to run 2 and takes it off run 1, because publication retires it', async () => {
    const first = await publishRun('market', { 'brief.html': '<h1>day one</h1>' }, new Date('2026-08-19T07:00:00Z'));
    const second = await publishRun('market', { 'brief.html': '<h1>day two</h1>' }, new Date('2026-08-20T07:00:00Z'));

    const summaries = await listArtifactSummaries(effects());
    const older = summaries.find((entry) => entry.runId === first);
    const newer = summaries.find((entry) => entry.runId === second);

    expect(older?.aliasPaths ?? []).toEqual([]);
    expect(newer?.aliasPaths ?? []).toHaveLength(1);
    // The retirement is real, not just unlisted: the copy at the series root is
    // day two's, so listing it against day one would open the wrong day.
    await expect(fs.readFile(newer!.aliasPaths![0], 'utf8')).resolves.toBe('<h1>day two</h1>');
  });

  it('keeps two series apart, so one series root never claims the other run', async () => {
    await publishRun('market', { 'brief.html': '<h1>market</h1>' });
    await publishRun('support', { 'brief.html': '<h1>support</h1>' });

    const summaries = await listArtifactSummaries(effects());
    expect(summaries).toHaveLength(2);
    // Same file name in both series: the alias has to follow the SERIES, not
    // the name, or previewing one series' copy shows the other's history.
    const pairs = await Promise.all(
      summaries.map(async (summary) => {
        const alias = (summary.aliasPaths ?? [])[0];
        expect(alias).toBeDefined();
        return {
          alias: await fs.readFile(alias, 'utf8'),
          canonical: await fs.readFile(summary.canonicalPath, 'utf8'),
        };
      })
    );
    for (const pair of pairs) expect(pair.alias).toBe(pair.canonical);
    expect(pairs.map((pair) => pair.alias).toSorted()).toEqual(['<h1>market</h1>', '<h1>support</h1>']);
  });

  it('preserves a nested path inside the run directory', async () => {
    // `refreshSeriesAliases` mirrors `<path-inside-the-run-dir>`, not just the
    // base name, so a derivation that used `basename` would point at a file
    // that does not exist.
    await publishRun('market', { 'reports/brief.html': '<h1>nested</h1>' });

    const [summary] = await listArtifactSummaries(effects());
    const alias = (summary.aliasPaths ?? [])[0];
    expect(alias).toBe(path.join(workspace, 'artifacts', 'market', 'reports', 'brief.html'));
    await expect(fs.readFile(alias, 'utf8')).resolves.toBe('<h1>nested</h1>');
  });
});
