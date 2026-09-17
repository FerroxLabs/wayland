// tests/unit/process/acp/errors/errorNormalize.test.ts

import { describe, it, expect } from 'vitest';
import { normalizeError } from '@process/acp/errors/errorNormalize';
import { AcpError } from '@process/acp/errors/AcpError';
import { RequestError } from '@agentclientprotocol/sdk';

describe('normalizeError', () => {
  it('passes through AcpError unchanged', () => {
    const err = new AcpError('QUEUE_FULL', 'full');
    expect(normalizeError(err)).toBe(err);
  });

  it('normalizes connection refused to CONNECTION_FAILED (retryable)', () => {
    const err = new Error('connect ECONNREFUSED');
    (err as NodeJS.ErrnoException).code = 'ECONNREFUSED';
    const result = normalizeError(err);
    expect(result.code).toBe('CONNECTION_FAILED');
    expect(result.retryable).toBe(true);
  });

  it('normalizes ACP -32001 to ACP_SESSION_NOT_FOUND', () => {
    const err = { code: -32001, message: 'Session not found' };
    const result = normalizeError(err);
    expect(result.code).toBe('ACP_SESSION_NOT_FOUND');
    expect(result.retryable).toBe(false);
  });

  it('normalizes ACP -32603 to AGENT_INTERNAL_ERROR (retryable)', () => {
    const err = { code: -32603, message: 'Internal error' };
    const result = normalizeError(err);
    expect(result.code).toBe('AGENT_INTERNAL_ERROR');
    expect(result.retryable).toBe(true);
  });

  it('normalizes auth_required to AUTH_REQUIRED (retryable)', () => {
    const err = { code: -32000, message: 'auth_required' };
    const result = normalizeError(err);
    expect(result.code).toBe('AUTH_REQUIRED');
    expect(result.retryable).toBe(true);
  });

  it('normalizes unknown error to INTERNAL_ERROR', () => {
    const result = normalizeError('random string');
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.retryable).toBe(false);
  });

  it('folds string `data` detail into a bare "Internal error" message (#69)', () => {
    const err = { code: -32603, message: 'Internal error', data: 'Model metadata not found for gpt-9' };
    const result = normalizeError(err);
    expect(result.code).toBe('AGENT_INTERNAL_ERROR');
    expect(result.message).toContain('Internal error');
    expect(result.message).toContain('Model metadata not found for gpt-9');
  });

  it('folds object `data` detail as JSON when present', () => {
    const err = { code: -32603, message: 'Internal error', data: { reason: 'corrupted_index' } };
    const result = normalizeError(err);
    expect(result.message).toContain('corrupted_index');
  });

  it('folds a typed `data.message` (Fuigo 1.0.18+) as words, not as JSON', () => {
    const err = {
      code: -32603,
      message: 'Internal error',
      data: { message: 'empty response from model (reasoning_only)', error_kind: 'empty_response' },
    };
    const result = normalizeError(err);
    expect(result.message).toBe('Internal error: empty response from model (reasoning_only)');
    expect(result.message).not.toContain('error_kind');
  });

  it('keeps a Fuigo 1.0.18+ cancellation as a cancellation, never an auth prompt', () => {
    // 1.0.16 answered a cancelled model request with -32000, which normalizes to
    // AUTH_REQUIRED and tears the session down for a re-login. 1.0.18 retyped it.
    const err = {
      code: -32800,
      message: 'request cancelled',
      data: { message: 'request cancelled', error_kind: 'cancelled' },
    };
    const result = normalizeError(err);
    expect(result.code).toBe('ACP_REQ_CANCELLED');
    expect(result.retryable).toBe(false);
  });

  it('leaves the message unchanged when there is no extra detail', () => {
    const err = { code: -32603, message: 'Internal error' };
    const result = normalizeError(err);
    expect(result.message).toBe('Internal error');
  });

  it('does not duplicate detail already present in the message', () => {
    const err = { code: -32602, message: 'Invalid params: bad model', data: 'bad model' };
    const result = normalizeError(err);
    expect(result.message).toBe('Invalid params: bad model');
  });
});

/**
 * Fuigo 1.0.18 answers a failed turn with object data `{ message, error_kind, http_status? }`
 * (<= 1.0.17 sent a bare string, or `{ message, http_status }` when a status was known).
 * People see `data.message`, never the object; the typed fields travel on the AcpError.
 */
describe('normalizeError - typed engine error data (Fuigo 1.0.18)', () => {
  const internal = (data: unknown) => new RequestError(-32603, 'Internal error', data);

  it('shows data.message, not raw JSON, for object data with a string message', () => {
    const result = normalizeError(
      internal({
        message: 'empty response from model (reasoning_only): model=m, had_reasoning=true, finish_reason=stop',
        error_kind: 'empty_response',
      })
    );
    expect(result.code).toBe('AGENT_INTERNAL_ERROR');
    expect(result.message).toBe(
      'Internal error: empty response from model (reasoning_only): model=m, had_reasoning=true, finish_reason=stop'
    );
    expect(result.message).not.toContain('{');
    expect(result.message).not.toContain('error_kind');
  });

  it('carries error_kind and http_status as typed fields instead of message text', () => {
    const result = normalizeError(
      internal({ message: 'upstream request failed', error_kind: 'api', http_status: 503 })
    );
    expect(result.errorKind).toBe('api');
    expect(result.httpStatus).toBe(503);
    expect(result.message).toBe('Internal error: upstream request failed');
  });

  it('reads the typed fields on the legacy payload path too', () => {
    const result = normalizeError({
      code: -32603,
      message: 'Internal error',
      data: { message: 'No response from model for 90s', error_kind: 'idle_timeout' },
    });
    expect(result.errorKind).toBe('idle_timeout');
    expect(result.httpStatus).toBeUndefined();
    expect(result.message).toBe('Internal error: No response from model for 90s');
  });

  it('strips control characters from data.message', () => {
    const result = normalizeError(
      internal({ message: 'bad\u0000 things\u001b[31m\nhappened\u007f\u0085', error_kind: 'api' })
    );
    expect(result.message).toBe('Internal error: bad things [31m happened');
  });

  it('bounds the length of data.message', () => {
    const result = normalizeError(internal({ message: 'x'.repeat(5000), error_kind: 'api' }));
    const detail = result.message.slice('Internal error: '.length);
    expect(detail.length).toBeLessThanOrEqual(1000);
    expect(detail.length).toBeGreaterThan(500);
    expect(detail.endsWith('\u2026')).toBe(true);
  });

  it('shows no JSON when data.message is empty', () => {
    const result = normalizeError(internal({ message: '   ', error_kind: 'empty_response' }));
    expect(result.message).toBe('Internal error');
    expect(result.errorKind).toBe('empty_response');
  });

  it('keeps plain-string data exactly as before (Fuigo <= 1.0.17)', () => {
    const result = normalizeError(internal('  empty response from model (reasoning_only)  '));
    expect(result.message).toBe('Internal error: empty response from model (reasoning_only)');
    expect(result.errorKind).toBeUndefined();
    expect(result.httpStatus).toBeUndefined();
  });

  it('keeps JSON for object data without a string message', () => {
    const result = normalizeError(internal({ message: 42, reason: 'x' }));
    expect(result.message).toBe('Internal error: {"message":42,"reason":"x"}');
  });

  it('ignores a malformed error_kind or http_status', () => {
    const result = normalizeError(internal({ message: 'm', error_kind: 7, http_status: '503' }));
    expect(result.errorKind).toBeUndefined();
    expect(result.httpStatus).toBeUndefined();
  });
});

/**
 * `data.message` is rendered by an agent we do not control and lands in the chat verbatim, so the invisible
 * characters that let text lie about itself — bidi overrides and isolates, zero-width joiners and marks, the
 * BOM — come out alongside control characters. A plain-string `data` is untouched, as it always was.
 */
describe('normalizeError - invisible characters in data.message', () => {
  const internal = (data: unknown) => new RequestError(-32603, 'Internal error', data);

  it('strips bidi overrides and isolates', () => {
    const result = normalizeError(
      internal({
        message: 'delete ‮gnp.txt‬ now ⁦and⁩ later',
        error_kind: 'api',
      })
    );
    expect(result.message).toBe('Internal error: delete gnp.txt now and later');
  });

  it('strips zero-width characters and the BOM', () => {
    const result = normalizeError(internal({ message: '﻿upstream​ request‍ failed‎', error_kind: 'api' }));
    expect(result.message).toBe('Internal error: upstream request failed');
  });

  it('leaves plain-string data exactly as the agent sent it', () => {
    const result = normalizeError(internal('upstream​ request ‮failed'));
    expect(result.message).toBe('Internal error: upstream​ request ‮failed');
  });
});

/**
 * Replay decisions used to read the JSON that `withErrorDetail` folded into the message. Now that the
 * message shows `data.message` instead, the pre-sanitisation text travels on the error so those decisions
 * can keep matching exactly what they matched before — and nothing else.
 */
describe('normalizeError - rawMessage carries the pre-sanitisation text', () => {
  const internal = (data: unknown) => new RequestError(-32603, 'Internal error', data);

  it('is the message the base rendered, JSON and all', () => {
    const result = normalizeError(internal({ message: 'connection\nreset by peer', error_kind: 'api' }));
    expect(result.message).toBe('Internal error: connection reset by peer');
    expect(result.rawMessage).toBe('Internal error: {"message":"connection\\nreset by peer","error_kind":"api"}');
  });

  it('is the plain message when there is no data to fold in', () => {
    const result = normalizeError(new RequestError(-32603, 'Internal error'));
    expect(result.rawMessage).toBe('Internal error');
  });

  it('is present on the legacy payload path too', () => {
    const result = normalizeError({
      code: -32603,
      message: 'Internal error',
      data: { message: 'upstream request failed', error_kind: 'api', http_status: 503 },
    });
    expect(result.rawMessage).toContain('"http_status":503');
  });
});
