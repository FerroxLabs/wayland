/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The three things the install seam had none of: an in-flight guard, a
 * deadline, and a cancel.
 *
 * The only guard that existed was React state inside the mounted settings
 * component, so navigating away mid-install and back re-enabled the button and
 * started a SECOND `bun install` into the same prefix. Every assertion below is
 * on an observable positive (a spawn count, a named error, a released guard),
 * never on the mere absence of a throw.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAgentPackage } from '@process/services/agentInstaller/agentPackages';
import {
  AgentInstallCancelledError,
  AgentInstallInProgressError,
  AgentInstallTimeoutError,
  DEFAULT_INSTALL_TIMEOUT_MS,
  cancelAgentInstall,
  installAgent,
  isAgentInstallInFlight,
  listAgentInstallsInFlight,
  type InstallSpawn,
} from '@process/services/agentInstaller/installAgent';
import { resolvePackageDir } from '@process/services/agentInstaller/launchSpecResolver';

const FAKE_BUN = '/opt/wayland/resources/bundled-bun/darwin-arm64/bun';
let userDataDir: string;

function writeFileTree(file: string, contents: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf-8');
}

/** Lands the package the real `bun install` would have written. */
function landPackage(prefix: string, npmPackage: string): void {
  const pkgDir = resolvePackageDir(prefix, npmPackage);
  writeFileTree(path.join(pkgDir, 'package.json'), JSON.stringify({ name: npmPackage, bin: { x: 'x.mjs' } }));
  writeFileTree(path.join(pkgDir, 'x.mjs'), 'export {};\n');
}

/** A spawn that blocks until the returned `release` is called. */
function blockingSpawn(npmPackage: string) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const spawn: InstallSpawn = vi.fn(async (_command: string, args: string[]) => {
    const prefix = args[args.indexOf('--cwd') + 1];
    await gate;
    landPackage(prefix, npmPackage);
    return { code: 0, stdout: '', stderr: '' };
  });
  return { spawn, release: () => release() };
}

beforeEach(() => {
  userDataDir = mkdtempSync(path.join(os.tmpdir(), 'wayland-install-guard-'));
});

afterEach(() => {
  rmSync(userDataDir, { recursive: true, force: true });
});

describe('concurrent install guard', () => {
  it('refuses a second install of the same agent and runs bun exactly once', async () => {
    const pkg = getAgentPackage('kimi');
    const { spawn, release } = blockingSpawn(pkg.npmPackage);

    const first = installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn });
    // Observable positive: main knows an install is running.
    expect(isAgentInstallInFlight('kimi')).toBe(true);
    expect(listAgentInstallsInFlight()).toEqual(['kimi']);

    await expect(installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn })).rejects.toBeInstanceOf(
      AgentInstallInProgressError
    );

    release();
    await expect(first).resolves.toMatchObject({ agentId: 'kimi' });
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(isAgentInstallInFlight('kimi')).toBe(false);
  });

  it('does not block a DIFFERENT agent', async () => {
    const kimi = blockingSpawn(getAgentPackage('kimi').npmPackage);
    const codex = blockingSpawn(getAgentPackage('codex').npmPackage);

    const a = installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn: kimi.spawn });
    const b = installAgent('codex', { userDataDir, bunPath: FAKE_BUN, spawn: codex.spawn });
    expect(listAgentInstallsInFlight().toSorted()).toEqual(['codex', 'kimi']);

    kimi.release();
    codex.release();
    await expect(a).resolves.toMatchObject({ agentId: 'kimi' });
    await expect(b).resolves.toMatchObject({ agentId: 'codex' });
  });

  it('releases the guard when the install FAILS, so a retry is possible', async () => {
    const failing: InstallSpawn = vi.fn(async () => ({ code: 1, stdout: '', stderr: 'boom' }));
    await expect(installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn: failing })).rejects.toThrow(/boom/);
    expect(isAgentInstallInFlight('kimi')).toBe(false);

    // Positive proof the guard really released: a retry runs a second spawn.
    const pkg = getAgentPackage('kimi');
    const ok: InstallSpawn = vi.fn(async (_c: string, args: string[]) => {
      landPackage(args[args.indexOf('--cwd') + 1], pkg.npmPackage);
      return { code: 0, stdout: '', stderr: '' };
    });
    await expect(installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn: ok })).resolves.toMatchObject({
      agentId: 'kimi',
    });
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it('never occupies a slot for a malformed id', async () => {
    await expect(installAgent('../../evil', { userDataDir, bunPath: FAKE_BUN })).rejects.toThrow();
    expect(listAgentInstallsInFlight()).toEqual([]);
  });
});

describe('timeout', () => {
  it('hands the runner a deadline and a signal', async () => {
    const pkg = getAgentPackage('kimi');
    const spawn: InstallSpawn = vi.fn(async (_c: string, args: string[]) => {
      landPackage(args[args.indexOf('--cwd') + 1], pkg.npmPackage);
      return { code: 0, stdout: '', stderr: '' };
    });
    await installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn, timeoutMs: 1234 });
    const controls = (spawn as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][2] as {
      timeoutMs: number;
      signal: AbortSignal;
    };
    expect(controls.timeoutMs).toBe(1234);
    expect(controls.signal).toBeInstanceOf(AbortSignal);
  });

  it('defaults to DEFAULT_INSTALL_TIMEOUT_MS, which is a real finite deadline', async () => {
    expect(DEFAULT_INSTALL_TIMEOUT_MS).toBeGreaterThan(0);
    expect(Number.isFinite(DEFAULT_INSTALL_TIMEOUT_MS)).toBe(true);

    const pkg = getAgentPackage('kimi');
    const spawn: InstallSpawn = vi.fn(async (_c: string, args: string[]) => {
      landPackage(args[args.indexOf('--cwd') + 1], pkg.npmPackage);
      return { code: 0, stdout: '', stderr: '' };
    });
    await installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn });
    const controls = (spawn as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][2] as { timeoutMs: number };
    expect(controls.timeoutMs).toBe(DEFAULT_INSTALL_TIMEOUT_MS);
  });

  it('reports a killed-by-deadline run as a timeout, NOT as a generic exit-code failure', async () => {
    const spawn: InstallSpawn = vi.fn(async () => ({ code: null, stdout: '', stderr: '', timedOut: true }));
    await expect(installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn, timeoutMs: 50 })).rejects.toBeInstanceOf(
      AgentInstallTimeoutError
    );
    expect(isAgentInstallInFlight('kimi')).toBe(false);
  });
});

describe('cancel', () => {
  it('aborts the running install and rejects it as cancelled', async () => {
    const spawn: InstallSpawn = vi.fn(
      (_command, _args, controls) =>
        new Promise((resolve) => {
          controls!.signal.addEventListener('abort', () =>
            resolve({ code: null, stdout: '', stderr: 'aborted', aborted: true })
          );
        })
    );

    const running = installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn });
    expect(isAgentInstallInFlight('kimi')).toBe(true);

    expect(cancelAgentInstall('kimi')).toBe(true);
    await expect(running).rejects.toBeInstanceOf(AgentInstallCancelledError);
    expect(isAgentInstallInFlight('kimi')).toBe(false);
  });

  it('returns false when there is nothing to cancel — a correct no-op', () => {
    expect(cancelAgentInstall('kimi')).toBe(false);
  });

  it('leaves no receipt behind for a cancelled install', async () => {
    const spawn: InstallSpawn = vi.fn(
      (_command, _args, controls) =>
        new Promise((resolve) => {
          controls!.signal.addEventListener('abort', () =>
            resolve({ code: null, stdout: '', stderr: '', aborted: true })
          );
        })
    );
    const running = installAgent('kimi', { userDataDir, bunPath: FAKE_BUN, spawn });
    cancelAgentInstall('kimi');
    await expect(running).rejects.toBeInstanceOf(AgentInstallCancelledError);

    const { getAgentInstallStatus } = await import('@process/services/agentInstaller/installAgent');
    const status = getAgentInstallStatus('kimi', userDataDir);
    expect(status.installed).toBe(false);
    expect(status.receipt).toBeNull();
  });
});
