/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Where the CURRENTLY OPEN run of a task is allowed to write.
 *
 * `buildEngineSpawnEnv` decides `WAYLAND_OUTPUT_DIR` at engine spawn time, from
 * nothing but the workspace. The cron executor decides when a run starts and
 * ends. Those two live in different processes' worth of call stack with no
 * argument between them, so this is the one-cell mailbox that joins them: the
 * executor opens a run, the spawn reads it, the executor closes it.
 *
 * WHY A REGISTRY AND NOT A PARAMETER. The engine is spawned by
 * `WCoreManager.start()`, three layers below `getOrBuildTask(conversationId)`,
 * whose option bag is `{ yoloMode }` and is shared with every non-cron caller.
 * Threading a run id through it would put a cron concept into the chat path.
 *
 * KEYED BY WORKSPACE, not by conversation. In `new_conversation` mode the
 * conversation for a run does not exist yet when the run opens, and the whole
 * point of P2-2 is that the WORKSPACE is the durable thing. Two jobs never
 * share a workspace (the allocator gives each task its own root) and one job
 * cannot overlap itself (CronService's per-job running guard), so one cell per
 * workspace is one cell per live run.
 *
 * Process-local and deliberately not persisted: a run that did not survive the
 * process did not publish, and its staging directory is invisible.
 */

import path from 'path';

const openRuns = new Map<string, string>();

const key = (workspace: string): string => path.resolve(workspace);

/** Declare where this workspace's open run must write. */
export function openRunOutputDir(workspace: string, outputDir: string): void {
  openRuns.set(key(workspace), path.resolve(outputDir));
}

/** Clear the workspace's open run. Safe to call twice. */
export function closeRunOutputDir(workspace: string): void {
  openRuns.delete(key(workspace));
}

/**
 * The open run's output directory, or undefined when no run is open - in which
 * case the caller keeps its existing default. An interactive chat in a task
 * workspace therefore behaves exactly as it did before.
 */
export function activeRunOutputDir(workspace: string | undefined): string | undefined {
  if (!workspace) return undefined;
  return openRuns.get(key(workspace));
}

/** Test seam only. */
export function clearRunOutputDirs(): void {
  openRuns.clear();
}
