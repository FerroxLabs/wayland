/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `ijfwSystemService.detectLocalInstall()`. Verifies the three
 * happy paths (directory, symlink, CLI-on-PATH) plus the not-installed
 * fallback, and confirms `buildChildEnv` (not raw process.env) is used for
 * the PATH probe (SEC-006).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let tmpHome: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tmpHome };
});

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.6.3',
    getPath: (key: string) => `/tmp/wayland-test-${key}`,
  },
}));

const spawnSyncSpy = vi.fn();
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return {
    ...actual,
    spawnSync: (...args: unknown[]) => spawnSyncSpy(...args),
  };
});

// eslint-disable-next-line import/first
import { ijfwSystemService } from '@process/services/ijfwSystemService';

describe('ijfwSystemService.detectLocalInstall', () => {
  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-detect-'));
    spawnSyncSpy.mockReset();
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('returns installed=false when neither directory nor CLI exists', async () => {
    spawnSyncSpy.mockReturnValue({ status: 1, stdout: '', stderr: '' });
    const result = await ijfwSystemService.detectLocalInstall();
    expect(result.installed).toBe(false);
    expect(result.detectedVia).toBe('none');
  });

  it('returns installed=true with version from package.json (directory)', async () => {
    const mcp = path.join(tmpHome, '.ijfw', 'mcp-server');
    fs.mkdirSync(mcp, { recursive: true });
    fs.writeFileSync(path.join(mcp, 'package.json'), JSON.stringify({ name: '@ijfw/mcp-server', version: '1.5.4' }));
    const result = await ijfwSystemService.detectLocalInstall();
    expect(result.installed).toBe(true);
    expect(result.version).toBe('1.5.4');
    expect(result.detectedVia).toBe('directory');
    expect(result.mcpServerPath).toBe(mcp);
  });

  it('returns installed=true without version when package.json is missing', async () => {
    const mcp = path.join(tmpHome, '.ijfw', 'mcp-server');
    fs.mkdirSync(mcp, { recursive: true });
    const result = await ijfwSystemService.detectLocalInstall();
    expect(result.installed).toBe(true);
    expect(result.version).toBeUndefined();
    expect(result.detectedVia).toBe('directory');
  });

  // A plain directory symlink needs elevation/Developer Mode on win32, but an
  // NTFS *junction* does not - and Node's lstat reports a junction as a symbolic
  // link, so prod's detectedVia='symlink' path is exercised on both platforms.
  // The 'junction' type arg is ignored on posix (a regular symlink is created),
  // so the test runs everywhere - no skip.
  it('follows a symlink and reports detectedVia=symlink', async () => {
    const realDir = path.join(tmpHome, 'real-mcp');
    fs.mkdirSync(realDir, { recursive: true });
    fs.writeFileSync(path.join(realDir, 'package.json'), JSON.stringify({ version: '1.6.0' }));
    fs.mkdirSync(path.join(tmpHome, '.ijfw'), { recursive: true });
    const linkPath = path.join(tmpHome, '.ijfw', 'mcp-server');
    fs.symlinkSync(realDir, linkPath, 'junction');
    const result = await ijfwSystemService.detectLocalInstall();
    expect(result.installed).toBe(true);
    expect(result.version).toBe('1.6.0');
    expect(result.detectedVia).toBe('symlink');
    // Prod resolves the junction with the async `fs.promises.realpath` (libuv's
    // native realpath). The expected value must use the SAME call: on Windows
    // `fs.promises.realpath` expands 8.3 short components (`RUNNER~1` →
    // `runneradmin`) while the sync `fs.realpathSync` JS shim preserves them, so
    // mixing the two spuriously fails. Same link + same realpath variant → same
    // canonical form on every platform.
    expect(result.mcpServerPath).toBe(await fs.promises.realpath(linkPath));
  });

  it('falls back to PATH probe and returns CLI-on-PATH when which/where succeeds', async () => {
    spawnSyncSpy.mockReturnValue({
      status: 0,
      stdout: '/opt/homebrew/bin/ijfw\n',
      stderr: '',
    });
    const result = await ijfwSystemService.detectLocalInstall();
    expect(result.installed).toBe(true);
    expect(result.cliOnPath).toBe(true);
    expect(result.detectedVia).toBe('cli');
    expect(result.pathProbe.homebrew).toBe(true);
  });

  it('uses buildChildEnv (filtered allowlist) for the which probe - SEC-006', async () => {
    spawnSyncSpy.mockReturnValue({ status: 1, stdout: '', stderr: '' });
    process.env.WAYLAND_FAKE_SECRET = 'should-not-leak';
    await ijfwSystemService.detectLocalInstall();
    delete process.env.WAYLAND_FAKE_SECRET;
    expect(spawnSyncSpy).toHaveBeenCalled();
    const [, , opts] = spawnSyncSpy.mock.calls[0] as [string, string[], { env?: NodeJS.ProcessEnv }];
    expect(opts.env).toBeDefined();
    expect(opts.env!.WAYLAND_FAKE_SECRET).toBeUndefined();
    expect(opts.env!.PATH).toBeDefined();
  });
});
