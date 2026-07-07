/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ModelPricing - the single source of token to USD pricing for cost
 * observability. Backed by the bundled `resources/modelsdev-snapshot.json`
 * registry, whose entries carry per-model `cost.input` / `cost.output` (USD per
 * 1,000,000 tokens) and, for some models, `cost.cache_read` / `cost.cache_write`.
 *
 * Pricing is intentionally honest: an unknown or unspecified model returns
 * `undefined` rather than a guessed default. Callers (the CostRecorder) treat
 * `undefined` as `cost_source='unknown'` and record tokens only.
 *
 * The snapshot is loaded lazily once and indexed for O(1) lookup. The file
 * read is synchronous on first use (it is bundled locally, ~2MB) so the
 * `priceTokens` API can stay synchronous for the recorder's hot path.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const SNAPSHOT_FILE_NAME = 'modelsdev-snapshot.json';

/**
 * Best-effort access to electron's `app`. Loaded via `require` and guarded so
 * the module also imports cleanly outside an Electron runtime (e.g. under the
 * bun test runner), where it simply resolves to `undefined` and the path falls
 * back to the dev `<cwd>/resources` location.
 */
function getElectronApp(): { isPackaged?: boolean } | undefined {
  try {
    return (require('electron') as typeof import('electron')).app;
  } catch {
    return undefined;
  }
}

/** Per-model cost block as it appears in the snapshot. Values are USD per 1M tokens. */
type SnapshotCost = {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
};

type SnapshotModel = { cost?: SnapshotCost };
type SnapshotProvider = { models?: Record<string, SnapshotModel> };
type Snapshot = Record<string, SnapshotProvider>;

/** Per-turn token split priced by `priceTokens`. */
export type TokenSplit = {
  input: number;
  output: number;
  cacheRead?: number;
};

export interface IModelPricing {
  /**
   * USD cost for a per-turn token split. Returns `undefined` when `modelId` is
   * undefined or the model is not present in the snapshot - the caller records
   * `cost_source='unknown'`. Never guesses or defaults a price.
   *
   * usd = input / 1e6 * cost.input
   *     + output / 1e6 * cost.output
   *     + (cacheRead || 0) / 1e6 * (cost.cache_read if present, else cost.input)
   */
  priceTokens(modelId: string | undefined, t: TokenSplit): number | undefined;
}

/**
 * Resolve the bundled snapshot path for both run modes, mirroring
 * ModelsDevClient.snapshotFilePath():
 *  - packaged: `<process.resourcesPath>/modelsdev-snapshot.json`
 *  - dev:      `<cwd>/resources/modelsdev-snapshot.json`
 */
function snapshotFilePath(): string {
  const isPackaged = getElectronApp()?.isPackaged === true;
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  if (isPackaged && resourcesPath) {
    return path.join(resourcesPath, SNAPSHOT_FILE_NAME);
  }
  return path.join(process.cwd(), 'resources', SNAPSHOT_FILE_NAME);
}

/**
 * Build a lookup index from the snapshot. The snapshot is shaped as
 * `{ provider: { models: { modelId: { cost } } } }` and model keys are a mix of
 * bare ids (`claude-opus-4-5`) and provider-prefixed ids
 * (`mistralai/completion/models/...`). To resolve robustly against whatever a
 * backend passes, every model is indexed under three normalized keys:
 *   1. the raw key exactly as it appears,
 *   2. the raw key lowercased,
 *   3. the last path segment (provider prefix stripped) lowercased.
 *
 * Heuristic: bare model ids collide across providers (~800 lower-cased ids
 * appear under more than one provider in the snapshot - e.g. `claude-opus-4-5`
 * is listed by anthropic, azure, and several aggregators). For the NORMALIZED
 * indexes the tie-break prefers the more complete cost block (one carrying a
 * dedicated `cache_read` rate beats one that omits it); this deterministically
 * lands on the canonical vendor's pricing rather than a sparser aggregator
 * entry. The EXACT raw-key index applies the same prefer-complete tie-break
 * (it is a no-op for the unique fully-qualified keys) and is consulted first,
 * so a fully-qualified id still resolves to its own provider's price.
 */
function isMoreComplete(candidate: SnapshotCost, existing: SnapshotCost): boolean {
  const score = (c: SnapshotCost): number => (c.cache_read != null ? 2 : 0) + (c.cache_write != null ? 1 : 0);
  return score(candidate) > score(existing);
}

function setPreferComplete(map: Map<string, SnapshotCost>, key: string, cost: SnapshotCost): void {
  const existing = map.get(key);
  if (!existing || isMoreComplete(cost, existing)) map.set(key, cost);
}

function buildIndex(snapshot: Snapshot): { exact: Map<string, SnapshotCost>; normalized: Map<string, SnapshotCost> } {
  const exact = new Map<string, SnapshotCost>();
  const normalized = new Map<string, SnapshotCost>();
  for (const provider of Object.values(snapshot)) {
    const models = provider?.models;
    if (!models) continue;
    for (const [key, model] of Object.entries(models)) {
      const cost = model?.cost;
      if (!cost) continue;
      setPreferComplete(exact, key, cost);
      const lower = key.toLowerCase();
      setPreferComplete(normalized, lower, cost);
      const lastSegment = lower.slice(lower.lastIndexOf('/') + 1);
      if (lastSegment !== lower) setPreferComplete(normalized, lastSegment, cost);
    }
  }
  return { exact, normalized };
}

export class ModelPricing implements IModelPricing {
  private index: { exact: Map<string, SnapshotCost>; normalized: Map<string, SnapshotCost> } | null = null;

  /**
   * Lazily read and index the bundled snapshot exactly once. A missing or
   * malformed snapshot degrades to an empty index, so every lookup returns
   * `undefined` (cost_source='unknown') rather than throwing.
   */
  private getIndex(): { exact: Map<string, SnapshotCost>; normalized: Map<string, SnapshotCost> } {
    if (this.index) return this.index;
    try {
      const body = readFileSync(snapshotFilePath(), 'utf8');
      const parsed = JSON.parse(body) as Snapshot;
      this.index = buildIndex(parsed);
    } catch {
      this.index = { exact: new Map(), normalized: new Map() };
    }
    return this.index;
  }

  private lookup(modelId: string): SnapshotCost | undefined {
    const { exact, normalized } = this.getIndex();
    const direct = exact.get(modelId);
    if (direct) return direct;
    const lower = modelId.toLowerCase();
    const byLower = normalized.get(lower);
    if (byLower) return byLower;
    const lastSegment = lower.slice(lower.lastIndexOf('/') + 1);
    return normalized.get(lastSegment);
  }

  priceTokens(modelId: string | undefined, t: TokenSplit): number | undefined {
    if (!modelId) return undefined;
    const cost = this.lookup(modelId);
    if (!cost || cost.input == null || cost.output == null) return undefined;
    const cacheReadTokens = t.cacheRead ?? 0;
    // A model without a dedicated cache-read rate is priced at its input rate.
    const cacheReadRate = cost.cache_read ?? cost.input;
    return (t.input / 1e6) * cost.input + (t.output / 1e6) * cost.output + (cacheReadTokens / 1e6) * cacheReadRate;
  }
}

/** Lazy main-process singleton. The recorder imports this. */
let singleton: ModelPricing | null = null;
export function getModelPricing(): ModelPricing {
  if (!singleton) singleton = new ModelPricing();
  return singleton;
}
