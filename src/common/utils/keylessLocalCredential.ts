/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { isLocalBaseUrl } from './urlValidation';

/**
 * Placeholder credential for keyless LOCAL backends (Ollama / LM Studio /
 * llama.cpp), which accept no API key at all.
 *
 * Every OpenAI-compatible consumer we hand a provider to rejects an absent key
 * before it opens a socket - the OpenAI SDK constructor throws on an empty
 * string, and the fork Gemini core throws `OpenAI API key is required` - so a
 * genuinely keyless provider needs a harmless non-secret token to get past the
 * gate. It is never persisted as a credential and never leaves the machine for
 * a non-local host.
 */
export const LOCAL_KEYLESS_PLACEHOLDER = 'ollama';

/**
 * Resolve the API key to hand an OpenAI-compatible backend.
 *
 * A real key always wins. Only when there is no key AND the resolved base URL
 * is a clearly-local host does the placeholder unlock keyless operation -
 * {@link isLocalBaseUrl} fails closed, so an empty or unparseable URL yields
 * `''` and a cloud provider still hard-requires a real credential.
 *
 * Returns `''`, never `undefined`, so callers can treat "no credential" as one
 * falsy shape rather than two.
 */
export function resolveOpenAiCompatibleApiKey(
  apiKey: string | undefined | null,
  baseUrl: string | undefined | null
): string {
  if (typeof apiKey === 'string' && apiKey.length > 0) return apiKey;
  return isLocalBaseUrl(baseUrl) ? LOCAL_KEYLESS_PLACEHOLDER : '';
}
