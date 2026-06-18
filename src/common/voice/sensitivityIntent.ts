/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type SensitivityIntent = { direction: 'less' | 'more' };

const LESS = [
  /\bit'?s noisy\b/,
  /\b(too much |a lot of )?background noise\b/,
  /\byou keep picking up noise\b/,
  /\bstop picking up (the )?(background )?noise\b/,
  /\byou'?re too sensitive\b/,
  /\bignore the (background )?noise\b/,
  /\bit'?s loud (in here)?\b/,
];

const MORE = [
  /\byou'?re not hearing me\b/,
  /\byou (can'?t|cannot) hear me\b/,
  /\bbe more sensitive\b/,
  /\blisten harder\b/,
  /\bi'?m too quiet\b/,
];

/**
 * Local intent match for live mic-sensitivity tuning by voice. Only fires on
 * short, command-like utterances (<= 8 words) so a long sentence that merely
 * contains "it's noisy" is sent as a normal message, not interpreted.
 * Returns null for normal utterances (the controller then sends them).
 */
export const detectSensitivityIntent = (transcript: string): SensitivityIntent | null => {
  const text = transcript.toLowerCase().replace(/[^a-z\s']/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.split(' ').length > 8) return null; // command, not a paragraph
  if (LESS.some((re) => re.test(text))) return { direction: 'less' };
  if (MORE.some((re) => re.test(text))) return { direction: 'more' };
  return null;
};
