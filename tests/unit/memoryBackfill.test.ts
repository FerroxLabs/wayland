/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #256 - memories that predate store-on-drop live on disk but never landed in the
 * FTS5 index, so they can't be recalled and don't self-heal. The one-time
 * backfill sweeps them into the index once per install, guarded by a marker.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
vi.mock('@process/services/ijfw/ijfwMcpClient', () => ({
  ijfwMcpClient: { invoke: (...args: unknown[]) => invokeMock(...args) },
}));
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { backfillMarkerPath, backfillMemoryIndex } from '@process/services/import/memoryBackfill';

let tmpRoot: string;
let memDir: string;

beforeEach(async () => {
  invokeMock.mockReset();
  invokeMock.mockResolvedValue({ ok: true });
  tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mem-backfill-'));
  memDir = path.join(tmpRoot, 'memory');
  await fs.promises.mkdir(memDir, { recursive: true });
});

afterEach(async () => {
  await fs.promises.rm(tmpRoot, { recursive: true, force: true });
});

async function writeMemory(name: string, body: string): Promise<void> {
  await fs.promises.writeFile(path.join(memDir, name), body, 'utf8');
}

describe('backfillMemoryIndex (#256)', () => {
  it('indexes each pre-existing .md memory once and writes the marker', async () => {
    await writeMemory('a.md', '# Alpha\nfirst body line');
    await writeMemory('b.md', '# Beta\nsecond body line');

    const result = await backfillMemoryIndex({ ijfwMemoryDir: memDir });

    expect(result.skipped).toBe(false);
    expect(result.indexed).toBe(2);
    expect(invokeMock).toHaveBeenCalledTimes(2);
    // Marker exists after a completed sweep.
    expect(fs.existsSync(backfillMarkerPath(memDir))).toBe(true);
  });

  it('tags backfilled entries so they are distinguishable from live drops', async () => {
    await writeMemory('a.md', '# Alpha\nbody');
    await backfillMemoryIndex({ ijfwMemoryDir: memDir });
    expect(invokeMock).toHaveBeenCalledWith('memory_store', expect.objectContaining({ tags: ['dropped', 'backfill'] }));
  });

  it('indexes body only, stripping the synthetic frontmatter real files carry', async () => {
    // Every real writer (drop/drag-drop/importers) persists frontmatter + body;
    // the live paths store the pre-frontmatter body, so backfill must match.
    const fileWithFrontmatter = [
      '---',
      'title: Nebula Codename',
      'description: the reporter dropped this',
      'type: observation',
      'summary: Nebula Codename',
      '---',
      '# Nebula Codename',
      'the secret marker is NEBULA-2287',
    ].join('\n');
    await writeMemory('dropped-123-nebula.md', fileWithFrontmatter);

    await backfillMemoryIndex({ ijfwMemoryDir: memDir });

    const stored = (invokeMock.mock.calls[0][1] as { content: string }).content;
    expect(stored).toContain('NEBULA-2287');
    expect(stored).not.toContain('type: observation');
    expect(stored).not.toContain('description:');
  });

  it('does not write the marker on a transient readdir failure (retries next boot)', async () => {
    await writeMemory('a.md', '# Alpha\nbody');
    const err = Object.assign(new Error('permission denied'), { code: 'EACCES' });
    const spy = vi.spyOn(fs.promises, 'readdir').mockRejectedValueOnce(err as never);

    const result = await backfillMemoryIndex({ ijfwMemoryDir: memDir });

    expect(result.skipped).toBe(false);
    expect(invokeMock).not.toHaveBeenCalled();
    expect(fs.existsSync(backfillMarkerPath(memDir))).toBe(false);
    spy.mockRestore();
  });

  it('is idempotent: a second run with the marker present indexes nothing', async () => {
    await writeMemory('a.md', '# Alpha\nbody');
    await backfillMemoryIndex({ ijfwMemoryDir: memDir });
    invokeMock.mockClear();

    const second = await backfillMemoryIndex({ ijfwMemoryDir: memDir });
    expect(second.skipped).toBe(true);
    expect(second.indexed).toBe(0);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('skips non-.md files, subdirectories, and empty memories', async () => {
    await writeMemory('keep.md', '# Keep\nbody');
    await writeMemory('note.txt', 'plain text - not indexed');
    await writeMemory('blank.md', '   \n  ');
    await fs.promises.mkdir(path.join(memDir, 'global'), { recursive: true });
    await fs.promises.writeFile(path.join(memDir, 'global', 'nested.md'), '# Nested\nbody', 'utf8');

    const result = await backfillMemoryIndex({ ijfwMemoryDir: memDir });

    expect(result.indexed).toBe(1);
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it('is best-effort per file: one unreadable/failed file does not abort the rest', async () => {
    await writeMemory('good1.md', '# Good1\nbody');
    await writeMemory('bad.md', '# Bad\nbody');
    await writeMemory('good2.md', '# Good2\nbody');
    // Make the store reject only for bad.md's content.
    invokeMock.mockImplementation((_verb: string, args: { content?: string }) => {
      if (args?.content?.includes('Bad')) return Promise.reject(new Error('store failed'));
      return Promise.resolve({ ok: true });
    });

    const result = await backfillMemoryIndex({ ijfwMemoryDir: memDir });

    // indexDroppedMemory swallows the store failure, so all three are attempted
    // and counted; the sweep completes and the marker is written.
    expect(result.indexed).toBe(3);
    expect(fs.existsSync(backfillMarkerPath(memDir))).toBe(true);
  });

  it('fresh install (no memory dir): lays the marker, indexes nothing', async () => {
    const missing = path.join(tmpRoot, 'does-not-exist', 'memory');
    const result = await backfillMemoryIndex({ ijfwMemoryDir: missing });

    expect(result.indexed).toBe(0);
    expect(result.skipped).toBe(false);
    expect(invokeMock).not.toHaveBeenCalled();
    expect(fs.existsSync(backfillMarkerPath(missing))).toBe(true);
  });
});
