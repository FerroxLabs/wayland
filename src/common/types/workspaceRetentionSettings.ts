/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The user-facing retention setting, and the ONE place the two windows are
 * defined.
 *
 * There are deliberately two windows and they are not the same kind of thing:
 *
 *  - TIER 1, `EMPTY_ABANDONED_SWEEP_WINDOW_MS`: fixed at 7 days and NOT
 *    configurable. It only ever applies to a workspace the classifier has
 *    proven is empty and unreferenced, so there is nothing in it to lose and
 *    nothing for a setting to protect.
 *  - TIER 2, `windowDays`: configurable, default 60 days, and it only decides
 *    when a CONTENT-BEARING workspace is SURFACED FOR REVIEW. It never deletes.
 *
 * Default 60 and not 30: Wayland ships `ops/last-monthly-review.md` as a
 * MONTHLY diff input, so a 30-day window can offer up the exact file the next
 * scheduled run needs to read.
 *
 * Both windows feed the SAME `retentionWindowMs` field the classifier already
 * validates (`managedWorkspaceRetention.ts`). This module introduces no second
 * concept of age.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fixed. Tier 1 only, and only for provably empty, unreferenced scratch. */
export const EMPTY_ABANDONED_SWEEP_WINDOW_MS = 7 * DAY_MS;

export const WORKSPACE_RETENTION_WINDOW_CHOICES = [30, 60, 90, 'never'] as const;

export type WorkspaceRetentionWindow = (typeof WORKSPACE_RETENTION_WINDOW_CHOICES)[number];

export const DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS: WorkspaceRetentionWindow = 60;

export type WorkspaceRetentionSettings = {
  windowDays: WorkspaceRetentionWindow;
};

const isWindow = (value: unknown): value is WorkspaceRetentionWindow =>
  (WORKSPACE_RETENTION_WINDOW_CHOICES as readonly unknown[]).includes(value);

/**
 * Read a stored setting, falling back to the default for anything this build
 * does not recognise. A hand-edited config file, a downgrade, or a future
 * choice must never widen the window by accident.
 */
export function parseWorkspaceRetentionSettings(value: unknown): WorkspaceRetentionSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { windowDays: DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS };
  }
  const windowDays = (value as { windowDays?: unknown }).windowDays;
  return { windowDays: isWindow(windowDays) ? windowDays : DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS };
}

/**
 * Project the choice onto the classifier's existing `retentionWindowMs`.
 *
 * "Never" is `Number.MAX_SAFE_INTEGER`: a real, safe-integer window that no
 * observable age can ever reach, so tier 2 goes silent without needing a
 * nullable field, a second flag, or a branch the classifier does not already
 * validate. Tier 1 keeps its own fixed window and is unaffected.
 */
export function retentionWindowMsFor(windowDays: WorkspaceRetentionWindow): number {
  return windowDays === 'never' ? Number.MAX_SAFE_INTEGER : windowDays * DAY_MS;
}

/**
 * Read the stored window through any config getter, never throwing.
 *
 * A store that is locked, absent, or holding a value this build does not
 * understand yields the default rather than propagating - a failed read must
 * not be able to widen or narrow the window the user chose.
 */
export async function loadRetentionWindowMs(read: () => Promise<unknown>): Promise<number> {
  try {
    return retentionWindowMsFor(parseWorkspaceRetentionSettings(await read()).windowDays);
  } catch {
    return retentionWindowMsFor(DEFAULT_WORKSPACE_RETENTION_WINDOW_DAYS);
  }
}
