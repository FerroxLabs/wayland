import { readConstitutionWithOverlay } from '@process/bridge/constitutionBridge';

export interface ComposePromptOptions {
  /** Active assistant/specialist ID. Matches ~/.wayland/specialists/<id>.md. */
  assistantId?: string;
  /** Existing backend-specific system prompt. Appended below Constitution + overlay. */
  basePrompt?: string;
}

export interface ComposedPrompt {
  /** Final composed string, ready to inject into provider system slot. */
  text: string;
  /** Estimated tokens (Math.ceil(length/4)). For observability + Settings UI. */
  approxTokens: number;
  /**
   * Anthropic cache_control marker. Pass to messages.create as the
   * cache_control on the LAST block of the `system` array (a single
   * breakpoint wrapping the full prefix).
   */
  anthropicCacheControl: { type: 'ephemeral' };
  /** True if a per-specialist overlay file was found and included. */
  hadOverlay: boolean;
}

/**
 * Compose the Wayland Constitution + optional specialist overlay + backend
 * base prompt into a single system string. Stable across turns (no per-turn
 * variables, no timestamps), so the resulting prefix matches Anthropic /
 * OpenAI prompt caches turn-to-turn.
 *
 * Composition order:
 *   Constitution
 *   \n\n---\n\n
 *   SpecialistOverlay (if file exists)
 *   \n\n---\n\n
 *   basePrompt (if provided)
 *
 * Empty segments are filtered out, so the leading/trailing separators only
 * appear when both adjacent segments are non-empty.
 */
export function composePrompt(opts?: ComposePromptOptions): ComposedPrompt {
  const cacheControl = { type: 'ephemeral' } as const;
  const basePrompt = opts?.basePrompt ?? '';
  let constitution = '';
  let overlay: string | null = null;
  try {
    const result = readConstitutionWithOverlay(opts?.assistantId);
    constitution = result.constitution ?? '';
    overlay = result.overlay;
  } catch (err) {
    console.error('[composePrompt] readConstitutionWithOverlay failed', err);
  }
  const parts = [constitution, overlay ?? '', basePrompt].filter((p) => p && p.length > 0);
  const text = parts.join('\n\n---\n\n');
  const approxTokens = Math.ceil(text.length / 4);
  return {
    text,
    approxTokens,
    anthropicCacheControl: cacheControl,
    hadOverlay: overlay !== null,
  };
}
