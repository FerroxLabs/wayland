/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';

/**
 * Browser/WebUI client for the write-only Flux remote-connect routes
 * (remote-secure-config W4a). On desktop the Flux connect flow goes through
 * Electron IPC (`onboarding.connect-flux`, a loopback + system-browser PKCE
 * dance); a phone browser has neither a loopback listener nor `shell.openExternal`,
 * so the headless Models page drives the SAME OAuth via these token-authed +
 * CSRF'd HTTP routes instead.
 *
 * The routes are WRITE-ONLY: `start` returns only the non-secret authorize URL,
 * and `complete` returns only `{ connected }`. No key/secret is ever echoed.
 */

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

async function postFlux<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  const csrf = getCsrfToken();
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ ...body, _csrf: csrf }),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T };
  if (!res.ok || !json.success) return null;
  return json.data ?? null;
}

/**
 * Begin a remote Flux connect: the server mints PKCE + a blessed-origin
 * redirect_uri and returns the authorize URL for this browser to open. The PKCE
 * verifier never leaves the server. Returns `null` on failure.
 */
export function startFluxConnectHttp(): Promise<{ authorizeUrl: string; state: string } | null> {
  return postFlux('/api/flux/connect/start', {});
}

/**
 * Finish a remote Flux connect after the browser returns from Flux with a
 * `code` + `state`. The server exchanges + persists the key server-side and
 * returns `{ connected }` only. Returns `true` on success, `false` otherwise.
 */
export async function completeFluxConnectHttp(code: string, state: string): Promise<boolean> {
  const data = await postFlux<{ connected?: boolean }>('/api/flux/connect/complete', { code, state });
  return Boolean(data?.connected);
}
