/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Schema pin for the models.dev registry (https://models.dev/api.json).
 *
 * The registry is a top-level JSON object keyed by provider id (~134 providers
 * as of 2026-05-22). This module pins that shape and validates payloads so a
 * silent upstream schema change is caught and rejected rather than poisoning
 * the enrichment cache.
 *
 * `validateRegistry` is intentionally STRICT about structure (it must catch a
 * real schema break) but TOLERANT of new optional fields (models.dev adds
 * model capabilities over time - adding one must not reject the whole payload).
 */

// ─── Pinned types ─────────────────────────────────────────────────────────────

export type ModelsDevModalities = {
  input: string[];
  output: string[];
};

export type ModelsDevLimit = {
  context?: number;
  output?: number;
};

export type ModelsDevCost = {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
};

export type ModelsDevModel = {
  id: string;
  name: string;
  /**
   * Optional. The contract drafted `family` as required, but the live registry
   * (verified 2026-05-22: 1056 of 4838 models) omits it - so it must be
   * optional or the validator would reject the real payload.
   */
  family?: string;
  release_date?: string;
  last_updated?: string;
  knowledge?: string;
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  temperature?: boolean;
  open_weights?: boolean;
  modalities?: ModelsDevModalities;
  limit?: ModelsDevLimit;
  cost?: ModelsDevCost;
};

export type ModelsDevProvider = {
  id: string;
  env: string[];
  npm?: string;
  name: string;
  doc?: string;
  models: Record<string, ModelsDevModel>;
};

/** The whole registry: provider id → provider object. */
export type ModelsDevRegistry = Record<string, ModelsDevProvider>;

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Providers that must be present for a payload to be considered structurally
 * sound. If models.dev ever drops both of these, the payload shape has changed
 * enough that we should reject it and fall back rather than trust it.
 */
const REQUIRED_PROVIDERS = ['anthropic', 'openai'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A single model must carry `id` and `name` as strings (universal in the live
 * registry). `family` is optional - see the note on `ModelsDevModel.family`.
 * If `family` is present it must be a string (catches a type-changed field).
 */
function isModelShaped(value: unknown): value is ModelsDevModel {
  if (!isPlainObject(value)) return false;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false;
  if (value.family !== undefined && typeof value.family !== 'string') return false;
  return true;
}

/** A provider must have a string id/name and a non-empty object of models. */
function isProviderShaped(value: unknown): value is ModelsDevProvider {
  if (!isPlainObject(value)) return false;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false;

  const models = value.models;
  if (!isPlainObject(models)) return false; // rejects `models` being an array
  const modelKeys = Object.keys(models);
  if (modelKeys.length === 0) return false; // a provider with zero models is suspect

  // Every model entry must look like a model - catches `models` being an
  // object of garbage (e.g. an array smuggled in per-model).
  return modelKeys.every((k) => isModelShaped(models[k]));
}

/**
 * Validate an untrusted models.dev payload.
 *
 * Returns the typed registry when the payload is well-formed, otherwise `null`.
 * Rejects: non-objects, empty objects, payloads missing the well-known
 * providers, and any provider whose `models` is not a non-empty object of
 * model-shaped entries. New optional fields are ignored (tolerated).
 */
export function validateRegistry(data: unknown): ModelsDevRegistry | null {
  if (!isPlainObject(data)) return null;

  const providerIds = Object.keys(data);
  if (providerIds.length === 0) return null;

  // Schema-break guard: the well-known anchors must be present and shaped.
  for (const required of REQUIRED_PROVIDERS) {
    if (!isProviderShaped(data[required])) return null;
  }

  // Every other provider entry must also be shaped - a single garbage entry
  // means the payload is not the registry we pinned against.
  for (const id of providerIds) {
    if (!isProviderShaped(data[id])) return null;
  }

  return data as ModelsDevRegistry;
}
