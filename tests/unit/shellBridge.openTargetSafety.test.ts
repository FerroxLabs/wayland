/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Two related shell-open defects, exercised end-to-end against the REAL
 * `confinePath` and the REAL open-target type gate (only the OS-facing
 * `electron.shell` / `child_process.spawn` calls are mocked, so a "would have
 * launched" is observable).
 *
 * Defect 1 - `shell.openFolderWith` was unconfined. It handed the
 * renderer-supplied `folderPath` straight to `openFolderWithTool`, which reaches
 * `spawn('open'|'xdg-open'|'code', [folderPath])` and `shell.openPath`. The
 * bridge allowlist validates the IPC *event name* only, never the arguments, so
 * a renderer-context compromise got "open <arbitrary path>" - on macOS that is
 * arbitrary application launch. Its `catch` also fell back to a second,
 * likewise-unconfined `shell.openPath(folderPath)`.
 *
 * Defect 2 - confinement bounds LOCATION, never TYPE. An agent writing
 * `report.command` / `payload.desktop` / `setup.exe` / an `.app` bundle INSIDE
 * its own workspace passes confinement trivially (the workspace is an authorized
 * root) and the OS handler then EXECUTES it.
 *
 * The legitimate paths (a real document, a real folder, Reveal) and the existing
 * symlink-escape defence are pinned here too, so the type gate cannot be traded
 * for a regression.
 */

import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Fixture roots -----------------------------------------------------------
// `os.tmpdir()` is a static authorized root, so a directory created under it
// stands in for an agent workspace: in-root, agent-writable, arbitrary content.
const sandbox = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-shell-safety-')));

const workspaceFile = path.join(sandbox, 'report.md');
const executableFile = path.join(sandbox, 'report.command');
const desktopFile = path.join(sandbox, 'payload.desktop');
const windowsFile = path.join(sandbox, 'setup.exe');
const appBundle = path.join(sandbox, 'Evil.app');
const extensionlessScript = path.join(sandbox, 'runme');
const extensionlessData = path.join(sandbox, 'NOTES');
const dottedFolder = path.join(sandbox, 'release.v2');
const escapeSymlink = path.join(sandbox, 'escape');

fs.writeFileSync(workspaceFile, '# report\n');
fs.writeFileSync(executableFile, '#!/bin/sh\nopen -a Calculator\n');
fs.writeFileSync(desktopFile, '[Desktop Entry]\nExec=/bin/sh -c id\n');
fs.writeFileSync(windowsFile, 'MZ');
fs.mkdirSync(path.join(appBundle, 'Contents', 'MacOS'), { recursive: true });
fs.writeFileSync(extensionlessScript, '#!/bin/sh\nid\n');
fs.chmodSync(extensionlessScript, 0o755);
fs.writeFileSync(extensionlessData, 'plain notes\n');
fs.mkdirSync(dottedFolder, { recursive: true });
// A symlink that points outside every authorized root. `confinePath`
// realpath-collapses the existing prefix, so anything under it must fail closed.
fs.symlinkSync('/etc', escapeSymlink, 'dir');

afterAll(() => {
  fs.rmSync(sandbox, { recursive: true, force: true });
});

// --- Mocks -------------------------------------------------------------------

const { providers, shellMock, spawnMock, execMock } = vi.hoisted(() => ({
  providers: {} as Record<string, (...args: any[]) => any>,
  shellMock: {
    openPath: vi.fn().mockResolvedValue(''),
    showItemInFolder: vi.fn(),
    openExternal: vi.fn().mockResolvedValue(undefined),
  },
  spawnMock: vi.fn().mockReturnValue({ on: vi.fn(), unref: vi.fn() }),
  execMock: vi.fn(),
}));

const capture =
  (name: string) =>
  (fn: (...args: any[]) => any): void => {
    providers[name] = fn;
  };

vi.mock('@/common', () => ({
  ipcBridge: {
    shell: {
      openFile: { provider: vi.fn(capture('openFile')) },
      showItemInFolder: { provider: vi.fn(capture('showItemInFolder')) },
      openExternal: { provider: vi.fn(capture('openExternal')) },
      checkToolInstalled: { provider: vi.fn(capture('checkToolInstalled')) },
      openFolderWith: { provider: vi.fn(capture('openFolderWith')) },
      openPath: { provider: vi.fn(capture('openPath')) },
    },
  },
}));

vi.mock('electron', () => ({ shell: shellMock }));

vi.mock('child_process', () => ({ exec: execMock, spawn: spawnMock }));

// pathConfinement's own dependencies - the module itself is REAL here.
vi.mock('@process/utils', () => ({
  getConfigPath: () => path.join(sandbox, '__config__'),
  getDataPath: () => path.join(sandbox, '__data__'),
  getTempPath: () => path.join(sandbox, '__temp__'),
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => {
    throw new Error('no db in this test');
  }),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      getLogsDir: () => path.join(sandbox, '__logs__'),
      getSystemPath: (name: string) => (name === 'downloads' ? path.join(sandbox, '__downloads__') : null),
    },
  }),
}));

const ORIGINAL_PLATFORM = process.platform;
const setPlatform = (value: NodeJS.Platform): void => {
  Object.defineProperty(process, 'platform', { value, configurable: true });
};

const loadBridge = async (platform: NodeJS.Platform = 'darwin'): Promise<void> => {
  setPlatform(platform);
  vi.resetModules();
  const mod = await import('../../src/process/bridge/shellBridge');
  mod.initShellBridge();
};

beforeEach(async () => {
  vi.clearAllMocks();
  shellMock.openPath.mockResolvedValue('');
  spawnMock.mockReturnValue({ on: vi.fn(), unref: vi.fn() });
  await loadBridge('darwin');
});

afterAll(() => {
  setPlatform(ORIGINAL_PLATFORM);
});

/** Every OS-facing launch surface this bridge can reach. */
const nothingLaunched = (): void => {
  expect(spawnMock).not.toHaveBeenCalled();
  expect(shellMock.openPath).not.toHaveBeenCalled();
};

// --- Defect 1: openFolderWith is unconfined ---------------------------------

describe('shellBridge.openFolderWith - confinement (defect 1)', () => {
  it('refuses a folder outside every authorized root and launches nothing (macOS explorer)', async () => {
    const result = await providers['openFolderWith']({ folderPath: '/etc', tool: 'explorer' });

    nothingLaunched();
    expect(result).toEqual({ ok: false, error: 'path not allowed' });
  });

  it('refuses an out-of-root folder on the linux xdg-open branch', async () => {
    await loadBridge('linux');

    const result = await providers['openFolderWith']({ folderPath: '/etc', tool: 'explorer' });

    nothingLaunched();
    expect(result).toEqual({ ok: false, error: 'path not allowed' });
  });

  it('refuses an out-of-root folder on the vscode branch', async () => {
    const result = await providers['openFolderWith']({ folderPath: '/etc', tool: 'vscode' });

    nothingLaunched();
    expect(result).toEqual({ ok: false, error: 'path not allowed' });
  });

  it('refuses a symlink that escapes the authorized roots', async () => {
    const result = await providers['openFolderWith']({ folderPath: escapeSymlink, tool: 'explorer' });

    expect(result).toEqual({ ok: false, error: 'path not allowed' });
    nothingLaunched();
  });

  it('opens a legitimate in-root folder through the confined path', async () => {
    const result = await providers['openFolderWith']({ folderPath: sandbox, tool: 'explorer' });

    expect(result).toEqual({ ok: true });
    expect(spawnMock).toHaveBeenCalledWith('open', [sandbox], { detached: true, stdio: 'ignore' });
  });

  it('opens an in-root folder whose name contains dots (not an app bundle)', async () => {
    const result = await providers['openFolderWith']({ folderPath: dottedFolder, tool: 'explorer' });

    expect(result).toEqual({ ok: true });
    expect(spawnMock).toHaveBeenCalledWith('open', [dottedFolder], { detached: true, stdio: 'ignore' });
  });

  it('refuses an .app bundle even though it sits inside an authorized root', async () => {
    const result = await providers['openFolderWith']({ folderPath: appBundle, tool: 'explorer' });

    expect(result).toEqual({ ok: false, error: expect.stringContaining('.app') });
    nothingLaunched();
  });
});

// --- Defect 2: confinement bounds location, never type ----------------------

describe('shell open providers - executable-type refusal (defect 2)', () => {
  const executableCases: Array<[string, string]> = [
    ['macOS .command', executableFile],
    ['linux .desktop', desktopFile],
    ['win32 .exe', windowsFile],
    ['an extensionless file with the execute bit set', extensionlessScript],
  ];

  for (const [label, target] of executableCases) {
    it(`shell.openFile refuses ${label} inside an authorized root`, async () => {
      const result = await providers['openFile'](target);

      nothingLaunched();
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it(`shell.openPath refuses ${label} inside an authorized root`, async () => {
      const result = await providers['openPath']({ path: target });

      nothingLaunched();
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  }

  it('refuses an .app bundle handed to shell.openPath', async () => {
    const result = await providers['openPath']({ path: appBundle });

    nothingLaunched();
    expect(result.ok).toBe(false);
  });
});

// --- Legitimate paths must survive the type gate ----------------------------

describe('shell open providers - legitimate targets still work', () => {
  it('opens a real workspace document', async () => {
    const result = await providers['openFile'](workspaceFile);

    expect(result).toEqual({ ok: true });
    expect(shellMock.openPath).toHaveBeenCalledWith(workspaceFile);
  });

  it('opens an extensionless data file that is not executable', async () => {
    const result = await providers['openFile'](extensionlessData);

    expect(result).toEqual({ ok: true });
    expect(shellMock.openPath).toHaveBeenCalledWith(extensionlessData);
  });

  it('opens a real directory through shell.openPath', async () => {
    const result = await providers['openPath']({ path: sandbox });

    expect(result).toEqual({ ok: true });
    expect(shellMock.openPath).toHaveBeenCalledWith(sandbox);
  });

  it('reveals a document (Reveal never executes, so the type gate must not apply)', async () => {
    const result = await providers['showItemInFolder'](workspaceFile);

    expect(result).toEqual({ ok: true });
    expect(shellMock.showItemInFolder).toHaveBeenCalledWith(workspaceFile);
  });

  it('reveals an executable-type file - selecting it in Finder does not run it', async () => {
    const result = await providers['showItemInFolder'](executableFile);

    expect(result).toEqual({ ok: true });
    expect(shellMock.showItemInFolder).toHaveBeenCalledWith(executableFile);
  });
});

// --- Existing symlink-escape defence must still hold ------------------------

describe('shell open providers - symlink escape still fails closed', () => {
  it('shell.openFile refuses a path under an escaping symlink', async () => {
    const result = await providers['openFile'](path.join(escapeSymlink, 'passwd'));

    expect(result).toEqual({ ok: false, error: 'path not allowed' });
    nothingLaunched();
  });

  it('shell.openPath refuses a path under an escaping symlink', async () => {
    const result = await providers['openPath']({ path: path.join(escapeSymlink, 'passwd') });

    expect(result).toEqual({ ok: false, error: 'path not allowed' });
    nothingLaunched();
  });

  it('shell.showItemInFolder refuses a path under an escaping symlink', async () => {
    const result = await providers['showItemInFolder'](path.join(escapeSymlink, 'passwd'));

    expect(result).toEqual({ ok: false, error: 'path not allowed' });
    expect(shellMock.showItemInFolder).not.toHaveBeenCalled();
  });
});

// --- The one carve-out: files the MAIN process produced and verified ---------

describe('shell open providers - app-produced open targets', () => {
  it('refuses an installer artifact the main process has not vouched for', async () => {
    const installer = path.join(sandbox, 'Unvouched-1.2.3.dmg');
    fs.writeFileSync(installer, 'not a real dmg');

    const result = await providers['openFile'](installer);

    nothingLaunched();
    expect(result.ok).toBe(false);
  });

  it('opens an installer artifact the updater registered after verifying it', async () => {
    const installer = path.join(sandbox, 'Wayland-1.2.3.dmg');
    fs.writeFileSync(installer, 'not a real dmg');

    // Same module graph as the freshly loaded bridge, so this is the registry the
    // provider consults. Only main-process code can reach it.
    const safety = await import('../../src/process/bridge/shellOpenSafety');
    safety.registerAppProducedOpenTarget(installer);

    const result = await providers['openFile'](installer);

    expect(result).toEqual({ ok: true });
    expect(shellMock.openPath).toHaveBeenCalledWith(installer);
  });

  it('vouching for one artifact does not authorize a sibling of the same type', async () => {
    const vouched = path.join(sandbox, 'Vouched-2.0.0.dmg');
    const sibling = path.join(sandbox, 'Sibling-2.0.0.dmg');
    fs.writeFileSync(vouched, 'x');
    fs.writeFileSync(sibling, 'x');

    const safety = await import('../../src/process/bridge/shellOpenSafety');
    safety.registerAppProducedOpenTarget(vouched);

    const result = await providers['openFile'](sibling);

    nothingLaunched();
    expect(result.ok).toBe(false);
  });
});
