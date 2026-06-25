/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { isElectronDesktop } from '@renderer/utils/platform';
import { useEffect, useState } from 'react';

/**
 * The two orthogonal responsive signals that `isMobile` used to conflate (#47):
 *
 *  - `isNarrow`: the viewport is below the mobile width breakpoint. Use this for
 *    LAYOUT decisions - stacking, full-width, overlay drawers, hiding chrome.
 *    A narrow desktop window is `isNarrow` even with a mouse.
 *  - `isTouch`: the primary input is touch / coarse pointer (no hover). Use this
 *    for INTERACTION decisions - tap targets, replacing hover affordances,
 *    avoiding hover-only tooltips. A touch laptop is `isTouch` even when wide.
 *  - `isMobile`: the legacy composite, kept identical to the previous behaviour
 *    so existing consumers don't change meaning. Prefer `isNarrow`/`isTouch` in
 *    new code; reach for `isMobile` only when you genuinely mean "either".
 */
export interface Responsive {
  isNarrow: boolean;
  isTouch: boolean;
  isMobile: boolean;
}

const NARROW_BREAKPOINT = 768;
/** Touch only counts toward `isMobile` on a smallish screen (a touch desktop monitor isn't "mobile"). */
const TOUCH_SMALL_SCREEN = 1024;

function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(hover: none)').matches ||
    window.matchMedia('(pointer: coarse)').matches ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  );
}

export function computeResponsive(): Responsive {
  if (typeof window === 'undefined') {
    return { isNarrow: false, isTouch: false, isMobile: false };
  }
  const width = window.innerWidth;
  const isNarrow = width < NARROW_BREAKPOINT;
  const isTouch = detectTouch();
  // Preserve the exact legacy `detectMobileViewportOrTouch` semantics: desktop
  // electron keys purely on width; the web build also treats touch on a small
  // screen as mobile.
  const isMobile = isElectronDesktop() ? isNarrow : isNarrow || (width < TOUCH_SMALL_SCREEN && isTouch);
  return { isNarrow, isTouch, isMobile };
}

/**
 * Reactive responsive state. Re-evaluates on resize and on pointer/hover media
 * changes (a device can switch input modes - e.g. detaching a 2-in-1 keyboard).
 */
export function useResponsive(): Responsive {
  const [state, setState] = useState<Responsive>(computeResponsive);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setState(computeResponsive());
    update(); // sync once on mount in case SSR seeded defaults
    window.addEventListener('resize', update);
    const hover = window.matchMedia('(hover: none)');
    const pointer = window.matchMedia('(pointer: coarse)');
    hover.addEventListener?.('change', update);
    pointer.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      hover.removeEventListener?.('change', update);
      pointer.removeEventListener?.('change', update);
    };
  }, []);

  return state;
}
