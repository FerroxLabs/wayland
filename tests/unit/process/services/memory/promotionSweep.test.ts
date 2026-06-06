/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { startPromotionSweep } from '@process/services/memory/promotionSweep';
import { clearWikiWriterState } from '@process/services/memory/wikiWriter';
import type { MemoryEntry, ListFilter } from '@/common/types/memory';

// ===== Helpers =====

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-test-'));
}

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2)}`,
    type: 'decision',
    project: 'test-project',
    projectPath: '/tmp/test-project',
    summary: 'Some important decision',
    bodyPreview: 'Short preview.',
    body: 'Full body.',
    tags: ['decision'],
    storedAt: Date.now() - 20 * 60 * 1000, // 20 min ago - old enough
    sourcePath: '/tmp/test-project/.ijfw/memory/knowledge.md',
    sourceLine: 1,
    referencedBy: 0,
    promotionScore: 95,
    ...overrides,
  };
}

function makeArchiveMock(entries: MemoryEntry[], extraEntries?: MemoryEntry[]) {
  let callCount = 0;
  return {
    listEntries: vi.fn(async (_filter: ListFilter) => ({
      entries,
      total: entries.length,
    })),
    getStats: vi.fn(async () => {
      callCount++;
      // On subsequent calls, simulate extra entries being added
      const total = callCount === 1 ? entries.length : entries.length + (extraEntries?.length ?? 0);
      return { total };
    }),
    _callCount: () => callCount,
  };
}

// ===== Tests =====

describe('startPromotionSweep', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    clearWikiWriterState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('getCandidates returns initial empty state before first run', () => {
    const archive = makeArchiveMock([]);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      initialThreshold: 90,
    });
    const state = sweep.getCandidates();
    expect(state.threshold).toBe(90);
    expect(state.candidates).toEqual([]);
    expect(typeof state.lastRunAt).toBe('number');
    expect(typeof state.nextRunAt).toBe('number');
    sweep.stop();
  });

  it('setThreshold updates the threshold in returned state', () => {
    const archive = makeArchiveMock([]);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      initialThreshold: 90,
    });
    sweep.setThreshold(75);
    expect(sweep.getCandidates().threshold).toBe(75);
    sweep.stop();
  });

  it('setAutoPromoteEnabled updates the flag in returned state', () => {
    const archive = makeArchiveMock([]);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      autoPromoteEnabled: true,
    });
    sweep.setAutoPromoteEnabled(false);
    expect(sweep.getCandidates().autoPromoteEnabled).toBe(false);
    sweep.stop();
  });

  it('forceRun populates candidates from archive', async () => {
    const highScoreEntry = makeEntry({ id: 'hs01', promotionScore: 95 });
    const archive = makeArchiveMock([highScoreEntry]);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      initialThreshold: 90,
      autoPromoteEnabled: false, // don't actually write files
    });

    await sweep.forceRun();

    const state = sweep.getCandidates();
    expect(state.candidates.length).toBe(1);
    expect(state.candidates[0]?.id).toBe('hs01');
    sweep.stop();
  });

  it('forceRun skips entries below threshold', async () => {
    const lowEntry = makeEntry({ id: 'low01', promotionScore: 50 });
    const archive = makeArchiveMock([lowEntry]);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      initialThreshold: 90,
      autoPromoteEnabled: false,
    });

    await sweep.forceRun();

    expect(sweep.getCandidates().candidates).toHaveLength(0);
    sweep.stop();
  });

  it('forceRun does not promote when autoPromoteEnabled=false', async () => {
    const highEntry = makeEntry({ id: 'hp01', promotionScore: 95, projectPath: tmpDir });
    const archive = makeArchiveMock([highEntry]);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      initialThreshold: 90,
      autoPromoteEnabled: false,
    });

    await sweep.forceRun();

    // No wiki files should have been created.
    const files = fs.readdirSync(tmpDir);
    const wikiFiles = files.filter((f) => f.endsWith('.md'));
    expect(wikiFiles).toHaveLength(0);
    sweep.stop();
  });

  it('forceRun respects 10-minute minimum age (entry too new is skipped)', async () => {
    const tooNew = makeEntry({
      id: 'new01',
      promotionScore: 95,
      storedAt: Date.now() - 2 * 60 * 1000, // 2 min ago - too fresh
      projectPath: tmpDir,
    });
    const archive = makeArchiveMock([tooNew]);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      initialThreshold: 90,
      autoPromoteEnabled: true,
    });

    await sweep.forceRun();

    // Candidate shows in list (not yet promoted) but no file written.
    const state = sweep.getCandidates();
    expect(state.candidates.length).toBe(1);
    const wikiDir = path.join(tmpDir, '.ijfw', 'wiki');
    const exists = fs.existsSync(wikiDir);
    if (exists) {
      const files = fs.readdirSync(wikiDir).filter((f) => f.endsWith('.md'));
      expect(files).toHaveLength(0);
    }
    sweep.stop();
  });

  it('stop() prevents timer from firing again', () => {
    const archive = makeArchiveMock([]);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 1_000,
    });
    sweep.stop();
    // Advance timer well past interval - listEntries should not be called
    // (the initial 5s delay would have fired before stop, but forceRun mock was not set up)
    vi.advanceTimersByTime(10_000);
    // Archive mock was called 0 times (no forceRun, stop called before initialDelay)
    expect(archive.listEntries).not.toHaveBeenCalled();
  });

  // ----- Change C: factsExtracted delta -----

  it('C-factsExtracted: first sweep reports 0 (cold-boot policy)', async () => {
    const entries = Array.from({ length: 10 }, (_, i) => makeEntry({ id: `e${i}` }));
    const archive = makeArchiveMock(entries);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      initialThreshold: 90,
      autoPromoteEnabled: false,
    });

    await sweep.forceRun();

    const state = sweep.getCandidates();
    expect(state.lastDream?.factsExtracted).toBe(0);
    sweep.stop();
  });

  it('C-factsExtracted: second sweep after 5 additions reports 5', async () => {
    const baseEntries = Array.from({ length: 10 }, (_, i) => makeEntry({ id: `b${i}`, promotionScore: 20 }));
    // makeArchiveMock with extraEntries simulates 5 extra on second+ call
    const extra = Array.from({ length: 5 }, (_, i) => makeEntry({ id: `x${i}`, promotionScore: 20 }));
    const archive = makeArchiveMock(baseEntries, extra);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      initialThreshold: 90,
      autoPromoteEnabled: false,
    });

    // First sweep: seeds previousTotalEntries = 10, reports 0
    await sweep.forceRun();
    expect(sweep.getCandidates().lastDream?.factsExtracted).toBe(0);

    // Second sweep: getStats returns 15, delta = 5
    await sweep.forceRun();
    expect(sweep.getCandidates().lastDream?.factsExtracted).toBe(5);
    sweep.stop();
  });

  it('C-factsExtracted: third sweep with no new entries reports 0', async () => {
    const baseEntries = Array.from({ length: 10 }, (_, i) => makeEntry({ id: `b${i}`, promotionScore: 20 }));
    const extra = Array.from({ length: 5 }, (_, i) => makeEntry({ id: `x${i}`, promotionScore: 20 }));
    const archive = makeArchiveMock(baseEntries, extra);
    const sweep = startPromotionSweep({
      archive: archive as never,
      intervalMs: 60_000,
      initialThreshold: 90,
      autoPromoteEnabled: false,
    });

    await sweep.forceRun(); // first: seeds at 10, reports 0
    await sweep.forceRun(); // second: 15, delta=5

    // For third sweep we need getStats to return 15 again (no new entries).
    // Reset the mock to always return 15:
    archive.getStats.mockResolvedValue({ total: 15 });
    await sweep.forceRun(); // third: still 15, delta=0
    expect(sweep.getCandidates().lastDream?.factsExtracted).toBe(0);
    sweep.stop();
  });
});
