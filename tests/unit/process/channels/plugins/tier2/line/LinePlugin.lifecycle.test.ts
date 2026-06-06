/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { LinePlugin } from '@process/channels/plugins/tier2/line/LinePlugin';

const validConfig = {
  id: 'line_default',
  type: 'line' as const,
  name: 'LINE',
  enabled: true,
  credentials: {
    channelAccessToken: 'test-access-token',
    channelSecret: 'test-channel-secret',
  },
  status: 'created' as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('LinePlugin lifecycle', () => {
  it('starts in created status', () => {
    const plugin = new LinePlugin();
    expect(plugin.status).toBe('created');
  });

  it('transitions created → initializing → ready on initialize', async () => {
    const plugin = new LinePlugin();
    await plugin.initialize(validConfig);
    expect(plugin.status).toBe('ready');
  });

  it('transitions ready → starting → running on start', async () => {
    const plugin = new LinePlugin();
    await plugin.initialize(validConfig);
    await plugin.start();
    expect(plugin.status).toBe('running');
  });

  it('transitions running → stopping → stopped on stop', async () => {
    const plugin = new LinePlugin();
    await plugin.initialize(validConfig);
    await plugin.start();
    await plugin.stop();
    expect(plugin.status).toBe('stopped');
  });

  it('transitions to error when channelAccessToken is missing', async () => {
    const plugin = new LinePlugin();
    await expect(
      plugin.initialize({
        ...validConfig,
        credentials: { channelSecret: 'sec' },
      }),
    ).rejects.toThrow(/channel access token/i);
    expect(plugin.status).toBe('error');
  });

  it('transitions to error when channelSecret is missing', async () => {
    const plugin = new LinePlugin();
    await expect(
      plugin.initialize({
        ...validConfig,
        credentials: { channelAccessToken: 'tok' },
      }),
    ).rejects.toThrow(/channel secret/i);
    expect(plugin.status).toBe('error');
  });

  it('declares correct capabilities', async () => {
    const plugin = new LinePlugin();
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: false,
      canTypingIndicator: false,
    });
  });

  it('returns null from getBotInfo before any connection', async () => {
    const plugin = new LinePlugin();
    await plugin.initialize(validConfig);
    await plugin.start();
    // No live API call made in onStart - botInfo only populated by testConnection.
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('returns 0 active users', async () => {
    const plugin = new LinePlugin();
    await plugin.initialize(validConfig);
    expect(plugin.getActiveUserCount()).toBe(0);
  });
});
