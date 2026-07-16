/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CatalogAssembler - the join stage of the two-tier model store.
 *
 * Takes the `CatalogSource[]` (each emitting `RawModel[]` off a provider's
 * `/v1/models`, the Wayland Core list, or a CLI agent) plus the already-fetched
 * models.dev `ModelsDevRegistry`, and produces the persisted `CatalogModel[]`.
 *
 * For each `RawModel` it looks up the matching models.dev model - scoped ONLY
 * to that model's own provider entry (`registry[key]` where `key` is the
 * mapped models.dev key) - and either:
 *  - enriches it (`enriched: true`) - display name, family, release date,
 *    context window, cost, and `kind` all come from models.dev; or
 *  - leaves it unenriched (`enriched: false`) - `displayName` is humanized from
 *    the id, `family` is derived from the id, and `kind` defaults to `'text'`.
 *
 * The lookup is deliberately NOT a cross-provider flat scan: model ids collide
 * across providers (`gpt-4o-mini` exists under openai, openrouter, azure, …),
 * and a flat scan would attach the WRONG provider's pricing/context. A provider
 * with no matching models.dev entry → its models stay honestly unenriched.
 *
 * The assembler does NOT fetch the registry - `ModelsDevClient` (Packet 1A)
 * does that and the registry is passed in. The only I/O here is each source's
 * `listModels()`; a source that throws is caught, skipped, and the assemble
 * continues with the rest.
 */

import type { CatalogSource } from '../sources/CatalogSource';
import type { ModelsDevModel, ModelsDevRegistry } from '../enrichment/modelsDevSchema';
import type { CatalogModel, ModelKind, ProviderId, RawModel, UsageTag } from '../types';
import { ModelDisplayNames } from './ModelDisplayNames';
import { looksLikeEmbeddingModelId } from './modelCapabilityRules';

/**
 * Maps our `ProviderId` to the provider key models.dev uses in its registry.
 *
 * models.dev keys providers by its own ids, which differ from ours in a few
 * cases - most notably Google: our `google-gemini` is models.dev's `google`.
 * Verified against `resources/modelsdev-snapshot.json` (2026-05-22, 134
 * providers). A provider absent from this map has no models.dev entry to
 * enrich against - its models stay honestly unenriched.
 *
 * Deliberately omitted: `baichuan`, `lingyiwanwu`, `stability`, `replicate`,
 * `anyscale`, `deepgram`, `assemblyai`, `elevenlabs` - these have endpoints in
 * `PROVIDER_ENDPOINTS` but genuinely do NOT exist as a models.dev provider key
 * (checked against the snapshot's 134 keys), so their models stay unenriched.
 *
 * Exported so `modelRegistryIpc` derives its cloud-provider subset from this
 * single source of truth rather than re-declaring the mapping.
 */
export const MODELS_DEV_PROVIDER_KEY: Partial<Record<ProviderId, string>> = {
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

/**
 * The result of an assemble: the joined catalog plus a count of sources that
 * failed (`listModels()` rejected). A caller seeing `models: []` with
 * `sourceErrors > 0` knows the empty catalog is a degraded result, not a
 * provider that genuinely exposes zero models - and can surface an error
 * instead of a false "connected, 0 models".
 */
export type AssembleResult = { models: CatalogModel[]; sourceErrors: number };

export class CatalogAssembler {
  private readonly displayNames = new ModelDisplayNames();

  /**
   * Assemble the full catalog from every source, enriched by the registry.
   *
   * Calls each source's `listModels()` in parallel; a source that rejects is
   * skipped (it contributes nothing) without aborting the others, and is
   * counted in `sourceErrors`. Every collected `RawModel` becomes a
   * `CatalogModel`.
   */
  async assemble(sources: CatalogSource[], registry: ModelsDevRegistry): Promise<AssembleResult> {
    const settled = await Promise.allSettled(sources.map((source) => source.listModels()));

    const models: CatalogModel[] = [];
    let sourceErrors = 0;
    for (const result of settled) {
      // A rejected source contributes nothing - degrade per-source, never
      // abort - but the failure is reported so the caller can tell a degraded
      // empty result apart from a genuinely empty one.
      if (result.status !== 'fulfilled') {
        sourceErrors++;
        continue;
      }
      for (const raw of result.value) {
        models.push(this.toCatalogModel(raw, registry));
      }
    }
    return { models, sourceErrors };
  }

  /** Enrich one `RawModel` against the registry into a `CatalogModel`. */
  private toCatalogModel(raw: RawModel, registry: ModelsDevRegistry): CatalogModel {
    const match = findModelsDevModel(raw, registry);

    if (!match) {
      // Unmatched - humanized name, id-derived family, safe text default.
      const kind = deriveUnenrichedKind(raw.id);
      return {
        id: raw.id,
        providerId: raw.providerId,
        displayName: this.displayNames.humanise(raw.id, raw.providerId),
        family: deriveFamily(raw.id),
        kind,
        enriched: false,
        tags: deriveUnenrichedTags(kind),
      };
    }

    // Matched - every enriched field comes from the models.dev entry.
    const kind = deriveKind(match);
    const model: CatalogModel = {
      id: raw.id,
      providerId: raw.providerId,
      displayName: match.name,
      family: match.family ?? deriveFamily(raw.id),
      kind,
      enriched: true,
      tags: deriveTags(raw.id, kind, match),
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
 * The lookup is scoped to the model's OWN provider: `key = MODELS_DEV_PROVIDER_KEY[providerId]
 * ?? providerId`, then `registry[key]?.models[id]` - nothing else. There is no
 * cross-provider flat scan: model ids collide across providers, and a flat scan
 * could attach the wrong provider's pricing/context. A provider with no
 * matching models.dev entry returns `null` (its models stay unenriched).
 */
function findModelsDevModel(raw: RawModel, registry: ModelsDevRegistry): ModelsDevModel | null {
  const key = MODELS_DEV_PROVIDER_KEY[raw.providerId] ?? raw.providerId;
  return registry[key]?.models[raw.id] ?? null;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Derive a `ModelKind` from a models.dev model.
 *
 * `modalities.output` carries `image`/`audio` for those model kinds. Embedding
 * models are NOT distinguishable by modality - they declare a `text` output
 * like a chat model - so they are detected by name (`family`/`id` containing
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
  return looksLikeEmbeddingModelId(haystack);
}

function deriveUnenrichedKind(modelId: string): ModelKind {
  return looksLikeEmbeddingModelId(modelId) ? 'embedding' : 'text';
}

function deriveUnenrichedTags(kind: ModelKind): UsageTag[] {
  return kind === 'embedding' ? ['embeddings'] : [];
}

/**
 * Derive usage tags from a models.dev model + the already-derived `kind`.
 *
 * Tags are purely a function of the registry data - never fabricated.
 * Mapping (per the polish-pass spec):
 *  - kind === 'image'                  → 'image'    (image-output model)
 *  - kind === 'audio'                  → 'audio'    (audio-output model)
 *  - kind === 'embedding'              → 'embeddings'
 *  - modalities.input includes 'image' → 'vision'   (text-in + image-in)
 *  - reasoning: true                   → 'reasoning'
 *  - tool_call: true                   → 'tools'
 *  - text-only chat → 'chat'           (fallback when no specialty tag)
 *  - research-grade reasoning ids      → 'research' (additive)
 *
 * The returned array is deduplicated and ordered for stable display.
 */
function deriveTags(modelId: string, kind: ModelKind, model: ModelsDevModel): UsageTag[] {
  const tags = new Set<UsageTag>();

  // Output-kind drives the primary specialty tag.
  if (kind === 'image') tags.add('image');
  else if (kind === 'audio') tags.add('audio');
  else if (kind === 'embedding') tags.add('embeddings');

  // Vision is independent: a text-output model with image-input is a VLM.
  const input = model.modalities?.input ?? [];
  if (kind !== 'image' && input.includes('image')) tags.add('vision');

  // Capability flags.
  if (model.reasoning) tags.add('reasoning');
  if (model.tool_call) tags.add('tools');

  // Research-grade reasoning ids (deep-research variants, o1/o3 family).
  // Only OpenAI's `o`-series + `*-deep-research*` ids qualify - keeping this
  // narrow avoids fabricating a "research" claim for general reasoning models.
  if (looksResearchGrade(modelId)) tags.add('research');

  // Default: a text-only model with no specialty tag is `chat`.
  if (tags.size === 0 && kind === 'text') tags.add('chat');

  // Stable display order - primary specialty first, then modalities, then
  // capability flags, then research.
  const order: UsageTag[] = ['chat', 'image', 'audio', 'embeddings', 'vision', 'reasoning', 'tools', 'research'];
  return order.filter((tag) => tags.has(tag));
}

/**
 * True when a model id reads like a research-grade reasoning model. Matches
 * OpenAI's `o`-series flagships (o1, o3, o4-...) and any model whose id
 * contains `deep-research`. Kept conservative - the tag is additive to
 * `reasoning`, not a replacement.
 */
function looksResearchGrade(modelId: string): boolean {
  const id = modelId.toLowerCase();
  if (id.includes('deep-research')) return true;
  // `o1`, `o1-mini`, `o3`, `o3-mini`, `o4`, ... - match the bare `o<digit>`
  // prefix, optionally with a `-suffix`. Excludes `gpt-4o` (the `o` here is
  // a suffix on `gpt-4`, not a leading `o`-series id).
  return /^o[1-9](?:-|$)/.test(id);
}

/**
 * Derive a stable family from a model id when models.dev does not supply one.
 *
 * Strips trailing **date/build stamps** (a pure-numeric token ≥ 4 digits like
 * `0613`, `1106`, `20250514`, AND multi-token dashed dates like `2024-07-18` or
 * `2024-04`) and trailing **variant words** (`preview`, `exp`, `latest`,
 * `thinking`, …, plus model-tier names like `nano`, `mini`, `pro` that aren't
 * families) - none of these identify a family on their own. It KEEPS every
 * generation/version token: a 1–3 digit number (`4`, `3`), a dotted number
 * (`4.1`, `3.5`), or a generation slug (`4o`, `o3`, `v2`) stops the strip loop.
 *
 * Because version tokens are kept, distinct generations derive to DIFFERENT
 * families: `claude-3-haiku` and `claude-3-5-haiku` are separate families, and
 * `gpt-4o-mini` is its own family separate from `gpt-4`. This intentionally
 * over-splits rather than collapses - over-splitting surfaces more models in
 * the picker; collapsing would hide flagships behind one merged family.
 *
 * If stripping removes everything, the full original id is returned - a
 * singleton family the Curator still surfaces as its own flagship.
 *
 * Examples: `gpt-4.1`→`gpt-4.1`; `gpt-4-0613`→`gpt-4`;
 * `gpt-4-1106-preview`→`gpt-4`; `gpt-4o-mini`→`gpt-4o-mini`;
 * `gpt-4o-mini-2024-07-18`→`gpt-4o-mini`;
 * `claude-3-5-haiku-20241022`→`claude-3-5-haiku`;
 * `gemini-2.0-flash-thinking-exp`→`gemini-2.0-flash`; `o3`→`o3`;
 * `computer-use-preview-2025-03-11`→`computer-use`; `babbage-002`→`babbage`.
 */
function deriveFamily(modelId: string): string {
  // Drop a vendor path prefix so it never leaks into the family name.
  let id = modelId.replace(/^(anthropic\.|meta\.|models\/)/, '');

  // A model id may carry a provider route prefix (`liquid/lfm-2`) - the family
  // is derived from the final path segment.
  const slash = id.lastIndexOf('/');
  if (slash !== -1) id = id.slice(slash + 1);

  const tokens = id.split('-');

  // First peel any trailing dashed-date pattern. A 4-digit year token (`2024`)
  // followed by 1-2 trailing 1-2 digit numeric tokens is a `YYYY-MM` or
  // `YYYY-MM-DD` date - strip every part of it. This catches the common
  // OpenAI/Anthropic pattern (`gpt-4o-mini-2024-07-18`) that the plain
  // ≥ 4-digit strip rule misses because the trailing token is `18` (≤ 3 digits).
  while (tokens.length > 1 && hasTrailingDashedDate(tokens)) {
    tokens.pop();
  }

  // Then the existing trailing-strip loop for build stamps and variant words.
  while (tokens.length > 1 && isTrailingStripToken(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  const family = tokens.join('-');
  return family.length > 0 ? family : id;
}

/**
 * True when the tail of `tokens` carries a dashed-date pattern (`…-YYYY-MM` or
 * `…-YYYY-MM-DD`) - the last token is a short pure-numeric (1–3 digits),
 * preceded by a 4-digit year (or another short numeric that itself follows a
 * year). The caller pops one token per call until the condition fails, which
 * walks `DD`→`MM`→`YYYY` off the tail. A short numeric NOT preceded by another
 * numeric is left alone (`o3`, `gpt-4`, `babbage-002` - see the `\d{4,}` rule
 * below for `002`).
 */
function hasTrailingDashedDate(tokens: string[]): boolean {
  const last = tokens[tokens.length - 1];
  if (!/^\d{1,3}$/.test(last)) return false;
  // Walk left until a non-numeric token - must hit a 4-digit year somewhere.
  for (let i = tokens.length - 2; i >= 0; i--) {
    const t = tokens[i];
    if (/^\d{4}$/.test(t)) return true; // year found
    if (!/^\d{1,3}$/.test(t)) return false; // non-numeric breaks the chain
  }
  return false;
}

/**
 * Trailing variant words to strip - none of these identify a model family.
 *
 * Includes model-tier names (`mini`, `nano`, `pro`, `flash`, `turbo`, `ultra`,
 * `large`, `medium`, `small`, `lite`) when they appear alone at the tail of a
 * generation-less id (`babbage-002`→`babbage`). NOT stripped when a preceding
 * version token is present - `gpt-4o-mini` keeps `mini` because the previous
 * token `4o` is a version, not the start of a generation-less id. The strip
 * loop's "stop at the first non-strippable token" rule preserves that.
 *
 * `legacy`/`base`/`002`/`003` etc are NOT in this list; the `\d{4,}` rule
 * already handles 4+ digit build stamps. We deliberately keep `002`/`003` as
 * version tokens - they're treated as 1-3 digit generation numbers.
 */
const VARIANT_WORDS = new Set([
  'preview',
  'exp',
  'experimental',
  'latest',
  // `thinking` is a reasoning mode, not a family - `gemini-2.0-flash-thinking`
  // is the same family as `gemini-2.0-flash`.
  'thinking',
  'beta',
  'alpha',
  'rc',
]);

/**
 * True when a trailing id token should be stripped: a date/build stamp (a
 * pure-numeric token ≥ 4 digits) or a known variant word. A 1–3 digit number,
 * a dotted number, or a generation slug (`4o`) is a version - NEVER stripped.
 */
function isTrailingStripToken(token: string): boolean {
  const t = token.toLowerCase();
  // A date or build stamp: a pure-numeric token of length ≥ 4 (`0613`, `1106`,
  // `20250514`). A shorter pure number is a generation/version and is kept.
  if (/^\d{4,}$/.test(t)) return true;
  // A known variant word.
  return VARIANT_WORDS.has(t);
}
