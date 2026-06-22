/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure helpers for popping a main destination (not a conversation) out into its
 * own window (#157). Kept free of Electron/IPC imports so the route allowlist
 * and deep-link construction are unit-testable in plain node; the Electron
 * window manager (`popoutWindowManager.ts`) composes these.
 *
 * Security: `route` arrives from the renderer, so it is validated against a
 * fixed allowlist before it ever reaches `loadURL`/`loadFile`. Only known
 * top-level destinations may be popped out; anything else is rejected.
 */

/** Top-level routes that may be popped out into their own window. */
export const POPOUT_ALLOWED_ROUTES = ['mission-control'] as const;

export type PopoutRoute = (typeof POPOUT_ALLOWED_ROUTES)[number];

/** True when `route` is an allowlisted pop-out destination. */
export function isAllowedPopoutRoute(route: string): route is PopoutRoute {
  return (POPOUT_ALLOWED_ROUTES as readonly string[]).includes(route);
}

/**
 * Registry key for a route pop-out. Namespaced with a `route:` prefix so it can
 * never collide with a conversation id in the shared pop-out window registry.
 */
export function routePopoutKey(route: PopoutRoute): string {
  return `route:${route}`;
}

/**
 * Hash deep-link for a route pop-out, e.g. `#/mission-control?mode=popout`. The
 * `mode=popout` flag drives the renderer's chrome-less shell (same flag the
 * conversation pop-out uses), so a popped-out route renders without the sider.
 */
export function routePopoutHash(route: PopoutRoute): string {
  return `#/${route}?mode=popout`;
}

/** The bare hash (no leading `#`) for Electron's `loadFile({ hash })` form. */
export function routePopoutLoadFileHash(route: PopoutRoute): string {
  return `/${route}?mode=popout`;
}
