/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProjectService } from './IProjectService';
import type { IProjectRepository } from '@process/services/database/IProjectRepository';
import type { IConversationService } from './IConversationService';
import type { IProject, ICreateProjectParams, IUpdateProjectParams } from '@/common/types/project';
import type { TChatConversation } from '@/common/config/storage';
import { uuid } from '@/common/utils';
import { bootstrapProjectKnowledge } from '@process/services/projectKnowledge/bootstrap';

/**
 * Concrete IProjectService. Owns id/timestamp generation and the `.wayland/`
 * knowledge bootstrap; delegates persistence to an injected repository and
 * conversation re-parenting to the conversation service (so assign/remove ride
 * the same `extra` merge path everything else uses).
 */
export class ProjectServiceImpl implements IProjectService {
  constructor(
    private readonly repo: IProjectRepository,
    private readonly conversations: IConversationService
  ) {}

  async createProject(params: ICreateProjectParams): Promise<IProject> {
    const now = Date.now();
    const project: IProject = {
      id: uuid(),
      name: params.name.trim() || 'Untitled project',
      description: params.description,
      workspace: params.workspace,
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
    await this.conversations.updateConversation(
      conversationId,
      { extra: { projectId } } as Partial<TChatConversation>,
      true
    );
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
