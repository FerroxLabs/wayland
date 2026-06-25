/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { parsePopoutMode } from '../../../../src/renderer/hooks/system/useIsPopoutMode';

describe('parsePopoutMode (pop-out window detection from HashRouter hash)', () => {
  it('returns true for a pop-out deep link', () => {
    expect(parsePopoutMode('#/conversation/abc?mode=popout')).toBe(true);
  });

  it('returns false for a normal conversation hash (no query)', () => {
    expect(parsePopoutMode('#/conversation/abc')).toBe(false);
  });

  it('returns false for the main window guid route', () => {
    expect(parsePopoutMode('#/guid')).toBe(false);
  });

  it('returns false when mode is some other value', () => {
    expect(parsePopoutMode('#/conversation/abc?mode=split')).toBe(false);
  });

  it('detects popout alongside other query params (order-independent)', () => {
    expect(parsePopoutMode('#/conversation/abc?foo=1&mode=popout&bar=2')).toBe(true);
  });

  it('handles encoded conversation ids in the path', () => {
    expect(parsePopoutMode('#/conversation/a%2Fb?mode=popout')).toBe(true);
  });

  it('returns false for empty / nullish input', () => {
    expect(parsePopoutMode('')).toBe(false);
    expect(parsePopoutMode(undefined)).toBe(false);
    expect(parsePopoutMode(null)).toBe(false);
  });
});
