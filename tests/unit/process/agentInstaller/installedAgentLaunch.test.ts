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

import { AGENT_PACKAGES, getAgentPackage, type AgentPackage } from '@process/services/agentInstaller/agentPackages';
import { writeInstallReceipt } from '@process/services/agentInstaller/installManifest';
import { resolveAgentInstallPrefix } from '@process/services/agentInstaller/installPrefix';
import { resolvePackageDir, resolveTargetTriple } from '@process/services/agentInstaller/launchSpecResolver';
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

/**
 * Materialise the native codex binary where the real install puts it: in the
 * platform-specific optional dependency of `@openai/codex`, which arrives as a
 * dependency of the pinned ACP bridge and therefore lands in the SAME prefix.
 */
function materialiseNativeCodex(prefix: string): string {
  const triple = resolveTargetTriple(process.platform, process.arch);
  if (!triple) throw new Error(`no target triple for ${process.platform}/${process.arch}`);
  const vendorRoot = `${resolvePackageDir(prefix, '@openai/codex')}-${process.platform}-${process.arch}`;
  const exe = process.platform === 'win32' ? '.exe' : '';
  const binary = path.join(vendorRoot, 'vendor', triple, 'bin', `codex${exe}`);
  writeFileTree(binary, '#!/bin/sh\n');
  return binary;
}

beforeEach(() => {
  userDataDir = mkdtempSync(path.join(os.tmpdir(), 'wayland-managed-launch-'));
});

afterEach(() => {
  rmSync(userDataDir, { recursive: true, force: true });
});

describe('resolveManagedAgentLaunch', () => {
  it('returns the receipt launch spec for a complete install, stamped as Wayland-installed', () => {
    const { command } = materialiseInstall('kimi');
    // `origin` is the provenance LegacyConnectorFactory gates on. It is stamped
    // HERE, at the one place a spec is read back out of a receipt, rather than
    // stored in the receipt, which is a file the user can edit.
    expect(resolveManagedAgentLaunch('kimi', userDataDir)).toEqual({
      command,
      args: [],
      origin: 'wayland-install',
    });
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

  it('names the native codex binary absolutely via CODEX_PATH', () => {
    // The pinned codex package is the ACP BRIDGE, a JS entry that drives a
    // native codex binary and reads CODEX_PATH in its own startAcpServer().
    // Pointing it at the binary in Wayland's own prefix is what makes the
    // install self-contained instead of depending on whatever codex resolution
    // the bridge would perform for itself.
    const { prefix } = materialiseInstall('codex');
    const codexBinary = materialiseNativeCodex(prefix);

    const spec = resolveManagedAgentLaunch('codex', userDataDir);
    expect(spec?.env?.CODEX_PATH).toBe(codexBinary);
    expect(path.isAbsolute(spec!.env!.CODEX_PATH)).toBe(true);
  });

  it('omits CODEX_PATH entirely rather than guessing when no native binary landed', () => {
    // The control for the assertion above: the same read CAN produce the key,
    // so its absence here is a real absence. An empty or guessed CODEX_PATH is
    // strictly worse than letting the bridge fall back to its own resolution.
    const { prefix } = materialiseInstall('codex');
    expect(resolveManagedAgentLaunch('codex', userDataDir)?.env?.CODEX_PATH).toBeUndefined();
    materialiseNativeCodex(prefix);
    expect(resolveManagedAgentLaunch('codex', userDataDir)?.env?.CODEX_PATH).toBeDefined();
  });

  it('leaves a non-codex agent’s env untouched', () => {
    materialiseInstall('kimi');
    expect(resolveManagedAgentLaunch('kimi', userDataDir)?.env).toBeUndefined();
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

  it('maps codex, now that the pinned package is the ACP bridge and not the CLI', () => {
    // The old pin was `@openai/codex`, whose binary has no `acp` subcommand, so
    // this correctly returned null. The pin is now
    // `@agentclientprotocol/codex-acp`, which answers a real ACP `initialize`
    // over stdio (see agentPackages for the recorded handshake).
    expect(acpBackendForManagedAgent('codex')).toBe('codex');
    expect(getAgentPackage('codex').npmPackage).toBe('@agentclientprotocol/codex-acp');
  });

  it('returns null for an agent that is not catalogued at all', () => {
    // openclaw used to be catalogued and unmapped; it is now not catalogued,
    // and an uncatalogued id must not resolve to a backend by name collision.
    expect(acpBackendForManagedAgent('openclaw')).toBeNull();
    expect(acpBackendForManagedAgent('claude')).toBeNull();
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
    // This case used to use codex, which was the catalogued agent with no
    // `acpBackend`. Correcting codex's package removed that subject: BOTH
    // shipped entries now map, so the real catalogue can no longer tell
    // "reads acpBackend" apart from "trusts the id". Injecting a catalogue
    // brings the negative case back rather than leaving the guard unpinned
    // until the next catalogue addition without a backend.
    const kimi = getAgentPackage('kimi');
    const unmapped: Record<string, AgentPackage> = {
      kimi: { npmPackage: kimi.npmPackage, version: kimi.version, cliCommand: kimi.cliCommand },
    };

    // A REAL, complete install: the receipt, the package and the launch target
    // are all on disk, so the only thing standing between it and the ACP seam
    // is the missing `acpBackend`.
    materialiseInstall('kimi');
    expect(acpBackendForManagedAgent('kimi', unmapped)).toBeNull();
    expect(listManagedAcpAgents(userDataDir, unmapped)).toEqual([]);

    // Positive control on the same install: with the real catalogue, which DOES
    // map kimi, the very same receipt is listed. So the empty list above is the
    // backend rule biting, not a broken fixture.
    expect(listManagedAcpAgents(userDataDir).map((a) => a.agentId)).toEqual(['kimi']);
  });

  it('lists codex once installed, as the codex backend', () => {
    const { command } = materialiseInstall('codex');
    const listed = listManagedAcpAgents(userDataDir);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ agentId: 'codex', backend: 'codex', launch: { command, args: [] } });
  });

  it('omits a catalogued, ACP-capable agent that is NOT installed', () => {
    materialiseInstall('kimi');
    // The same call finds kimi, so the absence of codex is a real absence.
    expect(listManagedAcpAgents(userDataDir).map((a) => a.agentId)).toEqual(['kimi']);
  });

  it('is empty on a clean profile', () => {
    expect(listManagedAcpAgents(userDataDir)).toEqual([]);
  });
});
