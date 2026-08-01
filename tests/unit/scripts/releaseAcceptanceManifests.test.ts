import { readFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { verifyReleaseClaimsManifest, verifyReleaseEvidenceManifest } =
  require('../../../scripts/release-acceptance/verifyReleaseAcceptanceManifests') as {
    verifyReleaseEvidenceManifest: (input: unknown, context: unknown, options?: unknown) => Record<string, any>;
    verifyReleaseClaimsManifest: (input: unknown, context: unknown, options?: unknown) => Record<string, any>;
  };

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const TRUST_COMMIT = 'c'.repeat(40);
const CANDIDATE = { commit: COMMIT, tree: TREE };
const temporaryDirectories: string[] = [];

function manifestFile(value: unknown) {
  const directory = mkdtempSync(join(tmpdir(), 'wayland-release-acceptance-'));
  temporaryDirectories.push(directory);
  const file = join(directory, 'manifest.json');
  writeFileSync(file, JSON.stringify(value));
  return file;
}

function manifestFileWithEvidence(factory: (evidence: { evidencePath: string; evidenceSha256: string }) => unknown) {
  const directory = mkdtempSync(join(tmpdir(), 'wayland-release-acceptance-'));
  temporaryDirectories.push(directory);
  const evidencePath = 'evidence/proof.json';
  const absoluteEvidencePath = join(directory, evidencePath);
  mkdirSync(join(directory, 'evidence'), { recursive: true });
  writeFileSync(absoluteEvidencePath, JSON.stringify({ passed: true, proof: 'real-bytes' }));
  const evidenceSha256 = `sha256:${createHash('sha256').update(readFileSync(absoluteEvidencePath)).digest('hex')}`;
  const file = join(directory, 'manifest.json');
  writeFileSync(file, JSON.stringify(factory({ evidencePath, evidenceSha256 })));
  return { file, absoluteEvidencePath };
}

function attestationFor(file: string) {
  const digest = createHash('sha256').update(readFileSync(file)).digest('hex');
  return JSON.stringify([
    {
      verificationResult: {
        statement: {
          predicateType: 'https://slsa.dev/provenance/v1',
          subject: [{ digest: { sha256: digest } }],
        },
      },
    },
  ]);
}

afterEach(() => {
  while (temporaryDirectories.length) rmSync(temporaryDirectories.pop()!, { recursive: true, force: true });
});

describe('release acceptance manifest authority', () => {
  it('binds an exact evidence manifest to hosted GitHub provenance and candidate source', () => {
    const { file } = manifestFileWithEvidence((evidence) => ({
      contract: 'wayland-release-evidence-manifest/1.0',
      candidate: CANDIDATE,
      evidence: [{ kind: 'invariant', id: 'INV-01', ...evidence }],
    }));

    const receipt = verifyReleaseEvidenceManifest(
      { manifestPath: file },
      { candidate: CANDIDATE, expectedByKind: { invariant: ['INV-01'] } },
      {
        trustRootCommit: TRUST_COMMIT,
        execFileSyncImpl: (command: string, args: string[]) => {
          expect(command).toBe('gh');
          expect(args).toContain('--deny-self-hosted-runners');
          expect(args).toContain('--source-digest');
          expect(args[args.indexOf('--source-digest') + 1]).toBe(TRUST_COMMIT);
          expect(args[args.indexOf('--signer-digest') + 1]).toBe(TRUST_COMMIT);
          expect(args[args.indexOf('--source-ref') + 1]).toBe('refs/heads/release-trust-v1');
          expect(args[args.indexOf('--signer-workflow') + 1]).toBe(
            'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml'
          );
          return attestationFor(file);
        },
      }
    );

    expect(receipt).toMatchObject({
      contract: 'wayland-release-evidence-attestation/1.0',
      candidate: CANDIDATE,
      authority: 'github-attested-release-evidence',
    });
  });

  it('rejects an unattested or foreign evidence manifest', () => {
    const { file } = manifestFileWithEvidence((evidence) => ({
      contract: 'wayland-release-evidence-manifest/1.0',
      candidate: CANDIDATE,
      evidence: [{ kind: 'invariant', id: 'INV-01', ...evidence }],
    }));
    expect(() =>
      verifyReleaseEvidenceManifest(
        { manifestPath: file },
        { candidate: CANDIDATE, expectedByKind: { invariant: ['INV-01'] } },
        { trustRootCommit: TRUST_COMMIT, execFileSyncImpl: () => JSON.stringify([]) }
      )
    ).toThrow(/unattested/);

    expect(() =>
      verifyReleaseEvidenceManifest(
        { manifestPath: file },
        { candidate: CANDIDATE, expectedByKind: { invariant: ['INV-01'] } },
        {
          trustRootCommit: TRUST_COMMIT,
          execFileSyncImpl: () =>
            JSON.stringify([
              {
                verificationResult: {
                  statement: {
                    predicateType: 'https://slsa.dev/provenance/v1',
                    subject: [{ digest: { sha256: '0'.repeat(64) } }],
                  },
                },
              },
            ]),
        }
      )
    ).toThrow(/unattested/);

    expect(() =>
      verifyReleaseEvidenceManifest(
        { manifestPath: file },
        { candidate: { commit: 'd'.repeat(40), tree: TREE }, expectedByKind: { invariant: ['INV-01'] } },
        { trustRootCommit: TRUST_COMMIT, execFileSyncImpl: () => attestationFor(file) }
      )
    ).toThrow(/stale or foreign/);
  });

  it('requires exact, non-duplicated claims coverage', () => {
    const { file } = manifestFileWithEvidence((evidence) => ({
      contract: 'wayland-release-claims-manifest/1.0',
      candidate: CANDIDATE,
      capabilities: [
        { id: 'voice', claimed: false, ...evidence },
        { id: 'voice', claimed: false, ...evidence },
      ],
    }));
    expect(() =>
      verifyReleaseClaimsManifest(
        { manifestPath: file },
        { candidate: CANDIDATE, capabilityIds: ['voice', 'mcp'] },
        { trustRootCommit: TRUST_COMMIT, execFileSyncImpl: () => attestationFor(file) }
      )
    ).toThrow(/unknown or duplicated/);
  });

  it('rejects missing, mutated, symlinked, and escaping underlying evidence bytes', () => {
    const { file, absoluteEvidencePath } = manifestFileWithEvidence((evidence) => ({
      contract: 'wayland-release-evidence-manifest/1.0',
      candidate: CANDIDATE,
      evidence: [{ kind: 'invariant', id: 'INV-01', ...evidence }],
    }));
    writeFileSync(absoluteEvidencePath, 'mutated');
    expect(() =>
      verifyReleaseEvidenceManifest(
        { manifestPath: file },
        { candidate: CANDIDATE, expectedByKind: { invariant: ['INV-01'] } },
        { trustRootCommit: TRUST_COMMIT, execFileSyncImpl: () => attestationFor(file) }
      )
    ).toThrow(/digest mismatch/);

    const escaping = manifestFile({
      contract: 'wayland-release-evidence-manifest/1.0',
      candidate: CANDIDATE,
      evidence: [
        {
          kind: 'invariant',
          id: 'INV-01',
          evidencePath: '../foreign.json',
          evidenceSha256: `sha256:${'d'.repeat(64)}`,
        },
      ],
    });
    expect(() =>
      verifyReleaseEvidenceManifest(
        { manifestPath: escaping },
        { candidate: CANDIDATE, expectedByKind: { invariant: ['INV-01'] } },
        { trustRootCommit: TRUST_COMMIT, execFileSyncImpl: () => attestationFor(escaping) }
      )
    ).toThrow(/escapes evidence root/);
  });
});
