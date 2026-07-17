/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Canonical backend -> registry `ProviderId` mapping, shared by the home-picker
 * catalog synthesis (`modelRegistryIpc.curatedForAgent`) and the Teams
 * default-model resolver (`TeamSessionService.resolveDefaultAcpModel`).
 *
 * These maps previously lived privately inside `modelRegistryIpc.ts`. They were
 * lifted here so the two call sites cannot drift: the "what provider does this
 * backend run" knowledge must be identical whether the picker is synthesizing a
 * catalog or Teams is choosing a default model to get an ACP teammate started.
 * This module is intentionally side-effect free (pure data + one pure function)
 * so it can be imported by both the IPC-wiring layer and the team layer without
 * init-order or circular-import hazards.
 */

import type { ProviderId } from './types';
import type { CliAgentKey } from './sources/CliAgentSource';
import { CHATGPT_SUBSCRIPTION_PROVIDER_ID } from './catalog/chatgptSubscriptionModels';

/** The provider each CLI agent runs (used for the not-connected models.dev
 * fallback - must be a models.dev-keyed provider). */
export const CLI_UNDERLYING_PROVIDER: Record<CliAgentKey, ProviderId> = {
  claude: 'anthropic',
  codex: 'openai',
  gemini: 'google-gemini',
};

/**
 * OAuth/subscription providers a CLI may be authenticated through, BEYOND its
 * primary `CLI_UNDERLYING_PROVIDER` API-key provider (#374). Codex authenticates
 * via a ChatGPT subscription (`chatgpt-subscription`, OAuth) far more often than
 * an `openai` API key, and that connection persists its OWN live Codex-backend
 * catalog (`buildChatGptSubscriptionCatalogLive`). When one of these is
 * connected the home picker must use its real catalog instead of synthesizing
 * the (unconnected, therefore empty) API-key provider - the gap #377 missed,
 * which made the Codex picker fall back to Flux-only for subscription users.
 */
export const CLI_OAUTH_PROVIDERS: Record<CliAgentKey, ProviderId[]> = {
  claude: [],
  codex: [CHATGPT_SUBSCRIPTION_PROVIDER_ID],
  gemini: [],
};

/**
 * Vendor-locked ACP backends (#374): single-provider CLIs whose home-picker
 * catalog is synthesized from the models.dev registry, exactly like a
 * non-enumerable CLI. Each maps to the one provider it runs, so the picker
 * surfaces real models BEFORE the first connection instead of dead-ending on
 * the "available after first connection" tooltip. Truly multi-provider CLIs
 * (goose, droid, auggie, cursor, …) are intentionally absent: they have no
 * single underlying provider, so they keep returning an empty curated set (the
 * picker then offers Flux Auto when the backend is Flux-routable).
 *
 * `opencode` is mapped to the `opencode-go` gateway it is vendored alongside
 * (#407): the OpenCode agent's picker dead-ended on the tooltip even with
 * opencode-go "Connected · N models", because nothing surfaced that connected
 * catalog. When opencode-go is connected, `synthesizeProvider` returns its real
 * catalog; when it is not, opencode-go has no models.dev slice so the result is
 * empty (cold-start parity with the old behavior, no misleading vendor list).
 */
export const ACP_BACKEND_UNDERLYING_PROVIDER: Record<string, ProviderId> = {
  grok: 'xai',
  kimi: 'moonshot',
  qwen: 'qwen',
  vibe: 'mistral',
  opencode: 'opencode-go',
};

const CLI_AGENT_KEYS: ReadonlySet<string> = new Set<CliAgentKey>(['claude', 'codex', 'gemini']);

/**
 * Ordered candidate registry `ProviderId`s a given backend should default to,
 * highest priority first. For a CLI agent with an OAuth/subscription provider
 * (codex -> chatgpt-subscription) the subscription is tried before the metered
 * API-key provider, mirroring `curatedForAgent`'s connection precedence so the
 * Teams default matches what the picker would surface. Returns an empty array
 * for a backend with no known single provider (truly multi-provider CLIs), which
 * the caller treats as "no default" (empty model), never a fabricated one.
 */
export function resolveBackendCandidateProviders(backend: string): ProviderId[] {
  if (CLI_AGENT_KEYS.has(backend)) {
    const key = backend as CliAgentKey;
    return [...CLI_OAUTH_PROVIDERS[key], CLI_UNDERLYING_PROVIDER[key]];
  }
  const acp = ACP_BACKEND_UNDERLYING_PROVIDER[backend];
  return acp ? [acp] : [];
}
