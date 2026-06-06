/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  detectErrorKind,
  extractErrorCode,
  formatErrorMessage,
  hasErrnoCode,
  HttpStatusError,
  isErrno,
  isTransient,
  parseRetryAfter,
  retryAfterFromError,
} from '@process/utils/channel-errors';

describe('extractErrorCode', () => {
  it.each([
    { value: { code: 'EADDRINUSE' }, expected: 'EADDRINUSE' },
    { value: { code: 429 }, expected: '429' },
    { value: { code: false }, expected: undefined },
    { value: 'boom', expected: undefined },
    { value: null, expected: undefined },
  ])('extracts code from %j', ({ value, expected }) => {
    expect(extractErrorCode(value)).toBe(expected);
  });
});

describe('isErrno / hasErrnoCode', () => {
  it('matches errno-shaped errors', () => {
    const err = Object.assign(new Error('busy'), { code: 'EADDRINUSE' });
    expect(isErrno(err)).toBe(true);
    expect(hasErrnoCode(err, 'EADDRINUSE')).toBe(true);
    expect(hasErrnoCode(err, 'ENOENT')).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(isErrno('busy')).toBe(false);
    expect(isErrno(undefined)).toBe(false);
  });
});

describe('formatErrorMessage', () => {
  it('walks .cause chain so wrapped network errors are visible', () => {
    const rootCause = new Error('ECONNRESET');
    const httpError = Object.assign(new Error("Network request for 'sendMessage' failed!"), {
      cause: rootCause,
    });
    const formatted = formatErrorMessage(httpError);
    expect(formatted).toContain("Network request for 'sendMessage' failed!");
    expect(formatted).toContain('ECONNRESET');
  });

  it('handles circular .cause references without infinite loop', () => {
    const a: Error & { cause?: unknown } = new Error('error A');
    const b: Error & { cause?: unknown } = new Error('error B');
    a.cause = b;
    b.cause = a;
    expect(formatErrorMessage(a)).toBe('error A | error B');
  });

  it.each([
    { value: 'plain string', expected: 'plain string' },
    { value: false, expected: 'false' },
    { value: 42, expected: '42' },
  ])('formats primitive %j', ({ value, expected }) => {
    expect(formatErrorMessage(value)).toBe(expected);
  });

  it('formats bigint values', () => {
    expect(formatErrorMessage(BigInt(123))).toBe('123');
  });
});

describe('detectErrorKind', () => {
  it.each([
    { value: new Error('Unhandled stop reason: refusal_policy'), expected: 'refusal' },
    {
      value: Object.assign(new Error('request timed out'), { code: 'ETIMEDOUT' }),
      expected: 'timeout',
    },
    {
      value: Object.assign(new Error('Too many requests'), { code: 429 }),
      expected: 'rate_limit',
    },
    {
      value: new Error('context_window exceeded with too many tokens'),
      expected: 'context_length',
    },
    { value: new Error('plain provider failure'), expected: undefined },
    { value: undefined, expected: undefined },
  ] as const)('classifies case %#', ({ value, expected }) => {
    expect(detectErrorKind(value)).toBe(expected);
  });
});

describe('HttpStatusError', () => {
  it('carries status, message, retry-after, and cause', () => {
    const cause = new Error('socket hang up');
    const err = new HttpStatusError(429, 'Rate limited', { retryAfterSeconds: 17, cause });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('HttpStatusError');
    expect(err.status).toBe(429);
    expect(err.message).toBe('Rate limited');
    expect(err.retryAfterSeconds).toBe(17);
    expect(err.cause).toBe(cause);
  });

  it('omits retry-after when not provided', () => {
    const err = new HttpStatusError(500, 'boom');
    expect(err.retryAfterSeconds).toBeUndefined();
  });
});

describe('parseRetryAfter', () => {
  it('parses seconds form', () => {
    expect(parseRetryAfter('30')).toBe(30);
    expect(parseRetryAfter('0')).toBe(0);
    expect(parseRetryAfter('  42 ')).toBe(42);
  });

  it('parses HTTP-date form relative to now', () => {
    const now = Date.parse('2026-05-17T12:00:00Z');
    const future = new Date(now + 90_000).toUTCString();
    expect(parseRetryAfter(future, now)).toBe(90);
  });

  it('floors negative dates at 0', () => {
    const now = Date.parse('2026-05-17T12:00:00Z');
    const past = new Date(now - 60_000).toUTCString();
    expect(parseRetryAfter(past, now)).toBe(0);
  });

  it.each([
    { value: null },
    { value: undefined },
    { value: '' },
    { value: '   ' },
    { value: 'not a date' },
  ])('returns undefined for %j', ({ value }) => {
    expect(parseRetryAfter(value)).toBeUndefined();
  });
});

describe('isTransient', () => {
  it('flags retryable HTTP statuses', () => {
    for (const status of [408, 425, 429, 500, 502, 503, 504]) {
      expect(isTransient(new HttpStatusError(status, 'x'))).toBe(true);
    }
  });

  it('rejects non-retryable HTTP statuses', () => {
    for (const status of [400, 401, 403, 404, 422, 501]) {
      expect(isTransient(new HttpStatusError(status, 'x'))).toBe(false);
    }
  });

  it('flags transient errno codes', () => {
    for (const code of ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED']) {
      expect(isTransient(Object.assign(new Error('net'), { code }))).toBe(true);
    }
  });

  it('rejects non-transient errno codes', () => {
    expect(isTransient(Object.assign(new Error('x'), { code: 'EACCES' }))).toBe(false);
    expect(isTransient(Object.assign(new Error('x'), { code: 'ENOENT' }))).toBe(false);
  });

  it('flags rate_limit and timeout via kind detection', () => {
    expect(isTransient(new Error('rate limit exceeded'))).toBe(true);
    expect(isTransient(new Error('request timeout'))).toBe(true);
  });

  it('does not flag refusal or context_length as transient', () => {
    expect(isTransient(new Error('content_filter triggered'))).toBe(false);
    expect(isTransient(new Error('context_window exceeded'))).toBe(false);
  });

  it('rejects unknown errors', () => {
    expect(isTransient(new Error('weird provider bug'))).toBe(false);
    expect(isTransient(undefined)).toBe(false);
    expect(isTransient(null)).toBe(false);
  });
});

describe('retryAfterFromError', () => {
  it('prefers HttpStatusError.retryAfterSeconds', () => {
    const err = new HttpStatusError(429, 'slow down', { retryAfterSeconds: 12 });
    expect(retryAfterFromError(err)).toBe(12);
  });

  it('falls back to headers["retry-after"] on arbitrary errors', () => {
    const err = Object.assign(new Error('429'), { headers: { 'retry-after': '7' } });
    expect(retryAfterFromError(err)).toBe(7);
  });

  it('reads capitalized Retry-After header', () => {
    const err = Object.assign(new Error('429'), { headers: { 'Retry-After': '4' } });
    expect(retryAfterFromError(err)).toBe(4);
  });

  it('parses HTTP-date headers', () => {
    const now = Date.parse('2026-05-17T12:00:00Z');
    const future = new Date(now + 45_000).toUTCString();
    const err = Object.assign(new Error('429'), { headers: { 'retry-after': future } });
    expect(retryAfterFromError(err, now)).toBe(45);
  });

  it('returns undefined when no hint is present', () => {
    expect(retryAfterFromError(new Error('boom'))).toBeUndefined();
    expect(retryAfterFromError(new HttpStatusError(503, 'down'))).toBeUndefined();
    expect(retryAfterFromError(undefined)).toBeUndefined();
  });
});
