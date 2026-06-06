/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Curator - the pure curation function of the two-tier model store.
 *
 * The assembler produces a full `CatalogModel[]` (every model every source
 * exposes). The Curator derives the much smaller `CuratedModel[]` view the chat
 * model picker shows: the latest model in each family, plus the one revision
 * before it.
 *
 * ## Rules
 *
 * 1. Only `kind === 'text'` models are curated. Image / audio / embedding models
 *    stay in the full catalog for other features but never reach the picker.
 * 2. Text models are grouped by `family`.
 * 3. Within a family, models are ordered newest-first by `releaseDate`. A model
 *    with no `releaseDate` sorts last.
 * 4. **A family is eligible for the recommended set only when at least one of
 *    its models is `enriched: true`.** models.dev enrichment is the local
 *    quality signal that a family is current/relevant - providers like OpenAI
 *    expose legacy ids on `/v1/models` (Babbage, Davinci, dated GPT-3.5
 *    Turbos, internal Computer-Use previews, …) that models.dev correctly
 *    declines to track. Without this filter every unmatched id becomes a
 *    singleton "family" and every legacy model gets flagged Recommended, which
 *    defeats the entire two-tier curation premise. Unenriched models still
 *    flow through to the catalog (visible in "More in the catalog") - they
 *    just don't get the `recommended: true` badge.
 * 5. **Known-legacy ids never recommend.** Even when models.dev still tracks a
 *    deprecated id (e.g. `gpt-3.5-turbo`), the Curator excludes it from the
 *    recommended set via `KNOWN_LEGACY_IDS`. See the constant for the per-id
 *    rationale. The model still appears in the full catalog ("More in the
 *    catalog") - users can opt in - it just never gets the flagship badge.
 * 6. **Recency floor.** A family's flagship qualifies for recommendation only
 *    when its `releaseDate` is within the last `RECENCY_WINDOW_DAYS`. Older
 *    flagships still surface in "More in the catalog" - they're pickable, just
 *    not flagged Recommended. Reference date is the latest `releaseDate` in
 *    the catalog (keeps the curator pure - no `Date.now()`).
 * 7. **Display-name dedup.** Two models in the same family sharing the same
 *    `displayName` collapse to one: the one with a `releaseDate` wins, else
 *    the one with the longer id (which is usually the dated variant). Catches
 *    models.dev shipping both an alias (`computer-use-preview`) and the
 *    dated variant (`computer-use-preview-2025-03-11`) with the same name.
 * 8. Within an eligible family, the newest model → `recommended: true,
 *    enabled: true, role: 'flagship'`. The second-newest → `recommended: true,
 *    enabled: true, role: 'previous'`. A single-model family yields only a
 *    flagship.
 * 9. Every other model - including every model in an ineligible family, every
 *    KNOWN_LEGACY_IDS id, and any flagship outside the recency window - gets
 *    `recommended: false, enabled: false`, no `role`.
 *
 * Fast/cheap families (Haiku, GPT mini, Gemini Flash) are NOT special-cased -
 * they form their own families and are surfaced by exactly the same rule. Cost
 * is deliberately not an input to curation. The `role: 'fast'` value exists in
 * the type for future use but this curator never emits it.
 *
 * This function is genuinely PURE: no network, no filesystem, no `Date.now()`.
 * Given the same input it always returns a deeply equal result, and it never
 * mutates its input.
 */

import type { CatalogModel, CuratedModel } from '../types';
import { isFluxModelId } from '@/common/config/flux';

/**
 * The recency window - a family flagship is only eligible for `recommended`
 * when its `releaseDate` is within this many days of the catalog's newest
 * release. ~18 months covers the typical refresh cycle of frontier models
 * (Claude / GPT / Gemini all ship a flagship at least once a year), while
 * dropping the 2023-era ids that linger in `/v1/models`.
 *
 * Reference date is derived from the catalog itself (`latestReleaseDate`), not
 * `Date.now()` - keeps the curator deterministic and unit-testable.
 */
const RECENCY_WINDOW_DAYS = 540;
const MS_PER_DAY = 86_400_000;

/**
 * Known-legacy / deprecated / alias model ids that must never carry
 * `recommended: true`, even when models.dev still tracks them. Sourced from
 * the providers' own deprecation docs as of 2026-05-23.
 *
 * The list is intentionally narrow - only obvious deprecations and aliases.
 * Borderline-current ids stay out so the recency window (Rule 6) is what
 * eventually retires them.
 *
 * Entries support exact match (`gpt-3.5-turbo`) or prefix match (`babbage-`).
 * A trailing `-` makes the entry a prefix; anything else is exact.
 */
const KNOWN_LEGACY_IDS = new Set<string>([
  // ── OpenAI ──────────────────────────────────────────────────────────────
  // GPT-3.5 family - fully deprecated for new development per OpenAI docs.
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-',
  'gpt-3.5-turbo-instruct',
  'gpt-3.5-turbo-instruct-',
  // GPT-4 base + dated variants - superseded by gpt-4o / gpt-5 families.
  'gpt-4',
  'gpt-4-0613',
  'gpt-4-32k',
  'gpt-4-32k-',
  'gpt-4-turbo',
  'gpt-4-turbo-',
  'gpt-4-turbo-preview',
  'gpt-4-0125-preview',
  'gpt-4-1106-preview',
  'gpt-4-vision-preview',
  // ChatGPT alias - duplicates whatever `gpt-4o`/`gpt-5` flagship is current;
  // models.dev tracks it as a separate id, so dedup alone wouldn't catch it.
  'chatgpt-4o-latest',
  // Computer-Use alias - models.dev ships both this and the dated variant
  // with the same display name; this one is the floating alias.
  'computer-use-preview',
  // Base-completion legacy models - superseded by gpt-4o / gpt-5.
  'babbage-002',
  'davinci-002',
  // Old embedding model - superseded by `text-embedding-3-small/large`. Kind
  // is `embedding` so it's already excluded from the curated picker, but the
  // exclusion future-proofs against a `kind` misclassification.
  'text-embedding-ada-002',
  // ── Anthropic ───────────────────────────────────────────────────────────
  // Claude 1.x / 2.x / Instant - long deprecated.
  'claude-1',
  'claude-1-',
  'claude-2',
  'claude-2-',
  'claude-instant',
  'claude-instant-',
  // ── Google Gemini ───────────────────────────────────────────────────────
  // Gemini 1.0 base + the 1.x "pro" line - superseded by Gemini 2.x and 3.x.
  'gemini-pro',
  'gemini-pro-',
  'gemini-1.0-',
  'gemini-1.0-pro',
  'gemini-1.5-pro-',
  'gemini-1.5-flash-',
]);

/** True when `id` matches any exact-or-prefix entry in `KNOWN_LEGACY_IDS`. */
function isKnownLegacy(id: string): boolean {
  if (KNOWN_LEGACY_IDS.has(id)) return true;
  for (const entry of KNOWN_LEGACY_IDS) {
    if (entry.endsWith('-') && id.startsWith(entry)) return true;
  }
  return false;
}

export class Curator {
  /**
   * Derive the curated picker view from the full catalog.
   *
   * Returns one `CuratedModel` per text model in `catalog` (image/audio/
   * embedding models are dropped). The returned array's order groups a family's
   * models together, newest-first; family order itself is not significant.
   */
  curate(catalog: CatalogModel[]): CuratedModel[] {
    const textModels = catalog.filter((model) => model.kind === 'text');
    const families = groupByFamily(textModels);

    // The reference date for the recency window - the catalog's newest
    // release date. Falls back to `null` (recency check disabled) when the
    // catalog has no dated models at all, so an undated test fixture still
    // curates a flagship.
    const referenceDate = latestReleaseDate(textModels);

    const curated: CuratedModel[] = [];
    for (const familyModels of families.values()) {
      const ordered = sortNewestFirst(familyModels);
      const deduped = dedupByDisplayName(ordered);
      const eligible = isFamilyEligible(deduped, referenceDate);
      deduped.forEach((model, index) => {
        curated.push(curateOne(model, index, eligible));
      });
    }
    return curated;
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Group models by `family`, preserving each family's first-seen order. A `Map`
 * keeps iteration deterministic for a given input - required for purity.
 */
function groupByFamily(models: CatalogModel[]): Map<string, CatalogModel[]> {
  const families = new Map<string, CatalogModel[]>();
  for (const model of models) {
    const bucket = families.get(model.family);
    if (bucket) {
      bucket.push(model);
    } else {
      families.set(model.family, [model]);
    }
  }
  return families;
}

/**
 * Sort a family's models newest-first by `releaseDate`. A model without a date
 * sorts after every dated model. The sort is stable on a copy - the input array
 * is never mutated, so the function stays pure.
 */
function sortNewestFirst(models: CatalogModel[]): CatalogModel[] {
  return models.toSorted((a, b) => {
    const aDate = a.releaseDate;
    const bDate = b.releaseDate;
    if (aDate && bDate) return bDate < aDate ? -1 : bDate > aDate ? 1 : 0;
    if (aDate) return -1; // dated model precedes an undated one
    if (bDate) return 1;
    return 0; // both undated - preserve relative order
  });
}

/**
 * Collapse models in a family sharing an identical `displayName` to one entry.
 * The kept entry is the one with a `releaseDate` (it's the dated variant -
 * `computer-use-preview-2025-03-11` rather than the bare `computer-use-preview`
 * alias). Ties broken by id length (longer id usually carries the date).
 *
 * The input is already newest-first, and we walk in that order, so the kept
 * entry stays in the right position. Input is NOT mutated.
 */
function dedupByDisplayName(models: CatalogModel[]): CatalogModel[] {
  const seen = new Map<string, number>();
  const out: CatalogModel[] = [];
  for (const model of models) {
    const key = model.displayName.toLowerCase();
    const existingIdx = seen.get(key);
    if (existingIdx === undefined) {
      seen.set(key, out.length);
      out.push(model);
      continue;
    }
    const existing = out[existingIdx];
    // Prefer the one with a releaseDate; if both/neither have one, prefer the
    // longer id (the dated variant is typically `<base>-YYYY-MM-DD`).
    const prefer = preferDated(existing, model) ? existing : model;
    out[existingIdx] = prefer;
  }
  return out;
}

/** True when `a` should win a same-displayName tie against `b`. */
function preferDated(a: CatalogModel, b: CatalogModel): boolean {
  if (a.releaseDate && !b.releaseDate) return true;
  if (!a.releaseDate && b.releaseDate) return false;
  return a.id.length >= b.id.length;
}

/**
 * The catalog's newest `releaseDate` as a `Date`, or `null` when no model in
 * the catalog has a release date. Used as the reference for the recency
 * window so the Curator stays pure (no `Date.now()`).
 */
function latestReleaseDate(models: CatalogModel[]): Date | null {
  let best: string | null = null;
  for (const model of models) {
    const d = model.releaseDate;
    if (!d) continue;
    if (best === null || d > best) best = d;
  }
  return best === null ? null : new Date(best);
}

/**
 * True when a family has at least one model that:
 *  - is enriched (Rule 4 - models.dev knows about it), AND
 *  - is NOT in `KNOWN_LEGACY_IDS` (Rule 5), AND
 *  - has a `releaseDate` within `RECENCY_WINDOW_DAYS` of `referenceDate`
 *    (Rule 6). When `referenceDate` is null (no dated models in the whole
 *    catalog), the recency check is skipped - a fully-undated catalog still
 *    curates a flagship.
 *
 * A family without an eligible flagship returns false - every model in it
 * surfaces as `recommended: false`.
 */
function isFamilyEligible(orderedFamily: CatalogModel[], referenceDate: Date | null): boolean {
  for (const model of orderedFamily) {
    if (!model.enriched) continue;
    if (isKnownLegacy(model.id)) continue;
    if (referenceDate !== null && model.releaseDate) {
      const modelDate = new Date(model.releaseDate);
      const ageDays = (referenceDate.getTime() - modelDate.getTime()) / MS_PER_DAY;
      if (ageDays > RECENCY_WINDOW_DAYS) continue;
    }
    return true;
  }
  return false;
}

/**
 * Convert a `CatalogModel` into a `CuratedModel` given its rank within its
 * family (0 = newest) and whether its family is eligible for recommendation.
 *
 * Inside an eligible family:
 *  - rank 0 is the flagship UNLESS it's KNOWN_LEGACY (then promote no one -
 *    the eligibility check already saw past the legacy id; the rank-0 model
 *    may still be legacy if the eligible one was rank-1+; that's the right
 *    behavior - the flagship slot stays empty rather than promoting a known
 *    legacy id).
 *  - rank 1 is the previous, with the same legacy guard.
 *  - everything else is unrecommended.
 *
 * Inside an ineligible family every model is unrecommended.
 */
function curateOne(model: CatalogModel, rank: number, familyEligible: boolean): CuratedModel {
  // The four Flux tier aliases (flux-auto/reasoning/standard/fast) are the
  // hero product: always selectable, never gated on models.dev enrichment.
  // Surfaced via the dedicated picker zone, so kept out of the generic
  // "recommended" set (recommended:false). Scoped to the tier ids only -
  // the rest of the flux-router catalog follows normal curation.
  if (isFluxModelId(model.id)) {
    return { ...model, recommended: false, enabled: true, role: 'flagship' };
  }
  if (familyEligible && rank === 0 && !isKnownLegacy(model.id)) {
    return { ...model, recommended: true, enabled: true, role: 'flagship' };
  }
  if (familyEligible && rank === 1 && !isKnownLegacy(model.id)) {
    return { ...model, recommended: true, enabled: true, role: 'previous' };
  }
  return { ...model, recommended: false, enabled: false };
}
