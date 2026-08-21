/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 — a paired WebUI must not be able to answer a folder-grant card.
 *
 * `confirmation.confirm` is deliberately remote-ALLOWED: a paired browser
 * answering an ordinary tool prompt is a feature, and this file asserts that it
 * stays allowed. But a `path_boundary` card grants an AI agent standing read
 * access to a folder OUTSIDE its workspace, and it is answered by clicking (or
 * pressing Space on) a control in the desktop window. A WebSocket token proves a
 * paired BROWSER, not the human at that window.
 *
 * Found by an external adversarial audit, which reached the grant end to end:
 * a token-holding client that has seen a `confirmation.add` (or called
 * `confirmation.list`) posts the card's own grant value and `WCoreManager`
 * mints `always_path` with nobody touching the desktop card. The earlier gate
 * only refused FOREIGN vocabulary, so the card's OWN value walked through.
 */
import { isAllowedForRemote, isRemoteDeniedConfirmation } from '@/common/adapter/bridgeAllowlist';
import { PATH_BOUNDARY_DENY, PATH_BOUNDARY_GRANT_FOLDER } from '@/common/chat/pathBoundaryConsent';
import { describe, expect, it } from 'vitest';

/**
 * The exact envelope the WebSocket adapter hands the gate: `{ id, data: <provider
 * args> }`, taken from `bridgeAllowlistWebuiConfig.redteam.test.ts:24`, which
 * pins the same shape for the config-write gate this one mirrors. The answer
 * value rides in the provider's own `data` field, hence the double nesting.
 */
const wire = (value: unknown) => ({
  id: 'req-1',
  data: { conversation_id: 'c1', msg_id: 'call-1', callId: 'call-1', data: value },
});

describe('a remote peer cannot answer a path-boundary consent card', () => {
  it('the confirm key itself STAYS remote-invokable', () => {
    // Control for the whole file: if this ever flips, the tests below would
    // pass for the wrong reason - nothing remote could reach confirm at all.
    expect(isAllowedForRemote('subscribe-confirmation.confirm')).toBe(true);
  });

  it('refuses a remote GRANT', () => {
    expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire(PATH_BOUNDARY_GRANT_FOLDER))).toBe(true);
  });

  it('refuses a remote DENY too - the desktop owns the whole decision', () => {
    expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire(PATH_BOUNDARY_DENY))).toBe(true);
  });

  it('CONTROL: an ordinary confirmation from a remote peer is NOT blocked', () => {
    for (const ordinary of ['proceed_once', 'proceed_always', 'cancel']) {
      expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire(ordinary)), ordinary).toBe(false);
    }
  });

  it('CONTROL: the gate is keyed to the confirm wire name, not to any payload', () => {
    expect(isRemoteDeniedConfirmation('subscribe-something.else', wire(PATH_BOUNDARY_GRANT_FOLDER))).toBe(false);
  });

  it('survives a malformed or absent payload without throwing', () => {
    for (const bad of [undefined, null, {}, { data: null }, { data: { data: 42 } }]) {
      expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', bad)).toBe(false);
    }
  });
});
