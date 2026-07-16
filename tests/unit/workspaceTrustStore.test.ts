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

  it('defaults to chat (fail-safe) for an unknown workspace and before hydration', async () => {
    const s = await freshStore();
    expect(s.getWorkspaceTrustSync('/some/ws')).toBe('chat');
    expect(s.isWorkspaceTrusted('/some/ws')).toBe(false);
    expect(s.getWorkspaceTrustSync(undefined)).toBe('chat');
  });

  it('set + get round-trips and persists to ProcessConfig', async () => {
    const s = await freshStore();
    await s.setWorkspaceTrust('/work/proj', 'cowork');
    expect(s.getWorkspaceTrustSync('/work/proj')).toBe('cowork');
    expect(s.isWorkspaceTrusted('/work/proj')).toBe(true);
    // persisted under the workspace.trustLevel key so it survives restart
    expect(store['workspace.trustLevel']).toBeTruthy();
  });

  it('hydrates the cache from persisted config on startup', async () => {
    // Simulate a prior session's persisted grant, then a fresh process.
    const s1 = await freshStore();
    await s1.setWorkspaceTrust('/persisted/ws', 'cowork');
    const persisted = store['workspace.trustLevel'];

    // New process: cache empty, but the persisted config is present.
    const s2 = await freshStore();
    store['workspace.trustLevel'] = persisted; // survives "restart"
    expect(s2.getWorkspaceTrustSync('/persisted/ws')).toBe('chat'); // not yet hydrated
    await s2.hydrateWorkspaceTrust();
    expect(s2.getWorkspaceTrustSync('/persisted/ws')).toBe('cowork');
  });

  it('normalizes trailing-slash to one key but does NOT case-fold (no over-trust)', async () => {
    const s = await freshStore();
    await s.setWorkspaceTrust('/Work/Proj/', 'cowork');
    // path.resolve collapses the trailing slash → same key.
    expect(s.getWorkspaceTrustSync('/Work/Proj')).toBe('cowork');
    // Case-fold is intentionally NOT applied: on a case-sensitive volume a
    // different-case path is a DIFFERENT directory, so it must re-prompt (safe),
    // never inherit the grant (over-trust would be the wrong failure direction).
    expect(s.getWorkspaceTrustSync('/work/proj')).toBe('chat');
  });

  it('serializes concurrent sets for different workspaces without losing a persisted key', async () => {
    const s = await freshStore();
    await Promise.all([s.setWorkspaceTrust('/ws/a', 'cowork'), s.setWorkspaceTrust('/ws/b', 'cowork')]);
    // Without a serialized read-modify-write the second set would clobber the
    // first's key on disk, leaving ONE entry; both must survive. Assert on the
    // persisted map's shape (count + values) rather than literal keys, since the
    // normalized key is platform-dependent (path.resolve yields C:\ws\a on win32).
    const persisted = (store['workspace.trustLevel'] ?? {}) as Record<string, string>;
    expect(Object.keys(persisted)).toHaveLength(2);
    expect(Object.values(persisted).every((v) => v === 'cowork')).toBe(true);
    // Per-workspace reads round-trip through normalize on both sides (platform-agnostic).
    expect(s.getWorkspaceTrustSync('/ws/a')).toBe('cowork');
    expect(s.getWorkspaceTrustSync('/ws/b')).toBe('cowork');
  });

  it('flipping back to chat re-gates the workspace', async () => {
    const s = await freshStore();
    await s.setWorkspaceTrust('/ws', 'cowork');
    expect(s.isWorkspaceTrusted('/ws')).toBe(true);
    await s.setWorkspaceTrust('/ws', 'chat');
    expect(s.isWorkspaceTrusted('/ws')).toBe(false);
  });

  it('a tampered persisted value never reads as trusted', async () => {
    const s = await freshStore();
    store['workspace.trustLevel'] = { '/evil/ws': 'trusted-please' };
    await s.hydrateWorkspaceTrust();
    expect(s.getWorkspaceTrustSync('/evil/ws')).toBe('chat');
  });

  it('a no-op workspace (empty/undefined) never persists or trusts', async () => {
    const s = await freshStore();
    await s.setWorkspaceTrust(undefined, 'cowork');
    await s.setWorkspaceTrust('', 'cowork');
    expect(store['workspace.trustLevel']).toBeUndefined();
  });
});
