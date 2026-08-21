/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A paired WebUI must never read or write the folder-grant list.
 *
 * `workspaceFolderGrants.add` mints an AI agent STANDING READ ACCESS to a
 * folder outside its workspace, `remove` withdraws it, and `list` discloses the
 * absolute path of every folder the user has ever consented to. An external
 * adversarial audit on the previous milestone reached exactly that grant from a
 * paired WebUI through the consent card, with nobody at the desktop window
 * (#1099). This surface is the same authority behind a different door.
 *
 * WHY MEMBERSHIP AND NOT OUTCOME. Asserting `isRemoteDeniedProviderKey(key)`
 * returns true pins NOTHING here: the `workspaceFolderGrants.` prefix supplies
 * that outcome on its own, so every exact key could be deleted from
 * `REMOTE_DENIED_KEYS` and the assertion would still pass. That is the exact
 * shape of the guard this repo keeps shipping and then finding deletable. The
 * two rules are therefore pinned separately and by their own mechanism: the
 * exact keys by SET MEMBERSHIP, and the prefix by a key the exact set does not
 * contain.
 */

import '@/common/adapter/ipcBridge';
import { describe, expect, it } from 'vitest';
import {
  REMOTE_DENIED_KEYS,
  _getRegisteredKeysForTests,
  isAllowedForRemote,
  isAllowedOutboundToRemote,
  isRemoteDeniedProviderKey,
} from '@/common/adapter/bridgeAllowlist';

/** Every channel the boundary-axis surface ships. */
const FOLDER_GRANT_KEYS = ['workspaceFolderGrants.list', 'workspaceFolderGrants.remove', 'workspaceFolderGrants.add'];

describe('REMOTE_DENIED_KEYS - the folder-grant channels are pinned by membership', () => {
  it.each(FOLDER_GRANT_KEYS)('%s is an EXACT denied key, not merely prefix-covered', (key) => {
    expect(
      REMOTE_DENIED_KEYS.has(key),
      `${key} must be listed exactly, so narrowing the prefix cannot re-open it`
    ).toBe(true);
  });

  /**
   * The set is a denylist, not an allowlist, so a membership assertion that
   * passed for EVERY string would be worthless. This proves it discriminates.
   */
  it('CONTROL: membership is not universal', () => {
    expect(REMOTE_DENIED_KEYS.has('workspaceFolderGrants.somethingNobodyShipped')).toBe(false);
    expect(REMOTE_DENIED_KEYS.has('conversation.get-list')).toBe(false);
  });

  /**
   * The one thing the exact keys cannot prove. A future channel added to this
   * namespace must be denied by OMISSION - the `waylandTransfer.` lesson, where
   * the enumerated-keys-only version left `engine-config-recovery.setPath`
   * remotely allowed. Deleting the prefix entry leaves this key reachable.
   */
  it('the whole namespace is denied by prefix, so a future channel is denied by omission', () => {
    const notEnumerated = 'workspaceFolderGrants.somethingNobodyShipped';
    expect(REMOTE_DENIED_KEYS.has(notEnumerated), 'fixture must not be in the exact set, or it proves nothing').toBe(
      false
    );
    expect(isRemoteDeniedProviderKey(notEnumerated)).toBe(true);
  });

  it('CONTROL: an ordinary provider key is still reachable from a remote peer', () => {
    // Without this the assertions above could pass because nothing at all is
    // remotely reachable.
    expect(isRemoteDeniedProviderKey('conversation.get-list')).toBe(false);
    expect(isAllowedForRemote('subscribe-conversation.get-list')).toBe(true);
  });
});

describe('the shipped channels are exactly the ones that are pinned', () => {
  const registered = (): string[] =>
    [..._getRegisteredKeysForTests().providers].filter((key) => key.startsWith('workspaceFolderGrants.')).sort();

  /**
   * Read off the LIVE bridge registration rather than retyped, so a denylist
   * naming `workspaceFolderGrants.remove` while the provider shipped as
   * `folderGrants.remove` cannot be green and useless - and so a channel added
   * to this namespace later fails here until someone pins it too.
   */
  it('the namespace as shipped is the namespace this file pins', () => {
    expect(registered()).toEqual([...FOLDER_GRANT_KEYS].sort());
  });

  it('every shipped channel is denied at the wire, where the WS dispatcher asks', () => {
    const keys = registered();
    // A namespace that stopped registering would make the loop below vacuous.
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(isAllowedForRemote(`subscribe-${key}`), key).toBe(false);
    }
  });
});

describe('a paired peer may not RECEIVE the namespace either', () => {
  it.each(FOLDER_GRANT_KEYS)('%s is denied outbound as well as inbound', (key) => {
    expect(isAllowedOutboundToRemote(key)).toBe(false);
  });

  it('CONTROL: an ordinary emitter still reaches a paired peer', () => {
    expect(isAllowedOutboundToRemote('conversation.get-list')).toBe(true);
  });
});
