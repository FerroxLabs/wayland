/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import type { DependencyList } from 'react';

/**
 * Run `onResume` whenever the browser tab/window becomes active again - on
 * `focus`, `pageshow`, and `visibilitychange` (when not hidden). Mobile browsers
 * (notably iOS Safari/Chrome) suspend timers and event delivery while a tab is
 * backgrounded, so UI that hydrates state only on mount can show a stale state
 * after the user returns. Chat surfaces that derive `running` / `aiProcessing`
 * from `conversation.get` use this to reconcile against the backend on resume,
 * instead of waiting for a full page refresh. (#57)
 */
export function useTabResumeEffect(onResume: () => void, deps: DependencyList): void {
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') return;
      onResume();
    };
    window.addEventListener('focus', handler);
    window.addEventListener('pageshow', handler);
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('focus', handler);
      window.removeEventListener('pageshow', handler);
      document.removeEventListener('visibilitychange', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
