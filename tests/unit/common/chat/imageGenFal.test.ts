/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { generateWithFal } from '@/common/chat/imageGenCore';

const FAKE_API_KEY = 'test-fal-key-abc123';
const FLUX_ENDPOINT = 'https://fal.run/fal-ai/flux-2-pro';
const UPSCALER_ENDPOINT = 'https://fal.run/fal-ai/clarity-upscaler';

/** Fake key injector - stands in for the encrypted secret store. */
function fakeGetApiKey(): string {
  return FAKE_API_KEY;
}

function makeFluxResponse(imageUrl: string): Response {
  return new Response(JSON.stringify({ images: [{ url: imageUrl }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeUpscalerResponse(imageUrl: string): Response {
  return new Response(JSON.stringify({ image: { url: imageUrl } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('generateWithFal', () => {
  it('sends request to FLUX endpoint with prompt in body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makeFluxResponse('https://cdn.fal.ai/img1.png'));

    await generateWithFal('a cat in space', { getApiKey: fakeGetApiKey, fetchFn });

    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(FLUX_ENDPOINT);
    expect(JSON.parse(init.body as string)).toMatchObject({ prompt: 'a cat in space' });
  });

  it('sends Authorization header using the API key from the secret store', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makeFluxResponse('https://cdn.fal.ai/img2.png'));

    await generateWithFal('portrait', { getApiKey: fakeGetApiKey, fetchFn });

    const [, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe(`Key ${FAKE_API_KEY}`);
  });

  it('makes a second request to the upscaler endpoint when upscale: true, passing the first response image URL', async () => {
    const generatedUrl = 'https://cdn.fal.ai/gen.png';
    const upscaledUrl = 'https://cdn.fal.ai/upscaled.png';

    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(makeFluxResponse(generatedUrl))
      .mockResolvedValueOnce(makeUpscalerResponse(upscaledUrl));

    const result = await generateWithFal('landscape', { upscale: true, getApiKey: fakeGetApiKey, fetchFn });

    expect(fetchFn).toHaveBeenCalledTimes(2);
    const [upscalerUrl, upscalerInit] = fetchFn.mock.calls[1] as [string, RequestInit];
    expect(upscalerUrl).toBe(UPSCALER_ENDPOINT);
    expect(JSON.parse(upscalerInit.body as string)).toMatchObject({ image_url: generatedUrl });
    expect(result.upscaledUrl).toBe(upscaledUrl);
    expect(result.imageUrl).toBe(generatedUrl);
  });

  it('makes no upscaler request when upscale is false or absent', async () => {
    const fetchFn = vi.fn().mockResolvedValue(makeFluxResponse('https://cdn.fal.ai/img3.png'));

    const resultDefault = await generateWithFal('tree', { getApiKey: fakeGetApiKey, fetchFn });
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(resultDefault.upscaledUrl).toBeUndefined();

    fetchFn.mockClear();
    fetchFn.mockResolvedValue(makeFluxResponse('https://cdn.fal.ai/img4.png'));

    const resultExplicit = await generateWithFal('tree', { upscale: false, getApiKey: fakeGetApiKey, fetchFn });
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(resultExplicit.upscaledUrl).toBeUndefined();
  });
});
