/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Locale parity for the "Available to install" band (T-B).
 *
 * The repo's aggregate coverage gate (`tests/integration/i18n.test.ts`) only
 * requires 70% of keys per language, so a whole new UI surface can ship
 * untranslated in eleven locales without failing anything. This suite closes
 * that specific hole for the install band: EVERY new key must exist in ALL
 * twelve locales, be a non-empty string, and keep every `{{placeholder}}` the
 * English string uses — a dropped `{{version}}` silently stops the card naming
 * what it is about to fetch, which is exactly the fact decision D2 is about.
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import i18nConfig from '@/common/config/i18n-config.json';

const LOCALES_DIR = path.resolve(__dirname, '../../../../src/renderer/services/i18n/locales');
const REFERENCE = i18nConfig.referenceLanguage;
const LANGUAGES: string[] = i18nConfig.supportedLanguages;

type Node = Record<string, unknown>;

function readInstallBlock(locale: string): Node {
  const file = path.join(LOCALES_DIR, locale, 'settings.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf-8')) as Node;
  const agentsPage = json.agentsPage as Node | undefined;
  return (agentsPage?.install ?? {}) as Node;
}

/** Flatten to dotted leaf paths → string value. */
function flatten(node: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof node !== 'object' || node === null) return out;
  for (const [key, value] of Object.entries(node as Node)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(full, value);
    else if (typeof value === 'object' && value !== null) for (const [k, v] of flatten(value, full)) out.set(k, v);
  }
  return out;
}

function placeholders(value: string): string[] {
  return (value.match(/{{\s*[\w-]+\s*}}/g) ?? []).map((m) => m.replace(/\s/g, '')).toSorted();
}

const reference = flatten(readInstallBlock(REFERENCE));

describe('agent install band — locale parity', () => {
  it('covers all twelve shipped locales', () => {
    expect(LANGUAGES).toHaveLength(12);
    expect(LANGUAGES).toContain(REFERENCE);
  });

  it('finds the reference keys it is about to compare against', () => {
    // Known positive: prove the flattener actually reaches the block, so an
    // empty reference (a typo in the path, a renamed namespace) cannot make
    // every assertion below vacuously pass.
    expect(reference.size).toBeGreaterThan(15);
    expect(reference.get('bandTitle')).toBe('Available to install');
    expect(reference.get('consent.destinationLabel')).toBe('Destination');
    expect(reference.get('failed.install-failed')).toBeTruthy();
  });

  it('covers every failure reason the bridge can return', () => {
    // These key names are the wire values of `AgentInstallFailureReason`; a card
    // whose reason has no key renders the raw i18n path at the user. The last
    // two are the REMOVE outcomes: the uninstall channel's own reasons cannot be
    // rendered through the install copy without telling a user whose removal
    // failed that an install stopped.
    for (const reason of [
      'unknown-agent',
      'bundled-bun-unavailable',
      'install-failed',
      'error',
      'remove-failed',
      'receipt-missing',
    ]) {
      expect(reference.has(`failed.${reason}`)).toBe(true);
    }
  });

  for (const locale of LANGUAGES) {
    if (locale === REFERENCE) continue;

    describe(locale, () => {
      const translated = flatten(readInstallBlock(locale));

      it('has every key the reference has', () => {
        const missing = [...reference.keys()].filter((k) => !translated.has(k));
        expect(missing).toEqual([]);
      });

      it('has no key the reference does not have', () => {
        const extra = [...translated.keys()].filter((k) => !reference.has(k));
        expect(extra).toEqual([]);
      });

      it('has a non-empty value for every key', () => {
        const blank = [...translated.entries()].filter(([, v]) => v.trim().length === 0).map(([k]) => k);
        expect(blank).toEqual([]);
      });

      it('keeps every interpolation placeholder the reference uses', () => {
        const dropped: string[] = [];
        for (const [key, en] of reference) {
          const expected = placeholders(en);
          if (expected.length === 0) continue;
          const actual = placeholders(translated.get(key) ?? '');
          if (JSON.stringify(actual) !== JSON.stringify(expected)) dropped.push(`${key}: ${expected} vs ${actual}`);
        }
        expect(dropped).toEqual([]);
      });

      it('is actually translated, not the English string copied across', () => {
        // Sentences only — labels like "Version" legitimately match in several
        // languages, and brand-shaped words do too. A locale that copied the
        // whole block would fail every one of these.
        const sentenceKeys = ['consent.body', 'whyBody', 'failed.install-failed'];
        for (const key of sentenceKeys) {
          expect(translated.get(key)).not.toBe(reference.get(key));
        }
      });
    });
  }
});
