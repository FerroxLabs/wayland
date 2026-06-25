/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';
import type { IModelRegistryConnectResult } from '@/common/adapter/ipcBridge';
import type { ProviderConnState, ProviderId } from '@process/providers/types';

/**
 * Browser/WebUI client for the write-only provider-key route
 * (remote-secure-config W1.A). On desktop the connect flow goes through Electron
 * IPC (`modelRegistry.connect`); in a hosted WebUI that IPC is denied (it would
 * return a decrypted key to a remote caller), so the headless ConnectPanel posts
 * the key through this token-authed + CSRF'd HTTP route instead.
 *
 * The route is WRITE-ONLY: it returns only non-secret status ({ state,
 * modelCount }), never the key.
 */

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

/** Non-secret status returned by a successful connect. */
export type ConnectProviderStatus = { state: ProviderConnState; modelCount: number };

/**
 * Plant a provider API key from the remote WebUI. Mirrors the desktop
 * `connect(...)` return shape ({@link IModelRegistryConnectResult}) so the
 * shared ConnectPanel can consume it unchanged: `{ ok: true }` on success, or
 * `{ ok: false, error }` carrying the server's `ConnectError` code on failure.
 */
export async function connectProviderHttp(
  providerId: ProviderId,
  key: string,
  baseUrl?: string
): Promise<IModelRegistryConnectResult> {
  const csrf = getCsrfToken();
  const res = await fetch('/api/providers/connect', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ providerId, key, baseUrl, _csrf: csrf }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    msg?: string;
    data?: ConnectProviderStatus;
  };

  if (!res.ok || !json.success) {
    // The route returns a `ConnectError` enum string in `error` for a failed
    // connect; fall back to 'unknown' for transport / unexpected failures.
    const error = (json.error as IModelRegistryConnectResult['error']) ?? 'unknown';
    return { ok: false, error };
  }
  return { ok: true };
}
