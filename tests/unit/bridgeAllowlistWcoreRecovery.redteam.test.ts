/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';

describe('isAllowedForRemote - wcoreRecovery.* is local-only (#1116)', () => {
  it('denies inspection and interrupted-turn mutation to remote callers', () => {
    expect(isAllowedForRemote('subscribe-wcoreRecovery.get')).toBe(false);
    expect(isAllowedForRemote('subscribe-wcoreRecovery.abandon')).toBe(false);
  });

  it('denies future recovery providers by namespace', () => {
    expect(isAllowedForRemote('subscribe-wcoreRecovery.retry')).toBe(false);
    expect(isAllowedForRemote('subscribe-wcoreRecovery.')).toBe(false);
  });

  it('does not deny neighboring or ordinary conversation providers', () => {
    expect(isAllowedForRemote('subscribe-wcoreRecoveryOther.get')).toBe(true);
    expect(isAllowedForRemote('subscribe-conversation.get-list')).toBe(true);
  });
});
