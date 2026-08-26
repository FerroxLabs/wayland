import { emitConstitutionReclaimNotice } from './constitutionReclaimNotice';
import { emitConstitutionUnsupportedNotice } from './constitutionUnsupportedNotice';
import { getConstitutionFsService } from './constitutionFsService';

export interface ComposePromptOptions {
  /** Active assistant/specialist ID. Matches ~/.wayland/specialists/<id>.md. */
  assistantId?: string;
  /** Existing backend-specific system prompt. Appended below Constitution + overlay. */
  basePrompt?: string;
  /**
   * Conversation this composition belongs to. Every backend resolves the
   * Constitution through here, so this is the one seam that can tell the user
   * their key ring was regenerated no matter which agent they are talking to,
   * and the only one that knows which chat actually triggered it.
   */
  conversationId?: string;
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
  /**
   * False only when this packaged platform has no Constitution authority - i.e.
   * neither the Constitution nor the specialist overlay is in `text`.
   *
   * #1040: this used to be computed and discarded (zero call sites read it),
   * which is how a Windows user came to get a materially different agent with
   * nothing anywhere saying so. It now drives the one-time per-conversation
   * disclosure below; Doctor's `config.constitution` check is the durable copy.
   */
  constitutionSupported: boolean;
}

/**
 * The one rule that must reach every assistant on every backend.
 *
 * A user asked Wayland to remember something. The Concierge prompt described a
 * Memory feature, no memory-write tool was registered on that profile, and the
 * model answered "Saved to memory." having called nothing at all - a claimed
 * action with no tool call behind it. Assistant rule files could not fix that
 * class of failure on their own: there are 31 of them, users author their own,
 * and a rule that only some assistants carry is a rule the product does not
 * have.
 *
 * This is deliberately a FLOOR, not a fix. It reduces over-claiming; it does
 * not eliminate it. `concierge.md` already carried "Don't claim you did
 * something you only described" when the lie was produced, so do not let one
 * clean run close the underlying issue, and do not describe it in release notes
 * as having fixed fabrication.
 *
 * Composed FIRST so it survives an unsupported-Constitution platform, where
 * every other segment can be empty.
 */
export const HONESTY_FLOOR = `## Non-negotiable: never fabricate, never over-claim

- **Never invent the user's own facts.** Account names, company names, amounts, percentages, dates, file paths, settings, model names, counts. Use only what the user told you in this conversation, what your instructions or the live capabilities summary provide, or what a tool call returned. If you have none of those for a value, do not fill the gap with a plausible-looking one to make a document, card, brief or summary look finished - leave it visibly blank, say inside the deliverable that it is missing, and ask for it once.
- **Never claim an action you did not take in this turn.** Do not say you saved, wrote, stored, remembered, scheduled, sent, installed, connected or verified something unless a tool call in THIS turn did it and returned success. If you have no tool for it, say so plainly and say what the user can do instead. "I cannot do that from here" is always better than a confident false report, which the user only discovers when they go looking and find nothing.
- **Describing a plan is not doing it.** If you outline steps and stop, say that you have not run them yet.`;

/**
 * Off switch. A demo-day regression should cost a relaunch, not a signed
 * rebuild and re-notarization. Read at module scope; defaults ON.
 */
const HONESTY_FLOOR_ENABLED = process.env.WAYLAND_HONESTY_FLOOR !== 'off';

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
  const service = getConstitutionFsService();
  const capability = service.capability();
  if (capability.supported) {
    // Authority failures on supported platforms are terminal. Continuing with
    // the Constitution silently omitted would change agent behavior precisely
    // when integrity, key, or reconciliation state is untrusted.
    const result = service.readWithOverlay(opts?.assistantId);
    constitution = result.constitution.status === 'present' ? result.constitution.content : '';
    overlay = result.overlay?.status === 'present' ? result.overlay.content : null;
    // Only after the read actually returned. Saying "we regenerated your ring
    // and carried on" for a read that then threw would be worse than silence.
    emitConstitutionReclaimNotice(service, opts?.conversationId);
  } else if (capability.supported === false) {
    console.warn(`[composePrompt] Constitution unavailable: ${capability.reason}`);
  }
  const parts = [HONESTY_FLOOR_ENABLED ? HONESTY_FLOOR : '', constitution, overlay ?? '', basePrompt].filter(
    (p) => p && p.length > 0
  );
  const text = parts.join('\n\n---\n\n');
  const approxTokens = Math.ceil(text.length / 4);
  const composed: ComposedPrompt = {
    text,
    approxTokens,
    anthropicCacheControl: cacheControl,
    hadOverlay: overlay !== null,
    constitutionSupported: capability.supported,
  };
  // #1040: the flag stops being dead here. Silence was the defect - the user
  // could not find out that the identity and behaviour rules they read about are
  // not in this agent's prompt.
  if (!composed.constitutionSupported) emitConstitutionUnsupportedNotice(opts?.conversationId);
  return composed;
}
