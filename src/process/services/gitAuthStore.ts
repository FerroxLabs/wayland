/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Per-project git credential store. Persists the auth used to clone a private
 * repo so later `git pull`s can re-authenticate without re-prompting - the
 * "keep the workspace pullable" half of the clone-as-workspace feature.
 *
 * Every value is encrypted through the app's secrets module ({@link @process/secrets}),
 * which prefers the OS keychain and falls back to the file-key backend headless.
 * The store file itself is written owner-only (0600 / restricted DACL) via the
 * atomic writer. `none`-kind auth (public repos) is never persisted.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { IGitCloneAuth } from '@/common/types/project';
import { writeFileAtomic } from '@process/utils/atomicWrite';
import { decryptString, encryptString } from '@process/secrets';

/** projectId → encrypted JSON blob of the IGitCloneAuth. */
type StoreShape = Record<string, string>;

let _storePath: string | null = null;
async function storePath(): Promise<string> {
  if (!_storePath) {
    const { app } = await import('electron');
    _storePath = path.join(app.getPath('userData'), 'git-auth.json');
  }
  return _storePath;
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(await storePath(), 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as StoreShape) : {};
  } catch {
    // Missing / unreadable / corrupt store → start empty. A pull just falls back
    // to unauthenticated (fine for a repo that later went public or uses the agent).
    return {};
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await writeFileAtomic(await storePath(), JSON.stringify(store, null, 2), { mode: 0o600 });
}

/** True when the auth carries a secret worth persisting. */
function hasSecret(auth: IGitCloneAuth | undefined): boolean {
  if (!auth) return false;
  if (auth.kind === 'token') return !!auth.token?.trim();
  if (auth.kind === 'ssh') return !!auth.privateKeyPath?.trim();
  return false;
}

/**
 * Persist a project's git auth, encrypted. Auth with nothing secret (public /
 * agent-based ssh) clears any previously-stored value instead.
 */
export async function saveProjectGitAuth(projectId: string, auth: IGitCloneAuth | undefined): Promise<void> {
  const store = await readStore();
  if (!hasSecret(auth)) {
    if (!(projectId in store)) return;
    delete store[projectId];
    await writeStore(store);
    return;
  }
  store[projectId] = encryptString(JSON.stringify(auth));
  await writeStore(store);
}

/** Load and decrypt a project's git auth, or null when none is stored. */
export async function loadProjectGitAuth(projectId: string): Promise<IGitCloneAuth | null> {
  const store = await readStore();
  const blob = store[projectId];
  if (!blob) return null;
  try {
    return JSON.parse(decryptString(blob)) as IGitCloneAuth;
  } catch {
    // A decrypt failure (rotated key, corruption) must not break a pull; treat
    // as "no stored auth" and let the pull fall back to unauthenticated.
    return null;
  }
}

/** Drop a project's stored git auth (e.g. when the project is deleted). */
export async function deleteProjectGitAuth(projectId: string): Promise<void> {
  const store = await readStore();
  if (!(projectId in store)) return;
  delete store[projectId];
  await writeStore(store);
}
