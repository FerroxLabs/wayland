/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the model-availability error mapping (Issue #22). When a workflow
 * launches with a model the backend cannot serve, the dispatch layer must turn
 * the opaque backend rejection into a CLEAR, actionable error (which model,
 * which backend, that it is unavailable, pick another) instead of letting it
 * pass silently.
 */

import { describe, expect, it, vi } from 'vitest';

// Mock the main-process i18n module so the formatter resolves its English
// defaultValue with interpolation, without booting i18next.
vi.mock('@process/services/i18n', () => ({
  default: {
    t: (_key: string, opts: { model?: string; backend?: string; defaultValue?: string }) => {
      const template = opts.defaultValue ?? '';
      return template.replace(/\{\{model\}\}/g, opts.model ?? '').replace(/\{\{backend\}\}/g, opts.backend ?? '');
    },
  },
}));

import {
  looksLikeModelUnavailable,
  formatModelUnavailableError,
  mapDispatchErrorToModelUnavailable,
  ModelUnavailableError,
} from '@process/utils/modelAvailabilityError';

describe('looksLikeModelUnavailable', () => {
  it.each([
    'model_not_found',
    'The model `gpt-5.5-ultra` does not exist or you do not have access to it.',
    'Error: unknown model requested',
    'no such model: o9-pro',
    'This model is not available for your account',
    'You are not entitled to use this model',
    '无可用渠道',
    'MODEL_NOT_FOUND (uppercase still matches)',
  ])('classifies %j as a model-unavailable error', (msg) => {
    expect(looksLikeModelUnavailable(msg)).toBe(true);
  });

  it.each([
    '',
    '401 Unauthorized',
    'invalid api key',
    'Session start timed out',
    'ECONNREFUSED',
    'rate limit exceeded',
  ])('does NOT classify %j as a model-unavailable error', (msg) => {
    expect(looksLikeModelUnavailable(msg)).toBe(false);
  });
});

describe('formatModelUnavailableError', () => {
  it('names the model and backend and tells the user to pick another', () => {
    const msg = formatModelUnavailableError({ modelId: 'gpt-5.5-ultra', backend: 'codex' });
    expect(msg).toContain('gpt-5.5-ultra');
    expect(msg).toContain('codex');
    expect(msg.toLowerCase()).toContain('not available');
    expect(msg.toLowerCase()).toContain('pick a different model');
  });

  it('falls back to "unknown" for empty model/backend', () => {
    const msg = formatModelUnavailableError({ modelId: '', backend: '' });
    expect(msg).toContain('unknown');
  });
});

describe('mapDispatchErrorToModelUnavailable', () => {
  it('maps a model_not_found Error to a clear ModelUnavailableError', () => {
    const raw = new Error('Request failed: model_not_found');
    const mapped = mapDispatchErrorToModelUnavailable(raw, { modelId: 'gpt-5.5', backend: 'codex' });
    expect(mapped).toBeInstanceOf(ModelUnavailableError);
    expect(mapped?.modelId).toBe('gpt-5.5');
    expect(mapped?.backend).toBe('codex');
    expect(mapped?.cause).toBe(raw);
    // The clear message replaces the opaque raw text.
    expect(mapped?.message).toContain('gpt-5.5');
    expect(mapped?.message).toContain('codex');
    expect(mapped?.message).not.toBe(raw.message);
  });

  it('maps a string error too', () => {
    const mapped = mapDispatchErrorToModelUnavailable('the model `o9` does not exist or you do not have access', {
      modelId: 'o9',
      backend: 'openai',
    });
    expect(mapped).toBeInstanceOf(ModelUnavailableError);
  });

  it('returns null for a non-model error so the caller keeps the original', () => {
    const mapped = mapDispatchErrorToModelUnavailable(new Error('401 Unauthorized'), {
      modelId: 'gpt-5.5',
      backend: 'codex',
    });
    expect(mapped).toBeNull();
  });

  it('returns null for a timeout error', () => {
    const mapped = mapDispatchErrorToModelUnavailable(new Error('Session start timed out'), {
      modelId: 'opus',
      backend: 'claude',
    });
    expect(mapped).toBeNull();
  });
});
