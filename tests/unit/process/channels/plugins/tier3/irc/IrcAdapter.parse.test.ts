/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for IrcAdapter.toUnifiedIncomingFromIrc - incoming PRIVMSG → unified message.
 */

import { describe, expect, it } from 'vitest';

import { toUnifiedIncomingFromIrc, type IrcPrivmsgEvent } from '@process/channels/plugins/tier3/irc/IrcAdapter';

const SELF_NICK = 'wayland-bot';

function privmsg(overrides: Partial<IrcPrivmsgEvent> = {}): IrcPrivmsgEvent {
  return {
    nick: 'alice',
    target: '#wayland-bots',
    message: 'hello world',
    ...overrides,
  };
}

describe('toUnifiedIncomingFromIrc - happy paths', () => {
  it('converts a plain channel PRIVMSG to a unified message', () => {
    const result = toUnifiedIncomingFromIrc(privmsg(), SELF_NICK);
    expect(result).not.toBeNull();
    expect(result!.platform).toBe('irc');
    expect(result!.chatId).toBe('#wayland-bots');
    expect(result!.content.text).toBe('hello world');
    expect(result!.content.type).toBe('text');
    expect(result!.user.id).toBe('alice');
    expect(result!.user.username).toBe('alice');
    expect(result!.user.displayName).toBe('alice');
    expect(typeof result!.id).toBe('string');
    expect(result!.id.length).toBeGreaterThan(0);
  });

  it('uses sender nick as chatId for direct (private) messages', () => {
    const result = toUnifiedIncomingFromIrc(
      privmsg({ target: SELF_NICK, nick: 'bob', message: 'hey bot' }),
      SELF_NICK,
    );
    expect(result).not.toBeNull();
    expect(result!.chatId).toBe('bob');
  });

  it('strips mIRC color codes from incoming text', () => {
    // \x0304red\x03 = color code 04 (red)
    const result = toUnifiedIncomingFromIrc(
      privmsg({ message: '\x0304red text\x03 normal' }),
      SELF_NICK,
    );
    expect(result).not.toBeNull();
    expect(result!.content.text).toBe('red text normal');
  });

  it('strips bold/italic/underline control chars', () => {
    const result = toUnifiedIncomingFromIrc(
      // bold=\x02, underline=\x1f, italic=\x1d, reset=\x0f
      privmsg({ message: '\x02bold\x02 and \x1funderline\x0f' }),
      SELF_NICK,
    );
    expect(result).not.toBeNull();
    expect(result!.content.text).toBe('bold and underline');
  });

  it('converts /me ACTION CTCP to a readable emote line', () => {
    const result = toUnifiedIncomingFromIrc(
      privmsg({ message: '\x01ACTION waves at everyone\x01' }),
      SELF_NICK,
    );
    expect(result).not.toBeNull();
    expect(result!.content.text).toBe('* alice waves at everyone');
  });

  it('assigns each message a unique id', () => {
    const a = toUnifiedIncomingFromIrc(privmsg(), SELF_NICK);
    const b = toUnifiedIncomingFromIrc(privmsg(), SELF_NICK);
    expect(a!.id).not.toBe(b!.id);
  });

  it('sets timestamp to a recent unix epoch ms', () => {
    const before = Date.now();
    const result = toUnifiedIncomingFromIrc(privmsg(), SELF_NICK);
    const after = Date.now();
    expect(result!.timestamp).toBeGreaterThanOrEqual(before);
    expect(result!.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('toUnifiedIncomingFromIrc - skip conditions', () => {
  it('returns null for messages from our own nick (echo filter)', () => {
    const result = toUnifiedIncomingFromIrc(
      privmsg({ nick: SELF_NICK }),
      SELF_NICK,
    );
    expect(result).toBeNull();
  });

  it('echo filter is case-insensitive', () => {
    const result = toUnifiedIncomingFromIrc(
      privmsg({ nick: SELF_NICK.toUpperCase() }),
      SELF_NICK,
    );
    expect(result).toBeNull();
  });

  it('returns null for non-ACTION CTCP messages (VERSION, PING, etc.)', () => {
    expect(toUnifiedIncomingFromIrc(privmsg({ message: '\x01VERSION\x01' }), SELF_NICK)).toBeNull();
    expect(toUnifiedIncomingFromIrc(privmsg({ message: '\x01PING 12345\x01' }), SELF_NICK)).toBeNull();
    expect(toUnifiedIncomingFromIrc(privmsg({ message: '\x01TIME\x01' }), SELF_NICK)).toBeNull();
  });

  it('returns null for messages that are empty after stripping control chars', () => {
    // A message that is entirely control characters becomes empty.
    const result = toUnifiedIncomingFromIrc(
      privmsg({ message: '\x02\x1f\x0f' }),
      SELF_NICK,
    );
    expect(result).toBeNull();
  });
});
