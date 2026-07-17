/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const tempDirs: string[] = [];

const writeJson = (filePath: string, value: unknown): void => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const writeTypeFile = (root: string, keys: string[]): void => {
  const values = keys.map((key) => `  | '${key}'`).join('\n');
  writeFileSync(
    path.join(root, 'src/renderer/services/i18n/i18n-keys.d.ts'),
    `export type I18nKey =\n${values};\nexport type I18nModule =\n  | 'common';\n`,
    'utf8'
  );
};

const makeFixture = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'wayland-i18n-gate-'));
  tempDirs.push(root);
  mkdirSync(path.join(root, 'scripts'), { recursive: true });
  cpSync(path.join(ROOT, 'scripts/check-i18n.js'), path.join(root, 'scripts/check-i18n.js'));
  writeFileSync(
    path.join(root, 'scripts/generate-i18n-types.js'),
    `const fs = require('fs');
const path = require('path');
const REQUIRED_MODULES = ['common'];
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? prefix + '.' + key : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) keys.push(...getAllKeys(value, full));
    else keys.push(full);
  }
  return keys;
}
function collectReferenceKeys() {
  const file = path.join(__dirname, '../src/renderer/services/i18n/locales/en-US/common.json');
  return getAllKeys(JSON.parse(fs.readFileSync(file, 'utf8'))).map((key) => 'common.' + key);
}
module.exports = { REQUIRED_MODULES, collectReferenceKeys, getAllKeys };\n`,
    'utf8'
  );
  writeJson(path.join(root, 'src/common/config/i18n-config.json'), {
    referenceLanguage: 'en-US',
    fallbackLanguage: 'en-US',
    supportedLanguages: ['en-US', 'fr-FR'],
    modules: ['common'],
  });
  for (const lang of ['en-US', 'fr-FR']) {
    mkdirSync(path.join(root, 'src/renderer/services/i18n/locales', lang), { recursive: true });
  }
  writeFileSync(
    path.join(root, 'src/renderer/services/i18n/index.ts'),
    `import config from '@/common/config/i18n-config.json';\nexport const supportedLanguages = config.supportedLanguages;\nexport function loadLocaleModules() {}\n`,
    'utf8'
  );
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'fixture@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Fixture'], { cwd: root });
  return root;
};

const commitBase = (root: string, en: unknown, fr: unknown, keys: string[]): string => {
  writeJson(path.join(root, 'src/renderer/services/i18n/locales/en-US/common.json'), en);
  writeJson(path.join(root, 'src/renderer/services/i18n/locales/fr-FR/common.json'), fr);
  writeTypeFile(root, keys);
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'base'], { cwd: root });
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
};

const runCheck = (root: string, baseSha: string) =>
  spawnSync(process.execPath, ['scripts/check-i18n.js'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, I18N_BASE_SHA: baseSha },
  });

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('i18n PR regression gate', () => {
  it('fails only for missing translation keys introduced after the base commit', () => {
    const root = makeFixture();
    const base = commitBase(root, { old: 'Old', legacy: 'Legacy' }, { old: 'Vieux' }, ['common.old', 'common.legacy']);
    writeJson(path.join(root, 'src/renderer/services/i18n/locales/en-US/common.json'), {
      old: 'Old',
      legacy: 'Legacy',
      added: 'Added',
    });
    writeTypeFile(root, ['common.old', 'common.legacy', 'common.added']);

    const result = runCheck(root, base);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain('fr-FR/common.json newly missing: added');
  });

  it('allows existing translation debt when the PR adds no new omission', () => {
    const root = makeFixture();
    const base = commitBase(root, { old: 'Old', legacy: 'Legacy' }, { old: 'Vieux' }, ['common.old', 'common.legacy']);

    const result = runCheck(root, base);

    expect(result.status).toBe(0);
    expect(readFileSync(path.join(root, 'src/renderer/services/i18n/locales/fr-FR/common.json'), 'utf8')).not.toContain(
      'legacy'
    );
  });

  it('fails when a PR introduces a new empty translation value', () => {
    const root = makeFixture();
    const base = commitBase(root, { old: 'Old' }, { old: 'Vieux' }, ['common.old']);
    writeJson(path.join(root, 'src/renderer/services/i18n/locales/fr-FR/common.json'), { old: '' });

    const result = runCheck(root, base);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain('fr-FR/common.json newly empty: old');
  });

  it('fails when renderer code introduces a literal key absent from the reference locale', () => {
    const root = makeFixture();
    const base = commitBase(root, { old: 'Old' }, { old: 'Vieux' }, ['common.old']);
    writeFileSync(
      path.join(root, 'src/renderer/NewSurface.tsx'),
      "export const NewSurface = ({ t }) => t('common.notTranslated');\n",
      'utf8'
    );

    const result = runCheck(root, base);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain('new unknown literal i18n key: common.notTranslated');
  });

  it('fails when the reference locale removes a key', () => {
    const root = makeFixture();
    const base = commitBase(root, { old: 'Old' }, { old: 'Vieux' }, ['common.old']);
    writeJson(path.join(root, 'src/renderer/services/i18n/locales/en-US/common.json'), {});
    writeTypeFile(root, []);

    const result = runCheck(root, base);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain('en-US/common.json removed reference keys: old');
  });

  it('fails when a changed file adds another use of existing unknown literal-key debt', () => {
    const root = makeFixture();
    const legacySurface = path.join(root, 'src/renderer/LegacySurface.tsx');
    writeFileSync(legacySurface, "export const LegacySurface = ({ t }) => t('common.legacyMissing');\n", 'utf8');
    const base = commitBase(root, { old: 'Old' }, { old: 'Vieux' }, ['common.old']);
    writeFileSync(
      legacySurface,
      "export const LegacySurface = ({ t }) => [t('common.legacyMissing'), t('common.legacyMissing')];\n",
      'utf8'
    );

    const result = runCheck(root, base);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain('new unknown literal i18n key: common.legacyMissing');
  });

  it('allows existing unknown literal-key debt when the PR adds no new usage', () => {
    const root = makeFixture();
    writeFileSync(
      path.join(root, 'src/renderer/LegacySurface.tsx'),
      "export const LegacySurface = ({ t }) => t('common.legacyMissing');\n",
      'utf8'
    );
    const base = commitBase(root, { old: 'Old' }, { old: 'Vieux' }, ['common.old']);

    const result = runCheck(root, base);

    expect(result.status).toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).not.toContain('new unknown literal i18n key');
  });
});
