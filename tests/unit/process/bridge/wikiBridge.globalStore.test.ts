/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #1064: `getCurrentProjectPath()` sorts the project index by `lastActive` and
 * takes the head. The global memory store (see #137) is in that index and is
 * almost always the most recently touched root, so every wiki read and every
 * concept write resolved to the user's HOME directory.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type Handler = (args?: unknown) => Promise<unknown>;

const { providers, stateChanged, mockGetProjects, mockGetWikiState, mockBuildWikiState } = vi.hoisted(() => ({
  providers: new Map<string, Handler>(),
  stateChanged: { emit: vi.fn() },
  mockGetProjects: vi.fn(),
  mockGetWikiState: vi.fn(),
  mockBuildWikiState: vi.fn(),
}));

vi.mock('electron-log', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    wiki: {
      listConcepts: { provider: (handler: Handler) => providers.set('listConcepts', handler) },
      getConcept: { provider: (handler: Handler) => providers.set('getConcept', handler) },
      synthesizeOrphan: { provider: (handler: Handler) => providers.set('synthesizeOrphan', handler) },
      reSynthesize: { provider: (handler: Handler) => providers.set('reSynthesize', handler) },
      resolveBacklink: { provider: (handler: Handler) => providers.set('resolveBacklink', handler) },
      getBacklinkGraph: { provider: (handler: Handler) => providers.set('getBacklinkGraph', handler) },
      getState: { provider: (handler: Handler) => providers.set('getState', handler) },
      synthesizeNow: { provider: (handler: Handler) => providers.set('synthesizeNow', handler) },
      stateChanged,
    },
  },
}));

vi.mock('@process/services/wiki/wikiIndex', () => ({
  getWikiState: mockGetWikiState,
  buildWikiState: mockBuildWikiState,
}));

vi.mock('@process/services/memory/ijfwArchiveService', () => ({
  getIjfwArchiveService: () => ({
    getProjects: mockGetProjects,
    getEntry: vi.fn().mockResolvedValue({ id: 'm1', content: 'note', storedAt: 1 }),
  }),
}));

vi.mock('@process/services/wiki/wikiSynthesizer', () => ({
  synthesize: vi.fn().mockResolvedValue({
    id: 'c1',
    slug: 'concept-one',
    name: 'Concept One',
    topicTag: 'Architecture',
    tldr: 'tldr',
    body: 'body',
    aliases: [],
    tags: [],
    freshness: 'fresh',
    sourceMemoryIds: ['m1'],
    relatedConcepts: [],
    linkedFromConcepts: [],
    lastSynthesizedAt: 1,
  }),
}));
vi.mock('@process/services/wiki/wikiAutoSync', () => ({ runSynthesisSweep: vi.fn() }));
vi.mock('@process/services/wiki/wikilinkResolver', () => ({ resolveWikilink: vi.fn() }));

import { initWikiBridge } from '@process/bridge/wikiBridge';

describe('wikiBridge global-store exclusion', () => {
  let globalStoreRoot: string;
  let projectRoot: string;

  beforeEach(() => {
    providers.clear();
    vi.clearAllMocks();
    globalStoreRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-bridge-global-'));
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-bridge-project-'));

    mockGetWikiState.mockReset().mockResolvedValue({
      version: 1,
      concepts: [],
      backlinkGraph: {},
      orphanCandidates: [],
      lastUpdatedAt: 1,
    });
    mockBuildWikiState.mockReset().mockResolvedValue({
      version: 1,
      concepts: [],
      backlinkGraph: {},
      orphanCandidates: [],
      lastUpdatedAt: 1,
    });
    mockGetProjects.mockReset().mockResolvedValue([
      { path: globalStoreRoot, basename: path.basename(globalStoreRoot), count: 40, lastActive: 2_000, isGlobalStore: true },
      { path: projectRoot, basename: path.basename(projectRoot), count: 3, lastActive: 1_000 },
    ]);

    initWikiBridge();
  });

  afterEach(() => {
    fs.rmSync(globalStoreRoot, { recursive: true, force: true });
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('reads state from the most recent real project, not the global store', async () => {
    await providers.get('getState')!();

    expect(mockGetWikiState).toHaveBeenCalledWith(projectRoot);
    expect(mockGetWikiState).not.toHaveBeenCalledWith(globalStoreRoot);
  });

  it('writes a synthesized concept into the project, never the global store', async () => {
    const result = (await providers.get('synthesizeOrphan')!({ memoryIds: ['m1'] })) as { ok: boolean };

    expect(result.ok).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, '.ijfw', 'wiki', 'Concept One.md'))).toBe(true);
    expect(fs.existsSync(path.join(globalStoreRoot, '.ijfw'))).toBe(false);
  });

  it('fails closed when the global store is the only indexed root', async () => {
    mockGetProjects.mockResolvedValue([
      { path: globalStoreRoot, basename: path.basename(globalStoreRoot), count: 40, lastActive: 2_000, isGlobalStore: true },
    ]);

    const result = (await providers.get('getState')!()) as { concepts: unknown[] };

    expect(result.concepts).toEqual([]);
    expect(mockGetWikiState).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(globalStoreRoot, '.ijfw'))).toBe(false);
  });
});
