/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * TwitchAdapter incoming message parsing tests.
 * Pure functions - no mocks required.
 */

import { describe, expect, it } from 'vitest';

import {
  extractTwitchRoles,
  toUnifiedIncomingFromTwitch,
  type TmiMessageEvent,
  type TwitchRoles,
} from '@process/channels/plugins/tier3/twitch/TwitchAdapter';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<TmiMessageEvent> = {}): TmiMessageEvent {
  return {
    channel: '#mychannel',
    userstate: {
      id: 'msg-id-123',
      'user-id': 'user-456',
      username: 'chatter',
      'display-name': 'Chatter',
      'message-type': 'chat',
    },
    message: 'Hello world!',
    self: false,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('toUnifiedIncomingFromTwitch - text message', () => {
  it('converts a normal chat message to unified format', () => {
    const msg = toUnifiedIncomingFromTwitch(makeEvent());
    expect(msg).not.toBeNull();
    expect(msg!.platform).toBe('twitch');
    expect(msg!.chatId).toBe('mychannel'); // # stripped
    expect(msg!.content.type).toBe('text');
    expect(msg!.content.text).toBe('Hello world!');
    expect(msg!.user.id).toBe('user-456');
    expect(msg!.user.username).toBe('chatter');
    expect(msg!.user.displayName).toBe('Chatter');
    expect(msg!.id).toBe('msg-id-123');
  });

  it('uses userstate.id as message id when present', () => {
    const msg = toUnifiedIncomingFromTwitch(makeEvent({ userstate: { ...makeEvent().userstate, id: 'abc-xyz' } }));
    expect(msg!.id).toBe('abc-xyz');
  });

  it('falls back to randomUUID when userstate.id is absent', () => {
    const event = makeEvent();
    delete event.userstate.id;
    const msg = toUnifiedIncomingFromTwitch(event);
    expect(msg).not.toBeNull();
    expect(typeof msg!.id).toBe('string');
    expect(msg!.id.length).toBeGreaterThan(0);
  });
});

describe('toUnifiedIncomingFromTwitch - emotes preserved as text', () => {
  it('passes emote words through unchanged', () => {
    // tmi.js delivers the raw chat text including emote words.
    const msg = toUnifiedIncomingFromTwitch(makeEvent({ message: 'Good luck HeyGuys PogChamp' }));
    expect(msg).not.toBeNull();
    expect(msg!.content.text).toBe('Good luck HeyGuys PogChamp');
  });
});

describe('toUnifiedIncomingFromTwitch - /me action message', () => {
  it('passes through action messages', () => {
    const msg = toUnifiedIncomingFromTwitch(
      makeEvent({
        userstate: { ...makeEvent().userstate, 'message-type': 'action' },
        message: 'waves at everyone',
      }),
    );
    expect(msg).not.toBeNull();
    expect(msg!.content.text).toBe('waves at everyone');
  });
});

describe('toUnifiedIncomingFromTwitch - filtered events', () => {
  it('returns null for self=true (own bot messages)', () => {
    expect(toUnifiedIncomingFromTwitch(makeEvent({ self: true }))).toBeNull();
  });

  it('returns null for empty message', () => {
    expect(toUnifiedIncomingFromTwitch(makeEvent({ message: '   ' }))).toBeNull();
  });

  it('returns null for non-chat message types (e.g. whisper handled elsewhere)', () => {
    const event = makeEvent();
    event.userstate['message-type'] = 'whisper';
    expect(toUnifiedIncomingFromTwitch(event)).toBeNull();
  });
});

describe('toUnifiedIncomingFromTwitch - channel normalisation', () => {
  it('strips leading # from channel name', () => {
    const msg = toUnifiedIncomingFromTwitch(makeEvent({ channel: '#StreamerName' }));
    expect(msg!.chatId).toBe('streamername');
  });

  it('lowercases channel name', () => {
    const msg = toUnifiedIncomingFromTwitch(makeEvent({ channel: 'StreamerName' }));
    expect(msg!.chatId).toBe('streamername');
  });
});

describe('toUnifiedIncomingFromTwitch - fallback user fields', () => {
  it('falls back to username when display-name is absent', () => {
    const event = makeEvent();
    delete event.userstate['display-name'];
    const msg = toUnifiedIncomingFromTwitch(event);
    expect(msg!.user.displayName).toBe('chatter');
  });

  it('falls back to username as id when user-id is absent', () => {
    const event = makeEvent();
    delete event.userstate['user-id'];
    const msg = toUnifiedIncomingFromTwitch(event);
    expect(msg!.user.id).toBe('chatter');
  });
});

describe('extractTwitchRoles - F-3 role/badge surfacing', () => {
  it('flags a moderator with subscriber badge', () => {
    const roles = extractTwitchRoles({
      username: 'modsub',
      mod: '1',
      subscriber: '1',
      badges: { moderator: '1', subscriber: '12' },
    });
    expect(roles).toEqual<TwitchRoles>({
      isMod: true,
      isVip: false,
      isSubscriber: true,
      isBroadcaster: false,
      badges: { moderator: '1', subscriber: '12' },
    });
  });

  it('flags a broadcaster from badges.broadcaster', () => {
    const roles = extractTwitchRoles({
      username: 'streamer',
      badges: { broadcaster: '1' },
    });
    expect(roles.isBroadcaster).toBe(true);
  });

  it('flags a VIP', () => {
    const roles = extractTwitchRoles({ username: 'vip', vip: '1' });
    expect(roles.isVip).toBe(true);
  });

  it('returns all-false roles for an anonymous chatter', () => {
    const roles = extractTwitchRoles({ username: 'rando' });
    expect(roles).toEqual<TwitchRoles>({
      isMod: false,
      isVip: false,
      isSubscriber: false,
      isBroadcaster: false,
      badges: {},
    });
  });

  it('surfaces roles inside the unified message raw field', () => {
    const msg = toUnifiedIncomingFromTwitch(
      makeEvent({
        userstate: {
          ...makeEvent().userstate,
          mod: '1',
          subscriber: '1',
          badges: { moderator: '1', subscriber: '6' },
        },
      }),
    );
    expect(msg).not.toBeNull();
    const raw = msg!.raw as { roles: TwitchRoles };
    expect(raw.roles.isMod).toBe(true);
    expect(raw.roles.isSubscriber).toBe(true);
    expect(raw.roles.badges['moderator']).toBe('1');
  });
});
