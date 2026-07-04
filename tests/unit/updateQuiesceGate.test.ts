/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Controllable config value for update.deferWhileBusy.
let deferSetting: boolean | undefined;
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async (key: string) => (key === 'update.deferWhileBusy' ? deferSetting : undefined)),
    set: vi.fn(async () => {}),
  },
}));

vi.mock('electron-log', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { cronBusyGuard } from '@/process/services/cron/CronBusyGuard';
import {
  installOrDefer,
  isAppBusy,
  isDeferWhileBusyEnabled,
  __resetForTest,
} from '@/process/services/updateQuiesceGate';

// A deferred install fires on the next macrotask after the app goes idle (#651).
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('updateQuiesceGate (#651)', () => {
  beforeEach(() => {
    deferSetting = undefined; // default → true
    cronBusyGuard.clear();
    __resetForTest();
    vi.clearAllMocks();
  });

  describe('isDeferWhileBusyEnabled', () => {
    it('defaults to true when unset', async () => {
      deferSetting = undefined;
      expect(await isDeferWhileBusyEnabled()).toBe(true);
    });
    it('honours an explicit false', async () => {
      deferSetting = false;
      expect(await isDeferWhileBusyEnabled()).toBe(false);
    });
  });

  describe('installOrDefer', () => {
    it('installs immediately when the app is idle', async () => {
      const install = vi.fn();
      const onDeferred = vi.fn();
      const result = await installOrDefer(install, onDeferred);
      expect(result).toBe('installing');
      expect(install).toHaveBeenCalledTimes(1);
      expect(onDeferred).not.toHaveBeenCalled();
    });

    it('defers when busy, then installs exactly once on idle (the core fix)', async () => {
      cronBusyGuard.setProcessing('chat', true);
      expect(isAppBusy()).toBe(true);

      const install = vi.fn();
      const onDeferred = vi.fn();
      const result = await installOrDefer(install, onDeferred);

      expect(result).toBe('deferred');
      expect(onDeferred).toHaveBeenCalledTimes(1);
      expect(install).not.toHaveBeenCalled(); // work is NOT killed

      // Work finishes → the deferred install fires (on the next tick, so turn
      // finalization / follow-up work can complete first).
      cronBusyGuard.setProcessing('chat', false);
      expect(install).not.toHaveBeenCalled(); // not synchronous
      await flush();
      expect(install).toHaveBeenCalledTimes(1);
    });

    it('installs immediately when defer-while-busy is disabled, even if busy (criterion 7)', async () => {
      deferSetting = false;
      cronBusyGuard.setProcessing('chat', true);
      const install = vi.fn();
      const result = await installOrDefer(install);
      expect(result).toBe('installing');
      expect(install).toHaveBeenCalledTimes(1);
    });

    it('does not double-register on repeated Install clicks while busy', async () => {
      cronBusyGuard.setProcessing('chat', true);
      const install = vi.fn();
      const onDeferred = vi.fn();

      await installOrDefer(install, onDeferred);
      await installOrDefer(install, onDeferred); // second click while still busy
      expect(onDeferred).toHaveBeenCalledTimes(2); // UX re-surfaced each click

      cronBusyGuard.setProcessing('chat', false);
      await flush();
      expect(install).toHaveBeenCalledTimes(1); // but only ONE install fires
    });

    it('waits for the LAST busy conversation before installing', async () => {
      cronBusyGuard.setProcessing('chat', true);
      cronBusyGuard.setProcessing('cron', true);
      const install = vi.fn();
      await installOrDefer(install);

      cronBusyGuard.setProcessing('chat', false);
      await flush();
      expect(install).not.toHaveBeenCalled(); // cron still running
      cronBusyGuard.setProcessing('cron', false);
      await flush();
      expect(install).toHaveBeenCalledTimes(1);
    });
  });
});
