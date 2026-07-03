/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  readHiddenNavItems,
  SIDER_HIDDEN_ITEMS_STORAGE_KEY,
  SIDER_VISIBILITY_UPDATED_EVENT,
  toggleHiddenNavItem,
  writeHiddenNavItems,
} from '@renderer/utils/ui/siderVisibility';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('siderVisibility', () => {
  it('defaults to an empty hidden set (everything visible)', () => {
    expect(readHiddenNavItems()).toEqual([]);
  });

  it('round-trips a persisted hidden set', () => {
    writeHiddenNavItems(['search', 'teams']);
    expect(readHiddenNavItems()).toEqual(['search', 'teams']);
  });

  it('drops unknown and duplicate ids on write', () => {
    // @ts-expect-error - deliberately passing an unknown id to prove it is filtered
    writeHiddenNavItems(['search', 'search', 'bogus']);
    expect(readHiddenNavItems()).toEqual(['search']);
  });

  it('ignores malformed stored JSON', () => {
    localStorage.setItem(SIDER_HIDDEN_ITEMS_STORAGE_KEY, '{not json');
    expect(readHiddenNavItems()).toEqual([]);
  });

  it('fires the same-document updated event on write', () => {
    const handler = vi.fn();
    window.addEventListener(SIDER_VISIBILITY_UPDATED_EVENT, handler);
    writeHiddenNavItems(['memory']);
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(SIDER_VISIBILITY_UPDATED_EVENT, handler);
  });

  describe('toggleHiddenNavItem', () => {
    it('adds an id that is currently visible', () => {
      expect(toggleHiddenNavItem([], 'projects')).toEqual(['projects']);
    });

    it('removes an id that is currently hidden', () => {
      expect(toggleHiddenNavItem(['projects', 'teams'], 'projects')).toEqual(['teams']);
    });
  });
});
