/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { Message } from '@arco-design/web-react';
import { emitter } from '@/renderer/utils/emitter';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type { TChatConversation } from '@/common/config/storage';

export type WorkspaceEventPrefix = 'gemini' | 'acp' | 'codex';

/**
 * Hook to select a new workspace directory for the current conversation.
 */
export const useWorkspaceSelector = (conversationId: string, eventPrefix: WorkspaceEventPrefix) => {
  const { mutate } = useSWRConfig();
  const { t } = useTranslation();

  return useCallback(async () => {
    try {
      // Prompt user to pick a new workspace directory
      const files = await ipcBridge.dialog.showOpen.invoke({ properties: ['openDirectory', 'createDirectory'] });
      const workspacePath = files?.[0];
      if (!workspacePath) {
        return;
      }

      // Fetch latest conversation data
      const conversation = (await ipcBridge.conversation.get.invoke({
        id: conversationId,
      })) as TChatConversation | null;
      if (!conversation) {
        Message.error(t('common.saveFailed'));
        return;
      }

      // Update conversation.extra.workspace
      const nextExtra = { ...conversation.extra, workspace: workspacePath };
      const success = await ipcBridge.conversation.update.invoke({ id: conversationId, updates: { extra: nextExtra } });
      if (!success) {
        Message.error(t('common.saveFailed'));
        return;
      }

      // Refresh SWR cache and notify workspace/history
      await mutate(`conversation/${conversationId}`, { ...conversation, extra: nextExtra }, false);
      emitter.emit(`${eventPrefix}.workspace.refresh`);
      emitter.emit('chat.history.refresh');
      Message.success(t('common.saveSuccess'));
    } catch (error) {
      console.error('Failed to select workspace:', error);
      Message.error(t('common.saveFailed'));
    }
  }, [conversationId, eventPrefix, mutate, t]);
};
