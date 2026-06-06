/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plain-language model-scope copy for each agent (spec §4.7).
 *
 * Every agent card states, in a plain sentence, what models it runs - never
 * "family" jargon, never a padlock metaphor. Wayland Core runs any connected
 * model; a CLI agent is self-authenticated and runs one provider's models;
 * model-agnostic CLIs run whatever model they are pointed at.
 *
 * `scopeKey` resolves to an i18n string under `settings.agentsPage.scope.*`.
 * `accent` is `true` for agents whose scope is the open, brand-coloured
 * "runs any model" line (Wayland Core, model-agnostic CLIs); `false` for the
 * muted single-provider line.
 */
export type AgentScope = {
  /** i18n key suffix under `settings.agentsPage.scope`. */
  scopeKey: string;
  /** Whether the scope line is shown in the brand accent colour. */
  accent: boolean;
};

/** The open scope shared by Wayland Core and model-agnostic CLIs. */
const ANY: AgentScope = { scopeKey: 'any', accent: true };

/**
 * Agent backend → scope copy. Keyed by the `backend` field returned from
 * `acp.get-available-agents`. Unknown backends fall back to {@link ANY}.
 *
 * Backend-keyed, like `FEATURED_BACKENDS` in `index.tsx` - keep the two
 * consistent when adding or renaming an agent backend.
 */
const AGENT_SCOPES: Record<string, AgentScope> = {
  // Wayland's own engine - runs every connected provider's models.
  wcore: ANY,

  // Self-authenticated CLI agents - one provider each (stated in plain words).
  claude: { scopeKey: 'claude', accent: false },
  codex: { scopeKey: 'gpt', accent: false },
  gemini: { scopeKey: 'gemini', accent: false },
  qwen: { scopeKey: 'qwen', accent: false },
  kimi: { scopeKey: 'kimi', accent: false },
  vibe: { scopeKey: 'mistral', accent: false },

  // Model-agnostic CLIs - run whatever model they are pointed at.
  opencode: ANY,
  goose: ANY,
  droid: ANY,
  auggie: ANY,
  copilot: ANY,
  cursor: ANY,
  codebuddy: ANY,
  qoder: ANY,
  kiro: ANY,
  snow: ANY,
  hermes: ANY,
  custom: ANY,
  'openclaw-gateway': ANY,
};

/** Resolve the plain-language scope copy for an agent backend. */
export function resolveAgentScope(backend: string): AgentScope {
  return AGENT_SCOPES[backend] ?? ANY;
}
