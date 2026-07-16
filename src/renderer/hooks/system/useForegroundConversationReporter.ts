/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ipcBridge } from '@/common';

/** The conversation id in `#/conversation/:id`, or null for any other route. */
export function foregroundConversationIdFromPath(pathname: string): string | null {
  const match = /^\/conversation\/([^/]+)/.exec(pathname);
  return match ? (match[1] ?? null) : null;
}

/**
 * Tell the main process which conversation is on screen, so the #579
 * task-completion notifier can stay quiet ONLY about the chat the user is looking
 * at — not every chat while the app happens to be focused on a different one.
 *
 * Reports on route change and whenever this window regains focus (a conversation
 * can be popped out into its own window; the focused window re-asserts its own
 * chat, so the single main-process value always reflects the focused window).
 *
 * Every report is gated on this window actually having focus. A pop-out loads
 * hidden and mounts (firing effects) BEFORE it is shown/focused, and a window can
 * be navigated programmatically while unfocused — without the guard, a background
 * window's mount/navigation would clobber the foreground value the focused window
 * set. It deliberately does NOT clear on blur: when no window is focused the
 * notifier already falls back to "not watching", and clearing would race the
 * focus of the window being switched to.
 */
export function useForegroundConversationReporter(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const conversationId = foregroundConversationIdFromPath(pathname);
    const report = () => {
      // Only the focused window owns the single main-process value.
      if (!document.hasFocus()) return;
      void ipcBridge.application.setForegroundConversation.invoke({ conversationId });
    };
    report();
    window.addEventListener('focus', report);
    return () => window.removeEventListener('focus', report);
  }, [pathname]);
}
