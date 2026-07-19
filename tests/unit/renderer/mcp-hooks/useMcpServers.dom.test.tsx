/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import { useMcpServers } from '@renderer/hooks/mcp/useMcpServers';

const mocks = vi.hoisted(() => ({
  persisted: [] as IMcpServer[],
  failNextWrite: false,
  get: vi.fn(),
  set: vi.fn(),
  getExtensionServers: vi.fn(),
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: mocks.get,
    set: mocks.set,
  },
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    extensions: {
      getMcpServers: { invoke: mocks.getExtensionServers },
    },
  },
}));

function server(id: string, updatedAt: number): IMcpServer {
  return {
    id,
    name: id,
    enabled: false,
    source: 'custom',
    transport: { type: 'stdio', command: 'echo', args: [] },
    createdAt: updatedAt,
    updatedAt,
    originalJson: '{}',
  };
}

describe('useMcpServers durable mutation queue', () => {
  beforeEach(() => {
    mocks.persisted = [];
    mocks.failNextWrite = false;
    mocks.get.mockReset().mockImplementation(async () => mocks.persisted);
    mocks.set.mockReset().mockImplementation(async (_key: string, next: IMcpServer[]) => {
      if (mocks.failNextWrite) {
        mocks.failNextWrite = false;
        throw new Error('storage unavailable');
      }
      mocks.persisted = next;
    });
    mocks.getExtensionServers.mockReset().mockResolvedValue([]);
  });

  it('does not publish a renderer state that failed durable persistence', async () => {
    const initial = server('initial', 1);
    mocks.persisted = [initial];
    const { result } = renderHook(() => useMcpServers());
    await waitFor(() => expect(result.current.mcpServers).toEqual([initial]));

    mocks.failNextWrite = true;
    await expect(
      act(async () => {
        await result.current.saveMcpServers([server('unsaved', 2)]);
      })
    ).rejects.toThrow('storage unavailable');

    expect(mocks.persisted).toEqual([initial]);
    expect(result.current.mcpServers).toEqual([initial]);
  });

  it('serializes functional writes across hook instances and broadcasts the durable result', async () => {
    const first = renderHook(() => useMcpServers());
    const second = renderHook(() => useMcpServers());
    await waitFor(() => expect(mocks.getExtensionServers).toHaveBeenCalledTimes(2));

    await act(async () => {
      await Promise.all([
        first.result.current.saveMcpServers((current) => [...current, server('one', 1)]),
        second.result.current.saveMcpServers((current) => [...current, server('two', 2)]),
      ]);
    });

    expect(mocks.persisted.map(({ id }) => id)).toEqual(['one', 'two']);
    expect(first.result.current.mcpServers.map(({ id }) => id)).toEqual(['one', 'two']);
    expect(second.result.current.mcpServers.map(({ id }) => id)).toEqual(['one', 'two']);
  });
});
