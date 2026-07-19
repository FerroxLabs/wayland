/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac, generateKeyPairSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createCohortProductionController,
  type CohortAuthorityStore,
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
const INVALID_AUTHORITY_TIMES = [Number.NaN, -1, 1.5, Number.MAX_SAFE_INTEGER + 1] as const;
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
    Pick<
      CohortProductionEnvironment,
      | 'isPackaged'
      | 'appVersion'
      | 'releaseTrack'
      | 'installIdentity'
      | 'confirmAssignment'
      | 'acceptedEvidence'
      | 'retireLegacy'
      | 'newAuthorityId'
      | 'newWindowId'
    >
  > & { seedAuthenticated?: boolean } = {}
) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-production-cohort-'));
  roots.push(root);
  let persistedConsent = initialConsent;
  let persistedAssignment = initialAssignment;
  let persistedAuthority: unknown;
  let persistedLineage: unknown;
  let persistedMigrationMarker: unknown;
  let persistedStableAuthority: unknown;
  const fixtureSecret = Buffer.from('01-01-hostile-fixture-authority-key');
  const protectAuthority = (plaintext: string): string => {
    const payload = Buffer.from(plaintext).toString('base64url');
    const mac = createHmac('sha256', fixtureSecret).update(payload).digest('base64url');
    return `test-auth:v1:${payload}.${mac}`;
  };
  const unprotectAuthority = (ciphertext: string): string => {
    const match = /^test-auth:v1:([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(ciphertext);
    if (!match) throw new Error('invalid authority envelope');
    const expected = createHmac('sha256', fixtureSecret).update(match[1]).digest();
    const observed = Buffer.from(match[2], 'base64url');
    if (expected.length !== observed.length || !timingSafeEqual(expected, observed))
      throw new Error('forged authority');
    return Buffer.from(match[1], 'base64url').toString('utf8');
  };
  const exactDisabled = JSON.stringify(initialConsent) === JSON.stringify(disabledConsent);
  const exactEnabled = JSON.stringify(initialConsent) === JSON.stringify(enabledConsent);
  const currentAssignment = initialAssignment as ReturnType<typeof assignment> | undefined;
  const exactAssignmentKeys = [
    'classifiedAtMs',
    'classifierVersion',
    'effectiveCohort',
    'requestedCohort',
    'schemaVersion',
    'windowEndMs',
    'windowStartMs',
  ].toSorted();
  const matches =
    currentAssignment?.schemaVersion === 2 &&
    Object.keys(currentAssignment).toSorted().join('\0') === exactAssignmentKeys.join('\0') &&
    currentAssignment.classifierVersion === 1 &&
    currentAssignment.requestedCohort === currentAssignment.effectiveCohort &&
    ((exactDisabled && currentAssignment.windowStartMs === null) ||
      (exactDisabled && currentAssignment.windowStartMs !== null) ||
      (exactEnabled && currentAssignment.windowStartMs === NOW && currentAssignment.windowEndMs === END));
  const seedAuthenticated = !('seedAuthenticated' in overrides) || overrides.seedAuthenticated !== false;
  if (matches && seedAuthenticated && currentAssignment) {
    persistedAuthority = protectAuthority(
      JSON.stringify({
        schemaVersion: 2,
        authority: {
          schemaVersion: 3,
          generation: 1,
          installationIdHash: cohortInstallationIdHash(overrides.installIdentity ?? 'install-alpha'),
          authorityId: 'authority-fixture',
          classifierVersion: 2,
          requestedCohort: currentAssignment.requestedCohort,
          effectiveCohort: currentAssignment.effectiveCohort,
          classifiedAtMs: currentAssignment.classifiedAtMs,
          consentEnabled: exactEnabled,
          acceptedAtMs: currentAssignment.windowStartMs,
          windowId: currentAssignment.windowStartMs === null ? null : 'window-fixture',
          windowStartMs: currentAssignment.windowStartMs,
          windowEndMs: currentAssignment.windowEndMs,
        },
      })
    );
    persistedLineage = protectAuthority(
      JSON.stringify({
        schemaVersion: 1,
        installationIdHash: cohortInstallationIdHash(overrides.installIdentity ?? 'install-alpha'),
        authorityId: 'authority-fixture',
        generation: 1,
      })
    );
    persistedMigrationMarker = protectAuthority(
      JSON.stringify({
        schemaVersion: 1,
        installationIdHash: cohortInstallationIdHash(overrides.installIdentity ?? 'install-alpha'),
        consumed: true,
      })
    );
    persistedStableAuthority = protectAuthority(
      JSON.stringify({
        schemaVersion: 1,
        installationIdHash: cohortInstallationIdHash(overrides.installIdentity ?? 'install-alpha'),
        migrationConsumed: true,
        authorityId: 'authority-fixture',
        generation: 1,
      })
    );
  }
  const consentStore: CohortConsentStore = {
    get: vi.fn(async () => persistedConsent),
  };
  const assignmentStore: CohortAssignmentStore = {
    get: vi.fn(async () => persistedAssignment),
  };
  const authorityStore: CohortAuthorityStore = {
    get: vi.fn(async () => persistedAuthority),
    set: vi.fn(async (value) => {
      persistedAuthority = value;
      const record = JSON.parse(unprotectAuthority(value)) as { authority: Record<string, unknown> | null };
      const parsed = record.authority ?? {};
      persistedConsent = parsed.consentEnabled
        ? {
            schemaVersion: 1,
            enabled: true,
            acceptedAtMs: parsed.acceptedAtMs,
            windowStartMs: parsed.windowStartMs,
            windowEndMs: parsed.windowEndMs,
          }
        : disabledConsent;
      persistedAssignment = {
        schemaVersion: 2,
        classifierVersion: 1,
        requestedCohort: parsed.requestedCohort,
        effectiveCohort: parsed.effectiveCohort,
        classifiedAtMs: parsed.classifiedAtMs,
        windowStartMs: parsed.windowStartMs,
        windowEndMs: parsed.windowEndMs,
      };
    }),
  };
  const lineageStore: CohortAuthorityStore = {
    get: vi.fn(async () => persistedLineage),
    set: vi.fn(async (value) => {
      persistedLineage = value;
    }),
  };
  const migrationMarkerStore: CohortAuthorityStore = {
    get: vi.fn(async () => persistedMigrationMarker),
    set: vi.fn(async (value) => {
      persistedMigrationMarker = value;
    }),
  };
  const stableAuthorityStore: CohortAuthorityStore = {
    get: vi.fn(async () => persistedStableAuthority),
    set: vi.fn(async (value) => {
      persistedStableAuthority = value;
    }),
  };
  const { seedAuthenticated: _seedAuthenticated, ...environmentOverrides } = overrides;
  const environment: CohortProductionEnvironment = {
    userDataPath: path.join(root, 'user-data'),
    resourcesPath: path.join(root, 'resources'),
    isPackaged: false,
    appVersion: '0.12.0-dev',
    releaseTrack: 'preview',
    installIdentity: 'install-alpha',
    authorityStore,
    lineageStore,
    migrationMarkerStore,
    stableAuthorityStore,
    consentStore,
    assignmentStore,
    protectAuthority,
    unprotectAuthority,
    confirmAssignment: vi.fn(async () => true),
    newAuthorityId: () => 'authority-fixture',
    newWindowId: () => 'window-fixture',
    now,
    ...environmentOverrides,
  };
  const controller = await createCohortProductionController(environment);
  vi.mocked(authorityStore.set).mockClear();
  vi.mocked(lineageStore.set).mockClear();
  vi.mocked(migrationMarkerStore.set).mockClear();
  vi.mocked(stableAuthorityStore.set).mockClear();
  return {
    root,
    consentStore,
    assignmentStore,
    authorityStore,
    lineageStore,
    migrationMarkerStore,
    stableAuthorityStore,
    environment,
    persistedConsent: () => persistedConsent,
    persistedAssignment: () => persistedAssignment,
    persistedAuthority: () => persistedAuthority,
    persistedLineage: () => persistedLineage,
    persistedMigrationMarker: () => persistedMigrationMarker,
    persistedStableAuthority: () => persistedStableAuthority,
    setRawAuthority: (value: unknown) => {
      persistedAuthority = value;
    },
    setRawLineage: (value: unknown) => {
      persistedLineage = value;
    },
    setRawMigrationMarker: (value: unknown) => {
      persistedMigrationMarker = value;
    },
    setRawStableAuthority: (value: unknown) => {
      persistedStableAuthority = value;
    },
    setLegacy: (consent: unknown, assignmentValue: unknown) => {
      persistedConsent = consent;
      persistedAssignment = assignmentValue;
    },
    controller,
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
    authorityId: 'authority-fixture',
    authorityGeneration: 1,
    windowId: 'window-fixture',
    window: scope.window,
    baselineAggregateDigest,
    evidenceCompletedAtMs: scope.window.endMs,
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
        schemaVersion: 2,
        appVersion: environment.appVersion,
        releaseTrack: environment.releaseTrack,
        previousStage: 'internal-dogfood',
        stage: 'invited-alpha',
        cohort: scope.cohort,
        installationIdHash: cohortInstallationIdHash(environment.installIdentity),
        authorityId: 'authority-fixture',
        authorityGeneration: 1,
        windowId: 'window-fixture',
        window: scope.window,
        baselineAggregateDigest,
        evidenceCompletedAtMs: scope.window.endMs,
        issuedAt: Math.max(scope.window.endMs, scope.now - 1_000),
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
    const subject = await fixture(disabledConsent, assignment('operator'), () => NOW, { seedAuthenticated: false });

    await expect(subject.controller.assignmentStatus()).resolves.toEqual({
      available: false,
      effectiveCohort: null,
      classifiedAtMs: null,
      observationState: 'unavailable',
    });
  });

  it('rejects an authenticated authority envelope after any byte is tampered', async () => {
    const subject = await fixture(disabledConsent);
    await subject.controller.requestAssignment('operator');
    const sealed = String(subject.persistedAuthority());
    subject.setRawAuthority(`${sealed.slice(0, -1)}${sealed.endsWith('A') ? 'B' : 'A'}`);

    const restarted = await createCohortProductionController(subject.environment);
    await expect(restarted.assignmentStatus()).resolves.toMatchObject({
      available: false,
      effectiveCohort: null,
      observationState: 'unavailable',
    });
  });

  it('[HF-01] ignores replayed mutable config after the external authority advances', async () => {
    const subject = await fixture(disabledConsent);
    await subject.controller.requestAssignment('developer');
    await subject.controller.setConsent(true);
    subject.setLegacy(disabledConsent, {
      schemaVersion: 1,
      cohort: 'novice',
      classifiedAtMs: NOW,
      windowStartMs: null,
      windowEndMs: null,
    });

    const restarted = await createCohortProductionController(subject.environment);
    await expect(restarted.authorityStatus()).resolves.toMatchObject({
      generation: 2,
      assignment: { effectiveCohort: 'developer', observationState: 'active' },
      consent: { enabled: true },
    });
  });

  it('[HF-01] rejects an old valid authority replayed after its independent lineage advances', async () => {
    const subject = await fixture(disabledConsent);
    await subject.controller.requestAssignment('developer');
    const capturedOldAuthority = subject.persistedAuthority();
    await subject.controller.setConsent(true);
    await subject.controller.setConsent(false);

    subject.setRawAuthority(capturedOldAuthority);
    const restarted = await createCohortProductionController(subject.environment);

    await expect(restarted.authorityStatus()).resolves.toMatchObject({
      generation: null,
      assignment: { available: false, effectiveCohort: null, observationState: 'unavailable' },
      consent: { enabled: false },
    });
  });

  it('[HF-01] rejects a credential-vault record copied to a different installation identity', async () => {
    const source = await fixture(disabledConsent);
    await source.controller.requestAssignment('operator');
    const target = await fixture(undefined, undefined, () => NOW, {
      installIdentity: 'different-installation',
      seedAuthenticated: false,
    });
    target.setRawAuthority(source.persistedAuthority());

    const restarted = await createCohortProductionController(target.environment);
    await expect(restarted.assignmentStatus()).resolves.toMatchObject({ available: false, effectiveCohort: null });
  });

  it.each(['file:v1:config-fallback', 'enc:v1:corrupt', '{"schemaVersion":1}'])(
    '[MF-01] fails closed on non-vault, corrupt, or backend-changed authority %s',
    async (raw) => {
      const subject = await fixture();
      subject.setRawAuthority(raw);
      const restarted = await createCohortProductionController(subject.environment);
      await expect(restarted.authorityStatus()).resolves.toMatchObject({ generation: null });
    }
  );

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

  it('migrates only the exact prior classification and retires legacy consent/window authority', async () => {
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
      observationState: 'ready',
    });
    expect(subject.persistedAssignment()).toEqual(assignment('operator'));
  });

  it('[HF-02] consumes migration once and ignores delete-and-reseed legacy state', async () => {
    const subject = await fixture(undefined, undefined, () => NOW, { seedAuthenticated: false });
    const legacyReads = [
      vi.mocked(subject.consentStore.get).mock.calls.length,
      vi.mocked(subject.assignmentStore.get).mock.calls.length,
    ];
    subject.setLegacy(enabledConsent, {
      schemaVersion: 1,
      cohort: 'operator',
      classifiedAtMs: NOW,
      windowStartMs: NOW,
      windowEndMs: END,
    });

    const restarted = await createCohortProductionController(subject.environment);
    await expect(restarted.authorityStatus()).resolves.toMatchObject({ generation: null });
    expect([
      vi.mocked(subject.consentStore.get).mock.calls.length,
      vi.mocked(subject.assignmentStore.get).mock.calls.length,
    ]).toEqual(legacyReads);
  });

  it('[HF-02] cannot remigrate a legacy token after the replaceable authority is deleted', async () => {
    const prior = {
      schemaVersion: 1,
      cohort: 'operator',
      classifiedAtMs: NOW,
      windowStartMs: NOW,
      windowEndMs: END,
    } as const;
    const subject = await fixture(enabledConsent, prior, () => NOW, { seedAuthenticated: false });
    const readsAfterMigration = [
      vi.mocked(subject.consentStore.get).mock.calls.length,
      vi.mocked(subject.assignmentStore.get).mock.calls.length,
    ];
    subject.setRawAuthority(undefined);
    subject.setLegacy(enabledConsent, prior);

    const restarted = await createCohortProductionController(subject.environment);

    await expect(restarted.authorityStatus()).resolves.toMatchObject({ generation: null });
    expect([
      vi.mocked(subject.consentStore.get).mock.calls.length,
      vi.mocked(subject.assignmentStore.get).mock.calls.length,
    ]).toEqual(readsAfterMigration);
    expect(subject.persistedMigrationMarker()).toEqual(expect.any(String));
  });

  it('[HF-02] keeps migration consumed when authority, lineage, and replaceable marker are deleted or replayed', async () => {
    const prior = {
      schemaVersion: 1,
      cohort: 'operator',
      classifiedAtMs: NOW,
      windowStartMs: NOW,
      windowEndMs: END,
    } as const;
    const subject = await fixture(enabledConsent, prior, () => NOW, { seedAuthenticated: false });
    const consumedAnchor = subject.persistedStableAuthority();
    const replaceableMarker = subject.persistedMigrationMarker();
    const readsAfterMigration = [
      vi.mocked(subject.consentStore.get).mock.calls.length,
      vi.mocked(subject.assignmentStore.get).mock.calls.length,
    ];

    subject.setRawAuthority(undefined);
    subject.setRawLineage(undefined);
    subject.setRawMigrationMarker(undefined);
    subject.setLegacy(enabledConsent, { ...prior, cohort: 'developer' });

    const afterDeletion = await createCohortProductionController(subject.environment);
    await expect(afterDeletion.authorityStatus()).resolves.toMatchObject({ generation: null });
    expect(subject.persistedStableAuthority()).toBe(consumedAnchor);
    expect([
      vi.mocked(subject.consentStore.get).mock.calls.length,
      vi.mocked(subject.assignmentStore.get).mock.calls.length,
    ]).toEqual(readsAfterMigration);

    subject.setRawMigrationMarker(replaceableMarker);
    const afterReplacement = await createCohortProductionController(subject.environment);
    await expect(afterReplacement.authorityStatus()).resolves.toMatchObject({ generation: null });
    expect([
      vi.mocked(subject.consentStore.get).mock.calls.length,
      vi.mocked(subject.assignmentStore.get).mock.calls.length,
    ]).toEqual(readsAfterMigration);
  });

  it('[HF-01][HF-02] rejects replay of a complete old replaceable authority tuple', async () => {
    const subject = await fixture(disabledConsent);
    await subject.controller.requestAssignment('operator');
    const oldAuthority = subject.persistedAuthority();
    const oldLineage = subject.persistedLineage();
    const oldMarker = subject.persistedMigrationMarker();

    await subject.controller.setConsent(true);
    expect(subject.persistedStableAuthority()).not.toBeUndefined();

    subject.setRawAuthority(oldAuthority);
    subject.setRawLineage(oldLineage);
    subject.setRawMigrationMarker(oldMarker);
    const restarted = await createCohortProductionController(subject.environment);

    await expect(restarted.authorityStatus()).resolves.toMatchObject({
      generation: null,
      assignment: { available: false, effectiveCohort: null, observationState: 'unavailable' },
    });
  });

  it('[HF-02] requires fresh native confirmation and never promotes a legacy consent window', async () => {
    const deny = vi.fn(async () => false);
    const prior = {
      schemaVersion: 1,
      cohort: 'operator',
      classifiedAtMs: NOW,
      windowStartMs: NOW,
      windowEndMs: END,
    } as const;
    const denied = await fixture(enabledConsent, prior, () => NOW, {
      seedAuthenticated: false,
      confirmAssignment: deny,
    });
    await expect(denied.controller.authorityStatus()).resolves.toMatchObject({ generation: null });
    expect(deny).toHaveBeenCalledWith('operator');

    const accepted = await fixture(enabledConsent, prior, () => NOW, { seedAuthenticated: false });
    await expect(accepted.controller.authorityStatus()).resolves.toMatchObject({
      generation: 1,
      consent: { enabled: false, observationWindow: null },
      assignment: { effectiveCohort: 'operator', observationState: 'ready' },
    });
  });

  it.each(INVALID_AUTHORITY_TIMES)(
    '[HF-01][HF-02] burns migration without minting authority when the confirmed migration clock is invalid: %s',
    async (invalidNow) => {
      const prior = {
        schemaVersion: 1,
        cohort: 'operator',
        classifiedAtMs: NOW,
        windowStartMs: NOW,
        windowEndMs: END,
      } as const;
      const subject = await fixture(enabledConsent, prior, () => invalidNow, { seedAuthenticated: false });

      await expect(subject.controller.authorityStatus()).resolves.toEqual({
        generation: null,
        consent: { enabled: false, acceptedAtMs: null, observationWindow: null },
        assignment: {
          available: false,
          effectiveCohort: null,
          classifiedAtMs: null,
          observationState: 'unavailable',
        },
      });
      expect(subject.environment.confirmAssignment).toHaveBeenCalledWith('operator');
      expect(subject.persistedAuthority()).toBeUndefined();
      expect(subject.persistedStableAuthority()).toEqual(expect.any(String));

      const legacyReads = [
        vi.mocked(subject.consentStore.get).mock.calls.length,
        vi.mocked(subject.assignmentStore.get).mock.calls.length,
      ];
      const restarted = await createCohortProductionController(subject.environment);
      await expect(restarted.assignmentStatus()).resolves.toMatchObject({ available: false });
      expect([
        vi.mocked(subject.consentStore.get).mock.calls.length,
        vi.mocked(subject.assignmentStore.get).mock.calls.length,
      ]).toEqual(legacyReads);
    }
  );

  it.each(['', `authority-${'x'.repeat(256)}`])(
    'reparses process-generated authority before publication: %j',
    async (invalidAuthorityId) => {
      const subject = await fixture(disabledConsent, undefined, () => NOW, {
        newAuthorityId: () => invalidAuthorityId,
      });

      await expect(subject.controller.requestAssignment('developer')).resolves.toEqual({
        status: 'storage-error',
        assignment: {
          available: false,
          effectiveCohort: null,
          classifiedAtMs: null,
          observationState: 'unavailable',
        },
      });
      expect(subject.authorityStore.set).not.toHaveBeenCalled();
      expect(subject.lineageStore.set).not.toHaveBeenCalled();
      expect(subject.stableAuthorityStore.set).not.toHaveBeenCalled();
    }
  );

  it.each(['', `window-${'x'.repeat(256)}`])(
    'reparses process-generated observation-window authority before publication: %j',
    async (invalidWindowId) => {
      const subject = await fixture(disabledConsent, assignment('developer'), () => NOW, {
        newWindowId: () => invalidWindowId,
      });

      await expect(subject.controller.setConsent(true)).resolves.toMatchObject({
        status: 'storage-error',
        assignment: { effectiveCohort: 'developer', observationState: 'ready' },
        consent: { enabled: false },
      });
      expect(subject.authorityStore.set).not.toHaveBeenCalled();
      expect(subject.lineageStore.set).not.toHaveBeenCalled();
      expect(subject.stableAuthorityStore.set).not.toHaveBeenCalled();
    }
  );

  it('[HF-02] keeps the external migration marker authoritative when legacy cleanup fails', async () => {
    const prior = {
      schemaVersion: 1,
      cohort: 'operator',
      classifiedAtMs: NOW,
      windowStartMs: NOW,
      windowEndMs: END,
    } as const;
    const subject = await fixture(enabledConsent, prior, () => NOW, {
      seedAuthenticated: false,
      retireLegacy: async () => {
        throw new Error('legacy cleanup unavailable');
      },
    });

    await expect(subject.controller.authorityStatus()).resolves.toMatchObject({
      generation: 1,
      consent: { enabled: false },
      assignment: { effectiveCohort: 'operator', observationState: 'ready' },
    });
    const readsAfterMigration = [
      vi.mocked(subject.consentStore.get).mock.calls.length,
      vi.mocked(subject.assignmentStore.get).mock.calls.length,
    ];
    const restarted = await createCohortProductionController(subject.environment);
    await expect(restarted.authorityStatus()).resolves.toMatchObject({ generation: 1 });
    expect([
      vi.mocked(subject.consentStore.get).mock.calls.length,
      vi.mocked(subject.assignmentStore.get).mock.calls.length,
    ]).toEqual(readsAfterMigration);
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
    expect(subject.authorityStore.set).not.toHaveBeenCalled();
  });

  it.each(INVALID_AUTHORITY_TIMES)(
    'rejects classification when the process clock cannot produce durable authority: %s',
    async (invalidNow) => {
      const subject = await fixture(disabledConsent, undefined, () => invalidNow);

      await expect(subject.controller.requestAssignment('developer')).resolves.toMatchObject({
        status: 'storage-error',
        assignment: { available: false },
      });
      expect(subject.environment.confirmAssignment).not.toHaveBeenCalled();
      expect(subject.authorityStore.set).not.toHaveBeenCalled();
    }
  );

  it('[CR-03] does not let two renderer literals directly select two effective cohorts', async () => {
    const deny = vi.fn(async () => false);
    const novice = await fixture(disabledConsent, undefined, () => NOW, { confirmAssignment: deny });
    const operator = await fixture(disabledConsent, undefined, () => NOW, { confirmAssignment: deny });

    const noviceResult = await novice.controller.requestAssignment('novice');
    const operatorResult = await operator.controller.requestAssignment('operator');

    expect({
      novice: noviceResult.assignment.effectiveCohort,
      operator: operatorResult.assignment.effectiveCohort,
    }).toEqual({
      novice: operatorResult.assignment.effectiveCohort,
      operator: operatorResult.assignment.effectiveCohort,
    });
    expect([noviceResult.status, operatorResult.status]).toEqual(['confirmation-denied', 'confirmation-denied']);
    expect(deny).toHaveBeenCalledTimes(2);
  });
});

describe('ProductionCohortController observation lifecycle', () => {
  it.each(INVALID_AUTHORITY_TIMES)(
    '[HF-01][HF-03] fails every existing-authority status and runtime surface closed at invalid clock %s',
    async (invalidNow) => {
      let clock = NOW;
      const subject = await fixture(enabledConsent, assignment('operator', true), () => clock);
      clock = invalidNow;

      await expect(subject.controller.assignmentStatus()).resolves.toEqual({
        available: false,
        effectiveCohort: null,
        classifiedAtMs: null,
        observationState: 'unavailable',
      });
      await expect(subject.controller.authorityStatus()).resolves.toEqual({
        generation: null,
        consent: { enabled: false, acceptedAtMs: null, observationWindow: null },
        assignment: {
          available: false,
          effectiveCohort: null,
          classifiedAtMs: null,
          observationState: 'unavailable',
        },
      });
      await expect(subject.controller.consentStatus()).resolves.toEqual({
        enabled: false,
        acceptedAtMs: null,
        observationWindow: null,
      });
      await expect(subject.controller.requestAssignment('operator')).resolves.toMatchObject({
        status: 'storage-error',
        assignment: { available: false, observationState: 'unavailable' },
      });
      await expect(subject.controller.setConsent(true)).resolves.toMatchObject({
        status: 'storage-error',
        generation: null,
        consent: { enabled: false },
        assignment: { available: false, observationState: 'unavailable' },
      });
      await expect(subject.controller.recordShellReturn('reliability')).resolves.toEqual({
        status: 'outside-window',
      });
      await expect(subject.controller.rolloutStatus()).resolves.toEqual({
        eligible: false,
        stage: 'internal-dogfood',
        source: 'none',
        reason: 'evidence-gate-failed',
      });
      await expect(fs.stat(path.join(subject.environment.userDataPath, 'cohort-evidence'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
      expect(subject.authorityStore.set).not.toHaveBeenCalled();
    }
  );

  it('[HF-01] does not publish a consent window that becomes invalid after clock rollback', async () => {
    let clock = NOW;
    const subject = await fixture(disabledConsent, assignment('developer'), () => clock);
    clock = NOW - 1;

    await expect(subject.controller.setConsent(true)).resolves.not.toMatchObject({ status: 'enabled' });
    const restarted = await createCohortProductionController(subject.environment);
    await expect(restarted.assignmentStatus()).resolves.toMatchObject({
      available: true,
      effectiveCohort: 'developer',
      observationState: 'ready',
    });
  });

  it('does not publish an observation window whose end timestamp is not a safe integer', async () => {
    const subject = await fixture(disabledConsent, assignment('developer'), () => Number.MAX_SAFE_INTEGER - 1);

    await expect(subject.controller.setConsent(true)).resolves.toMatchObject({ status: 'storage-error' });
    expect(subject.authorityStore.set).not.toHaveBeenCalled();
  });

  it('locks a future persisted window and resumes recording only when its immutable start arrives', async () => {
    let clock = NOW - 1;
    const subject = await fixture(enabledConsent, assignment('developer', true), () => clock);

    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({ observationState: 'locked' });
    await expect(subject.controller.recordShellReturn('reliability')).resolves.toEqual({ status: 'outside-window' });
    await expect(fs.stat(path.join(subject.environment.userDataPath, 'cohort-evidence'))).rejects.toMatchObject({
      code: 'ENOENT',
    });

    clock = NOW;
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({ observationState: 'active' });
    await expect(subject.controller.recordShellReturn('reliability')).resolves.toEqual({ status: 'recorded' });
  });

  it('uses exact immutable observation boundaries at end minus one, end, and end plus one', async () => {
    let clock = END - 1;
    const subject = await fixture(enabledConsent, assignment('developer', true), () => clock);
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({ observationState: 'active' });
    clock = END;
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({ observationState: 'completed' });
    clock = END + 1;
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({ observationState: 'completed' });
    expect(subject.persistedAssignment()).toEqual(assignment('developer', true));
  });
  it('[CR-02] rejects partial assignment/consent persistence when rollback also fails', async () => {
    const subject = await fixture(disabledConsent, assignment('novice'));
    vi.mocked(subject.authorityStore.set).mockRejectedValueOnce(new Error('atomic publication unavailable'));

    await expect(subject.controller.setConsent(true)).resolves.toMatchObject({ status: 'storage-error' });
    const restarted = await createCohortProductionController(subject.environment);

    await expect(restarted.assignmentStatus()).resolves.toMatchObject({
      available: true,
      effectiveCohort: 'novice',
      observationState: 'ready',
    });
    expect(subject.authorityStore.set).toHaveBeenCalledTimes(1);
  });

  it.each(['lineage', 'stable-anchor'] as const)(
    '[CR-02][HF-01] fails closed after a partial %s authority advance',
    async (failedWrite) => {
      const subject = await fixture(disabledConsent, assignment('novice'));
      const target = failedWrite === 'lineage' ? subject.lineageStore : subject.stableAuthorityStore;
      vi.mocked(target.set).mockRejectedValueOnce(new Error('authority publication interrupted'));

      await expect(subject.controller.setConsent(true)).resolves.toMatchObject({ status: 'storage-error' });
      const restarted = await createCohortProductionController(subject.environment);

      await expect(restarted.authorityStatus()).resolves.toMatchObject({
        generation: null,
        assignment: { available: false, effectiveCohort: null, observationState: 'unavailable' },
      });
    }
  );

  it('persists one exact 14-day window and records events with the effective assignment', async () => {
    const subject = await fixture(disabledConsent);
    await subject.controller.requestAssignment('developer');

    await expect(subject.controller.setConsent(true)).resolves.toMatchObject({
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
      observationState: 'revoked',
    });
    await expect(subject.controller.requestAssignment('operator')).resolves.toMatchObject({
      status: 'window-active',
      assignment: { effectiveCohort: 'knowledge-work', observationState: 'revoked' },
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
      assignment: { effectiveCohort: 'developer', observationState: 'completed' },
    });
    expect(subject.persistedAssignment()).toEqual(assignment('developer', true));
    expect(subject.authorityStore.set).not.toHaveBeenCalled();
  });

  it('[CR-04] never replaces an expired observation window through disable and re-enable', async () => {
    let clock = END + 1;
    const subject = await fixture(enabledConsent, assignment('developer', true), () => clock);

    await subject.controller.setConsent(false);
    clock = END + 2;
    await expect(subject.controller.setConsent(true)).resolves.toMatchObject({ status: 'window-complete' });

    expect(subject.persistedAssignment()).toEqual(assignment('developer', true));
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({ observationState: 'completed' });
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

  it('[HF-03] fails closed for active, revoked, incomplete, and foreign-lineage evidence', async () => {
    const baselineAggregateDigest = `sha256:${'a'.repeat(64)}` as const;
    const accepted = {
      authorityId: 'authority-fixture',
      authorityGeneration: 1,
      windowId: 'window-fixture',
      completedAtMs: END,
      baselineAggregateDigest,
    } as const;
    const active = await fixture(enabledConsent, assignment('operator', true), () => END - 1, {
      isPackaged: true,
      acceptedEvidence: async () => accepted,
    });
    const incomplete = await fixture(enabledConsent, assignment('operator', true), () => END + 1, {
      isPackaged: true,
      acceptedEvidence: async () => null,
    });
    const foreign = await fixture(enabledConsent, assignment('operator', true), () => END + 1, {
      isPackaged: true,
      acceptedEvidence: async () => ({ ...accepted, authorityId: 'foreign-authority' }),
    });
    const revoked = await fixture(enabledConsent, assignment('operator', true), () => END - 1, {
      isPackaged: true,
      acceptedEvidence: async () => ({ ...accepted, authorityGeneration: 2 }),
    });
    await revoked.controller.setConsent(false);

    for (const controller of [active.controller, incomplete.controller, foreign.controller, revoked.controller]) {
      // oxlint-disable-next-line no-await-in-loop
      await expect(controller.rolloutStatus()).resolves.toMatchObject({
        eligible: false,
        reason: 'evidence-gate-failed',
      });
    }
  });

  it('[HF-03] accepts only completed evidence bound to the exact authority lineage and digest', async () => {
    const rolloutNow = END + 1_000;
    const baselineAggregateDigest = `sha256:${'a'.repeat(64)}` as const;
    const subject = await fixture(enabledConsent, assignment('operator', true), () => rolloutNow, {
      isPackaged: true,
      appVersion: '0.12.0-preview.1',
      releaseTrack: 'preview',
      acceptedEvidence: async () => ({
        authorityId: 'authority-fixture',
        authorityGeneration: 1,
        windowId: 'window-fixture',
        completedAtMs: END,
        baselineAggregateDigest,
      }),
    });
    vi.useFakeTimers();
    vi.setSystemTime(rolloutNow);
    try {
      await installRolloutAuthority(subject.environment, {
        cohort: 'operator',
        window: { startMs: NOW, endMs: END },
        now: rolloutNow,
      });
      await expect(subject.controller.rolloutStatus()).resolves.toMatchObject({
        eligible: true,
        source: 'signed-authority',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('[HF-03] cannot return eligible when revocation wins during paused rollout evaluation', async () => {
    const rolloutNow = END + 1_000;
    const baselineAggregateDigest = `sha256:${'a'.repeat(64)}` as const;
    let releaseEvidence!: () => void;
    let evidenceStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      evidenceStarted = resolve;
    });
    const evidenceGate = new Promise<void>((resolve) => {
      releaseEvidence = resolve;
    });
    const subject = await fixture(enabledConsent, assignment('operator', true), () => rolloutNow, {
      isPackaged: true,
      appVersion: '0.12.0-preview.1',
      releaseTrack: 'preview',
      acceptedEvidence: async () => {
        evidenceStarted();
        await evidenceGate;
        return {
          authorityId: 'authority-fixture',
          authorityGeneration: 1,
          windowId: 'window-fixture',
          completedAtMs: END,
          baselineAggregateDigest,
        };
      },
    });
    vi.useFakeTimers();
    vi.setSystemTime(rolloutNow);
    try {
      await installRolloutAuthority(subject.environment, {
        cohort: 'operator',
        window: { startMs: NOW, endMs: END },
        now: rolloutNow,
      });
      const evaluating = subject.controller.rolloutStatus();
      await started;
      const revoked = subject.controller.setConsent(false);
      await expect(revoked).resolves.toMatchObject({ status: 'disabled' });
      releaseEvidence();

      await expect(evaluating).resolves.toEqual({
        eligible: false,
        stage: 'internal-dogfood',
        source: 'none',
        reason: 'evidence-gate-failed',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('[WR-01] treats malformed and unreadable consent as unavailable rather than disabled', async () => {
    const malformed = await fixture({ ...disabledConsent, extraAuthority: true }, assignment('developer'));
    const unreadable = await fixture(disabledConsent, assignment('developer'), () => NOW, {
      seedAuthenticated: false,
    });
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

    vi.mocked(subject.authorityStore.set).mockRejectedValueOnce(new Error('disk unavailable'));
    await expect(subject.controller.setConsent(true)).resolves.toMatchObject({
      status: 'storage-error',
      consent: { enabled: false, acceptedAtMs: null, observationWindow: null },
    });
    await expect(subject.controller.assignmentStatus()).resolves.toMatchObject({
      effectiveCohort: 'novice',
      observationState: 'revoked',
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

describe('cohort native confirmation localization', () => {
  it('[LF-03] defines the native ceremony and completed lifecycle in every supported locale', async () => {
    const locales = [
      'de-DE',
      'en-US',
      'es-ES',
      'fr-FR',
      'ja-JP',
      'ko-KR',
      'pt-BR',
      'ru-RU',
      'tr-TR',
      'uk-UA',
      'zh-CN',
      'zh-TW',
    ];
    const keys = [
      'cohortAssignmentCompleted',
      'cohortConfirmationTitle',
      'cohortConfirmationMessage',
      'cohortConfirmationDetail',
      'cohortConfirmationCancel',
      'cohortConfirmationConfirm',
      'evidenceWindowCompleted',
    ];
    const cohortKeys = ['novice', 'knowledge-work', 'developer', 'operator'];
    for (const locale of locales) {
      // oxlint-disable-next-line no-await-in-loop
      const parsed = JSON.parse(
        // oxlint-disable-next-line no-await-in-loop
        await fs.readFile(
          path.join(process.cwd(), 'src/renderer/services/i18n/locales', locale, 'settings.json'),
          'utf8'
        )
      ) as { navigationPage?: Record<string, unknown> };
      for (const key of keys) {
        expect(parsed.navigationPage?.[key], `${locale}:${key}`).toEqual(expect.any(String));
        expect(String(parsed.navigationPage?.[key]).length, `${locale}:${key}`).toBeGreaterThan(0);
      }
      const cohort = parsed.navigationPage?.cohort as Record<string, unknown> | undefined;
      for (const key of cohortKeys) {
        expect(cohort?.[key], `${locale}:cohort.${key}`).toEqual(expect.any(String));
        expect(String(cohort?.[key]).length, `${locale}:cohort.${key}`).toBeGreaterThan(0);
      }
    }
  });
});
