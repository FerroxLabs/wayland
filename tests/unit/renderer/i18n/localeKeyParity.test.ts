import { describe, expect, it } from 'vitest';

import deDE from '@/renderer/services/i18n/locales/de-DE/index';
import enUS from '@/renderer/services/i18n/locales/en-US/index';
import esES from '@/renderer/services/i18n/locales/es-ES/index';
import frFR from '@/renderer/services/i18n/locales/fr-FR/index';
import jaJP from '@/renderer/services/i18n/locales/ja-JP/index';
import koKR from '@/renderer/services/i18n/locales/ko-KR/index';
import ptBR from '@/renderer/services/i18n/locales/pt-BR/index';
import ruRU from '@/renderer/services/i18n/locales/ru-RU/index';
import trTR from '@/renderer/services/i18n/locales/tr-TR/index';
import ukUA from '@/renderer/services/i18n/locales/uk-UA/index';
import zhCN from '@/renderer/services/i18n/locales/zh-CN/index';
import zhTW from '@/renderer/services/i18n/locales/zh-TW/index';

import knownGaps from './localeKeyParity.baseline.json';

// The runtime i18next bundle is built from these default exports, so this test
// compares what actually ships, not what merely sits on disk.
const REFERENCE_LOCALE = 'en-US';

const LOCALE_BUNDLES: Record<string, Record<string, unknown>> = {
  'de-DE': deDE,
  'en-US': enUS,
  'es-ES': esES,
  'fr-FR': frFR,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'pt-BR': ptBR,
  'ru-RU': ruRU,
  'tr-TR': trTR,
  'uk-UA': ukUA,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

const TRANSLATION_LOCALES = Object.keys(LOCALE_BUNDLES).filter((locale) => locale !== REFERENCE_LOCALE);

/**
 * Frozen snapshot of the key gaps that already existed when this test was
 * written. It exists so the suite can enforce strict parity on everything new
 * without first paying down 406 keys of pre-existing debt. It is an allowance,
 * not a target: entries may be removed as translations land, never added.
 * A key missing from a locale and NOT listed here fails this suite.
 */
const KNOWN_GAPS = knownGaps as Record<string, string[]>;

function collectKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [];
  }

  const keys: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'object' && child !== null) {
      keys.push(...collectKeys(child, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Memoized because the stale-baseline sweep below asks for a locale's key set
 * once per (baseline key, locale) pair - several thousand times - and each
 * uncached call walked that locale's entire bundle again. That made the sweep
 * cost O(baseline entries x locales x bundle size) and pushed it to ~3s
 * unloaded against a 10s limit, so it timed out under a loaded full-suite run
 * as soon as any new keys were added. The bundles are static module imports and
 * are never mutated, so caching cannot change any result here.
 */
const KEY_SET_CACHE = new Map<string, Set<string>>();

function keySet(locale: string): Set<string> {
  const cached = KEY_SET_CACHE.get(locale);
  if (cached) return cached;
  const computed = new Set(collectKeys(LOCALE_BUNDLES[locale]));
  KEY_SET_CACHE.set(locale, computed);
  return computed;
}

function isKnownGap(key: string, locale: string): boolean {
  return KNOWN_GAPS[key]?.includes(locale) ?? false;
}

const referenceKeys = collectKeys(LOCALE_BUNDLES[REFERENCE_LOCALE]);

/**
 * Keys added for the voice conversation composer. They are asserted separately
 * from the baseline-tolerant sweep so no future baseline edit can excuse them.
 */
const VOICE_COMPOSER_KEYS = [
  'conversation.chat.speech.setupLabel',
  'conversation.chat.speech.setupTooltip',
  'conversation.chat.voice.startLabel',
  'conversation.chat.voice.startTitle',
  'conversation.chat.voice.endLabel',
  'conversation.chat.voice.endTitle',
  'conversation.chat.voice.stopSpeaking',
  'conversation.chat.voice.mute',
  'conversation.chat.voice.unmute',
];

function readKey(bundle: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((node, segment) => {
    if (typeof node !== 'object' || node === null) return undefined;
    return (node as Record<string, unknown>)[segment];
  }, bundle);
}

describe('locale key parity', () => {
  it('has a reference locale with keys to compare against', () => {
    expect(referenceKeys.length).toBeGreaterThan(0);
  });

  it.each(TRANSLATION_LOCALES)('%s defines every en-US key outside the frozen baseline', (locale) => {
    const localeKeys = keySet(locale);
    const missing = referenceKeys.filter((key) => !localeKeys.has(key) && !isKnownGap(key, locale));

    expect(
      missing,
      missing.length === 0
        ? ''
        : `${locale} is missing ${missing.length} key(s) present in ${REFERENCE_LOCALE}:\n` +
            missing.map((key) => `  - ${locale} :: ${key}`).join('\n') +
            `\nAdd them to src/renderer/services/i18n/locales/${locale}/, or, only for pre-existing debt, ` +
            'to tests/unit/renderer/i18n/localeKeyParity.baseline.json.'
    ).toEqual([]);
  });

  it('baseline contains no stale entries', () => {
    const stale: string[] = [];
    for (const [key, locales] of Object.entries(KNOWN_GAPS)) {
      for (const locale of locales) {
        if (keySet(locale).has(key)) {
          stale.push(`${locale} :: ${key}`);
        }
      }
    }

    expect(
      stale,
      stale.length === 0
        ? ''
        : 'These baseline entries are now translated and must be removed from ' +
            `localeKeyParity.baseline.json:\n${stale.map((entry) => `  - ${entry}`).join('\n')}`
    ).toEqual([]);
  });

  describe('voice composer keys', () => {
    it.each(Object.keys(LOCALE_BUNDLES))('%s defines every voice composer key', (locale) => {
      const bundle = LOCALE_BUNDLES[locale];
      const missing = VOICE_COMPOSER_KEYS.filter((key) => typeof readKey(bundle, key) !== 'string');

      expect(
        missing,
        missing.length === 0 ? '' : `${locale} is missing:\n${missing.map((key) => `  - ${locale} :: ${key}`).join('\n')}`
      ).toEqual([]);
    });

    it.each(TRANSLATION_LOCALES)('%s translates the voice composer keys rather than copying English', (locale) => {
      const untranslated = VOICE_COMPOSER_KEYS.filter(
        (key) => readKey(LOCALE_BUNDLES[locale], key) === readKey(LOCALE_BUNDLES[REFERENCE_LOCALE], key)
      );

      expect(
        untranslated,
        untranslated.length === 0
          ? ''
          : `${locale} still holds the en-US string for:\n${untranslated.map((key) => `  - ${locale} :: ${key}`).join('\n')}`
      ).toEqual([]);
    });
  });
});
