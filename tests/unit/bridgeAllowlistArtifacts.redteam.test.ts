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
import { _getRegisteredKeysForTests, isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';
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
      // T4. Re-registers a local file as a verified deliverable, and the record
      // it appends is what a later `artifacts.open` turns into a path handed to
      // an OS launcher. Boundary re-examined when it was added, per this test's
      // whole reason for existing: it stays denied, by the same prefix.
      'artifacts.refresh',
      'artifacts.reveal',
      'artifacts.save-copy',
      'artifacts.series',
    ]);
  });

  /**
   * The two tests above both iterate REGISTERED keys, so neither can see the
   * `artifacts.` PREFIX being swapped for an exact-key list: every shipped
   * channel would stay denied and go on passing, while the NEXT channel anyone
   * adds would be silently remote-reachable until this file was edited again.
   *
   * A key that does not exist can only be denied by the prefix, so it is the
   * one probe that pins the prefix itself.
   */
  it('denies an artifacts.* name that is not registered, which is what pins the PREFIX', () => {
    expect(isAllowedForRemote('subscribe-artifacts.a-channel-that-does-not-exist-yet')).toBe(false);
  });

  it('still allows an unrelated read so the denial is not vacuous', () => {
    expect(isAllowedForRemote('subscribe-cron.list-jobs')).toBe(true);
  });
});
