/*
 * Portions adapted from OpenClaw <https://github.com/openclaw/openclaw>@aee2681a
 * Source: extensions/slack/src/blocks-fallback.ts
 * MIT License - Copyright (c) 2025 Peter Steinberger
 * Used per MIT permission grant; Wayland additions remain under Apache-2.0.
 */
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Block, KnownBlock } from '@slack/web-api';

type PlainTextObject = { text?: string };

type SlackBlockWithFields = {
  type?: string;
  text?: PlainTextObject & { type?: string };
  title?: PlainTextObject;
  alt_text?: string;
  elements?: Array<{ text?: string; type?: string }>;
};

function cleanCandidate(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : undefined;
}

function readContextText(block: SlackBlockWithFields): string | undefined {
  if (!Array.isArray(block.elements)) {
    return undefined;
  }
  const textParts = block.elements
    .map((element) => cleanCandidate(element.text))
    .filter((value): value is string => Boolean(value));
  return textParts.length > 0 ? textParts.join(' ') : undefined;
}

export function buildSlackBlocksFallbackText(blocks: (Block | KnownBlock)[]): string {
  for (const raw of blocks) {
    const block = raw as SlackBlockWithFields;
    switch (block.type) {
      case 'header': {
        const text = cleanCandidate(block.text?.text);
        if (text) return text;
        break;
      }
      case 'section': {
        const text = cleanCandidate(block.text?.text);
        if (text) return text;
        break;
      }
      case 'image': {
        const text = cleanCandidate(block.alt_text) ?? cleanCandidate(block.title?.text);
        if (text) return text;
        return 'Shared an image';
      }
      case 'video': {
        const text = cleanCandidate(block.title?.text) ?? cleanCandidate(block.alt_text);
        if (text) return text;
        return 'Shared a video';
      }
      case 'file': {
        return 'Shared a file';
      }
      case 'context': {
        const text = readContextText(block);
        if (text) return text;
        break;
      }
      default:
        break;
    }
  }
  return 'Shared a Block Kit message';
}
