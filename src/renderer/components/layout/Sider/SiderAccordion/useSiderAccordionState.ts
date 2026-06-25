/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * @api-frozen - Do not modify schema or public API mid-wave. W1 agents depend on this contract.
 */

import { useCallback, useEffect, useState } from 'react';

export const ACCORDION_STORAGE_KEY = 'sider.accordion.state.v1';
/**
 * Same-renderer change broadcast - `window.storage` events do NOT fire in the
 * tab that wrote the change, so sibling hook instances would never reconcile.
 * Each instance dispatches this custom event on toggle and listens for it.
 */
export const ACCORDION_CHANGE_EVENT = 'wayland:sider-accordion-changed';

export type AccordionKey = 'scheduled' | 'workflows' | 'teams';
export type AccordionState = Record<AccordionKey, boolean>;

const DEFAULT_STATE: AccordionState = { scheduled: false, workflows: false, teams: false };

function readStoredState(): AccordionState {
  try {
    const raw = localStorage.getItem(ACCORDION_STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_STATE;
    const obj = parsed as Record<string, unknown>;
    return {
      scheduled: typeof obj.scheduled === 'boolean' ? obj.scheduled : false,
      workflows: typeof obj.workflows === 'boolean' ? obj.workflows : false,
      teams: typeof obj.teams === 'boolean' ? obj.teams : false,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useSiderAccordionState() {
  // Sync read in initializer - no first-paint flash
  const [state, setState] = useState<AccordionState>(readStoredState);

  // Cross-window storage event + same-renderer custom event reconciliation.
  // `e.key === null` means localStorage.clear() fired - treat as global reset.
  // Without the custom event, sibling instances in the SAME renderer never
  // reconcile (window.storage only fires in OTHER tabs/windows), so a toggle
  // in one section would clobber another section's open/closed state on its
  // next write because each instance's `prev` snapshot was stale.
  useEffect(() => {
    const refresh = () => setState(readStoredState());
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== ACCORDION_STORAGE_KEY) return;
      refresh();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(ACCORDION_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(ACCORDION_CHANGE_EVENT, refresh);
    };
  }, []);

  // Re-read + write helper shared by toggle/setOpen so both merge against the
  // freshest shared state - protects against the v0.6.2 audit-flagged stale-
  // state clobber when multiple instances of this hook mount in parallel.
  const write = useCallback((key: AccordionKey, value: boolean) => {
    const fresh = readStoredState();
    if (fresh[key] === value) return;
    const next = { ...fresh, [key]: value };
    try {
      localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage full / blocked - accept in-memory only
    }
    setState(next);
    // Broadcast to sibling instances in this renderer.
    window.dispatchEvent(new Event(ACCORDION_CHANGE_EVENT));
  }, []);

  const toggle = useCallback(
    (key: AccordionKey) => {
      write(key, !readStoredState()[key]);
    },
    [write]
  );

  /**
   * Set a section's open state explicitly. Used for route-aware auto-expand:
   * navigating into a section's route opens it ONCE (on the route-entry
   * transition), but - unlike forcing `open` true in the render computation -
   * the user can still collapse it via the chevron and it stays collapsed.
   */
  const setOpen = write;

  return { state, toggle, setOpen };
}
