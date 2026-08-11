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

type AcpInitializeResponse = {
  id: number;
  result: {
    protocolVersion: number;
    agentInfo: { name: string; version?: string };
    agentCapabilities: unknown;
  };
};

/**
 * Drive a real ACP `initialize` into a spawned launch spec and read the reply.
 *
 * ACP is newline-delimited JSON-RPC 2.0 over stdio, so this speaks the wire
 * directly rather than through the SDK: the point is to prove the INSTALLED
 * process answers, not that our client library works.
 */
function acpInitialize(spec: AcpLaunchSpec, timeoutMs = 30_000): Promise<AcpInitializeResponse | null> {
  return new Promise((resolve) => {
    const child = spawn(spec.command, spec.args, {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...spec.env },
    });

    let buffer = '';
    let settled = false;
    const finish = (value: AcpInitializeResponse | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child.kill('SIGKILL');
      } catch {
        /* already dead */
      }
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);

    child.stdout.on('data', (chunk) => {
      buffer += String(chunk);
      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line) as { id?: unknown; result?: unknown };
          if (parsed.id === 0 && parsed.result) finish(parsed as AcpInitializeResponse);
        } catch {
          /* not a complete JSON line; keep reading */
        }
      }
    });
    child.on('error', () => finish(null));
    child.on('close', () => finish(null));

    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          clientInfo: { name: 'Wayland', version: '2.0.0' },
          protocolVersion: 1,
          clientCapabilities: { fs: { readTextFile: true, writeTextFile: true } },
        },
      })}\n`
    );
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
  it('codex: the ACP BRIDGE is installed, recorded, resolved, spawned, and answers a real initialize', async () => {
    const bunPath = findBun();
    expect(bunPath, 'this suite needs a bun on PATH').not.toBeNull();

    const { installAgent, getAgentInstallStatus } = await import('@process/services/agentInstaller/installAgent');
    const { resolveManagedAgentLaunch } = await import('@process/services/agentInstaller/installedAgentLaunch');

    // Nothing installed yet — and the SAME call finds the install below, so this
    // zero is a real zero.
    expect(resolveManagedAgentLaunch('codex', userDataDir)).toBeNull();

    const receipt = await installAgent('codex', { userDataDir, bunPath });
    expect(receipt.npmPackage).toBe('@agentclientprotocol/codex-acp');
    expect(receipt.prefix.startsWith(userDataDir)).toBe(true);
    expect(isAcpLaunchSpec(receipt.launchSpec)).toBe(true);
    expect(existsSync(receipt.launchSpec.command)).toBe(true);

    const status = getAgentInstallStatus('codex', userDataDir);
    expect(status).toMatchObject({ installed: true, reason: 'ok' });

    // The launch path reads the receipt back, stamps its provenance, and names
    // the native codex binary that landed in the SAME prefix.
    const resolved = resolveManagedAgentLaunch('codex', userDataDir);
    expect(resolved!.command).toBe(receipt.launchSpec.command);
    expect(resolved!.args).toEqual(receipt.launchSpec.args);
    expect(resolved!.origin).toBe('wayland-install');
    const codexPath = resolved!.env?.CODEX_PATH;
    expect(codexPath, 'CODEX_PATH must name the native codex binary').toBeDefined();
    expect(path.isAbsolute(codexPath!)).toBe(true);
    expect(existsSync(codexPath!)).toBe(true);
    expect(codexPath!.startsWith(receipt.prefix)).toBe(true);

    // THE THING THAT WAS UNPROVEN: does the installed bridge actually speak ACP?
    // `--version` proves only that a process starts. This drives a real
    // JSON-RPC `initialize` into it over stdio, on the argv the ACP seam would
    // use (spec.args plus the backend's acpArgs, which are [] for codex).
    const response = await acpInitialize(resolved!);
    expect(response, 'no ACP response within the deadline').not.toBeNull();
    expect(response!.id).toBe(0);
    expect(response!.result.protocolVersion).toBeGreaterThanOrEqual(1);
    expect(response!.result.agentInfo.name).toBe('@agentclientprotocol/codex-acp');
    expect(response!.result.agentCapabilities).toBeDefined();
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
    // codex was installed by the first case into the SAME scratch profile and is
    // untouched, so this is "kimi is gone" rather than "the list is empty" - and
    // codex still being listed is what proves the removal was targeted.
    const stillListed = listManagedAcpAgents(userDataDir).map((a) => a.agentId);
    expect(stillListed).not.toContain('kimi');
    expect(stillListed).toContain('codex');
  }, 120_000);
});
