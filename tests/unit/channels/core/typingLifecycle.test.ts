/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTypingKeepaliveLoop } from '@process/channels/core/typing-lifecycle';

describe('createTypingKeepaliveLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not start when intervalMs is zero or negative', () => {
    const onTick = vi.fn();
    const loop = createTypingKeepaliveLoop({ intervalMs: 0, onTick });
    loop.start();
    expect(loop.isRunning()).toBe(false);

    const loopNeg = createTypingKeepaliveLoop({ intervalMs: -100, onTick });
    loopNeg.start();
    expect(loopNeg.isRunning()).toBe(false);
  });

  it('fires onTick on each interval after start', async () => {
    const onTick = vi.fn().mockResolvedValue(undefined);
    const loop = createTypingKeepaliveLoop({ intervalMs: 1000, onTick });

    loop.start();
    expect(loop.isRunning()).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onTick).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onTick).toHaveBeenCalledTimes(2);
  });

  it('is idempotent - calling start twice does not double-schedule', async () => {
    const onTick = vi.fn().mockResolvedValue(undefined);
    const loop = createTypingKeepaliveLoop({ intervalMs: 500, onTick });

    loop.start();
    loop.start();

    await vi.advanceTimersByTimeAsync(500);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('stops firing after stop() and is safe to stop again', async () => {
    const onTick = vi.fn().mockResolvedValue(undefined);
    const loop = createTypingKeepaliveLoop({ intervalMs: 500, onTick });

    loop.start();
    await vi.advanceTimersByTimeAsync(500);
    expect(onTick).toHaveBeenCalledTimes(1);

    loop.stop();
    expect(loop.isRunning()).toBe(false);

    await vi.advanceTimersByTimeAsync(5000);
    expect(onTick).toHaveBeenCalledTimes(1);

    // Second stop should be a no-op
    expect(() => loop.stop()).not.toThrow();
  });

  it('serializes overlapping ticks - long-running tick is not re-entered', async () => {
    let resolveCurrent: (() => void) | null = null;
    const onTick = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCurrent = resolve;
        })
    );
    const loop = createTypingKeepaliveLoop({ intervalMs: 100, onTick });

    loop.start();

    // First tick fires and stays in-flight
    await vi.advanceTimersByTimeAsync(100);
    expect(onTick).toHaveBeenCalledTimes(1);

    // Subsequent intervals fire but get short-circuited because tickInFlight=true
    await vi.advanceTimersByTimeAsync(300);
    expect(onTick).toHaveBeenCalledTimes(1);

    // Resolve the first tick and let microtasks drain
    resolveCurrent?.();
    await Promise.resolve();
    await Promise.resolve();

    // Next interval fires a fresh tick
    await vi.advanceTimersByTimeAsync(100);
    expect(onTick).toHaveBeenCalledTimes(2);

    loop.stop();
  });

  it('manual tick() respects the in-flight guard', async () => {
    let resolveCurrent: (() => void) | null = null;
    const onTick = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCurrent = resolve;
        })
    );
    const loop = createTypingKeepaliveLoop({ intervalMs: 1000, onTick });

    void loop.tick();
    void loop.tick();
    void loop.tick();

    await Promise.resolve();
    expect(onTick).toHaveBeenCalledTimes(1);

    resolveCurrent?.();
  });

  it('supports synchronous onTick callbacks', async () => {
    const onTick = vi.fn();
    const loop = createTypingKeepaliveLoop({ intervalMs: 200, onTick });

    loop.start();
    await vi.advanceTimersByTimeAsync(200);
    expect(onTick).toHaveBeenCalledTimes(1);

    loop.stop();
  });
});
