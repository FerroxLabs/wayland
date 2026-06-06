/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4b - Tests for the workspace FS sandbox.
 *
 * **Concurrency note:** these tests cover per-call protection only. The
 * microsecond TOCTOU window between the ancestor `lstat`-walk and the
 * `O_NOFOLLOW` open is documented as a known residual race in
 * `workspaceFs.ts` and justified by the imported-team-agent attacker
 * model. The race is not reproducible from JS userland and requires
 * platform-level isolation (chroot, AppArmor, sandbox-exec) to close.
 */

import { promises as fs, constants } from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamSandboxedError } from '@process/team/importExport/errors';
import { openInsideWorkspace, withOpenInsideWorkspace } from '@process/team/sandbox/workspaceFs';

let workspaceDir: string;
let scratchRoot: string;

beforeEach(async () => {
  scratchRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-w4b-'));
  workspaceDir = path.join(scratchRoot, 'workspace');
  await fs.mkdir(workspaceDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(scratchRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const expectSandboxedError = async (p: Promise<unknown>): Promise<TeamSandboxedError> => {
  let caught: unknown;
  try {
    await p;
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(TeamSandboxedError);
  return caught as TeamSandboxedError;
};

describe('openInsideWorkspace - escape + traversal', () => {
  it('rejects prefix-collision (/workspace vs /workspace-evil/file)', async () => {
    // The sibling dir starts with the workspace dir's name. `path.relative`
    // produces a `../` segment, which the escape check rejects.
    const sibling = path.join(scratchRoot, 'workspace-evil');
    await fs.mkdir(sibling, { recursive: true });
    await fs.writeFile(path.join(sibling, 'file'), 'x', 'utf8');
    const err = await expectSandboxedError(openInsideWorkspace(workspaceDir, '../workspace-evil/file', 'read'));
    expect(err.message).toMatch(/escapes workspace/i);
  });

  it('rejects `..` traversal even when target would resolve outside workspace', async () => {
    const err = await expectSandboxedError(openInsideWorkspace(workspaceDir, '../outside.txt', 'read'));
    expect(err.message).toMatch(/escapes workspace/i);
  });
});

describe('openInsideWorkspace - symlinks', () => {
  it('rejects a symlink at the target (final component) via lstat or ELOOP', async () => {
    const real = path.join(scratchRoot, 'real.txt');
    await fs.writeFile(real, 'real', 'utf8');
    const link = path.join(workspaceDir, 'link.txt');
    await fs.symlink(real, link);

    const err = await expectSandboxedError(openInsideWorkspace(workspaceDir, 'link.txt', 'read'));
    // Either path (lstat-walk catches it first OR O_NOFOLLOW ELOOPs) is fine.
    expect(err.message).toMatch(/symlink/i);
  });

  it('rejects a symlink at an ancestor via the lstat-walk', async () => {
    const real = path.join(scratchRoot, 'real-dir');
    await fs.mkdir(real, { recursive: true });
    await fs.writeFile(path.join(real, 'child.txt'), 'c', 'utf8');
    const linkDir = path.join(workspaceDir, 'linkdir');
    await fs.symlink(real, linkDir);

    const err = await expectSandboxedError(openInsideWorkspace(workspaceDir, 'linkdir/child.txt', 'read'));
    expect(err.message).toMatch(/symlink/i);
  });
});

describe('openInsideWorkspace - protected segments (case + Unicode)', () => {
  // The denylist is segment-aware: only an exact NFKC+lowercase match of
  // `.env` / `.ssh` (or the `node_modules/.cache` / `node_modules/.bin`
  // pair) trips the guard. These cases sweep the variants the TRIAGE
  // round-4/5 audits flagged.
  const protectedCases: Array<{ label: string; rel: string }> = [
    { label: 'lowercase .env', rel: '.env' },
    { label: 'uppercase .ENV', rel: '.ENV' },
    { label: 'mixed .Env', rel: '.Env' },
    { label: 'mixed .eNv', rel: '.eNv' },
    { label: 'fullwidth ．env (NFKC)', rel: '．env' },
    { label: 'NFC .env (precomposed)', rel: '.env'.normalize('NFC') },
    { label: 'nested foo/.env', rel: 'foo/.env' },
    { label: 'deeply nested', rel: 'nested/sub/.env' },
    { label: '.ssh/id_rsa', rel: '.ssh/id_rsa' },
    { label: 'nested/.SSH/x', rel: 'nested/.SSH/x' },
  ];

  for (const { label, rel } of protectedCases) {
    it(`rejects protected segment: ${label}`, async () => {
      const err = await expectSandboxedError(openInsideWorkspace(workspaceDir, rel, 'read'));
      expect(err.message).toMatch(/protected segment/i);
    });
  }

  it('rejects backslash-style protected segment (Windows-shape input on POSIX host)', async () => {
    // Splitter handles both `/` and `\` regardless of host `path.sep` so
    // `foo\.ENV` cannot bypass the denylist on POSIX systems.
    const err = await expectSandboxedError(openInsideWorkspace(workspaceDir, 'foo\\.ENV', 'read'));
    expect(err.message).toMatch(/protected segment/i);
  });

  it('rejects node_modules/.cache/foo', async () => {
    const err = await expectSandboxedError(openInsideWorkspace(workspaceDir, 'node_modules/.cache/foo', 'read'));
    expect(err.message).toMatch(/protected segment sequence/i);
  });

  it('rejects node_modules/.bin/foo (TRIAGE round-5 Gemini HIGH)', async () => {
    const err = await expectSandboxedError(openInsideWorkspace(workspaceDir, 'node_modules/.bin/foo', 'read'));
    expect(err.message).toMatch(/protected segment sequence/i);
  });

  it('allows node_modules-other/.cache/foo (similar prefix, not the protected pair)', async () => {
    // Build the parent dir so the open actually succeeds.
    const target = path.join(workspaceDir, 'node_modules-other', '.cache');
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, 'foo'), '', 'utf8');
    const fh = await openInsideWorkspace(workspaceDir, 'node_modules-other/.cache/foo', 'read');
    await fh.close();
  });

  it('allows node_modules/.cache2/foo (suffix differs from protected pair)', async () => {
    const target = path.join(workspaceDir, 'node_modules', '.cache2');
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, 'foo'), '', 'utf8');
    const fh = await openInsideWorkspace(workspaceDir, 'node_modules/.cache2/foo', 'read');
    await fh.close();
  });
});

describe('openInsideWorkspace - write + mkdir', () => {
  it('rejects writes when the parent directory does not exist with the mkdir hint', async () => {
    const err = await expectSandboxedError(openInsideWorkspace(workspaceDir, 'missing-parent/file.txt', 'write'));
    expect(err.message).toMatch(/use mkdir/i);
  });

  it('mkdir creates the dir non-recursively and returns a directory FileHandle', async () => {
    const fh = await openInsideWorkspace(workspaceDir, 'newdir', 'mkdir');
    try {
      // Directory exists on disk
      const stat = await fs.stat(path.join(workspaceDir, 'newdir'));
      expect(stat.isDirectory()).toBe(true);
      // Returned handle is a real FileHandle
      expect(typeof fh.close).toBe('function');
    } finally {
      await fh.close();
    }
  });

  it('mkdir is non-recursive: rejects when an intermediate dir is missing', async () => {
    // node fs.mkdir without recursive throws ENOENT - surface as the raw
    // error since it's not a sandbox violation per se.
    await expect(openInsideWorkspace(workspaceDir, 'a/b/c', 'mkdir')).rejects.toThrow();
  });
});

describe('withOpenInsideWorkspace - fd discipline', () => {
  it('passes the FileHandle into the body callback (no re-open by path)', async () => {
    await fs.writeFile(path.join(workspaceDir, 'data.txt'), 'hello', 'utf8');
    const seen: Array<{ hasReadFile: boolean }> = [];
    const result = await withOpenInsideWorkspace(workspaceDir, 'data.txt', 'read', async (fh) => {
      seen.push({ hasReadFile: typeof fh.readFile === 'function' });
      const buf = await fh.readFile();
      return buf.toString('utf8');
    });
    expect(result).toBe('hello');
    expect(seen).toEqual([{ hasReadFile: true }]);
  });

  it('closes the FileHandle on success', async () => {
    await fs.writeFile(path.join(workspaceDir, 'data.txt'), 'hello', 'utf8');
    const closed: FileHandle[] = [];
    await withOpenInsideWorkspace(workspaceDir, 'data.txt', 'read', async (fh) => {
      const origClose = fh.close.bind(fh);
      fh.close = async () => {
        closed.push(fh);
        return origClose();
      };
      return undefined;
    });
    expect(closed.length).toBe(1);
  });

  it('closes the FileHandle when the body throws', async () => {
    await fs.writeFile(path.join(workspaceDir, 'data.txt'), 'hello', 'utf8');
    const closed: FileHandle[] = [];
    const bodyError = new Error('boom');
    await expect(
      withOpenInsideWorkspace(workspaceDir, 'data.txt', 'read', async (fh) => {
        const origClose = fh.close.bind(fh);
        fh.close = async () => {
          closed.push(fh);
          return origClose();
        };
        throw bodyError;
      })
    ).rejects.toBe(bodyError);
    expect(closed.length).toBe(1);
  });
});

// O_NOFOLLOW is a POSIX-only open flag; `constants.O_NOFOLLOW` is undefined on
// win32, so prod's `| constants.O_NOFOLLOW` is a no-op there. SECURITY NOTE: the
// atomic final-component symlink guard therefore does NOT exist on windows. The
// ancestor lstat-walk still rejects pre-existing symlinks on every platform; what
// win32 loses is O_NOFOLLOW protection of the leaf in the TOCTOU window between
// lstat-walk and open (Node's fs exposes no win32 O_NOFOLLOW equivalent - tracked
// as a prod finding). This block runs on BOTH platforms and asserts each side
// honestly - NO skip.
describe('openInsideWorkspace - O_NOFOLLOW flag plumbing', () => {
  it('passes O_NOFOLLOW to fs.open on read', async () => {
    await fs.writeFile(path.join(workspaceDir, 'data.txt'), 'hello', 'utf8');
    const openSpy = vi.spyOn(fs, 'open');
    const fh = await openInsideWorkspace(workspaceDir, 'data.txt', 'read');
    try {
      const call = openSpy.mock.calls[0];
      expect(call).toBeDefined();
      const flags = call?.[1] as number;
      expect(typeof flags).toBe('number');
      expect(flags & constants.O_RDONLY).toBe(constants.O_RDONLY);
      if (process.platform === 'win32') {
        // No O_NOFOLLOW bit exists on win32 - see the security note above.
        expect(constants.O_NOFOLLOW).toBeUndefined();
      } else {
        expect(flags & constants.O_NOFOLLOW).toBe(constants.O_NOFOLLOW);
      }
    } finally {
      await fh.close();
    }
  });

  it('passes O_NOFOLLOW to fs.open on write', async () => {
    const openSpy = vi.spyOn(fs, 'open');
    const fh = await openInsideWorkspace(workspaceDir, 'new.txt', 'write');
    try {
      const call = openSpy.mock.calls[0];
      expect(call).toBeDefined();
      const flags = call?.[1] as number;
      expect(typeof flags).toBe('number');
      expect(flags & constants.O_WRONLY).toBe(constants.O_WRONLY);
      expect(flags & constants.O_CREAT).toBe(constants.O_CREAT);
      expect(flags & constants.O_TRUNC).toBe(constants.O_TRUNC);
      if (process.platform === 'win32') {
        expect(constants.O_NOFOLLOW).toBeUndefined();
      } else {
        expect(flags & constants.O_NOFOLLOW).toBe(constants.O_NOFOLLOW);
      }
    } finally {
      await fh.close();
    }
  });
});
