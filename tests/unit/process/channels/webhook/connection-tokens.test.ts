/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectionTokenStore } from '@process/channels/webhook/connection-tokens';

describe('ConnectionTokenStore', () => {
  let store: ConnectionTokenStore;

  beforeEach(() => {
    store = new ConnectionTokenStore();
  });

  describe('generateConnectionToken', () => {
    it('returns a URL-safe string of at least 32 characters', () => {
      const token = store.generateConnectionToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(token.length).toBeGreaterThanOrEqual(32);
    });

    it('returns a different value on each call', () => {
      const a = store.generateConnectionToken();
      const b = store.generateConnectionToken();
      expect(a).not.toBe(b);
    });
  });

  describe('register + resolve', () => {
    it('resolves a freshly registered token to its routing target', () => {
      const record = store.register('slack', 'plugin-1', 'agent-1');
      const resolved = store.resolve(record.token);
      expect(resolved).not.toBeNull();
      expect(resolved?.platform).toBe('slack');
      expect(resolved?.pluginInstanceId).toBe('plugin-1');
      expect(resolved?.agentId).toBe('agent-1');
    });

    it('returns null for unknown tokens', () => {
      expect(store.resolve('not-a-token')).toBeNull();
    });
  });

  describe('revoke', () => {
    it('causes resolve to return null after revocation', () => {
      const record = store.register('discord', 'p', 'a');
      store.revoke(record.token);
      expect(store.resolve(record.token)).toBeNull();
    });

    it('is a no-op for unknown tokens', () => {
      expect(() => store.revoke('does-not-exist')).not.toThrow();
    });

    it('is idempotent for already-revoked tokens', () => {
      const record = store.register('discord', 'p', 'a');
      store.revoke(record.token);
      expect(() => store.revoke(record.token)).not.toThrow();
      expect(store.resolve(record.token)).toBeNull();
    });
  });

  describe('touch', () => {
    it('updates lastUsedAt on a live token', async () => {
      const record = store.register('slack', 'p', 'a');
      expect(record.lastUsedAt).toBeUndefined();
      await new Promise((r) => setTimeout(r, 2));
      store.touch(record.token);
      const refreshed = store.resolve(record.token);
      expect(refreshed?.lastUsedAt).toBeDefined();
      expect(refreshed?.lastUsedAt).toBeGreaterThan(record.createdAt);
    });

    it('does not resurrect a revoked token', () => {
      const record = store.register('slack', 'p', 'a');
      store.revoke(record.token);
      store.touch(record.token);
      expect(store.resolve(record.token)).toBeNull();
    });
  });
});
