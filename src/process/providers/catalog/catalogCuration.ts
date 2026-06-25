/**
 * Pure curation filter for the engine's bundled provider catalog.
 *
 * Ports the exclusion rules documented in `wcore-config`'s `data/providers.toml`
 * header so the desktop surfaces exactly the providers the engine considers
 * selectable. Every function here is pure over its argument: no disk reads, no
 * network, no globals beyond the static native-id set.
 *
 * A catalog row is INELIGIBLE when any of:
 *  1. `missing-fields`    — empty `id`, `base_url`, or `env_var`.
 *  2. `native-collision`  — its `id` duplicates a {@link NativeProviderId}; the
 *                           native wiring wins, the catalog row is dropped.
 *  3. `local-only`        — `base_url` host is localhost / 127.0.0.1 / 0.0.0.0 /
 *                           `*.local` (e.g. an Ollama-style local endpoint).
 *  4. `templated`         — `base_url` holds an unresolved `${...}` placeholder.
 *  5. `anthropic-wire`    — `openai_compatible === false`.
 */

import type { NativeProviderId } from '@process/providers/types';
import type { RawCatalogEntry } from '@process/providers/catalog/catalogProvider';
import { isLoopbackOrPrivateHost } from '@/common/utils/urlValidation';

/**
 * The native provider ids as a runtime map. Typed `Record<NativeProviderId,
 * true>` so adding or removing a union member in `types.ts` is a compile error
 * here — the set can never silently drift from the type.
 */
const NATIVE_ID_MAP: Record<NativeProviderId, true> = {
  anthropic: true,
  openai: true,
  'google-gemini': true,
  'aws-bedrock': true,
  vertex: true,
  openrouter: true,
  groq: true,
  xai: true,
  'chatgpt-subscription': true,
  mistral: true,
  cohere: true,
  perplexity: true,
  together: true,
  fireworks: true,
  cerebras: true,
  replicate: true,
  huggingface: true,
  nvidia: true,
  anyscale: true,
  deepseek: true,
  moonshot: true,
  qwen: true,
  baichuan: true,
  lingyiwanwu: true,
  'zhipu-glm': true,
  minimax: true,
  sakana: true,
  stability: true,
  deepgram: true,
  assemblyai: true,
  elevenlabs: true,
  azure: true,
  'flux-router': true,
  'openai-compatible': true,
  'ollama-local': true,
};

/**
 * Catalog ids that duplicate a native provider. A catalog row with one of these
 * ids is dropped (eligibility `native-collision`) so the native provider's
 * hand-wired metadata/detection wins.
 */
export const NATIVE_COLLISION_IDS: ReadonlySet<string> = new Set(Object.keys(NATIVE_ID_MAP));

/** Why a catalog entry is not selectable as a desktop catalog provider. */
export type CatalogIneligibleReason =
  | 'local-only'
  | 'templated'
  | 'anthropic-wire'
  | 'missing-fields'
  | 'native-collision';

/** Result of {@link isCatalogEligible}. `reason` is present iff `eligible` is false. */
export type CatalogEligibility = { eligible: true } | { eligible: false; reason: CatalogIneligibleReason };

/**
 * Extract the lowercased host from a base URL. Returns `null` only when the URL
 * is unparseable even after prefixing a scheme.
 */
function hostOf(baseUrl: string): string | null {
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(baseUrl) ? baseUrl : `http://${baseUrl}`;
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True when the base URL points at a machine-local endpoint. Uses the single
 * canonical loopback/private-host classifier (shared with the keyless gate and
 * the refresh SSRF gate), plus the mDNS `*.local` suffix the bundled catalog
 * header documents. The native `ollama-local` provider is NOT curated through
 * this path (it is dropped earlier as a `native-collision`, then surfaced via
 * the registry), so this filter keeps dropping arbitrary localhost catalog rows.
 */
function isLocalOnly(baseUrl: string): boolean {
  const host = hostOf(baseUrl);
  if (host === null) return false;
  return isLoopbackOrPrivateHost(host) || host.endsWith('.local');
}

/** True when the base URL still carries an unresolved `${...}` placeholder. */
function isTemplated(baseUrl: string): boolean {
  return /\$\{[^}]*\}/.test(baseUrl);
}

/**
 * Decide whether a raw catalog entry is eligible to surface as a desktop
 * catalog provider. Pure; checks run in a fixed precedence so callers get one
 * stable reason: missing-fields -> native-collision -> templated -> local-only
 * -> anthropic-wire.
 */
export function isCatalogEligible(entry: RawCatalogEntry): CatalogEligibility {
  if (entry.id.trim() === '' || entry.base_url.trim() === '' || entry.env_var.trim() === '') {
    return { eligible: false, reason: 'missing-fields' };
  }
  if (NATIVE_COLLISION_IDS.has(entry.id)) {
    return { eligible: false, reason: 'native-collision' };
  }
  if (isTemplated(entry.base_url)) {
    return { eligible: false, reason: 'templated' };
  }
  if (isLocalOnly(entry.base_url)) {
    return { eligible: false, reason: 'local-only' };
  }
  if (entry.openai_compatible === false) {
    return { eligible: false, reason: 'anthropic-wire' };
  }
  return { eligible: true };
}
