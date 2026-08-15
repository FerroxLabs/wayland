// tests/unit/process/acp/errors/nanoErrorCodes.test.ts

/**
 * C7: the generated nano error-code module (src/common/types/nanoErrorCodes.ts)
 * is a DATA-ONLY artifact of the Rust table (wayland-nano repo,
 * crates/nano-protocol/src/error_codes.rs). This suite pins:
 *  1. TS ≡ JSON parity (the two generated artifacts cannot drift apart);
 *  2. normalizeError's nano-typed classification: the typed retryable flag
 *     OVERRIDES the numeric-code map for nano-tagged errors, unknown kinds
 *     classify terminal, and untagged third-party errors keep the legacy
 *     heuristics untouched.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NANO_ERROR_SPECS, NANO_ERROR_BY_KIND } from '@/common/types/nanoErrorCodes';
import { normalizeError, nanoErrorKindOf } from '@process/acp/errors/errorNormalize';
import { AcpError } from '@process/acp/errors/AcpError';

describe('nanoErrorCodes generated artifact', () => {
  it('is byte-identical in content to the JSON snapshot (parity)', () => {
    const json = JSON.parse(readFileSync(join(process.cwd(), 'src/common/types/nano-error-codes.json'), 'utf8')) as {
      errors: unknown[];
    };
    expect(NANO_ERROR_SPECS).toEqual(json.errors);
  });

  it('indexes every kind exactly once', () => {
    expect(Object.keys(NANO_ERROR_BY_KIND)).toHaveLength(NANO_ERROR_SPECS.length);
    for (const spec of NANO_ERROR_SPECS) {
      expect(NANO_ERROR_BY_KIND[spec.kind]).toBe(spec);
    }
  });
});

describe('normalizeError — nano-typed payloads (C7)', () => {
  it('journal_unavailable overrides the -32603 retryable default (terminal)', () => {
    // The numeric map classifies every -32603 as retryable; a persistent
    // storage failure must NOT auto-retry.
    const err = {
      code: -32603,
      message: 'Session storage unavailable',
      data: { nanoError: { kind: 'journal_unavailable', retryable: false } },
    };
    const result = normalizeError(err);
    expect(result.code).toBe('AGENT_INTERNAL_ERROR');
    expect(result.retryable).toBe(false);
    expect(result.nanoError).toEqual({ kind: 'journal_unavailable', retryable: false });
  });

  it('model_rate_limited keeps its typed retryable flag', () => {
    const err = {
      code: -32603,
      message: 'Rate limited',
      data: { nanoError: { kind: 'model_rate_limited', retryable: true, retry_after_ms: 1500 } },
    };
    const result = normalizeError(err);
    expect(result.retryable).toBe(true);
    expect(result.nanoError?.kind).toBe('model_rate_limited');
  });

  it('a kind from the future classifies TERMINAL even when it claims retryable', () => {
    const err = {
      code: -32603,
      message: 'mystery',
      data: { nanoError: { kind: 'kind_from_the_future', retryable: true } },
    };
    const result = normalizeError(err);
    expect(result.retryable).toBe(false);
    expect(result.nanoError?.kind).toBe('kind_from_the_future');
  });

  it('untagged -32603 keeps the legacy numeric-map behavior (third-party agents)', () => {
    const result = normalizeError({ code: -32603, message: 'Internal error' });
    expect(result.retryable).toBe(true);
    expect(result.nanoError).toBeUndefined();
  });

  it('malformed nanoError payloads are ignored (fail-closed parsing)', () => {
    const result = normalizeError({
      code: -32603,
      message: 'Internal error',
      data: { nanoError: { kind: 42, retryable: 'yes' } },
    });
    expect(result.retryable).toBe(true); // legacy map, payload discarded
    expect(result.nanoError).toBeUndefined();
  });
});

describe('nanoErrorKindOf', () => {
  it('reads the normalized AcpError field', () => {
    const err = new AcpError('ACP_INVALID_PARAMS', 'model_not_found: x', {
      nanoError: { kind: 'model_not_found', retryable: false },
    });
    expect(nanoErrorKindOf(err)).toBe('model_not_found');
  });

  it('reads a raw JSON-RPC data.nanoError shape', () => {
    expect(nanoErrorKindOf({ data: { nanoError: { kind: 'model_not_found', retryable: false } } })).toBe(
      'model_not_found'
    );
  });

  it('returns undefined for untagged errors', () => {
    expect(nanoErrorKindOf(new Error('plain'))).toBeUndefined();
    expect(nanoErrorKindOf('nope')).toBeUndefined();
  });
});
