/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isAllowedForRemote, isAllowedOutboundToRemote } from '@/common/adapter/bridgeAllowlist';

/**
 * #645 acceptance §8.6 (the security gate): a paired-device WebSocket peer must
 * never be able to spawn or drive a PTY. The `terminal.*` namespace is denied to
 * remote callers via the `terminal.` prefix, and the ENABLE toggle
 * (set-terminal-enabled) is denied so a remote peer cannot even turn the feature
 * on. The dispatcher receives each wire key as `subscribe-<key>`.
 *
 * This is the enforcement the "local-only" requirement reduces to: a
 * buildProvider handler has no per-call remote signal, so the guarantee lives
 * here at the wire, by name.
 */
describe('isAllowedForRemote — terminal.* denied to remote callers (#645)', () => {
  const deniedTerminalKeys: ReadonlyArray<string> = [
    'terminal.open', // spawns a PTY — the critical one
    'terminal.input', // writes keystrokes into the PTY
    'terminal.resize',
    'terminal.close',
    // A hypothetical future terminal.* provider is denied by the prefix too.
    'terminal.attach',
  ];

  it.each(deniedTerminalKeys)('denies %s for remote callers', (key) => {
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
  });

  it('denies enabling the feature remotely (set-terminal-enabled)', () => {
    expect(isAllowedForRemote('subscribe-system-settings:set-terminal-enabled')).toBe(false);
  });

  it('still allows the harmless read of the flag (get-terminal-enabled)', () => {
    expect(isAllowedForRemote('subscribe-system-settings:get-terminal-enabled')).toBe(true);
  });

  it('does not over-deny: a sibling read the paired WebUI needs stays allowed', () => {
    expect(isAllowedForRemote('subscribe-system-settings:get-close-to-tray')).toBe(true);
  });
});

/**
 * #645 — OUTBOUND leak: inbound denial stops a peer INVOKING terminal.*, but the
 * live PTY stream is pushed via the terminal.output / terminal.exit emitters. A
 * paired peer must never RECEIVE that stream (command output / file contents /
 * secrets the agent CLI prints), so the WS outbound broadcaster drops it.
 */
describe('isAllowedOutboundToRemote — terminal.* emitters not broadcast to peers (#645)', () => {
  it.each(['terminal.output', 'terminal.exit'])('does not broadcast %s to remote peers', (name) => {
    expect(isAllowedOutboundToRemote(name)).toBe(false);
  });

  it('still broadcasts ordinary emitters to paired peers (not over-denied)', () => {
    expect(isAllowedOutboundToRemote('project.changed')).toBe(true);
    expect(isAllowedOutboundToRemote('system-settings:language-changed')).toBe(true);
  });
});
