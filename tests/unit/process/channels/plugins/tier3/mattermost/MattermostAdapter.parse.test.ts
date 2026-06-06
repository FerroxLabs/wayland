/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for MattermostAdapter incoming helpers:
 * parseMattermostWsEvent, extractPostFromEvent, toUnifiedIncomingFromMattermost.
 */

import { describe, expect, it } from 'vitest';

import {
  extractPostFromEvent,
  parseMattermostWsEvent,
  toUnifiedIncomingFromMattermost,
  type MattermostEventPayload,
  type MattermostPost,
} from '@process/channels/plugins/tier3/mattermost/MattermostAdapter';

const SELF_USER = 'bot-user-id';

function makePost(overrides: Partial<MattermostPost> = {}): MattermostPost {
  return {
    id: 'post-abc',
    user_id: 'alice-id',
    channel_id: 'channel-xyz',
    message: 'hello world',
    root_id: null,
    create_at: 1_700_000_000_000,
    type: '',
    ...overrides,
  };
}

function makeEvent(post: MattermostPost, overrides: Partial<MattermostEventPayload> = {}): MattermostEventPayload {
  return {
    event: 'posted',
    data: { post: JSON.stringify(post) },
    broadcast: { channel_id: post.channel_id ?? '' },
    ...overrides,
  };
}

// ── parseMattermostWsEvent ────────────────────────────────────────────────────

describe('parseMattermostWsEvent', () => {
  it('parses valid JSON into an event payload', () => {
    const raw = JSON.stringify({ event: 'posted', data: {} });
    const result = parseMattermostWsEvent(raw);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('posted');
  });

  it('returns null for invalid JSON', () => {
    expect(parseMattermostWsEvent('not-json')).toBeNull();
    expect(parseMattermostWsEvent('')).toBeNull();
    expect(parseMattermostWsEvent('{broken')).toBeNull();
  });
});

// ── extractPostFromEvent ──────────────────────────────────────────────────────

describe('extractPostFromEvent', () => {
  it('extracts a post from a JSON-string data.post field', () => {
    const post = makePost();
    const evt = makeEvent(post);
    const result = extractPostFromEvent(evt);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('post-abc');
    expect(result!.message).toBe('hello world');
  });

  it('extracts a post when data.post is already an object', () => {
    const post = makePost();
    const evt: MattermostEventPayload = {
      event: 'posted',
      data: { post },
    };
    const result = extractPostFromEvent(evt);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('post-abc');
  });

  it('returns null when data.post is missing', () => {
    const result = extractPostFromEvent({ event: 'posted', data: {} });
    expect(result).toBeNull();
  });

  it('returns null when data.post is invalid JSON string', () => {
    const result = extractPostFromEvent({ event: 'posted', data: { post: '{bad}' as unknown as MattermostPost } });
    expect(result).toBeNull();
  });
});

// ── toUnifiedIncomingFromMattermost ───────────────────────────────────────────

describe('toUnifiedIncomingFromMattermost - happy path', () => {
  it('converts a posted event to a unified message', () => {
    const post = makePost();
    const evt = makeEvent(post);
    const result = toUnifiedIncomingFromMattermost(evt, SELF_USER);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('post-abc');
    expect(result!.platform).toBe('mattermost');
    expect(result!.chatId).toBe('channel-xyz');
    expect(result!.content.type).toBe('text');
    expect(result!.content.text).toBe('hello world');
    expect(result!.user.id).toBe('alice-id');
    expect(result!.timestamp).toBe(1_700_000_000_000);
  });

  it('uses broadcast.channel_id when post.channel_id is absent', () => {
    const post = makePost({ channel_id: null });
    const evt: MattermostEventPayload = {
      event: 'posted',
      data: { post: JSON.stringify(post) },
      broadcast: { channel_id: 'broadcast-channel' },
    };
    const result = toUnifiedIncomingFromMattermost(evt, SELF_USER);
    expect(result).not.toBeNull();
    expect(result!.chatId).toBe('broadcast-channel');
  });

  it('sets replyToMessageId when root_id is present', () => {
    const post = makePost({ root_id: 'parent-post-id' });
    const evt = makeEvent(post);
    const result = toUnifiedIncomingFromMattermost(evt, SELF_USER);
    expect(result).not.toBeNull();
    expect(result!.replyToMessageId).toBe('parent-post-id');
  });

  it('falls back to Date.now() when create_at is null', () => {
    const before = Date.now();
    const post = makePost({ create_at: null });
    const evt = makeEvent(post);
    const result = toUnifiedIncomingFromMattermost(evt, SELF_USER);
    const after = Date.now();
    expect(result).not.toBeNull();
    expect(result!.timestamp).toBeGreaterThanOrEqual(before);
    expect(result!.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('toUnifiedIncomingFromMattermost - skip conditions', () => {
  it('returns null for non-posted events', () => {
    const evt: MattermostEventPayload = { event: 'typing', data: {} };
    expect(toUnifiedIncomingFromMattermost(evt, SELF_USER)).toBeNull();
  });

  it('returns null for messages from the bot itself (echo filter)', () => {
    const post = makePost({ user_id: SELF_USER });
    const evt = makeEvent(post);
    expect(toUnifiedIncomingFromMattermost(evt, SELF_USER)).toBeNull();
  });

  it('returns null for system messages (non-empty type)', () => {
    const post = makePost({ type: 'system_join_channel' });
    const evt = makeEvent(post);
    expect(toUnifiedIncomingFromMattermost(evt, SELF_USER)).toBeNull();
  });

  it('returns null for empty messages', () => {
    const post = makePost({ message: '   ' });
    const evt = makeEvent(post);
    expect(toUnifiedIncomingFromMattermost(evt, SELF_USER)).toBeNull();
  });

  it('returns null when post extraction fails', () => {
    const evt: MattermostEventPayload = { event: 'posted', data: {} };
    expect(toUnifiedIncomingFromMattermost(evt, SELF_USER)).toBeNull();
  });
});

// ── sender_name vs UUID (Audit MED 2026-05-18) ────────────────────────────────

describe('toUnifiedIncomingFromMattermost - sender_name resolution', () => {
  it('uses data.sender_name for username/displayName when present', () => {
    const post = makePost();
    const evt: MattermostEventPayload = {
      event: 'posted',
      data: { post: JSON.stringify(post), sender_name: '@alice' },
      broadcast: { channel_id: post.channel_id ?? '' },
    };
    const result = toUnifiedIncomingFromMattermost(evt, SELF_USER);
    expect(result).not.toBeNull();
    // id remains the immutable UUID so downstream consumers can still
    // reconcile against /api/v4/users/{id} if needed.
    expect(result!.user.id).toBe('alice-id');
    expect(result!.user.username).toBe('@alice');
    expect(result!.user.displayName).toBe('@alice');
  });

  it('falls back to user_id when sender_name is missing', () => {
    const post = makePost();
    const evt = makeEvent(post); // no sender_name in data
    const result = toUnifiedIncomingFromMattermost(evt, SELF_USER);
    expect(result).not.toBeNull();
    expect(result!.user.id).toBe('alice-id');
    expect(result!.user.username).toBe('alice-id');
    expect(result!.user.displayName).toBe('alice-id');
  });
});
