/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure helpers for the frictionless "file a detailed GitHub issue" flow (#464).
 *
 * These build the pre-filled GitHub new-issue URL from app/engine versions, the
 * OS, and the already-sanitized `wayland_concierge_diag` overview. Kept free of
 * any Electron imports so the URL/body assembly and truncation can be unit
 * tested without an Electron runtime; the side effects (screenshot capture,
 * clipboard, opening the browser) live in `bugReportBridge.ts`.
 */

/** GitHub repo all Wayland support routes through. */
export const BUG_REPORT_REPO = 'FerroxLabs/wayland';

/** The plain new-issue endpoint (title + body prefill, no template chooser). */
export const GITHUB_NEW_ISSUE_BASE = `https://github.com/${BUG_REPORT_REPO}/issues/new`;

/**
 * GitHub's server rejects issue links whose query string is very long, and
 * browsers cap total URL length. GitHub's own guidance is ~8 KB; we stay well
 * under it and truncate the diagnostics section to fit.
 */
export const MAX_ISSUE_URL_LENGTH = 6000;

export type BugReportInput = {
  /** Short issue title. */
  title: string;
  /** Optional user-supplied "what happened"; a guiding placeholder is used when empty. */
  whatHappened?: string;
  /** Packaged app version (`app.getVersion()`). */
  appVersion: string;
  /** Bundled wayland-core version string, or 'unknown' when unresolvable. */
  engineVersion: string;
  /** `os.platform()`. */
  platform: string;
  /** `os.arch()`. */
  arch: string;
  /** `os.release()`. */
  osRelease: string;
  /** Pre-sanitized `wayland_concierge_diag` overview, JSON-stringified (secrets already masked). */
  diagnostics: string;
  /** Whether an app screenshot was captured to the clipboard (adds a paste hint). */
  screenshotOnClipboard: boolean;
};

export type BuiltIssueUrl = {
  url: string;
  diagnosticsTruncated: boolean;
};

const WHAT_HAPPENED_PLACEHOLDER =
  '<!-- Describe what happened, and the steps to reproduce it. Paste the screenshot (already on your clipboard) here. -->';

const DIAGNOSTICS_TRUNCATED_MARKER = '\n… (diagnostics truncated to fit the link — attach the full report if asked)';

/**
 * Build the markdown issue body. Pure: the caller owns any truncation of
 * `input.diagnostics`; `opts.truncated` only appends the "truncated" marker.
 */
export function formatBugReportBody(input: BugReportInput, opts: { truncated?: boolean } = {}): { body: string } {
  const whatHappened = input.whatHappened?.trim() ? input.whatHappened.trim() : WHAT_HAPPENED_PLACEHOLDER;

  const lines: string[] = [
    '### What happened',
    '',
    whatHappened,
    '',
    '### Environment',
    '',
    `- App version: ${input.appVersion}`,
    `- Engine (wayland-core): ${input.engineVersion}`,
    `- OS: ${input.platform} ${input.osRelease} (${input.arch})`,
    '',
  ];

  if (input.screenshotOnClipboard) {
    lines.push('> A screenshot of the app is on your clipboard — paste it into this issue (Ctrl/Cmd+V).', '');
  }

  if (input.diagnostics.trim()) {
    lines.push(
      '### Diagnostics',
      '',
      '<details><summary>wayland_concierge_diag (sanitized — secrets masked)</summary>',
      '',
      '```json',
      opts.truncated ? `${input.diagnostics}${DIAGNOSTICS_TRUNCATED_MARKER}` : input.diagnostics,
      '```',
      '',
      '</details>'
    );
  }

  return { body: lines.join('\n') };
}

const encodeUrl = (title: string, body: string): string =>
  `${GITHUB_NEW_ISSUE_BASE}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

/**
 * Build the pre-filled GitHub new-issue URL, shrinking the diagnostics section
 * as needed so the final URL stays within {@link MAX_ISSUE_URL_LENGTH}.
 */
export function buildBugReportIssueUrl(input: BugReportInput, opts: { maxUrlLength?: number } = {}): BuiltIssueUrl {
  const maxUrl = opts.maxUrlLength ?? MAX_ISSUE_URL_LENGTH;
  let diagnostics = input.diagnostics;
  let diagnosticsTruncated = false;

  for (;;) {
    const { body } = formatBugReportBody({ ...input, diagnostics }, { truncated: diagnosticsTruncated });
    const url = encodeUrl(input.title, body);

    if (url.length <= maxUrl || diagnostics.length === 0) {
      return { url, diagnosticsTruncated };
    }

    // Too long: drop a chunk of the (least-important, tail) diagnostics and retry.
    diagnosticsTruncated = true;
    const cut = Math.max(200, Math.floor(diagnostics.length * 0.15));
    diagnostics = diagnostics.slice(0, Math.max(0, diagnostics.length - cut));
  }
}
