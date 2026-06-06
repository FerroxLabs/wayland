/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

import { hasPluginCredentials } from '@process/channels/types';

// Stub child_process.fork at the module level so importing WhatsAppPlugin
// doesn't accidentally spawn a real subprocess during construction tests.
vi.mock('child_process', () => ({
  fork: vi.fn(() => ({
    stdout: { setEncoding: () => undefined, on: () => undefined },
    stdin: { write: (_: string, cb?: (err?: Error) => void) => cb?.() },
    once: () => undefined,
    kill: () => undefined,
  })),
  ChildProcess: class {},
}));

import { WhatsAppPlugin } from '@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin';

describe('WhatsAppPlugin - capabilities + construction', () => {
  it('declares type=whatsapp and the optimistic capability set', () => {
    const plugin = new WhatsAppPlugin();
    expect(plugin.type).toBe('whatsapp');
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: true,
      canTypingIndicator: true,
    });
  });

  it('starts in status="created" with no error before initialize', () => {
    const plugin = new WhatsAppPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.error).toBeNull();
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });
});

describe('hasPluginCredentials("whatsapp", ...) - per-backend rules', () => {
  it('returns true for Meta backend with accessToken + phoneNumberId', () => {
    expect(
      hasPluginCredentials('whatsapp', {
        backend: 'meta-business',
        accessToken: 'EAAGxxx',
        phoneNumberId: '123456789012345',
      }),
    ).toBe(true);
  });

  it('returns false for Meta backend when accessToken is missing', () => {
    expect(
      hasPluginCredentials('whatsapp', {
        backend: 'meta-business',
        phoneNumberId: '123456789012345',
      }),
    ).toBe(false);
  });

  it('returns false for Meta backend when phoneNumberId is missing', () => {
    expect(
      hasPluginCredentials('whatsapp', {
        backend: 'meta-business',
        accessToken: 'EAAGxxx',
      }),
    ).toBe(false);
  });

  it('returns true for Baileys backend with no creds (pairs via QR at runtime)', () => {
    expect(hasPluginCredentials('whatsapp', { backend: 'baileys' })).toBe(true);
  });

  it('returns true for whatsapp-web backend with no creds (pairs via QR at runtime)', () => {
    expect(hasPluginCredentials('whatsapp', { backend: 'whatsapp-web' })).toBe(true);
  });

  it('defaults to Baileys when backend field is omitted (true with empty creds)', () => {
    expect(hasPluginCredentials('whatsapp', {})).toBe(true);
  });
});
