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
} from '@/common/adapter/bridgeAllowlist';

// Touch the module so its `buildProvider` calls have registered every key.
void ipcBridge.promotion;

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
