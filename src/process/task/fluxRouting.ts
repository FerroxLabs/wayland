/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { FLUX_AUTO_MODEL, FLUX_SURFACE, isFluxModelId } from '@/common/config/flux';
import { PROVIDER_ENV_VARS } from '@process/providers/detection/KeyDiscovery';

/** Every native provider key var (OPENROUTER_API_KEY, GROQ_API_KEY, ...) -- stripped
 *  before applying the Flux surface so a flux-routed spawn is mutually exclusive. */
const NATIVE_PROVIDER_KEY_VARS: string[] = Array.from(
  new Set(Object.values(PROVIDER_ENV_VARS).flat().filter(Boolean) as string[])
);

/**
 * Per-backend ENV that, injected at spawn, makes a generic ACP backend route
 * through Flux WITHOUT writing any CLI config file (R13-safe). Every entry gets
 * the shared OPENAI_* surface (added in `resolveFluxRouting`); the value here is
 * the EXTRA, backend-specific env that selects the openai-compatible provider +
 * the flux-auto model for that particular CLI.
 *
 * Membership = empirically verified against a local OpenAI-compatible capture
 * server (2026-06-05), each confirmed to send `flux-auto` and return an answer:
 *
 *  - qwen: the shared OPENAI_BASE_URL + OPENAI_MODEL=flux-auto is enough; it
 *    posts to `/v1/chat/completions`. (No extra env.)
 *  - goose: also needs GOOSE_PROVIDER=openai + GOOSE_MODEL=flux-auto, otherwise
 *    it bails with "No provider configured" and never reads OPENAI_BASE_URL.
 *
 * Shared caveat: a CLI whose own config already pins an openai baseUrl/provider
 * may let the config win over these env vars (verified for an existing
 * `~/.qwen/settings.json`). That is additive/safe - the backend runs natively,
 * never stranded or rewritten - so the common clean-config user still gets Flux.
 *
 * NOT here, by design:
 *  - opencode / qoder: openai-capable but cannot be pointed at Flux env-only
 *    (opencode defaults to a non-openai provider + rejects flux-auto from its
 *    catalog; qoder routes through its own login). They need the config-writing
 *    setup assistant (backup -> write flux provider -> report -> rollback).
 *  - droid / auggie / copilot / kiro / vibe: vendor-locked to their own service
 *    (Factory / Augment / GitHub / AWS / Mistral); not Flux-routable. They stay
 *    native and the routing badge says so.
 *  - codex / codebuddy: openai/responses-surface npx backends, routing handled
 *    separately (codex uses the responses surface; not in this set).
 *
 * claude is NOT here either: it routes via the Anthropic surface, tracked in the
 * separate `ANTHROPIC_FLUX_BACKENDS` set below.
 */
const BACKEND_FLUX_ENV: Record<string, Record<string, string>> = {
  qwen: {},
  goose: { GOOSE_PROVIDER: 'openai', GOOSE_MODEL: FLUX_AUTO_MODEL },
};

/** Generic ACP backends that route through Flux via R13-safe env injection. */
export const GENERIC_FLUX_BACKENDS = Object.keys(BACKEND_FLUX_ENV) as readonly string[];

/**
 * Backends that route through the Anthropic surface (R1) instead of the OpenAI
 * one. claude's npx ACP bridge speaks the Anthropic wire protocol: it honors
 * ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN and POSTs to `<base>/v1/messages`
 * (empirically proven 2026-06-05). It is kept separate from the OpenAI-surface
 * generic backends because the env it emits is ANTHROPIC_*, not OPENAI_*.
 */
export const ANTHROPIC_FLUX_BACKENDS = ['claude'] as const;

/**
 * Backends that route through the Responses surface (R1). codex's CLI POSTs
 * `model=flux-auto` to `<base_url>/v1/responses` and reads its bearer from the
 * `FLUX_API_KEY` env var (empirically proven against the real codex CLI +
 * capture server, 2026-06-05). codex cannot be pointed at Flux by env alone:
 * it needs a `[model_providers.flux]` table (written by the codex connector)
 * plus `model_provider = "flux"` selected. Selection is done per-spawn via a
 * Wayland-scoped CODEX_HOME (materialized by AcpAgentManager) so the user's
 * global config is never pinned to flux. The routing decision here only emits
 * the `FLUX_API_KEY` the codex CLI reads at request time and strips native
 * OpenAI/Codex keys for mutual exclusivity.
 */
export const RESPONSES_FLUX_BACKENDS = ['codex'] as const;

/**
 * Backends that route through Flux via a Wayland-scoped config HOME (R13-safe)
 * rather than env alone. hermes speaks the OpenAI chat_completions surface but
 * cannot be pointed at Flux by env: it selects its provider from
 * `<HERMES_HOME>/config.yaml` (`model.provider = "custom"`, `base_url` = the
 * Flux openai surface, `api_mode = "chat_completions"`, `key_env =
 * FLUX_API_KEY`). The scoped HERMES_HOME is materialized + injected per-spawn by
 * AcpAgentManager (mirroring codex's CODEX_HOME), so the user's real ~/.hermes
 * config is never pinned to flux. The routing decision here only emits the
 * `FLUX_API_KEY` hermes reads at request time and strips native provider keys
 * for mutual exclusivity. Proven end-to-end against hermes v0.14.0 (2026-06-12).
 */
export const SCOPED_HOME_FLUX_BACKENDS = ['hermes'] as const;

/**
 * Native codex/OpenAI key vars stripped before a flux-routed codex spawn, so it
 * never also carries the user's native credentials (mutual exclusivity).
 * FLUX_API_KEY is deliberately NOT here.
 */
const NATIVE_CODEX_KEY_VARS = ['OPENAI_API_KEY', 'CODEX_API_KEY'] as const;

/** Native Anthropic env vars stripped before applying the Flux anthropic surface. */
const NATIVE_ANTHROPIC_KEY_VARS = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_MODEL',
] as const;

export type RoutingDecision = 'flux' | 'native' | 'unknown';

export type FluxRoutingContext = {
  backend: string;
  selectedModelId: string | undefined;
  /**
   * A concrete model id resolved from the backend's OWN provider identity
   * (its last-used / cached / configured-preferred model) for spawns that carry
   * no explicit per-spawn pick. Belt-and-suspenders for team + workflow spawns:
   * team_spawn_agent is usually called with no explicit model, so `selectedModelId`
   * arrives `undefined`. A known native model here PINS the spawn native so the
   * global `routeThroughFlux` toggle can NEVER force a backend that natively runs
   * the customer's model (e.g. codex on `gpt-5.6-sol` via an OpenAI API key OR a
   * ChatGPT subscription) onto the Flux surface - Flux 400s "the '<model>' model
   * does not exist" for a non-Flux id. Absent for a truly modelless spawn, where
   * the toggle's default role (route unmodeled chats through Flux) still applies.
   */
  resolvedModelId?: string;
  fluxConnected: boolean;
  fluxKey: string | undefined;
  routeThroughFlux: boolean;
};

export type FluxRoutingResult = {
  routing: RoutingDecision;
  env: Record<string, string>;
  stripKeys: string[];
};

const NATIVE = (): FluxRoutingResult => ({ routing: 'native', env: {}, stripKeys: [] });
const UNKNOWN = (): FluxRoutingResult => ({ routing: 'unknown', env: {}, stripKeys: [] });

/**
 * Single precedence rule (R5): per-chat flux model > global toggle > native.
 * Mutual exclusivity: flux env replaces (never co-exists with) the native
 * OPENAI key. Backends not on the generic list resolve 'unknown' (we cannot
 * apply the surface to them in Phase 1) so the routing badge tells the truth.
 */
export function resolveFluxRouting(ctx: FluxRoutingContext): FluxRoutingResult {
  const isOpenAi = (GENERIC_FLUX_BACKENDS as readonly string[]).includes(ctx.backend);
  const isAnthropic = (ANTHROPIC_FLUX_BACKENDS as readonly string[]).includes(ctx.backend);
  const isResponses = (RESPONSES_FLUX_BACKENDS as readonly string[]).includes(ctx.backend);
  const isScopedHome = (SCOPED_HOME_FLUX_BACKENDS as readonly string[]).includes(ctx.backend);
  if (!isOpenAi && !isAnthropic && !isResponses && !isScopedHome) return UNKNOWN();
  if (!ctx.fluxConnected || !ctx.fluxKey) return NATIVE();

  // L3 (R5 rule 1: an explicit per-chat pick wins). The picker feeds explicit
  // model ids per chat - a flux-* alias OR a native model id. When there is no
  // explicit per-spawn pick (team/workflow spawns frequently arrive with none),
  // fall back to the model the backend resolved from its OWN provider identity
  // (`resolvedModelId`) so a native model the customer actually runs is honored.
  // Decision, on the effective (explicit-or-resolved) model id:
  //  - flux model id                     -> flux (always).
  //  - non-flux (native) model id        -> native; the global toggle does NOT
  //    override a native model, explicit OR resolved (e.g. picking Opus 4.8, or a
  //    codex teammate on gpt-5.6-sol, stays native even when "Route all agents
  //    through Flux" is on). This is the guard that keeps a concrete non-flux
  //    model off the Flux surface (which 400s it) even when selectedModelId is
  //    absent but the backend's resolved identity is a native model.
  //  - no model at all + toggle on        -> flux (the toggle's default role: it
  //    only routes spawns that have no model, explicit or resolved).
  const effectiveModelId = ctx.selectedModelId ?? ctx.resolvedModelId;
  const wantsFlux = isFluxModelId(effectiveModelId) || (ctx.routeThroughFlux && !effectiveModelId);
  if (!wantsFlux) return NATIVE();

  if (isScopedHome) {
    // Scoped-HOME backends (hermes): the Flux base_url + provider selection live
    // in a Wayland-scoped config HOME (materialized + injected as HERMES_HOME by
    // AcpAgentManager). Here we only emit the FLUX_API_KEY hermes reads at
    // request time (its config.yaml `key_env: FLUX_API_KEY`) and strip native
    // provider keys so a flux spawn never also carries native credentials.
    return {
      routing: 'flux',
      env: { FLUX_API_KEY: ctx.fluxKey },
      stripKeys: [...NATIVE_PROVIDER_KEY_VARS],
    };
  }

  if (isResponses) {
    // Responses surface (R1): codex reads FLUX_API_KEY for its bearer at request
    // time. Provider SELECTION (model_provider=flux + model=flux-auto) is applied
    // separately by AcpAgentManager via a Wayland-scoped CODEX_HOME, so the user's
    // global codex config is never pinned to flux. Strip native OpenAI/Codex keys
    // so a flux spawn never also carries native credentials.
    return {
      routing: 'flux',
      env: { FLUX_API_KEY: ctx.fluxKey },
      stripKeys: [...NATIVE_PROVIDER_KEY_VARS, ...NATIVE_CODEX_KEY_VARS],
    };
  }

  if (isAnthropic) {
    // Anthropic surface (R1): claude's npx bridge POSTs to <base>/v1/messages.
    // Strip the native ANTHROPIC_* (incl. cc-switch creds) so a flux spawn never
    // also carries the user's native Anthropic credentials (mutual exclusivity).
    return {
      routing: 'flux',
      env: {
        ANTHROPIC_BASE_URL: FLUX_SURFACE.anthropic,
        ANTHROPIC_AUTH_TOKEN: ctx.fluxKey,
        // Also set ANTHROPIC_API_KEY to the Flux key: the bundled claude binary
        // prefers x-api-key over the Bearer auth token, and cc-switch may have
        // injected a stale native ANTHROPIC_API_KEY into the spawn env (added by
        // prepareClaude AFTER the strip). The Flux Anthropic surface accepts both
        // headers, so pinning both to the Flux key makes auth bulletproof and
        // ensures a cc-switch key can never win.
        ANTHROPIC_API_KEY: ctx.fluxKey,
        ANTHROPIC_MODEL: FLUX_AUTO_MODEL,
      },
      stripKeys: [...NATIVE_PROVIDER_KEY_VARS, ...NATIVE_ANTHROPIC_KEY_VARS],
    };
  }

  const backendEnv = BACKEND_FLUX_ENV[ctx.backend] ?? {};
  return {
    routing: 'flux',
    env: {
      OPENAI_BASE_URL: FLUX_SURFACE.openai,
      OPENAI_API_KEY: ctx.fluxKey,
      OPENAI_MODEL: FLUX_AUTO_MODEL,
      ...backendEnv,
    },
    stripKeys: [...NATIVE_PROVIDER_KEY_VARS, 'OPENAI_BASE_URL', 'OPENAI_MODEL', ...Object.keys(backendEnv)],
  };
}
