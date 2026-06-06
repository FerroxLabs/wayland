import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input } from '@arco-design/web-react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryConnectResult, IModelRegistryDetectedKey } from '@/common/adapter/ipcBridge';
import type { ConnectError, ProviderId } from '@process/providers/types';
import { providerMeta, recognizeKey } from '../providerCatalog';
import { getPendingDeepLinkSeed } from '../index';
import DetectedStrip from './DetectedStrip';
import styles from '../ModelsSettings.module.css';

type Props = {
  /** Auto-discovered keys to surface for explicit Use / Ignore. */
  detectedKeys: IModelRegistryDetectedKey[];
  /** Connect a pasted key for an explicitly recognized provider. */
  onConnectKey: (providerId: ProviderId, key: string) => Promise<IModelRegistryConnectResult>;
  /** Connect an auto-discovered key (resolved main-side). */
  onUseDetected: (detectedKey: IModelRegistryDetectedKey) => Promise<IModelRegistryConnectResult>;
  /** Dismiss an auto-discovered key. */
  onIgnoreDetected: (detectedKey: IModelRegistryDetectedKey) => void;
  /**
   * Open the Browse-all-providers modal (Packet 2C). When `providerId` is
   * supplied the modal opens pre-targeted at that provider's sub-view -
   * used for the cloud-key recognition path (an AWS `AKIA…` paste routes
   * directly to the Bedrock credential form, not the grid).
   */
  onBrowse: (providerId?: ProviderId) => void;
  /**
   * Ship-gate Fix C3 - a deep-link nonce bumped by `ModelsSettings` when a
   * new `pendingDeepLinkSeed` arrives. Re-runs the seed-consume effect so a
   * deep-link delivered AFTER the panel's first mount still pre-fills the
   * key. Optional - `0` is the default and won't trigger the effect.
   */
  deepLinkSeedNonce?: number;
};

/**
 * Code keys for the inline-error panel - supersets `ConnectError` with two
 * connect-panel-only variants (`cloud`, `ambiguous`) so a recognized cloud
 * key or an ambiguous bare `sk-` doesn't get mislabelled as "unrecognized".
 */
type PanelErrorCode = ConnectError | 'cloud' | 'ambiguous';

/** Map a panel error code to the inline-error i18n key suffix. */
const ERROR_KEY: Record<PanelErrorCode, string> = {
  unauthorized: 'errorUnauthorized',
  'no-credit': 'errorNoCredit',
  offline: 'errorOffline',
  unrecognized: 'errorUnrecognized',
  cloud: 'errorCloud',
  ambiguous: 'errorAmbiguous',
  'no-models': 'errorNoModels',
  unknown: 'errorUnknown',
};

/**
 * The connect-a-provider hero (prototype `#screen-models` `.connect`).
 *
 * Connect flow (spec §4.3): paste key → live recognition → Connect → a real
 * test call main-side → connected row. Every failure branch renders as inline
 * panel state - unrecognized format, unauthorized, offline, no-credit,
 * no-models - never a silent wrong guess and never a false green.
 */
const ConnectPanel: React.FC<Props> = ({
  detectedKeys,
  onConnectKey,
  onUseDetected,
  onIgnoreDetected,
  onBrowse,
  deepLinkSeedNonce = 0,
}) => {
  const { t } = useTranslation();
  const [keyValue, setKeyValue] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [usingDetected, setUsingDetected] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorProvider, setErrorProvider] = useState<string | null>(null);
  // Ship-gate Fix C3 - show a subtle "from deep link" hint on the input when
  // the key was pre-filled by a `wayland://add-provider?apiKey=…` URL.
  const [seededFromDeepLink, setSeededFromDeepLink] = useState(false);

  // Ship-gate Fix C3 - ModelsSettings stashes a non-cloud deep-link payload in
  // a module-level seed (`getPendingDeepLinkSeed`). Consume it on mount AND
  // each time `deepLinkSeedNonce` bumps so a deep-link delivered after the
  // panel's first mount still pre-fills the input.
  useEffect(() => {
    const seed = getPendingDeepLinkSeed();
    if (seed?.apiKey) {
      setKeyValue(seed.apiKey);
      setSeededFromDeepLink(true);
    }
  }, [deepLinkSeedNonce]);

  const recognition = useMemo(() => recognizeKey(keyValue), [keyValue]);

  /** Live recognition hint shown under the key input. */
  const hint = useMemo<React.ReactNode>(() => {
    if (!keyValue.trim()) {
      return t('settings.modelsPage.connect.hintDefault');
    }
    if (recognition.kind === 'recognized') {
      return (
        <>
          {t('settings.modelsPage.connect.recognized')} <b>{providerMeta(recognition.provider).displayName}</b>
        </>
      );
    }
    if (recognition.kind === 'cloud') {
      return (
        <>
          {t('settings.modelsPage.connect.recognized')} <b>{providerMeta(recognition.provider).displayName}</b>
          {' - '}
          {t('settings.modelsPage.connect.cloudHint')}
        </>
      );
    }
    if (recognition.kind === 'ambiguous') {
      return t('settings.modelsPage.connect.hintAmbiguous');
    }
    // unknown
    return (
      <>
        {t('settings.modelsPage.connect.unrecognizedPrefix')}{' '}
        <b>{t('settings.modelsPage.connect.unrecognizedBrowse')}</b>
      </>
    );
  }, [keyValue, recognition, t]);

  const onInput = useCallback((value: string) => {
    setKeyValue(value);
    setErrorKey(null);
    setErrorProvider(null);
    // Once the user edits the field the deep-link badge no longer makes sense.
    setSeededFromDeepLink(false);
  }, []);

  const showError = useCallback((code: PanelErrorCode, providerName?: string) => {
    setErrorKey(ERROR_KEY[code]);
    setErrorProvider(providerName ?? null);
  }, []);

  const handleConnect = useCallback(async () => {
    const key = keyValue.trim();
    if (!key) return;

    // Unrecognized / cloud / ambiguous formats never connect as a bare key -
    // each surfaces its own honest message and (for cloud) hops straight to
    // the matching credential form (spec §4.3).
    if (recognition.kind === 'unknown') {
      showError('unrecognized');
      return;
    }
    if (recognition.kind === 'cloud') {
      // Hop the user directly to the cloud credential form for the
      // recognized provider - that's where the additional fields live.
      onBrowse(recognition.provider);
      return;
    }
    if (recognition.kind === 'ambiguous') {
      showError('ambiguous');
      return;
    }

    setConnecting(true);
    setErrorKey(null);
    setErrorProvider(null);
    const providerName = providerMeta(recognition.provider).displayName;
    try {
      const res = await onConnectKey(recognition.provider, key);
      if (res.ok) {
        setKeyValue('');
      } else {
        showError(res.error ?? 'unknown', providerName);
      }
    } catch {
      showError('unknown', providerName);
    } finally {
      setConnecting(false);
    }
  }, [keyValue, recognition, onConnectKey, showError]);

  const handleUseDetected = useCallback(
    async (detectedKey: IModelRegistryDetectedKey) => {
      setUsingDetected(detectedKey.providerId);
      try {
        const res = await onUseDetected(detectedKey);
        if (!res.ok) {
          showError(res.error ?? 'unknown', providerMeta(detectedKey.providerId).displayName);
        }
      } catch {
        showError('unknown', providerMeta(detectedKey.providerId).displayName);
      } finally {
        setUsingDetected(null);
      }
    },
    [onUseDetected, showError]
  );

  const errorText = errorKey
    ? t(`settings.modelsPage.connect.${errorKey}`, {
        provider: errorProvider ?? t('settings.modelsPage.connect.thatProvider'),
      })
    : null;

  return (
    <div className={styles.connectPanel}>
      <h3 className={styles.connectTitle}>{t('settings.modelsPage.connect.title')}</h3>

      {detectedKeys.map((dk) => (
        <DetectedStrip
          key={`${dk.providerId}:${dk.source}`}
          detectedKey={dk}
          onUse={handleUseDetected}
          onIgnore={onIgnoreDetected}
          busy={usingDetected === dk.providerId}
        />
      ))}

      <div className={styles.keyLabel}>{t('settings.modelsPage.connect.keyLabel')}</div>
      <div className={styles.keyRow}>
        <Input.Password
          value={keyValue}
          onChange={onInput}
          onPressEnter={() => void handleConnect()}
          placeholder={t('settings.modelsPage.connect.keyPlaceholder')}
          aria-label={t('settings.modelsPage.connect.keyLabel')}
          className='flex-1'
          disabled={connecting}
        />
        <Button type='primary' loading={connecting} disabled={!keyValue.trim()} onClick={() => void handleConnect()}>
          {t('settings.modelsPage.connect.connect')}
        </Button>
      </div>
      <div className={styles.keyHint}>
        {seededFromDeepLink && (
          <>
            <span data-testid='deep-link-seed-badge'>
              {t('settings.modelsPage.connect.fromDeepLink', { defaultValue: 'From deep link' })}
            </span>
            <span aria-hidden='true'> · </span>
          </>
        )}
        {hint}
      </div>

      {errorText && (
        <div className={styles.connectError} role='alert'>
          <AlertTriangle size={14} aria-hidden='true' />
          <span>{errorText}</span>
        </div>
      )}

      <div className={styles.browseLink}>
        <Button type='text' size='small' onClick={() => onBrowse()}>
          {t('settings.modelsPage.connect.browse')}
        </Button>
      </div>
    </div>
  );
};

export default ConnectPanel;
