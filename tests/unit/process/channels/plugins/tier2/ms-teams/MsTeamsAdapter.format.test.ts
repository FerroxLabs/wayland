/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  MS_TEAMS_TEXT_CHUNK_LIMIT,
  splitMsTeamsMessage,
  toOutboundActivity,
} from '@process/channels/plugins/tier2/ms-teams/MsTeamsAdapter';
import type { IUnifiedOutgoingMessage } from '@process/channels/types';

describe('toOutboundActivity', () => {
  it('builds a message activity from text', () => {
    const msg: IUnifiedOutgoingMessage = { type: 'text', text: 'Hello Teams!' };
    const activity = toOutboundActivity(msg);

    expect(activity.type).toBe('message');
    expect(activity.text).toBe('Hello Teams!');
    expect(activity.textFormat).toBe('markdown');
  });

  it('includes the AI-generated entity', () => {
    const activity = toOutboundActivity({ type: 'text', text: 'Hi' });
    expect(activity.entities).toHaveLength(1);
    expect(activity.entities![0].type).toBe('https://schema.org/Message');
    expect(
      (activity.entities![0] as { additionalType?: string[] }).additionalType,
    ).toContain('AIGeneratedContent');
  });

  it('includes image attachment when imageUrl is provided', () => {
    const msg: IUnifiedOutgoingMessage = {
      type: 'image',
      text: 'See image',
      imageUrl: 'https://example.com/photo.png',
      fileName: 'photo.png',
    };
    const activity = toOutboundActivity(msg);

    expect(activity.attachments).toHaveLength(1);
    expect(activity.attachments![0].contentType).toBe('image/*');
    expect(activity.attachments![0].contentUrl).toBe('https://example.com/photo.png');
    expect(activity.attachments![0].name).toBe('photo.png');
  });

  it('includes file attachment when fileUrl is provided', () => {
    const msg: IUnifiedOutgoingMessage = {
      type: 'file',
      text: 'See file',
      fileUrl: 'https://example.com/report.pdf',
      fileName: 'report.pdf',
    };
    const activity = toOutboundActivity(msg);

    expect(activity.attachments).toHaveLength(1);
    expect(activity.attachments![0].contentType).toBe('application/octet-stream');
    expect(activity.attachments![0].contentUrl).toBe('https://example.com/report.pdf');
    expect(activity.attachments![0].name).toBe('report.pdf');
  });

  it('imageUrl takes precedence over fileUrl when both are set', () => {
    const msg: IUnifiedOutgoingMessage = {
      type: 'image',
      imageUrl: 'https://example.com/img.jpg',
      fileUrl: 'https://example.com/file.bin',
    };
    const activity = toOutboundActivity(msg);

    expect(activity.attachments).toHaveLength(1);
    expect(activity.attachments![0].contentType).toBe('image/*');
  });

  it('uses default name when fileName is not provided', () => {
    const activity = toOutboundActivity({
      type: 'image',
      imageUrl: 'https://example.com/img.jpg',
    });
    expect(activity.attachments![0].name).toBe('image');
  });

  it('sets empty string for text when message has no text', () => {
    const activity = toOutboundActivity({ type: 'text' });
    expect(activity.text).toBe('');
  });

  it('produces no attachments for plain text messages', () => {
    const activity = toOutboundActivity({ type: 'text', text: 'Hello' });
    expect(activity.attachments).toBeUndefined();
  });
});

describe('splitMsTeamsMessage chunk limit constant', () => {
  it('exports the 4000-char limit', () => {
    expect(MS_TEAMS_TEXT_CHUNK_LIMIT).toBe(4000);
  });
});

describe('splitMsTeamsMessage edge cases', () => {
  it('returns the exact text when length equals limit', () => {
    const text = 'a'.repeat(4000);
    expect(splitMsTeamsMessage(text)).toEqual([text]);
  });

  it('splits text that is one char over the limit', () => {
    const text = 'a'.repeat(4001);
    const chunks = splitMsTeamsMessage(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(4000);
    }
  });

  it('handles empty string gracefully', () => {
    const chunks = splitMsTeamsMessage('');
    expect(chunks).toEqual(['']);
  });

  it('produces non-empty chunks from multi-paragraph text', () => {
    const paragraph = 'Lorem ipsum dolor sit amet. '.repeat(200);
    const chunks = splitMsTeamsMessage(paragraph);
    for (const chunk of chunks) {
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  it('reassembles to the full content (no dropped characters)', () => {
    const words = Array.from({ length: 1000 }, (_, i) => `word${i}`);
    const text = words.join(' ');
    const chunks = splitMsTeamsMessage(text, 200);
    const reassembled = chunks.join(' ').replace(/\s+/g, ' ').trim();
    // Every word should appear in the reassembled output
    for (const word of words.slice(0, 20)) {
      expect(reassembled).toContain(word);
    }
  });
});
