/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * NextcloudTalkPlugin lifecycle tests: created → initializing → ready →
 * starting → running → stopping → stopped. fetch is mocked via vi.hoisted
 * so no real HTTP calls are made.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// ── Hoist the fetch mock ──────────────────────────────────────────────────────
// Must be top-level (not inside describe) per Vitest hoisting rules.
const { mockFetch } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  return { mockFetch };
});

vi.stubGlobal('fetch', mockFetch);

import { NextcloudTalkPlugin } from '@process/channels/plugins/tier3/nextcloud-talk/NextcloudTalkPlugin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<Record<string, unknown>> = {}): IChannelPluginConfig {
  return {
    id: 'nextcloud-talk_default',
    type: 'nextcloud-talk',
    name: 'Nextcloud Talk',
    enabled: true,
    status: 'created',
    credentials: {
      serverUrl: 'https://cloud.example.com',
      username: 'bot',
      appPassword: 'xxxx-xxxx-xxxx-xxxx',
      ...overrides,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeWhoamiResponse(userId = 'bot'): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      ocs: { meta: { status: 'ok', statuscode: 200, message: 'OK' }, data: { id: userId, displayname: userId } },
    }),
  } as unknown as Response;
}

/**
 * A poll response that returns 304 (no new messages) so the loop idles cleanly.
 */
function makePollResponse304(): Response {
  return {
    ok: false,
    status: 304,
    statusText: 'Not Modified',
    json: async () => ({}),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  // Default: whoami succeeds, polls return 304 (idle).
  mockFetch.mockImplementation((url: string) => {
    if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
    return Promise.resolve(makePollResponse304());
  });
});

// ── Capability declaration ────────────────────────────────────────────────────

describe('NextcloudTalkPlugin capabilities', () => {
  it('declares the nextcloud-talk type with correct capability flags', () => {
    const plugin = new NextcloudTalkPlugin();
    expect(plugin.type).toBe('nextcloud-talk');
    expect(plugin.capabilities).toEqual({
      canEdit: true,
      canStream: false,
      canReact: true,
      canTypingIndicator: false,
    });
  });
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe('NextcloudTalkPlugin initial state', () => {
  it('starts in created status with 0 active users and no bot info', () => {
    const plugin = new NextcloudTalkPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });
});

// ── Full lifecycle ────────────────────────────────────────────────────────────

describe('NextcloudTalkPlugin lifecycle: created → ready → running → stopped', () => {
  it('transitions through the full lifecycle', async () => {
    const plugin = new NextcloudTalkPlugin();

    await plugin.initialize(makeConfig());
    expect(plugin.status).toBe('ready');

    await plugin.start();
    expect(plugin.status).toBe('running');

    expect(plugin.getBotInfo()).toEqual({
      id: 'bot',
      username: 'bot',
      displayName: 'bot',
    });

    await plugin.stop();
    expect(plugin.status).toBe('stopped');
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('calls whoami on start to confirm identity', async () => {
    const plugin = new NextcloudTalkPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    const whoamiCalls = mockFetch.mock.calls.filter(([url]: [string]) =>
      String(url).includes('/cloud/user'),
    );
    expect(whoamiCalls.length).toBeGreaterThanOrEqual(1);
    await plugin.stop();
  });
});

// ── Initialize validation ─────────────────────────────────────────────────────

describe('NextcloudTalkPlugin initialize validation', () => {
  it('throws when serverUrl is missing', async () => {
    const plugin = new NextcloudTalkPlugin();
    await expect(plugin.initialize(makeConfig({ serverUrl: '' }))).rejects.toThrow(
      /server url/i,
    );
  });

  it('throws when username is missing', async () => {
    const plugin = new NextcloudTalkPlugin();
    await expect(plugin.initialize(makeConfig({ username: '' }))).rejects.toThrow(
      /username/i,
    );
  });

  it('throws when appPassword is missing', async () => {
    const plugin = new NextcloudTalkPlugin();
    await expect(plugin.initialize(makeConfig({ appPassword: '' }))).rejects.toThrow(
      /app password/i,
    );
  });

  it('transitions to error status on initialize failure', async () => {
    const plugin = new NextcloudTalkPlugin();
    await expect(plugin.initialize(makeConfig({ serverUrl: '' }))).rejects.toThrow();
    expect(plugin.status).toBe('error');
  });
});

// ── start failure: whoami rejects ─────────────────────────────────────────────

describe('NextcloudTalkPlugin start failure', () => {
  it('transitions to error when whoami returns 401', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as unknown as Response),
    );

    const plugin = new NextcloudTalkPlugin();
    await plugin.initialize(makeConfig());
    await expect(plugin.start()).rejects.toThrow(/whoami/i);
    expect(plugin.status).toBe('error');
  });
});

// ── Webhook payload ───────────────────────────────────────────────────────────

describe('NextcloudTalkPlugin handleWebhookPayload', () => {
  it('throws with a clear explanation', async () => {
    const plugin = new NextcloudTalkPlugin();
    await expect(plugin.handleWebhookPayload()).rejects.toThrow(/long-poll/i);
  });
});

// ── Rooms from config ─────────────────────────────────────────────────────────

describe('NextcloudTalkPlugin room configuration', () => {
  it('accepts comma-separated rooms string', async () => {
    const plugin = new NextcloudTalkPlugin();
    await plugin.initialize(makeConfig({ rooms: 'room1,room2' }));
    await plugin.start();
    // Give the async poll loops one tick to fire their first requests.
    await new Promise((r) => setTimeout(r, 0));
    // Poll calls should include both room tokens.
    const pollCalls = mockFetch.mock.calls.filter(([url]: [string]) =>
      String(url).includes('/chat/'),
    );
    const targets = pollCalls.map(([url]: [string]) => String(url));
    expect(targets.some((u) => u.includes('room1'))).toBe(true);
    expect(targets.some((u) => u.includes('room2'))).toBe(true);
    await plugin.stop();
  });

  it('accepts rooms as an array', async () => {
    const plugin = new NextcloudTalkPlugin();
    await plugin.initialize(makeConfig({ rooms: ['roomA', 'roomB'] }));
    await plugin.start();
    await new Promise((r) => setTimeout(r, 0));
    const pollCalls = mockFetch.mock.calls.filter(([url]: [string]) =>
      String(url).includes('/chat/'),
    );
    const targets = pollCalls.map(([url]: [string]) => String(url));
    expect(targets.some((u) => u.includes('roomA'))).toBe(true);
    await plugin.stop();
  });
});
