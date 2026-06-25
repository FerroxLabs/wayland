/**
 * The closed set of first-class providers Wayland Desktop ships with native
 * metadata, detection rules, and curation. Every value here has an entry in
 * `PROVIDER_META`. Catalog providers (the 104-provider models.dev set) are NOT
 * members — they flow through the widened `ProviderId` below.
 */
export type NativeProviderId =
  | 'anthropic'
  | 'openai'
  | 'google-gemini'
  | 'aws-bedrock'
  | 'vertex'
  | 'openrouter'
  | 'groq'
  | 'xai'
  | 'chatgpt-subscription'
  | 'mistral'
  | 'cohere'
  | 'perplexity'
  | 'together'
  | 'fireworks'
  | 'cerebras'
  | 'replicate'
  | 'huggingface'
  | 'nvidia'
  | 'anyscale'
  | 'deepseek'
  | 'moonshot'
  | 'qwen'
  | 'baichuan'
  | 'lingyiwanwu'
  | 'zhipu-glm'
  | 'minimax'
  | 'sakana'
  | 'stability'
  | 'deepgram'
  | 'assemblyai'
  | 'elevenlabs'
  | 'azure'
  | 'flux-router'
  | 'openai-compatible'
  | 'ollama-local';

/**
 * A provider identifier. Either a {@link NativeProviderId} (ships with native
 * metadata) or a dynamic catalog id (a models.dev provider slug). The branded
 * string keeps the union open without collapsing to bare `string` — native
 * literals still narrow, exhaustiveness checks still flag missing native cases,
 * and arbitrary catalog slugs are assignable. Look up metadata via
 * `providerMeta(id)`, which falls back to a generic tile for catalog ids.
 */
export type ProviderId = NativeProviderId | (string & { readonly __brand?: 'catalog' });

export type ModelTier = 'flagship' | 'everyday' | 'fast' | 'reasoning' | 'legacy';

export type Capability = 'chat' | 'vision' | 'image' | 'audio' | 'embeddings' | 'reasoning';

export type ProviderModel = {
  id: string;
  displayName: string;
  userDisplayName?: string;
  tier: ModelTier;
  capabilities: Capability[];
  enabled: boolean;
  deprecated?: boolean;
  deprecatedAt?: number;
  contextWindow?: number;
  pricing?: { inUSDPerMillion?: number; outUSDPerMillion?: number };
};

export type DetectionResult =
  | { kind: 'unique'; provider: ProviderId; confidence: 'high' }
  | { kind: 'ambiguous-sk'; candidates: ProviderId[] }
  | { kind: 'structural'; provider: ProviderId; confidence: 'medium' }
  | { kind: 'multi-field'; provider: ProviderId; requiredFields: string[] }
  | { kind: 'unknown' };

// --- Models & Providers redesign (Wave 0 contract) ------------------------
// Two-tier model store: CatalogSources emit RawModel[]; those are enriched by
// the models.dev registry into persisted CatalogModel[]; a pure Curator
// derives a CuratedModel[] view (latest + one revision back per family).

export type ModelKind = 'text' | 'image' | 'audio' | 'embedding' | 'other';

/**
 * Usage-typed tag derived from a model's modalities + capabilities.
 *
 * Replaces the old generic "MOST CAPABLE" / "RECOMMENDED" badge in the UI:
 * each model carries 0..N of these so a user reading the row knows what the
 * model is actually for (chat, vision, image-gen, reasoning, ...).
 *
 * Derived in `CatalogAssembler` from the models.dev `modalities` /
 * `reasoning` / `tool_call` fields - pure mapping, no fabricated data.
 * Persisted to the catalog so a cold load doesn't have to re-derive.
 */
export type UsageTag = 'chat' | 'vision' | 'image' | 'audio' | 'embeddings' | 'reasoning' | 'tools' | 'research';

/** Unenriched model identity straight off a CatalogSource. */
export type RawModel = { id: string; providerId: ProviderId; rawName?: string };

/** A model enriched by the models.dev registry and persisted to the catalog. */
export type CatalogModel = {
  id: string;
  providerId: ProviderId;
  displayName: string;
  family: string;
  kind: ModelKind;
  releaseDate?: string;
  contextWindow?: number;
  costInPerM?: number;
  costOutPerM?: number;
  status?: 'available' | 'preview' | 'deprecated';
  /** false = no models.dev match. */
  enriched: boolean;
  /**
   * Usage tags derived from models.dev modalities + capability flags. An
   * unenriched model has an empty `tags` array. See `UsageTag` for the
   * vocabulary. Always present (default `[]`) for forward compatibility -
   * the renderer can rely on it being an array.
   */
  tags: UsageTag[];
};

/** A curated view of a CatalogModel for the chat model picker. */
export type CuratedModel = CatalogModel & {
  recommended: boolean;
  enabled: boolean;
  role?: 'flagship' | 'previous' | 'fast';
};

/** Live connection state of a provider in the model registry. */
export type ProviderConnState = 'connected' | 'testing' | 'error';

/** Classified failure reason from a connect / test-connection attempt. */
export type ConnectError = 'unauthorized' | 'no-credit' | 'offline' | 'unrecognized' | 'no-models' | 'unknown';
