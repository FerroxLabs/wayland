/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #722: the "Allow Remote Access" description did not merely fail to warn — in all
 * twelve locales it affirmatively told the user this was **secure remote access**,
 * while it binds the WebUI to 0.0.0.0 and sends the login over plaintext HTTP. That
 * is a false reassurance in the exact place the user decides whether to expose the
 * listener, which is worse than saying nothing.
 *
 * This pins the honest copy in every locale, so a future translation sync cannot
 * quietly reintroduce the claim.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const LOCALES_DIR = path.join(__dirname, '../../src/renderer/services/i18n/locales');

/** "secure" and its translations in every locale we ship. */
const SECURE_CLAIM = /secure|sicher|seguro|sécuris|安全|безопас|güvenli|безпеч|안전|安全に/i;

const CONSENT_KEYS = [
  'webui.allowRemoteDesc',
  'webui.allowRemoteConfirmTitle',
  'webui.allowRemoteConfirmBody',
  'webui.allowRemoteConfirmOk',
  'webui.allowRemoteActive',
  'webui.allowRemoteArmed',
  // The OS notice is the ONLY surface that reaches the user who never opens Settings —
  // exactly the victim of #722 — so it must exist in every language, not just English.
  'webui.lanExposureNoticeTitle',
  'webui.lanExposureNoticeBody',
];

function locales(): string[] {
  return fs
    .readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function settings(locale: string): Record<string, string> {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, locale, 'settings.json'), 'utf-8'));
}

describe('#722: the LAN-exposure copy must not promise security it does not provide', () => {
  it('ships more than one locale (guards the loop below against silently testing nothing)', () => {
    expect(locales().length).toBeGreaterThan(1);
  });

  for (const locale of locales()) {
    describe(locale, () => {
      it('does not call remote access "secure" in ANY of the consent strings', () => {
        const s = settings(locale);
        // Not just the description: a future translator could reintroduce the claim in
        // the confirm body, which is the last thing read before exposing the listener.
        for (const key of CONSENT_KEYS) {
          expect(s[key], `${locale} is missing ${key}`).toBeTruthy();
          expect(s[key], `${locale}.${key} claims security it does not provide`).not.toMatch(SECURE_CLAIM);
        }
      });

      it('has every consent string, so no user is shown an untranslated key', () => {
        const s = settings(locale);
        for (const key of CONSENT_KEYS) {
          expect(s[key], `${locale} is missing ${key}`).toBeTruthy();
        }
      });
    });
  }

  it('the LAN notice interpolates the actual URL in every locale', () => {
    for (const locale of locales()) {
      expect(settings(locale)['webui.lanExposureNoticeBody'], locale).toContain('{{url}}');
    }
  });

  it('the English copy names both the exposure and the plaintext transport', () => {
    const en = settings('en-US');
    const desc = en['webui.allowRemoteDesc'].toLowerCase();
    expect(desc).toContain('network');
    expect(desc).toContain('http');
    expect(desc).toContain('unencrypted');

    // The confirm body is the last thing a user reads before exposing the listener:
    // it must say who can reach it, that the password is readable, and that it persists.
    const body = en['webui.allowRemoteConfirmBody'].toLowerCase();
    expect(body).toContain('password');
    expect(body).toContain('unencrypted');
    expect(body).toContain('restart');
  });
});
