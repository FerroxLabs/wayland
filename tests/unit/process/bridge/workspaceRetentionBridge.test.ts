/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { previewProvider, collectDesktopManagedWorkspaceInventory } = vi.hoisted(() => ({
  previewProvider: vi.fn(),
  collectDesktopManagedWorkspaceInventory: vi.fn(async () => ({
    generatedAt: '2026-07-16T00:00:00.000Z',
    root: '/managed/work',
    canonicalRoot: '/managed/work',
    authorityCompleteness: {
      conversation: 'complete',
      project: 'complete',
      schedule: 'complete',
      artifact: 'unavailable',
      receipt: 'unavailable',
      'active-process': 'complete',
      provenance: 'unavailable',
      snapshot: 'unavailable',
    },
    complete: false,
    entries: [],
    summary: { discovered: 0, preserved: 0, reviewCandidate: 0, unknown: 0 },
    errors: [],
  })),
}));

vi.mock('@/common', () => ({
  ipcBridge: { workspaceRetention: { preview: { provider: previewProvider } } },
}));

vi.mock('@process/services/desktopManagedWorkspaceInventory', () => ({
  collectDesktopManagedWorkspaceInventory,
}));

import { initWorkspaceRetentionBridge } from '@process/bridge/workspaceRetentionBridge';

/** The user's TIER-2 review window. Distinctive so the assertion below proves
 *  the bridge actually forwards it rather than defaulting internally. */
const REVIEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

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
    const loadProvenance = vi.fn(async () => ({ state: 'unavailable' as const, records: [] as [], errors: [] }));
    initWorkspaceRetentionBridge({
      getWorkDir: () => '/managed/work',
      getInstallationId: () => 'desktop-test-installation',
      getRetentionWindowMs: async () => REVIEW_WINDOW_MS,
      loadProvenance,
      sources,
    });

    expect(previewProvider).toHaveBeenCalledTimes(1);
    const handler = previewProvider.mock.calls[0][0] as (request?: unknown) => Promise<unknown>;
    await expect(handler()).resolves.toMatchObject({ root: '/managed/work', complete: false });
    expect(collectDesktopManagedWorkspaceInventory).toHaveBeenCalledWith({
      workDir: '/managed/work',
      installationId: 'desktop-test-installation',
      retentionWindowMs: REVIEW_WINDOW_MS,
      sources: { ...sources, loadProvenance },
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
      getInstallationId: () => 'desktop-test-installation',
      getRetentionWindowMs: async () => REVIEW_WINDOW_MS,
      loadProvenance: async () => ({ state: 'unavailable', records: [], errors: [] }),
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
