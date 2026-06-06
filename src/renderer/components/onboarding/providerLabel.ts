/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Human-facing provider names for onboarding surfaces. Detection returns raw
 * provider ids (`openai`, `google-gemini`); naive title-casing produces ugly
 * labels ("Openai", "Openrouter"). This maps the known ones to their real
 * brand casing and falls back to a sane title-case for anything unmapped.
 */
const LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  'google-gemini': 'Google Gemini',
  google: 'Google',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  deepseek: 'DeepSeek',
  moonshot: 'Moonshot',
  mistral: 'Mistral',
  'flux-router': 'Flux Router',
  xai: 'xAI',
  together: 'Together',
  fireworks: 'Fireworks',
  perplexity: 'Perplexity',
  cohere: 'Cohere',
  'aws-bedrock': 'AWS Bedrock',
  azure: 'Azure',
};

export const providerLabel = (id: string): string =>
  LABELS[id] ??
  id
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
