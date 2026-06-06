/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IChannelPluginConfig } from '@process/channels/types';

// Shared spy so the test can assert the SDK was called with the right params.
// Hoisted via vi.hoisted because vi.mock factory runs before the test body.
const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock('twilio', () => ({
  default: (_sid: string, _token: string) => ({ messages: { create: createMock } }),
}));

import { SmsTwilioPlugin, TwilioRestError } from '@process/channels/plugins/tier1/sms/SmsTwilioPlugin';

const baseConfig: IChannelPluginConfig = {
  id: 'sms-twilio_default',
  type: 'sms-twilio',
  name: 'SMS (Twilio)',
  enabled: true,
  status: 'created',
  createdAt: 0,
  updatedAt: 0,
  credentials: {
    accountSid: 'AC00000000000000000000000000000000',
    authToken: 'auth-token-for-testing',
    fromNumber: '+14155550123',
  },
};

describe('SmsTwilioPlugin.sendMessage', () => {
  beforeEach(() => {
    createMock.mockReset();
    createMock.mockResolvedValue({ sid: 'SM_sent_0001' });
  });

  it('calls twilio.messages.create with to/body/from when only fromNumber is set', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);

    const messageSid = await plugin.sendMessage('+15551234567', { type: 'text', text: 'hi there' });

    expect(messageSid).toBe('SM_sent_0001');
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      to: '+15551234567',
      body: 'hi there',
      from: '+14155550123',
    });
  });

  it('prefers messagingServiceSid over fromNumber when both are present', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize({
      ...baseConfig,
      credentials: {
        ...baseConfig.credentials,
        messagingServiceSid: 'MG11111111111111111111111111111111',
      },
    });

    await plugin.sendMessage('+15551234567', { type: 'text', text: 'pool me' });
    expect(createMock).toHaveBeenCalledWith({
      to: '+15551234567',
      body: 'pool me',
      messagingServiceSid: 'MG11111111111111111111111111111111',
    });
  });

  it('rejects an empty body - Twilio rejects zero-length SMS at the API layer anyway', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);
    await expect(plugin.sendMessage('+15551234567', { type: 'text', text: '  ' })).rejects.toThrow(/empty/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('refuses to initialize without Account SID, Auth Token, or any sender', async () => {
    const plugin = new SmsTwilioPlugin();
    await expect(
      plugin.initialize({ ...baseConfig, credentials: { authToken: 'x', fromNumber: '+14155550123' } })
    ).rejects.toThrow(/Account SID/);
    await expect(
      plugin.initialize({
        ...baseConfig,
        credentials: { accountSid: 'AC00000000000000000000000000000000', fromNumber: '+14155550123' },
      })
    ).rejects.toThrow(/Auth Token/);
    await expect(
      plugin.initialize({
        ...baseConfig,
        credentials: { accountSid: 'AC00000000000000000000000000000000', authToken: 'x' },
      })
    ).rejects.toThrow(/From Number or Messaging Service SID/);
  });

  it('rejects a malformed Account SID (must start with "AC")', async () => {
    const plugin = new SmsTwilioPlugin();
    await expect(
      plugin.initialize({
        ...baseConfig,
        credentials: { accountSid: 'XX1234', authToken: 'x', fromNumber: '+14155550123' },
      })
    ).rejects.toThrow(/AC/);
  });

  it('surfaces accountSid + fromNumber via getBotInfo after initialize', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);
    const info = plugin.getBotInfo();
    expect(info).not.toBeNull();
    expect(info?.id).toBe('AC00000000000000000000000000000000');
    expect(info?.displayName).toBe('+14155550123');
  });

  // F7 fix: backend enforces E.164 + MG-SID shape, so malformed values fail
  // with a clear local error instead of an opaque Twilio REST 400.
  it('rejects a non-E.164 fromNumber at initialize (F7)', async () => {
    const plugin = new SmsTwilioPlugin();
    await expect(
      plugin.initialize({
        ...baseConfig,
        credentials: {
          accountSid: 'AC00000000000000000000000000000000',
          authToken: 'x',
          fromNumber: '4155550123', // missing leading +
        },
      })
    ).rejects.toThrow(/E\.164/);
  });

  it('rejects a malformed messagingServiceSid at initialize (F7)', async () => {
    const plugin = new SmsTwilioPlugin();
    await expect(
      plugin.initialize({
        ...baseConfig,
        credentials: {
          accountSid: 'AC00000000000000000000000000000000',
          authToken: 'x',
          messagingServiceSid: 'NOT_A_MG_SID',
        },
      })
    ).rejects.toThrow(/MG/);
  });

  // F4 fix: outbound MMS - mediaUrl flows through to twilio.messages.create.
  it('forwards mediaUrl when present on the outgoing message (F4)', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);
    await plugin.sendMessage('+15551234567', {
      type: 'text',
      text: 'see photo',
      mediaUrl: ['https://cdn.example.com/photo.jpg'],
    } as never);
    expect(createMock).toHaveBeenCalledWith({
      to: '+15551234567',
      body: 'see photo',
      from: '+14155550123',
      mediaUrl: ['https://cdn.example.com/photo.jpg'],
    });
  });

  it('allows MMS sends with empty body when mediaUrl is present (F4)', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);
    await expect(
      plugin.sendMessage('+15551234567', {
        type: 'text',
        text: '',
        mediaUrl: 'https://cdn.example.com/x.jpg',
      } as never)
    ).resolves.toBe('SM_sent_0001');
  });

  // F6 fix: retry on 429 / 5xx; typed non-retryable error on 21408 / 21610.
  it('retries on HTTP 429 and eventually succeeds (F6)', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);
    createMock
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429, code: 20429 }))
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429, code: 20429 }))
      .mockResolvedValueOnce({ sid: 'SM_retried_ok' });
    const sid = await plugin.sendMessage('+15551234567', { type: 'text', text: 'retry me' });
    expect(sid).toBe('SM_retried_ok');
    expect(createMock).toHaveBeenCalledTimes(3);
  });

  it('retries on HTTP 503 then surfaces final failure (F6)', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);
    createMock.mockRejectedValue(
      Object.assign(new Error('upstream down'), { status: 503, code: null })
    );
    await expect(
      plugin.sendMessage('+15551234567', { type: 'text', text: 'never lands' })
    ).rejects.toThrow(/upstream down/);
    expect(createMock).toHaveBeenCalledTimes(3);
  });

  it('throws typed non-retryable TwilioRestError on 21610 opted-out (F6)', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);
    createMock.mockRejectedValueOnce(
      Object.assign(new Error('recipient opted out'), { status: 403, code: 21610 })
    );
    await expect(
      plugin.sendMessage('+15551234567', { type: 'text', text: 'blocked' })
    ).rejects.toBeInstanceOf(TwilioRestError);
    // Non-retryable: must have only fired once.
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('throws typed non-retryable TwilioRestError on 21408 permission denied (F6)', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);
    createMock.mockRejectedValueOnce(
      Object.assign(new Error('region blocked'), { status: 403, code: 21408 })
    );
    const err = await plugin
      .sendMessage('+15551234567', { type: 'text', text: 'blocked' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(TwilioRestError);
    expect((err as TwilioRestError).code).toBe(21408);
    expect((err as TwilioRestError).retryable).toBe(false);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry on a generic 400 (F6)', async () => {
    const plugin = new SmsTwilioPlugin();
    await plugin.initialize(baseConfig);
    createMock.mockRejectedValueOnce(
      Object.assign(new Error('bad request'), { status: 400, code: 21211 })
    );
    await expect(
      plugin.sendMessage('+15551234567', { type: 'text', text: 'malformed' })
    ).rejects.toThrow(/bad request/);
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
