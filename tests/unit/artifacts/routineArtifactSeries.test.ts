/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE SEAM BETWEEN THE TWO LANES, at the level of the twelve bundled routines.
 *
 * Lane B repointed four routines to read a prior run from
 * `artifacts/<series>/<file>` instead of the unreachable `~/wayland/outbox/`.
 * That fixes the read only if the RUN publishes into the same `<series>`, and
 * nothing chose one: the executor had no notion of a series and the seeder
 * recorded none. A run filed under any other name would leave those four
 * reading a folder nothing ever writes - the same defect, moved.
 *
 * So the series is DERIVED from the routine's own declared artifact paths, and
 * this pins the derivation against the real bundled corpus.
 */

import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { seriesForRoutine, type RoutineDef } from '@process/services/cron/BuiltinRoutinesSeeder';
import { artifactSeriesForJob, sanitizeSeriesName } from '@process/services/cron/durableTaskWorkspace';
import type { CronJob } from '@process/services/cron/CronStore';
import { seriesDirFor } from '@process/services/artifacts/taskRun';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const routines = JSON.parse(
  readFileSync(path.join(REPO_ROOT, 'src/process/resources/bundled-workflows/routines.json'), 'utf-8')
) as RoutineDef[];

/** Inputs whose value is a prior run's own deliverable (lane B's list). */
const PRIOR_RUN_INPUT_KEYS = new Set(['last_scan_path', 'prior_review_path', 'prior_update_path']);

function jobWithSeries(series?: string): CronJob {
  return {
    id: 'cron_job_42',
    name: 'A task',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: '' },
    target: { payload: { kind: 'message', text: '' }, executionMode: 'new_conversation' },
    metadata: {
      conversationId: '',
      conversationTitle: '',
      agentType: 'wcore',
      createdBy: 'agent',
      createdAt: 0,
      updatedAt: 0,
      agentConfig: {
        backend: 'wcore',
        name: 'A task',
        configOptions: series ? { kind: 'routine', artifactSeries: series } : { kind: 'routine' },
      },
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
  } as unknown as CronJob;
}

describe('a routine publishes into the series its own prompt already names', () => {
  it('the corpus under test is the real one', () => {
    // Known-positive control: the zero-offender assertions below only mean
    // something because these two counts are non-zero on the real file.
    expect(routines.length).toBe(13);
    const priorRunInputs = routines.flatMap((routine) =>
      Object.entries(routine.inputs ?? {}).filter(([key]) => PRIOR_RUN_INPUT_KEYS.has(key))
    );
    expect(priorRunInputs.length).toBe(4);
  });

  it('every declared artifacts/ path in a routine resolves into that routine own series', () => {
    const offenders: string[] = [];
    let checked = 0;
    for (const routine of routines) {
      const series = seriesForRoutine(routine);
      for (const [key, value] of Object.entries(routine.inputs ?? {})) {
        const segments = value.split('/').filter(Boolean);
        if (segments[0] !== 'artifacts') continue;
        checked += 1;
        if (segments[1] !== series) offenders.push(`${routine.id}.${key} = ${value} (series ${series})`);
      }
    }
    // Control: five routines declare an artifacts/ path (four reads + the
    // morning report write). A scan that found none would pass vacuously.
    expect(checked).toBe(5);
    expect(offenders).toEqual([]);
  });

  it('the run directory a routine publishes into is the directory its prompt reads', () => {
    // `path.resolve`: `seriesDirFor` calls `path.resolve(workspace)`, which on
    // Windows qualifies a drive-less absolute path with the current drive, so a
    // `path.join(path.sep, ...)` fixture can never match it. POSIX is unaffected.
    const workspace = path.resolve(path.sep, 'ws');
    for (const routine of routines) {
      for (const [key, value] of Object.entries(routine.inputs ?? {})) {
        if (!PRIOR_RUN_INPUT_KEYS.has(key)) continue;
        const seriesDir = seriesDirFor(workspace, seriesForRoutine(routine));
        // The prior-run input is exactly one file inside that series directory.
        expect(path.join(workspace, value)).toBe(path.join(seriesDir, path.basename(value)));
      }
    }
  });

  it('a job carries the seeded series, and falls back to its own id when it has none', () => {
    expect(artifactSeriesForJob(jobWithSeries('marketing'))).toBe('marketing');
    expect(artifactSeriesForJob(jobWithSeries())).toBe('cron_job_42');
  });

  it('a series name is one safe, visible path segment', () => {
    expect(sanitizeSeriesName('../../etc')).toBe('etc');
    expect(sanitizeSeriesName('.staging')).toBe('staging');
    expect(sanitizeSeriesName('a/b')).toBe('a-b');
    expect(sanitizeSeriesName('   ')).toBeNull();
    expect(() => seriesDirFor('/ws', '..')).toThrow();
    expect(() => seriesDirFor('/ws', '.latest.json')).toThrow();
    expect(() => seriesDirFor('/ws', 'a/b')).toThrow();
  });
});

/**
 * The spawn-site assertion that used to live here was a `readFileSync` +
 * `toContain` grep over `wcore/index.ts`. It has been replaced by two tests
 * that EXECUTE the path instead:
 *
 *   - `wcoreSpawnRunOutputDir.test.ts` drives the real `WCoreAgent.start()` and
 *     reads `WAYLAND_OUTPUT_DIR` off the real `spawn` call;
 *   - `wcoreManagerRunOutputHandoff.test.ts` drives the real
 *     `WCoreManager.start()` and pins the conversation id it hands down.
 *
 * A source-text assertion cannot tell a working wiring from a plausible-looking
 * one, and goes green again the moment the line it greps for is reformatted.
 */
