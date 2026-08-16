/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const {
  createLocalAttestationSubstitute,
  isBundleLocalName,
} = require('../../../scripts/release-acceptance/validateNativeUpdaterBundle');

const temporaryRoots: string[] = [];

function makeRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'wayland-updater-bundle-'));
  temporaryRoots.push(root);
  return root;
}

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function verifyArgs(filePath: string): string[] {
  return ['attestation', 'verify', filePath, '--repo', 'FerroxLabs/wayland', '--format', 'json'];
}

function subjectDigests(raw: string): string[] {
  return JSON.parse(raw).flatMap((entry: any) =>
    entry.verificationResult.statement.subject.map((subject: any) => subject.digest.sha256)
  );
}

afterEach(() => {
  while (temporaryRoots.length) rmSync(temporaryRoots.pop() as string, { recursive: true, force: true });
});

describe('isBundleLocalName', () => {
  it('accepts the installer basenames the observer actually emits', () => {
    for (const name of [
      'Wayland-0.12.0-linux-amd64.deb',
      'Wayland-0.12.0-mac-arm64.dmg',
      'Wayland-0.12.0-win-x64.exe',
      'Wayland-0.11.8-linux-x86_64.AppImage',
    ]) {
      expect(isBundleLocalName(name)).toBe(true);
    }
  });

  it('refuses anything that could escape the bundle or smuggle a second subject', () => {
    for (const name of [
      '',
      '.',
      '..',
      '../observation.json',
      'nested/installer.deb',
      'nested\\installer.deb',
      '/abs/installer.deb',
      'installer.deb\nbundle/observation.json',
      'installer.deb bundle/observation.json',
      '-leading-dash.deb',
      '$(whoami).deb',
    ]) {
      expect(isBundleLocalName(name)).toBe(false);
    }
  });

  it('refuses non-strings', () => {
    for (const value of [undefined, null, 42, {}, ['a.deb']]) {
      expect(isBundleLocalName(value)).toBe(false);
    }
  });
});

describe('createLocalAttestationSubstitute', () => {
  it('answers each allowed subject with the digest of its own bytes', () => {
    const root = makeRoot();
    const observation = path.join(root, 'observation.json');
    const installer = path.join(root, 'Wayland-0.12.0-linux-amd64.deb');
    writeFileSync(observation, '{"contract":"observation"}');
    writeFileSync(installer, 'candidate-installer-bytes');
    const run = createLocalAttestationSubstitute([observation, installer]);

    expect(subjectDigests(run('gh', verifyArgs(observation)))).toEqual([sha256Hex('{"contract":"observation"}')]);
    expect(subjectDigests(run('gh', verifyArgs(installer)))).toEqual([sha256Hex('candidate-installer-bytes')]);
  });

  it('does not hand the observation digest back for the candidate installer', () => {
    // This is the exact failure the July stub produced once the verifier began
    // routing the linux candidate .deb through the same injected implementation.
    const root = makeRoot();
    const observation = path.join(root, 'observation.json');
    const installer = path.join(root, 'candidate.deb');
    writeFileSync(observation, 'observation-bytes');
    writeFileSync(installer, 'installer-bytes');
    const run = createLocalAttestationSubstitute([observation, installer]);

    expect(subjectDigests(run('gh', verifyArgs(installer)))).not.toEqual(
      subjectDigests(run('gh', verifyArgs(observation)))
    );
  });

  it('emits a SLSA v1 provenance statement shape', () => {
    const root = makeRoot();
    const observation = path.join(root, 'observation.json');
    writeFileSync(observation, 'observation-bytes');
    const parsed = JSON.parse(createLocalAttestationSubstitute([observation])('gh', verifyArgs(observation)));

    expect(parsed[0].verificationResult.statement.predicateType).toBe('https://slsa.dev/provenance/v1');
  });

  it('refuses a subject that was never bound', () => {
    const root = makeRoot();
    const observation = path.join(root, 'observation.json');
    const stranger = path.join(root, 'stranger.deb');
    writeFileSync(observation, 'observation-bytes');
    writeFileSync(stranger, 'stranger-bytes');
    const run = createLocalAttestationSubstitute([observation]);

    expect(() => run('gh', verifyArgs(stranger))).toThrow(/refused unbound subject/);
  });

  it('resolves the requested path before matching so a traversal cannot masquerade', () => {
    const root = makeRoot();
    const observation = path.join(root, 'observation.json');
    writeFileSync(observation, 'observation-bytes');
    const run = createLocalAttestationSubstitute([observation]);

    expect(subjectDigests(run('gh', verifyArgs(path.join(root, 'nested', '..', 'observation.json'))))).toEqual([
      sha256Hex('observation-bytes'),
    ]);
  });

  it('refuses any command that is not a gh attestation verify', () => {
    const root = makeRoot();
    const observation = path.join(root, 'observation.json');
    writeFileSync(observation, 'observation-bytes');
    const run = createLocalAttestationSubstitute([observation]);

    expect(() => run('curl', verifyArgs(observation))).toThrow(/unexpected command/);
    expect(() => run('gh', ['run', 'download', observation])).toThrow(/unexpected command/);
    expect(() => run('gh', undefined)).toThrow(/unexpected command/);
  });

  it('fails closed when an allowed subject is missing or is not a regular file', () => {
    const root = makeRoot();
    expect(() => createLocalAttestationSubstitute([path.join(root, 'absent.json')])).toThrow();

    const target = path.join(root, 'real.json');
    const link = path.join(root, 'link.json');
    writeFileSync(target, 'real-bytes');
    symlinkSync(target, link);
    expect(() => createLocalAttestationSubstitute([link])).toThrow(/not a regular file/);
  });
});

describe('the substitute at the seam the canonical verifier calls', () => {
  const {
    verifyCandidateArtifactAttestation,
  } = require('../../../scripts/release-acceptance/verifyUpdaterObservation');

  function legacyAlwaysObservationStub(observationDigestHex: string) {
    return () =>
      JSON.stringify([
        {
          verificationResult: {
            statement: {
              predicateType: 'https://slsa.dev/provenance/v1',
              subject: [{ digest: { sha256: observationDigestHex } }],
            },
          },
        },
      ]);
  }

  it('lets the linux candidate installer through, where the July stub could not', () => {
    const root = makeRoot();
    const observation = path.join(root, 'observation.json');
    const installer = path.join(root, 'Wayland-0.12.0-linux-amd64.deb');
    writeFileSync(observation, 'observation-bytes');
    writeFileSync(installer, 'installer-bytes');
    const installerDigest = `sha256:${sha256Hex('installer-bytes')}`;
    const options = { trustRootCommit: '0'.repeat(40) };

    expect(() =>
      verifyCandidateArtifactAttestation(installer, installerDigest, {
        ...options,
        execFileSyncImpl: legacyAlwaysObservationStub(sha256Hex('observation-bytes')),
      })
    ).toThrow(/M8C_CANDIDATE_ATTESTATION_INVALID:subject-digest-mismatch/);

    expect(() =>
      verifyCandidateArtifactAttestation(installer, installerDigest, {
        ...options,
        execFileSyncImpl: createLocalAttestationSubstitute([observation, installer]),
      })
    ).not.toThrow();
  });

  it('still rejects an installer whose claimed digest is not its bytes', () => {
    const root = makeRoot();
    const installer = path.join(root, 'candidate.deb');
    writeFileSync(installer, 'installer-bytes');

    expect(() =>
      verifyCandidateArtifactAttestation(installer, `sha256:${'f'.repeat(64)}`, {
        trustRootCommit: '0'.repeat(40),
        execFileSyncImpl: createLocalAttestationSubstitute([installer]),
      })
    ).toThrow(/M8C_CANDIDATE_ATTESTATION_INVALID:subject-digest-mismatch/);
  });
});

describe('expiresAtFor', () => {
  it('stays inside the verifier 24h cap while surviving a full six-target assembly', async () => {
    const { expiresAtFor } = await import('../../../scripts/release-acceptance/produceNativeUpdaterObservation.mjs');
    const completedAt = '2026-08-16T00:00:00.000Z';
    const windowMs = Date.parse(expiresAtFor(completedAt)) - Date.parse(completedAt);

    expect(windowMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    expect(windowMs).toBeGreaterThanOrEqual(12 * 60 * 60 * 1000);
  });

  it('refuses a completedAt that is not a parsable instant', async () => {
    const { expiresAtFor } = await import('../../../scripts/release-acceptance/produceNativeUpdaterObservation.mjs');

    expect(() => expiresAtFor('not-a-date')).toThrow(/parsable instant/);
  });
});
