/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Last-resort registry of live agent engine child processes (wayland-core over
 * `--json-stream`, and ACP backend CLIs).
 *
 * #443: the primary teardown path is per-agent and graceful -
 * `WorkerTaskManager.clear()` in before-quit awaits each manager's `kill()`,
 * which runs `WCoreAgent.kill()` / `AcpConnection.disconnect()` -> `killChild`.
 * That path is correct but not sufficient on its own to guarantee no orphans on
 * quit:
 *   - `clear()` runs under a 2s per-step budget in before-quit, while a single
 *     graceful `killChild` can take up to 3s (POSIX SIGTERM grace) / 5s (Windows
 *     taskkill). A slow or SIGTERM-ignoring engine child can therefore be left
 *     mid-kill when the budget elapses, orphaning `wayland-core` past the app.
 *   - a child spawned outside a tracked manager would never be reaped at all.
 *
 * This registry backs a hard, fast last-resort reaper (`killAllAgentChildren`)
 * wired as the final before-quit step. It runs AFTER the graceful path, so in
 * the common case there is nothing left to kill; it only force-kills stragglers.
 */
import type { ChildProcess } from 'node:child_process';
import { killChild } from '@process/agent/acp/utils';

// Maps each live child to whether it was spawned detached (its own process
// group), so the reaper can group-kill it exactly like the graceful path.
const liveAgentChildren = new Map<ChildProcess, boolean>();

/**
 * Track a freshly spawned engine child so the before-quit reaper can force-kill
 * it if the graceful per-agent teardown does not reach it in time. The child is
 * removed automatically on its own `exit`, so a child that dies normally (or via
 * the graceful `killChild`) leaves the registry without any extra bookkeeping.
 *
 * @param isDetached whether the child was spawned with `detached: true` (needs a
 *   process-group kill), mirroring what the owning manager passes to `killChild`.
 */
export function trackAgentChild(child: ChildProcess | null | undefined, isDetached = false): void {
  if (!child) return;
  liveAgentChildren.set(child, isDetached);
  // Auto-remove when the child is gone. Listen on all three terminal events, not
  // just `exit`: a spawn failure (ENOENT etc.) emits `error` and NO `exit`, so
  // relying on `exit` alone would leak that child in the registry for the whole
  // session. `delete` is idempotent, so whichever fires first wins.
  const drop = () => liveAgentChildren.delete(child);
  child.once('exit', drop);
  child.once('error', drop);
  child.once('close', drop);
}

/** Number of engine children currently tracked (test/introspection helper). */
export function liveAgentChildCount(): number {
  return liveAgentChildren.size;
}

/**
 * Force-kill every still-live engine child. Called from before-quit as a final
 * safety net. Uses a short SIGTERM grace before SIGKILL escalation (POSIX) /
 * `taskkill /T /F` (Windows) via the shared {@link killChild}, since the app is
 * exiting and we cannot afford the full graceful wait. Best-effort: killing an
 * already-dead pid is a no-op, so overlap with the graceful path is harmless.
 */
export async function killAllAgentChildren(sigtermGraceMs = 500): Promise<void> {
  const children = [...liveAgentChildren.entries()];
  liveAgentChildren.clear();
  if (children.length === 0) return;
  await Promise.allSettled(children.map(([child, isDetached]) => killChild(child, isDetached, sigtermGraceMs)));
}
