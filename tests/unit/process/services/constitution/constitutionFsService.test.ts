import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ConstitutionFsBinaryError,
  createTestOnlyConstitutionFsBinaryAuthority,
  verifyConstitutionFsBinary,
} from '@process/services/constitution/constitutionFsBinary';
import { ConstitutionArchiveRecoveryService } from '@process/services/constitution/constitutionArchiveRecoveryService';
import { ConstitutionArchiveRestoreOperationAuthority } from '@process/services/constitution/constitutionArchiveRestoreAuthority';
import { ConstitutionFsService } from '@process/services/constitution/constitutionFsService';
import { ConstitutionKeyStore } from '@process/services/constitution/constitutionKeyStore';
import { createConstitutionRequestFingerprint } from '@process/services/constitution/constitutionRequestFingerprint';
import type { ConstitutionArchiveSecretBackend } from '@process/services/constitution/constitutionFsTransaction';
import { finalizeHistoricalConstitutionFixture } from '../../../../fixtures/constitution-fs/provenance/finalizeHistoricalConstitutionFixture';

let cachedRealBinary: ReturnType<typeof verifyConstitutionFsBinary> | undefined;

function realBinary() {
  if (cachedRealBinary) return cachedRealBinary;
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
      protocolVersion: 2,
      platform: process.platform,
      arch: process.arch,
      binary: { fileName: 'wayland-constitution-fs', sha256, size: bytes.byteLength },
    })
  );
  cachedRealBinary = verifyConstitutionFsBinary({
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
  return cachedRealBinary;
}

const secretBackend: ConstitutionArchiveSecretBackend = {
  encryptString: (plaintext) => `fenc:v1:${Buffer.from(plaintext).toString('base64')}`,
  decryptString: (ciphertext) => Buffer.from(ciphertext.slice('fenc:v1:'.length), 'base64').toString('utf8'),
};

type HistoricalFixtureManifest = {
  producerCommit: string;
  protocolVersion: number;
  generation: {
    mode: string;
    producerClaim: string;
    generatorVersion: number;
    generatorArtifact: string;
    generatorSha256: string;
    generatorCommand: string;
    finalizerVersion: number;
    finalizerArtifact: string;
    finalizerSha256: string;
    finalizerCommand: string;
    harnessPatchArtifact: string;
    harnessPatchSha256: string;
    provenanceArtifact: string;
    provenanceSha256: string;
    producerTree: string;
    producerArchiveSha256: string;
    helperBinarySha256: string;
    helperBuildReceiptArtifact: string;
    helperBuildReceiptSha256: string;
    harnessScope: string;
    toolchain: { rustc: string; cargo: string; bun: string; node: string };
    operations: Array<Record<string, string>>;
  };
  forbiddenFiles: string[];
  files: Array<{ path: string; size: number; sha256: string }>;
};

let historicalProducerEvidenceVerified = false;

function assertHistoricalProducerEvidence(fixture: string, manifest: HistoricalFixtureManifest): void {
  if (historicalProducerEvidenceVerified) return;
  const commit = manifest.producerCommit;
  const producerTree = execFileSync('git', ['rev-parse', `${commit}^{tree}`], { encoding: 'utf8' }).trim();
  expect(producerTree).toBe(manifest.generation.producerTree);
  const archive = execFileSync('git', ['archive', '--format=tar', commit], { maxBuffer: 256 * 1024 * 1024 });
  expect(`sha256:${createHash('sha256').update(archive).digest('hex')}`).toBe(
    manifest.generation.producerArchiveSha256
  );
  const source = execFileSync('git', ['show', `${commit}:native/constitution-fs/src/main.rs`], {
    encoding: 'utf8',
  });
  const transactionRegion = `${source.split('\n').slice(4305, 4331).join('\n')}\n`;
  expect(`sha256:${createHash('sha256').update(transactionRegion).digest('hex')}`).toBe(
    'sha256:52b7a371cfd2668df1013711dc8f5b7ec3e226d26b6ffca59cb96d4182cf1e27'
  );
  const temporaryIndexRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-provenance-index-'));
  const temporaryIndex = path.join(temporaryIndexRoot, 'index');
  const gitEnvironment = { ...process.env, GIT_INDEX_FILE: temporaryIndex };
  try {
    execFileSync('git', ['read-tree', commit], { env: gitEnvironment, stdio: 'pipe' });
    execFileSync(
      'git',
      ['apply', '--check', '--cached', path.resolve(fixture, manifest.generation.harnessPatchArtifact)],
      { env: gitEnvironment, stdio: 'pipe' }
    );
  } finally {
    rmSync(temporaryIndexRoot, { recursive: true, force: true });
  }
  historicalProducerEvidenceVerified = true;
}

function assertHistoricalFixtureProvenance(fixture: string, manifest: HistoricalFixtureManifest): void {
  assertHistoricalProducerEvidence(fixture, manifest);
  expect(manifest).toMatchObject({
    producerCommit: '991c502e74506ec3702f92e429a8b31b655412ba',
    protocolVersion: 1,
    generation: {
      producerClaim:
        'source commit plus the bound main-only fixture harness patch; the transaction implementation is unmodified',
      generatorVersion: 1,
      generatorSha256: 'sha256:f810a5e61c0785e84ee99a11ec2415a99ea0d0316c171045501535190ffb1c3f',
      finalizerVersion: 1,
      finalizerSha256: 'sha256:ea861ef5f2891b6f6e494468b166177e2cf064b67560328adfd9388a31e368ef',
      harnessPatchSha256: 'sha256:6045787b16bbd549b3e9599c0d449c0e8ad31df56fda5a825424c870c953efa5',
      provenanceSha256: 'sha256:da5a0c6e6f7e55d486f4eca71b32284c3e570c1833faa5113909eeb0223710fa',
      producerTree: '1af0b2f9f6e3a12eb3234d1c7ad7a22145e32e5e',
      producerArchiveSha256: 'sha256:2e7e4a40f0517c0dadd6b4652b5075c5a02799d1d14c896fb8e5dfa6ae82890a',
      helperBinarySha256: 'sha256:3844ad1e75571750b784e66edcab986e6c86e953074564b959188ec927612cfd',
      helperBuildReceiptSha256: 'sha256:270d6192e53401ac0a6cabf1fdbcebeca3971ec0ce2dda735c59fd5683475fae',
      harnessScope:
        'main-only environment failpoint forwards into the pre-existing transaction hook; transaction logic is untouched',
      toolchain: {
        rustc: 'rustc 1.94.0 (4a4ef493e 2026-03-02) aarch64-apple-darwin',
        cargo: 'cargo 1.94.0 (85eff7c80 2026-01-15) aarch64-apple-darwin',
        bun: '1.3.11',
        node: 'v25.8.1',
      },
    },
  });
  for (const [artifact, expected] of [
    [manifest.generation.generatorArtifact, manifest.generation.generatorSha256],
    [manifest.generation.finalizerArtifact, manifest.generation.finalizerSha256],
    [manifest.generation.harnessPatchArtifact, manifest.generation.harnessPatchSha256],
    [manifest.generation.provenanceArtifact, manifest.generation.provenanceSha256],
    [manifest.generation.helperBuildReceiptArtifact, manifest.generation.helperBuildReceiptSha256],
  ] as const) {
    const bytes = readFileSync(path.resolve(fixture, artifact));
    expect(`sha256:${createHash('sha256').update(bytes).digest('hex')}`, artifact).toBe(expected);
  }
  const harnessPatch = readFileSync(path.resolve(fixture, manifest.generation.harnessPatchArtifact), 'utf8');
  expect(harnessPatch).toContain('@@ -4347,7 +4347,17 @@ fn run() -> Result<Receipt>');
  expect(harnessPatch).toContain('transaction(&request, Some(&hook))');
  expect(harnessPatch).not.toContain('fn transaction(');
  const provenance = JSON.parse(
    readFileSync(path.resolve(fixture, manifest.generation.provenanceArtifact), 'utf8')
  ) as {
    producerCommit: string;
    producerTree: string;
    producerArchiveSha256: string;
    harnessPatch: {
      sha256: string;
      transactionRegionBeforeSha256: string;
      transactionRegionAfterSha256: string;
    };
    generator: { sha256: string };
    manifestFinalizer: { sha256: string };
    helperBinary: { sha256: string };
    commands: string[];
  };
  expect(provenance).toMatchObject({
    producerCommit: manifest.producerCommit,
    producerTree: manifest.generation.producerTree,
    producerArchiveSha256: manifest.generation.producerArchiveSha256,
    harnessPatch: {
      sha256: manifest.generation.harnessPatchSha256,
      transactionRegionBeforeSha256: 'sha256:52b7a371cfd2668df1013711dc8f5b7ec3e226d26b6ffca59cb96d4182cf1e27',
      transactionRegionAfterSha256: 'sha256:52b7a371cfd2668df1013711dc8f5b7ec3e226d26b6ffca59cb96d4182cf1e27',
    },
    generator: { sha256: manifest.generation.generatorSha256 },
    manifestFinalizer: { sha256: manifest.generation.finalizerSha256 },
    helperBinary: { sha256: manifest.generation.helperBinarySha256 },
  });
  expect(provenance.commands).toHaveLength(10);
  const buildReceipt = JSON.parse(
    readFileSync(path.resolve(fixture, manifest.generation.helperBuildReceiptArtifact), 'utf8')
  ) as {
    contract: string;
    producerCommit: string;
    producerTree: string;
    harnessPatchSha256: string;
    output: { sha256: string };
    routineVerification: string;
  };
  expect(buildReceipt).toMatchObject({
    contract: 'wayland-constitution-historical-helper-build/1.0',
    producerCommit: manifest.producerCommit,
    producerTree: manifest.generation.producerTree,
    harnessPatchSha256: manifest.generation.harnessPatchSha256,
    output: { sha256: manifest.generation.helperBinarySha256 },
  });
  expect(buildReceipt.routineVerification).toContain('routine candidate verification must not rebuild it or run Cargo');
  expect(manifest.generation.generatorCommand).toBe(
    `cd /tmp/wayland-constitution-base-991c && OUT=$CANDIDATE/tests/fixtures/constitution-fs/base-991c502-${manifest.generation.mode} MODE=${manifest.generation.mode} bun run scripts/generateHistoricalConstitutionFixture.ts`
  );
  expect(manifest.generation.finalizerCommand).toBe(
    `cd $CANDIDATE && OUT=$CANDIDATE/tests/fixtures/constitution-fs/base-991c502-${manifest.generation.mode} bun run tests/fixtures/constitution-fs/provenance/finalizeHistoricalConstitutionFixture.ts`
  );

  const reproductionRoot = mkdtempSync(path.join(os.tmpdir(), 'constitution-manifest-finalizer-'));
  try {
    const rawManifest = {
      ...manifest,
      generation: {
        mode: manifest.generation.mode,
        harnessPatch:
          manifest.generation.mode === 'pending-ledger-only'
            ? 'main-only environment failpoint forwards into immutable transaction hook at after_ledger_before_journal'
            : null,
        operations: manifest.generation.operations,
      },
    };
    writeFileSync(path.join(reproductionRoot, 'fixture-manifest.json'), `${JSON.stringify(rawManifest, null, 2)}\n`);
    finalizeHistoricalConstitutionFixture(reproductionRoot);
    expect(readFileSync(path.join(reproductionRoot, 'fixture-manifest.json'), 'utf8')).toBe(
      readFileSync(path.join(fixture, 'fixture-manifest.json'), 'utf8')
    );
  } finally {
    rmSync(reproductionRoot, { recursive: true, force: true });
  }
}

describe.runIf(process.platform === 'darwin' || process.platform === 'linux')(
  'ConstitutionFsService production owner',
  () => {
    it('preserves opaque revision CAS, present-empty state, archives, specialists, and key continuity across restart', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-service-parent-'));
      const root = path.join(parent, '.wayland');
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      const binary = realBinary();
      const first = new ConstitutionFsService(root, binary, secretBackend, undefined, revisionAuthorityPath);

      expect(existsSync(root)).toBe(false);
      const absent = first.readConstitution();
      expect(absent.status).toBe('absent');
      expect(absent.revision).toMatch(/^rev:v2:/);
      expect(existsSync(root)).toBe(false);
      expect(existsSync(revisionAuthorityPath)).toBe(true);
      const requestId = '11111111-1111-4111-8111-111111111111';
      const created = first.writeConstitution('', absent.revision, requestId);
      expect(existsSync(revisionAuthorityPath)).toBe(true);
      expect(created.receiptId).toMatch(/\.jsonl$/);
      expect(first.writeConstitution('', absent.revision, requestId)).toEqual(created);
      const empty = first.readConstitution();
      expect(empty).toMatchObject({ status: 'present', content: '' });
      expect(empty.revision).not.toBe(absent.revision);

      expect(() =>
        first.writeConstitution('stale', absent.revision, '77777777-7777-4777-8777-777777777777')
      ).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' }));
      expect(first.readConstitution()).toMatchObject({ status: 'present', content: '' });

      const current = first.readConstitution();
      if (current.status !== 'present') throw new Error('expected present Constitution');
      first.writeConstitution('current', current.revision, '88888888-8888-4888-8888-888888888888');
      const persistedMainRevision = first.readConstitution().revision;
      const [archive] = first.listArchives();
      expect(archive).toMatchObject({ targetKind: 'constitution', sourceName: 'CONSTITUTION.md', bytes: 0 });

      const specialist = first.readSpecialist('copy');
      first.writeSpecialist('copy', 'overlay', specialist.revision, '99999999-9999-4999-8999-999999999999');
      const persistedSpecialistRevision = first.readSpecialist('copy').revision;
      expect(first.listSpecialists()).toEqual([{ id: 'copy', bytes: 7, revision: persistedSpecialistRevision }]);

      const restarted = new ConstitutionFsService(root, binary, secretBackend, undefined, revisionAuthorityPath);
      expect(restarted.readConstitution()).toEqual({
        status: 'present',
        content: 'current',
        revision: persistedMainRevision,
      });
      expect(restarted.readSpecialist('copy')).toEqual({
        status: 'present',
        content: 'overlay',
        revision: persistedSpecialistRevision,
      });
      expect(restarted.rotateArchiveKey()).toMatch(/^[0-9a-f-]{36}$/);

      const beforeRestore = restarted.readConstitution();
      if (beforeRestore.status !== 'present' || !archive) throw new Error('expected restorable state');
      expect(() =>
        restarted.restoreArchive(archive.archiveId, empty.revision, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
      ).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' }));
      expect(restarted.readConstitution()).toMatchObject({ status: 'present', content: 'current' });
      const prepared = restarted.prepareArchiveRestore(archive.archiveId);
      const restoreRequestId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      const restoreFingerprint = createConstitutionRequestFingerprint({
        intent: 'restore',
        target: prepared.target,
        contentSha256: prepared.contentSha256,
        expectedRevision: beforeRestore.revision,
        archiveIdentity: archive.archiveId,
      });
      const restored = restarted.restorePreparedArchive(
        prepared,
        beforeRestore.revision,
        restoreRequestId,
        restoreFingerprint
      );
      expect(restored).toMatchObject({ status: 'committed', revision: expect.stringMatching(/^rev:v2:/) });
      expect(restarted.readConstitution()).toMatchObject({ status: 'present', content: '' });
      expect(restarted.listArchives()).toEqual([
        expect.objectContaining({ targetKind: 'constitution', sourceName: 'CONSTITUTION.md', bytes: 7 }),
      ]);
      expect(
        restarted.restorePreparedArchive(prepared, beforeRestore.revision, restoreRequestId, restoreFingerprint)
      ).toEqual(restored);
    }, 60_000);

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

    it('reconciles archive restore response loss before source reads or a second password challenge', async () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-restore-response-loss-'));
      const root = path.join(parent, '.wayland');
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      const restoreAuthorityPath = path.join(parent, 'user-data', 'constitution', 'restore-operations.enc');
      const filesystem = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      const absent = filesystem.readConstitution();
      filesystem.writeConstitution('archived', absent.revision, '01010101-0101-4101-8101-010101010101');
      const archivedState = filesystem.readConstitution();
      if (archivedState.status !== 'present') throw new Error('expected archived Constitution state');
      filesystem.writeConstitution('live', archivedState.revision, '02020202-0202-4202-8202-020202020202');
      const archive = filesystem.listArchives()[0];
      if (!archive) throw new Error('expected archive');
      const prepared = filesystem.prepareArchiveRestore(archive.archiveId);
      const live = filesystem.readConstitution();
      const operationId = '03030303-0303-4303-8303-030303030303';
      const principal = {
        kind: 'desktop-installation',
        installationId: '04040404-0404-4404-8404-040404040404',
      } as const;
      const request = {
        operationId,
        archiveId: archive.archiveId,
        expectedArchiveRevision: prepared.archiveRevision,
        password: 'fresh-password',
        expectedRevision: live.revision,
      };
      let passwordChallenges = 0;
      const crashingAuthority = new ConstitutionArchiveRestoreOperationAuthority(restoreAuthorityPath, secretBackend, {
        afterNativeInvocation: () => {
          throw new Error('injected crash after native restore commit');
        },
      });
      const crashingRecovery = new ConstitutionArchiveRecoveryService(
        filesystem,
        crashingAuthority,
        async (_principal, password) => {
          expect(password).toBe('fresh-password');
          passwordChallenges += 1;
        }
      );
      await expect(crashingRecovery.restore(principal, request)).rejects.toThrow(
        'injected crash after native restore commit'
      );
      expect(passwordChallenges).toBe(1);
      expect(filesystem.readConstitution()).toMatchObject({ status: 'present', content: 'archived' });

      const restartedFilesystem = new ConstitutionFsService(
        root,
        realBinary(),
        secretBackend,
        undefined,
        revisionAuthorityPath
      );
      const restartedAuthority = new ConstitutionArchiveRestoreOperationAuthority(restoreAuthorityPath, secretBackend);
      expect(restartedAuthority.lookup(operationId, principal)).toMatchObject({ state: 'dispatched' });
      const restartedRecovery = new ConstitutionArchiveRecoveryService(
        restartedFilesystem,
        restartedAuthority,
        async () => {
          passwordChallenges += 1;
        }
      );
      const replay = await restartedRecovery.restore(principal, { ...request, password: 'must-not-be-read' });
      expect(replay).toMatchObject({ status: 'committed', transactionId: operationId });
      expect(passwordChallenges).toBe(1);
      expect(restartedAuthority.lookup(operationId, principal)).toMatchObject({ state: 'committed' });
      expect(restartedFilesystem.listArchives()).toEqual([
        expect.objectContaining({ targetKind: 'constitution', bytes: 4 }),
      ]);
    }, 60_000);

    it('replays present writes and resets only for the exact original caller facts', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-service-replay-'));
      const root = path.join(parent, '.wayland');
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      const service = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);

      const absent = service.readConstitution();
      const created = service.writeConstitution('initial', absent.revision, '22222222-2222-4222-8222-222222222222');
      expect(created.status).toBe('committed');

      const beforeUpdate = service.readConstitution();
      if (beforeUpdate.status !== 'present') throw new Error('expected present Constitution');
      const updateRequestId = '33333333-3333-4333-8333-333333333333';
      const updated = service.writeConstitution('updated', beforeUpdate.revision, updateRequestId);
      expect(service.writeConstitution('updated', beforeUpdate.revision, updateRequestId)).toEqual(updated);
      expect(() => service.writeConstitution('different', beforeUpdate.revision, updateRequestId)).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' })
      );
      const afterUpdate = service.readConstitution();
      expect(() => service.writeConstitution('updated', afterUpdate.revision, updateRequestId)).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' })
      );
      expect(afterUpdate).toMatchObject({ status: 'present', content: 'updated' });

      const restarted = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      expect(restarted.writeConstitution('updated', beforeUpdate.revision, updateRequestId)).toEqual(updated);
      expect(() => restarted.writeConstitution('different', beforeUpdate.revision, updateRequestId)).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' })
      );

      const resetRequestId = '44444444-4444-4444-8444-444444444444';
      const reset = service.writeConstitution('', afterUpdate.revision, resetRequestId);
      expect(service.writeConstitution('', afterUpdate.revision, resetRequestId)).toEqual(reset);
      expect(() => service.writeConstitution('not-empty', afterUpdate.revision, resetRequestId)).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' })
      );
      expect(service.readConstitution()).toMatchObject({ status: 'present', content: '' });
    }, 30_000);

    it('remaps a retained pre-rotation revision and preserves rotation continuity across restart', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-service-rotation-'));
      const root = path.join(parent, '.wayland');
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      const service = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      const absent = service.readConstitution();
      service.writeConstitution('before', absent.revision, '12121212-1212-4212-8212-121212121212');
      const beforeRotation = service.readConstitution();
      const rotation = service.rotateRevisionAuthority();
      const afterRotation = service.readConstitution();
      expect(afterRotation.revision).not.toBe(beforeRotation.revision);
      expect(rotation.nextKeyId).not.toBe(rotation.previousKeyId);

      const updated = service.writeConstitution(
        'after',
        beforeRotation.revision,
        '13131313-1313-4313-8313-131313131313'
      );
      const restarted = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      expect(restarted.readConstitution()).toEqual({ status: 'present', content: 'after', revision: updated.revision });
    }, 30_000);

    it('resumes the exact user mutation after a crash between legacy migration and replacement', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-service-legacy-resume-'));
      const root = path.join(parent, '.wayland');
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      mkdirSync(root, { recursive: true });
      writeFileSync(path.join(root, 'SOUL.md'), '# legacy');
      const crashing = new ConstitutionFsService(
        root,
        realBinary(),
        secretBackend,
        undefined,
        revisionAuthorityPath,
        () => {
          throw new Error('injected crash after migration commit');
        }
      );
      const legacy = crashing.readConstitution();
      const requestId = '14141414-1414-4414-8414-141414141414';
      expect(() => crashing.writeConstitution('# requested', legacy.revision, requestId)).toThrow(
        'injected crash after migration commit'
      );

      const restarted = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      expect(restarted.readTarget({ kind: 'constitution', sourceName: 'CONSTITUTION.md' })).toMatchObject({
        status: 'present',
        content: '# legacy',
      });
      const resumed = restarted.writeConstitution('# requested', legacy.revision, requestId);
      expect(restarted.readConstitution()).toMatchObject({ status: 'present', content: '# requested' });
      expect(restarted.writeConstitution('# requested', legacy.revision, requestId)).toEqual(resumed);
    }, 30_000);

    it('boots with an honest unavailable capability when packaged authority rejects the platform', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-service-unsupported-'));
      const root = path.join(parent, '.wayland');
      const service = ConstitutionFsService.createProduction('ignored-resources', {
        root,
        secretBackend,
        verifyPackagedBinary: () => {
          throw new ConstitutionFsBinaryError(
            'CONSTITUTION_FS_UNSAFE_PLATFORM',
            'No packaged Constitution filesystem authority exists for win32-x64.'
          );
        },
      });

      expect(existsSync(root)).toBe(false);
      expect(() => service.readConstitution()).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_UNSAFE_PLATFORM' })
      );
      expect(() => service.listSpecialists()).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_UNSAFE_PLATFORM' })
      );
      expect(() =>
        service.writeConstitution('must not persist', 'rev:v1:unavailable', '55555555-5555-4555-8555-555555555555')
      ).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_UNSAFE_PLATFORM' }));
      expect(existsSync(root)).toBe(false);
    });

    it('keeps the supported packaged-authority path fully operational', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-service-supported-'));
      const root = path.join(parent, '.wayland');
      const service = ConstitutionFsService.createProduction('test-resources', {
        root,
        revisionAuthorityPath: path.join(parent, 'userData', 'constitution', 'revision-authority.enc'),
        secretBackend,
        verifyPackagedBinary: () => realBinary(),
      });

      const absent = service.readConstitution();
      expect(absent.status).toBe('absent');
      expect(existsSync(root)).toBe(false);
      expect(
        service.writeConstitution('supported', absent.revision, '66666666-6666-4666-8666-666666666666')
      ).toMatchObject({ status: 'committed', revision: expect.stringMatching(/^rev:v2:/) });
      expect(service.readConstitution()).toMatchObject({ status: 'present', content: 'supported' });
    }, 30_000);

    it('accepts a symlinked root by pinning its real directory (regression: ~/.wayland symlink boot crash)', () => {
      // Reproduces the real bootstrap crash: ~/.wayland is commonly a symlink
      // into platform app-data. The identity pin uses lstat and rejects
      // symlinks, which pre-fix threw CONSTITUTION_FS_UNSAFE_ROOT from the
      // constructor and crashed app startup. The root must be canonicalized so
      // the pin binds the real directory and the app boots.
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-symlink-root-'));
      const realRoot = path.join(parent, 'app-support', 'wayland');
      mkdirSync(realRoot, { recursive: true, mode: 0o700 });
      const symlinkRoot = path.join(parent, '.wayland');
      symlinkSync(realRoot, symlinkRoot);

      const service = ConstitutionFsService.createProduction('test-resources', {
        root: symlinkRoot,
        revisionAuthorityPath: path.join(parent, 'userData', 'constitution', 'revision-authority.enc'),
        secretBackend,
        verifyPackagedBinary: () => realBinary(),
      });

      const absent = service.readConstitution();
      expect(absent.status).toBe('absent');
      const committed = service.writeConstitution(
        'via symlink',
        absent.revision,
        '77777777-7777-4777-8777-777777777777'
      );
      expect(committed).toMatchObject({ status: 'committed' });
      expect(service.readConstitution()).toMatchObject({ status: 'present', content: 'via symlink' });
    }, 30_000);

    it('quarantines existing Constitution state when the external revision authority is lost', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-revision-loss-'));
      const root = path.join(parent, '.wayland');
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      const service = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      const absent = service.readConstitution();
      service.writeConstitution('# authenticated state', absent.revision, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      rmSync(revisionAuthorityPath);
      expect(() => service.readConstitution()).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE' })
      );
      expect(() =>
        service.writeConstitution('# must not commit', absent.revision, 'abababab-abab-4bab-8bab-abababababab')
      ).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE' }));
      const restarted = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);

      expect(() => restarted.readConstitution()).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE' })
      );
    }, 30_000);

    it('migrates pre-binding authenticated state and completes an interrupted authority publication on restart', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-legacy-authority-migration-'));
      const root = path.join(parent, '.wayland');
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      const markerPath = `${revisionAuthorityPath}.legacy-v1-migration.json`;
      const seeded = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      const absent = seeded.readConstitution();
      seeded.writeConstitution(
        '# authenticated pre-binding state',
        absent.revision,
        'acacacac-acac-4cac-8cac-acacacacacac'
      );

      // Deployed state before the external revision-authority contract had the
      // encrypted key store, sealed archive key, ledger, and journals but no
      // authority envelope or binding marker.
      rmSync(revisionAuthorityPath);
      rmSync(markerPath);
      const interrupted = new ConstitutionFsService(
        root,
        realBinary(),
        secretBackend,
        undefined,
        revisionAuthorityPath,
        undefined,
        () => {
          throw new Error('injected crash after revision authority publication');
        }
      );
      expect(() => interrupted.readConstitution()).toThrow('injected crash after revision authority publication');
      expect(existsSync(revisionAuthorityPath)).toBe(true);
      expect(JSON.parse(readFileSync(markerPath, 'utf8'))).toMatchObject({
        schemaVersion: 1,
        state: 'intent',
        authorityKeyId: null,
      });

      const restarted = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      expect(restarted.readConstitution()).toMatchObject({
        status: 'present',
        content: '# authenticated pre-binding state',
        revision: expect.stringMatching(/^rev:v2:/),
      });
      const complete = JSON.parse(readFileSync(markerPath, 'utf8')) as {
        state: string;
        authorityKeyId: string;
      };
      expect(complete).toMatchObject({ state: 'complete', authorityKeyId: expect.stringMatching(/^[0-9a-f-]{36}$/) });

      const marker = JSON.parse(readFileSync(markerPath, 'utf8')) as Record<string, unknown>;
      marker.authorityKeyId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
      writeFileSync(markerPath, JSON.stringify(marker));
      const mismatched = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      expect(() => mismatched.readConstitution()).toThrowError(
        expect.objectContaining({ code: 'CONSTITUTION_FS_REVISION_AUTHORITY_MISSING_WITH_STATE' })
      );
    }, 30_000);

    it('authenticates and upgrades the immutable 991c502 pre-v2 producer corpus without rewriting it', () => {
      const fixture = path.join(process.cwd(), 'tests', 'fixtures', 'constitution-fs', 'base-991c502-committed');
      const manifest = JSON.parse(
        readFileSync(path.join(fixture, 'fixture-manifest.json'), 'utf8')
      ) as HistoricalFixtureManifest;
      assertHistoricalFixtureProvenance(fixture, manifest);
      expect(manifest.generation.mode).toBe('committed');
      for (const entry of manifest.files) {
        const bytes = readFileSync(path.join(fixture, entry.path));
        expect(bytes.byteLength, entry.path).toBe(entry.size);
        expect(`sha256:${createHash('sha256').update(bytes).digest('hex')}`, entry.path).toBe(entry.sha256);
      }
      for (const forbidden of manifest.forbiddenFiles) {
        expect(existsSync(path.join(fixture, forbidden)), forbidden).toBe(false);
      }

      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-exact-991c-upgrade-'));
      const root = path.join(parent, '.wayland');
      cpSync(fixture, root, { recursive: true });
      rmSync(path.join(root, 'fixture-manifest.json'));
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      const upgraded = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      const firstRead = upgraded.readConstitution();
      expect(firstRead).toMatchObject({
        status: 'present',
        content: '# Historical Constitution v2\n',
        revision: expect.stringMatching(/^rev:v2:/),
      });
      expect(upgraded.readSpecialist('research')).toMatchObject({
        status: 'present',
        content: '# Historical research overlay\n',
        revision: expect.stringMatching(/^rev:v2:/),
      });
      expect(existsSync(revisionAuthorityPath)).toBe(true);
      expect(existsSync(`${revisionAuthorityPath}.legacy-v1-migration.json`)).toBe(true);

      const restarted = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      expect(restarted.readConstitution()).toEqual(firstRead);
      expect(() =>
        restarted.writeConstitution(
          '# Historical Constitution v2\n',
          firstRead.revision,
          '33333333-3333-4333-8333-333333333333'
        )
      ).toThrowError(expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' }));
      expect(restarted.readConstitution()).toEqual(firstRead);

      const requestId = '44444444-4444-4444-8444-444444444444';
      const promoted = restarted.writeConstitution('# Current Constitution\n', firstRead.revision, requestId);
      expect(restarted.writeConstitution('# Current Constitution\n', firstRead.revision, requestId)).toEqual(promoted);
      expect(restarted.readConstitution()).toMatchObject({
        status: 'present',
        content: '# Current Constitution\n',
        revision: promoted.revision,
      });
    }, 30_000);

    it('reconstructs and rolls back an immutable 991c502 ledger-only crash before issuing v2 revisions', () => {
      const fixture = path.join(
        process.cwd(),
        'tests',
        'fixtures',
        'constitution-fs',
        'base-991c502-pending-ledger-only'
      );
      const manifest = JSON.parse(
        readFileSync(path.join(fixture, 'fixture-manifest.json'), 'utf8')
      ) as HistoricalFixtureManifest;
      assertHistoricalFixtureProvenance(fixture, manifest);
      expect(manifest).toMatchObject({
        generation: {
          mode: 'pending-ledger-only',
        },
      });
      for (const entry of manifest.files) {
        const bytes = readFileSync(path.join(fixture, entry.path));
        expect(bytes.byteLength, entry.path).toBe(entry.size);
        expect(`sha256:${createHash('sha256').update(bytes).digest('hex')}`, entry.path).toBe(entry.sha256);
      }
      for (const forbidden of manifest.forbiddenFiles) {
        expect(existsSync(path.join(fixture, forbidden)), forbidden).toBe(false);
      }
      const pendingId = '55555555-5555-4555-8555-555555555555';
      expect(
        existsSync(path.join(fixture, 'archives', 'constitution-history', 'transactions', `${pendingId}.jsonl`))
      ).toBe(false);
      expect(readFileSync(path.join(fixture, 'CONSTITUTION.md'), 'utf8')).toBe('# Historical Constitution v2\n');

      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-exact-991c-pending-upgrade-'));
      const root = path.join(parent, '.wayland');
      cpSync(fixture, root, { recursive: true });
      rmSync(path.join(root, 'fixture-manifest.json'));
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      const upgraded = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      const read = upgraded.readConstitution();
      expect(read).toMatchObject({
        status: 'present',
        content: '# Historical Constitution v2\n',
        revision: expect.stringMatching(/^rev:v2:/),
      });
      const reconciledJournal = readFileSync(
        path.join(root, 'archives', 'constitution-history', 'transactions', `${pendingId}.jsonl`),
        'utf8'
      );
      expect(reconciledJournal).toContain('"state":"rolled_back"');
      expect(reconciledJournal.trimEnd().endsWith('"state":"committed"}')).toBe(true);
      expect(readFileSync(path.join(root, 'CONSTITUTION.md'), 'utf8')).toBe('# Historical Constitution v2\n');

      const restarted = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      expect(restarted.readConstitution()).toEqual(read);
    }, 30_000);

    it('resumes bootstrap when the journal key was published before the first sealed archive key', () => {
      const parent = mkdtempSync(path.join(os.tmpdir(), 'constitution-bootstrap-resume-'));
      const root = path.join(parent, '.wayland');
      const revisionAuthorityPath = path.join(parent, 'user-data', 'constitution', 'revision-authority.enc');
      const service = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      expect(service.readConstitution().status).toBe('absent');
      mkdirSync(root, { recursive: true });
      const keyStore = new ConstitutionKeyStore(root, secretBackend);
      expect(keyStore.activeArchiveKeyId()).toBeNull();

      const restarted = new ConstitutionFsService(root, realBinary(), secretBackend, undefined, revisionAuthorityPath);
      expect(restarted.readConstitution()).toMatchObject({
        status: 'absent',
        revision: expect.stringMatching(/^rev:v2:/),
      });
      const persisted = new ConstitutionKeyStore(root, secretBackend);
      expect(persisted.activeArchiveKeyId()).toMatch(/^[0-9a-f-]{36}$/);
      expect(existsSync(`${revisionAuthorityPath}.legacy-v1-migration.json`)).toBe(true);
    }, 30_000);
  }
);
