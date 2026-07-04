/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { shell } from 'electron';
import { ipcBridge } from '@/common';
import type { ShellOpenResult } from '@/common/adapter/ipcBridge';
import { isAllowedExternalUrl } from '@/common/utils/urlValidation';
import { confinePath } from './pathConfinement';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * On Linux, Electron's `shell.openPath` routes through the desktop portal
 * (GTK/GIO/xdg-desktop-portal). In a portal-less environment (headless box,
 * minimal desktop, sandboxed session) that call NEVER resolves and hangs the
 * whole IPC handler indefinitely (measured 25s+ with no fallback and no toast).
 * We race it against this timeout and, if it wins, fall through to the proven
 * direct `xdg-open` spawn. Real desktops resolve `shell.openPath` in well under
 * this window, so the normal success/error paths are untouched.
 */
const LINUX_OPEN_PATH_TIMEOUT_MS = 2500;

/**
 * Check if a command exists in PATH
 */
async function commandExists(command: string): Promise<boolean> {
  const platform = process.platform;
  const checkCmd = platform === 'win32' ? `where ${command}` : `which ${command}`;

  try {
    await execAsync(checkCmd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if VS Code is installed
 */
async function isVSCodeInstalled(): Promise<boolean> {
  // First check if 'code' command exists
  if (await commandExists('code')) {
    return true;
  }

  // Check common installation paths
  const platform = process.platform;
  const possiblePaths: string[] = [];

  if (platform === 'win32') {
    const programFiles = process.env['ProgramFiles'];
    const programFilesX86 = process.env['ProgramFiles(x86)'];
    const localAppData = process.env['LOCALAPPDATA'];

    if (programFiles) {
      possiblePaths.push(path.join(programFiles, 'Microsoft VS Code', 'bin', 'code.cmd'));
    }
    if (programFilesX86) {
      possiblePaths.push(path.join(programFilesX86, 'Microsoft VS Code', 'bin', 'code.cmd'));
    }
    if (localAppData) {
      possiblePaths.push(path.join(localAppData, 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'));
    }
  } else if (platform === 'darwin') {
    possiblePaths.push('/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code');
    possiblePaths.push('/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code');
  } else {
    // Linux
    possiblePaths.push('/usr/bin/code');
    possiblePaths.push('/usr/local/bin/code');
    possiblePaths.push('/snap/bin/code');
  }

  for (const codePath of possiblePaths) {
    if (fs.existsSync(codePath)) {
      return true;
    }
  }

  return false;
}

/**
 * Open folder with specified tool
 */
async function openFolderWithTool(folderPath: string, tool: 'vscode' | 'terminal' | 'explorer'): Promise<void> {
  const platform = process.platform;

  switch (tool) {
    case 'vscode': {
      const vsChild = spawn('code', [folderPath], { detached: true, stdio: 'ignore' });
      vsChild.unref();
      vsChild.on('error', async () => {
        const codePath = await findVSCodeExecutable();
        if (codePath) {
          // On Windows, .cmd/.bat files must be spawned with shell: true
          const useShell = platform === 'win32' && /\.(cmd|bat)$/i.test(codePath);
          const fallback = spawn(codePath, [folderPath], { detached: true, stdio: 'ignore', shell: useShell });
          fallback.unref();
          fallback.on('error', () => {
            shell.openPath(folderPath).catch(() => {});
          });
        } else {
          await shell.openPath(folderPath);
        }
      });
      break;
    }

    case 'terminal': {
      if (platform === 'win32') {
        // Windows: spawn PowerShell directly with arg-array semantics - no cmd.exe shell
        // interpolation. Validate folderPath first to reject metacharacters and ensure
        // the target is an existing directory (defense-in-depth against command injection).
        let stat: fs.Stats;
        try {
          stat = fs.statSync(folderPath);
        } catch (err) {
          console.error('[shellBridge] terminal: folderPath does not exist:', folderPath, err);
          return;
        }
        if (!stat.isDirectory()) {
          console.error('[shellBridge] terminal: folderPath is not a directory:', folderPath);
          return;
        }
        if (/[&|<>"^]/.test(folderPath)) {
          console.error('[shellBridge] terminal: folderPath contains forbidden characters:', folderPath);
          return;
        }
        const child = spawn(
          'powershell.exe',
          ['-NoProfile', '-Command', 'Start-Process', '-FilePath', 'powershell.exe', '-WorkingDirectory', folderPath],
          {
            detached: true,
            windowsHide: false,
          }
        );
        child.on('error', (err) => {
          console.error('[shellBridge] Failed to spawn PowerShell:', err);
        });
        child.unref();
      } else if (platform === 'darwin') {
        // macOS: Open Terminal
        const child = spawn('open', ['-a', 'Terminal', folderPath], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
      } else {
        // Linux: Try common terminal emulators
        const terminals = ['gnome-terminal', 'konsole', 'xfce4-terminal', 'x-terminal-emulator', 'terminator'];
        let opened = false;

        for (const term of terminals) {
          if (await commandExists(term)) {
            const args = term === 'gnome-terminal' ? [`--working-directory=${folderPath}`] : [folderPath];
            const child = spawn(term, args, { detached: true, stdio: 'ignore' });
            child.unref();
            opened = true;
            break;
          }
        }

        if (!opened) {
          // Fallback to xdg-open
          await shell.openPath(folderPath);
        }
      }
      break;
    }

    case 'explorer':
    default: {
      // Open in file explorer/finder
      if (platform === 'darwin') {
        spawn('open', [folderPath], { detached: true, stdio: 'ignore' });
      } else if (platform === 'linux') {
        spawn('xdg-open', [folderPath], { detached: true, stdio: 'ignore' });
      } else {
        // Windows and fallback
        await shell.openPath(folderPath);
      }
      break;
    }
  }
}

/**
 * Find VS Code executable path
 */
async function findVSCodeExecutable(): Promise<string | null> {
  const platform = process.platform;
  const possiblePaths: string[] = [];

  if (platform === 'win32') {
    const programFiles = process.env['ProgramFiles'];
    const programFilesX86 = process.env['ProgramFiles(x86)'];
    const localAppData = process.env['LOCALAPPDATA'];

    if (programFiles) {
      possiblePaths.push(path.join(programFiles, 'Microsoft VS Code', 'bin', 'code.cmd'));
    }
    if (programFilesX86) {
      possiblePaths.push(path.join(programFilesX86, 'Microsoft VS Code', 'bin', 'code.cmd'));
    }
    if (localAppData) {
      possiblePaths.push(path.join(localAppData, 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'));
    }
  } else if (platform === 'darwin') {
    possiblePaths.push('/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code');
  } else {
    possiblePaths.push('/usr/bin/code');
    possiblePaths.push('/usr/local/bin/code');
    possiblePaths.push('/snap/bin/code');
  }

  for (const codePath of possiblePaths) {
    if (fs.existsSync(codePath)) {
      return codePath;
    }
  }

  return null;
}

/**
 * Spawn `xdg-open <target>` detached and resolve once we know whether the
 * launcher itself could start. A missing `xdg-open` (xdg-utils not installed -
 * common on minimal Linux desktops) surfaces as a spawn `error` event (ENOENT)
 * which we capture and report; otherwise `xdg-open` forks the real handler and
 * exits quickly, so the absence of a spawn error means the launch succeeded.
 */
function spawnXdgOpen(target: string): Promise<ShellOpenResult> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: ShellOpenResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    try {
      const child = spawn('xdg-open', [target], { detached: true, stdio: 'ignore' });
      child.on('error', (err) => settle({ ok: false, error: err.message }));
      child.unref();
      // No spawn error within a short window ⇒ the launcher started successfully.
      setTimeout(() => settle({ ok: true }), 200);
    } catch (err) {
      settle({ ok: false, error: (err as Error).message });
    }
  });
}

/**
 * Open a filesystem path with the OS default handler and report the outcome.
 *
 * On Linux, Electron's `shell.openPath` delegates to `xdg-open`; when xdg-utils
 * is absent or no desktop association exists it returns a non-empty error string
 * (or silently no-ops). Previously that failure was only `console.warn`-ed and
 * the provider resolved as success, so the renderer's context-menu actions did
 * nothing with no error shown (#616). We now surface the failure as a structured
 * result and, on Linux, retry with an explicit `xdg-open` spawn whose ENOENT we
 * can detect and report.
 */
async function openPathReporting(target: string): Promise<ShellOpenResult> {
  try {
    if (process.platform === 'linux') {
      // Race shell.openPath against a timeout: it can hang forever when the
      // desktop portal is unavailable (see LINUX_OPEN_PATH_TIMEOUT_MS). A fast
      // rejection still propagates to the outer catch (unchanged behavior); a
      // fast resolve of "" is success; anything else (non-empty error string OR
      // a timeout/hang) falls through to the direct xdg-open spawn.
      const TIMED_OUT = Symbol('shell.openPath-timeout');
      let timer: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<typeof TIMED_OUT>((resolve) => {
        timer = setTimeout(() => resolve(TIMED_OUT), LINUX_OPEN_PATH_TIMEOUT_MS);
      });
      const openPathPromise = shell.openPath(target);
      // If the timeout wins the race, openPathPromise is left pending; attach a
      // no-op catch so an eventual late rejection can never surface as an
      // unhandled promise rejection.
      openPathPromise.catch(() => {});
      let outcome: string | typeof TIMED_OUT;
      try {
        outcome = await Promise.race([openPathPromise, timeoutPromise]);
      } finally {
        clearTimeout(timer!);
      }
      if (outcome !== TIMED_OUT && !outcome) return { ok: true };
      const fallback = await spawnXdgOpen(target);
      if (fallback.ok) return { ok: true };
      const openPathError = outcome === TIMED_OUT ? 'shell.openPath timed out' : outcome;
      return { ok: false, error: fallback.error || openPathError };
    }
    // macOS / Windows: shell.openPath is reliable, so await it directly.
    const errorMessage = await shell.openPath(target);
    if (!errorMessage) return { ok: true };
    return { ok: false, error: errorMessage };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export function initShellBridge(): void {
  ipcBridge.shell.openFile.provider((filePath) => openPathReporting(filePath));

  ipcBridge.shell.showItemInFolder.provider(async (filePath) => {
    // macOS (`open -R`) and Windows (`explorer /select`) reveal reliably through
    // Electron. On Linux, `shell.showItemInFolder` depends on a freedesktop file
    // manager over D-Bus and silently no-ops when none is available (#616), so
    // fall back to opening the containing directory via `xdg-open` and report
    // failure instead of a silent no-op.
    if (process.platform === 'linux') {
      return openPathReporting(path.dirname(filePath));
    }
    try {
      shell.showItemInFolder(filePath);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  });

  ipcBridge.shell.openExternal.provider(async (url) => {
    // Allowlist schemes (https:/http:/mailto: and the app's own wayland: deep-link
    // scheme); reject file:/smb:/ms-*/vbscript:/custom handlers so model-rendered
    // markdown links cannot drive the OS into opening local files or leaking creds.
    if (!isAllowedExternalUrl(url)) {
      console.warn(`[shellBridge] Rejected openExternal for disallowed scheme: ${url}`);
      return;
    }
    try {
      await shell.openExternal(url);
    } catch (error) {
      console.warn(`[shellBridge] Failed to open external URL: ${url}`, (error as Error).message);
    }
  });

  // Check if a tool is installed
  ipcBridge.shell.checkToolInstalled.provider(async ({ tool }) => {
    switch (tool) {
      case 'vscode':
        return isVSCodeInstalled();
      case 'terminal': {
        if (process.platform === 'win32') {
          // On Windows, PowerShell is always available (or fallback to CMD)
          return true;
        }
        // Terminal is always available on macOS and Linux
        return true;
      }
      case 'explorer':
        // File explorer is always available
        return true;
      default:
        return false;
    }
  });

  // Open folder with specified tool
  ipcBridge.shell.openFolderWith.provider(async ({ folderPath, tool }) => {
    try {
      await openFolderWithTool(folderPath, tool);
    } catch (error) {
      console.error(`[shellBridge] Failed to open folder with ${tool}:`, error);
      // Fallback to default shell open
      await shell.openPath(folderPath);
    }
  });

  // Open a filesystem path via OS default handler.
  //
  // The only renderer caller passes a main-mediated app directory (the memory
  // drop folder, which lives under the config/data/Documents app roots), never a
  // dialog-picked arbitrary path. `path.resolve` alone neither collapses
  // pre-existing symlinks nor restricts the target to those roots, so a
  // symlinked app dir (e.g. `~/.config -> /etc`) could redirect the OS file
  // manager to a sensitive location. Route the path through `confinePath`, which
  // realpath-collapses the existing prefix and fails closed on anything that
  // escapes every authorized root (RT-R4-02).
  ipcBridge.shell.openPath.provider(async ({ path: inputPath }) => {
    if (typeof inputPath !== 'string' || inputPath.length === 0) {
      return { ok: false, error: 'empty path' };
    }
    // Expand leading `~` to the home directory before confinement.
    let expanded = inputPath;
    if (expanded === '~' || expanded.startsWith('~/') || expanded.startsWith('~' + path.sep)) {
      expanded = os.homedir() + expanded.slice(1);
    }
    // Confine to authorized app roots with symlink collapse; fail closed on a
    // resolved path that escapes (also rejects `..`, UNC/device/ADS forms).
    const resolved = await confinePath(expanded);
    if (resolved === null) {
      return { ok: false, error: 'path not allowed' };
    }
    try {
      const errorMessage = await shell.openPath(resolved);
      if (errorMessage) {
        return { ok: false, error: errorMessage };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
}
