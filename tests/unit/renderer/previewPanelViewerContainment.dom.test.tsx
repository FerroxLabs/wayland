/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Preview panel — a crashing file viewer is CONTAINED, not fatal (#253 / #254).
 *
 * The bug: clicking a file whose viewer throws at render (e.g. a syntax
 * highlighter dynamic-import "module" error on a packaged Windows build)
 * bubbled to the app-level route boundary, unmounting the whole conversation
 * route — which then broke the back button (it fell through to Settings).
 *
 * The fix wraps the preview content in its own `ErrorBoundary` with an inline
 * fallback. This test mounts PreviewPanel with a viewer that throws and asserts
 * (a) the inline "This file couldn't be opened" fallback renders, and (b) a
 * sibling component representing the surrounding conversation route stays
 * mounted (the crash did not propagate out of PreviewPanel).
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Stable i18n: return the defaultValue (so fallback copy is asserted by text).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && typeof opts.defaultValue === 'string' ? (opts.defaultValue as string) : key,
  }),
}));

// CSS side-effect import — no-op under jsdom.
vi.mock(
  '@/renderer/pages/conversation/Preview/components/PreviewPanel/preview.css',
  () => ({}),
  { virtual: true } as never
);

// The active tab is a `code` tab, so renderContent() mounts CodeViewer.
const activeTab = {
  id: 'tab-1',
  content: 'console.log(1)',
  contentType: 'code' as const,
  title: 'broken.js',
  metadata: { filePath: '/ws/broken.js', language: 'javascript' },
};
vi.mock('@/renderer/pages/conversation/Preview/context/PreviewContext', () => ({
  usePreviewContext: () => ({
    isOpen: true,
    tabs: [activeTab],
    activeTabId: activeTab.id,
    activeTab,
    closeTab: vi.fn(),
    switchTab: vi.fn(),
    closePreview: vi.fn(),
    updateContent: vi.fn(),
    saveContent: vi.fn().mockResolvedValue(true),
    addDomSnippet: vi.fn(),
  }),
}));

// The viewer under test: throw at render to simulate the packaged-Windows crash.
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/CodeViewer', () => ({
  default: () => {
    throw new Error('viewer module error');
  },
}));

// Remaining viewers/editors/renderers are never reached for a `code` tab, but
// PreviewPanel imports them eagerly — stub each to a trivial element. vi.mock
// is hoisted above all module-scope consts, so each factory is an inline arrow
// that builds its element from `react` directly (no closed-over locals).
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/DiffViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/ExcelViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/ImageViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/MarkdownViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/PDFViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/OfficeDocViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/PptViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/URLViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/editors/HTMLEditor', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/editors/MarkdownEditor', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor', () => ({
  default: () => null,
}));
vi.mock('@/renderer/pages/conversation/Preview/components/editors/TextEditor', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/renderers/HTMLRenderer', () => ({ default: () => null }));

// Sibling barrel: the tab bar / toolbar / menus. Stub to inert elements.
vi.mock('@/renderer/pages/conversation/Preview/components/PreviewPanel', () => ({
  PreviewTabs: () => null,
  PreviewToolbar: () => null,
  PreviewContextMenu: () => null,
  PreviewConfirmModals: () => null,
  PreviewHistoryDropdown: () => null,
}));

// Hooks barrel + standalone hooks PreviewPanel depends on.
vi.mock('@/renderer/pages/conversation/Preview/hooks', () => ({
  usePreviewHistory: () => ({
    historyVersions: [],
    historyLoading: false,
    snapshotSaving: false,
    historyError: null,
    historyTarget: null,
    refreshHistory: vi.fn(),
    handleSaveSnapshot: vi.fn(),
    handleSnapshotSelect: vi.fn(),
    messageApi: { error: vi.fn(), success: vi.fn() },
    messageContextHolder: null,
  }),
  usePreviewKeyboardShortcuts: vi.fn(),
  useScrollSync: () => ({ handleEditorScroll: vi.fn(), handlePreviewScroll: vi.fn() }),
  useTabOverflow: () => ({ tabsContainerRef: { current: null }, tabFadeState: {} }),
  useThemeDetection: () => 'light',
}));
vi.mock('@renderer/hooks/settings/useEditorSettings', () => ({
  useEditorSettings: () => ({ settings: { autoSaveDelay: 'off' } }),
}));
vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));
vi.mock('@/renderer/hooks/ui/useResizableSplit', () => ({
  useResizableSplit: () => ({ splitRatio: 50, createDragHandle: () => null }),
}));
vi.mock('@/common', () => ({ ipcBridge: { shell: { openFile: { invoke: vi.fn() } } } }));
vi.mock('@/renderer/utils/file/download', () => ({
  downloadFileFromPath: vi.fn(),
  downloadTextContent: vi.fn(),
}));
vi.mock('@/renderer/pages/conversation/Preview/context/PreviewToolbarExtrasContext', () => ({
  PreviewToolbarExtrasProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

import PreviewPanel from '@/renderer/pages/conversation/Preview/components/PreviewPanel/PreviewPanel';

describe('PreviewPanel — viewer crash containment (#253 / #254)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('contains a viewer crash in its inline fallback and keeps the surrounding route mounted', () => {
    // Silence the ErrorBoundary's expected console.error/log during the throw.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <div>
        <div data-testid='conversation-route'>chat</div>
        <PreviewPanel />
      </div>
    );

    // (a) The inline viewer-error fallback renders instead of crashing out.
    expect(screen.getByText("This file couldn't be opened")).toBeInTheDocument();

    // (b) The surrounding "route" survived — the crash was contained to the
    //     preview boundary and did not unmount the conversation.
    expect(screen.getByTestId('conversation-route')).toBeInTheDocument();
  });
});
