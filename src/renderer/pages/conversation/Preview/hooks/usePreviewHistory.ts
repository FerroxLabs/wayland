/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { PreviewHistoryTarget, PreviewSnapshotInfo } from '@/common/types/preview';
import { Message } from '@arco-design/web-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SNAPSHOT_DEBOUNCE_TIME } from '../constants';

/**
 * Preview history hook configuration
 */
interface UsePreviewHistoryOptions {
  /**
   * Current active tab
   */
  activeTab: {
    contentType: string;
    content: string;
    title: string;
    metadata?: {
      filePath?: string;
      workspace?: string;
      fileName?: string;
      title?: string;
      language?: string;
    };
  } | null;

  /**
   * Update content callback
   */
  updateContent: (content: string) => void;
}

/**
 * Preview history hook return value
 */
interface UsePreviewHistoryReturn {
  /**
   * History versions list
   */
  historyVersions: PreviewSnapshotInfo[];

  /**
   * Whether history is loading
   */
  historyLoading: boolean;

  /**
   * Whether snapshot is saving
   */
  snapshotSaving: boolean;

  /**
   * History loading error message
   */
  historyError: string | null;

  /**
   * History target (for IPC calls)
   */
  historyTarget: PreviewHistoryTarget | null;

  /**
   * Refresh history list
   */
  refreshHistory: () => Promise<void>;

  /**
   * Save snapshot
   */
  handleSaveSnapshot: () => Promise<void>;

  /**
   * Select history snapshot
   */
  handleSnapshotSelect: (snapshot: PreviewSnapshotInfo) => Promise<void>;

  /**
   * Message API instance (for displaying notifications)
   */
  messageApi: ReturnType<typeof Message.useMessage>[0];

  /**
   * Message Context Holder (needs to be rendered in component)
   */
  messageContextHolder: ReturnType<typeof Message.useMessage>[1];
}

/**
 * Preview history management hook
 *
 * Handles loading, saving, and selecting history versions
 *
 * @param options - Configuration options
 * @returns History management related states and methods
 */
export const usePreviewHistory = ({ activeTab, updateContent }: UsePreviewHistoryOptions): UsePreviewHistoryReturn => {
  const { t } = useTranslation();
  const [historyVersions, setHistoryVersions] = useState<PreviewSnapshotInfo[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [messageApi, messageContextHolder] = Message.useMessage();
  const lastSnapshotTimeRef = useRef<number>(0); // Track last snapshot save time

  // Build history target object
  const historyTarget = useMemo<PreviewHistoryTarget | null>(() => {
    if (!activeTab) return null;
    const meta = activeTab.metadata;
    const fallbackName = meta?.fileName || meta?.title || activeTab.title;
    return {
      contentType: activeTab.contentType as import('@/common/types/preview').PreviewContentType,
      filePath: meta?.filePath,
      workspace: meta?.workspace,
      fileName: fallbackName,
      title: meta?.title || activeTab.title,
      language: meta?.language,
    };
  }, [activeTab]);

  // Refresh history list
  const refreshHistory = useCallback(async () => {
    if (!historyTarget) {
      setHistoryVersions([]);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const versions = await ipcBridge.previewHistory.list.invoke({ target: historyTarget });
      setHistoryVersions(versions || []);
      setHistoryError(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('common.unknownError');
      setHistoryError(`${t('preview.loadHistoryFailed')}: ${errorMsg}`);
      setHistoryVersions([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyTarget, t]);

  // Auto refresh history when historyTarget changes
  useEffect(() => {
    void refreshHistory().catch((): void => undefined);
  }, [refreshHistory]);

  // Save snapshot
  const handleSaveSnapshot = useCallback(async () => {
    if (!historyTarget || !activeTab) {
      return;
    }
    if (snapshotSaving) return;

    // Debounce check: Ignore if less than 1 second since last save
    const now = Date.now();
    if (now - lastSnapshotTimeRef.current < SNAPSHOT_DEBOUNCE_TIME) {
      messageApi.info(t('preview.tooFrequent'));
      return;
    }

    try {
      setSnapshotSaving(true);
      lastSnapshotTimeRef.current = now; // Update last save time
      await ipcBridge.previewHistory.save.invoke({ target: historyTarget, content: activeTab.content });
      messageApi.success(t('preview.snapshotSaved'));
      await refreshHistory();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('common.unknownError');
      messageApi.error(`${t('preview.snapshotSaveFailed')}: ${errorMsg}`);
    } finally {
      setSnapshotSaving(false);
    }
  }, [historyTarget, activeTab, snapshotSaving, messageApi, refreshHistory, t]);

  // Select history snapshot
  const handleSnapshotSelect = useCallback(
    async (snapshot: PreviewSnapshotInfo) => {
      if (!historyTarget) {
        return;
      }
      try {
        const result = await ipcBridge.previewHistory.getContent.invoke({
          target: historyTarget,
          snapshotId: snapshot.id,
        });
        if (result?.content) {
          updateContent(result.content);
          messageApi.success(t('preview.historyLoaded'));
        } else {
          throw new Error(t('preview.errors.emptySnapshot'));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : t('common.unknownError');
        messageApi.error(`${t('preview.historyLoadFailed')}: ${errorMsg}`);
      }
    },
    [historyTarget, messageApi, updateContent, t]
  );

  return {
    historyVersions,
    historyLoading,
    snapshotSaving,
    historyError,
    historyTarget,
    refreshHistory,
    handleSaveSnapshot,
    handleSnapshotSelect,
    messageApi,
    messageContextHolder,
  };
};
