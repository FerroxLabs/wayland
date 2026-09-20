/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Main-thread watchdog for the packaged smoke, and ONLY for it.
 *
 * win32-arm64 failed the packaged smoke twelve times across v0.13.2 with the app
 * plainly booted. The readiness diagnostics established WHICH side hangs -
 * `Browser.getVersion` on the browser endpoint went unanswered while the DevTools
 * HTTP endpoint still served `/json/list`, so the main process's JS thread is
 * blocked, not the renderer - but not WHAT blocks it. Agent detection is already
 * excluded: it completes in ~12.3 s and the block outlives it.
 *
 * A blocked JS thread cannot fire its own timer, so the timer IS the probe. A
 * tick that arrives late by more than its own period measures a stall the event
 * loop actually suffered, and the last tick before silence dates the block to the
 * second - enough to name whatever logged immediately before it.
 *
 * Gated on WAYLAND_PACKAGE_SMOKE_MARKER, which only the packaged smoke sets, so
 * no shipped run pays for this.
 */

export const HEARTBEAT_PERIOD_MS = 2000;

export interface HeartbeatDeps {
  env?: NodeJS.ProcessEnv;
  now?: () => number;
  log?: (line: string) => void;
  warn?: (line: string) => void;
  setInterval?: typeof setInterval;
}

export function startMainThreadHeartbeat(deps: HeartbeatDeps = {}): (() => void) | null {
  const env = deps.env ?? process.env;
  if (!env.WAYLAND_PACKAGE_SMOKE_MARKER) return null;

  const now = deps.now ?? (() => performance.now());
  const log = deps.log ?? ((line: string) => console.log(line));
  const warn = deps.warn ?? ((line: string) => console.warn(line));
  const schedule = deps.setInterval ?? setInterval;

  const startedAt = now();
  let previous = startedAt;
  const timer = schedule(() => {
    const current = now();
    const drift = Math.round(current - previous - HEARTBEAT_PERIOD_MS);
    previous = current;
    const elapsed = Math.round(current - startedAt);
    // Report every tick so the LAST one before silence dates a block that never
    // ends, and shout on drift so a stall that recovers is not lost in the noise.
    if (drift > HEARTBEAT_PERIOD_MS) {
      warn(`[Wayland:heartbeat] +${elapsed}ms STALLED - event loop blocked ~${drift}ms`);
    } else {
      log(`[Wayland:heartbeat] +${elapsed}ms`);
    }
  }, HEARTBEAT_PERIOD_MS);

  // Never hold the process open on this alone.
  (timer as { unref?: () => void }).unref?.();
  return () => clearInterval(timer as NodeJS.Timeout);
}
