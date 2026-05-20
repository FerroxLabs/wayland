/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { slackVerifier } from '@process/channels/webhook/verifiers/slack';

const SIGNING_SECRET = 'slack-signing-secret-for-testing';

function signSlack(timestamp: string, rawBody: string, secret = SIGNING_SECRET): string {
  return 'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex');
}

describe('slackVerifier', () => {
  const url = 'https://example.com/webhooks/slack/abc123';
  const body = JSON.stringify({ event_id: 'Ev1', event: { type: 'message', text: 'hi' } });

  it('accepts a request with a valid signature and fresh timestamp', () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = signSlack(ts, body);
    const result = slackVerifier(
      {
        headers: { 'x-slack-signature': sig, 'x-slack-request-timestamp': ts },
        rawBody: Buffer.from(body),
        query: {},
        url,
      },
      SIGNING_SECRET
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.eventId).toBe('Ev1');
  });

  it('rejects a stale timestamp at the verifier level', () => {
    const ts = (Math.floor(Date.now() / 1000) - 10 * 60).toString(); // 10 min old
    const sig = signSlack(ts, body);
    const result = slackVerifier(
      {
        headers: { 'x-slack-signature': sig, 'x-slack-request-timestamp': ts },
        rawBody: Buffer.from(body),
        query: {},
        url,
      },
      SIGNING_SECRET
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('stale-timestamp');
      expect(result.status).toBe(401);
    }
  });

  it('rejects a tampered body', () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = signSlack(ts, body);
    const tampered = JSON.stringify({ event_id: 'Ev1', event: { type: 'message', text: 'TAMPERED' } });
    const result = slackVerifier(
      {
        headers: { 'x-slack-signature': sig, 'x-slack-request-timestamp': ts },
        rawBody: Buffer.from(tampered),
        query: {},
        url,
      },
      SIGNING_SECRET
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-signature');
  });

  it('rejects missing signature headers', () => {
    const result = slackVerifier(
      { headers: {}, rawBody: Buffer.from(body), query: {}, url },
      SIGNING_SECRET
    );
    expect(result.ok).toBe(false);
  });

  it('surfaces __challenge on signed url_verification handshake (v0.4.3 F15)', () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const challengeBody = JSON.stringify({
      type: 'url_verification',
      token: 'whatever',
      challenge: 'abc123-challenge-string',
    });
    const sig = signSlack(ts, challengeBody);
    const result = slackVerifier(
      {
        headers: { 'x-slack-signature': sig, 'x-slack-request-timestamp': ts },
        rawBody: Buffer.from(challengeBody),
        query: {},
        url,
      },
      SIGNING_SECRET
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.payload as { __challenge?: string }).__challenge).toBe(
        'abc123-challenge-string'
      );
      // The WebhookReceiver short-circuits on __challenge and never dispatches,
      // so eventId is not required here.
    }
  });
});
