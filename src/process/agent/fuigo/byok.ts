/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BYOK providers for the bundled Fuigo engine.
 *
 * Fuigo under Desktop authenticates with the Flux key (`FUIGO_API_KEY`), which
 * made every Fuigo chat Flux-only. Users who connected their own Anthropic /
 * OpenAI / OpenAI-compatible keys had them work on Core; this maps Desktop's
 * provider rows (`model.config`, the legacy `IProvider` mirror every connected
 * registry provider writes) into Fuigo `[model.<id>]` entries so those models
 * are selectable in a Fuigo chat.
 *
 * Contract:
 *   - The key travels in a per-provider env var on the spawn, never in the
 *     TOML on disk (`FuigoByokModelEntry.envKey` ↔ `FuigoByokProvider.apiKey`).
 *   - The Flux row is excluded (it is the engine's own route), as are
 *     Bedrock / Vertex / Azure / ChatGPT-subscription (no API key shape Fuigo
 *     can use) and Gemini (`google-gemini` is not an OpenAI-compatible base).
 *   - Entry ids are `byok/<provider>/<model>`: never a Flux id, so the
 *     `isFluxModelId` guards send them on `session/set_model` unchanged, and
 *     never a bare catalog id, so a user's `claude-*` key can't silently
 *     shadow the same id on the Flux route (config beats the prefetched
 *     catalog in Fuigo's model resolution).
 */
import type { IProvider } from '@/common/config/storage';
import { isFluxProviderRow } from '@/common/config/imageModels';
import { ProcessConfig } from '@process/utils/initStorage';
import { CHAT_START_BASE_URL } from '@process/providers/ipc/modelRegistryIpc';
import type { ProviderId } from '@process/providers/types';
import type { FuigoByokModelEntry } from './launch';

export type FuigoByokProvider = {
  /** Env var the spawn sets to `apiKey`; every entry of this provider names it. */
  envKey: string;
  apiKey: string;
  entries: FuigoByokModelEntry[];
};

const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';
const SUPPORTED_PLATFORMS = new Set(['anthropic', 'openai', 'openai-compatible']);
/** Registry providers whose mirror row is `openai-compatible` but whose creds are not a bearer key. */
const SKIPPED_REGISTRY_PROVIDERS = new Set(['chatgpt-subscription', 'aws-bedrock', 'vertex', 'azure', 'ollama-local']);
const DEFAULT_BASE_URL: Record<string, string> = {
  anthropic: 'https://api.anthropic.com/v1',
  openai: 'https://api.openai.com/v1',
};

/**
 * A registry-mirrored row carries an empty `baseUrl` unless the user typed
 * one, so fall back to the canonical chat base the legacy dispatch uses
 * (Groq, DeepSeek, Cerebras, xAI, …); a hand-added row must name its URL.
 */
function defaultBaseUrl(row: IProvider, registryId: string | undefined): string {
  if (registryId) return CHAT_START_BASE_URL[registryId as ProviderId] ?? '';
  return DEFAULT_BASE_URL[row.platform] ?? '';
}

function registryProviderId(row: IProvider): string | undefined {
  const tag = (row as unknown as Record<string, unknown>)[BRIDGE_TAG_KEY];
  return typeof tag === 'string' && tag.startsWith('v2:') ? tag.slice(3) : undefined;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Fuigo appends `/messages` (Anthropic) or `/chat/completions` to `base_url`. */
function resolveBaseUrl(row: IProvider, registryId: string | undefined): string | undefined {
  const raw = (row.baseUrl || defaultBaseUrl(row, registryId)).trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(raw)) return undefined;
  if (row.platform === 'anthropic' && !raw.endsWith('/v1')) return `${raw}/v1`;
  return raw;
}

/** Pure mapping from provider rows to Fuigo BYOK providers; deterministic for a given row order. */
export function fuigoByokProvidersFromRows(rows: readonly IProvider[]): FuigoByokProvider[] {
  const out: FuigoByokProvider[] = [];
  const seenProviders = new Set<string>();
  for (const row of rows) {
    if (!row || row.enabled === false) continue;
    if (!SUPPORTED_PLATFORMS.has(row.platform)) continue;
    if (isFluxProviderRow(row)) continue;
    const registryId = registryProviderId(row);
    if (registryId && SKIPPED_REGISTRY_PROVIDERS.has(registryId)) continue;
    const apiKey = typeof row.apiKey === 'string' ? row.apiKey.trim() : '';
    if (!apiKey) continue;
    const baseUrl = resolveBaseUrl(row, registryId);
    if (!baseUrl) continue;
    const provider = slug(registryId ?? row.name ?? row.platform) || row.platform;
    if (seenProviders.has(provider)) continue;
    const models = (Array.isArray(row.model) ? row.model : []).filter(
      (m): m is string => typeof m === 'string' && m.trim().length > 0 && row.modelEnabled?.[m] !== false
    );
    if (models.length === 0) continue;
    seenProviders.add(provider);
    const envKey = `WAYLAND_BYOK_${provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_API_KEY`;
    const apiBackend = row.platform === 'anthropic' ? 'messages' : 'chat_completions';
    const label = row.name?.trim() || provider;
    const contextWindow =
      typeof row.contextLimit === 'number' && row.contextLimit > 0 ? Math.floor(row.contextLimit) : undefined;
    out.push({
      envKey,
      apiKey,
      entries: [...new Set(models)].map((model) => {
        const entry: FuigoByokModelEntry = {
          id: `byok/${provider}/${model}`,
          name: `${model} · ${label}`,
          model,
          baseUrl,
          apiBackend,
          envKey,
        };
        if (contextWindow) entry.contextWindow = contextWindow;
        return entry;
      }),
    });
  }
  return out;
}

export async function readFuigoByokProviders(): Promise<FuigoByokProvider[]> {
  const raw = await ProcessConfig.get('model.config');
  return fuigoByokProvidersFromRows(Array.isArray(raw) ? (raw as IProvider[]) : []);
}
