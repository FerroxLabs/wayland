/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The seam for the three things the installer had none of: an in-flight fact on
 * the wire, a typed refusal for a second concurrent install, and a cancel.
 *
 * `installing` has to cross the bridge because it is the fact a component
 * re-mount destroys — the renderer's own activity map is session-local, so
 * without it the Install button re-enables mid-install.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  userData: '',
  inFlight: new Set<string>(),
  cancelled: [] as string[],
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ paths: { getDataDir: () => state.userData } }),
}));

vi.mock('@process/agent/acp/AcpDetector', () => ({
  acpDetector: { batchCheckCliAvailability: async () => new Set<string>() },
}));

vi.mock('@process/agent/AgentRegistry', () => ({
  agentRegistry: { refreshManagedAgents: vi.fn(async () => {}) },
}));

// PARTIAL mock: the status/receipt logic and every error class stay REAL.
vi.mock('@process/services/agentInstaller/installAgent', async () => {
  const actual = await vi.importActual<typeof import('@process/services/agentInstaller/installAgent')>(
    '@process/services/agentInstaller/installAgent'
  );
  return {
    ...actual,
    resolveBundledBunPath: () => '/opt/bundled-bun/bun',
    isAgentInstallInFlight: (agentId: string) => state.inFlight.has(agentId),
    cancelAgentInstall: (agentId: string) => {
      state.cancelled.push(agentId);
      return state.inFlight.delete(agentId);
    },
    installAgent: async (agentId: string) => {
      throw new actual.AgentInstallInProgressError(agentId);
    },
  };
});

import {
  handleAgentInstallerStatus,
  handleCancelAgentInstall,
  handleInstallAgent,
} from '@process/bridge/agentInstallerBridge';

beforeEach(() => {
  state.userData = mkdtempSync(path.join(os.tmpdir(), 'wayland-installer-cancel-'));
  state.inFlight = new Set();
  state.cancelled = [];
});

afterEach(() => {
  rmSync(state.userData, { recursive: true, force: true });
});

describe('agent-installer status reports the main-process in-flight fact', () => {
  it('says installing while an install is running', async () => {
    state.inFlight.add('kimi');
    const report = await handleAgentInstallerStatus();
    const kimi = report.agents.find((a) => a.agentId === 'kimi');
    expect(kimi?.installing).toBe(true);
    // Known positive on the same read: a non-running agent says false, so this
    // is not a field that is simply always true.
    expect(report.agents.find((a) => a.agentId === 'codex')?.installing).toBe(false);
  });

  it('says not installing on a clean profile', async () => {
    const report = await handleAgentInstallerStatus();
    expect(report.agents.every((a) => a.installing === false)).toBe(true);
  });
});

describe('agent-installer install refuses a second concurrent install', () => {
  it('maps the guard onto its own reason, NOT onto install-failed', async () => {
    // These are different things to a user: nothing went wrong, an install IS
    // running, and the card must wait rather than offer a Retry.
    const result = await handleInstallAgent({ agentId: 'kimi' });
    expect(result).toMatchObject({ ok: false, reason: 'already-installing' });
  });
});

describe('agent-installer cancel', () => {
  it('cancels a running install and reports it', async () => {
    state.inFlight.add('kimi');
    const result = await handleCancelAgentInstall({ agentId: 'kimi' });
    expect(result).toMatchObject({ ok: true, cancelled: true });
    expect(state.cancelled).toEqual(['kimi']);
  });

  it('is a correct no-op when nothing is running', async () => {
    const result = await handleCancelAgentInstall({ agentId: 'kimi' });
    // Not an error: the install may have finished between the click and here.
    expect(result).toMatchObject({ ok: true, cancelled: false });
  });

  it('refuses an id that is not in the catalogue before touching anything', async () => {
    expect(await handleCancelAgentInstall({ agentId: 'not-an-agent' })).toMatchObject({
      ok: false,
      reason: 'unknown-agent',
    });
    expect(await handleCancelAgentInstall({})).toMatchObject({ ok: false, reason: 'unknown-agent' });
    expect(state.cancelled).toEqual([]);
  });

  it('returns a fresh status alongside the outcome', async () => {
    state.inFlight.add('kimi');
    const result = await handleCancelAgentInstall({ agentId: 'kimi' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status.agentId).toBe('kimi');
  });
});
