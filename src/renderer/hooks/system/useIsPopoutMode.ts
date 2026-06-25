/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Detect whether this renderer is running inside a pop-out chat window (#27
 * phase 2). Pop-outs are deep-linked at `#/conversation/<id>?mode=popout`.
 *
 * Pop-out mode is fixed for the lifetime of the window (set once at creation),
 * so detection is a pure read of `window.location.hash` - it does NOT depend on
 * React Router. This matters because `ConversationTabsProvider` is mounted ABOVE
 * the HashRouter in main.tsx and cannot call `useLocation()`. Reading the hash
 * directly lets both router-scoped components (Layout, ChatLayout) and the
 * router-less provider share one source of truth.
 */

import { useMemo } from 'react';

/**
 * Pure: returns true when the HashRouter hash carries `mode=popout`. Accepts the
 * raw `window.location.hash` (e.g. `#/conversation/abc?mode=popout`).
 */
export function parsePopoutMode(hash: string | undefined | null): boolean {
  if (!hash) return false;
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return false;
  const query = hash.slice(queryStart + 1);
  return new URLSearchParams(query).get('mode') === 'popout';
}

/**
 * Non-hook variant for module/provider code that runs outside React (or where a
 * hook would be awkward). Reads the live location once.
 */
export function isPopoutModeNow(): boolean {
  if (typeof window === 'undefined') return false;
  return parsePopoutMode(window.location.hash);
}

/**
 * Hook form. Pop-out mode never changes within a window, so this memoizes a
 * one-time read; no router subscription is needed.
 */
export function useIsPopoutMode(): boolean {
  return useMemo(() => isPopoutModeNow(), []);
}
