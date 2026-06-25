/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * GitHub #256: the chat agent must see the user's GLOBAL Wayland Memory store
 * (where drop-folder ingestion writes), not only project `.wayland/` knowledge.
 * loadGlobalMemoryBlock builds the attributed, capped block injected at chat
 * creation. These tests drive it through a fake IjfwArchiveService.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import os from 'os';
import path from 'path';
import type { MemoryEntry } from '@/common/types/memory';
import type { IjfwArchiveService } from '@process/services/memory/ijfwArchiveService';

// Deterministic, init-free label so the block is assertable without booting i18n.
vi.mock('@process/services/i18n', () => ({
  default: { t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key },
}));

import { loadGlobalMemoryBlock } from '@process/services/projectKnowledge/knowledge';
import { resetIjfwArchiveService, setIjfwArchiveService } from '@process/services/memory/ijfwArchiveService';

const GLOBAL_DIR = path.join(os.homedir(), '.ijfw', 'memory');

function entry(over: Partial<MemoryEntry> & { id: string; summary: string; sourcePath: string }): MemoryEntry {
  return {
    type: 'observation',
    project: 'global',
    projectPath: os.homedir(),
    bodyPreview: '',
    tags: [],
    storedAt: Date.now(),
    sourceLine: 0,
    referencedBy: 0,
    promotionScore: 0,
    ...over,
  };
}

/**
 * Minimal fake exposing only the two methods loadGlobalMemoryBlock calls.
 *
 * `listEntries` mirrors the real service: it sorts by recency and applies the
 * `limit`/`offset` slice. The earlier fake ignored both, which is exactly why
 * the #256 cap-before-filter bug slipped past the suite - the bug only shows
 * when a recency-ordered `limit` can rank a global entry out of the corpus
 * before the global filter runs.
 */
function fakeService(opts: {
  entries: MemoryEntry[];
  bodies?: Record<string, string>;
}): IjfwArchiveService {
  return {
    listEntries: async (filter: { sort?: string; offset?: number; limit?: number } = {}) => {
      let entries = [...opts.entries];
      if ((filter.sort ?? 'recent') === 'recent') {
        entries = entries.toSorted((a, b) => b.storedAt - a.storedAt);
      }
      const total = entries.length;
      const offset = filter.offset ?? 0;
      if (filter.limit !== undefined) {
        entries = entries.slice(offset, offset + filter.limit);
      } else if (offset > 0) {
        entries = entries.slice(offset);
      }
      return { entries, total };
    },
    getEntry: async (id: string) => {
      const e = opts.entries.find((x) => x.id === id);
      if (!e) return null;
      return { ...e, body: opts.bodies?.[id] ?? e.bodyPreview };
    },
    dispose: () => {},
  } as unknown as IjfwArchiveService;
}

afterEach(() => {
  resetIjfwArchiveService();
  vi.restoreAllMocks();
});

describe('loadGlobalMemoryBlock (#256)', () => {
  it('includes the full body of a dropped global memory entry', async () => {
    const droppedPath = path.join(GLOBAL_DIR, 'dropped-123-hyperframes.md');
    const fullBody =
      'HyperFrames are a modular UI layout primitive. They snap to a 12-col grid and persist per workspace.';
    setIjfwArchiveService(
      fakeService({
        entries: [entry({ id: 'h1', summary: 'HyperFrames overview', sourcePath: droppedPath, bodyPreview: 'HyperFrames are a modular UI' })],
        bodies: { h1: fullBody },
      })
    );

    const block = await loadGlobalMemoryBlock();
    expect(block).toContain('User memory (from Wayland Memory)');
    expect(block).toContain('HyperFrames overview');
    // The FULL body must be present, not just the 200-char list preview.
    expect(block).toContain('persist per workspace.');
  });

  it('still injects an older global entry when newer per-project entries fill the cap (#256)', async () => {
    // A heavy active project has written 60 recent entries - more than the
    // entry cap (50). The single global "HyperFrames" drop is OLDER than all of
    // them. Under the old cap-before-filter code, listEntries({limit:50}) sliced
    // the corpus down to the 50 newest (all per-project) BEFORE the global
    // filter ran, so the global entry was ranked out and nothing was injected -
    // the exact #256 "not found" regression for heavy-project users.
    const projectPath = path.join(os.homedir(), 'dev', 'busyproj', '.ijfw', 'memory', 'journal.md');
    const base = Date.now();
    const projectEntries: MemoryEntry[] = Array.from({ length: 60 }, (_, i) =>
      entry({
        id: `proj-${i}`,
        summary: `project note ${i}`,
        sourcePath: projectPath,
        project: 'busyproj',
        // Newer than the global entry below.
        storedAt: base + (i + 1) * 1000,
        bodyPreview: `local note ${i}`,
      })
    );
    const globalPath = path.join(GLOBAL_DIR, 'dropped-1-hyperframes.md');
    const globalEntry = entry({
      id: 'hf',
      summary: 'HyperFrames overview',
      sourcePath: globalPath,
      // Oldest of all -> ranked last by recency.
      storedAt: base,
      bodyPreview: 'HyperFrames are a modular UI',
    });
    setIjfwArchiveService(
      fakeService({
        entries: [...projectEntries, globalEntry],
        bodies: { hf: 'HyperFrames snap to a 12-col grid and persist per workspace.' },
      })
    );

    const block = await loadGlobalMemoryBlock();
    expect(block).toContain('HyperFrames overview');
    expect(block).toContain('persist per workspace.');
  });

  it('injects nothing when the store is empty', async () => {
    setIjfwArchiveService(fakeService({ entries: [] }));
    expect(await loadGlobalMemoryBlock()).toBe('');
  });

  it('ignores per-project entries that do not live under the global memory dir', async () => {
    const projectPath = path.join(os.homedir(), 'dev', 'myproj', '.ijfw', 'memory', 'journal.md');
    setIjfwArchiveService(
      fakeService({
        entries: [entry({ id: 'p1', summary: 'project note', sourcePath: projectPath, bodyPreview: 'local' })],
        bodies: { p1: 'a project-scoped note that must not be injected' },
      })
    );
    expect(await loadGlobalMemoryBlock()).toBe('');
  });

  it('truncates an oversized entry body gracefully', async () => {
    const droppedPath = path.join(GLOBAL_DIR, 'dropped-999-big.md');
    const huge = 'X'.repeat(20_000); // > MEMORY_ENTRY_CHAR_CAP (8_000)
    setIjfwArchiveService(
      fakeService({ entries: [entry({ id: 'b1', summary: 'big drop', sourcePath: droppedPath })], bodies: { b1: huge } })
    );

    const block = await loadGlobalMemoryBlock();
    expect(block).toContain('…(truncated)');
    expect(block).not.toContain('X'.repeat(20_000));
    // The block stays well under the per-entry cap plus label/heading overhead.
    expect(block.length).toBeLessThan(9_000);
  });

  it('returns empty (never throws) when the archive service fails', async () => {
    setIjfwArchiveService({
      listEntries: async () => {
        throw new Error('index unavailable');
      },
      getEntry: async () => null,
      dispose: () => {},
    } as unknown as IjfwArchiveService);
    await expect(loadGlobalMemoryBlock()).resolves.toBe('');
  });
});
