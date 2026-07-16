/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChannelWelcomeService } from '@process/channels/gateway/ChannelWelcomeService';

// In-memory stand-in for the channel_welcome table so we can assert the
// once-per-account behaviour without a real database.
const hoisted = vi.hoisted(() => {
  const welcomed = new Set<string>();
  const key = (platform: string, accountId: string): string => `${platform}::${accountId}`;
  const fakeDb = {
    hasChannelWelcomed: vi.fn((platform: string, accountId: string) => ({
      success: true,
      data: welcomed.has(key(platform, accountId)),
    })),
    markChannelWelcomed: vi.fn((platform: string, accountId: string) => {
      welcomed.add(key(platform, accountId));
      return { success: true, data: true };
    }),
    clearChannelWelcome: vi.fn((platform: string, accountId: string) => {
      const existed = welcomed.delete(key(platform, accountId));
      return { success: true, data: existed };
    }),
  };
  return { welcomed, fakeDb };
});

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => hoisted.fakeDb),
}));

vi.mock('@process/services/i18n', () => ({
  default: { t: (_k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? 'welcome' },
}));

describe('ChannelWelcomeService', () => {
  let svc: ChannelWelcomeService;

  beforeEach(() => {
    hoisted.welcomed.clear();
    hoisted.fakeDb.hasChannelWelcomed.mockClear();
    hoisted.fakeDb.markChannelWelcomed.mockClear();
    hoisted.fakeDb.clearChannelWelcome.mockClear();
    svc = new ChannelWelcomeService();
  });

  it('welcomeOnConnect sends once and marks the account welcomed', async () => {
    const send = vi.fn(async () => 'msg-1');
    const sent = await svc.welcomeOnConnect('whatsapp', 'jid-a', 'jid-a', send);

    expect(sent).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('jid-a', expect.objectContaining({ type: 'text' }));
    expect(hoisted.fakeDb.markChannelWelcomed).toHaveBeenCalledWith('whatsapp', 'jid-a');
  });

  it('welcomeOnConnect does not re-send for an already-welcomed account', async () => {
    const send = vi.fn(async () => 'msg-1');
    await svc.welcomeOnConnect('whatsapp', 'jid-a', 'jid-a', send);
    send.mockClear();

    // Simulates an app restart: same account, new attempt.
    const sentAgain = await svc.welcomeOnConnect('whatsapp', 'jid-a', 'jid-a', send);
    expect(sentAgain).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('does NOT mark welcomed when the send fails (retries on next connect)', async () => {
    const send = vi.fn(async () => {
      throw new Error('transport down');
    });
    const sent = await svc.welcomeOnConnect('signal', '+15551112222', '+15551112222', send);

    expect(sent).toBe(false);
    expect(hoisted.fakeDb.markChannelWelcomed).not.toHaveBeenCalled();

    // A later successful connect re-attempts and succeeds.
    const okSend = vi.fn(async () => 'ok');
    const sentLater = await svc.welcomeOnConnect('signal', '+15551112222', '+15551112222', okSend);
    expect(sentLater).toBe(true);
    expect(okSend).toHaveBeenCalledTimes(1);
  });

  it('rearm clears the marker so the next connect re-sends (re-pair)', async () => {
    const send = vi.fn(async () => 'msg-1');
    await svc.welcomeOnConnect('whatsapp', 'jid-old', 'jid-old', send);
    expect(await svc.hasWelcomed('whatsapp', 'jid-old')).toBe(true);

    await svc.rearm('whatsapp', 'jid-old');
    expect(await svc.hasWelcomed('whatsapp', 'jid-old')).toBe(false);

    send.mockClear();
    const resent = await svc.welcomeOnConnect('whatsapp', 'jid-old', 'jid-old', send);
    expect(resent).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('welcomeOnFirstContact and welcomeOnConnect share ONE per-account guard', async () => {
    const send = vi.fn(async () => 'msg-1');
    // Bot channel welcomed on first contact.
    const first = await svc.welcomeOnFirstContact('telegram', 'bot-1', 'chat-99', send);
    expect(first).toBe(true);

    // A subsequent connect-path attempt for the same account is skipped.
    send.mockClear();
    const onConnect = await svc.welcomeOnConnect('telegram', 'bot-1', 'chat-99', send);
    expect(onConnect).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('skips when accountId or target is empty (identity not yet known)', async () => {
    const send = vi.fn(async () => 'msg-1');
    expect(await svc.welcomeOnConnect('whatsapp', '', 'jid', send)).toBe(false);
    expect(await svc.welcomeOnConnect('whatsapp', 'jid', '', send)).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});
