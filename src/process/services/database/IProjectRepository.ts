/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProject } from '@/common/types/project';
import type { TChatConversation } from '@/common/config/storage';

/**
 * Persistence boundary for Projects. Methods are async to match the
 * conversation repository convention (better-sqlite3 is synchronous under the
 * hood; the async surface keeps the service layer driver-agnostic).
 */
export interface IProjectRepository {
  createProject(project: IProject): Promise<IProject>;
  getProject(id: string): Promise<IProject | null>;
  listProjects(): Promise<IProject[]>;
  updateProject(id: string, updates: Partial<IProject>): Promise<void>;
  /** Detaches owned conversations (clears extra.projectId) then deletes the project. Never destroys chats. */
  removeProject(id: string): Promise<void>;
  /** Conversations owned by a project, newest-first. No execution lock - any count may be running. */
  getProjectConversations(projectId: string): Promise<TChatConversation[]>;
}
