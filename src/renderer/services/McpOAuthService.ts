/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';

/**
 * Browser/WebUI client for the write-only MCP OAuth (DCR) connect route
 * (remote-secure-config W4a). On desktop the MCP OAuth flow goes through Electron
 * IPC (`mcpService.loginMcpOAuth`); in a hosted WebUI that IPC is denied (it
 * mutates credential material a remote caller must not reach), so the headless MCP
 * UI starts the flow through this token-authed + CSRF'd HTTP route instead.
 *
 * The route is WRITE-ONLY: it returns only non-secret status + the vendor's PUBLIC
 * authorization URL the browser must visit. It never returns a token. The browser
 * navigates to `authUrl`; the vendor redirects back to the server's own
 * `/api/mcp/oauth/callback`, which completes + persists the token server-side.
 */

export type StartMcpOAuthResult =
  | { ok: true; authUrl: string }
  | { ok: false; error?: string };

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

/**
 * Start the DCR OAuth flow for an installed MCP server from the remote WebUI.
 * Returns the vendor authorization URL on success; the caller navigates the
 * browser there. The token is never echoed back.
 */
export async function startMcpOAuthHttp(serverId: string): Promise<StartMcpOAuthResult> {
  const csrf = getCsrfToken();
  const res = await fetch('/api/mcp/oauth/connect', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ serverId, _csrf: csrf }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    msg?: string;
    data?: { status?: string; authUrl?: string };
  };

  if (res.ok && json.success && json.data?.authUrl) {
    return { ok: true, authUrl: json.data.authUrl };
  }
  return { ok: false, error: json.msg };
}
