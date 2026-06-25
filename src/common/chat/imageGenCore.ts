/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared image generation logic used by both:
 * - The built-in MCP server (imageGenServer.ts)
 * - The legacy Gemini-specific tool (img-gen.ts)
 */

import * as fs from 'fs';
import * as path from 'path';
import { jsonrepair } from 'jsonrepair';
import { AuthType } from '@office-ai/aioncli-core';
import type OpenAI from 'openai';
import { ClientFactory, type RotatingClient } from '@/common/api/ClientFactory';
import { OpenAIRotatingClient } from '@/common/api/OpenAIRotatingClient';
import type { TProviderWithModel } from '@/common/config/storage';
import type { UnifiedChatCompletionResponse } from '@/common/api/RotatingApiClient';
import { getProviderAuthType } from '@/common/utils/platformAuthType';
import { FLUX_PROVIDER_ID } from '@/common/config/flux';
import { FLUX_RECOMMENDED_IMAGE_ID, FLUX_IMAGE_ARMS } from '@/common/config/imageModels';
import { IMAGE_EXTENSIONS, MIME_TYPE_MAP, MIME_TO_EXT_MAP, DEFAULT_IMAGE_EXTENSION } from '@/common/config/constants';

// Copyright 2026 Ferrox Labs

const API_TIMEOUT_MS = 120000; // 2 minutes for image generation API calls

// ===== FAL.ai Provider =====

const FAL_FLUX_ENDPOINT = 'https://fal.run/fal-ai/flux-2-pro';
const FAL_UPSCALER_ENDPOINT = 'https://fal.run/fal-ai/clarity-upscaler';

export type FalOpts = {
  upscale?: boolean;
  /**
   * Injects the FAL API key. Defaults to reading from the encrypted secret
   * store via `decryptString` + the stored `falApiKey` credential. In tests,
   * pass a sync function that returns the key directly.
   */
  getApiKey?: () => string;
  /** Injectable fetch for testing. Defaults to `globalThis.fetch`. */
  fetchFn?: typeof globalThis.fetch;
};

export type FalResult = {
  imageUrl: string;
  upscaledUrl?: string;
};

/**
 * Generates an image via FAL.ai FLUX 2 Pro, optionally post-processing
 * through the Clarity upscaler. API key is read from the encrypted secret
 * store unless overridden by `opts.getApiKey` (used in tests).
 */
export async function generateWithFal(prompt: string, opts: FalOpts = {}): Promise<FalResult> {
  const { upscale = false, fetchFn = globalThis.fetch } = opts;

  const apiKey = opts.getApiKey
    ? opts.getApiKey()
    : (() => {
        // Lazy import to avoid pulling Electron into renderer/worker bundles.
        // This path only runs in the main process where safeStorage is available.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { decryptString } = require('@process/secrets') as typeof import('../../../src/process/secrets/index');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const db = require('@process/services/database') as { getSystemSetting: (key: string) => string | undefined };
        const stored = db.getSystemSetting('falApiKey');
        if (!stored) throw new Error('[FAL] falApiKey not configured in secret store');
        return decryptString(stored);
      })();

  if (!apiKey) throw new Error('[FAL] falApiKey resolved to empty string');

  const authHeader = `Key ${apiKey}`;

  const genResponse = await fetchFn(FAL_FLUX_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify({ prompt }),
  });

  if (!genResponse.ok) {
    const body = await genResponse.text();
    throw new Error(`[FAL] FLUX 2 Pro request failed (${genResponse.status}): ${body}`);
  }

  const genJson = (await genResponse.json()) as { images?: Array<{ url: string }>; image?: { url: string } };
  const imageUrl =
    genJson.images?.[0]?.url ?? genJson.image?.url ?? (() => { throw new Error('[FAL] No image URL in FLUX response'); })();

  if (!upscale) {
    return { imageUrl };
  }

  const upscaleResponse = await fetchFn(FAL_UPSCALER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  if (!upscaleResponse.ok) {
    const body = await upscaleResponse.text();
    throw new Error(`[FAL] Clarity upscaler request failed (${upscaleResponse.status}): ${body}`);
  }

  const upscaleJson = (await upscaleResponse.json()) as { image?: { url: string }; output?: { image_url: string } };
  const upscaledUrl =
    upscaleJson.image?.url ??
    upscaleJson.output?.image_url ??
    (() => { throw new Error('[FAL] No image URL in upscaler response'); })();

  return { imageUrl, upscaledUrl };
}

type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];

// ===== Utility Functions =====

export function safeJsonParse<T = unknown>(jsonString: string, fallbackValue: T): T {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallbackValue;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (_error) {
    try {
      const repairedJson = jsonrepair(jsonString);
      return JSON.parse(repairedJson) as T;
    } catch (_repairError) {
      console.warn('[ImageGen] JSON parse failed:', jsonString.substring(0, 50));
      return fallbackValue;
    }
  }
}

export function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext as ImageExtension);
}

export function isHttpUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://');
}

export async function fileToBase64(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
      throw new Error(`Image file not found: ${filePath}`, { cause: error });
    }
    throw new Error(`Failed to read image file: ${errorMessage}`, { cause: error });
  }
}

export function getImageMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPE_MAP[ext] || MIME_TYPE_MAP[DEFAULT_IMAGE_EXTENSION];
}

export function getFileExtensionFromDataUrl(dataUrl: string): string {
  const mimeTypeMatch = dataUrl.match(/^data:image\/([^;]+);base64,/);
  if (mimeTypeMatch && mimeTypeMatch[1]) {
    const mimeType = mimeTypeMatch[1].toLowerCase();
    return MIME_TO_EXT_MAP[mimeType] || DEFAULT_IMAGE_EXTENSION;
  }
  return DEFAULT_IMAGE_EXTENSION;
}

export async function saveGeneratedImage(base64Data: string, workspaceDir: string): Promise<string> {
  const timestamp = Date.now();
  const fileExtension = getFileExtensionFromDataUrl(base64Data);
  const fileName = `img-${timestamp}${fileExtension}`;
  const filePath = path.join(workspaceDir, fileName);

  const base64WithoutPrefix = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
  const imageBuffer = Buffer.from(base64WithoutPrefix, 'base64');

  try {
    await fs.promises.writeFile(filePath, imageBuffer);
    return filePath;
  } catch (error) {
    console.error('[ImageGen] Failed to save image file:', error);
    throw new Error(`Failed to save image: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
}

// ===== Image Content Processing =====

interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail: 'auto' | 'low' | 'high';
  };
}

export async function processImageUri(imageUri: string, workspaceDir: string): Promise<ImageContent | null> {
  if (isHttpUrl(imageUri)) {
    return {
      type: 'image_url',
      image_url: { url: imageUri, detail: 'auto' },
    };
  }

  let processedUri = imageUri;
  if (imageUri.startsWith('@')) {
    processedUri = imageUri.substring(1);
  }

  let fullPath = processedUri;
  if (!path.isAbsolute(processedUri)) {
    fullPath = path.join(workspaceDir, processedUri);
  }

  try {
    await fs.promises.access(fullPath, fs.constants.F_OK);

    if (!isImageFile(fullPath)) {
      throw new Error(`File is not a supported image type: ${fullPath}`);
    }

    const base64Data = await fileToBase64(fullPath);
    const mimeType = getImageMimeType(fullPath);
    return {
      type: 'image_url',
      image_url: { url: `data:${mimeType};base64,${base64Data}`, detail: 'auto' },
    };
  } catch (error) {
    const possiblePaths = [imageUri, path.join(workspaceDir, imageUri)].filter((p, i, arr) => arr.indexOf(p) === i);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('Image file not found') || errorMessage.includes('not a supported image type')) {
      throw error;
    }

    throw new Error(
      `Image file not found. Searched paths:\n${possiblePaths.map((p) => `- ${p}`).join('\n')}\n\nPlease ensure the image file exists and has a valid image extension (.jpg, .png, .gif, .webp, etc.)`,
      { cause: error }
    );
  }
}

// ===== Core Execution =====

export interface ImageGenParams {
  prompt: string;
  image_uris?: string[] | string;
}

export interface ImageGenResult {
  success: boolean;
  text: string;
  imagePath?: string;
  relativeImagePath?: string;
  error?: string;
}

/**
 * OpenAI native image-model id pattern. Covers `gpt-image-1`, `gpt-image-2`,
 * `gpt-image-1-mini`, `gpt-image-1.5`, `chatgpt-image-latest`, `dall-e-3`,
 * `dall-e-2`. Deliberately anchored so it does NOT catch OpenRouter ids like
 * `openai/gpt-5-image`, Gemini ids (`gemini-2.5-flash-image`), or `flux-image`.
 */
const OPENAI_IMAGE_MODEL_RE = /^(gpt-image|dall-e|chatgpt-image)/i;

/**
 * True only for OpenAI's native Images API (`v1/images/generations`). These
 * models 404 on `v1/chat/completions`, so they must route through
 * `client.images.generate` instead of the chat path used by Gemini/OpenRouter
 * image models (which return images inline in the chat response).
 *
 * Three conditions, all required:
 *  1. Provider resolves to the OpenAI protocol (USE_OPENAI auth type).
 *  2. The provider's baseUrl targets the official OpenAI host. OpenRouter and
 *     other OpenAI-compatible gateways also use USE_OPENAI but do NOT serve the
 *     Images API, so the host check keeps them on the chat path.
 *  3. The model id matches the OpenAI Images-API naming pattern.
 */
export function isOpenAINativeImageModel(provider: TProviderWithModel): boolean {
  if (getProviderAuthType(provider) !== AuthType.USE_OPENAI) return false;
  if (!OPENAI_IMAGE_MODEL_RE.test(provider.useModel || '')) return false;

  const baseUrl = provider.baseUrl || '';
  let host: string;
  try {
    host = new URL(baseUrl).host.toLowerCase();
  } catch {
    return false;
  }
  return host === 'api.openai.com';
}

/**
 * Generation via the OpenAI Images API (`client.images.generate`). gpt-image-1
 * returns base64-encoded images by default and rejects `response_format`, so we
 * send only model/prompt/n and never pass `response_format` or a model-specific
 * `size`. Handles both `b64_json` (gpt-image-*) and `url` (dall-e-*) responses.
 */
async function executeOpenAINativeImageGen(
  params: ImageGenParams,
  provider: TProviderWithModel,
  workspaceDir: string,
  proxy: string | undefined,
  hasInputImages: boolean,
  signal?: AbortSignal
): Promise<ImageGenResult> {
  if (hasInputImages) {
    return {
      success: false,
      text: `OpenAI image editing with input images is not yet supported through this path. Generation (no input images) works; for edits, use a Gemini or OpenRouter image model, or omit the input image. Model: ${provider.useModel}`,
      error: 'openai-image-edit-unsupported',
    };
  }

  const rotatingClient: RotatingClient = await ClientFactory.createRotatingClient(provider, {
    proxy,
    rotatingOptions: { maxRetries: 3, retryDelay: 1000 },
  });

  if (!(rotatingClient instanceof OpenAIRotatingClient)) {
    return {
      success: false,
      text: `Image generation client is not an OpenAI client for model ${provider.useModel}.`,
      error: 'client-mismatch',
    };
  }

  const response = await rotatingClient.createImage(
    { model: provider.useModel, prompt: params.prompt, n: 1 },
    { signal, timeout: API_TIMEOUT_MS }
  );

  const first = response.data?.[0];
  if (!first) {
    return { success: false, text: 'OpenAI Images API returned no image data.', error: 'No image data' };
  }

  let dataUrl: string;
  if (first.b64_json) {
    dataUrl = `data:image/png;base64,${first.b64_json}`;
  } else if (first.url) {
    const fetchResponse = await globalThis.fetch(first.url, { signal });
    if (!fetchResponse.ok) {
      return {
        success: false,
        text: `Failed to download generated image (${fetchResponse.status}).`,
        error: `image-download-${fetchResponse.status}`,
      };
    }
    const arrayBuffer = await fetchResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    dataUrl = `data:image/png;base64,${base64}`;
  } else {
    return { success: false, text: 'OpenAI Images API returned neither b64_json nor url.', error: 'No image payload' };
  }

  const imagePath = await saveGeneratedImage(dataUrl, workspaceDir);
  const relativeImagePath = path.relative(workspaceDir, imagePath);

  return {
    success: true,
    text: `Image generated successfully.\n\nGenerated image saved to: ${imagePath}`,
    imagePath,
    relativeImagePath,
  };
}

// ===== Flux Router image provider =====

/** FluxRouter's host. Flux images ride a dedicated OpenAI-Images-compatible endpoint. */
const FLUX_IMAGE_HOST = 'api.fluxrouter.ai';

/**
 * True when the provider is FluxRouter. Flux serves images on a dedicated
 * `POST /v1/images/generations` endpoint (OpenAI-Images-shaped), NOT on
 * chat/completions, and its host is never `api.openai.com` so it fails
 * `isOpenAINativeImageModel`.
 *
 * The MCP subprocess only sees `platform`/`baseUrl`/`useModel` from env, and the
 * real connected Flux provider arrives as `platform: 'openai-compatible'` with
 * an EMPTY baseUrl - so host/platform alone do not identify it. The reliable
 * signal here is the model id: `flux-image` and the Flux arm ids are
 * Flux-specific. (Host/platform still match direct or differently-shaped rows.)
 */
export function isFluxImagesProvider(provider: TProviderWithModel): boolean {
  if ((provider.platform || '') === FLUX_PROVIDER_ID) return true;
  if ((FLUX_IMAGE_ARMS as readonly string[]).includes(provider.useModel || '')) return true;
  const baseUrl = provider.baseUrl || '';
  try {
    return new URL(baseUrl).host.toLowerCase() === FLUX_IMAGE_HOST;
  } catch {
    return false;
  }
}

type FluxImageErrorBody = { error?: { message?: string; code?: string } | string };

function fluxImageError(text: string, error: string): ImageGenResult {
  return { success: false, text, error };
}

/**
 * Maps a non-2xx Flux images response to a clear, honest result. Per the
 * capabilities contract (§3.6) the gating failures (402/403/502) are
 * **no-bill** - the message says so explicitly so a misconfigured key or arm
 * reads as a clear paid-feature/setup problem rather than a silent dead end.
 */
function mapFluxImageError(status: number, body: FluxImageErrorBody | undefined): ImageGenResult {
  const errObj = body?.error;
  const code = typeof errObj === 'object' && errObj ? errObj.code : undefined;
  const apiMsg =
    typeof errObj === 'object' && errObj ? errObj.message : typeof errObj === 'string' ? errObj : undefined;

  if (status === 401) {
    return fluxImageError(
      'Flux key is invalid or expired. Reconnect Flux in Settings > Providers.',
      'flux-unauthorized'
    );
  }
  if (status === 402 && code === 'premium_locked') {
    return fluxImageError(
      'Image generation needs a paid Flux plan with a cleared charge. Upgrade or clear a charge, then try again. No charge was made.',
      'premium_locked'
    );
  }
  if (status === 402 && (code === 'price_exceeds_max_price' || (apiMsg ? /price/i.test(apiMsg) : false))) {
    return fluxImageError(
      'The image exceeded the price ceiling and was not generated. No charge was made.',
      'price_exceeds_max_price'
    );
  }
  if (status === 402 && code === 'spend_ceiling_unresolved') {
    return fluxImageError(
      'This Flux account needs a payment method before it can generate images. No charge was made.',
      'spend_ceiling_unresolved'
    );
  }
  if (status === 402) {
    return fluxImageError(
      `Image generation requires a paid Flux plan${apiMsg ? `: ${apiMsg}` : '.'} No charge was made.`,
      'premium_locked'
    );
  }
  if (status === 403) {
    return fluxImageError(
      'This image arm needs a verified OpenAI organization behind Flux. Pick a non gpt-image arm (e.g. Nano Banana) or verify the organization. No charge was made.',
      'organization_must_be_verified'
    );
  }
  if (status === 502 || status === 503) {
    return fluxImageError('The Flux image provider failed. No charge was made. Try again.', 'flux-image-provider-error');
  }
  return fluxImageError(
    `Flux image generation failed (${status})${apiMsg ? `: ${apiMsg}` : ''}.`,
    `flux-image-${status}`
  );
}

/**
 * Generation via FluxRouter's images endpoint (`POST /v1/images/generations`).
 * Raw fetch (not the OpenAI SDK) so we keep full control of the per-arm
 * `data[i]` shape, the `_flux.synthid_notice` watermark echo (Gemini arms), and
 * the typed 402/403 bodies the SDK would swallow. We send only `model/prompt/n`
 * and never `response_format` (gpt-image arms reject it; b64_json is the default
 * for every arm) and keep `n=1` (contract §3.7: ~60s sync timeout per call).
 */
export async function executeFluxImageGen(
  params: ImageGenParams,
  provider: TProviderWithModel,
  workspaceDir: string,
  hasInputImages: boolean,
  signal?: AbortSignal,
  fetchFn: typeof globalThis.fetch = globalThis.fetch
): Promise<ImageGenResult> {
  if (hasInputImages) {
    return fluxImageError(
      `Flux image generation does not support editing input images yet. Remove the input image to generate from a prompt, or use a Gemini image model for edits. Model: ${provider.useModel}`,
      'flux-image-edit-unsupported'
    );
  }

  const baseUrl = (provider.baseUrl || `https://${FLUX_IMAGE_HOST}/v1`).replace(/\/+$/, '');
  const endpoint = `${baseUrl}/images/generations`;

  // "Flux Image" (the recommended default) is not a literal arm - it means
  // "use whatever the user set as their default in the Flux members area". So
  // omit the model entirely and let Flux resolve the account default. A pinned
  // concrete arm id is sent verbatim instead. Either way: n=1, never
  // response_format (gpt-image arms reject it).
  const isAccountDefault = provider.useModel === FLUX_RECOMMENDED_IMAGE_ID;
  const requestBody = isAccountDefault
    ? { prompt: params.prompt, n: 1 }
    : { model: provider.useModel, prompt: params.prompt, n: 1 };

  let response: Response;
  try {
    response = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify(requestBody),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      return fluxImageError('Image generation was cancelled.', 'cancelled');
    }
    const message = error instanceof Error ? error.message : String(error);
    return fluxImageError(`Flux image request failed: ${message}`, 'flux-image-network');
  }

  if (!response.ok) {
    let body: FluxImageErrorBody | undefined;
    try {
      body = (await response.json()) as FluxImageErrorBody;
    } catch {
      body = undefined;
    }
    return mapFluxImageError(response.status, body);
  }

  const json = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
    _flux?: { synthid_notice?: string };
  };

  const first = json.data?.[0];
  if (!first) {
    return fluxImageError('Flux images API returned no image data.', 'flux-image-empty');
  }

  let dataUrl: string;
  if (first.b64_json) {
    dataUrl = `data:image/png;base64,${first.b64_json}`;
  } else if (first.url) {
    const fetchResponse = await fetchFn(first.url, { signal });
    if (!fetchResponse.ok) {
      return fluxImageError(
        `Failed to download generated image (${fetchResponse.status}).`,
        `flux-image-download-${fetchResponse.status}`
      );
    }
    const arrayBuffer = await fetchResponse.arrayBuffer();
    dataUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
  } else {
    return fluxImageError('Flux images API returned neither b64_json nor url.', 'flux-image-no-payload');
  }

  const imagePath = await saveGeneratedImage(dataUrl, workspaceDir);
  const relativeImagePath = path.relative(workspaceDir, imagePath);

  const synthIdNotice = json._flux?.synthid_notice;
  const text =
    `Image generated successfully.\n\nGenerated image saved to: ${imagePath}` +
    (synthIdNotice ? `\n\n${synthIdNotice}` : '');

  return { success: true, text, imagePath, relativeImagePath };
}

/**
 * Core image generation function shared between MCP server and Gemini tool.
 */
export async function executeImageGeneration(
  params: ImageGenParams,
  provider: TProviderWithModel,
  workspaceDir: string,
  proxy?: string,
  signal?: AbortSignal
): Promise<ImageGenResult> {
  if (signal?.aborted) {
    return { success: false, text: 'Image generation was cancelled.', error: 'cancelled' };
  }

  try {
    // Parse image URIs
    let imageUris: string[] = [];
    if (params.image_uris) {
      if (typeof params.image_uris === 'string') {
        const parsed = safeJsonParse<string[]>(params.image_uris, null);
        imageUris = Array.isArray(parsed) ? parsed : [params.image_uris];
      } else if (Array.isArray(params.image_uris)) {
        imageUris = params.image_uris;
      }
    }

    const hasImages = imageUris.length > 0;

    // FluxRouter serves images on its own OpenAI-Images-compatible endpoint
    // (`/v1/images/generations`), never on chat/completions. Route it first -
    // its host (`api.fluxrouter.ai`) excludes it from the OpenAI-native path
    // below, and the chat path can't produce an image for it.
    if (isFluxImagesProvider(provider)) {
      return await executeFluxImageGen(params, provider, workspaceDir, hasImages, signal);
    }

    // OpenAI native image models (gpt-image-*, dall-e-*, chatgpt-image-*) use the
    // Images API, not chat/completions (which 404s for them). Route them before
    // building the chat-style payload. Gemini/OpenRouter image models fall
    // through to the chat-completions path below, unchanged.
    if (isOpenAINativeImageModel(provider)) {
      return await executeOpenAINativeImageGen(params, provider, workspaceDir, proxy, hasImages, signal);
    }

    let enhancedPrompt: string;
    if (hasImages) {
      enhancedPrompt = `Analyze/Edit image: ${params.prompt}`;
    } else {
      enhancedPrompt = `Generate image: ${params.prompt}`;
    }

    const contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: 'text', text: enhancedPrompt }];

    // Process image URIs
    if (hasImages) {
      const imageResults = await Promise.allSettled(imageUris.map((uri) => processImageUri(uri, workspaceDir)));

      const successful: ImageContent[] = [];
      const errors: string[] = [];

      imageResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successful.push(result.value);
        } else {
          const error = result.status === 'rejected' ? result.reason : 'Unknown error';
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Image ${index + 1} (${imageUris[index]}): ${errorMessage}`);
        }
      });

      successful.forEach((imageContent) => contentParts.push(imageContent));

      if (successful.length === 0) {
        return {
          success: false,
          text: `Error: Failed to process any images. Errors:\n${errors.join('\n')}`,
          error: errors.join('\n'),
        };
      }
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: 'user', content: contentParts }];

    // Create client and call API
    const rotatingClient: RotatingClient = await ClientFactory.createRotatingClient(provider, {
      proxy,
      rotatingOptions: { maxRetries: 3, retryDelay: 1000 },
    });

    const completion: UnifiedChatCompletionResponse = await rotatingClient.createChatCompletion(
      { model: provider.useModel, messages: messages as any },
      { signal, timeout: API_TIMEOUT_MS }
    );

    const choice = completion.choices[0];
    if (!choice) {
      return { success: false, text: 'No response from image generation API', error: 'No response' };
    }

    const responseText = choice.message.content || 'Image generated successfully.';
    let images = choice.message.images;

    // Extract images from markdown in content if not in images field
    if ((!images || images.length === 0) && responseText) {
      const dataUrlRegex = /!\[[^\]]*\]\((data:image\/[^;]+;base64,[^)]+)\)/g;
      const dataUrlMatches = [...responseText.matchAll(dataUrlRegex)];
      if (dataUrlMatches.length > 0) {
        images = dataUrlMatches.map((match) => ({
          type: 'image_url' as const,
          image_url: { url: match[1] },
        }));
      } else {
        const filePathRegex = /!\[[^\]]*\]\(([^)]+\.(?:jpg|jpeg|png|gif|webp|bmp|tiff|svg))\)/gi;
        const filePathMatches = [...responseText.matchAll(filePathRegex)];
        if (filePathMatches.length > 0) {
          const processedImages: Array<{ type: 'image_url'; image_url: { url: string } }> = [];
          for (const match of filePathMatches) {
            const filePath = match[1];
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workspaceDir, filePath);
            try {
              await fs.promises.access(fullPath);
              const base64Data = await fileToBase64(fullPath);
              const mimeType = getImageMimeType(fullPath);
              processedImages.push({
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              });
            } catch (_fileError) {
              console.warn(`[ImageGen] Could not load image file: ${filePath}`);
            }
          }
          if (processedImages.length > 0) {
            images = processedImages;
          }
        }
      }
    }

    if (!images || images.length === 0) {
      const warningMessage = `Image generation did not produce any images.\n\nModel response: ${responseText}\n\nTip: Make sure your image generation model supports this type of request. Current model: ${provider.useModel}`;
      return { success: true, text: warningMessage };
    }

    const firstImage = images[0];
    if (firstImage.type === 'image_url' && firstImage.image_url?.url) {
      const imagePath = await saveGeneratedImage(firstImage.image_url.url, workspaceDir);
      const relativeImagePath = path.relative(workspaceDir, imagePath);

      // Strip any inline base64 data URLs from the human-readable text before
      // returning. The image is already saved to disk and referenced by path,
      // so re-emitting hundreds of MB of base64 in the MCP tool response just
      // forces the parent process to ship that payload through framed TCP again
      // (which is where the 2026-04-14 commit-charge blow-up happened).
      const cleanText = responseText.replace(
        /!\[[^\]]*\]\(data:image\/[^;]+;base64,[^)]+\)/g,
        '[embedded image extracted]'
      );

      return {
        success: true,
        text: `${cleanText}\n\nGenerated image saved to: ${imagePath}`,
        imagePath,
        relativeImagePath,
      };
    }

    return { success: true, text: responseText };
  } catch (error) {
    if (signal?.aborted) {
      return { success: false, text: 'Image generation was cancelled.', error: 'cancelled' };
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ImageGen] API call failed:`, error);
    return { success: false, text: `Error generating image: ${errorMessage}`, error: errorMessage };
  }
}
