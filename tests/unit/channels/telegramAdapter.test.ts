/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { Context } from 'grammy';
import {
  balanceMarkdownMarkers,
  escapeHtml,
  markdownToTelegramHtml,
  toUnifiedIncomingMessage,
} from '@process/channels/plugins/telegram/TelegramAdapter';

describe('escapeHtml', () => {
  it('escapes ampersands, angle brackets', () => {
    expect(escapeHtml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('markdownToTelegramHtml', () => {
  it('converts bold markdown to HTML', () => {
    expect(markdownToTelegramHtml('**bold text**')).toBe('<b>bold text</b>');
  });

  it('converts italic markdown to HTML', () => {
    expect(markdownToTelegramHtml('*italic text*')).toBe('<i>italic text</i>');
  });

  it('converts inline code to HTML', () => {
    expect(markdownToTelegramHtml('use `code` here')).toBe('use <code>code</code> here');
  });

  it('converts code blocks to HTML', () => {
    const input = '```js\nconsole.log("hi")\n```';
    const result = markdownToTelegramHtml(input);
    expect(result).toContain('<pre><code>');
    expect(result).toContain('console.log');
    expect(result).toContain('</code></pre>');
  });

  it('converts markdown links to HTML', () => {
    expect(markdownToTelegramHtml('[Google](https://google.com)')).toBe('<a href="https://google.com">Google</a>');
  });

  it('escapes HTML entities within markdown', () => {
    expect(markdownToTelegramHtml('**a & b**')).toBe('<b>a &amp; b</b>');
  });

  it('handles mixed formatting', () => {
    const input = '**bold** and *italic* with `code`';
    const result = markdownToTelegramHtml(input);
    expect(result).toBe('<b>bold</b> and <i>italic</i> with <code>code</code>');
  });

  it('returns plain text with only HTML escaping when no markdown', () => {
    expect(markdownToTelegramHtml('plain text')).toBe('plain text');
  });

  // Streaming LLM partial-output safety
  it('balances an unclosed **bold marker so output is valid HTML', () => {
    const out = markdownToTelegramHtml('start **bold then truncated');
    expect(out).toContain('<b>');
    expect(out).toContain('</b>');
  });

  it('balances an unclosed *italic marker so output is valid HTML', () => {
    const out = markdownToTelegramHtml('start *italic then truncated');
    expect(out).toContain('<i>');
    expect(out).toContain('</i>');
  });

  it('balances an unclosed fenced code block', () => {
    const out = markdownToTelegramHtml('```ts\nconst x = 1; // never closed');
    expect(out).toContain('<pre><code>');
    expect(out).toContain('</code></pre>');
  });

  it('does not duplicate closers when markers are already balanced', () => {
    expect(markdownToTelegramHtml('**already closed**')).toBe('<b>already closed</b>');
  });
});

describe('balanceMarkdownMarkers', () => {
  it('returns input unchanged when all markers are balanced', () => {
    expect(balanceMarkdownMarkers('**a** *b* `c`')).toBe('**a** *b* `c`');
  });

  it('appends ** to close an unclosed bold marker', () => {
    expect(balanceMarkdownMarkers('hello **world')).toBe('hello **world**');
  });

  it('appends * to close an unclosed italic marker', () => {
    expect(balanceMarkdownMarkers('hi *there')).toBe('hi *there*');
  });

  it('ignores markers inside fenced code blocks', () => {
    const input = 'before ```\n**not bold**\n``` after';
    expect(balanceMarkdownMarkers(input)).toBe(input);
  });
});

describe('toUnifiedIncomingMessage - unsupported content types', () => {
  function makeCtx(messageOverrides: Record<string, unknown>): Context {
    return {
      message: {
        message_id: 1,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 42, type: 'private' },
        from: { id: 7, is_bot: false, first_name: 'Sean' },
        ...messageOverrides,
      },
    } as unknown as Context;
  }

  it('returns a descriptive sentinel for a location message instead of empty text', () => {
    const unified = toUnifiedIncomingMessage(makeCtx({ location: { latitude: 1, longitude: 2 } }));
    expect(unified?.content.type).toBe('text');
    expect(unified?.content.text).toBe('[unsupported telegram content: location]');
  });

  it('returns a descriptive sentinel for a poll message', () => {
    const unified = toUnifiedIncomingMessage(makeCtx({ poll: { id: 'p1', question: 'Q?' } }));
    expect(unified?.content.text).toBe('[unsupported telegram content: poll]');
  });

  it('returns a descriptive sentinel for a dice message', () => {
    const unified = toUnifiedIncomingMessage(makeCtx({ dice: { emoji: '🎲', value: 6 } }));
    expect(unified?.content.text).toBe('[unsupported telegram content: dice]');
  });

  it('returns a descriptive sentinel for a contact message', () => {
    const unified = toUnifiedIncomingMessage(makeCtx({ contact: { phone_number: '+1', first_name: 'X' } }));
    expect(unified?.content.text).toBe('[unsupported telegram content: contact]');
  });

  it('returns a descriptive sentinel for an animation (GIF) message', () => {
    const unified = toUnifiedIncomingMessage(makeCtx({ animation: { file_id: 'a1' } }));
    expect(unified?.content.text).toBe('[unsupported telegram content: animation]');
  });

  it('returns a descriptive sentinel for a video_note message', () => {
    const unified = toUnifiedIncomingMessage(makeCtx({ video_note: { file_id: 'vn1' } }));
    expect(unified?.content.text).toBe('[unsupported telegram content: video_note]');
  });
});
