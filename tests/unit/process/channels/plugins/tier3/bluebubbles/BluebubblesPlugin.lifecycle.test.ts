/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * BluebubblesPlugin lifecycle tests: created → initializing → ready →
 * starting → running → stopping → stopped. fetch and socket.io-client are
 * mocked so no real network connections are made.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// ── Hoist Socket.IO mock ──────────────────────────────────────────────────────
// Must be at module top level (Methodology: Vitest mock hoisting).
// Hand-rolled emitter extending EventEmitter so `socket.on('connect', cb)`
// works naturally in tests.

const { mockIo, mockSocketInstance } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as typeof import('node:events');

  class FakeSocket extends EventEmitter {
    disconnect = vi.fn(() => {
      this.emit('disconnect', 'io client disconnect');
    });
    removeAllListeners = vi.fn(() => {
      EventEmitter.prototype.removeAllListeners.call(this);
      return this;
    });
  }

  const instance = new FakeSocket();
  const mockIo = vi.fn(function () {
    return instance;
  });

  return { mockIo, mockSocketInstance: instance };
});

vi.mock('socket.io-client', () => ({ io: mockIo }));

// ── Hoist fetch mock ──────────────────────────────────────────────────────────
const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));
vi.stubGlobal('fetch', mockFetch);

import { EventEmitter } from 'node:events';
import { BluebubblesPlugin } from '@process/channels/plugins/tier3/bluebubbles/BluebubblesPlugin';

const SERVER_INFO_OK = {
  status: 200,
  data: { server_address: 'bb.example.com' },
};

function makeConfig(overrides: Partial<Record<string, unknown>> = {}): IChannelPluginConfig {
  return {
    id: 'bluebubbles_default',
    type: 'bluebubbles',
    name: 'BlueBubbles',
    enabled: true,
    status: 'created',
    credentials: {
      serverUrl: 'https://bb.example.com:1234',
      password: 'secret123',
      ...overrides,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

function setupHappyPath() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(SERVER_INFO_OK),
  });
  // Emit 'connect' asynchronously after io() is called.
  mockIo.mockImplementation(function () {
    setTimeout(() => mockSocketInstance.emit('connect'), 0);
    return mockSocketInstance;
  });
}

beforeEach(() => {
  mockIo.mockReset();
  mockFetch.mockReset();
  mockSocketInstance.disconnect.mockReset();
  mockSocketInstance.removeAllListeners.mockReset();
  EventEmitter.prototype.removeAllListeners.call(mockSocketInstance);

  // Default: connect fires immediately.
  mockIo.mockImplementation(function () {
    setTimeout(() => mockSocketInstance.emit('connect'), 0);
    return mockSocketInstance;
  });
});

describe('BluebubblesPlugin capabilities', () => {
  it('declares type=bluebubbles with react/typing but no edit/stream', () => {
    const plugin = new BluebubblesPlugin();
    expect(plugin.type).toBe('bluebubbles');
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: true,
      canTypingIndicator: true,
    });
  });
});

describe('BluebubblesPlugin initial state', () => {
  it('starts in created status with 0 active users and no bot info', () => {
    const plugin = new BluebubblesPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });
});

describe('BluebubblesPlugin lifecycle: created → ready → running → stopped', () => {
  it('transitions through the full happy-path lifecycle', async () => {
    setupHappyPath();
    const plugin = new BluebubblesPlugin();

    await plugin.initialize(makeConfig());
    expect(plugin.status).toBe('ready');

    await plugin.start();
    expect(plugin.status).toBe('running');
    expect(plugin.getBotInfo()).toEqual({
      id: 'bb.example.com',
      username: 'bb.example.com',
      displayName: 'bb.example.com',
    });

    await plugin.stop();
    expect(plugin.status).toBe('stopped');
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('transitions to error when serverUrl is missing', async () => {
    const plugin = new BluebubblesPlugin();
    await expect(plugin.initialize(makeConfig({ serverUrl: '' }))).rejects.toThrow(/server url/i);
    expect(plugin.status).toBe('error');
  });

  it('transitions to error when password is missing', async () => {
    const plugin = new BluebubblesPlugin();
    await expect(plugin.initialize(makeConfig({ password: '' }))).rejects.toThrow(/password/i);
    expect(plugin.status).toBe('error');
  });

  it('transitions to error when server/info returns 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });
    const plugin = new BluebubblesPlugin();
    await plugin.initialize(makeConfig());
    await expect(plugin.start()).rejects.toThrow(/password/i);
    expect(plugin.status).toBe('error');
  });

  it('transitions to error when socket connect_error fires', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SERVER_INFO_OK),
    });
    mockIo.mockImplementation(function () {
      setTimeout(() => mockSocketInstance.emit('connect_error', new Error('ECONNREFUSED')), 0);
      return mockSocketInstance;
    });

    const plugin = new BluebubblesPlugin();
    await plugin.initialize(makeConfig());
    await expect(plugin.start()).rejects.toThrow(/ECONNREFUSED/);
    expect(plugin.status).toBe('error');
  });
});

describe('BluebubblesPlugin handleWebhookPayload', () => {
  it('throws explaining Socket.IO is the transport', async () => {
    const plugin = new BluebubblesPlugin();
    await expect(plugin.handleWebhookPayload()).rejects.toThrow(/socket\.io/i);
  });
});
