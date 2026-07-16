/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';
import { describe, expect, it } from 'vitest';

describe('workspace retention preview remote boundary', () => {
  it('denies the local-path projection to paired WebUI callers', () => {
    const wireName = 'subscribe-workspaceRetention.preview';
    expect(isAllowedForRemote(wireName)).toBe(false);
  });
});
