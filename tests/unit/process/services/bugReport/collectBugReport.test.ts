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
const resolveFuigoBinaryMock = vi.hoisted(() => vi.fn());
const overviewMock = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.13.0',
  },
  clipboard: { writeImage: writeImageMock },
}));

vi.mock('@process/agent/fuigo/runtime', () => ({ resolveFuigoBinary: resolveFuigoBinaryMock }));

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
  platform: {
    available: true,
    source: 'app runtime',
    info: { os: 'darwin', appArch: 'arm64', runningUnderARM64Translation: false, whyProblem: null },
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
    expect(out).toContain('1 task — disabled');
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

/**
 * #1366: the diagnostics block is pasted verbatim into a PUBLIC GitHub issue.
 * Issue #1292 shipped a stranger's scheduled-task names and chat titles to the
 * world through it. Every assertion here is on the USER-AUTHORED string never
 * appearing anywhere in the report body.
 */
describe('formatDiagnostics privacy (#1366)', () => {
  /** Distinctive enough that an accidental substring match cannot be a coincidence. */
  const SECRET_TASK = 'Monthly investor update — Northwind acquisition';
  const SECRET_PROJECT = 'Project Barracuda (unannounced)';
  const SECRET_CHAT = 'How do I fix my divorce filing paperwork';

  const withUserAuthoredTitles = (): ConciergeDiagOverview => {
    const overview = emptyOverview();
    overview.scheduledTasks.items = [
      {
        name: SECRET_TASK,
        enabled: false,
        nextRunAtMs: null,
        lastRunAt: null,
        lastError: null,
        whyNotRunning: 'This task is turned off (disabled).',
      },
    ];
    overview.workspace.items = [
      {
        kind: 'project',
        name: SECRET_PROJECT,
        workspace: null,
        isTemporary: true,
        whyProblem: 'This project has no persistent workspace folder.',
      },
      {
        kind: 'conversation',
        name: SECRET_CHAT,
        workspace: null,
        isTemporary: true,
        whyProblem: 'This chat is using a temporary workspace.',
      },
    ];
    return overview;
  };

  it('never emits a user-authored scheduled-task name', () => {
    const out = formatDiagnostics(withUserAuthoredTitles());
    expect(out).not.toContain(SECRET_TASK);
    expect(out).not.toContain('Northwind');
  });

  it('never emits a user-authored project name or chat title', () => {
    const out = formatDiagnostics(withUserAuthoredTitles());
    expect(out).not.toContain(SECRET_PROJECT);
    expect(out).not.toContain('Barracuda');
    expect(out).not.toContain(SECRET_CHAT);
    expect(out).not.toContain('divorce');
  });

  it('keeps the reason and the count, which are the debugging signal', () => {
    const out = formatDiagnostics(withUserAuthoredTitles());
    expect(out).toContain('1 task — This task is turned off (disabled).');
    expect(out).toContain('1 project — This project has no persistent workspace folder.');
    expect(out).toContain('1 conversation — This chat is using a temporary workspace.');
  });

  it('counts every item sharing a reason, not just the first page of them', () => {
    const overview = emptyOverview();
    // 13 tasks, more than MAX_ITEMS_PER_SECTION (8): the old per-item loop sliced
    // to 8 and under-reported. A count must cover all 13.
    overview.scheduledTasks.items = Array.from({ length: 13 }, (_, i) => ({
      name: `secret task ${i}`,
      enabled: false,
      nextRunAtMs: null,
      lastRunAt: null,
      lastError: null,
      whyNotRunning: 'This task is turned off (disabled).',
    }));
    const out = formatDiagnostics(overview);
    expect(out).toContain('13 tasks — This task is turned off (disabled).');
    expect(out).not.toContain('secret task');
  });

  it('still names MCP connectors and providers, which the user did not author', () => {
    const overview = emptyOverview();
    overview.mcp.items = [
      { name: 'chrome-devtools', enabled: true, status: null, toolCount: 0, lastError: null, flag: 'exposes 0 tools' },
    ];
    overview.providers.items = [{ id: 'openai', state: 'error', error: null, flag: 'reconnect' }];
    const out = formatDiagnostics(overview);
    expect(out).toContain('`chrome-devtools` — exposes 0 tools');
    expect(out).toContain('`openai` — reconnect');
  });

  it('keeps user-authored titles out of the collected report payload', async () => {
    overviewMock.mockReturnValue(withUserAuthoredTitles());
    const data = await collectBugReport(null);
    expect(data.diagnostics).not.toContain(SECRET_TASK);
    expect(data.diagnostics).not.toContain(SECRET_PROJECT);
    expect(data.diagnostics).not.toContain(SECRET_CHAT);
    expect(JSON.stringify(data)).not.toContain('Barracuda');
  });
});

describe('collectBugReport', () => {
  beforeEach(() => {
    capturePageMock.mockReset();
    writeImageMock.mockReset();
    resolveFuigoBinaryMock.mockReset();
    overviewMock.mockReset();
    resolveFuigoBinaryMock.mockReturnValue({ path: '/bundle/fuigo', version: '1.0.13' });
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
    expect(data.engineVersion).toBe('1.0.13');
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
    resolveFuigoBinaryMock.mockImplementation(() => {
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
