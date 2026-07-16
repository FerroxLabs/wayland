/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autopilot: hand a task off to a local Tank server to run autonomously, then
 * hand the result back to Wayland. Flow (all over HTTP — see tankClient.ts):
 *   1. ensure Tank has a project for this workspace
 *   2. enqueue the prompt
 *   3. poll the queue in the background until every item is terminal
 *   4. notify the user and emit `autopilot.finished` so the UI can open the
 *      resulting worktree branch (diff + per-item results) for review.
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { showNotification } from '../../bridge/notificationBridge';
import { ipcBridge } from '@/common';
import {
  allItemsOk,
  enqueue,
  ensureProject,
  getQueue,
  isLocalTank,
  isQueueFinished,
  type TankQueueItem,
  type TankRun,
} from './tankClient';

const execFileAsync = promisify(execFile);

async function git(args: string[], cwd?: string): Promise<string> {
  const { stdout } = await execFileAsync('git', args, cwd ? { cwd } : {});
  return stdout.trim();
}

/** The local repo's `origin` URL, or null if it isn't a git repo / has no origin. */
async function localOrigin(workspacePath: string): Promise<string | null> {
  try {
    return (await git(['-C', workspacePath, 'remote', 'get-url', 'origin'])) || null;
  } catch {
    return null;
  }
}

export type AutopilotRunParams = { prompt: string; projectPath: string; projectName?: string };
export type AutopilotRunResult = { ok: boolean; error?: string; projectId?: string };

export type AutopilotFinished = {
  projectId: string;
  worktreePath?: string;
  branch?: string;
  allOk: boolean;
  items: Array<{ title: string; status: string }>;
};

// ponytail: fixed 15s poll, 12h ceiling. Fine for an overnight queue; swap for
// Tank's SSE /activity stream only if the poll latency ever matters.
const POLL_INTERVAL_MS = 15_000;
const MAX_POLL_MS = 12 * 60 * 60 * 1000;

/** Projects already being watched, so a re-submit doesn't spawn a second poller. */
const watching = new Set<string>();

/** Local workspace path per project, so the finished handler can fetch the
 *  remote branch back into the right local checkout. */
const localWorkspaces = new Map<string, string>();

export async function runAutopilot(params: AutopilotRunParams): Promise<AutopilotRunResult> {
  const prompt = (params.prompt || '').trim();
  if (!prompt) return { ok: false, error: 'Nothing to send — the task is empty.' };
  if (!params.projectPath) return { ok: false, error: 'No workspace path for this conversation.' };

  const name = (params.projectName || basename(params.projectPath) || 'wayland').trim();
  try {
    // Local Tank identifies the project by path; remote Tank can't see this
    // machine's disk, so it clones from the repo's git remote instead.
    let projectId: string;
    if (isLocalTank()) {
      projectId = await ensureProject(name, { path: params.projectPath });
    } else {
      const origin = await localOrigin(params.projectPath);
      if (!origin) {
        return {
          ok: false,
          error: 'Remote Tank needs a git remote — this repo has no "origin" to clone from.',
        };
      }
      projectId = await ensureProject(name, { gitRemote: origin });
    }
    localWorkspaces.set(projectId, params.projectPath);
    // Tank auto-pushes the queue branch on finish (queue_auto_push), so the
    // branch reaches the shared remote and resolveLocalWorktree can fetch it.
    await enqueue(projectId, prompt);
    void watchUntilDone(projectId); // fire-and-forget; notifies on completion
    return { ok: true, projectId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Turn Tank's completed run into a path that exists ON THIS MACHINE.
 * - Local Tank: its worktree is already local — use it.
 * - Remote Tank: fetch the run's branch from origin into a sibling worktree of
 *   the local checkout, so the renderer can open real local files. Returns
 *   undefined if there's no branch/local repo or the fetch fails (review then
 *   happens through Tank's web UI instead).
 */
async function resolveLocalWorktree(projectId: string, run: TankRun | null): Promise<string | undefined> {
  if (isLocalTank()) return run?.worktree_path;
  const branch = run?.branch;
  const ws = localWorkspaces.get(projectId);
  if (!branch || !ws) return undefined;
  try {
    await git(['-C', ws, 'fetch', 'origin', branch]);
    const wtDir = join(dirname(ws), `${basename(ws)}--${branch.replace(/[/\\]/g, '-')}`);
    if (!existsSync(wtDir)) {
      await git(['-C', ws, 'worktree', 'add', '-B', branch, wtDir, `origin/${branch}`]);
    }
    return wtDir;
  } catch {
    return undefined;
  }
}

async function watchUntilDone(projectId: string): Promise<void> {
  if (watching.has(projectId)) return;
  watching.add(projectId);
  const deadline = Date.now() + MAX_POLL_MS;
  try {
    while (Date.now() < deadline) {
      await delay(POLL_INTERVAL_MS);
      let items: TankQueueItem[];
      let run: TankRun | null;
      try {
        ({ items, run } = await getQueue(projectId));
      } catch {
        continue; // transient network / server restart — keep polling
      }
      if (!isQueueFinished(items)) continue;

      const worktreePath = await resolveLocalWorktree(projectId, run);
      const finished: AutopilotFinished = {
        projectId,
        worktreePath,
        branch: run?.branch,
        allOk: allItemsOk(items),
        items: items.map((it) => ({ title: it.title, status: it.status })),
      };
      showNotification({
        title: finished.allOk ? 'Autopilot finished' : 'Autopilot finished with issues',
        body: finished.allOk
          ? `Tank completed ${items.length} item(s). Click to review.`
          : `${items.filter((i) => i.status !== 'done').length} of ${items.length} item(s) need attention.`,
      });
      ipcBridge.autopilot.finished.emit(finished);
      return;
    }
  } finally {
    watching.delete(projectId);
    localWorkspaces.delete(projectId);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
