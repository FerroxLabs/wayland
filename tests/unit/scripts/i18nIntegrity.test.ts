/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import { mergeWithFallback } from '@/common/config/i18n';

type I18nConfig = {
  referenceLanguage: string;
  supportedLanguages: string[];
  modules: string[];
};

type WhatsAppSettings = {
  channels: {
    whatsapp: {
      credentials: {
        businessAccountId: { required?: string };
        verifyToken: { required?: string };
      };
    };
  };
};

const ROOT = process.cwd();
const LOCALES = path.join(ROOT, 'src', 'renderer', 'services', 'i18n', 'locales');
const CONFIG = JSON.parse(
  readFileSync(path.join(ROOT, 'src', 'common', 'config', 'i18n-config.json'), 'utf8')
) as I18nConfig;

const readLocaleSettings = (language: string): WhatsAppSettings =>
  JSON.parse(readFileSync(path.join(LOCALES, language, 'settings.json'), 'utf8')) as WhatsAppSettings;

const collectCodeFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectCodeFiles(fullPath);
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [fullPath] : [];
  });

describe('i18n runtime integrity', () => {
  it('uses a translation key prefix instead of an unregistered memory namespace', () => {
    const files = collectCodeFiles(path.join(ROOT, 'src', 'renderer'));
    const offenders = files
      .filter((file) => readFileSync(file, 'utf8').includes("useTranslation('memory')"))
      .map((file) => path.relative(ROOT, file));
    const prefixedConsumers = files.filter((file) => readFileSync(file, 'utf8').includes("keyPrefix: 'memory'"));

    expect(offenders).toEqual([]);
    expect(prefixedConsumers.length).toBeGreaterThan(0);
  });

  it('loads every configured module from every locale barrel', () => {
    const omissions = CONFIG.supportedLanguages.flatMap((language) => {
      const source = readFileSync(path.join(LOCALES, language, 'index.ts'), 'utf8');
      return CONFIG.modules.flatMap((moduleName) => {
        const hasImport = source.includes(`import ${moduleName} from './${moduleName}.json';`);
        const hasExport = new RegExp(`^\\s*${moduleName},\\s*$`, 'm').test(source);
        return hasImport && hasExport ? [] : [`${language}:${moduleName}`];
      });
    });

    expect(omissions).toEqual([]);
  });

  it('falls back to accurate English required text without empty WhatsApp placeholders', () => {
    const reference = readLocaleSettings(CONFIG.referenceLanguage);
    const referenceBusinessAccount = reference.channels.whatsapp.credentials.businessAccountId.required;
    const referenceRequired = reference.channels.whatsapp.credentials.verifyToken.required;
    // The non-English text has not been translator-reviewed. Each locale keeps
    // the accurate English fallback explicitly, rather than an empty value or
    // a fabricated translation; translators can replace it independently.
    const failures = CONFIG.supportedLanguages.flatMap((language) => {
      const locale = readLocaleSettings(language);
      const merged = mergeWithFallback(
        reference as unknown as Record<string, unknown>,
        locale as unknown as Record<string, unknown>
      ) as unknown as WhatsAppSettings;
      const credentials = locale.channels.whatsapp.credentials;
      const mergedCredentials = merged.channels.whatsapp.credentials;
      const issues: string[] = [];

      if (credentials.businessAccountId.required !== referenceBusinessAccount)
        issues.push(`${language}:business-id-fallback`);
      if (mergedCredentials.businessAccountId.required !== referenceBusinessAccount)
        issues.push(`${language}:business-id-merge`);
      if (credentials.verifyToken.required !== referenceRequired) issues.push(`${language}:explicit-fallback`);
      if (mergedCredentials.verifyToken.required !== referenceRequired) issues.push(`${language}:verify-token`);
      return issues;
    });

    expect(referenceBusinessAccount).toBe('Business Account ID is optional for Meta backend');
    expect(referenceRequired).toBe('Verify Token is required for Meta backend');
    expect(failures).toEqual([]);
  });

  it('suppresses only statically resolvable key-prefix and concatenation noise', () => {
    const result = spawnSync(process.execPath, ['scripts/check-i18n.js'], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, I18N_BASE_SHA: '' },
    });
    const output = `${result.stdout}\n${result.stderr}`;

    expect(output).not.toContain('SkillsSettings\\BuildSkillModal.tsx)');
    expect(output).not.toContain('conversation.modelSelector.failure.');
    expect(output).toContain('settings.channels.irc.connectionFailed');
  });
});
