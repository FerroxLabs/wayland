/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
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

import { SmsTwilioPlugin } from '@process/channels/plugins/tier1/sms/SmsTwilioPlugin';

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

  it('rejects an empty body — Twilio rejects zero-length SMS at the API layer anyway', async () => {
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
});
