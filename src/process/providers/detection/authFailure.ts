/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure decision logic for invalidating a stored provider API key when a spawned
 * backend rejects it. Kept separate from AcpAgentManager so the false-positive
 * guard (the load-bearing safety property: never disable a valid provider on a
 * transient error) is unit-testable in isolation.
 */

import type { ProviderId } from '@process/providers/types';

/**
 * True only for UNAMBIGUOUS API-key auth failures. Deliberately narrow: a
 * transient 429 / 5xx / network blip must NOT match, or we would wrongly disable
 * a valid provider. Matches the strings emitted by claude/codex/etc. when an
 * injected key is rejected ("Invalid API key", "401 unauthorized", ...).
 */
export function isProviderKeyAuthFailure(text: string): boolean {
  if (!text) return false;
  return /invalid api key|fix external api key|invalid x-api-key|authentication_error|\binvalid_api_key\b|\bunauthorized\b|\b401\b/i.test(
    text
  );
}

/**
 * Given an error string, the failing backend's auth env vars, and the provider
 * keys injected into the spawn, return the providerIds whose key is the likely
 * culprit (its injected env var is the backend's auth var). A claude spawn also
 * injects openai/google keys; those must never be selected for an Anthropic
 * auth failure.
 */
export function selectAuthFailureCulprits(
  errorText: string,
  backendAuthVars: readonly string[],
  injected: ReadonlyArray<{ providerId: ProviderId; envVars: readonly string[] }>
): ProviderId[] {
  if (!isProviderKeyAuthFailure(errorText)) return [];
  if (backendAuthVars.length === 0 || injected.length === 0) return [];
  return injected.filter((inj) => inj.envVars.some((v) => backendAuthVars.includes(v))).map((inj) => inj.providerId);
}
