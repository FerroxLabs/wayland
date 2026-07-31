/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

import { ipcBridge } from '@/common';
import type { TChatConversation } from '@/common/config/storage';
import { mutate } from 'swr';

export async function refreshConversationCache(conversationId: string): Promise<void> {
  const conversation = await ipcBridge.conversation.get.invoke({ id: conversationId }).catch((): null => null);
  if (!conversation) return;

  await mutate<TChatConversation>(`conversation/${conversationId}`, conversation, false);
}
