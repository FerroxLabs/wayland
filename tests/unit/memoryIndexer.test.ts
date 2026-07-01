/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #256 - dropped memories must land in the IJFW FTS5 index (via ijfw_memory_store)
 * so the chat agent can recall them, not just see them in the Memory UI.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
vi.mock('@process/services/ijfw/ijfwMcpClient', () => ({
  ijfwMcpClient: { invoke: (...args: unknown[]) => invokeMock(...args) },
}));
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { indexDroppedMemory } from '@process/services/import/memoryIndexer';

beforeEach(() => {
  invokeMock.mockReset();
  invokeMock.mockResolvedValue({ ok: true });
});

describe('indexDroppedMemory (#256)', () => {
  it('stores ingested content through ijfw_memory_store so it is recallable', async () => {
    await indexDroppedMemory({ content: 'Notes about HyperFrames', summary: 'HyperFrames', sourceFile: 'hf.md' });
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith(
      'memory_store',
      expect.objectContaining({
        content: 'Notes about HyperFrames',
        type: 'observation',
        summary: 'HyperFrames',
        tags: ['dropped'],
      })
    );
  });

  it('caps content at 4096 and summary at 80 (ijfw_memory_store limits)', async () => {
    await indexDroppedMemory({ content: 'x'.repeat(5000), summary: 'y'.repeat(200) });
    const args = invokeMock.mock.calls[0][1] as { content: string; summary: string };
    expect(args.content.length).toBe(4096);
    expect(args.summary.length).toBe(80);
  });

  it('does not call the store for empty content', async () => {
    await indexDroppedMemory({ content: '   \n  ', summary: 'irrelevant' });
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('falls back to the source filename for the summary when none is given', async () => {
    await indexDroppedMemory({ content: 'body text', summary: '', sourceFile: 'mydoc.md' });
    expect((invokeMock.mock.calls[0][1] as { summary: string }).summary).toBe('mydoc.md');
  });

  it('never throws if the mcp client rejects (best-effort, must not break ingest)', async () => {
    invokeMock.mockRejectedValue(new Error('mcp-server unavailable'));
    await expect(indexDroppedMemory({ content: 'x', summary: 's' })).resolves.toBeUndefined();
  });

  it('swallows a structured failure result without throwing', async () => {
    invokeMock.mockResolvedValue({ ok: false, error: 'storage failure' });
    await expect(indexDroppedMemory({ content: 'x', summary: 's' })).resolves.toBeUndefined();
  });
});
