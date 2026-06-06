/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { downloadFileFromPath, downloadTextContent } from '@/renderer/utils/file/download';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { PreviewToolbarExtrasProvider, type PreviewToolbarExtras } from '../../context/PreviewToolbarExtrasContext';
import { usePreviewContext } from '../../context/PreviewContext';
import { useResizableSplit } from '@/renderer/hooks/ui/useResizableSplit';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorSettings } from '@renderer/hooks/settings/useEditorSettings';
import CodePreview from '../viewers/CodeViewer';
import DiffPreview from '../viewers/DiffViewer';
import ExcelPreview from '../viewers/ExcelViewer';
import HTMLEditor from '../editors/HTMLEditor';
import HTMLRenderer from '../renderers/HTMLRenderer';
import ImagePreview from '../viewers/ImageViewer';
import MarkdownEditor from '../editors/MarkdownEditor';
import TipTapMarkdownEditor from '../editors/TipTapMarkdownEditor';
import MarkdownPreview from '../viewers/MarkdownViewer';
import PDFPreview from '../viewers/PDFViewer';
import OfficeDocPreview from '../viewers/OfficeDocViewer';
import PptViewer from '../viewers/PptViewer';
import TextEditor from '../editors/TextEditor';
import URLViewer from '../viewers/URLViewer';
import {
  PreviewTabs,
  PreviewToolbar,
  PreviewContextMenu,
  PreviewConfirmModals,
  PreviewHistoryDropdown,
  type ContextMenuState,
  type CloseTabConfirmState,
  type PreviewTab,
} from '.';
import { DEFAULT_SPLIT_RATIO, FILE_TYPES_WITH_BUILTIN_OPEN, MAX_SPLIT_WIDTH, MIN_SPLIT_WIDTH } from '../../constants';
import {
  usePreviewHistory,
  usePreviewKeyboardShortcuts,
  useScrollSync,
  useTabOverflow,
  useThemeDetection,
} from '../../hooks';
import { useTranslation } from 'react-i18next';
import './preview.css';

/**
 * True when filePath ends in a Markdown extension (.md, .markdown, .mdx).
 * Used to gate the WYSIWYG Editor tab (Markdown-only).
 */
const isMdFile = (filePath?: string): boolean => !!filePath && /\.(md|markdown|mdx)$/i.test(filePath);

/**
 * Main preview panel component
 *
 * Supports multiple tabs, each tab can display different types of content
 */
const PreviewPanel: React.FC = () => {
  const { t } = useTranslation();
  const { settings: editorSettings } = useEditorSettings();
  const {
    isOpen,
    tabs,
    activeTabId,
    activeTab,
    closeTab,
    switchTab,
    closePreview,
    updateContent,
    saveContent,
    addDomSnippet,
  } = usePreviewContext();
  const layout = useLayoutContext();

  // View states
  const [viewMode, setViewMode] = useState<'source' | 'preview' | 'editor'>('preview');
  // Track which tab IDs we have already picked a default landing mode for, so
  // re-renders (e.g. streaming content updates) don't fight the user's manual toggle.
  const landedTabsRef = useRef<Set<string>>(new Set());
  const [isSplitScreenEnabled, setIsSplitScreenEnabled] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [inspectMode, setInspectMode] = useState(false);
  const [toolbarExtras, setToolbarExtras] = useState<PreviewToolbarExtras | null>(null);

  // Confirmation dialog states
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [closeTabConfirm, setCloseTabConfirm] = useState<CloseTabConfirmState>({ show: false, tabId: null });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ show: false, x: 0, y: 0, tabId: null });

  // Container refs
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const currentTheme = useThemeDetection();
  const { tabsContainerRef, tabFadeState } = useTabOverflow([tabs, activeTabId]);
  const { handleEditorScroll, handlePreviewScroll } = useScrollSync({
    enabled: isSplitScreenEnabled,
    editorContainerRef,
    previewContainerRef,
  });

  // eslint-disable-next-line max-len
  const {
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
  } = usePreviewHistory({
    activeTab,
    updateContent,
  });

  usePreviewKeyboardShortcuts({
    isDirty: activeTab?.isDirty,
    onSave: () => void saveContent(),
  });

  // Auto-save on idle: after the last edit, wait AUTO_SAVE_DELAY_MS and
  // flush to disk if the tab is still dirty. Each new edit resets the
  // timer; explicit Cmd+S still works (saveContent itself clears isDirty,
  // so the timer will see isDirty=false and bail). Only fires for editable
  // preview tabs, not while an agent is actively streaming content into
  // the same file. Delay is read from editor settings (null = off).
  const AUTO_SAVE_DELAY_MS = editorSettings.autoSaveDelay === 'off' ? null : editorSettings.autoSaveDelay;
  const dirty = activeTab?.isDirty ?? false;
  const streaming = activeTab?.isStreaming ?? false;
  const tabIdForSave = activeTab?.id;
  const contentForSave = activeTab?.content;
  useEffect(() => {
    if (!tabIdForSave) return;
    if (!dirty) return;
    if (streaming) return;
    if (AUTO_SAVE_DELAY_MS === null) return;
    const handle = setTimeout(() => {
      void saveContent(tabIdForSave);
    }, AUTO_SAVE_DELAY_MS);
    return () => clearTimeout(handle);
  }, [tabIdForSave, contentForSave, dirty, streaming, saveContent, AUTO_SAVE_DELAY_MS]);

  // Default-landing mode for newly opened tabs.
  // - MD file + not streaming → land in 'editor' (WYSIWYG)
  // - MD file + streaming → land in 'preview' (Streamdown handles partial MD)
  // - Non-MD: preserve historical default ('preview'); only runs once per tab id.
  useEffect(() => {
    if (!activeTabId || !activeTab) return;
    if (landedTabsRef.current.has(activeTabId)) return;
    landedTabsRef.current.add(activeTabId);

    if (isMdFile(activeTab.metadata?.filePath)) {
      setViewMode(activeTab.isStreaming ? 'preview' : 'editor');
    } else {
      setViewMode('preview');
    }
  }, [activeTabId, activeTab]);

  // Drop landing-tracking for tabs that no longer exist (avoids stale ids accumulating).
  useEffect(() => {
    const liveIds = new Set(tabs.map((t) => t.id));
    landedTabsRef.current.forEach((id) => {
      if (!liveIds.has(id)) landedTabsRef.current.delete(id);
    });
  }, [tabs]);

  const setToolbarExtrasCallback = useCallback((extras: PreviewToolbarExtras | null) => {
    setToolbarExtras(extras);
  }, []);

  // Handle HTML inspect mode element selection
  const handleElementSelected = useCallback(
    (element: { html: string; tag: string }) => {
      addDomSnippet(element.tag, element.html);
    },
    [addDomSnippet]
  );

  const toolbarExtrasContextValue = useMemo(
    () => ({
      setExtras: setToolbarExtrasCallback,
    }),
    [setToolbarExtrasCallback]
  );

  // Inner split: Split ratio between editor and preview (default 50/50)
  const { splitRatio, createDragHandle } = useResizableSplit({
    defaultWidth: DEFAULT_SPLIT_RATIO,
    minWidth: MIN_SPLIT_WIDTH,
    maxWidth: MAX_SPLIT_WIDTH,
    storageKey: 'preview-panel-split-ratio',
  });

  // Wrap updateContent with useCallback for stable reference
  const handleContentChange = useCallback(
    (newContent: string) => {
      // Strict type checking to prevent Event object from being passed incorrectly
      if (typeof newContent !== 'string') {
        return;
      }
      try {
        updateContent(newContent);
      } catch {
        // Silently ignore errors
      }
    },
    [updateContent]
  );

  // Handle exit edit mode
  const handleExitEdit = useCallback(() => {
    // If there are unsaved changes, show confirmation dialog
    if (activeTab?.isDirty) {
      setShowExitConfirm(true);
    } else {
      // No unsaved changes, exit directly
      setIsEditMode(false);
    }
  }, [activeTab?.isDirty]);

  // Confirm exit edit
  const handleConfirmExit = useCallback(() => {
    setIsEditMode(false);
    setShowExitConfirm(false);
  }, []);

  // Cancel exit edit
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Handle close tab
  const handleCloseTab = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      // If tab has unsaved changes, show confirmation dialog
      if (tab?.isDirty) {
        setCloseTabConfirm({ show: true, tabId });
      } else {
        // No unsaved changes, close directly
        closeTab(tabId);
      }
    },
    [tabs, closeTab]
  );

  // Save and close tab
  const handleSaveAndCloseTab = useCallback(async () => {
    if (!closeTabConfirm.tabId) return;

    try {
      const success = await saveContent(closeTabConfirm.tabId);
      if (!success) {
        throw new Error(t('common.saveFailed'));
      }
      closeTab(closeTabConfirm.tabId);
      setCloseTabConfirm({ show: false, tabId: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('common.unknownError');
      messageApi.error(`${t('common.saveFailed')}: ${errorMsg}`);
    }
  }, [closeTabConfirm.tabId, saveContent, closeTab, messageApi, t]);

  // Close tab without saving
  const handleCloseWithoutSave = useCallback(() => {
    if (!closeTabConfirm.tabId) return;
    closeTab(closeTabConfirm.tabId);
    setCloseTabConfirm({ show: false, tabId: null });
  }, [closeTabConfirm.tabId, closeTab]);

  // Cancel close tab
  const handleCancelCloseTab = useCallback(() => {
    setCloseTabConfirm({ show: false, tabId: null });
  }, []);

  // Handle tab context menu
  const handleTabContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  }, []);

  // Close tabs to the left
  const handleCloseLeft = useCallback(
    (tabId: string) => {
      const currentIndex = tabs.findIndex((t) => t.id === tabId);
      if (currentIndex <= 0) return;

      const tabsToClose = tabs.slice(0, currentIndex);
      tabsToClose.forEach((tab) => closeTab(tab.id));
      setContextMenu({ show: false, x: 0, y: 0, tabId: null });
    },
    [tabs, closeTab]
  );

  // Close tabs to the right
  const handleCloseRight = useCallback(
    (tabId: string) => {
      const currentIndex = tabs.findIndex((t) => t.id === tabId);
      if (currentIndex < 0 || currentIndex >= tabs.length - 1) return;

      const tabsToClose = tabs.slice(currentIndex + 1);
      tabsToClose.forEach((tab) => closeTab(tab.id));
      setContextMenu({ show: false, x: 0, y: 0, tabId: null });
    },
    [tabs, closeTab]
  );

  // Close other tabs
  const handleCloseOthers = useCallback(
    (tabId: string) => {
      const tabsToClose = tabs.filter((t) => t.id !== tabId);
      tabsToClose.forEach((tab) => closeTab(tab.id));
      setContextMenu({ show: false, x: 0, y: 0, tabId: null });
    },
    [tabs, closeTab]
  );

  // Close all tabs
  const handleCloseAll = useCallback(() => {
    tabs.forEach((tab) => closeTab(tab.id));
    setContextMenu({ show: false, x: 0, y: 0, tabId: null });
  }, [tabs, closeTab]);

  // Don't render if preview panel is not open
  if (!isOpen || !activeTab) return null;

  const { content, contentType, metadata } = activeTab;
  const isMarkdown = contentType === 'markdown';
  const isHTML = contentType === 'html';
  const isEditable = metadata?.editable !== false; // Default editable

  // Check if file type already has built-in open button
  // (Word, PPT, PDF, Excel components provide their own)
  const hasBuiltInOpenButton = (FILE_TYPES_WITH_BUILTIN_OPEN as readonly string[]).includes(contentType);

  // Show "Open in System" button for all files with filePath (unified in toolbar)
  const showOpenInSystemButton = Boolean(metadata?.filePath);

  // Download file to local system
  const handleDownload = useCallback(async () => {
    try {
      const rawFileName = metadata?.fileName || `${contentType}-${Date.now()}`;

      if (metadata?.filePath) {
        // All files with a disk path (binary, image, zip, etc.) - unified path
        await downloadFileFromPath(metadata.filePath, rawFileName);
        return;
      }

      if (contentType === 'image') {
        // Pure base64 image (no file path on disk)
        if (!content) {
          messageApi.error(t('messages.downloadFailed', { defaultValue: 'Failed to download' }));
          return;
        }
        const blob = await fetch(content).then((res) => res.blob());
        const nameExt = metadata?.fileName?.split('.').pop();
        const mimeExt = blob.type?.includes('/') ? blob.type.split('/').pop() : undefined;
        const ext = nameExt || mimeExt || 'png';
        const normalizedExt = ext.toLowerCase();
        const hasSameExt = rawFileName.toLowerCase().endsWith(`.${normalizedExt}`);
        const fileName = hasSameExt ? rawFileName : `${rawFileName}.${ext}`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Text / code content (no file path, no binary)
      const nameExt = metadata?.fileName?.split('.').pop();
      let mimeType = 'text/plain;charset=utf-8';
      let ext = 'txt';
      if (contentType === 'markdown') {
        mimeType = 'text/markdown;charset=utf-8';
        ext = 'md';
      } else if (contentType === 'html') {
        mimeType = 'text/html;charset=utf-8';
        ext = 'html';
      } else if (contentType === 'diff') {
        ext = 'diff';
      } else if (contentType === 'code') {
        // Code files: set extension based on language
        const lang = metadata?.language;
        if (lang === 'javascript' || lang === 'js') ext = 'js';
        else if (lang === 'typescript' || lang === 'ts') ext = 'ts';
        else if (lang === 'python' || lang === 'py') ext = 'py';
        else if (lang === 'java') ext = 'java';
        else if (lang === 'cpp' || lang === 'c++') ext = 'cpp';
        else if (lang === 'c') ext = 'c';
        else if (lang === 'html') ext = 'html';
        else if (lang === 'css') ext = 'css';
        else if (lang === 'json') ext = 'json';
      }
      if (nameExt) ext = nameExt;
      const normalizedExt = ext.toLowerCase();
      const hasSameExt = rawFileName.toLowerCase().endsWith(`.${normalizedExt}`);
      const fileName = hasSameExt ? rawFileName : `${rawFileName}.${ext}`;
      downloadTextContent(content, fileName, mimeType);
    } catch (error) {
      console.error('[PreviewPanel] Failed to download file:', error);
      messageApi.error(t('messages.downloadFailed', { defaultValue: 'Failed to download' }));
    }
  }, [content, contentType, metadata?.fileName, metadata?.filePath, metadata?.language, messageApi, t]);

  // Open file in system default application
  const handleOpenInSystem = useCallback(async () => {
    if (!metadata?.filePath) {
      try {
        messageApi.error(t('preview.openInSystemFailed'));
      } catch {
        // Context holder may be unmounted
      }
      return;
    }

    try {
      // Open file with system default application
      await ipcBridge.shell.openFile.invoke(metadata.filePath);
      try {
        messageApi.success(t('preview.openInSystemSuccess'));
      } catch {
        // Context holder may be unmounted after async operation
      }
    } catch (err) {
      try {
        messageApi.error(t('preview.openInSystemFailed'));
      } catch {
        // Context holder may be unmounted after async operation
      }
    }
  }, [metadata?.filePath, messageApi, t]);

  // Render history dropdown
  const renderHistoryDropdown = () => {
    // eslint-disable-next-line max-len
    return (
      <PreviewHistoryDropdown
        historyVersions={historyVersions}
        historyLoading={historyLoading}
        historyError={historyError}
        historyTarget={historyTarget}
        currentTheme={currentTheme}
        onSnapshotSelect={handleSnapshotSelect}
      />
    );
  };

  // Render preview content
  const renderContent = () => {
    // Markdown mode
    if (isMarkdown) {
      // WYSIWYG TipTap editor (MD files only, single pane)
      if (viewMode === 'editor' && isMdFile(metadata?.filePath)) {
        return (
          <TipTapMarkdownEditor
            value={content}
            onChange={updateContent}
            isStreaming={activeTab.isStreaming}
            containerRef={editorContainerRef}
            onScroll={handleEditorScroll}
          />
        );
      }

      // Split-screen mode: Editor + Preview
      if (isSplitScreenEnabled) {
        // Mobile: Full-screen preview, hide editor
        if (layout?.isMobile) {
          return (
            <div className='flex-1 overflow-hidden'>
              <MarkdownPreview content={content} hideToolbar filePath={metadata?.filePath} />
            </div>
          );
        }

        // Desktop: Split layout
        return (
          <div className='flex flex-1 relative overflow-hidden'>
            {/* Left: Editor */}
            <div className='flex flex-col relative' style={{ width: `${splitRatio}%` }}>
              <div className='h-40px flex items-center px-12px bg-bg-2'>
                <span className='text-12px text-t-secondary'>{t('preview.editor')}</span>
              </div>
              <div className='flex-1 overflow-hidden'>
                <MarkdownEditor
                  key={activeTabId ?? undefined}
                  value={content}
                  onChange={updateContent}
                  containerRef={editorContainerRef}
                  onScroll={handleEditorScroll}
                />
              </div>
              {/* Drag handle */}
              {createDragHandle({ className: 'absolute right-0 top-0 bottom-0' })}
            </div>

            {/* Right: Preview */}
            <div className='flex flex-col' style={{ width: `${100 - splitRatio}%`, minWidth: 0 }}>
              <div className='h-40px flex items-center px-12px bg-bg-2'>
                <span className='text-12px text-t-secondary'>{t('preview.preview')}</span>
              </div>
              <div className='flex flex-col flex-1 overflow-hidden'>
                <MarkdownPreview
                  content={content}
                  hideToolbar
                  containerRef={previewContainerRef}
                  onScroll={handlePreviewScroll}
                  filePath={metadata?.filePath}
                />
              </div>
            </div>
          </div>
        );
      }

      // Non-split mode: Single panel (source or preview)
      // 'editor' is handled earlier; narrow for the viewer's prop type.
      const legacyMode: 'source' | 'preview' = viewMode === 'source' ? 'source' : 'preview';
      return (
        <MarkdownPreview
          content={content}
          hideToolbar
          viewMode={legacyMode}
          onViewModeChange={setViewMode}
          onContentChange={updateContent}
          filePath={metadata?.filePath}
        />
      );
    }

    // HTML mode
    if (isHTML) {
      // Split-screen mode: Editor + Preview
      if (isSplitScreenEnabled) {
        // Mobile: Full-screen preview, hide editor
        if (layout?.isMobile) {
          return (
            <div className='flex-1 overflow-hidden'>
              <HTMLRenderer
                content={content}
                filePath={metadata?.filePath}
                copySuccessMessage={t('preview.html.copySuccess')}
                inspectMode={inspectMode}
                onElementSelected={handleElementSelected}
              />
            </div>
          );
        }

        // Desktop: Split layout
        return (
          <div className='flex flex-1 relative overflow-hidden'>
            {/* Left: Editor */}
            <div className='flex flex-col relative' style={{ width: `${splitRatio}%` }}>
              <div className='h-40px flex items-center px-12px bg-bg-2'>
                <span className='text-12px text-t-secondary'>{t('preview.editor')}</span>
              </div>
              <div className='flex-1 overflow-hidden'>
                <HTMLEditor
                  key={activeTabId ?? undefined}
                  value={content}
                  onChange={updateContent}
                  containerRef={editorContainerRef}
                  onScroll={handleEditorScroll}
                  filePath={metadata?.filePath}
                />
              </div>
              {/* Drag handle */}
              {createDragHandle({ className: 'absolute right-0 top-0 bottom-0' })}
            </div>

            {/* Right: Preview */}
            <div className='flex flex-col' style={{ width: `${100 - splitRatio}%`, minWidth: 0 }}>
              <div className='h-40px flex items-center justify-between px-12px bg-bg-2'>
                <span className='text-12px text-t-secondary'>{t('preview.preview')}</span>
              </div>
              <div className='flex flex-col flex-1 overflow-hidden'>
                {/* prettier-ignore */}
                {/* eslint-disable-next-line max-len */}
                <HTMLRenderer
                  content={content}
                  filePath={metadata?.filePath}
                  containerRef={previewContainerRef}
                  onScroll={handlePreviewScroll}
                  inspectMode={inspectMode}
                  copySuccessMessage={t('preview.html.copySuccess')}
                  onElementSelected={handleElementSelected}
                />
              </div>
            </div>
          </div>
        );
      }

      // Non-split mode: Single panel (source or preview)
      if (viewMode === 'source') {
        return (
          <div className='flex-1 overflow-hidden'>
            <HTMLEditor
              key={activeTabId ?? undefined}
              value={content}
              onChange={handleContentChange}
              filePath={metadata?.filePath}
            />
          </div>
        );
      } else {
        // Preview mode
        return (
          <div className='flex-1 overflow-hidden'>
            <HTMLRenderer
              content={content}
              filePath={metadata?.filePath}
              inspectMode={inspectMode}
              copySuccessMessage={t('preview.html.copySuccess')}
              onElementSelected={handleElementSelected}
            />
          </div>
        );
      }
    }

    // Other types: Full-screen preview
    if (contentType === 'diff') {
      // Non-MD viewer - Editor mode never reaches here; narrow defensively.
      const legacyMode: 'source' | 'preview' = viewMode === 'source' ? 'source' : 'preview';
      return (
        <DiffPreview
          content={content}
          metadata={metadata}
          hideToolbar
          viewMode={legacyMode}
          onViewModeChange={setViewMode}
        />
      );
    } else if (contentType === 'code') {
      // Split-screen mode: Editor + Preview
      if (isSplitScreenEnabled && isEditMode && isEditable) {
        return (
          <div className='flex flex-1 relative overflow-hidden'>
            {/* Left: Editor */}
            <div className='flex flex-col relative' style={{ width: `${splitRatio}%` }}>
              <div className='h-40px flex items-center px-12px bg-bg-2'>
                <span className='text-12px text-t-secondary'>{t('preview.editor')}</span>
              </div>
              <div className='flex-1 overflow-hidden'>
                <TextEditor key={activeTabId ?? undefined} value={content} onChange={updateContent} />
              </div>
              {/* Drag handle */}
              {createDragHandle({ className: 'absolute right-0 top-0 bottom-0' })}
            </div>

            {/* Right: Preview */}
            <div className='flex flex-col' style={{ width: `${100 - splitRatio}%`, minWidth: 0 }}>
              <div className='h-40px flex items-center px-12px bg-bg-2'>
                <span className='text-12px text-t-secondary'>{t('preview.preview')}</span>
              </div>
              <div className='flex flex-col flex-1 overflow-hidden'>
                <CodePreview content={content} language={metadata?.language} hideToolbar />
              </div>
            </div>
          </div>
        );
      }

      // Non-split mode: If in edit mode and editable, show text editor
      if (isEditMode && isEditable) {
        return (
          <div className='flex-1 overflow-hidden'>
            <TextEditor key={activeTabId ?? undefined} value={content} onChange={handleContentChange} />
          </div>
        );
      }
      // Otherwise show code preview
      // Non-MD viewer - Editor mode never reaches here; narrow defensively.
      const legacyMode: 'source' | 'preview' = viewMode === 'source' ? 'source' : 'preview';
      return (
        <CodePreview
          content={content}
          language={metadata?.language}
          hideToolbar
          viewMode={legacyMode}
          onViewModeChange={setViewMode}
        />
      );
    } else if (contentType === 'pdf') {
      return <PDFPreview filePath={metadata?.filePath} content={content} />;
    } else if (contentType === 'ppt') {
      return <PptViewer filePath={metadata?.filePath} content={content} />;
    } else if (contentType === 'word') {
      return <OfficeDocPreview filePath={metadata?.filePath} content={content} />;
    } else if (contentType === 'excel') {
      return <ExcelPreview filePath={metadata?.filePath} content={content} />;
    } else if (contentType === 'image') {
      return (
        <ImagePreview
          filePath={metadata?.filePath}
          content={content}
          fileName={metadata?.fileName || metadata?.title}
        />
      );
    } else if (contentType === 'url') {
      // URL preview mode
      return <URLViewer url={content} title={metadata?.title} />;
    }

    return null;
  };

  // Convert tabs to PreviewTab type
  const previewTabs: PreviewTab[] = tabs.map((tab) => ({
    id: tab.id,
    title: tab.title,
    isDirty: tab.isDirty,
  }));

  return (
    <PreviewToolbarExtrasProvider value={toolbarExtrasContextValue}>
      <div className='h-full flex flex-col bg-1 rounded-[16px]'>
        {messageContextHolder}

        {/* Confirmation modals */}
        {/* eslint-disable-next-line max-len */}
        <PreviewConfirmModals
          showExitConfirm={showExitConfirm}
          closeTabConfirm={closeTabConfirm}
          onConfirmExit={handleConfirmExit}
          onCancelExit={handleCancelExit}
          onSaveAndCloseTab={handleSaveAndCloseTab}
          onCloseWithoutSave={handleCloseWithoutSave}
          onCancelCloseTab={handleCancelCloseTab}
        />

        {/* Tab bar */}
        {/* eslint-disable-next-line max-len */}
        <PreviewTabs
          tabs={previewTabs}
          activeTabId={activeTabId}
          tabFadeState={tabFadeState}
          tabsContainerRef={tabsContainerRef}
          onSwitchTab={switchTab}
          onCloseTab={handleCloseTab}
          onContextMenu={handleTabContextMenu}
          onClosePanel={closePreview}
        />

        {/* Toolbar (hidden for URL type as it doesn't need download/edit features) */}
        {contentType !== 'url' && (
          <PreviewToolbar
            contentType={contentType}
            isMarkdown={isMarkdown}
            isHTML={isHTML}
            isEditable={isEditable}
            isEditMode={isEditMode}
            viewMode={viewMode}
            isMdFile={isMdFile(metadata?.filePath)}
            isSplitScreenEnabled={isSplitScreenEnabled}
            fileName={metadata?.fileName || activeTab.title}
            showOpenInSystemButton={showOpenInSystemButton}
            historyTarget={historyTarget}
            snapshotSaving={snapshotSaving}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              setIsSplitScreenEnabled(false); // Disable split when switching view mode
            }}
            onSplitScreenToggle={() => setIsSplitScreenEnabled(!isSplitScreenEnabled)}
            onEditClick={() => {
              setIsEditMode(true);
              // Auto enable split screen for Code/TXT when entering edit mode
              if (contentType === 'code') {
                setIsSplitScreenEnabled(true);
              }
            }}
            onExitEdit={handleExitEdit}
            onSaveSnapshot={handleSaveSnapshot}
            onRefreshHistory={refreshHistory}
            renderHistoryDropdown={renderHistoryDropdown}
            onOpenInSystem={handleOpenInSystem}
            onDownload={handleDownload}
            onClose={closePreview}
            inspectMode={inspectMode}
            onInspectModeToggle={() => setInspectMode(!inspectMode)}
            leftExtra={toolbarExtras?.left}
            rightExtra={toolbarExtras?.right}
          />
        )}

        {/* Preview content */}
        {renderContent()}

        {/* Tab context menu */}
        {/* eslint-disable-next-line max-len */}
        <PreviewContextMenu
          contextMenu={contextMenu}
          tabs={previewTabs}
          currentTheme={currentTheme}
          onClose={() => setContextMenu({ show: false, x: 0, y: 0, tabId: null })}
          onCloseLeft={handleCloseLeft}
          onCloseRight={handleCloseRight}
          onCloseOthers={handleCloseOthers}
          onCloseAll={handleCloseAll}
        />
      </div>
    </PreviewToolbarExtrasProvider>
  );
};

export default PreviewPanel;
