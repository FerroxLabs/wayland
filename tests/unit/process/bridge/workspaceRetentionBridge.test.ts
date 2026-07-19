/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { previewProvider, collectDesktopManagedWorkspaceInventory } = vi.hoisted(() => ({
  previewProvider: vi.fn(),
  collectDesktopManagedWorkspaceInventory: vi.fn(async () => ({ marker: 'dry-run' })),
}));

vi.mock('@/common', () => ({
  ipcBridge: { workspaceRetention: { preview: { provider: previewProvider } } },
}));

vi.mock('@process/services/desktopManagedWorkspaceInventory', () => ({
  collectDesktopManagedWorkspaceInventory,
}));

import { initWorkspaceRetentionBridge } from '@process/bridge/workspaceRetentionBridge';

describe('workspaceRetentionBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers only a read-only preview over the injected authority sources', async () => {
    const sources = {
      listConversations: vi.fn(async () => []),
      listProjects: vi.fn(async () => []),
      listSchedules: vi.fn(async () => []),
      listActiveProcesses: vi.fn(() => []),
    };
    initWorkspaceRetentionBridge({ getWorkDir: () => '/managed/work', sources });

    expect(previewProvider).toHaveBeenCalledTimes(1);
    const handler = previewProvider.mock.calls[0][0] as (request?: unknown) => Promise<unknown>;
    await expect(handler()).resolves.toEqual({ marker: 'dry-run' });
    expect(collectDesktopManagedWorkspaceInventory).toHaveBeenCalledWith({
      workDir: '/managed/work',
      sources,
    });
  });

  it.each([
    { root: '/attacker/selected' },
    { path: '/managed/work/target' },
    { disposition: 'review-candidate' },
    { action: 'delete' },
    { action: 'quarantine' },
    { action: 'prune' },
    { [['quarantine', 'Eligible'].join('')]: true },
    {},
  ])('rejects every renderer-supplied preview payload %#', async (request) => {
    initWorkspaceRetentionBridge({
      getWorkDir: () => '/managed/work',
      sources: {
        listConversations: async () => [],
        listProjects: async () => [],
        listSchedules: async () => [],
        listActiveProcesses: () => [],
      },
    });

    const handler = previewProvider.mock.calls[0][0] as (request?: unknown) => Promise<unknown>;
    await expect(handler(request)).rejects.toThrow('does not accept request fields');
    expect(collectDesktopManagedWorkspaceInventory).not.toHaveBeenCalled();
  });
});
