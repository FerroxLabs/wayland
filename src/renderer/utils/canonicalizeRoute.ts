/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The WebUI uses `HashRouter`, so the canonical in-app route lives in
 * `location.hash`. A browser can still land on a mixed URL where the PATH is an
 * app route but the hash is stale or the default - e.g. `/assistants#/guid` from
 * restored mobile history, a path-style deep link, or a `location.assign('/x')`.
 * HashRouter then keeps rendering the stale hash (`#/guid`), so the visible path
 * and the rendered page disagree and the app looks like it "cycled back" (#151).
 *
 * This guard runs once at startup: when the path is a known app-route segment and
 * the hash is empty or the default, it rewrites the hash to match the path. It is
 * deliberately conservative - an explicit, non-default hash always wins, so a
 * genuine `/assistants#/settings/models` is left untouched.
 */

const APP_ROUTE_SEGMENTS = new Set([
  'assistants',
  'conversation',
  'conversations',
  'guid',
  'memory',
  'mission-control',
  'project',
  'projects',
  'scheduled',
  'settings',
  'team',
  'teams',
  'wiki',
  'workflows',
]);

/**
 * Resolve the canonical hash URL to rewrite to, or `null` to leave the URL as-is.
 * Pure (no DOM access) so it can be unit-tested against path/hash pairs.
 */
export function canonicalHashTarget(pathname: string, hash: string): string | null {
  const cleanPath = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  const segment = cleanPath.split(/[/?#]/)[0] || '';
  const hashIsDefault = !hash || hash === '#' || hash === '#/' || hash === '#/guid';
  if (pathname !== '/' && pathname !== '/login' && APP_ROUTE_SEGMENTS.has(segment) && hashIsDefault) {
    return `/#/${cleanPath}`;
  }
  return null;
}

/**
 * Apply the canonicalization to the live URL via `history.replaceState` (no
 * navigation, no reload). Call once before the router mounts. No-op outside a
 * browser and when the URL is already consistent.
 */
export function canonicalizeWebUiRoute(): void {
  if (typeof window === 'undefined') return;
  const target = canonicalHashTarget(window.location.pathname || '/', window.location.hash || '');
  if (target) window.history.replaceState(null, '', target);
}
