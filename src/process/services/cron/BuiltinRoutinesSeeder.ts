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
import { buildResourceDirCandidates } from '@process/services/skills/SkillLibrary';
import { getBuiltinSkillsCopyDir } from '@process/utils/initStorage';
import type { CronService } from './CronService';
import { CRON_ROUTINE_KIND, type CronJob, type CronSchedule } from './CronStore';

/** Backend used for seeded routines. wcore is the bundled Wayland Core engine, always present. */
const ROUTINE_BACKEND: AgentBackend = 'wcore';

/**
 * Tag written into agentConfig.configOptions so routine crons are identifiable.
 * Shared with `durableTaskWorkspace`, which uses it to keep seeding from
 * allocating a durable folder for a routine nobody has enabled (P2-2).
 */
const ROUTINE_KIND = CRON_ROUTINE_KIND;

export type RoutineDef = {
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
 *
 * Delegates to {@link buildResourceDirCandidates} - the SAME probe order
 * SkillLibrary uses - instead of a hand-copied list. The copy this replaced had
 * drifted: it was a snapshot of the PRE-#22 candidate order, anchored only on
 * `__filename`, and it had no `process.resourcesPath` candidate at all. Because
 * `bundled-workflows` ships through electron-builder `extraResources` (beside
 * `app.asar`, never inside it and never under `app.asar.unpacked`), every
 * candidate missed in a real install and the loop fell through to
 * `<Resources>/app.asar.unpacked/resources/bundled-workflows`, which does not
 * exist - so NO routine was ever seeded in any packaged build. Only the dev
 * source-tree candidate ever hit, which is why dev-mode testing never saw it.
 *
 * The shared builder is a strict superset of the old list: all four former
 * candidates are still probed, after `resourcesPath` and the three-levels-up
 * extraResources path, so dev, packaged main, packaged subprocess and the
 * standalone payload layout all resolve.
 */
export function resolveBundledWorkflowsDir(
  bundleDir: string = path.dirname(__filename),
  resourcesPath: string | undefined = process.resourcesPath
): string {
  const candidates = buildResourceDirCandidates(bundleDir, resourcesPath, 'bundled-workflows');
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'routines.json'))) return candidate;
  }
  return candidates[0];
}

/** The bundled routine definitions, or undefined when they cannot be read. */
export async function loadBundledRoutines(
  dir: string = resolveBundledWorkflowsDir()
): Promise<RoutineDef[] | undefined> {
  const routines = await readJson<RoutineDef[]>(path.join(dir, 'routines.json'));
  return Array.isArray(routines) ? routines : undefined;
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
/**
 * The `artifacts/<series>/` folder this routine's runs publish into.
 *
 * Taken from the routine's OWN declared artifact paths rather than invented:
 * `weekday-morning-report` writes `artifacts/market/` and
 * `weekly-competitor-watch` reads `artifacts/marketing/last-competitor-scan.md`,
 * and those prompts are baked at seed time, so the series the run publishes
 * into has to be the one the prompt already names or the routine reads a folder
 * nothing ever writes - the bug this milestone exists to close, in its
 * input-side form. A routine that declares no artifact path gets its own id.
 */
export function seriesForRoutine(routine: RoutineDef): string {
  for (const value of Object.values(routine.inputs ?? {})) {
    const segments = value.split('/').filter(Boolean);
    if (segments[0] === 'artifacts' && segments[1] && !segments[1].startsWith('.')) return segments[1];
  }
  return routine.id;
}

/** First line of a seeder-generated prompt. Also the migration's fingerprint. */
export function routinePromptHeader(workflow: string): string {
  return `Run the "${workflow}" workflow now as a scheduled, unattended routine.`;
}

/**
 * THE SENTENCE THAT SENT EVERY SCHEDULED RUN AT AN ENVIRONMENT VARIABLE IT
 * CANNOT SEE.
 *
 * `WAYLAND_OUTPUT_DIR` is set on the ENGINE process, and the engine runs every
 * Bash tool call through a fixed 19-name env allowlist that does not include
 * it - proven by executing `wayland-core sandbox exec` on both the shipped
 * v0.13.3 and the pinned v0.13.4, which printed an empty value for it while
 * `WAYLAND_HOME` came back populated as the known-positive control. So a run
 * following this sentence resolved an empty variable, wrote to its fallback,
 * staged nothing, and settled as `no-output`.
 *
 * KEPT, NOT DELETED. `isSeederGeneratedPrompt` tells a prompt the seeder wrote
 * from one the user has edited by matching whole lines against
 * {@link ROUTINE_GENERATED_SENTENCES}. Drop this literal from that set and every
 * already-seeded job's prompt starts reading as user-edited, and the migration
 * refuses to touch the very rows it exists to repair.
 */
export const LEGACY_ROUTINE_OUTPUT_DIR_SENTENCE =
  "Write every file this run produces into the directory named by the WAYLAND_OUTPUT_DIR environment variable. It is an absolute path inside the workspace, and it is the only place this run's output is collected from - a file written anywhere else is not published and the next run cannot read it. A relative path in the inputs above is workspace-relative and is somewhere to READ from, never a write target.";

/**
 * Where a scheduled run must write, named as TEXT rather than as a variable.
 *
 * The absolute path itself is NOT in this sentence and must not be: this string
 * is baked into `cron_jobs.prompt` at SEED time, months before any run exists,
 * and a stale absolute path is worse than none. The run's own directory arrives
 * at spawn time on the `--system-prompt` channel (`buildOutputDirective`), which
 * is appended to the engine's composed prompt and survives a `--resume`.
 */
export const ROUTINE_OUTPUT_DIR_SENTENCE =
  "Write every file this run produces into the absolute deliverables directory named in your run instructions. That is the only place this run's output is collected from - a file written anywhere else is not published and the next run cannot read it. Do not read WAYLAND_OUTPUT_DIR: it is not visible to shell commands and resolves empty. A relative path in the inputs above is workspace-relative and is somewhere to READ from, never a write target.";

/** Closing rule, unchanged since the first seeded routine. */
export const ROUTINE_NO_ATTACHMENT_SENTENCE =
  'This run has no attached file. Resolve each input from disk first; if a path is missing, fall back to the connected MCP connector for that domain. If no data source is reachable, skip the run and report "no data" rather than guessing or fabricating output.';

/**
 * Every whole-line sentence the seeder has ever emitted. The migration uses
 * this to tell a prompt IT wrote from one the user has edited: an unrecognised
 * line means hands off.
 */
export const ROUTINE_GENERATED_SENTENCES: readonly string[] = [
  ROUTINE_OUTPUT_DIR_SENTENCE,
  // EVERY sentence the seeder has EVER emitted, superseded ones included. A
  // retired literal that is dropped from this list makes every prompt already
  // on disk read as user-edited, and the migration then refuses to repair the
  // rows it was written for.
  LEGACY_ROUTINE_OUTPUT_DIR_SENTENCE,
  ROUTINE_NO_ATTACHMENT_SENTENCE,
];

/**
 * ONE path segment, or nothing.
 *
 * These names are joined onto `getBuiltinSkillsCopyDir()` and onto the bundled
 * workflows directory to produce directories that are then COPIED into the
 * user's task folder. `routines.json` and `index.json` are trusted app
 * resources today, but `skills.import.folder` / `.git` / `.zip` are real local
 * channels, so a future user-authored routine must not be able to walk out of
 * the tree its name is joined onto.
 */
function isSingleSkillSegment(name: string): boolean {
  if (!name || name.length > 64) return false;
  if (name !== path.basename(name)) return false;
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) && !name.endsWith('.');
}

/**
 * The skill directories a seeded routine's run needs INSIDE its workspace.
 *
 * The engine sandboxes on the workspace, so a skill that lives in the app's
 * config directory is not merely inconvenient to reach - it is refused
 * (`Glob refused: path ... is outside sandbox root`). Two things have to travel:
 *
 *  1. the WORKFLOW BODY (`bodies/<workflow>/`), which is the only place the run
 *     instructions' steps exist at all; and
 *  2. every skill the workflow DECLARES in its `metadata.depends`, because a
 *     bundled skill like `market-open-report` is not in the `_builtin` auto set
 *     and is otherwise placed only when the user has enabled or pinned it.
 *
 * Deliberately the declared set and nothing wider. The alternative - copying
 * the whole builtin-skills tree - would put ~4.7M of unrelated skills, plus
 * whatever the user has globally pinned, into `~/Documents` on a schedule,
 * where on a machine with Desktop & Documents sync turned on it becomes a
 * third-party upload.
 */
export async function resolveRoutineSkillDirs(routineId: string | undefined): Promise<string[]> {
  if (!routineId) return [];
  const dir = resolveBundledWorkflowsDir();
  const routines = await loadBundledRoutines(dir);
  const routine = routines?.find((r) => r?.id === routineId);
  const workflow = routine?.workflow;
  if (!workflow || !isSingleSkillSegment(workflow)) return [];

  const out: string[] = [];
  const bodyDir = path.join(dir, 'bodies', workflow);
  if (existsSync(path.join(bodyDir, 'SKILL.md'))) out.push(bodyDir);

  const entries = await readJson<Array<{ name?: string; metadata?: { depends?: string } }>>(
    path.join(dir, 'index.json')
  );
  const declared = entries?.find((e) => e?.name === workflow)?.metadata?.depends ?? '';
  const builtinRoot = getBuiltinSkillsCopyDir();
  for (const name of declared.split(/[\s,]+/).filter(Boolean)) {
    if (!isSingleSkillSegment(name)) {
      logger.warn(`[BuiltinRoutines] Routine "${routineId}" declares an unusable skill name ${JSON.stringify(name)}`);
      continue;
    }
    const candidate = path.join(builtinRoot, name);
    if (existsSync(candidate)) out.push(candidate);
  }
  return out;
}

export function buildRoutinePrompt(routine: RoutineDef): string {
  const inputLines = routine.inputs
    ? Object.entries(routine.inputs)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n')
    : '';

  return [
    routinePromptHeader(routine.workflow),
    '',
    inputLines ? `Inputs:\n${inputLines}` : '',
    '',
    ROUTINE_OUTPUT_DIR_SENTENCE,
    '',
    ROUTINE_NO_ATTACHMENT_SENTENCE,
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
      configOptions: { kind: ROUTINE_KIND, routineId: routine.id, artifactSeries: seriesForRoutine(routine) },
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
