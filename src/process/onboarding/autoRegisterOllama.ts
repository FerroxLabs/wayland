/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Auto-register a detected local Ollama daemon as the native `ollama-local`
 * model-registry provider (main process).
 *
 * The onboarding probe (`detect.probeOllama`) already hits `/api/tags` and
 * reports `{ running, models }`. When Ollama is running this wires it into the
 * registry as a first-class, keyless, loopback provider so it is immediately
 * selectable in chat and disableable in Models & Providers - without the user
 * hand-adding a custom provider.
 *
 * Design constraints (see `.planning/ollama-local-keyless-spec.md`):
 *  - Dedicated native id `ollama-local` (never overloads the single-row
 *    `openai-compatible` slot, which a user's cloud custom provider may own).
 *  - Hardcoded loopback base URL `http://127.0.0.1:11434/v1`; keyless (empty
 *    key). The model names from `/api/tags` are treated as DATA - they are
 *    written into the catalog only, never interpolated into any URL or command.
 *  - The connection tester is bypassed: a successful `/api/tags` probe IS the
 *    liveness check.
 *  - Idempotent + intent-respecting: a second run only REFRESHES the catalog
 *    and never flips a `state` the user may have changed (e.g. disabled it).
 */

import type { CatalogModel, ProviderId } from '@process/providers/types';
import { isUnsupportedLocalVisionModel } from '@process/providers/catalog/localVisionModelFilter';

/** The fixed native provider id for the local Ollama daemon. */
const OLLAMA_LOCAL_ID: ProviderId = 'ollama-local';

/** Hardcoded loopback OpenAI-compatible endpoint - never user-supplied. */
const OLLAMA_LOCAL_BASE_URL = 'http://127.0.0.1:11434/v1';

/** The slice of the provider repository this flow reads + writes. */
export type OllamaRegistryRepo = {
  getRegistryProvider: (providerId: ProviderId) => { state: string } | null;
  upsertRegistryProvider: (params: {
    providerId: ProviderId;
    connectedVia: string;
    state: 'connected' | 'testing' | 'error';
    creds: Record<string, unknown>;
  }) => void;
  replaceRegistryCatalog: (providerId: ProviderId, models: CatalogModel[]) => void;
};

/** The Ollama probe result shape `detect.probeOllama` produces. */
export type OllamaProbe = {
  running: boolean;
  models: string[];
  /** Per-model `/api/tags` capabilities, keyed by name. Absent on older daemons. */
  modelCapabilities?: Record<string, string[]>;
};

/** Outcome of an auto-register pass - returned for tests + logging, never thrown. */
export type AutoRegisterOutcome =
  | { action: 'created'; models: number }
  | { action: 'refreshed'; models: number }
  | { action: 'skipped' };

/**
 * Build a minimal `CatalogModel` for a model name reported by `/api/tags`. The
 * name is the id verbatim (e.g. `llama3:latest`); no enrichment is fabricated.
 */
function toCatalogModel(name: string, toolCall?: boolean): CatalogModel {
  return {
    id: name,
    providerId: OLLAMA_LOCAL_ID,
    displayName: name,
    family: name.split(':')[0] || name,
    kind: 'text',
    enriched: false,
    tags: toolCall === true ? ['chat', 'tools'] : ['chat'],
    ...(toolCall === undefined ? {} : { toolCall }),
  };
}

/**
 * What the daemon said about this model's tool support: `true`, `false`, or
 * `undefined` when it said nothing at all.
 *
 * The undefined case is load-bearing — see `CatalogModel.toolCall`. A daemon
 * too old to report capabilities must leave every model selectable rather than
 * silently emptying the user's model list.
 */
function toolCapability(probe: OllamaProbe, name: string): boolean | undefined {
  const caps = probe.modelCapabilities?.[name];
  if (!Array.isArray(caps)) return undefined;
  return caps.includes('tools');
}

/** De-duplicate + drop empties from the probe model names, preserving order. */
function normalizeModelNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    if (typeof raw !== 'string') continue;
    const name = raw.trim();
    if (name.length === 0 || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/**
 * Pure, repo-injected core (exported for tests). Idempotent:
 *  - probe not running -> `skipped`, no row created.
 *  - no existing row -> upsert a `connected` keyless row + write the catalog.
 *  - existing row -> only refresh the catalog; the `state` (which the user may
 *    have changed to disable it) is left untouched.
 *
 * Never throws - a repo error degrades to `skipped` so onboarding never breaks.
 */
export function autoRegisterOllamaInRepo(repo: OllamaRegistryRepo, probe: OllamaProbe): AutoRegisterOutcome {
  try {
    if (!probe.running) return { action: 'skipped' };

    const models = normalizeModelNames(probe.models)
      // Hide local vision/VLM models a chat agent can't drive - they clutter the
      // picker with un-selectable rows. providerId is unambiguously local here,
      // so the filter needs no endpoint join.
      .filter((name) => !isUnsupportedLocalVisionModel(OLLAMA_LOCAL_ID, name))
      // Same reasoning, one step further: a model the daemon says cannot take
      // tools 400s on its FIRST turn, because the engine always advertises
      // them. Offering it is offering a model that cannot answer.
      //
      // Fails CLOSED on evidence and OPEN on ignorance: only an explicit
      // capability list WITHOUT `tools` hides a model. An older daemon that
      // reports nothing leaves every model selectable, exactly as before -
      // which is the documented behaviour of every other local-model guard
      // here, because local models carry no metadata and must stay usable.
      .filter((name) => toolCapability(probe, name) !== false)
      .map((name) => toCatalogModel(name, toolCapability(probe, name)));
    const existing = repo.getRegistryProvider(OLLAMA_LOCAL_ID);

    if (existing) {
      // Already registered: refresh the catalog from the latest /api/tags, but
      // do NOT touch state - respect a user who disabled it.
      repo.replaceRegistryCatalog(OLLAMA_LOCAL_ID, models);
      return { action: 'refreshed', models: models.length };
    }

    repo.upsertRegistryProvider({
      providerId: OLLAMA_LOCAL_ID,
      connectedVia: 'auto-local',
      state: 'connected',
      creds: { key: '', baseUrl: OLLAMA_LOCAL_BASE_URL },
    });
    repo.replaceRegistryCatalog(OLLAMA_LOCAL_ID, models);
    return { action: 'created', models: models.length };
  } catch {
    return { action: 'skipped' };
  }
}
