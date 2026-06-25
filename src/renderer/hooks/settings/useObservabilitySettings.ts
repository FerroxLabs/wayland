/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useSyncExternalStore } from 'react';

/**
 * #252 - observability panel settings.
 *
 * Mirrors the localStorage-backed shape of useEditorSettings, but is made
 * cross-instance reactive via useSyncExternalStore: the panel open/closed state
 * is read AND written by two separate component instances (the header toggle in
 * WCoreConversationPanel and the panel itself in WCoreChat). A plain useState
 * per instance would let them drift; a module-level store + listener set keeps
 * every consumer in lockstep and survives reload.
 */

export type ObservabilitySettings = {
  /** Whether the right-side observability panel is open (opt-in, default off). */
  panelOpen: boolean;
  /** Whether per-turn cost is shown in the activity tree (default off). */
  showCost: boolean;
};

const STORAGE_KEY = 'wayland.observability.settings';

const DEFAULTS: ObservabilitySettings = {
  panelOpen: false,
  showCost: false,
};

function load(): ObservabilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ObservabilitySettings>) };
  } catch {
    return DEFAULTS;
  }
}

function persist(settings: ObservabilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage write failures (private mode / quota); in-memory state still updates.
  }
}

// Module-level store so all hook instances share one source of truth.
let current: ObservabilitySettings = load();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ObservabilitySettings {
  return current;
}

function setSetting<K extends keyof ObservabilitySettings>(key: K, value: ObservabilitySettings[K]): void {
  if (current[key] === value) return;
  current = { ...current, [key]: value };
  persist(current);
  for (const listener of listeners) listener();
}

export function useObservabilitySettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const update = useCallback(<K extends keyof ObservabilitySettings>(key: K, value: ObservabilitySettings[K]) => {
    setSetting(key, value);
  }, []);

  return { settings, update };
}
