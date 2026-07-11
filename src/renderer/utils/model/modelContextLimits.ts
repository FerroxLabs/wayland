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

  // Claude Code ACP "slot" aliases. The claude backend has no session/set_model
  // and only honors the three ANTHROPIC_MODEL aliases, so it reports its current
  // model as a bare SLOT (`opus`/`sonnet`/`haiku`) rather than a catalog id - see
  // CLAUDE_SLOT_MODELS in src/process/agent/acp/utils.ts. Without these rows the
  // context meter cannot size a window from what the agent actually reports and
  // silently falls back to DEFAULT_CONTEXT_LIMIT (1M) for EVERY slot - so Haiku
  // (really 200K) showed a 1M denominator. (#733)
  //
  // The fuzzy match is longest-key-wins, so these short keys never shadow a full
  // catalog id (`claude-3-opus` still resolves via its own 13-char key, not `opus`).
  //
  // Only slots whose window we can state with CONFIDENCE are listed:
  //   - `opus`: utils.ts verifies live that `--model opus` / `ANTHROPIC_MODEL=opus`
  //     resolve to claude-opus-4-8 → 1M.
  //   - `haiku`: version-independent - EVERY Haiku (4.5, 4.0, 3.5) is 200K, so the
  //     window holds whichever one the alias picks.
  // `sonnet` is deliberately OMITTED: its window depends on which Sonnet the alias
  // resolves to (4.6 is 1M, but 4.5/4.0 are 200K) and that is NOT verified anywhere
  // in-repo. Guessing 1M would show a 1M denominator for a 200K model - the exact
  // over-sized-max half of this bug. Omitted, it falls through to
  // DEFAULT_CONTEXT_LIMIT, i.e. today's behaviour - no better, but no new lie.
  // Verify the alias against the claude CLI (as was done for opus) before adding it.
  opus: 1_000_000, // → claude-opus-4-8 (verified)
  haiku: 200_000, // → any claude-haiku-* (all 200K)
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

/**
 * Resolve a model's context limit preferring the live registry catalog over
 * the static table above (#733).
 *
 * `catalogWindows` maps catalog model ids to their models.dev-enriched
 * `contextWindow` — the SAME source the model picker rows render ("1M
 * context"). The static `MODEL_CONTEXT_LIMITS` table is only a fallback: it
 * goes stale as providers ship new models, and its fuzzy substring match can
 * resolve a new/variant id to an older sibling's window (e.g. a dated Opus id
 * falling to the bare `claude-opus-4` 200K entry) while the picker shows the
 * correct 1M — the inconsistent denominator reported in #733.
 *
 * An id absent from the catalog (Flux routing aliases, disconnected
 * providers, unenriched models with no `contextWindow`) keeps the previous
 * static-table behavior, including its `DEFAULT_CONTEXT_LIMIT` fallback.
 */
export function resolveModelContextLimit(
  catalogWindows: ReadonlyMap<string, number>,
  modelName: string | undefined | null
): number {
  if (modelName) {
    const window = catalogWindows.get(modelName) ?? catalogWindows.get(modelName.toLowerCase());
    if (typeof window === 'number' && window > 0) {
      return window;
    }
  }
  return getModelContextLimit(modelName);
}
