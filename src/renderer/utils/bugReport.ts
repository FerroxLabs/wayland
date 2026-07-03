/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-click "file a detailed GitHub issue" flow (issue #464).
 *
 * The main process captures the app window (no OS permission needed), copies it
 * to the clipboard, and returns diagnostics + versions. Here we assemble a
 * pre-filled GitHub new-issue URL and open it in the browser for the user to
 * review + submit. No GitHub token in the app — guided creation, no abuse risk.
 */

import { Message } from '@arco-design/web-react';
import type { TFunction } from 'i18next';
import { ipcBridge } from '@/common';
import type { IBugReportData } from '@/common/adapter/ipcBridge';
import { openExternalUrl } from '@/renderer/utils/platform';

const GITHUB_NEW_ISSUE_URL = 'https://github.com/FerroxLabs/wayland/issues/new';
/** The issue-template chooser — fallback when capture/prefill fails. */
export const GITHUB_ISSUE_CHOOSER_URL = 'https://github.com/FerroxLabs/wayland/issues/new/choose';

/**
 * Cap the diagnostics block so the assembled URL stays well under browser/OS URL
 * limits (~8 KB after percent-encoding). The screenshot — the heavy artifact —
 * rides the clipboard, not the URL, so the body stays lean.
 */
const MAX_DIAGNOSTICS_CHARS = 4000;

const truncateDiagnostics = (diagnostics: string): string => {
  if (diagnostics.length <= MAX_DIAGNOSTICS_CHARS) return diagnostics;
  return `${diagnostics.slice(0, MAX_DIAGNOSTICS_CHARS)}\n…(diagnostics truncated)`;
};

/**
 * Build the pre-filled GitHub new-issue URL from a bug-report payload. Pure and
 * side-effect-free so it can be unit-tested. Returns the chooser URL when no data
 * is available.
 */
export function buildBugReportIssueUrl(data: IBugReportData | null): string {
  if (!data) return GITHUB_ISSUE_CHOOSER_URL;

  const engine = data.engineVersion ?? 'unknown';
  const screenshotNote = data.screenshotCopied
    ? '📎 A screenshot of the app was copied to your clipboard — paste it here (Cmd/Ctrl+V).'
    : '_(Screenshot capture was unavailable — attach one manually if you can.)_';

  const body = [
    '### What happened',
    '<!-- Describe what you were doing and what went wrong. -->',
    '',
    '### Environment',
    `- App: ${data.appVersion}`,
    `- Engine: ${engine}`,
    `- OS: ${data.platform} ${data.arch} (${data.osRelease})`,
    '',
    '### Diagnostics',
    truncateDiagnostics(data.diagnostics),
    '',
    '---',
    screenshotNote,
  ].join('\n');

  const params = new URLSearchParams({ title: 'Bug report: ', body });
  return `${GITHUB_NEW_ISSUE_URL}?${params.toString()}`;
}

/**
 * Run the full one-click flow: capture + collect in main, open a pre-filled issue,
 * and toast the user that the screenshot is on the clipboard. Falls back to the
 * template chooser if the capture/collect step fails. Never throws.
 */
export async function fileBugReport(t: TFunction): Promise<void> {
  let data: IBugReportData | null = null;
  try {
    const res = await ipcBridge.application.captureBugReport.invoke();
    if (res?.success && res.data) data = res.data;
  } catch {
    data = null;
  }

  const url = buildBugReportIssueUrl(data);

  // Toast the ACTUAL outcome — never claim a prefilled issue or a copied screenshot
  // that did not happen. Three cases: full (screenshot + prefill), prefill-only
  // (capture unavailable), and chooser-fallback (capture/collect failed → no data).
  if (data?.screenshotCopied) {
    Message.success(
      t('conversation.welcome.bugReportScreenshotCopied', {
        defaultValue: 'Screenshot copied — paste it into the issue with Cmd/Ctrl+V.',
      })
    );
  } else if (data) {
    Message.info(
      t('conversation.welcome.bugReportNoScreenshot', {
        defaultValue: 'Opening a pre-filled GitHub issue — attach a screenshot manually.',
      })
    );
  } else {
    Message.info(
      t('conversation.welcome.bugReportChooser', {
        defaultValue: 'Opening the GitHub issue chooser (diagnostics unavailable).',
      })
    );
  }

  await openExternalUrl(url);
}
