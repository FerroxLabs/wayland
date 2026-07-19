/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Select, Switch } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PreferenceRow } from '@renderer/components/settings/shared';
import {
  COHORT_ASSIGNMENTS,
  type CohortAssignment,
  type CohortAssignmentRequestResult,
  type CohortAssignmentStatus,
  type CohortAuthorityProjection,
  type CohortConsentStatus,
  type CohortSetConsentResult,
} from '@/common/types/cohortRollout';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

type CohortConsentApi = Readonly<{
  cohortAuthorityStatus?: () => Promise<unknown>;
  cohortSetConsent?: (enabled: boolean) => Promise<unknown>;
  cohortRequestAssignment?: (cohort: CohortAssignment) => Promise<unknown>;
}>;

type ConsentViewState = 'loading' | 'ready' | 'unavailable' | 'error';

const DISABLED_STATUS: CohortConsentStatus = Object.freeze({
  enabled: false,
  acceptedAtMs: null,
  observationWindow: null,
});

const UNAVAILABLE_ASSIGNMENT: CohortAssignmentStatus = Object.freeze({
  available: false,
  effectiveCohort: null,
  classifiedAtMs: null,
  observationState: 'unavailable',
});

function getCohortConsentApi(): CohortConsentApi | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { electronAPI?: CohortConsentApi }).electronAPI;
}

function parseConsentStatus(value: unknown): CohortConsentStatus | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).toSorted();
  if (keys.join('\0') !== ['acceptedAtMs', 'enabled', 'observationWindow'].toSorted().join('\0')) return null;
  if (typeof record.enabled !== 'boolean') return null;
  if (!isNullableTimestamp(record.acceptedAtMs)) return null;

  if (record.enabled) {
    if (record.acceptedAtMs === null || !isObservationWindow(record.observationWindow)) return null;
    return Object.freeze({
      enabled: true,
      acceptedAtMs: record.acceptedAtMs,
      observationWindow: record.observationWindow,
    });
  }
  if (record.acceptedAtMs !== null || record.observationWindow !== null) return null;
  return DISABLED_STATUS;
}

function parseSetConsentResult(value: unknown): CohortSetConsentResult | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).toSorted().join('\0') !== ['assignment', 'consent', 'generation', 'status'].join('\0'))
    return null;
  if (
    !['enabled', 'disabled', 'window-complete', 'storage-error', 'assignment-unavailable'].includes(
      String(record.status)
    )
  )
    return null;
  const consent = parseConsentStatus(record.consent);
  const assignment = parseAssignmentStatus(record.assignment);
  if (
    !consent ||
    !assignment ||
    !validGeneration(record.generation) ||
    !validProjectionCombination(record.generation, consent, assignment)
  )
    return null;
  return {
    status: record.status as CohortSetConsentResult['status'],
    generation: record.generation,
    consent,
    assignment,
  };
}

function parseAuthorityProjection(value: unknown): CohortAuthorityProjection | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).toSorted().join('\0') !== ['assignment', 'consent', 'generation'].join('\0')) return null;
  const consent = parseConsentStatus(record.consent);
  const assignment = parseAssignmentStatus(record.assignment);
  if (
    !consent ||
    !assignment ||
    !validGeneration(record.generation) ||
    !validProjectionCombination(record.generation, consent, assignment)
  )
    return null;
  return Object.freeze({ generation: record.generation, consent, assignment });
}

function validGeneration(value: unknown): value is number | null {
  return value === null || (Number.isSafeInteger(value) && Number(value) >= 1);
}

function validProjectionCombination(
  generation: number | null,
  consent: CohortConsentStatus,
  assignment: CohortAssignmentStatus
): boolean {
  if (generation === null) return !assignment.available && !consent.enabled;
  if (!assignment.available) return false;
  if (consent.enabled) return assignment.observationState === 'active' || assignment.observationState === 'completed';
  return assignment.observationState !== 'active';
}

function parseAssignmentStatus(value: unknown): CohortAssignmentStatus | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).toSorted().join('\0') !==
    ['available', 'classifiedAtMs', 'effectiveCohort', 'observationState'].toSorted().join('\0')
  ) {
    return null;
  }
  if (typeof record.available !== 'boolean') return null;
  if (!['unavailable', 'ready', 'locked', 'active', 'revoked', 'completed'].includes(String(record.observationState))) {
    return null;
  }
  if (!record.available) {
    return record.effectiveCohort === null &&
      record.classifiedAtMs === null &&
      record.observationState === 'unavailable'
      ? UNAVAILABLE_ASSIGNMENT
      : null;
  }
  if (
    typeof record.effectiveCohort !== 'string' ||
    !COHORT_ASSIGNMENTS.includes(record.effectiveCohort as CohortAssignment) ||
    !Number.isSafeInteger(record.classifiedAtMs) ||
    Number(record.classifiedAtMs) < 0 ||
    record.observationState === 'unavailable'
  ) {
    return null;
  }
  return Object.freeze({
    available: true,
    effectiveCohort: record.effectiveCohort as CohortAssignment,
    classifiedAtMs: Number(record.classifiedAtMs),
    observationState: record.observationState as 'ready' | 'locked' | 'active' | 'revoked' | 'completed',
  });
}

function parseAssignmentResult(value: unknown): CohortAssignmentRequestResult | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).toSorted().join('\0') !== ['assignment', 'status'].join('\0')) return null;
  if (
    !['classified', 'unchanged', 'window-active', 'confirmation-denied', 'storage-error', 'invalid-request'].includes(
      String(record.status)
    )
  ) {
    return null;
  }
  const assignment = parseAssignmentStatus(record.assignment);
  return assignment ? { status: record.status as CohortAssignmentRequestResult['status'], assignment } : null;
}

function isObservationWindow(value: unknown): value is Readonly<{ startMs: number; endMs: number }> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).toSorted().join('\0') === ['endMs', 'startMs'].join('\0') &&
    isNullableTimestamp(record.startMs) &&
    record.startMs !== null &&
    isNullableTimestamp(record.endMs) &&
    record.endMs !== null &&
    record.endMs - record.startMs === FOURTEEN_DAYS_MS
  );
}

function isNullableTimestamp(value: unknown): value is number | null {
  return value === null || (Number.isSafeInteger(value) && (value as number) >= 0);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(timestamp));
}

const CohortEvidenceConsent: React.FC = () => {
  const { t } = useTranslation();
  const [viewState, setViewState] = useState<ConsentViewState>('loading');
  const [status, setStatus] = useState<CohortConsentStatus>(DISABLED_STATUS);
  const [assignment, setAssignment] = useState<CohortAssignmentStatus>(UNAVAILABLE_ASSIGNMENT);
  const [saving, setSaving] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const api = getCohortConsentApi();
    if (!api?.cohortAuthorityStatus || !api.cohortSetConsent || !api.cohortRequestAssignment) {
      setViewState('unavailable');
      return () => {
        active = false;
      };
    }

    void api
      .cohortAuthorityStatus()
      .then((authorityResult) => {
        if (!active) return;
        const projection = parseAuthorityProjection(authorityResult);
        if (!projection) {
          setStatus(DISABLED_STATUS);
          setAssignment(UNAVAILABLE_ASSIGNMENT);
          setViewState('error');
          return;
        }
        setStatus(projection.consent);
        setAssignment(projection.assignment);
        setViewState('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus(DISABLED_STATUS);
        setAssignment(UNAVAILABLE_ASSIGNMENT);
        setViewState('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const requestAssignment = async (cohort: CohortAssignment): Promise<void> => {
    if (
      viewState !== 'ready' ||
      saving ||
      assignment.observationState === 'active' ||
      assignment.observationState === 'locked' ||
      assignment.observationState === 'revoked' ||
      assignment.observationState === 'completed'
    ) {
      return;
    }
    const api = getCohortConsentApi();
    if (!api?.cohortRequestAssignment) {
      setViewState('unavailable');
      return;
    }
    setSaving(true);
    setUpdateFailed(false);
    try {
      const result = parseAssignmentResult(await api.cohortRequestAssignment(cohort));
      if (result?.status === 'confirmation-denied') return;
      if (
        !result ||
        !['classified', 'unchanged'].includes(result.status) ||
        !result.assignment.available ||
        result.assignment.effectiveCohort !== cohort
      ) {
        throw new Error('Cohort classification was not acknowledged');
      }
      setAssignment(result.assignment);
    } catch {
      setUpdateFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const setConsent = async (enabled: boolean): Promise<void> => {
    if (viewState !== 'ready' || saving) return;
    const api = getCohortConsentApi();
    if (!api?.cohortSetConsent) {
      setViewState('unavailable');
      return;
    }

    setSaving(true);
    setUpdateFailed(false);
    try {
      const result = parseSetConsentResult(await api.cohortSetConsent(enabled));
      const expectedStatus = enabled ? 'enabled' : 'disabled';
      if (!result || result.status !== expectedStatus || result.consent.enabled !== enabled) {
        throw new Error('Consent update was not acknowledged');
      }
      setStatus(result.consent);
      setAssignment(result.assignment);
    } catch {
      // Do not optimistically claim a privacy choice changed. Keep the last
      // authoritative status visible and tell the user that it is unchanged.
      setUpdateFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const unavailable = viewState === 'unavailable' || viewState === 'error';
  const stateText = (() => {
    if (viewState === 'loading') {
      return t('settings.navigationPage.evidenceChecking');
    }
    if (unavailable) {
      return t('settings.navigationPage.evidenceUnavailable');
    }
    if (!status.enabled || status.observationWindow === null) {
      return t('settings.navigationPage.evidenceWindowInactive');
    }
    return t(
      assignment.observationState === 'completed'
        ? 'settings.navigationPage.evidenceWindowCompleted'
        : 'settings.navigationPage.evidenceWindowActive',
      {
        start: formatDate(status.observationWindow.startMs),
        end: formatDate(status.observationWindow.endMs),
      }
    );
  })();

  return (
    <div className='mt-10px border-t border-[var(--color-border-2)] pt-8px' data-testid='cohort-evidence-consent'>
      <PreferenceRow
        label={t('settings.navigationPage.cohortAssignmentLabel')}
        help={t('settings.navigationPage.cohortAssignmentHelp')}
      >
        <Select
          value={assignment.effectiveCohort ?? ''}
          disabled={
            viewState !== 'ready' ||
            saving ||
            assignment.observationState === 'active' ||
            assignment.observationState === 'locked' ||
            assignment.observationState === 'revoked' ||
            assignment.observationState === 'completed'
          }
          onChange={(value) => void requestAssignment(value as CohortAssignment)}
          aria-label={t('settings.navigationPage.cohortAssignmentLabel')}
          data-testid='cohort-assignment-select'
          placeholder={t('settings.navigationPage.cohortAssignmentPlaceholder')}
          options={COHORT_ASSIGNMENTS.map((cohort) => ({
            value: cohort,
            label: t(`settings.navigationPage.cohort.${cohort}`),
          }))}
        />
      </PreferenceRow>
      <p className='text-12px text-t-secondary' data-testid='cohort-assignment-state'>
        {assignment.observationState === 'active' ||
        assignment.observationState === 'locked' ||
        assignment.observationState === 'revoked' ||
        assignment.observationState === 'completed'
          ? t(
              assignment.observationState === 'completed'
                ? 'settings.navigationPage.cohortAssignmentCompleted'
                : 'settings.navigationPage.cohortAssignmentActive'
            )
          : assignment.available
            ? t('settings.navigationPage.cohortAssignmentReady')
            : t('settings.navigationPage.cohortAssignmentUnavailable')}
      </p>
      <PreferenceRow
        label={t('settings.navigationPage.evidenceConsentLabel')}
        help={t('settings.navigationPage.evidenceConsentHelp')}
      >
        <Switch
          checked={viewState === 'ready' && status.enabled}
          disabled={viewState !== 'ready' || saving || !assignment.available}
          loading={saving}
          onChange={(enabled) => void setConsent(enabled)}
          aria-label={t('settings.navigationPage.evidenceConsentLabel')}
          data-testid='cohort-evidence-consent-toggle'
        />
      </PreferenceRow>
      <p className='text-12px text-t-secondary' data-testid='cohort-evidence-window-state'>
        {stateText}
      </p>
      <p className='mt-4px text-12px text-t-secondary'>{t('settings.navigationPage.evidenceConsentControl')}</p>
      {updateFailed && (
        <p className='mt-4px text-12px text-[var(--danger)]' role='alert'>
          {t('settings.navigationPage.evidenceConsentUpdateFailed')}
        </p>
      )}
    </div>
  );
};

export default CohortEvidenceConsent;
