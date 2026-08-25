/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1106 - `EPERM: operation not permitted, mkdir 'C:\Program Files\Wayland\.ijfw\wiki-state'`.
 *
 * ROOT CAUSE OF THE REPORT, established by reading the shipped code at the
 * version in the reporter's own log (`v0.9.6-rc.2.1`) rather than from memory:
 * both wiki write sites fell back to `process.cwd()` when the project list was
 * empty (`git show 2b3b60e11:src/process/services/wiki/wikiAutoSync.ts` line 118,
 * and the same in `wikiBridge.ts` line 55). A packaged Windows app launched from
 * its Start-menu shortcut has `cwd` = its own install directory, so the fallback
 * resolved to `C:\Program Files\Wayland` verbatim. That fallback is already gone
 * from main and is covered by `wikiAutoSync.test.ts` and
 * `wikiBridge.noProject.test.ts`.
 *
 * THIS IS NOT #1064. #1064 is the HOME directory arriving as `projects[0]`
 * because the global memory store is injected into the project registry (#137)
 * and is almost always the most recently active row. `isGlobalStoreRoot`
 * compares against `os.homedir()`; `C:\Program Files\Wayland` is not the home
 * directory on any Windows install, so the two reports have different causes and
 * the #1064 fix does not close this one.
 *
 * WHAT IS STILL OPEN, and what these tests pin: the surviving selection is
 * `getProjects()` sorted by `lastActive`, taken at face value. Nothing refuses a
 * destination that is an OS-protected install root, so any registry row pointing
 * at one - `~/.ijfw/registry.md` is a plain text file written by the IJFW CLI,
 * and the install directory is exactly where a user running the CLI from the app
 * folder puts one - reproduces the reported EPERM on current main. A write
 * destination the OS refuses is not a project, and the sweep must decline it
 * rather than throw a permissions error at the user once a minute.
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

vi.mock('@process/services/wiki/wikiIndex', () => ({ buildWikiState: mockBuildWikiState }));
vi.mock('@process/services/wiki/wikiSynthesizer', () => ({ synthesizeMany: mockSynthesizeMany }));
vi.mock('@/common', () => ({ ipcBridge: { wiki: { stateChanged: { emit: vi.fn() } } } }));
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

/** A destination the OS refuses, spelled the way THIS platform spells one. */
const PROTECTED_ROOT =
  process.platform === 'win32'
    ? 'C:\\Program Files\\Wayland'
    : process.platform === 'darwin'
      ? '/Applications/Wayland.app/Contents'
      : '/usr/lib/wayland';

/**
 * An ordinary user project - the control that proves the sweep still works.
 * A real disposable directory, because the accepted branch genuinely writes
 * `.ijfw/wiki-state/index.json` into whatever it selects.
 */
let REAL_PROJECT = '';

const EMPTY_STATE = {
  version: 1 as const,
  concepts: [],
  backlinkGraph: {},
  orphanCandidates: [],
  lastUpdatedAt: 0,
};

describe('#1106 the wiki never writes into an OS-protected install root', () => {
  beforeEach(() => {
    REAL_PROJECT = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-dest-'));
    vi.clearAllMocks();
    mockBuildWikiState.mockReset().mockResolvedValue(EMPTY_STATE);
    mockSynthesizeMany.mockReset().mockResolvedValue([]);
    mockGetProjects.mockReset();
  });

  afterEach(() => {
    fs.rmSync(REAL_PROJECT, { recursive: true, force: true });
  });

  it('declines the install directory as a write destination', async () => {
    mockGetProjects.mockResolvedValue([{ path: PROTECTED_ROOT, basename: 'Wayland', count: 1, lastActive: 2000 }]);

    await expect(runSynthesisSweep()).resolves.toBe(0);

    // Nothing may even be READ from there, because the same path is where the
    // sidecar `.ijfw/wiki-state/index.json` would then be written.
    expect(mockBuildWikiState).not.toHaveBeenCalled();
    expect(mockSynthesizeMany).not.toHaveBeenCalled();
  });

  it('skips past a protected root to the most recent REAL project', async () => {
    mockGetProjects.mockResolvedValue([
      { path: PROTECTED_ROOT, basename: 'Wayland', count: 1, lastActive: 9000 },
      { path: REAL_PROJECT, basename: 'some-project', count: 3, lastActive: 100 },
    ]);

    await runSynthesisSweep();

    expect(mockBuildWikiState).toHaveBeenCalledWith(REAL_PROJECT);
  });

  it('also declines the global memory store, which is not a project either (#1064)', async () => {
    mockGetProjects.mockResolvedValue([
      { path: os.homedir(), basename: 'sean', count: 9, lastActive: 9000, isGlobalStore: true },
      { path: REAL_PROJECT, basename: 'some-project', count: 3, lastActive: 100 },
    ]);

    await runSynthesisSweep();

    expect(mockBuildWikiState).toHaveBeenCalledWith(REAL_PROJECT);
  });

  it('KNOWN POSITIVE: an ordinary project is still selected and swept', async () => {
    // Proves the three refusals above are real filtering and not "the sweep
    // never runs" - the identical harness, with only the destination changed.
    mockGetProjects.mockResolvedValue([{ path: REAL_PROJECT, basename: 'some-project', count: 3, lastActive: 100 }]);

    await runSynthesisSweep();

    expect(mockBuildWikiState).toHaveBeenCalledWith(REAL_PROJECT);
    expect(mockSynthesizeMany).toHaveBeenCalled();
  });

  it('declines when EVERY candidate is refused, rather than picking the least-bad one', async () => {
    mockGetProjects.mockResolvedValue([
      { path: PROTECTED_ROOT, basename: 'Wayland', count: 1, lastActive: 9000 },
      { path: os.homedir(), basename: 'sean', count: 9, lastActive: 8000, isGlobalStore: true },
    ]);

    await expect(runSynthesisSweep()).resolves.toBe(0);
    expect(mockBuildWikiState).not.toHaveBeenCalled();
  });
});
