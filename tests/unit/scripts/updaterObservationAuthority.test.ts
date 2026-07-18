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
  PREDICATE_TYPE,
  SIGNER_WORKFLOW,
  verifyUpdaterObservation,
} = require('../../../scripts/release-acceptance/verifyUpdaterObservation');

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
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

function createFixture(): Fixture {
  const root = mkdtempSync(path.join(tmpdir(), 'wayland-updater-observation-'));
  temporaryRoots.push(root);
  const candidate = writeBytes(path.join(root, 'candidate.dmg'), 'candidate-package-bytes');
  const rollback = writeBytes(path.join(root, 'rollback.zip'), 'rollback-package-bytes');
  const packageSmoke = writeJson(path.join(root, 'package-smoke.json'), {
    contract: 'wayland-platform-package-smoke/2',
    target: 'darwin-arm64',
    sourceCommit: COMMIT,
    installerDigest: candidate.sha256.slice('sha256:'.length),
    booted: true,
    rendererReady: true,
    shutdownComplete: true,
  });
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
      installedArtifactSha256: null,
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
  return {
    now: () => Date.parse('2026-07-19T00:10:00.000Z'),
    verifyCandidateInRepositoryImpl: (candidate: { commit: string; tree: string }) => {
      if (candidate.commit !== COMMIT || candidate.tree !== TREE) throw new Error('foreign-candidate');
    },
    execFileSyncImpl: (_command: string, args: string[]) => {
      expect(args).toContain('--deny-self-hosted-runners');
      expect(args[args.indexOf('--signer-workflow') + 1]).toBe(SIGNER_WORKFLOW);
      expect(args[args.indexOf('--source-digest') + 1]).toBe(COMMIT);
      const subject = sha256(readFileSync(fixture.observationPath)).slice('sha256:'.length);
      return JSON.stringify([
        {
          verificationResult: {
            statement: { predicateType: PREDICATE_TYPE, subject: [{ digest: { sha256: subject } }] },
          },
        },
      ]);
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
  it('mints the exact final-acceptance receipt only from attested bound evidence', () => {
    const fixture = createFixture();
    expect(verifyUpdaterObservation({ observationPath: fixture.observationPath }, options(fixture))).toEqual({
      contract: 'wayland-updater-trusted-observation/1.0',
      candidate: { commit: COMMIT, tree: TREE },
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
