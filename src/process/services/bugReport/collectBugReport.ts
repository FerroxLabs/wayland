/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bug-report collector (issue #464).
 *
 * Gathers everything needed to file a DETAILED GitHub issue in one click:
 *   1. An app-window screenshot via Electron `webContents.capturePage()` — copied
 *      to the OS clipboard (nativeImage) and written to a temp PNG. `capturePage`
 *      needs NO OS Screen-Recording permission and captures exactly the Wayland UI.
 *   2. App + bundled-engine versions and OS/arch, for the environment block.
 *   3. The sanitized `wayland_concierge_diag` overview (already secret-masked) as a
 *      compact, problem-focused markdown block.
 *
 * Everything is best-effort: a failure in any single step degrades that field
 * rather than throwing, so the user still gets a pre-filled issue.
 */

import { app, clipboard, type BrowserWindow } from 'electron';
import * as os from 'os';
import { detectWCore } from '@process/agent/wcore/binaryResolver';
import { createConciergeDiagServer } from '@process/resources/builtinMcp/conciergeDiagServer';
import type { ConciergeDiagOverview } from '@process/resources/builtinMcp/conciergeDiagServer';
import { resolveConciergeDiagDeps } from '@process/utils/initStorage';
import type { IBugReportData } from '@/common/adapter/ipcBridge';

export type BugReportData = IBugReportData;

/** Cap each diagnostics section so the assembled GitHub URL stays well under limits. */
const MAX_ITEMS_PER_SECTION = 8;
const MAX_ERROR_LINES = 8;

const bullet = (text: string): string => `- ${text}`;

/**
 * Render the sanitized diag overview as a concise markdown block that leads with
 * problems (flags, "why not running", errors) — the signal a maintainer needs —
 * rather than dumping the full object.
 */
export function formatDiagnostics(overview: ConciergeDiagOverview): string {
  const lines: string[] = [];

  const { scheduledTasks, mcp, providers, workspace, configPaths, recentErrors } = overview;

  lines.push(`**Scheduled tasks** (${scheduledTasks.source}): ${scheduledTasks.items.length}`);
  for (const task of scheduledTasks.items.slice(0, MAX_ITEMS_PER_SECTION)) {
    if (task.whyNotRunning || task.lastError) {
      lines.push(bullet(`\`${task.name}\` — ${task.whyNotRunning ?? task.lastError}`));
    }
  }

  lines.push(`**MCP servers** (${mcp.source}): ${mcp.items.length}`);
  for (const server of mcp.items.slice(0, MAX_ITEMS_PER_SECTION)) {
    if (server.flag || server.lastError) {
      lines.push(bullet(`\`${server.name}\` — ${server.flag ?? server.lastError}`));
    }
  }

  lines.push(`**Providers** (${providers.source}): ${providers.items.length}`);
  for (const provider of providers.items.slice(0, MAX_ITEMS_PER_SECTION)) {
    if (provider.flag || provider.error) {
      lines.push(bullet(`\`${provider.id}\` — ${provider.flag ?? provider.error}`));
    }
  }

  lines.push(`**Workspace** (${workspace.source}): ${workspace.items.length}`);
  for (const entry of workspace.items.slice(0, MAX_ITEMS_PER_SECTION)) {
    if (entry.whyProblem) {
      lines.push(bullet(`\`${entry.name}\` — ${entry.whyProblem}`));
    }
  }

  lines.push('**Config paths**');
  lines.push(bullet(`app: ${configPaths.info.appConfigDir ?? 'unknown'}`));
  lines.push(bullet(`engine: ${configPaths.info.engineConfigDir ?? 'unknown'}`));

  if (recentErrors.lines.length > 0) {
    lines.push(`**Recent errors** (${recentErrors.source})`);
    lines.push('```');
    for (const line of recentErrors.lines.slice(-MAX_ERROR_LINES)) {
      lines.push(line);
    }
    lines.push('```');
  }

  return lines.join('\n');
}

/**
 * Capture the app window and gather diagnostics + versions for a bug report.
 * Never throws — each step degrades independently.
 */
export async function collectBugReport(win: BrowserWindow | null): Promise<BugReportData> {
  const appVersion = app.getVersion();

  let engineVersion: string | null = null;
  try {
    engineVersion = detectWCore().version ?? null;
  } catch {
    engineVersion = null;
  }

  let screenshotCopied = false;
  if (win && !win.isDestroyed()) {
    try {
      const image = await win.webContents.capturePage();
      if (!image.isEmpty()) {
        // Copy to the clipboard ONLY — the user pastes it into the issue in one
        // keystroke (GitHub URL params can't attach images). We deliberately do NOT
        // write the PNG to disk: the screenshot can contain on-screen secrets, and a
        // temp file would be an unconsumed, potentially world-readable leak surface.
        clipboard.writeImage(image);
        screenshotCopied = true;
      }
    } catch {
      // Capture failed (e.g. window gone) — proceed without a screenshot.
    }
  }

  let diagnostics = '';
  try {
    // Synchronous DB reads + bounded log tails on the main thread. This is a
    // user-initiated one-click action (not a hot path) and the overview is bounded
    // (MAX_ITEMS / MAX_LOG_TAIL_BYTES), so the brief block is acceptable — the same
    // tradeoff the Doctor makes. Offload to a worker only if it ever shows up as jank.
    const overview = createConciergeDiagServer(resolveConciergeDiagDeps()).overview();
    diagnostics = formatDiagnostics(overview);
  } catch {
    diagnostics = '_diagnostics unavailable_';
  }

  return {
    appVersion,
    engineVersion,
    platform: process.platform,
    arch: process.arch,
    osRelease: os.release(),
    diagnostics,
    screenshotCopied,
  };
}
