/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider Catalog store (T3.3).
 *
 * Surfaces the ~100 connectable catalog PROVIDERS (NOT per-provider models -
 * that is the separate model-registry system) to the renderer behind the frozen
 * `modelRegistry.getProviderCatalog` IPC contract.
 *
 * ## Authority
 *
 * The bundled `data/providerCatalog.generated.json` (T3.1 output, T0.2
 * {@link CatalogProviderEntry} shape) is the ROUTING AUTHORITY and the fail-safe
 * floor. `baseUrl` / `apiPath` / `envVar` come ONLY from that vendored file.
 *
 * models.dev (`https://models.dev/api.json`) is a MODEL-METADATA source, never
 * an endpoint authority. Per the spike verdict it has no version field and its
 * `api` URL must NEVER be read into a routing URL. Enrichment here is purely
 * additive metadata (per-provider model counts), matched by EXACT provider id;
 * it can never alter a baseline entry's `baseUrl` / `apiPath` / `envVar` and can
 * never add or drop a provider.
 *
 * ## Reconcile rules (RES-2 / spike)
 *
 *  - Baseline is ALWAYS the floor: an empty / failed / oversize models.dev fetch
 *    returns the baseline unchanged.
 *  - Enrichment is best-effort with an in-memory last-good cache: once a good
 *    registry has been seen, a later failed fetch keeps the prior enrichment
 *    rather than reverting to bare baseline.
 *  - An optional blocklist removes providers from the surfaced set; a fetch
 *    failure never drops a baseline entry (precedence: blocklist > never-delete).
 *
 * Main-process only - no DOM, no renderer APIs.
 */

import type { CatalogProviderEntry } from './catalogProvider';
import generatedCatalog from './data/providerCatalog.generated.json';
import type { ModelsDevRegistry } from '../enrichment/modelsDevSchema';

/** Additive, metadata-only enrichment merged onto a baseline provider entry. */
export type ProviderCatalogEnrichment = {
  /** Number of models models.dev lists for this provider (additive metadata only). */
  modelCount: number;
};

/** A baseline provider entry optionally carrying additive models.dev metadata. */
export type ProviderCatalogView = CatalogProviderEntry & Partial<ProviderCatalogEnrichment>;

/** The models.dev registry client slice the store depends on (structural for tests). */
export type ProviderCatalogRegistrySource = {
  getRegistry: () => Promise<ModelsDevRegistry>;
};

/** Construction options. All optional - the store is fully usable with none. */
export type ProviderCatalogStoreOptions = {
  /**
   * Optional models.dev source for additive enrichment. Omitted => the store
   * always returns the bundled baseline (enrichment is never load-bearing).
   */
  registrySource?: ProviderCatalogRegistrySource;
  /** Provider ids to remove from the surfaced catalog (blocklist). */
  blocklist?: readonly string[];
};

/**
 * Normalize one raw generated-JSON row into a {@link CatalogProviderEntry},
 * preserving the absent-vs-empty `apiPath` distinction. The generated file is
 * already camelCase + validated by `providers-catalogGenerated.test.ts`; this
 * is a defensive copy so a caller can never mutate the shared baseline array.
 */
function normalizeGeneratedEntry(raw: CatalogProviderEntry): CatalogProviderEntry {
  const entry: CatalogProviderEntry = {
    id: raw.id,
    displayName: raw.displayName,
    baseUrl: raw.baseUrl,
    envVar: raw.envVar,
  };
  if (raw.apiPath !== undefined) entry.apiPath = raw.apiPath;
  return entry;
}

/** Sort a catalog view in place by `displayName` (locale-aware, stable contract). */
function sortByDisplayName<T extends { displayName: string }>(entries: T[]): T[] {
  return entries.toSorted((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Load the bundled baseline catalog: the vendored generated JSON, normalized
 * and sorted by `displayName`. This is the fail-safe floor - it never touches
 * the network and never throws. Each call returns fresh defensive copies.
 */
export function loadBaselineProviderCatalog(): CatalogProviderEntry[] {
  const rows = generatedCatalog as CatalogProviderEntry[];
  return sortByDisplayName(rows.map(normalizeGeneratedEntry));
}

/**
 * The Provider Catalog store. Holds the immutable baseline plus an in-memory
 * last-good enrichment map. `getCatalog()` is synchronous and always returns a
 * valid catalog (baseline floor); `refresh()` attempts an additive models.dev
 * enrichment and is best-effort.
 */
export class ProviderCatalogStore {
  private readonly baseline: readonly CatalogProviderEntry[];
  private readonly registrySource?: ProviderCatalogRegistrySource;
  private readonly blocklist: ReadonlySet<string>;

  /** Last-good enrichment, keyed by provider id. Empty until a good fetch lands. */
  private enrichment: ReadonlyMap<string, ProviderCatalogEnrichment> = new Map();

  constructor(options: ProviderCatalogStoreOptions = {}) {
    this.baseline = loadBaselineProviderCatalog();
    this.registrySource = options.registrySource;
    this.blocklist = new Set(options.blocklist ?? []);
  }

  /**
   * Re-fetch the models.dev registry and recompute the additive enrichment.
   * Best-effort and fail-safe:
   *  - No registry source, a rejected fetch, or an empty registry leaves the
   *    existing last-good enrichment untouched (and the catalog at baseline if
   *    nothing has ever succeeded).
   *  - A good registry replaces the last-good enrichment map.
   *
   * Never throws.
   */
  async refresh(): Promise<void> {
    if (!this.registrySource) return;
    let registry: ModelsDevRegistry;
    try {
      registry = await this.registrySource.getRegistry();
    } catch {
      // Failed fetch - keep the last-good enrichment (fail-safe floor).
      return;
    }
    // An empty registry is the client's "no enrichment available" signal
    // (failed / non-JSON / oversize upstream). Keep last-good rather than
    // wiping a previously-good enrichment.
    if (Object.keys(registry).length === 0) return;

    this.enrichment = this.computeEnrichment(registry);
  }

  /**
   * The surfaced provider catalog: baseline, enriched additively with the
   * last-good models.dev metadata, minus the blocklist, sorted by `displayName`.
   *
   * `baseUrl` / `apiPath` / `envVar` are always the vendored baseline values -
   * enrichment can only ADD the `modelCount` metadata field.
   */
  getCatalog(): ProviderCatalogView[] {
    const out: ProviderCatalogView[] = [];
    for (const entry of this.baseline) {
      if (this.blocklist.has(entry.id)) continue;
      const meta = this.enrichment.get(entry.id);
      // Spread the baseline LAST so vendored authority always wins over any
      // overlapping enrichment field - belt-and-braces even though `meta` only
      // carries additive keys.
      out.push(meta ? { ...meta, ...entry } : { ...entry });
    }
    return sortByDisplayName(out);
  }

  /**
   * Build the additive enrichment map from a models.dev registry, matched by
   * EXACT baseline provider id. Reads ONLY model-metadata (`models` count) -
   * never `api` / `env` / `name`, which are the vendored catalog's authority.
   */
  private computeEnrichment(registry: ModelsDevRegistry): ReadonlyMap<string, ProviderCatalogEnrichment> {
    const next = new Map<string, ProviderCatalogEnrichment>();
    for (const entry of this.baseline) {
      const provider = registry[entry.id];
      if (!provider) continue;
      const modelCount = provider.models ? Object.keys(provider.models).length : 0;
      next.set(entry.id, { modelCount });
    }
    return next;
  }
}
