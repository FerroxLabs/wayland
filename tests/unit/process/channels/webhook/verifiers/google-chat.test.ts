/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Folder-organization sibling for the Google Chat webhook verifier.
 *
 * The full verifier test suite lives next to the plugin source at
 *   tests/unit/process/channels/plugins/tier3/google-chat/GoogleChatVerifier.test.ts
 * to keep verifier + plugin behaviour reviewed as one unit. This file mirrors
 * a discoverability smoke test alongside the other webhook verifier siblings
 * (discord.test.ts, slack.test.ts, twilio.test.ts, whatsapp.test.ts) so the
 * verifier folder is consistent.
 */

import { describe, expect, it, vi } from 'vitest';

// vitest 4 mock hoisting: vi.hoisted + vi.mock at MODULE top.
const { mockJwtVerify } = vi.hoisted(() => ({
  mockJwtVerify: vi.fn(),
}));

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return {
    ...actual,
    createRemoteJWKSet: vi.fn(() => 'mock-jwks-keyset'),
    jwtVerify: mockJwtVerify,
  };
});

import {
  googleChatVerifier,
  verifyGoogleChatJwt,
} from '@process/channels/webhook/verifiers/google-chat';

const AUDIENCE = '123456789012';
const FAKE_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.fake.token';

describe('google-chat verifier - sibling smoke', () => {
  it('exports the canonical verifier surface used by WebhookReceiver', () => {
    expect(typeof googleChatVerifier).toBe('function');
    expect(typeof verifyGoogleChatJwt).toBe('function');
  });

  it('accepts a well-formed Bearer JWT and parses the body', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { iss: 'chat@system.gserviceaccount.com', aud: AUDIENCE },
    });
    const body = JSON.stringify({
      type: 'MESSAGE',
      space: { name: 'spaces/AAA' },
      message: { name: 'spaces/AAA/messages/M1', text: 'hi' },
    });
    const result = await googleChatVerifier(
      {
        headers: { authorization: `Bearer ${FAKE_TOKEN}` },
        rawBody: Buffer.from(body, 'utf8'),
        query: {},
        url: '/webhooks/google-chat/tok',
      },
      AUDIENCE,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.eventId).toBe('spaces/AAA/messages/M1');
  });

  it('refuses requests without a Bearer Authorization header', async () => {
    const result = await googleChatVerifier(
      {
        headers: {},
        rawBody: Buffer.from('{}'),
        query: {},
        url: '/webhooks/google-chat/tok',
      },
      AUDIENCE,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('missing-bearer-token');
  });

  it('refuses requests when the configured audience is empty', async () => {
    const result = await googleChatVerifier(
      {
        headers: { authorization: `Bearer ${FAKE_TOKEN}` },
        rawBody: Buffer.from('{}'),
        query: {},
        url: '/webhooks/google-chat/tok',
      },
      '',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('audience-not-configured');
  });
});
