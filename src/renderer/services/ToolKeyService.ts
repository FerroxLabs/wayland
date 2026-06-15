/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';

/**
 * Browser/WebUI client for the write-only tool-key routes
 * (remote-secure-config W1.B). On desktop the tool-key flow goes through Electron
 * IPC (`wcoreToolKeys.set` / `.delete`); in a hosted WebUI that IPC is denied (it
 * mutates credential material a remote caller must not reach), so the headless
 * Services & Keys pane posts the key through these token-authed + CSRF'd HTTP
 * routes instead.
 *
 * The routes are WRITE-ONLY: they return only non-secret status ({ hasKey }),
 * never the key.
 */

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

async function postToolKey(path: string, body: Record<string, unknown>): Promise<boolean> {
  const csrf = getCsrfToken();
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ ...body, _csrf: csrf }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { hasKey?: boolean };
  };

  return Boolean(res.ok && json.success);
}

/**
 * Plant a tool / service API key from the remote WebUI. Returns `true` on a
 * successful write, `false` otherwise. The key is never echoed back.
 */
export function setToolKeyHttp(id: string, key: string): Promise<boolean> {
  return postToolKey('/api/tools/keys/set', { id, key });
}

/**
 * Remove a stored tool / service API key from the remote WebUI. Returns `true`
 * on a successful delete, `false` otherwise.
 */
export function deleteToolKeyHttp(id: string): Promise<boolean> {
  return postToolKey('/api/tools/keys/delete', { id });
}
