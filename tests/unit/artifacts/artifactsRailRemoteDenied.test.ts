/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The `artifacts.` namespace must stay remote-denied.
 *
 * The rail is a new surface that WANTS this data, and the obvious way to make
 * it reachable from the paired WebUI is to take `artifacts.` out of the denied
 * prefixes. That would hand a remote caller the absolute path of every
 * workspace the user has (`list`), an OS launcher on the LOCAL machine
 * (`open`), and a local file write (`save-copy`).
 *
 * The rail is gated CLIENT-SIDE instead, the same way `/settings/wcore-config`
 * is. This test is the tripwire: remove the prefix and it goes red.
 */

import { describe, expect, it } from 'vitest';
import { isRemoteDeniedProviderKey } from '@/common/adapter/bridgeAllowlist';

describe('artifacts namespace remote denial', () => {
  it.each([
    'artifacts.list',
    'artifacts.open',
    'artifacts.reveal',
    'artifacts.save-copy',
    'artifacts.series',
    'artifacts.open-target',
    // Returns the bytes of a local file.
    'artifacts.preview',
    // Erases a ledger row, which is how a deliverable stops being findable.
    'artifacts.forget',
  ])('denies %s to a remote caller', (key) => {
    expect(isRemoteDeniedProviderKey(key)).toBe(true);
  });

  it('denies any future artifacts.* key added by the prefix, not by enumeration', () => {
    expect(isRemoteDeniedProviderKey('artifacts.some-verb-that-does-not-exist-yet')).toBe(true);
  });

  it('can find a known NEGATIVE, so a blanket true is not what is being asserted', () => {
    // Without this the suite would pass against an isRemoteDeniedProviderKey
    // that returned true for everything.
    expect(isRemoteDeniedProviderKey('conversation.get-workspace')).toBe(false);
  });
});
