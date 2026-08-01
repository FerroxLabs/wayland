import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { PreviewHistoryTarget } from '../../src/common/types/preview';

let tmpDir: string;

const mockTarget: PreviewHistoryTarget = {
  contentType: 'markdown',
  fileName: 'test.md',
};

vi.mock('../../src/process/utils/initStorage', () => ({
  getSystemDir: () => ({
    cacheDir: tmpDir,
  }),
}));

describe('PreviewHistoryService', () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'preview-history-test-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('saves and lists snapshots in a normal directory', async () => {
    const { previewHistoryService } = await import('../../src/process/services/previewHistoryService');
    const snapshot = await previewHistoryService.save(mockTarget, '# Hello');
    expect(snapshot.id).toBeTruthy();
    expect(snapshot.contentType).toBe('markdown');

    const list = await previewHistoryService.list(mockTarget);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(snapshot.id);
  });

  it('fails closed without deleting a file that blocks the history directory', async () => {
    // Simulate the Sentry issue: cacheDir exists as a regular file
    // instead of a directory, causing fs.mkdir to throw ENOTDIR.
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.writeFile(tmpDir, 'blocking file');

    const { previewHistoryService } = await import('../../src/process/services/previewHistoryService');
    await expect(previewHistoryService.save(mockTarget, '# Recovered')).rejects.toThrow();
    expect(await fs.readFile(tmpDir, 'utf-8')).toBe('blocking file');
  });

  it('retrieves saved snapshot content', async () => {
    const { previewHistoryService } = await import('../../src/process/services/previewHistoryService');
    const content = '# Snapshot content';
    const snapshot = await previewHistoryService.save(mockTarget, content);

    const result = await previewHistoryService.getContent(mockTarget, snapshot.id);
    expect(result).not.toBeNull();
    expect(result!.content).toBe(content);
    expect(result!.snapshot.id).toBe(snapshot.id);
  });

  it('returns null for non-existent snapshot', async () => {
    const { previewHistoryService } = await import('../../src/process/services/previewHistoryService');
    const result = await previewHistoryService.getContent(mockTarget, 'non-existent-id');
    expect(result).toBeNull();
  });

  it('retains more than fifty user-visible versions without automatic pruning', async () => {
    const { previewHistoryService } = await import('../../src/process/services/previewHistoryService');
    await Array.from({ length: 52 }).reduce(
      (previous, _unused, index) => previous.then(() => previewHistoryService.save(mockTarget, `# Version ${index}`)),
      Promise.resolve<unknown>(undefined)
    );

    const versions = await previewHistoryService.list(mockTarget);
    expect(versions).toHaveLength(52);
    const oldest = await previewHistoryService.getContent(mockTarget, versions.at(-1)!.id);
    expect(oldest?.content).toBe('# Version 0');
  });

  it('fails closed on a corrupt index instead of overwriting it as empty history', async () => {
    const { previewHistoryService } = await import('../../src/process/services/previewHistoryService');
    await previewHistoryService.save(mockTarget, '# Existing');

    const historyRoot = path.join(tmpDir, 'preview-history');
    const [targetDir] = await fs.readdir(historyRoot);
    const indexPath = path.join(historyRoot, targetDir, 'index.json');
    await fs.writeFile(indexPath, '{broken', 'utf-8');

    await expect(previewHistoryService.save(mockTarget, '# Must not overwrite')).rejects.toThrow();
    expect(await fs.readFile(indexPath, 'utf-8')).toBe('{broken');
  });
});
