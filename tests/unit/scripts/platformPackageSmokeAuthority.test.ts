/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { verifyPlatformPackageSmoke } = require('../../../scripts/release-acceptance/verifyPlatformPackageSmokes');
const {
  createProtectedPlatformObservation,
} = require('../../../scripts/release-acceptance/createProtectedPlatformObservation');

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const TRUST_COMMIT = 'c'.repeat(40);
const DIGEST = (letter: string) => `sha256:${letter.repeat(64)}`;
const roots: string[] = [];

function report(target = 'linux-x64') {
  const [platform, arch] = target.split('-');
  return {
    contract: 'wayland-platform-package-smoke/2',
    target,
    installer: 'Wayland.deb',
    installerDigest: DIGEST('1'),
    installerSnapshotBytesSha256: '2'.repeat(64),
    installedExecutable: 'usr/bin/wayland',
    installedResources: 'usr/lib/wayland/resources',
    executableIdentity: { platform, arch },
    executableSha256: '3'.repeat(64),
    appAsarSha256: '4'.repeat(64),
    freshness: {
      artifactDigest: DIGEST('1'),
      priorArtifactDigests: [DIGEST('a')],
      candidateStateDigest: DIGEST('b'),
      captureNonce: 'c'.repeat(64),
      sourceIdentity: { commit: COMMIT, tree: TREE },
    },
    candidateFreshness: {
      candidateDigest: DIGEST('5'),
      priorCandidateDigests: [DIGEST('d')],
      candidateStateDigest: DIGEST('b'),
      captureNonce: 'c'.repeat(64),
      sourceIdentity: { commit: COMMIT, tree: TREE },
      diagnosticTimes: { candidateMtimeMs: 1, appAsarMtimeMs: 2 },
    },
    sourceIdentity: { commit: COMMIT, tree: TREE },
    releaseIdentity: {
      releaseTrack: 'stable',
      productName: 'Wayland',
      executableName: platform === 'win32' ? 'Wayland.exe' : platform === 'linux' ? 'wayland' : 'Wayland',
      bundleName: 'Wayland.app',
      protocolScheme: 'wayland',
      updateChannel:
        platform === 'darwin' && arch === 'arm64'
          ? 'latest-arm64'
          : platform === 'win32' && arch === 'arm64'
            ? 'latest-win-arm64'
            : 'latest',
      shellExperience: 'classic',
    },
    sandboxMode: platform === 'linux' ? 'smoke-only-disabled' : 'production-default',
    productionSandboxProof: platform === 'linux' ? 'not-proven-by-unprivileged-package-extraction' : 'exercised',
    verifiedCandidateDigest: DIGEST('5'),
    criticalResources: 'verified',
    optionalCapabilities: { hub: 'available', 'whatsapp-bridge': 'unavailable', 'signal-cli-runtime': 'available' },
    electron: {
      booted: true,
      rendererReady: true,
      expectedRendererPath: 'resources/app.asar/out/renderer/index.html',
      markerSha256: '7'.repeat(64),
      readyState: 'complete',
      title: 'Wayland',
      url: 'file:///resources/app.asar/out/renderer/index.html',
      bodyChildren: 1,
      rootChildren: 1,
      smokeMarker: '<redacted>',
      shellExperience: 'classic',
      recoveryFallback: false,
      fatalErrorBoundary: false,
    },
    shutdown: {
      parentExit: 'zero',
      subsystemCleanup: 'completed-with-structured-proof',
      eventEvidence: { contract: 'wayland-package-smoke-event/1', eventCount: 7, terminalSequence: 7 },
      descendantsObserved: 2,
      descendantsRemaining: 0,
    },
    processTreeIdentitySha256: DIGEST('6'),
  };
}

function fixture(value = report()) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'wayland-platform-authority-'));
  roots.push(root);
  const installerPath = path.join(root, 'Wayland.deb');
  writeFileSync(installerPath, 'actual native installer bytes');
  value.installerSnapshotBytesSha256 = crypto.createHash('sha256').update(readFileSync(installerPath)).digest('hex');
  const receiptPath = path.join(root, 'platform-package-smoke-linux-x64.json');
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  writeFileSync(receiptPath, bytes);
  const observationPath = path.join(root, 'protected-platform-observation-linux-x64.json');
  createProtectedPlatformObservation(
    {
      target: 'linux-x64',
      candidate: { commit: COMMIT, tree: TREE },
      reportPath: receiptPath,
      installerPath,
      outputPath: observationPath,
      workflow: {
        repository: 'FerroxLabs/wayland',
        workflow: '.github/workflows/protected-platform-package-observer.yml',
        ref: 'refs/heads/release-trust-v1',
        runId: 123,
        runAttempt: 1,
        runnerOs: 'Linux',
        runnerArch: 'X64',
      },
      producer: {
        repository: 'FerroxLabs/wayland',
        runId: 99,
        runAttempt: 2,
        candidateCommit: COMMIT,
      },
    },
    { platform: 'linux', arch: 'x64' }
  );
  const execFileSyncImpl = () => {
    const fileDigest = crypto.createHash('sha256').update(readFileSync(observationPath)).digest('hex');
    return JSON.stringify([
      {
        verificationResult: {
          statement: {
            predicateType: 'https://slsa.dev/provenance/v1',
            subject: [{ digest: { sha256: fileDigest } }],
          },
        },
      },
    ]);
  };
  return { receiptPath, observationPath, installerPath, execFileSyncImpl };
}

function input(evidence: ReturnType<typeof fixture>, target = 'linux-x64') {
  return {
    target,
    receiptPath: evidence.receiptPath,
    observationPath: evidence.observationPath,
    installerPath: evidence.installerPath,
  };
}

afterEach(() => {
  delete process.env.WAYLAND_RELEASE_TRUST_ROOT_SHA;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

beforeEach(() => {
  process.env.WAYLAND_RELEASE_TRUST_ROOT_SHA = TRUST_COMMIT;
});

describe('platform package smoke acceptance authority', () => {
  it('normalizes an exact-candidate, exact-byte attested native smoke', () => {
    const evidence = fixture();
    expect(
      verifyPlatformPackageSmoke(
        input(evidence),
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toEqual({
      contract: 'wayland-platform-package-smoke-authority/1.0',
      target: 'linux-x64',
      candidate: { commit: COMMIT, tree: TREE },
      artifacts: {
        installerBytesSha256: `sha256:${crypto.createHash('sha256').update('actual native installer bytes').digest('hex')}`,
        installerSizeBytes: Buffer.byteLength('actual native installer bytes'),
        installerDigest: DIGEST('1'),
        executableSha256: DIGEST('3'),
        appAsarSha256: DIGEST('4'),
        verifiedCandidateDigest: DIGEST('5'),
        reportSha256: `sha256:${crypto.createHash('sha256').update(readFileSync(evidence.receiptPath)).digest('hex')}`,
        observationSha256: `sha256:${crypto.createHash('sha256').update(readFileSync(evidence.observationPath)).digest('hex')}`,
      },
      authority: 'protected-native-package-observer',
    });
  });

  it('rejects a smoke from a sibling candidate', () => {
    const evidence = fixture();
    const observation = JSON.parse(readFileSync(evidence.observationPath, 'utf8'));
    observation.candidate.commit = 'c'.repeat(40);
    writeFileSync(evidence.observationPath, `${JSON.stringify(observation)}\n`);
    expect(() =>
      verifyPlatformPackageSmoke(
        input(evidence),
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/stale or foreign candidate/);
  });

  it('rejects an attestation that does not bind the exact receipt bytes', () => {
    const evidence = fixture();
    const unbound = () =>
      JSON.stringify([
        {
          verificationResult: {
            statement: {
              predicateType: 'https://slsa.dev/provenance/v1',
              subject: [{ digest: { sha256: '0'.repeat(64) } }],
            },
          },
        },
      ]);
    expect(() =>
      verifyPlatformPackageSmoke(
        input(evidence),
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: unbound }
      )
    ).toThrow(/does not bind exact receipt bytes/);
  });

  it('rejects symlinked receipt paths', () => {
    const evidence = fixture();
    const link = `${evidence.observationPath}.link`;
    symlinkSync(evidence.observationPath, link);
    expect(() =>
      verifyPlatformPackageSmoke(
        { ...input(evidence), observationPath: link },
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/not a regular file/);
  });

  it('rejects a smoke that did not finish renderer cleanup', () => {
    const evidence = fixture();
    const incomplete = JSON.parse(readFileSync(evidence.receiptPath, 'utf8'));
    incomplete.shutdown.descendantsRemaining = 1;
    writeFileSync(evidence.receiptPath, `${JSON.stringify(incomplete)}\n`);
    expect(() =>
      verifyPlatformPackageSmoke(
        input(evidence),
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/does not bind exact report bytes/);
  });

  it('rejects empty semantic structures even when lifecycle booleans are true', () => {
    const evidence = fixture();
    const hollow = JSON.parse(readFileSync(evidence.receiptPath, 'utf8'));
    hollow.freshness = {};
    writeFileSync(evidence.receiptPath, `${JSON.stringify(hollow)}\n`);
    expect(() =>
      verifyPlatformPackageSmoke(
        input(evidence),
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/does not bind exact report bytes/);
  });

  it('rejects coherent report JSON without a protected observation', () => {
    const evidence = fixture();
    expect(() =>
      verifyPlatformPackageSmoke(
        { target: 'linux-x64', receiptPath: evidence.receiptPath },
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/missing or unknown critical fields/);
  });

  it('rejects an installer changed after protected observation', () => {
    const evidence = fixture();
    writeFileSync(evidence.installerPath, 'tampered installer');
    expect(() =>
      verifyPlatformPackageSmoke(
        input(evidence),
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/does not bind exact installer bytes/);
  });

  it('rejects an observation for the wrong target', () => {
    const evidence = fixture();
    const observation = JSON.parse(readFileSync(evidence.observationPath, 'utf8'));
    observation.target = 'linux-arm64';
    writeFileSync(evidence.observationPath, `${JSON.stringify(observation)}\n`);
    expect(() =>
      verifyPlatformPackageSmoke(
        input(evidence),
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/contract or authority is invalid/);
  });
});
