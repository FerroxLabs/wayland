/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CLI-agent catalog source (main process).
 *
 * Wayland's CLI agents - Claude Code, Codex, Gemini CLI - are *self-authenticated*:
 * they sign in with their own login, not the user's API key. This source gives a
 * CLI agent a model list even when the user has not separately connected that
 * provider via an API key.
 *
 * Each CLI agent runs exactly one provider's models:
 *   - Claude Code (`claude`)  → Anthropic models
 *   - Codex       (`codex`)   → OpenAI models
 *   - Gemini CLI  (`gemini`)  → Google Gemini models
 *
 * ## Enumerability (research finding - 2026-05-22)
 *
 * Not every CLI can enumerate its models programmatically. This was investigated
 * directly against the installed CLIs (help text, subcommands, config files -
 * no agent task was run):
 *
 *   - **Codex** is ENUMERABLE: `codex debug models --bundled` dumps the model
 *     catalog as JSON (`{ models: [{ slug, display_name, visibility, ... }] }`).
 *     `--bundled` uses the catalog shipped with the binary, so it needs no
 *     network and is fast and deterministic.
 *   - **Claude Code** is NOT ENUMERABLE: no `models`/`list` subcommand, no
 *     `--list-models` flag, no model declaration in `~/.claude/`. `--model`
 *     accepts an alias or full name but offers no way to discover the set.
 *   - **Gemini CLI** is NOT ENUMERABLE: no model-list subcommand or flag
 *     (`gemini gemma` manages only a *local* Gemma router; `-l` lists
 *     extensions). No model declaration in `~/.gemini/`.
 *
 * A non-enumerable CLI is an expected, valid outcome - its models are managed
 * by the CLI itself. This source NEVER fabricates or hardcodes a guessed model
 * list. For a non-enumerable agent, `listModels()` honestly returns `[]` and the
 * `enumerable` flag is `false` so downstream packets (the Agents UI, 2D) can
 * tell "not enumerable" apart from "enumerable but empty".
 *
 * ## Downstream signal contract (read by Packet 2D)
 *
 *   - `enumerable: false` → the CLI cannot list its models. Render "models
 *     managed by the CLI" instead of a model list. `listModels()` returns `[]`.
 *   - `enumerable: true` + `listModels()` returns `[]` → the CLI *can* list its
 *     models but produced none right now (missing CLI, error exit, unparseable
 *     or empty output). Render an empty/error state, NOT "managed by the CLI".
 *
 * The two cases are therefore unambiguous: inspect `enumerable` first, then the
 * length of `listModels()`.
 */

import type { CatalogSource } from './CatalogSource';
import type { ProviderId, RawModel } from '../types';
import { safeExecFile } from '@process/utils/safeExec';

/** The CLI agent keys used across the codebase (see `ACP_BACKENDS_ALL`). */
export type CliAgentKey = 'claude' | 'codex' | 'gemini';

/** How a single enumerable CLI agent is enumerated. */
type EnumerableSpec = {
  /** The executable to invoke (resolved on the system PATH). */
  readonly command: string;
  /** Arguments that make the CLI dump its model catalog as JSON. */
  readonly args: string[];
};

/** Hard timeout for a CLI invocation - a hung CLI must never stall the catalog. */
const CLI_TIMEOUT_MS = 10_000;

/**
 * Enumeration spec per enumerable CLI agent. A CLI agent absent from this map is
 * not enumerable.
 *
 * Codex: `codex debug models --bundled` renders the bundled model catalog as
 * JSON without any network call.
 */
const ENUMERABLE_AGENTS: Partial<Record<CliAgentKey, EnumerableSpec>> = {
  codex: {
    command: 'codex',
    args: ['debug', 'models', '--bundled'],
  },
};

/**
 * The provider each CLI agent runs. Non-enumerable CLIs manage their own model
 * set - this mapping is kept for UI labelling, not enumeration. Enumerable CLIs
 * also appear here; their `ENUMERABLE_AGENTS` entry repeats the same provider.
 */
const AGENT_PROVIDERS: Record<CliAgentKey, ProviderId> = {
  claude: 'anthropic',
  codex: 'openai',
  gemini: 'google-gemini',
};

/** True when a CLI agent can enumerate its models programmatically. */
export function isEnumerableCliAgent(agentKey: CliAgentKey): boolean {
  return agentKey in ENUMERABLE_AGENTS;
}

export class CliAgentSource implements CatalogSource {
  readonly kind = 'cli' as const;
  /** The source identity is the CLI agent key - broader than a `ProviderId`. */
  readonly providerId: CliAgentKey;
  /** The provider whose models this CLI agent's `RawModel`s belong to. */
  readonly underlyingProviderId: ProviderId;
  /**
   * Whether this CLI agent can enumerate its models. `false` is a valid,
   * expected outcome - see the file header for the downstream signal contract.
   */
  readonly enumerable: boolean;

  private readonly spec: EnumerableSpec | undefined;

  constructor(agentKey: CliAgentKey) {
    this.providerId = agentKey;
    const spec = ENUMERABLE_AGENTS[agentKey];
    this.spec = spec;
    this.enumerable = spec !== undefined;
    this.underlyingProviderId = AGENT_PROVIDERS[agentKey];
  }

  /**
   * The CLI agent's models as `RawModel[]`.
   *
   * - Not enumerable → `[]` (by design; never a fabricated list).
   * - Enumerable → runs the CLI's enumeration command and parses the result.
   *   A missing CLI, a non-zero exit, or unparseable output is treated as "no
   *   models right now" → `[]`. This method never throws.
   *
   * The `CLI_TIMEOUT_MS` timeout bounds the *promise*: this call always
   * resolves (or rejects internally, then degrades to `[]`) within ~10s. It is
   * not a guarantee that a wedged CLI process is reaped - OS-level termination
   * is best-effort `SIGTERM` via the shared `safeExecFile` helper, and a
   * non-cooperative process may outlive the resolved promise.
   */
  async listModels(): Promise<RawModel[]> {
    if (!this.spec) return [];

    let stdout: string;
    try {
      const result = await safeExecFile(this.spec.command, this.spec.args, { timeout: CLI_TIMEOUT_MS });
      stdout = result.stdout;
    } catch (err) {
      // Missing CLI (ENOENT), non-zero exit, or a timeout - the CLI could not
      // produce a catalog. Degrade to an empty list rather than crashing.
      console.warn(`[CliAgentSource] '${this.spec.command}' enumeration failed:`, describeError(err));
      return [];
    }

    return parseCodexModels(stdout, this.underlyingProviderId);
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Parse `codex debug models` JSON into `RawModel[]`.
 *
 * The payload is `{ models: [{ slug, display_name?, visibility, ... }] }`.
 * Only models with `visibility === 'list'` are user-selectable; hidden/internal
 * models (e.g. `codex-auto-review`) are excluded. Malformed entries are dropped.
 * Any parse failure yields `[]` - the caller treats that as "no models".
 */
function parseCodexModels(stdout: string, providerId: ProviderId): RawModel[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return [];
  }

  if (!isRecord(parsed) || !Array.isArray(parsed['models'])) return [];

  const models: RawModel[] = [];
  for (const entry of parsed['models']) {
    if (!isRecord(entry)) continue;
    // Hidden/internal models are not user-selectable - skip anything not 'list'.
    if (entry['visibility'] !== 'list') continue;

    const slug = entry['slug'];
    if (typeof slug !== 'string' || slug.length === 0) continue;

    const model: RawModel = { id: slug, providerId };
    const displayName = entry['display_name'];
    if (typeof displayName === 'string' && displayName.length > 0) {
      model.rawName = displayName;
    }
    models.push(model);
  }
  return models;
}

/** A human-readable description for a thrown CLI error. */
function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unknown CLI error';
}

/** Narrow an `unknown` to a plain object record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
