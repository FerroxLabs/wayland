import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createTestOnlyConstitutionFsBinaryAuthority,
  verifyConstitutionFsBinary,
} from '../src/process/services/constitution/constitutionFsBinary';
import { ConstitutionFsService } from '../src/process/services/constitution/constitutionFsService';

const producerCommit = '991c502e74506ec3702f92e429a8b31b655412ba';
const output = process.env.OUT;
const mode = process.env.MODE ?? 'committed';
if (!output) throw new Error('OUT is required');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

const manifestPath = path.join(process.cwd(), 'native', 'constitution-fs', 'Cargo.toml');
execFileSync('cargo', ['build', '--locked', '--manifest-path', manifestPath], { stdio: 'inherit' });
const built = path.join(process.cwd(), 'native', 'constitution-fs', 'target', 'debug', 'wayland-constitution-fs');
const installRoot = path.join(os.tmpdir(), `constitution-fixture-binary-${process.pid}`);
mkdirSync(installRoot, { recursive: true });
const binaryPath = path.join(installRoot, 'wayland-constitution-fs');
const authorityManifestPath = path.join(installRoot, 'manifest.json');
copyFileSync(built, binaryPath);
chmodSync(binaryPath, 0o700);
const binaryBytes = readFileSync(binaryPath);
const binarySha256 = `sha256:${createHash('sha256').update(binaryBytes).digest('hex')}` as const;
writeFileSync(
  authorityManifestPath,
  JSON.stringify({
    schemaVersion: 1,
    protocolVersion: 1,
    platform: process.platform,
    arch: process.arch,
    binary: { fileName: 'wayland-constitution-fs', sha256: binarySha256, size: binaryBytes.byteLength },
  })
);
const binary = verifyConstitutionFsBinary({
  binaryPath,
  manifestPath: authorityManifestPath,
  authority: createTestOnlyConstitutionFsBinaryAuthority({
    sha256: binarySha256,
    size: binaryBytes.byteLength,
    platform: process.platform,
    arch: process.arch,
    fileName: 'wayland-constitution-fs',
    installRoot,
    packaged: false,
  }),
});
const secretBackend = {
  encryptString: (plaintext: string): string => `fenc:v1:${Buffer.from(plaintext).toString('base64')}`,
  decryptString: (ciphertext: string): string =>
    Buffer.from(ciphertext.slice('fenc:v1:'.length), 'base64').toString('utf8'),
};
const service = new ConstitutionFsService(output, binary, secretBackend);
const absent = service.readConstitution();
service.writeConstitution('# Historical Constitution\n', absent.revision, '11111111-1111-4111-8111-111111111111');
const specialist = service.readSpecialist('research');
service.writeSpecialist(
  'research',
  '# Historical research overlay\n',
  specialist.revision,
  '22222222-2222-4222-8222-222222222222'
);
const current = service.readConstitution();
if (current.status !== 'present') throw new Error('expected committed Constitution');
service.writeConstitution(
  '# Historical Constitution v2\n',
  current.revision,
  '33333333-3333-4333-8333-333333333333'
);
if (mode === 'pending-ledger-only') {
  const beforePending = service.readConstitution();
  if (beforePending.status !== 'present') throw new Error('expected pending fixture source');
  process.env.WAYLAND_CONSTITUTION_FS_FIXTURE_FAILPOINT = 'after_ledger_before_journal';
  try {
    service.writeConstitution(
      '# Must be rolled back during upgrade\n',
      beforePending.revision,
      '55555555-5555-4555-8555-555555555555'
    );
    throw new Error('expected exact-producer fixture failpoint');
  } catch (error) {
    if ((error as { code?: string }).code !== 'INJECTED_FIXTURE_CRASH') throw error;
  } finally {
    delete process.env.WAYLAND_CONSTITUTION_FS_FIXTURE_FAILPOINT;
  }
}

const files: Array<{ path: string; size: number; sha256: string }> = [];
const visit = (directory: string): void => {
  for (const name of readdirSync(directory).toSorted()) {
    const candidate = path.join(directory, name);
    const stat = statSync(candidate);
    if (stat.isDirectory()) visit(candidate);
    else if (stat.isFile()) {
      const bytes = readFileSync(candidate);
      files.push({
        path: path.relative(output, candidate).split(path.sep).join('/'),
        size: bytes.byteLength,
        sha256: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
      });
    } else throw new Error(`unsupported fixture entry: ${candidate}`);
  }
};
visit(output);
writeFileSync(
  path.join(output, 'fixture-manifest.json'),
  JSON.stringify(
    {
      schemaVersion: 1,
      producerCommit,
      protocolVersion: 1,
      backendIdentity: 'deterministic-fenc-v1-base64-test-backend',
      generation: {
        mode,
        harnessPatch:
          mode === 'pending-ledger-only'
            ? 'main-only environment failpoint forwards into immutable transaction hook at after_ledger_before_journal'
            : null,
        operations: [
          { operation: 'replace', target: 'CONSTITUTION.md', requestId: '11111111-1111-4111-8111-111111111111' },
          { operation: 'replace', target: 'specialists/research.md', requestId: '22222222-2222-4222-8222-222222222222' },
          { operation: 'replace', target: 'CONSTITUTION.md', requestId: '33333333-3333-4333-8333-333333333333' },
          ...(mode === 'pending-ledger-only'
            ? [{ operation: 'replace-crash-after-ledger-before-journal', target: 'CONSTITUTION.md', requestId: '55555555-5555-4555-8555-555555555555' }]
            : []),
        ],
      },
      forbiddenFiles: ['revision-authority.enc', 'revision-authority.enc.legacy-v1-migration.json'],
      files,
    },
    null,
    2
  )
);
