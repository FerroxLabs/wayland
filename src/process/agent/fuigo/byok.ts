/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BYOK providers for the bundled Fuigo engine.
 *
 * Fuigo under Desktop authenticates with the Flux key (`FUIGO_API_KEY`), which
 * made every Fuigo chat Flux-only. Users who connected their own providers had
 * them work on Core; this maps Desktop's provider rows (`model.config`, the
 * legacy `IProvider` mirror every connected registry provider writes, plus the
 * hand-added rows) and the registry's Azure connection into Fuigo
 * `[model.<id>]` entries so those models are selectable in a Fuigo chat.
 *
 * Contract:
 *   - The key travels in a per-provider env var on the spawn, never in the
 *     TOML on disk (`FuigoByokModelEntry.envKey` ↔ `FuigoByokProvider.apiKey`).
 *   - A keyless LOCAL server (Ollama, LM Studio, llama.cpp: any loopback or
 *     private-network base URL) gets `LOCAL_KEYLESS_PLACEHOLDER` in that env
 *     var. Fuigo resolves `api_key` → `env_key` → session token →
 *     `FUIGO_API_KEY`; 1.0.16 attaches the last two only to a configured
 *     first-party origin (measured: a loopback entry with no `env_key`, or an
 *     unset one, went out with no Authorization header at all), and an
 *     `env_key` that resolves keeps the Flux key out of the question on any
 *     engine version.
 *   - The Flux row is excluded (it is the engine's own route).
 *   - Not expressible, so skipped: Bedrock (SigV4 request signing, no bearer),
 *     Vertex and Google-auth Gemini (OAuth access tokens; Fuigo can only mint
 *     one through an `[auth_provider]` command helper, which Desktop does not
 *     ship), ChatGPT subscription (Fuigo keeps its own OAuth store under
 *     `$FUIGO_HOME/subscriptions` and imports none), and the image / speech
 *     providers (no Chat Completions surface).
 *   - Entry ids are `byok/<provider>/<model>`: never a Flux id, so the
 *     `isFluxModelId` guards send them on `session/set_model` unchanged, and
 *     never a bare catalog id, so a user's `claude-*` key can't silently
 *     shadow the same id on the Flux route (config beats the prefetched
 *     catalog in Fuigo's model resolution).
 */
import type { IProvider } from '@/common/config/storage';
import { isFluxProviderRow } from '@/common/config/imageModels';
import { LOCAL_KEYLESS_PLACEHOLDER } from '@/common/utils/keylessLocalCredential';
import { isGoogleApisHost, isLocalBaseUrl } from '@/common/utils/urlValidation';
import { getDatabase } from '@process/services/database';
import { ollamaThinkingModels } from '@process/providers/local/ollamaCapabilities';
import { ProcessConfig } from '@process/utils/initStorage';
import { CHAT_START_BASE_URL } from '@process/providers/ipc/modelRegistryIpc';
import { selectMirrorModelIds } from '@process/providers/legacyModelConfigBridge';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import type { ProviderId } from '@process/providers/types';
import { buildFuigoManagedConfig, type FuigoByokModelEntry } from './launch';

export type FuigoByokProvider = {
  /** Env var the spawn sets to `apiKey`; every entry of this provider names it. */
  envKey: string;
  apiKey: string;
  entries: FuigoByokModelEntry[];
};

const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';
/** Registry providers whose mirror row Fuigo cannot use (see the contract above). */
const SKIPPED_REGISTRY_PROVIDERS = new Set([
  'chatgpt-subscription',
  'aws-bedrock',
  'vertex',
  'azure',
  'replicate',
  'stability',
  'deepgram',
  'assemblyai',
  'elevenlabs',
]);
const DEFAULT_BASE_URL: Record<string, string> = {
  anthropic: 'https://api.anthropic.com/v1',
  openai: 'https://api.openai.com/v1',
};
/** Google's OpenAI-compatible Gemini surface; Fuigo appends `/chat/completions`. */
export const GEMINI_OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
/**
 * Ollama's reasoning switch, as its OpenAI-compatible surface actually spells it.
 *
 * The native `think: true|false` field is an `/api/chat` field: it is not
 * accepted on `/v1/chat/completions`, which is the only surface Fuigo speaks
 * (`apiBackend: 'chat_completions'`), and Fuigo has no field for it either.
 * That endpoint takes `reasoning_effort` instead and maps it onto Ollama's own
 * Think parameter, where `none` is thinking off; with the field absent Ollama
 * turns thinking on by itself for any model that has it, which is the
 * complaint.
 *
 * Only `byok/ollama-local/...` is eligible. The capability has to be READ from
 * the daemon (`ollamaThinkingModels`), and `/api/show` is a loopback endpoint
 * on that daemon; Ollama Cloud is the same wire but not the same question, so
 * it is left out rather than guessed at.
 */
const OLLAMA_LOCAL_ENTRY_PREFIX = 'byok/ollama-local/';
/**
 * Ollama's own value set. Fuigo's built-in fallback menu offers `minimal` and
 * `xhigh`, which Ollama names nowhere; the whole list is offered only for a
 * model that reports `thinking`, where every value is one Ollama accepts.
 */
const OLLAMA_REASONING_EFFORTS: readonly string[] = ['none', 'low', 'medium', 'high', 'max'];

/**
 * A provider's Chat Completions base where it differs from the canonical chat
 * base Desktop's own dispatch uses: Cohere's `/v1` is its native chat API, and
 * `huggingface.co` is the website rather than the inference router.
 */
const FUIGO_CHAT_BASE_URL: Partial<Record<ProviderId, string>> = {
  cohere: 'https://api.cohere.ai/compatibility/v1',
  huggingface: 'https://router.huggingface.co/v1',
};

type Surface = Pick<FuigoByokModelEntry, 'baseUrl' | 'apiBackend'>;

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

function byokEnvKey(provider: string): string {
  return `WAYLAND_BYOK_${provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_API_KEY`;
}

const trimUrl = (raw: string | undefined): string => (raw ?? '').trim().replace(/\/+$/, '');

/**
 * Where one model of a row is served, or undefined when Fuigo cannot reach it.
 * Fuigo appends `/messages` (Anthropic) or `/chat/completions` to `baseUrl`.
 *
 * A registry-mirrored row carries an empty `baseUrl` unless the user typed
 * one, so it falls back to the canonical chat base the legacy dispatch uses
 * (Groq, DeepSeek, OpenRouter, Ollama, …); a hand-added `custom` row must name
 * its URL.
 */
function rowSurface(row: IProvider, registryId: string | undefined, model: string): Surface | undefined {
  const custom = trimUrl(row.baseUrl);
  let surface: Surface;
  switch (row.platform) {
    case 'anthropic': {
      const base = custom || trimUrl(registryId ? CHAT_START_BASE_URL[registryId] : DEFAULT_BASE_URL.anthropic);
      surface = { baseUrl: base.endsWith('/v1') ? base : `${base}/v1`, apiBackend: 'messages' };
      break;
    }
    case 'openai':
    case 'openai-compatible':
    case 'custom': {
      const fallback = registryId
        ? (FUIGO_CHAT_BASE_URL[registryId] ?? CHAT_START_BASE_URL[registryId])
        : DEFAULT_BASE_URL[row.platform];
      surface = { baseUrl: custom || trimUrl(fallback), apiBackend: 'chat_completions' };
      break;
    }
    case 'gemini':
      // The native Gemini API is not a Fuigo backend, but the same key works on
      // Google's OpenAI-compatible surface. A base URL on any other host is a
      // native-protocol proxy Fuigo cannot speak to.
      if (custom && !isGoogleApisHost(custom)) return undefined;
      surface = { baseUrl: GEMINI_OPENAI_BASE_URL, apiBackend: 'chat_completions' };
      break;
    case 'new-api': {
      // One gateway, a protocol per model; the root is normalised the way the
      // legacy dispatch does it (`normalizeNewApiBaseUrl`).
      const root = custom.replace(/\/v1(beta)?$/, '');
      const protocol = row.modelProtocols?.[model] ?? 'openai';
      if (protocol === 'openai') surface = { baseUrl: `${root}/v1`, apiBackend: 'chat_completions' };
      else if (protocol === 'anthropic') surface = { baseUrl: `${root}/v1`, apiBackend: 'messages' };
      else return undefined;
      break;
    }
    default:
      return undefined;
  }
  return /^https?:\/\//.test(surface.baseUrl) ? surface : undefined;
}

/**
 * The key a row's entries carry. A keyless server on this machine or the local
 * network gets the placeholder, never the Flux key; a keyless cloud row is a
 * half-configured provider and stays out of the picker.
 */
function rowCredential(apiKey: string, surfaces: readonly Surface[]): string | undefined {
  if (apiKey) return apiKey;
  const allLocal = surfaces.every((s) => s.apiBackend === 'chat_completions' && isLocalBaseUrl(s.baseUrl));
  return allLocal ? LOCAL_KEYLESS_PLACEHOLDER : undefined;
}

/** Pure mapping from provider rows to Fuigo BYOK providers; deterministic for a given row order. */
export function fuigoByokProvidersFromRows(rows: readonly IProvider[]): FuigoByokProvider[] {
  const out: FuigoByokProvider[] = [];
  const seenProviders = new Set<string>();
  for (const row of rows) {
    if (!row || row.enabled === false) continue;
    if (isFluxProviderRow(row)) continue;
    const registryId = registryProviderId(row);
    if (registryId && SKIPPED_REGISTRY_PROVIDERS.has(registryId)) continue;
    const provider = slug(registryId ?? row.name ?? row.platform) || row.platform;
    if (seenProviders.has(provider)) continue;
    const models = [
      ...new Set(
        (Array.isArray(row.model) ? row.model : []).filter(
          (m): m is string => typeof m === 'string' && m.trim().length > 0 && row.modelEnabled?.[m] !== false
        )
      ),
    ];
    const routed = models.flatMap((model) => {
      const surface = rowSurface(row, registryId, model);
      return surface ? [{ model, ...surface }] : [];
    });
    if (routed.length === 0) continue;
    const apiKey = rowCredential(typeof row.apiKey === 'string' ? row.apiKey.trim() : '', routed);
    if (!apiKey) continue;
    seenProviders.add(provider);
    const envKey = byokEnvKey(provider);
    const label = row.name?.trim() || provider;
    const contextWindow =
      typeof row.contextLimit === 'number' && row.contextLimit > 0 ? Math.floor(row.contextLimit) : undefined;
    out.push({
      envKey,
      apiKey,
      entries: routed.map(({ model, baseUrl, apiBackend }) => {
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

/**
 * Azure OpenAI through its v1 surface (`<resource>/openai/v1`, OpenAI Chat
 * Completions, the deployment name as the model). The key rides both the
 * bearer `env_key` and Azure's `api-key` header, from the same env var.
 */
export function fuigoAzureByokProvider(opts: {
  endpoint: string;
  apiKey: string;
  models: readonly string[];
}): FuigoByokProvider | undefined {
  const apiKey = opts.apiKey.trim();
  let origin: string;
  try {
    const url = new URL(opts.endpoint.trim());
    if (url.protocol !== 'https:') return undefined;
    origin = url.origin;
  } catch {
    return undefined;
  }
  const models = [...new Set(opts.models.filter((m) => typeof m === 'string' && m.trim().length > 0))];
  if (!apiKey || models.length === 0) return undefined;
  const envKey = byokEnvKey('azure');
  const baseUrl = `${origin}/openai/v1`;
  return {
    envKey,
    apiKey,
    entries: models.map((model) => ({
      id: `byok/azure/${model}`,
      name: `${model} · Azure OpenAI`,
      model,
      baseUrl,
      apiBackend: 'chat_completions',
      envKey,
      envHttpHeaders: { 'api-key': envKey },
    })),
  };
}

/** Azure is never mirrored into `model.config` (its creds are cloud fields), so read the registry. */
async function readAzureByokProvider(): Promise<FuigoByokProvider | undefined> {
  const db = await getDatabase();
  const repo = new ProviderRepository(db.getDriver());
  if (repo.getRegistryProvider('azure')?.state !== 'connected') return undefined;
  const stored = repo.getRegistryProviderCreds('azure');
  if (stored.status !== 'ok') return undefined;
  const fields = stored.creds.fields;
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return undefined;
  const { endpoint, apiKey } = fields as Record<string, unknown>;
  if (typeof endpoint !== 'string' || typeof apiKey !== 'string') return undefined;
  const models = selectMirrorModelIds(repo.getRegistryCatalog('azure'), repo.listRegistryOverrides('azure'));
  return fuigoAzureByokProvider({ endpoint, apiKey, models });
}

/** What answers "which of these models can think"; injectable so tests need no daemon. */
export type OllamaThinkingProbe = (rootUrl: string, models: readonly string[]) => Promise<ReadonlySet<string>>;

/**
 * Give the effort menu to the local Ollama models that report `thinking`, and
 * to no others.
 *
 * Offering it per provider is wrong: on a model without thinking, every value
 * but `none` fails the turn (measured, see `ollamaCapabilities.ts`), and
 * qwen2.5 and llama3.2 - both non-thinking - are what people actually run. So
 * the daemon is asked, and anything short of a clear yes leaves the model with
 * no option at all: absent is today's behaviour, an option that errors is not.
 *
 * Mutates the entries in place. One `ollama-local` row can exist at most (the
 * mapper dedupes on the provider slug) and it is an `openai-compatible` row, so
 * all its entries share one base URL; the daemon root is that base without the
 * OpenAI-compatible `/v1` suffix.
 */
export async function attachOllamaReasoningEfforts(
  providers: readonly FuigoByokProvider[],
  probe: OllamaThinkingProbe = ollamaThinkingModels
): Promise<void> {
  const entries = providers.flatMap((p) => p.entries).filter((e) => e.id.startsWith(OLLAMA_LOCAL_ENTRY_PREFIX));
  if (entries.length === 0) return;
  const rootUrl = entries[0].baseUrl.replace(/\/v1\/?$/, '');
  let thinking: ReadonlySet<string>;
  try {
    thinking = await probe(
      rootUrl,
      entries.map((e) => e.model)
    );
  } catch (error) {
    console.warn('[fuigo/byok] asking Ollama which models think failed:', error);
    return;
  }
  for (const entry of entries) {
    if (thinking.has(entry.model)) entry.reasoningEfforts = OLLAMA_REASONING_EFFORTS;
  }
}

export async function readFuigoByokProviders(): Promise<FuigoByokProvider[]> {
  const raw = await ProcessConfig.get('model.config');
  const providers = fuigoByokProvidersFromRows(Array.isArray(raw) ? (raw as IProvider[]) : []);
  try {
    const azure = await readAzureByokProvider();
    if (azure && !providers.some((p) => p.envKey === azure.envKey)) providers.push(azure);
  } catch (error) {
    console.warn('[fuigo/byok] reading the Azure connection failed:', error);
  }
  await attachOllamaReasoningEfforts(providers);
  return providers;
}

/**
 * What a Fuigo spawn takes from the BYOK providers: the managed config and the
 * env carrying each key. With no Flux key the engine's default model
 * (`flux-auto`) has no credential, so the first BYOK model becomes
 * `[models] default`; on a machine whose only provider is a local Ollama that is
 * the difference between a chat that answers and one whose first turn fails.
 */
export function fuigoByokSpawnPlan(
  providers: readonly FuigoByokProvider[],
  opts: { fluxKey: boolean }
): { config: string; env: Record<string, string> } {
  const entries = providers.flatMap((p) => p.entries);
  const env: Record<string, string> = {};
  for (const p of providers) env[p.envKey] = p.apiKey;
  const defaultModel = opts.fluxKey ? undefined : entries[0]?.id;
  return { config: buildFuigoManagedConfig(entries, { defaultModel }), env };
}
