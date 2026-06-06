/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { whatsappVerifier } from '@process/channels/webhook/verifiers/whatsapp';

const APP_SECRET = 'whatsapp-app-secret-for-testing';

function signWhatsApp(rawBody: Buffer): string {
  return 'sha256=' + createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
}

describe('whatsappVerifier', () => {
  const url = 'https://example.com/webhooks/whatsapp/abc123';

  describe('POST event delivery', () => {
    const body = Buffer.from(
      JSON.stringify({
        entry: [{ id: 'page-1', changes: [{ value: { messages: [{ id: 'msg-1' }] } }] }],
      })
    );

    it('accepts a request with a valid X-Hub-Signature-256', () => {
      const sig = signWhatsApp(body);
      const result = whatsappVerifier(
        {
          headers: { 'x-hub-signature-256': sig },
          rawBody: body,
          query: {},
          url,
        },
        APP_SECRET
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.eventId).toBe('page-1');
    });

    it('rejects a tampered body', () => {
      const sig = signWhatsApp(body);
      const tampered = Buffer.from(JSON.stringify({ entry: [{ id: 'page-1', tampered: true }] }));
      const result = whatsappVerifier(
        {
          headers: { 'x-hub-signature-256': sig },
          rawBody: tampered,
          query: {},
          url,
        },
        APP_SECRET
      );
      expect(result.ok).toBe(false);
    });

    it('rejects a missing signature header', () => {
      const result = whatsappVerifier({ headers: {}, rawBody: body, query: {}, url }, APP_SECRET);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(401);
    });
  });

  describe('GET subscription challenge', () => {
    it('returns the challenge when verify_token matches the secret', () => {
      const result = whatsappVerifier(
        {
          headers: {},
          rawBody: Buffer.from(''),
          query: {
            'hub.mode': 'subscribe',
            'hub.verify_token': APP_SECRET,
            'hub.challenge': '987654321',
          },
          url,
        },
        APP_SECRET
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect((result.payload as { __challenge?: string }).__challenge).toBe('987654321');
      }
    });

    it('rejects when verify_token mismatches', () => {
      const result = whatsappVerifier(
        {
          headers: {},
          rawBody: Buffer.from(''),
          query: {
            'hub.mode': 'subscribe',
            'hub.verify_token': 'WRONG',
            'hub.challenge': '987654321',
          },
          url,
        },
        APP_SECRET
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('invalid-verify-token');
        expect(result.status).toBe(403);
      }
    });
  });
});
