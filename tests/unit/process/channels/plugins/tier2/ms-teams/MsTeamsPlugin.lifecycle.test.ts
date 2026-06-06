/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── hoisted mocks (module top-level, before any imports) ──────────────────────
const mockFetch = vi.hoisted(() => vi.fn<typeof fetch>());

vi.stubGlobal('fetch', mockFetch);

import { MsTeamsPlugin } from '@process/channels/plugins/tier2/ms-teams/MsTeamsPlugin';
import type { IChannelPluginConfig } from '@process/channels/types';

function makeConfig(overrides: Partial<IChannelPluginConfig['credentials']> = {}): IChannelPluginConfig {
  return {
    id: 'ms-teams_default',
    type: 'ms-teams',
    name: 'MS Teams',
    enabled: true,
    status: 'created',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    credentials: {
      appId: 'test-app-id',
      appPassword: 'test-app-password',
      ...overrides,
    },
  };
}

function mockTokenOk(): void {
  mockFetch.mockResolvedValue(
    new Response(
      JSON.stringify({ access_token: 'mock-bearer-token', expires_in: 3600 }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  );
}

function mockTokenFail(status: number, body = 'error'): void {
  mockFetch.mockResolvedValue(new Response(body, { status }));
}

describe('MsTeamsPlugin lifecycle', () => {
  let plugin: MsTeamsPlugin;

  beforeEach(() => {
    mockFetch.mockReset();
    plugin = new MsTeamsPlugin();
  });

  it('starts in created status', () => {
    expect(plugin.status).toBe('created');
  });

  it('transitions created → initializing → ready', async () => {
    // initialize() does not mint a token - no fetch needed
    await plugin.initialize(makeConfig());
    expect(plugin.status).toBe('ready');
  });

  it('transitions ready → starting → running on start', async () => {
    mockTokenOk();
    await plugin.initialize(makeConfig());
    await plugin.start();
    expect(plugin.status).toBe('running');
  });

  it('transitions running → stopping → stopped on stop', async () => {
    mockTokenOk();
    await plugin.initialize(makeConfig());
    await plugin.start();
    await plugin.stop();
    expect(plugin.status).toBe('stopped');
  });

  it('transitions to error when appId is missing', async () => {
    await expect(plugin.initialize(makeConfig({ appId: '' }))).rejects.toThrow();
    expect(plugin.status).toBe('error');
  });

  it('transitions to error when appPassword is missing', async () => {
    await expect(plugin.initialize(makeConfig({ appPassword: '' }))).rejects.toThrow();
    expect(plugin.status).toBe('error');
  });

  it('transitions to error when token mint fails at start', async () => {
    mockTokenFail(401, 'unauthorized');
    await plugin.initialize(makeConfig());
    await expect(plugin.start()).rejects.toThrow(/credential check failed|token fetch failed/i);
    expect(plugin.status).toBe('error');
  });

  it('getActiveUserCount returns 0 before any messages', async () => {
    await plugin.initialize(makeConfig());
    expect(plugin.getActiveUserCount()).toBe(0);
  });

  it('getBotInfo returns null before initialize', () => {
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('getBotInfo returns appId-based info after initialize', async () => {
    await plugin.initialize(makeConfig());
    const info = plugin.getBotInfo();
    expect(info).not.toBeNull();
    expect(info!.username).toBe('test-app-id');
  });

  it('getBotInfo returns null after stop', async () => {
    mockTokenOk();
    await plugin.initialize(makeConfig());
    await plugin.start();
    await plugin.stop();
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('cannot start from created status (must initialize first)', async () => {
    await expect(plugin.start()).rejects.toThrow();
  });
});
