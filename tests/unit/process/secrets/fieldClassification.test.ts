/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  SENSITIVE_FIELD_NAMES,
  isSensitiveField,
} from '@process/secrets/fieldClassification';

describe('secrets/fieldClassification', () => {
  it('exports a non-empty list of sensitive field names', () => {
    expect(SENSITIVE_FIELD_NAMES.length).toBeGreaterThan(0);
    expect(SENSITIVE_FIELD_NAMES).toContain('token');
    expect(SENSITIVE_FIELD_NAMES).toContain('apiKey');
    expect(SENSITIVE_FIELD_NAMES).toContain('password');
  });

  it('matches canonical names exactly', () => {
    for (const name of SENSITIVE_FIELD_NAMES) {
      expect(isSensitiveField(name)).toBe(true);
    }
  });

  it('matches case-insensitively', () => {
    expect(isSensitiveField('TOKEN')).toBe(true);
    expect(isSensitiveField('Token')).toBe(true);
    expect(isSensitiveField('API_KEY')).toBe(true);
    expect(isSensitiveField('Password')).toBe(true);
  });

  it('matches substrings (per-plugin field-name prefixes)', () => {
    expect(isSensitiveField('slackBotToken')).toBe(true);
    expect(isSensitiveField('refresh_token')).toBe(true);
    expect(isSensitiveField('twilioAuthToken')).toBe(true);
    expect(isSensitiveField('user_api_key')).toBe(true);
  });

  it('returns false for non-sensitive fields', () => {
    expect(isSensitiveField('userId')).toBe(false);
    expect(isSensitiveField('displayName')).toBe(false);
    expect(isSensitiveField('chatId')).toBe(false);
    expect(isSensitiveField('teamId')).toBe(false);
    expect(isSensitiveField('phoneNumberId')).toBe(false);
  });
});
