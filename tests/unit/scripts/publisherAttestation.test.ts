import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  readPolicy,
  selectPolicy,
  verifyPublisherAttestation,
} = require('../../../scripts/supply-chain/verifyPublisherAttestation');

// Derived, never re-typed: the release-acceptance gate requires exactly ONE
// active policy, so hard-coding a tag here breaks the day the engine is bumped.
const ACTIVE = readPolicy().policies.find((entry: { status: string }) => entry.status === 'active') as {
  releaseTag: string;
  signerWorkflow: string;
  sourceDigest: string;
};

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function artifact() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-attestation-'));
  roots.push(root);
  const artifactPath = path.join(root, 'wayland-core-v0.12.25-aarch64-apple-darwin.tar.gz');
  fs.writeFileSync(artifactPath, 'signed-release-archive');
  return {
    artifactPath,
    assetName: path.basename(artifactPath),
    releaseTag: ACTIVE.releaseTag,
    expectedSha256: crypto.createHash('sha256').update('signed-release-archive').digest('hex'),
  };
}

describe('Core publisher attestation authority', () => {
  it('accepts only the pinned signer, source and SLSA predicate', () => {
    const options = artifact();
    const receipt = verifyPublisherAttestation({
      ...options,
      execFileSyncImpl: (_command: string, args: string[]) => {
        expect(args).toContain('FerroxLabs/wayland-core/.github/workflows/release.yml');
        expect(args).toContain(ACTIVE.sourceDigest);
        expect(args).toContain('--deny-self-hosted-runners');
        return JSON.stringify([{ verificationResult: { statement: {} } }]);
      },
    });
    expect(receipt.verified).toBe(true);
    expect(receipt.sha256).toBe(`sha256:${options.expectedSha256}`);
  });

  it('fails closed when no signed attestation is returned', () => {
    expect(() => verifyPublisherAttestation({ ...artifact(), execFileSyncImpl: () => JSON.stringify([]) })).toThrow(
      /no signed attestation/
    );
  });

  it('fails closed on archive digest mismatch before invoking GitHub verification', () => {
    let invoked = false;
    expect(() =>
      verifyPublisherAttestation({
        ...artifact(),
        expectedSha256: '0'.repeat(64),
        execFileSyncImpl: () => {
          invoked = true;
          return '[]';
        },
      })
    ).toThrow(/digest mismatch/);
    expect(invoked).toBe(false);
  });

  it('rejects an unknown signer and stale or unsupported policy', () => {
    const base = readPolicy();
    const unknownSigner = structuredClone(base);
    // Mutate the ACTIVE policy - that is the one selectPolicy will pick.
    // Indexing policies[0] silently stopped exercising anything once a
    // superseded entry moved into that slot.
    unknownSigner.policies.find(
      (entry: { releaseTag: string }) => entry.releaseTag === ACTIVE.releaseTag
    ).signerWorkflow = 'attacker/repo/.github/workflows/release.yml';
    expect(() =>
      verifyPublisherAttestation({
        ...artifact(),
        policyDocument: unknownSigner,
        execFileSyncImpl: (_command: string, args: string[]) => {
          if (args.includes('attacker/repo/.github/workflows/release.yml')) throw new Error('unknown signer');
          return '[]';
        },
      })
    ).toThrow(/publisher authentication failed/i);

    const stale = structuredClone(base);
    for (const entry of stale.policies) entry.status = 'superseded';
    expect(() => selectPolicy(ACTIVE.releaseTag, stale)).toThrow(/stale/);
    // A tag with no policy at all. Deliberately not a plausible next release:
    // this assertion previously named v0.12.26 and silently stopped testing
    // "unknown tag" the day that release shipped a real policy.
    expect(() => selectPolicy('v0.0.0-no-such-release', base)).toThrow(/No unique/);
  });

  it('rejects the wrong release artifact name', () => {
    expect(() => verifyPublisherAttestation({ ...artifact(), assetName: 'wayland-core.exe' })).toThrow(
      /identity mismatch/
    );
  });
});
