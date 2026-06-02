/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import { validateProviderBaseUrl } from '@process/providers/sources/validateBaseUrl';

describe('validateProviderBaseUrl', () => {
  const original = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it('accepts a public https url', () => {
    expect(validateProviderBaseUrl('https://api.openai.com/v1')).toEqual({ ok: true });
    expect(validateProviderBaseUrl('https://example.com')).toEqual({ ok: true });
  });

  it('rejects http in production', () => {
    process.env.NODE_ENV = 'production';
    const result = validateProviderBaseUrl('http://localhost:8080/v1');
    expect(result.ok).toBe(false);
  });

  it('accepts http://localhost and http://127.0.0.1 in dev', () => {
    process.env.NODE_ENV = 'development';
    expect(validateProviderBaseUrl('http://localhost:1234/v1')).toEqual({ ok: true });
    expect(validateProviderBaseUrl('http://127.0.0.1:1234/v1')).toEqual({ ok: true });
  });

  it('rejects https pointed at private-IP / loopback / link-local literals', () => {
    for (const url of [
      'https://10.0.0.1/v1',
      'https://172.16.5.4/v1',
      'https://192.168.1.1/v1',
      'https://169.254.1.1/v1',
      'https://127.0.0.1/v1',
      'https://[::1]/v1',
      'https://[fc00::1]/v1',
      'https://[fe80::1]/v1',
      'https://localhost/v1',
    ]) {
      const result = validateProviderBaseUrl(url);
      expect(result.ok, `expected ${url} to be rejected`).toBe(false);
    }
  });

  it('rejects garbage and non-http(s) schemes', () => {
    expect(validateProviderBaseUrl('not a url').ok).toBe(false);
    expect(validateProviderBaseUrl('').ok).toBe(false);
    expect(validateProviderBaseUrl('ftp://example.com').ok).toBe(false);
    expect(validateProviderBaseUrl('file:///etc/passwd').ok).toBe(false);
    expect(validateProviderBaseUrl('javascript:alert(1)').ok).toBe(false);
  });
});
