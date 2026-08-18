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
 * The allowlist is a DENYLIST (default-allow), so a missing key silently exposes
 * the channel. Denial is therefore by PREFIX, following the rule the
 * `waylandTransfer.` entry states in that file - "deny the entire namespace so a
 * future provider cannot become remotely reachable by omission". The first
 * version of this PR listed the four exact keys instead, and
 * `engine-config-recovery.setPath` was remotely ALLOWED while
 * `terminal.anythingNew` was denied; the last test here is the mutation that
 * catches a regression back to exact keys.
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

  it('denies a channel that does not exist yet - the point of a prefix', () => {
    // The regression this pins: with four exact keys and no prefix, each of these
    // was remotely ALLOWED. A namespace where three of four channels move a
    // credential-bearing file must not be one omission away from reachable.
    expect(isAllowedForRemote('subscribe-engine-config-recovery.setPath')).toBe(false);
    expect(isAllowedForRemote('subscribe-engine-config-recovery.writeConfig')).toBe(false);
    expect(isAllowedForRemote('subscribe-engine-config-recovery.')).toBe(false);
  });

  it('matches the prefix convention its siblings already use', () => {
    // Same shape as terminal.* / workspaceTrust.* / waylandTransfer.*, so the
    // comparison is apples to apples rather than a claim about this namespace.
    expect(isAllowedForRemote('subscribe-terminal.anythingNew')).toBe(false);
    expect(isAllowedForRemote('subscribe-waylandTransfer.anythingNew')).toBe(false);
  });

  it('mutation guard: the prefix must not be so loose it denies neighbours', () => {
    // `engine-config-recovery` without the dot would also swallow a hypothetical
    // sibling namespace; prove the boundary is where it should be.
    expect(isAllowedForRemote('subscribe-engine-config-recoveryOther.read')).toBe(true);
    expect(isAllowedForRemote('subscribe-repair')).toBe(true);
    expect(isAllowedForRemote('subscribe-regenerate')).toBe(true);
  });

  it('does not over-deny: an unrelated sibling read the paired WebUI needs stays allowed', () => {
    expect(isAllowedForRemote('subscribe-get-mode')).toBe(true);
  });
});
