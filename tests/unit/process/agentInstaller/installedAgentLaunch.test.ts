/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The PRODUCER side of the launch spec: a written receipt becomes the
 * AcpLaunchSpec the ACP spawn seam consumes.
 *
 * Before this existed the receipt was written and never read by anything: a
 * genuinely successful install left the agent unlaunchable. Each case below
 * asserts a POSITIVE observable outcome, not merely the absence of a throw.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AGENT_PACKAGES, getAgentPackage } from '@process/services/agentInstaller/agentPackages';
import { writeInstallReceipt } from '@process/services/agentInstaller/installManifest';
import { resolveAgentInstallPrefix } from '@process/services/agentInstaller/installPrefix';
import { resolvePackageDir } from '@process/services/agentInstaller/launchSpecResolver';
import {
  acpBackendForManagedAgent,
  listManagedAcpAgents,
  resolveManagedAgentLaunch,
} from '@process/services/agentInstaller/installedAgentLaunch';

let userDataDir: string;

function writeFileTree(file: string, contents: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf-8');
}

/** Materialise a complete, valid install of `agentId` whose launch target exists. */
function materialiseInstall(agentId: string): { prefix: string; command: string } {
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
  return { prefix, command };
}

beforeEach(() => {
  userDataDir = mkdtempSync(path.join(os.tmpdir(), 'wayland-managed-launch-'));
});

afterEach(() => {
  rmSync(userDataDir, { recursive: true, force: true });
});

describe('resolveManagedAgentLaunch', () => {
  it('returns the receipt launch spec for a complete install', () => {
    const { command } = materialiseInstall('kimi');
    expect(resolveManagedAgentLaunch('kimi', userDataDir)).toEqual({ command, args: [] });
  });

  it('returns null when nothing has been installed', () => {
    // Positive control on the same method: it DOES find the known-present one.
    materialiseInstall('kimi');
    expect(resolveManagedAgentLaunch('kimi', userDataDir)).not.toBeNull();
    expect(resolveManagedAgentLaunch('codex', userDataDir)).toBeNull();
  });

  it('returns null when the launch target was deleted from under a valid receipt', () => {
    const { command } = materialiseInstall('kimi');
    expect(resolveManagedAgentLaunch('kimi', userDataDir)).not.toBeNull();
    rmSync(command);
    expect(resolveManagedAgentLaunch('kimi', userDataDir)).toBeNull();
  });

  it('refuses an id that is not in the catalogue, and one that could escape the root', () => {
    expect(resolveManagedAgentLaunch('not-a-real-agent', userDataDir)).toBeNull();
    expect(resolveManagedAgentLaunch('../../evil', userDataDir)).toBeNull();
  });
});

describe('acpBackendForManagedAgent', () => {
  it('maps kimi, whose installed binary IS an ACP stdio server', () => {
    expect(acpBackendForManagedAgent('kimi')).toBe('kimi');
  });

  it('does NOT map codex: the installed @openai/codex binary has no acp subcommand', () => {
    // The ACP server for the codex backend is a separate npm package
    // (@agentclientprotocol/codex-acp). Feeding this receipt into the ACP seam
    // would spawn the interactive TUI with no arguments.
    expect(acpBackendForManagedAgent('codex')).toBeNull();
  });

  it('does NOT map openclaw: openclaw-gateway is not an ACP backend at all', () => {
    expect(acpBackendForManagedAgent('openclaw')).toBeNull();
  });

  it('every catalogued agent is decided one way or the other', () => {
    for (const agentId of Object.keys(AGENT_PACKAGES)) {
      const backend = acpBackendForManagedAgent(agentId);
      expect(backend === null || typeof backend === 'string').toBe(true);
    }
  });
});

describe('listManagedAcpAgents', () => {
  it('lists an installed ACP-capable agent with its backend acpArgs', () => {
    const { command } = materialiseInstall('kimi');
    const listed = listManagedAcpAgents(userDataDir);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      agentId: 'kimi',
      backend: 'kimi',
      launch: { command, args: [] },
      // `kimi acp` is what actually starts the ACP server.
      acpArgs: ['acp'],
    });
  });

  it('omits an installed agent that cannot serve an ACP backend', () => {
    materialiseInstall('codex');
    // The install is real — the receipt resolves — it just is not ACP-capable.
    expect(resolveManagedAgentLaunch('codex', userDataDir)).not.toBeNull();
    expect(listManagedAcpAgents(userDataDir)).toEqual([]);
  });

  it('is empty on a clean profile', () => {
    expect(listManagedAcpAgents(userDataDir)).toEqual([]);
  });
});
