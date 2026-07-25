/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vitest';
import {
  loadOrCreateExternalRecoveryAuthority,
  type ExternalRecoveryVaultBackend,
} from '@process/services/recovery/externalRecoveryAuthority';
import {
  canonicalizeRecoveryJson,
  createRecoveryKeyRotatedEvent,
  createSameDeviceRecoveryWrap,
  deriveAndVerifyRecoveryKeyState,
  deriveRecoveryKeyId,
  parseCanonicalRecoveryJson,
} from '@process/services/recovery/externalRecoveryCrypto';
import { createExternalRecoveryRecordCodec } from '@process/services/recovery/externalRecoveryRecordCodec';
import { vaultRelativePathForKeyId } from '@process/services/recovery/externalRecoveryAuthority';

const CREATED_AT = new Date('2026-07-17T12:00:00.000Z');
const FIXED_SECRET = Buffer.from(Array.from({ length: 32 }, (_, index) => index + 11));
const ROTATED_SECRET = Buffer.from(Array.from({ length: 32 }, (_, index) => 0xf0 - index));
const PREPARATION_ID = 'prep-authority-codec';
const PROJECTION_CONTRACT = 'wayland-constitution-classic-projection-authority/1.0';
const roots: string[] = [];

class ZeroizationVault implements ExternalRecoveryVaultBackend {
  readonly provider = 'test-os-vault';
  readonly returnedSecrets: Buffer[] = [];

  async wrap(input: { secret: Buffer; keyId: string }): Promise<{ vaultRef: string; wrappedSecret: Uint8Array }> {
    return {
      vaultRef: `test-vault:${input.keyId}`,
      wrappedSecret: Buffer.from(input.secret.map((byte) => byte ^ 0x37)),
    };
  }

  async unwrap(input: { keyId: string; vaultRef: string; wrappedSecret: Buffer }): Promise<Uint8Array> {
    if (input.vaultRef !== `test-vault:${input.keyId}`) throw new Error('test vault identity mismatch');
    const secret = Buffer.from(input.wrappedSecret.map((byte) => byte ^ 0x37));
    this.returnedSecrets.push(secret);
    return secret;
  }
}

async function fixture(): Promise<{
  root: string;
  userDataRoot: string;
  recordRoot: string;
  sourcePath: string;
  projectionPath: string;
  vault: ZeroizationVault;
}> {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-external-record-codec-')));
  roots.push(root);
  const userDataRoot = path.join(root, 'user-data');
  const recordRoot = path.join(root, 'classic-authority', PREPARATION_ID);
  const stagingRoot = path.join(root, 'staging');
  const sourcePath = path.join(stagingRoot, 'projection.json');
  const projectionPath = path.join(recordRoot, 'projection-authority.sealed');
  await mkdir(userDataRoot, { recursive: true, mode: 0o700 });
  await mkdir(recordRoot, { recursive: true, mode: 0o700 });
  await mkdir(stagingRoot, { recursive: true, mode: 0o700 });
  await writeFile(
    sourcePath,
    canonicalizeRecoveryJson({ contract: PROJECTION_CONTRACT, preparationId: PREPARATION_ID }),
    { mode: 0o600 }
  );
  const vault = new ZeroizationVault();
  const authority = await loadOrCreateExternalRecoveryAuthority({
    userDataRoot,
    vault,
    existingRecordDigests: async () => [],
    dependencies: { now: () => CREATED_AT, randomSecret: () => Buffer.from(FIXED_SECRET) },
  });
  authority.activeSecret.fill(0);
  return { root, userDataRoot, recordRoot, sourcePath, projectionPath, vault };
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

async function publishValidRotationFixture(
  userDataRoot: string,
  vault: ZeroizationVault,
  coveredRecordDigests: readonly string[]
): Promise<void> {
  const authorityRoot = path.join(userDataRoot, 'constitution', 'external-recovery-authority-v1');
  const firstEvent = await readFile(path.join(authorityRoot, 'events', '000000.json'));
  const previousEventSha256 = `sha256:${createHash('sha256').update(firstEvent).digest('hex')}`;
  const newKeyId = deriveRecoveryKeyId(ROTATED_SECRET);
  // Use the production mapping rather than restating it: this line previously
  // duplicated `vault/<keyId>.json` and broke the moment the real scheme changed
  // to keep the colon out of Windows filenames.
  const vaultRelativePath = vaultRelativePathForKeyId(newKeyId);
  const wrapped = await vault.wrap({ secret: Buffer.from(ROTATED_SECRET), keyId: newKeyId });
  const wrapBytes = createSameDeviceRecoveryWrap({
    secret: ROTATED_SECRET,
    createdAt: '2026-07-17T13:00:00.000Z',
    vaultProvider: vault.provider,
    vaultRef: wrapped.vaultRef,
    wrappedSecret: wrapped.wrappedSecret,
  });
  const rotated = createRecoveryKeyRotatedEvent({
    oldSecret: FIXED_SECRET,
    newSecret: ROTATED_SECRET,
    sequence: 1,
    previousEventSha256,
    newVaultRef: vaultRelativePath,
    createdAt: '2026-07-17T13:00:00.000Z',
    coveredRecordDigests,
  });
  const derived = deriveAndVerifyRecoveryKeyState(
    [firstEvent, rotated.canonicalBytes],
    new Map([
      [deriveRecoveryKeyId(FIXED_SECRET), FIXED_SECRET],
      [newKeyId, ROTATED_SECRET],
    ])
  );
  await writeFile(path.join(authorityRoot, vaultRelativePath), wrapBytes, { mode: 0o600, flag: 'wx' });
  await writeFile(path.join(authorityRoot, 'events', '000001.json'), rotated.canonicalBytes, {
    mode: 0o600,
    flag: 'wx',
  });
  await writeFile(path.join(authorityRoot, 'key-state.json'), derived.canonicalBytes, { mode: 0o600 });
}

describe('external recovery record codec', () => {
  it('binds projection contract, domain, record identity, and module-owned crypto while zeroizing vault secrets', async () => {
    const data = await fixture();
    const codec = createExternalRecoveryRecordCodec({
      authorityUserDataRoot: data.userDataRoot,
      vault: data.vault,
      recordRoot: data.recordRoot,
      now: () => CREATED_AT,
    });
    await codec.sealFile(data.sourcePath, data.projectionPath);

    const envelope = parseCanonicalRecoveryJson(await readFile(data.projectionPath)) as Record<string, unknown>;
    expect(envelope.recordContract).toBe(PROJECTION_CONTRACT);
    expect(envelope.domain).toBe('wayland.classic-recovery.projection-authority/1.0');
    expect(envelope.recordId).toBe(`classic-recovery/${PREPARATION_ID}/projection-authority.sealed`);
    expect(envelope.keyId).toBe(deriveRecoveryKeyId(FIXED_SECRET));
    expect((envelope.kdf as Record<string, unknown>).saltBase64url).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect((envelope.cipher as Record<string, unknown>).nonceBase64url).toMatch(/^[A-Za-z0-9_-]{16}$/);

    const restored = path.join(data.root, 'restored', 'projection.json');
    await mkdir(path.dirname(restored), { recursive: true, mode: 0o700 });
    await codec.unsealFile(data.projectionPath, restored);
    expect(await readFile(restored)).toEqual(await readFile(data.sourcePath));
    expect(data.vault.returnedSecrets.length).toBeGreaterThan(0);
    expect(data.vault.returnedSecrets.every((secret) => secret.every((byte) => byte === 0))).toBe(true);
  });

  it('fails closed when an authenticated envelope is moved to a different semantic path', async () => {
    const data = await fixture();
    const codec = createExternalRecoveryRecordCodec({
      authorityUserDataRoot: data.userDataRoot,
      vault: data.vault,
      recordRoot: data.recordRoot,
      now: () => CREATED_AT,
    });
    await codec.sealFile(data.sourcePath, data.projectionPath);
    const rescuePath = path.join(data.recordRoot, 'rescue', `${'a'.repeat(64)}.sealed`);
    await mkdir(path.dirname(rescuePath), { recursive: true, mode: 0o700 });
    await rename(data.projectionPath, rescuePath);
    const restored = path.join(data.root, 'restored.json');
    await expect(codec.unsealFile(rescuePath, restored)).rejects.toThrow(/AAD identity/);
    expect(fs.existsSync(restored)).toBe(false);
  });

  it('rejects unknown envelope keys before decrypting or publishing plaintext', async () => {
    const data = await fixture();
    const codec = createExternalRecoveryRecordCodec({
      authorityUserDataRoot: data.userDataRoot,
      vault: data.vault,
      recordRoot: data.recordRoot,
      now: () => CREATED_AT,
    });
    await codec.sealFile(data.sourcePath, data.projectionPath);
    const envelope = parseCanonicalRecoveryJson(await readFile(data.projectionPath)) as Record<string, unknown>;
    envelope.keyId = deriveRecoveryKeyId(Buffer.alloc(32, 0xee));
    await writeFile(data.projectionPath, canonicalizeRecoveryJson(envelope));
    const restored = path.join(data.root, 'unknown-key.json');
    await expect(codec.unsealFile(data.projectionPath, restored)).rejects.toThrow(/unknown authority key/);
    expect(fs.existsSync(restored)).toBe(false);
  });

  it('refuses legacy records and unsupported identities before minting new recovery records', async () => {
    const data = await fixture();
    const legacyPath = path.join(data.recordRoot, 'rescue', `${'b'.repeat(64)}.sealed`);
    await mkdir(path.dirname(legacyPath), { recursive: true, mode: 0o700 });
    await writeFile(legacyPath, '{"legacySafeStorage":"ciphertext"}', { mode: 0o600 });
    const codec = createExternalRecoveryRecordCodec({
      authorityUserDataRoot: data.userDataRoot,
      vault: data.vault,
      recordRoot: data.recordRoot,
      now: () => CREATED_AT,
    });
    await expect(codec.sealFile(data.sourcePath, data.projectionPath)).rejects.toThrow(/key ID|envelope/);
    expect(fs.existsSync(data.projectionPath)).toBe(false);

    const unsupported = path.join(data.recordRoot, 'arbitrary.sealed');
    await expect(codec.sealFile(data.sourcePath, unsupported)).rejects.toThrow(/Unsupported Classic/);
    expect(fs.existsSync(unsupported)).toBe(false);
  });

  it('preserves exclusive no-clobber publication after authenticating the existing record inventory', async () => {
    const data = await fixture();
    const codec = createExternalRecoveryRecordCodec({
      authorityUserDataRoot: data.userDataRoot,
      vault: data.vault,
      recordRoot: data.recordRoot,
      now: () => CREATED_AT,
    });
    await codec.sealFile(data.sourcePath, data.projectionPath);
    const before = await readFile(data.projectionPath);
    await expect(codec.sealFile(data.sourcePath, data.projectionPath)).rejects.toMatchObject({ code: 'EEXIST' });
    expect(await readFile(data.projectionPath)).toEqual(before);
  });

  it('rejects a plaintext contract that does not match the canonical record path', async () => {
    const data = await fixture();
    await writeFile(data.sourcePath, canonicalizeRecoveryJson({ contract: 'wayland-constitution-classic-rescue/1.0' }));
    const codec = createExternalRecoveryRecordCodec({
      authorityUserDataRoot: data.userDataRoot,
      vault: data.vault,
      recordRoot: data.recordRoot,
      now: () => CREATED_AT,
    });
    await expect(codec.sealFile(data.sourcePath, data.projectionPath)).rejects.toThrow(/plaintext contract/);
    expect(fs.existsSync(data.projectionPath)).toBe(false);
  });

  it('seals and reopens every Wave 0 Classic projection, journal, rescue, and reconciliation identity', async () => {
    const data = await fixture();
    const codec = createExternalRecoveryRecordCodec({
      authorityUserDataRoot: data.userDataRoot,
      vault: data.vault,
      recordRoot: data.recordRoot,
      now: () => CREATED_AT,
    });
    const promotionId = '11111111-1111-4111-8111-111111111111';
    const operationId = '22222222-2222-4222-8222-222222222222';
    const identities = [
      ['projection-authority.sealed', PROJECTION_CONTRACT],
      [`promotions/${promotionId}/000000-${'1'.repeat(64)}.sealed`, 'wayland-constitution-classic-promotion/1.0'],
      [`promotions/${promotionId}/.claim-genesis.sealed`, 'wayland-constitution-classic-promotion-claim/1.0'],
      [`promotions/${promotionId}/.HEAD.${operationId}.sealed`, 'wayland-constitution-classic-promotion-head/1.0'],
      [`rescue/${'2'.repeat(64)}.sealed`, 'wayland-constitution-classic-rescue/1.0'],
      [
        `promotions/${promotionId}/reconciliation/${'3'.repeat(64)}.sealed`,
        'wayland-constitution-classic-reconciliation/1.0',
      ],
    ] as const;
    for (const [index, [relative, contract]] of identities.entries()) {
      const source = path.join(data.root, 'record-sources', `${index}.json`);
      const destination = path.join(data.recordRoot, ...relative.split('/'));
      // Ordered setup is part of the inventory-authentication progression under test.
      // oxlint-disable-next-line no-await-in-loop
      await mkdir(path.dirname(source), { recursive: true, mode: 0o700 });
      // oxlint-disable-next-line no-await-in-loop
      await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
      // oxlint-disable-next-line no-await-in-loop
      await writeFile(source, canonicalizeRecoveryJson({ contract }), { mode: 0o600 });
      // Sequential operations deliberately force each new seal to authenticate the complete prior inventory.
      // oxlint-disable-next-line no-await-in-loop
      await codec.sealFile(source, destination);
      const openPath = relative.includes('/.HEAD.') ? path.join(path.dirname(destination), 'HEAD.sealed') : destination;
      if (openPath !== destination) {
        // The journal publishes a pending authenticated head and atomically renames it to its logical identity.
        // oxlint-disable-next-line no-await-in-loop
        await rename(destination, openPath);
      }
      const restored = path.join(data.root, 'record-restored', `${index}.json`);
      // oxlint-disable-next-line no-await-in-loop
      await mkdir(path.dirname(restored), { recursive: true, mode: 0o700 });
      // oxlint-disable-next-line no-await-in-loop
      await codec.unsealFile(openPath, restored);
      // oxlint-disable-next-line no-await-in-loop
      expect(parseCanonicalRecoveryJson(await readFile(restored))).toEqual({ contract });
    }
  });

  it('opens old records with an authenticated retained key while sealing new records only with the active key', async () => {
    const data = await fixture();
    const codec = createExternalRecoveryRecordCodec({
      authorityUserDataRoot: data.userDataRoot,
      vault: data.vault,
      recordRoot: data.recordRoot,
      now: () => CREATED_AT,
    });
    await codec.sealFile(data.sourcePath, data.projectionPath);
    expect((parseCanonicalRecoveryJson(await readFile(data.projectionPath)) as Record<string, unknown>).keyId).toBe(
      deriveRecoveryKeyId(FIXED_SECRET)
    );

    const projectionDigest = `sha256:${createHash('sha256')
      .update(await readFile(data.projectionPath))
      .digest('hex')}`;
    await publishValidRotationFixture(data.userDataRoot, data.vault, [projectionDigest]);
    const restored = path.join(data.root, 'retained-key', 'projection.json');
    await mkdir(path.dirname(restored), { recursive: true, mode: 0o700 });
    await codec.unsealFile(data.projectionPath, restored);
    expect(await readFile(restored)).toEqual(await readFile(data.sourcePath));

    const rescueSource = path.join(data.root, 'staging', 'rescue.json');
    const rescuePath = path.join(data.recordRoot, 'rescue', `${'c'.repeat(64)}.sealed`);
    await mkdir(path.dirname(rescuePath), { recursive: true, mode: 0o700 });
    await writeFile(rescueSource, canonicalizeRecoveryJson({ contract: 'wayland-constitution-classic-rescue/1.0' }), {
      mode: 0o600,
    });
    await codec.sealFile(rescueSource, rescuePath);
    expect((parseCanonicalRecoveryJson(await readFile(rescuePath)) as Record<string, unknown>).keyId).toBe(
      deriveRecoveryKeyId(ROTATED_SECRET)
    );
  });
});
