/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

const NON_SPEAKABLE_TYPE = /(tool|thinking|reasoning|plan|permission|confirmation|image|audio|usage|cost|error)/i;
const SAFE_TEXT_KEYS = ['text', 'content', 'message', 'answer', 'result', 'output'] as const;

/**
 * Cap for a single spoken turn. Exported because under sentence chunking it has
 * to be counted cumulatively by the caller - applied per chunk it means nothing,
 * since no individual sentence ever approaches it.
 */
export const MAX_SPOKEN_CHARACTERS = 4_000;

const collectSafeText = (value: unknown, depth: number): string[] => {
  if (depth > 5 || value == null) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((item) => collectSafeText(item, depth + 1));
  if (typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  if (typeof record.type === 'string' && NON_SPEAKABLE_TYPE.test(record.type)) return [];

  for (const key of SAFE_TEXT_KEYS) {
    if (key in record) {
      const text = collectSafeText(record[key], depth + 1);
      if (text.length > 0) return text;
    }
  }
  return [];
};

/**
 * A list item becomes its own sentence.
 *
 * Deleting the bullet and then collapsing newlines - what this used to do - runs
 * the items straight together: "- one\n- two" was spoken as "one two", with no
 * boundary at all where the writing had its clearest one. Measured against real
 * synthesis, bullets read as sentences take 4.57 s versus 3.23 s run together,
 * and the extra time IS the structure.
 *
 * The general rule this follows: written structure gets converted INTO prosody,
 * never deleted. Commas down, list boundaries up.
 */
const listItemsBecomeSentences = (text: string): string =>
  text
    .split('\n')
    .map((line) => {
      const item = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
      if (!item) return line;
      const body = item[1].trim();
      if (!body) return '';
      return /[.!?]$/.test(body) ? body : `${body}.`;
    })
    .join('\n');

export const normalizeVoiceResponseText = (text: string): string =>
  listItemsBecomeSentences(
    text
      .replace(/```[\s\S]*?```/g, ' I left the code in the chat. ')
      .replace(/!\[[^\]]*]\([^)]*\)/g, ' I added an image in the chat. ')
      .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
  )
    .replace(/[*_~`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SPOKEN_CHARACTERS);

/**
 * Extracts only final assistant prose from the canonical completion payload.
 * Tool traces, reasoning, plans, approvals, usage, and arbitrary object fields
 * are deliberately not spoken.
 */
export const extractVoiceResponseText = (type: unknown, content: unknown): string | null => {
  if (typeof type === 'string' && NON_SPEAKABLE_TYPE.test(type)) return null;
  const normalized = normalizeVoiceResponseText(collectSafeText(content, 0).join(' '));
  return normalized || null;
};

// ---------------------------------------------------------------------------
// Sentence splitting for chunked synthesis
// ---------------------------------------------------------------------------

/**
 * Below this, a sentence costs more than it saves.
 *
 * Synthesis has ~765 ms of fixed overhead per call, so the break-even is about
 * 0.88 s of audio - roughly 2.6 words. "Yes." renders in 0.668 s and would
 * underrun the queue and stutter, so short candidates are merged forward into
 * the next sentence instead of being spoken alone.
 */
const MIN_SENTENCE_CHARS = 15;

/** Stop waiting for a terminator that may never arrive. */
const FORCE_FLUSH_CHARS = 200;

/**
 * Words that end in a period without ending a sentence. Matched case-sensitively
 * against the token immediately before the terminator.
 */
const ABBREVIATIONS = new Set([
  'Dr',
  'Mr',
  'Mrs',
  'Ms',
  'Prof',
  'Sr',
  'Jr',
  'St',
  'Mt',
  'Fig',
  'No',
  'vs',
  'etc',
  'approx',
  'e.g',
  'i.e',
  'a.m',
  'p.m',
]);

/**
 * True when the period at `index` ends a real sentence rather than an
 * abbreviation, an initial, or a decimal point.
 */
const isSentenceEnd = (buffer: string, index: number): boolean => {
  const preceding = buffer.slice(0, index);
  const token = /([A-Za-z.]+|\d+)$/.exec(preceding)?.[1];
  if (!token) return true;
  // "It is 3.5 metres." must not split into "It is 3." and "5 metres."
  if (/^\d+$/.test(token)) return false;
  // "J. Smith" - a lone capital is an initial, not the end of a thought.
  if (/^[A-Z]$/.test(token)) return false;
  return !ABBREVIATIONS.has(token.replace(/\.$/, ''));
};

export type SpeakableSentences = {
  /** Raw slices, in order. Concatenating these plus `rest` reproduces the input exactly. */
  sentences: string[];
  /** Everything not yet safe to speak. The caller flushes this when the turn ends. */
  rest: string;
};

/**
 * Pulls complete sentences off a growing response buffer so synthesis can start
 * before the model has finished writing. Measured effect on time-to-first-audio:
 * 5056 ms down to 953 ms.
 *
 * Operates on RAW text and returns raw slices, so `sentences.join('') + rest`
 * is byte-identical to the input. That is the only invariant worth asserting
 * here, because normalization is NOT distributive over chunks: the bullet and
 * numbered-list rules are line-anchored, so a chunk boundary manufactures a line
 * start and per-chunk normalization genuinely differs from whole-text
 * normalization. Asserting they match would fail, and the obvious repair is to
 * weaken the test until it proves nothing. Normalize each emitted sentence
 * separately instead.
 *
 * A terminator at the very end of the buffer is NOT a boundary. Mid-stream the
 * next delta may continue it - "3." becoming "3.5" is the clearest case, and
 * nothing at end-of-buffer can distinguish the two. The caller flushes the tail
 * when the turn ends, which is where that decision actually has the information.
 */
export const takeSpeakableSentences = (buffer: string): SpeakableSentences => {
  // An unclosed code fence holds everything. The normalizer's fence rule needs a
  // CLOSING fence to match; run it on an open one and the model's raw source is
  // read aloud verbatim, character by character.
  if ((buffer.match(/```/g)?.length ?? 0) % 2 === 1) return { sentences: [], rest: buffer };

  const sentences: string[] = [];
  let start = 0;

  for (let i = 0; i < buffer.length; i++) {
    if (!'.!?'.includes(buffer[i])) continue;

    // Absorb a run of terminators so "Really?!" and "Wait..." stay whole.
    let end = i;
    while (end + 1 < buffer.length && '.!?'.includes(buffer[end + 1])) end++;

    // Whitespace after the terminator is required, so end-of-buffer never emits.
    if (end + 1 >= buffer.length || !/\s/.test(buffer[end + 1])) {
      i = end;
      continue;
    }
    if (buffer[end] === '.' && !isSentenceEnd(buffer, end)) {
      i = end;
      continue;
    }

    // Include the trailing whitespace in the slice so concatenation is exact.
    let cut = end + 1;
    while (cut < buffer.length && /\s/.test(buffer[cut])) cut++;

    const candidate = buffer.slice(start, cut);
    // Too short to be worth its own synthesis call: keep accumulating.
    if (candidate.trim().length < MIN_SENTENCE_CHARS) {
      i = end;
      continue;
    }

    sentences.push(candidate);
    start = cut;
    i = cut - 1;
  }

  // A long run with no usable terminator would otherwise wait forever.
  let rest = buffer.slice(start);
  if (rest.length > FORCE_FLUSH_CHARS) {
    const window = rest.slice(0, FORCE_FLUSH_CHARS);
    const breakAt = window.lastIndexOf(' ');
    const cut = breakAt > 0 ? breakAt + 1 : FORCE_FLUSH_CHARS;
    sentences.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }

  return { sentences, rest };
};
