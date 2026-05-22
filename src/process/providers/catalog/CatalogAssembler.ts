/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CatalogAssembler — the join stage of the two-tier model store.
 *
 * Takes the `CatalogSource[]` (each emitting `RawModel[]` off a provider's
 * `/v1/models`, the Wayland Core list, or a CLI agent) plus the already-fetched
 * models.dev `ModelsDevRegistry`, and produces the persisted `CatalogModel[]`.
 *
 * For each `RawModel` it looks up the matching models.dev model and either:
 *  - enriches it (`enriched: true`) — display name, family, release date,
 *    context window, cost, and `kind` all come from models.dev; or
 *  - leaves it unenriched (`enriched: false`) — `displayName` is humanized from
 *    the id, `family` is derived from the id, and `kind` defaults to `'text'`.
 *
 * The assembler does NOT fetch the registry — `ModelsDevClient` (Packet 1A)
 * does that and the registry is passed in. The only I/O here is each source's
 * `listModels()`; a source that throws is caught, skipped, and the assemble
 * continues with the rest.
 */

import type { CatalogSource } from '../sources/CatalogSource';
import type { ModelsDevModel, ModelsDevRegistry } from '../enrichment/modelsDevSchema';
import type { CatalogModel, ModelKind, ProviderId, RawModel } from '../types';
import { ModelDisplayNames } from './ModelDisplayNames';

/**
 * Maps our `ProviderId` to the provider key models.dev uses in its registry.
 *
 * models.dev keys providers by its own ids, which differ from ours in a few
 * cases — most notably Google: our `google-gemini` is models.dev's `google`.
 * Verified against `resources/modelsdev-snapshot.json` (2026-05-22, 134
 * providers). A provider absent from this map falls back to a flat id scan
 * across every models.dev provider.
 *
 * Deliberately omitted: `baichuan`, `lingyiwanwu`, `stability`, `replicate`,
 * `anyscale`, `deepgram`, `assemblyai`, `elevenlabs` — these have endpoints in
 * `PROVIDER_ENDPOINTS` but genuinely do NOT exist as a models.dev provider key
 * (checked against the snapshot's 134 keys), so they correctly hit the flat
 * scan and their models stay unenriched.
 */
const MODELS_DEV_PROVIDER_KEY: Partial<Record<ProviderId, string>> = {
  anthropic: 'anthropic',
  openai: 'openai',
  'google-gemini': 'google',
  'aws-bedrock': 'amazon-bedrock',
  vertex: 'google-vertex',
  azure: 'azure',
  openrouter: 'openrouter',
  groq: 'groq',
  xai: 'xai',
  mistral: 'mistral',
  cohere: 'cohere',
  perplexity: 'perplexity',
  together: 'togetherai',
  fireworks: 'fireworks-ai',
  cerebras: 'cerebras',
  huggingface: 'huggingface',
  nvidia: 'nvidia',
  deepseek: 'deepseek',
  moonshot: 'moonshotai',
  qwen: 'alibaba',
  'zhipu-glm': 'zhipuai',
  minimax: 'minimax',
};

export class CatalogAssembler {
  private readonly displayNames = new ModelDisplayNames();

  /**
   * Assemble the full catalog from every source, enriched by the registry.
   *
   * Calls each source's `listModels()` in parallel; a source that rejects is
   * skipped (it contributes nothing) without aborting the others. Every
   * collected `RawModel` becomes a `CatalogModel`.
   */
  async assemble(sources: CatalogSource[], registry: ModelsDevRegistry): Promise<CatalogModel[]> {
    const settled = await Promise.allSettled(sources.map((source) => source.listModels()));

    const catalog: CatalogModel[] = [];
    for (const result of settled) {
      // A rejected source contributes nothing — degrade per-source, never abort.
      if (result.status !== 'fulfilled') continue;
      for (const raw of result.value) {
        catalog.push(this.toCatalogModel(raw, registry));
      }
    }
    return catalog;
  }

  /** Enrich one `RawModel` against the registry into a `CatalogModel`. */
  private toCatalogModel(raw: RawModel, registry: ModelsDevRegistry): CatalogModel {
    const match = findModelsDevModel(raw, registry);

    if (!match) {
      // Unmatched — humanized name, id-derived family, safe text default.
      return {
        id: raw.id,
        providerId: raw.providerId,
        displayName: this.displayNames.humanise(raw.id, raw.providerId),
        family: deriveFamily(raw.id),
        kind: 'text',
        enriched: false,
      };
    }

    // Matched — every enriched field comes from the models.dev entry.
    const model: CatalogModel = {
      id: raw.id,
      providerId: raw.providerId,
      displayName: match.name,
      family: match.family ?? deriveFamily(raw.id),
      kind: deriveKind(match),
      enriched: true,
    };
    if (match.release_date) model.releaseDate = match.release_date;
    if (match.limit?.context !== undefined) model.contextWindow = match.limit.context;
    if (match.cost?.input !== undefined) model.costInPerM = match.cost.input;
    if (match.cost?.output !== undefined) model.costOutPerM = match.cost.output;
    return model;
  }
}

// ─── Join ─────────────────────────────────────────────────────────────────────

/**
 * Resolve the models.dev model entry for a `RawModel`.
 *
 * First tries the mapped models.dev provider key (an exact, fast lookup). If the
 * provider is unmapped, or the model id is not under the mapped provider, falls
 * back to a flat scan of every models.dev provider for a model with that id.
 */
function findModelsDevModel(raw: RawModel, registry: ModelsDevRegistry): ModelsDevModel | null {
  const devKey = MODELS_DEV_PROVIDER_KEY[raw.providerId];
  if (devKey) {
    const direct = registry[devKey]?.models[raw.id];
    if (direct) return direct;
  }

  // Fallback for an unmapped provider, or a model the mapped provider does not
  // carry. Best-effort: scan every models.dev provider for this exact id. Two
  // providers can share a model id, so the scan is made DETERMINISTIC — we
  // prefer a registry key matching/sharing a prefix with the RawModel's
  // providerId, else the alphabetically-first key — never raw object order.
  const candidateKeys = Object.keys(registry)
    .filter((key) => registry[key].models[raw.id])
    .toSorted();
  if (candidateKeys.length === 0) return null;

  const providerId = raw.providerId;
  const affine = candidateKeys.find(
    (key) => key === providerId || key.startsWith(providerId) || providerId.startsWith(key)
  );
  const chosen = affine ?? candidateKeys[0];
  return registry[chosen].models[raw.id];
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Derive a `ModelKind` from a models.dev model.
 *
 * `modalities.output` carries `image`/`audio` for those model kinds. Embedding
 * models are NOT distinguishable by modality — they declare a `text` output
 * like a chat model — so they are detected by name (`family`/`id` containing
 * `embed`). Everything else is `text`.
 */
function deriveKind(model: ModelsDevModel): ModelKind {
  const output = model.modalities?.output ?? [];
  if (output.includes('image')) return 'image';
  if (output.includes('audio')) return 'audio';
  if (looksLikeEmbedding(model)) return 'embedding';
  return 'text';
}

/** True when a model's name/family/id reads like an embedding model. */
function looksLikeEmbedding(model: ModelsDevModel): boolean {
  const haystack = `${model.family ?? ''} ${model.id}`.toLowerCase();
  return haystack.includes('embed');
}

/**
 * Derive a stable family from a model id when models.dev does not supply one.
 *
 * Strips trailing **date/build stamps** (a pure-numeric token ≥ 4 digits, e.g.
 * `0613`, `1106`, `20250514`) and trailing **variant words** (`preview`, `exp`,
 * `latest`, `thinking`, …) — these never identify a family. It KEEPS every
 * generation/version token: a 1–3 digit number (`4`, `3`), a dotted number
 * (`4.1`, `3.5`), or a generation slug (`4o`, `o3`, `v2`) stops the strip loop.
 *
 * Because version tokens are kept, distinct generations derive to DIFFERENT
 * families: `claude-3-haiku` and `claude-3-5-haiku` are separate families, and
 * `gpt-4o-mini` is its own family separate from `gpt-4`. This intentionally
 * over-splits rather than collapses — over-splitting surfaces more models in
 * the picker; collapsing would hide flagships behind one merged family.
 *
 * If stripping removes everything, the full original id is returned — a
 * singleton family the Curator still surfaces as its own flagship.
 *
 * Examples: `gpt-4.1`→`gpt-4.1`; `gpt-4-0613`→`gpt-4`;
 * `gpt-4-1106-preview`→`gpt-4`; `gpt-4o-mini`→`gpt-4o-mini`;
 * `claude-3-5-haiku-20241022`→`claude-3-5-haiku`;
 * `gemini-2.0-flash-thinking-exp`→`gemini-2.0-flash`; `o3`→`o3`.
 */
function deriveFamily(modelId: string): string {
  // Drop a vendor path prefix so it never leaks into the family name.
  let id = modelId.replace(/^(anthropic\.|meta\.|models\/)/, '');

  // A model id may carry a provider route prefix (`liquid/lfm-2`) — the family
  // is derived from the final path segment.
  const slash = id.lastIndexOf('/');
  if (slash !== -1) id = id.slice(slash + 1);

  const tokens = id.split('-');
  while (tokens.length > 1 && isTrailingStripToken(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  const family = tokens.join('-');
  return family.length > 0 ? family : id;
}

/** Trailing variant words to strip — none of these identify a model family. */
const VARIANT_WORDS = new Set([
  'preview',
  'exp',
  'experimental',
  'latest',
  // `thinking` is a reasoning mode, not a family — `gemini-2.0-flash-thinking`
  // is the same family as `gemini-2.0-flash`.
  'thinking',
  'beta',
  'alpha',
  'rc',
]);

/**
 * True when a trailing id token should be stripped: a date/build stamp (a
 * pure-numeric token ≥ 4 digits) or a known variant word. A 1–3 digit number,
 * a dotted number, or a generation slug (`4o`) is a version — NEVER stripped.
 */
function isTrailingStripToken(token: string): boolean {
  const t = token.toLowerCase();
  // A date or build stamp: a pure-numeric token of length ≥ 4 (`0613`, `1106`,
  // `20250514`). A shorter pure number is a generation/version and is kept.
  if (/^\d{4,}$/.test(t)) return true;
  // A known variant word.
  return VARIANT_WORDS.has(t);
}
