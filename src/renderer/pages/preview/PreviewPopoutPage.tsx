/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The popped-out preview window (SPEC-PREVIEW-PANE §4 Lane C).
 *
 * This page is a WHOLE WINDOW, not a panel. It is routed bare - outside
 * `ProtectedLayout` - so nothing app-shell-shaped follows the deliverable into
 * its own window: no Sider (whose route-change `closePreview` would tear the
 * panel down), no onboarding or shell-choice overlays, and no second auth
 * round-trip that could bounce a preview window to `/login`. The cost of being
 * bare is that this page owns its own window chrome, which is what the header
 * below is: the pop-out window is `titleBarStyle: 'hidden'` on macOS and
 * `frame: false` everywhere else, so without a drag region here the window
 * could not be moved and without the traffic-light inset the controls would sit
 * on top of the title.
 *
 * STORAGE IS NOT THE TRANSPORT. `PreviewProvider` is per-renderer React state
 * and a second window gets a fresh one; its localStorage rehydration hard-codes
 * `isOpen: false` and `sanitizeTabsForPersistence` drops any tab over 80,000
 * chars, while the deliverable this feature exists for is a 77 KB HTML brief
 * that is still growing. The tab therefore arrives ONLY on `preview.handoff`.
 */

import { ipcBridge } from '@/common';
import type { PreviewPopoutTab } from '@/common/adapter/ipcBridge';
// The latch lives in its own EAGER module: this page is lazy, and its chunk
// resolves after `did-finish-load` - the exact moment the handoff is emitted.
import { onPreviewSeed, peekLatchedTab } from './previewHandoffLatch';
import WindowControls from '@renderer/components/layout/WindowControls';
import { PreviewPanel, PreviewProvider, usePreviewContext } from '@/renderer/pages/conversation/Preview';
import { copyText } from '@renderer/utils/ui/clipboard';
import { isMacOS } from '@renderer/utils/platform';
import classNames from 'classnames';
import { PanelRightClose } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@renderer/components/layout/Titlebar/titlebar.css';

const PreviewPopoutShell: React.FC = () => {
  const { t } = useTranslation();
  const { tabs, activeTab, openPreview, setSendBoxHandler } = usePreviewContext();
  const [docking, setDocking] = useState(false);
  /**
   * A pop-out shares its ORIGIN, and therefore localStorage, with the main
   * window, so `PreviewProvider` rehydrates whatever tab was last persisted
   * there. That tab was never handed to this window and its `isOpen` is forced
   * `false` on rehydration, so rendering the panel for it draws an empty box
   * under a correct-looking title - which is exactly how the blank pop-out
   * presented live. Only a tab this window was actually HANDED counts.
   */
  const [seeded, setSeeded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const mac = useMemo(() => isMacOS(), []);

  // Seed from the latch on mount, then stay subscribed for later handoffs.
  // `openPreview` is stable (its own deps are stable callbacks), and it matches
  // an already-open tab by filePath before creating one, so a repeat handoff
  // for the same deliverable updates that tab instead of stacking duplicates.
  useEffect(() => {
    const seed = (tab: PreviewPopoutTab) => {
      setSeeded(true);
      openPreview(tab.content, tab.contentType, {
        ...tab.metadata,
        title: tab.metadata?.title ?? tab.title,
        // SOURCE IS READ-ONLY IN THIS WINDOW (spec §3). `saveContent` goes
        // through the fs bridge while the whole `artifacts.` namespace is
        // remote-denied, and whether that gate rejects a SECOND window is
        // unverified. An editor that might silently fail to save is worse than
        // no editor, so withhold it until someone proves the write lands.
        // `metadata.editable !== false` is the panel's own gate for exactly this.
        editable: false,
      });
    };
    const latched = peekLatchedTab();
    if (latched) seed(latched);
    return onPreviewSeed(seed);
  }, [openPreview]);

  /**
   * "Send selection to chat" is PROXIED, not hidden.
   *
   * `SelectionToolbar` renders whenever text is selected in a Markdown preview
   * and calls `addToSendBox`, which is a no-op unless a composer registered a
   * handler - and this window has no composer. Hiding it would mean editing
   * `SelectionToolbar.tsx` / `MarkdownViewer.tsx`, which are shared with the
   * DOCKED window where the control must stay live, and there is no bridge key
   * that carries text to another window's composer, so a true cross-window
   * proxy is not buildable against the current contract. Registering a handler
   * here makes the control do something real - the selection lands on the
   * clipboard - and the notice says where the chat actually is, so the user is
   * one paste away instead of pressing a button that does nothing.
   */
  useEffect(() => {
    setSendBoxHandler((text: string) => {
      void copyText(text)
        .then(() => {
          setNotice(
            t('preview.popoutSelectionCopied', {
              defaultValue: 'Copied. The chat is in the main window — paste it there.',
            })
          );
        })
        .catch(() => {
          setNotice(t('preview.popoutSelectionCopyFailed', { defaultValue: 'Could not copy the selection.' }));
        });
    });
    return () => setSendBoxHandler(null);
  }, [setSendBoxHandler, t]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  /**
   * Dock back. It does NOT emit a handoff: `onClosed` in the main process is
   * the SINGLE place a dock-back is announced, which is what makes this control
   * and the OS red button literally the same code path. Emitting here as well
   * would dock the tab twice.
   */
  const handleDockBack = useCallback(() => {
    setDocking(true);
    void ipcBridge.preview.dockBack.invoke().catch((error) => {
      console.warn('[PreviewPopout] Dock back failed:', error);
      setDocking(false);
    });
  }, []);

  const fileName = activeTab?.metadata?.fileName || activeTab?.title;
  const heading = fileName ? `${t('preview.preview')} · ${fileName}` : t('preview.preview');

  return (
    <div className='flex flex-col size-full min-h-0 bg-1' data-testid='preview-popout-page'>
      <header
        className={classNames('app-titlebar app-titlebar--desktop', { 'app-titlebar--mac': mac })}
        // The window is frameless (or traffic-lights-only on macOS), so this
        // strip is the only thing that can move it. 76px matches the reserve
        // the shared Titlebar uses for the macOS traffic lights.
        style={mac ? { paddingLeft: 76 } : undefined}
      >
        <span className='text-13px text-t-primary font-medium truncate' data-testid='preview-popout-title'>
          {heading}
        </span>
        <div
          className='flex items-center gap-8px'
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {notice ? (
            <span className='text-12px text-t-secondary' data-testid='preview-popout-notice'>
              {notice}
            </span>
          ) : null}
          <button
            type='button'
            className='flex items-center gap-6px px-10px py-4px rd-6px text-13px text-t-primary bg-2 b-1 b-solid b-[var(--color-border-2)] cursor-pointer hover:opacity-80'
            onClick={handleDockBack}
            disabled={docking}
            data-testid='preview-popout-dock-back'
            aria-label={t('conversation.tabs.dockBack')}
            title={t('conversation.tabs.dockBack')}
          >
            <PanelRightClose className='size-14px' />
            {t('conversation.tabs.dockBack')}
          </button>
          {/* macOS keeps its native traffic lights; every other platform is
              frameless and would otherwise have no way to close the window. */}
          {mac ? null : <WindowControls />}
        </div>
      </header>

      <div className='flex-1 min-h-0 overflow-hidden'>
        {seeded && tabs.length > 0 ? (
          <PreviewPanel />
        ) : (
          /* `/preview` is reachable through `app.popoutRoute` with no handoff
             at all, so mounting with nothing is a normal state and must read as
             one. An empty white rectangle would look like a deliverable that
             failed to arrive. */
          <div
            className='flex flex-col items-center justify-center gap-6px size-full text-center px-24px'
            data-testid='preview-popout-empty'
          >
            <span className='text-14px text-t-primary'>{t('preview.noTabs')}</span>
            <span className='text-13px text-t-secondary'>
              {t('preview.popoutEmptyHint', {
                defaultValue: 'Open a deliverable in the chat, then pop the preview out.',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Its OWN provider, same shape as `ArtifactsPage` and `ProjectFilesPanel`. The
 * app-wide provider lives in the main window's renderer; this is a different
 * process-level renderer entirely, so there is nothing here to inherit.
 */
const PreviewPopoutPage: React.FC = () => (
  <PreviewProvider>
    <PreviewPopoutShell />
  </PreviewProvider>
);

export default PreviewPopoutPage;
