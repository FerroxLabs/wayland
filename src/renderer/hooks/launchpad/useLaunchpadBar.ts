/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import { QUICK_LAUNCH_ANCHORS } from '@/renderer/pages/guid/quickLaunchAnchors';
import type { LaunchpadBarOrder } from '@/common/types/launchpad';

/**
 * Default bar order - the 6 anchors that shipped in v0.5.0. New installs
 * see exactly this set on first boot. Customisation is opt-in: once the
 * user reorders / adds / removes a card the resulting array is persisted
 * to ConfigStorage under `launchpad.barOrder`, and the default branch is
 * never taken again on that install (even if the user manually empties
 * the bar - `[]` is still a deliberate user choice).
 */
export const DEFAULT_BAR_ORDER: LaunchpadBarOrder = QUICK_LAUNCH_ANCHORS.map((a) => a.assistantId);

/**
 * Hard cap on bar entries. The bar replaces the launchpad cold-start row
 * on /guid; without a cap the picker would let users stack 50+ cards and
 * obliterate the page. 10 is the product ceiling - picker disables further
 * adds once the cap is hit (LaunchpadPicker renders a banner + dims the
 * unpinned cards).
 */
export const LAUNCHPAD_MAX_ENTRIES = 10;

const STORAGE_KEY = 'launchpad.barOrder' as const;

export type UseLaunchpadBarReturn = {
  /** Current ordered bar. Empty array until the initial load finishes. */
  barOrder: LaunchpadBarOrder;
  /** True until the first ConfigStorage read resolves. */
  loaded: boolean;
  /** Replace the entire order (e.g. dnd-kit drop). Persists through to ConfigStorage. */
  setBarOrder: (next: LaunchpadBarOrder) => void;
  /** Append an assistant ID if not already present. */
  addToBar: (assistantId: string) => void;
  /** Remove an assistant ID from the bar. */
  removeFromBar: (assistantId: string) => void;
  /** Reset to the default set (overwrites any user customisation). */
  resetToDefaults: () => void;
};

/**
 * Hook that owns the editable launchpad bar order. Single source of
 * truth across the three mount points (launchpad / /assistants /
 * Settings). On mount it reads `launchpad.barOrder` from ConfigStorage:
 *
 *   - `undefined` / unset      → seed with DEFAULT_BAR_ORDER (in-memory
 *     only; nothing is written until the user touches the bar).
 *   - non-empty array          → use as-is.
 *   - empty array              → respect the user's deliberate empty bar.
 *
 * `setBarOrder` / `addToBar` / `removeFromBar` write through to
 * ConfigStorage. The hook deliberately does NOT validate IDs against
 * the live assistant catalogue - that is the responsibility of the
 * renderer (which silently skips unknown IDs at draw time so an
 * extension reinstall restores its card).
 */
export function useLaunchpadBar(): UseLaunchpadBarReturn {
  const [barOrder, setBarOrderState] = useState<LaunchpadBarOrder>([]);
  const [loaded, setLoaded] = useState(false);
  // Tracks whether the user has touched the bar since boot. While
  // `false` the in-memory default is rendered but NOT persisted; the
  // first mutation flips this and every subsequent change writes
  // through. Prevents the default from being eagerly written to every
  // fresh install (which would be a meaningless write and would mask
  // future default-set upgrades).
  const userMutatedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void ConfigStorage.get(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (Array.isArray(stored)) {
          // Even an empty array is a deliberate user state.
          setBarOrderState(stored);
          userMutatedRef.current = true;
        } else {
          setBarOrderState(DEFAULT_BAR_ORDER);
        }
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[useLaunchpadBar] failed to read bar order; falling back to defaults', err);
        setBarOrderState(DEFAULT_BAR_ORDER);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: LaunchpadBarOrder) => {
    userMutatedRef.current = true;
    setBarOrderState(next);
    void ConfigStorage.set(STORAGE_KEY, next).catch((err) => {
      console.warn('[useLaunchpadBar] failed to persist bar order', err);
    });
  }, []);

  const setBarOrder = useCallback(
    (next: LaunchpadBarOrder) => {
      persist(next);
    },
    [persist]
  );

  const addToBar = useCallback(
    (assistantId: string) => {
      setBarOrderState((prev) => {
        if (prev.includes(assistantId)) return prev;
        if (prev.length >= LAUNCHPAD_MAX_ENTRIES) {
          console.warn(
            '[useLaunchpadBar] bar at cap (%d); refusing to add %s',
            LAUNCHPAD_MAX_ENTRIES,
            assistantId
          );
          return prev;
        }
        const next = [...prev, assistantId];
        userMutatedRef.current = true;
        void ConfigStorage.set(STORAGE_KEY, next).catch((err) => {
          console.warn('[useLaunchpadBar] failed to persist bar order', err);
        });
        return next;
      });
    },
    []
  );

  const removeFromBar = useCallback(
    (assistantId: string) => {
      setBarOrderState((prev) => {
        const next = prev.filter((id) => id !== assistantId);
        if (next.length === prev.length) return prev;
        userMutatedRef.current = true;
        void ConfigStorage.set(STORAGE_KEY, next).catch((err) => {
          console.warn('[useLaunchpadBar] failed to persist bar order', err);
        });
        return next;
      });
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    persist([...DEFAULT_BAR_ORDER]);
  }, [persist]);

  return {
    barOrder,
    loaded,
    setBarOrder,
    addToBar,
    removeFromBar,
    resetToDefaults,
  };
}
