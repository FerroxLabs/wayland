/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Store registered providers so we can test them
const registeredProviders: Record<string, Function> = {};

// Mock electron
vi.mock('electron', () => ({
  shell: {
    openPath: vi.fn().mockResolvedValue(''),
    showItemInFolder: vi.fn(),
    openExternal: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
  spawn: vi.fn().mockReturnValue({
    on: vi.fn(),
    unref: vi.fn(),
  }),
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  // L5 hardening: shellBridge.openFolderWith now stats folderPath before spawning
  // a Windows terminal. Default the stat to a valid directory so tests that don't
  // care about the validation path don't hit the early-return guard.
  statSync: vi.fn(() => ({ isDirectory: () => true })),
}));

// Mock @/common ipcBridge - capture the registered functions
vi.mock('@/common', () => ({
  ipcBridge: {
    shell: {
      openFile: {
        provider: vi.fn((fn: Function) => {
          registeredProviders['openFile'] = fn;
        }),
      },
      showItemInFolder: {
        provider: vi.fn((fn: Function) => {
          registeredProviders['showItemInFolder'] = fn;
        }),
      },
      openExternal: {
        provider: vi.fn((fn: Function) => {
          registeredProviders['openExternal'] = fn;
        }),
      },
      checkToolInstalled: {
        provider: vi.fn((fn: Function) => {
          registeredProviders['checkToolInstalled'] = fn;
        }),
      },
      openFolderWith: {
        provider: vi.fn((fn: Function) => {
          registeredProviders['openFolderWith'] = fn;
        }),
      },
      openPath: {
        provider: vi.fn((fn: Function) => {
          registeredProviders['openPath'] = fn;
        }),
      },
    },
  },
}));

// Import the module being tested (this registers the providers)
import { initShellBridge } from '../../src/process/bridge/shellBridge';
import { shell } from 'electron';
import * as fs from 'fs';
import { exec, spawn } from 'child_process';

// process.platform drives shellBridge's per-OS branches: on Linux, openFile falls
// back to an `xdg-open` spawn when shell.openPath fails, and showItemInFolder
// reveals by opening the containing directory instead of calling
// shell.showItemInFolder. Tests MUST pin the platform explicitly so they behave
// identically on macOS and Linux CI runners rather than inheriting the host OS.
const ORIGINAL_PLATFORM = process.platform;
function setPlatform(value: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value, configurable: true });
}

describe('shellBridge with actual providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Deterministic baseline: default every test to a non-Linux platform, and a
    // spawn mock whose child never emits 'error' (so a Linux xdg-open fallback is
    // treated as launched). Tests that exercise other platforms override these.
    setPlatform('darwin');
    vi.mocked(spawn).mockReturnValue({ on: vi.fn(), unref: vi.fn() } as never);
    // Clear registered providers
    Object.keys(registeredProviders).forEach((key) => delete registeredProviders[key]);
    // Re-initialize to register providers
    initShellBridge();
  });

  afterEach(() => {
    // Restore so platform never leaks across tests or into other suites.
    setPlatform(ORIGINAL_PLATFORM);
  });

  describe('openFile provider', () => {
    it('calls shell.openPath with the given path and reports success', async () => {
      vi.mocked(shell.openPath).mockResolvedValue('');

      await expect(registeredProviders['openFile']('/test/file.txt')).resolves.toEqual({ ok: true });

      expect(shell.openPath).toHaveBeenCalledWith('/test/file.txt');
    });

    it('resolves { ok: false, error } when shell.openPath returns error (non-Linux)', async () => {
      setPlatform('darwin');
      vi.mocked(shell.openPath).mockResolvedValue('No application associated with this file type');

      await expect(registeredProviders['openFile']('/test/unknown.xyz')).resolves.toEqual({
        ok: false,
        error: 'No application associated with this file type',
      });
    });

    it('resolves { ok: false, error } when shell.openPath rejects', async () => {
      const error = new Error('Failed to open');
      vi.mocked(shell.openPath).mockRejectedValue(error);

      await expect(registeredProviders['openFile']('/test/file.txt')).resolves.toEqual({
        ok: false,
        error: 'Failed to open',
      });
    });

    it('linux: retries via xdg-open and resolves { ok: true } when the spawn launches', async () => {
      setPlatform('linux');
      // Electron's shell.openPath returns a non-empty error string on a headless
      // Linux box; the code then retries with an explicit xdg-open spawn.
      vi.mocked(shell.openPath).mockResolvedValue('Failed to open path');
      // Default spawn mock never emits 'error', so xdg-open is treated as launched.

      await expect(registeredProviders['openFile']('/test/file.txt')).resolves.toEqual({ ok: true });
      expect(spawn).toHaveBeenCalledWith('xdg-open', ['/test/file.txt'], { detached: true, stdio: 'ignore' });
    });

    it('linux: resolves { ok: false, error } when the xdg-open spawn errors (ENOENT)', async () => {
      setPlatform('linux');
      vi.mocked(shell.openPath).mockResolvedValue('Failed to open path');
      // xdg-utils absent → the spawned child emits an ENOENT 'error' event.
      vi.mocked(spawn).mockReturnValue({
        on: vi.fn((event: string, cb: (err: Error) => void) => {
          if (event === 'error') cb(new Error('spawn xdg-open ENOENT'));
        }),
        unref: vi.fn(),
      } as never);

      await expect(registeredProviders['openFile']('/test/file.txt')).resolves.toEqual({
        ok: false,
        error: 'spawn xdg-open ENOENT',
      });
    });

    it('linux: falls back to xdg-open when shell.openPath hangs and resolves { ok: true }', async () => {
      vi.useFakeTimers();
      try {
        setPlatform('linux');
        // In a portal-less environment shell.openPath routes through
        // xdg-desktop-portal and NEVER resolves — model the hang with a promise
        // that stays pending forever. Fake timers keep the test from waiting the
        // real 2500ms + 200ms windows.
        vi.mocked(shell.openPath).mockReturnValue(new Promise<string>(() => {}));
        // Default spawn mock never emits 'error', so the xdg-open fallback launches.

        const resultPromise = registeredProviders['openFile']('/test/file.txt');
        // Advance past the LINUX_OPEN_PATH_TIMEOUT_MS (2500) hang window and the
        // spawnXdgOpen 200ms launch-confirmation window.
        await vi.advanceTimersByTimeAsync(2500 + 200 + 50);

        await expect(resultPromise).resolves.toEqual({ ok: true });
        expect(spawn).toHaveBeenCalledWith('xdg-open', ['/test/file.txt'], { detached: true, stdio: 'ignore' });
      } finally {
        vi.useRealTimers();
      }
    });

    it('linux: resolves { ok: false, error } when shell.openPath hangs AND xdg-open ENOENTs', async () => {
      vi.useFakeTimers();
      try {
        setPlatform('linux');
        vi.mocked(shell.openPath).mockReturnValue(new Promise<string>(() => {}));
        // xdg-utils absent → the spawned child emits an ENOENT 'error' event.
        vi.mocked(spawn).mockReturnValue({
          on: vi.fn((event: string, cb: (err: Error) => void) => {
            if (event === 'error') cb(new Error('spawn xdg-open ENOENT'));
          }),
          unref: vi.fn(),
        } as never);

        const resultPromise = registeredProviders['openFile']('/test/file.txt');
        await vi.advanceTimersByTimeAsync(2500 + 200 + 50);

        await expect(resultPromise).resolves.toEqual({ ok: false, error: 'spawn xdg-open ENOENT' });
      } finally {
        vi.useRealTimers();
      }
    });

    it('linux: fast-resolving success does not wait for the hang timeout', async () => {
      vi.useFakeTimers();
      try {
        setPlatform('linux');
        vi.mocked(shell.openPath).mockResolvedValue('');

        // No timer advance: a successful openPath must settle on microtasks alone.
        await expect(registeredProviders['openFile']('/test/file.txt')).resolves.toEqual({ ok: true });
        expect(spawn).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('showItemInFolder provider', () => {
    it('calls shell.showItemInFolder with the path (non-Linux)', async () => {
      setPlatform('darwin');

      await registeredProviders['showItemInFolder']('/test/folder');

      expect(shell.showItemInFolder).toHaveBeenCalledWith('/test/folder');
    });

    it('linux: reveals via the containing directory instead of shell.showItemInFolder', async () => {
      setPlatform('linux');
      vi.mocked(shell.openPath).mockResolvedValue('');

      const result = await registeredProviders['showItemInFolder']('/test/folder/file.txt');

      // Linux has no reliable shell.showItemInFolder, so it opens the parent dir.
      expect(shell.showItemInFolder).not.toHaveBeenCalled();
      expect(shell.openPath).toHaveBeenCalledWith('/test/folder');
      expect(result).toEqual({ ok: true });
    });
  });

  describe('openExternal provider', () => {
    it('calls shell.openExternal for valid URL', async () => {
      await registeredProviders['openExternal']('https://example.com');

      expect(shell.openExternal).toHaveBeenCalledWith('https://example.com');
    });

    it('rejects invalid URLs without calling shell.openExternal', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await registeredProviders['openExternal']('not-a-valid-url');

      expect(shell.openExternal).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('disallowed scheme'));
      warnSpy.mockRestore();
    });

    it('rejects empty string URLs', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await registeredProviders['openExternal']('');

      expect(shell.openExternal).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('checkToolInstalled provider', () => {
    it('returns true for terminal on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const result = await registeredProviders['checkToolInstalled']({ tool: 'terminal' });

      expect(result).toBe(true);
    });

    it('returns true for terminal on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const result = await registeredProviders['checkToolInstalled']({ tool: 'terminal' });

      expect(result).toBe(true);
    });

    it('returns true for terminal on Linux', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const result = await registeredProviders['checkToolInstalled']({ tool: 'terminal' });

      expect(result).toBe(true);
    });

    it('returns true for explorer', async () => {
      const result = await registeredProviders['checkToolInstalled']({ tool: 'explorer' });

      expect(result).toBe(true);
    });

    it('returns false for unknown tool', async () => {
      const result = await registeredProviders['checkToolInstalled']({ tool: 'unknown-tool' });

      expect(result).toBe(false);
    });

    it('checks VS Code installation via file paths', async () => {
      // Mock fs.existsSync to return false for all paths, and exec to fail
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(exec).mockImplementation((cmd: string, callback: Function) => {
        callback(new Error('not found'), { stdout: '', stderr: '' });
        return undefined as any;
      });

      const result = await registeredProviders['checkToolInstalled']({ tool: 'vscode' });

      // Should have checked file paths and command
      expect(fs.existsSync).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('openFolderWith provider', () => {
    it('opens folder with explorer on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      vi.mocked(shell.openPath).mockResolvedValue('');

      await registeredProviders['openFolderWith']({ folderPath: 'C:\\Projects', tool: 'explorer' });

      expect(shell.openPath).toHaveBeenCalledWith('C:\\Projects');
    });

    it('opens folder with terminal on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      await registeredProviders['openFolderWith']({ folderPath: '/workspace/project', tool: 'terminal' });

      expect(spawn).toHaveBeenCalledWith('open', ['-a', 'Terminal', '/workspace/project'], {
        detached: true,
        stdio: 'ignore',
      });
    });

    it('opens folder with terminal on Windows using PowerShell', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      await registeredProviders['openFolderWith']({ folderPath: 'C:\\Projects', tool: 'terminal' });

      // L5: direct powershell.exe spawn with arg-array (no cmd.exe shell interpolation).
      expect(spawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-NoProfile', '-Command', 'Start-Process', '-FilePath', 'powershell.exe', '-WorkingDirectory', 'C:\\Projects'],
        {
          detached: true,
          windowsHide: false,
        }
      );
    });

    it('opens folder with explorer on macOS using open command', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      await registeredProviders['openFolderWith']({ folderPath: '/projects', tool: 'explorer' });

      expect(spawn).toHaveBeenCalledWith('open', ['/projects'], { detached: true, stdio: 'ignore' });
    });

    it('handles Linux with xdg-open', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      vi.mocked(shell.openPath).mockResolvedValue('');

      await registeredProviders['openFolderWith']({ folderPath: '/projects', tool: 'explorer' });

      expect(spawn).toHaveBeenCalledWith('xdg-open', ['/projects'], { detached: true, stdio: 'ignore' });
    });

    it('handles Linux terminal by trying common emulators', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      // Mock commandExists to find gnome-terminal
      vi.mocked(exec).mockImplementation((cmd: string, callback: Function) => {
        if (cmd.includes('gnome-terminal')) {
          callback(null, { stdout: '/usr/bin/gnome-terminal', stderr: '' });
        } else {
          callback(new Error('not found'), { stdout: '', stderr: '' });
        }
        return undefined as any;
      });

      await registeredProviders['openFolderWith']({ folderPath: '/project', tool: 'terminal' });

      expect(spawn).toHaveBeenCalledWith('gnome-terminal', ['--working-directory=/project'], {
        detached: true,
        stdio: 'ignore',
      });
    });

    it('falls back to xdg-open on Linux when no terminal found', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      // Mock commandExists to not find any terminal
      vi.mocked(exec).mockImplementation((cmd: string, callback: Function) => {
        callback(new Error('not found'), { stdout: '', stderr: '' });
        return undefined as any;
      });

      await registeredProviders['openFolderWith']({ folderPath: '/project', tool: 'terminal' });

      expect(shell.openPath).toHaveBeenCalledWith('/project');
    });

    it('finds VS Code on macOS in Applications folder', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      // Mock spawn to fire error event synchronously for the 'code' command,
      // then return a normal mock for the fallback spawn call
      vi.mocked(spawn)
        .mockReturnValueOnce({
          on: vi.fn().mockImplementation((event: string, cb: Function) => {
            if (event === 'error') cb(new Error('spawn ENOENT'));
          }),
          unref: vi.fn(),
        } as any)
        .mockReturnValue({ on: vi.fn(), unref: vi.fn() } as any);
      // Mock fs.existsSync to find VS Code in macOS path
      vi.mocked(fs.existsSync).mockImplementation((filepath: string) => {
        return filepath === '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
      });

      await registeredProviders['openFolderWith']({ folderPath: '/project', tool: 'vscode' });
      // Flush microtasks so the async error handler completes
      await new Promise((resolve) => setTimeout(resolve));

      expect(fs.existsSync).toHaveBeenCalledWith(
        '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'
      );
      expect(spawn).toHaveBeenCalled();
    });

    it('finds VS Code on Linux in common paths', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      // Mock spawn to fire error event synchronously for the 'code' command,
      // then return a normal mock for the fallback spawn call
      vi.mocked(spawn)
        .mockReturnValueOnce({
          on: vi.fn().mockImplementation((event: string, cb: Function) => {
            if (event === 'error') cb(new Error('spawn ENOENT'));
          }),
          unref: vi.fn(),
        } as any)
        .mockReturnValue({ on: vi.fn(), unref: vi.fn() } as any);
      // Mock fs.existsSync to find VS Code in Linux path
      vi.mocked(fs.existsSync).mockImplementation((filepath: string) => {
        return filepath === '/usr/bin/code';
      });

      await registeredProviders['openFolderWith']({ folderPath: '/project', tool: 'vscode' });
      // Flush microtasks so the async error handler completes
      await new Promise((resolve) => setTimeout(resolve));

      expect(fs.existsSync).toHaveBeenCalledWith('/usr/bin/code');
      expect(spawn).toHaveBeenCalled();
    });
  });
});
