/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Switch } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PreferenceRow } from '@renderer/components/settings/shared';
import type { CohortConsentStatus, CohortSetConsentResult } from '@/common/types/cohortRollout';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

type CohortConsentApi = Readonly<{
  cohortConsentStatus?: () => Promise<unknown>;
  cohortSetConsent?: (enabled: boolean) => Promise<unknown>;
}>;

type ConsentViewState = 'loading' | 'ready' | 'unavailable' | 'error';

const DISABLED_STATUS: CohortConsentStatus = Object.freeze({
  enabled: false,
  acceptedAtMs: null,
  observationWindow: null,
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
  if (Object.keys(record).toSorted().join('\0') !== ['consent', 'status'].join('\0')) return null;
  if (!['enabled', 'disabled', 'storage-error'].includes(String(record.status))) return null;
  const consent = parseConsentStatus(record.consent);
  if (!consent) return null;
  return { status: record.status as CohortSetConsentResult['status'], consent };
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
  const [saving, setSaving] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const api = getCohortConsentApi();
    if (!api?.cohortConsentStatus || !api.cohortSetConsent) {
      setViewState('unavailable');
      return () => {
        active = false;
      };
    }

    void api
      .cohortConsentStatus()
      .then((result) => {
        if (!active) return;
        const parsed = parseConsentStatus(result);
        if (!parsed) {
          setStatus(DISABLED_STATUS);
          setViewState('error');
          return;
        }
        setStatus(parsed);
        setViewState('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus(DISABLED_STATUS);
        setViewState('error');
      });

    return () => {
      active = false;
    };
  }, []);

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
      return t('settings.navigationPage.evidenceChecking', { defaultValue: 'Checking consent status…' });
    }
    if (unavailable) {
      return t('settings.navigationPage.evidenceUnavailable', {
        defaultValue: 'Evidence sharing is unavailable in this build, so it remains off.',
      });
    }
    if (!status.enabled || status.observationWindow === null) {
      return t('settings.navigationPage.evidenceWindowInactive', {
        defaultValue: 'No evidence window is active.',
      });
    }
    return t('settings.navigationPage.evidenceWindowActive', {
      defaultValue: 'Active 14-day window: {{start}} – {{end}}.',
      start: formatDate(status.observationWindow.startMs),
      end: formatDate(status.observationWindow.endMs),
    });
  })();

  return (
    <div className='mt-10px border-t border-[var(--color-border-2)] pt-8px' data-testid='cohort-evidence-consent'>
      <PreferenceRow
        label={t('settings.navigationPage.evidenceConsentLabel', {
          defaultValue: 'Collect local aggregate evidence',
        })}
        help={t('settings.navigationPage.evidenceConsentHelp', {
          defaultValue:
            'Local aggregate evidence only: session counts, task outcomes, reliability, accessibility, and return-to-Classic reasons. Never chat messages, prompts, file contents, filenames, paths, URLs, tool arguments, or free-form text.',
        })}
      >
        <Switch
          checked={viewState === 'ready' && status.enabled}
          disabled={viewState !== 'ready' || saving}
          loading={saving}
          onChange={(enabled) => void setConsent(enabled)}
          aria-label={t('settings.navigationPage.evidenceConsentLabel', {
            defaultValue: 'Collect local aggregate evidence',
          })}
          data-testid='cohort-evidence-consent-toggle'
        />
      </PreferenceRow>
      <p className='text-12px text-t-secondary' data-testid='cohort-evidence-window-state'>
        {stateText}
      </p>
      <p className='mt-4px text-12px text-t-secondary'>
        {t('settings.navigationPage.evidenceConsentControl', {
          defaultValue: 'Off until you explicitly enable it. You can revoke consent at any time.',
        })}
      </p>
      {updateFailed && (
        <p className='mt-4px text-12px text-[var(--danger)]' role='alert'>
          {t('settings.navigationPage.evidenceConsentUpdateFailed', {
            defaultValue: "Wayland couldn't update this setting. The last confirmed choice remains in effect.",
          })}
        </p>
      )}
    </div>
  );
};

export default CohortEvidenceConsent;
