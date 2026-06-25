/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Image-model selection helpers shared by the renderer image-tool picker and
 * the process-side legacy mirror.
 *
 * Wayland's model catalog already auto-refreshes from models.dev (boot + 24h +
 * manual) and tags image models `kind: 'image'`. The legacy `model.config`
 * blob the image picker reads is mirrored from that catalog, but the mirror
 * runs every model through the `Curator`, which keeps only `kind: 'text'`
 * (correct for the *chat* pickers). So image models were stripped before they
 * ever reached the picker, and the hook patched the gap with a few hardcoded
 * Gemini ids that went stale.
 *
 * The real fix sources image models from the catalog (see
 * `legacyModelConfigBridge.selectImageModelIds`). This module provides:
 *   - `isImageModelName` - the substring detector the picker uses to pull image
 *     ids out of a provider's `model[]` (covers manually-added providers whose
 *     own `/v1/models` list happens to include image ids).
 *   - `curatedImageModelsForProvider` - a small, maintained floor of the best
 *     current image ids per provider family. It guarantees the picker is never
 *     empty (cold catalog, or a provider the mirror skips by design such as
 *     Google-auth Gemini) and surfaces the latest models immediately. The
 *     catalog layers any newer ids on top automatically. Ids are the canonical
 *     models.dev ids so they dedup cleanly against the catalog-sourced set.
 */

/**
 * True when `name` looks like an image-generation model id. Case-insensitive.
 * Covers the OpenAI Images family (`gpt-image-*`, `dall-e-*`, `chatgpt-image-*`),
 * Google (`gemini-*-image*`, `imagen-*`) and the `nano-banana` / `imagine`
 * aliases some providers use. Anything containing `image` is included, which
 * also catches OpenRouter-prefixed ids like `google/gemini-2.5-flash-image`.
 */
export function isImageModelName(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes('image') ||
    n.includes('banana') ||
    n.includes('imagine') ||
    n.includes('imagen') ||
    n.includes('dall-e') ||
    n.includes('dall_e')
  );
}

/** A curated-floor rule: providers matching `test` get `models` as a baseline. */
type CuratedRule = {
  /** Match on the legacy provider `platform` + `baseUrl` (host already lowered). */
  test: (platform: string, host: string) => boolean;
  /** Canonical models.dev image ids, best-first. */
  models: string[];
};

/**
 * The maintained floor of best-current image models per provider family. Keep
 * this short and current; the auto-refreshing catalog supplies everything else.
 * Ids are the canonical models.dev ids (verified against the bundled snapshot)
 * so they merge cleanly with the catalog-sourced set instead of duplicating.
 *
 * Host rules are checked before platform rules so an `openai-compatible`
 * provider pointed at OpenRouter / OpenAI gets the right family.
 */
/**
 * The recommended, default Flux image option ("Flux Image"). Not a literal arm
 * id - `executeFluxImageGen` translates it to a model-less request with a
 * quality category so Flux picks a strong arm per request (contract §3.2/§3.3).
 * Contains "image" so it survives {@link isImageModelName} in the picker.
 */
export const FLUX_RECOMMENDED_IMAGE_ID = 'flux-image';

/**
 * FluxRouter image options the picker offers. `flux-image` (recommended) leads;
 * the rest are the exact concrete `model` arm ids the `/v1/images/generations`
 * endpoint accepts (capabilities contract §3.3), best-first, for power users who
 * want to pin one. Every id passes {@link isImageModelName}.
 */
export const FLUX_IMAGE_ARMS = [
  FLUX_RECOMMENDED_IMAGE_ID,
  'gpt-image-high',
  'nano-banana-pro-4k',
  'nano-banana-pro-2k',
  'gpt-image-high-xl',
  'nano-banana',
  'gpt-image-med',
  'flux-image-together-flux',
] as const;

/** What Flux defaults to when it becomes the connected image backend: "Flux Image". */
export const FLUX_DEFAULT_IMAGE_ARM: string = FLUX_RECOMMENDED_IMAGE_ID;

/** Friendly, scannable labels for the Flux options (proper-noun model names, not chrome). */
const FLUX_IMAGE_ARM_LABELS: Record<string, string> = {
  [FLUX_RECOMMENDED_IMAGE_ID]: 'Flux Image',
  'gpt-image-high': 'GPT Image (High)',
  'gpt-image-high-xl': 'GPT Image (High XL)',
  'gpt-image-med': 'GPT Image (Medium)',
  'nano-banana': 'Nano Banana',
  'nano-banana-pro-2k': 'Nano Banana Pro 2K',
  'nano-banana-pro-4k': 'Nano Banana Pro 4K',
  'flux-image-together-flux': 'Together FLUX (Fastest)',
};

/**
 * A scannable display label for an image-model id. Flux arm ids get a friendly
 * name; everything else renders its raw id (unchanged from how the picker
 * already shows model ids).
 */
export function imageModelDisplayLabel(modelName: string): string {
  return FLUX_IMAGE_ARM_LABELS[modelName] ?? modelName;
}

const CURATED_IMAGE_MODEL_RULES: CuratedRule[] = [
  {
    // OpenRouter (proxies every vendor; ids are vendor-prefixed).
    test: (_p, host) => host.includes('openrouter.ai'),
    models: ['google/gemini-3-pro-image-preview', 'google/gemini-2.5-flash-image', 'openai/gpt-image-1.5'],
  },
  {
    // Native OpenAI (Images API host).
    test: (p, host) => host.includes('api.openai.com') || p === 'openai',
    models: ['gpt-image-1.5', 'gpt-image-1', 'chatgpt-image-latest'],
  },
  {
    // Native Google Gemini. `gemini-3-pro-image-preview` is nano-banana-pro.
    test: (p, host) => p === 'gemini' || host.includes('generativelanguage.googleapis.com'),
    models: ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image'],
  },
  {
    // AntigravityTools custom platform - keep its working square-aspect id.
    test: (p) => p.includes('antigravity'),
    models: ['gemini-3-pro-image-1x1'],
  },
];

/** Lowercased host of a base URL, or '' when absent / unparseable. */
function hostOf(baseUrl: string | undefined): string {
  if (!baseUrl || baseUrl.trim() === '') return '';
  try {
    return new URL(baseUrl).host.toLowerCase();
  } catch {
    return baseUrl.toLowerCase();
  }
}

/** The legacy mirror tags registry-managed rows `v2:<registryProviderId>`. */
const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';

/**
 * True when a provider row is FluxRouter. The connected Flux provider is
 * mirrored into the legacy config as `platform: 'openai-compatible'` with an
 * EMPTY baseUrl, so host/platform alone do not identify it - the reliable
 * signal is the registry bridge tag (`v2:flux-router`). Also matches the
 * canonical platform id / Flux host for non-bridged or direct rows.
 */
export function isFluxProviderRow(provider: {
  platform?: string;
  baseUrl?: string;
  [BRIDGE_TAG_KEY]?: unknown;
}): boolean {
  if ((provider.platform || '') === 'flux-router') return true;
  if (hostOf(provider.baseUrl).includes('fluxrouter.ai')) return true;
  const tag = provider[BRIDGE_TAG_KEY];
  return typeof tag === 'string' && tag.endsWith(':flux-router');
}

/**
 * The curated image-model floor for a connected provider. Flux is checked first
 * (its arms are not in models.dev, and its legacy row is ambiguously
 * `openai-compatible`); everything else falls to the per-family rules. Empty
 * when nothing matches (the provider relies on its own `model[]` / the catalog).
 */
export function curatedImageModelsForProvider(provider: {
  platform?: string;
  baseUrl?: string;
  [BRIDGE_TAG_KEY]?: unknown;
}): string[] {
  if (isFluxProviderRow(provider)) return [...FLUX_IMAGE_ARMS];
  const platform = (provider.platform || '').toLowerCase();
  const host = hostOf(provider.baseUrl);
  const rule = CURATED_IMAGE_MODEL_RULES.find((r) => r.test(platform, host));
  return rule ? [...rule.models] : [];
}
