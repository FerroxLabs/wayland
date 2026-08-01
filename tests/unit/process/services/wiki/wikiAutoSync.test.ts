/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runSynthesisSweep, startWikiAutoSync } from '@process/services/wiki/wikiAutoSync';

const { mockBuildWikiState, mockGetProjects, mockSynthesizeMany } = vi.hoisted(() => ({
  mockBuildWikiState: vi.fn(),
  mockGetProjects: vi.fn(),
  mockSynthesizeMany: vi.fn(),
}));

// ===== Mock heavy dependencies so unit tests stay fast =====

vi.mock('@process/services/memory/ijfwArchiveService', () => ({
  getIjfwArchiveService: () => ({
    getProjects: mockGetProjects,
    listEntries: vi.fn().mockResolvedValue({ entries: [], total: 0 }),
    init: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@process/services/wiki/wikiIndex', () => ({
  buildWikiState: mockBuildWikiState,
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    wiki: {
      stateChanged: { emit: vi.fn() },
    },
  },
}));

vi.mock('@process/services/wiki/wikiSynthesizer', () => ({
  synthesizeMany: mockSynthesizeMany,
}));

// ===== Tests =====

describe('startWikiAutoSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockGetProjects.mockReset().mockResolvedValue([]);
    mockBuildWikiState.mockReset().mockResolvedValue({
      version: 1,
      concepts: [],
      backlinkGraph: {},
      orphanCandidates: [],
      lastUpdatedAt: Date.now(),
    });
    mockSynthesizeMany.mockReset().mockResolvedValue([]);
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

  it('does not treat the process working directory as a project', async () => {
    await expect(runSynthesisSweep()).resolves.toBe(0);

    expect(mockBuildWikiState).not.toHaveBeenCalled();
    expect(mockSynthesizeMany).not.toHaveBeenCalled();
  });

  it('stop() prevents further interval ticks', () => {
    const handle = startWikiAutoSync(1000);
    handle.stop();

    // After stop, advancing time should not cause errors or re-run.
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    expect(mockGetProjects).not.toHaveBeenCalled();
  });

  it('schedules repeated sweeps at the given interval', async () => {
    const handle = startWikiAutoSync(500);

    // First tick
    await vi.advanceTimersByTimeAsync(500);
    // Second tick
    await vi.advanceTimersByTimeAsync(500);

    expect(mockGetProjects).toHaveBeenCalledTimes(2);
    // With no authorized project, each tick exits before reading or writing.
    expect(mockSynthesizeMany).not.toHaveBeenCalled();
    handle.stop();
  });

  it('stop() is idempotent - calling twice does not throw', () => {
    const handle = startWikiAutoSync(1000);
    handle.stop();
    expect(() => handle.stop()).not.toThrow();
  });
});
