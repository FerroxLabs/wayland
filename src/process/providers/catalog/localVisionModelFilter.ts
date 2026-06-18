/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProviderId } from '../types';

/**
 * Local vision / VLM models a chat agent cannot drive (no image input wired for
 * the local OpenAI-compatible path). They show up in `/api/tags` and clutter the
 * picker with un-selectable rows, so we hide them from LOCAL catalogs only.
 *
 * Scoped to `ollama-local` (and an optional local OpenAI-compatible endpoint):
 * a remote provider may legitimately offer a "vision" chat model, so the filter
 * must never touch non-local catalogs.
 */
const VISION_MODEL_PATTERNS: readonly RegExp[] = [
  /(?:^|[-_.:/])vision(?:$|[-_.:/])/i,
  /(?:^|[-_.:/])vlm?(?:$|[-_.:/])/i,
  /llava/i,
  /bakllava/i,
  /moondream/i,
  /minicpm[-_.:/]?v/i,
  /internvl/i,
  /idefics/i,
  /pixtral/i,
  /paligemma/i,
  /cogvlm/i,
  /deepseek[-_.:/]?vl/i,
  /glm[-_.:/]?4v/i,
  /qwen[\w.-]*vl/i,
];

/**
 * True when `modelId` is a local vision/VLM model that should be hidden from a
 * LOCAL provider's catalog. Returns false for any non-local provider so remote
 * vision-capable chat models are never filtered.
 */
export function isUnsupportedLocalVisionModel(
  providerId: ProviderId,
  modelId: string,
  isLocalEndpoint = false
): boolean {
  if (providerId !== 'ollama-local' && !(providerId === 'openai-compatible' && isLocalEndpoint)) return false;
  return VISION_MODEL_PATTERNS.some((pattern) => pattern.test(modelId));
}
