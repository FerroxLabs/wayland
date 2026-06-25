/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import { STORAGE_KEYS } from '@/common/config/storageKeys';
import { addEventListener } from '@/renderer/utils/emitter';
import { isPopoutModeNow } from '@renderer/hooks/system/useIsPopoutMode';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { reorderByIndex } from '../utils/tabReorder';

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
  // Reorder tabs by moving the tab at fromIndex to toIndex (view state only)
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  // Update tab name
  updateTabName: (conversationId: string, newName: string) => void;
}

const ConversationTabsContext = createContext<ConversationTabsContextValue | null>(null);

/**
 * Browser-like soft cap on open tabs. Every chat you open becomes a tab; without
 * a cap the bar would flood as you click through recent chats. When opening a new
 * chat would exceed this, the oldest tab that is not the one being opened is
 * evicted (the just-opened tab becomes active, so the active tab is never lost).
 */
const MAX_OPEN_TABS = 12;

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
  // CRITICAL (#27 phase 2): localStorage is shared across windows (same origin).
  // A pop-out window must NEVER read or write `wayland_conversation_tabs`, or it
  // would clobber the main window's tab set. Detect pop-out mode once at mount
  // (it is fixed for the window's lifetime) and use it to (a) start from an empty
  // tab set instead of hydrating the shared key and (b) skip the persistence
  // effect entirely. `openTab` is also a no-op in pop-out mode (below).
  const isPopout = isPopoutModeNow();

  // Restore initial state from localStorage (main window only).
  const persistedState = isPopout ? { openTabs: [], activeTabId: null } : loadPersistedState();
  const [openTabs, setOpenTabs] = useState<ConversationTab[]>(persistedState.openTabs);
  const [activeTabId, setActiveTabId] = useState<string | null>(persistedState.activeTabId);

  // Persist state to localStorage - GUARDED off in pop-out mode (see above).
  useEffect(() => {
    if (isPopout) return;
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
  }, [openTabs, activeTabId, isPopout]);

  // Get active tab
  const activeTab = openTabs.find((tab) => tab.id === activeTabId) || null;

  const openTabImpl = useCallback((conversation: TChatConversation) => {
    // Browser-like tabs: EVERY chat opened (new or existing) becomes a tab, not
    // just custom-workspace ones. Opening a chat that already has a tab just
    // re-activates it; a new one is appended (with a soft cap, see below).
    setOpenTabs((prev) => {
      const exists = prev.find((tab) => tab.id === conversation.id);
      if (exists) {
        return prev;
      }
      const appended: ConversationTab[] = [
        ...prev,
        {
          id: conversation.id,
          name: conversation.name,
          workspace: conversation.extra?.workspace || '',
          type: conversation.type,
        },
      ];
      if (appended.length > MAX_OPEN_TABS) {
        // Evict the oldest tab that is NOT the one just opened. The opened tab
        // becomes active immediately below, so the active tab is never evicted.
        const evictIdx = appended.findIndex((tab) => tab.id !== conversation.id);
        if (evictIdx !== -1) {
          appended.splice(evictIdx, 1);
        }
      }
      return appended;
    });
    // Switch to this tab
    setActiveTabId(conversation.id);
  }, []);

  const openTab = useCallback(
    (conversation: TChatConversation) => {
      // Pop-out windows have no tab bar and must not touch the shared tab state.
      if (isPopout) return;
      openTabImpl(conversation);
    },
    [isPopout, openTabImpl]
  );

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

  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    setOpenTabs((prev) => reorderByIndex(prev, fromIndex, toIndex));
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
        reorderTabs,
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
