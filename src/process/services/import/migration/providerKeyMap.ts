/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure mapping helpers for the tool migration importer: resolve a credential
 * found in an external tool's config to a canonical Wayland `ProviderId`.
 *
 * Three resolution strategies, tried in order:
 *  1. Hermes `.env` variable name (e.g. `ANTHROPIC_API_KEY`) -> provider.
 *  2. OpenClaw provider name (e.g. `anthropic`, `google`) -> provider.
 *  3. The key's own prefix, via the shared `PROVIDER_KEY_PATTERNS` recognizer
 *     (the same source of truth the paste-recognizer uses) - the safety net for
 *     custom/unknown env var names.
 *
 * Kept free of fs/Electron imports so it is unit-tested in isolation.
 */

import type { ProviderId } from '@process/providers/types';
import { SORTED_PATTERNS } from '@process/providers/detection/providerKeyPatterns';

/**
 * Hermes stores keys in `~/.hermes/.env` as `KEY=value`. Map the provider env
 * var names Hermes documents (`OPTIONAL_ENV_VARS`) to Wayland provider ids.
 * Channel/tool tokens (Slack, Telegram, …) are intentionally excluded - those
 * are not LLM providers and Wayland manages channels separately.
 */
export const HERMES_ENV_TO_PROVIDER: Record<string, ProviderId> = {
  ANTHROPIC_API_KEY: 'anthropic',
  OPENAI_API_KEY: 'openai',
  OPENROUTER_API_KEY: 'openrouter',
  GOOGLE_API_KEY: 'google-gemini',
  GEMINI_API_KEY: 'google-gemini',
  GROQ_API_KEY: 'groq',
  XAI_API_KEY: 'xai',
  MISTRAL_API_KEY: 'mistral',
  DEEPSEEK_API_KEY: 'deepseek',
  PERPLEXITY_API_KEY: 'perplexity',
  TOGETHER_API_KEY: 'together',
  FIREWORKS_API_KEY: 'fireworks',
  CEREBRAS_API_KEY: 'cerebras',
  NVIDIA_API_KEY: 'nvidia',
  HUGGINGFACE_API_KEY: 'huggingface',
  HF_API_KEY: 'huggingface',
  REPLICATE_API_KEY: 'replicate',
  COHERE_API_KEY: 'cohere',
  MOONSHOT_API_KEY: 'moonshot',
};

/**
 * OpenClaw's `models.providers.<name>` keys and auth-profile `provider` fields
 * use these provider slugs. Map to Wayland ids. OpenClaw's `google` is Wayland's
 * `google-gemini` (the same normalization the catalog assembler already makes).
 */
export const OPENCLAW_PROVIDER_TO_PROVIDER: Record<string, ProviderId> = {
  anthropic: 'anthropic',
  openai: 'openai',
  openrouter: 'openrouter',
  google: 'google-gemini',
  'google-gemini': 'google-gemini',
  gemini: 'google-gemini',
  groq: 'groq',
  xai: 'xai',
  grok: 'xai',
  mistral: 'mistral',
  deepseek: 'deepseek',
  perplexity: 'perplexity',
  together: 'together',
  fireworks: 'fireworks',
  cerebras: 'cerebras',
  nvidia: 'nvidia',
  huggingface: 'huggingface',
  replicate: 'replicate',
  cohere: 'cohere',
  moonshot: 'moonshot',
};

/** Resolve a Hermes `.env` variable name to a Wayland provider id, or null. */
export function providerFromHermesEnv(envVar: string): ProviderId | null {
  return HERMES_ENV_TO_PROVIDER[envVar.trim().toUpperCase()] ?? null;
}

/** Resolve an OpenClaw provider slug to a Wayland provider id, or null. */
export function providerFromOpenClawName(name: string): ProviderId | null {
  return OPENCLAW_PROVIDER_TO_PROVIDER[name.trim().toLowerCase()] ?? null;
}

/**
 * Recognize a provider from the API key's own prefix, using the shared
 * `PROVIDER_KEY_PATTERNS` (only the unambiguous `unique` rules - a bare `sk-`
 * that could be several providers returns null rather than guess wrong).
 */
export function providerFromKeyShape(key: string): ProviderId | null {
  const k = key.trim();
  if (!k) return null;
  for (const rule of SORTED_PATTERNS) {
    if (rule.match === 'unique' && rule.test(k)) return rule.provider;
  }
  return null;
}

/** A short, non-reversible descriptor of a secret for display, e.g. `sk-ant-…1a2b`. */
export function redactKey(key: string): string {
  const k = key.trim();
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 6)}…${k.slice(-4)}`;
}
