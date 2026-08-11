/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * END TO END: a real npm install of a catalogued agent into a scratch userData
 * directory, the receipt it writes, the launch spec read back out of it, and a
 * real `shell: false` spawn of exactly what that spec names.
 *
 * This is the proof that the installer is no longer a dead end. A mocked test
 * cannot make it: the whole defect was that a genuinely successful install was
 * never read by anything, so the evidence has to start from a real install.
 *
 * NOT in the unit suite, by design — it hits the npm registry and spawns the
 * installed agent. Run it by hand:
 *
 *   npx vitest run --config vitest.live.config.ts tests/live/agentInstallLaunch.live.test.ts
 *
 * Requires a `bun` on PATH. A source checkout has no `resources/bundled-bun`
 * (it is staged at package time), so the test passes `bunPath` explicitly; the
 * packaged app uses the bundled one.
 *
 * IT NEVER TOUCHES THE USER'S PROFILE. `userDataDir` is an mkdtemp under the OS
 * temp dir and is removed afterwards, and KIMI_CODE_HOME is pointed at a scratch
 * directory so the real `~/.kimi-code` is left alone.
 */

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { registerPlatformServices } from '@/common/platform';
import { NodePlatformServices } from '@/common/platform/NodePlatformServices';
import { isAcpLaunchSpec, type AcpLaunchSpec } from '@/common/types/acpTypes';

registerPlatformServices(new NodePlatformServices());

let userDataDir: string;
let kimiHome: string;

function findBun(): string | null {
  try {
    return execFileSync('which', ['bun'], { encoding: 'utf-8' }).trim() || null;
  } catch {
    return null;
  }
}

/** Spawn a resolved spec exactly as the ACP seam does: argv array, shell: false. */
function spawnSpec(spec: AcpLaunchSpec, extraArgs: string[], env: Record<string, string> = {}) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(spec.command, [...spec.args, ...extraArgs], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env, ...spec.env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += String(chunk)));
    child.stderr.on('data', (chunk) => (stderr += String(chunk)));
    child.on('error', (err) => resolve({ code: null, stdout, stderr: `${stderr}${String(err)}` }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

beforeAll(() => {
  userDataDir = mkdtempSync(path.join(os.tmpdir(), 'wayland-agent-e2e-'));
  kimiHome = mkdtempSync(path.join(os.tmpdir(), 'wayland-kimi-home-'));
});

afterAll(() => {
  if (userDataDir) rmSync(userDataDir, { recursive: true, force: true });
  if (kimiHome) rmSync(kimiHome, { recursive: true, force: true });
});

describe('install → receipt → launch spec → spawned process', () => {
  it('codex: a native per-triple binary is installed, recorded, resolved and spawned', async () => {
    const bunPath = findBun();
    expect(bunPath, 'this suite needs a bun on PATH').not.toBeNull();

    const { installAgent, getAgentInstallStatus } = await import('@process/services/agentInstaller/installAgent');
    const { resolveManagedAgentLaunch } = await import('@process/services/agentInstaller/installedAgentLaunch');

    // Nothing installed yet — and the SAME call finds the install below, so this
    // zero is a real zero.
    expect(resolveManagedAgentLaunch('codex', userDataDir)).toBeNull();

    const receipt = await installAgent('codex', { userDataDir, bunPath });
    expect(receipt.prefix.startsWith(userDataDir)).toBe(true);
    expect(isAcpLaunchSpec(receipt.launchSpec)).toBe(true);
    expect(existsSync(receipt.launchSpec.command)).toBe(true);

    const status = getAgentInstallStatus('codex', userDataDir);
    expect(status).toMatchObject({ installed: true, reason: 'ok' });

    // The launch path reads the receipt back and hands over the same spec.
    const resolved = resolveManagedAgentLaunch('codex', userDataDir);
    expect(resolved).toEqual(receipt.launchSpec);

    const result = await spawnSpec(resolved!, ['--version']);
    expect(result.code, result.stderr).toBe(0);
    expect(result.stdout.trim().length).toBeGreaterThan(0);
  }, 600_000);

  it('kimi: the install reaches the ACP spawn seam, shell:false, as `<entry> acp`', async () => {
    const bunPath = findBun();
    expect(bunPath).not.toBeNull();

    const { installAgent } = await import('@process/services/agentInstaller/installAgent');
    const { listManagedAcpAgents } = await import('@process/services/agentInstaller/installedAgentLaunch');
    const { createGenericSpawnConfig } = await import('@process/agent/acp/acpConnectors');

    await installAgent('kimi', { userDataDir, bunPath });

    // The registry's source for managed ACP agents.
    const managed = listManagedAcpAgents(userDataDir);
    const kimi = managed.find((a) => a.agentId === 'kimi');
    expect(kimi, 'an installed kimi must be offered to the ACP layer').toBeDefined();
    expect(kimi!.backend).toBe('kimi');
    expect(kimi!.acpArgs).toEqual(['acp']);

    // The real spawn config builder, given the receipt's spec. `cliPath` is the
    // bare command that is NOT on PATH inside the scratch profile — the spec has
    // to win, or nothing would launch.
    const config = createGenericSpawnConfig('kimi', userDataDir, kimi!.acpArgs, undefined, undefined, kimi!.launch);
    expect(config.command).toBe(kimi!.launch.command);
    expect(config.args).toEqual([...kimi!.launch.args, 'acp']);
    expect(config.options.shell).toBe(false);

    // And the resolved executable really runs.
    const result = await spawnSpec(kimi!.launch, ['--version'], { KIMI_CODE_HOME: kimiHome });
    expect(result.code, result.stderr).toBe(0);
    expect(result.stdout.trim().length).toBeGreaterThan(0);
  }, 600_000);

  it('uninstall removes the install and the launch spec goes with it', async () => {
    const { uninstallAgent, readInstallReceipt } =
      await import('@process/services/agentInstaller/installManifest');
    const { resolveManagedAgentLaunch, listManagedAcpAgents } =
      await import('@process/services/agentInstaller/installedAgentLaunch');
    const { resolveAgentInstallPrefix } = await import('@process/services/agentInstaller/installPrefix');

    // The two things that must actually leave the disk. Asserted BEFORE as well
    // as after, so "gone" is a transition and not an accident of a path that was
    // never there. The launch target is inside the package dir, so its removal
    // is what makes `resolveManagedAgentLaunch` null below.
    const prefix = resolveAgentInstallPrefix('kimi', userDataDir);
    const packageDir = path.join(prefix, 'node_modules', '@moonshot-ai', 'kimi-code');
    expect(existsSync(packageDir), 'the installed package should be on disk before uninstall').toBe(true);
    expect(readInstallReceipt(prefix)).not.toBeNull();
    expect(resolveManagedAgentLaunch('kimi', userDataDir)).not.toBeNull();

    expect(uninstallAgent('kimi', userDataDir)).toMatchObject({ removed: true });

    // Both, not either: a receipt with the payload still on disk leaves dead
    // bytes in the user's profile, and a payload with no receipt leaves an
    // install nothing can find, cancel or remove.
    expect(existsSync(packageDir), 'the package directory must be gone').toBe(false);
    expect(readInstallReceipt(prefix), 'the receipt must be gone').toBeNull();

    expect(resolveManagedAgentLaunch('kimi', userDataDir)).toBeNull();
    expect(listManagedAcpAgents(userDataDir)).toEqual([]);
  }, 120_000);
});
