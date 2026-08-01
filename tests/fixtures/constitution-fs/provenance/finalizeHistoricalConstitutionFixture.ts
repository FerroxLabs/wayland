import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

type FixtureManifest = {
  schemaVersion: number;
  producerCommit: string;
  protocolVersion: number;
  backendIdentity: string;
  generation: {
    mode: string;
    harnessPatch?: string | null;
    operations: Array<Record<string, string>>;
  };
  forbiddenFiles: string[];
  files: Array<{ path: string; size: number; sha256: string }>;
};

type Reproduction = {
  producerCommit: string;
  producerTree: string;
  producerArchiveSha256: string;
  harnessPatch: { sha256: string };
  generator: { sha256: string };
  manifestFinalizer: { sha256: string };
  toolchain: { rustc: string; cargo: string; bun: string; node: string };
  helperBinary: { sha256: string };
};

const sha256 = (bytes: Buffer | string): string => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

const provenanceRoot = path.dirname(fileURLToPath(import.meta.url));
const finalizerPath = fileURLToPath(import.meta.url);
const generatorPath = path.join(provenanceRoot, 'generateHistoricalConstitutionFixture.ts');
const harnessPatchPath = path.join(provenanceRoot, '991c502-fixture-failpoint.patch');
const reproductionPath = path.join(provenanceRoot, 'reproduction.json');
const helperBuildReceiptPath = path.join(provenanceRoot, 'helper-build-receipt.json');

export function finalizeHistoricalConstitutionFixture(output: string): void {
  const manifestPath = path.join(output, 'fixture-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as FixtureManifest;
  const reproduction = JSON.parse(readFileSync(reproductionPath, 'utf8')) as Reproduction;
  const helperBuildReceipt = JSON.parse(readFileSync(helperBuildReceiptPath, 'utf8')) as {
    output: { sha256: string };
  };

  const expectedArtifacts = [
    [generatorPath, reproduction.generator.sha256],
    [harnessPatchPath, reproduction.harnessPatch.sha256],
    [finalizerPath, reproduction.manifestFinalizer.sha256],
  ] as const;
  for (const [artifact, expected] of expectedArtifacts) {
    const actual = sha256(readFileSync(artifact));
    if (actual !== expected) throw new Error(`provenance digest mismatch for ${path.basename(artifact)}`);
  }
  if (manifest.producerCommit !== reproduction.producerCommit) {
    throw new Error('fixture producer commit does not match reproduction authority');
  }
  if (!['committed', 'pending-ledger-only'].includes(manifest.generation.mode)) {
    throw new Error(`unsupported historical fixture mode: ${manifest.generation.mode}`);
  }

  const mode = manifest.generation.mode;
  const outputRelative = `tests/fixtures/constitution-fs/base-991c502-${mode}`;
  const enriched = {
    ...manifest,
    generation: {
      mode,
      producerClaim:
        'source commit plus the bound main-only fixture harness patch; the transaction implementation is unmodified',
      generatorVersion: 1,
      generatorArtifact: '../provenance/generateHistoricalConstitutionFixture.ts',
      generatorSha256: reproduction.generator.sha256,
      generatorCommand: `cd /tmp/wayland-constitution-base-991c && OUT=$CANDIDATE/${outputRelative} MODE=${mode} bun run scripts/generateHistoricalConstitutionFixture.ts`,
      finalizerVersion: 1,
      finalizerArtifact: '../provenance/finalizeHistoricalConstitutionFixture.ts',
      finalizerSha256: reproduction.manifestFinalizer.sha256,
      finalizerCommand: `cd $CANDIDATE && OUT=$CANDIDATE/${outputRelative} bun run tests/fixtures/constitution-fs/provenance/finalizeHistoricalConstitutionFixture.ts`,
      harnessPatchArtifact: '../provenance/991c502-fixture-failpoint.patch',
      harnessPatchSha256: reproduction.harnessPatch.sha256,
      provenanceArtifact: '../provenance/reproduction.json',
      provenanceSha256: sha256(readFileSync(reproductionPath)),
      producerTree: reproduction.producerTree,
      producerArchiveSha256: reproduction.producerArchiveSha256,
      helperBinarySha256: reproduction.helperBinary.sha256,
      helperBuildReceiptArtifact: '../provenance/helper-build-receipt.json',
      helperBuildReceiptSha256: sha256(readFileSync(helperBuildReceiptPath)),
      harnessScope:
        'main-only environment failpoint forwards into the pre-existing transaction hook; transaction logic is untouched',
      toolchain: reproduction.toolchain,
      operations: manifest.generation.operations,
    },
  };
  if (helperBuildReceipt.output.sha256 !== enriched.generation.helperBinarySha256) {
    throw new Error('helper build receipt output does not match reproduction authority');
  }
  writeFileSync(manifestPath, `${JSON.stringify(enriched, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === finalizerPath) {
  const output = process.env.OUT;
  if (!output) throw new Error('OUT is required');
  finalizeHistoricalConstitutionFixture(path.resolve(output));
}
