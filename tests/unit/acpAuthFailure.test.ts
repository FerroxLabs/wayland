/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  looksLikeAuthFailure,
  classifyAcpAuthFailure,
} from '@renderer/pages/conversation/platforms/acp/acpAuthFailure';

describe('looksLikeAuthFailure', () => {
  it('matches genuine auth-failure signatures', () => {
    for (const msg of [
      'Invalid API key',
      'authentication failed',
      '认证失败',
      '[acp-auth-blocked] subscription login rejected',
      'OAuth token expired',
      'Unauthorized',
      'createSession returned an error',
    ]) {
      expect(looksLikeAuthFailure(msg)).toBe(true);
    }
  });

  it('matches HTTP 401 only as a standalone status code', () => {
    for (const msg of [
      '401 Unauthorized',
      'Error: 401',
      'request failed with status 401',
      'status=401',
      'HTTP/1.1 401 Unauthorized',
      '(401)',
      'code: 401.',
    ]) {
      expect(looksLikeAuthFailure(msg)).toBe(true);
    }
  });

  it('does NOT match a number that merely CONTAINS 401 (#624 regression guard)', () => {
    for (const msg of [
      'processed 40100 tokens',
      'context window used: 8401923 tokens',
      'job id 124015 failed to schedule',
      'retry after 4011 ms',
      'wrote 40160 bytes to disk',
      'rate limit: 24012 requests',
    ]) {
      expect(looksLikeAuthFailure(msg)).toBe(false);
    }
  });

  it('returns false for unrelated errors with no auth signal', () => {
    for (const msg of ['ECONNREFUSED', 'model not found', 'timeout after 30s', '']) {
      expect(looksLikeAuthFailure(msg)).toBe(false);
    }
  });
});

describe('classifyAcpAuthFailure', () => {
  it('returns a remedy for a real 401 auth failure', () => {
    const remedy = classifyAcpAuthFailure('claude', 'Error: 401 Unauthorized');
    expect(remedy).not.toBeNull();
    expect(remedy?.backend).toBe('claude');
    expect(remedy?.backendLabel).toBe('Claude Code');
  });

  it('returns null for a non-auth error whose numbers embed 401', () => {
    expect(classifyAcpAuthFailure('claude', 'streamed 40100 tokens then stopped')).toBeNull();
  });
});
