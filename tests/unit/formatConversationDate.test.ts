/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { formatConversationDate } from '@renderer/utils/chat/timeline';

describe('formatConversationDate', () => {
  // Noon UTC so the calendar date is identical in every timezone (UTC-12..+14).
  const NOON_UTC_2024 = Date.UTC(2024, 0, 15, 12, 0, 0);

  it('returns an empty string for a missing/zero timestamp', () => {
    expect(formatConversationDate(0)).toBe('');
    expect(formatConversationDate(Number.NaN)).toBe('');
  });

  it('formats a valid timestamp as a non-empty absolute date', () => {
    expect(formatConversationDate(NOON_UTC_2024, 'en-US')).not.toBe('');
  });

  it('includes the year so the oldest chat is identifiable across years', () => {
    expect(formatConversationDate(NOON_UTC_2024, 'en-US')).toContain('2024');
  });

  it('is deterministic for the same input', () => {
    expect(formatConversationDate(NOON_UTC_2024, 'en-US')).toBe(formatConversationDate(NOON_UTC_2024, 'en-US'));
  });
});
