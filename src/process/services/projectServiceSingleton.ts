/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Singleton ProjectServiceImpl wired with a SqliteProjectRepository and the
 * shared conversation service (for assign/remove re-parenting). Extracted to a
 * separate module to avoid circular dependencies, mirroring
 * conversationServiceSingleton.
 */

import { SqliteProjectRepository } from '@process/services/database/SqliteProjectRepository';
import { ProjectServiceImpl } from './ProjectServiceImpl';
import { conversationServiceSingleton } from './conversationServiceSingleton';
import { workerTaskManager } from '@process/task/workerTaskManagerSingleton';
import type { IProjectService } from './IProjectService';

// Note: workerTaskManager is already booted transitively whenever this module is
// imported (conversationServiceSingleton -> ConversationServiceImpl ->
// cronServiceSingleton imports it at module top level), so this direct import
// adds no new eager construction.
export const projectServiceSingleton: IProjectService = new ProjectServiceImpl(
  new SqliteProjectRepository(),
  conversationServiceSingleton,
  // When a chat is re-homed into a project, drop its cached worker task so the
  // next turn rebuilds in the project workspace instead of the stale temp cwd.
  // ProjectServiceImpl skips this for an actively-streaming task (status check).
  {
    getStatus: (conversationId) => workerTaskManager.getTask(conversationId)?.status,
    evict: (conversationId) => workerTaskManager.kill(conversationId, 'workspace_rehome'),
  }
);
