/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  assertRejectionAttributableToCorruption,
  assertSupportedStateSurvived,
  plantSupportedStateSentinel,
  supportedStateEntries,
} from '../../../scripts/release-acceptance/produceNativeUpdaterObservation.mjs';
import crypto from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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

/**
 * The corrupted-installer step is the only thing in this observation that proves
 * the packaged app refuses tampered bytes. It used to accept ANY throw as proof,
 * so an out-of-disk or missing-extractor failure would turn the gate green having
 * proved nothing.
 *
 * Classifying the error cannot close that hole: `execFileSync` reports a nonzero
 * exit as `status` with `code` undefined, and this file's `fail()` throws a plain
 * Error with neither - so the failures that matter carry nothing to match on.
 * The guard is a positive control instead.
 */
describe('corrupted-installer rejection is attributable', () => {
  const request = {
    candidateArtifact: { path: '/candidate.dmg' },
    platform: 'darwin',
    arch: 'arm64',
  } as never;

  it('accepts the rejection when the intact candidate still prepares', () => {
    const calls: string[] = [];
    const prepare = (artifact: string) => {
      calls.push(artifact);
      return {} as never;
    };
    expect(() => assertRejectionAttributableToCorruption(prepare, request, '/work', {})).not.toThrow();
    expect(calls).toEqual(['/candidate.dmg']);
  });

  it('voids the observation when the intact candidate also fails', () => {
    const prepare = () => {
      throw new Error('No space left on device');
    };
    expect(() => assertRejectionAttributableToCorruption(prepare, request, '/work', {})).toThrow(
      /not attributable to the corruption/
    );
  });

  it('voids the observation for a plain fail() with no errno at all', () => {
    const prepare = () => {
      throw new Error('[updater-observation] snapshot helper missing');
    };
    expect(() => assertRejectionAttributableToCorruption(prepare, request, '/work', {})).toThrow(
      /not attributable to the corruption/
    );
  });

  it('voids the observation for a nonzero exit, which carries status but no code', () => {
    const prepare = () => {
      const error = new Error('Command failed: hdiutil attach') as Error & { status?: number };
      error.status = 1;
      throw error;
    };
    expect(() => assertRejectionAttributableToCorruption(prepare, request, '/work', {})).toThrow(
      /not attributable to the corruption/
    );
  });
});

/**
 * The rollback and re-upgrade phases used to demand a byte-identical profile hash
 * across THREE different application versions. Measured against real boots of
 * v0.11.18 and v0.11.8 on the same profile: 16 files changed, 3 appeared and 6
 * disappeared with no update involved. Chromium rewrites leveldb LOG/LOG.old and
 * its cache indexes on every launch, Wayland rewrites its own wayland.db and
 * wayland-config.txt, and v0.11.8 simply ships six fewer builtin skills than
 * v0.11.18. The check could never pass, which is why this gate never went green.
 *
 * The property that IS true and worth gating is that the update sequence destroys
 * nothing the user owns.
 */
describe('supported state survival', () => {
  const roots2: string[] = [];
  afterEach(() => {
    for (const root of roots2.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  function profile() {
    const root = mkdtempSync(path.join(tmpdir(), 'wl-survive-'));
    roots2.push(root);
    mkdirSync(path.join(root, 'wayland'), { recursive: true });
    mkdirSync(path.join(root, 'config/builtin-skills/copywriter'), { recursive: true });
    mkdirSync(path.join(root, 'Local Storage/leveldb'), { recursive: true });
    writeFileSync(path.join(root, 'wayland/wayland.db'), 'user-rows');
    writeFileSync(path.join(root, 'config/wayland-config.txt'), 'user-config');
    writeFileSync(path.join(root, 'config/builtin-skills/copywriter/SKILL.md'), 'shipped');
    writeFileSync(path.join(root, 'Local Storage/leveldb/LOG'), 'chromium noise');
    return root;
  }

  it('tracks user and app data but not Chromium state or app-shipped content', () => {
    expect([...supportedStateEntries(profile())].sort()).toEqual(['config/wayland-config.txt', 'wayland/wayland.db']);
  });

  it('passes when only Chromium state and shipped content differ', () => {
    const before = profile();
    const sha = plantSupportedStateSentinel(before, 'a'.repeat(64));
    const entries = supportedStateEntries(before);
    const after = profile();
    plantSupportedStateSentinel(after, 'a'.repeat(64));
    // the deltas a real version change produces
    writeFileSync(path.join(after, 'Local Storage/leveldb/LOG'), 'rewritten by relaunch');
    writeFileSync(path.join(after, 'Local Storage/leveldb/LOG.old'), 'rotated');
    rmSync(path.join(after, 'config/builtin-skills/copywriter'), { recursive: true, force: true });
    writeFileSync(path.join(after, 'wayland/wayland.db'), 'migrated rows');
    expect(() => assertSupportedStateSurvived(entries, sha, after, 'rollback')).not.toThrow();
  });

  it.each([
    ['the user database', 'wayland/wayland.db'],
    ['the user config', 'config/wayland-config.txt'],
  ])('rejects destruction of %s', (_label, victim) => {
    const before = profile();
    const sha = plantSupportedStateSentinel(before, 'a'.repeat(64));
    const entries = supportedStateEntries(before);
    const after = profile();
    plantSupportedStateSentinel(after, 'a'.repeat(64));
    rmSync(path.join(after, victim), { force: true });
    expect(() => assertSupportedStateSurvived(entries, sha, after, 'rollback')).toThrow(/destroyed supported state/);
  });

  it('rejects a destroyed sentinel', () => {
    const before = profile();
    const sha = plantSupportedStateSentinel(before, 'a'.repeat(64));
    const entries = supportedStateEntries(before);
    const after = profile();
    expect(() => assertSupportedStateSurvived(entries, sha, after, 'rollback')).toThrow(
      /destroyed the user data sentinel/
    );
  });

  it('rejects a rewritten sentinel', () => {
    const before = profile();
    const sha = plantSupportedStateSentinel(before, 'a'.repeat(64));
    const entries = supportedStateEntries(before);
    const after = profile();
    plantSupportedStateSentinel(after, 'b'.repeat(64));
    expect(() => assertSupportedStateSurvived(entries, sha, after, 'rollback')).toThrow(
      /rewrote the user data sentinel/
    );
  });
});
