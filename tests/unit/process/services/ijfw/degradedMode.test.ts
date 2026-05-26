/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const getModeSpy = vi.fn();
vi.mock('@process/services/ijfw/ijfwMcpClient', () => ({
  ijfwMcpClient: {
    getMode: () => getModeSpy(),
  },
}));

import {
  DEGRADED_TOAST_KEY,
  DEGRADED_TOAST_FALLBACK,
  shortCircuitIfDegraded,
  markToastShown,
  wasToastShown,
  __resetDegradedModeForTests,
} from '@process/services/ijfw/degradedMode';

beforeEach(() => {
  __resetDegradedModeForTests();
  getModeSpy.mockReset();
});

describe('degradedMode', () => {
  it('exports a stable i18n key', () => {
    expect(DEGRADED_TOAST_KEY).toBe('memory.degraded.toast');
  });

  it('exports an English fallback string', () => {
    expect(typeof DEGRADED_TOAST_FALLBACK).toBe('string');
    expect(DEGRADED_TOAST_FALLBACK.length).toBeGreaterThan(0);
  });

  describe('shortCircuitIfDegraded', () => {
    it('returns null when client is full', () => {
      getModeSpy.mockReturnValue('full');
      expect(shortCircuitIfDegraded()).toBeNull();
    });

    it('returns { ok:false, errorReason:"unavailable" } when client is degraded', () => {
      getModeSpy.mockReturnValue('degraded');
      const result = shortCircuitIfDegraded();
      expect(result).not.toBeNull();
      expect(result!.ok).toBe(false);
      if (!result!.ok) expect(result!.errorReason).toBe('unavailable');
    });
  });

  describe('toast-shown latch', () => {
    it('starts unset and flips to true after markToastShown', () => {
      expect(wasToastShown()).toBe(false);
      markToastShown();
      expect(wasToastShown()).toBe(true);
    });

    it('resets via the test-only helper', () => {
      markToastShown();
      __resetDegradedModeForTests();
      expect(wasToastShown()).toBe(false);
    });
  });
});
