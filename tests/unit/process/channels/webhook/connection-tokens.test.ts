/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// SEC-DATA-03: webhook secrets are now encrypted at rest via Electron
// safeStorage at the serialize/hydrate boundary. The `electron` module is not
// available in the unit environment, so mock safeStorage with a deterministic
// reversible round-trip (mirroring tests/unit/process/secrets/safeStorage.test.ts).
const { mockSafeStorage } = vi.hoisted(() => ({
  mockSafeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((plaintext: string) => Buffer.from(`enc(${plaintext})`)),
    decryptString: vi.fn((cipher: Buffer) => {
      const match = cipher.toString('utf8').match(/^enc\((.*)\)$/);
      return match ? match[1] : '';
    }),
  },
}));

vi.mock('electron', () => ({
  safeStorage: mockSafeStorage,
}));

import { ConnectionTokenStore } from '@process/channels/webhook/connection-tokens';
import { CIPHER_PREFIX } from '@process/secrets';

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
      const record = store.register('slack', 'plugin-1', 'agent-1', 'signing-secret');
      const resolved = store.resolve(record.token);
      expect(resolved).not.toBeNull();
      expect(resolved?.platform).toBe('slack');
      expect(resolved?.pluginInstanceId).toBe('plugin-1');
      expect(resolved?.agentId).toBe('agent-1');
    });

    it('returns null for unknown tokens', () => {
      expect(store.resolve('not-a-token')).toBeNull();
    });

    it('persists the per-platform secret on the record', () => {
      const secret = 'my-channel-secret-abc123';
      const record = store.register('line', 'line_default', 'default', secret);
      expect(record.secret).toBe(secret);
      const resolved = store.resolve(record.token);
      expect(resolved?.secret).toBe(secret);
    });

    it('round-trips secret through serialize + hydrate, encrypted at rest', () => {
      const secret = 'audience-claim-xyz';
      store.register('google-chat', 'gc_default', 'default', secret);
      const snapshot = store.serialize();

      // SEC-DATA-03: the persisted form must NOT be plaintext - it is encrypted
      // via safeStorage and carries the version-pinned cipher prefix.
      const [persisted] = snapshot;
      expect(persisted.secret).not.toBe(secret);
      expect(persisted.secret).not.toContain(secret);
      expect(persisted.secret.startsWith(CIPHER_PREFIX)).toBe(true);

      const fresh = new ConnectionTokenStore();
      fresh.hydrate(snapshot);
      // Hydrated in-memory record decrypts back to plaintext for verifiers.
      const resolved = fresh.resolve(persisted.token);
      expect(resolved?.secret).toBe(secret);
    });

    it('RT-S2: throws rather than emitting a plaintext secret when encryption is unavailable', () => {
      mockSafeStorage.isEncryptionAvailable.mockReturnValueOnce(false);
      store.register('slack', 'plugin-1', 'agent-1', 'plaintext-signing-secret');

      // serialize() must fail loudly so the caller's persist path surfaces the
      // error instead of writing a plaintext secret into the config store.
      expect(() => store.serialize()).toThrow(/RT-S2/);
    });

    it('RT-S2: still serializes empty secrets when encryption is unavailable (nothing to leak)', () => {
      mockSafeStorage.isEncryptionAvailable.mockReturnValueOnce(false);
      const record = store.register('discord', 'p', 'a', '');

      const snapshot = store.serialize();
      const [persisted] = snapshot;
      expect(persisted.token).toBe(record.token);
      expect(persisted.secret).toBe('');
    });
  });

  describe('revoke', () => {
    it('causes resolve to return null after revocation', () => {
      const record = store.register('discord', 'p', 'a', '');
      store.revoke(record.token);
      expect(store.resolve(record.token)).toBeNull();
    });

    it('is a no-op for unknown tokens', () => {
      expect(() => store.revoke('does-not-exist')).not.toThrow();
    });

    it('is idempotent for already-revoked tokens', () => {
      const record = store.register('discord', 'p', 'a', '');
      store.revoke(record.token);
      expect(() => store.revoke(record.token)).not.toThrow();
      expect(store.resolve(record.token)).toBeNull();
    });
  });

  describe('touch', () => {
    it('updates lastUsedAt on a live token', async () => {
      const record = store.register('slack', 'p', 'a', '');
      expect(record.lastUsedAt).toBeUndefined();
      await new Promise((r) => setTimeout(r, 2));
      store.touch(record.token);
      const refreshed = store.resolve(record.token);
      expect(refreshed?.lastUsedAt).toBeDefined();
      expect(refreshed?.lastUsedAt).toBeGreaterThan(record.createdAt);
    });

    it('does not resurrect a revoked token', () => {
      const record = store.register('slack', 'p', 'a', '');
      store.revoke(record.token);
      store.touch(record.token);
      expect(store.resolve(record.token)).toBeNull();
    });
  });
});
