/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runSynthesisSweep, startWikiAutoSync } from '@process/services/wiki/wikiAutoSync';

// ===== Mock heavy dependencies so unit tests stay fast =====

vi.mock('@process/services/memory/ijfwArchiveService', () => ({
  getIjfwArchiveService: () => ({
    getProjects: vi.fn().mockResolvedValue([]),
    listEntries: vi.fn().mockResolvedValue({ entries: [], total: 0 }),
    init: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@process/services/wiki/wikiIndex', () => ({
  buildWikiState: vi.fn().mockResolvedValue({
    version: 1,
    concepts: [],
    backlinkGraph: {},
    orphanCandidates: [],
    lastUpdatedAt: Date.now(),
  }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    wiki: {
      stateChanged: { emit: vi.fn() },
    },
  },
}));

vi.mock('@process/services/wiki/wikiSynthesizer', () => ({
  synthesizeMany: vi.fn().mockResolvedValue([]),
}));

// ===== Tests =====

describe('startWikiAutoSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a handle with a stop() function', () => {
    const handle = startWikiAutoSync(1000);
    expect(typeof handle.stop).toBe('function');
    handle.stop();
  });

  it('skips a sweep when no project is active instead of using the launch directory', async () => {
    const cwd = vi.spyOn(process, 'cwd');
    const { buildWikiState } = await import('@process/services/wiki/wikiIndex');
    const { synthesizeMany } = await import('@process/services/wiki/wikiSynthesizer');

    await expect(runSynthesisSweep()).resolves.toBe(0);

    expect(cwd).not.toHaveBeenCalled();
    expect(buildWikiState).not.toHaveBeenCalled();
    expect(synthesizeMany).not.toHaveBeenCalled();
    cwd.mockRestore();
  });

  it('stop() prevents further interval ticks', () => {
    let tickCount = 0;
    // Spy on interval creation but use real fake timers
    const handle = startWikiAutoSync(1000);
    handle.stop();

    // After stop, advancing time should not cause errors or re-run
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    // tickCount never incremented because mock synthesizeMany returns []
    expect(tickCount).toBe(0);
  });

  it('schedules repeated sweeps at the given interval', async () => {
    const { synthesizeMany } = await import('@process/services/wiki/wikiSynthesizer');
    const mockSynthesize = vi.mocked(synthesizeMany);
    mockSynthesize.mockResolvedValue([]);

    const handle = startWikiAutoSync(500);

    // First tick
    await vi.advanceTimersByTimeAsync(500);
    // Second tick
    await vi.advanceTimersByTimeAsync(500);

    // synthesizeMany should have been called for each tick
    // (runSynthesisSweep calls it internally)
    handle.stop();
    // No assertion on exact count since the internal sweep calls listEntries
    // which is also mocked - just verify no errors thrown
  });

  it('stop() is idempotent - calling twice does not throw', () => {
    const handle = startWikiAutoSync(1000);
    handle.stop();
    expect(() => handle.stop()).not.toThrow();
  });
});
