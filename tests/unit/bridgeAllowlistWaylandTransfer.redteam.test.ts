/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { isAllowedForRemote, REMOTE_DENIED_KEYS } from '@/common/adapter/bridgeAllowlist';
import { describe, expect, it } from 'vitest';

describe('Wayland transfer remote boundary', () => {
  it('denies transfer discovery to paired WebUI callers', () => {
    expect(isAllowedForRemote('subscribe-waylandTransfer.preview')).toBe(false);
  });

  /**
   * MEMBERSHIP, not outcome. `waylandTransfer.preview` is named as an exact
   * denied key AND covered by the `waylandTransfer.` prefix, so the assertion
   * above passes whether or not the exact entry survives - deleting it leaves
   * this file green. The exact entry is the thing that keeps holding if the
   * prefix is ever narrowed, and only `.has` can pin that.
   */
  it('names the preview key EXACTLY, not only through the namespace prefix', () => {
    expect(REMOTE_DENIED_KEYS.has('waylandTransfer.preview')).toBe(true);
    // Control: `.has` discriminates. `waylandTransfer.export` is prefix-denied
    // above yet deliberately absent from the exact set, so a `.has` that
    // returned true for anything would fail here.
    expect(isAllowedForRemote('subscribe-waylandTransfer.export')).toBe(false);
    expect(REMOTE_DENIED_KEYS.has('waylandTransfer.export')).toBe(false);
  });

  it('fails closed for future transfer mutations through the namespace deny', () => {
    expect(isAllowedForRemote('subscribe-waylandTransfer.export')).toBe(false);
    expect(isAllowedForRemote('subscribe-waylandTransfer.import')).toBe(false);
  });
});
