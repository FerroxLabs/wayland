/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SignalAdapter.parse - incoming Signal envelope → IUnifiedIncomingMessage.
 * Pure functions, no mocks needed.
 */

import { describe, expect, it } from 'vitest';

import {
  signalInboundToUnified,
  looksLikeUuid,
  normalizeSignalRecipient,
} from '@process/channels/plugins/tier1/signal/SignalAdapter';
import type { SignalInboundMessage } from '@process/channels/plugins/tier1/signal/SignalDaemon';

const SELF = '+14155551234';

function makeMsg(overrides: Partial<SignalInboundMessage['envelope']> = {}): SignalInboundMessage {
  return {
    envelope: {
      source: '+12125550100',
      sourceName: 'Alice',
      timestamp: 1_700_000_000_000,
      dataMessage: { message: 'Hello world', timestamp: 1_700_000_000_000 },
      ...overrides,
    },
  };
}

describe('signalInboundToUnified', () => {
  it('converts a basic text message correctly', () => {
    const msg = makeMsg();
    const result = signalInboundToUnified(msg, SELF);
    expect(result).not.toBeNull();
    expect(result!.platform).toBe('signal');
    expect(result!.content.type).toBe('text');
    expect(result!.content.text).toBe('Hello world');
    expect(result!.user.id).toBe('+12125550100');
    expect(result!.user.displayName).toBe('Alice');
    expect(result!.chatId).toBe('+12125550100');
    expect(result!.timestamp).toBe(1_700_000_000_000);
  });

  it('uses envelope timestamp as message id', () => {
    const msg = makeMsg();
    const result = signalInboundToUnified(msg, SELF);
    expect(result!.id).toBe('1700000000000');
  });

  it('returns null for self-sends (echo suppression)', () => {
    const msg = makeMsg({ source: SELF });
    expect(signalInboundToUnified(msg, SELF)).toBeNull();
  });

  it('returns null when there is no dataMessage (receipt/typing events)', () => {
    const msg: SignalInboundMessage = {
      envelope: { source: '+12125550100', timestamp: 1_700_000_000_000 },
    };
    expect(signalInboundToUnified(msg, SELF)).toBeNull();
  });

  it('returns null for reaction envelopes (handled separately)', () => {
    const msg = makeMsg({
      dataMessage: {
        message: '',
        timestamp: 1_700_000_000_000,
        reaction: { emoji: '👍', targetSentTimestamp: 1_699_999_999_999, targetAuthorUuid: 'some-uuid', isRemove: false },
      },
    });
    expect(signalInboundToUnified(msg, SELF)).toBeNull();
  });

  it('uses groupId as chatId for group messages', () => {
    const msg = makeMsg({
      dataMessage: {
        message: 'hi group',
        timestamp: 1_700_000_000_000,
        groupInfo: { groupId: 'abc123==' },
      },
    });
    const result = signalInboundToUnified(msg, SELF);
    expect(result!.chatId).toBe('group:abc123==');
  });

  it('falls back to sourceUuid when source phone is absent', () => {
    const msg: SignalInboundMessage = {
      envelope: {
        sourceUuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        sourceName: 'Bob',
        timestamp: 1_700_000_000_000,
        dataMessage: { message: 'uuid sender', timestamp: 1_700_000_000_000 },
      },
    };
    const result = signalInboundToUnified(msg, SELF);
    expect(result).not.toBeNull();
    expect(result!.user.id).toBe('uuid:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(result!.chatId).toBe('uuid:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
  });

  it('preserves the raw envelope in result.raw', () => {
    const msg = makeMsg();
    const result = signalInboundToUnified(msg, SELF);
    expect(result!.raw).toBe(msg);
  });
});

describe('looksLikeUuid', () => {
  it('returns true for standard UUID v4', () => {
    expect(looksLikeUuid('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')).toBe(true);
  });

  it('returns false for E.164 phone numbers', () => {
    expect(looksLikeUuid('+14155551234')).toBe(false);
  });

  it('returns false for group base64 ids', () => {
    expect(looksLikeUuid('abc123==')).toBe(false);
  });
});

describe('normalizeSignalRecipient', () => {
  it('passes through E.164 numbers unchanged', () => {
    expect(normalizeSignalRecipient('+14155551234')).toBe('+14155551234');
  });

  it('lowercases UUIDs', () => {
    const uuid = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE';
    expect(normalizeSignalRecipient(uuid)).toBe(uuid.toLowerCase());
  });

  it('passes through group: ids unchanged', () => {
    expect(normalizeSignalRecipient('group:abc123==')).toBe('group:abc123==');
  });

  it('strips signal: prefix before normalising', () => {
    expect(normalizeSignalRecipient('signal:+14155551234')).toBe('+14155551234');
  });

  it('throws on empty input', () => {
    expect(() => normalizeSignalRecipient('')).toThrow(/required/i);
  });

  it('throws on unrecognised format', () => {
    expect(() => normalizeSignalRecipient('not-a-phone-or-uuid')).toThrow(/normalise/i);
  });
});
