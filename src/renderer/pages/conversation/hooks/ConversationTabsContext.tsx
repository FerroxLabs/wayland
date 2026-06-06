/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import { STORAGE_KEYS } from '@/common/config/storageKeys';
import { addEventListener } from '@/renderer/utils/emitter';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/** Conversation Tab data structure */
export interface ConversationTab {
  /** Conversation ID */
  id: string;
  /** Conversation name */
  name: string;
  /** Workspace path */
  workspace: string;
  /** Conversation type */
  type: 'gemini' | 'acp' | 'codex' | 'openclaw-gateway' | 'nanobot' | 'remote' | 'wcore';
  /** Whether there are unsaved changes */
  isDirty?: boolean;
}

export interface ConversationTabsContextValue {
  // All open tabs
  openTabs: ConversationTab[];
  // Currently active tab ID
  activeTabId: string | null;

  // Get active tab
  activeTab: ConversationTab | null;

  // Open a conversation tab
  openTab: (conversation: TChatConversation) => void;
  // Close a tab
  closeTab: (conversationId: string) => void;
  // Switch to a tab
  switchTab: (conversationId: string) => void;
  // Close all tabs
  closeAllTabs: () => void;
  // Close all tabs to the left of specified tab
  closeTabsToLeft: (conversationId: string) => void;
  // Close all tabs to the right of specified tab
  closeTabsToRight: (conversationId: string) => void;
  // Close all tabs except the specified one
  closeOtherTabs: (conversationId: string) => void;
  // Update tab name
  updateTabName: (conversationId: string, newName: string) => void;
}

const ConversationTabsContext = createContext<ConversationTabsContextValue | null>(null);

// Restore state from localStorage
const loadPersistedState = (): { openTabs: ConversationTab[]; activeTabId: string | null } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATION_TABS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate data structure
      if (Array.isArray(parsed.openTabs)) {
        return {
          openTabs: parsed.openTabs,
          activeTabId: parsed.activeTabId || null,
        };
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return { openTabs: [], activeTabId: null };
};

export const ConversationTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restore initial state from localStorage
  const persistedState = loadPersistedState();
  const [openTabs, setOpenTabs] = useState<ConversationTab[]>(persistedState.openTabs);
  const [activeTabId, setActiveTabId] = useState<string | null>(persistedState.activeTabId);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CONVERSATION_TABS,
        JSON.stringify({
          openTabs,
          activeTabId,
        })
      );
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }, [openTabs, activeTabId]);

  // Get active tab
  const activeTab = openTabs.find((tab) => tab.id === activeTabId) || null;

  const openTab = useCallback((conversation: TChatConversation) => {
    // Only show tabs for user-specified workspaces, not temporary workspaces
    const customWorkspace = conversation.extra?.customWorkspace;

    if (!customWorkspace) {
      // Don't add temporary workspace conversations to tabs
      // Close all tabs when leaving the group
      setOpenTabs([]);
      // But need to update activeTabId to keep in sync
      setActiveTabId(conversation.id);
      return;
    }

    setOpenTabs((prev) => {
      const exists = prev.find((tab) => tab.id === conversation.id);
      if (exists) {
        // Already exists, don't add duplicate
        return prev;
      }
      // Add new tab
      return [
        ...prev,
        {
          id: conversation.id,
          name: conversation.name,
          workspace: conversation.extra?.workspace || '',
          type: conversation.type,
        },
      ];
    });
    // Switch to this tab
    setActiveTabId(conversation.id);
  }, []);

  const closeTab = useCallback(
    (conversationId: string) => {
      setOpenTabs((prev) => {
        const filtered = prev.filter((tab) => tab.id !== conversationId);

        // If closing the active tab
        if (conversationId === activeTabId) {
          if (filtered.length > 0) {
            // Switch to the last tab
            setActiveTabId(filtered[filtered.length - 1].id);
          } else {
            // No more tabs
            setActiveTabId(null);
          }
        }

        return filtered;
      });
    },
    [activeTabId]
  );

  const switchTab = useCallback((conversationId: string) => {
    setActiveTabId(conversationId);
  }, []);

  const closeAllTabs = useCallback(() => {
    setOpenTabs([]);
    setActiveTabId(null);
  }, []);

  const closeTabsToLeft = useCallback(
    (conversationId: string) => {
      setOpenTabs((prev) => {
        const targetIndex = prev.findIndex((tab) => tab.id === conversationId);
        if (targetIndex <= 0) return prev; // No left tabs or target not found

        // Keep target tab and all tabs to its right
        const newTabs = prev.slice(targetIndex);

        // If the active tab was closed, switch to the target tab
        const closedIds = prev.slice(0, targetIndex).map((tab) => tab.id);
        if (activeTabId && closedIds.includes(activeTabId)) {
          setActiveTabId(conversationId);
        }

        return newTabs;
      });
    },
    [activeTabId]
  );

  const closeTabsToRight = useCallback(
    (conversationId: string) => {
      setOpenTabs((prev) => {
        const targetIndex = prev.findIndex((tab) => tab.id === conversationId);
        if (targetIndex === -1 || targetIndex === prev.length - 1) return prev; // No right tabs or target not found

        // Keep target tab and all tabs to its left
        const newTabs = prev.slice(0, targetIndex + 1);

        // If the active tab was closed, switch to the target tab
        const closedIds = prev.slice(targetIndex + 1).map((tab) => tab.id);
        if (activeTabId && closedIds.includes(activeTabId)) {
          setActiveTabId(conversationId);
        }

        return newTabs;
      });
    },
    [activeTabId]
  );

  const closeOtherTabs = useCallback((conversationId: string) => {
    setOpenTabs((prev) => {
      const targetTab = prev.find((tab) => tab.id === conversationId);
      if (!targetTab) return prev;

      // Only keep the target tab
      setActiveTabId(conversationId);
      return [targetTab];
    });
  }, []);

  const updateTabName = useCallback((conversationId: string, newName: string) => {
    setOpenTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === conversationId) {
          return { ...tab, name: newName };
        }
        return tab;
      })
    );
  }, []);

  // Listen to conversation deletion event, auto-close corresponding tab
  useEffect(() => {
    return addEventListener('conversation.deleted', (conversationId) => {
      closeTab(conversationId);
    });
  }, [closeTab]);

  return (
    <ConversationTabsContext.Provider
      value={{
        openTabs,
        activeTabId,
        activeTab,
        openTab,
        closeTab,
        switchTab,
        closeAllTabs,
        closeTabsToLeft,
        closeTabsToRight,
        closeOtherTabs,
        updateTabName,
      }}
    >
      {children}
    </ConversationTabsContext.Provider>
  );
};

export const useConversationTabs = () => {
  const context = useContext(ConversationTabsContext);
  if (!context) {
    throw new Error('useConversationTabs must be used within ConversationTabsProvider');
  }
  return context;
};

export const useOptionalConversationTabs = () => useContext(ConversationTabsContext);
