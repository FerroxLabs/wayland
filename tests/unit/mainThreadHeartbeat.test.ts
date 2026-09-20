/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The heartbeat exists to date a main-thread block that the packaged smoke can
 * otherwise only report as "CDP command timed out". A blocked JS thread cannot
 * fire its own timer, so a late tick IS the measurement.
 */

import { describe, it, expect } from 'vitest';
import { startMainThreadHeartbeat, HEARTBEAT_PERIOD_MS } from '@process/utils/mainThreadHeartbeat';

/** Drives the interval by hand so a "stall" is just a jump in the clock. */
function harness(env: NodeJS.ProcessEnv) {
  const logs: string[] = [];
  const warns: string[] = [];
  let tick: (() => void) | null = null;
  let clock = 0;
  const stop = startMainThreadHeartbeat({
    env,
    now: () => clock,
    log: (line) => logs.push(line),
    warn: (line) => warns.push(line),
    setInterval: ((fn: () => void) => {
      tick = fn;
      return { unref: () => undefined } as unknown as NodeJS.Timeout;
    }) as unknown as typeof setInterval,
  });
  return {
    logs,
    warns,
    stop,
    advance(ms: number) {
      clock += ms;
      tick?.();
    },
  };
}

describe('main-thread heartbeat', () => {
  it('does not run outside the packaged smoke', () => {
    const quiet = harness({});
    expect(quiet.stop).toBeNull();
    quiet.advance(HEARTBEAT_PERIOD_MS);
    expect(quiet.logs).toEqual([]);
    expect(quiet.warns).toEqual([]);
  });

  it('reports every tick so the last one before silence dates the block', () => {
    const h = harness({ WAYLAND_PACKAGE_SMOKE_MARKER: 'a'.repeat(64) });
    h.advance(HEARTBEAT_PERIOD_MS);
    h.advance(HEARTBEAT_PERIOD_MS);

    expect(h.warns).toEqual([]);
    expect(h.logs).toEqual(['[Wayland:heartbeat] +2000ms', '[Wayland:heartbeat] +4000ms']);
  });

  it('names a stall the event loop actually suffered, with its duration', () => {
    const h = harness({ WAYLAND_PACKAGE_SMOKE_MARKER: 'a'.repeat(64) });
    h.advance(HEARTBEAT_PERIOD_MS);
    // The event loop was blocked: the next tick lands 30s late, not 2s.
    h.advance(32_000);

    expect(h.logs).toEqual(['[Wayland:heartbeat] +2000ms']);
    expect(h.warns).toHaveLength(1);
    expect(h.warns[0]).toContain('STALLED');
    expect(h.warns[0]).toContain('blocked ~30000ms');
    expect(h.warns[0]).toContain('+34000ms');
  });

  it('does not cry stall over ordinary timer jitter', () => {
    const h = harness({ WAYLAND_PACKAGE_SMOKE_MARKER: 'a'.repeat(64) });
    h.advance(HEARTBEAT_PERIOD_MS + 150);

    expect(h.warns).toEqual([]);
    expect(h.logs).toHaveLength(1);
  });
});
