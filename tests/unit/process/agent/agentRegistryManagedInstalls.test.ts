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
