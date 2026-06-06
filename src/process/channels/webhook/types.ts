/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Result of a webhook signature/timestamp verification step.
 *
 * - `ok: true` - verifier accepted the request and surfaced a parsed payload.
 *   Optional `eventId` and `timestamp` feed the replay cache.
 * - `ok: false` - verifier rejected the request with a reason string suitable
 *   for the audit log and a recommended HTTP status (e.g. 401, 403, 400).
 */
export type WebhookVerificationResult =
  | { ok: true; payload: object; eventId?: string; timestamp?: number }
  | {
      ok: false;
      reason: string;
      status: number;
      /**
       * Optional debug field - verifiers MAY surface the exact URL they hashed
       * when computing a signature. Useful for tunnel-host mismatch debugging
       * (e.g. Twilio signs the public host but we hash localhost).
       */
      signingUrl?: string;
    };

/**
 * A platform-specific verifier. Receives raw request data and the connection
 * secret; returns a verification result. Verifiers MUST NOT mutate state or
 * dispatch - they only verify + parse.
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
 *
 * `secret` holds the per-platform verifier material (LINE channelSecret,
 * Google Chat JWT audience, MS Teams appId, Synology Chat incomingToken,
 * generic webhook HMAC secret, etc.). The receiver resolver reads it directly
 * so the verifier chain can do signature/JWT checks without round-tripping
 * the credential store.
 */
export type ConnectionTokenRecord = {
  token: string;
  platform: string;
  pluginInstanceId: string;
  agentId: string;
  secret: string;
  createdAt: number;
  lastUsedAt?: number;
  revokedAt?: number;
};

/**
 * Dispatcher contract - the receiver hands every verified, non-replay event to
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
