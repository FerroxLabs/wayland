/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks (vi.hoisted so factories can reference them) ---

const {
  openFileProvider,
  showItemInFolderProvider,
  openExternalProvider,
  checkToolInstalledProvider,
  openFolderWithProvider,
  openPathProvider,
  shellMock,
  execMock,
  spawnMock,
  fsMock,
} = vi.hoisted(() => ({
  openFileProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  showItemInFolderProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  openExternalProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  checkToolInstalledProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  openFolderWithProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  openPathProvider: { fn: undefined as ((...args: any[]) => any) | undefined },
  shellMock: {
    openPath: vi.fn().mockResolvedValue(''),
    showItemInFolder: vi.fn(),
    openExternal: vi.fn().mockResolvedValue(undefined),
  },
  execMock: vi.fn(),
  spawnMock: vi.fn().mockReturnValue({
    on: vi.fn(),
    unref: vi.fn(),
  }),
  fsMock: {
    existsSync: vi.fn(),
    statSync: vi.fn(() => ({ isDirectory: () => true })),
  },
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
      checkToolInstalled: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          checkToolInstalledProvider.fn = fn;
        }),
      },
      openFolderWith: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          openFolderWithProvider.fn = fn;
        }),
      },
      openPath: {
        provider: vi.fn((fn: (...args: any[]) => any) => {
          openPathProvider.fn = fn;
        }),
      },
    },
  },
}));

vi.mock('electron', () => ({
  shell: shellMock,
}));

vi.mock('child_process', () => ({
  exec: execMock,
  spawn: spawnMock,
}));

vi.mock('fs', () => ({
  existsSync: fsMock.existsSync,
  statSync: fsMock.statSync,
}));

// --- Tests ---

let initShellBridge: typeof import('../../src/process/bridge/shellBridge').initShellBridge;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  fsMock.statSync.mockReset();
  fsMock.statSync.mockReturnValue({ isDirectory: () => true });
  openFileProvider.fn = undefined;
  showItemInFolderProvider.fn = undefined;
  openExternalProvider.fn = undefined;
  checkToolInstalledProvider.fn = undefined;
  openFolderWithProvider.fn = undefined;

  // Default mocks
  Object.defineProperty(process, 'platform', { value: 'win32' });

  const mod = await import('../../src/process/bridge/shellBridge');
  initShellBridge = mod.initShellBridge;
});

describe('shellBridge', () => {
  describe('initShellBridge', () => {
    it('registers all five shell providers', () => {
      initShellBridge();
      expect(openFileProvider.fn).toBeDefined();
      expect(showItemInFolderProvider.fn).toBeDefined();
      expect(openExternalProvider.fn).toBeDefined();
      expect(checkToolInstalledProvider.fn).toBeDefined();
      expect(openFolderWithProvider.fn).toBeDefined();
    });
  });

  describe('openFile - error handling', () => {
    beforeEach(() => {
      initShellBridge();
    });

    it('calls shell.openPath with the given path and reports success', async () => {
      shellMock.openPath.mockResolvedValue('');
      await expect(openFileProvider.fn!('/some/file.txt')).resolves.toEqual({ ok: true });
      expect(shellMock.openPath).toHaveBeenCalledWith('/some/file.txt');
    });

    it('resolves { ok: false, error } when shell.openPath returns an error string', async () => {
      shellMock.openPath.mockResolvedValue('No application associated with this file type');
      await expect(openFileProvider.fn!('/some/file.xyz')).resolves.toEqual({
        ok: false,
        error: 'No application associated with this file type',
      });
    });

    it('resolves { ok: false, error } when shell.openPath rejects', async () => {
      shellMock.openPath.mockRejectedValue(
        new Error('Failed to open: No application is associated with the specified file for this operation. (0x483)')
      );
      await expect(openFileProvider.fn!('/some/file.xyz')).resolves.toEqual({
        ok: false,
        error: 'Failed to open: No application is associated with the specified file for this operation. (0x483)',
      });
    });
  });

  describe('openExternal - URL validation', () => {
    beforeEach(() => {
      initShellBridge();
    });

    it('calls shell.openExternal for valid URLs', async () => {
      await openExternalProvider.fn!('https://example.com');
      expect(shellMock.openExternal).toHaveBeenCalledWith('https://example.com');
    });

    it('rejects invalid URLs without calling shell.openExternal', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await openExternalProvider.fn!('not-a-valid-url');
      expect(shellMock.openExternal).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('disallowed scheme'));
      warnSpy.mockRestore();
    });

    it('rejects empty string URLs without calling shell.openExternal', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await openExternalProvider.fn!('');
      expect(shellMock.openExternal).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('does not throw when shell.openExternal rejects (ELECTRON-HW)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      shellMock.openExternal.mockRejectedValueOnce(
        new Error('Failed to open: The system cannot find the file specified. (0x2)')
      );
      await expect(openExternalProvider.fn!('https://example.com/missing')).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to open external URL'),
        expect.stringContaining('The system cannot find the file specified')
      );
      warnSpy.mockRestore();
    });
  });

  describe('checkToolInstalled', () => {
    beforeEach(() => {
      initShellBridge();
    });

    it('returns true for terminal on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const result = await checkToolInstalledProvider.fn!({ tool: 'terminal' });
      expect(result).toBe(true);
    });

    it('returns true for terminal on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const result = await checkToolInstalledProvider.fn!({ tool: 'terminal' });
      expect(result).toBe(true);
    });

    it('returns true for terminal on Linux', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const result = await checkToolInstalledProvider.fn!({ tool: 'terminal' });
      expect(result).toBe(true);
    });

    it('returns true for explorer', async () => {
      const result = await checkToolInstalledProvider.fn!({ tool: 'explorer' });
      expect(result).toBe(true);
    });

    it('returns false for unknown tool', async () => {
      const result = await checkToolInstalledProvider.fn!({ tool: 'unknown-tool' as any });
      expect(result).toBe(false);
    });
  });

  describe('openFolderWith', () => {
    beforeEach(() => {
      initShellBridge();
      execMock.mockImplementation((cmd: string, callback: (err: Error | null) => void) => {
        callback(null);
      });
    });

    it('opens folder with explorer on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      shellMock.openPath.mockResolvedValue('');

      await openFolderWithProvider.fn!({ folderPath: 'C:\\Projects', tool: 'explorer' });

      expect(shellMock.openPath).toHaveBeenCalledWith('C:\\Projects');
    });

    it('opens folder with terminal on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      await openFolderWithProvider.fn!({ folderPath: '/workspace/project', tool: 'terminal' });

      expect(spawnMock).toHaveBeenCalledWith('open', ['-a', 'Terminal', '/workspace/project'], {
        detached: true,
        stdio: 'ignore',
      });
    });

    it.each([
      'C:\\Projects\\semi;colon',
      'C:\\Projects\\back`tick',
      'C:\\Projects\\dollar$(literal)',
      'C:\\Projects\\parentheses(folder)',
      'C:\\Projects\\research & development',
      "C:\\Projects\\owner's folder",
    ])('launches a Windows terminal with the validated directory only as cwd: %s', async (folderPath) => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      await openFolderWithProvider.fn!({ folderPath, tool: 'terminal' });

      expect(spawnMock).toHaveBeenCalledOnce();
      const [command, args, options] = spawnMock.mock.calls[0];
      expect(command).toBe('powershell.exe');
      expect(args).not.toContain(folderPath);
      expect(args).not.toContain('-Command');
      expect(args).not.toContain('Start-Process');
      expect(options).toEqual(
        expect.objectContaining({ cwd: folderPath, detached: true, shell: false, windowsHide: false })
      );
    });

    it('handles folder path with special characters', async () => {
      const folderWithSpecialChars = "/path/with'quotes";
      shellMock.openPath.mockResolvedValue('');

      await openFolderWithProvider.fn!({ folderPath: folderWithSpecialChars, tool: 'explorer' });

      expect(shellMock.openPath).toHaveBeenCalledWith(folderWithSpecialChars);
    });

    it.each([
      ['missing path before VS Code launch', 'C:\\Missing', 'vscode', 'missing'],
      ['regular file before terminal launch', 'C:\\Projects\\readme.txt', 'terminal', 'file'],
      ['undefined path before explorer launch', undefined, 'explorer', 'invalid'],
      ['null path before VS Code launch', null, 'vscode', 'invalid'],
      ['numeric path before terminal launch', 42, 'terminal', 'invalid'],
      ['failed directory check before explorer launch', 'C:\\Projects', 'explorer', 'directory-error'],
    ])('rejects %s without spawning or opening the path', async (_name, folderPath, tool, kind) => {
      if (kind === 'missing') {
        fsMock.statSync.mockImplementationOnce(() => {
          throw new Error('ENOENT');
        });
      } else if (kind === 'file') {
        fsMock.statSync.mockReturnValueOnce({ isDirectory: () => false });
      } else if (kind === 'directory-error') {
        fsMock.statSync.mockReturnValueOnce({
          isDirectory: () => {
            throw new Error('stat result unavailable');
          },
        });
      }

      await openFolderWithProvider.fn!({ folderPath, tool });

      expect(spawnMock).not.toHaveBeenCalled();
      expect(shellMock.openPath).not.toHaveBeenCalled();
    });

    it('launches VS Code through PATH and a native Windows fallback without a shell', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const origLocalAppData = process.env['LOCALAPPDATA'];
      const origProgramFiles = process.env['ProgramFiles'];
      const origProgramFilesX86 = process.env['ProgramFiles(x86)'];
      process.env['LOCALAPPDATA'] = 'C:\\Users\\me\\AppData\\Local';
      process.env['ProgramFiles'] = 'C:\\Program Files';
      process.env['ProgramFiles(x86)'] = 'C:\\Program Files (x86)';

      let errorCallback: ((...args: unknown[]) => void) | undefined;
      const firstChild = {
        on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
          if (event === 'error') errorCallback = cb;
        }),
        unref: vi.fn(),
      };

      let fallbackErrorCallback: ((...args: unknown[]) => void) | undefined;
      const fallbackChild = {
        on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
          if (event === 'error') fallbackErrorCallback = cb;
        }),
        unref: vi.fn(),
      };

      spawnMock.mockReturnValueOnce(firstChild).mockReturnValueOnce(fallbackChild);

      const nativeCodePath = 'C:\\Users\\me\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe';
      fsMock.existsSync.mockImplementation((candidate: string) => candidate === nativeCodePath);

      try {
        await openFolderWithProvider.fn!({ folderPath: 'C:\\Projects\\Q&M', tool: 'vscode' });

        expect(spawnMock.mock.calls[0]).toEqual([
          'code',
          ['C:\\Projects\\Q&M'],
          expect.objectContaining({ detached: true, stdio: 'ignore', shell: false }),
        ]);
        expect(errorCallback).toBeDefined();
        await errorCallback!(new Error('spawn code ENOENT'));

        expect(spawnMock.mock.calls[1]).toEqual([
          nativeCodePath,
          ['C:\\Projects\\Q&M'],
          expect.objectContaining({ detached: true, stdio: 'ignore', shell: false }),
        ]);

        expect(fallbackErrorCallback).toBeDefined();
        fallbackErrorCallback!(new Error('spawn Code.exe EINVAL'));
        expect(shellMock.openPath).toHaveBeenCalledWith('C:\\Projects\\Q&M');
      } finally {
        if (origLocalAppData === undefined) delete process.env['LOCALAPPDATA'];
        else process.env['LOCALAPPDATA'] = origLocalAppData;
        if (origProgramFiles === undefined) delete process.env['ProgramFiles'];
        else process.env['ProgramFiles'] = origProgramFiles;
        if (origProgramFilesX86 === undefined) delete process.env['ProgramFiles(x86)'];
        else process.env['ProgramFiles(x86)'] = origProgramFilesX86;
      }
    });

    it('contains a rejected OS fallback after VS Code discovery finds no executable', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      let errorCallback: ((error: Error) => unknown) | undefined;
      const firstChild = {
        on: vi.fn((event: string, cb: (error: Error) => unknown) => {
          if (event === 'error') errorCallback = cb;
        }),
        unref: vi.fn(),
      };
      spawnMock.mockReset();
      spawnMock.mockReturnValueOnce(firstChild);
      fsMock.existsSync.mockReturnValue(false);
      const openPathFailure = Promise.reject(new Error('OS folder handler failed'));
      const openPathCatch = vi.spyOn(openPathFailure, 'catch');
      shellMock.openPath.mockReturnValueOnce(openPathFailure);

      await openFolderWithProvider.fn!({ folderPath: 'C:\\Projects', tool: 'vscode' });
      expect(errorCallback).toBeDefined();
      const listenerResult = errorCallback!(new Error('spawn code ENOENT'));
      if (listenerResult instanceof Promise) {
        await listenerResult.catch(() => {});
      }
      await new Promise((resolve) => setTimeout(resolve));

      expect(listenerResult).toBeUndefined();
      expect(shellMock.openPath).toHaveBeenCalledWith('C:\\Projects');
      expect(openPathCatch).toHaveBeenCalled();
    });

    it('contains a synchronous native fallback spawn failure and uses the OS folder handler', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const origLocalAppData = process.env['LOCALAPPDATA'];
      process.env['LOCALAPPDATA'] = 'C:\\Users\\me\\AppData\\Local';
      let errorCallback: ((error: Error) => unknown) | undefined;
      const firstChild = {
        on: vi.fn((event: string, cb: (error: Error) => unknown) => {
          if (event === 'error') errorCallback = cb;
        }),
        unref: vi.fn(),
      };
      spawnMock.mockReset();
      spawnMock.mockReturnValueOnce(firstChild).mockImplementationOnce(() => {
        throw new Error('native fallback spawn failed');
      });
      fsMock.existsSync.mockReturnValue(true);
      shellMock.openPath.mockResolvedValueOnce('');

      try {
        await openFolderWithProvider.fn!({ folderPath: 'C:\\Projects', tool: 'vscode' });
        expect(errorCallback).toBeDefined();
        const listenerResult = errorCallback!(new Error('spawn code ENOENT'));
        if (listenerResult instanceof Promise) {
          await listenerResult.catch(() => {});
        }
        await new Promise((resolve) => setTimeout(resolve));

        expect(listenerResult).toBeUndefined();
        expect(shellMock.openPath).toHaveBeenCalledWith('C:\\Projects');
      } finally {
        if (origLocalAppData === undefined) delete process.env['LOCALAPPDATA'];
        else process.env['LOCALAPPDATA'] = origLocalAppData;
      }
    });
  });
});
