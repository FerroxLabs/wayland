import { describe, it, expect } from 'vitest';

import {
  BUG_REPORT_REPO,
  GITHUB_NEW_ISSUE_BASE,
  MAX_ISSUE_URL_LENGTH,
  buildBugReportIssueUrl,
  formatBugReportBody,
  type BugReportInput,
} from '@process/bridge/bugReportUrl';

const baseInput = (overrides: Partial<BugReportInput> = {}): BugReportInput => ({
  title: 'App froze on launch',
  whatHappened: 'The window went white and never recovered.',
  appVersion: '0.11.12',
  engineVersion: 'wayland-core 0.12.21',
  platform: 'darwin',
  arch: 'arm64',
  osRelease: '25.3.0',
  diagnostics: '{"providers":{"available":true,"items":[]}}',
  screenshotOnClipboard: true,
  ...overrides,
});

describe('formatBugReportBody', () => {
  it('includes the environment block and the user description', () => {
    const { body } = formatBugReportBody(baseInput());
    expect(body).toContain('0.11.12');
    expect(body).toContain('wayland-core 0.12.21');
    expect(body).toContain('darwin');
    expect(body).toContain('arm64');
    expect(body).toContain('25.3.0');
    expect(body).toContain('The window went white and never recovered.');
    expect(body).toContain('{"providers":{"available":true,"items":[]}}');
  });

  it('drops in a placeholder prompt when the user gave no description', () => {
    const { body } = formatBugReportBody(baseInput({ whatHappened: '' }));
    // A guiding placeholder so the issue is never blank.
    expect(body.toLowerCase()).toContain('what happened');
    expect(body).toMatch(/<!--|_|describe/i);
  });

  it('adds the clipboard-screenshot note only when a screenshot was captured', () => {
    const withShot = formatBugReportBody(baseInput({ screenshotOnClipboard: true })).body;
    const withoutShot = formatBugReportBody(baseInput({ screenshotOnClipboard: false })).body;
    expect(withShot.toLowerCase()).toContain('paste');
    expect(withoutShot.toLowerCase()).not.toContain('paste');
  });

  it('marks the diagnostics as truncated when told to', () => {
    const { body } = formatBugReportBody(baseInput(), { truncated: true });
    expect(body.toLowerCase()).toContain('truncated');
  });
});

describe('buildBugReportIssueUrl', () => {
  it('targets the FerroxLabs/wayland new-issue endpoint with an encoded title and body', () => {
    const { url } = buildBugReportIssueUrl(baseInput());
    expect(url.startsWith(`${GITHUB_NEW_ISSUE_BASE}?`)).toBe(true);
    expect(url).toContain('title=');
    expect(url).toContain('body=');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('title')).toBe('App froze on launch');
    expect(parsed.searchParams.get('body')).toContain('0.11.12');
  });

  it('exposes the repo constant so callers cannot drift', () => {
    expect(BUG_REPORT_REPO).toBe('FerroxLabs/wayland');
    expect(GITHUB_NEW_ISSUE_BASE).toBe('https://github.com/FerroxLabs/wayland/issues/new');
  });

  it('keeps a short report untruncated and well under the URL cap', () => {
    const { url, diagnosticsTruncated } = buildBugReportIssueUrl(baseInput());
    expect(diagnosticsTruncated).toBe(false);
    expect(url.length).toBeLessThanOrEqual(MAX_ISSUE_URL_LENGTH);
  });

  it('truncates oversized diagnostics so the URL stays within the cap', () => {
    const huge = JSON.stringify({
      recentErrors: Array.from({ length: 4000 }, (_, i) => `error line number ${i} with detail`),
    });
    const { url, diagnosticsTruncated } = buildBugReportIssueUrl(baseInput({ diagnostics: huge }));
    expect(diagnosticsTruncated).toBe(true);
    expect(url.length).toBeLessThanOrEqual(MAX_ISSUE_URL_LENGTH);
    expect(new URL(url).searchParams.get('body')?.toLowerCase()).toContain('truncated');
  });

  it('still returns a valid URL when diagnostics are empty', () => {
    const { url, diagnosticsTruncated } = buildBugReportIssueUrl(baseInput({ diagnostics: '' }));
    expect(diagnosticsTruncated).toBe(false);
    expect(() => new URL(url)).not.toThrow();
  });
});
