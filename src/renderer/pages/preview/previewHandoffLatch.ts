/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The preview break-out handoff latch (SPEC-PREVIEW-PANE §4 Lane C).
 *
 * THIS MODULE EXISTS SO THE LISTENER IS EAGER.
 *
 * `PreviewPopoutPage` is routed through `React.lazy`, so its module scope
 * evaluates when the chunk resolves - which is AFTER the window's
 * `did-finish-load`. That is precisely when the main process emits the handoff,
 * and the platform emitter has NO REPLAY: an event with no subscriber is
 * dropped, not queued. Registering the listener inside the lazy chunk therefore
 * loses the tab outright, and the popped window comes up blank.
 *
 * Observed live before this module existed: the popped window rendered its
 * header and an EMPTY body. It looked half-alive rather than empty because the
 * pop-out shares an origin - and therefore localStorage - with the main window,
 * so `PreviewProvider` rehydrated a stale tab (giving the window its title)
 * while `isOpen` is hard-coded `false` on rehydration, so `PreviewPanel`'s
 * `if (!isOpen || !activeTab) return null` fired and drew nothing.
 *
 * So this module is imported STATICALLY by the router, which is eager. It holds
 * no React state and touches no DOM: it subscribes once, latches the payload,
 * and hands it to the page whenever the page gets around to mounting.
 */

import { ipcBridge } from '@/common';
import type { PreviewPopoutTab } from '@/common/adapter/ipcBridge';

type PreviewHandoffPayload = { tab: PreviewPopoutTab; direction: 'popout' | 'dock-back' };

let latchedTab: PreviewPopoutTab | null = null;
const seedSubscribers = new Set<(tab: PreviewPopoutTab) => void>();

const acceptHandoff = (payload: PreviewHandoffPayload): void => {
  // Only the OUTBOUND leg seeds a window. The same channel carries
  // `direction: 'dock-back'` when a window is closing and its tab is going
  // home; acting on that would re-seed a window that is going away.
  if (!payload || payload.direction !== 'popout' || !payload.tab) return;
  latchedTab = payload.tab;
  seedSubscribers.forEach((notify) => notify(payload.tab));
};

/**
 * Registered at module evaluation. Safe in the MAIN window too: it only ever
 * latches a value that nothing there reads.
 *
 * Guarded because a dev HMR pass re-evaluates this module, and the emitter has
 * no dedupe: subscribing again would leave the previous listener attached and
 * every handoff would be handled N times. The flag lives on `globalThis`
 * because the re-evaluated module gets a FRESH module scope, so a plain
 * module-level boolean would be `false` again on every reload.
 */
const REGISTERED = '__waylandPreviewHandoffRegistered';
if (!(globalThis as Record<string, unknown>)[REGISTERED]) {
  (globalThis as Record<string, unknown>)[REGISTERED] = true;
  ipcBridge.preview.handoff.on(acceptHandoff);
}

/** Read the tab that arrived before this page could mount, if any. */
export const peekLatchedTab = (): PreviewPopoutTab | null => latchedTab;

/** Subscribe to handoffs that arrive after mount (a second deliverable). */
export const onPreviewSeed = (notify: (tab: PreviewPopoutTab) => void): (() => void) => {
  seedSubscribers.add(notify);
  return () => {
    seedSubscribers.delete(notify);
  };
};

/** Test seam. Never called by the app. */
export const __previewHandoffLatch = {
  peek: peekLatchedTab,
  reset: (): void => {
    latchedTab = null;
  },
};
