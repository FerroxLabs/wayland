/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';
import { describe, expect, it } from 'vitest';

describe('Wayland transfer remote boundary', () => {
  it('denies transfer discovery to paired WebUI callers', () => {
    expect(isAllowedForRemote('subscribe-waylandTransfer.preview')).toBe(false);
  });

  it('fails closed for future transfer mutations through the namespace deny', () => {
    expect(isAllowedForRemote('subscribe-waylandTransfer.export')).toBe(false);
    expect(isAllowedForRemote('subscribe-waylandTransfer.import')).toBe(false);
  });
});
