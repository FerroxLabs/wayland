/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const O_RDONLY = 0;
const O_RDWR = 2;

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
      open: vi.fn(async (file: string, flags: number) => {
        calls.push(`open:${file}:${flags}`);
        return {
          sync: async () => calls.push(`sync:${file}`),
          close: async () => calls.push(`close:${file}`),
        };
      }),
    },
    writeFileSync: vi.fn((file: string) => calls.push(`writeSync:${file}`)),
    renameSync: vi.fn((from: string, to: string) => calls.push(`renameSync:${from}->${to}`)),
    unlinkSync: vi.fn((file: string) => calls.push(`unlinkSync:${file}`)),
    openSync: vi.fn((file: string, flags: number) => {
      const fd = nextFd++;
      fdPaths.set(fd, file);
      calls.push(`openSync:${file}:${flags}`);
      return fd;
    }),
    fsyncSync: vi.fn((fd: number) => calls.push(`syncSync:${fdPaths.get(fd)}`)),
    closeSync: vi.fn((fd: number) => calls.push(`closeSync:${fdPaths.get(fd)}`)),
  };
});

vi.mock('fs', () => ({
  promises: mocks.promises,
  constants: { O_RDONLY: 0, O_RDWR: 2 },
  writeFileSync: mocks.writeFileSync,
  renameSync: mocks.renameSync,
  unlinkSync: mocks.unlinkSync,
  openSync: mocks.openSync,
  fsyncSync: mocks.fsyncSync,
  closeSync: mocks.closeSync,
}));

vi.mock('child_process', () => ({ execFileSync: vi.fn(), spawn: vi.fn() }));

import { writeFileAtomic, writeFileSyncAtomic } from '@process/utils/atomicWrite';

const realPlatform = process.platform;

/**
 * Drive the platform explicitly rather than inheriting the runner's, so both
 * branches are covered on every OS. Host-dependent assertions are what let the
 * Windows break below reach CI unseen: the POSIX-only expectations passed on
 * macOS and ubuntu while Windows failed on every single write.
 */
function setPlatform(value: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value, configurable: true });
}

describe('atomic state-write crash durability', () => {
  beforeEach(() => {
    mocks.calls.length = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    setPlatform(realPlatform);
  });

  describe('POSIX', () => {
    beforeEach(() => setPlatform('linux'));

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

    it('opens files read-only to flush them, so a read-only file can still be synced', async () => {
      await writeFileAtomic('/state/config.json', 'inert');
      expect(mocks.calls).toContain(`open:/state/config.json:${O_RDONLY}`);
    });
  });

  /**
   * Windows implements fsync as FlushFileBuffers, which demands GENERIC_WRITE.
   * An O_RDONLY handle fails EPERM (errno -4048), and a directory handle can
   * never satisfy it at all. Both facts are asserted here because violating
   * either one broke every state write on Windows, including
   * wayland-config.txt.
   */
  describe('Windows', () => {
    beforeEach(() => setPlatform('win32'));

    it('opens files read-write to flush them, because FlushFileBuffers needs write access', async () => {
      await writeFileAtomic('C:\\state\\config.json', 'inert');

      const tempOpen = mocks.calls.find((entry) => entry.startsWith('open:C:\\state\\config.json.tmp-'));
      expect(tempOpen).toMatch(new RegExp(`:${O_RDWR}$`));
      expect(mocks.calls).toContain(`open:C:\\state\\config.json:${O_RDWR}`);
      expect(mocks.calls).not.toContain(`open:C:\\state\\config.json:${O_RDONLY}`);
    });

    it('never attempts to flush the directory, which always fails EPERM there', async () => {
      await writeFileAtomic('C:\\state\\config.json', 'inert');

      // Neither the directory itself nor the `dir\.` spelling of it.
      expect(mocks.calls.filter((entry) => entry.startsWith('open:C:\\state:'))).toEqual([]);
      expect(mocks.calls.some((entry) => entry.includes('C:\\state\\.'))).toBe(false);
      expect(mocks.calls).not.toContain('sync:C:\\state');
      // The file-level flushes are still the durability guarantee.
      expect(mocks.calls).toContain('sync:C:\\state\\config.json');
    });

    it('applies both rules to synchronous writes', () => {
      writeFileSyncAtomic('C:\\state\\config.json', 'inert');

      expect(mocks.calls).toContain(`openSync:C:\\state\\config.json:${O_RDWR}`);
      expect(mocks.calls.filter((entry) => entry.startsWith('openSync:C:\\state:'))).toEqual([]);
      expect(mocks.calls).toContain('syncSync:C:\\state\\config.json');
      expect(mocks.calls).not.toContain('syncSync:C:\\state');
    });

    it('still writes, renames and flushes the temp file in the crash-safe order', () => {
      writeFileSyncAtomic('C:\\state\\config.json', 'inert');

      const renameIndex = mocks.calls.findIndex((entry) => entry.startsWith('renameSync:'));
      const tempSyncIndex = mocks.calls.findIndex((entry) => entry.startsWith('syncSync:C:\\state\\config.json.tmp-'));
      expect(tempSyncIndex).toBeGreaterThan(-1);
      expect(tempSyncIndex).toBeLessThan(renameIndex);
    });
  });
});
