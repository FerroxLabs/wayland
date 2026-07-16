import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createTestOnlyConstitutionFsBinaryAuthority,
  verifyConstitutionFsBinary,
} from '@process/services/constitution/constitutionFsBinary';
import { ConstitutionFsService } from '@process/services/constitution/constitutionFsService';
import { ConstitutionKeyStore } from '@process/services/constitution/constitutionKeyStore';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';

function realBinary() {
  const manifest = path.join(process.cwd(), 'native', 'constitution-fs', 'Cargo.toml');
  execFileSync('cargo', ['build', '--locked', '--manifest-path', manifest], { stdio: 'pipe' });
  const built = path.join(process.cwd(), 'native', 'constitution-fs', 'target', 'debug', 'wayland-constitution-fs');
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-service-binary-'));
  const binaryPath = path.join(installRoot, 'wayland-constitution-fs');
  const manifestPath = path.join(installRoot, 'manifest.json');
  copyFileSync(built, binaryPath);
  chmodSync(binaryPath, 0o700);
  const bytes = readFileSync(binaryPath);
  const sha256 = `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
  writeFileSync(
    manifestPath,
    JSON.stringify({
      schemaVersion: 1,
      protocolVersion: 1,
      platform: process.platform,
      arch: process.arch,
      binary: { fileName: 'wayland-constitution-fs', sha256, size: bytes.byteLength },
    })
  );
  return verifyConstitutionFsBinary({
    binaryPath,
    manifestPath,
    authority: createTestOnlyConstitutionFsBinaryAuthority({
      sha256,
      size: bytes.byteLength,
      platform: process.platform,
      arch: process.arch,
      fileName: 'wayland-constitution-fs',
      installRoot,
      packaged: false,
    }),
  });
}

const secretBackend: ConstitutionArchiveSecretBackend = {
  encryptString: (plaintext) => `fenc:v1:${Buffer.from(plaintext).toString('base64')}`,
  decryptString: (ciphertext) => Buffer.from(ciphertext.slice('fenc:v1:'.length), 'base64').toString('utf8'),
};

describe.runIf(process.platform === 'darwin' || process.platform === 'linux')(
  'ConstitutionFsService production owner',
  () => {
    it('preserves opaque revision CAS, present-empty state, archives, specialists, and key continuity across restart', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-service-parent-'));
      const root = path.join(parent, '.wayland');
      const binary = realBinary();
      const first = new ConstitutionFsService(root, binary, secretBackend);

      expect(existsSync(root)).toBe(false);
      const absent = first.readConstitution();
      expect(absent.status).toBe('absent');
      expect(absent.revision).toMatch(/^rev:v1:/);
      expect(existsSync(root)).toBe(false);
      const requestId = '11111111-1111-4111-8111-111111111111';
      const created = first.writeConstitution('', absent.revision, requestId);
      expect(created.receiptId).toMatch(/\.jsonl$/);
      expect(first.writeConstitution('', absent.revision, requestId)).toEqual(created);
      const empty = first.readConstitution();
      expect(empty).toMatchObject({ status: 'present', content: '' });
      expect(empty.revision).not.toBe(absent.revision);

      expect(() => first.writeConstitution('stale', absent.revision)).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' })
      );
      expect(first.readConstitution()).toMatchObject({ status: 'present', content: '' });

      const current = first.readConstitution();
      if (current.status !== 'present') throw new Error('expected present Constitution');
      first.writeConstitution('current', current.revision);
      const [archive] = first.listArchives();
      expect(archive).toMatchObject({ targetKind: 'constitution', sourceName: 'CONSTITUTION.md', bytes: 0 });

      const specialist = first.readSpecialist('copy');
      first.writeSpecialist('copy', 'overlay', specialist.revision);
      expect(first.listSpecialists()).toEqual([{ id: 'copy', bytes: 7, revision: expect.stringMatching(/^rev:v1:/) }]);

      const restarted = new ConstitutionFsService(root, binary, secretBackend);
      expect(restarted.readConstitution()).toMatchObject({ status: 'present', content: 'current' });
      expect(restarted.readSpecialist('copy')).toMatchObject({ status: 'present', content: 'overlay' });
      expect(restarted.rotateArchiveKey()).toMatch(/^[0-9a-f-]{36}$/);

      const beforeRestore = restarted.readConstitution();
      if (beforeRestore.status !== 'present' || !archive) throw new Error('expected restorable state');
      expect(() => restarted.restoreArchive(archive.archiveId, empty.revision)).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' })
      );
      expect(restarted.readConstitution()).toMatchObject({ status: 'present', content: 'current' });
      const restored = restarted.restoreArchive(archive.archiveId, beforeRestore.revision);
      expect(restored).toMatchObject({ status: 'committed', revision: expect.stringMatching(/^rev:v1:/) });
      expect(restarted.readConstitution()).toMatchObject({ status: 'present', content: '' });
      expect(restarted.listArchives()).toEqual([
        expect.objectContaining({ targetKind: 'constitution', sourceName: 'CONSTITUTION.md', bytes: 7 }),
      ]);
    }, 30_000);

    it('fails closed when durable key state is malformed or missing beside transaction history', () => {
      const historyRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-key-history-'));
      mkdirSync(path.join(historyRoot, 'archives', 'constitution-history'), { recursive: true });
      writeFileSync(path.join(historyRoot, 'archives', 'constitution-history', 'receipt.jsonl'), 'history');
      expect(() => new ConstitutionKeyStore(historyRoot, secretBackend)).toThrow(
        'CONSTITUTION_FS_KEY_STATE_MISSING_WITH_HISTORY'
      );

      const corruptRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-key-corrupt-'));
      writeFileSync(
        path.join(corruptRoot, '.constitution-keys.enc'),
        secretBackend.encryptString('{"schemaVersion":1}')
      );
      expect(() => new ConstitutionKeyStore(corruptRoot, secretBackend)).toThrow('CONSTITUTION_FS_KEY_STATE_INVALID');
    });
  }
);
