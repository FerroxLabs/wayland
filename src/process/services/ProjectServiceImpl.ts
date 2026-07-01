/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProjectService } from './IProjectService';
import type { IProjectRepository } from '@process/services/database/IProjectRepository';
import type { IConversationService } from './IConversationService';
import type { AgentStatus } from '@process/task/agentTypes';
import type { IProject, ICreateProjectParams, IUpdateProjectParams } from '@/common/types/project';
import type { TChatConversation } from '@/common/config/storage';
import { uuid } from '@/common/utils';
import { bootstrapProjectKnowledge } from '@process/services/projectKnowledge/bootstrap';
import {
  allocateProjectWorkspace,
  ensureProjectWorkspace,
  enforceProjectWorkspace,
} from '@process/services/projectWorkspace';

/**
 * Concrete IProjectService. Owns id/timestamp generation and the `.wayland/`
 * knowledge bootstrap; delegates persistence to an injected repository and
 * conversation re-parenting to the conversation service (so assign/remove ride
 * the same `extra` merge path everything else uses).
 */
export class ProjectServiceImpl implements IProjectService {
  constructor(
    private readonly repo: IProjectRepository,
    private readonly conversations: IConversationService,
    /**
     * Port over the cached worker tasks, used after assign re-homes a chat so its
     * next turn rebuilds in the corrected workspace. Injected, not imported, so
     * the service carries no hard dependency on the task layer. `getStatus`
     * returns the cached task's status (undefined when none is cached) so we can
     * skip evicting a task that is actively streaming; `evict` drops (kills) it.
     * Optional: omitted in unit tests and callers with no live task cache.
     */
    private readonly taskCache?: {
      getStatus(conversationId: string): AgentStatus | undefined;
      evict(conversationId: string): void;
    }
  ) {}

  async createProject(params: ICreateProjectParams): Promise<IProject> {
    const now = Date.now();
    const name = params.name.trim() || 'Untitled project';
    // #455: every project gets a PERSISTENT, user-visible workspace. When the
    // user didn't pick a folder, allocate the default (~/Documents/Wayland/<name>)
    // so chats never silently fall back to a throwaway temp dir. Best-effort: if
    // allocation fails we still create the project (lazy migration will retry on
    // first chat), so a filesystem hiccup never blocks project creation.
    let workspace = params.workspace;
    if (!workspace) {
      try {
        workspace = await allocateProjectWorkspace(name);
      } catch (err) {
        console.error('[ProjectService] Failed to allocate persistent workspace:', err);
      }
    }
    const project: IProject = {
      id: uuid(),
      name,
      description: params.description,
      workspace,
      icon: params.icon,
      iconColor: params.iconColor,
      pinned: false,
      createTime: now,
      modifyTime: now,
    };
    const created = await this.repo.createProject(project);
    // Bootstrap the per-project knowledge folder when a workspace is set. Best-
    // effort: a filesystem hiccup must not fail project creation.
    if (created.workspace) {
      try {
        await bootstrapProjectKnowledge(created.workspace, created.name, created.description);
      } catch (err) {
        console.error('[ProjectService] Failed to bootstrap .wayland/ knowledge:', err);
      }
    }
    return created;
  }

  getProject(id: string): Promise<IProject | null> {
    return this.repo.getProject(id);
  }

  listProjects(): Promise<IProject[]> {
    return this.repo.listProjects();
  }

  async updateProject(id: string, updates: IUpdateProjectParams): Promise<void> {
    await this.repo.updateProject(id, updates);
    // If a workspace was just set on a project that didn't have one, bootstrap
    // its knowledge folder now.
    if (updates.workspace) {
      try {
        const project = await this.repo.getProject(id);
        if (project) await bootstrapProjectKnowledge(updates.workspace, project.name, project.description);
      } catch (err) {
        console.error('[ProjectService] Failed to bootstrap .wayland/ on workspace update:', err);
      }
    }
  }

  removeProject(id: string): Promise<void> {
    return this.repo.removeProject(id);
  }

  getProjectConversations(projectId: string): Promise<TChatConversation[]> {
    return this.repo.getProjectConversations(projectId);
  }

  async assignConversation(conversationId: string, projectId: string): Promise<void> {
    // Stamp the project, then re-home the chat's workspace onto the project's
    // managed folder exactly like the create path (ConversationServiceImpl
    // .reconcileProjectWorkspace): ensure the project has a persistent workspace,
    // then copy it onto this chat's extra so agent files land in the project
    // folder instead of the throwaway temp dir the chat was created with. A
    // user-chosen custom workspace (extra.customWorkspace) is left untouched by
    // enforceProjectWorkspace.
    const conversation = await this.conversations.getConversation(conversationId);
    const extra = { ...conversation?.extra, projectId } as Record<string, unknown>;
    await ensureProjectWorkspace(projectId);
    const rehomed = await enforceProjectWorkspace(extra);
    await this.conversations.updateConversation(
      conversationId,
      { extra } as unknown as Partial<TChatConversation>,
      true
    );
    // A chat that's already open keeps writing to its old temp cwd until its
    // cached worker task is rebuilt. When the workspace actually moved, drop the
    // cached task so the next turn re-spawns in the re-homed workspace - no app
    // restart needed. But NEVER evict a task that is actively streaming
    // ('running'): killing it would abort the in-flight turn and lose the
    // response. That rare case re-homes on its next spawn instead;
    // extra.workspace is already persisted above, so correctness holds either way.
    if (rehomed && this.taskCache && this.taskCache.getStatus(conversationId) !== 'running') {
      this.taskCache.evict(conversationId);
    }
  }

  async removeConversationFromProject(conversationId: string): Promise<void> {
    // Setting projectId to undefined drops the key on JSON serialization, so the
    // conversation is detached without losing any other extra fields.
    await this.conversations.updateConversation(
      conversationId,
      { extra: { projectId: undefined } } as Partial<TChatConversation>,
      true
    );
  }
}
