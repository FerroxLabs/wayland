/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Cover the 6 HIGH findings closed by slack-A in v0.4.2:
 *
 *  F1  verifier rejects non-`v0=` schemes up front
 *  F2  testConnection validates appToken format + signingSecret HMAC
 *  F3  addReaction / removeReaction back the canReact capability claim
 *  F4  sendMessage returns the FIRST chunk's ts, not the last
 *  F12 handleWebhookPayload contract is reachable via ChannelManager
 *  F13 postWithRetry honors Slack's Retry-After on 429
 */

// Auth-test mock that the WebClient constructor will hand back from `.auth`.
const authTestMock = vi.fn(async () => ({
  ok: true,
  user_id: 'U123',
  team_id: 'T123',
  user: 'wayland-bot',
  team: 'wayland',
}));
const postMessageMock = vi.fn(async () => ({ ok: true, ts: '1700000001.0' }));
const reactionsAddMock = vi.fn(async () => ({ ok: true }));
const reactionsRemoveMock = vi.fn(async () => ({ ok: true }));
const conversationsOpenMock = vi.fn(async () => ({ ok: true, channel: { id: 'D-fake' } }));
const filesGetUrlMock = vi.fn(async () => ({ upload_url: '', file_id: '' }));
const filesCompleteUploadMock = vi.fn(async () => ({ ok: true }));

// Replace @slack/web-api so no network IO happens during these tests. We only
// need WebClient - Bolt's App is exercised separately and is not part of any
// HIGH-fix surface here.
vi.mock('@slack/web-api', () => {
  class WebClient {
    auth = { test: authTestMock };
    chat = { postMessage: postMessageMock, update: vi.fn() };
    reactions = { add: reactionsAddMock, remove: reactionsRemoveMock };
    conversations = { open: conversationsOpenMock };
    files = { getUploadURLExternal: filesGetUrlMock, completeUploadExternal: filesCompleteUploadMock };
  }
  return { WebClient };
});

// Bolt is constructed inside onInitialize, which we do not exercise here.
// Provide stubs so the import resolves cleanly.
vi.mock('@slack/bolt', () => ({
  App: class {},
  HTTPReceiver: class {},
  SocketModeReceiver: class {},
}));

// Imports must come AFTER vi.mock so the mocked module is wired in.
const { SlackPlugin } = await import('@process/channels/plugins/tier1/slack/SlackPlugin');
const { slackVerifier } = await import('@process/channels/webhook/verifiers/slack');

const SLACK_SECRET = 'a'.repeat(32);

function sign(body: string, ts: string, secret: string): string {
  return 'v0=' + createHmac('sha256', secret).update(`v0:${ts}:${body}`).digest('hex');
}

function nowSec(): string {
  return Math.floor(Date.now() / 1000).toString();
}

beforeEach(() => {
  postMessageMock.mockClear();
  reactionsAddMock.mockClear();
  reactionsRemoveMock.mockClear();
  authTestMock.mockClear();
  authTestMock.mockImplementation(async () => ({
    ok: true,
    user_id: 'U123',
    team_id: 'T123',
    user: 'wayland-bot',
    team: 'wayland',
  }));
  postMessageMock.mockImplementation(async () => ({ ok: true, ts: '1700000001.0' }));
});

describe('verifier: F1 - non-v0 scheme is rejected before HMAC compare', () => {
  it('rejects an unknown signature scheme (`v1=`) with invalid-scheme', async () => {
    const ts = nowSec();
    const body = '{}';
    const v0 = sign(body, ts, SLACK_SECRET);
    const v1 = 'v1=' + v0.slice(3);
    const result = await slackVerifier(
      {
        headers: { 'x-slack-signature': v1, 'x-slack-request-timestamp': ts },
        rawBody: Buffer.from(body, 'utf8'),
        query: {},
        url: 'https://example.com/webhook',
      },
      SLACK_SECRET,
    );
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.reason).toBe('invalid-scheme');
      expect(result.status).toBe(401);
    }
  });

  it('accepts a well-formed v0 signature for the canonical Slack basestring', async () => {
    const ts = nowSec();
    const body = '{"type":"event_callback"}';
    const sig = sign(body, ts, SLACK_SECRET);
    const result = await slackVerifier(
      {
        headers: { 'x-slack-signature': sig, 'x-slack-request-timestamp': ts },
        rawBody: Buffer.from(body, 'utf8'),
        query: {},
        url: 'https://example.com/webhook',
      },
      SLACK_SECRET,
    );
    expect(result.ok).toBe(true);
  });
});

describe('SlackPlugin.testConnection - F2: validates appToken + signingSecret', () => {
  it('rejects a Socket Mode appToken that does not start with "xapp-"', async () => {
    const result = await SlackPlugin.testConnection('xoxb-fake', {
      transport: 'socket',
      appToken: 'wrong-prefix',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/xapp-/);
  });

  it('accepts a well-formed Socket Mode appToken', async () => {
    const result = await SlackPlugin.testConnection('xoxb-fake', {
      transport: 'socket',
      appToken: 'xapp-1-A-B-c',
    });
    expect(result.success).toBe(true);
    expect(result.botUsername).toBe('wayland-bot');
  });

  it('rejects a too-short signingSecret on Events API transport', async () => {
    const result = await SlackPlugin.testConnection('xoxb-fake', {
      transport: 'events',
      signingSecret: 'short',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/32/);
  });

  it('accepts a 32+ char signingSecret on Events API transport', async () => {
    const result = await SlackPlugin.testConnection('xoxb-fake', {
      transport: 'events',
      signingSecret: SLACK_SECRET,
    });
    expect(result.success).toBe(true);
  });

  it('returns the error message when auth.test fails', async () => {
    authTestMock.mockImplementationOnce(async () => {
      throw new Error('invalid_auth');
    });
    const result = await SlackPlugin.testConnection('xoxb-bad');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid_auth/);
  });
});

describe('SlackPlugin - F3: canReact is honest (reaction methods exist)', () => {
  it('exposes addReaction and removeReaction as functions', () => {
    const plugin = new SlackPlugin();
    expect(typeof plugin.addReaction).toBe('function');
    expect(typeof plugin.removeReaction).toBe('function');
  });

  it('addReaction / removeReaction call the Slack reactions API with a colon-stripped name', async () => {
    const plugin = new SlackPlugin();
    // Force a webClient onto the plugin so addReaction/removeReaction don't
    // throw "not initialized" - we inject the same mocked WebClient shape.
    (plugin as unknown as { webClient: unknown }).webClient = {
      reactions: { add: reactionsAddMock, remove: reactionsRemoveMock },
    };

    await plugin.addReaction('C1', '1234.5', ':thumbsup:');
    expect(reactionsAddMock).toHaveBeenCalledWith({ channel: 'C1', timestamp: '1234.5', name: 'thumbsup' });

    await plugin.removeReaction('C1', '1234.5', 'eyes');
    expect(reactionsRemoveMock).toHaveBeenCalledWith({ channel: 'C1', timestamp: '1234.5', name: 'eyes' });
  });
});

describe('SlackPlugin.sendMessage - F4: returns the FIRST chunk ts on multi-chunk replies', () => {
  it('returns ts of chunk 0 across a chunked send so edits patch the head', async () => {
    const plugin = new SlackPlugin();
    let call = 0;
    postMessageMock.mockImplementation(async () => {
      call += 1;
      return { ok: true, ts: `170000000${call}.000001` };
    });
    (plugin as unknown as { webClient: unknown }).webClient = {
      chat: { postMessage: postMessageMock },
      conversations: { open: conversationsOpenMock },
    };
    const long = 'x'.repeat(7000);
    const ts = await plugin.sendMessage('C1', { text: long });
    expect(postMessageMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    // FIRST call's ts - not the last.
    expect(ts).toBe('1700000001.000001');
  });
});

describe('SlackPlugin.handleWebhookPayload - F12: webhook dispatch contract is reachable', () => {
  it('guards against deliveries when the plugin is in socket transport', async () => {
    const plugin = new SlackPlugin();
    // resolvedTransport defaults to 'socket' before init - drive that path.
    await expect(plugin.handleWebhookPayload({}, {}, 'inst-1')).rejects.toThrow(/not in Events API transport/);
  });
});

describe('SlackPlugin.sendMessage - F13: honors Retry-After on 429 then continues', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries a chunk after a rate-limit error and finishes the send', async () => {
    vi.useFakeTimers();
    const plugin = new SlackPlugin();
    let attempt = 0;
    postMessageMock.mockImplementation(async () => {
      attempt += 1;
      if (attempt === 1) {
        const err = Object.assign(new Error('ratelimited'), {
          code: 'slack_webapi_rate_limited_error',
          data: { error: 'ratelimited' },
          retryAfter: 1,
        });
        throw err;
      }
      return { ok: true, ts: `170000000${attempt}.0` };
    });
    (plugin as unknown as { webClient: unknown }).webClient = {
      chat: { postMessage: postMessageMock },
      conversations: { open: conversationsOpenMock },
    };
    const promise = plugin.sendMessage('C1', { text: 'hi' });
    await vi.advanceTimersByTimeAsync(1500);
    const ts = await promise;
    expect(postMessageMock.mock.calls.length).toBe(2);
    expect(ts).toBe('1700000002.0');
  });
});
