/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Express, Request, Response } from 'express';
import express from 'express';
import { logWebhookEvent } from './audit-log';
import { ConnectionTokenStore } from './connection-tokens';
import { ReplayCache } from './replay-cache';
import type {
  ConnectionTokenRecord,
  WebhookDispatcher,
  WebhookVerificationResult,
  WebhookVerifier,
} from './types';
import { VERIFIER_REGISTRY } from './verifiers';

/**
 * WebhookReceiver - verifies and routes inbound webhooks to a dispatcher
 * registered by ChannelManager.
 *
 * Decoupling: this module has zero dependency on ChannelManager / plugins.
 * The dispatcher is injected via `registerWebhookDispatcher`, which makes
 * the pipeline independently testable.
 */

const MAX_PAYLOAD_BYTES = 1_048_576; // 1 MB

// ---------------------------------------------------------------------------
// Singletons + dispatcher slot
// ---------------------------------------------------------------------------

const tokenStore = new ConnectionTokenStore();
const replayCache = new ReplayCache();
let dispatcher: WebhookDispatcher | null = null;

export function getTokenStore(): ConnectionTokenStore {
  return tokenStore;
}

export function getReplayCache(): ReplayCache {
  return replayCache;
}

export function registerWebhookDispatcher(d: WebhookDispatcher | null): void {
  dispatcher = d;
}

// ---------------------------------------------------------------------------
// Pipeline (each step is independently testable)
// ---------------------------------------------------------------------------

type PipelineContext = {
  req: Request;
  res: Response;
  platform: string;
  connectionToken: string;
  getSecretForToken?: (token: string) => Promise<string | null>;
};

function audit(
  platform: string,
  token: string,
  verdict: 'accept' | 'reject',
  status: number,
  reason?: string
): void {
  logWebhookEvent({ platform, token, verdict, status, reason });
}

function resolveTokenOrReject(ctx: PipelineContext): ConnectionTokenRecord | null {
  const record = tokenStore.resolve(ctx.connectionToken);
  if (!record) {
    audit(ctx.platform, ctx.connectionToken, 'reject', 404, 'unknown-token');
    ctx.res.status(404).json({ ok: false, error: 'unknown-token' });
    return null;
  }
  return record;
}

function resolveVerifierOrReject(ctx: PipelineContext): WebhookVerifier | null {
  const verifier = VERIFIER_REGISTRY[ctx.platform];
  if (!verifier) {
    audit(ctx.platform, ctx.connectionToken, 'reject', 404, 'unknown-platform');
    ctx.res.status(404).json({ ok: false, error: 'unknown-platform' });
    return null;
  }
  return verifier;
}

function enforcePayloadSize(ctx: PipelineContext): boolean {
  const contentLength = Number.parseInt(String(ctx.req.headers['content-length'] ?? '0'), 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_PAYLOAD_BYTES) {
    audit(ctx.platform, ctx.connectionToken, 'reject', 413, 'payload-too-large');
    ctx.res.status(413).json({ ok: false, error: 'payload-too-large' });
    return false;
  }
  return true;
}

async function resolveSecret(record: ConnectionTokenRecord, ctx: PipelineContext): Promise<string | null> {
  if (!ctx.getSecretForToken) {
    audit(ctx.platform, ctx.connectionToken, 'reject', 500, 'no-secret-resolver');
    ctx.res.status(500).json({ ok: false, error: 'no-secret-resolver' });
    return null;
  }
  try {
    const secret = await ctx.getSecretForToken(record.token);
    if (!secret) {
      audit(ctx.platform, ctx.connectionToken, 'reject', 500, 'secret-not-found');
      ctx.res.status(500).json({ ok: false, error: 'secret-not-found' });
      return null;
    }
    return secret;
  } catch {
    audit(ctx.platform, ctx.connectionToken, 'reject', 500, 'secret-resolver-error');
    ctx.res.status(500).json({ ok: false, error: 'secret-resolver-error' });
    return null;
  }
}

function normalizeQuery(req: Request): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(req.query)) {
    if (typeof v === 'string') out[k] = v;
    else if (Array.isArray(v) && typeof v[0] === 'string') out[k] = v[0];
  }
  return out;
}

function buildRequestUrl(req: Request): string {
  // Twilio signs the full URL. Reconstruct from headers + originalUrl so
  // proxy paths are preserved.
  const proto = (req.headers['x-forwarded-proto'] as string) || (req.protocol || 'http');
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost';
  return `${proto}://${host}${req.originalUrl || req.url}`;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleInboundWebhook(
  req: Request,
  res: Response,
  opts: { getSecretForToken?: (token: string) => Promise<string | null> }
): Promise<void> {
  const platform = String(req.params.platform || '');
  const connectionToken = String(req.params.connectionToken || '');
  const ctx: PipelineContext = {
    req,
    res,
    platform,
    connectionToken,
    getSecretForToken: opts.getSecretForToken,
  };

  // 1. Resolve token
  const record = resolveTokenOrReject(ctx);
  if (!record) return;

  // Token + URL platform must agree - mismatch is a routing bug or attack.
  if (record.platform !== platform) {
    audit(platform, connectionToken, 'reject', 404, 'platform-token-mismatch');
    res.status(404).json({ ok: false, error: 'platform-token-mismatch' });
    return;
  }

  // 2. Lookup verifier
  const verifier = resolveVerifierOrReject(ctx);
  if (!verifier) return;

  // 3. Payload size
  if (!enforcePayloadSize(ctx)) return;

  // 4. Resolve secret + verify
  const secret = await resolveSecret(record, ctx);
  if (secret === null) return;

  const rawBody: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
  const verifierResult: WebhookVerificationResult = await verifier(
    {
      headers: req.headers,
      rawBody,
      query: normalizeQuery(req),
      url: buildRequestUrl(req),
    },
    secret
  );

  if (verifierResult.ok === false) {
    audit(platform, connectionToken, 'reject', verifierResult.status, verifierResult.reason);
    res.status(verifierResult.status).json({ ok: false, error: verifierResult.reason });
    return;
  }

  // WhatsApp GET challenge short-circuits with the challenge body.
  const challenge = (verifierResult.payload as { __challenge?: string }).__challenge;
  if (typeof challenge === 'string') {
    audit(platform, connectionToken, 'accept', 200, 'challenge');
    tokenStore.touch(connectionToken);
    res.status(200).type('text/plain').send(challenge);
    return;
  }

  // 5. Replay check
  if (verifierResult.eventId) {
    const isReplay = replayCache.seen(verifierResult.eventId, verifierResult.timestamp);
    if (isReplay) {
      audit(platform, connectionToken, 'accept', 200, 'duplicate');
      res.status(200).end();
      return;
    }
  }

  // 6. Dispatch
  if (dispatcher === null) {
    audit(platform, connectionToken, 'reject', 503, 'no-dispatcher');
    res.status(503).json({ ok: false, error: 'no-dispatcher' });
    return;
  }

  try {
    await dispatcher({
      platform: record.platform,
      connectionToken: record.token,
      pluginInstanceId: record.pluginInstanceId,
      agentId: record.agentId,
      payload: verifierResult.payload,
      headers: req.headers,
      eventId: verifierResult.eventId,
    });
  } catch (err) {
    audit(platform, connectionToken, 'reject', 500, 'dispatcher-error');
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'dispatcher-error' });
    }
    console.error('[webhook] dispatcher threw', err);
    return;
  }

  // 7. Touch token + 202 Accepted
  tokenStore.touch(connectionToken);
  audit(platform, connectionToken, 'accept', 202);
  if (!res.headersSent) {
    res.status(202).end();
  }
}

/**
 * Mount the inbound webhook routes onto the given Express app.
 *
 * Two routes, both keyed by `:platform/:connectionToken`:
 *   - POST: standard event delivery
 *   - GET:  subscription challenge (Meta/WhatsApp registration handshake)
 *
 * Caller must register a dispatcher via `registerWebhookDispatcher` before
 * the receiver can deliver events; until then POSTs return 503.
 */
export function mountWebhookRoutes(
  app: Express,
  opts: { getSecretForToken?: (token: string) => Promise<string | null> } = {}
): void {
  const rawBodyParser = express.raw({ type: '*/*', limit: `${MAX_PAYLOAD_BYTES}b` });

  app.post(
    '/webhooks/:platform/:connectionToken',
    rawBodyParser,
    (req: Request, res: Response, next) => {
      handleInboundWebhook(req, res, opts).catch(next);
    }
  );

  app.get(
    '/webhooks/:platform/:connectionToken',
    rawBodyParser,
    (req: Request, res: Response, next) => {
      handleInboundWebhook(req, res, opts).catch(next);
    }
  );
}
