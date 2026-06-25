/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CatalogModel, CuratedModel } from '@process/providers/types';
import type { IModelRegistryCatalogView } from '@/common/adapter/ipcBridge';

/** Minimal shape the bulk-toggle helpers need from a catalog row. */
export type BulkToggleRow = {
  id: string;
  enabled: boolean;
};

/**
 * Merge a provider's FULL catalog with its curated `recommended` / `enabled`
 * flags into one row list. Catalog rows that have no curated entry (image /
 * audio / embedding models the curated text view excludes) default to
 * `recommended:false, enabled:false`. When the catalog is empty but curated is
 * not (older backend), curated is returned verbatim so callers never blank.
 *
 * This is the single source of truth for "what models does this provider have
 * and which are on" - both the Manage page (full list UI) and the Models row
 * (provider on/off toggle + enabled count) consume it so they agree exactly.
 */
export function mergeCatalogRows(view: IModelRegistryCatalogView | null | undefined): CuratedModel[] {
  const fullCatalog: CatalogModel[] = Array.isArray(view?.catalog) ? view.catalog : [];
  const curatedList: CuratedModel[] = Array.isArray(view?.curated) ? view.curated : [];
  if (fullCatalog.length === 0) return curatedList;

  const curatedById = new Map(curatedList.map((m) => [m.id, m]));
  const rows: CuratedModel[] = [];
  for (const c of fullCatalog) {
    const flagged = curatedById.get(c.id);
    if (flagged) {
      rows.push(flagged);
    } else {
      rows.push({
        id: c.id,
        providerId: c.providerId,
        displayName: c.displayName,
        family: c.family,
        kind: c.kind,
        releaseDate: c.releaseDate,
        contextWindow: c.contextWindow,
        costInPerM: c.costInPerM,
        costOutPerM: c.costOutPerM,
        status: c.status,
        enriched: c.enriched,
        tags: Array.isArray(c.tags) ? c.tags : [],
        recommended: false,
        enabled: false,
      });
    }
  }
  return rows;
}

/** How many of the given rows are currently enabled. */
export function enabledCount(rows: readonly BulkToggleRow[]): number {
  let n = 0;
  for (const row of rows) {
    if (row.enabled) n += 1;
  }
  return n;
}

/**
 * The id set a provider-level "turn on" should enable: the recommended models
 * (the same set Manage marks "on by default"), falling back to every model
 * when none are flagged recommended so the provider toggle is never a no-op on
 * a provider whose catalog has no curated picks.
 */
export function defaultOnIds(rows: readonly CuratedModel[]): string[] {
  const recommended = rows.filter((r) => r.recommended).map((r) => r.id);
  return recommended.length > 0 ? recommended : rows.map((r) => r.id);
}

/**
 * Decide which rows a "select all" / "deselect all" action must flip.
 *
 * CRITICAL invariant: the input is the list of CURRENTLY-VISIBLE rows (already
 * filtered by the active search). Hidden rows are never passed in, so they can
 * never be flipped. Only rows whose `enabled` differs from the target are
 * returned — already-correct rows are skipped so the caller makes the minimum
 * number of toggle calls.
 *
 * @param visibleRows rows currently shown after search/filter
 * @param enable target state — `true` = select all, `false` = deselect all
 * @returns ids of the visible rows that need flipping to reach the target
 */
export function rowsToFlip(visibleRows: readonly BulkToggleRow[], enable: boolean): string[] {
  const ids: string[] = [];
  for (const row of visibleRows) {
    if (row.enabled !== enable) {
      ids.push(row.id);
    }
  }
  return ids;
}

/**
 * Whether every currently-visible row is already enabled. Drives the single
 * toggle-all control: when all visible rows are on, the control offers
 * "Deselect all"; otherwise it offers "Select all". An empty list reads as
 * "not all enabled" so the control defaults to the "Select all" affordance.
 */
export function allVisibleEnabled(visibleRows: readonly BulkToggleRow[]): boolean {
  return visibleRows.length > 0 && visibleRows.every((row) => row.enabled);
}
