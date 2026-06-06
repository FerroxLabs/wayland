/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Built-in routines seeder.
 *
 * A "routine" is a Wayland-shipped scheduled wrapper around a bundled workflow:
 * a cron job that, when enabled, fires the workflow on its schedule in a fresh
 * conversation. The definitions live in
 * `src/process/resources/bundled-workflows/routines.json` and each one names a
 * workflow that must exist in that folder's `index.json`.
 *
 * Seeding mirrors {@link CronRitualScheduler}: jobs are created through
 * `CronService.addJob` with `executionMode: 'new_conversation'` and a
 * `configOptions.kind === 'routine'` tag so they can be told apart from
 * user-created crons and from Standing-Company rituals.
 *
 * Every seeded routine is created DISABLED. Nothing fires on a fresh install;
 * the user opts in by enabling a routine from the scheduled-tasks UI. Seeding is
 * idempotent: a routine already present (matched by its tagged `routineId`) is
 * skipped, so re-runs across reboots never stack duplicates.
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { logger } from '@office-ai/platform';
import type { AgentBackend } from '@/common/types/acpTypes';
import type { CronService } from './CronService';
import type { CronJob, CronSchedule } from './CronStore';

/** Backend used for seeded routines. wcore is the bundled Wayland Core engine, always present. */
const ROUTINE_BACKEND: AgentBackend = 'wcore';

/** Tag written into agentConfig.configOptions so routine crons are identifiable. */
const ROUTINE_KIND = 'routine';

type RoutineDef = {
  id: string;
  name: string;
  description: string;
  schedule: string;
  timezone?: string;
  workflow: string;
  inputs?: Record<string, string>;
};

/**
 * Resolve the directory holding `routines.json` + `index.json`.
 * Mirrors SkillLibrary.resolveBundledWorkflowsDir's dev / packaged / standalone
 * probe order so the seeder reads from the same place workflows are read from.
 */
function resolveBundledWorkflowsDir(): string {
  const myDir = path.dirname(__filename);
  const baseDir = path.basename(myDir) === 'chunks' ? path.dirname(myDir) : myDir;
  const baseDirUnpacked = baseDir.replace('app.asar', 'app.asar.unpacked');

  const candidates = [
    path.resolve(baseDirUnpacked, '../../resources/bundled-workflows'),
    path.resolve(baseDir, '../../src/process/resources/bundled-workflows'),
    path.resolve(baseDir, '../../resources/bundled-workflows'),
    path.resolve(baseDir, '../resources/bundled-workflows'),
  ];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'routines.json'))) return candidate;
  }
  return candidates[0];
}

/** Read and JSON-parse a file, returning undefined on any failure. */
async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/** Load the set of workflow names declared in the bundled-workflows index. */
async function loadWorkflowNames(dir: string): Promise<Set<string>> {
  const entries = await readJson<Array<{ name?: string; type?: string }>>(path.join(dir, 'index.json'));
  const names = new Set<string>();
  if (Array.isArray(entries)) {
    for (const e of entries) {
      if (e && typeof e.name === 'string') names.add(e.name);
    }
  }
  return names;
}

/**
 * Build the prompt that fires the workflow. It names the workflow skill and
 * passes the routine's inputs so the workflow can resolve its data sources.
 * Mirrors the unattended-run guidance baked into the source routine YAMLs:
 * resolve inputs from disk first, fall back to connectors, and skip rather than
 * fabricate when no data is reachable.
 */
function buildRoutinePrompt(routine: RoutineDef): string {
  const inputLines = routine.inputs
    ? Object.entries(routine.inputs)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n')
    : '';

  return [
    `Run the "${routine.workflow}" workflow now as a scheduled, unattended routine.`,
    '',
    inputLines ? `Inputs:\n${inputLines}` : '',
    '',
    'This run has no attached file. Resolve each input from disk first; if a path is missing, fall back to the connected MCP connector for that domain. If no data source is reachable, skip the run and report "no data" rather than guessing or fabricating output.',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * Seed the 12 built-in routines as DISABLED `new_conversation` cron jobs.
 * Idempotent and best-effort: failures are logged and skipped, never thrown,
 * so a malformed entry can never block boot.
 */
export async function seedBuiltinRoutines(cronService: CronService): Promise<void> {
  const dir = resolveBundledWorkflowsDir();
  const routinesPath = path.join(dir, 'routines.json');

  const routines = await readJson<RoutineDef[]>(routinesPath);
  if (!Array.isArray(routines) || routines.length === 0) {
    logger.warn(`[BuiltinRoutines] No routines found at ${routinesPath}; skipping seed`);
    return;
  }

  const workflowNames = await loadWorkflowNames(dir);

  let existingRoutineIds: Set<string>;
  try {
    const allJobs = await cronService.listJobs();
    existingRoutineIds = new Set(
      allJobs
        .filter((j) => j.metadata.agentConfig?.configOptions?.kind === ROUTINE_KIND)
        .map((j) => j.metadata.agentConfig?.configOptions?.routineId)
        .filter((id): id is string => !!id)
    );
  } catch (err) {
    logger.warn(`[BuiltinRoutines] Could not list existing jobs: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  let seeded = 0;
  for (const routine of routines) {
    if (!routine?.id || !routine.workflow || !routine.schedule) {
      logger.warn(`[BuiltinRoutines] Skipping malformed routine: ${JSON.stringify(routine)}`);
      continue;
    }

    if (existingRoutineIds.has(routine.id)) {
      continue; // already seeded
    }

    if (workflowNames.size > 0 && !workflowNames.has(routine.workflow)) {
      logger.warn(
        `[BuiltinRoutines] Routine "${routine.id}" references unknown workflow "${routine.workflow}"; skipping`
      );
      continue;
    }

    const schedule: CronSchedule = {
      kind: 'cron',
      expr: routine.schedule,
      tz: routine.timezone && routine.timezone !== 'local' ? routine.timezone : undefined,
      description: routine.schedule,
    };

    const agentConfig: NonNullable<CronJob['metadata']['agentConfig']> = {
      backend: ROUTINE_BACKEND,
      name: routine.name,
      mode: 'bypassPermissions',
      configOptions: { kind: ROUTINE_KIND, routineId: routine.id },
    };

    try {
      const job = await cronService.addJob({
        name: routine.name,
        description: routine.description,
        schedule,
        prompt: buildRoutinePrompt(routine),
        // new_conversation mode builds its own conversation from agentConfig at
        // fire time, so no pre-existing conversation is required.
        conversationId: '',
        conversationTitle: routine.name,
        agentType: ROUTINE_BACKEND,
        createdBy: 'agent',
        executionMode: 'new_conversation',
        agentConfig,
      });

      // addJob creates jobs enabled:true. Routines must be opt-in, so disable
      // immediately (this also stops the timer started by addJob).
      await cronService.updateJob(job.id, { enabled: false });
      seeded += 1;
    } catch (err) {
      logger.warn(
        `[BuiltinRoutines] Failed to seed routine "${routine.id}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (seeded > 0) {
    logger.info(`[BuiltinRoutines] Seeded ${seeded} built-in routine(s) (disabled, opt-in)`);
  }
}
