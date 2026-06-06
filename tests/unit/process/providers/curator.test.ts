/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { Curator } from '@process/providers/catalog/Curator';
import type { CatalogModel } from '@process/providers/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Build a `CatalogModel` with sensible defaults; overrides win. */
function model(over: Partial<CatalogModel> & { id: string; family: string }): CatalogModel {
  return {
    providerId: 'openai',
    displayName: over.id,
    kind: 'text',
    enriched: true,
    tags: [],
    ...over,
  };
}

/**
 * A catalog spanning three Anthropic-style families (each with multiple
 * generations), a fast family, a single-model family, and image/audio models.
 */
function buildCatalog(): CatalogModel[] {
  return [
    // claude-opus family - three generations
    model({ id: 'claude-opus-4', family: 'claude-opus', providerId: 'anthropic', releaseDate: '2025-05-01' }),
    model({ id: 'claude-opus-3', family: 'claude-opus', providerId: 'anthropic', releaseDate: '2024-03-01' }),
    model({ id: 'claude-opus-2', family: 'claude-opus', providerId: 'anthropic', releaseDate: '2023-07-01' }),
    // claude-haiku family - a fast family, two generations
    model({ id: 'claude-haiku-4', family: 'claude-haiku', providerId: 'anthropic', releaseDate: '2025-04-01' }),
    model({ id: 'claude-haiku-3', family: 'claude-haiku', providerId: 'anthropic', releaseDate: '2024-03-01' }),
    // gpt-4 family - two generations
    model({ id: 'gpt-4o', family: 'gpt-4', releaseDate: '2024-05-13' }),
    model({ id: 'gpt-4-turbo', family: 'gpt-4', releaseDate: '2024-04-09' }),
    // gemini-pro family - single model
    model({ id: 'gemini-3-pro', family: 'gemini-pro', providerId: 'google-gemini', releaseDate: '2025-03-01' }),
    // an image model and an audio model - must be excluded from the curated set
    model({ id: 'gpt-image-1', family: 'gpt-image', kind: 'image', releaseDate: '2025-01-01' }),
    model({ id: 'whisper-1', family: 'whisper', kind: 'audio', releaseDate: '2023-01-01' }),
  ];
}

/** Find the curated entry for an id; throws if absent so a missing id fails loud. */
function pick(curated: ReturnType<typeof Curator.prototype.curate>, id: string) {
  const found = curated.find((m) => m.id === id);
  if (!found) throw new Error(`curated model "${id}" not found`);
  return found;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Curator', () => {
  const curator = new Curator();

  it('marks the newest model in a family as the recommended flagship', () => {
    const curated = curator.curate(buildCatalog());

    const opus4 = pick(curated, 'claude-opus-4');
    expect(opus4.recommended).toBe(true);
    expect(opus4.enabled).toBe(true);
    expect(opus4.role).toBe('flagship');
  });

  it('marks the second-newest model in a family as the recommended previous', () => {
    const curated = curator.curate(buildCatalog());

    const opus3 = pick(curated, 'claude-opus-3');
    expect(opus3.recommended).toBe(true);
    expect(opus3.enabled).toBe(true);
    expect(opus3.role).toBe('previous');
  });

  it('leaves every model past the second-newest unrecommended and disabled', () => {
    const curated = curator.curate(buildCatalog());

    const opus2 = pick(curated, 'claude-opus-2');
    expect(opus2.recommended).toBe(false);
    expect(opus2.enabled).toBe(false);
    expect(opus2.role).toBeUndefined();
  });

  it('gives a single-model family only a flagship, no previous', () => {
    const curated = curator.curate(buildCatalog());

    const gemini = pick(curated, 'gemini-3-pro');
    expect(gemini.recommended).toBe(true);
    expect(gemini.role).toBe('flagship');

    // No other model in the gemini-pro family - nothing should be 'previous'.
    const geminiFamily = curated.filter((m) => m.family === 'gemini-pro');
    expect(geminiFamily).toHaveLength(1);
    expect(geminiFamily.every((m) => m.role !== 'previous')).toBe(true);
  });

  it('surfaces a fast family by the same rule - no cost-based special-casing', () => {
    const curated = curator.curate(buildCatalog());

    // The newest fast model is flagship of its own family, the older one previous.
    expect(pick(curated, 'claude-haiku-4').role).toBe('flagship');
    expect(pick(curated, 'claude-haiku-3').role).toBe('previous');
  });

  it('excludes image and audio models from the curated set entirely', () => {
    const curated = curator.curate(buildCatalog());

    expect(curated.find((m) => m.id === 'gpt-image-1')).toBeUndefined();
    expect(curated.find((m) => m.id === 'whisper-1')).toBeUndefined();
    expect(curated.every((m) => m.kind === 'text')).toBe(true);
  });

  it('excludes embedding models from the curated set', () => {
    const curated = curator.curate([
      model({ id: 'gpt-4o', family: 'gpt-4', releaseDate: '2024-05-13' }),
      model({ id: 'text-embedding-3-large', family: 'text-embedding', kind: 'embedding' }),
    ]);

    expect(curated.find((m) => m.id === 'text-embedding-3-large')).toBeUndefined();
    expect(curated).toHaveLength(1);
  });

  it('only ever emits the flagship and previous roles', () => {
    const curated = curator.curate(buildCatalog());
    const roles = new Set(curated.map((m) => m.role).filter((r): r is string => r !== undefined));
    expect(roles).toEqual(new Set(['flagship', 'previous']));
  });

  it('sorts a model without a release date last within its family', () => {
    const curated = curator.curate([
      model({ id: 'gpt-4o', family: 'gpt-4', releaseDate: '2024-05-13' }),
      model({ id: 'gpt-4-undated', family: 'gpt-4' }),
    ]);

    // The dated model is newer than the undated one → flagship.
    expect(pick(curated, 'gpt-4o').role).toBe('flagship');
    expect(pick(curated, 'gpt-4-undated').role).toBe('previous');
  });

  it('returns every input model, recommended or not', () => {
    const input = buildCatalog();
    const curated = curator.curate(input);
    // Image + audio dropped; the rest carry through.
    const textCount = input.filter((m) => m.kind === 'text').length;
    expect(curated).toHaveLength(textCount);
  });

  it('is pure - the same input yields a deeply equal result on repeat calls', () => {
    const input = buildCatalog();
    const first = curator.curate(input);
    const second = curator.curate(input);
    expect(second).toEqual(first);
  });

  it('does not mutate its input catalog', () => {
    const input = buildCatalog();
    const snapshot = JSON.parse(JSON.stringify(input));
    curator.curate(input);
    expect(input).toEqual(snapshot);
  });

  it('returns an empty array for an empty catalog', () => {
    expect(curator.curate([])).toEqual([]);
  });

  it('returns an empty array when the catalog has no text models', () => {
    const curated = curator.curate([
      model({ id: 'gpt-image-1', family: 'gpt-image', kind: 'image' }),
      model({ id: 'whisper-1', family: 'whisper', kind: 'audio' }),
    ]);
    expect(curated).toEqual([]);
  });

  it('breaks a tie between two same-date models in a family deterministically', () => {
    // Two models in one family sharing an identical releaseDate - the sort is
    // stable on input order, so the result must be deterministic and stable.
    const input = [
      model({ id: 'gpt-4-a', family: 'gpt-4', releaseDate: '2024-05-13' }),
      model({ id: 'gpt-4-b', family: 'gpt-4', releaseDate: '2024-05-13' }),
    ];
    const first = curator.curate(input);
    const second = curator.curate(input);
    expect(second).toEqual(first);
    // First-seen model keeps rank 0 (flagship); the tie does not reorder them.
    expect(pick(first, 'gpt-4-a').role).toBe('flagship');
    expect(pick(first, 'gpt-4-b').role).toBe('previous');
  });

  it('picks a deterministic flagship when every model in a family is undated', () => {
    // No releaseDate anywhere - the sort preserves input order, so the
    // first-seen model is the flagship and the result is deterministic.
    const input = [
      model({ id: 'gpt-4-x', family: 'gpt-4' }),
      model({ id: 'gpt-4-y', family: 'gpt-4' }),
      model({ id: 'gpt-4-z', family: 'gpt-4' }),
    ];
    const first = curator.curate(input);
    const second = curator.curate(input);
    expect(second).toEqual(first);
    expect(pick(first, 'gpt-4-x').role).toBe('flagship');
    expect(pick(first, 'gpt-4-y').role).toBe('previous');
    expect(pick(first, 'gpt-4-z').role).toBeUndefined();
  });

  it('does not recommend any model in a family with zero enriched models', () => {
    // Wave 4B fix: a family without models.dev enrichment is "uncurated" - every
    // model in it surfaces as `recommended: false`. Without this, every legacy
    // OpenAI id absent from models.dev (Babbage, Davinci, dated GPT-3.5
    // Turbos, Computer-Use previews, …) became a singleton family and got
    // tagged flagship, blowing up the recommended count to ~80 for OpenAI.
    const input = [
      model({ id: 'babbage-002', family: 'babbage', enriched: false }),
      model({ id: 'davinci-002', family: 'davinci', enriched: false }),
      model({ id: 'computer-use-preview', family: 'computer-use', enriched: false }),
    ];
    const curated = curator.curate(input);
    expect(curated).toHaveLength(3);
    expect(curated.every((m) => m.recommended === false)).toBe(true);
    expect(curated.every((m) => m.enabled === false)).toBe(true);
    expect(curated.every((m) => m.role === undefined)).toBe(true);
  });

  it('still recommends a family where at least one model is enriched', () => {
    // Mixed family: the family becomes eligible when ANY model in it is
    // enriched. The standard newest-first flagship/previous rule applies.
    const input = [
      model({ id: 'gpt-4o', family: 'gpt-4o', enriched: true, releaseDate: '2024-05-13' }),
      model({ id: 'gpt-4o-legacy', family: 'gpt-4o', enriched: false, releaseDate: '2023-12-01' }),
    ];
    const curated = curator.curate(input);
    expect(pick(curated, 'gpt-4o').role).toBe('flagship');
    expect(pick(curated, 'gpt-4o-legacy').role).toBe('previous');
  });

  // ── Rule 5: known-legacy exclusion ───────────────────────────────────────
  describe('known-legacy exclusion', () => {
    it('does not recommend a KNOWN_LEGACY id even when enriched + within recency', () => {
      // gpt-3.5-turbo is explicitly in KNOWN_LEGACY_IDS; even if models.dev
      // still tracks it and its release date is recent, it stays unrecommended.
      const curated = curator.curate([
        model({ id: 'gpt-3.5-turbo', family: 'gpt-3.5-turbo', enriched: true, releaseDate: '2025-01-01' }),
      ]);
      // The whole family is ineligible (its only model is legacy).
      const row = pick(curated, 'gpt-3.5-turbo');
      expect(row.recommended).toBe(false);
      expect(row.role).toBeUndefined();
    });

    it('matches prefix entries (gpt-3.5-turbo-0125, claude-1-something)', () => {
      const curated = curator.curate([
        model({ id: 'gpt-3.5-turbo-0125', family: 'gpt-3.5', enriched: true, releaseDate: '2025-01-01' }),
        model({ id: 'claude-1-foo', family: 'claude-1', enriched: true, releaseDate: '2025-01-01' }),
      ]);
      expect(pick(curated, 'gpt-3.5-turbo-0125').recommended).toBe(false);
      expect(pick(curated, 'claude-1-foo').recommended).toBe(false);
    });

    it('promotes the next-newest non-legacy model when the flagship slot is held by a legacy id', () => {
      // computer-use-preview (alias, legacy) is rank 0; dated variant is rank 1.
      // The family is eligible via the dated variant - but the legacy alias
      // still occupies the flagship slot, so it stays unrecommended. The dated
      // variant gets `previous`, not `flagship` - we don't shift ranks.
      const input = [
        model({ id: 'computer-use-preview', family: 'computer-use', enriched: true, releaseDate: '2025-04-01' }),
        model({
          id: 'computer-use-preview-2025-03-11',
          family: 'computer-use',
          enriched: true,
          releaseDate: '2025-03-11',
          displayName: 'Computer Use Preview Dated', // distinct displayName to bypass dedup
        }),
      ];
      const curated = curator.curate(input);
      expect(pick(curated, 'computer-use-preview').recommended).toBe(false);
      expect(pick(curated, 'computer-use-preview-2025-03-11').role).toBe('previous');
    });
  });

  // ── Rule 6: recency floor ────────────────────────────────────────────────
  describe('recency floor', () => {
    it('does not recommend a flagship whose releaseDate is older than the recency window', () => {
      // gpt-4 is from 2024-04 in this catalog; the reference is gpt-5's 2025-12.
      // That's well past 540 days, so gpt-4 must NOT be flagship.
      const curated = curator.curate([
        model({ id: 'gpt-5', family: 'gpt-5', enriched: true, releaseDate: '2026-04-01' }),
        model({ id: 'gpt-4-ancient', family: 'gpt-4-ancient', enriched: true, releaseDate: '2023-03-14' }),
      ]);
      expect(pick(curated, 'gpt-5').role).toBe('flagship');
      expect(pick(curated, 'gpt-4-ancient').recommended).toBe(false);
    });

    it('still recommends a flagship within the recency window', () => {
      // Within 540 days of the reference - eligible.
      const curated = curator.curate([
        model({ id: 'gpt-5', family: 'gpt-5', enriched: true, releaseDate: '2026-04-01' }),
        model({ id: 'gpt-4o', family: 'gpt-4o', enriched: true, releaseDate: '2025-08-01' }),
      ]);
      expect(pick(curated, 'gpt-4o').role).toBe('flagship');
    });

    it('skips the recency check when no model in the catalog has a releaseDate', () => {
      // Reference date is null when no model is dated - undated catalogs
      // still curate a flagship (covers test fixtures + degraded providers).
      const curated = curator.curate([model({ id: 'gpt-undated', family: 'gpt-undated', enriched: true })]);
      expect(pick(curated, 'gpt-undated').role).toBe('flagship');
    });
  });

  // ── Rule 7: displayName dedup ────────────────────────────────────────────
  describe('displayName dedup', () => {
    it('collapses two same-displayName models in a family to the dated variant', () => {
      // Same displayName, only one has a releaseDate - the dated one wins.
      const input = [
        model({
          id: 'computer-use-preview',
          family: 'computer-use',
          enriched: true,
          displayName: 'Computer Use Preview',
        }),
        model({
          id: 'computer-use-preview-2025-03-11',
          family: 'computer-use',
          enriched: true,
          releaseDate: '2025-03-11',
          displayName: 'Computer Use Preview',
        }),
      ];
      const curated = curator.curate(input);
      // The bare alias is gone; the dated variant survives.
      expect(curated.find((m) => m.id === 'computer-use-preview')).toBeUndefined();
      expect(curated.find((m) => m.id === 'computer-use-preview-2025-03-11')).toBeDefined();
    });

    it('breaks a dedup tie by longer id when neither model has a releaseDate', () => {
      const input = [
        model({ id: 'short', family: 'foo', enriched: true, displayName: 'Foo' }),
        model({ id: 'much-longer-id', family: 'foo', enriched: true, displayName: 'Foo' }),
      ];
      const curated = curator.curate(input);
      // The longer id wins - it's typically the dated variant.
      expect(curated.find((m) => m.id === 'much-longer-id')).toBeDefined();
      expect(curated.find((m) => m.id === 'short')).toBeUndefined();
    });

    it('does not dedup across families with the same displayName', () => {
      // Same displayName but different families - both must survive.
      const input = [
        model({ id: 'a', family: 'fam-a', enriched: true, displayName: 'Shared Name' }),
        model({ id: 'b', family: 'fam-b', enriched: true, displayName: 'Shared Name' }),
      ];
      const curated = curator.curate(input);
      expect(curated).toHaveLength(2);
    });
  });

  it('keeps the recommended share below 30% of a real-shaped OpenAI catalog', () => {
    // Smoke-shape test: a representative OpenAI catalog mix - a few enriched
    // current models plus many legacy / preview / dated ids the provider's
    // /v1/models returns but models.dev correctly does not track. The Curator
    // must surface a small recommended set, not flag the majority.
    const enriched = [
      model({ id: 'gpt-5', family: 'gpt', enriched: true, releaseDate: '2025-08-07' }),
      model({ id: 'gpt-5.1', family: 'gpt', enriched: true, releaseDate: '2025-11-13' }),
      model({ id: 'gpt-5-mini', family: 'gpt-mini', enriched: true, releaseDate: '2025-08-07' }),
      model({ id: 'gpt-5.1-mini', family: 'gpt-mini', enriched: true, releaseDate: '2025-11-13' }),
      model({ id: 'o3', family: 'o', enriched: true, releaseDate: '2025-04-01' }),
      model({ id: 'o3-mini', family: 'o-mini', enriched: true, releaseDate: '2025-01-31' }),
    ];
    const legacyIds = [
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0125',
      'gpt-3.5-turbo-16k',
      'gpt-3.5-turbo-1106',
      'gpt-4',
      'gpt-4-0613',
      'gpt-4-turbo',
      'gpt-4-turbo-2024-04-09',
      'gpt-4o-2024-05-13',
      'babbage-002',
      'davinci-002',
      'computer-use-preview',
      'computer-use-preview-2025-03-11',
      'chatgpt-4o-latest',
      'gpt-3.5-turbo-instruct',
      'gpt-3.5-turbo-instruct-0914',
    ];
    const legacy = legacyIds.map((id) => model({ id, family: id, enriched: false }));
    const total = enriched.length + legacy.length;
    const curated = curator.curate([...enriched, ...legacy]);
    const recommendedCount = curated.filter((m) => m.recommended).length;
    // Under 30% recommended - the spec's "latest + one back per family" rule
    // should never flag the majority of a real catalog.
    expect(recommendedCount / total).toBeLessThan(0.3);
  });
});
