/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LOGO_VISIBLE_DEFAULT,
  LOGO_VISIBLE_STORAGE_KEY,
  LOGO_VISIBLE_UPDATED_EVENT,
  readLogoVisible,
  writeLogoVisible,
} from '@renderer/utils/ui/logoVisibility';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('logoVisibility', () => {
  it('defaults to hidden (false) when nothing is persisted', () => {
    expect(LOGO_VISIBLE_DEFAULT).toBe(false);
    expect(readLogoVisible()).toBe(false);
  });

  it('round-trips a persisted true value', () => {
    writeLogoVisible(true);
    expect(localStorage.getItem(LOGO_VISIBLE_STORAGE_KEY)).toBe('true');
    expect(readLogoVisible()).toBe(true);
  });

  it('round-trips a persisted false value', () => {
    writeLogoVisible(false);
    expect(readLogoVisible()).toBe(false);
  });

  it('falls back to the default for a blank stored value', () => {
    localStorage.setItem(LOGO_VISIBLE_STORAGE_KEY, '   ');
    expect(readLogoVisible()).toBe(LOGO_VISIBLE_DEFAULT);
  });

  it('fires the same-document updated event on write', () => {
    const handler = vi.fn();
    window.addEventListener(LOGO_VISIBLE_UPDATED_EVENT, handler);
    writeLogoVisible(true);
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(LOGO_VISIBLE_UPDATED_EVENT, handler);
  });
});
