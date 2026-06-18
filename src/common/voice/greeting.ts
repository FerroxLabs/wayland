/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Builds a time-of-day call greeting. Pure — no Date.now(); caller passes
 * `new Date().getHours()` and a counter as `variantSeed`.
 *
 * @param args.spokenName - Optional display name to include in the greeting.
 * @param args.hour       - Hour of the day (0–23).
 * @param args.variantSeed - Integer seed that deterministically selects the tail phrase.
 *   Negative values are handled via Math.abs.
 */
export const buildCallGreeting = (args: { spokenName?: string; hour: number; variantSeed: number }): string => {
  const part = args.hour < 12 ? 'Morning' : args.hour < 18 ? 'Afternoon' : 'Evening';
  const name = args.spokenName?.trim();
  const tails = ['what are we working on?', "what's up?", 'how can I help?', "I'm listening."];
  const tail = tails[Math.abs(args.variantSeed) % tails.length];
  return name ? `${part}, ${name} — ${tail}` : `${part} — ${tail}`;
};
