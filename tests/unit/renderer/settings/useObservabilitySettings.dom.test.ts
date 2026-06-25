/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The hook keeps a module-level store seeded from localStorage at import time.
// Reset modules + localStorage before each test so every case starts clean.
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  localStorage.clear();
});

async function loadHook() {
  const mod = await import('@/renderer/hooks/settings/useObservabilitySettings');
  return mod.useObservabilitySettings;
}

describe('useObservabilitySettings', () => {
  it('defaults both flags to false (opt-in panel, cost off)', async () => {
    const useObservabilitySettings = await loadHook();
    const { result } = renderHook(() => useObservabilitySettings());
    expect(result.current.settings.panelOpen).toBe(false);
    expect(result.current.settings.showCost).toBe(false);
  });

  it('persists updates to localStorage', async () => {
    const useObservabilitySettings = await loadHook();
    const { result } = renderHook(() => useObservabilitySettings());

    act(() => result.current.update('panelOpen', true));
    act(() => result.current.update('showCost', true));

    expect(result.current.settings.panelOpen).toBe(true);
    expect(result.current.settings.showCost).toBe(true);

    const raw = JSON.parse(localStorage.getItem('wayland.observability.settings') ?? '{}');
    expect(raw.panelOpen).toBe(true);
    expect(raw.showCost).toBe(true);
  });

  it('keeps two hook instances in sync (cross-instance reactivity)', async () => {
    const useObservabilitySettings = await loadHook();
    const a = renderHook(() => useObservabilitySettings());
    const b = renderHook(() => useObservabilitySettings());

    expect(a.result.current.settings.panelOpen).toBe(false);
    expect(b.result.current.settings.panelOpen).toBe(false);

    // Toggle from instance A; instance B must observe the change.
    act(() => a.result.current.update('panelOpen', true));

    expect(a.result.current.settings.panelOpen).toBe(true);
    expect(b.result.current.settings.panelOpen).toBe(true);
  });

  it('falls back to defaults when persisted value is malformed JSON', async () => {
    // A corrupt/partial write must not crash the panel/toggle on import - load()
    // swallows the JSON.parse failure and returns the opt-in defaults.
    localStorage.setItem('wayland.observability.settings', '{not json');
    const useObservabilitySettings = await loadHook();
    const { result } = renderHook(() => useObservabilitySettings());
    expect(result.current.settings.panelOpen).toBe(false);
    expect(result.current.settings.showCost).toBe(false);
  });

  it('seeds initial state from previously persisted settings', async () => {
    localStorage.setItem('wayland.observability.settings', JSON.stringify({ panelOpen: true, showCost: true }));
    const useObservabilitySettings = await loadHook();
    const { result } = renderHook(() => useObservabilitySettings());
    expect(result.current.settings.panelOpen).toBe(true);
    expect(result.current.settings.showCost).toBe(true);
  });
});
