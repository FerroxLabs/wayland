/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Smart conversation-title generation.
 *
 * Takes the user's first message and produces a short, clean, friendly title
 * (the way Claude.ai renames a chat). Runs on the cheapest fast model the user
 * has available via `oneShotComplete` (haiku / flash / mini class), so it costs
 * almost nothing and never blocks the chat. Returns `null` on any failure or
 * when no model is connected - the caller then falls back to plain truncation.
 */

import { oneShotComplete } from '@process/services/completion/oneShot';

/** Title generation is best-effort: cap the wait so it never delays the UI. */
const TITLE_TIMEOUT_MS = 10000;

/** Below this length a single line is already a fine title - skip the model. */
const MIN_LENGTH_FOR_AI = 30;

function buildPrompt(message: string): string {
  return `Generate a very short, concise title (3-7 words max) that summarizes this user request.
The title should be descriptive and capture the main topic/action.
Do NOT include quotes, prefixes like "Title:", or any explanation.
Just output the title text directly.

User request: "${message.slice(0, 500)}"

Title:`;
}

/**
 * Strip quotes/prefixes the model sometimes adds, collapse to a single line,
 * cap the length, and capitalize. Returns `null` if nothing usable remains.
 */
function cleanTitle(raw: string): string | null {
  let cleaned = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? '';

  cleaned = cleaned
    .replace(/^["']|["']$/g, '')
    .replace(/^(Title:|Summary:|Topic:)\s*/i, '')
    .trim()
    .slice(0, 60)
    .trim();

  if (!cleaned) return null;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Generate a smart title for a conversation from its first message. Returns the
 * cleaned title, or `null` when the message is too short to need one, no model
 * is available, or the call fails/times out. Never throws.
 */
export async function generateSmartTitle(message: string): Promise<string | null> {
  const trimmed = message.trim();
  if (trimmed.length < MIN_LENGTH_FOR_AI && !trimmed.includes('\n')) {
    return null;
  }

  try {
    const out = await oneShotComplete(buildPrompt(trimmed), { maxTokens: 50, timeoutMs: TITLE_TIMEOUT_MS });
    return cleanTitle(out);
  } catch {
    return null;
  }
}
