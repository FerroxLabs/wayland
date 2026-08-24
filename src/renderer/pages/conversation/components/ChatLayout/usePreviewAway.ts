/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The preview break-out, seen from the MAIN window (SPEC-PREVIEW-PANE §4 Lane D).
 *
 * Three rules make this whole hook, and each one is a bug that shipped in a
 * neighbouring feature:
 *
 * 1. **The transport is the truth, not the click.** `away` flips on the
 *    `preview.handoff` broadcast, never on the pop-out button. A strip that
 *    said "Preview is in its own window" when no window opened would be worse
 *    than the empty rail it replaces.
 * 2. **Dock-back is announced in exactly ONE place.** Lane B made the popped
 *    window's `closed` handler emit `direction: 'dock-back'`, so the OS red
 *    button and an in-app control are literally the same code path.
 *    `preview.dockBack` closes the window and RETURNS the tab but deliberately
 *    does not emit. Reacting to both would dock the tab twice, so `bringBack`
 *    below fires the call and throws its result away on purpose.
 * 3. **A deliverable arriving while popped must NOT re-dock.** It counts, it
 *    pulses, and the rail stays shut - the same class of bug as `b563b39fc`,
 *    pointed the other way. Yanking the layout out from under someone
 *    mid-read is not a feature.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ipcBridge } from '@/common';
import type { PreviewPopoutTab } from '@/common/adapter/ipcBridge';

export interface PreviewAwayState {
  /** True while a preview pop-out window is live. */
  away: boolean;
  /** Deliverables that arrived SINCE the pop-out. The popped tab itself is 0. */
  arrivals: number;
  /**
   * Bumped once per arrival. A token rather than a boolean because a second
   * arrival has to be able to re-trigger a one-shot animation that the first
   * one already finished.
   */
  pulseToken: number;
  /** Hand the active tab to a new (or already-open) pop-out window. */
  popOut: (tab: PreviewPopoutTab | null) => void;
  /** Close the pop-out. The dock itself happens on the resulting broadcast. */
  bringBack: () => void;
}

export function usePreviewAway(activeTabId: string | null | undefined): PreviewAwayState {
  const [away, setAway] = useState(false);
  const [arrivals, setArrivals] = useState(0);
  const [pulseToken, setPulseToken] = useState(0);
  /**
   * `away` is also held in a ref because the broadcast handler is registered
   * once and would otherwise close over the mount's `false` forever.
   */
  const awayRef = useRef(false);
  /**
   * The last tab this window has already accounted for. Seeded from the tab
   * the handoff carried, so the deliverable that WENT to the other window is
   * never counted as one that arrived after it.
   */
  const seenTabId = useRef<string | null>(activeTabId ?? null);

  useEffect(() => {
    return ipcBridge.preview.handoff.on((payload) => {
      const direction = payload?.direction;
      if (direction === 'dock-back') {
        awayRef.current = false;
        setAway(false);
        setArrivals(0);
        return;
      }
      if (direction !== 'popout') return;
      seenTabId.current = payload?.tab?.id ?? seenTabId.current;
      // A repeat pop-out (the window was already open) is not a new departure:
      // it must not reset a count the user has not seen yet.
      if (awayRef.current) return;
      awayRef.current = true;
      setAway(true);
      setArrivals(0);
    });
  }, []);

  useEffect(() => {
    const id = activeTabId ?? null;
    // Not away: keep the baseline current so the NEXT pop-out starts from the
    // tab that actually left.
    if (!away) {
      seenTabId.current = id;
      return;
    }
    if (!id || id === seenTabId.current) return;
    seenTabId.current = id;
    setArrivals((count) => count + 1);
    setPulseToken((token) => token + 1);
  }, [away, activeTabId]);

  const popOut = useCallback((tab: PreviewPopoutTab | null) => {
    // Storage is not the transport - the whole tab travels on the wire. A 77 KB
    // brief is over `sanitizeTabsForPersistence`'s 80,000-char ceiling on a bad
    // day and would arrive as nothing.
    if (!tab) return;
    void ipcBridge.preview.popout.invoke({ tab }).catch((error) => {
      console.error('[Preview] Pop-out failed:', error);
    });
  }, []);

  const bringBack = useCallback(() => {
    // The returned tab is INTENTIONALLY discarded: closing the window emits
    // `direction: 'dock-back'`, and that broadcast is what docks. Using both
    // would dock twice. See rule 2 at the top of this file.
    void ipcBridge.preview.dockBack.invoke().catch((error) => {
      console.error('[Preview] Dock-back failed:', error);
    });
  }, []);

  return { away, arrivals, pulseToken, popOut, bringBack };
}
