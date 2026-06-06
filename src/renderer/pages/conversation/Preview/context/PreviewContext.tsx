/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { PreviewContentType } from '@/common/types/preview';
import { emitter } from '@/renderer/utils/emitter';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/** DOM snippet data structure */
export interface DomSnippet {
  /** Unique ID */
  id: string;
  /** Simplified tag name (for display) */
  tag: string;
  /** Full HTML */
  html: string;
}

export interface PreviewMetadata {
  language?: string;
  title?: string;
  diff?: string;
  fileName?: string;
  filePath?: string; // Absolute file path in workspace
  workspace?: string; // Workspace root directory
  editable?: boolean; // Whether editable
}

export interface PreviewTab {
  id: string;
  content: string;
  contentType: PreviewContentType;
  metadata?: PreviewMetadata;
  title: string; // Tab title
  isDirty?: boolean; // Whether there are unsaved changes
  originalContent?: string; // Original content for comparison
  isStreaming?: boolean; // True while an agent is actively writing to this tab's filePath
}

export interface PreviewContextValue {
  // Preview panel state
  isOpen: boolean;
  tabs: PreviewTab[]; // All open tabs
  activeTabId: string | null; // Currently active tab ID

  // Get active tab
  activeTab: PreviewTab | null;

  // Preview panel operations
  openPreview: (content: string, type: PreviewContentType, metadata?: PreviewMetadata) => void;
  closePreview: () => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateContent: (content: string) => void;
  saveContent: (tabId?: string) => Promise<boolean>; // Save content
  findPreviewTab: (type: PreviewContentType, content?: string, metadata?: PreviewMetadata) => PreviewTab | null; // Find matching tab
  closePreviewByIdentity: (type: PreviewContentType, content?: string, metadata?: PreviewMetadata) => void; // Close tab by content identity

  // Sendbox integration
  addToSendBox: (text: string) => void;
  setSendBoxHandler: (handler: ((text: string) => void) | null) => void;

  // DOM snippet management
  domSnippets: DomSnippet[];
  addDomSnippet: (tag: string, html: string) => void;
  removeDomSnippet: (id: string) => void;
  clearDomSnippets: () => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

// Persistence keys
const PREVIEW_TABS_KEY = 'wayland_preview_tabs';
const PREVIEW_ACTIVE_TAB_ID_KEY = 'wayland_preview_active_tab_id';
const LEGACY_PREVIEW_STATE_KEY = 'wayland_preview_state';

// Persist only lightweight text previews to avoid localStorage jank on large files
const MAX_PERSISTED_TAB_CONTENT_LENGTH = 80_000;
const PERSISTABLE_CONTENT_TYPES = new Set<PreviewContentType>(['markdown', 'html', 'code', 'diff']);

const sanitizeTabsForPersistence = (input: PreviewTab[]): PreviewTab[] => {
  return input
    .filter((tab) => PERSISTABLE_CONTENT_TYPES.has(tab.contentType))
    .filter((tab) => tab.content.length <= MAX_PERSISTED_TAB_CONTENT_LENGTH)
    .map((tab) => ({
      ...tab,
      isDirty: false,
      originalContent: tab.content,
    }));
};

const parsePersistedTabs = (value: unknown): PreviewTab[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((tab): tab is PreviewTab => {
      if (!tab || typeof tab !== 'object') return false;
      const candidate = tab as Partial<PreviewTab>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.title === 'string' &&
        typeof candidate.content === 'string' &&
        typeof candidate.contentType === 'string'
      );
    })
    .filter((tab) => PERSISTABLE_CONTENT_TYPES.has(tab.contentType))
    .filter((tab) => tab.content.length <= MAX_PERSISTED_TAB_CONTENT_LENGTH)
    .map((tab) => ({
      ...tab,
      originalContent: typeof tab.originalContent === 'string' ? tab.originalContent : tab.content,
      isDirty: false,
    }));
};

// Restore state from localStorage
// Note: isOpen is not restored from localStorage, preview panel is closed by default for new sessions
const loadPersistedState = (): { isOpen: boolean; tabs: PreviewTab[]; activeTabId: string | null } => {
  try {
    let tabs = parsePersistedTabs(JSON.parse(localStorage.getItem(PREVIEW_TABS_KEY) || '[]'));
    let activeTabId = localStorage.getItem(PREVIEW_ACTIVE_TAB_ID_KEY);

    // Backward compatibility for legacy single-key storage
    if (tabs.length === 0) {
      const legacyStored = localStorage.getItem(LEGACY_PREVIEW_STATE_KEY);
      if (legacyStored) {
        const parsed = JSON.parse(legacyStored) as { tabs?: unknown; activeTabId?: unknown };
        tabs = parsePersistedTabs(parsed.tabs);
        activeTabId = typeof parsed.activeTabId === 'string' ? parsed.activeTabId : activeTabId;
      }
    }

    if (activeTabId && !tabs.some((tab) => tab.id === activeTabId)) {
      activeTabId = tabs[0]?.id || null;
    }

    return {
      isOpen: false, // Always start closed
      tabs,
      activeTabId,
    };
  } catch {
    // Ignore parsing errors
  }
  return { isOpen: false, tabs: [], activeTabId: null };
};

export const PreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restore initial state from localStorage
  const persistedState = loadPersistedState();
  const [isOpen, setIsOpen] = useState(persistedState.isOpen);
  const [tabs, setTabs] = useState<PreviewTab[]>(persistedState.tabs);
  const [activeTabId, setActiveTabId] = useState<string | null>(persistedState.activeTabId);
  // const [sendBoxHandler, setSendBoxHandlerState] = useState<((text: string) => void) | null>(null);
  const sendBoxHandler = useRef<((text: string) => void) | null>(null);
  const [domSnippets, setDomSnippets] = useState<DomSnippet[]>([]);

  // Persist tabs to localStorage (only lightweight text tabs)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(PREVIEW_TABS_KEY, JSON.stringify(sanitizeTabsForPersistence(tabs)));
        // Remove legacy key after migration to avoid duplicate parsing
        localStorage.removeItem(LEGACY_PREVIEW_STATE_KEY);
      } catch {
        // Ignore storage errors (e.g., quota exceeded)
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [tabs]);

  // Persist activeTabId separately to avoid re-serializing large tab content on tab switch
  useEffect(() => {
    try {
      if (activeTabId) {
        localStorage.setItem(PREVIEW_ACTIVE_TAB_ID_KEY, activeTabId);
      } else {
        localStorage.removeItem(PREVIEW_ACTIVE_TAB_ID_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [activeTabId]);

  // Track if currently saving (to avoid conflicts with streaming updates)
  const savingFilesRef = useRef<Set<string>>(new Set());

  // Get active tab
  const activeTab = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTabId) || null;
  }, [tabs, activeTabId]);

  const normalize = useCallback((value?: string | null) => value?.trim() || '', []);

  // Extract filename from string that may contain description
  const extractFileName = useCallback((str?: string): string | undefined => {
    if (!str) return undefined;
    // Match patterns like "Writing to xxx.md" and extract filename
    const match = str.match(/(?:Writing to|Reading|Creating|Updating)\s+(.+)$/i);
    return match ? match[1] : str;
  }, []);

  const findPreviewTabInList = useCallback(
    (tabList: PreviewTab[], type: PreviewContentType, content?: string, meta?: PreviewMetadata) => {
      const normalizedFileName = normalize(meta?.fileName);
      const normalizedTitle = normalize(meta?.title);
      const normalizedFilePath = normalize(meta?.filePath);

      return (
        tabList.find((tab) => {
          if (tab.contentType !== type) return false;
          const tabFileName = normalize(tab.metadata?.fileName);
          const tabTitle = normalize(tab.metadata?.title);
          const tabFilePath = normalize(tab.metadata?.filePath);

          // Prefer matching by filePath (most reliable)
          if (normalizedFilePath && tabFilePath && normalizedFilePath === tabFilePath) return true;

          // When matching by fileName, ensure path compatibility (avoid conflicts of same-named files in different directories)
          if (normalizedFileName && tabFileName && normalizedFileName === tabFileName) {
            // If both have filePath, they must match exactly
            if (normalizedFilePath && tabFilePath) {
              return normalizedFilePath === tabFilePath;
            }
            // If only one side has filePath, cannot match by fileName alone
            if (normalizedFilePath || tabFilePath) {
              return false;
            }
            // When neither has filePath, can match by fileName
            return true;
          }

          // Then match by title
          if (!normalizedFileName && normalizedTitle && tabTitle && normalizedTitle === tabTitle) return true;

          // Finally match by content (only for small files)
          // For large files (PPT/Excel/Word), skip content comparison to avoid performance issues
          if (!normalizedFileName && !normalizedTitle && !normalizedFilePath && content !== undefined) {
            // Only compare content smaller than 100KB
            if (content.length < 100000 && tab.content === content) return true;
          }

          return false;
        }) || null
      );
    },
    [normalize]
  );

  const findPreviewTab = useCallback(
    (type: PreviewContentType, content?: string, meta?: PreviewMetadata) => {
      return findPreviewTabInList(tabs, type, content, meta);
    },
    [findPreviewTabInList, tabs]
  );

  const openPreview = useCallback(
    (newContent: string, type: PreviewContentType, meta?: PreviewMetadata) => {
      let nextActiveTabId: string | null = null;

      setTabs((prevTabs) => {
        // Focus existing tab when the same file is opened again
        const existingTab = findPreviewTabInList(prevTabs, type, newContent, meta);

        if (existingTab) {
          nextActiveTabId = existingTab.id;
          return prevTabs.map((tab) => {
            if (tab.id !== existingTab.id) return tab;

            // Keep edited content, only merge metadata
            if (tab.isDirty) {
              return meta ? { ...tab, metadata: { ...tab.metadata, ...meta } } : tab;
            }

            return {
              ...tab,
              content: newContent,
              metadata: meta ? { ...tab.metadata, ...meta } : tab.metadata,
              originalContent: newContent,
            };
          });
        }

        // Tab title: Prefer fileName and extract actual filename from title
        const fallbackTitle = (() => {
          // Set default title based on content type
          if (type === 'markdown') return 'Markdown';
          if (type === 'diff') return 'Diff';
          if (type === 'code') return `${meta?.language || 'Code'}`;
          if (type === 'image') return 'Image'; // Default title for image preview
          return 'Preview';
        })();

        const title = extractFileName(meta?.fileName) || extractFileName(meta?.title) || fallbackTitle;

        // Generate unique ID
        const tabId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const newTab: PreviewTab = {
          id: tabId,
          content: newContent,
          contentType: type,
          metadata: meta,
          title,
          isDirty: false,
          originalContent: newContent, // Save original content
        };

        nextActiveTabId = tabId;
        return [...prevTabs, newTab];
      });

      if (nextActiveTabId) {
        setActiveTabId(nextActiveTabId);
      }
      setIsOpen(true);
    },
    [extractFileName, findPreviewTabInList]
  );

  const closePreview = useCallback(() => {
    setIsOpen(false);
    setTabs([]);
    setActiveTabId(null);
    setDomSnippets([]);
  }, []);

  // Track last-known mtime per file path for external change detection
  const fileMtimeRef = useRef<Map<string, number>>(new Map());

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prevTabs) => {
        // Clean up mtime record for the closed tab
        const tabToClose = prevTabs.find((tab) => tab.id === tabId);
        if (tabToClose?.metadata?.filePath) {
          fileMtimeRef.current.delete(tabToClose.metadata.filePath);
        }

        const newTabs = prevTabs.filter((tab) => tab.id !== tabId);

        // If closing the active tab
        if (tabId === activeTabId) {
          if (newTabs.length > 0) {
            // Switch to the last tab
            setActiveTabId(newTabs[newTabs.length - 1].id);
          } else {
            // No more tabs, close preview panel
            setIsOpen(false);
            setActiveTabId(null);
          }
        }

        return newTabs;
      });
    },
    [activeTabId]
  );

  const closePreviewByIdentity = useCallback(
    (type: PreviewContentType, content?: string, meta?: PreviewMetadata) => {
      const tab = findPreviewTab(type, content, meta);
      if (tab) {
        closeTab(tab.id);
      }
    },
    [findPreviewTab, closeTab]
  );

  const updateContent = useCallback(
    (newContent: string) => {
      if (!activeTabId) {
        return;
      }

      // Strict type checking to prevent Event object from being passed incorrectly
      if (typeof newContent !== 'string') {
        return;
      }

      try {
        setTabs((prevTabs) => {
          const updated = prevTabs.map((tab) => {
            if (tab.id === activeTabId) {
              // Check if content differs from original
              const isDirty = newContent !== tab.originalContent;
              return { ...tab, content: newContent, isDirty };
            }
            return tab;
          });
          return updated;
        });
      } catch {
        // Silently ignore errors
      }
    },
    [activeTabId]
  );

  const saveContent = useCallback(
    async (tabId?: string) => {
      const targetTabId = tabId || activeTabId;
      if (!targetTabId) return false;

      const tab = tabs.find((t) => t.id === targetTabId);
      if (!tab) return false;

      // If filePath and workspace exist, write back to workspace file
      if (tab.metadata?.filePath && tab.metadata?.workspace) {
        try {
          const filePath = tab.metadata.filePath;

          // Mark file as being saved (to avoid triggering file watch callback)
          savingFilesRef.current.add(filePath);

          // Write file via IPC
          const success = await ipcBridge.fs.writeFile.invoke({
            path: filePath,
            data: tab.content,
          });

          if (success) {
            setTabs((prevTabs) =>
              prevTabs.map((t) => {
                if (t.id === targetTabId) {
                  return { ...t, isDirty: false, originalContent: t.content };
                }
                return t;
              })
            );
          }

          // Delay removing save flag (give file watch time to ignore change)
          setTimeout(() => {
            savingFilesRef.current.delete(filePath);
          }, 500);

          return success;
        } catch (error) {
          // Error occurred, handle silently (log only)
          // Ensure save flag is removed
          if (tab.metadata?.filePath) {
            savingFilesRef.current.delete(tab.metadata.filePath);
          }
          throw error;
        }
      }
      return false;
    },
    [activeTabId, tabs]
  );

  const addToSendBox = useCallback((text: string) => {
    if (sendBoxHandler.current) {
      sendBoxHandler.current(text);
    }
  }, []);

  const setSendBoxHandler = useCallback((handler: ((text: string) => void) | null) => {
    sendBoxHandler.current = handler;
  }, []);

  // DOM snippet management functions
  // Only keep the latest snippet
  const addDomSnippet = useCallback((tag: string, html: string) => {
    const id = `snippet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setDomSnippets([{ id, tag, html }]);
  }, []);

  const removeDomSnippet = useCallback((id: string) => {
    setDomSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearDomSnippets = useCallback(() => {
    setDomSnippets([]);
  }, []);

  // Streaming content subscription: Subscribe to streaming updates when agent writes files (replaces file watching)
  // Use debounce optimization: Wait for agent to finish writing before updating preview, avoiding frequent animation interruptions
  useEffect(() => {
    // Debounce timer map: one timer per file path
    const debounceTimers = new Map<string, NodeJS.Timeout>();

    const unsubscribe = ipcBridge.fileStream.contentUpdate.on(({ filePath, content, operation }) => {
      // If delete operation, handle immediately without debounce
      if (operation === 'delete') {
        // Clear debounce timer for this file
        const existingTimer = debounceTimers.get(filePath);
        if (existingTimer) {
          clearTimeout(existingTimer);
          debounceTimers.delete(filePath);
        }

        setTabs((prevTabs) => {
          const tabToClose = prevTabs.find((tab) => tab.metadata?.filePath === filePath);
          if (tabToClose) {
            closeTab(tabToClose.id);
          }
          return prevTabs;
        });
        return;
      }

      // Debounce write operations: only update content if no new updates within 500ms
      // Debounce write operations: Only update content if no new updates within 500ms
      const existingTimer = debounceTimers.get(filePath);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Mark any tab pointing at this file as streaming on the first write event.
      // Cleared in the debounce-fire branch below once writes go quiet for 500ms.
      if (!existingTimer) {
        setTabs((prevTabs) =>
          prevTabs.map((tab) =>
            tab.metadata?.filePath === filePath && !tab.isStreaming ? { ...tab, isStreaming: true } : tab
          )
        );
      }

      const timer = setTimeout(() => {
        // Use functional update to access latest tabs state
        setTabs((prevTabs) => {
          // Find affected tabs
          const affectedTabs = prevTabs.filter((tab) => tab.metadata?.filePath === filePath);

          if (affectedTabs.length === 0) {
            return prevTabs;
          }

          return prevTabs.map((tab) => {
            if (tab.metadata?.filePath !== filePath) return tab;

            // Don't update if saving or user has edited; still clear streaming flag.
            if (savingFilesRef.current.has(filePath) || tab.isDirty) {
              return tab.isStreaming ? { ...tab, isStreaming: false } : tab;
            }

            return {
              ...tab,
              content,
              originalContent: content,
              isDirty: false,
              isStreaming: false,
            };
          });
        });

        // Clean up timer
        debounceTimers.delete(filePath);
      }, 500); // 500ms debounce delay

      debounceTimers.set(filePath, timer);
    });

    return () => {
      unsubscribe();
      // Clean up all debounce timers
      debounceTimers.forEach((timer) => clearTimeout(timer));
      debounceTimers.clear();
    };
  }, [closeTab]); // Only depend on closeTab, not tabs, to avoid re-subscribing

  // File mtime polling: detect external file changes (Claude Code CLI, Gemini, etc.) by comparing lastModified.
  // Only polls the active tab to minimize IPC overhead; checks other tabs once on tab switch.
  // Uses polling instead of fileWatch IPC events because buildEmitter's main→renderer event delivery
  // is unreliable after the first emission in Electron (only the first event reaches the renderer).
  const checkFileUpdate = useCallback(
    (tab: PreviewTab) => {
      const filePath = tab.metadata?.filePath;
      if (!filePath || tab.isDirty || savingFilesRef.current.has(filePath)) return;

      void ipcBridge.fs.getFileMetadata
        .invoke({ path: filePath })
        .then((metadata) => {
          if (!metadata) return;
          const prevMtime = fileMtimeRef.current.get(filePath);
          fileMtimeRef.current.set(filePath, metadata.lastModified);
          if (prevMtime === undefined || metadata.lastModified === prevMtime) return;

          const readPromise =
            tab.contentType === 'image'
              ? ipcBridge.fs.getImageBase64.invoke({ path: filePath })
              : ipcBridge.fs.readFile.invoke({ path: filePath });

          void readPromise
            .then((content) => {
              if (content == null) return;
              setTabs((latest) =>
                latest.map((t) => {
                  if (t.metadata?.filePath !== filePath) return t;
                  if (savingFilesRef.current.has(filePath) || t.isDirty) return t;
                  return { ...t, content, originalContent: content, isDirty: false };
                })
              );
            })
            .catch((error) => {
              console.error('[PreviewContext] Failed to read file after mtime change:', filePath, error);
            });
        })
        .catch((error) => {
          console.error('[PreviewContext] Failed to get file metadata:', filePath, error);
        });
    },
    [setTabs]
  );

  // Keep a ref to activeTab so the polling interval always sees the latest object
  // without re-running the effect on every tabs state change.
  const activeTabRef = useRef<PreviewTab | null>(null);
  activeTabRef.current = activeTab;

  const activeFilePath = activeTab?.metadata?.filePath;

  // Poll active tab every 1s
  useEffect(() => {
    if (!activeFilePath) return;

    const pollId = setInterval(() => {
      const current = activeTabRef.current;
      if (current) checkFileUpdate(current);
    }, 1000);

    // Check immediately on tab switch
    const current = activeTabRef.current;
    if (current) checkFileUpdate(current);

    return () => {
      clearInterval(pollId);
    };
  }, [activeFilePath, checkFileUpdate]);

  // Listen to preview.open event (for agent to open web preview)
  // Listen to both IPC and renderer emitter
  useEffect(() => {
    const handlePreviewOpen = (data: {
      content: string;
      contentType: PreviewContentType;
      metadata?: PreviewMetadata;
    }) => {
      if (data && data.content) {
        openPreview(data.content, data.contentType, data.metadata);
      }
    };

    // Listen to renderer emitter event
    emitter.on('preview.open', handlePreviewOpen);

    // Listen to IPC event (from main process, e.g., chrome-devtools MCP navigation)
    const unsubscribeIpc = ipcBridge.preview.open.on(handlePreviewOpen);

    return () => {
      emitter.off('preview.open', handlePreviewOpen);
      unsubscribeIpc();
    };
  }, [openPreview]);

  const previewContextValue = useMemo(() => {
    return {
      isOpen,
      tabs,
      activeTabId,
      activeTab,
      openPreview,
      closePreview,
      closeTab,
      switchTab: setActiveTabId,
      updateContent,
      saveContent,
      findPreviewTab,
      closePreviewByIdentity,
      addToSendBox,
      setSendBoxHandler,
      domSnippets,
      addDomSnippet,
      removeDomSnippet,
      clearDomSnippets,
    };
  }, [
    isOpen,
    tabs,
    activeTabId,
    activeTab,
    openPreview,
    closePreview,
    closeTab,
    setActiveTabId,
    updateContent,
    saveContent,
    findPreviewTab,
    closePreviewByIdentity,
    addToSendBox,
    setSendBoxHandler,
    domSnippets,
    addDomSnippet,
    removeDomSnippet,
    clearDomSnippets,
  ]);

  return <PreviewContext.Provider value={previewContextValue}>{children}</PreviewContext.Provider>;
};

export const usePreviewContext = () => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreviewContext must be used within PreviewProvider');
  }
  return context;
};
