/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * GitHub #924 - silent loss in the injected global-memory block.
 *
 * `loadGlobalMemoryBlock` composes the block the chat agent receives as its
 * record of the user's memory. Two paths used to shrink it with no marker at
 * all, so the agent read a partial block as if it were the whole store:
 *
 *   1. When the full body read failed, the 200-character list `bodyPreview`
 *      was substituted and presented as the complete entry.
 *   2. When an entry did not fit the remaining block budget, it and every
 *      entry after it were dropped without a word.
 *
 * The oversized-body path already appended `…(truncated)`; these two did not.
 * The block must always disclose what it left out.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import os from 'os';
import path from 'path';
import type { MemoryEntry } from '@/common/types/memory';
import type { IjfwArchiveService } from '@process/services/memory/ijfwArchiveService';

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

afterEach(() => {
  resetIjfwArchiveService();
  vi.restoreAllMocks();
});

describe('loadGlobalMemoryBlock lossy disclosure (#924)', () => {
  it('marks an entry whose full body could not be read instead of passing the preview off as complete', async () => {
    const droppedPath = path.join(GLOBAL_DIR, 'dropped-1-spec.md');
    setIjfwArchiveService({
      listEntries: async () => ({
        entries: [
          entry({
            id: 'p1',
            summary: 'Five-step release spec',
            sourcePath: droppedPath,
            bodyPreview: 'Step 1 of 5: cut the branch',
          }),
        ],
        total: 1,
      }),
      getEntry: async () => {
        throw new Error('source file unreadable');
      },
      dispose: () => {},
    } as unknown as IjfwArchiveService);

    const block = await loadGlobalMemoryBlock();
    expect(block).toContain('Five-step release spec');
    expect(block).toContain('Step 1 of 5: cut the branch');
    // The agent must be told this is a preview, not the whole entry.
    expect(block).toContain('(preview only');
  });

  it('discloses how many entries the block budget dropped', async () => {
    // Each body is 7_000 chars: three fit inside MEMORY_BLOCK_CHAR_CAP (24_000),
    // the loop then stops with entries still unread.
    const bodies: Record<string, string> = {};
    const entries: MemoryEntry[] = [];
    for (let i = 0; i < 6; i++) {
      const id = `e${i}`;
      bodies[id] = `${i}`.repeat(7_000);
      entries.push(
        entry({
          id,
          summary: `entry ${i}`,
          sourcePath: path.join(GLOBAL_DIR, `drop-${i}.md`),
          storedAt: Date.now() - i * 1000,
          bodyPreview: `preview ${i}`,
        })
      );
    }
    setIjfwArchiveService({
      listEntries: async () => ({ entries, total: entries.length }),
      getEntry: async (id: string) => ({ ...entries.find((e) => e.id === id)!, body: bodies[id] }),
      dispose: () => {},
    } as unknown as IjfwArchiveService);

    const block = await loadGlobalMemoryBlock();
    expect(block).toContain('entry 0');
    // The COUNT is the whole disclosure: a notice that under-reports is worse
    // than none, because it looks trustworthy. Three of six bodies fit, so the
    // block must name exactly three - not "some", not an off-by-one.
    expect(block.match(/^## entry \d+$/gm)).toHaveLength(3);
    expect(block).toContain('…(3 more memory entries omitted to fit the context budget)');
  });

  it('counts entries dropped by the 50-entry cap exactly', async () => {
    // MEMORY_BLOCK_MAX_ENTRIES (50) is a different drop path from the char cap
    // above: the bodies are tiny, so all 50 survivors fit and the remaining 10
    // are lost to the entry cap alone.
    const entries: MemoryEntry[] = Array.from({ length: 60 }, (_, i) =>
      entry({
        id: `c${i}`,
        summary: `capped ${i}`,
        sourcePath: path.join(GLOBAL_DIR, `cap-${i}.md`),
        storedAt: Date.now() - i * 1000,
      })
    );
    setIjfwArchiveService({
      listEntries: async () => ({ entries, total: entries.length }),
      getEntry: async (id: string) => ({ ...entries.find((e) => e.id === id)!, body: `body ${id}` }),
      dispose: () => {},
    } as unknown as IjfwArchiveService);

    const block = await loadGlobalMemoryBlock();
    expect(block.match(/^## capped \d+$/gm)).toHaveLength(50);
    expect(block).toContain('…(10 more memory entries omitted to fit the context budget)');
  });

  it('emits a summary-only entry with an empty-body marker instead of dropping it silently', async () => {
    // The reachable case: a preference note whose SUMMARY is the whole note.
    // `bodyPreview` is stripMarkdown(body).slice(0, 200) so it is '' too, and
    // `getEntry` returns body: '' whenever the source block no longer matches.
    // The entry used to be skipped AND subtracted back out of the omission
    // notice, so it vanished from a block that still read as complete.
    const summaryOnly = entry({
      id: 'so',
      summary: 'NEVER deploy on a Friday - this is the whole note',
      sourcePath: path.join(GLOBAL_DIR, 'prefs.md'),
      storedAt: Date.now(),
      bodyPreview: '',
    });
    const withBody = entry({
      id: 'wb',
      summary: 'has a body',
      sourcePath: path.join(GLOBAL_DIR, 'journal.md'),
      storedAt: Date.now() - 1000,
      bodyPreview: 'this body is present',
    });
    setIjfwArchiveService({
      listEntries: async () => ({ entries: [summaryOnly, withBody], total: 2 }),
      getEntry: async (id: string) =>
        id === 'so' ? { ...summaryOnly, body: '' } : { ...withBody, body: 'this body is present' },
      dispose: () => {},
    } as unknown as IjfwArchiveService);

    const block = await loadGlobalMemoryBlock();
    // The note itself must survive - the summary IS the content here.
    expect(block).toContain('NEVER deploy on a Friday - this is the whole note');
    expect(block).toContain('…(entry body empty)');
    expect(block).toContain('this body is present');
    // Nothing was dropped, so no omission notice - and, critically, the empty
    // entry must not be quietly subtracted out to make the numbers balance.
    expect(block.match(/^## /gm)).toHaveLength(2);
    expect(block).not.toMatch(/more memory entr/);
  });

  it('adds no omission notice when every entry fits', async () => {
    setIjfwArchiveService({
      listEntries: async () => ({
        entries: [entry({ id: 'a', summary: 'small note', sourcePath: path.join(GLOBAL_DIR, 'a.md') })],
        total: 1,
      }),
      getEntry: async () => ({ id: 'a', body: 'short body' }),
      dispose: () => {},
    } as unknown as IjfwArchiveService);

    const block = await loadGlobalMemoryBlock();
    expect(block).toContain('short body');
    expect(block).not.toMatch(/more memory entr/);
    expect(block).not.toContain('(preview only');
  });
});
