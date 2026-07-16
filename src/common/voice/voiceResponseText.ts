/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

const NON_SPEAKABLE_TYPE = /(tool|thinking|reasoning|plan|permission|confirmation|image|audio|usage|cost|error)/i;
const SAFE_TEXT_KEYS = ['text', 'content', 'message', 'answer', 'result', 'output'] as const;
const MAX_SPOKEN_CHARACTERS = 4_000;

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

export const normalizeVoiceResponseText = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, ' I left the code in the chat. ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' I added an image in the chat. ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
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
