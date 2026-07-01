/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_CONTEXT_LIMIT, getModelContextLimit } from '@/renderer/utils/model/modelContextLimits';

describe('getModelContextLimit', () => {
  const M = 1_000_000;
  const K200 = 200_000;

  describe('Opus 4.x context windows (issue #477)', () => {
    // The reported bug: the current model id resolved to 200K via the bare
    // `claude-opus-4` fuzzy fallback, so the context meter showed a 200K
    // denominator for a 1M-window session. It must resolve to 1M.
    it('resolves claude-opus-4-8 to the 1M window', () => {
      expect(getModelContextLimit('claude-opus-4-8')).toBe(M);
    });

    it('resolves the opus-4-8 dated/variant id via fuzzy longest-match to 1M', () => {
      expect(getModelContextLimit('claude-opus-4-8-20260101')).toBe(M);
    });

    it('is case-insensitive for opus-4-8', () => {
      expect(getModelContextLimit('Claude-Opus-4-8')).toBe(M);
    });

    it('resolves opus 4.6 and 4.7 to 1M', () => {
      expect(getModelContextLimit('claude-opus-4-7')).toBe(M);
      expect(getModelContextLimit('claude-opus-4-6')).toBe(M);
    });

    // Per the models.dev snapshot these are genuinely 200K — the issue's
    // premise that "all Opus 4.x is 1M" is incorrect for 4.0/4.1/4.5.
    it('keeps opus 4.0/4.1/4.5 at 200K', () => {
      expect(getModelContextLimit('claude-opus-4-5')).toBe(K200);
      expect(getModelContextLimit('claude-opus-4-1')).toBe(K200);
      expect(getModelContextLimit('claude-opus-4-0')).toBe(K200);
      // dated Opus 4.0 id falls through to the bare `claude-opus-4` fallback
      expect(getModelContextLimit('claude-opus-4-20250514')).toBe(K200);
    });
  });

  describe('Sonnet 4.x context windows', () => {
    it('resolves sonnet 4.6 to 1M', () => {
      expect(getModelContextLimit('claude-sonnet-4-6')).toBe(M);
    });

    // Regression guard: the old bare `claude-sonnet-4` = 1M key over-reported
    // Sonnet 4.5 / 4.0 (real 200K) as 1M.
    it('keeps sonnet 4.5/4.0 at 200K (no longer over-reported)', () => {
      expect(getModelContextLimit('claude-sonnet-4-5')).toBe(K200);
      expect(getModelContextLimit('claude-sonnet-4-5-20250929')).toBe(K200);
      expect(getModelContextLimit('claude-sonnet-4-0')).toBe(K200);
    });
  });

  describe('other known models', () => {
    it('resolves haiku 4.5 to 200K', () => {
      expect(getModelContextLimit('claude-haiku-4-5')).toBe(K200);
      expect(getModelContextLimit('claude-haiku-4-5-20251001')).toBe(K200);
    });

    it('resolves legacy Claude 3 models to 200K (not the 1M default)', () => {
      expect(getModelContextLimit('claude-3-opus-20240229')).toBe(K200);
      expect(getModelContextLimit('claude-3-sonnet-20240229')).toBe(K200);
      expect(getModelContextLimit('claude-3-5-sonnet-20241022')).toBe(K200);
      expect(getModelContextLimit('claude-3-haiku-20240307')).toBe(K200);
    });

    it('resolves a Gemini id exactly', () => {
      expect(getModelContextLimit('gemini-2.5-pro')).toBe(1_048_576);
    });
  });

  describe('fallbacks', () => {
    it('returns the default for unknown or empty model names', () => {
      expect(getModelContextLimit('some-unknown-model')).toBe(DEFAULT_CONTEXT_LIMIT);
      expect(getModelContextLimit('')).toBe(DEFAULT_CONTEXT_LIMIT);
      expect(getModelContextLimit(undefined)).toBe(DEFAULT_CONTEXT_LIMIT);
      expect(getModelContextLimit(null)).toBe(DEFAULT_CONTEXT_LIMIT);
    });
  });
});
