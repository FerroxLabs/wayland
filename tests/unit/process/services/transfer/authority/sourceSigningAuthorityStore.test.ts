/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  FileSourceSigningAuthorityStateBackend,
  SourceSigningAuthorityStoreError,
  TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT,
  loadOrCreateSourceSigningAuthority,
  type SourceSigningAuthorityStateBackend,
  type SourceSigningAuthorityVaultBackend,
} from '@process/services/transfer/authority/sourceSigningAuthorityStore';

const roots: string[] = [];

class MemoryState implements SourceSigningAuthorityStateBackend {
  bytes: Uint8Array | null = null;
  winnerOnCreate: Uint8Array | undefined;
  failCreate = false;
  createCalls = 0;

  async read(): Promise<Uint8Array | null> {
    return this.bytes ? Uint8Array.from(this.bytes) : null;
  }

  async createOnce(bytes: Uint8Array): Promise<'created' | 'existing'> {
    this.createCalls += 1;
    if (this.failCreate) throw new Error(`secret backend detail ${Buffer.from(bytes).toString('base64url')}`);
    if (this.bytes) return 'existing';
    if (this.winnerOnCreate) {
      this.bytes = Uint8Array.from(this.winnerOnCreate);
      return 'existing';
    }
    this.bytes = Uint8Array.from(bytes);
    return 'created';
  }
}

class MemoryVault implements SourceSigningAuthorityVaultBackend {
  readonly provider = 'test-os-vault';
  private key: Buffer | undefined;
  readonly vaultRef = 'os-vault:wayland-transfer-source-v1';
  createCalls = 0;
  readCalls = 0;
  lastSupplied: Uint8Array | undefined;
  lastReadResult: Uint8Array | undefined;
  failReadWithSecret: string | undefined;

  async createOnce(input: {
    slot: typeof TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT;
    privateKeyPkcs8: Uint8Array;
  }): Promise<Readonly<{ disposition: 'created' | 'existing'; vaultRef: string }>> {
    expect(input.slot).toBe(TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT);
    this.createCalls += 1;
    this.lastSupplied = input.privateKeyPkcs8;
    if (this.key) return { disposition: 'existing', vaultRef: this.vaultRef };
    this.key = Buffer.from(input.privateKeyPkcs8);
    return { disposition: 'created', vaultRef: this.vaultRef };
  }

  async read(input: { slot: typeof TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT; vaultRef: string }): Promise<Uint8Array> {
    this.readCalls += 1;
    if (this.failReadWithSecret) throw new Error(`vault leaked ${this.failReadWithSecret}`);
    if (input.slot !== TRANSFER_SOURCE_SIGNING_AUTHORITY_SLOT || input.vaultRef !== this.vaultRef || !this.key) {
      throw new Error('missing vault key');
    }
    this.lastReadResult = Buffer.from(this.key);
    return this.lastReadResult;
  }

  replaceKey(key: Uint8Array): void {
    this.key?.fill(0);
    this.key = Buffer.from(key);
  }

  keyCopy(): Buffer {
    if (!this.key) throw new Error('test vault key is absent');
    return Buffer.from(this.key);
  }
}

function errorCode(error: unknown): string | undefined {
  return error instanceof SourceSigningAuthorityStoreError ? error.code : undefined;
}

function tempStatePath(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-transfer-source-authority-'));
  roots.push(root);
  fs.chmodSync(root, 0o700);
  return path.join(root, 'source-authority.json');
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('transfer source signing authority persistence', () => {
  it('creates once in the OS vault and reloads the exact Ed25519 identity', async () => {
    const state = new MemoryState();
    const vault = new MemoryVault();

    const created = await loadOrCreateSourceSigningAuthority({ state, vault });
    const reloaded = await loadOrCreateSourceSigningAuthority({ state, vault });

    expect(created.descriptor).toEqual(reloaded.descriptor);
    expect(created.receipt).toMatchObject({
      continuity: 'created',
      publicKeyFingerprint: created.descriptor.publicKeyFingerprint,
    });
    expect(reloaded.receipt).toMatchObject({
      continuity: 'reloaded',
      stateSha256: created.receipt.stateSha256,
    });
    expect(vault.createCalls).toBe(1);
    expect(vault.readCalls).toBe(3);
    expect(state.createCalls).toBe(1);
    expect(JSON.stringify(created.receipt)).not.toContain(created.descriptor.publicKeyDer);

    const persisted = new TextDecoder().decode(state.bytes!);
    expect(persisted).toContain(created.descriptor.publicKeyDer);
    expect(persisted).not.toMatch(/private|pkcs8/i);
    expect([...vault.lastSupplied!].every((byte) => byte === 0)).toBe(true);
    expect([...vault.lastReadResult!].every((byte) => byte === 0)).toBe(true);
    const proof = new TextEncoder().encode('continuity-proof');
    expect(created.authority.sign(proof)).toBe(reloaded.authority.sign(proof));
  });

  it('adopts the one vault winner under concurrent first creation', async () => {
    const state = new MemoryState();
    const vault = new MemoryVault();

    const [left, right] = await Promise.all([
      loadOrCreateSourceSigningAuthority({ state, vault }),
      loadOrCreateSourceSigningAuthority({ state, vault }),
    ]);

    expect(left.descriptor).toEqual(right.descriptor);
    expect(vault.createCalls).toBe(2);
    expect(state.createCalls).toBe(2);
    expect([left.receipt.continuity, right.receipt.continuity].toSorted()).toEqual(['created', 'recovered']);
  });

  it('recovers a vault winner after state publication crashes without replacing the key', async () => {
    const state = new MemoryState();
    const vault = new MemoryVault();
    state.failCreate = true;

    await expect(loadOrCreateSourceSigningAuthority({ state, vault })).rejects.toMatchObject({
      code: 'STATE_PUBLICATION_FAILED',
    });
    const firstKeyInput = vault.lastSupplied;
    state.failCreate = false;

    const recovered = await loadOrCreateSourceSigningAuthority({ state, vault });
    expect(recovered.receipt.continuity).toBe('recovered');
    expect(vault.createCalls).toBe(2);
    expect([...firstKeyInput!].every((byte) => byte === 0)).toBe(true);
  });

  it('rejects canonical-state corruption, unknown fields, duplicates, and provider drift', async () => {
    const state = new MemoryState();
    const vault = new MemoryVault();
    await loadOrCreateSourceSigningAuthority({ state, vault });
    const valid = new TextDecoder().decode(state.bytes!);
    const variants = [
      `${valid}\n`,
      valid.replace('{', '{"unknown":true,'),
      valid.replace('{', '{"algorithm":"Ed25519",'),
      valid.replace('test-os-vault', 'different-os-vault'),
      valid.replace(/sha256:[0-9a-f]{64}/, `sha256:${'0'.repeat(64)}`),
    ];

    for (const variant of variants) {
      state.bytes = new TextEncoder().encode(variant);
      // Intentionally serial: each hostile state mutates the same backend fixture.
      // oxlint-disable-next-line no-await-in-loop
      await expect(loadOrCreateSourceSigningAuthority({ state, vault })).rejects.toSatisfy((error: unknown) =>
        ['STATE_INVALID', 'IDENTITY_MISMATCH'].includes(errorCode(error) ?? '')
      );
    }
  });

  it('fails closed when the vault key no longer matches persisted public identity', async () => {
    const state = new MemoryState();
    const vault = new MemoryVault();
    await loadOrCreateSourceSigningAuthority({ state, vault });

    const replacementState = new MemoryState();
    const replacementVault = new MemoryVault();
    await loadOrCreateSourceSigningAuthority({ state: replacementState, vault: replacementVault });
    const replacementKey = replacementVault.keyCopy();
    vault.replaceKey(replacementKey);

    await expect(loadOrCreateSourceSigningAuthority({ state, vault })).rejects.toMatchObject({
      code: 'KEY_INVALID',
    });
  });

  it('rejects a different vault key after a claimed first creation', async () => {
    const donorState = new MemoryState();
    const donorVault = new MemoryVault();
    await loadOrCreateSourceSigningAuthority({ state: donorState, vault: donorVault });

    const state = new MemoryState();
    const vault = new MemoryVault();
    const originalCreate = vault.createOnce.bind(vault);
    vault.createOnce = async (input) => {
      const result = await originalCreate(input);
      vault.replaceKey(donorVault.keyCopy());
      return result;
    };

    await expect(loadOrCreateSourceSigningAuthority({ state, vault })).rejects.toMatchObject({
      code: 'VAULT_CONTRADICTION',
    });
    expect(state.bytes).toBeNull();
  });

  it('rejects a different authority that wins state publication', async () => {
    const winnerState = new MemoryState();
    const winnerVault = new MemoryVault();
    await loadOrCreateSourceSigningAuthority({ state: winnerState, vault: winnerVault });

    const state = new MemoryState();
    state.winnerOnCreate = winnerState.bytes!;
    const vault = new MemoryVault();
    await expect(loadOrCreateSourceSigningAuthority({ state, vault })).rejects.toMatchObject({
      code: 'IDENTITY_MISMATCH',
    });
  });

  it('sanitizes vault and state failures so secrets never enter errors', async () => {
    const state = new MemoryState();
    const vault = new MemoryVault();
    const secret = 'DO-NOT-LEAK-PRIVATE-KEY';
    await loadOrCreateSourceSigningAuthority({ state, vault });
    vault.failReadWithSecret = secret;

    let error: unknown;
    try {
      await loadOrCreateSourceSigningAuthority({ state, vault });
    } catch (caught) {
      error = caught;
    }
    expect(error).toMatchObject({ code: 'VAULT_UNAVAILABLE' });
    expect(String(error)).not.toContain(secret);
    expect((error as Error & { cause?: unknown }).cause).toBeUndefined();
  });

  it('uses a no-clobber 0600 file backend and rejects unsafe state files', async () => {
    const statePath = tempStatePath();
    const backend = new FileSourceSigningAuthorityStateBackend(statePath);
    const vault = new MemoryVault();

    const created = await loadOrCreateSourceSigningAuthority({ state: backend, vault });
    // Windows does not implement POSIX permission bits: a file created with
    // mode 0o600 reports 0o666 there (measured), so this asserted 438 !== 384 on
    // every Windows run. The chmod case below already guards for the same
    // reason; this assertion was simply missed.
    if (process.platform !== 'win32') {
      expect(fs.statSync(statePath).mode & 0o777).toBe(0o600);
    }
    const before = fs.readFileSync(statePath);
    expect(await backend.createOnce(new TextEncoder().encode('{}'))).toBe('existing');
    expect(fs.readFileSync(statePath)).toEqual(before);

    if (process.platform !== 'win32') {
      fs.chmodSync(statePath, 0o644);
      await expect(loadOrCreateSourceSigningAuthority({ state: backend, vault })).rejects.toMatchObject({
        code: 'STATE_UNAVAILABLE',
      });
      fs.chmodSync(statePath, 0o600);
    }

    const realState = `${statePath}.real`;
    fs.renameSync(statePath, realState);
    fs.symlinkSync(realState, statePath);
    await expect(loadOrCreateSourceSigningAuthority({ state: backend, vault })).rejects.toMatchObject({
      code: 'STATE_UNAVAILABLE',
    });
    expect(created.descriptor.publicKeyFingerprint).toMatch(/^sha256:/);
  });
});
