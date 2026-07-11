/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { CatalogAssembler } from '@process/providers/catalog/CatalogAssembler';
import type { CatalogSource } from '@process/providers/sources/CatalogSource';
import type { ModelsDevModel, ModelsDevRegistry } from '@process/providers/enrichment/modelsDevSchema';
import type { RawModel } from '@process/providers/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** A `CatalogSource` that returns a fixed `RawModel[]`. */
function fixedSource(kind: CatalogSource['kind'], providerId: string, models: RawModel[]): CatalogSource {
  return { kind, providerId, listModels: async () => models };
}

/** A `CatalogSource` whose `listModels()` rejects. */
function throwingSource(kind: CatalogSource['kind'], providerId: string): CatalogSource {
  return {
    kind,
    providerId,
    listModels: async () => {
      throw new Error('source exploded');
    },
  };
}

/** A models.dev model object with defaults; overrides win. */
function devModel(over: Partial<ModelsDevModel> & { id: string }): ModelsDevModel {
  return { name: over.id, ...over };
}

/** A small registry keyed exactly as the live models.dev registry is. */
function buildRegistry(): ModelsDevRegistry {
  return {
    anthropic: {
      id: 'anthropic',
      name: 'Anthropic',
      env: ['ANTHROPIC_API_KEY'],
      models: {
        'claude-opus-4': devModel({
          id: 'claude-opus-4',
          name: 'Claude Opus 4',
          family: 'claude-opus',
          release_date: '2025-05-01',
          modalities: { input: ['text'], output: ['text'] },
          limit: { context: 200000, output: 8192 },
          cost: { input: 15, output: 75 },
        }),
        // No `family` field - the assembler must derive one from the id.
        'claude-sonnet-4-20250101': devModel({
          id: 'claude-sonnet-4-20250101',
          name: 'Claude Sonnet 4',
          release_date: '2025-01-01',
          modalities: { input: ['text'], output: ['text'] },
        }),
      },
    },
    openai: {
      id: 'openai',
      name: 'OpenAI',
      env: ['OPENAI_API_KEY'],
      models: {
        'gpt-image-1': devModel({
          id: 'gpt-image-1',
          name: 'GPT Image 1',
          family: 'gpt-image',
          modalities: { input: ['text'], output: ['image'] },
        }),
        'text-embedding-3-large': devModel({
          id: 'text-embedding-3-large',
          name: 'text-embedding-3-large',
          family: 'text-embedding',
          modalities: { input: ['text'], output: ['text'] },
        }),
        'whisper-1': devModel({
          id: 'whisper-1',
          name: 'Whisper',
          family: 'whisper',
          modalities: { input: ['audio'], output: ['audio'] },
        }),
      },
    },
    // models.dev keys Google as `google`, not `google-gemini`.
    google: {
      id: 'google',
      name: 'Google',
      env: ['GEMINI_API_KEY'],
      models: {
        'gemini-3-pro': devModel({
          id: 'gemini-3-pro',
          name: 'Gemini 3 Pro',
          family: 'gemini-pro',
          release_date: '2025-03-01',
          modalities: { input: ['text'], output: ['text'] },
        }),
      },
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CatalogAssembler', () => {
  const assembler = new CatalogAssembler();

  it('enriches a model that matches a models.dev entry', async () => {
    const source = fixedSource('api', 'anthropic', [{ id: 'claude-opus-4', providerId: 'anthropic' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());

    expect(catalog).toHaveLength(1);
    const m = catalog[0];
    expect(m.enriched).toBe(true);
    expect(m.displayName).toBe('Claude Opus 4');
    expect(m.family).toBe('claude-opus');
    expect(m.releaseDate).toBe('2025-05-01');
    expect(m.contextWindow).toBe(200000);
    expect(m.costInPerM).toBe(15);
    expect(m.costOutPerM).toBe(75);
    expect(m.kind).toBe('text');
  });

  it('joins google-gemini RawModels against the models.dev `google` provider key', async () => {
    const source = fixedSource('api', 'google-gemini', [{ id: 'gemini-3-pro', providerId: 'google-gemini' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());

    expect(catalog[0].enriched).toBe(true);
    expect(catalog[0].displayName).toBe('Gemini 3 Pro');
    expect(catalog[0].family).toBe('gemini-pro');
  });

  it('derives a family from the id when models.dev omits the family field', async () => {
    const source = fixedSource('api', 'anthropic', [{ id: 'claude-sonnet-4-20250101', providerId: 'anthropic' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());

    expect(catalog[0].enriched).toBe(true);
    // The trailing date stamp is stripped but the `4` generation token is kept.
    expect(catalog[0].family).toBe('claude-sonnet-4');
  });

  it('marks a model absent from models.dev as unenriched with a humanized name', async () => {
    const source = fixedSource('api', 'anthropic', [{ id: 'claude-mystery-9', providerId: 'anthropic' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());

    expect(catalog).toHaveLength(1);
    const m = catalog[0];
    expect(m.enriched).toBe(false);
    expect(m.displayName).toBe('Claude Mystery 9');
    // `9` is a 1-digit generation token - kept, not stripped as a date stamp.
    expect(m.family).toBe('claude-mystery-9');
    expect(m.kind).toBe('text'); // safe default for unknown modality
    expect(m.contextWindow).toBeUndefined();
    expect(m.costInPerM).toBeUndefined();
    expect(m.releaseDate).toBeUndefined();
  });

  it('classifies unenriched bge models as embedding models', async () => {
    const source = fixedSource('api', 'ollama-local', [{ id: 'bge-m3:latest', providerId: 'ollama-local' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());

    expect(catalog).toHaveLength(1);
    expect(catalog[0].enriched).toBe(false);
    expect(catalog[0].kind).toBe('embedding');
    expect(catalog[0].tags).toEqual(['embeddings']);
  });

  it('derives kind=image from modalities.output', async () => {
    const source = fixedSource('api', 'openai', [{ id: 'gpt-image-1', providerId: 'openai' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());
    expect(catalog[0].kind).toBe('image');
  });

  it('derives kind=audio from modalities.output', async () => {
    const source = fixedSource('api', 'openai', [{ id: 'whisper-1', providerId: 'openai' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());
    expect(catalog[0].kind).toBe('audio');
  });

  it('derives kind=embedding for an embedding model despite a text output modality', async () => {
    const source = fixedSource('api', 'openai', [{ id: 'text-embedding-3-large', providerId: 'openai' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());
    expect(catalog[0].kind).toBe('embedding');
  });

  it('skips a source that throws without aborting the rest of the assemble', async () => {
    const ok = fixedSource('api', 'anthropic', [{ id: 'claude-opus-4', providerId: 'anthropic' }]);
    const bad = throwingSource('api', 'openai');
    const { models: catalog } = await assembler.assemble([bad, ok], buildRegistry());

    // The throwing source contributes nothing; the healthy one still does.
    expect(catalog).toHaveLength(1);
    expect(catalog[0].id).toBe('claude-opus-4');
  });

  it('collects models from every healthy source', async () => {
    const a = fixedSource('api', 'anthropic', [{ id: 'claude-opus-4', providerId: 'anthropic' }]);
    const b = fixedSource('api', 'openai', [{ id: 'gpt-image-1', providerId: 'openai' }]);
    const { models: catalog } = await assembler.assemble([a, b], buildRegistry());

    expect(catalog.map((m) => m.id).toSorted()).toEqual(['claude-opus-4', 'gpt-image-1']);
  });

  it('leaves a model from an unmapped provider unenriched - no cross-provider flat scan', async () => {
    // `openai-compatible` has no `MODELS_DEV_PROVIDER_KEY` entry. Its model id
    // `claude-opus-4` DOES exist under the `anthropic` provider, but enrichment
    // must NOT be borrowed across providers - ids collide and a flat scan would
    // attach the wrong provider's pricing/context. The model stays unenriched.
    const source = fixedSource('api', 'openai-compatible', [{ id: 'claude-opus-4', providerId: 'openai-compatible' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());

    expect(catalog[0].enriched).toBe(false);
    expect(catalog[0].displayName).toBe('Claude Opus 4'); // humanized, not borrowed
    expect(catalog[0].contextWindow).toBeUndefined();
    expect(catalog[0].costInPerM).toBeUndefined();
  });

  it('does not borrow a colliding model id from another provider', async () => {
    // Both `openai` and `anthropic` could carry an id; enrichment is scoped to
    // the model's OWN provider entry only. `gpt-image-1` lives under `openai`
    // but a RawModel claiming it under `anthropic` must NOT pick up openai's
    // image-kind enrichment - it stays unenriched with the safe text default.
    const source = fixedSource('api', 'anthropic', [{ id: 'gpt-image-1', providerId: 'anthropic' }]);
    const { models: catalog } = await assembler.assemble([source], buildRegistry());

    expect(catalog[0].enriched).toBe(false);
    expect(catalog[0].kind).toBe('text'); // NOT 'image' borrowed from openai
  });

  it('returns an empty catalog when given no sources', async () => {
    const { models, sourceErrors } = await assembler.assemble([], buildRegistry());
    expect(models).toEqual([]);
    expect(sourceErrors).toBe(0);
  });

  it('reports sourceErrors when a source rejects', async () => {
    const bad = throwingSource('api', 'openai');
    const ok = fixedSource('api', 'anthropic', [{ id: 'claude-opus-4', providerId: 'anthropic' }]);
    const { models, sourceErrors } = await assembler.assemble([bad, ok], buildRegistry());

    // One source failed - the count surfaces it so a caller can tell a degraded
    // result apart from a genuinely empty one.
    expect(sourceErrors).toBe(1);
    expect(models).toHaveLength(1);
  });

  it('reports every source failing as sourceErrors > 0 with an empty model list', async () => {
    const { models, sourceErrors } = await assembler.assemble(
      [throwingSource('api', 'openai'), throwingSource('api', 'anthropic')],
      buildRegistry()
    );
    expect(models).toEqual([]);
    expect(sourceErrors).toBe(2);
  });

  it('returns unenriched models when the registry is empty', async () => {
    const source = fixedSource('api', 'anthropic', [{ id: 'claude-opus-4', providerId: 'anthropic' }]);
    const { models: catalog } = await assembler.assemble([source], {});
    expect(catalog[0].enriched).toBe(false);
    expect(catalog[0].displayName).toBe('Claude Opus 4');
  });

  it('keeps unenriched GPT generations in distinct families - they do NOT collapse to "gpt"', async () => {
    // Distinct GPT model ids must derive distinct families, otherwise the
    // Curator would surface a single flagship for all of OpenAI.
    const source = fixedSource('api', 'openai', [
      { id: 'gpt-4.1', providerId: 'openai' },
      { id: 'gpt-4-0613', providerId: 'openai' },
      { id: 'gpt-4o-mini', providerId: 'openai' },
    ]);
    const { models: catalog } = await assembler.assemble([source], {});

    const families = new Map(catalog.map((m) => [m.id, m.family]));
    expect(families.get('gpt-4.1')).toBe('gpt-4.1');
    // The trailing build stamp `0613` is stripped; the `4` generation is kept.
    expect(families.get('gpt-4-0613')).toBe('gpt-4');
    expect(families.get('gpt-4o-mini')).toBe('gpt-4o-mini');
    // No two of them share a family, and none collapses to a bare `gpt`.
    expect(new Set(families.values()).size).toBe(3);
    expect([...families.values()]).not.toContain('gpt');
  });

  it('strips a trailing variant word from an unenriched id without collapsing the generation', async () => {
    const source = fixedSource('api', 'openai', [{ id: 'gpt-4-1106-preview', providerId: 'openai' }]);
    const { models: catalog } = await assembler.assemble([source], {});
    // `preview` (variant) and `1106` (build stamp) stripped; `gpt-4` survives.
    expect(catalog[0].family).toBe('gpt-4');
  });

  it('collapses a dashed `YYYY-MM-DD` date suffix onto the base family', async () => {
    // Wave 4B fix: the previous strip rule required a pure-numeric token ≥ 4
    // digits, so dashed dates (`2024-07-18` → tail token `18`) escaped
    // unstripped and `gpt-4o-mini-2024-07-18` became its own family - making
    // every dated id look like a singleton family and over-recommending.
    const source = fixedSource('api', 'openai', [
      { id: 'gpt-4o-mini-2024-07-18', providerId: 'openai' },
      { id: 'gpt-4o-2024-08-06', providerId: 'openai' },
      { id: 'gpt-4-turbo-2024-04-09', providerId: 'openai' },
    ]);
    const { models: catalog } = await assembler.assemble([source], {});
    const fam = new Map(catalog.map((m) => [m.id, m.family]));
    expect(fam.get('gpt-4o-mini-2024-07-18')).toBe('gpt-4o-mini');
    expect(fam.get('gpt-4o-2024-08-06')).toBe('gpt-4o');
    expect(fam.get('gpt-4-turbo-2024-04-09')).toBe('gpt-4-turbo');
  });

  it('collapses `YYYY-MM` (no DD) dashed date suffixes onto the base family', async () => {
    const source = fixedSource('api', 'openai', [{ id: 'something-2025-03', providerId: 'openai' }]);
    const { models: catalog } = await assembler.assemble([source], {});
    expect(catalog[0].family).toBe('something');
  });

  it('keeps a non-date short numeric suffix as a generation token', async () => {
    // `o3` (1-digit version) and `gpt-4` (1-digit version) are NOT a date -
    // no preceding year. The strip rule must leave them alone.
    const source = fixedSource('api', 'openai', [
      { id: 'o3', providerId: 'openai' },
      { id: 'gpt-4', providerId: 'openai' },
    ]);
    const { models: catalog } = await assembler.assemble([source], {});
    const fam = new Map(catalog.map((m) => [m.id, m.family]));
    expect(fam.get('o3')).toBe('o3');
    expect(fam.get('gpt-4')).toBe('gpt-4');
  });
});
