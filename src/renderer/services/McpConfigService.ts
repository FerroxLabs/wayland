/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';

/**
 * Browser/WebUI client for the write-only MCP config routes
 * (remote-secure-config W3.D). On desktop the MCP sync / remove / BYO-OAuth flow
 * goes through Electron IPC (`mcpService.*`); in a hosted WebUI that IPC is
 * denied (it mutates agent config + credential material a remote caller must not
 * reach), so the headless MCP surface posts through these token-authed + CSRF'd
 * HTTP routes instead.
 *
 * The routes are WRITE-ONLY: they return only non-secret status (per-agent
 * results / { ok }), never a credential.
 */

type McpAgentResult = { agent: string; success: boolean; error?: string };
type McpSyncResponse = { success: boolean; data?: { results: McpAgentResult[] }; msg?: string };

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

async function postMcpConfig(path: string, body: Record<string, unknown>): Promise<McpSyncResponse> {
  const csrf = getCsrfToken();
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ ...body, _csrf: csrf }),
  });

  const json = (await res.json().catch(() => ({}))) as McpSyncResponse;
  return {
    success: Boolean(res.ok && json.success),
    data: json.data,
    msg: json.msg,
  };
}

/**
 * Install a stored MCP server into every detected agent CLI from the remote
 * WebUI. The server is resolved server-side by id; only the id is sent.
 */
export function syncMcpToAgentsHttp(serverId: string): Promise<McpSyncResponse> {
  return postMcpConfig('/api/mcp/sync-to-agents', { serverId });
}

/**
 * Remove a named MCP server from every detected agent CLI from the remote WebUI.
 */
export function removeMcpFromAgentsHttp(name: string): Promise<McpSyncResponse> {
  return postMcpConfig('/api/mcp/remove-from-agents', { name });
}

/**
 * Plant BYO OAuth client credentials onto a stored MCP server from the remote
 * WebUI. Returns `true` on a successful write, `false` otherwise. The
 * credentials are never echoed back.
 */
export async function setMcpByoOAuthCredentialsHttp(
  serverId: string,
  clientId: string,
  clientSecret?: string
): Promise<boolean> {
  const res = await postMcpConfig('/api/mcp/set-byo-oauth-credentials', { serverId, clientId, clientSecret });
  return res.success;
}
