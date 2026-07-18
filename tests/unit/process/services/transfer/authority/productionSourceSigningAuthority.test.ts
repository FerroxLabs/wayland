/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  loadProductionSourceSigningAuthority,
  type ElectronSafeStorageAuthorityBackend,
} from '@process/services/transfer/authority';

const roots: string[] = [];

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'wayland-transfer-source-authority-'));
  roots.push(root);
  return root;
}

function fakeSafeStorage(available = true): ElectronSafeStorageAuthorityBackend {
  const values = new Map<string, string>();
  let counter = 0;
  return {
    isEncryptionAvailable: () => available,
    encryptString(value) {
      const token = `opaque-${++counter}-${'aa'.repeat(16)}`;
      values.set(token, value);
      return Buffer.from(token, 'utf8');
    },
    decryptString(value) {
      const plaintext = values.get(value.toString('utf8'));
      if (!plaintext) throw new Error('unknown wrapped value');
      return plaintext;
    },
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('production source signing authority', () => {
  it('keeps one OS-backed signing fingerprint across process reloads', async () => {
    const userDataRoot = await temporaryRoot();
    const safeStorage = fakeSafeStorage();
    const first = await loadProductionSourceSigningAuthority({ userDataRoot, safeStorage });
    const second = await loadProductionSourceSigningAuthority({ userDataRoot, safeStorage });

    expect(first.receipt.continuity).toBe('created');
    expect(second.receipt.continuity).toBe('reloaded');
    expect(second.descriptor).toEqual(first.descriptor);
    expect(second.receipt.publicKeyFingerprint).toBe(first.receipt.publicKeyFingerprint);

    const state = await readFile(path.join(userDataRoot, 'transfer-source-authority-v1', 'identity.json'), 'utf8');
    expect(state).toContain('electron-safe-storage:v1:');
    expect(state).not.toContain('privateKey');
    expect(state).not.toContain('pkcs8');
  });

  it('fails closed when the OS credential store is absent or loses the wrapped identity', async () => {
    const unavailableRoot = await temporaryRoot();
    await expect(
      loadProductionSourceSigningAuthority({ userDataRoot: unavailableRoot, safeStorage: fakeSafeStorage(false) })
    ).rejects.toMatchObject({ code: 'VAULT_UNAVAILABLE' });

    const restartRoot = await temporaryRoot();
    await loadProductionSourceSigningAuthority({ userDataRoot: restartRoot, safeStorage: fakeSafeStorage() });
    await expect(
      loadProductionSourceSigningAuthority({ userDataRoot: restartRoot, safeStorage: fakeSafeStorage() })
    ).rejects.toMatchObject({ code: 'VAULT_UNAVAILABLE' });
  });
});
