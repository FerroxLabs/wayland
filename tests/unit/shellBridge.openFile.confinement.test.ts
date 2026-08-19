/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Confinement coverage for the shell.openFile / shell.showItemInFolder IPC
 * providers (RT-R4-02).
 *
 * Both providers handed the renderer-supplied path straight to the OS while
 * `shell.openPath` next to them was already routed through `confinePath`. The
 * bridge allowlist validates the IPC *event name* only, never the arguments, so
 * a renderer-context XSS could drive the OS into opening any path the user can
 * reach. Both now expand a leading `~`, route the result through `confinePath`
 * (realpath-collapsing the existing prefix, failing closed outside the
 * authorized roots) and act on the confined value, never the raw input.
 *
 * Mirrors shellBridge.openPath.confinement.test.ts.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { openFileProvider, showItemProvider, shellMock, confinePathMock } = vi.hoisted(() => ({
  openFileProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  showItemProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
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
      openFile: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          openFileProvider.fn = fn;
        }),
      },
      showItemInFolder: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          showItemProvider.fn = fn;
        }),
      },
      openExternal: { provider: vi.fn() },
      checkToolInstalled: { provider: vi.fn() },
      openFolderWith: { provider: vi.fn() },
      openPath: { provider: vi.fn() },
    },
  },
}));

vi.mock('electron', () => ({ shell: shellMock }));

vi.mock('child_process', () => ({
  exec: vi.fn(),
  spawn: vi.fn().mockReturnValue({ on: vi.fn(), unref: vi.fn() }),
}));

vi.mock('fs', () => ({ existsSync: vi.fn(), statSync: vi.fn(() => ({ isDirectory: () => true })) }));

// The open providers now also type-gate the CONFINED path before handing it to
// an OS launcher (an agent-written `.command`/`.desktop`/`.exe`/`.app` inside an
// authorized root would otherwise be EXECUTED). These fixtures use fictitious
// paths, so a permissive mock keeps them focused on the opener; the gate itself
// is covered by tests/unit/shellBridge.openTargetSafety.test.ts.
vi.mock('../../src/process/bridge/shellOpenSafety', () => ({
  refuseUnsafeOpenTarget: async () => null,
  registerAppProducedOpenTarget: () => {},
}));

vi.mock('../../src/process/bridge/pathConfinement', () => ({
  confinePath: confinePathMock,
}));

const ORIGINAL_PLATFORM = process.platform;

const setPlatform = (value: NodeJS.Platform): void => {
  Object.defineProperty(process, 'platform', { value, configurable: true });
};

const loadBridge = async (): Promise<void> => {
  vi.resetModules();
  const mod = await import('../../src/process/bridge/shellBridge');
  mod.initShellBridge();
};

beforeEach(async () => {
  vi.clearAllMocks();
  setPlatform(ORIGINAL_PLATFORM);
  openFileProvider.fn = undefined;
  showItemProvider.fn = undefined;
  shellMock.openPath.mockResolvedValue('');
  await loadBridge();
});

describe('shellBridge.openFile - confinement (RT-R4-02)', () => {
  it('opens the confined path, not the raw input', async () => {
    confinePathMock.mockResolvedValue('/Users/me/Documents/report.pdf');

    const result = await openFileProvider.fn!('/Users/me/Documents/./report.pdf');

    expect(result).toEqual({ ok: true });
    expect(confinePathMock).toHaveBeenCalledWith('/Users/me/Documents/./report.pdf');
    expect(shellMock.openPath).toHaveBeenCalledWith('/Users/me/Documents/report.pdf');
  });

  it('fails closed when confinePath rejects and never touches the OS', async () => {
    confinePathMock.mockResolvedValue(null);

    const result = await openFileProvider.fn!('/etc/passwd');

    expect(result).toEqual({ ok: false, error: 'path not allowed' });
    expect(shellMock.openPath).not.toHaveBeenCalled();
  });

  it('expands a leading ~ before confinement', async () => {
    confinePathMock.mockResolvedValue(null);

    await openFileProvider.fn!('~/Downloads/Wayland.dmg');

    const arg = confinePathMock.mock.calls[0]?.[0] as string;
    expect(arg.startsWith('~')).toBe(false);
    expect(arg.endsWith('/Downloads/Wayland.dmg')).toBe(true);
  });

  it('rejects an empty path and a non-string before reaching confinePath', async () => {
    expect(await openFileProvider.fn!('')).toEqual({ ok: false, error: 'empty path' });
    expect(await openFileProvider.fn!(undefined)).toEqual({ ok: false, error: 'empty path' });
    expect(confinePathMock).not.toHaveBeenCalled();
    expect(shellMock.openPath).not.toHaveBeenCalled();
  });
});

describe('shellBridge.showItemInFolder - confinement (RT-R4-02)', () => {
  it('reveals the confined path, not the raw input', async () => {
    setPlatform('darwin');
    await loadBridge();
    confinePathMock.mockResolvedValue('/Users/me/Documents/report.pdf');

    const result = await showItemProvider.fn!('/Users/me/Documents/./report.pdf');

    expect(result).toEqual({ ok: true });
    expect(confinePathMock).toHaveBeenCalledWith('/Users/me/Documents/./report.pdf');
    expect(shellMock.showItemInFolder).toHaveBeenCalledWith('/Users/me/Documents/report.pdf');
  });

  it('fails closed when confinePath rejects and never reveals', async () => {
    setPlatform('darwin');
    await loadBridge();
    confinePathMock.mockResolvedValue(null);

    const result = await showItemProvider.fn!('/etc/passwd');

    expect(result).toEqual({ ok: false, error: 'path not allowed' });
    expect(shellMock.showItemInFolder).not.toHaveBeenCalled();
  });

  it('expands a leading ~ before confinement', async () => {
    setPlatform('darwin');
    await loadBridge();
    confinePathMock.mockResolvedValue(null);

    await showItemProvider.fn!('~/Downloads/Wayland.dmg');

    const arg = confinePathMock.mock.calls[0]?.[0] as string;
    expect(arg.startsWith('~')).toBe(false);
    expect(arg.endsWith('/Downloads/Wayland.dmg')).toBe(true);
  });

  it('rejects an empty path and a non-string before reaching confinePath', async () => {
    setPlatform('darwin');
    await loadBridge();

    expect(await showItemProvider.fn!('')).toEqual({ ok: false, error: 'empty path' });
    expect(await showItemProvider.fn!(undefined)).toEqual({ ok: false, error: 'empty path' });
    expect(confinePathMock).not.toHaveBeenCalled();
    expect(shellMock.showItemInFolder).not.toHaveBeenCalled();
  });

  it('on Linux opens the parent of the CONFINED path', async () => {
    setPlatform('linux');
    await loadBridge();
    confinePathMock.mockResolvedValue('/Users/me/Documents/report.pdf');

    const result = await showItemProvider.fn!('/Users/me/Documents/./report.pdf');

    expect(result).toEqual({ ok: true });
    expect(shellMock.openPath).toHaveBeenCalledWith('/Users/me/Documents');
  });
});
