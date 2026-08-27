/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1002 - the routing badge's UNKNOWN state must not claim where the money goes.
 *
 * `resolveFluxRouting` returns `'unknown'` for exactly one reason: the backend is
 * on NO Flux surface list, so Wayland applied no routing and has no idea which
 * credentials the tool ends up billing. Its own comment says so - "Backends not
 * on the generic list resolve 'unknown' ... so the routing badge tells the
 * truth". The badge then rendered "Using this tool's own login", which is not a
 * report of unknown-ness, it is a positive claim about the user's billing.
 *
 * Worse, the renderer's `routing` state INITIALISES to `'unknown'`
 * (useAcpMessage), so that claim was on screen before a single request had been
 * traced.
 *
 * This test freezes the exact strings that made the false claim, in every locale
 * that carried them, so none can come back by a revert or a translation refresh.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const LOCALES_DIR = join(process.cwd(), 'src/renderer/services/i18n/locales');

/**
 * Every locale carrying `conversation.routingBadge`, mapped to the literal that
 * shipped the false "this tool's own login" claim. None of these may return.
 */
const RETIRED_FALSE_CLAIM: Record<string, string> = {
  'en-US': "Using this tool's own login",
  'tr-TR': 'Bu aracin kendi girisi kullaniliyor',
  'fr-FR': 'Utilisation de la session propre de cet outil',
  'de-DE': 'Verwendet eigene Anmeldung dieses Tools',
  'es-ES': 'Usando el acceso propio de esta herramienta',
  'ru-RU': 'Используется собственный вход этого инструмента',
  'ja-JP': 'このツール自身のログインを使用',
  'zh-CN': '使用此工具自身的登录',
  'zh-TW': '使用此工具自身的登入',
  'ko-KR': '이 도구 자체 로그인 사용',
  'pt-BR': 'Usando o login proprio desta ferramenta',
  'uk-UA': 'Використовується власний вхид цього инструменту',
};

function routingBadge(locale: string): Record<string, string> {
  const raw = readFileSync(join(LOCALES_DIR, locale, 'conversation.json'), 'utf8');
  const parsed = JSON.parse(raw) as { routingBadge?: Record<string, string> };
  expect(parsed.routingBadge, `${locale} lost conversation.routingBadge`).toBeTruthy();
  return parsed.routingBadge as Record<string, string>;
}

describe('#1002 routingBadge.unknown states unknown routing, never a billing claim', () => {
  it('covers every locale that ships the badge (guards against a silent locale drop)', () => {
    // Positive control for the "disbelieve a zero" rule: this list must be the
    // locales that actually exist, so a shrunk list cannot make the sweep vacuous.
    for (const locale of Object.keys(RETIRED_FALSE_CLAIM)) {
      expect(routingBadge(locale).flux, `${locale} routingBadge.flux`).toBeTruthy();
    }
    expect(Object.keys(RETIRED_FALSE_CLAIM).length).toBe(12);
  });

  it('no locale still asserts the tool uses its own login', () => {
    for (const [locale, retired] of Object.entries(RETIRED_FALSE_CLAIM)) {
      const value = routingBadge(locale).unknown;
      expect(value, `${locale} routingBadge.unknown is missing`).toBeTruthy();
      expect(value, `${locale} routingBadge.unknown still ships the retired false claim`).not.toBe(retired);
    }
  });

  it('the en-US label makes no credential/account claim at all', () => {
    const value = routingBadge('en-US').unknown.toLowerCase();
    for (const forbidden of ['login', 'log in', 'sign-in', 'sign in', 'account', 'credential', 'key']) {
      expect(value, `en-US routingBadge.unknown must not mention "${forbidden}"`).not.toContain(forbidden);
    }
  });
});
