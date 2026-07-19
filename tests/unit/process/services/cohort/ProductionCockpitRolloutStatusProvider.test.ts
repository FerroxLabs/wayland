/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cohortInstallationIdHash,
  ProductionCockpitRolloutStatusProvider,
} from '@process/services/cohort/ProductionCockpitRolloutStatusProvider';
import {
  describeCohortRolloutPublicKey,
  issueCohortRolloutAuthorization,
} from '@process/services/cohort/rolloutAuthority';
import { M0B_DAY_MS } from '@process/services/cohort/types';

const NOW = 2_000_000_000_000;
const INSTALLATION = 'installation-alpha';
const WINDOW = { startMs: NOW - 15 * M0B_DAY_MS, endMs: NOW - M0B_DAY_MS };
const BASELINE = `sha256:${'a'.repeat(64)}` as const;
const roots: string[] = [];

async function fixture(installationIdentity = INSTALLATION) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wayland-rollout-provider-'));
  roots.push(root);
  const receiptPath = path.join(root, 'receipt.json');
  const packagedPolicyPath = path.join(root, 'policy.json');
  const keys = generateKeyPairSync('ed25519');
  const trusted = describeCohortRolloutPublicKey('release-key', keys.publicKey);
  const expected = {
    appVersion: 'will-be-overridden',
    releaseTrack: 'stable',
    currentStage: 'internal-dogfood',
    stage: 'invited-alpha',
    cohort: 'knowledge-work',
    installationIdHash: `sha256:${'0'.repeat(64)}`,
    window: WINDOW,
    baselineAggregateDigest: BASELINE,
    decisionOwner: 'Sean Donahoe',
  } as const;
  await writeFile(packagedPolicyPath, JSON.stringify({ expected, trustedPublicKeys: [trusted] }));
  await writeFile(
    receiptPath,
    issueCohortRolloutAuthorization(
      {
        schemaVersion: 1,
        appVersion: '0.12.0-preview.1',
        releaseTrack: 'preview',
        previousStage: 'internal-dogfood',
        stage: 'invited-alpha',
        cohort: 'knowledge-work',
        installationIdHash: cohortInstallationIdHash(installationIdentity),
        window: WINDOW,
        baselineAggregateDigest: BASELINE,
        issuedAt: NOW - 1_000,
        expiresAt: NOW + 60_000,
        decisionOwner: 'Sean Donahoe',
      },
      { keyId: trusted.keyId, privateKey: keys.privateKey }
    )
  );
  return { receiptPath, packagedPolicyPath };
}

function provider(paths: Awaited<ReturnType<typeof fixture>>, installationIdentity = INSTALLATION) {
  return new ProductionCockpitRolloutStatusProvider({
    isPackaged: true,
    appVersion: '0.12.0-preview.1',
    releaseTrack: 'preview',
    installationIdentity,
    ...paths,
  });
}

describe('ProductionCockpitRolloutStatusProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('allows unpackaged internal dogfood without reading release authority files', async () => {
    const subject = new ProductionCockpitRolloutStatusProvider({
      isPackaged: false,
      appVersion: 'dev',
      releaseTrack: 'preview',
      installationIdentity: INSTALLATION,
      receiptPath: '/missing/receipt',
      packagedPolicyPath: '/missing/policy',
    });
    await expect(subject.status()).resolves.toEqual({
      eligible: true,
      stage: 'internal-dogfood',
      source: 'development',
      reason: 'development-build',
    });
  });

  it('accepts only a receipt bound to packaged policy and this installation', async () => {
    const paths = await fixture();
    await expect(provider(paths).status()).resolves.toEqual({
      eligible: true,
      stage: 'invited-alpha',
      source: 'signed-authority',
      reason: 'authorized',
    });
    await expect(provider(paths, 'copied-to-another-installation').status()).resolves.toEqual({
      eligible: false,
      stage: null,
      source: 'none',
      reason: 'evidence-gate-failed',
    });
  });

  it('fails closed when receipt or packaged policy is absent or corrupt', async () => {
    const paths = await fixture();
    await rm(paths.receiptPath);
    await expect(provider(paths).status()).resolves.toMatchObject({ eligible: false, reason: 'authority-missing' });
    await writeFile(paths.receiptPath, '{}');
    await writeFile(paths.packagedPolicyPath, '{broken');
    await expect(provider(paths).status()).resolves.toMatchObject({ eligible: false, reason: 'authority-invalid' });
  });
});
