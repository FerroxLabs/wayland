/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { validateUpdateJourneyReceipt, type UpdateJourneyReceipt } from '@/process/services/updateAcceptanceReceipt';

const CANDIDATE_SHA = 'a'.repeat(64);
const ROLLBACK_SHA = 'b'.repeat(64);
const STATE_SHA = 'c'.repeat(64);
const COMMIT = 'd'.repeat(40);
const SHA512 = `${'A'.repeat(86)}==`;

function validReceipt(): UpdateJourneyReceipt {
  return {
    contract: 'wayland-updater-rollback-reupgrade/1.0',
    candidate: {
      role: 'candidate',
      target: 'darwin-arm64',
      version: '0.12.0',
      path: '/evidence/Wayland-0.12.0-arm64.dmg',
      sha256: CANDIDATE_SHA,
      observedSha256: CANDIDATE_SHA,
      size: 100,
      observedSize: 100,
      publisher: {
        gate: 'macos-gatekeeper-developer-id-notarization',
        verified: true,
        verifierExitCode: 0,
        identity: 'Developer ID Application: Ferrox Labs',
      },
      sourceCommit: COMMIT,
      updateMetadata: { sha512: SHA512, observedSha512: SHA512, size: 100, observedSize: 100 },
      packageSmoke: {
        contract: 'wayland-platform-package-smoke/2',
        target: 'darwin-arm64',
        sourceCommit: COMMIT,
        installerDigest: CANDIDATE_SHA,
        booted: true,
        rendererReady: true,
        shutdownComplete: true,
      },
    },
    rollback: {
      role: 'rollback',
      target: 'darwin-arm64',
      version: '0.11.8',
      path: '/evidence/Wayland-0.11.8-arm64-mac.zip',
      sha256: ROLLBACK_SHA,
      observedSha256: ROLLBACK_SHA,
      size: 90,
      observedSize: 90,
      publisher: {
        gate: 'macos-gatekeeper-developer-id-notarization',
        verified: true,
        verifierExitCode: 0,
        identity: 'Developer ID Application: Ferrox Labs',
      },
      releaseTag: 'v0.11.8',
      catalogVerified: true,
    },
    journey: {
      initial: { runningVersion: '0.11.18', supportedDataSetSha256: STATE_SHA },
      failedUpdate: {
        attemptedVersion: '0.12.0',
        runningVersion: '0.11.18',
        outcome: 'failed',
        failureReason: 'injected-silent-noop',
        rollbackOffered: true,
        supportedDataSetSha256: STATE_SHA,
      },
      rollback: {
        runningVersion: '0.11.8',
        outcome: 'booted',
        isolatedState: true,
        supportedDataSetSha256: STATE_SHA,
      },
      reupgrade: {
        runningVersion: '0.12.0',
        sourceCommit: COMMIT,
        installedArtifactSha256: CANDIDATE_SHA,
        outcome: 'booted',
        supportedDataSetSha256: STATE_SHA,
      },
    },
    accepted: true,
  };
}

function clone(): UpdateJourneyReceipt {
  return structuredClone(validReceipt());
}

describe('signed updater rollback and re-upgrade receipt', () => {
  it('accepts one fully correlated observed journey', () => {
    expect(validateUpdateJourneyReceipt(validReceipt())).toEqual(validReceipt());
  });

  it('rejects a model/self-asserted publisher gate', () => {
    const receipt = clone();
    receipt.candidate.publisher.gate = 'model-claims-signed' as never;
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/M8C_CANDIDATE_PUBLISHER_INVALID:unsupported-gate/);
  });

  it('rejects a publisher verifier that did not exit cleanly', () => {
    const receipt = clone();
    receipt.candidate.publisher.verifierExitCode = 1 as never;
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/native-verification-not-proven/);
  });

  it('rejects an unexpected publisher identity', () => {
    const receipt = clone();
    receipt.candidate.publisher.identity = 'Developer ID Application: Somebody Else';
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/unexpected-publisher-identity/);
  });

  it('rejects a native publisher gate from the wrong target', () => {
    const receipt = clone();
    receipt.candidate.target = 'win32-x64';
    receipt.candidate.packageSmoke.target = 'win32-x64';
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/gate-target-mismatch/);
  });

  it('rejects the digest-only v0.11.8 Linux rollback as unsigned', () => {
    const receipt = clone();
    receipt.candidate.target = 'linux-x64';
    receipt.candidate.publisher.gate = 'linux-detached-signature-pinned-keyring';
    receipt.candidate.packageSmoke.target = 'linux-x64';
    receipt.rollback.target = 'linux-x64';
    receipt.rollback.publisher.gate = 'linux-detached-signature-pinned-keyring';
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/M8C_ROLLBACK_PUBLISHER_UNAVAILABLE/);
  });

  it('rejects candidate artifact digest drift', () => {
    const receipt = clone();
    receipt.candidate.observedSha256 = 'e'.repeat(64);
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/M8C_CANDIDATE_DIGEST_MISMATCH/);
  });

  it('rejects update metadata that names different bytes', () => {
    const receipt = clone();
    receipt.candidate.updateMetadata.observedSha512 = `${'B'.repeat(86)}==`;
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/M8C_UPDATE_METADATA_MISMATCH/);
  });

  it('rejects a package smoke from a sibling commit', () => {
    const receipt = clone();
    receipt.candidate.packageSmoke.sourceCommit = 'e'.repeat(40);
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/M8C_PACKAGE_SMOKE_INVALID/);
  });

  it('rejects a failed update that actually advanced the runtime', () => {
    const receipt = clone();
    receipt.journey.failedUpdate.runningVersion = '0.12.0';
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/M8C_FAILED_UPDATE_PHASE_INVALID/);
  });

  it('rejects rollback to anything except the compiled v0.11.8 identity', () => {
    const receipt = clone();
    receipt.journey.rollback.runningVersion = '0.11.7' as never;
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/M8C_ROLLBACK_PHASE_INVALID/);
  });

  it('rejects re-upgrade runtime identity drift', () => {
    const receipt = clone();
    receipt.journey.reupgrade.sourceCommit = 'e'.repeat(40);
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/M8C_REUPGRADE_PHASE_INVALID/);
  });

  it('rejects semantic user-data loss at any phase', () => {
    const receipt = clone();
    receipt.journey.reupgrade.supportedDataSetSha256 = 'e'.repeat(64);
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/M8C_SUPPORTED_DATA_LOSS/);
  });

  it('fails closed on unknown critical fields', () => {
    const receipt = clone();
    (receipt.candidate.publisher as unknown as Record<string, unknown>).claimedByModel = true;
    expect(() => validateUpdateJourneyReceipt(receipt)).toThrow(/unknown-critical-field:claimedByModel/);
  });
});
