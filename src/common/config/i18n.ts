/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared i18n utility functions used by both main process and renderer.
 */

import i18nConfig from '@/common/config/i18n-config.json';

export const SUPPORTED_LANGUAGES = i18nConfig.supportedLanguages;
export const DEFAULT_LANGUAGE = i18nConfig.fallbackLanguage;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Canonical display order for the language picker, used EVERYWHERE a language
 * list is rendered (Web UI login, Settings, etc.) so the order never drifts
 * between surfaces. Each language is shown in its own native name (endonym).
 *
 * Order: English first, then Western European (by prominence), then East Asian,
 * Cyrillic, and Turkic groups. Keep in sync with
 * `i18n-config.json#supportedLanguages` (same set; the JSON drives validation,
 * this drives display order + labels).
 */
export const LANGUAGE_OPTIONS: ReadonlyArray<{ code: SupportedLanguage; label: string }> = [
  { code: 'en-US', label: 'English' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'uk-UA', label: 'Українська' },
  { code: 'tr-TR', label: 'Türkçe' },
];

/**
 * Normalize a language code to a supported BCP 47 tag.
 * e.g. 'zh' → 'zh-CN', 'ja_JP' → 'ja-JP'
 */
export function normalizeLanguageCode(language: string): SupportedLanguage {
  const normalized = language.replace(/_/g, '-');

  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }

  const langOnly = normalized.toLowerCase().split('-')[0];
  switch (langOnly) {
    case 'zh':
      return 'zh-CN';
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    case 'tr':
      return 'tr-TR';
    case 'ru':
      return 'ru-RU';
    case 'uk':
      return 'uk-UA';
    default:
      return DEFAULT_LANGUAGE;
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge `target` into `fallback`, so that any key missing in `target`
 * falls back to the value in `fallback`.
 */
export function mergeWithFallback(
  fallback: Record<string, unknown>,
  target: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...fallback };

  for (const [key, value] of Object.entries(target)) {
    const fallbackValue = merged[key];
    if (isPlainObject(fallbackValue) && isPlainObject(value)) {
      merged[key] = mergeWithFallback(fallbackValue, value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

export type LocaleData = Record<string, Record<string, unknown>>;

/**
 * Ensure a resource bundle is loaded, then switch i18next to the given language.
 * Deduplicates the "load-if-missing + changeLanguage" pattern.
 */
export async function ensureAndSwitch(
  i18n: {
    hasResourceBundle: (lng: string, ns: string) => boolean;
    addResourceBundle: (...args: unknown[]) => void;
    changeLanguage: (lng: string) => Promise<unknown>;
  },
  lang: string,
  getTranslation: (locale: string) => Record<string, unknown> | Promise<Record<string, unknown>>
): Promise<void> {
  const normalizedLang = normalizeLanguageCode(lang);
  if (!i18n.hasResourceBundle(normalizedLang, 'translation')) {
    const translation = await getTranslation(normalizedLang);
    i18n.addResourceBundle(normalizedLang, 'translation', translation, true, true);
  }
  await i18n.changeLanguage(normalizedLang);
}
