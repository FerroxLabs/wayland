/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { selectMirrorModelIds } from '@process/providers/legacyModelConfigBridge';
import { Curator } from '@process/providers/catalog/Curator';
import type { CatalogModel, ProviderId } from '@process/providers/types';

function model(id: string, family: string, releaseDate?: string, kind: CatalogModel['kind'] = 'text'): CatalogModel {
  return {
    id,
    providerId: 'openrouter' as ProviderId,
    displayName: id,
    family,
    kind,
    ...(releaseDate ? { releaseDate } : {}),
    // Enriched (a models.dev match) is what makes a family eligible for curation;
    // real broad-provider catalogs (OpenRouter) are enriched, so the fixture is.
    enriched: true,
    tags: [],
  };
}

// A broad-catalog provider shape (issue #13): families of text models with a
// newest-to-oldest spread (so the Curator enables the recent flagship/previous
// and disables the stale ones) plus a non-text model, mimicking the OpenRouter
// dump that buried the picker.
const CATALOG: CatalogModel[] = [
  model('fam-a/v3', 'fam-a', '2026-05-01'),
  model('fam-a/v2', 'fam-a', '2026-03-15'),
  model('fam-a/v1', 'fam-a', '2024-06-01'),
  model('fam-a/v0', 'fam-a', '2023-01-01'),
  model('fam-b/pro', 'fam-b', '2026-04-01'),
  model('fam-b/mini', 'fam-b', '2026-02-01'),
  model('vendor/image-gen', 'vendor-image', '2026-05-01', 'image'),
];

const curated = new Curator().curate(CATALOG);
const defaultEnabled = curated.filter((m) => m.enabled).map((m) => m.id);
const defaultDisabled = curated.filter((m) => !m.enabled).map((m) => m.id);

describe('selectMirrorModelIds (issue #13)', () => {
  it('mirrors the curated/enabled set, not the full raw catalog', () => {
    const ids = selectMirrorModelIds(CATALOG, []);
    expect(ids.length).toBeLessThan(CATALOG.length); // not a full dump
    expect([...ids].sort()).toEqual([...defaultEnabled].sort());
  });

  it('drops non-text models (image/audio/embedding) from the chat picker', () => {
    const ids = selectMirrorModelIds(CATALOG, []);
    expect(ids).not.toContain('vendor/image-gen');
  });

  it('respects a user override that enables an otherwise-disabled model', () => {
    expect(defaultDisabled.length).toBeGreaterThan(0); // fixture sanity
    const target = defaultDisabled[0];
    const ids = selectMirrorModelIds(CATALOG, [{ modelId: target, enabled: true }]);
    expect(ids).toContain(target);
  });

  it('respects a user override that disables an otherwise-enabled model', () => {
    const target = defaultEnabled[0];
    const ids = selectMirrorModelIds(CATALOG, [{ modelId: target, enabled: false }]);
    expect(ids).not.toContain(target);
  });

  it('#538: an explicit disable-all (user overrides off for every enabled model) empties the picker', () => {
    // Regression of the old "never empty" fallback: when the user deliberately
    // disables every model of a provider, the mirror must NOT re-populate the
    // full curated set - otherwise a disabled provider still supplies the
    // new-chat default (mc14: disabled all OpenAI, still got gpt-5.5).
    const disableAll = defaultEnabled.map((modelId) => ({ modelId, enabled: false }));
    const ids = selectMirrorModelIds(CATALOG, disableAll);
    expect(ids).toEqual([]);
  });

  it('#13 preserved: with NO disabling override, the curated-enabled set is still returned (never blank)', () => {
    // The genuine #13 fallback (Curator-enables-none, user set no disabling
    // override) is untouched: the normal path returns the curated-enabled set
    // rather than an empty picker. Only an explicit disable-all now empties it.
    const ids = selectMirrorModelIds(CATALOG, []);
    expect(ids.length).toBeGreaterThan(0);
  });

  it('returns an empty list for an empty catalog without throwing', () => {
    expect(selectMirrorModelIds([], [])).toEqual([]);
  });
});
