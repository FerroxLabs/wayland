/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fast first-response acknowledgement (perceived-speed, Rory Sutherland).
 *
 * When the user submits a turn on the Flux path, we fire a parallel one-shot
 * `flux-fast` call that returns a single short "here's the plan" sentence. The
 * renderer shows it as a TRANSIENT bubble above the real streaming response and
 * removes it the moment the main model starts streaming. It is never persisted.
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
 * Instructs a one-sentence acknowledgement of the approach, NOT an answer.
 */
export function buildFastAckPrompt(userMessage: string): string {
  const gist = userMessage.trim().slice(0, MAX_PROMPT_CHARS);
  return `In ONE short sentence, acknowledge the user's request and state the approach you'll take. Be specific and brief. Do NOT answer the request itself.

User request: "${gist}"`;
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
  return firstLine.replace(/^["']|["']$/g, '').trim();
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
