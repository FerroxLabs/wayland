/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatabase } from '@process/services/database';
import type { IProjectRepository } from './IProjectRepository';
import type { IProject } from '@/common/types/project';
import type { TChatConversation } from '@/common/config/storage';

/**
 * SQLite-backed IProjectRepository. Delegates to the WaylandUIDatabase
 * singleton via getDatabase(); unwraps IQueryResult and throws on DB error so
 * the service layer sees a clean success/throw contract.
 */
export class SqliteProjectRepository implements IProjectRepository {
  private getDb() {
    return getDatabase();
  }

  async createProject(project: IProject): Promise<IProject> {
    const db = await this.getDb();
    const result = db.createProject(project);
    if (!result.success) throw new Error(result.error || 'Failed to create project');
    return result.data ?? project;
  }

  async getProject(id: string): Promise<IProject | null> {
    const db = await this.getDb();
    const result = db.getProject(id);
    if (!result.success) throw new Error(result.error || 'Failed to get project');
    return result.data ?? null;
  }

  async listProjects(): Promise<IProject[]> {
    const db = await this.getDb();
    const result = db.listProjects();
    if (!result.success) throw new Error(result.error || 'Failed to list projects');
    return result.data ?? [];
  }

  async updateProject(id: string, updates: Partial<IProject>): Promise<void> {
    const db = await this.getDb();
    const result = db.updateProject(id, updates);
    if (!result.success) throw new Error(result.error || 'Failed to update project');
  }

  async removeProject(id: string): Promise<void> {
    const db = await this.getDb();
    const result = db.removeProject(id);
    if (!result.success) throw new Error(result.error || 'Failed to remove project');
  }

  async getProjectConversations(projectId: string): Promise<TChatConversation[]> {
    const db = await this.getDb();
    return db.getConversationsByProjectId(projectId);
  }
}
