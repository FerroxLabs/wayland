/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** Default locale every preset is authored in; other locales fall back to it at read time. */
export const DEFAULT_PRESET_LOCALE = 'en-US';

export type PresetLocaleFileEntry = {
  locale: string;
  file: string;
};

export type PresetLocaleFilePlan = {
  /** Entries whose source file exists and must be copied to the assistants cache. */
  copies: PresetLocaleFileEntry[];
  /**
   * Entries whose absence is a packaging error worth a warning: the default-locale
   * file itself is missing, or a locale variant is missing with no default to fall
   * back to.
   */
  missing: PresetLocaleFileEntry[];
  /**
   * Absent non-default locale variants that were never authored. Skipped silently:
   * the read path (readAssistantResource / loadPresetAssistantResources) already
   * falls back to the default locale, so per-file warnings are just noise (#719).
   */
  skipped: PresetLocaleFileEntry[];
};

/**
 * Decide, for a preset's locale→file map, which files to copy, which missing
 * files deserve a warning, and which absent locale variants to skip silently.
 */
export function planPresetLocaleFileCopies(
  files: Record<string, string>,
  fileExists: (file: string) => boolean,
  defaultLocale: string = DEFAULT_PRESET_LOCALE
): PresetLocaleFilePlan {
  const plan: PresetLocaleFilePlan = { copies: [], missing: [], skipped: [] };
  const defaultFile = files[defaultLocale];
  const hasDefault = Boolean(defaultFile && fileExists(defaultFile));

  for (const [locale, file] of Object.entries(files)) {
    if (fileExists(file)) {
      plan.copies.push({ locale, file });
    } else if (locale !== defaultLocale && hasDefault) {
      plan.skipped.push({ locale, file });
    } else {
      plan.missing.push({ locale, file });
    }
  }

  return plan;
}
