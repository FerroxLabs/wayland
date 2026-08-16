/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { isAllowedForRemote, isRemoteDeniedAcpModeChange } from '@/common/adapter/bridgeAllowlist';

/**
 * Guarded Autopilot authorizes unattended host-side tool approval. A paired
 * WebUI token is not a local-desktop operator grant, so only the local Electron
 * renderer may arm it. Ordinary ACP mode changes stay remote-allowed.
 */
describe('isRemoteDeniedAcpModeChange — Guarded Autopilot is local-only', () => {
  const NAME = 'subscribe-acp.set-mode';
  const setMode = (mode: unknown) => ({ id: 'x', data: { conversationId: 'conv', mode } });

  it('denies a paired WebUI attempt to arm Guarded Autopilot', () => {
    expect(isRemoteDeniedAcpModeChange(NAME, setMode('autoGuarded'))).toBe(true);
  });

  it('does not over-deny normal ACP modes', () => {
    // The generic wire-name allowlist stays open: only a remote WebSocket
    // payload carrying autoGuarded is denied by the adapter's value-level gate.
    // Local Electron IPC does not traverse the WebSocket adapter at all.
    expect(isAllowedForRemote(NAME)).toBe(true);
    expect(isRemoteDeniedAcpModeChange(NAME, setMode('default'))).toBe(false);
    expect(isRemoteDeniedAcpModeChange(NAME, setMode('plan'))).toBe(false);
  });

  it('does not treat unrelated provider payloads as ACP mode changes', () => {
    expect(isRemoteDeniedAcpModeChange('subscribe-acp.set-model', setMode('autoGuarded'))).toBe(false);
    expect(isRemoteDeniedAcpModeChange(NAME, undefined)).toBe(false);
    expect(isRemoteDeniedAcpModeChange(NAME, { data: {} })).toBe(false);
  });
});
