/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isAllowedForRemote, isRemoteDeniedConfigWrite } from '@/common/adapter/bridgeAllowlist';

/**
 * #819 (the security gate): a paired-device WebSocket peer must never be able to
 * arm WebUI LAN exposure by writing the PREFERENCE. `webui.start`/`webui.stop`
 * are remote-denied, but arming exposure does not need them — it only needs
 * `webui.desktop.allowRemote=true` (+ `enabled=true`) in the shared `agent.config`
 * store, which `restoreDesktopWebUIFromPreferences` reads to bind `0.0.0.0` on the
 * next launch. That write rides the generic `agent.config.storage.set` wire key,
 * which stays ALLOWED for the config the paired WebUI legitimately writes — so the
 * gate is value-level, on the target key carried in the invocation payload.
 *
 * Wire payload shape (verified against @office-ai/platform's buildStorage.set):
 *   storage.set(key, value) → invoke({ key, data: value })
 *   → wire `{ name: 'subscribe-agent.config.storage.set', data: { id, data: { key, data } } }`
 */
describe('isRemoteDeniedConfigWrite — webui.desktop.* writes denied to remote callers (#819)', () => {
  const set = (key: string, value: unknown) => ({
    id: `${key}deadbeef`,
    data: { key, data: value },
  });
  const NAME = 'subscribe-agent.config.storage.set';

  // The re-arm surface: every key restoreDesktopWebUIFromPreferences reads.
  const deniedKeys: ReadonlyArray<string> = [
    'webui.desktop.allowRemote', // the LAN-exposure switch — the critical one
    'webui.desktop.enabled', // the other half of a from-cold auto-bind
    'webui.desktop.port',
    'webui.desktop.anythingElse', // a hypothetical future webui.desktop.* key
  ];

  it.each(deniedKeys)('denies a remote write to %s', (key) => {
    expect(isRemoteDeniedConfigWrite(NAME, set(key, true))).toBe(true);
  });

  it('does not over-deny: a legitimate config write the paired WebUI needs stays allowed', () => {
    expect(isRemoteDeniedConfigWrite(NAME, set('theme', 'dark'))).toBe(false);
    expect(isRemoteDeniedConfigWrite(NAME, set('webui.someOtherKey', true))).toBe(false);
  });

  it('only gates the agent.config setter, not reads or other wire keys', () => {
    expect(isRemoteDeniedConfigWrite('subscribe-agent.config.storage.get', 'webui.desktop.allowRemote')).toBe(false);
    expect(isRemoteDeniedConfigWrite('subscribe-cron.list-jobs', set('webui.desktop.allowRemote', true))).toBe(false);
  });

  it('is robust to malformed / missing payloads (defaults to not-denied, dispatch is unaffected)', () => {
    expect(isRemoteDeniedConfigWrite(NAME, undefined)).toBe(false);
    expect(isRemoteDeniedConfigWrite(NAME, null)).toBe(false);
    expect(isRemoteDeniedConfigWrite(NAME, {})).toBe(false);
    expect(isRemoteDeniedConfigWrite(NAME, { data: {} })).toBe(false);
    expect(isRemoteDeniedConfigWrite(NAME, { data: { key: 42 } })).toBe(false);
  });

  /**
   * The reason this gate has to exist: the setter wire key is NOT in the remote
   * denylist (it can't be — the paired WebUI writes legitimate config through it),
   * so isAllowedForRemote lets `agent.config.storage.set` through. Without the
   * value-gate the malicious write would be dispatched. This pins that the wire
   * key stays allowed AND that the value-gate is the thing that denies the write.
   */
  it('documents the two-layer design: setter stays wire-allowed, value-gate does the denial', () => {
    expect(isAllowedForRemote(NAME)).toBe(true);
    expect(isRemoteDeniedConfigWrite(NAME, set('webui.desktop.allowRemote', true))).toBe(true);
  });
});
