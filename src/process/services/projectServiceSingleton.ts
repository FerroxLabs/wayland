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
import type { IProjectService } from './IProjectService';

export const projectServiceSingleton: IProjectService = new ProjectServiceImpl(
  new SqliteProjectRepository(),
  conversationServiceSingleton
);
