/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Marquee models - the genuinely top, widely-known model makers that should
 * LEAD the recommended picker zone and win the cold-start default, ahead of
 * every-provider "flagships" (e.g. Groq's open ALLaM / Compound / Llama / GPT-OSS
 * models, which are flagged `recommended` but aren't what a user reaches for).
 *
 * This is presentation/ordering only - it never changes which models are
 * `recommended` or available; it just decides who comes first.
 */

import type { ProviderId } from '@process/providers/types';

/**
 * Provider display order for the recommended zone. Marquee makers first, in
 * this order; every other connected provider keeps its existing relative order
 * after them.
 */
export const MARQUEE_PROVIDER_ORDER: readonly ProviderId[] = [
  'anthropic',
  'google-gemini',
  'openai',
  'deepseek',
  'moonshot',
];

/**
 * Rank a provider for marquee ordering: marquee makers get their index (0..n),
 * everyone else sorts after them (stable - ties keep their prior order).
 */
export function marqueeProviderRank(id: ProviderId): number {
  const i = MARQUEE_PROVIDER_ORDER.indexOf(id);
  return i === -1 ? MARQUEE_PROVIDER_ORDER.length : i;
}

/**
 * Cold-start default priority: the top model per maker, in the order a default
 * should be chosen when the user hasn't picked one and Flux isn't connected.
 * `platform` matches the provider's platform or display name; `model` matches
 * the flagship model id within that provider. Claude leads (the strongest
 * general default for an agent app), then Gemini, ChatGPT, DeepSeek, Kimi.
 */
export const MARQUEE_DEFAULT_RULES: ReadonlyArray<{ platform: RegExp; model: RegExp }> = [
  { platform: /anthropic|claude/i, model: /opus|sonnet/i },
  { platform: /gemini|google/i, model: /gemini/i },
  { platform: /openai/i, model: /gpt-5|gpt-4o|gpt-4\.1|^o\d/i },
  { platform: /deepseek/i, model: /deepseek|v4|chat|reasoner/i },
  { platform: /moonshot|kimi/i, model: /kimi|moonshot|k2/i },
];
