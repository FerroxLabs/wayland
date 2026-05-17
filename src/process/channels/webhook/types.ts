/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Result of a webhook signature/timestamp verification step.
 *
 * - `ok: true` — verifier accepted the request and surfaced a parsed payload.
 *   Optional `eventId` and `timestamp` feed the replay cache.
 * - `ok: false` — verifier rejected the request with a reason string suitable
 *   for the audit log and a recommended HTTP status (e.g. 401, 403, 400).
 */
export type WebhookVerificationResult =
  | { ok: true; payload: object; eventId?: string; timestamp?: number }
  | { ok: false; reason: string; status: number };

/**
 * A platform-specific verifier. Receives raw request data and the connection
 * secret; returns a verification result. Verifiers MUST NOT mutate state or
 * dispatch — they only verify + parse.
 */
export type WebhookVerifier = (
  input: {
    headers: Record<string, string | string[] | undefined>;
    rawBody: Buffer;
    query: Record<string, string | undefined>;
    url: string;
  },
  secret: string
) => Promise<WebhookVerificationResult> | WebhookVerificationResult;

/**
 * Connection token record minted per (platform, pluginInstance, agent) tuple.
 * Used to identify the routing target on inbound webhook delivery without
 * exposing the plugin/agent identity in the URL.
 */
export type ConnectionTokenRecord = {
  token: string;
  platform: string;
  pluginInstanceId: string;
  agentId: string;
  createdAt: number;
  lastUsedAt?: number;
  revokedAt?: number;
};

/**
 * Dispatcher contract — the receiver hands every verified, non-replay event to
 * a single dispatcher function registered by the channel manager. The receiver
 * itself has no knowledge of plugins or channel internals.
 */
export type WebhookDispatcher = (event: {
  platform: string;
  connectionToken: string;
  pluginInstanceId: string;
  agentId: string;
  payload: object;
  headers: Record<string, string | string[] | undefined>;
  eventId?: string;
}) => Promise<void>;
