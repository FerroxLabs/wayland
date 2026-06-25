import { afterEach, describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { buildRequestUrl } from '@process/channels/webhook/WebhookReceiver';

/**
 * Twilio signs the full public URL it POSTs to and the HMAC is computed over
 * that exact string. The URL must be reconstructed from the operator-configured
 * SERVER_BASE_URL, never from x-forwarded-host / host headers an upstream proxy
 * or a direct caller can spoof to forge a signature.
 */
function req(headers: Record<string, string>, originalUrl: string): Request {
  return { headers, originalUrl, url: originalUrl, protocol: 'http' } as unknown as Request;
}

describe('buildRequestUrl (webhook HMAC URL)', () => {
  afterEach(() => {
    delete process.env.SERVER_BASE_URL;
  });

  it('uses SERVER_BASE_URL origin and IGNORES a spoofed x-forwarded-host', () => {
    process.env.SERVER_BASE_URL = 'https://wayland.example.com';
    const url = buildRequestUrl(req({ 'x-forwarded-host': 'attacker.evil.com', host: 'attacker.evil.com' }, '/channels/twilio/webhook'));
    expect(url).toBe('https://wayland.example.com/channels/twilio/webhook');
    expect(url).not.toContain('attacker');
  });

  it('strips any path/trailing slash from SERVER_BASE_URL, keeping only the origin', () => {
    process.env.SERVER_BASE_URL = 'https://wayland.example.com/ignored/path';
    expect(buildRequestUrl(req({}, '/channels/twilio/webhook'))).toBe('https://wayland.example.com/channels/twilio/webhook');
  });

  it('falls back to request headers only when no SERVER_BASE_URL is configured', () => {
    const url = buildRequestUrl(req({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'box.local' }, '/w'));
    expect(url).toBe('https://box.local/w');
  });

  it('falls through to headers when SERVER_BASE_URL is malformed', () => {
    process.env.SERVER_BASE_URL = 'not a url';
    expect(buildRequestUrl(req({ host: 'box.local' }, '/w'))).toBe('http://box.local/w');
  });
});
