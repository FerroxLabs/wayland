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
  'claude-sonnet-5': 1_000_000,
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
  // meter cannot size a window from what the agent actually reports and falls back
  // to DEFAULT_CONTEXT_LIMIT for EVERY slot - so Haiku (really 200K) showed a ~1M
  // denominator. (#733)
  //
  // Each alias is resolved LIVE against the claude CLI (`ANTHROPIC_MODEL=<slot>`,
  // verified 2026-07-11):
  //   opus   -> claude-opus-4-8            -> 1M
  //   sonnet -> claude-sonnet-5            -> 1M   (#802)
  //   haiku  -> claude-haiku-4-5-20251001  -> 200K
  //
  // These short keys stay in the FUZZY table ON PURPOSE. Real catalog ids like
  // `claude-4.5-haiku`, `anthropic/claude-haiku-latest` and `duo-chat-haiku-4-5`
  // match NONE of the `claude-haiku-*` keys above and reach 200K only through the
  // bare `haiku` key. Moving the slots to an exact-match-only table sounds safer
  // but is strictly worse: those ids then fall through to DEFAULT_CONTEXT_LIMIT.
  // For `opus`/`sonnet` (really 1M) that would UNDER-size the window to the
  // conservative default; the bare keys give the slot its true 1M. (`haiku` lands
  // on 200K either way now, but stays explicit for the same reason.)
  //
  // The bare keys do NOT rescue ids like `opus-4-5`/`sonnet-4` (really 200K) - but
  // they no longer NEED to: the default is now conservative (#807 fixed), so an
  // unmatched id is sized at the safe 200K floor rather than an optimistic 1M+.
  opus: 1_000_000,
  sonnet: 1_000_000,
  haiku: 200_000,
};

/**
 * Default context limit for a model we cannot identify at all — absent from the
 * live catalog (resolveModelContextLimit) AND unmatched in the table above.
 *
 * Conservative ON PURPOSE (#807). An optimistic default is the UNSAFE direction:
 * sizing an unknown model at ~1M when it is really 200K reports ~19% usage at the
 * exact moment the user is at 100%, so they hit "out of headroom" with no warning
 * at all. 200K is the overwhelmingly common floor, so an unknown model now nags
 * early (safe) instead of never (unsafe). A genuinely-1M unknown is sized
 * conservatively only until it appears in the catalog or the table.
 */
export const DEFAULT_CONTEXT_LIMIT = 200_000;

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
