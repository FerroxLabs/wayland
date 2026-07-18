/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { verifyPlatformPackageSmoke } = require('../../../scripts/release-acceptance/verifyPlatformPackageSmokes');

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
      updateChannel: platform === 'darwin' && arch === 'arm64' ? 'latest-arm64' : platform === 'win32' && arch === 'arm64' ? 'latest-win-arm64' : 'latest',
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
  const receiptPath = path.join(root, 'platform-package-smoke-linux-x64.json');
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  writeFileSync(receiptPath, bytes);
  const fileDigest = crypto.createHash('sha256').update(bytes).digest('hex');
  const execFileSyncImpl = () =>
    JSON.stringify([
      {
        verificationResult: {
          statement: {
            predicateType: 'https://slsa.dev/provenance/v1',
            subject: [{ digest: { sha256: fileDigest } }],
          },
        },
      },
    ]);
  return { receiptPath, execFileSyncImpl };
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
        { target: 'linux-x64', receiptPath: evidence.receiptPath },
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toEqual({
      contract: 'wayland-platform-package-smoke-authority/1.0',
      target: 'linux-x64',
      candidate: { commit: COMMIT, tree: TREE },
      artifacts: {
        installerDigest: DIGEST('1'),
        executableSha256: DIGEST('3'),
        appAsarSha256: DIGEST('4'),
        verifiedCandidateDigest: DIGEST('5'),
      },
      authority: 'canonical-packaged-runtime-observer',
    });
  });

  it('rejects a smoke from a sibling candidate', () => {
    const forged = report();
    forged.sourceIdentity.commit = 'c'.repeat(40);
    const evidence = fixture(forged);
    expect(() =>
      verifyPlatformPackageSmoke(
        { target: 'linux-x64', receiptPath: evidence.receiptPath },
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
        { target: 'linux-x64', receiptPath: evidence.receiptPath },
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: unbound }
      )
    ).toThrow(/does not bind exact receipt bytes/);
  });

  it('rejects symlinked receipt paths', () => {
    const evidence = fixture();
    const link = `${evidence.receiptPath}.link`;
    symlinkSync(evidence.receiptPath, link);
    expect(() =>
      verifyPlatformPackageSmoke(
        { target: 'linux-x64', receiptPath: link },
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/not a regular file/);
  });

  it('rejects a smoke that did not finish renderer cleanup', () => {
    const incomplete = report();
    incomplete.shutdown.descendantsRemaining = 1;
    const evidence = fixture(incomplete);
    expect(() =>
      verifyPlatformPackageSmoke(
        { target: 'linux-x64', receiptPath: evidence.receiptPath },
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/shutdown lifecycle is incomplete/);
  });

  it('rejects empty semantic structures even when lifecycle booleans are true', () => {
    const hollow = report();
    hollow.freshness = {} as never;
    const evidence = fixture(hollow);
    expect(() =>
      verifyPlatformPackageSmoke(
        { target: 'linux-x64', receiptPath: evidence.receiptPath },
        { target: 'linux-x64', candidate: { commit: COMMIT, tree: TREE } },
        { execFileSyncImpl: evidence.execFileSyncImpl }
      )
    ).toThrow(/installer freshness has missing or unknown critical fields/);
  });
});
