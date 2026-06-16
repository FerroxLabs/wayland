/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProviderId } from '../types';

const VISION_MODEL_PATTERNS: RegExp[] = [
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

export function isUnsupportedLocalVisionModel(
  providerId: ProviderId,
  modelId: string,
  isLocalEndpoint = false
): boolean {
  if (providerId !== 'ollama-local' && !(providerId === 'openai-compatible' && isLocalEndpoint)) return false;
  return VISION_MODEL_PATTERNS.some((pattern) => pattern.test(modelId));
}
