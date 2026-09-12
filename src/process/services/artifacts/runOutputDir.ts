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
 * the agent start path, three layers below `getOrBuildTask(conversationId)`,
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

import { realpathSync } from 'fs';
import path from 'path';
import { CHAT_NAMESPACE } from './artifactLedger';

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

/**
 * The physical path this spelling names, for a path that may not exist yet.
 *
 * `realpathSync` throws on a missing leaf, and this is called BEFORE a run's
 * directory necessarily exists - so the deepest ancestor that does exist is
 * canonicalized and the missing tail re-appended. That keeps a not-yet-created
 * destination comparable with a realpathed workspace instead of falling back to
 * the lexical spelling and reintroducing the divergence for exactly the case
 * the caller is about to create.
 */
function canonicalizePath(target: string): string {
  let current = path.resolve(target);
  const tail: string[] = [];
  for (;;) {
    try {
      return path.join(realpathSync(current), ...tail);
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return path.resolve(target);
      tail.unshift(path.basename(current));
      current = parent;
    }
  }
}

/**
 * The run's staging directory when one is open and genuinely inside the
 * workspace, otherwise the series root. Containment is re-checked HERE rather
 * than trusted from the caller: this value becomes a host-blessed write
 * destination handed to model-authored skill text, so the one place it is
 * produced is the right place to prove it cannot point out of the sandbox.
 */
export function resolveOutputDir(workspace: string, outputDir?: string, conversationId?: string): string {
  const seriesRoot = path.join(workspace, 'artifacts');
  if (outputDir) {
    // BOTH SIDES CANONICALIZED BEFORE COMPARING.
    //
    // The workspace reaches the non-raw spawn already realpathed (the project
    // config lease hands the agent a canonical path), while the run's
    // staging directory is stored lexically. `~/.wayland` is a real symlink on
    // macOS, so every managed workspace has two spellings, they compared as
    // "outside", and a scheduled run's deliverable was silently redirected into
    // the CHAT namespace - never staged, never published.
    //
    // This is also strictly NARROWER than the lexical check it replaces: a
    // symlink planted inside the workspace that points out used to pass, because
    // `path.relative` sees a child path and never looks at what it is.
    const resolvedWorkspace = canonicalizePath(workspace);
    const resolved = canonicalizePath(outputDir);
    const relative = path.relative(resolvedWorkspace, resolved);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) return path.resolve(outputDir);
  }
  // No run open. A conversation is an interactive chat, and its deliverables
  // must NOT land in the series root - see CHAT_NAMESPACE. Falling back to the
  // namespace ROOT (rather than to the series root) when the id is unusable as
  // a path segment keeps even that case out of series classification, which a
  // fall-through to `seriesRoot` would not.
  if (!conversationId) return seriesRoot;
  const chatRoot = path.join(seriesRoot, CHAT_NAMESPACE);
  const segment = usableConversationSegment(conversationId);
  return segment ? path.join(chatRoot, segment) : chatRoot;
}

/**
 * A conversation id is only allowed to become a directory name when it is
 * already one safe segment. Ids are generated hex/UUID, so this rejects
 * nothing real - it exists because this value is joined into a host-blessed
 * write destination handed to model-authored text, and "the caller only ever
 * passes good input" is the assumption every traversal starts from.
 */
function usableConversationSegment(conversationId: string): string | null {
  const trimmed = conversationId.trim();
  if (!trimmed || trimmed.length > 128) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(trimmed)) return null;
  if (/[.]$/.test(trimmed)) return null;
  return trimmed;
}
