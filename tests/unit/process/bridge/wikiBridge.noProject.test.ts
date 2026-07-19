/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type Handler = (args?: unknown) => Promise<unknown>;

const { providers, stateChanged } = vi.hoisted(() => ({
  providers: new Map<string, Handler>(),
  stateChanged: { emit: vi.fn() },
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

vi.mock('@process/services/memory/ijfwArchiveService', () => ({
  getIjfwArchiveService: () => ({
    getProjects: vi.fn().mockResolvedValue([]),
    getEntry: vi.fn(),
  }),
}));

vi.mock('@process/services/wiki/wikiSynthesizer', () => ({ synthesize: vi.fn() }));
vi.mock('@process/services/wiki/wikiAutoSync', () => ({ runSynthesisSweep: vi.fn() }));
vi.mock('@process/services/wiki/wikilinkResolver', () => ({ resolveWikilink: vi.fn() }));

import { initWikiBridge } from '@process/bridge/wikiBridge';

describe('wikiBridge no-project boundary', () => {
  let launchDirectory: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    providers.clear();
    launchDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-bridge-no-project-'));
    fs.mkdirSync(path.join(launchDirectory, '.ijfw', 'wiki'), { recursive: true });
    fs.writeFileSync(path.join(launchDirectory, '.ijfw', 'wiki', 'should-not-index.md'), '# sentinel');
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(launchDirectory);
    initWikiBridge();
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(launchDirectory, { recursive: true, force: true });
  });

  it('returns an empty state without treating the launch directory as a workspace', async () => {
    const result = (await providers.get('getState')!()) as {
      concepts: unknown[];
      backlinkGraph: Record<string, unknown>;
      orphanCandidates: unknown[];
    };

    expect(result.concepts).toEqual([]);
    expect(result.backlinkGraph).toEqual({});
    expect(result.orphanCandidates).toEqual([]);
    expect(fs.existsSync(path.join(launchDirectory, '.ijfw', 'wiki-state', 'index.json'))).toBe(false);
  });
});
