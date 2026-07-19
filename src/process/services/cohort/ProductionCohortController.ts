/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { app, dialog } from 'electron';

import { getReleaseTrack, type WaylandReleaseTrack } from '@/common/releaseTrack';
import type {
  CockpitReturnReason,
  CockpitReturnRecordResult,
  CockpitRolloutStatus,
  CohortAssignment,
  CohortAssignmentRequestResult,
  CohortAssignmentStatus,
  CohortConsentStatus,
  CohortSetConsentResult,
} from '@/common/types/cohortRollout';
import { COHORT_ASSIGNMENTS } from '@/common/types/cohortRollout';
import { decryptString, encryptString, CIPHER_PREFIX, isEncryptionAvailable } from '@process/secrets/safeStorage';
import { getInstallUuid } from '@process/services/kickoff/installUuid';
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

export type CohortProductionEnvironment = Readonly<{
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
  appVersion: string;
  releaseTrack: WaylandReleaseTrack;
  installIdentity: string;
  authorityStore: CohortAuthorityStore;
  /** Read-only, exact-schema sources for the single supported migration. */
  consentStore: CohortConsentStore;
  assignmentStore: CohortAssignmentStore;
  protectAuthority(plaintext: string): Promise<string> | string;
  unprotectAuthority(ciphertext: string): Promise<string> | string;
  confirmAssignment(requestedCohort: CohortAssignment): Promise<boolean>;
  newAuthorityId?: () => string;
  newWindowId?: () => string;
  now?: () => number;
}>;

/** Main-process authority consumed by the narrow cohort IPC bridge. */
export type CohortProductionAPI = Readonly<{
  rolloutStatus(): Promise<CockpitRolloutStatus>;
  assignmentStatus(): Promise<CohortAssignmentStatus>;
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

  rolloutStatus(): Promise<CockpitRolloutStatus> {
    return this.rollout.status();
  }

  async assignmentStatus(): Promise<CohortAssignmentStatus> {
    await this.queue;
    return toPublicAssignment(this.authority, this.now());
  }

  requestAssignment(requestedCohort: unknown): Promise<CohortAssignmentRequestResult> {
    return this.enqueue(async () => {
      const requested = parseCohort(requestedCohort);
      if (requested === null) return this.assignmentResult('invalid-request');
      if (this.authority?.windowId !== null && this.authority?.windowId !== undefined) {
        return this.assignmentResult(this.authority.effectiveCohort === requested ? 'unchanged' : 'window-active');
      }
      if (this.authority?.effectiveCohort === requested) return this.assignmentResult('unchanged');

      // A hostile renderer can request a literal, but cannot complete this
      // native, process-owned user confirmation ceremony.
      if (!(await this.environment.confirmAssignment(requested))) {
        return this.assignmentResult('confirmation-denied');
      }

      const next: CohortAuthorityEnvelope = {
        schemaVersion: 3,
        generation: (this.authority?.generation ?? 0) + 1,
        installationIdHash: cohortInstallationIdHash(this.environment.installIdentity),
        authorityId: this.authority?.authorityId ?? (this.environment.newAuthorityId ?? randomUUID)(),
        classifierVersion: 2,
        requestedCohort: requested,
        effectiveCohort: requested,
        classifiedAtMs: this.now(),
        consentEnabled: false,
        acceptedAtMs: null,
        windowId: null,
        windowStartMs: null,
        windowEndMs: null,
      };
      if (!(await this.publish(next))) return this.assignmentResult('storage-error');
      this.authority = next;
      return this.assignmentResult('classified');
    });
  }

  async consentStatus(): Promise<CohortConsentStatus> {
    await this.queue;
    return toPublicConsent(this.authority);
  }

  setConsent(enabled: boolean): Promise<CohortSetConsentResult> {
    return this.enqueue(async () => {
      if (this.authority === null) return this.consentResult('assignment-unavailable');
      if (enabled === this.authority.consentEnabled) return this.consentResult(enabled ? 'enabled' : 'disabled');

      const now = this.now();
      if (enabled && this.authority.windowEndMs !== null && now >= this.authority.windowEndMs) {
        return this.consentResult('window-complete');
      }

      const firstStart = enabled && this.authority.windowStartMs === null;
      const startMs = firstStart ? now : this.authority.windowStartMs;
      const endMs = firstStart ? now + M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS : this.authority.windowEndMs;
      const next: CohortAuthorityEnvelope = {
        ...this.authority,
        generation: this.authority.generation + 1,
        consentEnabled: enabled,
        acceptedAtMs: firstStart ? now : this.authority.acceptedAtMs,
        windowId: firstStart ? (this.environment.newWindowId ?? randomUUID)() : this.authority.windowId,
        windowStartMs: startMs,
        windowEndMs: endMs,
      };
      if (!(await this.publish(next))) return this.consentResult('storage-error');

      this.authority = next;
      this.runtime = this.createRuntime();
      return this.consentResult(enabled ? 'enabled' : 'disabled');
    });
  }

  recordShellReturn(reason: CockpitReturnReason): Promise<CockpitReturnRecordResult> {
    return this.enqueue(async () => {
      if (!this.runtime) return { status: 'consent-disabled' };
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

  private assignmentResult(status: CohortAssignmentRequestResult['status']): CohortAssignmentRequestResult {
    return { status, assignment: toPublicAssignment(this.authority, this.now()) };
  }

  private consentResult(status: CohortSetConsentResult['status']): CohortSetConsentResult {
    return {
      status,
      consent: toPublicConsent(this.authority),
    };
  }

  private async publish(next: CohortAuthorityEnvelope): Promise<boolean> {
    try {
      const sealed = await this.environment.protectAuthority(JSON.stringify(next));
      if (typeof sealed !== 'string' || sealed.length === 0) throw new Error('COHORT_AUTHORITY_SEAL_INVALID');
      await this.environment.authorityStore.set(sealed);
      return true;
    } catch {
      return false;
    }
  }

  private rolloutAuthorityScope(): CohortRolloutAuthorityScope | null {
    if (
      this.authority === null ||
      this.authority.windowStartMs === null ||
      this.authority.windowEndMs === null
    ) {
      return null;
    }
    return {
      cohort: this.authority.effectiveCohort,
      window: { startMs: this.authority.windowStartMs, endMs: this.authority.windowEndMs },
    };
  }

  private createRuntime(): CohortEvidenceRuntime | null {
    const authority = this.authority;
    if (
      authority === null ||
      !authority.consentEnabled ||
      authority.acceptedAtMs === null ||
      authority.windowStartMs === null ||
      authority.windowEndMs === null ||
      this.now() >= authority.windowEndMs
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
  const current = await readAuthenticatedAuthority(environment);
  if (current.kind === 'valid') return new ProductionCohortController(environment, current.authority);
  if (current.kind === 'invalid') return new ProductionCohortController(environment, null);

  const migrated = await migrateExactLegacyAuthority(environment);
  return new ProductionCohortController(environment, migrated);
}

/** Compose the production controller from process-authoritative Electron state. */
export async function createProductionCohortController(): Promise<ProductionCohortController> {
  const installIdentity = await getInstallUuid();
  return createCohortProductionController({
    userDataPath: app.getPath('userData'),
    resourcesPath: process.resourcesPath,
    isPackaged: app.isPackaged,
    appVersion: app.getVersion(),
    releaseTrack: getReleaseTrack(),
    installIdentity,
    authorityStore: {
      get: () => ProcessConfig.get(AUTHORITY_KEY),
      set: async (value): Promise<void> => {
        // ProcessConfig.update is one serialized JsonFileBuilder root mutation.
        await ProcessConfig.update(AUTHORITY_KEY, async () => value);
      },
    },
    consentStore: { get: () => ProcessConfig.get(CONSENT_KEY) },
    assignmentStore: { get: () => ProcessConfig.get(ASSIGNMENT_KEY) },
    protectAuthority: (plaintext) => {
      if (!isEncryptionAvailable()) throw new Error('COHORT_OS_AUTHORITY_UNAVAILABLE');
      const sealed = encryptString(plaintext);
      if (!sealed.startsWith(CIPHER_PREFIX)) throw new Error('COHORT_OS_AUTHORITY_REQUIRED');
      return sealed;
    },
    unprotectAuthority: (ciphertext) => {
      if (!isEncryptionAvailable() || !ciphertext.startsWith(CIPHER_PREFIX)) {
        throw new Error('COHORT_OS_AUTHORITY_REQUIRED');
      }
      return decryptString(ciphertext);
    },
    confirmAssignment: async (requestedCohort) => {
      const result = await dialog.showMessageBox({
        type: 'question',
        title: 'Confirm evaluation group',
        message: `Use ${requestedCohort} as this installation's evaluation group?`,
        detail: 'This selection is owned by Wayland and cannot be changed after evidence collection begins.',
        buttons: ['Cancel', 'Confirm'],
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
  | Readonly<{ kind: 'valid'; authority: CohortAuthorityEnvelope }>;

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
    const authority = parseAuthorityEnvelope(parsed, environment.installIdentity);
    return authority ? { kind: 'valid', authority } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

async function migrateExactLegacyAuthority(
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
    return null;
  }
  const consent = parseExactLegacyConsent(consentInput);
  const assignment = parseExactLegacyAssignment(assignmentInput);
  if (consent === null || assignment === null || !legacyMatches(assignment, consent)) return null;

  const authority: CohortAuthorityEnvelope = {
    schemaVersion: 3,
    generation: 1,
    installationIdHash: cohortInstallationIdHash(environment.installIdentity),
    authorityId: (environment.newAuthorityId ?? randomUUID)(),
    classifierVersion: 2,
    requestedCohort: assignment.cohort,
    effectiveCohort: assignment.cohort,
    classifiedAtMs: assignment.classifiedAtMs,
    consentEnabled: consent.enabled,
    acceptedAtMs: consent.enabled ? consent.acceptedAtMs : assignment.windowStartMs,
    windowId: assignment.windowStartMs === null ? null : (environment.newWindowId ?? randomUUID)(),
    windowStartMs: assignment.windowStartMs,
    windowEndMs: assignment.windowEndMs,
  };
  try {
    const sealed = await environment.protectAuthority(JSON.stringify(authority));
    await environment.authorityStore.set(sealed);
    return authority;
  } catch {
    return null;
  }
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
    typeof input.authorityId !== 'string' ||
    input.authorityId.length < 1 ||
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
    typeof input.windowId !== 'string' ||
    input.windowId.length < 1 ||
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
  if (authority === null) {
    return { available: false, effectiveCohort: null, classifiedAtMs: null, observationState: 'unavailable' };
  }
  let observationState: CohortAssignmentStatus['observationState'] = 'ready';
  if (authority.windowEndMs !== null && now >= authority.windowEndMs) observationState = 'completed';
  else if (authority.windowId !== null) observationState = authority.consentEnabled ? 'active' : 'revoked';
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
