/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AcpApprovalStore, createAcpApprovalKey } from '../../src/process/agent/acp/ApprovalStore';

const mockGet = vi.fn();
const mockSet = vi.fn();

vi.mock('@process/utils/initStorage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@process/utils/initStorage')>();
  return {
    ...actual,
    ProcessConfig: {
      ...actual.ProcessConfig,
      get: (...args: unknown[]) => mockGet(...args),
      set: (...args: unknown[]) => mockSet(...args),
    },
  };
});

// Flush the microtask queue so fire-and-forget persist()/clear() writes settle
// before assertions run.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AcpApprovalStore persistence (#672)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    mockGet.mockResolvedValue(undefined);
    mockSet.mockResolvedValue(undefined);
  });

  const key = createAcpApprovalKey({ kind: 'execute', title: 'run', rawInput: { command: 'ls' } });

  it('does not touch disk when constructed without a workspace', async () => {
    const store = new AcpApprovalStore();
    store.put(key, 'allow_always');
    await flush();

    expect(mockGet).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
    expect(store.isApprovedForSession(key)).toBe(true);
  });

  it('persists an allow_always decision under the workspace key', async () => {
    const store = new AcpApprovalStore('/repo/a');
    store.put(key, 'allow_always');
    await flush();

    expect(mockSet).toHaveBeenCalledTimes(1);
    const [configKey, value] = mockSet.mock.calls[0];
    expect(configKey).toBe('acp.approvals');
    expect(Object.keys(value['/repo/a'])).toHaveLength(1);
  });

  it('does not persist non allow_always decisions', async () => {
    const store = new AcpApprovalStore('/repo/a');
    store.put(key, 'allow_once');
    await flush();

    expect(mockSet).not.toHaveBeenCalled();
    expect(store.isApprovedForSession(key)).toBe(false);
  });

  it('rehydrates a persisted decision on load()', async () => {
    const serialized = JSON.stringify({ kind: 'execute', title: 'run', rawInput: { command: 'ls' } });
    mockGet.mockResolvedValue({ '/repo/a': { [serialized]: 'allow_always' } });

    const store = new AcpApprovalStore('/repo/a');
    expect(store.isApprovedForSession(key)).toBe(false); // not loaded yet

    await store.load();

    expect(store.isApprovedForSession(key)).toBe(true);
  });

  it('load() is a no-op without a workspace', async () => {
    const store = new AcpApprovalStore();
    await store.load();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('clear() removes the workspace entry on disk and empties the in-memory map', async () => {
    mockGet.mockResolvedValue({ '/repo/a': { foo: 'allow_always' }, '/repo/b': { bar: 'allow_always' } });

    const store = new AcpApprovalStore('/repo/a');
    store.put(key, 'allow_always');
    await flush();
    mockSet.mockClear();

    store.clear();
    await flush();

    expect(store.size).toBe(0);
    expect(mockSet).toHaveBeenCalledTimes(1);
    const [, value] = mockSet.mock.calls[0];
    expect(value).toEqual({ '/repo/b': { bar: 'allow_always' } });
  });
});
