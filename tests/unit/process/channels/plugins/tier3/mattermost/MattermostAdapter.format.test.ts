/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for MattermostAdapter outgoing helpers:
 * splitMattermostMessage, toMattermostPostPayload, toMattermostEditPayload.
 */

import { describe, expect, it } from 'vitest';

import {
  MATTERMOST_MESSAGE_LIMIT,
  splitMattermostMessage,
  toMattermostEditPayload,
  toMattermostPostPayload,
} from '@process/channels/plugins/tier3/mattermost/MattermostAdapter';

describe('splitMattermostMessage', () => {
  it('returns single chunk for short text', () => {
    const result = splitMattermostMessage('hello world');
    expect(result).toEqual(['hello world']);
  });

  it('returns single chunk for text exactly at the limit', () => {
    const text = 'a'.repeat(MATTERMOST_MESSAGE_LIMIT);
    const result = splitMattermostMessage(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it('splits text exceeding limit into multiple chunks', () => {
    const text = 'word '.repeat(Math.ceil((MATTERMOST_MESSAGE_LIMIT * 2) / 5)).trimEnd();
    const result = splitMattermostMessage(text);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(MATTERMOST_MESSAGE_LIMIT);
    }
  });

  it('preserves all text content across chunks', () => {
    const text = 'a'.repeat(MATTERMOST_MESSAGE_LIMIT + 100);
    const result = splitMattermostMessage(text);
    // Joining chunks should reproduce the original text (minus any split newlines).
    const joined = result.join('');
    expect(joined.length).toBe(text.length);
  });

  it('splits on newlines when possible', () => {
    // Build text with newlines well within limit so split naturally occurs at \n.
    const line = 'a'.repeat(MATTERMOST_MESSAGE_LIMIT - 10);
    const text = line + '\n' + line;
    const result = splitMattermostMessage(text, MATTERMOST_MESSAGE_LIMIT);
    expect(result.length).toBeGreaterThan(1);
    // No individual chunk should exceed the limit.
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(MATTERMOST_MESSAGE_LIMIT);
    }
  });

  it('respects a custom limit', () => {
    const text = 'hello world this is a test message';
    const result = splitMattermostMessage(text, 10);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(10);
    }
  });
});

describe('toMattermostPostPayload', () => {
  it('builds a basic post payload', () => {
    const result = toMattermostPostPayload('channel-123', { type: 'text', text: 'hello' });
    expect(result).toEqual({ channel_id: 'channel-123', message: 'hello' });
  });

  it('includes root_id when provided', () => {
    const result = toMattermostPostPayload(
      'channel-123',
      { type: 'text', text: 'reply' },
      'root-post-id',
    );
    expect(result.root_id).toBe('root-post-id');
  });

  it('uses empty string for missing text', () => {
    const result = toMattermostPostPayload('channel-123', { type: 'text' });
    expect(result.message).toBe('');
  });

  it('does not include root_id when not provided', () => {
    const result = toMattermostPostPayload('channel-123', { type: 'text', text: 'hello' });
    expect('root_id' in result).toBe(false);
  });
});

describe('toMattermostEditPayload', () => {
  it('builds an edit payload with the post id', () => {
    const result = toMattermostEditPayload('post-id-999', { type: 'text', text: 'updated text' });
    expect(result).toEqual({ id: 'post-id-999', message: 'updated text' });
  });

  it('uses empty string for missing text', () => {
    const result = toMattermostEditPayload('post-id-999', { type: 'text' });
    expect(result.message).toBe('');
  });
});
