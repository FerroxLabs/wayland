/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

import type { WaylandReleaseTrack } from '@/common/releaseTrack';
import type { CockpitRolloutStatus } from '@/common/types/cohortRollout';
import type { CockpitRolloutStatusProvider } from './CohortEvidenceRuntime';
import { evaluateCohortRolloutEligibility, type CohortRolloutVerificationPolicy } from './rolloutAuthority';

export type ProductionCockpitRolloutStatusProviderInput = Readonly<{
  isPackaged: boolean;
  appVersion: string;
  releaseTrack: WaylandReleaseTrack;
  installationIdentity: string;
  receiptPath: string;
  packagedPolicyPath: string;
}>;

const DEVELOPMENT_STATUS: CockpitRolloutStatus = Object.freeze({
  eligible: true,
  stage: 'internal-dogfood',
  source: 'development',
  reason: 'development-build',
});

export function cohortInstallationIdHash(installationIdentity: string): `sha256:${string}` {
  return `sha256:${createHash('sha256')
    .update(`wayland-cockpit-rollout-installation/1\0${installationIdentity}`)
    .digest('hex')}`;
}

/** Packaged builds fail closed unless a code-signed policy accepts an installation-bound receipt. */
export class ProductionCockpitRolloutStatusProvider implements CockpitRolloutStatusProvider {
  constructor(private readonly input: ProductionCockpitRolloutStatusProviderInput) {}

  async status(): Promise<CockpitRolloutStatus> {
    if (!this.input.isPackaged) return DEVELOPMENT_STATUS;

    let receipt: Uint8Array;
    let rawPolicy: unknown;
    try {
      [receipt, rawPolicy] = await Promise.all([
        fs.readFile(this.input.receiptPath),
        fs.readFile(this.input.packagedPolicyPath, 'utf8').then((value) => JSON.parse(value) as unknown),
      ]);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return denied('authority-missing');
      return denied('authority-invalid');
    }

    if (!isRecord(rawPolicy) || !isRecord(rawPolicy.expected)) return denied('authority-invalid');
    const policy = {
      ...rawPolicy,
      expected: {
        ...rawPolicy.expected,
        appVersion: this.input.appVersion,
        releaseTrack: this.input.releaseTrack,
        installationIdHash: cohortInstallationIdHash(this.input.installationIdentity),
      },
    } as CohortRolloutVerificationPolicy;
    const decision = evaluateCohortRolloutEligibility(receipt, policy);
    if (decision.eligible === true) {
      return Object.freeze({
        eligible: true,
        stage: decision.stage,
        source: 'signed-authority',
        reason: 'authorized',
      });
    }

    switch (decision.reason) {
      case 'expired':
        return denied('authority-expired');
      case 'scope-mismatch':
      case 'invalid-transition':
        return denied('evidence-gate-failed');
      default:
        return denied('authority-invalid');
    }
  }
}

function denied(reason: CockpitRolloutStatus['reason']): CockpitRolloutStatus {
  return Object.freeze({ eligible: false, stage: null, source: 'none', reason });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
