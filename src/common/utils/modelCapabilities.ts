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
 * Each family stem is anchored to a token boundary (start-of-id or a
 * `/ . : _ -`/whitespace separator on both sides) so a short stem can't match
 * inside an unrelated chat model id — e.g. `uae` must NOT trip on the vendored
 * `kuae-*` ("KUAE Cloud Coding Plan") coding models, and `e5`/`bge`/`gte` can't
 * match mid-word. `embed`/`embeddings` still catch `text-embedding-*`,
 * `nomic-embed-*`, `gemini-embedding-*`, etc. via the same boundaries.
 */
export const EMBEDDING_MODEL =
  /(?:^|[\s./:_-])(?:embeddings?|embed|bge|gte|e5|uae|voyage|jina-clip|retrieval|llm2vec)(?=$|[\s./:_-])/i;

/** Reranker / retriever models (cross-encoders) - never chat models. */
const RERANK_MODEL = /(?:rerank|re-rank|re-ranker|re-ranking|retrieval|retriever)/i;

/**
 * Capability matching regex patterns
 */
export const CAPABILITY_PATTERNS: Record<ModelType, RegExp> = {
  text: /gpt|claude|gemini|qwen|llama|mistral|deepseek/i,
  vision: /4o|claude-3|gemini-.*-pro|gemini-.*-flash|gemini-2\.0|qwen-vl|llava|vision/i,
  function_calling: /gpt-4|claude-3|gemini|qwen|deepseek/i,
  image_generation: new RegExp(
    `${FLUX_IMAGE_MODEL.source}|diffusion|stabilityai|sd-|dall|cogview|janus|midjourney|mj-|imagen`,
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
    `dall-e|${FLUX_IMAGE_MODEL.source}|stable-diffusion|midjourney|flash-image|image|${EMBEDDING_MODEL.source}|${RERANK_MODEL.source}`,
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
