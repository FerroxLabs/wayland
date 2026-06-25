// @vitest-environment jsdom

/**
 * #84 - the desktop sidebar width is persisted, clamped to the slider range,
 * and broadcast so the live layout resizes without a reload.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clampSidebarWidth,
  readSidebarWidth,
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  SIDEBAR_WIDTH_STORAGE_KEY,
  SIDEBAR_WIDTH_UPDATED_EVENT,
  writeSidebarWidth,
} from '@renderer/utils/ui/sidebarWidth';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.style.removeProperty('--sidebar-width');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('clampSidebarWidth (#84)', () => {
  it('clamps below the minimum and above the maximum, and rounds', () => {
    expect(clampSidebarWidth(50)).toBe(SIDEBAR_WIDTH_MIN);
    expect(clampSidebarWidth(9999)).toBe(SIDEBAR_WIDTH_MAX);
    expect(clampSidebarWidth(281.6)).toBe(282);
  });
});

describe('readSidebarWidth (#84)', () => {
  it('returns the default when nothing is stored', () => {
    expect(readSidebarWidth()).toBe(SIDEBAR_WIDTH_DEFAULT);
  });

  it('returns the default for a blank or non-numeric value', () => {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '   ');
    expect(readSidebarWidth()).toBe(SIDEBAR_WIDTH_DEFAULT);
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, 'not-a-number');
    expect(readSidebarWidth()).toBe(SIDEBAR_WIDTH_DEFAULT);
  });

  it('reads and clamps a stored value', () => {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '320');
    expect(readSidebarWidth()).toBe(320);
    // A stored value out of range is clamped on read (defends against a value
    // persisted before the range tightened).
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '5000');
    expect(readSidebarWidth()).toBe(SIDEBAR_WIDTH_MAX);
  });
});

describe('writeSidebarWidth (#84)', () => {
  it('persists the clamped value, sets the CSS var, and fires the update event', () => {
    const handler = vi.fn();
    window.addEventListener(SIDEBAR_WIDTH_UPDATED_EVENT, handler);

    const returned = writeSidebarWidth(9999);

    expect(returned).toBe(SIDEBAR_WIDTH_MAX);
    expect(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)).toBe(String(SIDEBAR_WIDTH_MAX));
    expect(document.documentElement.style.getPropertyValue('--sidebar-width')).toBe(`${SIDEBAR_WIDTH_MAX}px`);
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toBe(SIDEBAR_WIDTH_MAX);

    window.removeEventListener(SIDEBAR_WIDTH_UPDATED_EVENT, handler);
  });

  it('round-trips through read', () => {
    writeSidebarWidth(244);
    expect(readSidebarWidth()).toBe(244);
  });
});
