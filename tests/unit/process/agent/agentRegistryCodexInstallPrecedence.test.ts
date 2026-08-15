/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * D3 - A PATH PROBE THAT CANNOT SERVE THE BACKEND MUST NOT SHADOW AN INSTALL.
 *
 * D1 (see `agentRegistryManagedInstalls.test.ts`) says a detected SYSTEM copy
 * beats a Wayland install, because a copy the user already has is a working
 * setup and Wayland must not take it away. That holds only while the detected
 * command really is a copy of the thing that serves the backend.
 *
 * For `codex` it is not. `ACP_BACKENDS_ALL.codex.cliCommand` is `codex`, the
 * ordinary Codex CLI, which has no `acp` subcommand and cannot be an ACP server
 * (`AGENT_PACKAGES.codex` records the ACP server as a DIFFERENT bin,
 * `codex-acp`, for exactly this reason). So a PATH hit on `codex` is a
 * PREREQUISITE signal, not a system copy of the backend - and under first-wins
 * dedup it was still beating a real, receipted install of the bridge. The
 * install was then never read: `getManagedLaunchSpec('codex')` answered null and
 * the pinned, offline-capable copy the user explicitly asked Wayland to install
 * sat on disk unused while the npx bridge was re-resolved over the network.
 *
 * Unlike `agentRegistryManagedInstalls.test.ts`, `installedAgentLaunch` is NOT
 * mocked here: each case writes a REAL receipt with a REAL launch target to a
 * temp userData root, so what is being ranked is what the installer actually
 * produces. Only the PATH probe is injected, with the exact entry shape the
 * real `AcpDetector` emits for a machine that has `codex` installed.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { detectBuiltinAgents } = vi.hoisted(() => ({ detectBuiltinAgents: vi.fn() }));

vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: {
    clearEnvCache: vi.fn(),
    isCliAvailable: vi.fn(() => false),
    detectBuiltinAgents,
    detectExtensionAgents: vi.fn(async () => []),
    detectCustomAgents: vi.fn(async () => []),
  },
}));
vi.mock('@process/agent/wcore/binaryResolver', () => ({
  detectWCore: vi.fn(() => ({ version: 'wayland-core 0.0.0', path: '/tmp/wayland-core' })),
}));
vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => ({ getRemoteAgents: () => [] })),
}));

import { agentRegistry } from '@process/agent/AgentRegistry';
import { getAgentPackage } from '@process/services/agentInstaller/agentPackages';
import { writeInstallReceipt } from '@process/services/agentInstaller/installManifest';
import { resolveAgentInstallPrefix } from '@process/services/agentInstaller/installPrefix';
import { resolvePackageDir } from '@process/services/agentInstaller/launchSpecResolver';

let userDataDir: string;
let previousDataDir: string | undefined;

/**
 * The entry the REAL `AcpDetector` produces for a machine with the ordinary
 * Codex CLI on PATH. Captured verbatim from a live run of
 * `acpDetector.detectBuiltinAgents()` on a machine where
 * `which codex` resolves, so this is not a hand-invented shape.
 */
const PATH_CODEX = {
  id: 'codex',
  name: 'Codex',
  kind: 'acp' as const,
  available: true,
  backend: 'codex',
  cliPath: 'codex',
  acpArgs: [] as string[],
};

/** The same, for kimi - where the probe IS the bin that serves the backend. */
const PATH_KIMI = {
  id: 'kimi',
  name: 'Kimi Code',
  kind: 'acp' as const,
  available: true,
  backend: 'kimi',
  cliPath: 'kimi',
  acpArgs: ['acp'],
};

function writeFileTree(file: string, contents: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf-8');
}

/** A complete, valid install of `agentId` whose launch target exists on disk. */
function materialiseInstall(agentId: string): { command: string } {
  const pkg = getAgentPackage(agentId);
  const prefix = resolveAgentInstallPrefix(agentId, userDataDir);
  const pkgDir = resolvePackageDir(prefix, pkg.npmPackage);
  writeFileTree(path.join(pkgDir, 'package.json'), JSON.stringify({ name: pkg.npmPackage, bin: { x: 'x.mjs' } }));
  const command = path.join(pkgDir, 'x.mjs');
  writeFileTree(command, 'export {};\n');
  writeInstallReceipt({
    agentId,
    npmPackage: pkg.npmPackage,
    version: pkg.version,
    prefix,
    launchSpec: { command, args: [] },
    installedAt: new Date('2026-08-11T00:00:00.000Z').toISOString(),
  });
  return { command };
}

beforeEach(() => {
  userDataDir = mkdtempSync(path.join(os.tmpdir(), 'wl-codex-precedence-'));
  // NodePlatformServices (registered by tests/vitest.setup.ts) reads DATA_DIR,
  // so the registry's own un-parameterised receipt read lands in the temp root
  // and never touches the developer's profile.
  previousDataDir = process.env.DATA_DIR;
  process.env.DATA_DIR = userDataDir;
  detectBuiltinAgents.mockReset();
  detectBuiltinAgents.mockResolvedValue([]);
});

afterEach(() => {
  if (previousDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = previousDataDir;
  rmSync(userDataDir, { recursive: true, force: true });
});

describe('AgentRegistry - D3: a non-serving PATH probe does not shadow a managed install', () => {
  it('a receipted codex-acp install beats the ordinary codex CLI on PATH', async () => {
    const { command } = materialiseInstall('codex');
    detectBuiltinAgents.mockResolvedValue([PATH_CODEX]);
    await agentRegistry.refreshAll();

    const entries = agentRegistry.getDetectedAgents().filter((a) => a.backend === 'codex');
    // Exactly one, so the picker never shows Codex twice.
    expect(entries).toHaveLength(1);
    expect(
      entries[0],
      'the ordinary codex CLI cannot be an ACP server, so it must not win the dedup over an install of the bridge'
    ).toMatchObject({ launch: { command, args: [], origin: 'wayland-install' } });

    // The consequence that actually reaches the spawn seam.
    expect(agentRegistry.getManagedLaunchSpec('codex')).toMatchObject({
      command,
      origin: 'wayland-install',
    });
  });

  it('MIRROR: a PATH codex with no receipt still wins, and keeps the npx bridge', async () => {
    detectBuiltinAgents.mockResolvedValue([PATH_CODEX]);
    await agentRegistry.refreshAll();

    const entries = agentRegistry.getDetectedAgents().filter((a) => a.backend === 'codex');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ cliPath: 'codex' });
    // No launch spec is exactly what routes codex to connectCodex, the npx ACP
    // bridge, in LegacyConnectorFactory - pinned there by
    // "still uses the npx bridge ... when there is no launch spec".
    expect(agentRegistry.getManagedLaunchSpec('codex')).toBeNull();
  });

  it('D1 is untouched where the probe IS the bin that serves the backend: kimi', async () => {
    materialiseInstall('kimi');
    detectBuiltinAgents.mockResolvedValue([PATH_KIMI]);
    await agentRegistry.refreshAll();

    const entries = agentRegistry.getDetectedAgents().filter((a) => a.backend === 'kimi');
    expect(entries).toHaveLength(1);
    // The user's own kimi keeps running, and the spec stays withheld.
    expect(entries[0]).toMatchObject({ cliPath: 'kimi' });
    expect(entries[0]).not.toHaveProperty('launch');
    expect(agentRegistry.getManagedLaunchSpec('kimi')).toBeNull();
  });

  it('known positive: the same kimi receipt DOES win when nothing is on PATH', async () => {
    const { command } = materialiseInstall('kimi');
    detectBuiltinAgents.mockResolvedValue([]);
    await agentRegistry.refreshAll();

    expect(agentRegistry.getManagedLaunchSpec('kimi')).toMatchObject({ command, origin: 'wayland-install' });
  });
});
