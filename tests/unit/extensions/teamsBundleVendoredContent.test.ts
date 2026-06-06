/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * W1a - Static smoke for the VENDORED waylandteams bundle.
 *
 * Distinct from teamsBundleSmoke.test.ts (which exercises the live ExtensionLoader
 * against a dev-mounted bundle and auto-skips if not mounted). This file tests the
 * vendored JSON snapshot at src/process/extensions/data/bundle-vendored/assistants.json
 * for the W1a schema additions (teammates / rituals / standing) and the locked
 * Standing Companies set.
 *
 * Runs unconditionally - the vendored file is in the repo.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';

type BundleEntry = {
  id: string;
  kind?: 'team' | 'specialist';
  teammates?: string[];
  rituals?: Array<{ name: string; cadence: string }>;
  standing?: boolean;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundlePath = join(__dirname, '../../../src/process/extensions/data/bundle-vendored/assistants.json');
const bundle: BundleEntry[] = JSON.parse(readFileSync(bundlePath, 'utf-8'));

// Per TEAM-BLITZ-PLAN.md §1 D7 + DISPATCH-PACKETS.md W1a T1a.4 - locked Standing Companies set.
// book-publishing-house joined the Standing Companies group when synced from upstream
// (~/dev/waylandteams) as the 7th launcher with standing:true + a weekly-checkin ritual.
const STANDING_IDS = [
  'book-publishing-house',
  'customer-success-org',
  'dev-shop',
  'editorial-newsroom',
  'marketing-agency',
  'quiet-money-standing',
  'sales-org',
];

describe('teams bundle (vendored) - content smoke', () => {
  it('has 55 entries: 27 launchers (kind=team) + 28 specialists (kind=specialist)', () => {
    expect(bundle.length).toBe(55);
    expect(bundle.filter((a) => a.kind === 'team').length).toBe(27);
    expect(bundle.filter((a) => a.kind === 'specialist').length).toBe(28);
  });

  it('every launcher teammate resolves to a real specialist (bundle specialist or builtin preset)', () => {
    // A launcher teammate resolves to EITHER a bundle specialist OR a builtin
    // assistant preset. book-publishing-house is the case in point: its 5
    // teammates (book-story-architect, book-nonfiction-architect,
    // book-developmental-editor, book-copy-editor, book-production) ship as
    // builtin presets (assistantPresets.ts: resourceDir prose + SKILL.md +
    // HANDOFF-CONTRACT), not as bundle specialists, and resolve via that path at
    // runtime. This check still fails on a genuine orphan (a teammate that
    // matches neither source).
    const resolvable = new Set<string>([
      ...bundle.filter((a) => a.kind === 'specialist').map((a) => a.id),
      ...ASSISTANT_PRESETS.map((p) => p.id),
    ]);
    const orphans: string[] = [];
    for (const launcher of bundle.filter((a) => a.kind === 'team')) {
      for (const tm of launcher.teammates ?? []) {
        if (!resolvable.has(tm)) {
          orphans.push(`${launcher.id} -> ${tm}`);
        }
      }
    }
    expect(orphans, `Launcher orphans (no bundle specialist or builtin preset): ${orphans.join(', ')}`).toEqual([]);
  });

  it('exactly the 7 Standing Companies have standing:true and non-empty rituals[]', () => {
    const standing = bundle.filter((a) => a.standing === true);
    expect(standing.map((a) => a.id).sort()).toEqual(STANDING_IDS);
    for (const company of standing) {
      expect(Array.isArray(company.rituals)).toBe(true);
      expect((company.rituals ?? []).length).toBeGreaterThan(0);
      for (const r of company.rituals ?? []) {
        expect(typeof r.name).toBe('string');
        expect(r.name.length).toBeGreaterThan(0);
        expect(typeof r.cadence).toBe('string');
        expect(r.cadence.length).toBeGreaterThan(0);
      }
    }
  });

  it('zero non-launcher entries have teammates, rituals, or standing:true', () => {
    for (const entry of bundle.filter((a) => a.kind !== 'team')) {
      expect(entry.teammates).toBeUndefined();
      expect(entry.rituals).toBeUndefined();
      expect(entry.standing === true).toBe(false);
    }
  });

  it('every launcher has a non-empty teammates array', () => {
    for (const launcher of bundle.filter((a) => a.kind === 'team')) {
      expect(Array.isArray(launcher.teammates)).toBe(true);
      expect((launcher.teammates ?? []).length).toBeGreaterThan(0);
    }
  });
});
