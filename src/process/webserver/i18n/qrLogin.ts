/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Server-side i18n table for the QR-login HTML page.
 *
 * The QR-login page is served by the Express webserver before any renderer
 * code runs, so it cannot rely on the renderer's translation files. This
 * module owns its own table.
 *
 * Wayland is anglophone-first: non-English locales currently hold English
 * placeholder values so the page never falls back to undefined strings.
 * Native translations land in a follow-up i18n pass.
 */

export type QrLoginLocale = 'en-US' | 'zh-CN' | 'zh-TW' | 'ja-JP' | 'ko-KR' | 'tr-TR' | 'uk-UA' | 'ru-RU';

export interface QrLoginStrings {
  /** `<html lang>` attribute value, e.g. "en". */
  htmlLang: string;
  /** `<title>` content. */
  pageTitle: string;
  /** Brand label shown above the spinner. */
  brand: string;
  /** Initial loading line shown while the token is verified. */
  verifying: string;
  /** Title shown when the URL has no `token` param. */
  invalidTitle: string;
  /** Detail line for the invalid-token state. */
  invalidDetail: string;
  /** Title shown after a successful exchange. */
  successTitle: string;
  /** Detail line for the success state (shown briefly before redirect). */
  redirecting: string;
  /** Title shown when the server returns `{ success: false }`. */
  failedTitle: string;
  /** Fallback detail line when the server returns no error message. */
  expiredDetail: string;
  /** Title shown when the fetch itself throws. */
  networkErrorTitle: string;
  /** Detail line for the network-error state. */
  networkErrorDetail: string;
}

const EN_US: QrLoginStrings = {
  htmlLang: 'en',
  pageTitle: 'QR Login · Wayland',
  brand: 'Wayland',
  verifying: 'Verifying QR code…',
  invalidTitle: 'Invalid QR code',
  invalidDetail: 'The QR code is invalid or missing.',
  successTitle: 'Login successful',
  redirecting: 'Redirecting…',
  failedTitle: 'Login failed',
  expiredDetail: 'QR code expired or invalid. Please scan a fresh one.',
  networkErrorTitle: 'Network error',
  networkErrorDetail: 'Could not reach the server. Please try again.',
};

/**
 * Wayland is anglophone-first. Non-English locales reuse the English copy
 * verbatim until native translations are authored.
 */
export const QR_LOGIN_STRINGS: Record<QrLoginLocale, QrLoginStrings> = {
  'en-US': EN_US,
  'zh-CN': { ...EN_US },
  'zh-TW': { ...EN_US },
  'ja-JP': { ...EN_US },
  'ko-KR': { ...EN_US },
  'tr-TR': { ...EN_US },
  'uk-UA': { ...EN_US },
  'ru-RU': { ...EN_US },
};

const SUPPORTED_LOCALES: readonly QrLoginLocale[] = [
  'en-US',
  'zh-CN',
  'zh-TW',
  'ja-JP',
  'ko-KR',
  'tr-TR',
  'uk-UA',
  'ru-RU',
];

/**
 * Minimal parser for the HTTP `Accept-Language` header.
 *
 * Picks the highest-quality tag that matches one of our supported locales,
 * either exactly (`zh-CN`) or by primary subtag (`zh` → `zh-CN`). Falls back
 * to `en-US` when nothing matches or the header is absent/malformed.
 */
export function pickLocale(acceptLanguage: string | undefined): QrLoginLocale {
  if (!acceptLanguage || typeof acceptLanguage !== 'string') {
    return 'en-US';
  }

  type Candidate = { tag: string; q: number; order: number };
  const candidates: Candidate[] = [];

  const parts = acceptLanguage.split(',');
  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i].trim();
    if (!raw) continue;
    const [tagRaw, ...params] = raw.split(';');
    const tag = tagRaw.trim();
    if (!tag) continue;
    let q = 1;
    for (const param of params) {
      const m = /^\s*q\s*=\s*([0-9.]+)\s*$/i.exec(param);
      if (m) {
        const parsed = parseFloat(m[1]);
        if (!Number.isNaN(parsed)) q = parsed;
      }
    }
    candidates.push({ tag, q, order: i });
  }

  candidates.sort((a, b) => (b.q - a.q) || (a.order - b.order));

  const primaryMap = new Map<string, QrLoginLocale>();
  for (const locale of SUPPORTED_LOCALES) {
    const primary = locale.split('-')[0].toLowerCase();
    if (!primaryMap.has(primary)) {
      primaryMap.set(primary, locale);
    }
  }

  for (const candidate of candidates) {
    if (candidate.q <= 0) continue;
    const normalised = candidate.tag.toLowerCase();
    const matched = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === normalised);
    if (matched) return matched;
    const primary = normalised.split('-')[0];
    const fallback = primaryMap.get(primary);
    if (fallback) return fallback;
  }

  return 'en-US';
}
