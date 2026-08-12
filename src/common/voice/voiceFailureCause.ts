/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The reason a turn failed, split into the part a person reads first and the
 * part they can open if they want all of it.
 *
 * Voice mode used to throw this away. The engine hands the renderer a fully
 * named cause on the terminal `error` frame - the same string the Chat tab
 * prints - and the orb answered "Inspect Chat for the exact error", which is the
 * one thing a person in voice mode cannot conveniently do. The information was
 * never missing; it was discarded one function short of the surface.
 */
export type VoiceFailureCause = {
  /** The opening sentence, or a clean prefix when the text has no sentence break. */
  summary: string;
  /** Everything the engine said, whitespace-normalized and otherwise untouched. */
  full: string;
};

/**
 * How much of a run-on cause to show before the rest goes behind the expander.
 *
 * Engine refusals are routinely a paragraph (the plaintext-credentials warning
 * the owner hit is four sentences with an absolute path in the middle). Cutting
 * one of those to fit a status line produces a fragment that means nothing, so
 * the cut is a floor for the FIRST SENTENCE only and the remainder stays
 * reachable rather than being deleted.
 */
const SUMMARY_MAX = 200;

/** `. `, `! `, `? ` or end of text. A dot inside a path or a version never matches. */
const SENTENCE_END = /[.!?](\s|$)/;

const asText = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const record = raw as { content?: unknown; message?: unknown };
    if (typeof record.content === 'string') return record.content;
    if (typeof record.message === 'string') return record.message;
  }
  return '';
};

/** Cuts at the last word boundary at or before `limit`, never mid-word. */
const clip = (text: string): string => {
  if (text.length <= SUMMARY_MAX) return text;
  const window = text.slice(0, SUMMARY_MAX);
  const lastSpace = window.lastIndexOf(' ');
  return `${(lastSpace > 0 ? window.slice(0, lastSpace) : window).trimEnd()}…`;
};

export const describeVoiceFailureCause = (raw: unknown): VoiceFailureCause | null => {
  const full = asText(raw).replace(/\s+/g, ' ').trim();
  if (!full) return null;

  const boundary = full.match(SENTENCE_END);
  const firstSentence = boundary?.index === undefined ? full : full.slice(0, boundary.index + 1);
  return { summary: clip(firstSentence), full };
};
