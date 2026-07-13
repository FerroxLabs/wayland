/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Result of the first-run onboarding environment detection.
 *
 * Lives in `common` so both the main-process detector (`process/onboarding`)
 * and the renderer hook (`useOnboardingDetection`) share one shape without
 * the renderer importing Node-only main-process modules.
 *
 * This file must stay renderer-safe: no `node:` imports, no Electron imports.
 */
export type DetectionResult = {
  /** The user's display name (OS account name or resolved real name). */
  name: string;
  /** CLI tools found on PATH (e.g. `codex`, `claude`, `cursor`, `aider`). */
  clis: string[];
  /**
   * Execution engines found by the app's unified `AgentRegistry` - the same
   * scan that powers the model picker (Claude Code, Codex, Qwen Code, Kimi CLI,
   * OpenCode, Hermes, OpenClaw Gateway, Gemini CLI, Wayland Core, …). `kind` is
   * the registry `DetectedAgentKind` (`acp` | `gemini` | `wcore` |
   * `openclaw-gateway` | `nanobot` | `remote`).
   */
  agents: { id: string; kind: string; name: string }[];
  /** Provider env keys discovered in the shell environment / config files. */
  envKeys: string[];
  /** Whether a Claude Pro / `~/.claude` install was detected. */
  claudePro: boolean;
  /** Local Ollama daemon state. */
  ollama: {
    running: boolean;
    models: string[];
  };
  /** Flux Desktop daemon state. */
  fluxDesktop: {
    running: boolean;
    version?: string;
  };
  /** Whether `flux-router` is already a connected provider in the registry. */
  fluxConnected: boolean;
};

/**
 * Validated shape of the Flux Desktop daemon `/api/metrics` payload, shared by
 * the Models hero and the sidebar status widget so both surfaces read one
 * contract. The IPC method is typed `unknown | null`; consumers narrow into
 * this via their `parseFluxMetrics` and never fabricate numbers.
 */
export type FluxMetrics = {
  /** Total routed turns the daemon has observed. */
  totalTurns: number;
  /** Last-N routing histogram: flagship (h), small (s), local Ollama (o). */
  histogram: { h: number; s: number; o: number };
  /** Pre-formatted savings line from the daemon, if known. */
  savings?: string;
  /** Share of recent turns served by local Ollama (0-100), if known. */
  ollamaSharePct?: number;
};

/**
 * Result of the one-click Flux Router OAuth connect (`ipcBridge.onboarding.connectFlux`).
 *
 * On success the freshly-minted `sk-flux` key has already been persisted through
 * the model-registry connect path (tested, saved to the OS keychain, catalog
 * built) - the renderer only needs to advance the onboarding. On failure the
 * `error` is a stable, renderer-safe reason the UI maps to a message; it never
 * carries the key or any raw network detail.
 */
export type ConnectFluxResult =
  | { ok: true }
  | { ok: false; error: 'cancelled' | 'timeout' | 'unauthorized' | 'no-credit' | 'offline' | 'unknown' };

/**
 * Result of the native xAI "Sign in with X (Grok)" OAuth connect
 * (`ipcBridge.xaiAuth.login`).
 *
 * On success the SuperGrok / X Premium bearer token obtained via the standard
 * OAuth 2.0 PKCE flow against `accounts.x.ai` has already been persisted through
 * the model-registry connect path as the `xai` provider (tested against
 * `api.x.ai/v1`, saved to the OS keychain, catalog built). The renderer only
 * needs to advance the UI. `reused: true` means an existing `~/.grok/auth.json`
 * credential was detected and reused instead of opening the browser.
 *
 * On failure the `error` is a stable, renderer-safe reason; it never carries the
 * token or any raw network detail.
 */
export type XaiOAuthResult =
  | { ok: true; reused: boolean }
  | { ok: false; error: 'cancelled' | 'timeout' | 'unauthorized' | 'no-credit' | 'offline' | 'unknown' };

/**
 * Result of the native "Sign in with ChatGPT" OAuth connect
 * (`ipcBridge.chatgptAuth.login`).
 *
 * On success the ChatGPT-subscription token obtained via the standard OAuth 2.0
 * PKCE flow against `auth.openai.com` (the same path the Codex CLI uses) has been
 * persisted - the encrypted bundle for inference/refresh is saved and the
 * `chatgpt-subscription` provider is registered. `planType` is surfaced so the
 * UI can confirm the tier ("Pro", "Plus", ...).
 *
 * On failure the `error` is a stable, renderer-safe reason; it never carries the
 * token or any raw network detail.
 */
export type ChatGptPlanLabel = 'free' | 'plus' | 'pro' | 'team' | 'enterprise' | 'unknown';

export type ChatGptOAuthResult =
  | { ok: true; planType: ChatGptPlanLabel }
  | {
      ok: false;
      // 'headless' (#525): a headless/remote host with no local browser + an
      // unreachable localhost callback — surfaced with SSH-port-forward guidance.
      error: 'cancelled' | 'timeout' | 'unauthorized' | 'no-credit' | 'offline' | 'headless' | 'unknown';
    };

/**
 * Result of connecting a single pasted API key during onboarding
 * (`ipcBridge.onboarding.connectPastedKey`). The provider is auto-detected via
 * the real `ProviderDetector` + `SkRaceResolver`, so a bare `sk-` key shared by
 * OpenAI/DeepSeek/Moonshot/Qwen is resolved to its true owner by live probe.
 *
 * `providerId` is the resolved/attempted registry provider id, surfaced so the
 * UI can confirm ("DeepSeek connected") or point to Settings on `needs-fields`.
 * Error reasons: `unrecognized` (not a known key shape), `no-match` (raced but
 * nothing accepted it), `needs-fields` (provider needs more than a key),
 * `failed` (detected but the connect/test did not stick).
 */
export type ConnectPastedKeyResult =
  | { ok: true; providerId: string }
  | { ok: false; error: 'unrecognized' | 'no-match' | 'needs-fields' | 'failed'; providerId?: string };

/**
 * Onboarding scenario the overlay renders, selected from live detection.
 *
 *  - `D` - Flux already wired: Flux is a connected provider AND Flux Desktop
 *    is running. Show the "you're fully wired, here's your live routing" state.
 *  - `C` - Direct keys, no Flux: the user has direct provider API keys in their
 *    environment but has not connected Flux. Pitch "your keys already work, add
 *    Flux on top".
 *  - `A` - Power user, no direct keys: CLIs / Claude subscription / local
 *    Ollama present (and at least one meaningful signal) but no direct provider
 *    keys and no Flux. Pitch "you're already wired, route it through Flux".
 *  - `B` - Cold start: nothing meaningful detected.
 */
export type OnboardingScenario = 'A' | 'B' | 'C' | 'D';

/**
 * Pure classifier - maps a `DetectionResult` to the onboarding scenario.
 *
 * Precedence (highest wins):
 *   1. D  - `fluxConnected`. A connected Flux key is sufficient on its own;
 *           Flux Desktop is not required (Phase 1 has no Desktop dependency).
 *   2. B  - nothing meaningful detected: no CLIs, no env keys, no Ollama,
 *           no Flux Desktop, no Claude Pro, and Flux not connected.
 *   3. C  - direct provider API keys present (`envKeys.length > 0`) and Flux
 *           not connected. "Your keys work, add Flux on top."
 *   4. A  - otherwise: a power-user signal (CLIs / Claude Pro / Ollama) exists
 *           but no direct env keys and Flux not connected. "You're already
 *           wired, route through Flux."
 *
 * The C-vs-A split is driven solely by whether direct provider API keys exist:
 * env keys ⇒ C (keys-first pitch); else the remaining non-cold signals ⇒ A.
 *
 * Pure function: no side effects, no I/O. Safe to call from the renderer.
 */
export function classifyScenario(d: DetectionResult): OnboardingScenario {
  // 1. Flux fully wired - a connected key is sufficient; Flux Desktop not required.
  if (d.fluxConnected) return 'D';

  // Reached only when Flux is not connected (the line above returned for that case),
  // so `fluxConnected` is necessarily false here and is omitted from the signal check.
  const hasEnvKeys = d.envKeys.length > 0;
  const hasPowerSignal = d.clis.length > 0 || d.claudePro || d.ollama.running;
  const hasAnySignal = hasEnvKeys || hasPowerSignal || d.fluxDesktop.running;

  // 2. Cold start - nothing meaningful detected.
  if (!hasAnySignal) return 'B';

  // 3. Direct provider API keys present ⇒ keys-first pitch.
  if (hasEnvKeys) return 'C';

  // 4. Power-user signals but no direct keys ⇒ already-wired pitch.
  return 'A';
}
