/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Round-trip wiring proof for the agent-installer channels (T-A).
 *
 * A declared channel that never reaches the allowlist is denied at runtime, so
 * the Install button would spin and silently do nothing. Declaration and
 * registration are therefore asserted together.
 *
 * The allowlist is populated as a SIDE EFFECT of `buildProvider` at ipcBridge
 * module-load time (src/common/adapter/bridgeAllowlist.ts wraps the platform
 * factory) — there is no hand-maintained list to append to. Importing ipcBridge
 * is what registers them, hence the bare import below.
 */

import '@/common/adapter/ipcBridge';
import { ipcBridge } from '@/common';
import { _getRegisteredKeysForTests, isAllowedInboundName } from '@/common/adapter/bridgeAllowlist';
import { describe, expect, it } from 'vitest';

const CHANNELS = ['agent-installer:status', 'agent-installer:install', 'agent-installer:uninstall'];

describe('agent installer channels', () => {
  it('declares status/install/uninstall on ipcBridge.agentInstaller', () => {
    expect(typeof ipcBridge.agentInstaller.status?.invoke).toBe('function');
    expect(typeof ipcBridge.agentInstaller.install?.invoke).toBe('function');
    expect(typeof ipcBridge.agentInstaller.uninstall?.invoke).toBe('function');
  });

  it('registers every agent-installer channel in the bridge allowlist', () => {
    const { providers } = _getRegisteredKeysForTests();
    for (const channel of CHANNELS) {
      expect(providers.has(channel), `${channel} missing from the allowlist`).toBe(true);
    }
  });

  it('accepts the channels on the renderer -> main inbound path', () => {
    for (const channel of CHANNELS) {
      expect(isAllowedInboundName(`subscribe-${channel}`), `subscribe-${channel} denied`).toBe(true);
    }
  });

  it('exposes exactly three agent-installer channels', () => {
    const declared = [..._getRegisteredKeysForTests().providers].filter((key) => key.startsWith('agent-installer:'));
    expect(declared.toSorted()).toEqual(CHANNELS.toSorted());
  });

  // The wire names are what the remote denylist matches EXACTLY. If a channel is
  // ever renamed, this fails here rather than silently un-denying an install.
  it('pins the exact wire names the remote denylist keys off', () => {
    expect(new Set(_getRegisteredKeysForTests().providers).has('agent-installer:install')).toBe(true);
    expect(new Set(_getRegisteredKeysForTests().providers).has('agent-installer:uninstall')).toBe(true);
  });

  it('rejects a near-miss channel name (the allowlist is not a prefix match)', () => {
    expect(isAllowedInboundName('subscribe-agent-installer:install-evil')).toBe(false);
    expect(isAllowedInboundName('subscribe-agent-installer')).toBe(false);
  });
});
