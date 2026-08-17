/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';

/**
 * #1024 - the engine-config recovery channels are LOCAL desktop controls. Three
 * of them write to or delete `config.toml`, the file holding the user's
 * providers, API keys and memory/skills settings; the fourth asks the HOST OS to
 * open a Finder/Explorer window. A paired-device WebSocket token proves a remote
 * BROWSER, not the local trusted user, so none of them may be driven from the
 * wire. `inspect` is a read, but it discloses the host's config path and
 * integrity posture - the same reconnaissance class as `doctor.run`.
 *
 * The allowlist is a DENYLIST (default-allow), so a missing or mis-spelled key
 * silently exposes the channel. It also matches the wire key EXACTLY after
 * stripping `subscribe-`, which is the mistake the agent-installer redteam test
 * documents: a bare `repair` entry would match nothing that is ever sent while
 * looking like protection. This test pins the fully-qualified spellings.
 */
describe('isAllowedForRemote - engine-config-recovery.* denied to remote callers (#1024)', () => {
  it('denies the destructive regenerate - the critical one', () => {
    expect(isAllowedForRemote('subscribe-engine-config-recovery.regenerate')).toBe(false);
  });

  it('denies the repair write', () => {
    expect(isAllowedForRemote('subscribe-engine-config-recovery.repair')).toBe(false);
  });

  it('denies the host reveal (a remote peer must not pop a window on the desktop)', () => {
    expect(isAllowedForRemote('subscribe-engine-config-recovery.reveal')).toBe(false);
  });

  it('denies the inspect read (config path + integrity posture disclosure)', () => {
    expect(isAllowedForRemote('subscribe-engine-config-recovery.inspect')).toBe(false);
  });

  it('mutation guard: an UNQUALIFIED entry would not have protected these', () => {
    // Proves the check above is not passing for the wrong reason. `repair` on its
    // own is not a denied key, so if the denylist had carried the bare names the
    // fully-qualified assertions above would fail.
    expect(isAllowedForRemote('subscribe-repair')).toBe(true);
    expect(isAllowedForRemote('subscribe-regenerate')).toBe(true);
  });

  it('does not over-deny: an unrelated sibling read the paired WebUI needs stays allowed', () => {
    expect(isAllowedForRemote('subscribe-get-mode')).toBe(true);
  });
});
