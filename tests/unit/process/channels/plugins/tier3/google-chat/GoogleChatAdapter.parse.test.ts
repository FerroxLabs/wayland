/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  googleChatEventToUnified,
  type GoogleChatEvent,
} from '@process/channels/plugins/tier3/google-chat/GoogleChatAdapter';

const PLUGIN_ID = 'google-chat_default';

function makeMessageEvent(overrides: Partial<GoogleChatEvent> = {}): GoogleChatEvent {
  return {
    type: 'MESSAGE',
    eventTime: '2026-05-18T00:00:00Z',
    space: { name: 'spaces/AAABBBCCC', displayName: 'General' },
    user: {
      name: 'users/12345',
      displayName: 'Alice',
      email: 'alice@example.com',
    },
    message: {
      name: 'spaces/AAABBBCCC/messages/MSG001',
      text: 'Hello bot',
    },
    ...overrides,
  };
}

describe('googleChatEventToUnified - parse', () => {
  it('converts a MESSAGE event with text to a unified message', () => {
    const event = makeMessageEvent();
    const result = googleChatEventToUnified(event, PLUGIN_ID);

    expect(result).not.toBeNull();
    expect(result!.platform).toBe('google-chat');
    expect(result!.chatId).toBe('spaces/AAABBBCCC');
    expect(result!.id).toBe('spaces/AAABBBCCC/messages/MSG001');
    expect(result!.content.text).toBe('Hello bot');
    expect(result!.user.id).toBe('users/12345');
    expect(result!.user.displayName).toBe('Alice');
    expect(result!.user.username).toBe('alice@example.com');
  });

  it('parses eventTime into a numeric timestamp', () => {
    const event = makeMessageEvent({ eventTime: '2026-05-18T12:30:00Z' });
    const result = googleChatEventToUnified(event, PLUGIN_ID);
    expect(result).not.toBeNull();
    expect(result!.timestamp).toBe(new Date('2026-05-18T12:30:00Z').getTime());
  });

  it('falls back to Date.now() when eventTime is absent', () => {
    const before = Date.now();
    const event = makeMessageEvent({ eventTime: undefined });
    const result = googleChatEventToUnified(event, PLUGIN_ID);
    const after = Date.now();
    expect(result).not.toBeNull();
    expect(result!.timestamp).toBeGreaterThanOrEqual(before);
    expect(result!.timestamp).toBeLessThanOrEqual(after);
  });

  it('uses argumentText when text is absent', () => {
    const event = makeMessageEvent({
      message: {
        name: 'spaces/X/messages/Y',
        argumentText: '/help topic',
      },
    });
    const result = googleChatEventToUnified(event, PLUGIN_ID);
    expect(result).not.toBeNull();
    expect(result!.content.text).toBe('/help topic');
  });

  it('uses message.sender when top-level user is absent', () => {
    const event = makeMessageEvent({
      user: undefined,
      message: {
        name: 'spaces/X/messages/Z',
        text: 'Hello',
        sender: { name: 'users/99', displayName: 'Bob', email: 'bob@example.com' },
      },
    });
    const result = googleChatEventToUnified(event, PLUGIN_ID);
    expect(result).not.toBeNull();
    expect(result!.user.id).toBe('users/99');
    expect(result!.user.displayName).toBe('Bob');
  });

  it('returns null when space.name is absent (would otherwise 404 on reply)', () => {
    // Regression guard: previously this fell back to pluginInstanceId, which
    // turned downstream sendMessage(chatId,…) into a POST against
    // `/v1/google-chat_default/messages` - 404 every time. Now we drop the
    // event the same way we drop empty-text MESSAGE events.
    const eventEmptySpace = makeMessageEvent({ space: {} });
    expect(googleChatEventToUnified(eventEmptySpace, PLUGIN_ID)).toBeNull();

    const eventNoSpace = makeMessageEvent({ space: undefined });
    expect(googleChatEventToUnified(eventNoSpace, PLUGIN_ID)).toBeNull();
  });

  it('returns null for ADDED_TO_SPACE events', () => {
    const event: GoogleChatEvent = {
      type: 'ADDED_TO_SPACE',
      space: { name: 'spaces/X' },
    };
    expect(googleChatEventToUnified(event, PLUGIN_ID)).toBeNull();
  });

  it('returns null for REMOVED_FROM_SPACE events', () => {
    const event: GoogleChatEvent = {
      type: 'REMOVED_FROM_SPACE',
      space: { name: 'spaces/X' },
    };
    expect(googleChatEventToUnified(event, PLUGIN_ID)).toBeNull();
  });

  it('returns null for CARD_CLICKED events', () => {
    const event: GoogleChatEvent = {
      type: 'CARD_CLICKED',
      space: { name: 'spaces/X' },
    };
    expect(googleChatEventToUnified(event, PLUGIN_ID)).toBeNull();
  });

  it('returns null for MESSAGE events with empty text and no argumentText', () => {
    const event = makeMessageEvent({
      message: { name: undefined, text: '', argumentText: '' },
    });
    expect(googleChatEventToUnified(event, PLUGIN_ID)).toBeNull();
  });

  it('handles eventType field (lowercase API variant) in addition to type', () => {
    const event: GoogleChatEvent = {
      eventType: 'MESSAGE',
      space: { name: 'spaces/Y' },
      message: { name: 'spaces/Y/messages/M1', text: 'hi' },
      user: { name: 'users/1', displayName: 'Dan' },
    };
    const result = googleChatEventToUnified(event, PLUGIN_ID);
    expect(result).not.toBeNull();
    expect(result!.content.text).toBe('hi');
  });

  it('preserves raw event on the unified message', () => {
    const event = makeMessageEvent();
    const result = googleChatEventToUnified(event, PLUGIN_ID);
    expect(result!.raw).toBe(event);
  });
});
