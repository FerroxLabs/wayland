/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * An install nothing re-detects is still invisible.
 *
 * Wayland installs into `<userData>/agents/<id>` and never puts anything on
 * PATH, so the agent registry can only learn about a new install by re-reading
 * receipts. Without that re-read the user installs an agent, the card flips to
 * "Installed by Wayland", and the agent still does not appear in the picker
 * until the next full detection pass — which is the shape of the original bug.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ userData: '', refreshCalls: 0 }));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ paths: { getDataDir: () => state.userData } }),
}));

vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: { batchCheckCliAvailability: async () => new Set<string>() },
}));

vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: {
    refreshManagedAgents: vi.fn(async () => {
      state.refreshCalls += 1;
    }),
  },
}));

vi.mock('@process/services/agentInstaller/installAgent', async () => {
  const actual = await vi.importActual<typeof import('@process/services/agentInstaller/installAgent')>(
    '@process/services/agentInstaller/installAgent'
  );
  return { ...actual, resolveBundledBunPath: () => '/opt/bundled-bun/bun', installAgent: async () => {} };
});

import { AGENT_PACKAGES } from '@process/services/agentInstaller/agentPackages';
import { writeInstallReceipt } from '@process/services/agentInstaller/installManifest';
import { handleInstallAgent, handleUninstallAgent } from '@process/bridge/agentInstallerBridge';

const KIMI_PKG = AGENT_PACKAGES.kimi.npmPackage;

function write(file: string, contents: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf-8');
}

function layDownManagedKimi(): void {
  const prefix = path.join(state.userData, 'agents', 'kimi');
  write(path.join(prefix, 'node_modules', ...KIMI_PKG.split('/'), 'package.json'), '{"name":"kimi"}');
  const command = path.join(prefix, 'node_modules', ...KIMI_PKG.split('/'), 'dist', 'main.mjs');
  write(command, 'export {};\n');
  writeInstallReceipt({
    agentId: 'kimi',
    npmPackage: KIMI_PKG,
    version: AGENT_PACKAGES.kimi.version,
    prefix,
    launchSpec: { command, args: [] },
    installedAt: '2026-08-11T00:00:00.000Z',
  });
}

beforeEach(() => {
  state.userData = mkdtempSync(path.join(os.tmpdir(), 'wayland-installer-refresh-'));
  state.refreshCalls = 0;
});

afterEach(() => {
  rmSync(state.userData, { recursive: true, force: true });
});

describe('detection is refreshed around install/uninstall', () => {
  it('re-reads managed installs after a successful install', async () => {
    const result = await handleInstallAgent({ agentId: 'kimi' });
    expect(result.ok).toBe(true);
    expect(state.refreshCalls).toBe(1);
  });

  it('re-reads managed installs after an uninstall, so a removed agent stops being offered', async () => {
    layDownManagedKimi();
    const result = await handleUninstallAgent({ agentId: 'kimi' });
    expect(result).toMatchObject({ ok: true, removed: true });
    expect(state.refreshCalls).toBe(1);
  });

  it('does not refresh for an id that was refused outright', async () => {
    // Known positive above: a real install DOES refresh, so a zero here is a
    // real zero and not a broken observation.
    expect(await handleInstallAgent({ agentId: 'not-an-agent' })).toMatchObject({ ok: false });
    expect(state.refreshCalls).toBe(0);
  });
});
