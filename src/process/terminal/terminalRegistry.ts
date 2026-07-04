/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Terminal mode — live-PTY registry (no-orphan guarantee).
 *
 * A dedicated registry for terminal PTYs, deliberately separate from
 * `agentChildRegistry` (which is typed `Map<ChildProcess, boolean>` and reaps
 * `--json-stream` engine children): a node-pty `IPty` is NOT a `ChildProcess`,
 * so shoehorning it there would mean fighting the type. This registry tracks
 * each live PTY by its terminal id, kills one on tab/chat close, and force-reaps
 * every survivor from the app's before-quit sequence so a dropped image of a PTY
 * never orphans past the app (acceptance §8.5).
 */
import type { IPty } from '@lydell/node-pty';

type TrackedPty = { pty: IPty; pid: number };

const livePtys = new Map<string, TrackedPty>();

/** Force-kill a pid; injectable so tests never signal a real process. */
export type PtyForceKill = (pid: number) => void;

const defaultForceKill: PtyForceKill = (pid) => {
  try {
    // `signal 0` throws ESRCH when the pid is already gone, so the SIGKILL below
    // only runs for a PTY that ignored the graceful kill.
    process.kill(pid, 0);
    process.kill(pid, 'SIGKILL');
  } catch {
    /* already dead, or not permitted — nothing more we can do */
  }
};

/**
 * Track a freshly spawned PTY. If a different PTY was already registered under
 * this id (an id-collision race), kill it first so it cannot orphan untracked.
 */
export function registerPty(terminalId: string, pty: IPty): void {
  const existing = livePtys.get(terminalId);
  if (existing && existing.pty !== pty) {
    try {
      existing.pty.kill();
    } catch {
      /* already exited */
    }
  }
  livePtys.set(terminalId, { pty, pid: pty.pid });
}

/** True iff a live PTY is registered for this terminal id. */
export function hasPty(terminalId: string): boolean {
  return livePtys.has(terminalId);
}

/** The live PTY for this id, if any (used by input/resize handlers). */
export function getPty(terminalId: string): IPty | undefined {
  return livePtys.get(terminalId)?.pty;
}

/** Number of live PTYs — used to enforce the concurrency cap and in tests. */
export function livePtyCount(): number {
  return livePtys.size;
}

/**
 * Kill and deregister one PTY (tab close / chat close). Graceful `pty.kill()`
 * (SIGHUP) terminates an interactive agent CLI; idempotent if already gone.
 */
export function killPty(terminalId: string): void {
  const tracked = livePtys.get(terminalId);
  if (!tracked) return;
  livePtys.delete(terminalId);
  try {
    tracked.pty.kill();
  } catch {
    /* already exited */
  }
}

/**
 * Drop a PTY's bookkeeping WITHOUT killing it — called from a PTY's own `onExit`
 * so a process that exits on its own (user typed `exit`, agent quit) leaves the
 * registry cleanly.
 */
export function forgetPty(terminalId: string): void {
  livePtys.delete(terminalId);
}

/**
 * Force-kill every live PTY. Wired as a before-quit reaper AFTER the graceful
 * teardown, so in the common case there is nothing left; it force-kills any
 * straggler (SIGHUP via `pty.kill()`, then a pid SIGKILL fallback) so no PTY
 * orphans past the app.
 */
export function killAllPtys(forceKill: PtyForceKill = defaultForceKill): void {
  const all = [...livePtys.values()];
  livePtys.clear();
  for (const tracked of all) {
    try {
      tracked.pty.kill();
    } catch {
      /* already exited */
    }
    forceKill(tracked.pid);
  }
}
