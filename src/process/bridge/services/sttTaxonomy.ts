/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared speech-to-text error taxonomy. Classifies a provider's HTTP failure
 * into a stable STT_* code so every provider (OpenAI, Deepgram, Flux Voice)
 * surfaces the same actionable, i18n-mapped error in the renderer instead of
 * each one inventing its own codes.
 */

/**
 * Maps an HTTP status (plus an optional provider-specific error code) to a
 * provider-neutral STT_* code, or null when the status is not one of the
 * classified buckets so the caller can fall back to STT_REQUEST_FAILED.
 *
 * 402 is special-cased: Flux Voice signals a paywalled tier with a
 * `premium_locked` body code, which keeps its own code so the renderer can show
 * an upgrade prompt rather than a generic quota message.
 */
export const classifySttStatus = (status: number, providerErrorCode?: string): string | null => {
  if (status === 401 || status === 403) return 'STT_AUTH';
  if (status === 402) return providerErrorCode === 'premium_locked' ? 'STT_FLUX_PREMIUM_LOCKED' : 'STT_QUOTA';
  if (status === 413) return 'STT_TOO_LARGE';
  if (status === 429) return 'STT_RATE_LIMITED';
  if (status >= 500) return 'STT_PROVIDER_DOWN';
  return null;
};

type ProviderErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
  err_msg?: string;
};

/**
 * Reads a failed provider response (body consumed once) and returns the Error to
 * throw: a typed STT_* code when the status maps to one, otherwise
 * STT_REQUEST_FAILED:<message> carrying the provider's message for diagnostics.
 */
export const toSttError = async (response: Response): Promise<Error> => {
  let payload: ProviderErrorPayload = {};
  try {
    payload = (await response.json()) as ProviderErrorPayload;
  } catch {
    // Non-JSON body: fall back to the status line below.
  }

  const code = classifySttStatus(response.status, payload.error?.code);
  if (code) return new Error(code);

  const message = payload.error?.message || payload.err_msg || `${response.status} ${response.statusText}`;
  return new Error(`STT_REQUEST_FAILED:${message}`);
};
