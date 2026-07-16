/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory ProcessConfig stand-in: the store reads/writes exactly one key
// ('workspace.trustLevel'), so a plain object models it faithfully.
const store: Record<string, unknown> = {};
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async (key: string) => store[key]),
    set: vi.fn(async (key: string, value: unknown) => {
      store[key] = value;
    }),
  },
}));
vi.mock('@process/utils/mainLogger', () => ({
  mainError: vi.fn(),
  mainLog: vi.fn(),
}));

// Import AFTER the mocks so the module binds to the mocked ProcessConfig. The
// store keeps a process-global in-memory cache, so we reset both between tests
// via resetModules + a fresh import.
async function freshStore() {
  vi.resetModules();
  for (const k of Object.keys(store)) delete store[k];
  return import('@process/permissions/workspaceTrust');
}

describe('WorkspaceTrustStore (#671)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to ask (fail-safe) for an unknown workspace and before hydration', async () => {
    const s = await freshStore();
    expect(s.getWorkspaceAccessSync('/some/ws')).toBe('ask');
    expect(s.isWorkspaceTrusted('/some/ws')).toBe(false);
    expect(s.getWorkspaceAccessSync(undefined)).toBe('ask');
  });

  it('set + get round-trips and persists to ProcessConfig', async () => {
    const s = await freshStore();
    await s.setWorkspaceAccess('/work/proj', 'trusted-edits');
    expect(s.getWorkspaceAccessSync('/work/proj')).toBe('trusted-edits');
    expect(s.isWorkspaceTrusted('/work/proj')).toBe(true);
    // persisted under the workspace.trustLevel key so it survives restart
    expect(store['workspace.trustLevel']).toBeTruthy();
  });

  it('hydrates the cache from persisted config on startup', async () => {
    // Simulate a prior session's persisted grant, then a fresh process.
    const s1 = await freshStore();
    await s1.setWorkspaceAccess('/persisted/ws', 'trusted-edits');
    const persisted = store['workspace.trustLevel'];

    // New process: cache empty, but the persisted config is present.
    const s2 = await freshStore();
    store['workspace.trustLevel'] = persisted; // survives "restart"
    expect(s2.getWorkspaceAccessSync('/persisted/ws')).toBe('ask'); // not yet hydrated
    await s2.hydrateWorkspaceTrust();
    expect(s2.getWorkspaceAccessSync('/persisted/ws')).toBe('trusted-edits');
  });

  it('hydrates legacy chat/cowork values into canonical access levels', async () => {
    const s = await freshStore();
    store['workspace.trustLevel'] = { '/legacy/trusted': 'cowork', '/legacy/gated': 'chat' };

    await s.hydrateWorkspaceTrust();

    expect(s.getWorkspaceAccessSync('/legacy/trusted')).toBe('trusted-edits');
    expect(s.getWorkspaceAccessSync('/legacy/gated')).toBe('ask');
    expect(s.isWorkspaceTrusted('/legacy/trusted')).toBe(true);
  });

  it('normalizes trailing-slash to one key but does NOT case-fold (no over-trust)', async () => {
    const s = await freshStore();
    await s.setWorkspaceAccess('/Work/Proj/', 'trusted-edits');
    // path.resolve collapses the trailing slash → same key.
    expect(s.getWorkspaceAccessSync('/Work/Proj')).toBe('trusted-edits');
    // Case-fold is intentionally NOT applied: on a case-sensitive volume a
    // different-case path is a DIFFERENT directory, so it must re-prompt (safe),
    // never inherit the grant (over-trust would be the wrong failure direction).
    expect(s.getWorkspaceAccessSync('/work/proj')).toBe('ask');
  });

  it('serializes concurrent sets for different workspaces without losing a persisted key', async () => {
    const s = await freshStore();
    await Promise.all([s.setWorkspaceAccess('/ws/a', 'trusted-edits'), s.setWorkspaceAccess('/ws/b', 'trusted-edits')]);
    // Without a serialized read-modify-write the second set would clobber the
    // first's key on disk, leaving ONE entry; both must survive. Assert on the
    // persisted map's shape (count + values) rather than literal keys, since the
    // normalized key is platform-dependent (path.resolve yields C:\ws\a on win32).
    const persisted = (store['workspace.trustLevel'] ?? {}) as Record<string, string>;
    expect(Object.keys(persisted)).toHaveLength(2);
    expect(Object.values(persisted).every((v) => v === 'trusted-edits')).toBe(true);
    // Per-workspace reads round-trip through normalize on both sides (platform-agnostic).
    expect(s.getWorkspaceAccessSync('/ws/a')).toBe('trusted-edits');
    expect(s.getWorkspaceAccessSync('/ws/b')).toBe('trusted-edits');
  });

  it('migrates the complete legacy map on the next access write', async () => {
    const s = await freshStore();
    store['workspace.trustLevel'] = { '/legacy/a': 'cowork', '/legacy/b': 'chat' };

    // The chosen value is semantically unchanged. The write must still replace
    // every legacy label with the canonical vocabulary.
    await s.setWorkspaceAccess('/legacy/a', 'trusted-edits');

    expect(Object.values(store['workspace.trustLevel'] as Record<string, string>).toSorted()).toEqual([
      'ask',
      'trusted-edits',
    ]);
  });

  it('flipping back to ask re-gates the workspace', async () => {
    const s = await freshStore();
    await s.setWorkspaceAccess('/ws', 'trusted-edits');
    expect(s.isWorkspaceTrusted('/ws')).toBe(true);
    await s.setWorkspaceAccess('/ws', 'ask');
    expect(s.isWorkspaceTrusted('/ws')).toBe(false);
  });

  it('a tampered persisted value never reads as trusted', async () => {
    const s = await freshStore();
    store['workspace.trustLevel'] = { '/evil/ws': 'trusted-please' };
    await s.hydrateWorkspaceTrust();
    expect(s.getWorkspaceAccessSync('/evil/ws')).toBe('ask');
  });

  it('a no-op workspace (empty/undefined) never persists or trusts', async () => {
    const s = await freshStore();
    await s.setWorkspaceAccess(undefined, 'trusted-edits');
    await s.setWorkspaceAccess('', 'trusted-edits');
    expect(store['workspace.trustLevel']).toBeUndefined();
  });
});
