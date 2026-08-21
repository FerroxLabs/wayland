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
import {
  PATH_BOUNDARY_DENY,
  PATH_BOUNDARY_GRANT_FOLDER,
  PATH_BOUNDARY_REMEMBER_FOLDER,
} from '@/common/chat/pathBoundaryConsent';
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

  it('refuses a remote DURABLE grant', () => {
    // The stakes here are strictly higher than the session grant above: this
    // value writes the folder to the workspace's persisted list, so a remote
    // peer that got it through would open that folder to every FUTURE session
    // as well, including unattended cron runs with nobody at the window at all.
    //
    // The gate needed no edit to cover it. It reads `isPathBoundaryOptionValue`,
    // so widening that predicate is what extended this denial - which is the
    // property this assertion exists to hold in place, not the denial alone.
    expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire(PATH_BOUNDARY_REMEMBER_FOLDER))).toBe(
      true
    );
  });

  it('refuses a remote DENY too - the desktop owns the whole decision', () => {
    expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire(PATH_BOUNDARY_DENY))).toBe(true);
  });

  it('CONTROL: an ordinary confirmation from a remote peer is NOT blocked', () => {
    for (const ordinary of ['proceed_once', 'proceed_always', 'cancel']) {
      expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire(ordinary)), ordinary).toBe(false);
    }
  });

  /**
   * WHY LEGACY `cancel` IS STILL ALLOWED THROUGH THIS GATE, and where the veto
   * is actually stopped.
   *
   * A second external audit found that a paired WebUI could call
   * `confirmation.list`, take the pending `callId`, and post `cancel` - which
   * this gate lets past, because on an ORDINARY card a remote decline is a
   * feature. `WCoreManager` then honoured it on a boundary card: the desktop
   * user's security prompt vanished and the call was denied. No authority was
   * minted, but a remote peer must not get to answer the question either way.
   *
   * The gate cannot fix that. It is a pure predicate over (wire name, payload
   * value) and has no idea which `callId` belongs to a boundary card, so
   * denying `cancel` here would break every legitimate remote decline. The
   * refusal belongs where the card is known, and that is
   * `WCoreManager.confirm`, pinned by
   * `wcoreManagerPathBoundary.test.ts > a remote cancel cannot dismiss a
   * boundary card`. Fixing it there also covers the channels gateway, which
   * this gate never sees at all.
   */
  it('is a VALUE predicate, so it cannot tell a boundary callId from an ordinary one', () => {
    // Same callId, same wire key, two values: only the vocabulary decides. That
    // is the limit this gate has, stated as an assertion rather than a comment
    // so a later attempt to make it callId-aware has to come here first.
    expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire(PATH_BOUNDARY_GRANT_FOLDER))).toBe(true);
    expect(isRemoteDeniedConfirmation('subscribe-confirmation.confirm', wire('cancel'))).toBe(false);
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
