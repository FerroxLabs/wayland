/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Red-team confinement coverage for the fs IPC providers that previously
 * skipped path confinement (createZip, copyFilesToWorkspace, getFileMetadata,
 * getFilesByDir, listWorkspaceFiles, getImageBase64).
 *
 * For each handler we assert two things:
 *   1. An out-of-root path (e.g. /etc/passwd) is REJECTED - confinePath
 *      returns null, the handler fails closed, and no fs read/write occurs on
 *      that path.
 *   2. A legitimate in-root path still succeeds - the handler operates on the
 *      confined (sanitized) path the same way it did before.
 *
 * Strategy: `ipcBridge.fs.*.provider(fn)` is mocked to capture each registered
 * handler callback into a registry, so we can invoke handlers directly with
 * `fs/promises` and `./pathConfinement` mocked. confinePath is configured to
 * mirror real fail-closed semantics: in-root paths pass through, everything
 * else returns null.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// In-root prefix for the test. confinePath mirrors the real fail-closed
// contract: a path inside the authorized root resolves; anything else is null.
const ROOT = '/workspace/project';

// Hoisted shared mocks (vi.mock factories are hoisted above imports, so any
// value they reference must also be hoisted).
const h = vi.hoisted(() => {
  const handlers: Record<string, (params: unknown) => unknown> = {};
  const fsMock = {
    stat: vi.fn(),
    lstat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    copyFile: vi.fn(),
    access: vi.fn(),
    rm: vi.fn(),
    unlink: vi.fn(),
    rename: vi.fn(),
    readdir: vi.fn(),
    realpath: vi.fn(),
  };
  const confinePath = vi.fn();
  const readDirectoryRecursive = vi.fn();
  // User-approved write destinations (dialog/desktop-approved). createZip
  // accepts a destination that is in an authorized root OR inside one of these,
  // and writes the RESOLVED (realpath-collapsed) form the gate returns.
  const approvedDirectories: string[] = [];
  const resolveWithinApprovedDirectory = vi.fn();
  return { handlers, fsMock, confinePath, readDirectoryRecursive, approvedDirectories, resolveWithinApprovedDirectory };
});
const handlers = h.handlers;
const fsMock = h.fsMock;
const confinePath = h.confinePath;
const readDirectoryRecursive = h.readDirectoryRecursive;
const approvedDirectories = h.approvedDirectories;
// Maps an approved-but-symlinked destination path to its realpath-collapsed
// target, so the gate mock can model resolveWithinApprovedDirectory returning
// the real path (used by the symlink-escape red-team case).
const approvedRealpaths = new Map<string, string>();

// --- Capture registered provider handlers ----------------------------------
vi.mock('@/common', () => {
  const makeProvider = (key: string) => ({
    provider: (fn: (params: unknown) => unknown) => {
      h.handlers[key] = fn;
    },
  });
  return {
    ipcBridge: {
      fs: new Proxy(
        {},
        {
          get: (_target, prop: string) => makeProvider(prop),
        }
      ),
      fileStream: {
        contentUpdate: { emit: vi.fn() },
      },
    },
  };
});

// --- Mock confinePath / registerAuthorizedRoot -----------------------------
vi.mock('../../../src/process/bridge/pathConfinement', () => ({
  confinePath: (raw: unknown, opts?: { allowOutsideRoots?: boolean }) => h.confinePath(raw, opts),
  registerAuthorizedRoot: vi.fn(),
}));

// --- Mock the user-approved-destination allowlist --------------------------
// createZip now accepts an out-of-root destination only when the user approved
// it via the native dialog / Desktop default. The renderer cannot populate this
// set, so an arbitrary out-of-root destination still fails closed.
vi.mock('../../../src/process/bridge/userApprovedPaths', () => ({
  registerApprovedDirectory: vi.fn((dir: string) => {
    if (typeof dir === 'string' && dir.length > 0) h.approvedDirectories.push(dir);
  }),
  resolveWithinApprovedDirectory: (target: unknown) => h.resolveWithinApprovedDirectory(target),
}));

// --- Mock fs/promises ------------------------------------------------------
vi.mock('fs/promises', () => ({ default: h.fsMock, ...h.fsMock }));

// --- Mock the remaining heavy deps so the module loads ---------------------
vi.mock('@process/utils', () => ({
  readDirectoryRecursive: (dir: string) => h.readDirectoryRecursive(dir),
}));
vi.mock('@process/utils/initStorage', () => ({
  getSystemDir: () => ({ cacheDir: '/tmp/cache', workDir: '/tmp/work' }),
  getAssistantsDir: () => '/tmp/assistants',
  getSkillsDir: () => '/tmp/skills',
  getBuiltinSkillsCopyDir: () => '/tmp/builtin-skills',
  getAutoSkillsDir: () => '/tmp/auto-skills',
  ProcessConfig: { get: vi.fn().mockResolvedValue(false) },
}));
vi.mock('@process/utils/atomicWrite', () => ({ writeFileAtomic: vi.fn() }));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn() }));
vi.mock('@process/extensions/ExtensionRegistry', () => ({
  ExtensionRegistry: {
    getInstance: () => ({ getSkills: (): unknown[] => [], getAssistants: (): unknown[] => [] }),
  },
}));
vi.mock('jszip', () => {
  return {
    default: class JSZip {
      file = vi.fn();
      generateAsync = vi.fn().mockResolvedValue(Buffer.from('zip'));
    },
  };
});
vi.mock('@/common/config/constants', () => ({ WAYLAND_TIMESTAMP_SEPARATOR: '__ts__' }));

import { initFsBridge } from '../../../src/process/bridge/fsBridge';

const OUT = '/etc/passwd';
const SECRET = '/root/.ssh/id_rsa';

beforeEach(() => {
  vi.clearAllMocks();
  confinePath.mockImplementation(
    async (raw: unknown, opts?: { allowOutsideRoots?: boolean }): Promise<string | null> => {
      if (typeof raw !== 'string') return null;
      // Model the real sensitive-segment guard: a secret location is rejected
      // regardless of allowOutsideRoots.
      if (raw === SECRET || raw.includes('/.ssh/')) return null;
      if (raw === ROOT || raw.startsWith(`${ROOT}/`)) return raw;
      // An explicit user gesture (drag-drop/paste/dialog) authorizes a source
      // outside the static roots; everything else fails closed.
      if (opts?.allowOutsideRoots) return raw;
      return null;
    }
  );
  // Approved-directory allowlist starts empty; a destination is approved only
  // when it sits inside a directory the test explicitly pushes (mirroring a
  // user dialog/desktop approval). The gate returns the RESOLVED path - tests
  // can register a symlink->real mapping so the realpath-collapsed form is what
  // createZip writes (TOCTOU / symlink-follow defense).
  approvedDirectories.length = 0;
  approvedRealpaths.clear();
  h.resolveWithinApprovedDirectory.mockImplementation((target: unknown): string | null => {
    if (typeof target !== 'string') return null;
    const inside = approvedDirectories.some((dir) => target === dir || target.startsWith(`${dir}/`));
    if (!inside) return null;
    // Collapse a registered in-approved-dir symlink to its real target so the
    // returned path is the realpath, mirroring resolveWithinApprovedDirectory.
    return approvedRealpaths.get(target) ?? target;
  });
  // Re-register handlers from a clean slate.
  for (const k of Object.keys(handlers)) delete handlers[k];
  initFsBridge();
});

describe('fsBridge confinement red-team', () => {
  describe('getFilesByDir', () => {
    it('rejects an out-of-root directory and never reads it', async () => {
      const result = await handlers.getFilesByDir({ dir: OUT });
      expect(result).toEqual([]);
      expect(readDirectoryRecursive).not.toHaveBeenCalled();
    });

    it('reads a legitimate in-root directory', async () => {
      readDirectoryRecursive.mockResolvedValue({ name: 'project', children: [] });
      const result = await handlers.getFilesByDir({ dir: ROOT });
      expect(readDirectoryRecursive).toHaveBeenCalledWith(ROOT);
      expect(result).toEqual([{ name: 'project', children: [] }]);
    });
  });

  describe('listWorkspaceFiles', () => {
    it('rejects an out-of-root root and never enumerates it', async () => {
      const result = await handlers.listWorkspaceFiles({ root: SECRET });
      expect(result).toEqual([]);
      expect(fsMock.stat).not.toHaveBeenCalled();
      expect(fsMock.readdir).not.toHaveBeenCalled();
    });

    it('lists a legitimate in-root workspace', async () => {
      fsMock.stat.mockResolvedValue({ isDirectory: () => true });
      fsMock.readdir.mockResolvedValue([]);
      const result = await handlers.listWorkspaceFiles({ root: ROOT });
      expect(Array.isArray(result)).toBe(true);
      expect(fsMock.stat).toHaveBeenCalled();
    });
  });

  describe('getImageBase64', () => {
    it('rejects an out-of-root image path and never reads it', async () => {
      // Use an allowlisted extension so the rejection is purely the confinement.
      const result = await handlers.getImageBase64({ path: '/etc/secret.png' });
      expect(typeof result).toBe('string');
      expect(result as string).toMatch(/^data:image\/svg\+xml;base64,/); // PLACEHOLDER
      expect(fsMock.readFile).not.toHaveBeenCalled();
    });

    it('reads a legitimate in-root image', async () => {
      fsMock.readFile.mockResolvedValue('aW1n'); // base64
      const result = await handlers.getImageBase64({ path: `${ROOT}/pic.png` });
      expect(fsMock.readFile).toHaveBeenCalledWith(`${ROOT}/pic.png`, { encoding: 'base64' });
      expect(result).toBe('data:image/png;base64,aW1n');
    });
  });

  describe('getFileMetadata', () => {
    it('rejects an out-of-root path and never stats it', async () => {
      const result = (await handlers.getFileMetadata({ path: SECRET })) as { size: number };
      expect(result.size).toBe(-1); // empty-metadata sentinel
      expect(fsMock.stat).not.toHaveBeenCalled();
    });

    it('returns identical empty metadata for missing in-root and rejected out-of-root (no oracle)', async () => {
      fsMock.stat.mockRejectedValueOnce(Object.assign(new Error('nope'), { code: 'ENOENT' }));
      const inRootMissing = (await handlers.getFileMetadata({ path: `${ROOT}/missing.txt` })) as {
        size: number;
        lastModified: number;
      };
      const outOfRoot = (await handlers.getFileMetadata({ path: SECRET })) as {
        size: number;
        lastModified: number;
      };
      expect(inRootMissing.size).toBe(outOfRoot.size);
      expect(inRootMissing.lastModified).toBe(outOfRoot.lastModified);
    });

    it('stats a legitimate in-root file', async () => {
      fsMock.stat.mockResolvedValue({ size: 42, mtime: new Date(1000) });
      const result = (await handlers.getFileMetadata({ path: `${ROOT}/a.txt` })) as { size: number };
      expect(fsMock.stat).toHaveBeenCalledWith(`${ROOT}/a.txt`);
      expect(result.size).toBe(42);
    });
  });

  describe('createZip', () => {
    it('rejects out-of-root source files and never reads them', async () => {
      const result = await handlers.createZip({
        path: `${ROOT}/out.zip`,
        files: [{ name: 'leak', sourcePath: SECRET }],
        requestId: 'r1',
      });
      // No source read happened; destination write still ran (empty zip).
      expect(fsMock.readFile).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('rejects an out-of-root, unapproved zip destination and never writes it', async () => {
      // Neither in an authorized root nor in any user-approved directory: the
      // arbitrary-write primitive a compromised renderer would reach for stays
      // closed (RT-R1-03 / RT-F1-02).
      const result = await handlers.createZip({
        path: '/etc/cron.d/evil.zip',
        files: [{ name: 'a.txt', content: 'hi' }],
        requestId: 'r2',
      });
      expect(result).toBe(false);
      expect(fsMock.writeFile).not.toHaveBeenCalled();
    });

    it('writes an out-of-root destination the user approved via the dialog/desktop', async () => {
      // The export feature targets a folder the user picked through the native
      // dialog (or the Desktop default) - outside the authorized roots, but
      // write-eligible because main approved it.
      approvedDirectories.push('/Users/me/Desktop');
      fsMock.mkdir.mockResolvedValue(undefined);
      fsMock.writeFile.mockResolvedValue(undefined);
      const result = await handlers.createZip({
        path: '/Users/me/Desktop/export.zip',
        files: [{ name: 'a.txt', content: 'hi' }],
        requestId: 'r2b',
      });
      expect(result).toBe(true);
      expect(fsMock.writeFile).toHaveBeenCalledWith('/Users/me/Desktop/export.zip', expect.anything());
    });

    it('writes the realpath-collapsed destination, not a symlinked one (TOCTOU defense)', async () => {
      // The renderer hands an approved-dir destination that is actually a
      // symlink pointing OUTSIDE the approved dir. resolveWithinApprovedDirectory
      // collapses it to the real target; createZip must mkdir/write that real
      // path, never the unresolved symlink form. This is the RT fix: the path
      // validated == the path written.
      approvedDirectories.push('/Users/me/Desktop');
      approvedRealpaths.set('/Users/me/Desktop/export.zip', '/Users/me/Desktop/.real/export.zip');
      fsMock.mkdir.mockResolvedValue(undefined);
      fsMock.writeFile.mockResolvedValue(undefined);
      const result = await handlers.createZip({
        path: '/Users/me/Desktop/export.zip',
        files: [{ name: 'a.txt', content: 'hi' }],
        requestId: 'r2c',
      });
      expect(result).toBe(true);
      // mkdir + writeFile both operate on the realpath-collapsed form.
      expect(fsMock.mkdir).toHaveBeenCalledWith('/Users/me/Desktop/.real', expect.anything());
      expect(fsMock.writeFile).toHaveBeenCalledWith('/Users/me/Desktop/.real/export.zip', expect.anything());
      // The unresolved symlink path is never written.
      expect(fsMock.writeFile).not.toHaveBeenCalledWith('/Users/me/Desktop/export.zip', expect.anything());
    });

    it('bundles a legitimate in-root source and writes an in-root destination', async () => {
      fsMock.lstat.mockResolvedValue({ isFile: () => true, isSymbolicLink: () => false });
      fsMock.readFile.mockResolvedValue(Buffer.from('data'));
      fsMock.mkdir.mockResolvedValue(undefined);
      fsMock.writeFile.mockResolvedValue(undefined);
      const result = await handlers.createZip({
        path: `${ROOT}/out.zip`,
        files: [{ name: 'a.txt', sourcePath: `${ROOT}/a.txt` }],
        requestId: 'r3',
      });
      expect(fsMock.readFile).toHaveBeenCalledWith(`${ROOT}/a.txt`, expect.anything());
      expect(fsMock.writeFile).toHaveBeenCalledWith(`${ROOT}/out.zip`, expect.anything());
      expect(result).toBe(true);
    });
  });

  describe('copyFilesToWorkspace', () => {
    it('rejects an out-of-root workspace and never copies', async () => {
      const result = (await handlers.copyFilesToWorkspace({
        filePaths: [`${ROOT}/a.txt`],
        workspace: '/etc/evil',
        sourceRoot: undefined,
      })) as { success: boolean };
      expect(result.success).toBe(false);
      expect(fsMock.copyFile).not.toHaveBeenCalled();
    });

    it('rejects an out-of-root source file but copies in-root ones', async () => {
      fsMock.mkdir.mockResolvedValue(undefined);
      fsMock.access.mockRejectedValue(new Error('no')); // target does not exist
      fsMock.copyFile.mockResolvedValue(undefined);

      const result = (await handlers.copyFilesToWorkspace({
        filePaths: [SECRET, `${ROOT}/keep.txt`],
        workspace: ROOT,
        sourceRoot: undefined,
      })) as { success: boolean; data?: { copiedFiles: string[]; failedFiles: unknown[] } };

      // Out-of-root source rejected; in-root source copied from its safe path.
      expect(fsMock.copyFile).toHaveBeenCalledTimes(1);
      expect(fsMock.copyFile).toHaveBeenCalledWith(`${ROOT}/keep.txt`, expect.any(String));
      expect(result.data?.failedFiles.length).toBe(1);
      expect(result.success).toBe(false);
    });

    it('rejects a source that escapes sourceRoot via path traversal', async () => {
      // confinePath lets this through (it resolves inside ROOT), but the
      // path.relative escape guard must still reject it.
      fsMock.mkdir.mockResolvedValue(undefined);
      const result = (await handlers.copyFilesToWorkspace({
        filePaths: [`${ROOT}/sub/file.txt`],
        workspace: ROOT,
        sourceRoot: `${ROOT}/other`,
      })) as { success: boolean; data?: { failedFiles: Array<{ error: string }> } };
      expect(fsMock.copyFile).not.toHaveBeenCalled();
      expect(result.data?.failedFiles[0]?.error).toMatch(/escapes sourceRoot/);
    });

    it('copies legitimate in-root files', async () => {
      fsMock.mkdir.mockResolvedValue(undefined);
      fsMock.access.mockRejectedValue(new Error('no'));
      fsMock.copyFile.mockResolvedValue(undefined);
      const result = (await handlers.copyFilesToWorkspace({
        filePaths: [`${ROOT}/a.txt`, `${ROOT}/b.txt`],
        workspace: ROOT,
        sourceRoot: undefined,
      })) as { success: boolean };
      expect(fsMock.copyFile).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it('copies an out-of-root source when allowExternalSource is set (explicit user grant) (#67)', async () => {
      // A file dragged/dialog-picked from outside the static roots attaches when
      // the explicit-gesture flag is set; the destination workspace stays in-root.
      fsMock.mkdir.mockResolvedValue(undefined);
      fsMock.access.mockRejectedValue(new Error('no'));
      fsMock.copyFile.mockResolvedValue(undefined);
      const result = (await handlers.copyFilesToWorkspace({
        filePaths: ['/Users/me/Projects/notes.txt'],
        workspace: ROOT,
        sourceRoot: undefined,
        allowExternalSource: true,
      })) as { success: boolean };
      expect(fsMock.copyFile).toHaveBeenCalledTimes(1);
      expect(fsMock.copyFile).toHaveBeenCalledWith('/Users/me/Projects/notes.txt', expect.any(String));
      expect(result.success).toBe(true);
    });

    it('still rejects a sensitive source even with allowExternalSource (#67)', async () => {
      // allowExternalSource only widens the location; the secret/sensitive guard
      // must still reject ~/.ssh/id_rsa.
      fsMock.mkdir.mockResolvedValue(undefined);
      const result = (await handlers.copyFilesToWorkspace({
        filePaths: [SECRET],
        workspace: ROOT,
        sourceRoot: undefined,
        allowExternalSource: true,
      })) as { success: boolean; data?: { failedFiles: unknown[] } };
      expect(fsMock.copyFile).not.toHaveBeenCalled();
      expect(result.data?.failedFiles.length).toBe(1);
      expect(result.success).toBe(false);
    });

    it('keeps the destination workspace strictly confined even with allowExternalSource (#67)', async () => {
      // allowExternalSource applies to SOURCE files only; an out-of-root write
      // destination is still rejected so it can't become an arbitrary-write hole.
      const result = (await handlers.copyFilesToWorkspace({
        filePaths: ['/Users/me/Projects/notes.txt'],
        workspace: '/etc/evil',
        sourceRoot: undefined,
        allowExternalSource: true,
      })) as { success: boolean };
      expect(result.success).toBe(false);
      expect(fsMock.copyFile).not.toHaveBeenCalled();
    });
  });

  describe('moveEntry', () => {
    it('rejects an out-of-root source and never renames', async () => {
      const result = (await handlers.moveEntry({ sourcePath: SECRET, targetDir: ROOT })) as { success: boolean };
      expect(result.success).toBe(false);
      expect(fsMock.rename).not.toHaveBeenCalled();
    });

    it('rejects an out-of-root target directory and never renames', async () => {
      const result = (await handlers.moveEntry({ sourcePath: `${ROOT}/a.txt`, targetDir: '/etc' })) as {
        success: boolean;
      };
      expect(result.success).toBe(false);
      expect(fsMock.rename).not.toHaveBeenCalled();
    });

    it('blocks on collision instead of overwriting', async () => {
      fsMock.lstat.mockResolvedValue({ isDirectory: () => true });
      fsMock.access.mockResolvedValue(undefined); // target already exists
      const result = (await handlers.moveEntry({ sourcePath: `${ROOT}/a.txt`, targetDir: `${ROOT}/sub` })) as {
        success: boolean;
        msg?: string;
      };
      expect(result.success).toBe(false);
      expect(result.msg).toBe('Target path already exists');
      expect(fsMock.rename).not.toHaveBeenCalled();
    });

    it('refuses to move a folder into its own descendant', async () => {
      fsMock.lstat.mockResolvedValue({ isDirectory: () => true });
      fsMock.access.mockRejectedValue(new Error('no'));
      const result = (await handlers.moveEntry({ sourcePath: `${ROOT}/dir`, targetDir: `${ROOT}/dir/child` })) as {
        success: boolean;
      };
      expect(result.success).toBe(false);
      expect(fsMock.rename).not.toHaveBeenCalled();
    });

    it('moves a legitimate in-root entry into a target directory', async () => {
      // Target dir exists (isDirectory); the destination path is absent (ENOENT),
      // so the move proceeds. Collision detection now stats the destination
      // (#592 never-clobber hardening) rather than fs.access.
      fsMock.lstat.mockImplementation(async (p: string) => {
        if (p === `${ROOT}/sub`) return { isDirectory: () => true } as never;
        const err = new Error('ENOENT') as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        throw err;
      });
      fsMock.rename.mockResolvedValue(undefined);
      const result = (await handlers.moveEntry({ sourcePath: `${ROOT}/a.txt`, targetDir: `${ROOT}/sub` })) as {
        success: boolean;
        data?: { newPath: string };
      };
      expect(fsMock.rename).toHaveBeenCalledWith(`${ROOT}/a.txt`, `${ROOT}/sub/a.txt`);
      expect(result.success).toBe(true);
      expect(result.data?.newPath).toBe(`${ROOT}/sub/a.txt`);
    });

    it('aborts and never renames when the destination check errors with a non-ENOENT code (#592 never-clobber)', async () => {
      // The target dir exists, but statting the destination fails with EACCES
      // (present-but-inaccessible). fs.access(...).catch(()=>false) would have
      // treated this as "absent" and let fs.rename clobber; the lstat-based
      // guard must fail closed instead.
      fsMock.lstat.mockImplementation(async (p: string) => {
        if (p === `${ROOT}/sub`) return { isDirectory: () => true } as never;
        const err = new Error('EACCES') as NodeJS.ErrnoException;
        err.code = 'EACCES';
        throw err;
      });
      fsMock.rename.mockResolvedValue(undefined);
      const result = (await handlers.moveEntry({ sourcePath: `${ROOT}/a.txt`, targetDir: `${ROOT}/sub` })) as {
        success: boolean;
      };
      expect(result.success).toBe(false);
      expect(fsMock.rename).not.toHaveBeenCalled();
    });
  });
});
