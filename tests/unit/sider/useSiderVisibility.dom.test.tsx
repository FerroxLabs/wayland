/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSiderVisibility } from '@renderer/hooks/ui/useSiderVisibility';
import { readHiddenNavItems, writeHiddenNavItems } from '@renderer/utils/ui/siderVisibility';

afterEach(() => {
  localStorage.clear();
});

describe('useSiderVisibility', () => {
  it('seeds from the persisted hidden set', () => {
    writeHiddenNavItems(['search']);
    const { result } = renderHook(() => useSiderVisibility());
    expect(result.current.isHidden('search')).toBe(true);
    expect(result.current.isHidden('projects')).toBe(false);
  });

  it('toggle hides a visible item and persists it', () => {
    const { result } = renderHook(() => useSiderVisibility());
    expect(result.current.isHidden('teams')).toBe(false);
    act(() => result.current.toggle('teams'));
    expect(result.current.isHidden('teams')).toBe(true);
    expect(readHiddenNavItems()).toContain('teams');
  });

  it('toggle re-shows a hidden item', () => {
    writeHiddenNavItems(['memory']);
    const { result } = renderHook(() => useSiderVisibility());
    expect(result.current.isHidden('memory')).toBe(true);
    act(() => result.current.toggle('memory'));
    expect(result.current.isHidden('memory')).toBe(false);
    expect(readHiddenNavItems()).not.toContain('memory');
  });

  it('reacts to the cross-window updated event', () => {
    const { result } = renderHook(() => useSiderVisibility());
    expect(result.current.isHidden('workflows')).toBe(false);
    act(() => writeHiddenNavItems(['workflows']));
    expect(result.current.isHidden('workflows')).toBe(true);
  });
});
