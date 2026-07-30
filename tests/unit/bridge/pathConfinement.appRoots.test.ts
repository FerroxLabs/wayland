/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The app writes to two directories that can sit outside every other authorized
 * root and then asks the OS to open them on a user click:
 *  - the log dir (macOS: `~/Library/Logs/<app>`, not under userData) - Settings'
 *    "open log directory" button;
 *  - the OS/XDG downloads dir - the update modal's "Open" button after the
 *    updater writes its installer there.
 *
 * Confining `shell.openFile` without registering these roots breaks both
 * shipped buttons, so they are covered here.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  logsDir: '/Users/me/Library/Logs/Wayland',
  downloadsDir: '/Volumes/Data/Downloads',
}));

vi.mock('@process/utils', () => ({
  getConfigPath: () => '/Users/me/Library/Application Support/Wayland/config',
  getDataPath: () => '/Users/me/Library/Application Support/Wayland',
  getTempPath: () => '/tmp/wayland',
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => {
    throw new Error('no db in this test');
  }),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      getLogsDir: () => h.logsDir,
      getSystemPath: (name: string) => (name === 'downloads' ? h.downloadsDir : null),
    },
  }),
}));

const loadConfinePath = async () => {
  vi.resetModules();
  const mod = await import('../../../src/process/bridge/pathConfinement');
  return mod.confinePath;
};

describe('pathConfinement - app-owned open targets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authorizes the app log directory', async () => {
    const confinePath = await loadConfinePath();

    await expect(confinePath(`${h.logsDir}/main.log`)).resolves.toBe(`${h.logsDir}/main.log`);
  });

  it('authorizes the OS downloads directory even when it is not ~/Downloads', async () => {
    const confinePath = await loadConfinePath();

    await expect(confinePath(`${h.downloadsDir}/Wayland-1.2.3.dmg`)).resolves.toBe(
      `${h.downloadsDir}/Wayland-1.2.3.dmg`
    );
  });

  it('still rejects an unrelated location', async () => {
    const confinePath = await loadConfinePath();

    await expect(confinePath('/Users/me/Library/Keychains/login.keychain-db')).resolves.toBeNull();
  });

  it('tolerates platform services being unavailable', async () => {
    vi.doMock('@/common/platform', () => ({
      getPlatformServices: () => {
        throw new Error('not registered');
      },
    }));
    const confinePath = await loadConfinePath();

    // The remaining static roots still apply; the log dir simply is not one.
    const inConfigRoot = '/Users/me/Library/Application Support/Wayland/config/settings.json';
    await expect(confinePath(inConfigRoot)).resolves.toBe(inConfigRoot);
    await expect(confinePath(`${h.logsDir}/main.log`)).resolves.toBeNull();
    vi.doUnmock('@/common/platform');
  });
});
