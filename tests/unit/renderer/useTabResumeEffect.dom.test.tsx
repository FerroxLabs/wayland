/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabResumeEffect } from '../../../src/renderer/hooks/system/useTabResumeEffect';

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
}

describe('useTabResumeEffect', () => {
  beforeEach(() => setVisibility('visible'));
  afterEach(() => vi.restoreAllMocks());

  it('runs onResume on window focus', () => {
    const onResume = vi.fn();
    renderHook(() => useTabResumeEffect(onResume, []));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('runs onResume on pageshow', () => {
    const onResume = vi.fn();
    renderHook(() => useTabResumeEffect(onResume, []));
    act(() => window.dispatchEvent(new Event('pageshow')));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('runs onResume on visibilitychange when visible', () => {
    const onResume = vi.fn();
    renderHook(() => useTabResumeEffect(onResume, []));
    setVisibility('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('does NOT run onResume when the tab is hidden', () => {
    const onResume = vi.fn();
    renderHook(() => useTabResumeEffect(onResume, []));
    setVisibility('hidden');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(onResume).not.toHaveBeenCalled();
  });

  it('removes its listeners on unmount', () => {
    const onResume = vi.fn();
    const { unmount } = renderHook(() => useTabResumeEffect(onResume, []));
    unmount();
    act(() => window.dispatchEvent(new Event('focus')));
    expect(onResume).not.toHaveBeenCalled();
  });
});
