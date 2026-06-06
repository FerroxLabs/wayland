/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.6.3-test',
  },
}));

// eslint-disable-next-line import/first
import {
  ijfwCacheKey,
  moveWithExdevFallback,
  writeAtomic,
} from '@process/services/ijfw/atomicFile';

function mktemp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-atomic-'));
}

describe('ijfw/atomicFile', () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mktemp();
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  describe('writeAtomic', () => {
    it('writes content to the target file', async () => {
      const target = path.join(workDir, 'hello.txt');
      await writeAtomic(target, 'hello');
      expect(fs.readFileSync(target, 'utf-8')).toBe('hello');
    });

    it('creates parent directories', async () => {
      const target = path.join(workDir, 'a', 'b', 'c', 'deep.txt');
      await writeAtomic(target, 'nested');
      expect(fs.readFileSync(target, 'utf-8')).toBe('nested');
    });

    it('uses a same-dir temp file', async () => {
      // We can observe the tmp via spying on rename - the source must be in the
      // same directory as the destination.
      const renameSpy = vi.spyOn(fs.promises, 'rename');
      const target = path.join(workDir, 'samedir.txt');
      await writeAtomic(target, 'data');
      const calls = renameSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const [src, dst] = calls[calls.length - 1] as [string, string];
      expect(path.dirname(src)).toBe(path.dirname(dst));
      renameSpy.mockRestore();
    });

    it('calls fdatasync (FileHandle.sync) before rename', async () => {
      const events: string[] = [];
      const realOpen = fs.promises.open;
      const openSpy = vi.spyOn(fs.promises, 'open').mockImplementation(async (...args) => {
        const handle = await realOpen.apply(fs.promises, args as Parameters<typeof realOpen>);
        const origSync = handle.sync.bind(handle);
        const origClose = handle.close.bind(handle);
        handle.sync = async () => {
          events.push('sync');
          return origSync();
        };
        handle.close = async () => {
          events.push('close');
          return origClose();
        };
        return handle;
      });
      const realRename = fs.promises.rename;
      const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (src, dst) => {
        events.push('rename');
        return realRename(src as string, dst as string);
      });

      const target = path.join(workDir, 'ordered.txt');
      await writeAtomic(target, 'sequence');

      const syncIdx = events.indexOf('sync');
      const closeIdx = events.indexOf('close');
      const renameIdx = events.indexOf('rename');
      expect(syncIdx).toBeGreaterThanOrEqual(0);
      expect(syncIdx).toBeLessThan(closeIdx);
      expect(closeIdx).toBeLessThan(renameIdx);

      openSpy.mockRestore();
      renameSpy.mockRestore();
    });

    it('temp file does not appear at the target on a partial write before rename', async () => {
      // We can't truly kill the process mid-write in a unit test, but we can
      // verify that after a failure mid-write, the target file is NOT
      // populated with the partial content.
      const target = path.join(workDir, 'partial.txt');
      // Inject a failure: spy sync to throw, ensure no rename occurs.
      const realOpen = fs.promises.open;
      const openSpy = vi.spyOn(fs.promises, 'open').mockImplementation(async (...args) => {
        const handle = await realOpen.apply(fs.promises, args as Parameters<typeof realOpen>);
        handle.sync = async () => {
          throw new Error('forced sync failure');
        };
        return handle;
      });
      await expect(writeAtomic(target, 'should-not-appear')).rejects.toThrow(/forced sync failure/);
      expect(fs.existsSync(target)).toBe(false);
      openSpy.mockRestore();
    });
  });

  describe('moveWithExdevFallback', () => {
    it('renames within the same filesystem on the happy path', async () => {
      const src = path.join(workDir, 'src.txt');
      const dst = path.join(workDir, 'dst.txt');
      fs.writeFileSync(src, 'hello');
      await moveWithExdevFallback(src, dst);
      expect(fs.existsSync(src)).toBe(false);
      expect(fs.readFileSync(dst, 'utf-8')).toBe('hello');
    });

    it('falls back to copy+rm on EXDEV', async () => {
      const src = path.join(workDir, 'src.txt');
      const dst = path.join(workDir, 'dst.txt');
      fs.writeFileSync(src, 'exdev-content');

      const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async () => {
        const err = new Error('cross-device link') as NodeJS.ErrnoException;
        err.code = 'EXDEV';
        throw err;
      });

      await moveWithExdevFallback(src, dst);

      expect(fs.existsSync(src)).toBe(false);
      expect(fs.readFileSync(dst, 'utf-8')).toBe('exdev-content');
      renameSpy.mockRestore();
    });

    it('re-throws non-EXDEV errors', async () => {
      const src = path.join(workDir, 'src.txt');
      const dst = path.join(workDir, 'dst.txt');
      fs.writeFileSync(src, 'x');

      const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async () => {
        const err = new Error('access denied') as NodeJS.ErrnoException;
        err.code = 'EACCES';
        throw err;
      });

      await expect(moveWithExdevFallback(src, dst)).rejects.toThrow(/access denied/);
      renameSpy.mockRestore();
    });

    it('recursively copies a directory on EXDEV fallback', async () => {
      const srcDir = path.join(workDir, 'src');
      const dstDir = path.join(workDir, 'dst');
      fs.mkdirSync(path.join(srcDir, 'sub'), { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'a.txt'), 'one');
      fs.writeFileSync(path.join(srcDir, 'sub', 'b.txt'), 'two');

      const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async () => {
        const err = new Error('cross-device') as NodeJS.ErrnoException;
        err.code = 'EXDEV';
        throw err;
      });

      await moveWithExdevFallback(srcDir, dstDir);

      expect(fs.existsSync(srcDir)).toBe(false);
      expect(fs.readFileSync(path.join(dstDir, 'a.txt'), 'utf-8')).toBe('one');
      expect(fs.readFileSync(path.join(dstDir, 'sub', 'b.txt'), 'utf-8')).toBe('two');
      renameSpy.mockRestore();
    });
  });

  describe('ijfwCacheKey', () => {
    it('returns a 16-char lowercase hex string', () => {
      const key = ijfwCacheKey();
      expect(key).toMatch(/^[0-9a-f]{16}$/);
    });

    it('is deterministic for the same versions', () => {
      const a = ijfwCacheKey();
      const b = ijfwCacheKey();
      expect(a).toBe(b);
    });
  });
});
