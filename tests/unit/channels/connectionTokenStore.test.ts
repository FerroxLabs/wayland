/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// SEC-DATA-03: stub the secrets module (which wraps Electron safeStorage) with a
// deterministic, reversible transform so we can assert that serialize() encrypts
// the webhook secret and hydrate() decrypts it, without an Electron runtime.
const CIPHER_PREFIX = 'enc:v1:';
vi.mock('@process/secrets', () => ({
  CIPHER_PREFIX,
  isEncryptionAvailable: () => true,
  encryptString: (plaintext: string) => `${CIPHER_PREFIX}${Buffer.from(plaintext, 'utf-8').toString('base64')}`,
  decryptString: (encoded: string) => {
    if (!encoded.startsWith(CIPHER_PREFIX)) throw new Error('missing prefix');
    return Buffer.from(encoded.slice(CIPHER_PREFIX.length), 'base64').toString('utf-8');
  },
}));

const { ConnectionTokenStore } = await import('@process/channels/webhook/connection-tokens');

describe('ConnectionTokenStore secret-at-rest (SEC-DATA-03)', () => {
  let store: InstanceType<typeof ConnectionTokenStore>;

  beforeEach(() => {
    store = new ConnectionTokenStore();
  });

  it('keeps the secret plaintext in memory for verifier use', () => {
    const record = store.register('line', 'plugin-1', 'agent-1', 'hmac-secret');
    expect(store.resolve(record.token)?.secret).toBe('hmac-secret');
  });

  it('encrypts the secret when serializing for persistence', () => {
    store.register('line', 'plugin-1', 'agent-1', 'hmac-secret');
    const [persisted] = store.serialize();
    expect(persisted.secret.startsWith(CIPHER_PREFIX)).toBe(true);
    expect(persisted.secret).not.toContain('hmac-secret');
  });

  it('round-trips: hydrate(serialize()) restores the plaintext secret', () => {
    store.register('teams', 'plugin-2', 'agent-2', 'verify-token');
    const snapshot = store.serialize();

    const reloaded = new ConnectionTokenStore();
    reloaded.hydrate(snapshot);

    const [token] = snapshot;
    expect(reloaded.resolve(token.token)?.secret).toBe('verify-token');
  });

  it('passes through legacy plaintext secrets on hydrate (backward compat)', () => {
    const reloaded = new ConnectionTokenStore();
    reloaded.hydrate([
      {
        token: 'legacy-token',
        platform: 'generic',
        pluginInstanceId: 'plugin-3',
        agentId: 'agent-3',
        secret: 'legacy-plaintext',
        createdAt: 1,
      },
    ]);
    expect(reloaded.resolve('legacy-token')?.secret).toBe('legacy-plaintext');
  });

  it('does not double-encrypt an already-encrypted secret on re-serialize', () => {
    store.register('line', 'plugin-1', 'agent-1', 'hmac-secret');
    const once = store.serialize();

    const reloaded = new ConnectionTokenStore();
    reloaded.hydrate(once);
    const twice = reloaded.serialize();

    expect(twice[0].secret).toBe(once[0].secret);
  });
});
