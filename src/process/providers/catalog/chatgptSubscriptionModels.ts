/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CatalogModel, UsageTag } from '@process/providers/types';
import { fetchWithRetry } from '@process/utils/fetchWithRetry';

/** The native provider id for a ChatGPT subscription connected via OAuth. */
export const CHATGPT_SUBSCRIPTION_PROVIDER_ID = 'chatgpt-subscription';

/**
 * The live Codex model-listing endpoint. A ChatGPT *subscription* token cannot
 * hit `api.openai.com/v1/models`, but the Codex backend exposes the account's
 * currently-available models here — this is exactly what the Codex CLI (and the
 * Hermes / OpenClaw harnesses) use. So we fetch the list LIVE per the connected
 * account instead of shipping a frozen array that rots the moment OpenAI ships a
 * new model generation.
 *
 * The `client_version` query param is REQUIRED (the endpoint 400s without it)
 * and gates the response by each model's `minimal_client_version` — too low a
 * value returns `{"models":[]}`. `1.0.0` clears the current gate (models sit at
 * `minimal_client_version` `0.124.0`); bump it if the backend ever raises the
 * floor past `1.x`. Auth is a plain `Authorization: Bearer <access_token>` — no
 * account-id header needed (verified live 2026-06-24).
 */
const CODEX_MODELS_ENDPOINT = 'https://chatgpt.com/backend-api/codex/models';
const CODEX_CLIENT_VERSION = '1.0.0';
const FETCH_TIMEOUT_MS = 12_000;

/**
 * OFFLINE FALLBACK ONLY — never the source of truth. Used solely when the live
 * fetch fails (offline / transient). Kept reasonably current so an offline user
 * sees plausible models rather than a dead list; the live endpoint always wins
 * when reachable. Last synced from the live endpoint 2026-06-24 (verified the
 * prior `gpt-5.2`/`gpt-5.1` snapshot was 100% rejected by the backend).
 * #538: dropped `gpt-5.3-codex-spark` - it is dead on the backend (the live
 * fetch is what proves it, and offline it should not resurface as a phantom
 * selectable/selected model).
 */
export const CHATGPT_SUBSCRIPTION_MODEL_IDS = ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini'] as const;

/** Human-facing display names for the offline-fallback set. */
const DISPLAY: Record<string, string> = {
  'gpt-5.5': 'GPT-5.5',
  'gpt-5.4': 'GPT-5.4',
  'gpt-5.4-mini': 'GPT-5.4-Mini',
};

/** Build one catalog entry. Unenriched (no models.dev match for Codex slugs); */
/* the Curator special-cases this provider so unenriched models stay selectable. */
function toCatalogModel(id: string, displayName: string, contextWindow?: number): CatalogModel {
  return {
    id,
    providerId: CHATGPT_SUBSCRIPTION_PROVIDER_ID,
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
 * {@link buildChatGptSubscriptionCatalogLive}; this is only the degraded path.
 */
export function buildChatGptSubscriptionCatalog(): CatalogModel[] {
  return CHATGPT_SUBSCRIPTION_MODEL_IDS.map((id) => toCatalogModel(id, DISPLAY[id] ?? id));
}

/** One entry in the live `codex/models` response. */
type CodexModelEntry = {
  slug?: unknown;
  display_name?: unknown;
  context_window?: unknown;
  visibility?: unknown;
};

/**
 * Fetch the connected account's live model list from the Codex backend. Returns
 * the mapped `CatalogModel[]` (user-selectable models only — the backend marks
 * internal ones `visibility:"hide"`), or `null` on ANY failure (offline, non-200,
 * unparseable, empty) so the caller can fall back to the static snapshot. Pure
 * network read — no persistence, never throws.
 */
export async function fetchLiveChatGptSubscriptionCatalog(accessToken: string): Promise<CatalogModel[] | null> {
  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) return null;
  const url = `${CODEX_MODELS_ENDPOINT}?client_version=${CODEX_CLIENT_VERSION}`;
  let res: Response;
  try {
    res = await fetchWithRetry(
      url,
      { method: 'GET', headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` } },
      { timeoutMs: FETCH_TIMEOUT_MS, providerId: CHATGPT_SUBSCRIPTION_PROVIDER_ID }
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
  if (!isRecord(body) || !Array.isArray(body.models)) return null;

  const models: CatalogModel[] = [];
  for (const entry of body.models) {
    if (!isRecord(entry)) continue;
    const e = entry as CodexModelEntry;
    if (typeof e.slug !== 'string' || e.slug.length === 0) continue;
    // Only user-selectable models — the backend marks internal ones non-`list`.
    if (typeof e.visibility === 'string' && e.visibility !== 'list') continue;
    const displayName = typeof e.display_name === 'string' && e.display_name.length > 0 ? e.display_name : e.slug;
    const ctx = typeof e.context_window === 'number' ? e.context_window : undefined;
    models.push(toCatalogModel(e.slug, displayName, ctx));
  }
  return models.length > 0 ? models : null;
}

/**
 * Build the ChatGPT-subscription catalog LIVE-first: fetch the account's real
 * models from the backend; only if that fails fall back to the static snapshot.
 * This is the catalog the connect + refresh paths persist.
 */
export async function buildChatGptSubscriptionCatalogLive(accessToken: string): Promise<CatalogModel[]> {
  const live = await fetchLiveChatGptSubscriptionCatalog(accessToken);
  return live ?? buildChatGptSubscriptionCatalog();
}

/** Narrow an `unknown` to a plain object record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
