/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProviderId } from '../types';

const LOCAL_MODEL_PROVIDERS = new Set<ProviderId>(['ollama-local', 'openai-compatible']);

const VISION_MODEL_PATTERNS: RegExp[] = [
  /(?:^|[-_.:/])vision(?:$|[-_.:/])/i,
  /(?:^|[-_.:/])vl(?:$|[-_.:/])/i,
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

export function isUnsupportedLocalVisionModel(providerId: ProviderId, modelId: string): boolean {
  if (!LOCAL_MODEL_PROVIDERS.has(providerId)) return false;
  return VISION_MODEL_PATTERNS.some((pattern) => pattern.test(modelId));
}
