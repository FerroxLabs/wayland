/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect } from 'vitest';
import { selectImageModelIds } from '@process/providers/legacyModelConfigBridge';
import type { CatalogModel } from '@process/providers/types';

function model(id: string, kind: CatalogModel['kind'], releaseDate?: string): CatalogModel {
  return { id, providerId: 'openai', displayName: id, family: id, kind, enriched: true, tags: [], releaseDate };
}

describe('selectImageModelIds', () => {
  it('keeps kind:image models and drops unrelated text/audio', () => {
    const catalog = [model('gpt-5', 'text'), model('gpt-image-1.5', 'image'), model('whisper-1', 'audio')];
    expect(selectImageModelIds(catalog)).toEqual(['gpt-image-1.5']);
  });

  it('includes unenriched image models that models.dev has not tagged yet (e.g. gpt-image-2)', () => {
    // gpt-image-2 is too new for models.dev: unenriched, defaulted to kind:text,
    // no image tag. It must still surface because its id looks like an image model.
    const catalog = [
      model('gpt-5', 'text', '2025-08-01'),
      { ...model('gpt-image-2', 'text', '2026-04-21'), enriched: false },
      model('gpt-image-1.5', 'image', '2025-11-25'),
    ];
    expect(selectImageModelIds(catalog)).toEqual(['gpt-image-2', 'gpt-image-1.5']);
  });

  it('sorts newest releaseDate first so the best current model leads', () => {
    const catalog = [
      model('gpt-image-1', 'image', '2025-04-24'),
      model('chatgpt-image-latest', 'image', '2025-12-16'),
      model('gpt-image-1.5', 'image', '2025-11-25'),
    ];
    expect(selectImageModelIds(catalog)).toEqual(['chatgpt-image-latest', 'gpt-image-1.5', 'gpt-image-1']);
  });

  it('places image models without a releaseDate last, stably', () => {
    const catalog = [model('no-date-a', 'image'), model('dated', 'image', '2025-11-25'), model('no-date-b', 'image')];
    expect(selectImageModelIds(catalog)).toEqual(['dated', 'no-date-a', 'no-date-b']);
  });

  it('returns an empty list when the catalog has no image models', () => {
    expect(selectImageModelIds([model('gpt-5', 'text')])).toEqual([]);
  });
});
