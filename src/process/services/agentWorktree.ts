/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Per-agent git worktree isolation.
 *
 * When several agents run concurrently in the SAME git-backed project workspace,
 * they would otherwise edit the same files on the same branch and clobber each
 * other. This module gives every agent (conversation) its own `git worktree`:
 * a sibling checkout on a dedicated `wayland/agent-<id>` branch, so concurrent
 * agents never collide. It mirrors how Tank hands each run its own worktree
 * branch (see autopilot/AutopilotService.ts resolveLocalWorktree).
 *
 * Design:
 *   - Fail-safe: ANY failure (not a git repo, no commits, git missing, disk
 *     error) leaves `extra` untouched and the agent simply shares the main
 *     checkout. Isolation must never block chat creation.
 *   - Default ON for git workspaces; opt out globally with
 *     WAYLAND_NO_AGENT_WORKTREE=1 (mirrors the WAYLAND_TANK_* env convention).
 *   - Worktrees are SIBLINGS of the repo (`<repo>--agent-<id>`), never nested
 *     inside it, so they don't show up in the repo's own working tree.
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { uuid } from '@/common/utils';
import { isWorktreePerAgent } from './projectGitPrefs';

const execFileAsync = promisify(execFile);

/** Branch namespace + dir suffix for agent worktrees. */
export const AGENT_BRANCH_PREFIX = 'wayland/agent-';
const AGENT_DIR_SUFFIX = '--agent-';

async function git(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { maxBuffer: 8 * 1024 * 1024 });
  return stdout.trim();
}

/** Isolation is on unless WAYLAND_NO_AGENT_WORKTREE is a truthy opt-out. */
export function isWorktreeIsolationEnabled(): boolean {
  const v = (process.env.WAYLAND_NO_AGENT_WORKTREE || '').trim().toLowerCase();
  return !(v === '1' || v === 'true' || v === 'yes' || v === 'on');
}

/** True when `dir` is inside a git working tree. Cheap gate for non-git projects. */
export async function isGitRepo(dir: string): Promise<boolean> {
  if (!dir || !existsSync(dir)) return false;
  try {
    return (await git(['-C', dir, 'rev-parse', '--is-inside-work-tree'])) === 'true';
  } catch {
    return false;
  }
}

/**
 * Derive the branch + sibling worktree dir for a repo and short id. Pure -
 * exported for unit testing.
 */
export function worktreeNamesFor(repoDir: string, shortId: string): { branch: string; path: string } {
  const branch = `${AGENT_BRANCH_PREFIX}${shortId}`;
  const path = join(dirname(repoDir), `${basename(repoDir)}${AGENT_DIR_SUFFIX}${shortId}`);
  return { branch, path };
}

function newAgentId(): string {
  return uuid().replace(/-/g, '').slice(0, 8);
}

/**
 * Ensure a conversation has its own git worktree when its workspace is a git
 * repo and isolation is enabled. Mutates `extra` in place (workspace,
 * worktreePath, worktreeBranch, worktreeRepo) and returns true when a worktree
 * was assigned. Fail-safe: on any problem it returns false and leaves `extra`
 * untouched, so the agent shares the main checkout instead of breaking.
 */
export async function assignAgentWorktree(extra: Record<string, unknown> | undefined): Promise<boolean> {
  if (!extra || !isWorktreeIsolationEnabled()) return false;

  // Per-project opt-out (default on) - a UI toggle disables isolation for a
  // project without needing the global env kill-switch.
  const projectId = typeof extra.projectId === 'string' ? extra.projectId : '';
  if (projectId && !(await isWorktreePerAgent(projectId))) return false;

  // Already has a live worktree (e.g. re-entrant reconcile) - nothing to do.
  const existing = typeof extra.worktreePath === 'string' ? extra.worktreePath : '';
  if (existing && existsSync(existing)) return false;

  const repoDir = typeof extra.workspace === 'string' ? extra.workspace.trim() : '';
  if (!repoDir || !(await isGitRepo(repoDir))) return false;

  try {
    const { branch, path } = worktreeNamesFor(repoDir, newAgentId());
    if (existsSync(path)) return false; // collision (astronomically unlikely) - skip
    // `worktree add -b <branch> <path> HEAD` needs at least one commit; a repo
    // with no commits throws and we fall back to the shared checkout.
    await git(['-C', repoDir, 'worktree', 'add', '-b', branch, path, 'HEAD']);
    extra.workspace = path;
    extra.worktreePath = path;
    extra.worktreeBranch = branch;
    extra.worktreeRepo = repoDir;
    return true;
  } catch (e) {
    console.error('[agentWorktree] assign failed; agent will share the main checkout:', e);
    return false;
  }
}

/**
 * Remove the worktree an agent was assigned (dir + its branch). Best-effort;
 * called when a conversation is deleted so worktrees don't accumulate.
 */
export async function removeAgentWorktree(extra: Record<string, unknown> | undefined): Promise<void> {
  const repo = typeof extra?.worktreeRepo === 'string' ? extra.worktreeRepo : '';
  const path = typeof extra?.worktreePath === 'string' ? extra.worktreePath : '';
  const branch = typeof extra?.worktreeBranch === 'string' ? extra.worktreeBranch : '';
  if (!repo || !path) return;
  try {
    await git(['-C', repo, 'worktree', 'remove', '--force', path]);
  } catch (e) {
    console.error('[agentWorktree] worktree remove failed:', e);
  }
  if (branch) {
    try {
      await git(['-C', repo, 'branch', '-D', branch]);
    } catch {
      // Branch may be gone already, or checked out elsewhere - ignore.
    }
  }
}

export type AgentWorktree = { path: string; branch: string };

/**
 * List the agent worktrees registered on a repo (for the workspace UI). Parses
 * `git worktree list --porcelain` and keeps only Wayland agent worktrees.
 * Returns [] for a non-git dir or on any error.
 */
export async function listAgentWorktrees(repoDir: string): Promise<AgentWorktree[]> {
  if (!(await isGitRepo(repoDir))) return [];
  let raw: string;
  try {
    raw = await git(['-C', repoDir, 'worktree', 'list', '--porcelain']);
  } catch {
    return [];
  }
  const out: AgentWorktree[] = [];
  let path = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('worktree ')) {
      path = line.slice('worktree '.length).trim();
    } else if (line.startsWith('branch ')) {
      const ref = line.slice('branch '.length).trim(); // refs/heads/wayland/agent-xxxx
      const branch = ref.replace(/^refs\/heads\//, '');
      if (branch.startsWith(AGENT_BRANCH_PREFIX) && path) out.push({ path, branch });
    } else if (line === '') {
      path = '';
    }
  }
  return out;
}

export type MergeResult = { ok: boolean; output?: string; error?: string; conflict?: boolean };

/** True when a checkout has uncommitted changes. */
async function hasUncommittedChanges(dir: string): Promise<boolean> {
  try {
    return (await git(['-C', dir, 'status', '--porcelain'])).length > 0;
  } catch {
    return false;
  }
}

/**
 * Committer identity flags for repos with no configured user - so an in-app
 * merge/snapshot commit doesn't fail with "empty ident". Returns [] when the
 * repo already has user.name + user.email (respect the user's real identity).
 */
async function committerFlags(repoDir: string): Promise<string[]> {
  const email = await git(['-C', repoDir, 'config', 'user.email']).catch(() => '');
  const name = await git(['-C', repoDir, 'config', 'user.name']).catch(() => '');
  if (email && name) return [];
  return ['-c', 'user.name=Wayland', '-c', 'user.email=agent@wayland.local'];
}

/**
 * Merge an agent's worktree branch back into the main checkout, then retire the
 * worktree. Only `wayland/agent-*` branches are accepted. Any uncommitted edits
 * still sitting in the worktree are snapshotted into a commit first, so the
 * agent's work is actually carried by the merge (not lost). On a merge conflict
 * the merge is aborted and `{ conflict: true }` is returned - the main checkout
 * is never left half-merged; the user resolves conflicts manually.
 */
export async function mergeAgentWorktree(repoDir: string, branch: string): Promise<MergeResult> {
  if (!branch.startsWith(AGENT_BRANCH_PREFIX)) {
    return { ok: false, error: 'Only Wayland agent branches can be merged from here.' };
  }
  if (!(await isGitRepo(repoDir))) return { ok: false, error: 'Workspace is not a git repository.' };

  const wt = (await listAgentWorktrees(repoDir)).find((w) => w.branch === branch);
  const idFlags = await committerFlags(repoDir);

  try {
    // Snapshot uncommitted work on the agent branch so the merge carries it.
    if (wt && (await hasUncommittedChanges(wt.path))) {
      await git(['-C', wt.path, 'add', '-A']);
      await git(['-C', wt.path, ...idFlags, 'commit', '-m', `chore(agent): snapshot ${branch} before merge`]);
    }

    const output = await git([
      '-C',
      repoDir,
      ...idFlags,
      'merge',
      '--no-ff',
      branch,
      '-m',
      `Merge agent branch ${branch}`,
    ]);

    // Merge landed - the branch's work is integrated; retire the worktree + branch.
    if (wt) await git(['-C', repoDir, 'worktree', 'remove', '--force', wt.path]).catch(() => {});
    await git(['-C', repoDir, 'branch', '-D', branch]).catch(() => {});
    return { ok: true, output };
  } catch (e) {
    // Leave the main checkout clean - abort any partial merge.
    await git(['-C', repoDir, 'merge', '--abort']).catch(() => {});
    const msg = e instanceof Error ? e.message : String(e);
    const conflict = /conflict/i.test(msg);
    return {
      ok: false,
      conflict,
      error: conflict ? 'Merge conflict - resolve it manually in the repo, then retry.' : msg,
    };
  }
}
