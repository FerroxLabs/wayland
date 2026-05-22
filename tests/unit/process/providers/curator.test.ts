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
    ...over,
  };
}

/**
 * A catalog spanning three Anthropic-style families (each with multiple
 * generations), a fast family, a single-model family, and image/audio models.
 */
function buildCatalog(): CatalogModel[] {
  return [
    // claude-opus family — three generations
    model({ id: 'claude-opus-4', family: 'claude-opus', providerId: 'anthropic', releaseDate: '2025-05-01' }),
    model({ id: 'claude-opus-3', family: 'claude-opus', providerId: 'anthropic', releaseDate: '2024-03-01' }),
    model({ id: 'claude-opus-2', family: 'claude-opus', providerId: 'anthropic', releaseDate: '2023-07-01' }),
    // claude-haiku family — a fast family, two generations
    model({ id: 'claude-haiku-4', family: 'claude-haiku', providerId: 'anthropic', releaseDate: '2025-04-01' }),
    model({ id: 'claude-haiku-3', family: 'claude-haiku', providerId: 'anthropic', releaseDate: '2024-03-01' }),
    // gpt-4 family — two generations
    model({ id: 'gpt-4o', family: 'gpt-4', releaseDate: '2024-05-13' }),
    model({ id: 'gpt-4-turbo', family: 'gpt-4', releaseDate: '2024-04-09' }),
    // gemini-pro family — single model
    model({ id: 'gemini-3-pro', family: 'gemini-pro', providerId: 'google-gemini', releaseDate: '2025-03-01' }),
    // an image model and an audio model — must be excluded from the curated set
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

    // No other model in the gemini-pro family — nothing should be 'previous'.
    const geminiFamily = curated.filter((m) => m.family === 'gemini-pro');
    expect(geminiFamily).toHaveLength(1);
    expect(geminiFamily.every((m) => m.role !== 'previous')).toBe(true);
  });

  it('surfaces a fast family by the same rule — no cost-based special-casing', () => {
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

  it('is pure — the same input yields a deeply equal result on repeat calls', () => {
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
    // Two models in one family sharing an identical releaseDate — the sort is
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
    // No releaseDate anywhere — the sort preserves input order, so the
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
});
