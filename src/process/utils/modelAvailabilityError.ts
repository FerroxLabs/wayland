/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Model-availability error mapping for the workflow dispatch path (Issue #22).
 *
 * When a workflow launches with a model the backend cannot actually serve - an
 * over-listed catalog entry, a model the account is not entitled to, or a model
 * id the relay does not route - the backend rejects the turn with a
 * `model_not_found` / "model does not exist" / "not entitled" family error.
 *
 * On the autonomous-step path that raw error was thrown straight through and the
 * Workflows tab just showed an opaque failure with no actionable cause. This
 * module classifies that error family and turns it into a CLEAR, actionable
 * message (which model, which backend, that it is unavailable, and what to do)
 * so the executor surfaces a useful error instead of a silent/opaque one.
 *
 * Pure correctness, no routing policy: this never picks a different model or
 * changes which models are offered.
 */

import i18n from '@process/services/i18n';

/**
 * Lowercased substrings that identify a "the chosen model is not available"
 * rejection across the backends Wayland spawns (OpenAI/Codex, Anthropic relays,
 * OpenRouter-style relays, and the generic OpenAI-compatible surface). Kept
 * deliberately tight so genuine auth/network failures are NOT mis-classified as
 * model errors (those have their own remedy path).
 */
const MODEL_UNAVAILABLE_SIGNATURES = [
  'model_not_found',
  'model not found',
  'does not exist or you do not have access',
  'the model `',
  'no such model',
  'unknown model',
  'model is not available',
  'model may not exist',
  'unsupported model',
  'invalid model',
  'not entitled',
  'model_not_available',
  '无可用渠道', // relay: "no available channel" for the requested model
] as const;

/**
 * True when an error message looks like the backend rejected the request
 * because the chosen model is unavailable / not found / not entitled.
 */
export function looksLikeModelUnavailable(errorMsg: string): boolean {
  if (!errorMsg) return false;
  const haystack = errorMsg.toLowerCase();
  return MODEL_UNAVAILABLE_SIGNATURES.some((signature) => haystack.includes(signature));
}

/**
 * Build a clear, actionable, i18n-aware message for an unavailable model.
 * Names the model and backend, states it is unavailable, and tells the user to
 * pick another model.
 */
export function formatModelUnavailableError(opts: { modelId: string; backend: string }): string {
  const modelId = opts.modelId && opts.modelId.length > 0 ? opts.modelId : 'unknown';
  const backend = opts.backend && opts.backend.length > 0 ? opts.backend : 'unknown';
  return i18n.t('workflow.modelUnavailable', {
    model: modelId,
    backend,
    // English default so the message is still actionable before i18n.init()
    // resolves (main-process boot) or for any locale missing the key.
    defaultValue:
      'The model "{{model}}" is not available on the {{backend}} backend (unavailable or not entitled). ' +
      'Pick a different model for this workflow and run the step again.',
  });
}

/**
 * Typed error carrying an already-formatted, user-facing message plus the
 * structured cause. The dispatch layer throws this so the Workflows tab shows a
 * clear failure instead of the raw opaque backend error.
 */
export class ModelUnavailableError extends Error {
  readonly modelId: string;
  readonly backend: string;
  readonly cause?: unknown;

  constructor(opts: { modelId: string; backend: string; cause?: unknown }) {
    super(formatModelUnavailableError(opts));
    this.name = 'ModelUnavailableError';
    this.modelId = opts.modelId;
    this.backend = opts.backend;
    this.cause = opts.cause;
  }
}

/**
 * Map a raw dispatch error to a clear {@link ModelUnavailableError} when it is a
 * model-availability rejection; otherwise return `null` so the caller keeps the
 * original error (auth, network, timeout, etc. all have their own handling).
 */
export function mapDispatchErrorToModelUnavailable(
  err: unknown,
  ctx: { modelId: string; backend: string }
): ModelUnavailableError | null {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (!looksLikeModelUnavailable(raw)) return null;
  return new ModelUnavailableError({ modelId: ctx.modelId, backend: ctx.backend, cause: err });
}
