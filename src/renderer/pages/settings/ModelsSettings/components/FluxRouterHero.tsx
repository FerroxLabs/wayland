/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '@arco-design/web-react';
import { Link as LinkIcon, Loading, Right } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryConnectResult } from '@/common/adapter/ipcBridge';
import type { ConnectError } from '@process/providers/types';
import type { FluxMetrics } from '@/common/types/onboarding';
import { openExternalUrl } from '@renderer/utils/platform';
import FluxRouterMark from '@renderer/components/icons/FluxRouterMark';
import styles from './FluxRouterHero.module.css';

/** External link to grab a Flux Router API key (BYO key flow). */
const FLUX_KEY_URL = 'https://fluxrouter.ai/home/api-keys';

/**
 * Public model-count figure for Flux Router. Deliberately the conservative
 * "40+" (the live catalog is ~43) rather than a hardcoded exact - it stays true
 * as the catalog shifts and never contradicts the live per-provider count.
 */
const FLUX_MODEL_COUNT = '40+';

/** Minimum routed turns before the live metrics line is shown (per V4 mockup). */
const MIN_TURNS_FOR_METRICS = 10;

const ERROR_KEYS: Record<ConnectError, string> = {
  unauthorized: 'settings.modelsPage.flux.errorUnauthorized',
  'no-credit': 'settings.modelsPage.flux.errorNoCredit',
  offline: 'settings.modelsPage.flux.errorOffline',
  unrecognized: 'settings.modelsPage.flux.errorUnrecognized',
  'no-models': 'settings.modelsPage.flux.errorNoModels',
  'https-required': 'settings.modelsPage.flux.errorHttpsRequired',
  'csrf-invalid': 'settings.modelsPage.flux.errorCsrfInvalid',
  'auth-required': 'settings.modelsPage.flux.errorAuthRequired',
  unknown: 'settings.modelsPage.flux.errorUnknown',
};

/** Narrow an arbitrary IPC payload into a `FluxMetrics`, or `null` if invalid. */
function parseFluxMetrics(raw: unknown): FluxMetrics | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const totalTurns = typeof obj.totalTurns === 'number' ? obj.totalTurns : null;
  const hist = obj.histogram as Record<string, unknown> | undefined;
  if (totalTurns === null || !hist || typeof hist !== 'object') return null;
  const { h, s, o } = hist;
  if (typeof h !== 'number' || typeof s !== 'number' || typeof o !== 'number') return null;
  return {
    totalTurns,
    histogram: { h, s, o },
    savings: typeof obj.savings === 'string' ? obj.savings : undefined,
  };
}

type FluxRouterHeroProps = {
  /** Whether `flux-router` is a connected provider in the registry. */
  connected: boolean;
  /** Connect a pasted Flux Router key (delegates to the model registry). */
  onConnectKey: (key: string) => Promise<IModelRegistryConnectResult>;
};

/**
 * Flux Router hero - the front-and-center treatment at the top of the Models
 * page.
 *
 *  - Connected + live metrics → a reinforcement line proving Flux Router is
 *    routing (last-N histogram + optional savings from the daemon).
 *  - Connected, no metrics (daemon not running / pre-warmup) → a calm
 *    "connected · N models · routed per request" confirmation. No fabricated
 *    numbers.
 *  - Not connected → a recommendation card with a primary "Connect Flux Router"
 *    action (inline paste-key form) and a "Get a key at fluxrouter.ai" link.
 */
const FluxRouterHero: React.FC<FluxRouterHeroProps> = ({ connected, onConnectKey }) => {
  const { t } = useTranslation();

  const [metrics, setMetrics] = useState<FluxMetrics | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [key, setKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // #524: verbatim server text for an unclassified failure (hosted WebUI path).
  const [errorRaw, setErrorRaw] = useState<string | null>(null);

  // Pull live routing metrics from the Flux Desktop daemon when connected.
  // Best-effort: a null payload (daemon down / pre-warmup) leaves the hero in
  // the calm confirmation state. Mirrors SiderMemoryEntry's cancelled-guard.
  useEffect(() => {
    if (!connected) {
      setMetrics(null);
      return;
    }
    let cancelled = false;
    const api = (window as unknown as { electronAPI?: { onboardingFluxMetrics?: () => Promise<unknown | null> } })
      .electronAPI;
    if (!api?.onboardingFluxMetrics) return;
    void api
      .onboardingFluxMetrics()
      .then((raw) => {
        if (!cancelled) setMetrics(parseFluxMetrics(raw));
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      });
    return () => {
      cancelled = true;
    };
  }, [connected]);

  const handleConnect = useCallback(async () => {
    const trimmed = key.trim();
    if (!trimmed || connecting) return;
    setConnecting(true);
    setErrorKey(null);
    setErrorRaw(null);
    try {
      const res = await onConnectKey(trimmed);
      if (res.ok) {
        setKey('');
        setShowConnect(false);
        return;
      }
      setErrorKey(ERROR_KEYS[res.error ?? 'unknown']);
      setErrorRaw(res.error === 'unknown' && res.errorMessage ? res.errorMessage : null);
    } catch {
      setErrorKey(ERROR_KEYS.unknown);
    } finally {
      setConnecting(false);
    }
  }, [key, connecting, onConnectKey]);

  const handleGetKey = useCallback(() => {
    void openExternalUrl(FLUX_KEY_URL);
  }, []);

  // ----- Connected -----
  if (connected) {
    const hasLiveMetrics = metrics !== null && metrics.totalTurns >= MIN_TURNS_FOR_METRICS;
    return (
      <div className={`${styles.hero} ${styles.heroConnected}`} data-testid='flux-router-hero' data-state='connected'>
        <div className={styles.glyph} aria-hidden>
          <FluxRouterMark size={18} color='currentColor' />
        </div>
        <div className='min-w-0 flex-1'>
          {hasLiveMetrics ? (
            <>
              <div className={styles.connectedTitle}>{t('settings.modelsPage.flux.routing')}</div>
              <div className={styles.metricsLine} data-testid='flux-router-metrics'>
                {t('settings.modelsPage.flux.metricsTurns', { count: metrics.totalTurns })}{' '}
                <span className={styles.histogram}>
                  {t('settings.modelsPage.flux.histogram', {
                    flagship: metrics.histogram.h,
                    small: metrics.histogram.s,
                    local: metrics.histogram.o,
                  })}
                </span>
                {metrics.savings && (
                  <>
                    <span aria-hidden> · </span>
                    <span className={styles.savings}>{metrics.savings}</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={styles.connectedTitle}>{t('settings.modelsPage.flux.routing')}</div>
              <div className={styles.connectedSub} data-testid='flux-router-confirmation'>
                {t('settings.modelsPage.flux.activeConfirmation', { count: FLUX_MODEL_COUNT })}
              </div>
            </>
          )}
          <div className={styles.trust}>{t('settings.modelsPage.flux.trust')}</div>
        </div>
      </div>
    );
  }

  // ----- Not connected -----
  return (
    <div className={styles.hero} data-testid='flux-router-hero' data-state='disconnected'>
      <div className={styles.brandRow}>
        <span className={styles.brandGlyph} aria-hidden>
          <FluxRouterMark size={20} />
        </span>
        <span className={styles.brandWordmark}>{t('settings.modelsPage.flux.name')}</span>
        <span className={styles.recommendedTag}>{t('settings.modelsPage.flux.recommended')}</span>
      </div>
      <h3 className={styles.headline}>{t('settings.modelsPage.flux.headline')}</h3>
      <p className={styles.body}>{t('settings.modelsPage.flux.body')}</p>
      <p className={`${styles.trust} ${styles.trustCard}`}>{t('settings.modelsPage.flux.trust')}</p>

      {showConnect ? (
        <div className={styles.connectForm}>
          <Input.Password
            value={key}
            onChange={setKey}
            placeholder={t('settings.modelsPage.flux.keyPlaceholder')}
            aria-label={t('settings.modelsPage.flux.keyLabel')}
            onPressEnter={() => void handleConnect()}
            disabled={connecting}
            className='flex-1'
          />
          <Button
            type='primary'
            loading={connecting}
            disabled={!key.trim()}
            icon={connecting ? <Loading /> : <Right />}
            onClick={() => void handleConnect()}
          >
            {connecting ? t('settings.modelsPage.flux.connecting') : t('settings.modelsPage.flux.connect')}
          </Button>
        </div>
      ) : (
        <div className={styles.ctaRow}>
          <Button
            type='primary'
            icon={<FluxRouterMark size={15} color='currentColor' />}
            onClick={() => setShowConnect(true)}
          >
            {t('settings.modelsPage.flux.connect')}
          </Button>
          <Button type='text' icon={<LinkIcon />} onClick={handleGetKey}>
            {t('settings.modelsPage.flux.getKey')}
          </Button>
        </div>
      )}

      {(errorRaw || errorKey) && (
        <div className={styles.error} role='alert'>
          {errorRaw ?? t(errorKey as string, { provider: t('settings.modelsPage.flux.name') })}
        </div>
      )}
    </div>
  );
};

export default FluxRouterHero;
