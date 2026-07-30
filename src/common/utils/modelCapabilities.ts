/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProvider, ModelType } from '@/common/config/storage';
import { isFluxModelId } from '@/common/config/flux';

/**
 * Matches FLUX image-diffusion models (`flux-dev`, `flux-schnell`, `flux-pro`,
 * `flux.1`, `flux-2-pro`, `flux-kontext`, …) WITHOUT catching Flux Router's
 * chat-routing tiers (`flux-auto`, `flux-fast`, `flux-balanced`,
 * `flux-reasoning`). A bare `flux` token excluded the Router's chat models from
 * the primary model picker, so a brand-new user whose only provider is Flux
 * Router got an empty model list and their first send was silently dropped
 * (issue #108). Image variants always carry a digit (version) or a known image
 * suffix; the Router tiers never do.
 */
const FLUX_IMAGE_MODEL = /flux(?:[.-]?\d|-(?:dev|schnell|pro|kontext|realism|lora))/i;

/**
 * Embedding / retrieval model families. Many are NOT named with the literal
 * `embed` (`bge-m3`, `gte-large`, `e5-mistral`, `voyage-3`, …), so the known
 * families are matched by name. Exported so other classifiers (e.g. the
 * models.dev catalog assembler) stay consistent with this one. See #740.
 *
 * The stem list is the process-side house rule
 * (`providers/catalog/modelCapabilityRules.ts`: `embeddings?|embed|bge`)
 * widened by the three family names #740 actually reported — `gte`, `e5`,
 * `voyage`. Nothing here is speculative: every stem is backed by a model id we
 * actually ship in `resources/modelsdev-snapshot.json`.
 *
 * Each family stem is anchored to a token boundary (start-of-id or a
 * `/ . : _ -`/whitespace separator on both sides) so a short stem can't match
 * inside an unrelated chat model id — `e5`/`bge`/`gte` must not match mid-word,
 * and the vendored `kuae-*` ("KUAE Cloud Coding Plan") coding models must stay
 * selectable. `embed`/`embeddings` still catch `text-embedding-*`,
 * `nomic-embed-*`, `gemini-embedding-*`, etc. via the same boundaries.
 *
 * No `retrieval` / `retriever` / `clip` stem: no id we ship needs one. The only
 * catalogue id containing either (`nvidia/llama-3_2-nemoretriever-300m-embed-v1`)
 * is already caught by `embed`, and the only `clip` id is `google/lyria-3-clip-preview`,
 * a music model that must NOT be classified as an embedding.
 */
export const EMBEDDING_MODEL = /(?:^|[\s./:_-])(?:embeddings?|embed|bge|gte|e5|voyage)(?=$|[\s./:_-])/i;

/**
 * Reranker / cross-encoder models — retrieval-stage models, never chat models.
 * Stems are token-anchored (start-of-id or a `/ . : _ -`/whitespace separator)
 * for the same reason EMBEDDING_MODEL is: an unanchored substring match fires
 * inside unrelated ids, so `prerank-*` or `xrerank` would be silently hidden
 * from the model picker. Suffixes are explicit because real reranker ids append
 * them to the stem (`bge-reranker-v2-m3`, `Qwen3-Reranker-8B`).
 *
 * One stem only. Every reranker id in `resources/modelsdev-snapshot.json` spells
 * it `rerank`; no shipped id uses a hyphen or a `retriev*` spelling, so carrying
 * those branches would add matches we cannot point at a real model for.
 */
const RERANK_MODEL = /(?:^|[\s./:_-])rerank(?:er|ing)?(?=$|[\s./:_-])/i;

/**
 * Capability matching regex patterns
 */
export const CAPABILITY_PATTERNS: Record<ModelType, RegExp> = {
  text: /gpt|claude|gemini|qwen|llama|mistral|deepseek/i,
  vision: /4o|claude-3|gemini-.*-pro|gemini-.*-flash|gemini-2\.0|qwen-vl|llava|vision/i,
  function_calling: /gpt-4|claude-3|gemini|qwen|deepseek/i,
  // Same families the image picker offers (`isImageModelName`, config/imageModels.ts)
  // plus FLUX.1. `image` subsumes `imagen`, `gpt-image-*` and `gemini-*-image*`;
  // `banana`/`imagine` cover the aliases that carry no `image` token. Keeping the
  // two detectors on one token set is what stops a model the picker offers from
  // being classified as non-image here.
  //
  // `dall-e` is additionally listed in CAPABILITY_EXCLUSIONS below. `stable-diffusion`
  // and `midjourney` are NOT — they are here because we ship first-class prompting
  // skills for both services (`stable-diffusion-prompting`, `midjourney-consistency`),
  // so a custom provider exposing such an id must not land in the chat picker.
  // `stable-?diffusion` matches both spellings; `stabilityai/stablediffusionxl` is
  // unhyphenated in our snapshot.
  image_generation: new RegExp(
    `${FLUX_IMAGE_MODEL.source}|image|imagine|banana|dall-e|stable-?diffusion|midjourney`,
    'i'
  ),
  web_search: /search|perplexity/i,
  reasoning: /o1-|reasoning|think/i,
  embedding: EMBEDDING_MODEL,
  rerank: RERANK_MODEL,
  // Must be a SUPERSET of embedding + rerank so a non-chat model (e.g.
  // `bge-m3:latest`) is filtered OUT of the primary / workflow model picker
  // instead of being offered for chat and failing with a provider 400
  // ("does not support chat"). The bare `embed`/`rerank` literals alone missed
  // family-named embeddings like bge-/gte-/e5-/voyage-, which is #740's bug.
  excludeFromPrimary: new RegExp(
    `dall-e|${FLUX_IMAGE_MODEL.source}|stable-?diffusion|midjourney|flash-image|image|${EMBEDDING_MODEL.source}|${RERANK_MODEL.source}`,
    'i'
  ),
};

/**
 * Explicit exclusion lists (blacklist) for capabilities
 */
export const CAPABILITY_EXCLUSIONS: Record<ModelType, RegExp[]> = {
  text: [],
  vision: [new RegExp(`embed|rerank|dall-e|${FLUX_IMAGE_MODEL.source}|stable-diffusion`, 'i')],
  function_calling: [
    /aqa(?:-[\w-]+)?/i,
    /imagen(?:-[\w-]+)?/i,
    /o1-mini/i,
    /o1-preview/i,
    /gemini-1(?:\\.[\w-]+)?/i,
    /dall-e/i,
    /embed/i,
    /rerank/i,
  ],
  image_generation: [],
  web_search: [],
  reasoning: [],
  embedding: [],
  rerank: [],
  excludeFromPrimary: [],
};

/**
 * Get the lowercase, normalized base model name for matching.
 */
export const getBaseModelName = (modelName: string): string => {
  return modelName
    .toLowerCase()
    .replace(/[^a-z0-9./-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Check whether a specific model within a provider has a given capability.
 * Returns true (supported), false (excluded), or undefined (unknown).
 */
export const hasSpecificModelCapability = (
  _platformModel: IProvider,
  modelName: string,
  type: ModelType
): boolean | undefined => {
  // Flux routing aliases (flux-auto / -fast / -reasoning / -standard) are chat
  // models that route per request, NOT FLUX.1 image models. Their ids contain
  // "flux", which collides with the image_generation / excludeFromPrimary
  // patterns and would hide them from the model picker ("No model configured").
  // Treat them as first-class chat models. See the flux-auto picker bug.
  if (isFluxModelId(modelName)) {
    if (type === 'excludeFromPrimary' || type === 'image_generation' || type === 'embedding' || type === 'rerank') {
      return false;
    }
    if (type === 'text' || type === 'function_calling') return true;
  }

  const baseModelName = getBaseModelName(modelName);
  const exclusions = CAPABILITY_EXCLUSIONS[type];
  const pattern = CAPABILITY_PATTERNS[type];

  const isExcluded = exclusions.some((excludePattern) => excludePattern.test(baseModelName));
  if (isExcluded) return false;

  return pattern.test(baseModelName) ? true : undefined;
};
