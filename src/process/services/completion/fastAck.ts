/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fast first-response "Quick take" (perceived-speed, Rory Sutherland).
 *
 * When the user submits a turn on the Flux path, we fire a parallel one-shot
 * `flux-fast` call shown as a TRANSIENT bubble above the real streaming
 * response, removed the moment the main model starts streaming. Never persisted.
 *
 * The take must ADD something the user's own message did not contain (a
 * provisional answer, one concrete decision, the key assumption, or a single
 * orienting fact) — never an echo or paraphrase of the request, and never the
 * same shape twice. When there is nothing useful to add (a confirmation or
 * trivial follow-up) it returns '' and the renderer shows nothing.
 *
 * This is best-effort: on a missing Flux key, a slow/failed call, or an empty
 * result it returns '' so the renderer simply shows no ack. It NEVER throws and
 * NEVER affects the real turn.
 */

import { FLUX_PROVIDER_ID, FLUX_SURFACE } from '@/common/config/flux';
import { readConnectedFluxKey } from '@process/connectors/fluxKey';
import { oneShotComplete, type PickedModel } from '@process/services/completion/oneShot';
import type { IProvider } from '@/common/config/storage';

/** The model the ack always runs on - the cheapest/fastest Flux tier. */
const FLUX_FAST_MODEL_ID = 'flux-fast' as const;

/** Tight caps: the ack must beat the main model's first token or it is useless. */
const ACK_MAX_TOKENS = 60;
const ACK_TIMEOUT_MS = 8000;

/** Cap the prompt we feed the ack model - it only needs the gist. */
const MAX_PROMPT_CHARS = 1000;

/**
 * Build the meta-prompt for the ack model. Pure (no I/O) so it is unit-testable.
 * Instructs a take that ADDS information (answer / decision / assumption / fact),
 * never an echo, varied in shape, and empty when there is nothing to add.
 */
export function buildFastAckPrompt(userMessage: string): string {
  const gist = userMessage.trim().slice(0, MAX_PROMPT_CHARS);
  return `You write a single "Quick take" shown for a moment while the real answer is being prepared. Its only job is to add something the user does NOT already know from their own message. Never restate, paraphrase, or summarize their request.

Pick the ONE move that fits this message:
- Question or research ask: give your best provisional answer from what you already know, in a few words, framed as a first instinct you are about to verify.
- Build / make / write ask: commit to ONE concrete decision about how you will do it (a specific structure, choice, or default) — not a recap of what they asked for.
- Something important is ambiguous: state the single assumption you are making, so they can correct it now.
- Otherwise: lead with the one fact that best orients the topic.

If the message is only a confirmation, a "yes do that", or a small follow-up with nothing genuinely new to add, reply with an empty message and no other text.

Rules: at most 1-2 short sentences (~40 words). Vary your phrasing and length from one take to the next. Never begin with "I'll", "I will", "Let me", or "Sure". Never use the shape "I'll X, Y, and Z". Do not restate the request.

User message: "${gist}"`;
}

/**
 * Collapse the model output to a single clean line. Pure (no I/O), testable.
 * Returns '' when nothing usable remains.
 */
export function cleanFastAck(raw: string): string {
  const firstLine =
    raw
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? '';
  const cleaned = firstLine.replace(/^["']|["']$/g, '').trim();
  // The prompt tells the model to return nothing when it has no value to add;
  // some models emit a placeholder instead of an empty string. Treat those as
  // "no take" so the renderer shows nothing rather than a bland filler line.
  if (/^(n\/?a|none|nothing|no comment|no take|—|-)\.?$/i.test(cleaned)) return '';
  return cleaned;
}

/** Construct the flux-fast PickedModel from the connected key, or null. */
async function fluxFastModel(): Promise<PickedModel | null> {
  const apiKey = await readConnectedFluxKey();
  if (!apiKey) return null;
  const provider: IProvider = {
    id: FLUX_PROVIDER_ID,
    platform: 'openai',
    name: 'Flux Router',
    baseUrl: FLUX_SURFACE.openai,
    apiKey,
    model: [FLUX_FAST_MODEL_ID],
    enabled: true,
  };
  return { provider, modelId: FLUX_FAST_MODEL_ID };
}

/**
 * Generate the fast ack for a user message. Best-effort: returns '' on any
 * failure (no Flux key, slow/errored call, empty output). Never throws.
 */
export async function generateFastAck(userMessage: string): Promise<string> {
  const trimmed = userMessage.trim();
  if (!trimmed) return '';
  try {
    const model = await fluxFastModel();
    if (!model) return '';
    const out = await oneShotComplete(buildFastAckPrompt(trimmed), {
      model,
      maxTokens: ACK_MAX_TOKENS,
      timeoutMs: ACK_TIMEOUT_MS,
    });
    return cleanFastAck(out);
  } catch {
    return '';
  }
}
