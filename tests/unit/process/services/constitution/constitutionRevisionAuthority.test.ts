import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ConstitutionRevisionAuthority,
  constitutionRevisionDurabilitySyncPath,
} from '@process/services/constitution/constitutionRevisionAuthority';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';

const secretBackend: ConstitutionArchiveSecretBackend = {
  encryptString: (plaintext) => `fenc:v1:${Buffer.from(plaintext).toString('base64')}`,
  decryptString: (ciphertext) => Buffer.from(ciphertext.slice('fenc:v1:'.length), 'base64').toString('utf8'),
};

describe('ConstitutionRevisionAuthority', () => {
  it('keeps a cold noncreating load side-effect free and preserves one active key across restart', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-authority-'));
    const authorityPath = path.join(root, 'authority', 'revision.enc');

    expect(ConstitutionRevisionAuthority.load(authorityPath, secretBackend)).toBeNull();
    expect(existsSync(authorityPath)).toBe(false);

    const created = ConstitutionRevisionAuthority.loadOrCreate(authorityPath, secretBackend);
    const reloaded = ConstitutionRevisionAuthority.load(authorityPath, secretBackend);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.keyId()).toBe(created.keyId());
    expect(reloaded?.keyDigest()).toBe(created.keyDigest());
  });

  it('fails closed when authority publication succeeds but its durability sync fails', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-authority-sync-failure-'));
    const authorityPath = path.join(root, 'authority', 'revision.enc');

    expect(() =>
      ConstitutionRevisionAuthority.loadOrCreate(authorityPath, secretBackend, {
        syncPublication: () => {
          throw new Error('injected durability failure');
        },
      })
    ).toThrow('CONSTITUTION_FS_REVISION_AUTHORITY_PUBLICATION_NOT_DURABLE');
    expect(existsSync(authorityPath)).toBe(true);
  });

  it('retires the old key and persists an authenticated rotation identity', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-rotation-'));
    const authorityPath = path.join(root, 'revision.enc');
    const authority = ConstitutionRevisionAuthority.loadOrCreate(authorityPath, secretBackend);
    const previousKeyId = authority.keyId();
    const receipt = authority.rotate();

    expect(receipt).toMatchObject({ previousKeyId, nextKeyId: authority.keyId() });
    expect(receipt.nextKeyId).not.toBe(previousKeyId);
    const reloaded = ConstitutionRevisionAuthority.load(authorityPath, secretBackend);
    expect(reloaded?.keyId()).toBe(receipt.nextKeyId);
    expect(reloaded?.lastRotationReceipt()).toEqual(receipt);
    expect(reloaded?.key(previousKeyId)).toHaveLength(32);
    expect(reloaded?.rotationReceipts()).toEqual([receipt]);
  });

  it('serializes rotation across processes and never overwrites a competing receipt', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-rotation-lock-'));
    const authorityPath = path.join(root, 'revision.enc');
    const authority = ConstitutionRevisionAuthority.loadOrCreate(authorityPath, secretBackend);
    const originalKeyId = authority.keyId();
    writeFileSync(`${authorityPath}.rotation.lock`, 'held by competing process', { mode: 0o600 });

    expect(() => authority.rotate()).toThrow('CONSTITUTION_FS_REVISION_AUTHORITY_ROTATION_BUSY');
    expect(ConstitutionRevisionAuthority.load(authorityPath, secretBackend)?.keyId()).toBe(originalKeyId);
    expect(ConstitutionRevisionAuthority.load(authorityPath, secretBackend)?.rotationReceipts()).toEqual([]);
  });

  it('reclaims a dead pre-commit rotation owner without leaving an immortal lock', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-stale-rotation-lock-'));
    const authorityPath = path.join(root, 'revision.enc');
    const authority = ConstitutionRevisionAuthority.loadOrCreate(authorityPath, secretBackend, {
      isProcessAlive: () => false,
    });
    writeFileSync(
      `${authorityPath}.rotation.lock`,
      JSON.stringify({
        schemaVersion: 1,
        operation: 'rotate',
        pid: 2147483647,
        createdAt: 1,
        lineageKeyId: authority.lineageKeyId(),
        previousKeyId: authority.keyId(),
        receiptId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      }),
      { mode: 0o600 }
    );

    const receipt = authority.rotate();
    expect(receipt.previousKeyId).not.toBe(receipt.nextKeyId);
    expect(receipt.receiptId).not.toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    expect(existsSync(`${authorityPath}.rotation.lock`)).toBe(false);
  });

  it('returns the committed receipt after lock-release failure and never double-rotates on stale recovery', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-committed-stale-lock-'));
    const authorityPath = path.join(root, 'revision.enc');
    const authority = ConstitutionRevisionAuthority.loadOrCreate(authorityPath, secretBackend, {
      isProcessAlive: () => false,
      unlinkRotationLock: () => {
        throw new Error('injected lock release failure');
      },
    });
    const committed = authority.rotate();
    expect(existsSync(`${authorityPath}.rotation.lock`)).toBe(true);

    const restarted = ConstitutionRevisionAuthority.load(authorityPath, secretBackend, {
      isProcessAlive: () => false,
    })!;
    const recovered = restarted.rotate();
    expect(recovered).toEqual(committed);
    expect(restarted.rotationReceipts()).toEqual([committed]);
    expect(existsSync(`${authorityPath}.rotation.lock`)).toBe(false);
  });

  it('uses the published file as the Windows durability target and its parent on POSIX', () => {
    const publishedPath = path.join('authority', 'revision.enc');
    expect(constitutionRevisionDurabilitySyncPath(publishedPath, 'win32')).toBe(publishedPath);
    expect(constitutionRevisionDurabilitySyncPath(publishedPath, 'linux')).toBe('authority');
    expect(constitutionRevisionDurabilitySyncPath(publishedPath, 'darwin')).toBe('authority');
  });

  it('refuses to rotate after the persisted authority is replaced by another valid vault state', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-replaced-'));
    const authorityPath = path.join(root, 'revision.enc');
    const replacementPath = path.join(root, 'replacement.enc');
    const authority = ConstitutionRevisionAuthority.loadOrCreate(authorityPath, secretBackend);
    ConstitutionRevisionAuthority.loadOrCreate(replacementPath, secretBackend);
    writeFileSync(authorityPath, readFileSync(replacementPath));

    expect(() => authority.rotate()).toThrow('CONSTITUTION_FS_REVISION_AUTHORITY_REPLACED');
  });

  it('never drops a retired key or its receipt while revision history can still depend on it', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-retention-'));
    const authority = ConstitutionRevisionAuthority.loadOrCreate(path.join(root, 'revision.enc'), secretBackend);
    const firstKeyId = authority.keyId();
    for (let index = 0; index < 7; index += 1) authority.rotate();

    expect(authority.keyIds()).toHaveLength(8);
    expect(authority.rotationReceipts()).toHaveLength(7);
    expect(authority.key(firstKeyId)).toHaveLength(32);
    expect(() => authority.rotate()).toThrow('CONSTITUTION_FS_REVISION_AUTHORITY_RETENTION_REQUIRED');
  });

  it.runIf(process.platform !== 'win32')('rejects a revision authority below a symbolic-link parent', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-parent-'));
    const real = path.join(root, 'real');
    mkdirSync(real);
    const linked = path.join(root, 'linked');
    symlinkSync(real, linked, 'dir');
    expect(() => ConstitutionRevisionAuthority.loadOrCreate(path.join(linked, 'revision.enc'), secretBackend)).toThrow(
      'CONSTITUTION_FS_REVISION_AUTHORITY_UNSAFE_PARENT'
    );
  });

  it('fails closed on malformed, plaintext, or non-v2 authority state', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-invalid-'));
    const authorityPath = path.join(root, 'revision.enc');
    writeFileSync(authorityPath, secretBackend.encryptString(JSON.stringify({ schemaVersion: 1 })));
    expect(() => ConstitutionRevisionAuthority.load(authorityPath, secretBackend)).toThrow(
      'CONSTITUTION_FS_REVISION_AUTHORITY_INVALID'
    );

    const ciphertext = readFileSync(authorityPath, 'utf8');
    expect(ciphertext).not.toContain('keyBase64');
  });
});
