/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pop-out chat window bridge (#27 phase 2) and preview break-out window
 * (SPEC-PREVIEW-PANE §4 Lane B).
 *
 * Wires the renderer-facing `conversation.popout` / `conversation.dockBack`
 * providers to the pop-out window manager. The `popoutClosed` emitter is fired
 * from the window manager's `closed` handler, not here.
 *
 * The preview break-out adds `preview.popout` / `preview.handoff` /
 * `preview.dockBack`. The in-flight tab is held HERE, in a plain module-scope
 * variable - never localStorage, never disk, never safeStorage. That is the
 * point of the feature: `PreviewProvider`'s persistence path drops any tab over
 * 80,000 chars and the deliverable this exists for is a 77 KB HTML brief that
 * is still growing.
 */

import { ipcBridge } from '@/common';
import type { PreviewPopoutTab } from '@/common/adapter/ipcBridge';
import { closePopoutWindow, openPopoutWindow, openRoutePopoutWindow } from '@process/utils/popoutWindowManager';
import { PREVIEW_POPOUT_SIZE, routePopoutKey } from '@process/utils/popoutRoutes';

let initialized = false;

/**
 * The tab currently living in the preview pop-out. In-memory only, and cleared
 * by the window's `closed` handler so a dock-back can never fire twice for the
 * same window.
 */
let poppedPreviewTab: PreviewPopoutTab | null = null;

export function initPopoutBridge(): void {
  // Idempotent: bridge init may be reached more than once across boot paths.
  if (initialized) return;
  initialized = true;

  ipcBridge.conversation.popout.provider(async ({ conversation_id }) => {
    return openPopoutWindow(conversation_id);
  });

  ipcBridge.conversation.dockBack.provider(async ({ conversation_id }) => {
    return closePopoutWindow(conversation_id);
  });

  ipcBridge.preview.popout.provider(async ({ tab }) => {
    poppedPreviewTab = tab;
    return openRoutePopoutWindow('preview', {
      size: PREVIEW_POPOUT_SIZE,
      // `did-finish-load` is strictly after the popped renderer's module
      // scripts have evaluated, so a `preview.handoff` listener registered at
      // module scope there is already live. A listener registered only inside a
      // React effect can still miss this - see the Lane B report.
      onReady: () => emitPreviewHandoff('popout'),
      // The ONE place a dock-back is announced. Every close path - the popped
      // window's Dock back control, the OS red button, app quit - funnels
      // through the window's `closed` handler, so it fires exactly once.
      onClosed: () => emitPreviewHandoff('dock-back', true),
    });
  });

  ipcBridge.preview.dockBack.provider(async () => {
    const tab = poppedPreviewTab;
    const { ok } = closePopoutWindow(routePopoutKey('preview'));
    return { ok, tab };
  });
}

function emitPreviewHandoff(direction: 'popout' | 'dock-back', clear = false): void {
  const tab = poppedPreviewTab;
  if (clear) poppedPreviewTab = null;
  if (!tab) return;
  try {
    ipcBridge.preview.handoff.emit({ tab, direction });
  } catch (err) {
    console.warn('[Popout] Failed to emit preview handoff:', direction, err);
  }
}

/** Test-only accessor for the in-flight preview tab. */
export function _getPoppedPreviewTabForTests(): PreviewPopoutTab | null {
  return poppedPreviewTab;
}
