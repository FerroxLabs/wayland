/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isLoopbackOrPrivateHost, isLocalBaseUrl, normalizeHostLiteral } from '@/common/utils/urlValidation';

// Finding 3: `normalizeHostLiteral` is the single canonical host normalizer,
// now exported here and reused by `validateBaseUrl.ts` (the previously-private
// duplicate copy was deleted). Lock its behavior so the convergence holds.
describe('normalizeHostLiteral', () => {
  it('lowercases and strips IPv6 brackets + zone ids', () => {
    expect(normalizeHostLiteral('LOCALHOST')).toBe('localhost');
    expect(normalizeHostLiteral('[::1]')).toBe('::1');
    expect(normalizeHostLiteral('[fe80::1%25eth0]')).toBe('fe80::1');
    expect(normalizeHostLiteral('127.0.0.1')).toBe('127.0.0.1');
  });
});

describe('isLoopbackOrPrivateHost', () => {
  it('classifies loopback hosts as local', () => {
    for (const host of ['localhost', '127.0.0.1', '127.5.5.5', '::1', '0.0.0.0']) {
      expect(isLoopbackOrPrivateHost(host), host).toBe(true);
    }
  });

  it('classifies RFC-1918 + link-local + ULA hosts as local', () => {
    for (const host of [
      '10.0.0.1',
      '172.16.5.4',
      '172.31.255.1',
      '192.168.1.10',
      '169.254.1.1',
      'fe80::1',
      'fd12::1',
    ]) {
      expect(isLoopbackOrPrivateHost(host), host).toBe(true);
    }
  });

  it('classifies public hosts as not local', () => {
    for (const host of ['api.openai.com', 'example.com', '8.8.8.8', '1.1.1.1', '172.32.0.1', '172.15.0.1']) {
      expect(isLoopbackOrPrivateHost(host), host).toBe(false);
    }
  });

  it('classifies cloud-metadata 169.254.169.254 as local (link-local range)', () => {
    // It IS in the link-local range, so this classifier returns true. The
    // separate assertSafeBaseUrl SSRF deny-list blocks it regardless - the two
    // checks are independent by design.
    expect(isLoopbackOrPrivateHost('169.254.169.254')).toBe(true);
  });

  it('strips IPv6 brackets and zone ids', () => {
    expect(isLoopbackOrPrivateHost('[::1]')).toBe(true);
    expect(isLoopbackOrPrivateHost('fe80::1%eth0')).toBe(true);
  });

  it('returns false for empty / non-string input', () => {
    expect(isLoopbackOrPrivateHost('')).toBe(false);
    expect(isLoopbackOrPrivateHost(undefined as unknown as string)).toBe(false);
  });
});

describe('isLocalBaseUrl', () => {
  it('returns true for local base URLs', () => {
    expect(isLocalBaseUrl('http://127.0.0.1:11434/v1')).toBe(true);
    expect(isLocalBaseUrl('http://localhost:1234/v1')).toBe(true);
    expect(isLocalBaseUrl('http://192.168.1.50:8080/v1')).toBe(true);
  });

  it('returns false for cloud base URLs', () => {
    expect(isLocalBaseUrl('https://api.openai.com/v1')).toBe(false);
    expect(isLocalBaseUrl('https://api.anthropic.com')).toBe(false);
  });

  it('fails closed for empty / unparseable input', () => {
    expect(isLocalBaseUrl('')).toBe(false);
    expect(isLocalBaseUrl(undefined)).toBe(false);
    expect(isLocalBaseUrl('not a url')).toBe(false);
  });
});
