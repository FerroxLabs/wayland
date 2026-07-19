/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const calls: string[] = [];
  let nextFd = 10;
  const fdPaths = new Map<number, string>();
  return {
    calls,
    promises: {
      writeFile: vi.fn(async (file: string) => calls.push(`write:${file}`)),
      rename: vi.fn(async (from: string, to: string) => calls.push(`rename:${from}->${to}`)),
      unlink: vi.fn(async (file: string) => calls.push(`unlink:${file}`)),
      open: vi.fn(async (file: string) => ({
        sync: async () => calls.push(`sync:${file}`),
        close: async () => calls.push(`close:${file}`),
      })),
    },
    writeFileSync: vi.fn((file: string) => calls.push(`writeSync:${file}`)),
    renameSync: vi.fn((from: string, to: string) => calls.push(`renameSync:${from}->${to}`)),
    unlinkSync: vi.fn((file: string) => calls.push(`unlinkSync:${file}`)),
    openSync: vi.fn((file: string) => {
      const fd = nextFd++;
      fdPaths.set(fd, file);
      calls.push(`openSync:${file}`);
      return fd;
    }),
    fsyncSync: vi.fn((fd: number) => calls.push(`syncSync:${fdPaths.get(fd)}`)),
    closeSync: vi.fn((fd: number) => calls.push(`closeSync:${fdPaths.get(fd)}`)),
  };
});

vi.mock('fs', () => ({
  promises: mocks.promises,
  constants: { O_RDONLY: 0 },
  writeFileSync: mocks.writeFileSync,
  renameSync: mocks.renameSync,
  unlinkSync: mocks.unlinkSync,
  openSync: mocks.openSync,
  fsyncSync: mocks.fsyncSync,
  closeSync: mocks.closeSync,
}));

vi.mock('child_process', () => ({ execFileSync: vi.fn(), spawn: vi.fn() }));

import { writeFileAtomic, writeFileSyncAtomic } from '@process/utils/atomicWrite';

describe('atomic state-write crash durability', () => {
  beforeEach(() => {
    mocks.calls.length = 0;
    vi.clearAllMocks();
  });

  it('syncs the temporary file before rename and the destination directory after rename', async () => {
    await writeFileAtomic('/state/config.json', 'inert');

    const renameIndex = mocks.calls.findIndex((entry) => entry.startsWith('rename:'));
    const tempSyncIndex = mocks.calls.findIndex((entry) => entry.startsWith('sync:/state/config.json.tmp-'));
    const targetSyncIndex = mocks.calls.indexOf('sync:/state/config.json');
    const directorySyncIndex = mocks.calls.indexOf('sync:/state');
    expect(tempSyncIndex).toBeGreaterThan(-1);
    expect(tempSyncIndex).toBeLessThan(renameIndex);
    expect(targetSyncIndex).toBeGreaterThan(renameIndex);
    expect(directorySyncIndex).toBeGreaterThan(targetSyncIndex);
  });

  it('applies the same file and directory sync ordering for synchronous writes', () => {
    writeFileSyncAtomic('/state/config.json', 'inert');

    const renameIndex = mocks.calls.findIndex((entry) => entry.startsWith('renameSync:'));
    const tempSyncIndex = mocks.calls.findIndex((entry) => entry.startsWith('syncSync:/state/config.json.tmp-'));
    const targetSyncIndex = mocks.calls.indexOf('syncSync:/state/config.json');
    const directorySyncIndex = mocks.calls.indexOf('syncSync:/state');
    expect(tempSyncIndex).toBeGreaterThan(-1);
    expect(tempSyncIndex).toBeLessThan(renameIndex);
    expect(targetSyncIndex).toBeGreaterThan(renameIndex);
    expect(directorySyncIndex).toBeGreaterThan(targetSyncIndex);
  });
});
