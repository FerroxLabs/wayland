// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isBelowVersion } from '@/renderer/utils/versionCompare';

describe('isBelowVersion', () => {
  it('returns false when versions are equal', () => {
    expect(isBelowVersion('0.2.0', '0.2.0')).toBe(false);
  });

  it('returns true when installed is below minimum', () => {
    expect(isBelowVersion('0.1.9', '0.2.0')).toBe(true);
  });

  it('compares numerically not lexicographically (0.10.0 > 0.9.0)', () => {
    expect(isBelowVersion('0.10.0', '0.9.0')).toBe(false);
  });

  it('returns true when installed is missing a trailing segment', () => {
    expect(isBelowVersion('1.0', '1.0.1')).toBe(true);
  });

  it('treats junk segments as 0', () => {
    expect(isBelowVersion('1.foo.0', '1.0.1')).toBe(true);
    expect(isBelowVersion('1.0.bar', '1.0.0')).toBe(false);
  });
});
