/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

/**
 * Singleton ConversationServiceImpl wired with a SqliteConversationRepository.
 * Extracted to a separate module to avoid circular dependencies.
 */

import { SqliteConversationRepository } from '@process/services/database/SqliteConversationRepository';
import { ConversationServiceImpl } from './ConversationServiceImpl';
import type { IConversationService } from './IConversationService';

export const conversationServiceSingleton: IConversationService = new ConversationServiceImpl(
  new SqliteConversationRepository()
);
