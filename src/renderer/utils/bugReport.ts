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
/**
 * Hard ceiling on the ENCODED URL, with margin under the ~8 KB browser/OS/GitHub
 * limit. We bound by percent-encoded BYTE length, not characters, because a
 * diagnostics block full of special chars (backticks, `#`, newlines, non-ASCII)
 * each encode to 3 bytes — 4000 such chars alone would be ~12 KB.
 */
const MAX_URL_BYTES = 7500;
const TRUNCATION_NOTE = '\n…(diagnostics truncated)';

const urlByteLength = (url: string): number => new TextEncoder().encode(url).length;

/** Assemble the full pre-filled new-issue URL for a given diagnostics block. */
function assembleIssueUrl(data: IBugReportData, diagnosticsBlock: string): string {
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
    diagnosticsBlock,
    '',
    '---',
    screenshotNote,
  ].join('\n');

  const params = new URLSearchParams({ title: 'Bug report: ', body });
  return `${GITHUB_NEW_ISSUE_URL}?${params.toString()}`;
}

/**
 * Build the pre-filled GitHub new-issue URL from a bug-report payload. Pure and
 * side-effect-free so it can be unit-tested. Returns the chooser URL when no data
 * is available. Diagnostics are truncated first by character count, then shrunk
 * further by ENCODED byte length so the URL never exceeds {@link MAX_URL_BYTES}.
 */
export function buildBugReportIssueUrl(data: IBugReportData | null): string {
  if (!data) return GITHUB_ISSUE_CHOOSER_URL;

  let chars = Math.min(data.diagnostics.length, MAX_DIAGNOSTICS_CHARS);
  let truncated = chars < data.diagnostics.length;
  const render = () => {
    const slice = data.diagnostics.slice(0, chars);
    return assembleIssueUrl(data, truncated ? slice + TRUNCATION_NOTE : slice);
  };

  let url = render();
  // Byte-budget guard: shrink the diagnostics until the encoded URL fits. Each
  // pass drops 20%; terminates because `chars` strictly decreases toward 0.
  while (urlByteLength(url) > MAX_URL_BYTES && chars > 0) {
    chars = Math.floor(chars * 0.8);
    truncated = true;
    url = render();
  }
  return url;
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
