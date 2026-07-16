/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Clone a git repo into a fresh project workspace, then keep it pullable.
 *
 * This is the local mirror of Tank's "ingest a repo by git remote" step: Tank
 * clones on its own (often remote) host; here Wayland clones onto THIS machine
 * and registers the checkout as a normal project workspace under
 * `~/Documents/Wayland/<repo-name>`, so every chat in the project runs against
 * real local files.
 */

import { promises as fs } from 'node:fs';
import type { IGitCloneParams, IGitCloneResult, IGitPullResult } from '@/common/types/project';
import { projectServiceSingleton as projectService } from '@process/services/projectServiceSingleton';
import { allocateProjectWorkspace } from '@process/services/projectWorkspace';
import { cloneRepo, deriveRepoName, isValidGitUrl, pullRepo } from './gitClone';
import { loadProjectGitAuth, saveProjectGitAuth } from './gitAuthStore';

/**
 * Clone a repo and create a project pointed at the checkout. On clone failure
 * the allocated (empty) workspace dir is removed so a bad URL leaves no litter.
 */
export async function cloneRepoToProject(params: IGitCloneParams): Promise<IGitCloneResult> {
  const url = (params.url || '').trim();
  if (!isValidGitUrl(url)) {
    throw new Error('Enter a valid git URL (https://…, ssh://…, or git@host:owner/repo.git).');
  }
  const name = (params.name || '').trim() || deriveRepoName(url);

  // allocateProjectWorkspace creates a fresh EMPTY dir; git clones into it.
  const destDir = await allocateProjectWorkspace(name);
  try {
    await cloneRepo({ url, destDir, auth: params.auth });
  } catch (e) {
    await fs.rm(destDir, { recursive: true, force: true }).catch(() => {});
    throw e;
  }

  const project = await projectService.createProject({
    name,
    description: params.description,
    workspace: destDir,
  });

  // Persist creds (encrypted) so a later pull of a private repo re-authenticates.
  // Best-effort: the clone already succeeded and the project is usable regardless.
  try {
    await saveProjectGitAuth(project.id, params.auth);
  } catch (e) {
    console.error('[projectClone] failed to persist git auth:', e);
  }

  return { project };
}

/** Pull the latest into a project's workspace, re-applying its stored auth. */
export async function pullProject(id: string): Promise<IGitPullResult> {
  try {
    const project = await projectService.getProject(id);
    if (!project?.workspace) return { ok: false, error: 'This project has no workspace to pull into.' };
    const auth = await loadProjectGitAuth(id);
    const output = await pullRepo(project.workspace, auth ?? undefined);
    return { ok: true, output };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
