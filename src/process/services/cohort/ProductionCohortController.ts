/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { app } from 'electron';

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
import { getInstallUuid } from '@process/services/kickoff/installUuid';
import { ProcessConfig } from '@process/utils/initStorage';
import { CohortBaselineService } from './CohortBaselineService';
import { CohortEvidenceRuntime } from './CohortEvidenceRuntime';
import { LocalM0BCohortEventRepository } from './LocalCohortEventRepository';
import { createM0BClassicBaselineConfig } from './policy';
import { ProductionCockpitRolloutStatusProvider } from './ProductionCockpitRolloutStatusProvider';
import { M0B_DAY_MS, M0B_OBSERVATION_WINDOW_DAYS } from './types';

const CONSENT_KEY = 'cohort.evidenceConsent' as const;
const ASSIGNMENT_KEY = 'cohort.assignment' as const;
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

type PersistedAssignment = {
  schemaVersion: 2;
  classifierVersion: 1;
  requestedCohort: CohortAssignment;
  effectiveCohort: CohortAssignment;
  classifiedAtMs: number;
  windowStartMs: number | null;
  windowEndMs: number | null;
};

export type CohortConsentStore = Readonly<{
  get(): Promise<unknown>;
  set(value: PersistedConsent): Promise<void>;
}>;

export type CohortAssignmentStore = Readonly<{
  get(): Promise<unknown>;
  set(value: PersistedAssignment): Promise<void>;
}>;

export type CohortProductionEnvironment = Readonly<{
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
  appVersion: string;
  releaseTrack: WaylandReleaseTrack;
  installIdentity: string;
  consentStore: CohortConsentStore;
  assignmentStore: CohortAssignmentStore;
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
 * Owns consent mutation and event-runtime replacement as one serial process
 * boundary. Revocation therefore cannot race a return-to-Classic write.
 */
export class ProductionCohortController implements CohortProductionAPI {
  private consent: PersistedConsent;
  private assignment: PersistedAssignment | null;
  private runtime: CohortEvidenceRuntime | null;
  private queue: Promise<void> = Promise.resolve();
  private readonly now: () => number;
  private readonly rollout: ProductionCockpitRolloutStatusProvider;

  constructor(
    private readonly environment: CohortProductionEnvironment,
    initialConsent: PersistedConsent,
    initialAssignment: PersistedAssignment | null
  ) {
    this.now = environment.now ?? Date.now;
    this.consent = initialConsent;
    this.assignment = initialAssignment;
    this.rollout = new ProductionCockpitRolloutStatusProvider({
      isPackaged: environment.isPackaged,
      appVersion: environment.appVersion,
      releaseTrack: environment.releaseTrack,
      installationIdentity: environment.installIdentity,
      receiptPath: path.join(environment.userDataPath, AUTHORITY_DIRECTORY, AUTHORITY_RECEIPT),
      packagedPolicyPath: path.join(environment.resourcesPath, AUTHORITY_DIRECTORY, PACKAGED_POLICY),
    });
    this.runtime = this.createRuntime(initialConsent);
  }

  rolloutStatus(): Promise<CockpitRolloutStatus> {
    return this.rollout.status();
  }

  async assignmentStatus(): Promise<CohortAssignmentStatus> {
    await this.queue;
    return toPublicAssignment(this.assignment, this.consent);
  }

  requestAssignment(requestedCohort: unknown): Promise<CohortAssignmentRequestResult> {
    return this.enqueue(async () => {
      const classified = classifyCohortRequest(requestedCohort);
      if (classified === null) {
        return { status: 'invalid-request', assignment: toPublicAssignment(this.assignment, this.consent) };
      }

      if (this.assignment?.windowStartMs !== null && this.assignment?.windowStartMs !== undefined) {
        return {
          status: this.assignment?.effectiveCohort === classified ? 'unchanged' : 'window-active',
          assignment: toPublicAssignment(this.assignment, this.consent),
        };
      }

      if (this.assignment?.effectiveCohort === classified) {
        return { status: 'unchanged', assignment: toPublicAssignment(this.assignment, this.consent) };
      }

      const next = assignmentRecord(classified, this.now(), null);
      try {
        await this.environment.assignmentStore.set(next);
      } catch {
        return { status: 'storage-error', assignment: toPublicAssignment(this.assignment, this.consent) };
      }
      this.assignment = next;
      return { status: 'classified', assignment: toPublicAssignment(next, this.consent) };
    });
  }

  async consentStatus(): Promise<CohortConsentStatus> {
    await this.queue;
    return toPublicConsent(this.consent);
  }

  setConsent(enabled: boolean): Promise<CohortSetConsentResult> {
    return this.enqueue(async () => {
      if (enabled && this.consent.enabled) {
        return { status: 'enabled', consent: toPublicConsent(this.consent) };
      }

      if (enabled && this.assignment === null) {
        return { status: 'assignment-unavailable', consent: toPublicConsent(this.consent) };
      }

      const existingWindow =
        this.assignment?.windowStartMs !== null &&
        this.assignment?.windowStartMs !== undefined &&
        this.assignment.windowEndMs !== null &&
        this.now() < this.assignment.windowEndMs
          ? { startMs: this.assignment.windowStartMs, endMs: this.assignment.windowEndMs }
          : null;
      const next = enabled
        ? existingWindow
          ? enabledConsentForWindow(existingWindow)
          : enabledConsent(this.now())
        : disabledConsent();
      const nextAssignment = this.assignment
        ? assignmentRecord(
            this.assignment.effectiveCohort,
            this.assignment.classifiedAtMs,
            enabled
              ? { startMs: next.windowStartMs!, endMs: next.windowEndMs! }
              : this.assignment.windowStartMs !== null && this.assignment.windowEndMs !== null
                ? { startMs: this.assignment.windowStartMs, endMs: this.assignment.windowEndMs }
                : null
          )
        : null;
      try {
        if (nextAssignment) await this.environment.assignmentStore.set(nextAssignment);
        await this.environment.consentStore.set(next);
      } catch {
        await this.restorePersistedState().catch((): void => undefined);
        return { status: 'storage-error', consent: toPublicConsent(this.consent) };
      }

      this.consent = next;
      this.assignment = nextAssignment;
      this.runtime = this.createRuntime(next);
      return {
        status: enabled ? 'enabled' : 'disabled',
        consent: toPublicConsent(next),
      };
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

  private async restorePersistedState(): Promise<void> {
    if (this.assignment) await this.environment.assignmentStore.set(this.assignment);
    await this.environment.consentStore.set(this.consent);
  }

  private createRuntime(consent: PersistedConsent): CohortEvidenceRuntime | null {
    if (
      this.assignment === null ||
      !consent.enabled ||
      consent.acceptedAtMs === null ||
      consent.windowStartMs === null ||
      consent.windowEndMs === null
    ) {
      return null;
    }

    const repository = new LocalM0BCohortEventRepository({
      rootDirectory: path.join(this.environment.userDataPath, EVIDENCE_DIRECTORY),
      windowStartMs: consent.windowStartMs,
      windowEndMs: consent.windowEndMs,
    });
    const config = createM0BClassicBaselineConfig({
      appVersion: this.environment.appVersion,
      windowStartMs: consent.windowStartMs,
      privacyMode: 'local-aggregate-only',
    });
    const service = new CohortBaselineService(repository, config, {
      enabled: true,
      acceptedAtMs: consent.acceptedAtMs,
    });
    return new CohortEvidenceRuntime({
      service,
      rollout: this.rollout,
      installIdentity: this.environment.installIdentity,
      cohort: this.assignment.effectiveCohort,
      now: this.now,
    });
  }
}

export async function createCohortProductionController(
  environment: CohortProductionEnvironment
): Promise<ProductionCohortController> {
  let consent = disabledConsent();
  let parsedAssignment: ParsedAssignment = { assignment: null, migrated: false };
  try {
    consent = parsePersistedConsent(await environment.consentStore.get());
  } catch {
    // Missing, unreadable, or malformed consent is never consent.
  }
  try {
    parsedAssignment = parsePersistedAssignment(await environment.assignmentStore.get());
  } catch {
    // Missing, unreadable, or malformed assignment is never an assignment.
  }

  if (!assignmentMatchesConsent(parsedAssignment.assignment, consent)) {
    return new ProductionCohortController(environment, disabledConsent(), null);
  }
  if (parsedAssignment.migrated && parsedAssignment.assignment) {
    try {
      await environment.assignmentStore.set(parsedAssignment.assignment);
    } catch {
      return new ProductionCohortController(environment, disabledConsent(), null);
    }
  }
  return new ProductionCohortController(environment, consent, parsedAssignment.assignment);
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
    consentStore: {
      get: () => ProcessConfig.get(CONSENT_KEY),
      set: async (value): Promise<void> => {
        await ProcessConfig.set(CONSENT_KEY, value);
      },
    },
    assignmentStore: {
      get: () => ProcessConfig.get(ASSIGNMENT_KEY),
      set: async (value): Promise<void> => {
        await ProcessConfig.set(ASSIGNMENT_KEY, value);
      },
    },
  });
}

function enabledConsent(now: number): PersistedConsent {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error('COHORT_CONSENT_TIME_INVALID');
  return {
    schemaVersion: 1,
    enabled: true,
    acceptedAtMs: now,
    windowStartMs: now,
    windowEndMs: now + M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS,
  };
}

function enabledConsentForWindow(window: Readonly<{ startMs: number; endMs: number }>): PersistedConsent {
  return {
    schemaVersion: 1,
    enabled: true,
    acceptedAtMs: window.startMs,
    windowStartMs: window.startMs,
    windowEndMs: window.endMs,
  };
}

function disabledConsent(): PersistedConsent {
  return {
    schemaVersion: 1,
    enabled: false,
    acceptedAtMs: null,
    windowStartMs: null,
    windowEndMs: null,
  };
}

type ParsedAssignment = Readonly<{
  assignment: PersistedAssignment | null;
  migrated: boolean;
}>;

function assignmentRecord(
  cohort: CohortAssignment,
  classifiedAtMs: number,
  window: Readonly<{ startMs: number; endMs: number }> | null
): PersistedAssignment {
  if (!Number.isSafeInteger(classifiedAtMs) || classifiedAtMs < 0) {
    throw new Error('COHORT_CLASSIFICATION_TIME_INVALID');
  }
  return {
    schemaVersion: 2,
    classifierVersion: 1,
    requestedCohort: cohort,
    effectiveCohort: cohort,
    classifiedAtMs,
    windowStartMs: window?.startMs ?? null,
    windowEndMs: window?.endMs ?? null,
  };
}

function classifyCohortRequest(input: unknown): CohortAssignment | null {
  return typeof input === 'string' && COHORT_ASSIGNMENTS.includes(input as CohortAssignment)
    ? (input as CohortAssignment)
    : null;
}

function parsePersistedAssignment(input: unknown): ParsedAssignment {
  if (!isRecord(input)) return { assignment: null, migrated: false };
  const keys = Object.keys(input).toSorted().join('\0');
  const currentKeys = [
    'classifiedAtMs',
    'classifierVersion',
    'effectiveCohort',
    'requestedCohort',
    'schemaVersion',
    'windowEndMs',
    'windowStartMs',
  ]
    .toSorted()
    .join('\0');
  const priorKeys = ['classifiedAtMs', 'cohort', 'schemaVersion', 'windowEndMs', 'windowStartMs']
    .toSorted()
    .join('\0');

  if (input.schemaVersion === 2 && keys === currentKeys) {
    const requested = classifyCohortRequest(input.requestedCohort);
    const effective = classifyCohortRequest(input.effectiveCohort);
    if (
      input.classifierVersion !== 1 ||
      requested === null ||
      effective === null ||
      requested !== effective ||
      !validAssignmentWindow(input.classifiedAtMs, input.windowStartMs, input.windowEndMs)
    ) {
      return { assignment: null, migrated: false };
    }
    return { assignment: input as PersistedAssignment, migrated: false };
  }

  if (input.schemaVersion === 1 && keys === priorKeys) {
    const cohort = classifyCohortRequest(input.cohort);
    if (cohort === null || !validAssignmentWindow(input.classifiedAtMs, input.windowStartMs, input.windowEndMs)) {
      return { assignment: null, migrated: false };
    }
    return {
      assignment: assignmentRecord(
        cohort,
        Number(input.classifiedAtMs),
        input.windowStartMs === null
          ? null
          : { startMs: Number(input.windowStartMs), endMs: Number(input.windowEndMs) }
      ),
      migrated: true,
    };
  }
  return { assignment: null, migrated: false };
}

function validAssignmentWindow(classifiedAtMs: unknown, windowStartMs: unknown, windowEndMs: unknown): boolean {
  if (!Number.isSafeInteger(classifiedAtMs) || Number(classifiedAtMs) < 0) return false;
  if (windowStartMs === null || windowEndMs === null) return windowStartMs === null && windowEndMs === null;
  return (
    Number.isSafeInteger(windowStartMs) &&
    Number(windowStartMs) >= Number(classifiedAtMs) &&
    Number.isSafeInteger(windowEndMs) &&
    Number(windowEndMs) - Number(windowStartMs) === M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS
  );
}

function assignmentMatchesConsent(assignment: PersistedAssignment | null, consent: PersistedConsent): boolean {
  if (assignment === null) return !consent.enabled;
  if (assignment.windowStartMs === null || assignment.windowEndMs === null) return !consent.enabled;
  if (!consent.enabled) return true;
  return (
    consent.acceptedAtMs === assignment.windowStartMs &&
    consent.windowStartMs === assignment.windowStartMs &&
    consent.windowEndMs === assignment.windowEndMs
  );
}

function toPublicAssignment(
  assignment: PersistedAssignment | null,
  consent: PersistedConsent
): CohortAssignmentStatus {
  if (assignment === null) {
    return { available: false, effectiveCohort: null, classifiedAtMs: null, observationState: 'unavailable' };
  }
  return {
    available: true,
    effectiveCohort: assignment.effectiveCohort,
    classifiedAtMs: assignment.classifiedAtMs,
    observationState: consent.enabled
      ? 'active'
      : assignment.windowStartMs !== null
        ? 'locked'
        : 'ready',
  };
}

function parsePersistedConsent(input: unknown): PersistedConsent {
  if (!isRecord(input)) return disabledConsent();
  const keys = Object.keys(input).toSorted();
  if (
    keys.join('\0') !==
    ['acceptedAtMs', 'enabled', 'schemaVersion', 'windowEndMs', 'windowStartMs'].toSorted().join('\0')
  ) {
    return disabledConsent();
  }
  if (input.schemaVersion !== 1 || typeof input.enabled !== 'boolean') return disabledConsent();
  if (!input.enabled) {
    return input.acceptedAtMs === null && input.windowStartMs === null && input.windowEndMs === null
      ? disabledConsent()
      : disabledConsent();
  }
  if (
    !Number.isSafeInteger(input.acceptedAtMs) ||
    Number(input.acceptedAtMs) < 0 ||
    input.windowStartMs !== input.acceptedAtMs ||
    !Number.isSafeInteger(input.windowEndMs) ||
    Number(input.windowEndMs) - Number(input.windowStartMs) !== M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS
  ) {
    return disabledConsent();
  }
  return input as PersistedConsent;
}

function toPublicConsent(consent: PersistedConsent): CohortConsentStatus {
  if (
    !consent.enabled ||
    consent.acceptedAtMs === null ||
    consent.windowStartMs === null ||
    consent.windowEndMs === null
  ) {
    return { enabled: false, acceptedAtMs: null, observationWindow: null };
  }
  return {
    enabled: true,
    acceptedAtMs: consent.acceptedAtMs,
    observationWindow: { startMs: consent.windowStartMs, endMs: consent.windowEndMs },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
