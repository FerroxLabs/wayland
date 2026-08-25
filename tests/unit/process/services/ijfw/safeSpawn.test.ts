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

    it('returns the fixed POSIX install locations on non-Windows', () => {
      const candidates = __buildNpmCliCandidates(
        'darwin',
        { PATH: '/usr/bin' },
        '/Applications/Wayland.app/Contents/MacOS/Wayland'
      );
      expect(candidates).toContain('/usr/local/lib/node_modules/npm/bin/npm-cli.js');
      expect(candidates).toContain('/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js');
    });
  });

  /**
   * #1043 - the POSIX half of #261. The win32 branch sweeps PATH to cover nvm,
   * fnm and volta; the POSIX branch never read the `env` argument it is handed,
   * so its effective Linux candidate list was ONE path,
   * /usr/local/lib/node_modules. apt, NodeSource, nvm, fnm and Linuxbrew - which
   * between them are how essentially everyone installs Node on Linux - all
   * missed, and IJFW could never self-install or update there.
   *
   * Driven with SYNTHETIC layouts rather than the host's, deliberately: a
   * resolver test on a machine whose /usr/local is populated passes regardless
   * of the bug (the Hetzner gate is exactly such a machine - its npm is
   * /usr/local/bin/npm -> ../lib/node_modules/npm/bin/npm-cli.js).
   */
  describe('__buildNpmCliCandidates on POSIX (#1043)', () => {
    const NVM_BIN = '/home/me/.nvm/versions/node/v22.21.1/bin';
    const FNM_BIN = '/home/me/.local/share/fnm/node-versions/v20.11.0/installation/bin';
    const linuxCandidates = (pathVar: string): string[] =>
      __buildNpmCliCandidates('linux', { PATH: pathVar }, '/opt/Wayland/wayland');

    it('derives npm-cli.js from every Node dir on PATH (nvm, fnm, NodeSource, Linuxbrew)', () => {
      const candidates = linuxCandidates(
        `/usr/bin:${NVM_BIN}:${FNM_BIN}:/home/linuxbrew/.linuxbrew/bin`
      );
      // NodeSource / any prefix-style install rooted at the PATH dir's parent.
      expect(candidates).toContain('/usr/lib/node_modules/npm/bin/npm-cli.js');
      expect(candidates).toContain(`${NVM_BIN.replace(/\/bin$/, '')}/lib/node_modules/npm/bin/npm-cli.js`);
      expect(candidates).toContain(`${FNM_BIN.replace(/\/bin$/, '')}/lib/node_modules/npm/bin/npm-cli.js`);
      expect(candidates).toContain(
        '/home/linuxbrew/.linuxbrew/lib/node_modules/npm/bin/npm-cli.js'
      );
    });

    it("covers Debian/Ubuntu's apt layout, which is not under lib/node_modules", () => {
      // The `npm` .deb installs to /usr/share/nodejs/npm, symlinked from /usr/bin/npm.
      expect(linuxCandidates('/usr/bin')).toContain('/usr/share/nodejs/npm/bin/npm-cli.js');
    });

    it('reads the env argument it is handed: no PATH means no PATH-derived candidates', () => {
      const withPath = linuxCandidates('/usr/bin');
      const withoutPath = linuxCandidates('');
      // Known positive for the comparison: the populated call really did add
      // entries, so the empty call returning fewer is the env being read.
      expect(withPath.length).toBeGreaterThan(withoutPath.length);
      expect(withoutPath.some((c) => c.startsWith('/usr/lib/'))).toBe(false);
      // The fixed, always-probed locations survive an empty PATH.
      expect(withoutPath).toContain('/usr/local/lib/node_modules/npm/bin/npm-cli.js');
      expect(withoutPath).toContain('/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js');
    });

    it('drops the dead libnode candidate (that directory exists nowhere in this repo)', () => {
      expect(linuxCandidates('/usr/bin').some((c) => c.includes('libnode'))).toBe(false);
      expect(
        __buildNpmCliCandidates('darwin', { PATH: '/usr/bin' }, '/Applications/Wayland.app/Contents/MacOS/Wayland')
          .some((c) => c.includes('libnode'))
      ).toBe(false);
    });

    it('never emits duplicates when PATH repeats a Node dir', () => {
      const candidates = linuxCandidates(`${NVM_BIN}:${NVM_BIN}:/usr/bin`);
      expect(new Set(candidates).size).toBe(candidates.length);
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

  /**
   * #1043 acceptance, executed end to end: a real npm-cli.js on a real disk,
   * resolved through the real realpath + trust-stat path, for the layouts that
   * were unreachable before.
   *
   * `realpath` is confined to the fixture root on purpose. Without that the
   * always-probed /usr/local candidate wins on any machine that has a system npm
   * - which the Hetzner gate does (/usr/local/bin/npm ->
   * ../lib/node_modules/npm/bin/npm-cli.js) - and the test would pass no matter
   * which layout the resolver could actually reach. The negative control at the
   * end proves the confinement really bites.
   */
  describe.skipIf(process.platform === 'win32')('defaultResolveTrustedNpm on real POSIX layouts (#1043)', () => {
    let root: string;
    let realpathSpy: ReturnType<typeof vi.spyOn> | null = null;

    /** Create `<prefix>/<cliRelative>` and return the PATH bin dir for that prefix. */
    const layout = (prefix: string, cliRelative: string): string => {
      const prefixDir = path.join(root, prefix);
      const cli = path.join(prefixDir, cliRelative);
      fs.mkdirSync(path.dirname(cli), { recursive: true });
      fs.writeFileSync(cli, '// npm-cli', { mode: 0o644 });
      const bin = path.join(prefixDir, 'bin');
      fs.mkdirSync(bin, { recursive: true });
      return bin;
    };

    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-npm-layouts-'));
      const realRealpath = fs.promises.realpath.bind(fs.promises);
      realpathSpy = vi.spyOn(fs.promises, 'realpath').mockImplementation(async (target: never) => {
        const p = String(target);
        if (!p.startsWith(root)) throw Object.assign(new Error(`ENOENT: confined away ${p}`), { code: 'ENOENT' });
        return realRealpath(p) as never;
      });
      __setTrustedNpmCliResolver(null);
    });

    afterEach(() => {
      realpathSpy?.mockRestore();
      realpathSpy = null;
      fs.rmSync(root, { recursive: true, force: true });
    });

    it('resolves an nvm/fnm-style versioned prefix', async () => {
      const bin = layout('nvm/versions/node/v22.21.1', 'lib/node_modules/npm/bin/npm-cli.js');
      process.env.PATH = bin;
      await expect(defaultResolveTrustedNpm()).resolves.toBe(
        path.join(root, 'nvm/versions/node/v22.21.1/lib/node_modules/npm/bin/npm-cli.js')
      );
    });

    it('resolves the NodeSource / prefix-style layout', async () => {
      const bin = layout('usr', 'lib/node_modules/npm/bin/npm-cli.js');
      process.env.PATH = `/nonexistent/first:${bin}`;
      await expect(defaultResolveTrustedNpm()).resolves.toBe(
        path.join(root, 'usr/lib/node_modules/npm/bin/npm-cli.js')
      );
    });

    it("resolves Debian/Ubuntu's apt layout under share/nodejs", async () => {
      const bin = layout('debian-usr', 'share/nodejs/npm/bin/npm-cli.js');
      process.env.PATH = bin;
      await expect(defaultResolveTrustedNpm()).resolves.toBe(
        path.join(root, 'debian-usr/share/nodejs/npm/bin/npm-cli.js')
      );
    });

    it('KNOWN NEGATIVE: a PATH dir with no npm install still fails, confinement intact', async () => {
      const bare = path.join(root, 'empty', 'bin');
      fs.mkdirSync(bare, { recursive: true });
      process.env.PATH = bare;
      await expect(defaultResolveTrustedNpm()).rejects.toThrow(/Could not resolve trusted npm/);
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
