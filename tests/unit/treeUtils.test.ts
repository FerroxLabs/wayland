import { describe, expect, it } from 'vitest';

import type { IDirOrFile } from '@/common/adapter/ipcBridge';
import {
  collectFilePaths,
  computeContextMenuPosition,
  resolveMoveTarget,
} from '@/renderer/pages/conversation/Workspace/utils/treeHelpers';

// Helper to create a file node
function file(name: string, fullPath: string): IDirOrFile {
  return {
    name,
    fullPath,
    relativePath: name,
    isDir: false,
    isFile: true,
  };
}

// Helper to create a directory node
function dir(name: string, fullPath: string, children: IDirOrFile[] = []): IDirOrFile {
  return {
    name,
    fullPath,
    relativePath: name,
    isDir: true,
    isFile: false,
    children,
  };
}

// ---------------------------------------------------------------------------
// collectFilePaths
// ---------------------------------------------------------------------------
describe('collectFilePaths', () => {
  it('returns an empty array for an empty input', () => {
    expect(collectFilePaths([])).toEqual([]);
  });

  it('collects paths from a flat list of files', () => {
    const items = [file('a.ts', '/src/a.ts'), file('b.ts', '/src/b.ts')];
    const paths = collectFilePaths(items);

    expect(paths).toEqual(['/src/a.ts', '/src/b.ts']);
  });

  it('collects paths from nested directories with files', () => {
    const items = [
      dir('src', '/src', [
        file('index.ts', '/src/index.ts'),
        dir('utils', '/src/utils', [file('helper.ts', '/src/utils/helper.ts')]),
      ]),
    ];
    const paths = collectFilePaths(items);

    expect(paths).toEqual(['/src/index.ts', '/src/utils/helper.ts']);
  });

  it('returns an empty array for a directory with no files (only subdirectories)', () => {
    const items = [dir('root', '/root', [dir('empty', '/root/empty')])];
    const paths = collectFilePaths(items);

    expect(paths).toEqual([]);
  });

  it('collects paths from a deeply nested structure', () => {
    const items = [
      dir('a', '/a', [
        dir('b', '/a/b', [dir('c', '/a/b/c', [dir('d', '/a/b/c/d', [file('deep.ts', '/a/b/c/d/deep.ts')])])]),
      ]),
    ];
    const paths = collectFilePaths(items);

    expect(paths).toEqual(['/a/b/c/d/deep.ts']);
  });

  it('skips directory nodes that have isFile = false', () => {
    const items = [dir('lib', '/lib'), file('main.ts', '/main.ts')];
    const paths = collectFilePaths(items);

    expect(paths).toEqual(['/main.ts']);
  });
});

// ---------------------------------------------------------------------------
// computeContextMenuPosition
// ---------------------------------------------------------------------------
describe('computeContextMenuPosition', () => {
  // Store original innerWidth/innerHeight and restore after tests
  const originalInnerWidth = globalThis.window?.innerWidth;
  const originalInnerHeight = globalThis.window?.innerHeight;

  // In a node environment (no window), the function returns unclipped values.
  // We mock window dimensions for viewport-clipping tests.

  it('returns the same position when within viewport bounds', () => {
    // With default menu size 220x220, position 100,100 is safe in any reasonable viewport
    Object.defineProperty(globalThis, 'window', {
      value: { innerWidth: 1920, innerHeight: 1080 },
      writable: true,
      configurable: true,
    });

    const pos = computeContextMenuPosition(100, 100);
    expect(pos).toEqual({ top: 100, left: 100 });
  });

  it('clips x when position is too close to the right edge', () => {
    Object.defineProperty(globalThis, 'window', {
      value: { innerWidth: 1000, innerHeight: 800 },
      writable: true,
      configurable: true,
    });

    // x = 900, menuWidth = 220 => 900 > 1000-220=780, should clip to 780
    const pos = computeContextMenuPosition(900, 100);
    expect(pos.left).toBe(780);
    expect(pos.top).toBe(100);
  });

  it('clips y when position is too close to the bottom edge', () => {
    Object.defineProperty(globalThis, 'window', {
      value: { innerWidth: 1000, innerHeight: 800 },
      writable: true,
      configurable: true,
    });

    // y = 700, menuHeight = 220 => 700 > 800-220=580, should clip to 580
    const pos = computeContextMenuPosition(100, 700);
    expect(pos.left).toBe(100);
    expect(pos.top).toBe(580);
  });

  it('returns top:0, left:0 for position at origin', () => {
    Object.defineProperty(globalThis, 'window', {
      value: { innerWidth: 1920, innerHeight: 1080 },
      writable: true,
      configurable: true,
    });

    const pos = computeContextMenuPosition(0, 0);
    expect(pos).toEqual({ top: 0, left: 0 });
  });

  it('clips both dimensions for a large menu that exceeds viewport', () => {
    Object.defineProperty(globalThis, 'window', {
      value: { innerWidth: 400, innerHeight: 300 },
      writable: true,
      configurable: true,
    });

    // Menu 350x280, position 200,100
    // clippedX = min(200, 400-350) = min(200, 50) = 50
    // clippedY = min(100, 300-280) = min(100, 20) = 20
    const pos = computeContextMenuPosition(200, 100, 350, 280);
    expect(pos.left).toBe(50);
    expect(pos.top).toBe(20);
  });

  // Clean up window mock
  afterAll(() => {
    if (originalInnerWidth !== undefined) {
      Object.defineProperty(globalThis, 'window', {
        value: { innerWidth: originalInnerWidth, innerHeight: originalInnerHeight },
        writable: true,
        configurable: true,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// resolveMoveTarget
// ---------------------------------------------------------------------------
describe('resolveMoveTarget', () => {
  // Build a node with explicit full/relative paths (the `file`/`dir` helpers
  // above tie relativePath to the name, which is too coarse for move cases).
  const node = (over: Partial<IDirOrFile>): IDirOrFile => ({
    name: 'x',
    fullPath: '/ws/x',
    relativePath: 'x',
    isDir: false,
    isFile: true,
    ...over,
  });

  // dropPosition follows Arco Tree semantics: 0 = dropped ONTO the node (move
  // INTO a folder), non-zero (-1 before / 1 after) = a gap drop (sibling level).
  const ONTO = 0;
  const GAP_BEFORE = -1;
  const GAP_AFTER = 1;

  it('resolves a file dropped onto a folder to a move into that folder', () => {
    const drag = node({ name: 'a.ts', fullPath: '/ws/a.ts', relativePath: 'a.ts', isFile: true, isDir: false });
    const drop = node({ name: 'sub', fullPath: '/ws/sub', relativePath: 'sub', isFile: false, isDir: true });
    expect(resolveMoveTarget(drag, drop, ONTO)).toEqual({
      sourceFullPath: '/ws/a.ts',
      sourceRelativePath: 'a.ts',
      targetDirFullPath: '/ws/sub',
    });
  });

  it('returns null when the drop target is a file, not a folder', () => {
    const drag = node({ name: 'a.ts', fullPath: '/ws/a.ts', relativePath: 'a.ts' });
    const drop = node({ name: 'b.ts', fullPath: '/ws/b.ts', relativePath: 'b.ts', isFile: true, isDir: false });
    expect(resolveMoveTarget(drag, drop, ONTO)).toBeNull();
  });

  it('resolves a gap drop next to a folder to the folder parent, not into the folder (#49)', () => {
    // Dragging into the gap adjacent to a folder means sibling-level placement -
    // the destination is the folder's parent dir, never inside the folder.
    const drag = node({
      name: 'a.ts',
      fullPath: '/ws/other/a.ts',
      relativePath: 'other/a.ts',
      isFile: true,
      isDir: false,
    });
    const drop = node({ name: 'sub', fullPath: '/ws/sub', relativePath: 'sub', isFile: false, isDir: true });
    expect(resolveMoveTarget(drag, drop, GAP_AFTER)).toEqual({
      sourceFullPath: '/ws/other/a.ts',
      sourceRelativePath: 'other/a.ts',
      targetDirFullPath: '/ws',
    });
  });

  it('resolves a gap drop next to a file to that file parent directory', () => {
    // A gap drop anchored on a file is valid: the entry becomes a sibling of the
    // file, i.e. it moves into the file's parent directory.
    const drag = node({ name: 'a.ts', fullPath: '/ws/a.ts', relativePath: 'a.ts', isFile: true, isDir: false });
    const drop = node({ name: 'b.ts', fullPath: '/ws/sub/b.ts', relativePath: 'sub/b.ts', isFile: true, isDir: false });
    expect(resolveMoveTarget(drag, drop, GAP_BEFORE)).toEqual({
      sourceFullPath: '/ws/a.ts',
      sourceRelativePath: 'a.ts',
      targetDirFullPath: '/ws/sub',
    });
  });

  it('returns null for a gap drop that resolves to the current parent (no-op)', () => {
    // Reordering within the same directory is a filesystem no-op.
    const drag = node({ name: 'a.ts', fullPath: '/ws/sub/a.ts', relativePath: 'sub/a.ts', isFile: true, isDir: false });
    const drop = node({ name: 'b.ts', fullPath: '/ws/sub/b.ts', relativePath: 'sub/b.ts', isFile: true, isDir: false });
    expect(resolveMoveTarget(drag, drop, GAP_AFTER)).toBeNull();
  });

  it('returns null for a no-op move into the current parent directory', () => {
    const drag = node({ name: 'a.ts', fullPath: '/ws/sub/a.ts', relativePath: 'sub/a.ts' });
    const drop = node({ name: 'sub', fullPath: '/ws/sub', relativePath: 'sub', isFile: false, isDir: true });
    expect(resolveMoveTarget(drag, drop, ONTO)).toBeNull();
  });

  it('returns null when moving a folder into itself', () => {
    const drag = node({ name: 'sub', fullPath: '/ws/sub', relativePath: 'sub', isFile: false, isDir: true });
    const drop = node({ name: 'sub', fullPath: '/ws/sub', relativePath: 'sub', isFile: false, isDir: true });
    expect(resolveMoveTarget(drag, drop, ONTO)).toBeNull();
  });

  it('returns null when moving a folder into one of its own descendants', () => {
    const drag = node({ name: 'sub', fullPath: '/ws/sub', relativePath: 'sub', isFile: false, isDir: true });
    const drop = node({
      name: 'deep',
      fullPath: '/ws/sub/deep',
      relativePath: 'sub/deep',
      isFile: false,
      isDir: true,
    });
    expect(resolveMoveTarget(drag, drop, ONTO)).toBeNull();
  });

  it('returns null for a gap drop into one of the dragged folder own descendants', () => {
    const drag = node({ name: 'sub', fullPath: '/ws/sub', relativePath: 'sub', isFile: false, isDir: true });
    const drop = node({
      name: 'x.ts',
      fullPath: '/ws/sub/deep/x.ts',
      relativePath: 'sub/deep/x.ts',
      isFile: true,
      isDir: false,
    });
    expect(resolveMoveTarget(drag, drop, GAP_BEFORE)).toBeNull();
  });

  it('returns null when the drag source is the workspace root (empty relativePath)', () => {
    const drag = node({ name: 'ws', fullPath: '/ws', relativePath: '', isFile: false, isDir: true });
    const drop = node({ name: 'sub', fullPath: '/ws/sub', relativePath: 'sub', isFile: false, isDir: true });
    expect(resolveMoveTarget(drag, drop, ONTO)).toBeNull();
  });

  it('returns null for missing drag or drop data', () => {
    const folder = node({ name: 'sub', fullPath: '/ws/sub', relativePath: 'sub', isFile: false, isDir: true });
    expect(resolveMoveTarget(null, folder, ONTO)).toBeNull();
    expect(resolveMoveTarget(folder, null, ONTO)).toBeNull();
  });
});
