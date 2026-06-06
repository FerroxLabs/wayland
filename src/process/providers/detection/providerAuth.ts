/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared provider authentication strategy.
 *
 * Both `ApiProviderSource` (the `/v1/models` catalog source) and
 * `ConnectionTester` (the inference probe) must authenticate against the same
 * providers in the same way. This module is the single source of truth for that
 * auth logic - a future auth change touches exactly one file.
 */

import type { ProviderId } from '../types';

/**
 * How a provider authenticates an HTTP request.
 *
 * Most providers are OpenAI-compatible (`Authorization: Bearer`); Anthropic and
 * Google Gemini are not.
 */
export type AuthStrategy =
  /** OpenAI and every OpenAI-compatible provider: `Authorization: Bearer`. */
  | { kind: 'bearer' }
  /** Anthropic: `x-api-key` + `anthropic-version` headers, no `Authorization`. */
  | { kind: 'anthropic' }
  /** Google Gemini: API key as a `key` query parameter, no auth header. */
  | { kind: 'query'; param: string };

/** The `anthropic-version` string Anthropic requires on every request. */
export const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Per-provider auth strategy, conceptually parallel to `PROVIDER_ENDPOINTS`.
 * Any provider absent from this map uses the `bearer` default.
 */
export const PROVIDER_AUTH: Partial<Record<ProviderId, AuthStrategy>> = {
  anthropic: { kind: 'anthropic' },
  'google-gemini': { kind: 'query', param: 'key' },
};

/** Resolve a provider's auth strategy, defaulting to OpenAI-style Bearer. */
export function authStrategyFor(providerId: ProviderId): AuthStrategy {
  return PROVIDER_AUTH[providerId] ?? { kind: 'bearer' };
}

/** Append (or override) a single query parameter on a URL. */
export function appendQuery(url: string, param: string, value: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set(param, value);
  return parsed.toString();
}
