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
  revision: 0,
  failNextWrite: false,
  getSnapshot: vi.fn(),
  compareAndSet: vi.fn(),
  getExtensionServers: vi.fn(),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  mcpService: {
    getMcpConfigSnapshot: { invoke: mocks.getSnapshot },
    compareAndSetMcpConfig: { invoke: mocks.compareAndSet },
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
    mocks.revision = 0;
    mocks.failNextWrite = false;
    mocks.getSnapshot.mockReset().mockImplementation(async () => ({
      success: true,
      data: { revision: String(mocks.revision), servers: structuredClone(mocks.persisted) },
    }));
    mocks.compareAndSet
      .mockReset()
      .mockImplementation(async (input: { expectedRevision: string; nextServers: IMcpServer[] }) => {
        if (mocks.failNextWrite) {
          mocks.failNextWrite = false;
          return { success: false, msg: 'storage unavailable' };
        }
        if (input.expectedRevision !== String(mocks.revision)) {
          return {
            success: true,
            data: {
              applied: false,
              snapshot: { revision: String(mocks.revision), servers: structuredClone(mocks.persisted) },
            },
          };
        }
        mocks.persisted = structuredClone(input.nextServers);
        mocks.revision += 1;
        return {
          success: true,
          data: {
            applied: true,
            snapshot: { revision: String(mocks.revision), servers: structuredClone(mocks.persisted) },
          },
        };
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

  it('retries against a main-process mutation instead of overwriting it', async () => {
    const hook = renderHook(() => useMcpServers());
    await waitFor(() => expect(mocks.getExtensionServers).toHaveBeenCalled());
    const mainProcessServer = server('main-process', 2);
    let conflicted = false;
    mocks.compareAndSet.mockImplementationOnce(async () => {
      conflicted = true;
      mocks.persisted = [mainProcessServer];
      mocks.revision += 1;
      return {
        success: true,
        data: {
          applied: false,
          snapshot: { revision: String(mocks.revision), servers: structuredClone(mocks.persisted) },
        },
      };
    });

    await act(async () => {
      await hook.result.current.saveMcpServers((current) => [...current, server('renderer', 3)]);
    });

    expect(conflicted).toBe(true);
    expect(mocks.persisted.map(({ id }) => id)).toEqual(['main-process', 'renderer']);
    expect(hook.result.current.mcpServers.map(({ id }) => id)).toEqual(['main-process', 'renderer']);
  });
});

/**
 * N2 fallout guard. Denying `mcp.compare-and-set-config` to a paired browser
 * made a pre-existing renderer bug reachable: the one-time `source` migration
 * runs on the READ path, and when it fired, the hook published the list ONLY
 * via the write's snapshot. A refused write therefore left the connector list
 * EMPTY - and the mount effect's own `.catch` swallowed the throw, so it was
 * silent. `useMcpServers` also backs the chat composer's add menu, not just
 * Settings, so an empty array there is not a one-page problem.
 *
 * A profile whose servers all already carry `source` never reproduces it, which
 * is why this needs a server WITHOUT one: any modern dev profile is a false
 * negative.
 */
describe('N2 - a refused migration write must not blank the connector list', () => {
  it('still exposes servers when the source-migration write fails', async () => {
    // A pre-Library server: no `source`, so `migrateExistingServers` must tag it
    // and the write path is taken. This is the control for the whole test - with
    // `source` already set, nothing writes and the assertion proves nothing.
    const legacy = { ...server('legacy-fs', 10) } as Partial<IMcpServer>;
    delete legacy.source;
    mocks.persisted = [legacy as IMcpServer];
    mocks.failNextWrite = true;

    const { result } = renderHook(() => useMcpServers());

    await waitFor(() => {
      expect(result.current.mcpServers).toHaveLength(1);
    });
    expect(result.current.mcpServers[0]).toMatchObject({ id: 'legacy-fs', source: 'custom' });
    // The write really was attempted and really did fail - otherwise this test
    // passes for the wrong reason.
    expect(mocks.compareAndSet).toHaveBeenCalled();
  });
});
