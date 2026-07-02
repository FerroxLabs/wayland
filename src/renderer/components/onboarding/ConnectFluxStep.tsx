/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from '@arco-design/web-react';
import { Link as LinkIcon, Loading, Right } from '@icon-park/react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import { openExternalUrl } from '@renderer/utils/platform';
import type { ConnectError } from '@process/providers/types';
import styles from './OnboardingOverlay.module.css';

const FLUX_KEY_URL = 'https://fluxrouter.ai/home/api-keys';

const ERROR_KEYS: Record<ConnectError, string> = {
  unauthorized: 'onboarding.connect.errorUnauthorized',
  'no-credit': 'onboarding.connect.errorNoCredit',
  offline: 'onboarding.connect.errorOffline',
  unrecognized: 'onboarding.connect.errorUnrecognized',
  'no-models': 'onboarding.connect.errorNoModels',
  // WebUI-only guard failures (#524) - the desktop onboarding flow never hits
  // these, but the map must stay exhaustive over ConnectError.
  'https-required': 'onboarding.connect.errorUnknown',
  'csrf-invalid': 'onboarding.connect.errorUnknown',
  'auth-required': 'onboarding.connect.errorUnknown',
  unknown: 'onboarding.connect.errorUnknown',
};

type ConnectFluxStepProps = {
  /** Called after a successful `connect('flux-router', …)`. */
  onConnected: () => void;
  /** Called when the user backs out of the connect step. */
  onBack: () => void;
};

/**
 * Inline "Connect Flux Router" step rendered inside the onboarding overlay.
 *
 * Collects a Flux Router key (sk-...), connects via the model registry, and on success
 * dismisses onboarding. Provides a link to grab a key at fluxrouter.ai.
 */
const ConnectFluxStep: React.FC<ConnectFluxStepProps> = ({ onConnected, onBack }) => {
  const { t } = useTranslation();
  const { connect } = useModelRegistry();
  const [key, setKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    const trimmed = key.trim();
    if (!trimmed || connecting) return;

    setConnecting(true);
    setErrorKey(null);
    try {
      const res = await connect('flux-router', { key: trimmed });
      if (res.ok) {
        onConnected();
        return;
      }
      setErrorKey(ERROR_KEYS[res.error ?? 'unknown']);
    } catch {
      setErrorKey(ERROR_KEYS.unknown);
    } finally {
      setConnecting(false);
    }
  }, [key, connecting, connect, onConnected]);

  const handleGetKey = useCallback(() => {
    void openExternalUrl(FLUX_KEY_URL);
  }, []);

  return (
    <div className={styles.connectStep}>
      <h2 className={styles.connectTitle}>{t('onboarding.connect.title')}</h2>
      <p className={styles.connectSub}>{t('onboarding.connect.subtitle')}</p>
      <p className={styles.connectTrust}>{t('onboarding.connect.trust')}</p>

      <Input.Password
        value={key}
        onChange={setKey}
        placeholder={t('onboarding.connect.keyPlaceholder')}
        aria-label={t('onboarding.connect.keyLabel')}
        onPressEnter={() => void handleConnect()}
        disabled={connecting}
      />

      {errorKey && <div className={styles.connectError}>{t(errorKey)}</div>}

      <div className={styles.connectActions}>
        <Button
          type='primary'
          loading={connecting}
          disabled={!key.trim()}
          icon={connecting ? <Loading /> : <Right />}
          onClick={() => void handleConnect()}
        >
          {connecting ? t('onboarding.connect.connecting') : t('onboarding.connect.submit')}
        </Button>
        <Button type='text' onClick={onBack} disabled={connecting}>
          {t('onboarding.connect.back')}
        </Button>
        <Button type='text' icon={<LinkIcon />} onClick={handleGetKey}>
          {t('onboarding.connect.getKey')}
        </Button>
      </div>
    </div>
  );
};

export default ConnectFluxStep;
