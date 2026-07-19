/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateKeyPairSync } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createCohortProductionController,
  type CohortAssignmentStore,
  type CohortConsentStore,
  type CohortProductionEnvironment,
} from '@process/services/cohort/ProductionCohortController';
import { cohortInstallationIdHash } from '@process/services/cohort/ProductionCockpitRolloutStatusProvider';
import {
  describeCohortRolloutPublicKey,
  issueCohortRolloutAuthorization,
} from '@process/services/cohort/rolloutAuthority';
import { M0B_COHORTS, M0B_DAY_MS } from '@process/services/cohort/types';

const NOW = Date.UTC(2026, 6, 19);
const END = NOW + 14 * M0B_DAY_MS;
const roots: string[] = [];

const disabledConsent = Object.freeze({
  schemaVersion: 1,
  enabled: false,
  acceptedAtMs: null,
  windowStartMs: null,
  windowEndMs: null,
});

const enabledConsent = Object.freeze({
  schemaVersion: 1,
  enabled: true,
  acceptedAtMs: NOW,
  windowStartMs: NOW,
  windowEndMs: END,
});

function assignment(cohort: (typeof M0B_COHORTS)[number], window: boolean = false) {
  return {
    schemaVersion: 2,
    classifierVersion: 1,
    requestedCohort: cohort,
    effectiveCohort: cohort,
    classifiedAtMs: NOW,
    windowStartMs: window ? NOW : null,
    windowEndMs: window ? END : null,
  } as const;
}

async function fixture(
  initialConsent: unknown = undefined,
  initialAssignment: unknown = undefined,
  now: () => number = () => NOW,
  overrides: Partial<
    Pick<CohortProductionEnvironment, 'isPackaged' | 'appVersion' | 'releaseTrack' | 'installIdentity'>
  > = {}
) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-production-cohort-'));
  roots.push(root);
  let persistedConsent = initialConsent;
  let persistedAssignment = initialAssignment;
  const consentStore: CohortConsentStore = {
    get: vi.fn(async () => persistedConsent),
    set: vi.fn(async (value) => {
      persistedConsent = structuredClone(value);
    }),
  };
  const assignmentStore: CohortAssignmentStore = {
    get: vi.fn(async () => persistedAssignment),
    set: vi.fn(async (value) => {
      persistedAssignment = structuredClone(value);
    }),
  };
  const environment: CohortProductionEnvironment = {
    userDataPath: path.join(root, 'user-data'),
    resourcesPath: path.join(root, 'resources'),
    isPackaged: false,
    appVersion: '0.12.0-dev',
    releaseTrack: 'preview',
    installIdentity: 'install-alpha',
    consentStore,
    assignmentStore,
    now,
    ...overrides,
  };
  return {
    root,
    consentStore,
    assignmentStore,
    environment,
    persistedConsent: () => persistedConsent,
    persistedAssignment: () => persistedAssignment,
    controller: await createCohortProductionController(environment),
  };
}

async function installRolloutAuthority(
  environment: CohortProductionEnvironment,
  scope: Readonly<{
    cohort: (typeof M0B_COHORTS)[number];
    window: Readonly<{ startMs: number; endMs: number }>;
    now: number;
  }>
): Promise<void> {
  const keys = generateKeyPairSync('ed25519');
  const trusted = describeCohortRolloutPublicKey('release-key', keys.publicKey);
  const baselineAggregateDigest = `sha256:${'a'.repeat(64)}` as const;
  const expected = {
    appVersion: environment.appVersion,
    releaseTrack: environment.releaseTrack,
    currentStage: 'internal-dogfood',
    stage: 'invited-alpha',
    cohort: scope.cohort,
    installationIdHash: cohortInstallationIdHash(environment.installIdentity),
    window: scope.window,
    baselineAggregateDigest,
    decisionOwner: 'Sean Donahoe',
  } as const;
  await fs.mkdir(path.join(environment.resourcesPath, 'cockpit-rollout'), { recursive: true });
  await fs.mkdir(path.join(environment.userDataPath, 'cockpit-rollout'), { recursive: true });
  await fs.writeFile(
    path.join(environment.resourcesPath, 'cockpit-rollout', 'policy.json'),
    JSON.stringify({ expected, trustedPublicKeys: [trusted] })
  );
  await fs.writeFile(
    path.join(environment.userDataPath, 'cockpit-rollout', 'authorization.json'),
    issueCohortRolloutAuthorization(
      {
        schemaVersion: 1,
        appVersion: environment.appVersion,
        releaseTrack: environment.releaseTrack,
        previousStage: 'internal-dogfood',
        stage: 'invited-alpha',
        cohort: scope.cohort,
        installationIdHash: cohortInstallationIdHash(environment.installIdentity),
        window: scope.window,
        baselineAggregateDigest,
        issuedAt: scope.now - 1_000,
        expiresAt: scope.now + 60_000,
        decisionOwner: 'Sean Donahoe',
      },
      { keyId: trusted.keyId, privateKey: keys.privateKey }
    )
  );
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('ProductionCohortController cohort authority', () => {
  it('[CR-01] rejects a valid-looking unsigned persisted assignment after restart', async () => {
    const subject = await fixture(disabledConsent, assignment('operator'));

    await expect(subject.controller.assignmentStatus()).resolves.toEqual({
      available: false,
      effectiveCohort: null,
      classifiedAtMs: null,
      observationState: 'unavailable',
    });
  });

  it('starts unavailable and cannot begin observation without classification', async () => {
    const subject = await fixture({ enabled: true, acceptedAtMs: NOW, extraAuthority: true });

    await expect(subject.controller.assignmentStatus()).resolves.toEqual({
      available: false,
      effectiveCohort: null,
      classifiedAtMs: null,
      observationState: 'unavailable',
    });
    await expect(subject.controller.setConsent(true)).resolves.toMatchObject({ status: 'assignment-unavailable' });
    await expect(subject.controller.recordShellReturn('reliability')).resolves.toEqual({
      status: 'consent-disabled',
    });
    await expect(fs.stat(path.join(subject.environment.userDataPath, 'cohort-evidence'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it.each(M0B_COHORTS)('classifies and persists the closed %s assignment', async (cohort) => {
    const subject = await fixture(disabledConsent);

    await expect(subject.controller.requestAssignment(cohort)).resolves.toEqual({
      status: 'classified',
      assignment: {
        available: true,
        effectiveCohort: cohort,
        classifiedAtMs: NOW,
        observationState: 'ready',
      },
    });
    expect(subject.persistedAssignment()).toEqual(assignment(cohort));

    const restarted = await createCohortProductionController(subject.environment);
    await expect(restarted.assignmentStatus()).resolves.toMatchObject({
      available: true,
      effectiveCohort: cohort,
      observationState: 'ready',
    });
  });

  it('migrates only the exact prior schema while preserving assignment and observation window', async () => {
    const prior = {
      schemaVersion: 1,
      cohort: 'operator',
      classifiedAtMs: NOW,
      windowStartMs: NOW,
      windowEndMs: END,
    } as const;
    const subject = await fixture(enabledConsent, prior);

    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({
      available: true,
      effectiveCohort: 'operator',
      observationState: 'active',
    });
    expect(subject.persistedAssignment()).toEqual(assignment('operator', true));
    expect(subject.assignmentStore.set).toHaveBeenCalledTimes(1);
  });

  it.each([
    undefined,
    { schemaVersion: 3, classifierVersion: 1, requestedCohort: 'novice', effectiveCohort: 'novice' },
    { ...assignment('novice'), windowEndMs: undefined },
    { ...assignment('novice'), effectiveCohort: 'developer' },
    { ...assignment('novice'), requestedCohort: 'forged' },
    { ...assignment('novice'), extraAuthority: true },
    { ...assignment('novice', true), windowEndMs: END + 1 },
  ])('fails closed on absent, unknown, partial, contradictory, or forged assignment %#', async (candidate) => {
    const subject = await fixture(disabledConsent, candidate);
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({
      available: false,
      effectiveCohort: null,
      observationState: 'unavailable',
    });
  });

  it('rejects malformed classifier requests inside the main-process authority', async () => {
    const subject = await fixture(disabledConsent);
    await expect(subject.controller.requestAssignment({ cohort: 'developer' })).resolves.toMatchObject({
      status: 'invalid-request',
      assignment: { available: false },
    });
    expect(subject.assignmentStore.set).not.toHaveBeenCalled();
  });

  it('[CR-03] does not let two renderer literals directly select two effective cohorts', async () => {
    const novice = await fixture(disabledConsent);
    const operator = await fixture(disabledConsent);

    const noviceResult = await novice.controller.requestAssignment('novice');
    const operatorResult = await operator.controller.requestAssignment('operator');

    expect({
      novice: noviceResult.assignment.effectiveCohort,
      operator: operatorResult.assignment.effectiveCohort,
    }).toEqual({
      novice: operatorResult.assignment.effectiveCohort,
      operator: operatorResult.assignment.effectiveCohort,
    });
  });
});

describe('ProductionCohortController observation lifecycle', () => {
  it('[CR-02] rejects partial assignment/consent persistence when rollback also fails', async () => {
    const subject = await fixture(disabledConsent, assignment('novice'));
    const persistAssignment = vi.mocked(subject.assignmentStore.set).getMockImplementation();
    if (!persistAssignment) throw new Error('test assignment store has no implementation');
    vi.mocked(subject.assignmentStore.set)
      .mockImplementationOnce(persistAssignment)
      .mockRejectedValueOnce(new Error('rollback unavailable'));
    vi.mocked(subject.consentStore.set).mockRejectedValueOnce(new Error('consent publication unavailable'));

    await expect(subject.controller.setConsent(true)).resolves.toMatchObject({ status: 'storage-error' });
    const restarted = await createCohortProductionController(subject.environment);

    await expect(restarted.assignmentStatus()).resolves.toEqual({
      available: false,
      effectiveCohort: null,
      classifiedAtMs: null,
      observationState: 'unavailable',
    });
  });

  it('persists one exact 14-day window and records events with the effective assignment', async () => {
    const subject = await fixture(disabledConsent);
    await subject.controller.requestAssignment('developer');

    await expect(subject.controller.setConsent(true)).resolves.toEqual({
      status: 'enabled',
      consent: {
        enabled: true,
        acceptedAtMs: NOW,
        observationWindow: { startMs: NOW, endMs: END },
      },
    });
    expect(subject.persistedConsent()).toEqual(enabledConsent);
    expect(subject.persistedAssignment()).toEqual(assignment('developer', true));

    await expect(subject.controller.recordShellReturn('missing-capability')).resolves.toEqual({ status: 'recorded' });
    const windows = await fs.readdir(path.join(subject.environment.userDataPath, 'cohort-evidence'));
    const eventFiles = await fs.readdir(path.join(subject.environment.userDataPath, 'cohort-evidence', windows[0]));
    const eventText = await Promise.all(
      eventFiles
        .filter((entry) => entry.endsWith('.event.json'))
        .map((entry) =>
          fs.readFile(path.join(subject.environment.userDataPath, 'cohort-evidence', windows[0], entry), 'utf8')
        )
    );
    expect(eventText.join('\n')).not.toMatch(/prompt|message|filename|path|url|toolArgument/i);
    expect(eventText.join('\n')).toContain('"cohort":"developer"');
    expect(eventText.join('\n')).toContain('missing-capability');
  });

  it('preserves the original window lock after withdrawal and rejects disable-then-relabel', async () => {
    const subject = await fixture(disabledConsent);
    await subject.controller.requestAssignment('knowledge-work');
    await subject.controller.setConsent(true);

    await expect(subject.controller.setConsent(false)).resolves.toMatchObject({ status: 'disabled' });
    expect(subject.persistedAssignment()).toEqual(assignment('knowledge-work', true));
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({
      effectiveCohort: 'knowledge-work',
      observationState: 'locked',
    });
    await expect(subject.controller.requestAssignment('operator')).resolves.toMatchObject({
      status: 'window-active',
      assignment: { effectiveCohort: 'knowledge-work', observationState: 'locked' },
    });
    expect(subject.persistedAssignment()).toEqual(assignment('knowledge-work', true));

    await expect(subject.controller.setConsent(true)).resolves.toMatchObject({
      status: 'enabled',
      consent: { observationWindow: { startMs: NOW, endMs: END } },
    });
  });

  it('rejects relabeling after the window ends while consent/runtime state still exists', async () => {
    const subject = await fixture(enabledConsent, assignment('developer', true), () => END + 1);
    await expect(subject.controller.requestAssignment('operator')).resolves.toMatchObject({
      status: 'window-active',
      assignment: { effectiveCohort: 'developer', observationState: 'active' },
    });
    expect(subject.persistedAssignment()).toEqual(assignment('developer', true));
    expect(subject.assignmentStore.set).not.toHaveBeenCalled();
  });

  it('[CR-04] never replaces an expired observation window through disable and re-enable', async () => {
    let clock = END + 1;
    const subject = await fixture(enabledConsent, assignment('developer', true), () => clock);

    await subject.controller.setConsent(false);
    clock = END + 2;
    await subject.controller.setConsent(true);

    expect(subject.persistedAssignment()).toEqual(assignment('developer', true));
    await expect(subject.controller.consentStatus()).resolves.toMatchObject({
      observationWindow: { startMs: NOW, endMs: END },
    });
  });

  it('[CR-05] rejects signed rollout receipts outside the persisted cohort and window scope', async () => {
    const rolloutNow = NOW + 60 * M0B_DAY_MS;
    const currentWindow = {
      startMs: rolloutNow - 15 * M0B_DAY_MS,
      endMs: rolloutNow - M0B_DAY_MS,
    };
    const currentAssignment = {
      ...assignment('operator', true),
      classifiedAtMs: currentWindow.startMs,
      windowStartMs: currentWindow.startMs,
      windowEndMs: currentWindow.endMs,
    };
    const signedScopes = [
      { cohort: 'knowledge-work' as const, window: currentWindow },
      {
        cohort: 'operator' as const,
        window: {
          startMs: currentWindow.startMs - M0B_DAY_MS,
          endMs: currentWindow.endMs - M0B_DAY_MS,
        },
      },
      {
        cohort: 'operator' as const,
        window: {
          startMs: currentWindow.startMs + M0B_DAY_MS,
          endMs: currentWindow.endMs + M0B_DAY_MS,
        },
      },
    ];
    vi.useFakeTimers();
    vi.setSystemTime(rolloutNow);
    try {
      const eligibility: boolean[] = [];
      for (const scope of signedScopes) {
        // Each controller owns the persisted current scope; the signed authority deliberately differs by cohort or window.
        // oxlint-disable-next-line no-await-in-loop
        const subject = await fixture(disabledConsent, currentAssignment, () => rolloutNow, {
          isPackaged: true,
          appVersion: '0.12.0-preview.1',
          releaseTrack: 'preview',
        });
        // oxlint-disable-next-line no-await-in-loop
        await installRolloutAuthority(subject.environment, { ...scope, now: rolloutNow });
        // oxlint-disable-next-line no-await-in-loop
        eligibility.push((await subject.controller.rolloutStatus()).eligible);
      }
      expect(eligibility).toEqual([false, false, false]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('[WR-01] treats malformed and unreadable consent as unavailable rather than disabled', async () => {
    const malformed = await fixture({ ...disabledConsent, extraAuthority: true }, assignment('developer'));
    const unreadable = await fixture(disabledConsent, assignment('developer'));
    vi.mocked(unreadable.consentStore.get).mockRejectedValueOnce(new Error('consent unreadable'));
    const unreadableRestart = await createCohortProductionController(unreadable.environment);
    const [malformedStatus, unreadableStatus] = await Promise.all([
      malformed.controller.assignmentStatus(),
      unreadableRestart.assignmentStatus(),
    ]);

    expect({
      malformedAvailable: malformedStatus.available,
      unreadableAvailable: unreadableStatus.available,
    }).toEqual({
      malformedAvailable: false,
      unreadableAvailable: false,
    });
  });

  it('fails closed when assignment and consent records disagree', async () => {
    const subject = await fixture(enabledConsent, assignment('operator'));
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({ available: false });
    await expect(subject.controller.consentStatus()).resolves.toMatchObject({ enabled: false });
  });

  it('serializes revocation ahead of event writes and preserves memory when persistence fails', async () => {
    const subject = await fixture(disabledConsent);
    await subject.controller.requestAssignment('novice');
    await subject.controller.setConsent(true);

    const revoked = subject.controller.setConsent(false);
    const afterRevocation = subject.controller.recordShellReturn('reliability');
    await expect(revoked).resolves.toMatchObject({ status: 'disabled' });
    await expect(afterRevocation).resolves.toEqual({ status: 'consent-disabled' });

    vi.mocked(subject.consentStore.set).mockRejectedValueOnce(new Error('disk unavailable'));
    await expect(subject.controller.setConsent(true)).resolves.toEqual({
      status: 'storage-error',
      consent: { enabled: false, acceptedAtMs: null, observationWindow: null },
    });
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({
      effectiveCohort: 'novice',
      observationState: 'locked',
    });
  });

  it('exposes unpackaged dogfood eligibility without weakening packaged authority', async () => {
    const subject = await fixture();
    await expect(subject.controller.rolloutStatus()).resolves.toEqual({
      eligible: true,
      stage: 'internal-dogfood',
      source: 'development',
      reason: 'development-build',
    });
  });
});
