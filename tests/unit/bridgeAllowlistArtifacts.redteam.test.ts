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
 * and `artifacts.list` enumerates the absolute paths of the user's workspaces -
 * a launcher and a reconnaissance aid respectively. Neither has any remote
 * surface, so the whole namespace is denied, the same way `shell.` is.
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

  it('registers exactly the four capabilities the surface needs, and no generic open', () => {
    const capabilities = [..._getRegisteredKeysForTests().providers]
      .filter((key) => key.startsWith('artifacts.'))
      .toSorted();
    expect(capabilities).toEqual(['artifacts.list', 'artifacts.open', 'artifacts.reveal', 'artifacts.save-copy']);
  });

  it('still allows an unrelated read so the denial is not vacuous', () => {
    expect(isAllowedForRemote('subscribe-cron.list-jobs')).toBe(true);
  });
});
