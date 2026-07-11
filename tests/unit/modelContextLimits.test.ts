/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONTEXT_LIMIT,
  getModelContextLimit,
  resolveModelContextLimit,
} from '@/renderer/utils/model/modelContextLimits';

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

describe('resolveModelContextLimit (issue #733)', () => {
  const M = 1_000_000;
  const K200 = 200_000;

  it('prefers the registry catalog window over the static table', () => {
    // The reported bug: the picker (registry catalog) showed the correct 1M
    // window while the usage indicator resolved the same model to a different
    // number through the static table. The catalog value must win in both
    // directions: table-says-200K/catalog-says-1M and vice versa.
    expect(resolveModelContextLimit(new Map([['claude-opus-4-5', M]]), 'claude-opus-4-5')).toBe(M);
    expect(resolveModelContextLimit(new Map([['claude-opus-4-6', K200]]), 'claude-opus-4-6')).toBe(K200);
  });

  it('resolves a brand-new model id the static table has never heard of', () => {
    const catalog = new Map([['some-new-model-2027', 524_288]]);
    expect(resolveModelContextLimit(catalog, 'some-new-model-2027')).toBe(524_288);
  });

  it('matches catalog ids case-insensitively on the lookup side', () => {
    const catalog = new Map([['claude-opus-4-6', M]]);
    expect(resolveModelContextLimit(catalog, 'Claude-Opus-4-6')).toBe(M);
  });

  it('falls back to the static table when the catalog has no entry', () => {
    const catalog = new Map([['unrelated-model', M]]);
    expect(resolveModelContextLimit(catalog, 'claude-opus-4-5')).toBe(K200);
    expect(resolveModelContextLimit(new Map(), 'claude-haiku-4-5-20251001')).toBe(K200);
  });

  it('ignores zero/invalid catalog windows and falls back', () => {
    const catalog = new Map([['claude-opus-4-5', 0]]);
    expect(resolveModelContextLimit(catalog, 'claude-opus-4-5')).toBe(K200);
  });

  it('keeps the default for undefined/empty model ids', () => {
    const catalog = new Map([['claude-opus-4-6', M]]);
    expect(resolveModelContextLimit(catalog, undefined)).toBe(DEFAULT_CONTEXT_LIMIT);
    expect(resolveModelContextLimit(catalog, null)).toBe(DEFAULT_CONTEXT_LIMIT);
    expect(resolveModelContextLimit(catalog, '')).toBe(DEFAULT_CONTEXT_LIMIT);
  });
});

/**
 * #733: the Claude Code ACP backend has no session/set_model, so it reports its
 * current model as a bare SLOT alias (`opus`/`sonnet`/`haiku`, see
 * CLAUDE_SLOT_MODELS) rather than a catalog id. Those slots previously matched
 * nothing - not the registry catalog (real ids) and not the static table (the
 * fuzzy match is `id.includes(key)`, and 'opus'.includes('claude-opus-4') is
 * false) - so EVERY Claude slot silently fell back to DEFAULT_CONTEXT_LIMIT
 * (1M). Haiku, a 200K model, showed a 1M denominator.
 */
describe('Claude ACP slot aliases resolve to a real window (#733)', () => {
  it('resolves the opus slot to the 1M window (--model opus -> claude-opus-4-8)', () => {
    expect(getModelContextLimit('opus')).toBe(1_000_000);
  });

  // `sonnet` is deliberately NOT in the table: which Sonnet the alias resolves to
  // (4.6 = 1M vs 4.5/4.0 = 200K) is unverified, and guessing 1M would show an
  // over-sized max for a 200K model. It must keep falling through to the default.
  it('leaves the UNVERIFIED sonnet slot on the default rather than guessing', () => {
    expect(getModelContextLimit('sonnet')).toBe(DEFAULT_CONTEXT_LIMIT);
  });

  // The slot rows duplicate a family row's literal; pin them so they cannot drift.
  it('keeps the slot rows in lockstep with the model they alias', () => {
    expect(getModelContextLimit('opus')).toBe(getModelContextLimit('claude-opus-4-8'));
    expect(getModelContextLimit('haiku')).toBe(getModelContextLimit('claude-haiku-4-5'));
  });

  it('resolves the haiku slot to 200K - NOT the 1M default', () => {
    expect(getModelContextLimit('haiku')).toBe(200_000);
    expect(getModelContextLimit('haiku')).not.toBe(DEFAULT_CONTEXT_LIMIT);
  });

  // The slot keys are short; longest-match must still let a full catalog id win
  // so they can never shadow a real model's window.
  it('does not let the short slot keys shadow full catalog ids', () => {
    expect(getModelContextLimit('claude-3-opus')).toBe(200_000);
    expect(getModelContextLimit('claude-opus-4-5')).toBe(200_000);
    expect(getModelContextLimit('claude-3-5-sonnet')).toBe(200_000);
    expect(getModelContextLimit('claude-haiku-4-5')).toBe(200_000);
    expect(getModelContextLimit('claude-opus-4-8')).toBe(1_000_000);
  });
});
