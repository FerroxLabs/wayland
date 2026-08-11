/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Managed installs in the agent registry, and decision D1.
 *
 * Wayland installs into `<userData>/agents/<id>` and never puts anything on
 * PATH, so `AcpDetector` can never see a managed install: before this, an
 * install that genuinely succeeded left the agent ABSENT from the picker.
 *
 * D1 says a detected SYSTEM copy wins outright — never break a working setup.
 * That decision is made by merge ORDER plus the existing first-wins dedup, so
 * the tests below assert the observable consequence (which entry survives, and
 * whether it carries a launch descriptor) rather than the ordering itself.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { detectBuiltinAgents, listManagedAcpAgents } = vi.hoisted(() => ({
  detectBuiltinAgents: vi.fn(),
  listManagedAcpAgents: vi.fn(),
}));

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
vi.mock('@process/services/agentInstaller/installedAgentLaunch', () => ({ listManagedAcpAgents }));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn(async () => ({ getRemoteAgents: () => [] })) }));

import { agentRegistry } from '@process/agent/AgentRegistry';

const MANAGED_KIMI = {
  agentId: 'kimi',
  backend: 'kimi' as const,
  name: 'Kimi Code',
  acpArgs: ['acp'],
  launch: { command: '/data/agents/kimi/node_modules/@moonshot-ai/kimi-code/dist/main.mjs', args: [] },
};

const SYSTEM_KIMI = {
  id: 'kimi',
  name: 'Kimi Code',
  kind: 'acp' as const,
  available: true,
  backend: 'kimi',
  cliPath: 'kimi',
  acpArgs: ['acp'],
};

beforeEach(() => {
  detectBuiltinAgents.mockReset();
  listManagedAcpAgents.mockReset();
  detectBuiltinAgents.mockResolvedValue([]);
  listManagedAcpAgents.mockReturnValue([]);
});

describe('AgentRegistry — managed installs', () => {
  it('surfaces a managed install as a detected agent when nothing is on PATH', async () => {
    listManagedAcpAgents.mockReturnValue([MANAGED_KIMI]);
    await agentRegistry.refreshAll();

    const kimi = agentRegistry.getDetectedAgents().find((a) => a.backend === 'kimi');
    expect(kimi, 'a Wayland-installed agent must appear in the picker').toBeDefined();
    expect(agentRegistry.getManagedLaunchSpec('kimi')).toEqual(MANAGED_KIMI.launch);
  });

  it('D1: a system copy on PATH wins, and the launch spec is withheld so it keeps running', async () => {
    detectBuiltinAgents.mockResolvedValue([SYSTEM_KIMI]);
    listManagedAcpAgents.mockReturnValue([MANAGED_KIMI]);
    await agentRegistry.refreshAll();

    const kimi = agentRegistry.getDetectedAgents().find((a) => a.backend === 'kimi');
    // Positive assertion on WHICH entry survived, not merely on a count.
    expect(kimi).toMatchObject({ cliPath: 'kimi' });
    expect(agentRegistry.getManagedLaunchSpec('kimi')).toBeNull();
    // And exactly one entry, so the picker does not show the agent twice.
    expect(agentRegistry.getDetectedAgents().filter((a) => a.backend === 'kimi')).toHaveLength(1);
  });

  it('drops the managed entry once the install is gone', async () => {
    listManagedAcpAgents.mockReturnValue([MANAGED_KIMI]);
    await agentRegistry.refreshAll();
    expect(agentRegistry.getManagedLaunchSpec('kimi')).not.toBeNull();

    listManagedAcpAgents.mockReturnValue([]);
    await agentRegistry.refreshManagedAgents();
    expect(agentRegistry.getManagedLaunchSpec('kimi')).toBeNull();
    expect(agentRegistry.getDetectedAgents().find((a) => a.backend === 'kimi')).toBeUndefined();
  });

  it('picks a new install up without a full re-detection', async () => {
    await agentRegistry.refreshAll();
    expect(agentRegistry.getManagedLaunchSpec('kimi')).toBeNull();

    listManagedAcpAgents.mockReturnValue([MANAGED_KIMI]);
    await agentRegistry.refreshManagedAgents();
    expect(agentRegistry.getManagedLaunchSpec('kimi')).toEqual(MANAGED_KIMI.launch);
  });

  it('a receipt-read failure degrades to "no managed installs", it does not break detection', async () => {
    listManagedAcpAgents.mockImplementation(() => {
      throw new Error('unreadable profile');
    });
    await agentRegistry.refreshAll();

    // Known positive on the same call: detection still produced the always-present engines.
    expect(agentRegistry.getDetectedAgents().some((a) => a.backend === 'wcore')).toBe(true);
    expect(agentRegistry.getManagedLaunchSpec('kimi')).toBeNull();
    expect(agentRegistry.getLoadErrors().some((e) => e.startsWith('[managed]'))).toBe(true);
  });

  it('getManagedLaunchSpec answers null for a backend nobody detected', async () => {
    listManagedAcpAgents.mockReturnValue([MANAGED_KIMI]);
    await agentRegistry.refreshAll();
    // Positive control first: the known-present one IS found.
    expect(agentRegistry.getManagedLaunchSpec('kimi')).not.toBeNull();
    expect(agentRegistry.getManagedLaunchSpec('goose')).toBeNull();
  });
});

/**
 * D2 — an always-listed ACP stub must not shadow a real install of the same
 * backend. See the ordering rules on `AgentRegistry.deduplicate()`.
 *
 * This is a cross-branch tripwire. PR #950 (`feature/wayland-nano`) adds
 * `createWNanoAgent()`, an entry that is always listed and carries NEITHER
 * `cliPath` NOR `launch`, and merges it at index 1 — ahead of `builtinAgents`
 * and `managedAgents`. Under first-wins-by-backend dedup that stub becomes the
 * only `wnano` entry, so `getManagedLaunchSpec('wnano')` answers null and a
 * Wayland-installed Nano cannot be spawned: the receipt is written, valid, and
 * never read. Merged at the D2 slot instead, the stub is the fallback it was
 * meant to be and both changes compose.
 *
 * `wnano` is used by name deliberately: the backend does not exist on this
 * branch yet, so these assertions hold trivially today and turn RED the moment
 * #950 lands at the wrong position. `getManagedLaunchSpec` takes a plain string
 * and `listManagedAcpAgents` is mocked, so naming it needs no type change.
 */
const MANAGED_WNANO = {
  agentId: 'wnano',
  backend: 'wnano' as const,
  name: 'Wayland Nano',
  launch: { command: '/data/agents/wnano/wayland-nano', args: [] },
};

const SYSTEM_WNANO = {
  id: 'wnano',
  name: 'Wayland Nano',
  kind: 'acp' as const,
  available: true,
  backend: 'wnano',
  cliPath: 'wayland-nano',
  acpArgs: [],
};

describe('AgentRegistry — D2: an always-listed stub is the last resort for its backend', () => {
  it('a Wayland-installed Nano still resolves its launch spec', async () => {
    listManagedAcpAgents.mockReturnValue([MANAGED_KIMI, MANAGED_WNANO]);
    await agentRegistry.refreshAll();

    // Known positive on the same call: the pre-existing managed backend still
    // resolves, so a null below is the stub shadowing it and not a dead fixture.
    expect(agentRegistry.getManagedLaunchSpec('kimi')).toEqual(MANAGED_KIMI.launch);
    expect(
      agentRegistry.getManagedLaunchSpec('wnano'),
      'an always-listed built-in merged ahead of managedAgents makes a real install unlaunchable'
    ).toEqual(MANAGED_WNANO.launch);

    // And the merged entry itself is the launchable one, not a bare stub.
    const wnano = agentRegistry.getDetectedAgents().find((a) => a.backend === 'wnano');
    expect(wnano).toMatchObject({ launch: MANAGED_WNANO.launch });
    expect(agentRegistry.getDetectedAgents().filter((a) => a.backend === 'wnano')).toHaveLength(1);
  });

  it('D1 still wins over both: a system copy on PATH beats the install and the stub', async () => {
    detectBuiltinAgents.mockResolvedValue([SYSTEM_WNANO]);
    listManagedAcpAgents.mockReturnValue([MANAGED_WNANO]);
    await agentRegistry.refreshAll();

    const wnano = agentRegistry.getDetectedAgents().find((a) => a.backend === 'wnano');
    expect(wnano).toMatchObject({ cliPath: 'wayland-nano' });
    expect(agentRegistry.getManagedLaunchSpec('wnano')).toBeNull();
    expect(agentRegistry.getDetectedAgents().filter((a) => a.backend === 'wnano')).toHaveLength(1);
  });
});
