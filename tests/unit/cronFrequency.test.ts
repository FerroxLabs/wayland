/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #163 — the footgun detector that steers users away from a minute-cadence cron
 * that spawns a new conversation every run.
 */

import { describe, it, expect } from 'vitest';
import { isEveryMinuteCronExpr, isNewConversationFootgun } from '../../src/common/cron/cronFrequency';

describe('isEveryMinuteCronExpr', () => {
  it('flags the every-minute shapes the issue calls out', () => {
    expect(isEveryMinuteCronExpr('* * * * *')).toBe(true);
    expect(isEveryMinuteCronExpr('*/1 * * * *')).toBe(true);
    expect(isEveryMinuteCronExpr('0-59/1 * * * *')).toBe(true);
  });

  it('flags a bare full-domain minute range (identical to *)', () => {
    expect(isEveryMinuteCronExpr('0-59 * * * *')).toBe(true);
  });

  it('does not flag lower-frequency schedules', () => {
    expect(isEveryMinuteCronExpr('*/5 * * * *')).toBe(false); // every 5 min
    expect(isEveryMinuteCronExpr('0 * * * *')).toBe(false); // hourly
    expect(isEveryMinuteCronExpr('30 9 * * *')).toBe(false); // daily 09:30
    expect(isEveryMinuteCronExpr('0 0 * * 0')).toBe(false); // weekly
    expect(isEveryMinuteCronExpr('0-30 * * * *')).toBe(false); // partial range, not every minute
    expect(isEveryMinuteCronExpr('10-20 * * * *')).toBe(false);
  });

  it('handles 6-field (leading seconds) expressions', () => {
    expect(isEveryMinuteCronExpr('* * * * * *')).toBe(true); // every second
    expect(isEveryMinuteCronExpr('*/1 * * * * *')).toBe(true); // every second
    expect(isEveryMinuteCronExpr('0 * * * * *')).toBe(true); // top of every minute
    expect(isEveryMinuteCronExpr('0 */5 * * * *')).toBe(false); // every 5 min
  });

  it('is safe on malformed / empty input', () => {
    expect(isEveryMinuteCronExpr('')).toBe(false);
    expect(isEveryMinuteCronExpr('* *')).toBe(false);
    expect(isEveryMinuteCronExpr('   ')).toBe(false);
  });
});

describe('isNewConversationFootgun', () => {
  it('is true only for cron + every-minute + new_conversation', () => {
    expect(isNewConversationFootgun('cron', '* * * * *', 'new_conversation')).toBe(true);
  });

  it('is false for reuse (existing) mode even at every-minute', () => {
    expect(isNewConversationFootgun('cron', '* * * * *', 'existing')).toBe(false);
  });

  it('is false for non-cron schedules', () => {
    expect(isNewConversationFootgun('every', '* * * * *', 'new_conversation')).toBe(false);
    expect(isNewConversationFootgun('at', undefined, 'new_conversation')).toBe(false);
  });

  it('is false for lower-frequency cron even with new_conversation', () => {
    expect(isNewConversationFootgun('cron', '*/10 * * * *', 'new_conversation')).toBe(false);
    expect(isNewConversationFootgun('cron', '0 9 * * *', 'new_conversation')).toBe(false);
  });
});
