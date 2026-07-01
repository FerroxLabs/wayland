/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Context window size configuration for known models
 */
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // Gemini family
  'gemini-3.1-pro-preview': 1_048_576,
  'gemini-3-pro-preview': 1_048_576,
  'gemini-3-flash-preview': 1_048_576,
  'gemini-3-pro-image-preview': 65_536,
  'gemini-2.5-pro': 1_048_576,
  'gemini-2.5-flash': 1_048_576,
  'gemini-2.5-flash-lite': 1_048_576,
  'gemini-2.5-flash-image': 32_768,
  'gemini-2.0-flash': 1_048_576,
  'gemini-2.0-flash-lite': 1_048_576,
  'gemini-1.5-pro': 2_097_152,
  'gemini-1.5-flash': 1_048_576,

  // OpenAI family
  'gpt-5.1': 400_000,
  'gpt-5.1-chat': 128_000,
  'gpt-5': 400_000,
  'gpt-5-chat': 128_000,
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  'gpt-4-turbo': 128_000,
  'gpt-4-turbo-preview': 128_000,
  'gpt-4': 8_192,
  'gpt-3.5-turbo': 16_385,
  'gpt-3.5-turbo-16k': 16_385,
  o1: 200_000,
  'o1-preview': 128_000,
  'o1-mini': 128_000,
  o3: 200_000,
  'o3-mini': 200_000,

  // Claude family. Keys use the real (hyphenated) catalog model ids the app
  // passes here, and values follow the models.dev provider snapshot
  // (resources/modelsdev-snapshot.json): only Opus 4.6+ and Sonnet 4.6 ship a
  // 1M window; Opus 4.0/4.1/4.5, Sonnet 4.0/4.5, and Haiku 4.x are 200K. The
  // bare `claude-opus-4` / `claude-sonnet-4` / `claude-haiku-4` entries are the
  // fuzzy fallback for dated or variant ids (e.g. `claude-opus-4-20250514`);
  // longest-match means the versioned keys above win for known 1M models.
  'claude-opus-4-8': 1_000_000,
  'claude-opus-4-7': 1_000_000,
  'claude-opus-4-6': 1_000_000,
  'claude-opus-4-5': 200_000,
  'claude-opus-4-1': 200_000,
  'claude-opus-4': 200_000,
  'claude-sonnet-4-6': 1_000_000,
  'claude-sonnet-4-5': 200_000,
  'claude-sonnet-4': 200_000,
  'claude-haiku-4-5': 200_000,
  'claude-haiku-4': 200_000,
  'claude-3-7-sonnet': 200_000,
  'claude-3-5-haiku': 200_000,
  'claude-3-5-sonnet': 200_000,
  'claude-3-opus': 200_000,
  'claude-3-sonnet': 200_000,
  'claude-3-haiku': 200_000,
};

/**
 * Default context limit (used when the model cannot be determined)
 */
export const DEFAULT_CONTEXT_LIMIT = 1_048_576;

/**
 * Get context limit by model name
 * Supports fuzzy matching, e.g. "gemini-2.5-pro-latest" matches "gemini-2.5-pro"
 */
export function getModelContextLimit(modelName: string | undefined | null): number {
  if (!modelName) return DEFAULT_CONTEXT_LIMIT;

  const lowerModelName = modelName.toLowerCase();

  // Exact match
  if (MODEL_CONTEXT_LIMITS[lowerModelName]) {
    return MODEL_CONTEXT_LIMITS[lowerModelName];
  }

  // Fuzzy match: find the longest matching model name
  let bestMatch = '';
  let bestLimit = DEFAULT_CONTEXT_LIMIT;

  for (const [key, limit] of Object.entries(MODEL_CONTEXT_LIMITS)) {
    if (lowerModelName.includes(key) && key.length > bestMatch.length) {
      bestMatch = key;
      bestLimit = limit;
    }
  }

  return bestLimit;
}
