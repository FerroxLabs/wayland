/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { undo } from '@codemirror/commands';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  content: '<div></div>',
  theme: 'dark' as 'dark' | 'light',
  updateContent: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/renderer/pages/conversation/Preview/components/PreviewPanel/preview.css', () => ({}), {
  virtual: true,
} as never);

vi.mock('@/renderer/pages/conversation/Preview/context/PreviewContext', () => ({
  usePreviewContext: () => ({
    isOpen: true,
    tabs: [
      {
        id: 'html-tab',
        content: harness.content,
        contentType: 'html',
        title: 'page.html',
        metadata: { filePath: '/workspace/page.html', editable: true },
      },
    ],
    activeTabId: 'html-tab',
    activeTab: {
      id: 'html-tab',
      content: harness.content,
      contentType: 'html',
      title: 'page.html',
      metadata: { filePath: '/workspace/page.html', editable: true },
    },
    closeTab: vi.fn(),
    switchTab: vi.fn(),
    closePreview: vi.fn(),
    updateContent: harness.updateContent,
    saveContent: vi.fn().mockResolvedValue(true),
    addDomSnippet: vi.fn(),
  }),
}));

vi.mock('@/renderer/hooks/context/ThemeContext', () => ({
  useThemeContext: () => ({ theme: harness.theme }),
}));

vi.mock('@/renderer/pages/conversation/Preview/components/PreviewPanel', () => ({
  PreviewTabs: () => null,
  PreviewToolbar: ({ onViewModeChange }: { onViewModeChange: (mode: 'source') => void }) => (
    <button type='button' onClick={() => onViewModeChange('source')}>
      source
    </button>
  ),
  PreviewContextMenu: () => null,
  PreviewConfirmModals: () => null,
  PreviewHistoryDropdown: () => null,
}));

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
  useThemeDetection: () => harness.theme,
}));

vi.mock('@/renderer/pages/conversation/Preview/hooks/useScrollSyncHelpers', () => ({
  useCodeMirrorScroll: () => ({ setScrollPercent: vi.fn() }),
  useScrollSyncTarget: vi.fn(),
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
  PreviewToolbarExtrasProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/renderer/pages/conversation/Preview/components/viewers/CodeViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/DiffViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/ExcelViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/ImageViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/MarkdownViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/PDFViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/OfficeDocViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/PptViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/viewers/URLViewer', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/editors/MarkdownEditor', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor', () => ({
  default: () => null,
}));
vi.mock('@/renderer/pages/conversation/Preview/components/editors/TextEditor', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/Preview/components/renderers/HTMLRenderer', () => ({
  default: ({ content }: { content: string }) => <div data-testid='html-preview'>{content}</div>,
}));

import PreviewPanel from '@/renderer/pages/conversation/Preview/components/PreviewPanel/PreviewPanel';

const mountSourceEditor = async () => {
  const rendered = render(<PreviewPanel />);
  fireEvent.click(screen.getByRole('button', { name: 'source' }));

  const editorElement = await waitFor(() => {
    const element = rendered.container.querySelector<HTMLElement>('.cm-editor');
    expect(element).not.toBeNull();
    return element as HTMLElement;
  });
  const view = EditorView.findFromDOM(editorElement);
  expect(view).not.toBeNull();
  return { ...rendered, editorElement, view: view as EditorView };
};

describe('PreviewPanel HTML source editor', () => {
  beforeEach(() => {
    harness.content = '<div></div>';
    harness.theme = 'dark';
    harness.updateContent.mockReset();

    Range.prototype.getClientRects = vi.fn(() => [] as unknown as DOMRectList);
    Range.prototype.getBoundingClientRect = vi.fn(() => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));
  });

  it('mounts CodeMirror through PreviewPanel with wrapping, theme, and parent-state propagation', async () => {
    const { container, rerender, view } = await mountSourceEditor();

    expect(container.querySelector('.cm-content.cm-lineWrapping')).not.toBeNull();
    expect(container.querySelector('.cm-theme-dark')).not.toBeNull();

    act(() => {
      view.dispatch({
        changes: { from: view.state.doc.length, insert: '<span>updated</span>' },
        userEvent: 'input.type',
      });
    });

    await waitFor(() => {
      expect(harness.updateContent).toHaveBeenLastCalledWith('<div></div><span>updated</span>');
    });

    harness.theme = 'light';
    rerender(<PreviewPanel />);
    await waitFor(() => expect(container.querySelector('.cm-theme-light')).not.toBeNull());
  });

  it('formats a closing HTML tag as it is typed', async () => {
    harness.content = '<div>\n  <span>\n    value\n</span\n</div>';
    const { view } = await mountSourceEditor();
    const closingTagEnd = view.state.doc.toString().indexOf('</span') + '</span'.length;

    act(() => {
      view.dispatch({
        changes: { from: closingTagEnd, insert: '>' },
        selection: { anchor: closingTagEnd + 1 },
        userEvent: 'input.type',
      });
    });

    expect(view.state.doc.toString()).toBe('<div>\n  <span>\n    value\n  </span>\n</div>');
  });

  it('formats each pasted range without touching HTML between multiple cursors', async () => {
    harness.content = [
      '<div>',
      '  <section>',
      'FIRST',
      '  </section>',
      '  <main>',
      '          <p id="keep">untouched</p>',
      '  </main>',
      '  <footer>',
      'SECOND',
      '  </footer>',
      '</div>',
    ].join('\n');
    const { view } = await mountSourceEditor();
    const source = view.state.doc.toString();
    const first = source.indexOf('FIRST');
    const second = source.indexOf('SECOND');
    const original = view.state.doc.toString();

    act(() => {
      view.dispatch({
        selection: EditorSelection.create([
          EditorSelection.range(first, first + 'FIRST'.length),
          EditorSelection.range(second, second + 'SECOND'.length),
        ]),
      });
      view.dispatch({
        ...view.state.replaceSelection('<em>\nvalue\n</em>'),
        userEvent: 'input.paste',
      });
    });

    const expected = [
      '<div>',
      '  <section>',
      '    <em>',
      '      value',
      '    </em>',
      '  </section>',
      '  <main>',
      '          <p id="keep">untouched</p>',
      '  </main>',
      '  <footer>',
      '    <em>',
      '      value',
      '    </em>',
      '  </footer>',
      '</div>',
    ].join('\n');
    expect(view.state.doc.toString()).toBe(expected);
    expect(view.state.selection.ranges).toHaveLength(2);
    expect(view.state.selection.ranges.every((range) => range.empty)).toBe(true);
    expect(view.state.selection.ranges.map((range) => range.head)).toEqual([
      expected.indexOf('</em>') + '</em>'.length,
      expected.lastIndexOf('</em>') + '</em>'.length,
    ]);

    act(() => {
      expect(undo(view)).toBe(true);
    });
    expect(view.state.doc.toString()).toBe(original);
    expect(view.state.selection.ranges.map(({ from, to }) => ({ from, to }))).toEqual([
      { from: first, to: first + 'FIRST'.length },
      { from: second, to: second + 'SECOND'.length },
    ]);
  });

  it('does not reindent ordinary document changes', async () => {
    harness.content = '<div>\n          <p>keep</p>\n</div>';
    const { view } = await mountSourceEditor();
    const keep = view.state.doc.toString().indexOf('keep');

    act(() => {
      view.dispatch({ changes: { from: keep, to: keep + 'keep'.length, insert: 'changed' } });
    });

    expect(view.state.doc.toString()).toBe('<div>\n          <p>changed</p>\n</div>');
  });
});
