/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SynologyChatPlugin lifecycle tests:
 * created → initializing → ready → starting → running → stopping → stopped.
 * fetch is mocked via vi.stubGlobal - no real HTTP.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';
import { SynologyChatPlugin } from '@process/channels/plugins/tier3/synology-chat/SynologyChatPlugin';

// ── Mock fetch at module top-level (Methodology: vi.hoisted / vi.stubGlobal) ──
const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

function makeConfig(overrides: Partial<Record<string, unknown>> = {}): IChannelPluginConfig {
  return {
    id: 'synology-chat_default',
    type: 'synology-chat',
    name: 'Synology Chat',
    enabled: true,
    status: 'created',
    credentials: {
      incomingUrl: 'https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=abc',
      incomingToken: 'test-token-123',
      ...overrides,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  // Default: successful POST response.
  mockFetch.mockResolvedValue(new Response('{"success":true}', { status: 200 }));
});

describe('SynologyChatPlugin capabilities', () => {
  it('declares the synology-chat type with no edit/react/stream/typing', () => {
    const plugin = new SynologyChatPlugin();
    expect(plugin.type).toBe('synology-chat');
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: false,
      canTypingIndicator: false,
    });
  });
});

describe('SynologyChatPlugin initial state', () => {
  it('starts in created status with 0 active users and no bot info', () => {
    const plugin = new SynologyChatPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });
});

describe('SynologyChatPlugin lifecycle: created → ready → running → stopped', () => {
  it('transitions through the full lifecycle', async () => {
    const plugin = new SynologyChatPlugin();

    await plugin.initialize(makeConfig());
    expect(plugin.status).toBe('ready');
    expect(plugin.getBotInfo()).not.toBeNull();

    await plugin.start();
    expect(plugin.status).toBe('running');

    await plugin.stop();
    expect(plugin.status).toBe('stopped');
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('clears active users on stop', async () => {
    const plugin = new SynologyChatPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    // Simulate an inbound message to populate active users.
    plugin.onMessage(async () => undefined);
    await plugin.handleWebhookPayload(
      { user_id: '5', username: 'bob', text: 'hi', channel_id: '1' },
      {},
      'synology-chat_default',
    );
    expect(plugin.getActiveUserCount()).toBe(1);

    await plugin.stop();
    expect(plugin.getActiveUserCount()).toBe(0);
  });
});

describe('SynologyChatPlugin initialize validation', () => {
  it('throws when incomingUrl is missing', async () => {
    const plugin = new SynologyChatPlugin();
    await expect(plugin.initialize(makeConfig({ incomingUrl: '' }))).rejects.toThrow(/URL/i);
    expect(plugin.status).toBe('error');
  });

  it('throws when incomingToken is missing', async () => {
    const plugin = new SynologyChatPlugin();
    await expect(plugin.initialize(makeConfig({ incomingToken: '' }))).rejects.toThrow(/token/i);
    expect(plugin.status).toBe('error');
  });

  it('transitions to error status on initialize failure', async () => {
    const plugin = new SynologyChatPlugin();
    await expect(plugin.initialize(makeConfig({ incomingUrl: '' }))).rejects.toThrow();
    expect(plugin.status).toBe('error');
  });
});

describe('SynologyChatPlugin getBotInfo', () => {
  it('returns bot info after initialize', async () => {
    const plugin = new SynologyChatPlugin();
    await plugin.initialize(makeConfig());
    const info = plugin.getBotInfo();
    expect(info).not.toBeNull();
    expect(info!.username).toBe('wayland-bot');
  });

  it('returns null after stop', async () => {
    const plugin = new SynologyChatPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    await plugin.stop();
    expect(plugin.getBotInfo()).toBeNull();
  });
});
