/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProject, ICreateProjectParams, IUpdateProjectParams } from '@/common/types/project';
import type { TChatConversation } from '@/common/config/storage';

export interface IProjectService {
  createProject(params: ICreateProjectParams): Promise<IProject>;
  getProject(id: string): Promise<IProject | null>;
  listProjects(): Promise<IProject[]>;
  updateProject(id: string, updates: IUpdateProjectParams): Promise<void>;
  /** Deletes the project; owned conversations are detached, never destroyed. */
  removeProject(id: string): Promise<void>;
  getProjectConversations(projectId: string): Promise<TChatConversation[]>;
  /** Re-parent an existing conversation into a project (sets extra.projectId). */
  assignConversation(conversationId: string, projectId: string): Promise<void>;
  /** Detach a conversation from any project (clears extra.projectId). */
  removeConversationFromProject(conversationId: string): Promise<void>;
}
