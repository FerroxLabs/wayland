/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { twilioVerifier } from '@process/channels/webhook/verifiers/twilio';

const AUTH_TOKEN = 'twilio-auth-token-for-testing';

function signTwilio(url: string, params: Record<string, string>): string {
  const sorted = Object.keys(params).sort();
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
});
