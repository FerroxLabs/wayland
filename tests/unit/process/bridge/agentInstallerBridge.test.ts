/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `agentInstallerBridge` — the T-A process seam.
 *
 * The status handler exists to make ONE distinction real in the data:
 * installed-by-Wayland (a receipt in Wayland's own prefix) vs present-on-system
 * (a hit on the user's PATH) vs absent. Decision D1 — a detected system copy
 * wins and is never offered an install — is only safe if those three cannot be
 * confused, so the receipt side runs against the REAL service on a REAL temp
 * userData tree here. Only the two things that would touch the network or the
 * host (`installAgent`, the PATH probe) are stubbed.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  userData: '',
  detected: new Set<string>(),
  detectorThrows: false,
  bunPath: '/opt/bundled-bun/bun' as string | null,
  installImpl: vi.fn(async (_agentId: string) => {}),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ paths: { getDataDir: () => state.userData } }),
}));

vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: {
    batchCheckCliAvailability: async (_commands: string[]) => {
      if (state.detectorThrows) throw new Error('PATH probe blew up');
      return state.detected;
    },
  },
}));

// PARTIAL mock: `getAgentInstallStatus` and every named error class stay REAL,
// so the receipt/disk logic under test is the shipped logic and `instanceof`
// still identifies the errors the handlers map.
vi.mock('@process/services/agentInstaller/installAgent', async () => {
  const actual = await vi.importActual<typeof import('@process/services/agentInstaller/installAgent')>(
    '@process/services/agentInstaller/installAgent'
  );
  return {
    ...actual,
    installAgent: (agentId: string) => state.installImpl(agentId),
    resolveBundledBunPath: () => state.bunPath,
  };
});

import { AGENT_PACKAGES } from '@process/services/agentInstaller/agentPackages';
import { BundledBunUnavailableError, InstallCommandFailedError } from '@process/services/agentInstaller/installAgent';
import { RECEIPT_FILENAME, writeInstallReceipt } from '@process/services/agentInstaller/installManifest';
import {
  handleAgentInstallerStatus,
  handleInstallAgent,
  handleUninstallAgent,
} from '@process/bridge/agentInstallerBridge';

const KIMI_PKG = AGENT_PACKAGES.kimi.npmPackage;

function write(file: string, contents: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf-8');
}

/** Lay down a complete, valid Wayland install of kimi: package tree + receipt. */
function layDownManagedKimi(installedAt = '2026-08-11T00:00:00.000Z'): string {
  const prefix = path.join(state.userData, 'agents', 'kimi');
  write(path.join(prefix, 'node_modules', ...KIMI_PKG.split('/'), 'package.json'), '{"name":"kimi"}');

  // The launch target must EXIST — getAgentInstallStatus checks both halves, so
  // a receipt alone is not enough to report `installed`.
  const runtime = path.join(prefix, 'runtime-bun');
  const entry = path.join(prefix, 'node_modules', ...KIMI_PKG.split('/'), 'dist', 'main.mjs');
  write(runtime, '#!bun\n');
  write(entry, 'export {};\n');

  writeInstallReceipt({
    agentId: 'kimi',
    npmPackage: KIMI_PKG,
    version: '0.34.0',
    prefix,
    launchSpec: { command: runtime, args: [entry], env: { ELECTRON_RUN_AS_NODE: '1' } },
    installedAt,
  });
  return prefix;
}

function agentIn(report: Awaited<ReturnType<typeof handleAgentInstallerStatus>>, agentId: string) {
  const found = report.agents.find((entry) => entry.agentId === agentId);
  if (!found) throw new Error(`no status entry for ${agentId}`);
  return found;
}

beforeEach(() => {
  state.userData = mkdtempSync(path.join(os.tmpdir(), 'wl-installbridge-'));
  state.detected = new Set<string>();
  state.detectorThrows = false;
  state.bunPath = '/opt/bundled-bun/bun';
  state.installImpl = vi.fn(async (_agentId: string) => {});
});

afterEach(() => {
  rmSync(state.userData, { recursive: true, force: true });
});

describe('handleAgentInstallerStatus — the three-way distinction', () => {
  it('reports every catalogued agent, in catalogue order', async () => {
    const report = await handleAgentInstallerStatus();
    expect(report.agents.map((entry) => entry.agentId)).toEqual(Object.keys(AGENT_PACKAGES));
  });

  it('reports `absent` when there is no receipt and nothing on PATH', async () => {
    const kimi = agentIn(await handleAgentInstallerStatus(), 'kimi');
    expect(kimi.state).toBe('absent');
    expect(kimi.detectedOnPath).toBe(false);
    expect(kimi.managedInstall).toBeNull();
    expect(kimi.reason).toBe('prefix-missing');
    // The pinned version is what an install WOULD fetch — the consent copy needs
    // it before anything exists on disk.
    expect(kimi.pinnedVersion).toBe(AGENT_PACKAGES.kimi.version);
  });

  it('reports the destination an install WOULD use, even with nothing on disk', async () => {
    // Decision D2 makes the consent sheet name the destination BEFORE the
    // install runs — i.e. exactly when there is no receipt to read it from, so
    // `managedInstall.prefix` cannot be the source. Known positive first: the
    // prefix is genuinely absent, so this is not a path that already exists.
    const expected = path.join(state.userData, 'agents', 'kimi');
    expect(existsSync(expected)).toBe(false);

    const kimi = agentIn(await handleAgentInstallerStatus(), 'kimi');
    expect(kimi.managedInstall).toBeNull();
    expect(kimi.installPrefix).toBe(expected);
  });

  it('keeps installPrefix and the receipt prefix in agreement once installed', async () => {
    const prefix = layDownManagedKimi();
    const kimi = agentIn(await handleAgentInstallerStatus(), 'kimi');
    expect(kimi.installPrefix).toBe(prefix);
    expect(kimi.managedInstall?.prefix).toBe(prefix);
  });

  it('reports `installed` from a real receipt, with the receipt detail', async () => {
    const prefix = layDownManagedKimi();

    const kimi = agentIn(await handleAgentInstallerStatus(), 'kimi');
    expect(kimi.state).toBe('installed');
    expect(kimi.detectedOnPath).toBe(false);
    expect(kimi.reason).toBe('ok');
    expect(kimi.managedInstall).toEqual({
      prefix,
      version: '0.34.0',
      installedAt: '2026-08-11T00:00:00.000Z',
    });
  });

  it('reports `system` for a copy on PATH, with no receipt anywhere', async () => {
    state.detected = new Set(['codex']);

    const report = await handleAgentInstallerStatus();
    const codex = agentIn(report, 'codex');
    expect(codex.state).toBe('system');
    expect(codex.detectedOnPath).toBe(true);
    expect(codex.managedInstall).toBeNull();
    // Detection is per-agent, not a global flag.
    expect(agentIn(report, 'kimi').state).toBe('absent');
  });

  // D1. The two facts are independent, so both are reported: the state says the
  // system copy wins, and `managedInstall` still says Wayland has one — deleting
  // that would make an uninstall affordance impossible to render correctly.
  it('lets a detected system copy WIN over a valid Wayland install, without erasing it', async () => {
    layDownManagedKimi();
    state.detected = new Set(['kimi']);

    const kimi = agentIn(await handleAgentInstallerStatus(), 'kimi');
    expect(kimi.state).toBe('system');
    expect(kimi.detectedOnPath).toBe(true);
    expect(kimi.managedInstall).not.toBeNull();
  });

  it('reports a stale prefix as absent, naming the cause — a directory is not an install', async () => {
    mkdirSync(path.join(state.userData, 'agents', 'kimi'), { recursive: true });

    const kimi = agentIn(await handleAgentInstallerStatus(), 'kimi');
    expect(kimi.state).toBe('absent');
    expect(kimi.managedInstall).toBeNull();
    expect(kimi.reason).toBe('package-missing');
  });

  it('reports a package with no receipt as absent (receipt-missing), never as installed', async () => {
    const prefix = layDownManagedKimi();
    rmSync(path.join(prefix, RECEIPT_FILENAME));

    const kimi = agentIn(await handleAgentInstallerStatus(), 'kimi');
    expect(kimi.state).toBe('absent');
    expect(kimi.reason).toBe('receipt-missing');
  });

  // A receipt is necessary but NOT sufficient. Here the receipt is intact and
  // parses, and the launch target it names has been deleted — so `managedInstall`
  // must still be null: reporting a receipt as an install would put an "installed"
  // card on a agent that cannot start.
  it('reports a receipted install whose launch target is gone as absent, not installed', async () => {
    const prefix = layDownManagedKimi();
    rmSync(path.join(prefix, 'node_modules', ...KIMI_PKG.split('/'), 'dist', 'main.mjs'));

    const kimi = agentIn(await handleAgentInstallerStatus(), 'kimi');
    expect(kimi.reason).toBe('launch-target-missing');
    expect(kimi.managedInstall).toBeNull();
    expect(kimi.state).toBe('absent');
  });

  // `agent-installer:status` stays reachable by a paired remote WebUI (D7), and
  // the launch spec is an absolute executable path plus, in a dev build,
  // ELECTRON_RUN_AS_NODE=1. Nothing in the UI needs it, so it does not cross.
  it('does not put the launch spec on the wire', async () => {
    const prefix = layDownManagedKimi();

    // Known positive first: the string IS on disk, so the absence below is a
    // real result and not a search that could never have matched.
    expect(readFileSync(path.join(prefix, RECEIPT_FILENAME), 'utf-8')).toContain('ELECTRON_RUN_AS_NODE');

    const kimi = agentIn(await handleAgentInstallerStatus(), 'kimi');
    expect(Object.keys(kimi.managedInstall ?? {}).toSorted()).toEqual(['installedAt', 'prefix', 'version']);
    expect(JSON.stringify(kimi)).not.toContain('ELECTRON_RUN_AS_NODE');
  });

  it('reports bundledBunAvailable=false on a build that ships no bun', async () => {
    state.bunPath = null;
    expect((await handleAgentInstallerStatus()).bundledBunAvailable).toBe(false);

    state.bunPath = '/opt/bundled-bun/bun';
    expect((await handleAgentInstallerStatus()).bundledBunAvailable).toBe(true);
  });

  it('degrades to "no system copy" when the PATH probe throws, instead of failing the page', async () => {
    state.detectorThrows = true;

    const report = await handleAgentInstallerStatus();
    expect(report.agents.every((entry) => entry.detectedOnPath === false)).toBe(true);
  });
});

describe('handleInstallAgent', () => {
  it('installs and returns the refreshed status', async () => {
    state.installImpl = vi.fn(async () => {
      layDownManagedKimi();
    });

    const result = await handleInstallAgent({ agentId: 'kimi' });
    expect(result).toMatchObject({ ok: true, status: { agentId: 'kimi', state: 'installed' } });
    expect(state.installImpl).toHaveBeenCalledWith('kimi');
  });

  it('refuses an id outside the catalogue WITHOUT calling the installer', async () => {
    const result = await handleInstallAgent({ agentId: '../../Library/LaunchAgents' });
    expect(result).toEqual({ ok: false, reason: 'unknown-agent', message: expect.any(String) });
    expect(state.installImpl).not.toHaveBeenCalled();
  });

  it.each([
    ['no payload', undefined],
    ['null', null],
    ['agentId missing', {}],
    ['agentId not a string', { agentId: 7 }],
    ['agentId empty', { agentId: '' }],
  ])('refuses a malformed payload without calling the installer (%s)', async (_label, payload) => {
    expect(await handleInstallAgent(payload)).toEqual({ ok: false, reason: 'unknown-agent' });
    expect(state.installImpl).not.toHaveBeenCalled();
  });

  // Three different things the user must be told apart: this build cannot
  // install at all, the install ran and failed, something else went wrong.
  it('maps a build with no bundled bun to `bundled-bun-unavailable`', async () => {
    state.installImpl = vi.fn(async () => {
      throw new BundledBunUnavailableError('kimi');
    });

    expect(await handleInstallAgent({ agentId: 'kimi' })).toMatchObject({
      ok: false,
      reason: 'bundled-bun-unavailable',
    });
  });

  it('maps a non-zero install exit to `install-failed`', async () => {
    state.installImpl = vi.fn(async () => {
      throw new InstallCommandFailedError('kimi', 1, 'ENOTFOUND registry.npmjs.org');
    });

    const result = await handleInstallAgent({ agentId: 'kimi' });
    expect(result).toMatchObject({ ok: false, reason: 'install-failed' });
    expect(result.ok === false && result.message).toContain('ENOTFOUND');
  });

  it('maps anything unrecognised to `error` rather than throwing across the bridge', async () => {
    state.installImpl = vi.fn(async () => {
      throw new Error('disk on fire');
    });

    expect(await handleInstallAgent({ agentId: 'kimi' })).toMatchObject({ ok: false, reason: 'error' });
  });
});

describe('handleUninstallAgent', () => {
  it('removes exactly the receipted prefix and returns the refreshed status', async () => {
    const prefix = layDownManagedKimi();

    const result = await handleUninstallAgent({ agentId: 'kimi' });
    expect(result).toMatchObject({ ok: true, removed: true, status: { state: 'absent' } });
    expect(existsSync(prefix)).toBe(false);
  });

  // No receipt → nothing removed. That is the CORRECT outcome, reported as a
  // success with a named reason, not an error the UI would show as a failure.
  it('removes nothing, successfully, when there is no receipt', async () => {
    mkdirSync(path.join(state.userData, 'agents', 'kimi'), { recursive: true });

    const result = await handleUninstallAgent({ agentId: 'kimi' });
    expect(result).toMatchObject({ ok: true, removed: false, reason: 'receipt-missing' });
    expect(existsSync(path.join(state.userData, 'agents', 'kimi'))).toBe(true);
  });

  it('refuses an id outside the catalogue before touching the filesystem', async () => {
    const escape = path.join(state.userData, 'agents', '..', '..');
    expect(await handleUninstallAgent({ agentId: '../../Library' })).toMatchObject({
      ok: false,
      reason: 'unknown-agent',
    });
    expect(existsSync(escape)).toBe(true);
  });

  it.each([
    ['no payload', undefined],
    ['agentId not a string', { agentId: 7 }],
  ])('refuses a malformed payload (%s)', async (_label, payload) => {
    expect(await handleUninstallAgent(payload)).toEqual({ ok: false, reason: 'unknown-agent' });
  });
});
