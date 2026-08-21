/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Where the CURRENTLY OPEN run of a task is allowed to write.
 *
 * `buildEngineSpawnEnv` decides `WAYLAND_OUTPUT_DIR` at engine spawn time. The
 * cron executor decides when a run starts and ends. Those two live in different
 * processes' worth of call stack with no argument between them, so this is the
 * one-cell mailbox that joins them: the executor opens a run, the spawn reads
 * it, the executor closes it.
 *
 * WHY A REGISTRY AND NOT A PARAMETER. The engine is spawned by
 * `WCoreManager.start()`, three layers below `getOrBuildTask(conversationId)`,
 * whose option bag is `{ yoloMode }` and is shared with every non-cron caller.
 * Threading a run id through it would put a cron concept into the chat path.
 *
 * KEYED BY CONVERSATION, NOT BY WORKSPACE.
 * -----------------------------------------
 * The first cut keyed on the workspace, reasoning that one job owns one task
 * root. It does - but a workspace is not a spawn. A durable task folder is an
 * ordinary folder the user can open a chat in, and several chats can share one.
 * While a scheduled run was open, EVERY engine spawn resolving that workspace -
 * the user's own interactive chat in the task folder, a second job the user
 * pointed at the same root, a manual re-run racing the cron - read this cell and
 * was silently redirected into the scheduled run's staging directory. Its output
 * then either vanished at abandon or was published as the run's deliverable.
 *
 * The conversation is the identity of a spawn, so it is the key. A chat that
 * does not own a run finds nothing here and keeps the series root, which is
 * exactly the pre-run behaviour.
 *
 * The cell also carries its RUN ID, and `closeRunOutputDir` is a
 * compare-and-delete against it. Two overlapping runs that end up on the same
 * conversation (a retry that reuses it, a job re-armed mid-flight) otherwise let
 * whichever settles first delete the still-open run's cell, after which any
 * respawn for that run writes straight into the series root the user reads -
 * bypassing staging entirely, which is the one thing staging exists to prevent.
 *
 * Process-local and deliberately not persisted: a run that did not survive the
 * process did not publish, and its staging directory is invisible.
 */

import path from 'path';

interface OpenRun {
  runId: string;
  outputDir: string;
}

/** conversationId -> the run that owns that conversation's next engine spawn. */
const openRuns = new Map<string, OpenRun>();

/**
 * Declare where this conversation's open run must write. A later open for the
 * same conversation replaces the earlier one: the newest run is the one whose
 * engine is about to spawn.
 */
export function openRunOutputDir(conversationId: string, runId: string, outputDir: string): void {
  if (!conversationId || !runId) return;
  openRuns.set(conversationId, { runId, outputDir: path.resolve(outputDir) });
}

/**
 * Clear the conversation's open run, but ONLY if it is still this run's cell.
 * Safe to call twice, and safe to call from a run that has already been
 * superseded - it will not evict the run that replaced it.
 */
export function closeRunOutputDir(conversationId: string, runId: string): void {
  if (!conversationId) return;
  const open = openRuns.get(conversationId);
  if (open && open.runId === runId) openRuns.delete(conversationId);
}

/**
 * The open run's output directory, or undefined when this conversation has no
 * run open - in which case the caller keeps its existing default. An
 * interactive chat in a task workspace therefore behaves exactly as it did
 * before, even while a scheduled run of that task is in flight.
 */
export function activeRunOutputDir(conversationId: string | undefined): string | undefined {
  if (!conversationId) return undefined;
  return openRuns.get(conversationId)?.outputDir;
}

/** Test seam only. */
export function clearRunOutputDirs(): void {
  openRuns.clear();
}
