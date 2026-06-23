/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for the shared STT error taxonomy. classifySttStatus is a pure
 * status->code mapper; toSttError reads a failed provider response and returns
 * the Error to throw. Both are provider-neutral so OpenAI, Deepgram and Flux
 * Voice surface the same typed codes.
 */

import { describe, expect, it } from 'vitest';
import { classifySttStatus, toSttError } from '@/process/bridge/services/sttTaxonomy';

describe('classifySttStatus', () => {
  it('maps 401 and 403 to STT_AUTH', () => {
    expect(classifySttStatus(401)).toBe('STT_AUTH');
    expect(classifySttStatus(403)).toBe('STT_AUTH');
  });

  it('maps a generic 402 to STT_QUOTA', () => {
    expect(classifySttStatus(402)).toBe('STT_QUOTA');
  });

  it('preserves the Flux premium_locked distinction on 402', () => {
    expect(classifySttStatus(402, 'premium_locked')).toBe('STT_FLUX_PREMIUM_LOCKED');
  });

  it('maps 413 to STT_TOO_LARGE', () => {
    expect(classifySttStatus(413)).toBe('STT_TOO_LARGE');
  });

  it('maps 429 to STT_RATE_LIMITED', () => {
    expect(classifySttStatus(429)).toBe('STT_RATE_LIMITED');
  });

  it('maps any 5xx to STT_PROVIDER_DOWN', () => {
    expect(classifySttStatus(500)).toBe('STT_PROVIDER_DOWN');
    expect(classifySttStatus(503)).toBe('STT_PROVIDER_DOWN');
  });

  it('returns null for unclassified statuses so the caller can fall back', () => {
    expect(classifySttStatus(400)).toBeNull();
    expect(classifySttStatus(404)).toBeNull();
  });
});

describe('toSttError', () => {
  const json = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('returns the typed code for a classified status', async () => {
    const error = await toSttError(json(401, { error: { message: 'bad key' } }));
    expect(error.message).toBe('STT_AUTH');
  });

  it('preserves Flux premium_locked on 402', async () => {
    const error = await toSttError(json(402, { error: { code: 'premium_locked' } }));
    expect(error.message).toBe('STT_FLUX_PREMIUM_LOCKED');
  });

  it('falls back to STT_REQUEST_FAILED with the provider message for an unclassified status', async () => {
    const error = await toSttError(json(400, { error: { message: 'bad request' } }));
    expect(error.message).toBe('STT_REQUEST_FAILED:bad request');
  });

  it('falls back to status info when the error body is not JSON', async () => {
    const error = await toSttError(new Response('oops', { status: 418 }));
    expect(error.message.startsWith('STT_REQUEST_FAILED:')).toBe(true);
    expect(error.message).toContain('418');
  });
});
