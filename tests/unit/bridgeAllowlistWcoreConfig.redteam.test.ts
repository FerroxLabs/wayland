/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #990 - the `wcoreConfig.*` provider list and the remote denylist must stay in
 * sync.
 *
 * The reported asymmetry (`getOutputBudget` reachable while `getSection`,
 * `getBrowserPolicy` and `getEffectiveRuntime` are denied) turned out to be
 * DESIGN, not drift: the carve-out was made in the same commit that denied every
 * sibling (#925) and `bridgeAllowlist.redteam.test.ts` has asserted it ever
 * since ("keeps output-budget reads remote but denies the mutation"). Its whole
 * payload is `{ mode: 'auto' | 'fixed'; value?: number }` - a token cap with no
 * secret, no local path, and nothing about sandbox or tool posture - so the
 * disclosure argument that denies the other reads does not reach it. The write
 * half (`setOutputBudget`, plus the `wcore.outputBudget` config-storage side
 * door) stays denied.
 *
 * What was genuinely missing is the guard, which is what this file adds. #987
 * removed a denylist entry that matched no provider at all; #990 is the mirror
 * image, a provider with no entry. Both are drift between two hand-maintained
 * lists, so the assertion below is derived: enumerate the providers the shipped
 * `ipcBridge` actually registers and require the remote verdict for each to
 * equal an explicit, reasoned table. A future `wcoreConfig.*` method therefore
 * fails this test until someone states which side of the line it belongs on -
 * it can never inherit the carve-out by omission.
 */

import '@/common/adapter/ipcBridge';
import {
  _getRegisteredKeysForTests,
  isAllowedForRemote,
  isRemoteDeniedProviderKey,
} from '@/common/adapter/bridgeAllowlist';
import { describe, expect, it } from 'vitest';

/**
 * The `wcoreConfig.*` providers a paired WebUI is ALLOWED to invoke, and why.
 *
 * Adding a key here is the conscious decision this file exists to force. It must
 * carry the reason the disclosure is acceptable, in the same terms the denylist
 * entries use.
 */
const REMOTE_REACHABLE_BY_DESIGN: ReadonlySet<string> = new Set([
  // #990/#925: a token cap (`{ mode, value? }`). No secret, no local path, no
  // sandbox or tool posture. The matching write is denied.
  'wcoreConfig.getOutputBudget',
]);

const wcoreConfigProviderKeys = (): string[] =>
  [..._getRegisteredKeysForTests().providers].filter((key) => key.startsWith('wcoreConfig.')).sort();

describe('#990 wcoreConfig provider list / remote denylist sync', () => {
  it('covers the full namespace as shipped, reads and writes alike', () => {
    expect(wcoreConfigProviderKeys()).toEqual([
      'wcoreConfig.getBrowserPolicy',
      'wcoreConfig.getEffectiveRuntime',
      'wcoreConfig.getOutputBudget',
      'wcoreConfig.getSection',
      'wcoreConfig.openEffectiveRuntimeFolder',
      'wcoreConfig.patchField',
      'wcoreConfig.setBrowserPolicy',
      'wcoreConfig.setOutputBudget',
      'wcoreConfig.setRawEngineMode',
    ]);
  });

  it('allows exactly the reasoned carve-outs and denies the rest', () => {
    const registered = wcoreConfigProviderKeys();
    // A method that stops being registered must not leave a stale rule behind.
    expect(registered.length).toBeGreaterThan(0);

    const reachable = registered.filter((key) => !isRemoteDeniedProviderKey(key));
    expect(reachable).toEqual([...REMOTE_REACHABLE_BY_DESIGN].toSorted());

    // Same verdict at the wire, which is where the WS dispatcher asks.
    const reachableOnTheWire = registered.filter((key) => isAllowedForRemote(`subscribe-${key}`));
    expect(reachableOnTheWire).toEqual([...REMOTE_REACHABLE_BY_DESIGN].toSorted());
  });

  it('does not let the carve-out table name a provider that no longer exists', () => {
    const registered = new Set(wcoreConfigProviderKeys());
    for (const key of REMOTE_REACHABLE_BY_DESIGN) {
      expect(registered.has(key)).toBe(true);
    }
  });

  it('keeps the write half of the output budget closed on both doors', () => {
    // The typed transactional setter...
    expect(isAllowedForRemote('subscribe-wcoreConfig.setOutputBudget')).toBe(false);
    // ...and the generic config-storage key it persists to.
    expect(isRemoteDeniedProviderKey('wcoreConfig.setOutputBudget')).toBe(true);
  });
});
