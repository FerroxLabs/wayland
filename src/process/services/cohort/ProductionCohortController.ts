/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { app, dialog } from 'electron';
import * as keytar from 'keytar';

import { getReleaseTrack, type WaylandReleaseTrack } from '@/common/releaseTrack';
import type {
  CockpitReturnReason,
  CockpitReturnRecordResult,
  CockpitRolloutStatus,
  CohortAssignment,
  CohortAssignmentRequestResult,
  CohortAssignmentStatus,
  CohortAuthorityProjection,
  CohortConsentStatus,
  CohortSetConsentResult,
} from '@/common/types/cohortRollout';
import { COHORT_ASSIGNMENTS } from '@/common/types/cohortRollout';
import i18n, { i18nReady } from '@process/services/i18n';
import { ProcessConfig } from '@process/utils/initStorage';
import { CohortBaselineService } from './CohortBaselineService';
import { CohortEvidenceRuntime } from './CohortEvidenceRuntime';
import { LocalM0BCohortEventRepository } from './LocalCohortEventRepository';
import { createM0BClassicBaselineConfig } from './policy';
import {
  cohortInstallationIdHash,
  ProductionCockpitRolloutStatusProvider,
  type CohortRolloutAuthorityScope,
} from './ProductionCockpitRolloutStatusProvider';
import { M0B_DAY_MS, M0B_OBSERVATION_WINDOW_DAYS } from './types';

const CONSENT_KEY = 'cohort.evidenceConsent' as const;
const ASSIGNMENT_KEY = 'cohort.assignment' as const;
const AUTHORITY_KEY = 'cohort.authorityEnvelope' as const;
const KEYCHAIN_SERVICE = 'com.ferroxlabs.wayland.cohort-authority';
const AUTHORITY_DIRECTORY = 'cockpit-rollout';
const AUTHORITY_RECEIPT = 'authorization.json';
const PACKAGED_POLICY = 'policy.json';
const EVIDENCE_DIRECTORY = 'cohort-evidence';

type PersistedConsent = {
  schemaVersion: 1;
  enabled: boolean;
  acceptedAtMs: number | null;
  windowStartMs: number | null;
  windowEndMs: number | null;
};

type LegacyAssignment = {
  schemaVersion: 1;
  cohort: CohortAssignment;
  classifiedAtMs: number;
  windowStartMs: number | null;
  windowEndMs: number | null;
};

type CohortAuthorityEnvelope = {
  schemaVersion: 3;
  generation: number;
  installationIdHash: `sha256:${string}`;
  authorityId: string;
  classifierVersion: 2;
  requestedCohort: CohortAssignment;
  effectiveCohort: CohortAssignment;
  classifiedAtMs: number;
  consentEnabled: boolean;
  acceptedAtMs: number | null;
  windowId: string | null;
  windowStartMs: number | null;
  windowEndMs: number | null;
};

type CohortAuthorityRecord = Readonly<{
  schemaVersion: 2;
  authority: CohortAuthorityEnvelope;
}>;

type CohortLineageAnchor = Readonly<{
  schemaVersion: 1;
  installationIdHash: `sha256:${string}`;
  authorityId: string | null;
  generation: number;
}>;

type CohortMigrationMarker = Readonly<{
  schemaVersion: 1;
  installationIdHash: `sha256:${string}`;
  consumed: true;
}>;

type CohortInstallationCredential = Readonly<{
  schemaVersion: 2;
  installIdentity: string;
  legacyMigrationConsumed: boolean;
  authorityId: string | null;
  authorityGeneration: number;
}>;

type CohortStableAuthorityAnchor = Readonly<{
  schemaVersion: 1;
  installationIdHash: `sha256:${string}`;
  migrationConsumed: true;
  authorityId: string | null;
  generation: number;
}>;

export type CohortAcceptedEvidence = Readonly<{
  authorityId: string;
  authorityGeneration: number;
  windowId: string;
  completedAtMs: number;
  baselineAggregateDigest: `sha256:${string}`;
}>;

export type CohortConsentStore = Readonly<{
  get(): Promise<unknown>;
}>;

export type CohortAssignmentStore = Readonly<{
  get(): Promise<unknown>;
}>;

export type CohortAuthorityStore = Readonly<{
  get(): Promise<unknown>;
  set(value: string): Promise<void>;
}>;

export type CohortLineageStore = CohortAuthorityStore;

export type CohortMigrationMarkerStore = CohortAuthorityStore;

export type CohortStableAuthorityStore = CohortAuthorityStore;

export type CohortProductionEnvironment = Readonly<{
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
  /**
   * Product decision (2026-07-20): the Adaptive Cockpit is a plain opt-in
   * preview available to everyone, not a cohort-invited rollout. When set, the
   * killed M0B/signed-authority eligibility gate is bypassed and rolloutStatus
   * reports the Cockpit generally available; the user still opts in via the
   * Classic/Cockpit toggle and Classic remains the default. The signed-authority
   * machinery below is retained until the scheduled cohort-subsystem deletion.
   */
  cockpitPreviewOpenToAll?: boolean;
  appVersion: string;
  releaseTrack: WaylandReleaseTrack;
  installIdentity: string;
  authorityStore: CohortAuthorityStore;
  /** Independent monotonic anchor. A replayed authority must match it exactly. */
  lineageStore: CohortLineageStore;
  /** Independent one-shot marker. Authority deletion must never reopen migration. */
  migrationMarkerStore: CohortMigrationMarkerStore;
  /**
   * Migration authority anchored to the stable installation credential. Unlike
   * the replaceable authority/lineage/marker records, this survives their loss
   * and prevents mutable legacy config from being authenticated a second time.
   */
  stableAuthorityStore: CohortStableAuthorityStore;
  /** Read-only, exact-schema sources for the single supported migration. */
  consentStore: CohortConsentStore;
  assignmentStore: CohortAssignmentStore;
  protectAuthority(plaintext: string): Promise<string> | string;
  unprotectAuthority(ciphertext: string): Promise<string> | string;
  confirmAssignment(requestedCohort: CohortAssignment): Promise<boolean>;
  /** Accepted final aggregate. Absence is an explicit fail-closed rollout gate. */
  acceptedEvidence?: () => Promise<CohortAcceptedEvidence | null>;
  retireLegacy?: () => Promise<void>;
  newAuthorityId?: () => string;
  newWindowId?: () => string;
  now?: () => number;
}>;

/** Main-process authority consumed by the narrow cohort IPC bridge. */
export type CohortProductionAPI = Readonly<{
  rolloutStatus(): Promise<CockpitRolloutStatus>;
  assignmentStatus(): Promise<CohortAssignmentStatus>;
  authorityStatus(): Promise<CohortAuthorityProjection>;
  requestAssignment(requestedCohort: unknown): Promise<CohortAssignmentRequestResult>;
  consentStatus(): Promise<CohortConsentStatus>;
  setConsent(enabled: boolean): Promise<CohortSetConsentResult>;
  recordShellReturn(reason: CockpitReturnReason): Promise<CockpitReturnRecordResult>;
}>;

/**
 * Serial, process-owned authority. The only durable write is one authenticated
 * envelope, so classification, consent, and window identity cannot tear.
 */
export class ProductionCohortController implements CohortProductionAPI {
  private authority: CohortAuthorityEnvelope | null;
  private runtime: CohortEvidenceRuntime | null;
  private queue: Promise<void> = Promise.resolve();
  private readonly now: () => number;
  private readonly rollout: ProductionCockpitRolloutStatusProvider;

  constructor(
    private readonly environment: CohortProductionEnvironment,
    initialAuthority: CohortAuthorityEnvelope | null
  ) {
    this.now = environment.now ?? Date.now;
    this.authority = initialAuthority;
    this.rollout = new ProductionCockpitRolloutStatusProvider({
      isPackaged: environment.isPackaged,
      appVersion: environment.appVersion,
      releaseTrack: environment.releaseTrack,
      installationIdentity: environment.installIdentity,
      authorityScope: () => this.rolloutAuthorityScope(),
      receiptPath: path.join(environment.userDataPath, AUTHORITY_DIRECTORY, AUTHORITY_RECEIPT),
      packagedPolicyPath: path.join(environment.resourcesPath, AUTHORITY_DIRECTORY, PACKAGED_POLICY),
    });
    this.runtime = this.createRuntime();
  }

  async rolloutStatus(): Promise<CockpitRolloutStatus> {
    await this.queue;
    // Preview-open product decision bypasses the killed cohort/M0B eligibility
    // gate entirely: the Cockpit is generally available as an opt-in preview.
    // This is the single ungate point — it precedes both the signed-authority
    // provider and the packaged same-authority downgrade below.
    if (this.environment.cockpitPreviewOpenToAll) return cockpitPreviewOpenStatus();
    const now = this.now();
    if (this.authority !== null && !isValidAuthorityTime(now)) return unavailableRolloutStatus();
    const authoritySnapshot = this.authority;
    const result = await this.rollout.status();
    if (!this.environment.isPackaged || !result.eligible) return result;

    return this.enqueue(async () =>
      sameRolloutAuthority(authoritySnapshot, this.authority, now)
        ? result
        : {
            eligible: false,
            stage: 'internal-dogfood',
            source: 'none',
            reason: 'evidence-gate-failed',
          }
    );
  }

  async assignmentStatus(): Promise<CohortAssignmentStatus> {
    await this.queue;
    return toPublicAssignment(this.authority, this.now());
  }

  async authorityStatus(): Promise<CohortAuthorityProjection> {
    await this.queue;
    return toPublicProjection(this.authority, this.now());
  }

  requestAssignment(requestedCohort: unknown): Promise<CohortAssignmentRequestResult> {
    return this.enqueue(async () => {
      const now = this.now();
      const requested = parseCohort(requestedCohort);
      if (requested === null) return this.assignmentResult('invalid-request', now);
      if (!isValidAuthorityTime(now) || (this.authority !== null && now < this.authority.classifiedAtMs)) {
        return this.assignmentResult('storage-error', now);
      }
      if (this.authority?.windowId !== null && this.authority?.windowId !== undefined) {
        return this.assignmentResult(this.authority.effectiveCohort === requested ? 'unchanged' : 'window-active', now);
      }
      if (this.authority?.effectiveCohort === requested) return this.assignmentResult('unchanged', now);

      // A hostile renderer can request a literal, but cannot complete this
      // native, process-owned user confirmation ceremony.
      if (!(await this.environment.confirmAssignment(requested))) {
        return this.assignmentResult('confirmation-denied', now);
      }

      const next: CohortAuthorityEnvelope = {
        schemaVersion: 3,
        generation: (this.authority?.generation ?? 0) + 1,
        installationIdHash: cohortInstallationIdHash(this.environment.installIdentity),
        authorityId: this.authority?.authorityId ?? (this.environment.newAuthorityId ?? randomUUID)(),
        classifierVersion: 2,
        requestedCohort: requested,
        effectiveCohort: requested,
        classifiedAtMs: now,
        consentEnabled: false,
        acceptedAtMs: null,
        windowId: null,
        windowStartMs: null,
        windowEndMs: null,
      };
      if (!(await this.publish(next))) return this.assignmentResult('storage-error', now);
      this.authority = next;
      return this.assignmentResult('classified', now);
    });
  }

  async consentStatus(): Promise<CohortConsentStatus> {
    await this.queue;
    const now = this.now();
    return isValidAuthorityTime(now) ? toPublicConsent(this.authority) : unavailableConsent();
  }

  setConsent(enabled: boolean): Promise<CohortSetConsentResult> {
    return this.enqueue(async () => {
      const now = this.now();
      if (this.authority === null) return this.consentResult('assignment-unavailable', now);
      if (enabled && !isValidAuthorityTime(now)) return this.consentResult('storage-error', now);
      if (enabled === this.authority.consentEnabled) {
        return this.consentResult(enabled ? 'enabled' : 'disabled', now);
      }
      if (
        enabled &&
        (now < this.authority.classifiedAtMs ||
          (this.authority.windowStartMs !== null && now < this.authority.windowStartMs))
      ) {
        return this.consentResult('storage-error', now);
      }
      if (enabled && this.authority.windowEndMs !== null && now >= this.authority.windowEndMs) {
        return this.consentResult('window-complete', now);
      }

      const firstStart = enabled && this.authority.windowStartMs === null;
      const startMs = firstStart ? now : this.authority.windowStartMs;
      const candidateEndMs = firstStart ? now + M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS : null;
      if (firstStart && !Number.isSafeInteger(candidateEndMs)) return this.consentResult('storage-error', now);
      const endMs = firstStart ? candidateEndMs : this.authority.windowEndMs;
      const next: CohortAuthorityEnvelope = {
        ...this.authority,
        generation: this.authority.generation + 1,
        consentEnabled: enabled,
        acceptedAtMs: firstStart ? now : this.authority.acceptedAtMs,
        windowId: firstStart ? (this.environment.newWindowId ?? randomUUID)() : this.authority.windowId,
        windowStartMs: startMs,
        windowEndMs: endMs,
      };
      if (!(await this.publish(next))) return this.consentResult('storage-error', now);

      this.authority = next;
      this.runtime = this.createRuntime(now);
      return this.consentResult(enabled ? 'enabled' : 'disabled', now);
    });
  }

  recordShellReturn(reason: CockpitReturnReason): Promise<CockpitReturnRecordResult> {
    return this.enqueue(async () => {
      const now = this.now();
      const authority = this.authority;
      if (!isRuntimeWindowActive(authority, now)) {
        return authority?.consentEnabled ? { status: 'outside-window' } : { status: 'consent-disabled' };
      }
      this.runtime ??= this.createRuntime(now);
      if (!this.runtime) return { status: 'outside-window' };
      return this.runtime.recordShellReturn(reason);
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.then(
      (): void => undefined,
      (): void => undefined
    );
    return result;
  }

  private assignmentResult(
    status: CohortAssignmentRequestResult['status'],
    now: number
  ): CohortAssignmentRequestResult {
    return { status, assignment: toPublicAssignment(this.authority, now) };
  }

  private consentResult(status: CohortSetConsentResult['status'], now: number): CohortSetConsentResult {
    const projection = toPublicProjection(this.authority, now);
    return {
      status,
      ...projection,
    };
  }

  private async publish(next: CohortAuthorityEnvelope): Promise<boolean> {
    try {
      const validated = parseAuthorityEnvelope(next, this.environment.installIdentity);
      if (validated === null) return false;
      const record: CohortAuthorityRecord = { schemaVersion: 2, authority: validated };
      const lineage = toLineageAnchor(validated, this.environment.installIdentity);
      await this.environment.authorityStore.set(await sealRecord(this.environment, record));
      await this.environment.lineageStore.set(await sealRecord(this.environment, lineage));
      // Advance the non-replaceable anchor last. Any crash before this point
      // leaves a mismatch that fails closed; a first-write failure preserves
      // the prior complete tuple without sacrificing rollback protection.
      await this.environment.stableAuthorityStore.set(
        await sealRecord(this.environment, toStableAuthorityAnchor(validated, this.environment.installIdentity))
      );
      return true;
    } catch {
      return false;
    }
  }

  private async rolloutAuthorityScope(): Promise<CohortRolloutAuthorityScope | null> {
    const authority = this.authority;
    const now = this.now();
    if (
      authority === null ||
      !authority.consentEnabled ||
      authority.windowId === null ||
      authority.windowStartMs === null ||
      authority.windowEndMs === null ||
      !isValidAuthorityTime(now) ||
      now < authority.windowEndMs
    ) {
      return null;
    }
    const accepted = await this.environment.acceptedEvidence?.();
    if (
      accepted === undefined ||
      accepted === null ||
      accepted.authorityId !== authority.authorityId ||
      accepted.authorityGeneration !== authority.generation ||
      accepted.windowId !== authority.windowId ||
      !isValidAuthorityTime(accepted.completedAtMs) ||
      accepted.completedAtMs < authority.windowEndMs ||
      !isSha256Digest(accepted.baselineAggregateDigest)
    ) {
      return null;
    }
    return {
      authorityId: authority.authorityId,
      authorityGeneration: authority.generation,
      cohort: authority.effectiveCohort,
      windowId: authority.windowId,
      window: { startMs: authority.windowStartMs, endMs: authority.windowEndMs },
      evidenceCompletedAtMs: accepted.completedAtMs,
      baselineAggregateDigest: accepted.baselineAggregateDigest,
    };
  }

  private createRuntime(now = this.now()): CohortEvidenceRuntime | null {
    const authority = this.authority;
    if (!isRuntimeWindowActive(authority, now)) return null;
    if (
      authority === null ||
      authority.acceptedAtMs === null ||
      authority.windowStartMs === null ||
      authority.windowEndMs === null
    ) {
      return null;
    }
    const repository = new LocalM0BCohortEventRepository({
      rootDirectory: path.join(this.environment.userDataPath, EVIDENCE_DIRECTORY),
      windowStartMs: authority.windowStartMs,
      windowEndMs: authority.windowEndMs,
    });
    const config = createM0BClassicBaselineConfig({
      appVersion: this.environment.appVersion,
      windowStartMs: authority.windowStartMs,
      privacyMode: 'local-aggregate-only',
    });
    const service = new CohortBaselineService(repository, config, {
      enabled: true,
      acceptedAtMs: authority.acceptedAtMs,
    });
    return new CohortEvidenceRuntime({
      service,
      rollout: this.rollout,
      installIdentity: this.environment.installIdentity,
      cohort: authority.effectiveCohort,
      now: this.now,
    });
  }
}

export async function createCohortProductionController(
  environment: CohortProductionEnvironment
): Promise<ProductionCohortController> {
  const [current, lineage, migration, stableAuthority] = await Promise.all([
    readAuthenticatedAuthority(environment),
    readLineageAnchor(environment),
    readMigrationMarker(environment),
    readStableAuthorityAnchor(environment),
  ]);
  if (
    current.kind === 'valid' &&
    lineage.kind === 'valid' &&
    migration.kind === 'valid' &&
    stableAuthority.kind === 'valid' &&
    authorityMatchesLineage(current.record.authority, lineage.record) &&
    authorityMatchesStableAnchor(current.record.authority, stableAuthority.record)
  ) {
    return new ProductionCohortController(environment, current.record.authority);
  }
  if (stableAuthority.kind === 'valid') {
    // The stable installation credential says migration was already consumed.
    // Loss, deletion, replacement, or contradiction in any replaceable record
    // is therefore unavailable state, never permission to reread legacy config.
    return new ProductionCohortController(environment, null);
  }
  if (
    stableAuthority.kind === 'invalid' ||
    current.kind !== 'absent' ||
    lineage.kind !== 'absent' ||
    migration.kind !== 'absent'
  ) {
    return new ProductionCohortController(environment, null);
  }

  const migrated = await consumeLegacyMigration(environment);
  return new ProductionCohortController(environment, migrated);
}

/** Compose the production controller from process-authoritative Electron state. */
export async function createProductionCohortController(): Promise<ProductionCohortController> {
  const userDataPath = app.getPath('userData');
  const account = createHash('sha256').update(path.resolve(userDataPath)).digest('hex');
  const identityAccount = `${account}:installation`;
  const rawInstallationCredential = await keytar.getPassword(KEYCHAIN_SERVICE, identityAccount);
  let installationCredential = parseInstallationCredential(rawInstallationCredential);
  if (installationCredential === null) {
    if (rawInstallationCredential !== null && !isLegacyInstallationIdentity(rawInstallationCredential)) {
      throw new Error('COHORT_INSTALLATION_CREDENTIAL_INVALID');
    }
    installationCredential = Object.freeze({
      schemaVersion: 2,
      installIdentity: rawInstallationCredential ?? randomUUID(),
      legacyMigrationConsumed: false,
      authorityId: null,
      authorityGeneration: 0,
    });
    await keytar.setPassword(KEYCHAIN_SERVICE, identityAccount, JSON.stringify(installationCredential));
  }
  const installIdentity = installationCredential.installIdentity;
  return createCohortProductionController({
    userDataPath,
    resourcesPath: process.resourcesPath,
    isPackaged: app.isPackaged,
    // Cockpit ships as an open opt-in preview (no cohort invitation).
    cockpitPreviewOpenToAll: true,
    appVersion: app.getVersion(),
    releaseTrack: getReleaseTrack(),
    installIdentity,
    authorityStore: {
      get: () => keytar.getPassword(KEYCHAIN_SERVICE, `${account}:authority`),
      set: (value) => keytar.setPassword(KEYCHAIN_SERVICE, `${account}:authority`, value),
    },
    lineageStore: {
      get: () => keytar.getPassword(KEYCHAIN_SERVICE, `${account}:lineage`),
      set: (value) => keytar.setPassword(KEYCHAIN_SERVICE, `${account}:lineage`, value),
    },
    migrationMarkerStore: {
      get: () => keytar.getPassword(KEYCHAIN_SERVICE, `${account}:migration-consumed`),
      set: (value) => keytar.setPassword(KEYCHAIN_SERVICE, `${account}:migration-consumed`, value),
    },
    stableAuthorityStore: {
      get: async () =>
        installationCredential.legacyMigrationConsumed
          ? JSON.stringify({
              schemaVersion: 1,
              installationIdHash: cohortInstallationIdHash(installIdentity),
              migrationConsumed: true,
              authorityId: installationCredential.authorityId,
              generation: installationCredential.authorityGeneration,
            } satisfies CohortStableAuthorityAnchor)
          : null,
      set: async (value) => {
        let anchor: CohortStableAuthorityAnchor | null = null;
        try {
          anchor = parseStableAuthorityAnchor(JSON.parse(value), installIdentity);
        } catch {
          // Invalid installation-bound migration authority fails closed below.
        }
        if (anchor === null) throw new Error('COHORT_STABLE_AUTHORITY_INVALID');
        const next = Object.freeze({
          ...installationCredential,
          legacyMigrationConsumed: true,
          authorityId: anchor.authorityId,
          authorityGeneration: anchor.generation,
        });
        await keytar.setPassword(KEYCHAIN_SERVICE, identityAccount, JSON.stringify(next));
        installationCredential = next;
      },
    },
    consentStore: { get: () => ProcessConfig.get(CONSENT_KEY) },
    assignmentStore: { get: () => ProcessConfig.get(ASSIGNMENT_KEY) },
    // The whole record lives in the OS credential vault. No file-backend or
    // decryptable config mirror is an authority source.
    protectAuthority: (plaintext) => plaintext,
    unprotectAuthority: (ciphertext) => ciphertext,
    retireLegacy: async () => {
      await ProcessConfig.update(CONSENT_KEY, async (): Promise<undefined> => undefined);
      await ProcessConfig.update(ASSIGNMENT_KEY, async (): Promise<undefined> => undefined);
      await ProcessConfig.update(AUTHORITY_KEY, async (): Promise<undefined> => undefined);
    },
    confirmAssignment: async (requestedCohort) => {
      await i18nReady;
      const localizedCohort = i18n.t(`settings.navigationPage.cohort.${requestedCohort}`);
      const result = await dialog.showMessageBox({
        type: 'question',
        title: i18n.t('settings.navigationPage.cohortConfirmationTitle'),
        message: i18n.t('settings.navigationPage.cohortConfirmationMessage', { cohort: localizedCohort }),
        detail: i18n.t('settings.navigationPage.cohortConfirmationDetail'),
        buttons: [
          i18n.t('settings.navigationPage.cohortConfirmationCancel'),
          i18n.t('settings.navigationPage.cohortConfirmationConfirm'),
        ],
        defaultId: 1,
        cancelId: 0,
        noLink: true,
      });
      return result.response === 1;
    },
  });
}

type AuthorityRead =
  | Readonly<{ kind: 'absent' }>
  | Readonly<{ kind: 'invalid' }>
  | Readonly<{ kind: 'valid'; record: CohortAuthorityRecord }>;

type LineageRead =
  | Readonly<{ kind: 'absent' }>
  | Readonly<{ kind: 'invalid' }>
  | Readonly<{ kind: 'valid'; record: CohortLineageAnchor }>;

type MigrationRead =
  | Readonly<{ kind: 'absent' }>
  | Readonly<{ kind: 'invalid' }>
  | Readonly<{ kind: 'valid'; record: CohortMigrationMarker }>;

async function readAuthenticatedAuthority(environment: CohortProductionEnvironment): Promise<AuthorityRead> {
  let raw: unknown;
  try {
    raw = await environment.authorityStore.get();
  } catch {
    return { kind: 'invalid' };
  }
  if (raw === undefined || raw === null) return { kind: 'absent' };
  if (typeof raw !== 'string' || raw.length === 0) return { kind: 'invalid' };
  try {
    const parsed = JSON.parse(await environment.unprotectAuthority(raw)) as unknown;
    const record = parseAuthorityRecord(parsed, environment.installIdentity);
    return record ? { kind: 'valid', record } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

async function readLineageAnchor(environment: CohortProductionEnvironment): Promise<LineageRead> {
  let raw: unknown;
  try {
    raw = await environment.lineageStore.get();
  } catch {
    return { kind: 'invalid' };
  }
  if (raw === undefined || raw === null) return { kind: 'absent' };
  if (typeof raw !== 'string' || raw.length === 0) return { kind: 'invalid' };
  try {
    const record = parseLineageAnchor(
      JSON.parse(await environment.unprotectAuthority(raw)),
      environment.installIdentity
    );
    return record ? { kind: 'valid', record } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

async function readMigrationMarker(environment: CohortProductionEnvironment): Promise<MigrationRead> {
  let raw: unknown;
  try {
    raw = await environment.migrationMarkerStore.get();
  } catch {
    return { kind: 'invalid' };
  }
  if (raw === undefined || raw === null) return { kind: 'absent' };
  if (typeof raw !== 'string' || raw.length === 0) return { kind: 'invalid' };
  try {
    const record = parseMigrationMarker(
      JSON.parse(await environment.unprotectAuthority(raw)),
      environment.installIdentity
    );
    return record ? { kind: 'valid', record } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

type StableAuthorityRead =
  | Readonly<{ kind: 'absent' }>
  | Readonly<{ kind: 'invalid' }>
  | Readonly<{ kind: 'valid'; record: CohortStableAuthorityAnchor }>;

async function readStableAuthorityAnchor(environment: CohortProductionEnvironment): Promise<StableAuthorityRead> {
  let raw: unknown;
  try {
    raw = await environment.stableAuthorityStore.get();
  } catch {
    return { kind: 'invalid' };
  }
  if (raw === undefined || raw === null) return { kind: 'absent' };
  if (typeof raw !== 'string' || raw.length === 0) return { kind: 'invalid' };
  try {
    const record = parseStableAuthorityAnchor(
      JSON.parse(await environment.unprotectAuthority(raw)),
      environment.installIdentity
    );
    return record ? { kind: 'valid', record } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

async function consumeLegacyMigration(
  environment: CohortProductionEnvironment
): Promise<CohortAuthorityEnvelope | null> {
  let consentInput: unknown;
  let assignmentInput: unknown;
  try {
    [consentInput, assignmentInput] = await Promise.all([
      environment.consentStore.get(),
      environment.assignmentStore.get(),
    ]);
  } catch {
    return persistMigrationRecord(environment, null);
  }
  const consent = parseExactLegacyConsent(consentInput);
  const assignment = parseExactLegacyAssignment(assignmentInput);
  let authority: CohortAuthorityEnvelope | null = null;
  if (consent !== null && assignment !== null && legacyMatches(assignment, consent)) {
    // Legacy state is classification input only. It never carries forward an
    // observation window or consent, and it needs a fresh native ceremony.
    if (await environment.confirmAssignment(assignment.cohort)) {
      const classifiedAtMs = environment.now?.() ?? Date.now();
      if (!isValidAuthorityTime(classifiedAtMs)) return persistMigrationRecord(environment, null);
      authority = {
        schemaVersion: 3,
        generation: 1,
        installationIdHash: cohortInstallationIdHash(environment.installIdentity),
        authorityId: (environment.newAuthorityId ?? randomUUID)(),
        classifierVersion: 2,
        requestedCohort: assignment.cohort,
        effectiveCohort: assignment.cohort,
        classifiedAtMs,
        consentEnabled: false,
        acceptedAtMs: null,
        windowId: null,
        windowStartMs: null,
        windowEndMs: null,
      };
    }
  }
  return persistMigrationRecord(environment, authority);
}

async function persistMigrationRecord(
  environment: CohortProductionEnvironment,
  authority: CohortAuthorityEnvelope | null
): Promise<CohortAuthorityEnvelope | null> {
  if (authority !== null) authority = parseAuthorityEnvelope(authority, environment.installIdentity);
  try {
    const installationIdHash = cohortInstallationIdHash(environment.installIdentity);
    const marker: CohortMigrationMarker = { schemaVersion: 1, installationIdHash, consumed: true };
    // Burn the one-shot epoch in the stable installation credential first. If
    // any subsequent publication fails, startup remains unavailable rather
    // than authenticating mutable legacy input again.
    await environment.stableAuthorityStore.set(
      await sealRecord(
        environment,
        authority === null
          ? {
              schemaVersion: 1,
              installationIdHash,
              migrationConsumed: true,
              authorityId: null,
              generation: 0,
            }
          : toStableAuthorityAnchor(authority, environment.installIdentity)
      )
    );
    await environment.migrationMarkerStore.set(await sealRecord(environment, marker));
    if (authority !== null) {
      const record: CohortAuthorityRecord = { schemaVersion: 2, authority };
      await environment.authorityStore.set(await sealRecord(environment, record));
    }
    await environment.lineageStore.set(
      await sealRecord(
        environment,
        authority === null
          ? { schemaVersion: 1, installationIdHash, authorityId: null, generation: 0 }
          : toLineageAnchor(authority, environment.installIdentity)
      )
    );
  } catch {
    return null;
  }
  // The external marker is the authority boundary. Legacy cleanup is hygiene:
  // once that marker lands, a cleanup failure must not create a split current
  // state or make the next boot reconsider legacy input.
  try {
    await environment.retireLegacy?.();
  } catch {
    // Deliberately ignored after durable migration consumption.
  }
  return authority;
}

function parseInstallationCredential(input: string | null): CohortInstallationCredential | null {
  if (input === null) return null;
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!isRecord(parsed)) return null;
    const keys = [
      'authorityGeneration',
      'authorityId',
      'installIdentity',
      'legacyMigrationConsumed',
      'schemaVersion',
    ].toSorted();
    if (
      Object.keys(parsed).toSorted().join('\0') !== keys.join('\0') ||
      parsed.schemaVersion !== 2 ||
      !isLegacyInstallationIdentity(parsed.installIdentity) ||
      typeof parsed.legacyMigrationConsumed !== 'boolean' ||
      !Number.isSafeInteger(parsed.authorityGeneration) ||
      Number(parsed.authorityGeneration) < 0 ||
      !(
        (parsed.authorityGeneration === 0 && parsed.authorityId === null) ||
        (Number(parsed.authorityGeneration) >= 1 && isAuthorityIdentifier(parsed.authorityId))
      ) ||
      (!parsed.legacyMigrationConsumed && (parsed.authorityId !== null || parsed.authorityGeneration !== 0))
    ) {
      return null;
    }
    return Object.freeze(parsed as CohortInstallationCredential);
  } catch {
    return null;
  }
}

function isLegacyInstallationIdentity(input: unknown): input is string {
  return (
    typeof input === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input)
  );
}

function parseAuthorityRecord(input: unknown, installIdentity: string): CohortAuthorityRecord | null {
  if (!isRecord(input)) return null;
  const keys = ['authority', 'schemaVersion'].toSorted();
  if (Object.keys(input).toSorted().join('\0') !== keys.join('\0') || input.schemaVersion !== 2) return null;
  const authority = parseAuthorityEnvelope(input.authority, installIdentity);
  return authority ? Object.freeze({ schemaVersion: 2, authority }) : null;
}

function parseLineageAnchor(input: unknown, installIdentity: string): CohortLineageAnchor | null {
  if (!isRecord(input)) return null;
  const keys = ['authorityId', 'generation', 'installationIdHash', 'schemaVersion'].toSorted();
  if (
    Object.keys(input).toSorted().join('\0') !== keys.join('\0') ||
    input.schemaVersion !== 1 ||
    input.installationIdHash !== cohortInstallationIdHash(installIdentity) ||
    !Number.isSafeInteger(input.generation) ||
    Number(input.generation) < 0 ||
    !(
      (input.generation === 0 && input.authorityId === null) ||
      (Number(input.generation) >= 1 && isAuthorityIdentifier(input.authorityId))
    )
  ) {
    return null;
  }
  return input as CohortLineageAnchor;
}

function parseMigrationMarker(input: unknown, installIdentity: string): CohortMigrationMarker | null {
  if (!isRecord(input)) return null;
  const keys = ['consumed', 'installationIdHash', 'schemaVersion'].toSorted();
  if (
    Object.keys(input).toSorted().join('\0') !== keys.join('\0') ||
    input.schemaVersion !== 1 ||
    input.installationIdHash !== cohortInstallationIdHash(installIdentity) ||
    input.consumed !== true
  ) {
    return null;
  }
  return input as CohortMigrationMarker;
}

function parseStableAuthorityAnchor(input: unknown, installIdentity: string): CohortStableAuthorityAnchor | null {
  if (!isRecord(input)) return null;
  const keys = ['authorityId', 'generation', 'installationIdHash', 'migrationConsumed', 'schemaVersion'].toSorted();
  if (
    Object.keys(input).toSorted().join('\0') !== keys.join('\0') ||
    input.schemaVersion !== 1 ||
    input.installationIdHash !== cohortInstallationIdHash(installIdentity) ||
    input.migrationConsumed !== true ||
    !Number.isSafeInteger(input.generation) ||
    Number(input.generation) < 0 ||
    !(
      (input.generation === 0 && input.authorityId === null) ||
      (Number(input.generation) >= 1 && isAuthorityIdentifier(input.authorityId))
    )
  ) {
    return null;
  }
  return input as CohortStableAuthorityAnchor;
}

function toLineageAnchor(authority: CohortAuthorityEnvelope, installIdentity: string): CohortLineageAnchor {
  return Object.freeze({
    schemaVersion: 1,
    installationIdHash: cohortInstallationIdHash(installIdentity),
    authorityId: authority.authorityId,
    generation: authority.generation,
  });
}

function authorityMatchesLineage(authority: CohortAuthorityEnvelope, lineage: CohortLineageAnchor): boolean {
  return authority.authorityId === lineage.authorityId && authority.generation === lineage.generation;
}

function authorityMatchesStableAnchor(
  authority: CohortAuthorityEnvelope,
  stable: CohortStableAuthorityAnchor
): boolean {
  return authority.authorityId === stable.authorityId && authority.generation === stable.generation;
}

function toStableAuthorityAnchor(
  authority: CohortAuthorityEnvelope,
  installIdentity: string
): CohortStableAuthorityAnchor {
  return Object.freeze({
    schemaVersion: 1,
    installationIdHash: cohortInstallationIdHash(installIdentity),
    migrationConsumed: true,
    authorityId: authority.authorityId,
    generation: authority.generation,
  });
}

async function sealRecord(environment: CohortProductionEnvironment, record: unknown): Promise<string> {
  const sealed = await environment.protectAuthority(JSON.stringify(record));
  if (typeof sealed !== 'string' || sealed.length === 0) throw new Error('COHORT_AUTHORITY_SEAL_INVALID');
  return sealed;
}

function sameRolloutAuthority(
  snapshot: CohortAuthorityEnvelope | null,
  current: CohortAuthorityEnvelope | null,
  now: number
): boolean {
  return (
    isValidAuthorityTime(now) &&
    snapshot !== null &&
    current !== null &&
    snapshot.authorityId === current.authorityId &&
    snapshot.generation === current.generation &&
    current.consentEnabled &&
    current.windowId !== null &&
    current.windowStartMs !== null &&
    current.windowEndMs !== null &&
    now >= current.windowEndMs
  );
}

function parseAuthorityEnvelope(input: unknown, installIdentity: string): CohortAuthorityEnvelope | null {
  if (!isRecord(input)) return null;
  const expectedKeys = [
    'acceptedAtMs',
    'authorityId',
    'classifiedAtMs',
    'classifierVersion',
    'consentEnabled',
    'effectiveCohort',
    'generation',
    'installationIdHash',
    'requestedCohort',
    'schemaVersion',
    'windowEndMs',
    'windowId',
    'windowStartMs',
  ].toSorted();
  if (Object.keys(input).toSorted().join('\0') !== expectedKeys.join('\0')) return null;
  const requested = parseCohort(input.requestedCohort);
  const effective = parseCohort(input.effectiveCohort);
  if (
    input.schemaVersion !== 3 ||
    input.classifierVersion !== 2 ||
    !Number.isSafeInteger(input.generation) ||
    Number(input.generation) < 1 ||
    input.installationIdHash !== cohortInstallationIdHash(installIdentity) ||
    !isAuthorityIdentifier(input.authorityId) ||
    requested === null ||
    effective === null ||
    requested !== effective ||
    typeof input.consentEnabled !== 'boolean' ||
    !validLifecycle(input)
  ) {
    return null;
  }
  return input as CohortAuthorityEnvelope;
}

function validLifecycle(input: Record<string, unknown>): boolean {
  if (!Number.isSafeInteger(input.classifiedAtMs) || Number(input.classifiedAtMs) < 0) return false;
  const noWindow = input.windowId === null && input.windowStartMs === null && input.windowEndMs === null;
  if (noWindow) return input.consentEnabled === false && input.acceptedAtMs === null;
  if (
    !isAuthorityIdentifier(input.windowId) ||
    !Number.isSafeInteger(input.windowStartMs) ||
    !Number.isSafeInteger(input.windowEndMs) ||
    Number(input.windowStartMs) < Number(input.classifiedAtMs) ||
    Number(input.windowEndMs) - Number(input.windowStartMs) !== M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS ||
    input.acceptedAtMs !== input.windowStartMs
  ) {
    return false;
  }
  return true;
}

function isValidAuthorityTime(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isAuthorityIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value);
}

function parseExactLegacyConsent(input: unknown): PersistedConsent | null {
  if (!isRecord(input)) return null;
  const keys = ['acceptedAtMs', 'enabled', 'schemaVersion', 'windowEndMs', 'windowStartMs'].toSorted();
  if (Object.keys(input).toSorted().join('\0') !== keys.join('\0') || input.schemaVersion !== 1) return null;
  if (input.enabled === false) {
    return input.acceptedAtMs === null && input.windowStartMs === null && input.windowEndMs === null
      ? (input as PersistedConsent)
      : null;
  }
  if (
    input.enabled !== true ||
    !Number.isSafeInteger(input.acceptedAtMs) ||
    input.acceptedAtMs !== input.windowStartMs ||
    !Number.isSafeInteger(input.windowEndMs) ||
    Number(input.windowEndMs) - Number(input.windowStartMs) !== M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS
  ) {
    return null;
  }
  return input as PersistedConsent;
}

function parseExactLegacyAssignment(input: unknown): LegacyAssignment | null {
  if (!isRecord(input)) return null;
  const keys = ['classifiedAtMs', 'cohort', 'schemaVersion', 'windowEndMs', 'windowStartMs'].toSorted();
  if (Object.keys(input).toSorted().join('\0') !== keys.join('\0') || input.schemaVersion !== 1) return null;
  const cohort = parseCohort(input.cohort);
  if (cohort === null || !validLegacyWindow(input.classifiedAtMs, input.windowStartMs, input.windowEndMs)) return null;
  return input as LegacyAssignment;
}

function validLegacyWindow(classifiedAtMs: unknown, startMs: unknown, endMs: unknown): boolean {
  if (!Number.isSafeInteger(classifiedAtMs) || Number(classifiedAtMs) < 0) return false;
  if (startMs === null || endMs === null) return startMs === null && endMs === null;
  return (
    Number.isSafeInteger(startMs) &&
    Number(startMs) >= Number(classifiedAtMs) &&
    Number.isSafeInteger(endMs) &&
    Number(endMs) - Number(startMs) === M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS
  );
}

function legacyMatches(assignment: LegacyAssignment, consent: PersistedConsent): boolean {
  if (assignment.windowStartMs === null || assignment.windowEndMs === null) return !consent.enabled;
  if (!consent.enabled) return true;
  return (
    consent.acceptedAtMs === assignment.windowStartMs &&
    consent.windowStartMs === assignment.windowStartMs &&
    consent.windowEndMs === assignment.windowEndMs
  );
}

function parseCohort(input: unknown): CohortAssignment | null {
  return typeof input === 'string' && COHORT_ASSIGNMENTS.includes(input as CohortAssignment)
    ? (input as CohortAssignment)
    : null;
}

function toPublicAssignment(authority: CohortAuthorityEnvelope | null, now: number): CohortAssignmentStatus {
  if (authority === null || !isValidAuthorityTime(now)) return unavailableAssignment();
  let observationState: CohortAssignmentStatus['observationState'] = 'ready';
  if (authority.windowEndMs !== null && now >= authority.windowEndMs) observationState = 'completed';
  else if (authority.windowId !== null) {
    if (!authority.consentEnabled) observationState = 'revoked';
    else observationState = authority.windowStartMs !== null && now < authority.windowStartMs ? 'locked' : 'active';
  }
  return {
    available: true,
    effectiveCohort: authority.effectiveCohort,
    classifiedAtMs: authority.classifiedAtMs,
    observationState,
  };
}

function toPublicConsent(authority: CohortAuthorityEnvelope | null): CohortConsentStatus {
  if (
    authority === null ||
    !authority.consentEnabled ||
    authority.acceptedAtMs === null ||
    authority.windowStartMs === null ||
    authority.windowEndMs === null
  ) {
    return { enabled: false, acceptedAtMs: null, observationWindow: null };
  }
  return {
    enabled: true,
    acceptedAtMs: authority.acceptedAtMs,
    observationWindow: { startMs: authority.windowStartMs, endMs: authority.windowEndMs },
  };
}

function unavailableAssignment(): CohortAssignmentStatus {
  return { available: false, effectiveCohort: null, classifiedAtMs: null, observationState: 'unavailable' };
}

function unavailableConsent(): CohortConsentStatus {
  return { enabled: false, acceptedAtMs: null, observationWindow: null };
}

function unavailableRolloutStatus(): CockpitRolloutStatus {
  return {
    eligible: false,
    stage: 'internal-dogfood',
    source: 'none',
    reason: 'evidence-gate-failed',
  };
}

/** Cockpit as a generally-available opt-in preview (no cohort authority). */
function cockpitPreviewOpenStatus(): CockpitRolloutStatus {
  return {
    eligible: true,
    stage: 'opt-in-beta',
    source: 'product-default',
    reason: 'preview-open',
  };
}

function isRuntimeWindowActive(authority: CohortAuthorityEnvelope | null, now: number): boolean {
  return (
    authority !== null &&
    authority.consentEnabled &&
    authority.acceptedAtMs !== null &&
    authority.windowStartMs !== null &&
    authority.windowEndMs !== null &&
    isValidAuthorityTime(now) &&
    now >= authority.windowStartMs &&
    now < authority.windowEndMs
  );
}

function isSha256Digest(value: unknown): value is `sha256:${string}` {
  return typeof value === 'string' && /^sha256:[0-9a-f]{64}$/.test(value);
}

function toPublicProjection(authority: CohortAuthorityEnvelope | null, now: number): CohortAuthorityProjection {
  if (!isValidAuthorityTime(now)) {
    return Object.freeze({ generation: null, consent: unavailableConsent(), assignment: unavailableAssignment() });
  }
  return Object.freeze({
    generation: authority?.generation ?? null,
    consent: toPublicConsent(authority),
    assignment: toPublicAssignment(authority, now),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
