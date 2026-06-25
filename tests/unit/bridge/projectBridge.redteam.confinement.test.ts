/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Red-team regression for RT-F2-01 / RT-R1-04 (HIGH): arbitrary file read in
 * generateKnowledgeDraft -> readSourceFiles. Renderer/remote-supplied
 * `filePaths` must be confined to the app's authorized roots BEFORE any
 * fs.readFile, so a path like `/etc/passwd` (or ~/.ssh/id_rsa, ~/.aws/...)
 * can never be read and embedded in the draft prompt returned to the renderer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// confinePath is the security gate. Mock it so we control accept/reject
// deterministically, exactly mirroring how fsBridge confines its reads.
vi.mock('../../../src/process/bridge/pathConfinement', () => ({
  confinePath: vi.fn(),
}));

// fs/promises is the dangerous sink. Mock readFile to detect any raw read.
vi.mock('fs/promises', () => ({
  default: { readFile: vi.fn() },
}));

// Stub the heavy sibling imports pulled in transitively by projectBridge so the
// module loads without an Electron/DB runtime. None are exercised by this test.
vi.mock('@/common', () => ({ ipcBridge: { project: {} } }));
vi.mock('@process/services/projectServiceSingleton', () => ({
  projectServiceSingleton: {},
}));
vi.mock('@process/services/projectKnowledge/knowledge', () => ({
  readProjectKnowledge: vi.fn(),
  writeProjectKnowledge: vi.fn(),
  listProjectReference: vi.fn(),
  addProjectReference: vi.fn(),
  removeProjectReference: vi.fn(),
  readProjectSummaries: vi.fn(),
  writeProjectSummary: vi.fn(),
  appendProjectDecision: vi.fn(),
  readProjectIjfwMemory: vi.fn(),
}));
vi.mock('@process/services/completion/oneShot', () => ({
  hasUsableModel: vi.fn(),
  oneShotComplete: vi.fn(),
  pickBestModel: vi.fn(),
}));

import fs from 'fs/promises';
import { confinePath } from '../../../src/process/bridge/pathConfinement';
import { readSourceFiles } from '../../../src/process/bridge/projectBridge';

const mockConfinePath = vi.mocked(confinePath);
const mockReadFile = vi.mocked(fs.readFile);

const IN_ROOT = '/Users/you/Documents/project/notes.md';
const OUT_OF_ROOT = '/etc/passwd';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readSourceFiles confinement (RT-F2-01)', () => {
  it('rejects an out-of-root path and never reads it', async () => {
    // confinePath fails closed (returns null) for the out-of-root path.
    mockConfinePath.mockResolvedValue(null);

    const result = await readSourceFiles([OUT_OF_ROOT]);

    // The raw path was confined, rejected, and never handed to fs.readFile.
    expect(mockConfinePath).toHaveBeenCalledWith(OUT_OF_ROOT);
    expect(mockReadFile).not.toHaveBeenCalled();
    // No content leaks into the draft prompt.
    expect(result).toBe('');
    expect(result).not.toContain('passwd');
  });

  it('reads a legitimate in-root path and truncates at the per-file cap', async () => {
    // confinePath accepts and returns the confined (realpath) form.
    mockConfinePath.mockResolvedValue(IN_ROOT);
    const big = 'x'.repeat(20_000);
    mockReadFile.mockResolvedValue(big as unknown as string);

    const result = await readSourceFiles([IN_ROOT]);

    // Read happens against the confined path, not the raw input.
    expect(mockConfinePath).toHaveBeenCalledWith(IN_ROOT);
    expect(mockReadFile).toHaveBeenCalledWith(IN_ROOT, 'utf-8');
    // Header uses the confined path's basename.
    expect(result).toContain('--- notes.md ---');
    // 8KB per-file truncation preserved: 8000 'x' chars, not the full 20000.
    const xCount = (result.match(/x/g) ?? []).length;
    expect(xCount).toBe(8_000);
  });

  it('skips the out-of-root path but still reads a sibling in-root path', async () => {
    // Mixed batch: only the in-root path survives confinement.
    mockConfinePath.mockImplementation(async (p: unknown) => (p === IN_ROOT ? IN_ROOT : null));
    mockReadFile.mockResolvedValue('hello' as unknown as string);

    const result = await readSourceFiles([OUT_OF_ROOT, IN_ROOT]);

    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith(IN_ROOT, 'utf-8');
    expect(result).toContain('--- notes.md ---');
    expect(result).toContain('hello');
    expect(result).not.toContain('passwd');
  });
});
