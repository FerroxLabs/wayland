/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('updater rollback acceptance runner', () => {
  it('emits a machine-readable blocker instead of passing without a signed candidate', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'wayland-m8c-runner-'));
    temporaryRoots.push(root);
    const outputPath = path.join(root, 'receipt.json');
    const result = spawnSync('bun', ['scripts/run-updater-rollback-reupgrade.ts', '--out', outputPath], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    const receipt = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(receipt).toMatchObject({
      contract: 'wayland-updater-rollback-reupgrade-run/1.0',
      status: 'blocked',
      code: 'M8C_REQUIRED_EVIDENCE_MISSING',
      detail: 'signed-candidate-artifact',
    });
  });

  it('rejects a forged lifecycle receipt even when all claimed phases are internally consistent', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'wayland-m8c-forged-'));
    temporaryRoots.push(root);
    const candidatePath = path.join(root, 'candidate.dmg');
    const rollbackPath = path.join(root, 'rollback.zip');
    const journeyPath = path.join(root, 'forged-journey.json');
    const outputPath = path.join(root, 'result.json');
    writeFileSync(candidatePath, 'candidate');
    writeFileSync(rollbackPath, 'rollback');
    writeFileSync(
      journeyPath,
      JSON.stringify({
        contract: 'wayland-updater-rollback-reupgrade/1.0',
        candidate: {
          role: 'candidate',
          target: 'darwin-arm64',
          version: '0.12.0',
          path: candidatePath,
          sha256: 'a'.repeat(64),
          observedSha256: 'a'.repeat(64),
          size: 9,
          observedSize: 9,
          publisher: {
            gate: 'macos-gatekeeper-developer-id-notarization',
            verified: true,
            verifierExitCode: 0,
            identity: 'Developer ID Application: Ferrox Labs',
          },
          sourceCommit: 'd'.repeat(40),
          updateMetadata: {
            sha512: `${'A'.repeat(86)}==`,
            observedSha512: `${'A'.repeat(86)}==`,
            size: 9,
            observedSize: 9,
          },
          packageSmoke: {
            contract: 'wayland-platform-package-smoke/2',
            target: 'darwin-arm64',
            sourceCommit: 'd'.repeat(40),
            installerDigest: 'a'.repeat(64),
            booted: true,
            rendererReady: true,
            shutdownComplete: true,
          },
        },
        rollback: {
          role: 'rollback',
          target: 'darwin-arm64',
          version: '0.11.8',
          path: rollbackPath,
          sha256: 'b'.repeat(64),
          observedSha256: 'b'.repeat(64),
          size: 8,
          observedSize: 8,
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
          initial: { runningVersion: '0.11.18', supportedDataSetSha256: 'c'.repeat(64) },
          failedUpdate: {
            attemptedVersion: '0.12.0',
            runningVersion: '0.11.18',
            outcome: 'failed',
            failureReason: 'caller-says-so',
            rollbackOffered: true,
            supportedDataSetSha256: 'c'.repeat(64),
          },
          rollback: {
            runningVersion: '0.11.8',
            outcome: 'booted',
            isolatedState: true,
            supportedDataSetSha256: 'c'.repeat(64),
          },
          reupgrade: {
            runningVersion: '0.12.0',
            sourceCommit: 'd'.repeat(40),
            installedArtifactSha256: 'a'.repeat(64),
            outcome: 'booted',
            supportedDataSetSha256: 'c'.repeat(64),
          },
        },
        accepted: true,
      })
    );

    const result = spawnSync(
      'bun',
      [
        'scripts/run-updater-rollback-reupgrade.ts',
        '--candidate-artifact',
        candidatePath,
        '--rollback-artifact',
        rollbackPath,
        '--journey-receipt',
        journeyPath,
        '--out',
        outputPath,
      ],
      { cwd: process.cwd(), encoding: 'utf8' }
    );

    expect(result.status).toBe(1);
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toMatchObject({
      contract: 'wayland-updater-rollback-reupgrade-run/1.0',
      status: 'blocked',
      code: 'M8C_TRUSTED_OBSERVATION_UNAVAILABLE',
    });
  });
});
