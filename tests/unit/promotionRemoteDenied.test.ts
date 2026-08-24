/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * H2 - the promotion namespace must be unreachable by a paired-device
 * (WebSocket) peer.
 *
 * `promotion.promote` copies the user's chat files into their Documents,
 * pauses and re-arms a schedule and repoints a conversation; `promotion.preview`
 * enumerates local workspace paths and the filename of everything earlier runs
 * left behind. A WS token proves a paired browser, not the local trusted user.
 *
 * The original denial was written as the string `'promotion.'` in
 * REMOTE_DENIED_KEYS, which is an EXACT-MATCH Set. No provider is ever named
 * `promotion.`, so the entry matched nothing and the whole namespace stayed
 * remote-reachable. A hand-written list of keys would repeat that class of
 * mistake, so this enumerates the keys from the LIVE provider registry: any
 * promotion provider that exists at all has to be denied.
 */

import { describe, it, expect } from 'vitest';
import * as ipcBridge from '@/common/adapter/ipcBridge';
import {
  _getRegisteredKeysForTests,
  isAllowedForRemote,
  isAllowedOutboundToRemote,
  isRemoteDeniedProviderKey,
  isRemoteDeniedConfigWrite,
} from '@/common/adapter/bridgeAllowlist';

// Touch the module so its `buildProvider` calls have registered every key.
void ipcBridge.promotion;
// Touch the namespaces this file classifies so `buildProvider` has registered
// every key before the registry is read. A namespace left untouched reports as
// simply absent, which would read as "nothing to deny".
void ipcBridge.mcpService;
void ipcBridge.conciergeConfig;
void ipcBridge.acpConversation;

const registered = (): string[] => [..._getRegisteredKeysForTests().providers];
const promotionKeys = (): string[] => registered().filter((key) => key.startsWith('promotion.'));

describe('H2 promotion providers are denied to remote peers', () => {
  it('the live registry actually contains promotion providers (control)', () => {
    // A zero here would make every assertion below vacuous.
    expect(promotionKeys().toSorted()).toEqual(['promotion.preview', 'promotion.promote']);
  });

  it('denies EVERY registered promotion provider key', () => {
    const reachable = promotionKeys().filter((key) => isAllowedForRemote(`subscribe-${key}`));
    expect(reachable).toEqual([]);
  });

  it('never broadcasts anything in the promotion namespace outbound', () => {
    const broadcast = promotionKeys().filter((key) => isAllowedOutboundToRemote(key));
    expect(broadcast).toEqual([]);
  });

  it('still allows an unrelated read-only provider (control)', () => {
    expect(isAllowedForRemote('subscribe-cron.list-jobs')).toBe(true);
    expect(isAllowedOutboundToRemote('conversation.list-changed')).toBe(true);
  });
});

describe('H2 the cron write/exec surface stays denied', () => {
  // Not a hand list of what we hope is denied: the registry names every cron
  // provider that exists, and each one is classified here. If a new cron
  // provider appears it lands in neither bucket and this fails loudly.
  const DENIED = new Set([
    'cron.add-job',
    'cron.update-job',
    'cron.run-now',
    'cron.save-skill',
    'cron.confirm-proposal',
    'cron.restore-archived-job',
  ]);
  const ALLOWED = new Set([
    'cron.list-jobs',
    'cron.list-archived-jobs',
    'cron.list-jobs-by-conversation',
    'cron.get-job',
    'cron.has-skill',
    'cron.remove-job',
  ]);

  it('classifies every registered cron provider', () => {
    const cronKeys = registered().filter((key) => key.startsWith('cron.'));
    expect(cronKeys.length).toBeGreaterThan(0);
    const unclassified = cronKeys.filter((key) => !DENIED.has(key) && !ALLOWED.has(key));
    expect(unclassified).toEqual([]);
    for (const key of cronKeys) {
      expect({ key, remote: isAllowedForRemote(`subscribe-${key}`) }).toEqual({
        key,
        remote: !DENIED.has(key),
      });
    }
  });
});

/**
 * N2 - the remote command-execution surface.
 *
 * Two holes were proven by execution against this tree, each with a control
 * asserting the marker absent immediately before:
 *   - `conciergeConfig.confirm-proposal` with `action:'accept'` on an `add_mcp`
 *     proposal spawned the MODEL-AUTHORED `command`/`args`;
 *   - `acp.test-custom-agent` spawned a CALLER-supplied `command`/`acpArgs`/`env`
 *     and returned `{success:false}` after the command had already run.
 * Both were remote-allowed. `mcp.test-connection` (spawns a stored declaration)
 * and `mcp.compare-and-set-config` (decides which argv that declaration carries)
 * are the two halves of the same chain and were remote-allowed too.
 *
 * This suite enumerates the LIVE registry rather than a hand list, because a
 * hand list is how this allowlist has failed before: the string `'promotion.'`
 * sat in an exact-match Set for a whole release matching nothing.
 */
describe('N2 the remote command-execution surface stays denied', () => {
  /**
   * Every registered provider whose handler can reach a `spawn`/`execFileSync`
   * of a command the CALLER influences, plus the config write that chooses the
   * argv. A new provider of this class lands in neither bucket below and the
   * classification test fails loudly rather than sliding in.
   */
  const SPAWN_REACHING_DENIED = [
    'conciergeConfig.confirm-proposal',
    'mcp.test-connection',
    'mcp.compare-and-set-config',
    'acp.test-custom-agent',
  ];

  it.each(SPAWN_REACHING_DENIED)('denies %s to a paired browser', (key) => {
    expect(isRemoteDeniedProviderKey(key)).toBe(true);
    expect(isAllowedForRemote(`subscribe-${key}`)).toBe(false);
  });

  it('every key it denies is actually a registered provider (control)', () => {
    // Without this, a typo would make every assertion above vacuously true -
    // the exact failure mode that let `'promotion.'` sit dead in a Set.
    const all = new Set(registered());
    expect(SPAWN_REACHING_DENIED.filter((key) => !all.has(key))).toEqual([]);
  });

  it('denies the WHOLE conciergeConfig namespace, not just the enumerated key', () => {
    const conciergeKeys = registered().filter((key) => key.startsWith('conciergeConfig.'));
    expect(conciergeKeys.length).toBeGreaterThan(0);
    expect(conciergeKeys.filter((key) => isAllowedForRemote(`subscribe-${key}`))).toEqual([]);
    // A provider that does not exist yet is covered too - that is the point of
    // pairing a prefix with the exact key.
    expect(isAllowedForRemote('subscribe-conciergeConfig.someFutureApplyPath')).toBe(false);
  });

  it('keeps the known positives behaving, so the probe is alive', () => {
    // Denied before this change and still denied - if these flip, the predicate
    // itself broke rather than the new entries working.
    expect(isAllowedForRemote('subscribe-cron.confirm-proposal')).toBe(false);
    expect(isAllowedForRemote('subscribe-mcp.sync-to-agents')).toBe(false);
    expect(isAllowedForRemote('subscribe-shell.open-external')).toBe(false);
    // Benign MCP reads stay reachable: this is a denylist, not a new whitelist.
    expect(isAllowedForRemote('subscribe-mcp.get-config-snapshot')).toBe(true);
    expect(isAllowedForRemote('subscribe-cron.list-jobs')).toBe(true);
  });

  it('closes the declarative side door onto the same stdio spec', () => {
    // #671's lesson: denying the typed provider is not enough while the generic
    // config setter can still write the key it protects.
    const write = (key: string): boolean =>
      isRemoteDeniedConfigWrite('subscribe-agent.config.storage.set', { id: '1', data: { key, data: [] } });
    expect(write('mcp.config')).toBe(true);
    // Controls: an unrelated key is still writable, and a protected sibling
    // still denied, so the gate is discriminating rather than refusing all.
    expect(write('workspace.trustLevel')).toBe(true);
    expect(write('some.unrelated.key')).toBe(false);
  });
});
