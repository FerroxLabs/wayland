/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Builder for the `WAYLAND_NANO_PROVIDERS` env payload injected into every
 * wnano (Wayland Nano) spawn (C8 provider parity, design §5/§6.2).
 *
 * The payload is a JSON array of `{ provider, models, hasKey }` telling Nano
 * which providers to advertise and route. It is UNTRUSTED-adjacent metadata:
 *
 *  - It carries NO secrets and NO endpoint/routing fields. Entries are rebuilt
 *    from scratch with exactly the three contract keys, so a `baseUrl`,
 *    `apiPath`, env-var name, or any other field on an input entry can never
 *    leak into the serialized payload. Endpoint authority is solely Nano's
 *    vendored catalog table.
 *  - Provider ids are constrained to Nano's known set
 *    ({@link NANO_KNOWN_PROVIDER_IDS}); anything else is dropped.
 *  - Bounds mirror Nano's validation limits exactly: <= 64 entries, <= 256
 *    model ids per provider, <= 128 chars per id, <= 32 KiB serialized.
 *    Overflow is dropped/trimmed DETERMINISTICALLY (never exceeded).
 *  - Model ids are deduplicated (first occurrence wins) and the output order
 *    is deterministic: Nano's known-set order for providers, input order for
 *    each provider's models.
 *
 * `hasKey` is advisory UX metadata only (Nano re-resolves real credentials at
 * `set_model`/dispatch time and never trusts this flag).
 */

/** Provider ids Nano's vendored catalog table knows (v1 scope, design §2/Q3). */
export const NANO_KNOWN_PROVIDER_IDS = [
  'flux-router',
  'anthropic',
  'openai',
  'openrouter',
  'groq',
  'mistral',
  'deepseek',
  'together',
  'fireworks',
  'perplexity',
  'cohere',
  'cerebras',
  'xai',
  'moonshot',
  'nvidia',
  'minimax',
  'google-gemini',
] as const;

export type NanoKnownProviderId = (typeof NANO_KNOWN_PROVIDER_IDS)[number];

/** One candidate entry gathered from Desktop's model registry. */
export type WnanoProviderEntry = {
  provider: string;
  models: string[];
  hasKey: boolean;
};

/** Hard bounds mirrored from Nano's payload validation (design §5). */
export const WNANO_PROVIDERS_MAX_ENTRIES = 64;
export const WNANO_PROVIDERS_MAX_MODELS_PER_PROVIDER = 256;
export const WNANO_PROVIDERS_MAX_ID_CHARS = 128;
export const WNANO_PROVIDERS_MAX_BYTES = 32 * 1024;

const KNOWN_ID_SET: ReadonlySet<string> = new Set(NANO_KNOWN_PROVIDER_IDS);

/**
 * Serialize the bounded `WAYLAND_NANO_PROVIDERS` payload for a wnano spawn.
 * Returns `undefined` when no entry survives sanitization (the env var is then
 * simply not injected, and Nano falls back to Flux-only advertisement).
 * Pure - no I/O, no secrets.
 */
export function buildWaylandNanoProvidersPayload(entries: readonly WnanoProviderEntry[]): string | undefined {
  const byProvider = new Map<string, WnanoProviderEntry>();
  for (const entry of entries) {
    if (!KNOWN_ID_SET.has(entry.provider)) continue;
    // First occurrence wins - keeps the output independent of duplicate input.
    if (!byProvider.has(entry.provider)) byProvider.set(entry.provider, entry);
  }

  // Deterministic order: Nano's known-set order, not input/enumeration order.
  const sanitized: WnanoProviderEntry[] = [];
  for (const providerId of NANO_KNOWN_PROVIDER_IDS) {
    if (sanitized.length >= WNANO_PROVIDERS_MAX_ENTRIES) break;
    const entry = byProvider.get(providerId);
    if (!entry) continue;
    sanitized.push({ provider: entry.provider, models: sanitizeModelIds(entry.models), hasKey: entry.hasKey });
  }

  // Serialized-size bound: drop trailing providers first; if a single provider
  // still exceeds the cap, trim its model list from the end. Deterministic.
  while (sanitized.length > 0) {
    if (Buffer.byteLength(JSON.stringify(sanitized), 'utf8') <= WNANO_PROVIDERS_MAX_BYTES) break;
    const last = sanitized[sanitized.length - 1];
    if (sanitized.length === 1 && last.models.length > 0) {
      last.models.pop();
    } else {
      sanitized.pop();
    }
  }

  if (sanitized.length === 0) return undefined;
  return JSON.stringify(sanitized);
}

/**
 * Keep only usable model ids: non-empty strings of <= 128 chars, deduplicated
 * (first wins), capped at 256 per provider.
 */
function sanitizeModelIds(models: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const model of models) {
    if (out.length >= WNANO_PROVIDERS_MAX_MODELS_PER_PROVIDER) break;
    if (typeof model !== 'string') continue;
    const id = model.trim();
    if (id.length === 0 || id.length > WNANO_PROVIDERS_MAX_ID_CHARS) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
