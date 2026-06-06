/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Confinement coverage for the shell.openPath IPC provider (RT-R4-02).
 *
 * openPath previously expanded `~` and lexically blocked `..` but used
 * `path.resolve` alone, which neither collapses pre-existing symlinks nor
 * restricts the target to the app's authorized roots. A symlinked app dir
 * (e.g. `~/.config -> /etc`) could therefore redirect the OS file manager to a
 * sensitive location. The provider now routes the (tilde-expanded) path through
 * `confinePath`, which realpath-collapses the existing prefix and fails closed
 * on anything that escapes every authorized root.
 *
 * Strategy: mirror the existing shellBridge tests - mock `@/common`,
 * `electron`, `child_process`, and `fs` providers, plus `./pathConfinement` so
 * `confinePath` returns the realpath-collapsed in-root path for a legit target
 * and `null` for an escape.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { openPathProvider, shellMock, confinePathMock } = vi.hoisted(() => ({
  openPathProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  shellMock: {
    openPath: vi.fn().mockResolvedValue(''),
    showItemInFolder: vi.fn(),
    openExternal: vi.fn().mockResolvedValue(undefined),
  },
  confinePathMock: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    shell: {
      openFile: { provider: vi.fn() },
      showItemInFolder: { provider: vi.fn() },
      openExternal: { provider: vi.fn() },
      checkToolInstalled: { provider: vi.fn() },
      openFolderWith: { provider: vi.fn() },
      openPath: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          openPathProvider.fn = fn;
        }),
      },
    },
  },
}));

vi.mock('electron', () => ({ shell: shellMock }));

vi.mock('child_process', () => ({
  exec: vi.fn(),
  spawn: vi.fn().mockReturnValue({ on: vi.fn(), unref: vi.fn() }),
}));

vi.mock('fs', () => ({ existsSync: vi.fn(), statSync: vi.fn(() => ({ isDirectory: () => true })) }));

vi.mock('../../src/process/bridge/pathConfinement', () => ({
  confinePath: confinePathMock,
}));

let initShellBridge: typeof import('../../src/process/bridge/shellBridge').initShellBridge;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  openPathProvider.fn = undefined;
  shellMock.openPath.mockResolvedValue('');
  const mod = await import('../../src/process/bridge/shellBridge');
  initShellBridge = mod.initShellBridge;
  initShellBridge();
});

describe('shellBridge.openPath - confinement (RT-R4-02)', () => {
  it('opens a legitimate in-root path (confinePath returns resolved form)', async () => {
    confinePathMock.mockResolvedValue('/Users/me/Documents/Wayland-Memory-Drop');

    const result = await openPathProvider.fn!({ path: '/Users/me/Documents/Wayland-Memory-Drop' });

    expect(result).toEqual({ ok: true });
    expect(confinePathMock).toHaveBeenCalledWith('/Users/me/Documents/Wayland-Memory-Drop');
    // The OS handler is invoked on the confined (resolved) path, never the raw input.
    expect(shellMock.openPath).toHaveBeenCalledWith('/Users/me/Documents/Wayland-Memory-Drop');
  });

  it('rejects a symlink-escape path and never calls shell.openPath', async () => {
    // confinePath collapses `~/.config -> /etc` to /etc/passwd, which escapes
    // every authorized root, so it fails closed and returns null.
    confinePathMock.mockResolvedValue(null);

    const result = await openPathProvider.fn!({ path: '~/.config/passwd' });

    expect(result).toEqual({ ok: false, error: 'path not allowed' });
    expect(shellMock.openPath).not.toHaveBeenCalled();
  });

  it('rejects a traversal path (delegated to confinePath) without opening', async () => {
    confinePathMock.mockResolvedValue(null);

    const result = await openPathProvider.fn!({ path: '/Users/me/Documents/../../etc/passwd' });

    expect(result).toEqual({ ok: false, error: 'path not allowed' });
    expect(shellMock.openPath).not.toHaveBeenCalled();
  });

  it('expands a leading ~ before confinement', async () => {
    confinePathMock.mockResolvedValue(null);

    await openPathProvider.fn!({ path: '~/Documents/Wayland-Memory-Drop' });

    // The argument handed to confinePath must be tilde-expanded, not the raw `~`.
    const arg = confinePathMock.mock.calls[0]?.[0] as string;
    expect(arg.startsWith('~')).toBe(false);
    expect(arg.endsWith('/Documents/Wayland-Memory-Drop')).toBe(true);
  });

  it('rejects an empty path before reaching confinePath', async () => {
    const result = await openPathProvider.fn!({ path: '' });

    expect(result).toEqual({ ok: false, error: 'empty path' });
    expect(confinePathMock).not.toHaveBeenCalled();
    expect(shellMock.openPath).not.toHaveBeenCalled();
  });
});
