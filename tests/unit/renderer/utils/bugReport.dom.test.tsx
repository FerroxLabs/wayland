/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Tests for the one-click bug-report util (#464): the pure URL builder and the
 * fileBugReport orchestration (capture IPC → toast → open).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IBugReportData } from '@/common/adapter/ipcBridge';

const captureInvokeMock = vi.hoisted(() => vi.fn());
const openExternalUrlMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const messageSuccessMock = vi.hoisted(() => vi.fn());
const messageInfoMock = vi.hoisted(() => vi.fn());

vi.mock('@/common', () => ({
  ipcBridge: {
    application: {
      captureBugReport: { invoke: captureInvokeMock },
    },
  },
}));

vi.mock('@/renderer/utils/platform', () => ({ openExternalUrl: openExternalUrlMock }));

vi.mock('@arco-design/web-react', () => ({
  Message: { success: messageSuccessMock, info: messageInfoMock },
}));

import { buildBugReportIssueUrl, fileBugReport, GITHUB_ISSUE_CHOOSER_URL } from '@/renderer/utils/bugReport';

const t = ((_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key) as never;

const makeData = (over: Partial<IBugReportData> = {}): IBugReportData => ({
  appVersion: '0.13.0',
  engineVersion: 'v0.12.20',
  platform: 'darwin',
  arch: 'arm64',
  osRelease: '25.3.0',
  diagnostics: '**Providers** (db): 2',
  screenshotCopied: true,
  ...over,
});

describe('buildBugReportIssueUrl', () => {
  it('returns the chooser URL when no data is available', () => {
    expect(buildBugReportIssueUrl(null)).toBe(GITHUB_ISSUE_CHOOSER_URL);
  });

  it('builds an issues/new URL with title + body query params', () => {
    const url = buildBugReportIssueUrl(makeData());
    expect(url.startsWith('https://github.com/FerroxLabs/wayland/issues/new?')).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get('title')).toBe('Bug report: ');
    const body = params.get('body') ?? '';
    expect(body).toContain('- App: 0.13.0');
    expect(body).toContain('- Engine: v0.12.20');
    expect(body).toContain('- OS: darwin arm64 (25.3.0)');
    expect(body).toContain('**Providers** (db): 2');
    expect(body).toContain('clipboard');
  });

  it('shows "unknown" engine and a manual-attach note when unavailable', () => {
    const url = buildBugReportIssueUrl(makeData({ engineVersion: null, screenshotCopied: false }));
    const body = new URL(url).searchParams.get('body') ?? '';
    expect(body).toContain('- Engine: unknown');
    expect(body).toContain('Screenshot capture was unavailable');
  });

  it('truncates very long diagnostics so the URL stays bounded', () => {
    const huge = 'x'.repeat(20000);
    const url = buildBugReportIssueUrl(makeData({ diagnostics: huge }));
    const body = new URL(url).searchParams.get('body') ?? '';
    expect(body).toContain('…(diagnostics truncated)');
    expect(body.length).toBeLessThan(6000);
  });

  it('bounds the ENCODED URL under GitHubs limit even for percent-encoding-heavy diagnostics', () => {
    // Every char here percent-encodes to 3 bytes; a char-only cap would blow the
    // limit (4000 chars -> ~12 KB). The byte-budget guard must keep it under 8 KB.
    const evil = '`#&=?%<>|\n'.repeat(4000);
    const url = buildBugReportIssueUrl(makeData({ diagnostics: evil }));
    const bytes = new TextEncoder().encode(url).length;
    expect(bytes).toBeLessThan(8192);
    // searchParams.get already decodes; it still marks the truncation.
    expect(new URL(url).searchParams.get('body') ?? '').toContain('diagnostics truncated');
  });

  it('does not truncate when diagnostics already fit (no spurious truncation note)', () => {
    const url = buildBugReportIssueUrl(makeData({ diagnostics: 'small diag' }));
    const body = new URL(url).searchParams.get('body') ?? '';
    expect(body).not.toContain('diagnostics truncated');
    expect(new TextEncoder().encode(url).length).toBeLessThan(8192);
  });

  it('only carries title + body params (no extra data leaks into the URL)', () => {
    const params = new URL(buildBugReportIssueUrl(makeData())).searchParams;
    expect([...params.keys()].toSorted()).toEqual(['body', 'title']);
  });
});

describe('fileBugReport', () => {
  beforeEach(() => {
    captureInvokeMock.mockReset();
    openExternalUrlMock.mockReset();
    openExternalUrlMock.mockResolvedValue(undefined);
    messageSuccessMock.mockReset();
    messageInfoMock.mockReset();
  });

  it('captures, toasts the clipboard hint, and opens a pre-filled issue', async () => {
    captureInvokeMock.mockResolvedValue({ success: true, data: makeData() });
    await fileBugReport(t);
    expect(captureInvokeMock).toHaveBeenCalledOnce();
    expect(messageSuccessMock).toHaveBeenCalledOnce();
    const openedUrl = openExternalUrlMock.mock.calls[0]?.[0] as string;
    expect(openedUrl).toContain('issues/new?');
    expect(openedUrl).toContain('body=');
  });

  it('falls back to the chooser URL when capture fails (honest "chooser" toast, not "prefilled")', async () => {
    captureInvokeMock.mockRejectedValue(new Error('boom'));
    await fileBugReport(t);
    expect(openExternalUrlMock).toHaveBeenCalledWith(GITHUB_ISSUE_CHOOSER_URL);
    expect(messageInfoMock).toHaveBeenCalledOnce();
    expect(messageInfoMock.mock.calls[0]?.[0]).toContain('chooser');
    expect(messageSuccessMock).not.toHaveBeenCalled();
  });

  it('prefills but does not claim a copied screenshot when capture was unavailable', async () => {
    captureInvokeMock.mockResolvedValue({ success: true, data: makeData({ screenshotCopied: false }) });
    await fileBugReport(t);
    // Prefilled issue (not the chooser), but the toast must not promise a screenshot.
    const openedUrl = openExternalUrlMock.mock.calls[0]?.[0] as string;
    expect(openedUrl).toContain('issues/new?');
    expect(messageInfoMock).toHaveBeenCalledOnce();
    expect(messageInfoMock.mock.calls[0]?.[0]).toContain('attach a screenshot');
    expect(messageSuccessMock).not.toHaveBeenCalled();
  });

  it('falls back to the chooser URL when the IPC returns unsuccessful', async () => {
    captureInvokeMock.mockResolvedValue({ success: false, msg: 'no window' });
    await fileBugReport(t);
    expect(openExternalUrlMock).toHaveBeenCalledWith(GITHUB_ISSUE_CHOOSER_URL);
  });
});
