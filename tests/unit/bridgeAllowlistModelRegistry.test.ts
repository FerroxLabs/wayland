/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';

/**
 * The model-registry secret/write IPC must NEVER be reachable from a
 * remote/WebUI caller: `connect`/`rekey`/`detectKeys` mutate or disclose stored
 * credentials. A paired but untrusted browser session must be rejected at the
 * wire boundary. This regression test guards that denial (the keys live in
 * REMOTE_DENIED_KEYS).
 *
 * `resolveForChatStart` is intentionally NOT in this list: audit C4 hardened it
 * to return only a non-secret chat-start handle (no decrypted key crosses IPC),
 * and a remote/headless WebUI must reach it to bind a chat to a model. See the
 * "remote-reachable" test below.
 */
describe('model-registry IPC is remote-denied (audit C4)', () => {
  const denied = ['modelRegistry.connect', 'modelRegistry.rekey', 'modelRegistry.detectKeys'];

  for (const key of denied) {
    it(`rejects a remote caller for ${key}`, () => {
      expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
    });
  }

  it('allows resolveForChatStart for a remote caller (returns a non-secret handle, audit C4)', () => {
    // The remote/headless WebUI resolves its chat-start model through this key.
    // The handler drops the decrypted credential and returns only a non-secret
    // handle, so allowing it leaks nothing - denying it left the remote WebUI
    // unable to pick a model ("No model configured yet").
    expect(isAllowedForRemote('subscribe-modelRegistry.resolveForChatStart')).toBe(true);
  });

  it('still allows a read-only/safe provider invocation for contrast', () => {
    // A non-secret provider invocation must remain reachable so the WebUI is not
    // broken wholesale - the denial is targeted at secret/write keys only.
    expect(isAllowedForRemote('subscribe-conversation.get-list')).toBe(true);
  });

  it('non-subscribe traffic is unaffected by the provider denylist', () => {
    expect(isAllowedForRemote('some-callback-event')).toBe(true);
  });
});
