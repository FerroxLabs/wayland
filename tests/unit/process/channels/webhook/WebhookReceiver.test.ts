/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import type { AddressInfo } from 'node:net';
import { __setLogPathForTests } from '@process/channels/webhook/audit-log';
import {
  getReplayCache,
  getTokenStore,
  mountWebhookRoutes,
  registerWebhookDispatcher,
} from '@process/channels/webhook/WebhookReceiver';

const SLACK_SECRET = 'slack-test-signing-secret';

function signSlack(ts: string, body: string): string {
  return 'v0=' + createHmac('sha256', SLACK_SECRET).update(`v0:${ts}:${body}`).digest('hex');
}

type Listener = ReturnType<typeof http.createServer>;

function startApp(getSecretForToken: (token: string) => Promise<string | null>): Promise<{
  server: Listener;
  baseUrl: string;
}> {
  const app = express();
  mountWebhookRoutes(app, { getSecretForToken });
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function closeServer(server: Listener): Promise<void> {
  return new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
}

async function postJson(
  url: string,
  body: string,
  headers: Record<string, string>
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), ...headers },
      },
      (res) => {
        let chunks = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (chunks += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, text: chunks }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

describe('WebhookReceiver pipeline', () => {
  beforeEach(() => {
    // Redirect audit log to a tmp file so tests don't pollute userData.
    __setLogPathForTests(path.join(os.tmpdir(), `wayland-webhook-audit-test-${Date.now()}.log`));
    // Fresh dispatcher slot.
    registerWebhookDispatcher(null);
    // Clear the in-memory replay cache by manipulating its internals indirectly:
    // create a fresh app per test and use unique event IDs.
  });

  afterAll(() => {
    __setLogPathForTests(null);
  });

  it('returns 404 for an unknown connection token', async () => {
    const { server, baseUrl } = await startApp(async () => SLACK_SECRET);
    try {
      const res = await postJson(`${baseUrl}/webhooks/slack/not-a-real-token`, '{}', {});
      expect(res.status).toBe(404);
    } finally {
      await closeServer(server);
    }
  });

  it('returns 401 for an invalid signature', async () => {
    const tokenStore = getTokenStore();
    const record = tokenStore.register('slack', 'plugin-1', 'agent-1', SLACK_SECRET);
    const { server, baseUrl } = await startApp(async () => SLACK_SECRET);
    try {
      const body = JSON.stringify({ event_id: 'evt-bad-sig' });
      const ts = Math.floor(Date.now() / 1000).toString();
      const res = await postJson(
        `${baseUrl}/webhooks/slack/${record.token}`,
        body,
        {
          'x-slack-signature': 'v0=0000000000000000000000000000000000000000000000000000000000000000',
          'x-slack-request-timestamp': ts,
        }
      );
      expect(res.status).toBe(401);
    } finally {
      await closeServer(server);
    }
  });

  it('returns 503 when no dispatcher is registered', async () => {
    const tokenStore = getTokenStore();
    const record = tokenStore.register('slack', 'plugin-1', 'agent-1', SLACK_SECRET);
    const { server, baseUrl } = await startApp(async () => SLACK_SECRET);
    try {
      registerWebhookDispatcher(null);
      const body = JSON.stringify({ event_id: 'evt-no-dispatcher-' + Date.now() });
      const ts = Math.floor(Date.now() / 1000).toString();
      const sig = signSlack(ts, body);
      const res = await postJson(
        `${baseUrl}/webhooks/slack/${record.token}`,
        body,
        { 'x-slack-signature': sig, 'x-slack-request-timestamp': ts }
      );
      expect(res.status).toBe(503);
    } finally {
      await closeServer(server);
    }
  });

  it('dispatches a verified event exactly once and returns 202', async () => {
    const tokenStore = getTokenStore();
    const record = tokenStore.register('slack', 'plugin-1', 'agent-1', SLACK_SECRET);
    const dispatcher = vi.fn().mockResolvedValue(undefined);
    registerWebhookDispatcher(dispatcher);

    const { server, baseUrl } = await startApp(async () => SLACK_SECRET);
    try {
      const body = JSON.stringify({ event_id: 'evt-dispatch-' + Date.now() });
      const ts = Math.floor(Date.now() / 1000).toString();
      const sig = signSlack(ts, body);
      const res = await postJson(
        `${baseUrl}/webhooks/slack/${record.token}`,
        body,
        { 'x-slack-signature': sig, 'x-slack-request-timestamp': ts }
      );

      expect(res.status).toBe(202);
      expect(dispatcher).toHaveBeenCalledTimes(1);
      const call = dispatcher.mock.calls[0]?.[0];
      expect(call.platform).toBe('slack');
      expect(call.pluginInstanceId).toBe('plugin-1');
      expect(call.agentId).toBe('agent-1');
      expect(call.connectionToken).toBe(record.token);
    } finally {
      await closeServer(server);
    }
  });

  it('drops replays without re-dispatching', async () => {
    const tokenStore = getTokenStore();
    const record = tokenStore.register('slack', 'plugin-1', 'agent-1', SLACK_SECRET);
    const dispatcher = vi.fn().mockResolvedValue(undefined);
    registerWebhookDispatcher(dispatcher);

    const { server, baseUrl } = await startApp(async () => SLACK_SECRET);
    try {
      const eventId = 'evt-replay-' + Date.now();
      const body = JSON.stringify({ event_id: eventId });
      const ts = Math.floor(Date.now() / 1000).toString();
      const sig = signSlack(ts, body);

      // Pre-seed the replay cache so we exercise the duplicate branch.
      getReplayCache().seen(eventId);

      const res = await postJson(
        `${baseUrl}/webhooks/slack/${record.token}`,
        body,
        { 'x-slack-signature': sig, 'x-slack-request-timestamp': ts }
      );
      expect(res.status).toBe(200);
      expect(dispatcher).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it('resolver reads the per-platform secret from the token store', async () => {
    // Verify that the token-store-backed resolver (the one wired in
    // webserver/index.ts) hands the correct secret to the verifier.
    // We reproduce it inline: register with a known secret, build a resolver
    // that calls tokenStore.resolve(), assert it returns the stored secret.
    const tokenStore = getTokenStore();
    const secret = 'line-channel-secret-xyz';
    const record = tokenStore.register('line', 'line_default', 'default', secret);

    // Inline the resolver logic from webserver/index.ts to verify the contract.
    const resolver = async (token: string): Promise<string | null> => {
      const r = tokenStore.resolve(token);
      if (!r) return null;
      return r.secret || null;
    };

    expect(await resolver(record.token)).toBe(secret);
    expect(await resolver('unknown-token')).toBeNull();

    // Revoked tokens must not expose the secret.
    tokenStore.revoke(record.token);
    expect(await resolver(record.token)).toBeNull();
  });
});
