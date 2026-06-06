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

import * as childProcess from 'node:child_process';
// eslint-disable-next-line import/first
import {
  __setTrustedNpmCliResolver,
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
    (childProcess.spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
      makeFakeChild(),
    );
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
    await expect(
      safeSpawn({ cmd: 'node', args: ['x'], extraEnv: { 'bad-key': 'v' } }),
    ).rejects.toThrow(/invalid env key/);
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
    await expect(safeSpawn({ cmd: 'npm', args: ['x'] })).rejects.toThrow(
      /trusted npm/i,
    );
  });
});
