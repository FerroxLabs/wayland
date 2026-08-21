/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A paired WebUI must never reach the artifact seam - and `artifacts.refresh`
 * is the newest door into it.
 *
 * `refresh` re-registers a file on the LOCAL disk as a verified deliverable.
 * The record it appends is what a later `artifacts.open` resolves into a path
 * handed to an OS launcher, so a remote caller able to refresh could re-point
 * the verified-bytes claim at whatever is sitting at that name now. It belongs
 * on the far side of the same wall as `artifacts.open` and `shell.`.
 *
 * WHY THE PREFIX IS PINNED BY A KEY THE EXACT SET DOES NOT CONTAIN. Asserting
 * that `isRemoteDeniedProviderKey('artifacts.refresh')` is true would pin
 * nothing on its own: an exact-key entry could supply that outcome while the
 * `artifacts.` PREFIX was deleted, and every OTHER artifact channel - including
 * ones added after this file - would silently open up. So the prefix is proven
 * by a channel nobody would ever add to the exact set, and the whole shipped
 * namespace is proven alongside it.
 *
 * An external audit on the previous milestone found a consent bypass that two
 * internal audits missed, through exactly this class of remote-reachable
 * surface. This is the standing guard for it.
 */

import '@/common/adapter/ipcBridge';
import { describe, expect, it } from 'vitest';
import { isAllowedForRemote, isRemoteDeniedProviderKey } from '@/common/adapter/bridgeAllowlist';

/** Every artifact channel the product ships, refresh included. */
const ARTIFACT_KEYS = [
  'artifacts.list',
  'artifacts.open',
  'artifacts.reveal',
  'artifacts.save-copy',
  'artifacts.series',
  'artifacts.open-target',
  'artifacts.refresh',
];

describe('the artifacts namespace is remote-denied, refresh included', () => {
  it.each(ARTIFACT_KEYS)('denies %s to a paired WebUI caller', (key) => {
    expect(isRemoteDeniedProviderKey(key)).toBe(true);
    // The WIRE form is what the dispatcher actually sees. `isAllowedForRemote`
    // takes the full inbound name and only `subscribe-` names carry capability,
    // so the bare key is NOT the question to ask it.
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
  });

  it('denies a name nobody has added yet, which is what proves the PREFIX', () => {
    // No exact-key entry can be supplying this outcome: this channel does not
    // exist. Only the `artifacts.` prefix can deny it, so if the prefix is ever
    // removed in favour of an exact list, this goes red while every shipped
    // channel above stays green.
    expect(isRemoteDeniedProviderKey('artifacts.a-channel-that-does-not-exist-yet')).toBe(true);
    expect(isAllowedForRemote('subscribe-artifacts.a-channel-that-does-not-exist-yet')).toBe(false);
  });

  it('still allows an ordinary read, so the denial is not "everything is denied"', () => {
    // The control, in the same wire form. Without it a denylist that denied
    // every provider on earth would pass this file.
    expect(isRemoteDeniedProviderKey('conversation.get')).toBe(false);
    expect(isAllowedForRemote('subscribe-conversation.get')).toBe(true);
  });
});
