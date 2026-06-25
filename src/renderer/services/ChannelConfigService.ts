/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';

/**
 * Browser/WebUI client for the write-only channel-config routes
 * (remote-secure-config W3.E). On desktop these flows go through Electron IPC
 * (`channel.enablePlugin` / `disablePlugin` / `syncChannelSettings` /
 * `rotateWebhookToken` / `approvePairing`); in a hosted WebUI those IPC channels
 * are denied to remote callers (R2), so the headless channel settings post
 * through these token-authed + CSRF'd HTTP routes instead.
 *
 * The routes are WRITE-ONLY: most return non-secret status only. The single
 * exception is `rotateWebhookTokenHttp`, which returns the freshly minted token
 * ONCE (shown-once, exactly as the desktop IPC path does) so the UI can display
 * the new webhook URL.
 */

type ChannelAgent = { backend: string; customAgentId?: string; name?: string };
type ChannelModel = { id: string; useModel: string };

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

async function postChannel<T = unknown>(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; data?: T }> {
  const csrf = getCsrfToken();
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ ...body, _csrf: csrf }),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T };
  return { ok: Boolean(res.ok && json.success), data: json.data };
}

/** Enable a channel plugin from the remote WebUI. Returns true on success. */
export async function enablePluginHttp(pluginId: string, config: Record<string, unknown>): Promise<boolean> {
  return (await postChannel('/api/channels/enable-plugin', { pluginId, config })).ok;
}

/** Disable a channel plugin from the remote WebUI. Returns true on success. */
export async function disablePluginHttp(pluginId: string): Promise<boolean> {
  return (await postChannel('/api/channels/disable-plugin', { pluginId })).ok;
}

/** Sync a channel's agent + model from the remote WebUI. Returns true on success. */
export async function syncChannelSettingsHttp(
  platform: string,
  agent: ChannelAgent,
  model?: ChannelModel
): Promise<boolean> {
  return (await postChannel('/api/channels/sync-settings', { platform, agent, model })).ok;
}

/**
 * Rotate a webhook connection token from the remote WebUI. Returns the freshly
 * minted token record ONCE on success, or null on failure. The old token is
 * never returned.
 */
export async function rotateWebhookTokenHttp(args: {
  platform: string;
  pluginInstanceId: string;
  agentId: string;
  secret?: string;
}): Promise<{ token: string; platform: string; createdAt: number } | null> {
  const res = await postChannel<{ token: string; platform: string; createdAt: number }>(
    '/api/channels/rotate-webhook-token',
    args
  );
  return res.ok && res.data ? res.data : null;
}

/** Approve a pending pairing request from the remote WebUI. Returns true on success. */
export async function approvePairingHttp(code: string): Promise<boolean> {
  return (await postChannel('/api/channels/approve-pairing', { code })).ok;
}
