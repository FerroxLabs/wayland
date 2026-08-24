/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A paired WebUI must never REPLACE the MCP server list.
 *
 * `mcp.compare-and-set-config` takes `nextServers: IMcpServer[]` and, on a
 * revision match, writes that array VERBATIM - `compareAndSetMcpConfig`
 * validates the revision string and the fact that it received an array, and
 * nothing else about what is in it. So one remote call is:
 *
 *  - arbitrary `transport.command` + `args` that the host will spawn, and
 *  - arbitrary `libraryEntryId` / `source`, which is the field the per-routine
 *    connector grant treats as the catalog identity "written at install".
 *
 * The rest of the MCP mutation surface (`mcp.sync-to-agents`,
 * `mcp.archive-configured-server`, the OAuth channels) is already denied.
 * This one channel - the widest of them, because it replaces the whole list -
 * was not, so the narrower ones were being enforced around an open door.
 *
 * WHY MEMBERSHIP AND NOT ONLY OUTCOME. There is no `mcp.` prefix entry in
 * `REMOTE_DENIED_PREFIXES` (the namespace is deliberately part-readable), so
 * membership in `REMOTE_DENIED_KEYS` is the only thing that denies this key and
 * the only thing worth pinning.
 */

import '@/common/adapter/ipcBridge';
import { describe, expect, it } from 'vitest';
import {
  REMOTE_DENIED_KEYS,
  isAllowedForRemote,
  isAllowedOutboundToRemote,
  isRemoteDeniedProviderKey,
} from '@/common/adapter/bridgeAllowlist';

const KEY = 'mcp.compare-and-set-config';

describe('the MCP config write channel is denied to a paired WebUI', () => {
  it('is an EXACT denied key', () => {
    expect(REMOTE_DENIED_KEYS.has(KEY), `${KEY} replaces the entire MCP server list from one remote call`).toBe(true);
  });

  it('the real remote gate refuses it, inbound and outbound', () => {
    expect(isRemoteDeniedProviderKey(KEY)).toBe(true);
    expect(isAllowedForRemote(`subscribe-${KEY}`)).toBe(false);
    // Emitter names carry no `subscribe-` prefix; the outbound rule re-adds it.
    expect(isAllowedOutboundToRemote(KEY)).toBe(false);
  });

  it('CONTROL: the gate discriminates - an ordinary read is still remotely reachable', () => {
    // Without this the assertions above could pass because nothing is reachable.
    expect(REMOTE_DENIED_KEYS.has('conversation.get-list')).toBe(false);
    expect(isRemoteDeniedProviderKey('conversation.get-list')).toBe(false);
    expect(isAllowedForRemote('subscribe-conversation.get-list')).toBe(true);
    expect(isAllowedOutboundToRemote('conversation.get-list')).toBe(true);
  });

  it('the narrower MCP mutations it sits beside stay denied', () => {
    // Pins the neighbourhood: this key was the odd one out, not a new policy.
    for (const neighbour of [
      'mcp.sync-to-agents',
      'mcp.remove-from-agents',
      'mcp.archive-configured-server',
      'mcp.set-byo-oauth-credentials',
    ]) {
      expect(REMOTE_DENIED_KEYS.has(neighbour)).toBe(true);
    }
  });
});
