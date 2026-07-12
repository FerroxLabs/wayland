/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isAllowedForRemote, isRemoteDeniedConfigWrite } from '@/common/adapter/bridgeAllowlist';

/**
 * #671 — the per-workspace trust axis is a LOCAL desktop control. A paired-device
 * WebSocket peer proves a remote browser, NOT the local trusted user, so it must
 * never be able to ARM cowork (workspaceTrust.set → unattended read/edit
 * auto-approve) or READ the posture (workspaceTrust.get). Both are denied via the
 * `workspaceTrust.` prefix. The dispatcher receives each wire key as
 * `subscribe-<key>`. The allowlist is a DENYLIST (default-allow), so a missing or
 * mis-spelled prefix would silently expose the control — this test pins it.
 */
describe('isAllowedForRemote — workspaceTrust.* denied to remote callers (#671)', () => {
  it('denies arming trust remotely (workspaceTrust.set) — the critical one', () => {
    expect(isAllowedForRemote('subscribe-workspaceTrust.set')).toBe(false);
  });

  it('denies reading the trust posture remotely (workspaceTrust.get)', () => {
    expect(isAllowedForRemote('subscribe-workspaceTrust.get')).toBe(false);
  });

  it('denies any hypothetical future workspaceTrust.* provider by prefix', () => {
    expect(isAllowedForRemote('subscribe-workspaceTrust.clear')).toBe(false);
    expect(isAllowedForRemote('subscribe-workspaceTrust.list')).toBe(false);
  });

  it('does not over-deny: an unrelated sibling read the paired WebUI needs stays allowed', () => {
    expect(isAllowedForRemote('subscribe-get-mode')).toBe(true);
  });
});

/**
 * #671 — the DECLARATIVE door. The trust level persists to the SAME ProcessConfig
 * file as `agent.config`, so denying only the dedicated `workspaceTrust.set`
 * provider leaves a side door: a remote peer could write `workspace.trustLevel`
 * via the generic `agent.config.storage.set` wire key (which stays allowed for
 * the config writes the paired WebUI legitimately needs). `hydrateWorkspaceTrust`
 * would then load the tampered value into the gate cache on the next launch,
 * arming Cowork with no local toggle. The value-level guard must cover it (mirrors
 * the #819 webui.desktop.* fix).
 */
describe('isRemoteDeniedConfigWrite — workspace.trustLevel write denied to remote callers (#671)', () => {
  const set = (key: string, value: unknown) => ({ id: 'x', data: { key, data: value } });
  const NAME = 'subscribe-agent.config.storage.set';

  it('denies a remote write to workspace.trustLevel (the arming payload)', () => {
    expect(isRemoteDeniedConfigWrite(NAME, set('workspace.trustLevel', { '/victim/cwd': 'cowork' }))).toBe(true);
  });

  it('does not over-deny unrelated config keys the paired WebUI needs', () => {
    expect(isRemoteDeniedConfigWrite(NAME, set('theme', 'dark'))).toBe(false);
    expect(isRemoteDeniedConfigWrite(NAME, set('language', 'en-US'))).toBe(false);
  });
});
