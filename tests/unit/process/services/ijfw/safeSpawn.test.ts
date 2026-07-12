/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// #706: the packaged runtime path resolves the bundled Bun dir. Override just
// that one export (keep the rest of shellEnv real) so packaged tests can steer
// it without touching the filesystem / a real resources dir.
const h = vi.hoisted(() => ({ bundledBunDir: null as string | null }));
vi.mock('@process/utils/shellEnv', async (orig) => ({
  ...(await orig<typeof import('@process/utils/shellEnv')>()),
  getBundledBunDir: () => h.bundledBunDir,
}));

import * as childProcess from 'node:child_process';
// eslint-disable-next-line import/first
import {
  __buildNpmCliCandidates,
  __isAcceptableNpmStat,
  __setTrustedNpmCliResolver,
  defaultResolveTrustedNpm,
  safeSpawn,
} from '@process/services/ijfw/safeSpawn';

function makeFakeChild() {
  const child = new EventEmitter() as EventEmitter & { stdout: null; stderr: null; stdin: null };
  child.stdout = null;
  child.stderr = null;
  child.stdin = null;
  return child;
}

describe('ijfw/safeSpawn', () => {
  let trustedNpmDir: string;
  let trustedNpmCli: string;
  let trustedNpxCli: string;

  beforeEach(() => {
    trustedNpmDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-spawn-'));
    trustedNpmCli = path.join(trustedNpmDir, 'npm-cli.js');
    trustedNpxCli = path.join(trustedNpmDir, 'npx-cli.js');
    fs.writeFileSync(trustedNpmCli, '// npm');
    fs.writeFileSync(trustedNpxCli, '// npx');
    __setTrustedNpmCliResolver(async () => trustedNpmCli);
    // Set a minimal env we expect to be forwarded.
    process.env.PATH = '/usr/bin';
    process.env.HOME = '/Users/test';
    process.env.NODE_ENV = 'test';
    (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mockReset();
    (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => makeFakeChild());
  });

  afterEach(() => {
    fs.rmSync(trustedNpmDir, { recursive: true, force: true });
    __setTrustedNpmCliResolver(null);
  });

  it("spawns node with process.execPath when cmd === 'node'", async () => {
    await safeSpawn({ cmd: 'node', args: ['--version'] });
    const calls = (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBe(1);
    const [argv0, argv] = calls[0];
    expect(argv0).toBe(process.execPath);
    expect(argv).toEqual(['--version']);
  });

  it("spawns the trusted npm cli when cmd === 'npm'", async () => {
    await safeSpawn({ cmd: 'npm', args: ['install', 'foo'] });
    const calls = (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const [argv0, argv] = calls[0];
    expect(argv0).toBe(process.execPath);
    expect(argv[0]).toBe(trustedNpmCli);
    expect(argv.slice(1)).toEqual(['install', 'foo']);
  });

  it("spawns the sibling npx cli when cmd === 'npx'", async () => {
    await safeSpawn({ cmd: 'npx', args: ['cowsay', 'hello'] });
    const calls = (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const [argv0, argv] = calls[0];
    expect(argv0).toBe(process.execPath);
    expect(argv[0]).toBe(trustedNpxCli);
    expect(argv.slice(1)).toEqual(['cowsay', 'hello']);
  });

  it('forces ELECTRON_RUN_AS_NODE=1 in the child env', async () => {
    await safeSpawn({ cmd: 'node', args: ['x'] });
    const calls = (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const opts = calls[0][2] as { env: NodeJS.ProcessEnv };
    expect(opts.env.ELECTRON_RUN_AS_NODE).toBe('1');
  });

  it('passes the buildChildEnv-filtered env, not raw process.env', async () => {
    process.env.SECRET_TOKEN = 'leak-me';
    await safeSpawn({ cmd: 'node', args: ['x'] });
    const calls = (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const opts = calls[0][2] as { env: NodeJS.ProcessEnv };
    expect(opts.env.SECRET_TOKEN).toBeUndefined();
    expect(opts.env.PATH).toBe('/usr/bin');
    delete process.env.SECRET_TOKEN;
  });

  it('forwards extraEnv (alphanumeric keys only)', async () => {
    await safeSpawn({ cmd: 'node', args: ['x'], extraEnv: { MY_FLAG: '1' } });
    const calls = (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const opts = calls[0][2] as { env: NodeJS.ProcessEnv };
    expect(opts.env.MY_FLAG).toBe('1');
  });

  it('throws when extraEnv contains an invalid key', async () => {
    await expect(safeSpawn({ cmd: 'node', args: ['x'], extraEnv: { 'bad-key': 'v' } })).rejects.toThrow(
      /invalid env key/
    );
  });

  it('passes cwd through to spawn options', async () => {
    await safeSpawn({ cmd: 'node', args: ['x'], cwd: '/tmp/here' });
    const calls = (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const opts = calls[0][2] as { cwd?: string };
    expect(opts.cwd).toBe('/tmp/here');
  });

  it('throws when the trusted npm CLI cannot be resolved', async () => {
    __setTrustedNpmCliResolver(async () => {
      throw new Error('Could not resolve trusted npm');
    });
    await expect(safeSpawn({ cmd: 'npm', args: ['x'] })).rejects.toThrow(/trusted npm/i);
  });

  describe('__buildNpmCliCandidates (#261)', () => {
    it('includes Windows fixed install locations', () => {
      const candidates = __buildNpmCliCandidates(
        'win32',
        { APPDATA: 'C:\\Users\\me\\AppData\\Roaming', PATH: '' },
        'C:\\Users\\me\\AppData\\Local\\Programs\\wayland\\wayland.exe'
      );
      // System-wide Node.js installer default.
      expect(candidates).toContain('C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js');
      // User-global npm self-install under APPDATA.
      expect(candidates).toContain('C:\\Users\\me\\AppData\\Roaming\\npm\\node_modules\\npm\\bin\\npm-cli.js');
    });

    it('derives npm-cli.js from Node dirs found on Windows PATH (where-style)', () => {
      // A Node install on PATH that the fixed locations would miss (e.g. nvm/fnm).
      const nodeDir = 'C:\\Users\\me\\scoop\\apps\\nodejs\\current';
      const candidates = __buildNpmCliCandidates(
        'win32',
        { APPDATA: 'C:\\Users\\me\\AppData\\Roaming', PATH: `C:\\Windows;${nodeDir}` },
        'C:\\app\\wayland.exe'
      );
      expect(candidates).toContain(`${nodeDir}\\node_modules\\npm\\bin\\npm-cli.js`);
    });

    it('returns POSIX candidates unchanged on non-Windows', () => {
      const candidates = __buildNpmCliCandidates(
        'darwin',
        { PATH: '/usr/bin' },
        '/Applications/Wayland.app/Contents/MacOS/Wayland'
      );
      expect(candidates).toContain('/usr/local/lib/node_modules/npm/bin/npm-cli.js');
      expect(candidates).toContain('/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js');
    });
  });

  describe('__isAcceptableNpmStat (#261)', () => {
    it('accepts any resolving path on Windows (NTFS perms are not POSIX-meaningful)', () => {
      // A normal C:\Program Files\nodejs file reads as world-writable (0o666)
      // through Node's translated mode and getuid() is undefined — it must NOT
      // be rejected, or the IJFW update check breaks (#261).
      expect(__isAcceptableNpmStat({ mode: 0o666, uid: undefined }, 'win32', undefined)).toBe(true);
    });

    it('rejects world-writable npm on POSIX', () => {
      expect(__isAcceptableNpmStat({ mode: 0o666, uid: 0 }, 'linux', 0)).toBe(false);
    });

    it('rejects foreign-owned npm on POSIX', () => {
      expect(__isAcceptableNpmStat({ mode: 0o755, uid: 1234 }, 'linux', 501)).toBe(false);
    });

    it('accepts a non-world-writable npm owned by self or root on POSIX', () => {
      expect(__isAcceptableNpmStat({ mode: 0o755, uid: 501 }, 'darwin', 501)).toBe(true);
      expect(__isAcceptableNpmStat({ mode: 0o755, uid: 0 }, 'darwin', 501)).toBe(true);
    });
  });

  describe('defaultResolveTrustedNpm diagnostics (#261)', () => {
    it('throws an enumerated diagnostic listing every tried candidate when none resolve', async () => {
      // Force every candidate to fail to resolve. This must be hermetic across
      // platforms: on a real Windows runner the hardcoded
      // `C:\Program Files\nodejs\...` candidate actually exists and resolves, so
      // stub realpath rather than rely on a bogus PATH (which only "works" on a
      // host that happens to lack a system Node install).
      const spy = vi
        .spyOn(fs.promises, 'realpath')
        .mockRejectedValue(Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' }));
      try {
        await expect(defaultResolveTrustedNpm()).rejects.toThrow(/Could not resolve trusted npm/);
        await expect(defaultResolveTrustedNpm()).rejects.toThrow(/npm-cli\.js/);
      } finally {
        spy.mockRestore();
      }
    });
  });

  // #706: in a packaged (fused) build ELECTRON_RUN_AS_NODE is a no-op, so the
  // interpreter must be a real runtime — bundled Bun, never the app binary. The
  // global NodePlatformServices reads process.env.IS_PACKAGED, so flip it here.
  describe('packaged runtime (#706)', () => {
    const BUN_DIR = '/res/bundled-bun/darwin-arm64';
    // The resolver derives the binary name from the platform (bun.exe on Windows).
    const bunBin = path.join(BUN_DIR, process.platform === 'win32' ? 'bun.exe' : 'bun');

    beforeEach(() => {
      process.env.IS_PACKAGED = 'true';
      h.bundledBunDir = BUN_DIR;
    });
    afterEach(() => {
      delete process.env.IS_PACKAGED;
      h.bundledBunDir = null;
    });

    const spawnCalls = () => (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mock.calls;

    it("runs 'node' entries under bundled Bun, not the app binary, with no ELECTRON_RUN_AS_NODE", async () => {
      await safeSpawn({ cmd: 'node', args: ['x'] });
      const [argv0, argv, opts] = spawnCalls()[0];
      expect(argv0).toBe(bunBin);
      expect(argv0).not.toBe(process.execPath);
      expect(argv).toEqual(['x']);
      expect((opts as { env: NodeJS.ProcessEnv }).env.ELECTRON_RUN_AS_NODE).toBeUndefined();
    });

    it('runs the trusted npm-cli.js under bundled Bun (SEC-007 resolution unchanged)', async () => {
      await safeSpawn({ cmd: 'npm', args: ['install', 'foo'] });
      const [argv0, argv] = spawnCalls()[0];
      expect(argv0).toBe(bunBin);
      expect(argv[0]).toBe(trustedNpmCli); // still the trusted, resolved cli path
      expect(argv.slice(1)).toEqual(['install', 'foo']);
    });

    it('runs the sibling npx-cli.js under bundled Bun', async () => {
      await safeSpawn({ cmd: 'npx', args: ['cowsay'] });
      const [argv0, argv] = spawnCalls()[0];
      expect(argv0).toBe(bunBin);
      expect(argv[0]).toBe(trustedNpxCli);
    });

    it('falls back to system node (not the app binary) when bundled Bun is absent', async () => {
      h.bundledBunDir = null;
      await safeSpawn({ cmd: 'node', args: ['x'] });
      const [argv0] = spawnCalls()[0];
      expect(argv0).toBe(process.platform === 'win32' ? 'node.exe' : 'node');
      expect(argv0).not.toBe(process.execPath);
    });
  });
});
