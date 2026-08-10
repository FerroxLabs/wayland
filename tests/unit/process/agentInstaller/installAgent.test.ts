/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isAcpLaunchSpec } from '@/common/types/acpTypes';
import { AGENT_PACKAGES, UnknownAgentError } from '@process/services/agentInstaller/agentPackages';
import {
  BundledBunUnavailableError,
  InstallCommandFailedError,
  PackageNotInstalledError,
  buildInstallArgs,
  getAgentInstallStatus,
  installAgent,
  type InstallSpawn,
} from '@process/services/agentInstaller/installAgent';
import { readInstallReceipt } from '@process/services/agentInstaller/installManifest';
import { resolvePackageDir } from '@process/services/agentInstaller/launchSpecResolver';

const FAKE_BUN = '/opt/wayland/resources/bundled-bun/darwin-arm64/bun';

function writeFileTree(file: string, contents: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf-8');
}

/** A spawn that materialises the package the real `bun install` would have written. */
function spawnThatLandsPackage(npmPackage: string, binEntry: string): InstallSpawn {
  return vi.fn(async (_command: string, args: string[]) => {
    const cwdIndex = args.indexOf('--cwd');
    const prefix = args[cwdIndex + 1];
    const pkgDir = resolvePackageDir(prefix, npmPackage);
    writeFileTree(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({
        name: npmPackage,
        version: '1.0.0',
        bin: { [path.basename(binEntry, path.extname(binEntry))]: binEntry },
      })
    );
    writeFileTree(path.join(pkgDir, binEntry), 'export {};\n');
    return { code: 0, stdout: 'installed', stderr: '' };
  });
}

describe('buildInstallArgs', () => {
  it('emits the verified argv, with --ignore-scripts', () => {
    expect(buildInstallArgs('/tmp/p', '@openai/codex', '0.147.0')).toEqual([
      'install',
      '--cwd',
      '/tmp/p',
      '--ignore-scripts',
      '--no-save',
      '@openai/codex@0.147.0',
    ]);
  });
});

describe('installAgent', () => {
  let userData: string;

  beforeEach(() => {
    userData = mkdtempSync(path.join(os.tmpdir(), 'wl-install-'));
  });

  afterEach(() => {
    rmSync(userData, { recursive: true, force: true });
  });

  it('SECURITY: passes --ignore-scripts in the literal spawn argv', async () => {
    const spawn = spawnThatLandsPackage('@moonshot-ai/kimi-code', 'dist/main.mjs');

    await installAgent('kimi', { userDataDir: userData, bunPath: FAKE_BUN, spawn });

    expect(spawn).toHaveBeenCalledTimes(1);
    const [command, args] = (spawn as unknown as { mock: { calls: Array<[string, string[]]> } }).mock.calls[0];

    expect(command).toBe(FAKE_BUN);
    expect(args).toContain('--ignore-scripts');
    // Assert on the exact argv, not just membership: a flag can be present but
    // positioned after the package spec, where bun would not apply it.
    expect(args).toEqual([
      'install',
      '--cwd',
      path.join(userData, 'agents', 'kimi'),
      '--ignore-scripts',
      '--no-save',
      `@moonshot-ai/kimi-code@${AGENT_PACKAGES.kimi.version}`,
    ]);
    expect(args.indexOf('--ignore-scripts')).toBeLessThan(args.length - 1);
    // The install must never be routed through a shell.
    expect(args.some((arg) => arg.includes('&&') || arg.includes('|'))).toBe(false);
  });

  /**
   * `bun install --cwd <dir>` does NOT stay in <dir>. It walks up looking for a
   * package root, and if an ancestor already has node_modules it installs THERE
   * and leaves the target empty. Verified by execution: installing into a nested
   * prefix under a directory that already had node_modules put the package in
   * the parent and created nothing at all in the target.
   *
   * A package.json in the prefix stops the walk. Without it, per-agent isolation
   * quietly degrades into one shared tree the first time an ancestor acquires a
   * node_modules.
   */
  it('anchors the prefix so bun cannot install into a parent', async () => {
    const spawn = spawnThatLandsPackage('@moonshot-ai/kimi-code', 'dist/main.mjs');

    await installAgent('kimi', { userDataDir: userData, bunPath: FAKE_BUN, spawn });

    const manifestPath = path.join(userData, 'agents', 'kimi', 'package.json');
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
    expect(manifest.private).toBe(true);
    expect(manifest.name).toBe('wayland-agent-kimi');
  });

  it('anchors the prefix BEFORE running the install, not after', async () => {
    // Ordering is the whole point: an anchor written after bun has already run
    // prevents nothing.
    let manifestExistedDuringSpawn = false;
    const inner = spawnThatLandsPackage('@moonshot-ai/kimi-code', 'dist/main.mjs');
    const spawn: InstallSpawn = async (command, args) => {
      manifestExistedDuringSpawn = existsSync(path.join(userData, 'agents', 'kimi', 'package.json'));
      return inner(command, args);
    };

    await installAgent('kimi', { userDataDir: userData, bunPath: FAKE_BUN, spawn });

    expect(manifestExistedDuringSpawn).toBe(true);
  });

  it('pins the exact catalogue version, never a range or dist-tag', async () => {
    const spawn = spawnThatLandsPackage('@moonshot-ai/kimi-code', 'dist/main.mjs');
    await installAgent('kimi', { userDataDir: userData, bunPath: FAKE_BUN, spawn });

    const args = (spawn as unknown as { mock: { calls: Array<[string, string[]]> } }).mock.calls[0][1];
    const spec = args[args.length - 1];
    expect(spec).toBe(`@moonshot-ai/kimi-code@${AGENT_PACKAGES.kimi.version}`);
    expect(spec).not.toContain('latest');
    expect(spec).not.toMatch(/[\^~*]/);
  });

  it('writes a receipt carrying an AcpLaunchSpec, never a cliPath string', async () => {
    const spawn = spawnThatLandsPackage('@moonshot-ai/kimi-code', 'dist/main.mjs');

    const report = await installAgent('kimi', {
      userDataDir: userData,
      bunPath: FAKE_BUN,
      spawn,
      now: () => new Date('2026-08-11T00:00:00.000Z'),
    });

    expect(isAcpLaunchSpec(report.launchSpec)).toBe(true);
    expect(report.installedAt).toBe('2026-08-11T00:00:00.000Z');
    expect(report.version).toBe(AGENT_PACKAGES.kimi.version);

    const receipt = readInstallReceipt(report.prefix);
    expect(receipt).not.toBeNull();
    expect(receipt).toEqual(report);
    expect(receipt).not.toHaveProperty('cliPath');
    expect(receipt?.launchSpec.command).not.toContain(`node_modules${path.sep}.bin`);
  });

  describe('when the bundled bun is absent (win32-arm64, non-AVX2 win32-x64)', () => {
    it('throws the named error rather than crashing', async () => {
      const spawn = vi.fn(async () => ({ code: 0, stdout: '', stderr: '' }));

      await expect(installAgent('codex', { userDataDir: userData, bunPath: null, spawn })).rejects.toThrowError(
        BundledBunUnavailableError
      );
    });

    it('names the platform in the message and does not spawn or write anything', async () => {
      const spawn = vi.fn(async () => ({ code: 0, stdout: '', stderr: '' }));

      const error = await installAgent('codex', { userDataDir: userData, bunPath: null, spawn }).catch(
        (caught: unknown) => caught
      );

      expect(error).toBeInstanceOf(BundledBunUnavailableError);
      expect((error as Error).name).toBe('BundledBunUnavailableError');
      expect((error as Error).message).toContain('no bundled bun runtime');
      expect(spawn).not.toHaveBeenCalled();
      // A silent no-op would have left the prefix behind as if work happened.
      expect(existsSync(path.join(userData, 'agents', 'codex'))).toBe(false);
      expect(readdirSync(userData)).toEqual([]);
    });

    it('treats an empty bun path the same as a missing one', async () => {
      await expect(
        installAgent('codex', { userDataDir: userData, bunPath: '', spawn: vi.fn() as unknown as InstallSpawn })
      ).rejects.toThrowError(BundledBunUnavailableError);
    });
  });

  it('rejects an agent that is not in the pinned catalogue', async () => {
    await expect(
      installAgent('not-an-agent', {
        userDataDir: userData,
        bunPath: FAKE_BUN,
        spawn: vi.fn() as unknown as InstallSpawn,
      })
    ).rejects.toThrowError(UnknownAgentError);
  });

  it('raises InstallCommandFailedError when the install exits non-zero', async () => {
    const spawn: InstallSpawn = vi.fn(async () => ({ code: 1, stdout: '', stderr: 'network unreachable' }));

    await expect(installAgent('codex', { userDataDir: userData, bunPath: FAKE_BUN, spawn })).rejects.toThrowError(
      InstallCommandFailedError
    );
  });

  it('raises PackageNotInstalledError when the install exits 0 but nothing landed', async () => {
    const spawn: InstallSpawn = vi.fn(async () => ({ code: 0, stdout: 'ok', stderr: '' }));

    await expect(installAgent('codex', { userDataDir: userData, bunPath: FAKE_BUN, spawn })).rejects.toThrowError(
      PackageNotInstalledError
    );
  });
});

describe('getAgentInstallStatus', () => {
  let userData: string;

  beforeEach(() => {
    userData = mkdtempSync(path.join(os.tmpdir(), 'wl-status-'));
  });

  afterEach(() => {
    rmSync(userData, { recursive: true, force: true });
  });

  it('reports prefix-missing when nothing was ever installed', () => {
    const status = getAgentInstallStatus('codex', userData);
    expect(status.installed).toBe(false);
    expect(status.reason).toBe('prefix-missing');
  });

  it('reports a half-finished install (prefix exists, package missing) as NOT installed', () => {
    // Exactly what a run that died between mkdir and the install leaves behind.
    mkdirSync(path.join(userData, 'agents', 'codex'), { recursive: true });

    const status = getAgentInstallStatus('codex', userData);

    expect(status.installed).toBe(false);
    expect(status.reason).toBe('package-missing');
    expect(status.receipt).toBeNull();
  });

  it('reports receipt-missing when the package landed but the receipt never got written', () => {
    const prefix = path.join(userData, 'agents', 'kimi');
    const pkgDir = resolvePackageDir(prefix, '@moonshot-ai/kimi-code');
    writeFileTree(path.join(pkgDir, 'package.json'), JSON.stringify({ name: '@moonshot-ai/kimi-code' }));

    const status = getAgentInstallStatus('kimi', userData);

    expect(status.installed).toBe(false);
    expect(status.reason).toBe('receipt-missing');
  });

  it('reports ok after a completed install', async () => {
    const spawn = spawnThatLandsPackage('@moonshot-ai/kimi-code', 'dist/main.mjs');
    await installAgent('kimi', { userDataDir: userData, bunPath: FAKE_BUN, spawn });

    const status = getAgentInstallStatus('kimi', userData);

    expect(status.installed).toBe(true);
    expect(status.reason).toBe('ok');
    expect(status.receipt?.npmPackage).toBe('@moonshot-ai/kimi-code');
  });

  it('reports launch-target-missing when the recorded launch target is gone', async () => {
    const spawn = spawnThatLandsPackage('@moonshot-ai/kimi-code', 'dist/main.mjs');
    const report = await installAgent('kimi', { userDataDir: userData, bunPath: FAKE_BUN, spawn });

    // Delete the SCRIPT, not the runtime. For the JS fallback the recorded
    // command is the shared JS runtime; the per-agent payload is args[0].
    const script = report.launchSpec.args[0];
    expect(script.startsWith(report.prefix)).toBe(true);
    rmSync(script, { force: true });

    const status = getAgentInstallStatus('kimi', userData);
    expect(status.installed).toBe(false);
    expect(status.reason).toBe('launch-target-missing');
  });
});
