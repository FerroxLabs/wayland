/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Frictionless "file a detailed GitHub issue" bridge (#464).
 *
 * One action captures the app window (Electron `webContents.capturePage()` — no
 * OS Screen-Recording permission, captures exactly the Wayland UI), copies it to
 * the clipboard for one-keystroke pasting, gathers the already-sanitized
 * `wayland_concierge_diag` overview plus app/engine/OS versions, and opens a
 * pre-filled GitHub new-issue page in the browser. No GitHub token, no abuse
 * surface — guided creation the user reviews and submits.
 */

import os from 'os';
import path from 'path';
import fs from 'fs';
import { app, clipboard, shell } from 'electron';
import { ipcBridge } from '@/common';
import { getApplicationMainWindow } from './applicationBridge';
import { buildBugReportIssueUrl } from './bugReportUrl';
import { detectWCore } from '@process/agent/wcore/binaryResolver';
import { createConciergeDiagServer } from '@process/resources/builtinMcp/conciergeDiagServer';
import { buildConciergeDiagDeps } from '@process/utils/initStorage';

/** Read the sanitized diagnostics overview, degrading to '' if it cannot be built. */
function collectSanitizedDiagnostics(): string {
  try {
    const overview = createConciergeDiagServer(buildConciergeDiagDeps()).overview();
    return JSON.stringify(overview, null, 2);
  } catch (error) {
    console.warn('[bugReportBridge] Failed to collect diagnostics:', error);
    return '';
  }
}

/** Capture the app window to a temp PNG and copy it to the clipboard. Returns whether it worked. */
async function captureScreenshotToClipboard(): Promise<{ screenshotOnClipboard: boolean; screenshotPath?: string }> {
  const win = getApplicationMainWindow();
  if (!win) {
    return { screenshotOnClipboard: false };
  }
  try {
    const image = await win.webContents.capturePage();
    if (image.isEmpty()) {
      return { screenshotOnClipboard: false };
    }
    clipboard.writeImage(image);
    const screenshotPath = path.join(os.tmpdir(), `wayland-bug-report-${Date.now()}.png`);
    try {
      fs.writeFileSync(screenshotPath, image.toPNG());
      return { screenshotOnClipboard: true, screenshotPath };
    } catch {
      // Clipboard succeeded even if the temp write did not — that is what the user pastes.
      return { screenshotOnClipboard: true };
    }
  } catch (error) {
    console.warn('[bugReportBridge] Failed to capture screenshot:', error);
    return { screenshotOnClipboard: false };
  }
}

export function initBugReportBridge(): void {
  ipcBridge.bugReport.fileWithDiagnostics.provider(async ({ title, whatHappened }) => {
    try {
      const { screenshotOnClipboard } = await captureScreenshotToClipboard();

      const wcore = detectWCore();
      const { url, diagnosticsTruncated } = buildBugReportIssueUrl({
        title,
        whatHappened,
        appVersion: app.getVersion(),
        engineVersion: wcore.version ?? 'unknown',
        platform: os.platform(),
        arch: os.arch(),
        osRelease: os.release(),
        diagnostics: collectSanitizedDiagnostics(),
        screenshotOnClipboard,
      });

      await shell.openExternal(url);

      return { ok: true, screenshotOnClipboard, diagnosticsTruncated };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[bugReportBridge] fileWithDiagnostics failed:', message);
      return { ok: false, screenshotOnClipboard: false, diagnosticsTruncated: false, error: message };
    }
  });
}
