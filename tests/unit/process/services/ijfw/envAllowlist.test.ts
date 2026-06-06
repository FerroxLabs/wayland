/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildChildEnv } from '@process/services/ijfw/envAllowlist';

const ORIGINAL_ENV = { ...process.env };

describe('ijfw/envAllowlist', () => {
  beforeEach(() => {
    // Reset process.env to a known minimal state per test.
    for (const k of Object.keys(process.env)) delete process.env[k];
  });

  afterEach(() => {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, ORIGINAL_ENV);
  });

  it('forwards exact-listed env vars', () => {
    process.env.PATH = '/usr/bin';
    process.env.HOME = '/Users/test';
    process.env.NODE_ENV = 'test';
    process.env.TZ = 'UTC';
    const env = buildChildEnv();
    expect(env.PATH).toBe('/usr/bin');
    expect(env.HOME).toBe('/Users/test');
    expect(env.NODE_ENV).toBe('test');
    expect(env.TZ).toBe('UTC');
  });

  it('drops env vars not on the allowlist', () => {
    process.env.PATH = '/usr/bin';
    process.env.SECRET_TOKEN = 'leak-me';
    process.env.AWS_SECRET_ACCESS_KEY = 'aws-secret';
    const env = buildChildEnv();
    expect(env.PATH).toBe('/usr/bin');
    expect(env.SECRET_TOKEN).toBeUndefined();
    expect(env.AWS_SECRET_ACCESS_KEY).toBeUndefined();
  });

  it('forwards IJFW_AUTO_INSTALL, IJFW_HOME, IJFW_LOG_LEVEL exactly', () => {
    process.env.IJFW_AUTO_INSTALL = '1';
    process.env.IJFW_HOME = '/tmp/ijfw';
    process.env.IJFW_LOG_LEVEL = 'debug';
    const env = buildChildEnv();
    expect(env.IJFW_AUTO_INSTALL).toBe('1');
    expect(env.IJFW_HOME).toBe('/tmp/ijfw');
    expect(env.IJFW_LOG_LEVEL).toBe('debug');
  });

  it('drops IJFW_* keys not on the exact list (no prefix match)', () => {
    process.env.IJFW_AUTO_INSTALL = '1';
    process.env.IJFW_SECRET = 'should-be-stripped';
    process.env.IJFW_INTERNAL_TOKEN = 'should-be-stripped';
    const env = buildChildEnv();
    expect(env.IJFW_AUTO_INSTALL).toBe('1');
    expect(env.IJFW_SECRET).toBeUndefined();
    expect(env.IJFW_INTERNAL_TOKEN).toBeUndefined();
  });

  it('accepts extra keys that match the extra-key regex', () => {
    const env = buildChildEnv({ MY_VAR: 'value', X1: 'one' });
    expect(env.MY_VAR).toBe('value');
    expect(env.X1).toBe('one');
  });

  it('throws on extra keys with invalid characters', () => {
    expect(() => buildChildEnv({ 'my-var': 'value' })).toThrow(/invalid env key/);
    expect(() => buildChildEnv({ 'lowercase': 'value' })).toThrow(/invalid env key/);
    expect(() => buildChildEnv({ '1LEAD_DIGIT': 'value' })).toThrow(/invalid env key/);
  });

  it('extra keys override allowlisted ones', () => {
    process.env.NODE_ENV = 'production';
    const env = buildChildEnv({ NODE_ENV: 'override' });
    expect(env.NODE_ENV).toBe('override');
  });

  it('skips env vars with undefined values', () => {
    process.env.PATH = '/usr/bin';
    // `process.env` cannot easily store undefined - simulate by deleting.
    const env = buildChildEnv();
    expect(env.HOME).toBeUndefined();
  });
});
