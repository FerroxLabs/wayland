/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { twilioVerifier } from '@process/channels/webhook/verifiers/twilio';

const AUTH_TOKEN = 'twilio-auth-token-for-testing';

function signTwilio(url: string, params: Record<string, string>): string {
  const sorted = Object.keys(params).toSorted();
  let data = url;
  for (const key of sorted) data += key + params[key];
  return createHmac('sha1', AUTH_TOKEN).update(data).digest('base64');
}

function buildBody(params: Record<string, string>): Buffer {
  const search = new URLSearchParams(params);
  return Buffer.from(search.toString(), 'utf8');
}

describe('twilioVerifier', () => {
  const url = 'https://example.com/webhooks/twilio/abc123';
  const params = {
    From: '+15551234567',
    To: '+15557654321',
    Body: 'hello',
    MessageSid: 'SM1234567890abcdef',
  };

  it('accepts a request with a valid signature', () => {
    const signature = signTwilio(url, params);
    const result = twilioVerifier(
      {
        headers: { 'x-twilio-signature': signature },
        rawBody: buildBody(params),
        query: {},
        url,
      },
      AUTH_TOKEN
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.payload as Record<string, string>).Body).toBe('hello');
    }
  });

  it('rejects a request with no signature header', () => {
    const result = twilioVerifier(
      { headers: {}, rawBody: buildBody(params), query: {}, url },
      AUTH_TOKEN
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it('rejects a tampered body', () => {
    const signature = signTwilio(url, params);
    const tampered = buildBody({ ...params, Body: 'tampered' });
    const result = twilioVerifier(
      {
        headers: { 'x-twilio-signature': signature },
        rawBody: tampered,
        query: {},
        url,
      },
      AUTH_TOKEN
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-signature');
      expect(result.status).toBe(401);
    }
  });

  it('rejects a signature computed with the wrong auth token', () => {
    const signature = signTwilio(url, params);
    const result = twilioVerifier(
      {
        headers: { 'x-twilio-signature': signature },
        rawBody: buildBody(params),
        query: {},
        url,
      },
      'WRONG_TOKEN'
    );
    expect(result.ok).toBe(false);
  });

  // F5 / F10: URL mismatch is the most likely live-test failure (tunnel
  // does not preserve x-forwarded-host). Verifier must surface the
  // signing-url it hashed so operators can debug.
  it('rejects a URL mismatch and surfaces signingUrl on failure (F5)', () => {
    const signature = signTwilio('https://public.tunnel.example/webhooks/twilio/abc123', params);
    const result = twilioVerifier(
      {
        headers: { 'x-twilio-signature': signature },
        rawBody: buildBody(params),
        query: {},
        url: 'http://localhost:51234/webhooks/twilio/abc123', // what the receiver saw
      },
      AUTH_TOKEN
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-signature');
      expect(result.signingUrl).toBe('http://localhost:51234/webhooks/twilio/abc123');
    }
  });

  // F10: pin the repeated-key behavior. URLSearchParams collapses to the
  // last value; this is the behavior the verifier signs against.
  it('collapses repeated form keys to the last value (F10)', () => {
    const rawBody = Buffer.from('Body=first&Body=second&MessageSid=SM1', 'utf8');
    // Sign against the collapsed view to confirm parity with the verifier.
    const signature = signTwilio(url, { Body: 'second', MessageSid: 'SM1' });
    const result = twilioVerifier(
      {
        headers: { 'x-twilio-signature': signature },
        rawBody,
        query: {},
        url,
      },
      AUTH_TOKEN
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.payload as Record<string, string>).Body).toBe('second');
    }
  });
});
