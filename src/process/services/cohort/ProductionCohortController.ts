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
  CohortConsentStatus,
  CohortSetConsentResult,
} from '@/common/types/cohortRollout';
import { getInstallUuid } from '@process/services/kickoff/installUuid';
import { ProcessConfig } from '@process/utils/initStorage';
import { CohortBaselineService } from './CohortBaselineService';
import { CohortEvidenceRuntime } from './CohortEvidenceRuntime';
import { LocalM0BCohortEventRepository } from './LocalCohortEventRepository';
import { createM0BClassicBaselineConfig } from './policy';
import { ProductionCockpitRolloutStatusProvider } from './ProductionCockpitRolloutStatusProvider';
import { M0B_DAY_MS, M0B_OBSERVATION_WINDOW_DAYS, type M0BCohort } from './types';

const CONSENT_KEY = 'cohort.evidenceConsent' as const;
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

export type CohortConsentStore = Readonly<{
  get(): Promise<unknown>;
  set(value: PersistedConsent): Promise<void>;
}>;

export type CohortProductionEnvironment = Readonly<{
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
  appVersion: string;
  releaseTrack: WaylandReleaseTrack;
  installIdentity: string;
  cohort: M0BCohort;
  consentStore: CohortConsentStore;
  now?: () => number;
}>;

/** Main-process authority consumed by the narrow cohort IPC bridge. */
export type CohortProductionAPI = Readonly<{
  rolloutStatus(): Promise<CockpitRolloutStatus>;
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
  private runtime: CohortEvidenceRuntime | null;
  private queue: Promise<void> = Promise.resolve();
  private readonly now: () => number;
  private readonly rollout: ProductionCockpitRolloutStatusProvider;

  constructor(
    private readonly environment: CohortProductionEnvironment,
    initialConsent: PersistedConsent
  ) {
    this.now = environment.now ?? Date.now;
    this.consent = initialConsent;
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

  async consentStatus(): Promise<CohortConsentStatus> {
    await this.queue;
    return toPublicConsent(this.consent);
  }

  setConsent(enabled: boolean): Promise<CohortSetConsentResult> {
    return this.enqueue(async () => {
      if (enabled && this.consent.enabled) {
        return { status: 'enabled', consent: toPublicConsent(this.consent) };
      }

      const next = enabled ? enabledConsent(this.now()) : disabledConsent();
      try {
        await this.environment.consentStore.set(next);
      } catch {
        return { status: 'storage-error', consent: toPublicConsent(this.consent) };
      }

      this.consent = next;
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

  private createRuntime(consent: PersistedConsent): CohortEvidenceRuntime | null {
    if (
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
      cohort: this.environment.cohort,
      now: this.now,
    });
  }
}

export async function createCohortProductionController(
  environment: CohortProductionEnvironment
): Promise<ProductionCohortController> {
  let consent = disabledConsent();
  try {
    consent = parsePersistedConsent(await environment.consentStore.get());
  } catch {
    // Missing, unreadable, or malformed consent is never consent.
  }
  return new ProductionCohortController(environment, consent);
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
    cohort: 'knowledge-work',
    consentStore: {
      get: () => ProcessConfig.get(CONSENT_KEY),
      set: async (value): Promise<void> => {
        await ProcessConfig.set(CONSENT_KEY, value);
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

function disabledConsent(): PersistedConsent {
  return {
    schemaVersion: 1,
    enabled: false,
    acceptedAtMs: null,
    windowStartMs: null,
    windowEndMs: null,
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
