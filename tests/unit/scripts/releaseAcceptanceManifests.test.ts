import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
const DIGEST = `sha256:${'c'.repeat(64)}`;
const CANDIDATE = { commit: COMMIT, tree: TREE };
const temporaryDirectories: string[] = [];

function manifestFile(value: unknown) {
  const directory = mkdtempSync(join(tmpdir(), 'wayland-release-acceptance-'));
  temporaryDirectories.push(directory);
  const file = join(directory, 'manifest.json');
  writeFileSync(file, JSON.stringify(value));
  return file;
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
    const file = manifestFile({
      contract: 'wayland-release-evidence-manifest/1.0',
      candidate: CANDIDATE,
      evidence: [{ kind: 'invariant', id: 'INV-01', evidenceSha256: DIGEST }],
    });

    const receipt = verifyReleaseEvidenceManifest(
      { manifestPath: file },
      { candidate: CANDIDATE, expectedByKind: { invariant: ['INV-01'] } },
      {
        execFileSyncImpl: (command: string, args: string[]) => {
          expect(command).toBe('gh');
          expect(args).toContain('--deny-self-hosted-runners');
          expect(args).toContain('--source-digest');
          expect(args[args.indexOf('--source-digest') + 1]).toBe(COMMIT);
          expect(args[args.indexOf('--signer-workflow') + 1]).toBe(
            'FerroxLabs/wayland/.github/workflows/release-acceptance.yml'
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
    const file = manifestFile({
      contract: 'wayland-release-evidence-manifest/1.0',
      candidate: CANDIDATE,
      evidence: [{ kind: 'invariant', id: 'INV-01', evidenceSha256: DIGEST }],
    });
    expect(() =>
      verifyReleaseEvidenceManifest(
        { manifestPath: file },
        { candidate: CANDIDATE, expectedByKind: { invariant: ['INV-01'] } },
        { execFileSyncImpl: () => JSON.stringify([]) }
      )
    ).toThrow(/unattested/);

    expect(() =>
      verifyReleaseEvidenceManifest(
        { manifestPath: file },
        { candidate: CANDIDATE, expectedByKind: { invariant: ['INV-01'] } },
        {
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
        { execFileSyncImpl: () => attestationFor(file) }
      )
    ).toThrow(/stale or foreign/);
  });

  it('requires exact, non-duplicated claims coverage', () => {
    const file = manifestFile({
      contract: 'wayland-release-claims-manifest/1.0',
      candidate: CANDIDATE,
      capabilities: [
        { id: 'voice', claimed: false, evidenceSha256: DIGEST },
        { id: 'voice', claimed: false, evidenceSha256: DIGEST },
      ],
    });
    expect(() =>
      verifyReleaseClaimsManifest(
        { manifestPath: file },
        { candidate: CANDIDATE, capabilityIds: ['voice', 'mcp'] },
        { execFileSyncImpl: () => attestationFor(file) }
      )
    ).toThrow(/unknown or duplicated/);
  });
});
