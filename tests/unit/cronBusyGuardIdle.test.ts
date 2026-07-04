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
    it('fires immediately when already idle', () => {
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('fires only when the LAST processing conversation clears', () => {
      guard.setProcessing('a', true);
      guard.setProcessing('b', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      expect(cb).not.toHaveBeenCalled();

      guard.setProcessing('a', false);
      expect(cb).not.toHaveBeenCalled(); // b still busy

      guard.setProcessing('b', false);
      expect(cb).toHaveBeenCalledTimes(1); // now fully idle
    });

    it('is one-shot: does not re-fire on the next busy→idle cycle', () => {
      guard.setProcessing('a', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      guard.setProcessing('a', false);
      expect(cb).toHaveBeenCalledTimes(1);

      // A fresh busy→idle cycle must NOT re-invoke the consumed callback.
      guard.setProcessing('a', true);
      guard.setProcessing('a', false);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('fires all registered callbacks when idle is reached', () => {
      guard.setProcessing('a', true);
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      guard.onceAllIdle(cb1);
      guard.onceAllIdle(cb2);
      guard.setProcessing('a', false);
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('does not fire on a non-final clear (race guard)', () => {
      // Two busy conversations; registering, then clearing only one, must not
      // fire — this is the busy→idle race the gate relies on being closed.
      guard.setProcessing('chat', true);
      guard.setProcessing('cron', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      guard.setProcessing('chat', false);
      expect(cb).not.toHaveBeenCalled();
      guard.setProcessing('cron', false);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('clear() drops pending global-idle callbacks', () => {
      guard.setProcessing('a', true);
      const cb = vi.fn();
      guard.onceAllIdle(cb);
      guard.clear();
      // After clear the guard is idle and the pending callback is dropped; a new
      // busy→idle cycle must not invoke it.
      guard.setProcessing('a', true);
      guard.setProcessing('a', false);
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
