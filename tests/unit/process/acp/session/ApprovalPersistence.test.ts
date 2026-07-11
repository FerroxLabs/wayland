/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #672: durable, per-workspace persistence for ACP "allow always" approvals.
 * These tests drive the store against an in-memory ProcessConfig stand-in and
 * prove a grant survives a "restart" (a fresh read), is workspace-scoped, and
 * fails soft.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory ProcessConfig stand-in (a real restart = the same JSON file re-read).
const store = new Map<string, unknown>();
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async (key: string) => store.get(key)),
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
      return value;
    }),
  },
}));
vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainError: vi.fn(),
}));

import {
  loadWorkspaceApprovals,
  saveWorkspaceApproval,
  clearWorkspaceApprovals,
} from '@process/acp/session/ApprovalPersistence';

const WS_A = '/home/user/project-a';
const WS_B = '/home/user/project-b';
const KEY = JSON.stringify({ kind: 'execute', title: 'bash', rawInput: { command: 'ls' } });

beforeEach(() => store.clear());
afterEach(() => vi.clearAllMocks());

describe('ApprovalPersistence (#672)', () => {
  it('a saved grant is returned on a fresh load (survives restart)', async () => {
    await saveWorkspaceApproval(WS_A, KEY, 'allow_always');
    // Fresh read = the store the next app launch would rehydrate from.
    expect(await loadWorkspaceApprovals(WS_A)).toEqual([[KEY, 'allow_always']]);
  });

  it('is workspace-scoped: a grant in A is not visible in B', async () => {
    await saveWorkspaceApproval(WS_A, KEY, 'allow_always');
    expect(await loadWorkspaceApprovals(WS_B)).toEqual([]);
  });

  it('accumulates multiple grants in one workspace without dropping earlier ones', async () => {
    const KEY2 = JSON.stringify({ kind: 'execute', title: 'bash', rawInput: { command: 'git status' } });
    await saveWorkspaceApproval(WS_A, KEY, 'allow_always');
    await saveWorkspaceApproval(WS_A, KEY2, 'allow_always');
    const loaded = await loadWorkspaceApprovals(WS_A);
    expect(loaded).toHaveLength(2);
    expect(Object.fromEntries(loaded)).toEqual({ [KEY]: 'allow_always', [KEY2]: 'allow_always' });
  });

  it('clearWorkspaceApprovals removes a workspace and leaves others intact', async () => {
    await saveWorkspaceApproval(WS_A, KEY, 'allow_always');
    await saveWorkspaceApproval(WS_B, KEY, 'allow_always');
    await clearWorkspaceApprovals(WS_A);
    expect(await loadWorkspaceApprovals(WS_A)).toEqual([]);
    expect(await loadWorkspaceApprovals(WS_B)).toEqual([[KEY, 'allow_always']]);
  });

  it('an undefined workspace is a no-op for save and returns empty for load', async () => {
    await saveWorkspaceApproval(undefined, KEY, 'allow_always');
    expect(store.size).toBe(0);
    expect(await loadWorkspaceApprovals(undefined)).toEqual([]);
  });

  it('a redundant save of the same value does not rewrite config', async () => {
    const { ProcessConfig } = await import('@process/utils/initStorage');
    await saveWorkspaceApproval(WS_A, KEY, 'allow_always');
    const writesAfterFirst = vi.mocked(ProcessConfig.set).mock.calls.length;
    await saveWorkspaceApproval(WS_A, KEY, 'allow_always'); // identical - should skip
    expect(vi.mocked(ProcessConfig.set).mock.calls.length).toBe(writesAfterFirst);
  });
});
