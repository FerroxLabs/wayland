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

/**
 * A text-in/text-out CLASSIFIER is not a chat model.
 *
 * Meta's Llama Prompt Guard 2 emits a two-token jailbreak verdict. It is
 * `kind: 'text'`, so it passed the Curator and reached the chat picker, and on a
 * clean profile it was auto-selected as the DEFAULT — the first message a new
 * user sent came back as a provider 400 ("max_tokens must be <= 512").
 */
describe('selectMirrorModelIds — classifiers never reach the chat picker', () => {
  const withMeta = (id: string, contextWindow: number | undefined, tags: CatalogModel['tags'] = []): CatalogModel => ({
    ...model(id, id.split('/')[0], '2026-05-01'),
    ...(contextWindow === undefined ? {} : { contextWindow }),
    tags,
  });

  it('drops a prompt-guard classifier (tiny context, no tool calling)', () => {
    const catalog = [...CATALOG, withMeta('meta-llama/llama-prompt-guard-2-22m', 512)];
    expect(selectMirrorModelIds(catalog, [])).not.toContain('meta-llama/llama-prompt-guard-2-22m');
  });

  it('keeps a real chat model that merely has a small context', () => {
    // phi-3-mini-4k-instruct: 4096 context but declares tool calling.
    const catalog = [...CATALOG, withMeta('microsoft/phi-3-mini-4k-instruct', 4096, ['chat', 'tools'])];
    expect(selectMirrorModelIds(catalog, [])).toContain('microsoft/phi-3-mini-4k-instruct');
  });

  it('keeps a small-context chat model with no tool calling', () => {
    // MythoMax: 4000 context, no tools - still a genuine chat model.
    const catalog = [...CATALOG, withMeta('gryphe/mythomax-l2-13b', 4000, ['chat'])];
    expect(selectMirrorModelIds(catalog, [])).toContain('gryphe/mythomax-l2-13b');
  });

  it('FAILS OPEN when the context window is unknown', () => {
    // An unenriched day-one release, or a user's local Ollama model: no
    // metadata at all. It must stay selectable.
    const catalog = [...CATALOG, withMeta('vendor/brand-new-model', undefined)];
    expect(selectMirrorModelIds(catalog, [])).toContain('vendor/brand-new-model');
  });

  it('drops a tiny-context model that declares no tools even when named like chat', () => {
    const catalog = [...CATALOG, withMeta('vendor/tiny-encoder', 448)];
    expect(selectMirrorModelIds(catalog, [])).not.toContain('vendor/tiny-encoder');
  });
});

/**
 * Safety-classification models must stay selectable but must never be the
 * DEFAULT. On a clean profile `openai/gpt-oss-safeguard-20b` won the flagship
 * slot and became the new-chat default - it answers, but a model tuned to emit
 * policy verdicts is the wrong first impression for writing, code or analysis.
 *
 * Distinct from the classifier filter above: those cannot converse at all
 * (sub-1K context, no tools) and are removed. These can, so they are kept and
 * merely un-recommended.
 */
describe('Curator - safety classifiers are selectable but never recommended', () => {
  const guardCatalog: CatalogModel[] = [
    model('openai/gpt-oss-safeguard-20b', 'gpt-oss-safeguard', '2026-05-01'),
    model('meta-llama/llama-guard-4-12b', 'llama-guard', '2026-04-01'),
    model('ovhcloud/qwen3guard-gen-8b', 'qwen3guard', '2026-04-15'),
    model('vendor/chat-pro', 'vendor-chat', '2026-05-02'),
  ];

  const curated = new Curator().curate(guardCatalog);
  const byId = new Map(curated.map((m) => [m.id, m]));

  it.each(['openai/gpt-oss-safeguard-20b', 'meta-llama/llama-guard-4-12b', 'ovhcloud/qwen3guard-gen-8b'])(
    '%s is enabled but not recommended',
    (id) => {
      const m = byId.get(id);
      expect(m?.enabled, `${id} must stay selectable`).toBe(true);
      expect(m?.recommended, `${id} must not be a default candidate`).toBe(false);
    }
  );

  it('an ordinary chat model in the same catalog is still recommended', () => {
    expect(byId.get('vendor/chat-pro')?.recommended).toBe(true);
  });
});

/**
 * The mirror list is ORDERED, and the cold-start default resolver takes a
 * provider's first model whenever no marquee rule matches it (Groq's legacy
 * platform is `openai-compatible`, and `openai/gpt-oss-*` matches none of the
 * OpenAI marquee model patterns). So whatever leads this list becomes a brand
 * new user's default model.
 *
 * These three rows are the real Groq catalog entries, copied verbatim from a
 * live first-run profile's `model_registry_catalog`. On that profile the mirror
 * led with the safety classifier and it was auto-selected as the default -
 * confirmed in the running app, with `model.config` holding exactly
 * `['openai/gpt-oss-safeguard-20b', 'openai/gpt-oss-120b']`.
 */
describe('selectMirrorModelIds - recommended models lead the list', () => {
  const realGroqRows: CatalogModel[] = [
    {
      id: 'openai/gpt-oss-120b',
      providerId: 'groq' as ProviderId,
      displayName: 'GPT OSS 120B',
      family: 'gpt-oss',
      kind: 'text',
      enriched: true,
      tags: ['reasoning', 'tools'],
      releaseDate: '2025-08-05',
      contextWindow: 131072,
    },
    {
      id: 'openai/gpt-oss-20b',
      providerId: 'groq' as ProviderId,
      displayName: 'GPT OSS 20B',
      family: 'gpt-oss',
      kind: 'text',
      enriched: true,
      tags: ['reasoning', 'tools'],
      releaseDate: '2025-08-05',
      contextWindow: 131072,
    },
    {
      id: 'openai/gpt-oss-safeguard-20b',
      providerId: 'groq' as ProviderId,
      displayName: 'Safety GPT OSS 20B',
      family: 'gpt-oss',
      kind: 'text',
      enriched: true,
      tags: ['reasoning', 'tools'],
      releaseDate: '2025-10-29',
      contextWindow: 131072,
    },
  ] as unknown as CatalogModel[];

  it('does not lead with a safety classifier the Curator de-recommended', () => {
    const ids = selectMirrorModelIds(realGroqRows, []);
    expect(ids[0]).toBe('openai/gpt-oss-120b');
    // Still selectable - this reorders, it never removes.
    expect(ids).toContain('openai/gpt-oss-safeguard-20b');
  });

  it('every recommended model precedes every un-recommended one', () => {
    const curated = new Curator().curate(realGroqRows);
    const recommended = new Set(curated.filter((m) => m.recommended).map((m) => m.id));
    const ids = selectMirrorModelIds(realGroqRows, []);
    const lastRecommended = ids.findLastIndex((id) => recommended.has(id));
    const firstUnrecommended = ids.findIndex((id) => !recommended.has(id));
    expect(recommended.size, 'fixture must contain a recommended model').toBeGreaterThan(0);
    if (firstUnrecommended !== -1) expect(lastRecommended).toBeLessThan(firstUnrecommended);
  });
});
