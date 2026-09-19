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
 *      to the OS clipboard only (as a nativeImage); no temp file is written.
 *      `capturePage` needs NO OS Screen-Recording permission and captures exactly
 *      the Wayland UI.
 *   2. App + bundled-engine versions and OS/arch, for the environment block.
 *   3. The sanitized `wayland_concierge_diag` overview (already secret-masked) as a
 *      compact, problem-focused markdown block. The body is destined for a PUBLIC
 *      issue, so no USER-AUTHORED string (task name, project name, chat title)
 *      goes into it — see `summarizeFlagged` and #1366.
 *
 * Everything is best-effort: a failure in any single step degrades that field
 * rather than throwing, so the user still gets a pre-filled issue.
 */

import { app, clipboard, type BrowserWindow } from 'electron';
import * as os from 'os';
import { resolveFuigoBinary } from '@process/agent/fuigo/runtime';
import { createConciergeDiagServer } from '@process/resources/builtinMcp/conciergeDiagServer';
import type { ConciergeDiagOverview } from '@process/resources/builtinMcp/conciergeDiagServer';
import { resolveConciergeDiagDeps } from '@process/utils/initStorage';
import type { IBugReportData } from '@/common/adapter/ipcBridge';

export type BugReportData = IBugReportData;

/** Cap each diagnostics section so the assembled GitHub URL stays well under limits. */
const MAX_ITEMS_PER_SECTION = 8;
const MAX_ERROR_LINES = 8;

const bullet = (text: string): string => `- ${text}`;

/** One flagged item: what KIND of thing it is, and the reason it is flagged. */
type FlaggedItem = { kind: string; reason: string | null };

/**
 * Collapse flagged items into "N kinds — reason" bullets, counting the items that
 * share a reason instead of naming them.
 *
 * #1366 / #1292: this block is pasted verbatim into a PUBLIC GitHub issue, and
 * scheduled-task names and workspace titles (project names, chat titles) are
 * written BY THE USER. Issue #1292 published a stranger's business calendar
 * ("Monthly investor update", "Friday pipeline review") and chat titles to the
 * world. The REASON is the entire debugging signal — the user's own wording never
 * was — so the title never reaches the body.
 *
 * Counting over the whole section rather than a leading slice also makes the
 * report strictly more truthful than the per-item form it replaces: "8 tasks" is
 * the real total, where the old loop silently stopped after the first
 * {@link MAX_ITEMS_PER_SECTION} items. The cap now bounds distinct REASONS, which
 * is what keeps the assembled URL small.
 */
function summarizeFlagged(items: FlaggedItem[]): string[] {
  const groups = new Map<string, { kind: string; reason: string; count: number }>();
  for (const { kind, reason } of items) {
    if (!reason) continue;
    const key = JSON.stringify([kind, reason]);
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { kind, reason, count: 1 });
  }
  return [...groups.values()]
    .toSorted((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
    .slice(0, MAX_ITEMS_PER_SECTION)
    .map(({ kind, reason, count }) => bullet(`${count} ${kind}${count === 1 ? '' : 's'} — ${reason}`));
}

/**
 * Render the sanitized diag overview as a concise markdown block that leads with
 * problems (flags, "why not running", errors) — the signal a maintainer needs —
 * rather than dumping the full object.
 *
 * Sections whose identifiers the USER authored (scheduled tasks, workspace) are
 * reported as counts per reason; sections whose identifiers the user did NOT
 * author (connector names from the MCP catalog, provider ids from the model
 * registry) still name them, because naming the connector that failed is the
 * whole point of the section.
 */
export function formatDiagnostics(overview: ConciergeDiagOverview): string {
  const lines: string[] = [];

  const { scheduledTasks, mcp, providers, workspace, configPaths, recentErrors } = overview;

  lines.push(`**Scheduled tasks** (${scheduledTasks.source}): ${scheduledTasks.items.length}`);
  lines.push(
    ...summarizeFlagged(
      scheduledTasks.items.map((task) => ({ kind: 'task', reason: task.whyNotRunning ?? task.lastError }))
    )
  );

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
  lines.push(...summarizeFlagged(workspace.items.map((entry) => ({ kind: entry.kind, reason: entry.whyProblem }))));

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
    engineVersion = resolveFuigoBinary()?.version ?? null;
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
