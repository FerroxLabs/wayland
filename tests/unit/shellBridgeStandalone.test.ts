/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks (vi.hoisted so factories can reference them) ---

const {
  openFileProvider,
  showItemInFolderProvider,
  openExternalProvider,
  execFileMock,
  existsSyncMock,
  confinePathMock,
  refuseUnsafeOpenTargetMock,
} = vi.hoisted(() => ({
  openFileProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  showItemInFolderProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  openExternalProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  execFileMock: vi.fn(),
  existsSyncMock: vi.fn(() => true),
  confinePathMock: vi.fn(async (p: string) => p),
  refuseUnsafeOpenTargetMock: vi.fn(async (_target: string) => null as { ok: false; error: string } | null),
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
          showItemInFolderProvider.fn = fn;
        }),
      },
      openExternal: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          openExternalProvider.fn = fn;
        }),
      },
    },
  },
}));

vi.mock('node:child_process', () => ({
  execFile: (...args: any[]) => execFileMock(...args),
}));

vi.mock('node:fs', () => ({
  existsSync: (...args: any[]) => existsSyncMock(...args),
}));

// openFile/showItemInFolder now route the path through confinePath (RT-R4-02).
// Default to identity so the pre-existing opener assertions below still exercise
// the opener; the confinement suite at the bottom drives the mock directly.
// The open providers also type-gate the CONFINED path before handing it to an OS
// launcher (an agent-written `.command`/`.desktop`/`.exe`/`.app` inside an
// authorized root would otherwise be EXECUTED). The default is permissive so the
// opener fixtures above stay focused on the opener - but it is a CONTROLLABLE
// mock, because a hard-coded `async () => null` made this file green with the
// gate deleted from `shellBridgeStandalone.ts` entirely. Mutation-proven: with
// `const refusal = await refuseUnsafeOpenTarget(...)` replaced by `null`, all 16
// tests still passed. `shellBridge.openTargetSafety.test.ts` covers the Electron
// bridge and the gate's own rules; nothing covered THIS transport, which is the
// one an authenticated remote WebUI client shares.
vi.mock('../../src/process/bridge/shellOpenSafety', () => ({
  refuseUnsafeOpenTarget: (...args: any[]) => refuseUnsafeOpenTargetMock(...(args as [string])),
  registerAppProducedOpenTarget: () => {},
}));

vi.mock('../../src/process/bridge/pathConfinement', () => ({
  confinePath: (...args: any[]) => confinePathMock(...args),
}));

// --- Tests ---

let initShellBridgeStandalone: typeof import('../../src/process/bridge/shellBridgeStandalone').initShellBridgeStandalone;

// The standalone bridge captures `const isWindows = process.platform === 'win32'`
// at module-load time, so the desired platform must be set BEFORE the dynamic
// import. Each test sets `process.platform` then calls this to load a fresh module
// instance bound to that platform.
async function loadStandaloneForPlatform(platform: NodeJS.Platform): Promise<void> {
  vi.resetModules();
  vi.clearAllMocks();
  openFileProvider.fn = undefined;
  showItemInFolderProvider.fn = undefined;
  openExternalProvider.fn = undefined;

  confinePathMock.mockImplementation(async (p: string) => p);
  refuseUnsafeOpenTargetMock.mockImplementation(async () => null);

  Object.defineProperty(process, 'platform', { value: platform, configurable: true });

  const mod = await import('../../src/process/bridge/shellBridgeStandalone');
  initShellBridgeStandalone = mod.initShellBridgeStandalone;
}

beforeEach(async () => {
  await loadStandaloneForPlatform('darwin');
});

describe('shellBridgeStandalone', () => {
  describe('initShellBridgeStandalone', () => {
    it('registers all three shell providers', () => {
      initShellBridgeStandalone();
      expect(openFileProvider.fn).toBeDefined();
      expect(showItemInFolderProvider.fn).toBeDefined();
      expect(openExternalProvider.fn).toBeDefined();
    });
  });

  describe('runOpen - darwin platform', () => {
    beforeEach(async () => {
      await loadStandaloneForPlatform('darwin');
      execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: null) => void) => cb(null));
      initShellBridgeStandalone();
    });

    it('openFile calls open with the file path', async () => {
      await openFileProvider.fn!('/path/to/file.pdf');
      expect(execFileMock).toHaveBeenCalledWith('open', ['/path/to/file.pdf'], expect.any(Function));
    });

    it('showItemInFolder calls open with the parent directory', async () => {
      await showItemInFolderProvider.fn!('/path/to/file.pdf');
      expect(execFileMock).toHaveBeenCalledWith('open', ['/path/to'], expect.any(Function));
    });

    it('openExternal calls open with the URL', async () => {
      await openExternalProvider.fn!('https://example.com');
      expect(execFileMock).toHaveBeenCalledWith('open', ['https://example.com'], expect.any(Function));
    });
  });

  describe('runOpen - win32 platform', () => {
    beforeEach(async () => {
      await loadStandaloneForPlatform('win32');
      execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: null) => void) => cb(null));
      initShellBridgeStandalone();
    });

    it('openFile calls cmd /c start with the file path', async () => {
      // On win32, openPathSafely's SEC-SHELL-03 guard requires the path to exist
      // before invoking cmd; the mocked fs.existsSync returns true so a fixture
      // path that is not on disk still reaches runOpen.
      existsSyncMock.mockReturnValue(true);
      await openFileProvider.fn!('C:\\path\\to\\file.pdf');
      expect(execFileMock).toHaveBeenCalledWith(
        'cmd',
        ['/c', 'start', '', 'C:\\path\\to\\file.pdf'],
        expect.any(Function)
      );
    });
  });

  describe('runOpen - linux platform', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
      execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: null) => void) => cb(null));
      initShellBridgeStandalone();
    });

    it('openFile calls xdg-open with the file path', async () => {
      await openFileProvider.fn!('/path/to/file.pdf');
      expect(execFileMock).toHaveBeenCalledWith('xdg-open', ['/path/to/file.pdf'], expect.any(Function));
    });
  });

  describe('openExternal - URL validation', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
      execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: null) => void) => cb(null));
      initShellBridgeStandalone();
    });

    it('rejects invalid URLs without calling execFile', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await openExternalProvider.fn!('not-a-valid-url');
      expect(execFileMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('disallowed scheme'));
      warnSpy.mockRestore();
    });

    it('rejects empty string URLs without calling execFile', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await openExternalProvider.fn!('');
      expect(execFileMock).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('allows valid URLs through to execFile', async () => {
      await openExternalProvider.fn!('https://example.com');
      expect(execFileMock).toHaveBeenCalledWith('open', ['https://example.com'], expect.any(Function));
    });
  });

  describe('runOpen - error handling', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
      initShellBridgeStandalone();
    });

    it('resolves { ok: false, error } when execFile returns an error', async () => {
      const error = new Error('open failed');
      execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) => cb(error));

      await expect(openFileProvider.fn!('/path/to/file.pdf')).resolves.toEqual({
        ok: false,
        error: 'open failed',
      });
    });
  });

  describe('path confinement (RT-R4-02)', () => {
    beforeEach(async () => {
      await loadStandaloneForPlatform('darwin');
      execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (err: null) => void) => cb(null));
      initShellBridgeStandalone();
    });

    it('openFile opens the confined path, not the raw input', async () => {
      confinePathMock.mockResolvedValue('/Users/me/Documents/report.pdf');

      const result = await openFileProvider.fn!('/Users/me/Documents/./report.pdf');

      expect(result).toEqual({ ok: true });
      expect(confinePathMock).toHaveBeenCalledWith('/Users/me/Documents/./report.pdf');
      expect(execFileMock).toHaveBeenCalledWith('open', ['/Users/me/Documents/report.pdf'], expect.any(Function));
    });

    it('openFile fails closed when confinePath rejects', async () => {
      confinePathMock.mockResolvedValue(null);

      const result = await openFileProvider.fn!('/etc/passwd');

      expect(result).toEqual({ ok: false, error: 'path not allowed' });
      expect(execFileMock).not.toHaveBeenCalled();
    });

    it('openFile expands a leading ~ before confinement', async () => {
      confinePathMock.mockResolvedValue(null);

      await openFileProvider.fn!('~/Downloads/Wayland.dmg');

      const arg = confinePathMock.mock.calls[0]?.[0] as string;
      expect(arg.startsWith('~')).toBe(false);
      expect(arg.endsWith('/Downloads/Wayland.dmg')).toBe(true);
    });

    it('rejects an empty path and a non-string before reaching confinePath', async () => {
      expect(await openFileProvider.fn!('')).toEqual({ ok: false, error: 'empty path' });
      expect(await showItemInFolderProvider.fn!(undefined)).toEqual({ ok: false, error: 'empty path' });
      expect(confinePathMock).not.toHaveBeenCalled();
      expect(execFileMock).not.toHaveBeenCalled();
    });

    it('showItemInFolder opens the parent of the CONFINED path', async () => {
      confinePathMock.mockResolvedValue('/Users/me/Documents/report.pdf');

      const result = await showItemInFolderProvider.fn!('/Users/me/Documents/./report.pdf');

      expect(result).toEqual({ ok: true });
      expect(execFileMock).toHaveBeenCalledWith('open', ['/Users/me/Documents'], expect.any(Function));
    });

    it('showItemInFolder fails closed when confinePath rejects', async () => {
      confinePathMock.mockResolvedValue(null);

      const result = await showItemInFolderProvider.fn!('/etc/passwd');

      expect(result).toEqual({ ok: false, error: 'path not allowed' });
      expect(execFileMock).not.toHaveBeenCalled();
    });
  });

  /**
   * The open-target TYPE gate, on the transport a remote WebUI client shares.
   *
   * Confinement bounds the LOCATION of a path, never its TYPE. A workspace is an
   * authorized root, so `confinePath` happily accepts `<workspace>/report.command`
   * - and `open`/`xdg-open`/`cmd start` then EXECUTES it. The gate is the only
   * thing between an agent-authored file and an OS launcher here.
   *
   * These cases exist because the gate had NO coverage on this file at all:
   * deleting `refuseUnsafeOpenTarget` from `shellBridgeStandalone.ts` left this
   * suite 16/16 green.
   */
  describe('open-target type gate (WebUI transport)', () => {
    beforeEach(async () => {
      await loadStandaloneForPlatform('darwin');
      initShellBridgeStandalone();
    });

    it('openFile refuses a gated target and never reaches the OS launcher', async () => {
      confinePathMock.mockResolvedValue('/Users/me/workspace/report.command');
      refuseUnsafeOpenTargetMock.mockResolvedValue({
        ok: false,
        error: 'refusing to open ".command": not an openable document type',
      });

      const result = await openFileProvider.fn!('/Users/me/workspace/report.command');

      expect(result).toEqual({
        ok: false,
        error: 'refusing to open ".command": not an openable document type',
      });
      expect(execFileMock).not.toHaveBeenCalled();
    });

    it('openFile gates the CONFINED path, not the renderer-supplied one', async () => {
      confinePathMock.mockResolvedValue('/Users/me/workspace/report.command');
      refuseUnsafeOpenTargetMock.mockResolvedValue({ ok: false, error: 'refusing to launch a ".app" bundle' });

      await openFileProvider.fn!('/Users/me/workspace/./sub/../report.command');

      expect(refuseUnsafeOpenTargetMock).toHaveBeenCalledWith('/Users/me/workspace/report.command');
    });

    it('openFile still opens a target the gate allows', async () => {
      confinePathMock.mockResolvedValue('/Users/me/workspace/brief.html');
      refuseUnsafeOpenTargetMock.mockResolvedValue(null);

      const result = await openFileProvider.fn!('/Users/me/workspace/brief.html');

      expect(result).toEqual({ ok: true });
      expect(execFileMock).toHaveBeenCalledWith('open', ['/Users/me/workspace/brief.html'], expect.any(Function));
    });

    it('showItemInFolder is deliberately NOT gated - revealing never executes', async () => {
      confinePathMock.mockResolvedValue('/Users/me/workspace/report.command');
      refuseUnsafeOpenTargetMock.mockResolvedValue({ ok: false, error: 'must not be consulted for reveal' });

      const result = await showItemInFolderProvider.fn!('/Users/me/workspace/report.command');

      expect(result).toEqual({ ok: true });
      expect(refuseUnsafeOpenTargetMock).not.toHaveBeenCalled();
      expect(execFileMock).toHaveBeenCalledWith('open', ['/Users/me/workspace'], expect.any(Function));
    });
  });
});
