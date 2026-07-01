/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runWaylandUpdaterExtensionCheck } from '@/renderer/pages/settings/utils/waylandUpdaterBridge';
import { autoUpdate as autoUpdateIpc, update as updateIpc } from '@/common/adapter/ipcBridge';

vi.mock('@/common/adapter/ipcBridge', () => ({
  autoUpdate: {
    check: { invoke: vi.fn() },
  },
  update: {
    check: { invoke: vi.fn() },
  },
}));

describe('waylandUpdaterBridge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns the manual updater result when Electron auto-update check times out', async () => {
    vi.mocked(autoUpdateIpc.check.invoke).mockReturnValue(new Promise(() => {}));
    vi.mocked(updateIpc.check.invoke).mockResolvedValue({
      success: true,
      data: {
        currentVersion: '0.11.9',
        latest: { version: '0.11.9' },
        updateAvailable: false,
      },
    } as Awaited<ReturnType<typeof updateIpc.check.invoke>>);

    const resultPromise = runWaylandUpdaterExtensionCheck(false, '[test]');
    await vi.advanceTimersByTimeAsync(6000);

    await expect(resultPromise).resolves.toMatchObject({
      ok: true,
      autoUpdateAvailable: false,
      manual: { success: true },
    });
    expect(updateIpc.check.invoke).toHaveBeenCalledWith({ includePrerelease: false });
  });

  it('includes Electron auto-update info when it resolves before the timeout', async () => {
    vi.mocked(autoUpdateIpc.check.invoke).mockResolvedValue({
      success: true,
      data: { updateInfo: { version: '0.12.0' } },
    } as Awaited<ReturnType<typeof autoUpdateIpc.check.invoke>>);
    vi.mocked(updateIpc.check.invoke).mockResolvedValue({
      success: true,
      data: {
        currentVersion: '0.11.9',
        latest: { version: '0.12.0' },
        updateAvailable: true,
      },
    } as Awaited<ReturnType<typeof updateIpc.check.invoke>>);

    await expect(runWaylandUpdaterExtensionCheck(true, '[test]')).resolves.toMatchObject({
      ok: true,
      autoUpdateAvailable: true,
      autoVersion: '0.12.0',
      manual: { success: true },
    });
  });
});
