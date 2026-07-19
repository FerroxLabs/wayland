/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRecoveryFileSealer } from '@process/services/recovery/recoverySealing';

const roots: string[] = [];

function authenticatedBackend(available = true) {
  const key = randomBytes(32);
  return {
    isEncryptionAvailable: () => available,
    encryptString(plaintext: string): Buffer {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
    },
    decryptString(payload: Buffer): string {
      const decipher = createDecipheriv('aes-256-gcm', key, payload.subarray(0, 12));
      decipher.setAuthTag(payload.subarray(12, 28));
      return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8');
    },
  };
}

async function fixture(): Promise<{ root: string; source: string; sealed: string; restored: string }> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wayland-recovery-sealing-'));
  roots.push(root);
  const source = path.join(root, 'source', 'secret');
  await mkdir(path.dirname(source), { recursive: true });
  await writeFile(source, 'sensitive-recovery-state', { mode: 0o600 });
  return {
    root,
    source,
    sealed: path.join(root, 'sealed'),
    restored: path.join(root, 'restored'),
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('recovery file sealing', () => {
  it('round-trips through an authenticated envelope without writing plaintext into the snapshot', async () => {
    const data = await fixture();
    const sealer = createRecoveryFileSealer(authenticatedBackend());

    await sealer.sealFile(data.source, data.sealed);
    expect(await readFile(data.sealed, 'utf8')).not.toContain('sensitive-recovery-state');
    await sealer.unsealFile(data.sealed, data.restored);
    expect(await readFile(data.restored, 'utf8')).toBe('sensitive-recovery-state');
  });

  it('seals admitted bytes without requiring a plaintext source path', async () => {
    const data = await fixture();
    const sealer = createRecoveryFileSealer(authenticatedBackend());
    await rm(data.source);

    await sealer.sealBytes(Buffer.from('descriptor-admitted-state'), data.sealed);
    expect(await readFile(data.sealed, 'utf8')).not.toContain('descriptor-admitted-state');
    await sealer.unsealFile(data.sealed, data.restored);
    expect(await readFile(data.restored, 'utf8')).toBe('descriptor-admitted-state');
  });

  it('fails closed when the OS credential store is unavailable', async () => {
    const data = await fixture();
    const sealer = createRecoveryFileSealer(authenticatedBackend(false));

    await expect(sealer.sealFile(data.source, data.sealed)).rejects.toThrow('OS credential store');
  });

  it('rejects ciphertext tampering and never publishes plaintext output', async () => {
    const data = await fixture();
    const sealer = createRecoveryFileSealer(authenticatedBackend());
    await sealer.sealFile(data.source, data.sealed);
    const envelope = JSON.parse(await readFile(data.sealed, 'utf8')) as { ciphertext: string };
    const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
    const last = ciphertext.length - 1;
    ciphertext[last] = ciphertext[last]! ^ 1;
    envelope.ciphertext = ciphertext.toString('base64');
    await writeFile(data.sealed, JSON.stringify(envelope));

    await expect(sealer.unsealFile(data.sealed, data.restored)).rejects.toThrow();
    await expect(readFile(data.restored)).rejects.toThrow();
  });
});
