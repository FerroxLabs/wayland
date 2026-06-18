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
export type OllamaProbe = { running: boolean; models: string[] };

/** Outcome of an auto-register pass - returned for tests + logging, never thrown. */
export type AutoRegisterOutcome =
  | { action: 'created'; models: number }
  | { action: 'refreshed'; models: number }
  | { action: 'skipped' };

/**
 * Build a minimal `CatalogModel` for a model name reported by `/api/tags`. The
 * name is the id verbatim (e.g. `llama3:latest`); no enrichment is fabricated.
 */
function toCatalogModel(name: string): CatalogModel {
  return {
    id: name,
    providerId: OLLAMA_LOCAL_ID,
    displayName: name,
    family: name.split(':')[0] || name,
    kind: 'text',
    enriched: false,
    tags: ['chat'],
  };
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
      .map(toCatalogModel);
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
