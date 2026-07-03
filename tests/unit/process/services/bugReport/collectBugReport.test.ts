/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the main-process bug-report collector (#464): diagnostics formatting
 * and the capture/collect orchestration with per-step degradation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConciergeDiagOverview } from '@process/resources/builtinMcp/conciergeDiagServer';

// ---- Mocks (all hoisted so they are in place before the SUT imports) ----

const capturePageMock = vi.hoisted(() => vi.fn());
const writeImageMock = vi.hoisted(() => vi.fn());
const detectWCoreMock = vi.hoisted(() => vi.fn());
const overviewMock = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.13.0',
  },
  clipboard: { writeImage: writeImageMock },
}));

vi.mock('@process/agent/wcore/binaryResolver', () => ({ detectWCore: detectWCoreMock }));

vi.mock('@process/resources/builtinMcp/conciergeDiagServer', () => ({
  createConciergeDiagServer: () => ({ overview: overviewMock }),
}));

vi.mock('@process/utils/initStorage', () => ({ resolveConciergeDiagDeps: () => ({}) }));

import { collectBugReport, formatDiagnostics } from '@process/services/bugReport/collectBugReport';

const emptyOverview = (): ConciergeDiagOverview => ({
  scheduledTasks: { available: true, source: 'db', items: [] },
  mcp: { available: true, source: 'db', items: [] },
  providers: { available: true, source: 'db', items: [] },
  workspace: { available: true, source: 'db', items: [] },
  configPaths: {
    available: true,
    source: 'resolved paths',
    info: { appConfigDir: '~/cfg', engineConfigDir: '~/eng', note: 'n' },
  },
  recentErrors: { available: true, source: 'logs', lines: [] },
});

const fakeImage = (empty: boolean) => ({
  isEmpty: () => empty,
  toPNG: () => Buffer.from('png-bytes'),
});

describe('formatDiagnostics', () => {
  it('leads with flagged items and includes config paths', () => {
    const overview = emptyOverview();
    overview.scheduledTasks.items = [
      {
        name: 'nightly',
        enabled: false,
        nextRunAtMs: null,
        lastRunAt: null,
        lastError: null,
        whyNotRunning: 'disabled',
      },
    ];
    overview.providers.items = [{ id: 'openai', state: 'error', error: 'bad key', flag: 'auth' }];
    overview.recentErrors.lines = ['ERROR something broke'];

    const out = formatDiagnostics(overview);
    expect(out).toContain('`nightly` — disabled');
    expect(out).toContain('`openai` — auth');
    expect(out).toContain('app: ~/cfg');
    expect(out).toContain('engine: ~/eng');
    expect(out).toContain('ERROR something broke');
  });

  it('omits healthy items (only surfaces problems)', () => {
    const overview = emptyOverview();
    overview.mcp.items = [{ name: 'good', enabled: true, status: 'ok', toolCount: 3, lastError: null, flag: null }];
    const out = formatDiagnostics(overview);
    expect(out).toContain('**MCP servers** (db): 1');
    expect(out).not.toContain('`good`');
  });
});

describe('collectBugReport', () => {
  beforeEach(() => {
    capturePageMock.mockReset();
    writeImageMock.mockReset();
    detectWCoreMock.mockReset();
    overviewMock.mockReset();
    detectWCoreMock.mockReturnValue({ available: true, version: 'v0.12.20' });
    overviewMock.mockReturnValue(emptyOverview());
  });

  const makeWin = (empty = false) =>
    ({
      isDestroyed: () => false,
      webContents: { capturePage: capturePageMock.mockResolvedValue(fakeImage(empty)) },
    }) as never;

  it('captures the window, copies ONLY to clipboard (no temp file), and gathers versions', async () => {
    const data = await collectBugReport(makeWin());
    expect(data.appVersion).toBe('0.13.0');
    expect(data.engineVersion).toBe('v0.12.20');
    expect(data.platform).toBe(process.platform);
    expect(data.screenshotCopied).toBe(true);
    expect(writeImageMock).toHaveBeenCalledOnce();
    // No disk write — the screenshot (which can hold on-screen secrets) rides the
    // clipboard only, never a temp file.
    expect(data).not.toHaveProperty('screenshotPath');
    expect(data.diagnostics).toContain('Config paths');
  });

  it('degrades screenshot to not-copied when the window is null', async () => {
    const data = await collectBugReport(null);
    expect(data.screenshotCopied).toBe(false);
    expect(writeImageMock).not.toHaveBeenCalled();
    // Versions + diagnostics still collected.
    expect(data.appVersion).toBe('0.13.0');
  });

  it('does not copy an empty capture', async () => {
    const data = await collectBugReport(makeWin(true));
    expect(data.screenshotCopied).toBe(false);
    expect(writeImageMock).not.toHaveBeenCalled();
  });

  it('degrades engineVersion to null when detection throws', async () => {
    detectWCoreMock.mockImplementation(() => {
      throw new Error('no binary');
    });
    const data = await collectBugReport(makeWin());
    expect(data.engineVersion).toBeNull();
  });

  it('degrades diagnostics to a placeholder when overview throws', async () => {
    overviewMock.mockImplementation(() => {
      throw new Error('db locked');
    });
    const data = await collectBugReport(makeWin());
    expect(data.diagnostics).toContain('unavailable');
  });
});
