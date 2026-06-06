/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Infer onboarding focus areas from the free-text "what are you working on" line
 * (main process).
 *
 * Two-tier so it always produces a useful answer:
 *  1. A one-shot LLM call via `oneShotComplete` - picks the cheapest fast model
 *     the user already has a key for (e.g. Gemini Flash on a Google-only cold
 *     start) and classifies the sentence into the six focus personas.
 *  2. A deterministic keyword fallback when no model is configured yet (true
 *     cold start) or the model reply can't be parsed - so "financial analyst"
 *     still resolves to `finance` with zero providers connected.
 *
 * Returns the matching persona ids (1–3, most relevant first); the renderer
 * merges them with any cards the user tapped, then loads the right assistants.
 * Never throws.
 */

/** The six onboarding focus personas (mirrors `FocusPersonaId` in the renderer). */
const FOCUS_IDS = ['content', 'sales', 'business', 'dev', 'finance', 'general'] as const;
type FocusId = (typeof FOCUS_IDS)[number];

const isFocusId = (s: string): s is FocusId => (FOCUS_IDS as readonly string[]).includes(s);

/**
 * Keyword signals per persona (excluding `general`, which is the catch-all).
 * Intentionally broad - this is the offline floor, not the primary path.
 */
const KEYWORDS: Record<Exclude<FocusId, 'general'>, RegExp> = {
  content: /\b(content|copy(writ)?|writ(e|er|ing)|blog|video|podcast|creative|social|brand|design|seo|newsletter|script|marketing)\b/i,
  sales: /\b(sales|growth|lead(s|gen)?|outreach|prospect|deal|crm|pipeline|revenue|closer?|cold (call|email)|account exec|biz dev)\b/i,
  business: /\b(business|found(er|ing)|ceo|coo|operations?|ops|startup|company|manage(r|ment)?|admin|strateg(y|ist)|consult(ant|ing)?|agency|owner)\b/i,
  dev: /\b(dev(eloper)?|engineer(ing)?|cod(e|ing)|program(mer|ming)?|software|build(er|ing)?|api|app|technical|data scien(ce|tist)|ml|ai engineer|devops|backend|frontend|full[- ]?stack)\b/i,
  finance: /\b(financ(e|ial)|account(ant|ing)?|money|invest(or|ing|ment)?|trad(e|er|ing)|stock|equit|budget|tax|bookkeep|analyst|econom(y|ist|ics)|fintech|wealth|portfolio|cfo)\b/i,
};

/** Deterministic keyword classification - the offline floor. */
function keywordFocus(text: string): FocusId[] {
  const out: FocusId[] = [];
  for (const id of Object.keys(KEYWORDS) as Array<Exclude<FocusId, 'general'>>) {
    if (KEYWORDS[id].test(text)) out.push(id);
  }
  return out;
}

/**
 * Classify a free-text work description into 1–3 focus personas.
 *
 * @param work The user's "what are you working on" sentence.
 * @returns Persona ids the work maps to. Empty only when `work` is blank.
 */
export async function inferFocusFromText(work: string): Promise<FocusId[]> {
  const text = work.trim();
  if (!text) return [];

  // Primary: a cheap, fast model (Gemini Flash / Haiku / mini …) if one exists.
  try {
    // Lazy import - the completion utility (and its model-bridge dependency)
    // must NOT be pulled into the boot-time module graph; it's only needed when
    // the user actually finishes the interests step at runtime.
    const { oneShotComplete } = await import('@process/services/completion/oneShot');
    const prompt =
      `A new user describes what they do: "${text}".\n` +
      `Classify it into these focus areas: content, sales, business, dev, finance, general.\n` +
      `Reply with ONLY a JSON array of the 1-3 most relevant ids, most relevant first. ` +
      `Example: ["finance"].`;
    const raw = await oneShotComplete(prompt, { maxTokens: 40, timeoutMs: 8000 });
    const match = raw.match(/\[[^\]]*\]/);
    if (match) {
      const parsed: unknown = JSON.parse(match[0]);
      const ids = (Array.isArray(parsed) ? parsed : [])
        .map((v) => String(v).toLowerCase().trim())
        .filter(isFocusId);
      const unique = [...new Set(ids)].slice(0, 3);
      if (unique.length > 0) return unique;
    }
  } catch {
    // No usable model yet, network/timeout, or unparseable reply - fall through.
  }

  // Fallback: deterministic keywords; default to `general` if nothing matched.
  const kw = keywordFocus(text);
  return kw.length > 0 ? kw.slice(0, 3) : ['general'];
}
