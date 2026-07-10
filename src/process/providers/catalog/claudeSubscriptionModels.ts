/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CatalogModel, UsageTag } from '@process/providers/types';
import { fetchWithRetry } from '@process/utils/fetchWithRetry';

/** The native provider id for a Claude subscription connected via OAuth. */
export const CLAUDE_SUBSCRIPTION_PROVIDER_ID = 'claude-subscription';

/**
 * The live Anthropic model-listing endpoint. A Claude *subscription* OAuth token
 * cannot be used as an API key for inference, but it CAN list the account's
 * available models here (GET /v1/models) with the `anthropic-beta:
 * oauth-2025-04-20` header - exactly what Claude Code does. So we fetch the list
 * LIVE per the connected account instead of shipping a frozen array that rots the
 * moment Anthropic ships a new model generation (verified 200 live 2026-07-10).
 */
const ANTHROPIC_MODELS_ENDPOINT = 'https://api.anthropic.com/v1/models?limit=1000';
const ANTHROPIC_OAUTH_BETA = 'oauth-2025-04-20';
const ANTHROPIC_VERSION = '2023-06-01';
const FETCH_TIMEOUT_MS = 12_000;

/**
 * OFFLINE FALLBACK ONLY — never the source of truth. Used solely when the live
 * fetch fails (offline / transient / token rejected). Kept reasonably current so
 * an offline user sees plausible models rather than a dead list; the live
 * endpoint always wins when reachable.
 */
export const CLAUDE_SUBSCRIPTION_MODEL_IDS = ['claude-opus-4-8', 'claude-sonnet-5', 'claude-haiku-4-5'] as const;

/** Human-facing display names for the offline-fallback set. */
const DISPLAY: Record<string, string> = {
  'claude-opus-4-8': 'Claude Opus 4.8',
  'claude-sonnet-5': 'Claude Sonnet 5',
  'claude-haiku-4-5': 'Claude Haiku 4.5',
};

/** Build one catalog entry. Unenriched (no models.dev match for subscription
 * slugs); the Curator special-cases this provider so unenriched models stay
 * selectable. */
function toCatalogModel(id: string, displayName: string, contextWindow?: number): CatalogModel {
  return {
    id,
    providerId: CLAUDE_SUBSCRIPTION_PROVIDER_ID,
    displayName: displayName || id,
    family: id,
    kind: 'text' as const,
    enriched: false,
    tags: [] as UsageTag[],
    ...(typeof contextWindow === 'number' && contextWindow > 0 ? { contextWindow } : {}),
  };
}

/**
 * Build the STATIC offline-fallback catalog (no network). Callers should prefer
 * {@link buildClaudeSubscriptionCatalogLive}; this is only the degraded path.
 */
export function buildClaudeSubscriptionCatalog(): CatalogModel[] {
  return CLAUDE_SUBSCRIPTION_MODEL_IDS.map((id) => toCatalogModel(id, DISPLAY[id] ?? id));
}

/** One entry in the live `/v1/models` response. */
type AnthropicModelEntry = {
  type?: unknown;
  id?: unknown;
  display_name?: unknown;
  max_input_tokens?: unknown;
};

/**
 * Fetch the connected account's live model list from Anthropic. Returns the
 * mapped `CatalogModel[]`, or `null` on ANY failure (offline, non-200,
 * unparseable, empty) so the caller can fall back to the static snapshot. Pure
 * network read — no persistence, never throws.
 */
export async function fetchLiveClaudeSubscriptionCatalog(accessToken: string): Promise<CatalogModel[] | null> {
  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) return null;
  let res: Response;
  try {
    res = await fetchWithRetry(
      ANTHROPIC_MODELS_ENDPOINT,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'anthropic-beta': ANTHROPIC_OAUTH_BETA,
          'anthropic-version': ANTHROPIC_VERSION,
        },
      },
      { timeoutMs: FETCH_TIMEOUT_MS, providerId: CLAUDE_SUBSCRIPTION_PROVIDER_ID }
    );
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return null;
  }
  if (!isRecord(body) || !Array.isArray(body.data)) return null;

  const models: CatalogModel[] = [];
  for (const entry of body.data) {
    if (!isRecord(entry)) continue;
    const e = entry as AnthropicModelEntry;
    if (typeof e.type === 'string' && e.type !== 'model') continue;
    if (typeof e.id !== 'string' || e.id.length === 0) continue;
    const displayName = typeof e.display_name === 'string' && e.display_name.length > 0 ? e.display_name : e.id;
    const ctx = typeof e.max_input_tokens === 'number' ? e.max_input_tokens : undefined;
    models.push(toCatalogModel(e.id, displayName, ctx));
  }
  return models.length > 0 ? models : null;
}

/**
 * Build the Claude-subscription catalog LIVE-first: fetch the account's real
 * models from Anthropic; only if that fails fall back to the static snapshot.
 * This is the catalog the connect + refresh paths persist.
 */
export async function buildClaudeSubscriptionCatalogLive(accessToken: string): Promise<CatalogModel[]> {
  const live = await fetchLiveClaudeSubscriptionCatalog(accessToken);
  return live ?? buildClaudeSubscriptionCatalog();
}

/** Narrow an `unknown` to a plain object record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
