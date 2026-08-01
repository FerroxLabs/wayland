/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';

const storage = vi.hoisted(() => ({
  current: [] as IMcpServer[],
  tail: Promise.resolve() as Promise<unknown>,
  get: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: storage.get, update: storage.update },
}));

import {
  compareAndSetMcpConfig,
  mcpConfigRevision,
  readMcpConfigSnapshot,
  updateMcpConfig,
} from '@process/services/mcpServices/mcpConfigAuthority';

function server(id: string, updatedAt: number): IMcpServer {
  return {
    id,
    name: id,
    enabled: false,
    transport: { type: 'stdio', command: 'inert', args: [] },
    createdAt: updatedAt,
    updatedAt,
    originalJson: '{}',
  };
}

describe('MCP config main-process mutation authority', () => {
  beforeEach(() => {
    storage.current = [];
    storage.tail = Promise.resolve();
    storage.get.mockReset().mockImplementation(async () => structuredClone(storage.current));
    storage.update
      .mockReset()
      .mockImplementation((_key: string, updater: (current: IMcpServer[]) => Promise<IMcpServer[]>) => {
        const operation = storage.tail.then(async () => {
          storage.current = structuredClone(await updater(structuredClone(storage.current)));
          return storage.current;
        });
        storage.tail = operation.catch(() => {});
        return operation;
      });
  });

  it('serializes concurrent renderer and main-process functional mutations without loss', async () => {
    await Promise.all([
      updateMcpConfig((current) => [...current, server('renderer', 1)]),
      updateMcpConfig((current) => [...current, server('main', 2)]),
    ]);

    expect(storage.current.map(({ id }) => id)).toEqual(['renderer', 'main']);
  });

  it('rejects a stale full-snapshot replacement and preserves the newer record', async () => {
    storage.current = [server('initial', 1)];
    const stale = await readMcpConfigSnapshot();
    await updateMcpConfig((current) => [...current, server('newer', 2)]);

    const result = await compareAndSetMcpConfig(stale.revision, [server('replacement', 3)]);

    expect(result.applied).toBe(false);
    expect(result.snapshot.revision).toBe(mcpConfigRevision(storage.current));
    expect(storage.current.map(({ id }) => id)).toEqual(['initial', 'newer']);
  });

  it('rejects malformed compare-and-set input before touching durable state', async () => {
    storage.current = [server('initial', 1)];

    await expect(compareAndSetMcpConfig('not-a-revision', [server('replacement', 2)])).rejects.toThrow(
      'Invalid MCP config revision'
    );
    await expect(
      compareAndSetMcpConfig(mcpConfigRevision(storage.current), null as unknown as IMcpServer[])
    ).rejects.toThrow('MCP config replacement must be an array');

    expect(storage.update).not.toHaveBeenCalled();
    expect(storage.current.map(({ id }) => id)).toEqual(['initial']);
  });
});
