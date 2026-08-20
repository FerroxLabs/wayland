/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-9 remote boundary.
 *
 * A paired-device WebSocket token proves a REMOTE BROWSER, not the local
 * trusted user. `artifacts.open` reaches an OS launcher on the LOCAL machine,
 * and `artifacts.list` and `artifacts.series` enumerate the absolute paths of
 * the user's workspaces - a launcher and a reconnaissance aid respectively.
 * Neither has any remote surface, so the whole namespace is denied, the same
 * way `shell.` is.
 *
 * This is a redteam test: it exists to fail if someone later adds an
 * `artifacts.*` capability and forgets the boundary.
 */

import '@/common/adapter/ipcBridge';
import {
  _getRegisteredKeysForTests,
  isAllowedForRemote,
  isAllowedOutboundToRemote,
  isRemoteDeniedProviderKey,
  REMOTE_DENIED_KEYS,
} from '@/common/adapter/bridgeAllowlist';
import { describe, expect, it } from 'vitest';

describe('artifact seam remote boundary', () => {
  it('denies EVERY registered artifacts.* capability to paired WebUI callers', () => {
    const capabilities = [..._getRegisteredKeysForTests().providers].filter((key) => key.startsWith('artifacts.'));
    expect(capabilities.length).toBeGreaterThan(0);
    for (const key of capabilities) {
      expect(isAllowedForRemote(`subscribe-${key}`), `${key} must be remote-denied`).toBe(false);
    }
  });

  it('registers exactly the capabilities the surface needs, and no generic open', () => {
    // The enumeration is the point: it fails the moment an `artifacts.*` key is
    // added, so the boundary above is re-examined rather than inherited by
    // accident. `series` enumerates canonical paths exactly as `list` does, and
    // `open-target` reads the OS handler for one of them - both are the same
    // local-only class as the rest of the namespace.
    const capabilities = [..._getRegisteredKeysForTests().providers]
      .filter((key) => key.startsWith('artifacts.'))
      .toSorted();
    expect(capabilities).toEqual([
      'artifacts.list',
      'artifacts.open',
      'artifacts.open-target',
      'artifacts.reveal',
      'artifacts.save-copy',
      'artifacts.send-targets',
      'artifacts.send-to',
      'artifacts.series',
    ]);
  });

  /**
   * The send pair is a different CLASS to the rest of the namespace.
   *
   * Everything else here ends on the local machine - a launcher, a file
   * manager, a save dialog, a listing. `send-to` puts the user's file on a
   * WIRE, and `send-targets` enumerates the connectors and the recipients that
   * wire could reach. The `artifacts.` prefix covers both today; these cases
   * exist so that if someone later narrows that prefix to re-open the harmless
   * reads to a paired WebUI, the two that must NEVER re-open fail loudly first.
   */
  it('denies the SEND pair by exact key, not only by the namespace prefix', () => {
    for (const key of ['artifacts.send-targets', 'artifacts.send-to']) {
      // MEMBERSHIP, not outcome. The `artifacts.` prefix already denies these,
      // so `isRemoteDeniedProviderKey` returns true whether or not the exact
      // key is present - deleting both entries leaves an outcome-only assertion
      // green, which is the whole thing this case exists to prevent.
      expect(REMOTE_DENIED_KEYS.has(key), `${key} must be an EXACT denied key, not only prefix-covered`).toBe(true);
      expect(isRemoteDeniedProviderKey(key), `${key} must be remote-denied`).toBe(true);
      expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
      // The outbound rule is DERIVED from the inbound one, so denying a key
      // inbound also stops a paired peer passively RECEIVING anything under it.
      expect(isAllowedOutboundToRemote(key)).toBe(false);
    }
  });

  /**
   * The other half of the derived-rule trap, and the reason this file does not
   * add a PREFIX.
   *
   * `isAllowedOutboundToRemote` re-uses the inbound predicate verbatim, so an
   * over-broad entry does not merely deny one provider - it silently stops the
   * matching EMITTER stream reaching every paired device, which is how a remote
   * chat wedges with no error anywhere. These are the keys a paired WebUI needs
   * in order to hold a conversation at all; they must be unaffected by anything
   * this round added.
   */
  it('leaves the keys a remote chat depends on untouched, in both directions', () => {
    const registered = _getRegisteredKeysForTests().providers;
    const remoteEssential = ['cron.list-jobs', 'modelRegistry.resolveForChatStart'];
    for (const key of remoteEssential) {
      // Control: a typo here would make the assertion below vacuous, because a
      // key nobody registered is not evidence about anything.
      expect(registered.has(key), `${key} must actually be a registered provider`).toBe(true);
      expect(isAllowedForRemote(`subscribe-${key}`), `${key} must stay remote-allowed`).toBe(true);
      expect(isAllowedOutboundToRemote(key), `${key} must stay broadcastable`).toBe(true);
    }
  });

  it('still allows an unrelated read so the denial is not vacuous', () => {
    expect(isAllowedForRemote('subscribe-cron.list-jobs')).toBe(true);
  });
});
