/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CronBusyGuard } from '@/process/services/cron/CronBusyGuard';

// The global-idle aggregator that backs update-on-quiesce (#651/#632): one
// registry answers "is anything working right now" across chat + cron + team,
// and onceAllIdle fires when the LAST processing conversation clears.
// Global-idle callbacks fire on the NEXT macrotask (setImmediate) so a caller
// that marks idle mid-teardown can finish first (#651). Flush to observe them.
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('CronBusyGuard — isAppBusy / onceAllIdle (#651)', () => {
  let guard: CronBusyGuard;

  beforeEach(() => {
    guard = new CronBusyGuard();
  });

  describe('isAppBusy', () => {
    it('is false with no conversations', () => {
      expect(guard.isAppBusy()).toBe(false);
    });

    it('is true while any conversation is processing, false once all clear', () => {
      guard.setProcessing('a', true);
      expect(guard.isAppBusy()).toBe(true);
      guard.setProcessing('b', true);
      expect(guard.isAppBusy()).toBe(true);

      guard.setProcessing('a', false);
      expect(guard.isAppBusy()).toBe(true); // b still busy
      guard.setProcessing('b', false);
      expect(guard.isAppBusy()).toBe(false);
    });
  });

  describe('onceAllIdle', () => {
    it('fires immediately when already idle (synchronous)', () => {
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('fires (on the next tick) only when the LAST processing conversation clears', async () => {
      guard.setProcessing('a', true);
      guard.setProcessing('b', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      expect(cb).not.toHaveBeenCalled();

      guard.setProcessing('a', false);
      await flush();
      expect(cb).not.toHaveBeenCalled(); // b still busy

      guard.setProcessing('b', false);
      await flush();
      expect(cb).toHaveBeenCalledTimes(1); // now fully idle
    });

    it('does not fire synchronously — lets the caller finish its teardown first', () => {
      guard.setProcessing('a', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      guard.setProcessing('a', false);
      // Still not called on the same tick (the whole point: turn finalization,
      // cron writes, and follow-up turns run before a deferred install commits).
      expect(cb).not.toHaveBeenCalled();
    });

    it('re-arms instead of firing if work resumed before the next tick', async () => {
      guard.setProcessing('a', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      guard.setProcessing('a', false); // schedules the fire
      guard.setProcessing('a', true); // a follow-up turn re-asserts busy before the tick
      await flush();
      expect(cb).not.toHaveBeenCalled(); // re-armed, not fired
      guard.setProcessing('a', false); // truly idle now
      await flush();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('is one-shot: does not re-fire on the next busy→idle cycle', async () => {
      guard.setProcessing('a', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      guard.setProcessing('a', false);
      await flush();
      expect(cb).toHaveBeenCalledTimes(1);

      // A fresh busy→idle cycle must NOT re-invoke the consumed callback.
      guard.setProcessing('a', true);
      guard.setProcessing('a', false);
      await flush();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('fires all registered callbacks when idle is reached', async () => {
      guard.setProcessing('a', true);
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      guard.onceAllIdle(cb1);
      guard.onceAllIdle(cb2);
      guard.setProcessing('a', false);
      await flush();
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('does not fire on a non-final clear (race guard)', async () => {
      // Two busy conversations; registering, then clearing only one, must not
      // fire — this is the busy→idle race the gate relies on being closed.
      guard.setProcessing('chat', true);
      guard.setProcessing('cron', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      guard.setProcessing('chat', false);
      await flush();
      expect(cb).not.toHaveBeenCalled();
      guard.setProcessing('cron', false);
      await flush();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('clear() drops pending global-idle callbacks', async () => {
      guard.setProcessing('a', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      guard.clear();
      // After clear the guard is idle and the pending callback is dropped; a new
      // busy→idle cycle must not invoke it.
      guard.setProcessing('a', true);
      guard.setProcessing('a', false);
      await flush();
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
