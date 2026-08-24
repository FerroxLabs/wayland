/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="@testing-library/jest-dom/vitest" />

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params?.defaultValue as string) ?? key,
  }),
}));

/**
 * THE HANDOFF LISTENER IS REGISTERED AT MODULE SCOPE, so the mock has to exist
 * before the page module is imported and the captured handler has to outlive
 * every `render`. `handoffHandlers` is therefore module-level in the test too:
 * `vi.mock` is hoisted above the imports, and the page's import-time
 * `preview.handoff.on(...)` pushes into it exactly once for the whole file.
 */
const { handoffHandlers, dockBackInvoke, copyTextMock } = vi.hoisted(() => ({
  handoffHandlers: [] as Array<(payload: unknown) => void>,
  dockBackInvoke: vi.fn(() => Promise.resolve({ ok: true })),
  copyTextMock: vi.fn(() => Promise.resolve(true)),
}));

const emitHandoff = (payload: unknown): void => {
  handoffHandlers.forEach((handler) => handler(payload));
};

vi.mock('@/common', () => ({
  ipcBridge: {
    preview: {
      handoff: {
        on: (handler: (payload: unknown) => void) => {
          handoffHandlers.push(handler);
          return () => {
            const at = handoffHandlers.indexOf(handler);
            if (at >= 0) handoffHandlers.splice(at, 1);
          };
        },
      },
      dockBack: { invoke: dockBackInvoke },
      // PreviewProvider subscribes to this; it must exist or the provider throws.
      open: { on: () => () => undefined },
    },
    fs: {
      writeFile: { invoke: vi.fn(() => Promise.resolve({ success: true })) },
      readFile: { invoke: vi.fn(() => Promise.resolve({ success: false })) },
      getFileMetadata: { invoke: vi.fn(() => Promise.resolve({ success: false })) },
    },
    fileStream: { contentUpdate: { on: () => () => undefined } },
  },
}));

vi.mock('@renderer/utils/ui/clipboard', () => ({ copyText: copyTextMock }));
vi.mock('@renderer/utils/platform', () => ({ isMacOS: () => false }));
vi.mock('@renderer/components/layout/WindowControls', () => ({
  default: () => <div data-testid='window-controls' />,
}));

/**
 * The real `PreviewPanel` is the whole viewer - iframes, sandboxing, syntax
 * highlighting, its own confirm modals. None of that is Lane C. What Lane C
 * owns is whether the tab ARRIVES in this window's provider, so ONLY the panel
 * is swapped - `importOriginal` keeps the real `PreviewProvider` and
 * `usePreviewContext`, which are the things under test - and the stand-in is a
 * probe that reads the context it was given and prints what it found.
 */
vi.mock('@/renderer/pages/conversation/Preview', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/renderer/pages/conversation/Preview')>();
  const Probe: React.FC = () => {
    const { tabs, activeTab } = actual.usePreviewContext();
    return (
      <div data-testid='preview-panel'>
        <span data-testid='panel-tab-count'>{tabs.length}</span>
        <span data-testid='panel-content'>{activeTab?.content ?? ''}</span>
        <span data-testid='panel-editable'>{String(activeTab?.metadata?.editable)}</span>
      </div>
    );
  };
  return { ...actual, PreviewPanel: Probe };
});

import PreviewPopoutPage, { __previewHandoffLatch } from '@renderer/pages/preview/PreviewPopoutPage';

const BRIEF = '<h1>Morning Brief</h1>';

const popoutPayload = (overrides: Record<string, unknown> = {}) => ({
  direction: 'popout',
  tab: {
    id: 'tab-1',
    content: BRIEF,
    contentType: 'html',
    title: 'morning-brief.html',
    metadata: { fileName: 'morning-brief.html', title: 'Morning Brief', editable: true },
  },
  ...overrides,
});

describe('PreviewPopoutPage', () => {
  beforeEach(() => {
    // `PreviewProvider` REHYDRATES TABS FROM localStorage. A tab opened by an
    // earlier case would otherwise be waiting in the next window's provider and
    // the "opened with nothing" cases would silently pass for the wrong reason.
    // (In the app this rehydration is bounded: it hard-codes `isOpen: false` and
    // `sanitizeTabsForPersistence` drops any tab over 80,000 chars - which is
    // exactly why the handoff, not storage, is the transport for the brief.)
    localStorage.clear();
    __previewHandoffLatch.reset();
    dockBackInvoke.mockClear();
    copyTextMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    __previewHandoffLatch.reset();
  });

  /**
   * THE SEEDING RACE - the failure this whole lane exists to prevent.
   *
   * The handoff is emitted from the pop-out window's `did-finish-load`, which
   * can land BEFORE React has flushed its first effects, and the platform
   * emitter has no replay: an event with no subscriber is dropped, not queued.
   * A listener created inside a `useEffect` would miss it and the window would
   * render empty - "the brief vanishes in the new window".
   *
   * So the handoff is emitted here BEFORE `render` is ever called.
   */
  it('renders a deliverable handed over before React mounted', async () => {
    emitHandoff(popoutPayload());
    expect(__previewHandoffLatch.peek()).not.toBeNull();

    render(<PreviewPopoutPage />);

    expect(await screen.findByTestId('preview-panel')).toBeInTheDocument();
    expect(screen.getByTestId('panel-content')).toHaveTextContent('Morning Brief');
    expect(screen.getByTestId('panel-tab-count')).toHaveTextContent('1');
  });

  /** A handoff that arrives while the window is already open still seeds it. */
  it('accepts a second deliverable after the window is already open', async () => {
    render(<PreviewPopoutPage />);
    expect(await screen.findByTestId('preview-popout-empty')).toBeInTheDocument();

    emitHandoff(popoutPayload());

    expect(await screen.findByTestId('preview-panel')).toBeInTheDocument();
    expect(screen.getByTestId('panel-content')).toHaveTextContent('Morning Brief');
  });

  /**
   * The SAME channel carries the tab home under `direction: 'dock-back'`. Acting
   * on that here would re-seed a window that is in the middle of going away.
   */
  it('ignores a dock-back handoff instead of re-seeding a closing window', async () => {
    emitHandoff(popoutPayload({ direction: 'dock-back' }));
    expect(__previewHandoffLatch.peek()).toBeNull();

    render(<PreviewPopoutPage />);
    expect(await screen.findByTestId('preview-popout-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-panel')).not.toBeInTheDocument();
  });

  /**
   * `/preview` is reachable through `app.popoutRoute` with no handoff at all, so
   * mounting with nothing is a normal state and must READ as one. A blank
   * rectangle would look like a deliverable that failed to arrive.
   */
  it('says what to do when it opens with no deliverable at all', async () => {
    render(<PreviewPopoutPage />);

    const empty = await screen.findByTestId('preview-popout-empty');
    expect(empty).toHaveTextContent('Open a deliverable in the chat, then pop the preview out.');
  });

  /**
   * DOCK BACK IS ANNOUNCED IN EXACTLY ONE PLACE. `onClosed` in the main process
   * is that place, which is what makes this button and the OS red button the
   * same code path. If this control ALSO emitted a handoff, reacting to both it
   * and `dockBack`'s return would dock the tab twice.
   */
  it('docks back by closing its own window and never announces the dock itself', async () => {
    emitHandoff(popoutPayload());
    render(<PreviewPopoutPage />);
    await screen.findByTestId('preview-panel');

    const before = handoffHandlers.length;
    await userEvent.click(screen.getByTestId('preview-popout-dock-back'));

    expect(dockBackInvoke).toHaveBeenCalledTimes(1);
    // No second announcement: the page emitted nothing of its own, so the
    // listener set is untouched and the only dock-back signal is the invoke.
    expect(handoffHandlers.length).toBe(before);
  });

  /** Pressing dock-back twice must not ask the main process to close twice. */
  it('does not fire a second dock-back while the first is in flight', async () => {
    emitHandoff(popoutPayload());
    render(<PreviewPopoutPage />);
    await screen.findByTestId('preview-panel');

    const button = screen.getByTestId('preview-popout-dock-back');
    await userEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    await userEvent.click(button);

    expect(dockBackInvoke).toHaveBeenCalledTimes(1);
  });

  /**
   * The source is READ-ONLY in this window even when the docked tab was
   * editable. `saveContent` goes through the fs bridge while the whole
   * `artifacts.` namespace is remote-denied, and whether that gate rejects a
   * SECOND window is unverified. An editor that might silently fail to save is
   * worse than no editor.
   */
  it('forces the deliverable read-only in the popped window', async () => {
    emitHandoff(popoutPayload());
    render(<PreviewPopoutPage />);

    await screen.findByTestId('preview-panel');
    expect(screen.getByTestId('panel-editable')).toHaveTextContent('false');
  });

  /** The window titles itself by the deliverable, not by a generic label. */
  it('names the window after the deliverable it is holding', async () => {
    emitHandoff(popoutPayload());
    render(<PreviewPopoutPage />);

    await screen.findByTestId('preview-panel');
    expect(screen.getByTestId('preview-popout-title')).toHaveTextContent('morning-brief.html');
  });

  /** A malformed frame must not take the window down. */
  it('survives a handoff frame with no tab on it', async () => {
    emitHandoff({ direction: 'popout' });
    emitHandoff(null);
    expect(__previewHandoffLatch.peek()).toBeNull();

    render(<PreviewPopoutPage />);
    expect(await screen.findByTestId('preview-popout-empty')).toBeInTheDocument();
  });
});
