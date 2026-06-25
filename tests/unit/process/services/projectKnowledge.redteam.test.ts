/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Red-team regression for SEC-IPC-04 (HIGH): arbitrary file read -> model exfil
 * via addProjectReference. Renderer/remote-supplied `sourcePaths` must pass a
 * confinement gate BEFORE any fs.lstat / fs.copyFile, so a plain absolute path
 * to a sensitive regular file (`/etc/passwd`, ~/.aws/credentials, ~/.ssh/id_rsa
 * when not a symlink) can never be copied into the reference dir and later read
 * back into chat prompts.
 *
 * The gate accepts a source when EITHER confinePath() resolves it (in an
 * authorized app root) OR resolveWithinApprovedDirectory() resolves it (the
 * user picked it through the native open dialog, whose parent dir dialogBridge
 * approves in MAIN). Both return the resolved path used for the copy. The
 * pre-existing symlink-skip, non-regular-file skip and size cap remain as
 * defense in depth.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// The two security gates. Mock them so we control accept/reject deterministically.
vi.mock('@process/bridge/pathConfinement', () => ({
  confinePath: vi.fn(),
}));
vi.mock('@process/bridge/userApprovedPaths', () => ({
  resolveWithinApprovedDirectory: vi.fn(),
}));

// fs/promises is the dangerous sink. Mock the file ops so we detect any raw
// lstat/copyFile against an un-gated path and avoid touching the real disk.
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn(),
    lstat: vi.fn(),
    copyFile: vi.fn(),
    access: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));

// bootstrap only contributes the dir-name constant; stub it so the module loads
// without its transitive imports.
vi.mock('@process/services/projectKnowledge/bootstrap', () => ({
  WAYLAND_KNOWLEDGE_DIR: '.wayland',
}));

import fs from 'fs/promises';
import { confinePath } from '@process/bridge/pathConfinement';
import { resolveWithinApprovedDirectory } from '@process/bridge/userApprovedPaths';
import { addProjectReference } from '@process/services/projectKnowledge/knowledge';

const mockConfinePath = vi.mocked(confinePath);
const mockResolveApproved = vi.mocked(resolveWithinApprovedDirectory);
const mockMkdir = vi.mocked(fs.mkdir);
const mockLstat = vi.mocked(fs.lstat);
const mockCopyFile = vi.mocked(fs.copyFile);
const mockAccess = vi.mocked(fs.access);
const mockReaddir = vi.mocked(fs.readdir);

const WORKSPACE = '/Users/you/Documents/project';
const IN_ROOT = '/Users/you/Documents/project/spec.md';
const OUT_OF_ROOT = '/etc/passwd';

/** Minimal fs.Stats-like double for a plain regular file of `size` bytes. */
const regularFile = (size: number) =>
  ({
    isSymbolicLink: () => false,
    isFile: () => true,
    size,
  }) as unknown as Awaited<ReturnType<typeof fs.lstat>>;

beforeEach(() => {
  vi.clearAllMocks();
  mockMkdir.mockResolvedValue(undefined as never);
  // uniqueDest: fs.access throws => destination is free on first try.
  mockAccess.mockRejectedValue(new Error('ENOENT') as never);
  mockCopyFile.mockResolvedValue(undefined as never);
  // listProjectReference at the end reads the dir; keep it empty (not asserted).
  mockReaddir.mockResolvedValue([] as never);
});

describe('addProjectReference confinement (SEC-IPC-04)', () => {
  it('rejects a plain out-of-root path and never lstats or copies it', async () => {
    // Neither gate accepts /etc/passwd.
    mockConfinePath.mockResolvedValue(null);
    mockResolveApproved.mockReturnValue(null);

    await addProjectReference(WORKSPACE, [OUT_OF_ROOT]);

    // A drag-drop is an explicit local gesture, so the gate is invoked with
    // allowOutsideRoots (mirroring the conversation-workspace #67 path). That
    // only widens the permitted source *location*: every form/traversal/symlink/
    // sensitive-location guard still applies, so the mock (and the real gate)
    // still reject /etc/passwd -> null.
    expect(mockConfinePath).toHaveBeenCalledWith(OUT_OF_ROOT, { allowOutsideRoots: true });
    // The dangerous sinks were never reached for the rejected source.
    expect(mockLstat).not.toHaveBeenCalled();
    expect(mockCopyFile).not.toHaveBeenCalled();
  });

  it('copies a legitimate in-root source via its confined path', async () => {
    // confinePath accepts and returns the confined (realpath) form.
    mockConfinePath.mockResolvedValue(IN_ROOT);
    mockResolveApproved.mockReturnValue(null);
    mockLstat.mockResolvedValue(regularFile(1234));

    await addProjectReference(WORKSPACE, [IN_ROOT]);

    // lstat/copy operate on the confined path, not the raw input.
    expect(mockLstat).toHaveBeenCalledWith(IN_ROOT);
    expect(mockCopyFile).toHaveBeenCalledTimes(1);
    const [copiedSrc, copiedDest] = mockCopyFile.mock.calls[0];
    expect(copiedSrc).toBe(IN_ROOT);
    expect(String(copiedDest)).toContain('spec.md');
  });

  it('accepts a dialog-approved source outside app roots', async () => {
    const APPROVED = '/Volumes/USB/brief.pdf';
    // Outside every app root, but the user picked it via the native dialog, so
    // the approved-directory gate resolves it (returns the resolved path).
    mockConfinePath.mockResolvedValue(null);
    mockResolveApproved.mockReturnValue(APPROVED);
    mockLstat.mockResolvedValue(regularFile(42));

    await addProjectReference(WORKSPACE, [APPROVED]);

    expect(mockResolveApproved).toHaveBeenCalledWith(APPROVED);
    // lstat/copy operate on the resolved approved path.
    expect(mockLstat).toHaveBeenCalledWith(APPROVED);
    expect(mockCopyFile).toHaveBeenCalledTimes(1);
    expect(mockCopyFile.mock.calls[0][0]).toBe(APPROVED);
    expect(String(mockCopyFile.mock.calls[0][1])).toContain('brief.pdf');
  });

  it('skips the out-of-root path but still copies a sibling in-root path', async () => {
    mockConfinePath.mockImplementation(async (p: unknown) => (p === IN_ROOT ? IN_ROOT : null));
    mockResolveApproved.mockReturnValue(null);
    mockLstat.mockResolvedValue(regularFile(10));

    await addProjectReference(WORKSPACE, [OUT_OF_ROOT, IN_ROOT]);

    // Only the in-root path reached the sink.
    expect(mockLstat).toHaveBeenCalledTimes(1);
    expect(mockLstat).toHaveBeenCalledWith(IN_ROOT);
    expect(mockCopyFile).toHaveBeenCalledTimes(1);
    expect(mockCopyFile).toHaveBeenCalledWith(IN_ROOT, expect.stringContaining('spec.md'));
  });
});
