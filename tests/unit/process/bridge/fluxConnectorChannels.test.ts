/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Round-trip wiring proof for the Flux connector channels.
 *
 * The settings chip renders as a CLICKABLE button for every backend with a live
 * connector. A declared channel that never reaches the allowlist is denied at
 * runtime, so the button would open a modal that silently does nothing. This
 * suite asserts the declaration and the allowlist registration together.
 *
 * The allowlist is populated as a SIDE EFFECT of `buildProvider` at ipcBridge
 * module-load time (src/common/adapter/bridgeAllowlist.ts wraps the platform
 * factory), which is exactly how the codex and opencode channels appear there -
 * there is no hand-maintained list to append to. Importing ipcBridge is what
 * registers them, hence the bare import below.
 */

import '@/common/adapter/ipcBridge';
import { ipcBridge } from '@/common';
import { _getRegisteredKeysForTests, isAllowedInboundName } from '@/common/adapter/bridgeAllowlist';
import { describe, expect, it } from 'vitest';

const KIMI_CHANNELS = ['flux-connector:kimi-status', 'flux-connector:setup-kimi', 'flux-connector:remove-kimi'];

const CODEX_CHANNELS = ['flux-connector:codex-status', 'flux-connector:setup-codex', 'flux-connector:remove-codex'];

const OPENCLAW_CHANNELS = [
  'flux-connector:openclaw-status',
  'flux-connector:setup-openclaw',
  'flux-connector:remove-openclaw',
];

describe('flux connector channels', () => {
  it('declares the kimi trio on ipcBridge.fluxConnector', () => {
    expect(typeof ipcBridge.fluxConnector.kimiStatus?.invoke).toBe('function');
    expect(typeof ipcBridge.fluxConnector.setupKimi?.invoke).toBe('function');
    expect(typeof ipcBridge.fluxConnector.removeKimi?.invoke).toBe('function');
  });

  it('registers every kimi channel in the bridge allowlist', () => {
    const { providers } = _getRegisteredKeysForTests();
    for (const channel of KIMI_CHANNELS) {
      expect(providers.has(channel), `${channel} missing from the allowlist`).toBe(true);
    }
  });

  it('accepts the kimi channels on the renderer -> main inbound path', () => {
    for (const channel of KIMI_CHANNELS) {
      expect(isAllowedInboundName(`subscribe-${channel}`), `subscribe-${channel} denied`).toBe(true);
    }
  });

  it('registers every openclaw channel in the bridge allowlist', () => {
    const { providers } = _getRegisteredKeysForTests();
    for (const channel of OPENCLAW_CHANNELS) {
      expect(providers.has(channel), `${channel} missing from the allowlist`).toBe(true);
    }
  });

  it('accepts the openclaw channels on the renderer -> main inbound path', () => {
    for (const channel of OPENCLAW_CHANNELS) {
      expect(isAllowedInboundName(`subscribe-${channel}`), `subscribe-${channel} denied`).toBe(true);
    }
  });

  it('exposes exactly twelve flux-connector channels (opencode + codex + kimi + openclaw)', () => {
    const declared = [..._getRegisteredKeysForTests().providers].filter((key) => key.startsWith('flux-connector:'));
    expect(declared.sort()).toEqual(
      [
        'flux-connector:opencode-status',
        'flux-connector:setup-opencode',
        'flux-connector:remove-opencode',
        ...CODEX_CHANNELS,
        ...KIMI_CHANNELS,
        ...OPENCLAW_CHANNELS,
      ].sort()
    );
  });

  it('rejects a near-miss kimi channel name (the allowlist is not a prefix match)', () => {
    expect(isAllowedInboundName('subscribe-flux-connector:setup-kimi-evil')).toBe(false);
    expect(isAllowedInboundName('subscribe-flux-connector:kimi')).toBe(false);
  });
});
