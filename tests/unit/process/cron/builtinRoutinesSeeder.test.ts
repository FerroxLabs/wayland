/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { seedBuiltinRoutines } from '@process/services/cron/BuiltinRoutinesSeeder';
import type { CronService } from '@process/services/cron/CronService';

/**
 * The seeder had no test, and its two failure modes are both SILENT — it logs a
 * warning and carries on, so a broken routine looks exactly like a healthy boot:
 *
 *  1. A routine naming a workflow that is absent from `index.json` is skipped.
 *     The routine simply never appears in the scheduled-tasks list, with nothing
 *     in the UI to say why.
 *
 *  2. A routine seeded ENABLED would fire unattended on a fresh install. Nothing
 *     is supposed to run until the user opts in, and `addJob` creates jobs
 *     enabled, so the disable step is load-bearing rather than defensive.
 */

const WORKFLOWS_DIR = path.resolve(__dirname, '../../../../src/process/resources/bundled-workflows');

type RoutineDef = { id: string; name: string; workflow: string; schedule: string };

const routines = JSON.parse(readFileSync(path.join(WORKFLOWS_DIR, 'routines.json'), 'utf-8')) as RoutineDef[];
const workflowNames = new Set(
  (JSON.parse(readFileSync(path.join(WORKFLOWS_DIR, 'index.json'), 'utf-8')) as Array<{ name?: string }>)
    .map((e) => e?.name)
    .filter((n): n is string => typeof n === 'string')
);

/** Records what the seeder did, in order, so enable-state can be read at the end. */
function makeRecordingCronService() {
  const jobs = new Map<string, { id: string; routineId?: string; enabled: boolean; mode?: string }>();
  let nextId = 1;
  const service = {
    listJobs: async () =>
      [...jobs.values()].map((j) => ({
        id: j.id,
        metadata: { agentConfig: { configOptions: { kind: 'routine', routineId: j.routineId } } },
      })),
    addJob: async (params: { agentConfig?: { mode?: string; configOptions?: { routineId?: string } } }) => {
      const id = `job-${nextId++}`;
      // Mirrors the real addJob: a new job starts ENABLED.
      jobs.set(id, {
        id,
        routineId: params.agentConfig?.configOptions?.routineId,
        enabled: true,
        mode: params.agentConfig?.mode,
      });
      return { id };
    },
    updateJob: async (id: string, patch: { enabled?: boolean }) => {
      const job = jobs.get(id);
      if (job && patch.enabled !== undefined) job.enabled = patch.enabled;
    },
  };
  return { service: service as unknown as CronService, jobs };
}

describe('built-in routines seeder', () => {
  it('every routine names a workflow that exists in index.json', () => {
    // A routine whose workflow is missing here is dropped with only a log line,
    // so this assertion is the only thing standing between a typo and a routine
    // that never appears at all.
    const dangling = routines.filter((r) => !workflowNames.has(r.workflow)).map((r) => `${r.id} -> ${r.workflow}`);
    expect(dangling).toEqual([]);
  });

  it('seeds the morning report routine', async () => {
    const { service, jobs } = makeRecordingCronService();
    await seedBuiltinRoutines(service);
    const seededRoutineIds = [...jobs.values()].map((j) => j.routineId);
    // The routine id and the workflow it runs are DIFFERENT strings
    // (`weekday-morning-report` fires `wayland-morning-report`); conflating them
    // is how a caller ends up referring to a routine that does not exist.
    expect(seededRoutineIds).toContain('weekday-morning-report');
  });

  it('seeds every routine, and leaves all of them DISABLED', async () => {
    const { service, jobs } = makeRecordingCronService();
    await seedBuiltinRoutines(service);

    expect(jobs.size).toBe(routines.length);
    const stillEnabled = [...jobs.values()].filter((j) => j.enabled).map((j) => j.routineId);
    expect(stillEnabled).toEqual([]);
    expect([...jobs.values()].every((job) => job.mode === 'auto_edit')).toBe(true);
  });

  it('is idempotent, so reboots never stack duplicates', async () => {
    const { service, jobs } = makeRecordingCronService();
    await seedBuiltinRoutines(service);
    const afterFirst = jobs.size;
    await seedBuiltinRoutines(service);
    expect(jobs.size).toBe(afterFirst);
  });
});
