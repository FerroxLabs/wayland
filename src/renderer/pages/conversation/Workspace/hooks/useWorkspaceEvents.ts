/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IDirOrFile } from '@/common/adapter/ipcBridge';
import { emitter, useAddEventListener } from '@/renderer/utils/emitter';
import { useCallback, useEffect, useRef } from 'react';
import type { ContextMenuState } from '../types';

interface UseWorkspaceEventsOptions {
  conversation_id: string;
  eventPrefix: 'gemini' | 'acp' | 'codex' | 'wcore';

  // Dependencies from useWorkspaceTree
  refreshWorkspace: () => void;
  clearSelection: () => void;
  setFiles: React.Dispatch<React.SetStateAction<IDirOrFile[]>>;
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  setExpandedKeys: React.Dispatch<React.SetStateAction<string[]>>;
  setTreeKey: React.Dispatch<React.SetStateAction<number>>;
  selectedNodeRef: React.MutableRefObject<{
    relativePath: string;
    fullPath: string;
  } | null>;
  selectedKeysRef: React.MutableRefObject<string[]>;

  // Dependencies from useWorkspaceModals
  closeContextMenu: () => void;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  closeRenameModal: () => void;
  closeDeleteModal: () => void;
}

/**
 * useWorkspaceEvents - Manage all event listeners
 */
export function useWorkspaceEvents(options: UseWorkspaceEventsOptions) {
  const {
    conversation_id,
    eventPrefix,
    refreshWorkspace,
    clearSelection,
    setFiles,
    setSelected,
    setExpandedKeys,
    setTreeKey,
    selectedNodeRef,
    selectedKeysRef,
    closeContextMenu,
    setContextMenu,
    closeRenameModal,
    closeDeleteModal,
  } = options;

  /**
   * Listen to conversation switch event - reset all states
   */
  useEffect(() => {
    setFiles([]);
    setSelected([]);
    setExpandedKeys([]);
    selectedNodeRef.current = null;
    selectedKeysRef.current = [];
    setTreeKey(Math.random());
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
    closeRenameModal();
    closeDeleteModal();
    refreshWorkspace();
    emitter.emit(`${eventPrefix}.selected.file`, []);
  }, [
    conversation_id,
    eventPrefix,
    refreshWorkspace,
    setFiles,
    setSelected,
    setExpandedKeys,
    setTreeKey,
    selectedNodeRef,
    selectedKeysRef,
    setContextMenu,
    closeRenameModal,
    closeDeleteModal,
  ]);

  /**
   * Throttled refresh - prevent rapid workspace refreshes during agent tool calls
   */
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const throttledRefresh = useCallback(() => {
    if (throttleTimerRef.current) {
      pendingRef.current = true; // Mark pending so trailing refresh fires after window
      return;
    }
    refreshWorkspace();
    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = null;
      if (pendingRef.current) {
        pendingRef.current = false;
        refreshWorkspace(); // Fire trailing refresh for any calls missed during throttle window
      }
    }, 2000);
  }, [refreshWorkspace]);

  // Cleanup throttle timer on unmount
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    };
  }, []);

  /**
   * Listen to agent response stream - auto refresh workspace (throttled)
   */
  useEffect(() => {
    const handleGeminiResponse = (data: { type: string }) => {
      if (data.type === 'tool_group' || data.type === 'tool_call') {
        throttledRefresh();
      }
    };
    const handleAcpResponse = (data: { type: string }) => {
      if (data.type === 'acp_tool_call') {
        throttledRefresh();
      }
    };
    const handleCodexResponse = (data: { type: string }) => {
      if (data.type === 'codex_tool_call') {
        throttledRefresh();
      }
    };
    const unsubscribeGemini = ipcBridge.geminiConversation.responseStream.on(handleGeminiResponse);
    const unsubscribeAcp = ipcBridge.acpConversation.responseStream.on(handleAcpResponse);
    const unsubscribeCodex = ipcBridge.codexConversation.responseStream.on(handleCodexResponse);

    return () => {
      unsubscribeGemini();
      unsubscribeAcp();
      unsubscribeCodex();
    };
  }, [conversation_id, eventPrefix, throttledRefresh]);

  /**
   * Listen to manual refresh workspace event
   */
  useAddEventListener(`${eventPrefix}.workspace.refresh`, () => refreshWorkspace(), [refreshWorkspace]);

  /**
   * Listen to clear selected files event (after sending message)
   */
  useAddEventListener(`${eventPrefix}.selected.file.clear`, () => clearSelection(), [clearSelection]);

  /**
   * Listen to selected files change event (sync state when closing tags in sendbox) (#1083)
   */
  useAddEventListener(
    `${eventPrefix}.selected.file`,
    (
      items: Array<{
        path: string;
        name: string;
        isFile: boolean;
        relativePath?: string;
      }>
    ) => {
      // Extract relative paths from items, filter out files (only keep folders in tree selection)
      const newKeys = items.filter((item) => !item.isFile && item.relativePath).map((item) => item.relativePath!);
      setSelected(newKeys);
      selectedKeysRef.current = newKeys;

      // Update selectedNodeRef based on items
      const folders = items.filter((item) => !item.isFile);
      if (folders.length > 0) {
        const lastFolder = folders[folders.length - 1];
        selectedNodeRef.current = lastFolder.relativePath
          ? {
              relativePath: lastFolder.relativePath,
              fullPath: lastFolder.path,
            }
          : null;
      } else {
        selectedNodeRef.current = null;
      }
    },
    [setSelected, selectedKeysRef, selectedNodeRef]
  );

  /**
   * Listen to search workspace response
   */
  useEffect(() => {
    return ipcBridge.conversation.responseSearchWorkSpace.provider((data) => {
      if (data.match) setFiles([data.match]);
      return Promise.resolve();
    });
  }, [setFiles]);

  /**
   * Listen to clicks outside context menu - close menu
   */
  useEffect(() => {
    const handleClose = () => {
      closeContextMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeContextMenu]);
}
