/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Per-project git preferences (non-secret). Currently just the per-agent
 * worktree-isolation toggle, so a user can turn isolation off for one project
 * from the UI without the global WAYLAND_NO_AGENT_WORKTREE env kill-switch.
 *
 * Stored as plain JSON in userData (no secrets here - see gitAuthStore.ts for
 * the encrypted credential store). Isolation is ON by default; a project only
 * appears in the store once its toggle has been changed.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { writeFileAtomic } from '@process/utils/atomicWrite';

type ProjectGitPrefs = { worktreePerAgent?: boolean };
type Store = Record<string, ProjectGitPrefs>;

let _storePath: string | null = null;
async function storePath(): Promise<string> {
  if (!_storePath) {
    const { app } = await import('electron');
    _storePath = path.join(app.getPath('userData'), 'project-git-prefs.json');
  }
  return _storePath;
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(await storePath(), 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store): Promise<void> {
  await writeFileAtomic(await storePath(), JSON.stringify(store, null, 2));
}

/** Whether per-agent worktree isolation is on for a project. Default: on. */
export async function isWorktreePerAgent(projectId: string): Promise<boolean> {
  if (!projectId) return true;
  const store = await readStore();
  return store[projectId]?.worktreePerAgent !== false;
}

/** Set the per-agent worktree-isolation toggle for a project. */
export async function setWorktreePerAgent(projectId: string, enabled: boolean): Promise<void> {
  if (!projectId) return;
  const store = await readStore();
  store[projectId] = { ...store[projectId], worktreePerAgent: enabled };
  await writeStore(store);
}
