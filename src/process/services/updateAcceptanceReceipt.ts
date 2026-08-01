/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Strict shape contract for a claimed signed update -> rollback -> re-upgrade
 * journey. Shape consistency is deliberately separated from acceptance
 * authority. The canonical authority lives in
 * scripts/release-acceptance/verifyUpdaterObservation.js, where exact evidence
 * bytes and their GitHub provenance are verified before a trusted receipt is
 * minted.
 */

const SHA256 = /^[a-f0-9]{64}$/;
const SHA512_BASE64 = /^[A-Za-z0-9+/]{86}==$/;
const COMMIT = /^[a-f0-9]{40}$/;

export type UpdatePublisherGate =
  | 'macos-gatekeeper-developer-id-notarization'
  | 'windows-authenticode-ferrox-labs'
  | 'linux-detached-signature-pinned-keyring'
  | 'github-release-digest-only';

export type UpdateTarget = 'darwin-arm64' | 'darwin-x64' | 'win32-arm64' | 'win32-x64' | 'linux-arm64' | 'linux-x64';

export type SignedUpdateArtifactEvidence = {
  role: 'candidate' | 'rollback';
  target: UpdateTarget;
  version: string;
  path: string;
  sha256: string;
  observedSha256: string;
  size: number;
  observedSize: number;
  publisher: {
    gate: UpdatePublisherGate;
    verified: true;
    verifierExitCode: 0;
    identity: string;
  };
};

export type UpdateJourneyReceipt = {
  contract: 'wayland-updater-rollback-reupgrade/1.0';
  candidate: SignedUpdateArtifactEvidence & {
    role: 'candidate';
    sourceCommit: string;
    updateMetadata: {
      sha512: string;
      observedSha512: string;
      size: number;
      observedSize: number;
    };
    packageSmoke: {
      contract: 'wayland-platform-package-smoke/2';
      target: UpdateTarget;
      sourceCommit: string;
      installerDigest: string;
      booted: true;
      rendererReady: true;
      shutdownComplete: true;
    };
  };
  rollback: SignedUpdateArtifactEvidence & {
    role: 'rollback';
    version: '0.11.8';
    releaseTag: 'v0.11.8';
    catalogVerified: true;
  };
  journey: {
    initial: {
      runningVersion: string;
      supportedDataSetSha256: string;
    };
    failedUpdate: {
      attemptedVersion: string;
      runningVersion: string;
      outcome: 'failed';
      failureReason: string;
      rollbackOffered: true;
      supportedDataSetSha256: string;
    };
    rollback: {
      runningVersion: '0.11.8';
      outcome: 'booted';
      isolatedState: true;
      supportedDataSetSha256: string;
    };
    reupgrade: {
      runningVersion: string;
      sourceCommit: string;
      installedArtifactSha256: string;
      outcome: 'booted';
      supportedDataSetSha256: string;
    };
  };
  accepted: true;
};

export type ClaimedUpdateJourneyValidation = {
  contract: 'wayland-updater-journey-claim-validation/1.0';
  status: 'claimed-unverified';
  authoritative: false;
  candidate: {
    commit: string;
    target: UpdateTarget;
    version: string;
    artifactSha256: string;
  };
  rollback: {
    version: '0.11.8';
    artifactSha256: string;
  };
};

function fail(code: string, detail: string): never {
  throw new Error(`${code}:${detail}`);
}

function record(value: unknown, code: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code, 'expected-object');
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[], code: string): void {
  const expected = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) fail(code, `unknown-critical-field:${key}`);
  }
  for (const key of keys) {
    if (!(key in value)) fail(code, `missing-critical-field:${key}`);
  }
}

function string(value: unknown, code: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(code, 'expected-nonempty-string');
  return value;
}

function digest(value: unknown, code: string): string {
  const result = string(value, code);
  if (!SHA256.test(result)) fail(code, 'invalid-sha256');
  return result;
}

function positiveInteger(value: unknown, code: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) fail(code, 'expected-positive-integer');
  return value as number;
}

const PUBLISHER_GATES = new Set<UpdatePublisherGate>([
  'macos-gatekeeper-developer-id-notarization',
  'windows-authenticode-ferrox-labs',
  'linux-detached-signature-pinned-keyring',
  'github-release-digest-only',
]);
const TARGETS = new Set<UpdateTarget>([
  'darwin-arm64',
  'darwin-x64',
  'win32-arm64',
  'win32-x64',
  'linux-arm64',
  'linux-x64',
]);

function expectedPublisherGate(target: UpdateTarget, role: 'candidate' | 'rollback'): UpdatePublisherGate {
  if (target.startsWith('darwin-')) return 'macos-gatekeeper-developer-id-notarization';
  if (target.startsWith('win32-')) return 'windows-authenticode-ferrox-labs';
  if (role === 'rollback') return 'github-release-digest-only';
  return 'linux-detached-signature-pinned-keyring';
}

function artifact(value: unknown, role: 'candidate' | 'rollback'): SignedUpdateArtifactEvidence {
  const item = record(value, `M8C_${role.toUpperCase()}_ARTIFACT_INVALID`);
  const commonKeys = [
    'role',
    'target',
    'version',
    'path',
    'sha256',
    'observedSha256',
    'size',
    'observedSize',
    'publisher',
  ];
  const extra =
    role === 'candidate' ? ['sourceCommit', 'updateMetadata', 'packageSmoke'] : ['releaseTag', 'catalogVerified'];
  exactKeys(item, [...commonKeys, ...extra], `M8C_${role.toUpperCase()}_ARTIFACT_INVALID`);
  if (item.role !== role) fail(`M8C_${role.toUpperCase()}_ARTIFACT_INVALID`, 'role-mismatch');
  if (!TARGETS.has(item.target as UpdateTarget)) {
    fail(`M8C_${role.toUpperCase()}_ARTIFACT_INVALID`, 'unsupported-target');
  }
  string(item.version, `M8C_${role.toUpperCase()}_VERSION_INVALID`);
  string(item.path, `M8C_${role.toUpperCase()}_PATH_INVALID`);
  const expectedDigest = digest(item.sha256, `M8C_${role.toUpperCase()}_DIGEST_INVALID`);
  const observedDigest = digest(item.observedSha256, `M8C_${role.toUpperCase()}_DIGEST_INVALID`);
  if (expectedDigest !== observedDigest) fail(`M8C_${role.toUpperCase()}_DIGEST_MISMATCH`, 'sha256');
  const expectedSize = positiveInteger(item.size, `M8C_${role.toUpperCase()}_SIZE_INVALID`);
  const observedSize = positiveInteger(item.observedSize, `M8C_${role.toUpperCase()}_SIZE_INVALID`);
  if (expectedSize !== observedSize) fail(`M8C_${role.toUpperCase()}_SIZE_MISMATCH`, 'bytes');

  const publisher = record(item.publisher, `M8C_${role.toUpperCase()}_PUBLISHER_INVALID`);
  exactKeys(
    publisher,
    ['gate', 'verified', 'verifierExitCode', 'identity'],
    `M8C_${role.toUpperCase()}_PUBLISHER_INVALID`
  );
  if (!PUBLISHER_GATES.has(publisher.gate as UpdatePublisherGate)) {
    fail(`M8C_${role.toUpperCase()}_PUBLISHER_INVALID`, 'unsupported-gate');
  }
  if (publisher.gate !== expectedPublisherGate(item.target as UpdateTarget, role)) {
    fail(`M8C_${role.toUpperCase()}_PUBLISHER_INVALID`, 'gate-target-mismatch');
  }
  if (publisher.verified !== true || publisher.verifierExitCode !== 0) {
    fail(`M8C_${role.toUpperCase()}_PUBLISHER_INVALID`, 'publisher-evidence-not-proven');
  }
  const publisherIdentity = string(publisher.identity, `M8C_${role.toUpperCase()}_PUBLISHER_INVALID`);
  if (
    (item.target as string).startsWith('linux-') &&
    role === 'rollback' &&
    publisherIdentity !== 'FerroxLabs/wayland@v0.11.8 compiled release catalog'
  ) {
    fail(`M8C_${role.toUpperCase()}_PUBLISHER_INVALID`, 'unexpected-catalog-identity');
  } else if (!(item.target as string).startsWith('linux-') && !publisherIdentity.includes('Ferrox Labs')) {
    fail(`M8C_${role.toUpperCase()}_PUBLISHER_INVALID`, 'unexpected-publisher-identity');
  }
  return item as SignedUpdateArtifactEvidence;
}

function supportedDigest(value: unknown, phase: string): string {
  return digest(value, `M8C_${phase}_SUPPORTED_DATA_INVALID`);
}

function validateClaimedUpdateJourney(input: unknown): UpdateJourneyReceipt {
  const receipt = record(input, 'M8C_RECEIPT_INVALID');
  exactKeys(receipt, ['contract', 'candidate', 'rollback', 'journey', 'accepted'], 'M8C_RECEIPT_INVALID');
  if (receipt.contract !== 'wayland-updater-rollback-reupgrade/1.0') fail('M8C_RECEIPT_INVALID', 'contract');
  if (receipt.accepted !== true) fail('M8C_RECEIPT_INVALID', 'not-accepted');

  const candidate = artifact(receipt.candidate, 'candidate') as UpdateJourneyReceipt['candidate'];
  const rollback = artifact(receipt.rollback, 'rollback') as UpdateJourneyReceipt['rollback'];
  if (!COMMIT.test(candidate.sourceCommit)) fail('M8C_CANDIDATE_COMMIT_INVALID', 'expected-sha1');
  if (rollback.version !== '0.11.8' || rollback.releaseTag !== 'v0.11.8' || rollback.catalogVerified !== true) {
    fail('M8C_ROLLBACK_IDENTITY_INVALID', 'expected-compiled-v0.11.8-catalog');
  }

  const metadata = record(candidate.updateMetadata, 'M8C_UPDATE_METADATA_INVALID');
  exactKeys(metadata, ['sha512', 'observedSha512', 'size', 'observedSize'], 'M8C_UPDATE_METADATA_INVALID');
  const expectedSha512 = string(metadata.sha512, 'M8C_UPDATE_METADATA_INVALID');
  const observedSha512 = string(metadata.observedSha512, 'M8C_UPDATE_METADATA_INVALID');
  if (!SHA512_BASE64.test(expectedSha512) || expectedSha512 !== observedSha512) {
    fail('M8C_UPDATE_METADATA_MISMATCH', 'sha512');
  }
  if (
    positiveInteger(metadata.size, 'M8C_UPDATE_METADATA_INVALID') !==
    positiveInteger(metadata.observedSize, 'M8C_UPDATE_METADATA_INVALID')
  ) {
    fail('M8C_UPDATE_METADATA_MISMATCH', 'size');
  }

  const smoke = record(candidate.packageSmoke, 'M8C_PACKAGE_SMOKE_INVALID');
  exactKeys(
    smoke,
    ['contract', 'target', 'sourceCommit', 'installerDigest', 'booted', 'rendererReady', 'shutdownComplete'],
    'M8C_PACKAGE_SMOKE_INVALID'
  );
  if (
    smoke.contract !== 'wayland-platform-package-smoke/2' ||
    smoke.target !== candidate.target ||
    smoke.sourceCommit !== candidate.sourceCommit ||
    smoke.installerDigest !== candidate.sha256 ||
    smoke.booted !== true ||
    smoke.rendererReady !== true ||
    smoke.shutdownComplete !== true
  ) {
    fail('M8C_PACKAGE_SMOKE_INVALID', 'identity-or-lifecycle-mismatch');
  }

  const journey = record(receipt.journey, 'M8C_JOURNEY_INVALID');
  exactKeys(journey, ['initial', 'failedUpdate', 'rollback', 'reupgrade'], 'M8C_JOURNEY_INVALID');
  const initial = record(journey.initial, 'M8C_INITIAL_PHASE_INVALID');
  exactKeys(initial, ['runningVersion', 'supportedDataSetSha256'], 'M8C_INITIAL_PHASE_INVALID');
  const initialVersion = string(initial.runningVersion, 'M8C_INITIAL_PHASE_INVALID');
  if (initialVersion === candidate.version || candidate.version === rollback.version) {
    fail('M8C_CANDIDATE_VERSION_INVALID', 'candidate-must-advance-from-initial-and-rollback');
  }
  const stateDigest = supportedDigest(initial.supportedDataSetSha256, 'INITIAL');

  const failedUpdate = record(journey.failedUpdate, 'M8C_FAILED_UPDATE_PHASE_INVALID');
  exactKeys(
    failedUpdate,
    ['attemptedVersion', 'runningVersion', 'outcome', 'failureReason', 'rollbackOffered', 'supportedDataSetSha256'],
    'M8C_FAILED_UPDATE_PHASE_INVALID'
  );
  if (
    failedUpdate.attemptedVersion !== candidate.version ||
    failedUpdate.runningVersion !== initialVersion ||
    failedUpdate.outcome !== 'failed' ||
    failedUpdate.rollbackOffered !== true ||
    string(failedUpdate.failureReason, 'M8C_FAILED_UPDATE_PHASE_INVALID').length === 0
  ) {
    fail('M8C_FAILED_UPDATE_PHASE_INVALID', 'failure-was-not-observed-fail-closed');
  }

  const rollbackPhase = record(journey.rollback, 'M8C_ROLLBACK_PHASE_INVALID');
  exactKeys(
    rollbackPhase,
    ['runningVersion', 'outcome', 'isolatedState', 'supportedDataSetSha256'],
    'M8C_ROLLBACK_PHASE_INVALID'
  );
  if (
    rollbackPhase.runningVersion !== '0.11.8' ||
    rollbackPhase.outcome !== 'booted' ||
    rollbackPhase.isolatedState !== true
  ) {
    fail('M8C_ROLLBACK_PHASE_INVALID', 'exact-isolated-rollback-not-observed');
  }

  const reupgrade = record(journey.reupgrade, 'M8C_REUPGRADE_PHASE_INVALID');
  exactKeys(
    reupgrade,
    ['runningVersion', 'sourceCommit', 'installedArtifactSha256', 'outcome', 'supportedDataSetSha256'],
    'M8C_REUPGRADE_PHASE_INVALID'
  );
  if (
    reupgrade.runningVersion !== candidate.version ||
    reupgrade.sourceCommit !== candidate.sourceCommit ||
    reupgrade.installedArtifactSha256 !== candidate.sha256 ||
    reupgrade.outcome !== 'booted'
  ) {
    fail('M8C_REUPGRADE_PHASE_INVALID', 'candidate-runtime-identity-mismatch');
  }

  const phaseDigests = [
    supportedDigest(failedUpdate.supportedDataSetSha256, 'FAILED_UPDATE'),
    supportedDigest(rollbackPhase.supportedDataSetSha256, 'ROLLBACK'),
    supportedDigest(reupgrade.supportedDataSetSha256, 'REUPGRADE'),
  ];
  if (phaseDigests.some((phaseDigest) => phaseDigest !== stateDigest)) {
    fail('M8C_SUPPORTED_DATA_LOSS', 'semantic-manifest-changed');
  }

  return receipt as UpdateJourneyReceipt;
}

/**
 * Validate only the internal consistency of a caller-authored journey claim.
 * The return value is explicitly non-authoritative and cannot satisfy final
 * acceptance. Trusted authority is minted only by the canonical attested-file
 * verifier after it independently hashes the packaged artifacts, event log,
 * package smoke, and lifecycle snapshots.
 */
export function validateUpdateJourneyReceipt(input: unknown): ClaimedUpdateJourneyValidation {
  const receipt = validateClaimedUpdateJourney(input);
  return {
    contract: 'wayland-updater-journey-claim-validation/1.0',
    status: 'claimed-unverified',
    authoritative: false,
    candidate: {
      commit: receipt.candidate.sourceCommit,
      target: receipt.candidate.target,
      version: receipt.candidate.version,
      artifactSha256: receipt.candidate.sha256,
    },
    rollback: {
      version: receipt.rollback.version,
      artifactSha256: receipt.rollback.sha256,
    },
  };
}
