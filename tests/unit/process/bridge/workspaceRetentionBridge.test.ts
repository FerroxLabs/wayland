/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The retention preview provider MAY NOT REJECT.
 *
 * `buildProvider(...).invoke` in @office-ai/platform is
 * `new Promise(function (resolve) { ... })` - no reject, no timeout - and the
 * provider half calls `handler(data).then(cb)` with no `.catch`. Proven by
 * execution against the installed package: a resolving provider settled in 1ms,
 * a throwing provider never settled at all.
 *
 * So a `throw` in this provider is not an error the renderer can catch. It is a
 * promise that never settles. `ManagedWorkspacesCard.refresh` sets
 * `setLoading(true)`, awaits, and neither its `catch` nor its `finally` ever
 * runs: the Storage settings card spins forever, with no message and no
 * "Try again". This product has shipped three hangs exactly this way.
 *
 * Every refusal below therefore RESOLVES with a classified
 * `{ ok: false, errorCode }` - the pattern already proven in the tree at
 * `speechToTextBridge.ts:44-55`.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const REPORT = {
  generatedAt: '2026-07-16T00:00:00.000Z',
  root: '/managed/work',
  canonicalRoot: '/managed/work',
  authorityCompleteness: {
    conversation: 'complete',
    project: 'complete',
    schedule: 'complete',
    artifact: 'complete',
    receipt: 'unavailable',
    'active-process': 'complete',
    provenance: 'unavailable',
    snapshot: 'unavailable',
  },
  complete: false,
  entries: [],
  summary: { discovered: 0, preserved: 0, reviewCandidate: 0, unknown: 0 },
  errors: [],
};

const { previewProvider, collectDesktopManagedWorkspaceInventory } = vi.hoisted(() => ({
  previewProvider: vi.fn(),
  collectDesktopManagedWorkspaceInventory: vi.fn(async () => REPORT),
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

const DEPS = () => ({
  getWorkDir: () => '/managed/work',
  getInstallationId: async () => 'desktop-test-installation',
  getRetentionWindowMs: async () => REVIEW_WINDOW_MS,
  loadProvenance: async () => ({ state: 'unavailable' as const, records: [] as [], errors: [] as string[] }),
  sources: {
    listConversations: async () => [],
    listProjects: async () => [],
    listSchedules: async () => [],
    listActiveProcesses: () => [],
  },
});

const registeredHandler = (): ((request?: unknown) => Promise<unknown>) =>
  previewProvider.mock.calls[0][0] as (request?: unknown) => Promise<unknown>;

/**
 * The single fact every case here depends on: the handler SETTLES. A rejection
 * is indistinguishable from a hang once it crosses the real bridge, so the
 * assertion is written against `Promise.race` with a sentinel rather than
 * against `.resolves`, which would also be satisfied by a rejection being
 * caught somewhere upstream.
 */
async function settledValue(promise: Promise<unknown>): Promise<unknown> {
  const HUNG = Symbol('hung');
  return Promise.race([
    promise.catch((error) => ({ REJECTED: error instanceof Error ? error.message : String(error) })),
    new Promise((resolve) => setTimeout(() => resolve(HUNG), 50)),
  ]);
}

describe('workspaceRetentionBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collectDesktopManagedWorkspaceInventory.mockResolvedValue(REPORT);
  });

  it('registers only a read-only preview over the injected authority sources', async () => {
    const deps = DEPS();
    initWorkspaceRetentionBridge(deps);

    expect(previewProvider).toHaveBeenCalledTimes(1);
    await expect(registeredHandler()()).resolves.toMatchObject({
      ok: true,
      report: { root: '/managed/work', complete: false },
    });
    expect(collectDesktopManagedWorkspaceInventory).toHaveBeenCalledWith({
      workDir: '/managed/work',
      installationId: 'desktop-test-installation',
      retentionWindowMs: REVIEW_WINDOW_MS,
      sources: { ...deps.sources, loadProvenance: deps.loadProvenance },
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
  ])('REFUSES every renderer-supplied preview payload without rejecting %#', async (request) => {
    initWorkspaceRetentionBridge(DEPS());

    // Not `.rejects.toThrow(...)`: a throw here never settles at the renderer,
    // so asserting a rejection would pin the hang in place as if it were the
    // contract. The refusal has to arrive as a value.
    expect(await settledValue(registeredHandler()(request))).toEqual({ ok: false, errorCode: 'invalid-request' });
    expect(collectDesktopManagedWorkspaceInventory).not.toHaveBeenCalled();
  });

  it('classifies a collector failure instead of hanging the settings card', async () => {
    collectDesktopManagedWorkspaceInventory.mockRejectedValue(new Error('work root unavailable'));
    initWorkspaceRetentionBridge(DEPS());

    expect(await settledValue(registeredHandler()())).toEqual({ ok: false, errorCode: 'inventory-unavailable' });
  });

  it('classifies a dependency failure instead of hanging the settings card', async () => {
    const deps = { ...DEPS(), getInstallationId: async () => Promise.reject(new Error('no install id')) };
    initWorkspaceRetentionBridge(deps as never);

    expect(await settledValue(registeredHandler()())).toEqual({ ok: false, errorCode: 'inventory-unavailable' });
  });

  it('classifies an unprovable report instead of hanging the settings card', async () => {
    collectDesktopManagedWorkspaceInventory.mockResolvedValue({ ...REPORT, summary: undefined } as never);
    initWorkspaceRetentionBridge(DEPS());

    expect(await settledValue(registeredHandler()())).toEqual({ ok: false, errorCode: 'inventory-unprovable' });
  });

  /**
   * The prune lane's refusal, executed rather than asserted from the source.
   *
   * The phase-1 wire gate in `parseManagedWorkspaceInventoryReport` rejects ANY
   * report that carries a review candidate, because the immutable-snapshot and
   * receipt authorities have no producer, so no directory's emptiness is
   * provable. This bridge is the only door that inventory can leave the process
   * by, and this case pins that an incomplete inventory carrying an actionable
   * candidate leaves as a REFUSAL, not as a report a deleter could act on.
   */
  it('refuses to hand out an incomplete inventory that carries a review candidate', async () => {
    collectDesktopManagedWorkspaceInventory.mockResolvedValue({
      ...REPORT,
      summary: { discovered: 1, preserved: 0, reviewCandidate: 1, unknown: 0 },
      entries: [
        {
          path: '/managed/work/wayland-temp-1736900000000',
          canonicalPath: '/managed/work/wayland-temp-1736900000000',
          evidence: {
            managedProvenance: true,
            inventoryComplete: true,
            referenceCount: 0,
            scheduleCount: 0,
            activeProcessCount: 0,
            artifactCount: 0,
            userPromoted: false,
            userContent: 'absent',
            modified: false,
            abandonedForMs: 2678400000,
            retentionWindowMs: REVIEW_WINDOW_MS,
          },
          decision: {
            disposition: 'review-candidate',
            classifications: ['empty-abandoned'],
            reasons: ['empty-abandoned'],
          },
          references: [],
          errors: [],
        },
      ],
    } as never);
    initWorkspaceRetentionBridge(DEPS());

    const settled = await settledValue(registeredHandler()());
    expect(settled).toEqual({ ok: false, errorCode: 'inventory-unprovable' });
    expect(JSON.stringify(settled)).not.toContain('review-candidate');
  });
});
