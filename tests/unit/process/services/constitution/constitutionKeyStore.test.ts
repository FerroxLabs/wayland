import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConstitutionKeyStore } from '@process/services/constitution/constitutionKeyStore';

const secretBackend = {
  encryptString: (plaintext: string): string => `fenc:v1:${Buffer.from(plaintext).toString('base64')}`,
  decryptString: (ciphertext: string): string =>
    Buffer.from(ciphertext.slice('fenc:v1:'.length), 'base64').toString('utf8'),
};

describe('ConstitutionKeyStore durable publication', () => {
  it('adopts the exact decryptable winner of a concurrent first publication without clobbering it', () => {
    const root = path.join(os.tmpdir(), `constitution-key-store-race-${randomUUID()}`);
    mkdirSync(root, { recursive: true });
    const statePath = path.join(root, '.constitution-keys.enc');
    const winnerKey = Buffer.alloc(32, 7);
    const winner = {
      schemaVersion: 1,
      journalKeyBase64: winnerKey.toString('base64'),
      activeArchiveKeyId: null,
    };
    const store = new ConstitutionKeyStore(root, secretBackend, statePath, {
      linkPublication: () => {
        writeFileSync(statePath, secretBackend.encryptString(JSON.stringify(winner)), { flag: 'wx', mode: 0o600 });
        throw Object.assign(new Error('concurrent winner'), { code: 'EEXIST' });
      },
    });

    expect(store.journalKey()).toEqual(winnerKey);
    expect(secretBackend.decryptString(readFileSync(statePath, 'utf8'))).toBe(JSON.stringify(winner));
    expect(readdirSync(root).filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });

  it('reports a post-publication durability failure and preserves restartable published state', () => {
    const root = path.join(os.tmpdir(), `constitution-key-store-sync-${randomUUID()}`);
    mkdirSync(root, { recursive: true });
    const statePath = path.join(root, '.constitution-keys.enc');
    expect(
      () =>
        new ConstitutionKeyStore(root, secretBackend, statePath, {
          syncPublication: () => {
            throw new Error('injected sync failure');
          },
        })
    ).toThrow('CONSTITUTION_FS_KEY_STATE_PUBLICATION_NOT_DURABLE');

    const restarted = new ConstitutionKeyStore(root, secretBackend, statePath);
    expect(restarted.journalKey()).toHaveLength(32);
    expect(readdirSync(root).filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });

  it('does not report an active-key update as durable when the replace sync fails', () => {
    const root = path.join(os.tmpdir(), `constitution-key-store-update-${randomUUID()}`);
    mkdirSync(root, { recursive: true });
    const statePath = path.join(root, '.constitution-keys.enc');
    new ConstitutionKeyStore(root, secretBackend, statePath);
    const updating = new ConstitutionKeyStore(root, secretBackend, statePath, {
      syncPublication: () => {
        throw new Error('injected update sync failure');
      },
    });
    const active = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    expect(() => updating.setActiveArchiveKeyId(active)).toThrow('CONSTITUTION_FS_KEY_STATE_PUBLICATION_NOT_DURABLE');
    expect(new ConstitutionKeyStore(root, secretBackend, statePath).activeArchiveKeyId()).toBe(active);
  });
});
