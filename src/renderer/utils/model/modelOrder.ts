/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Model picker ordering — newest first.
 *
 * The subscription / CLI catalogs (e.g. the ChatGPT-subscription GPT-5.x set)
 * carry no models.dev `releaseDate`, so the catalog store's default
 * alphabetical `sortByDisplayName` left the picker ascending — `GPT-5.4` above
 * `GPT-5.6`. Users expect the newest models on top. This comparator sorts
 * newest-first by (1) release date when present, then (2) a parsed version
 * number (`5.6` > `5.5` > `5.4`), and otherwise leaves items in their existing
 * relative order (return 0 → a stable sort preserves the alphabetical grouping,
 * so `GPT-5.6-Luna`/`-Sol`/`-Terra` stay alphabetical *within* the 5.6 tier).
 */

type OrderableModel = { id: string; label?: string; displayName?: string; releaseDate?: string };

/**
 * Parse the leading semantic version-ish number from a model label/id.
 * `"GPT-5.6-Sol"` / `"gpt-5.6-sol"` → `5.6`, `"GPT-5.4-Mini"` → `5.4`,
 * `"Claude Sonnet 4.5"` → `4.5`. Returns `null` when there is no `X.Y` (or bare
 * integer) number to key on (e.g. `"sonnet"`), so unversioned ids keep their
 * original order instead of being forced to the front or back arbitrarily.
 */
export function parseModelVersion(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? Number.parseFloat(match[1]) : null;
}

/** Text used to key a model's version — prefer the human label, then id. */
function versionText(model: OrderableModel): string {
  return model.label || model.displayName || model.id;
}

/**
 * Comparator for `Array.prototype.sort` / `toSorted` that orders models
 * newest-first. Stable-safe: equal-rank models return 0 and keep their input
 * order. Pass to `list.slice().sort(compareModelsNewestFirst)`.
 */
export function compareModelsNewestFirst(a: OrderableModel, b: OrderableModel): number {
  // 1. Release date, newest first. '' (undated) sorts after any real date.
  const ad = a.releaseDate ?? '';
  const bd = b.releaseDate ?? '';
  if (ad !== bd) return bd.localeCompare(ad);

  // 2. Parsed version, highest first. A versioned id outranks an unversioned one.
  const av = parseModelVersion(versionText(a));
  const bv = parseModelVersion(versionText(b));
  if (av !== null && bv !== null) {
    if (av !== bv) return bv - av;
  } else if (av !== null || bv !== null) {
    return av !== null ? -1 : 1;
  }

  // 3. Otherwise preserve input order (stable sort → keeps alphabetical grouping).
  return 0;
}

/** Convenience: return a new newest-first-sorted array (does not mutate input). */
export function sortModelsNewestFirst<T extends OrderableModel>(models: readonly T[]): T[] {
  return models.slice().sort(compareModelsNewestFirst);
}
