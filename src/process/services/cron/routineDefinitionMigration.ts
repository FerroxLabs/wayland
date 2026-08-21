/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BRINGING AN ALREADY-SEEDED ROUTINE UP TO THE CURRENT DEFINITION.
 *
 * `seedBuiltinRoutines` is first-write-wins: it skips any routine whose
 * `routineId` is already present. That is the right rule for not stacking
 * duplicates, and it means an edit to `routines.json` or to the generated
 * prompt reaches a FRESH install and no other. Two shipped fixes land in
 * exactly that hole:
 *
 *  - four routines had `prior_review_path`-style inputs repointed from
 *    `~/wayland/outbox/...`, a location nothing has ever written, into the
 *    task's own `artifacts/<domain>/` series. An existing install still holds
 *    the old path baked into its prompt, so its "compare against last week"
 *    step can never resolve - this milestone's headline bug, still live.
 *  - the prompt now names `WAYLAND_OUTPUT_DIR` as the write destination. A
 *    prompt without it stages nothing, so the run publishes nothing.
 *
 * And one that is not about the prompt at all: `artifactSeriesForJob` reads
 * `configOptions.artifactSeries`, which only a post-fix seeding writes. Without
 * it a run publishes into `artifacts/<job id>/` - `cron_<uuid>` - while the
 * prompt reads `artifacts/market/`. The write side and the read side name
 * different folders, which is the same bug from the other end.
 *
 * WHAT THIS WILL AND WILL NOT TOUCH.
 *
 * Only a job that is PROVABLY one of ours and PROVABLY un-edited:
 *   - tagged `kind: 'routine'` with a `routineId` that still exists in the
 *     shipped `routines.json`, and
 *   - whose stored prompt parses as seeder output for THAT routine - first line
 *     the generated header, every other line either `Inputs:`, one
 *     `- key: value` per declared input with the key set matching exactly, or a
 *     sentence this seeder has emitted.
 *
 * Anything else - a reworded prompt, an added instruction, an input the user
 * renamed - fails the parse and is left exactly as it is.
 *
 * REVERSIBLE. A rewritten prompt is kept verbatim in
 * `configOptions.routinePromptBeforeMigration`, written once and never
 * overwritten, so the original is recoverable from the job itself rather than
 * from a release artifact the user does not have.
 *
 * NOT A WORKSPACE SWEEP. Nothing here allocates a folder. A job armed before
 * durable workspaces existed gets its task root the first time it actually
 * fires (`CronService.executeJob`), so a routine the user enabled and forgot
 * never produces a directory in their Documents until it produces a report.
 */

import { logger } from '@office-ai/platform';
import {
  ROUTINE_GENERATED_SENTENCES,
  buildRoutinePrompt,
  loadBundledRoutines,
  routinePromptHeader,
  seriesForRoutine,
  type RoutineDef,
} from './BuiltinRoutinesSeeder';
import type { CronService } from './CronService';
import { CRON_ROUTINE_KIND, type CronJob } from './CronStore';

/** Where a rewritten prompt's predecessor is kept, so the change can be undone. */
export const PROMPT_BACKUP_KEY = 'routinePromptBeforeMigration';

/** What one job's migration changed. */
export type RoutineMigration = {
  jobId: string;
  routineId: string;
  changes: Array<'prompt' | 'series'>;
};

const GENERATED = new Set<string>(ROUTINE_GENERATED_SENTENCES);

/**
 * True when `prompt` is byte-for-byte something this seeder could have written
 * for `routine`, at any version. Deliberately structural rather than a
 * comparison against a remembered old string: the previous definitions are not
 * shipped, and a version stamp would have to have been written by the version
 * that did not write one.
 */
export function isSeederGeneratedPrompt(prompt: string, routine: RoutineDef): boolean {
  const lines = prompt.split('\n');
  if (lines[0] !== routinePromptHeader(routine.workflow)) return false;

  const declaredKeys = Object.keys(routine.inputs ?? {});
  const seenKeys: string[] = [];
  const seenSentences = new Set<string>();
  let sawInputsHeader = false;

  for (const line of lines.slice(1)) {
    if (line === 'Inputs:') {
      if (sawInputsHeader) return false;
      sawInputsHeader = true;
      continue;
    }
    const input = line.match(/^- ([^:]+): (.*)$/);
    if (input) {
      if (!sawInputsHeader) return false;
      seenKeys.push(input[1]);
      continue;
    }
    if (GENERATED.has(line)) {
      // A generated sentence twice is not a shape this seeder produces.
      if (seenSentences.has(line)) return false;
      seenSentences.add(line);
      continue;
    }
    return false;
  }

  if (sawInputsHeader !== declaredKeys.length > 0) return false;
  return seenKeys.toSorted().join(' ') === declaredKeys.toSorted().join(' ');
}

/** The routine a job was seeded from, or undefined when it is not one of ours. */
export function routineForJob(job: CronJob, routines: readonly RoutineDef[]): RoutineDef | undefined {
  const config = job.metadata.agentConfig?.configOptions;
  if (!config || config.kind !== CRON_ROUTINE_KIND || !config.routineId) return undefined;
  return routines.find((r) => r.id === config.routineId);
}

/**
 * The single repository update that brings one job up to date, or null when
 * there is nothing to change (or nothing we are allowed to change).
 *
 * Prompt and series move together in ONE patch: they are the write side and the
 * read side of the same folder, and a crash between two writes would leave a
 * job publishing into one place while reading another - the exact state this
 * repairs.
 */
export function plannedRoutineUpdate(
  job: CronJob,
  routine: RoutineDef
): { updates: Partial<CronJob>; changes: RoutineMigration['changes'] } | null {
  const agentConfig = job.metadata.agentConfig;
  if (!agentConfig) return null;
  const configOptions = { ...agentConfig.configOptions };
  const changes: RoutineMigration['changes'] = [];

  // The series a job publishes into. Only ever FILLED IN, never rewritten: a
  // job that already declares one may have published under that name and moving
  // it would orphan the history this milestone exists to keep. Absent means the
  // job was seeded before the series existed, so nothing has been published
  // under the `cron_<id>` fallback either.
  if (!configOptions.artifactSeries) {
    configOptions.artifactSeries = seriesForRoutine(routine);
    changes.push('series');
  }

  const current = job.target.payload.text ?? '';
  const wanted = buildRoutinePrompt(routine);
  let updates: Partial<CronJob> = {};
  if (current !== wanted && isSeederGeneratedPrompt(current, routine)) {
    if (!configOptions[PROMPT_BACKUP_KEY]) configOptions[PROMPT_BACKUP_KEY] = current;
    updates = { target: { ...job.target, payload: { ...job.target.payload, text: wanted } } };
    changes.push('prompt');
  }

  if (changes.length === 0) return null;
  return {
    updates: { ...updates, metadata: { ...job.metadata, agentConfig: { ...agentConfig, configOptions } } },
    changes,
  };
}

/**
 * Migrate every seeded routine on this install. Best-effort and idempotent:
 * a second run finds nothing to do, and a failure on one job never stops the
 * next - a routine left on its old definition is the state we are already in,
 * while a throw here would take boot down with it.
 */
export async function migrateSeededRoutines(
  cronService: CronService,
  routines?: readonly RoutineDef[]
): Promise<RoutineMigration[]> {
  const definitions = routines ?? (await loadBundledRoutines());
  if (!definitions || definitions.length === 0) return [];

  let jobs: CronJob[];
  try {
    jobs = await cronService.listJobs();
  } catch (err) {
    logger.warn(`[RoutineMigration] Could not list jobs: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }

  const migrated: RoutineMigration[] = [];
  for (const job of jobs) {
    const routine = routineForJob(job, definitions);
    if (!routine) continue;
    const planned = plannedRoutineUpdate(job, routine);
    if (!planned) continue;
    try {
      // eslint-disable-next-line no-await-in-loop -- one repository write per job; parallel writes to the same store would interleave patches
      await cronService.updateJob(job.id, planned.updates);
      migrated.push({ jobId: job.id, routineId: routine.id, changes: planned.changes });
    } catch (err) {
      logger.warn(
        `[RoutineMigration] Could not update routine "${routine.id}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (migrated.length > 0) {
    logger.info(
      `[RoutineMigration] Brought ${migrated.length} seeded routine(s) up to the current definition: ${migrated
        .map((m) => `${m.routineId} (${m.changes.join('+')})`)
        .join(', ')}`
    );
  }
  return migrated;
}
