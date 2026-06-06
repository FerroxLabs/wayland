/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for NextcloudTalkAdapter - incoming message parsing.
 * toUnifiedIncomingFromNextcloudTalk: text message, system message dropped,
 * echo dropped, empty text dropped, reaction event, parent (reply) threading.
 */

import { describe, expect, it } from 'vitest';

import {
  toUnifiedIncomingFromNextcloudTalk,
  type NextcloudTalkChatMessage,
} from '@process/channels/plugins/tier3/nextcloud-talk/NextcloudTalkAdapter';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMsg(overrides: Partial<NextcloudTalkChatMessage> = {}): NextcloudTalkChatMessage {
  return {
    id: 42,
    timestamp: 1_700_000_000,
    systemMessage: '',
    message: 'hello world',
    actorType: 'users',
    actorId: 'alice',
    actorDisplayName: 'Alice',
    ...overrides,
  };
}

const ROOM = 'abc123';
const SELF = 'bot';

// ── Text message ──────────────────────────────────────────────────────────────

describe('toUnifiedIncomingFromNextcloudTalk - text message', () => {
  it('converts a standard user message to IUnifiedIncomingMessage', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(makeMsg(), ROOM, SELF);
    expect(result).not.toBeNull();
    expect(result!.platform).toBe('nextcloud-talk');
    expect(result!.chatId).toBe(ROOM);
    expect(result!.content.type).toBe('text');
    expect(result!.content.text).toBe('hello world');
    expect(result!.user.id).toBe('alice');
    expect(result!.user.username).toBe('alice');
    expect(result!.user.displayName).toBe('Alice');
  });

  it('converts the unix timestamp (seconds) to milliseconds', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({ timestamp: 1_700_000_000 }),
      ROOM,
      SELF,
    );
    expect(result!.timestamp).toBe(1_700_000_000 * 1000);
  });

  it('falls back to actorId for displayName when actorDisplayName is empty', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({ actorDisplayName: '' }),
      ROOM,
      SELF,
    );
    expect(result!.user.displayName).toBe('alice');
  });

  it('generates a unique id (UUID) for each message', () => {
    const r1 = toUnifiedIncomingFromNextcloudTalk(makeMsg(), ROOM, SELF);
    const r2 = toUnifiedIncomingFromNextcloudTalk(makeMsg(), ROOM, SELF);
    expect(r1!.id).not.toBe(r2!.id);
  });

  it('trims leading/trailing whitespace from message text', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({ message: '  hi  ' }),
      ROOM,
      SELF,
    );
    expect(result!.content.text).toBe('hi');
  });
});

// ── System / non-message events dropped ──────────────────────────────────────

describe('toUnifiedIncomingFromNextcloudTalk - system events dropped', () => {
  it('returns null for system messages (user joined)', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({ systemMessage: 'user_added' }),
      ROOM,
      SELF,
    );
    expect(result).toBeNull();
  });

  it('returns null for call_started system message', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({ systemMessage: 'call_started' }),
      ROOM,
      SELF,
    );
    expect(result).toBeNull();
  });

  it('returns null for empty message text', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({ message: '' }),
      ROOM,
      SELF,
    );
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only message text', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({ message: '   ' }),
      ROOM,
      SELF,
    );
    expect(result).toBeNull();
  });
});

// ── Echo filter ───────────────────────────────────────────────────────────────

describe('toUnifiedIncomingFromNextcloudTalk - echo filter', () => {
  it('returns null for messages sent by the bot itself', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({ actorId: SELF }),
      ROOM,
      SELF,
    );
    expect(result).toBeNull();
  });

  it('does not filter messages from other users with similar names', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({ actorId: 'bot2' }),
      ROOM,
      SELF,
    );
    expect(result).not.toBeNull();
  });
});

// ── Reply threading ───────────────────────────────────────────────────────────

describe('toUnifiedIncomingFromNextcloudTalk - reply threading', () => {
  it('populates replyToMessageId when parent is present', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(
      makeMsg({
        parent: {
          id: 10,
          message: 'original',
          actorId: 'bot',
          actorDisplayName: 'Bot',
        },
      }),
      ROOM,
      SELF,
    );
    expect(result!.replyToMessageId).toBe('10');
  });

  it('leaves replyToMessageId undefined when no parent', () => {
    const result = toUnifiedIncomingFromNextcloudTalk(makeMsg(), ROOM, SELF);
    expect(result!.replyToMessageId).toBeUndefined();
  });
});
