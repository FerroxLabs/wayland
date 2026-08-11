/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';

/**
 * K-05 decision D7 — managed agent installs are a LOCAL desktop action.
 *
 * `agent-installer:install` runs a package manager against the user's profile
 * (it fetches an npm package and writes an executable tree under userData) and
 * `agent-installer:uninstall` recursively removes a directory. A paired-device
 * WebSocket token proves a remote BROWSER, not the local trusted user, so both
 * are denied on the wire — the same posture as `onboarding.connect-flux`.
 * `agent-installer:status` is a read and stays allowed, or the settings page
 * would render empty for a paired device.
 *
 * THE TRAP THIS SUITE EXISTS FOR
 * ------------------------------
 * `isAllowedForRemote` strips only the `subscribe-` transport prefix and then
 * matches REMOTE_DENIED_KEYS *exactly* against what is left — the whole channel
 * name, colon included. Denylist entries of `install` / `uninstall` would look
 * like protection in review and match nothing that is ever sent: the install
 * channel would stay wide open to remote callers while the file read as if it
 * were closed. The mutation is silent, the tests below are not.
 */
describe('isAllowedForRemote — agent installs denied to remote callers (D7)', () => {
  it('denies installing an agent remotely — the critical one', () => {
    expect(isAllowedForRemote('subscribe-agent-installer:install')).toBe(false);
  });

  it('denies uninstalling an agent remotely (a recursive delete on the host)', () => {
    expect(isAllowedForRemote('subscribe-agent-installer:uninstall')).toBe(false);
  });

  it('does not over-deny: the status READ stays allowed so the page still renders', () => {
    expect(isAllowedForRemote('subscribe-agent-installer:status')).toBe(true);
  });

  /**
   * The unqualified-entry mistake, pinned from the other side.
   *
   * These bare names are what a denylist entry of `install` / `uninstall` would
   * actually match, and NOTHING registers them as providers — no such wire name
   * is ever sent. Asserting they are allowed records that a bare entry protects
   * nothing: the only string that can ever be denied is the fully-qualified one.
   */
  it('records that the bare names are not the wire names (an unqualified entry is decorative)', () => {
    expect(isAllowedForRemote('subscribe-install')).toBe(true);
    expect(isAllowedForRemote('subscribe-uninstall')).toBe(true);
  });

  it('does not over-deny an unrelated read the paired WebUI needs', () => {
    expect(isAllowedForRemote('subscribe-get-mode')).toBe(true);
  });
});
