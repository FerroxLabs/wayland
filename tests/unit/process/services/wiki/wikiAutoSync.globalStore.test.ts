/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #1064: the global memory store rides in the project index (see #137) with a
 * `lastActive` that is usually the newest of all roots, because every chat in
 * every project writes to it. Picking `projects[0]` by `lastActive` therefore
 * resolves the sweep to the user's HOME directory and scatters
 * `.ijfw/wiki-state` (and synthesized concept files) there.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runSynthesisSweep } from '@process/services/wiki/wikiAutoSync';

const { mockBuildWikiState, mockGetProjects, mockSynthesizeMany } = vi.hoisted(() => ({
  mockBuildWikiState: vi.fn(),
  mockGetProjects: vi.fn(),
  mockSynthesizeMany: vi.fn(),
}));

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

describe('runSynthesisSweep global-store exclusion', () => {
  let globalStoreRoot: string;
  let projectRoot: string;

  beforeEach(() => {
    vi.clearAllMocks();
    globalStoreRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-global-store-'));
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-real-project-'));

    mockBuildWikiState.mockReset().mockResolvedValue({
      version: 1,
      concepts: [],
      backlinkGraph: {},
      orphanCandidates: [],
      lastUpdatedAt: 1_000,
    });
    mockSynthesizeMany.mockReset().mockResolvedValue([]);
    mockGetProjects.mockReset().mockResolvedValue([
      // The global store is the most recently active root, exactly as it is on
      // a real machine - every chat in every project appends to it.
      { path: globalStoreRoot, basename: path.basename(globalStoreRoot), count: 40, lastActive: 2_000, isGlobalStore: true },
      { path: projectRoot, basename: path.basename(projectRoot), count: 3, lastActive: 1_000 },
    ]);
  });

  afterEach(() => {
    fs.rmSync(globalStoreRoot, { recursive: true, force: true });
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('sweeps the most recent real project, never the global store', async () => {
    await runSynthesisSweep();

    expect(mockBuildWikiState).toHaveBeenCalledWith(projectRoot);
    expect(mockBuildWikiState).not.toHaveBeenCalledWith(globalStoreRoot);
    expect(fs.existsSync(path.join(projectRoot, '.ijfw', 'wiki-state', 'index.json'))).toBe(true);
    expect(fs.existsSync(path.join(globalStoreRoot, '.ijfw'))).toBe(false);
  });

  it('skips the sweep when the global store is the only indexed root', async () => {
    mockGetProjects.mockResolvedValue([
      { path: globalStoreRoot, basename: path.basename(globalStoreRoot), count: 40, lastActive: 2_000, isGlobalStore: true },
    ]);

    await expect(runSynthesisSweep()).resolves.toBe(0);

    expect(mockBuildWikiState).not.toHaveBeenCalled();
    expect(mockSynthesizeMany).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(globalStoreRoot, '.ijfw'))).toBe(false);
  });
});
