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
  loadExternalRecoveryAuthority,
  loadOrCreateExternalRecoveryAuthority,
  resolveExternalRecoveryAuthorityRoot,
  type ExternalRecoveryAuthorityOptions,
  type ExternalRecoveryVaultBackend,
} from '@process/services/recovery/externalRecoveryAuthority';

const CREATED_AT = new Date('2026-07-17T12:00:00.000Z');
const FIXED_SECRET = Buffer.from(Array.from({ length: 32 }, (_, index) => index + 1));
const RECORD_DIGEST = `sha256:${'ab'.repeat(32)}`;
const roots: string[] = [];

class TestVault implements ExternalRecoveryVaultBackend {
  readonly provider = 'test-os-vault';
  wrapCalls = 0;
  unwrapCalls = 0;
  missing = false;

  async wrap(input: { secret: Buffer; keyId: string }): Promise<{ vaultRef: string; wrappedSecret: Uint8Array }> {
    this.wrapCalls += 1;
    return {
      vaultRef: `test-vault:${input.keyId}`,
      wrappedSecret: Buffer.from(input.secret.map((byte) => byte ^ 0x5a)),
    };
  }

  async unwrap(input: { keyId: string; vaultRef: string; wrappedSecret: Buffer }): Promise<Uint8Array> {
    this.unwrapCalls += 1;
    if (this.missing) throw new Error(`OS vault key is missing: ${input.keyId}`);
    if (input.vaultRef !== `test-vault:${input.keyId}`) throw new Error('OS vault reference mismatch.');
    return Buffer.from(input.wrappedSecret.map((byte) => byte ^ 0x5a));
  }
}

function temporaryUserData(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-external-recovery-authority-'));
  roots.push(root);
  const userDataRoot = path.join(root, 'user-data');
  fs.mkdirSync(userDataRoot, { mode: 0o700 });
  return userDataRoot;
}

function options(
  userDataRoot: string,
  vault: TestVault,
  overrides: Partial<ExternalRecoveryAuthorityOptions> = {}
): ExternalRecoveryAuthorityOptions {
  return {
    userDataRoot,
    vault,
    existingRecordDigests: async () => [],
    dependencies: {
      now: () => CREATED_AT,
      randomSecret: () => Buffer.from(FIXED_SECRET),
    },
    ...overrides,
  };
}

function authorityFiles(userDataRoot: string): { root: string; event: string; state: string; vault: string } {
  const root = resolveExternalRecoveryAuthorityRoot(userDataRoot);
  const vaultNames = fs.readdirSync(path.join(root, 'vault'));
  return {
    root,
    event: path.join(root, 'events', '000000.json'),
    state: path.join(root, 'key-state.json'),
    vault: path.join(root, 'vault', vaultNames[0]),
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('external recovery authority', () => {
  it('creates one 32-byte vaulted authority outside Classic, then restarts without replacing it', async () => {
    const userDataRoot = temporaryUserData();
    const classicRoot = path.join(path.dirname(userDataRoot), 'classic-tree');
    fs.mkdirSync(classicRoot);
    const vault = new TestVault();
    const created = await loadOrCreateExternalRecoveryAuthority(
      options(userDataRoot, vault, { classicTreeRoots: [classicRoot] })
    );
    const files = authorityFiles(userDataRoot);

    expect(created.authorityRoot).toBe(files.root);
    expect(created.authorityRoot.startsWith(`${classicRoot}${path.sep}`)).toBe(false);
    expect(created.activeSecret).toEqual(FIXED_SECRET);
    expect(created.reconciledState).toBe(false);
    expect(created.coveredRecordDigests).toEqual([]);
    expect(fs.existsSync(files.event)).toBe(true);
    expect(fs.existsSync(files.vault)).toBe(true);
    expect(fs.readFileSync(files.state)).toEqual(created.canonicalStateBytes);
    expect(vault.wrapCalls).toBe(1);

    const stateBefore = fs.readFileSync(files.state);
    const restarted = await loadOrCreateExternalRecoveryAuthority(options(userDataRoot, vault));
    expect(restarted.activeSecret).toEqual(FIXED_SECRET);
    expect(restarted.canonicalStateBytes).toEqual(stateBefore);
    expect(fs.readFileSync(files.state)).toEqual(stateBefore);
    expect(vault.wrapCalls).toBe(1);
    expect(vault.unwrapCalls).toBe(1);
  });

  it('reconciles a crash after authenticated event publication without creating another key', async () => {
    const userDataRoot = temporaryUserData();
    const vault = new TestVault();
    await expect(
      loadOrCreateExternalRecoveryAuthority(
        options(userDataRoot, vault, {
          dependencies: {
            now: () => CREATED_AT,
            randomSecret: () => Buffer.from(FIXED_SECRET),
            afterPublication: (stage) => {
              if (stage === 'event') throw new Error('simulated process loss');
            },
          },
        })
      )
    ).rejects.toThrow('simulated process loss');

    const files = authorityFiles(userDataRoot);
    expect(fs.existsSync(files.event)).toBe(true);
    expect(fs.existsSync(files.state)).toBe(false);

    const recovered = await loadOrCreateExternalRecoveryAuthority(options(userDataRoot, vault));
    expect(recovered.reconciledState).toBe(true);
    expect(recovered.activeSecret).toEqual(FIXED_SECRET);
    expect(fs.readFileSync(files.state)).toEqual(recovered.canonicalStateBytes);
    expect(vault.wrapCalls).toBe(1);
  });

  it('fails closed when the OS vault key or an immutable wrap is missing', async () => {
    const userDataRoot = temporaryUserData();
    const vault = new TestVault();
    await loadOrCreateExternalRecoveryAuthority(options(userDataRoot, vault));
    vault.missing = true;
    await expect(loadExternalRecoveryAuthority(options(userDataRoot, vault))).rejects.toThrow(
      'OS vault key is missing'
    );

    vault.missing = false;
    const files = authorityFiles(userDataRoot);
    fs.unlinkSync(files.vault);
    await expect(loadExternalRecoveryAuthority(options(userDataRoot, vault))).rejects.toThrow();
  });

  it('fails closed on a missing event or an unreferenced vault entry', async () => {
    const missingEventUserData = temporaryUserData();
    const missingEventVault = new TestVault();
    await loadOrCreateExternalRecoveryAuthority(options(missingEventUserData, missingEventVault));
    const missingEventFiles = authorityFiles(missingEventUserData);
    fs.unlinkSync(missingEventFiles.event);
    await expect(loadExternalRecoveryAuthority(options(missingEventUserData, missingEventVault))).rejects.toThrow(
      /event chain is missing/
    );

    const extraWrapUserData = temporaryUserData();
    const extraWrapVault = new TestVault();
    await loadOrCreateExternalRecoveryAuthority(options(extraWrapUserData, extraWrapVault));
    const extraWrapFiles = authorityFiles(extraWrapUserData);
    fs.writeFileSync(path.join(extraWrapFiles.root, 'vault', 'unreferenced.json'), '{}');
    await expect(loadExternalRecoveryAuthority(options(extraWrapUserData, extraWrapVault))).rejects.toThrow(
      /inventory is incomplete or contradictory/
    );
  });

  it('rejects noncanonical state, event, and vault bytes instead of repairing contradictions', async () => {
    for (const selected of ['state', 'event', 'vault'] as const) {
      const userDataRoot = temporaryUserData();
      const vault = new TestVault();
      // Ordered because each iteration deliberately corrupts an independent authority tree.
      // oxlint-disable-next-line no-await-in-loop
      await loadOrCreateExternalRecoveryAuthority(options(userDataRoot, vault));
      const files = authorityFiles(userDataRoot);
      fs.appendFileSync(files[selected], '\n');
      // oxlint-disable-next-line no-await-in-loop
      await expect(loadExternalRecoveryAuthority(options(userDataRoot, vault))).rejects.toThrow(/canonical/);
    }
  });

  it('rejects symlinked authority material without invoking the OS vault', async () => {
    const userDataRoot = temporaryUserData();
    const vault = new TestVault();
    await loadOrCreateExternalRecoveryAuthority(options(userDataRoot, vault));
    const files = authorityFiles(userDataRoot);
    const original = path.join(path.dirname(files.root), 'original-vault-wrap.json');
    fs.renameSync(files.vault, original);
    fs.symlinkSync(original, files.vault);
    const unwrapsBefore = vault.unwrapCalls;

    await expect(loadExternalRecoveryAuthority(options(userDataRoot, vault))).rejects.toThrow(
      /unsafe entry|symlink|loop/i
    );
    expect(vault.unwrapCalls).toBe(unwrapsBefore);
  });

  it('never creates or vaults a replacement authority over existing records or history', async () => {
    const userDataRoot = temporaryUserData();
    const vault = new TestVault();
    await expect(
      loadOrCreateExternalRecoveryAuthority(
        options(userDataRoot, vault, { existingRecordDigests: async () => [RECORD_DIGEST] })
      )
    ).rejects.toThrow('existing records or history');
    expect(vault.wrapCalls).toBe(0);
    expect(fs.existsSync(resolveExternalRecoveryAuthorityRoot(userDataRoot))).toBe(false);
  });

  it('fails closed under writer contention and never steals or removes the competing lock', async () => {
    const userDataRoot = temporaryUserData();
    const vault = new TestVault();
    await loadOrCreateExternalRecoveryAuthority(options(userDataRoot, vault));
    const lockPath = path.join(resolveExternalRecoveryAuthorityRoot(userDataRoot), 'writer.lock');
    fs.writeFileSync(lockPath, 'other-writer\n', { flag: 'wx', mode: 0o600 });

    await expect(loadExternalRecoveryAuthority(options(userDataRoot, vault))).rejects.toThrow('already active');
    expect(fs.readFileSync(lockPath, 'utf8')).toBe('other-writer\n');
  });

  it('rejects a requested authority path that overlaps a Classic tree', async () => {
    const userDataRoot = temporaryUserData();
    const vault = new TestVault();
    await expect(
      loadOrCreateExternalRecoveryAuthority(
        options(userDataRoot, vault, { classicTreeRoots: [path.join(userDataRoot, 'constitution')] })
      )
    ).rejects.toThrow('disjoint');
    expect(vault.wrapCalls).toBe(0);
  });
});
