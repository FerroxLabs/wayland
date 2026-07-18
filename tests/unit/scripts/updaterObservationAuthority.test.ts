/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const {
  LINUX_CANDIDATE_PUBLISHER_IDENTITY,
  PREDICATE_TYPE,
  SIGNER_WORKFLOW,
  expectedPublisherGate,
  verifyPublisher,
  verifyUpdaterObservation,
} = require('../../../scripts/release-acceptance/verifyUpdaterObservation');

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const TRUST_COMMIT = 'c'.repeat(40);
const NONCE = 'c'.repeat(64);
const DATA = `sha256:${'d'.repeat(64)}`;
const temporaryRoots: string[] = [];

type Fixture = {
  root: string;
  observationPath: string;
  manifest: Record<string, any>;
  events: Record<string, any>;
  snapshots: Array<Record<string, any>>;
  files: Record<string, string>;
};

function sha256(bytes: Buffer | string): string {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function writeJson(filePath: string, value: unknown): { file: string; sha256: string; size: number } {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(filePath, bytes);
  return { file: path.basename(filePath), sha256: sha256(bytes), size: Buffer.byteLength(bytes) };
}

function writeBytes(filePath: string, value: string): { file: string; sha256: string; size: number } {
  writeFileSync(filePath, value);
  return { file: path.basename(filePath), sha256: sha256(value), size: Buffer.byteLength(value) };
}

function platformPackageSmoke(candidate: { file: string; sha256: string }) {
  return {
    contract: 'wayland-platform-package-smoke/2',
    target: 'darwin-arm64',
    installer: candidate.file,
    installerDigest: `sha256:${'1'.repeat(64)}`,
    installerSnapshotBytesSha256: candidate.sha256.slice('sha256:'.length),
    installedExecutable: 'Wayland.app/Contents/MacOS/Wayland',
    installedResources: 'Wayland.app/Contents/Resources',
    executableIdentity: { platform: 'darwin', arch: 'arm64' },
    executableSha256: '3'.repeat(64),
    appAsarSha256: '4'.repeat(64),
    freshness: {
      artifactDigest: `sha256:${'1'.repeat(64)}`,
      priorArtifactDigests: [`sha256:${'a'.repeat(64)}`],
      candidateStateDigest: `sha256:${'b'.repeat(64)}`,
      captureNonce: 'c'.repeat(64),
      sourceIdentity: { commit: COMMIT, tree: TREE },
    },
    candidateFreshness: {
      candidateDigest: `sha256:${'5'.repeat(64)}`,
      priorCandidateDigests: [`sha256:${'d'.repeat(64)}`],
      candidateStateDigest: `sha256:${'b'.repeat(64)}`,
      captureNonce: 'c'.repeat(64),
      sourceIdentity: { commit: COMMIT, tree: TREE },
      diagnosticTimes: { candidateMtimeMs: 1, appAsarMtimeMs: 2 },
    },
    sourceIdentity: { commit: COMMIT, tree: TREE },
    releaseIdentity: {
      releaseTrack: 'stable',
      productName: 'Wayland',
      executableName: 'Wayland',
      bundleName: 'Wayland.app',
      protocolScheme: 'wayland',
      updateChannel: 'latest-arm64',
      shellExperience: 'classic',
    },
    sandboxMode: 'production-default',
    productionSandboxProof: 'exercised',
    verifiedCandidateDigest: `sha256:${'5'.repeat(64)}`,
    criticalResources: 'verified',
    optionalCapabilities: {
      hub: 'available',
      'whatsapp-bridge': 'unavailable',
      'signal-cli-runtime': 'available',
    },
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
      eventEvidence: {
        contract: 'wayland-package-smoke-event/1',
        eventCount: 7,
        terminalSequence: 7,
      },
      descendantsObserved: 2,
      descendantsRemaining: 0,
    },
    processTreeIdentitySha256: `sha256:${'6'.repeat(64)}`,
  };
}

function createFixture(): Fixture {
  const root = mkdtempSync(path.join(tmpdir(), 'wayland-updater-observation-'));
  temporaryRoots.push(root);
  const initial = writeBytes(path.join(root, 'initial.dmg'), 'initial-package-bytes');
  const candidate = writeBytes(path.join(root, 'candidate.dmg'), 'candidate-package-bytes');
  const rollback = writeBytes(path.join(root, 'rollback.zip'), 'rollback-package-bytes');
  const packageSmoke = writeJson(path.join(root, 'package-smoke.json'), platformPackageSmoke(candidate));
  const baseEvents = [
    {
      sequence: 1,
      phase: 'initial',
      type: 'initial-boot',
      observedAt: '2026-07-19T00:01:00.000Z',
      runningVersion: '0.11.18',
      attemptedVersion: null,
      outcome: 'booted',
      failureReason: null,
      rollbackOffered: false,
      isolatedState: false,
      installedArtifactSha256: initial.sha256,
      supportedDataSetSha256: DATA,
    },
    {
      sequence: 2,
      phase: 'failedUpdate',
      type: 'update-failed',
      observedAt: '2026-07-19T00:02:00.000Z',
      runningVersion: '0.11.18',
      attemptedVersion: '0.12.0',
      outcome: 'failed',
      failureReason: 'injected-update-failure',
      rollbackOffered: true,
      isolatedState: false,
      installedArtifactSha256: null,
      supportedDataSetSha256: DATA,
    },
    {
      sequence: 3,
      phase: 'rollback',
      type: 'rollback-boot',
      observedAt: '2026-07-19T00:03:00.000Z',
      runningVersion: '0.11.8',
      attemptedVersion: null,
      outcome: 'booted',
      failureReason: null,
      rollbackOffered: false,
      isolatedState: true,
      installedArtifactSha256: rollback.sha256,
      supportedDataSetSha256: DATA,
    },
    {
      sequence: 4,
      phase: 'reupgrade',
      type: 'reupgrade-boot',
      observedAt: '2026-07-19T00:04:00.000Z',
      runningVersion: '0.12.0',
      attemptedVersion: null,
      outcome: 'booted',
      failureReason: null,
      rollbackOffered: false,
      isolatedState: true,
      installedArtifactSha256: candidate.sha256,
      supportedDataSetSha256: DATA,
    },
  ];
  const events = {
    contract: 'wayland-updater-runtime-events/1.0',
    nonce: NONCE,
    candidate: { commit: COMMIT, tree: TREE, version: '0.12.0', artifactSha256: candidate.sha256 },
    target: 'darwin-arm64',
    events: baseEvents,
  };
  const runtimeEvents = writeJson(path.join(root, 'runtime-events.json'), events);
  const snapshots = baseEvents.map((event) => ({
    contract: 'wayland-updater-state-snapshot/1.0',
    nonce: NONCE,
    candidate: { commit: COMMIT, tree: TREE },
    target: 'darwin-arm64',
    phase: event.phase,
    sequence: event.sequence,
    observedAt: event.observedAt,
    runningVersion: event.runningVersion,
    supportedDataSetSha256: event.supportedDataSetSha256,
    isolatedState: event.isolatedState,
    installedArtifactSha256: event.installedArtifactSha256,
  }));
  const snapshotRefs = snapshots.map((snapshot) => {
    const reference = writeJson(path.join(root, `snapshot-${snapshot.phase}.json`), snapshot);
    return { phase: snapshot.phase, ...reference };
  });
  const manifest = {
    contract: 'wayland-updater-packaged-observation/1.0',
    candidate: { commit: COMMIT, tree: TREE },
    target: 'darwin-arm64',
    nonce: NONCE,
    startedAt: '2026-07-19T00:00:00.000Z',
    completedAt: '2026-07-19T00:05:00.000Z',
    expiresAt: '2026-07-19T01:05:00.000Z',
    observer: { authority: 'nonce-bound-packaged-runtime-observer', runId: 12345 },
    initialArtifact: {
      ...initial,
      version: '0.11.18',
      releaseTag: 'v0.11.18',
      catalogVerified: true,
      publisher: {
        gate: 'macos-gatekeeper-developer-id-notarization',
        verified: true,
        verifierExitCode: 0,
        identity: 'Developer ID Application: Ferrox Labs',
      },
    },
    candidateArtifact: {
      ...candidate,
      version: '0.12.0',
      publisher: {
        gate: 'macos-gatekeeper-developer-id-notarization',
        verified: true,
        verifierExitCode: 0,
        identity: 'Developer ID Application: Ferrox Labs',
      },
    },
    rollbackArtifact: {
      ...rollback,
      version: '0.11.8',
      releaseTag: 'v0.11.8',
      catalogVerified: true,
      publisher: {
        gate: 'macos-gatekeeper-developer-id-notarization',
        verified: true,
        verifierExitCode: 0,
        identity: 'Developer ID Application: Ferrox Labs',
      },
    },
    packageSmoke,
    runtimeEvents,
    stateSnapshots: snapshotRefs,
  };
  const observationPath = path.join(root, 'observation.json');
  writeJson(observationPath, manifest);
  return {
    root,
    observationPath,
    manifest,
    events,
    snapshots,
    files: {
      candidate: path.join(root, candidate.file),
      runtimeEvents: path.join(root, runtimeEvents.file),
    },
  };
}

function options(fixture: Fixture, overrides: Record<string, unknown> = {}) {
  const initial = fixture.manifest.initialArtifact;
  const rollback = fixture.manifest.rollbackArtifact;
  return {
    now: () => Date.parse('2026-07-19T00:10:00.000Z'),
    verifyCandidateInRepositoryImpl: (candidate: { commit: string; tree: string }) => {
      if (candidate.commit !== COMMIT || candidate.tree !== TREE) throw new Error('foreign-candidate');
    },
    execFileSyncImpl: (_command: string, args: string[]) => {
      expect(args).toContain('--deny-self-hosted-runners');
      expect(args[args.indexOf('--signer-workflow') + 1]).toBe(SIGNER_WORKFLOW);
      expect(args[args.indexOf('--source-digest') + 1]).toBe(TRUST_COMMIT);
      expect(args[args.indexOf('--signer-digest') + 1]).toBe(TRUST_COMMIT);
      expect(args[args.indexOf('--source-ref') + 1]).toBe('refs/heads/release-trust-v1');
      const subject = sha256(readFileSync(fixture.observationPath)).slice('sha256:'.length);
      return JSON.stringify([
        {
          verificationResult: {
            statement: { predicateType: PREDICATE_TYPE, subject: [{ digest: { sha256: subject } }] },
          },
        },
      ]);
    },
    trustRootCommit: TRUST_COMMIT,
    initialCatalog: {
      contract: 'wayland-classic-initial-release/1.0',
      repository: 'FerroxLabs/wayland',
      releaseId: 2,
      tag: 'v0.11.18',
      tagCommit: 'e'.repeat(40),
      version: '0.11.18',
      publishedAt: '2026-07-15T00:09:27Z',
      artifacts: [
        {
          platform: fixture.manifest.target.split('-')[0],
          arch: fixture.manifest.target.split('-')[1],
          name: initial.file,
          size: initial.size,
          sha256: initial.sha256.slice('sha256:'.length),
          publisherGate: initial.publisher.gate,
        },
      ],
    },
    rollbackCatalog: {
      contract: 'wayland-classic-recovery-release/1.0',
      repository: 'FerroxLabs/wayland',
      releaseId: 1,
      tag: 'v0.11.8',
      tagCommit: 'd'.repeat(40),
      version: '0.11.8',
      publishedAt: '2026-06-30T12:24:04Z',
      artifacts: [
        {
          platform: fixture.manifest.target.split('-')[0],
          arch: fixture.manifest.target.split('-')[1],
          name: rollback.file,
          size: rollback.size,
          sha256: rollback.sha256.slice('sha256:'.length),
          publisherGate: rollback.publisher.gate,
        },
      ],
    },
    ...overrides,
  };
}

function rewriteObservation(fixture: Fixture): void {
  writeJson(fixture.observationPath, fixture.manifest);
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('canonical updater packaged-runtime observation authority', () => {
  it('accepts Linux candidate bytes only through the exact protected updater attestation authority', () => {
    expect(expectedPublisherGate('linux-x64', 'candidate')).toBe('github-protected-attestation-ferrox-labs');
    expect(
      verifyPublisher(
        {
          gate: 'github-protected-attestation-ferrox-labs',
          verified: true,
          verifierExitCode: 0,
          identity: LINUX_CANDIDATE_PUBLISHER_IDENTITY,
        },
        'linux-x64',
        'candidate'
      )
    ).toEqual({
      gate: 'github-protected-attestation-ferrox-labs',
      verified: true,
      verifierExitCode: 0,
      identity: LINUX_CANDIDATE_PUBLISHER_IDENTITY,
    });
    expect(() =>
      verifyPublisher(
        {
          gate: 'linux-detached-signature-pinned-keyring',
          verified: true,
          verifierExitCode: 0,
          identity: LINUX_CANDIDATE_PUBLISHER_IDENTITY,
        },
        'linux-x64',
        'candidate'
      )
    ).toThrow(/M8C_CANDIDATE_PUBLISHER_INVALID/);
    expect(() =>
      verifyPublisher(
        {
          gate: 'github-protected-attestation-ferrox-labs',
          verified: true,
          verifierExitCode: 0,
          identity: 'Ferrox Labs',
        },
        'linux-x64',
        'candidate'
      )
    ).toThrow(/unexpected-protected-attestation-identity/);
  });

  it('mints the exact final-acceptance receipt only from attested bound evidence', () => {
    const fixture = createFixture();
    expect(verifyUpdaterObservation({ observationPath: fixture.observationPath }, options(fixture))).toEqual({
      contract: 'wayland-updater-trusted-observation/1.0',
      candidate: { commit: COMMIT, tree: TREE },
      target: 'darwin-arm64',
      authority: 'nonce-bound-packaged-runtime-observer',
      receiptSha256: sha256(readFileSync(fixture.observationPath)),
    });
  });

  it('fails closed when a required observation is missing', () => {
    expect(() => verifyUpdaterObservation({ observationPath: '/definitely/missing/observation.json' })).toThrow(
      /M8C_OBSERVATION_INVALID:missing/
    );
  });

  it('rejects artifact tampering after the observation was sealed', () => {
    const fixture = createFixture();
    writeFileSync(fixture.files.candidate, 'tampered-candidate');
    expect(() => verifyUpdaterObservation({ observationPath: fixture.observationPath }, options(fixture))).toThrow(
      /M8C_CANDIDATE_ARTIFACT_INVALID:digest-mismatch/
    );
  });

  it('rejects a legacy self-authored simplified package-smoke claim', () => {
    const fixture = createFixture();
    fixture.manifest.packageSmoke = writeJson(path.join(fixture.root, 'package-smoke.json'), {
      contract: 'wayland-platform-package-smoke/2',
      target: 'darwin-arm64',
      sourceCommit: COMMIT,
      installerDigest: fixture.manifest.candidateArtifact.sha256.slice('sha256:'.length),
      booted: true,
      rendererReady: true,
      shutdownComplete: true,
    });
    rewriteObservation(fixture);
    expect(() => verifyUpdaterObservation({ observationPath: fixture.observationPath }, options(fixture))).toThrow(
      /M8C_PACKAGE_SMOKE_INVALID:platform-report-rejected/
    );
  });

  it('rejects a native package smoke whose raw installer snapshot digest is forged', () => {
    const fixture = createFixture();
    const smokePath = path.join(fixture.root, fixture.manifest.packageSmoke.file);
    const smoke = JSON.parse(readFileSync(smokePath, 'utf8'));
    smoke.installerSnapshotBytesSha256 = 'f'.repeat(64);
    fixture.manifest.packageSmoke = writeJson(smokePath, smoke);
    rewriteObservation(fixture);
    expect(() => verifyUpdaterObservation({ observationPath: fixture.observationPath }, options(fixture))).toThrow(
      /M8C_PACKAGE_SMOKE_INVALID:platform-report-rejected:platform smoke report is not bound to the supplied installer bytes/
    );
  });

  it('rejects a native package smoke with incomplete nested lifecycle evidence', () => {
    const fixture = createFixture();
    const smokePath = path.join(fixture.root, fixture.manifest.packageSmoke.file);
    const smoke = JSON.parse(readFileSync(smokePath, 'utf8'));
    smoke.electron.rendererReady = false;
    fixture.manifest.packageSmoke = writeJson(smokePath, smoke);
    rewriteObservation(fixture);
    expect(() => verifyUpdaterObservation({ observationPath: fixture.observationPath }, options(fixture))).toThrow(
      /M8C_PACKAGE_SMOKE_INVALID:platform-report-rejected:platform smoke renderer lifecycle is incomplete/
    );
  });

  it('rejects a native package smoke from a sibling source identity', () => {
    const fixture = createFixture();
    const smokePath = path.join(fixture.root, fixture.manifest.packageSmoke.file);
    const smoke = JSON.parse(readFileSync(smokePath, 'utf8'));
    smoke.sourceIdentity.commit = 'f'.repeat(40);
    fixture.manifest.packageSmoke = writeJson(smokePath, smoke);
    rewriteObservation(fixture);
    expect(() => verifyUpdaterObservation({ observationPath: fixture.observationPath }, options(fixture))).toThrow(
      /M8C_PACKAGE_SMOKE_INVALID:platform-report-rejected:platform smoke belongs to a stale or foreign candidate/
    );
  });

  it('rejects rollback bytes that do not match the compiled recovery catalog', () => {
    const fixture = createFixture();
    const forgedCatalog = structuredClone(options(fixture).rollbackCatalog as Record<string, any>);
    forgedCatalog.artifacts[0].sha256 = 'f'.repeat(64);
    expect(() =>
      verifyUpdaterObservation(
        { observationPath: fixture.observationPath },
        options(fixture, { rollbackCatalog: forgedCatalog })
      )
    ).toThrow(/M8C_ROLLBACK_CATALOG_MISMATCH/);
  });

  it('rejects stale packaged-runtime observations', () => {
    const fixture = createFixture();
    expect(() =>
      verifyUpdaterObservation(
        { observationPath: fixture.observationPath },
        options(fixture, { now: () => Date.parse('2026-07-20T00:10:00.000Z') })
      )
    ).toThrow(/M8C_OBSERVATION_STALE/);
  });

  it('rejects wrong-candidate runtime events even under the same directory', () => {
    const fixture = createFixture();
    fixture.events.candidate.commit = 'e'.repeat(40);
    const runtimeEvents = writeJson(fixture.files.runtimeEvents, fixture.events);
    fixture.manifest.runtimeEvents = runtimeEvents;
    rewriteObservation(fixture);
    expect(() => verifyUpdaterObservation({ observationPath: fixture.observationPath }, options(fixture))).toThrow(
      /M8C_RUNTIME_EVENTS_INVALID:stale-or-foreign-candidate/
    );
  });

  it('rejects an attestation that does not bind the exact observation bytes', () => {
    const fixture = createFixture();
    const forged = () =>
      JSON.stringify([
        {
          verificationResult: {
            statement: { predicateType: PREDICATE_TYPE, subject: [{ digest: { sha256: 'f'.repeat(64) } }] },
          },
        },
      ]);
    expect(() =>
      verifyUpdaterObservation(
        { observationPath: fixture.observationPath },
        options(fixture, { execFileSyncImpl: forged })
      )
    ).toThrow(/M8C_OBSERVATION_ATTESTATION_INVALID:subject-digest-mismatch/);
  });

  it('rejects event and state-snapshot disagreement', () => {
    const fixture = createFixture();
    fixture.snapshots[3].supportedDataSetSha256 = `sha256:${'f'.repeat(64)}`;
    const reference = writeJson(path.join(fixture.root, 'snapshot-reupgrade.json'), fixture.snapshots[3]);
    fixture.manifest.stateSnapshots[3] = { phase: 'reupgrade', ...reference };
    rewriteObservation(fixture);
    expect(() => verifyUpdaterObservation({ observationPath: fixture.observationPath }, options(fixture))).toThrow(
      /M8C_STATE_SNAPSHOT_INVALID:event-snapshot-mismatch/
    );
  });
});
