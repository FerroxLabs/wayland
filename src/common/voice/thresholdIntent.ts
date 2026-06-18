/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThresholdIntent = { direction: 'longer' | 'shorter' };

const LONGER = [
  /\bwait( longer| a (sec|second|moment|bit|minute))\b/,
  /\bgive me (a )?(sec|second|moment|minute|bit)\b/,
  /\b(don'?t|do not) (cut me off|interrupt|rush me)\b/,
  /\bstop interrupting\b/,
  /\bhold on\b/,
  /\blet me (think|finish|talk)\b/,
  /\bmore time\b/,
  /\bslow down\b/,
];

const SHORTER = [
  /\b(go|respond|reply|answer|send) (quicker|faster|sooner)\b/,
  /\b(don'?t|do not) wait (so long|too long)\b/,
  /\bspeed (it )?up\b/,
];

/**
 * Local intent match for live VAD-threshold tuning by voice. Only fires on
 * short, command-like utterances (<= 8 words) so a long sentence that merely
 * contains "wait longer" is sent as a normal message, not interpreted.
 * Returns null for normal utterances (the controller then sends them).
 */
export const detectThresholdIntent = (transcript: string): ThresholdIntent | null => {
  const text = transcript.toLowerCase().replace(/[^a-z\s']/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.split(' ').length > 8) return null; // command, not a paragraph
  if (LONGER.some((re) => re.test(text))) return { direction: 'longer' };
  if (SHORTER.some((re) => re.test(text))) return { direction: 'shorter' };
  return null;
};
