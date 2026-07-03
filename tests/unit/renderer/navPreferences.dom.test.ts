// @vitest-environment jsdom

/**
 * #118 - the left-navigation appearance preferences (titlebar-brand visibility
 * and the sider-nav hidden-set) are persisted to localStorage and broadcast on
 * a same-document event so the live UI reacts without a reload.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NAV_PREFS_UPDATED_EVENT,
  SIDER_NAV_HIDDEN_IDS_KEY,
  TITLEBAR_BRAND_HIDDEN_KEY,
  readHiddenSiderNavIds,
  readTitlebarBrandHidden,
  resetNavPreferences,
  setSiderNavHidden,
  writeHiddenSiderNavIds,
  writeTitlebarBrandHidden,
} from '@renderer/utils/ui/navPreferences';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('titlebar brand visibility (#118)', () => {
  it('defaults to shown (not hidden) when nothing is stored', () => {
    expect(readTitlebarBrandHidden()).toBe(false);
  });

  it('persists the hidden flag and fires the update event', () => {
    const handler = vi.fn();
    window.addEventListener(NAV_PREFS_UPDATED_EVENT, handler);

    expect(writeTitlebarBrandHidden(true)).toBe(true);
    expect(window.localStorage.getItem(TITLEBAR_BRAND_HIDDEN_KEY)).toBe('true');
    expect(readTitlebarBrandHidden()).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);

    writeTitlebarBrandHidden(false);
    expect(readTitlebarBrandHidden()).toBe(false);
    expect(handler).toHaveBeenCalledTimes(2);

    window.removeEventListener(NAV_PREFS_UPDATED_EVENT, handler);
  });
});

describe('sider nav hidden-set (#118)', () => {
  it('returns an empty set (everything visible) when nothing is stored', () => {
    expect(readHiddenSiderNavIds()).toEqual([]);
  });

  it('returns empty for a malformed or non-array value', () => {
    window.localStorage.setItem(SIDER_NAV_HIDDEN_IDS_KEY, 'not-json');
    expect(readHiddenSiderNavIds()).toEqual([]);
    window.localStorage.setItem(SIDER_NAV_HIDDEN_IDS_KEY, '{"a":1}');
    expect(readHiddenSiderNavIds()).toEqual([]);
  });

  it('persists a deduplicated string-only set and fires the event', () => {
    const handler = vi.fn();
    window.addEventListener(NAV_PREFS_UPDATED_EVENT, handler);

    const result = writeHiddenSiderNavIds(['teams', 'teams', 'memory']);
    expect(result).toEqual(['teams', 'memory']);
    expect(readHiddenSiderNavIds()).toEqual(['teams', 'memory']);
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener(NAV_PREFS_UPDATED_EVENT, handler);
  });

  it('drops non-string entries persisted by a bad writer', () => {
    window.localStorage.setItem(SIDER_NAV_HIDDEN_IDS_KEY, JSON.stringify(['teams', 3, null, 'memory']));
    expect(readHiddenSiderNavIds()).toEqual(['teams', 'memory']);
  });

  it('setSiderNavHidden adds then removes a single id idempotently', () => {
    expect(setSiderNavHidden('teams', true)).toEqual(['teams']);
    // Adding again does not duplicate.
    expect(setSiderNavHidden('teams', true)).toEqual(['teams']);
    expect(setSiderNavHidden('memory', true)).toEqual(['teams', 'memory']);
    expect(setSiderNavHidden('teams', false)).toEqual(['memory']);
    // Removing something not present is a no-op.
    expect(setSiderNavHidden('projects', false)).toEqual(['memory']);
  });
});

describe('resetNavPreferences (#118)', () => {
  it('clears both preferences and fires the event once', () => {
    writeTitlebarBrandHidden(true);
    writeHiddenSiderNavIds(['teams']);

    const handler = vi.fn();
    window.addEventListener(NAV_PREFS_UPDATED_EVENT, handler);

    resetNavPreferences();

    expect(window.localStorage.getItem(TITLEBAR_BRAND_HIDDEN_KEY)).toBeNull();
    expect(window.localStorage.getItem(SIDER_NAV_HIDDEN_IDS_KEY)).toBeNull();
    expect(readTitlebarBrandHidden()).toBe(false);
    expect(readHiddenSiderNavIds()).toEqual([]);
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener(NAV_PREFS_UPDATED_EVENT, handler);
  });
});
