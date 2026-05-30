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
 * Onboarding scenario the overlay renders, selected from live detection.
 *
 *  - `D` — Flux already wired: Flux is a connected provider AND Flux Desktop
 *    is running. Show the "you're fully wired, here's your live routing" state.
 *  - `C` — Direct keys, no Flux: the user has direct provider API keys in their
 *    environment but has not connected Flux. Pitch "your keys already work, add
 *    Flux on top".
 *  - `A` — Power user, no direct keys: CLIs / Claude subscription / local
 *    Ollama present (and at least one meaningful signal) but no direct provider
 *    keys and no Flux. Pitch "you're already wired, route it through Flux".
 *  - `B` — Cold start: nothing meaningful detected.
 */
export type OnboardingScenario = 'A' | 'B' | 'C' | 'D';

/**
 * Pure classifier — maps a `DetectionResult` to the onboarding scenario.
 *
 * Precedence (highest wins):
 *   1. D  — `fluxConnected && fluxDesktop.running`.
 *   2. B  — nothing meaningful detected: no CLIs, no env keys, no Ollama,
 *           no Flux Desktop, no Claude Pro, and Flux not connected.
 *   3. C  — direct provider API keys present (`envKeys.length > 0`) and Flux
 *           not connected. "Your keys work, add Flux on top."
 *   4. A  — otherwise: a power-user signal (CLIs / Claude Pro / Ollama) exists
 *           but no direct env keys and Flux not connected. "You're already
 *           wired, route through Flux."
 *
 * The C-vs-A split is driven solely by whether direct provider API keys exist:
 * env keys ⇒ C (keys-first pitch); else the remaining non-cold signals ⇒ A.
 *
 * Pure function: no side effects, no I/O. Safe to call from the renderer.
 */
export function classifyScenario(d: DetectionResult): OnboardingScenario {
  // 1. Flux fully wired.
  if (d.fluxConnected && d.fluxDesktop.running) return 'D';

  const hasEnvKeys = d.envKeys.length > 0;
  const hasPowerSignal = d.clis.length > 0 || d.claudePro || d.ollama.running;
  const hasAnySignal = hasEnvKeys || hasPowerSignal || d.fluxDesktop.running || d.fluxConnected;

  // 2. Cold start — nothing meaningful detected.
  if (!hasAnySignal) return 'B';

  // 3. Direct provider API keys present ⇒ keys-first pitch.
  if (hasEnvKeys) return 'C';

  // 4. Power-user signals but no direct keys ⇒ already-wired pitch.
  return 'A';
}
