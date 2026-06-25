/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * S15 regression: a reference file dragged from an arbitrary folder (outside the
 * static app roots and not dialog-approved) was silently `continue`d, so
 * addProjectReference returned the unchanged list while the renderer still fired
 * a blanket success toast. The fix mirrors the conversation-workspace #67 path:
 * addProjectReference must invoke the confinement gate with
 * `{ allowOutsideRoots: true }` so an explicit drag-drop of a safe file outside
 * the roots is accepted (and therefore actually copied), instead of being
 * dropped without a word.
 *
 * Before the fix `confinePath` was called with no options, so a dropped file
 * outside every root resolved to null -> skipped -> nothing copied. This test
 * asserts the option is now passed AND that a safe out-of-root source reaches
 * copyFile.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@process/bridge/pathConfinement', () => ({
  confinePath: vi.fn(),
}));
vi.mock('@process/bridge/userApprovedPaths', () => ({
  resolveWithinApprovedDirectory: vi.fn(),
}));
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
// A safe regular file the user dragged from a folder outside every app root.
const DROPPED = '/Volumes/Scratch/notes/brief.md';

const regularFile = (size: number) =>
  ({
    isSymbolicLink: () => false,
    isFile: () => true,
    size,
  }) as unknown as Awaited<ReturnType<typeof fs.lstat>>;

beforeEach(() => {
  vi.clearAllMocks();
  mockMkdir.mockResolvedValue(undefined as never);
  mockAccess.mockRejectedValue(new Error('ENOENT') as never);
  mockCopyFile.mockResolvedValue(undefined as never);
  mockReaddir.mockResolvedValue([] as never);
});

describe('addProjectReference allowOutsideRoots (S15)', () => {
  it('invokes confinePath with allowOutsideRoots so a dragged out-of-root file is accepted', async () => {
    // The gate accepts the dropped file because it is a local drag gesture; it
    // returns the resolved path used for the copy.
    mockConfinePath.mockResolvedValue(DROPPED);
    mockResolveApproved.mockReturnValue(null);
    mockLstat.mockResolvedValue(regularFile(64));

    await addProjectReference(WORKSPACE, [DROPPED]);

    // The load-bearing assertion: the option must be present. Without it the
    // pre-fix code called confinePath(DROPPED) (one arg) and a real out-of-root
    // drop resolved to null -> silently skipped.
    expect(mockConfinePath).toHaveBeenCalledWith(DROPPED, { allowOutsideRoots: true });
    // The accepted source actually reaches the copy sink (not silently dropped).
    expect(mockCopyFile).toHaveBeenCalledTimes(1);
    expect(mockCopyFile.mock.calls[0][0]).toBe(DROPPED);
    expect(String(mockCopyFile.mock.calls[0][1])).toContain('brief.md');
  });
});
