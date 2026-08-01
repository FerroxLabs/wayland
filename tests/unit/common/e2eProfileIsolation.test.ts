/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { shouldApplyDevProfileFallback } from '@/common/platform';
import { shouldCreateCliSafeSymlink } from '@process/utils/utils';

describe('E2E profile isolation', () => {
  it('preserves the userData path selected by the E2E startup identity', () => {
    expect(shouldApplyDevProfileFallback(false, { WAYLAND_E2E_TEST: '1' })).toBe(false);
  });

  it('still applies the normal fallback in an interactive dev process', () => {
    expect(shouldApplyDevProfileFallback(false, {})).toBe(true);
  });

  it('never rewrites global CLI-safe symlinks from an E2E process', () => {
    expect(shouldCreateCliSafeSymlink(true, { WAYLAND_E2E_TEST: '1' })).toBe(false);
  });

  it('keeps CLI-safe symlinks enabled for interactive macOS development', () => {
    expect(shouldCreateCliSafeSymlink(true, {})).toBe(true);
  });
});
