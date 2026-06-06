import React from 'react';
import { Button, Spin } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryProviderView } from '@/common/adapter/ipcBridge';
import type { ConnectError } from '@process/providers/types';
import FluxRouterMark from '@renderer/components/icons/FluxRouterMark';
import { providerMeta } from '../providerCatalog';
import styles from '../ModelsSettings.module.css';

type Props = {
  provider: IModelRegistryProviderView;
  /** Open the Manage page for this provider (Packet 2B). */
  onManage: (provider: IModelRegistryProviderView) => void;
  /** Open re-key for a provider in the error state (Packet 2B). */
  onFix: (provider: IModelRegistryProviderView) => void;
};

/** Map a registry error code to its i18n key suffix for the status line. */
const ERROR_KEY: Record<ConnectError, string> = {
  unauthorized: 'errorUnauthorized',
  'no-credit': 'errorNoCredit',
  offline: 'errorOffline',
  unrecognized: 'errorUnrecognized',
  'no-models': 'errorNoModels',
  unknown: 'errorUnknown',
};

/**
 * Map a backend `connectedVia` enum value to its i18n key suffix. The backend
 * (`modelRegistryIpc.connectedViaLabel`) only ever emits these three literals.
 */
const VIA_KEY: Record<string, string> = {
  'api-key': 'apiKey',
  'auto-discovered': 'autoDiscovered',
  'cloud-credentials': 'cloudCredentials',
};

/**
 * One compact connected-provider row. No chips, no overflow menu (spec §4.2).
 *
 * Drives three states from the registry view:
 *  - `connected` - green dot, model count, Manage.
 *  - `testing`   - spinner, "Testing…", Manage hidden.
 *  - `error`     - persistent "Action needed" status + a red Fix action
 *                  (spec §4.3 - never a stale green badge).
 *
 * `no-models` is an honest sub-case: the provider connected but returned zero
 * models, so the row stays `connected` with a recovery hint instead of a count.
 */
const ConnectedRow: React.FC<Props> = ({ provider, onManage, onFix }) => {
  const { t } = useTranslation();
  const meta = providerMeta(provider.providerId);

  const isError = provider.state === 'error';
  const isTesting = provider.state === 'testing';
  const noModels = !isError && !isTesting && provider.modelCount === 0;

  // Localize the `connectedVia` enum; fall back to the raw value if the backend
  // ever emits an unmapped literal so the row still renders something readable.
  const viaSuffix = VIA_KEY[provider.connectedVia];
  const viaLabel = viaSuffix ? t(`settings.modelsPage.row.via.${viaSuffix}`) : provider.connectedVia;

  const rowClass = [styles.row, isTesting ? styles.rowTesting : '', isError ? styles.rowError : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClass} data-provider={provider.providerId} data-state={provider.state}>
      {meta.id === 'flux-router' ? (
        <div className={styles.avatar} style={{ background: '#141414' }} aria-hidden>
          <FluxRouterMark size={20} />
        </div>
      ) : (
        <div
          className={styles.avatar}
          style={{ background: meta.bg, color: meta.darkText ? '#1a1a1a' : '#fff' }}
          aria-hidden
        >
          {meta.mono}
        </div>
      )}

      <div className='min-w-0'>
        <div className={styles.rowName}>{meta.displayName}</div>
        <div className={styles.rowVia}>{viaLabel}</div>
      </div>

      {isTesting && (
        <div className={`${styles.status} ${styles.statusTesting}`}>
          <Spin size={14} />
          {t('settings.modelsPage.row.testing')}
        </div>
      )}

      {isError && (
        <div className={`${styles.status} ${styles.statusError}`} role='alert'>
          <span className={styles.statusDot} />
          {t('settings.modelsPage.row.actionNeeded', {
            reason: t(`settings.modelsPage.row.${ERROR_KEY[provider.error ?? 'unknown']}`),
          })}
        </div>
      )}

      {!isError && !isTesting && (
        <div className={`${styles.status} ${styles.statusConnected}`}>
          <span className={styles.statusDot} />
          {t('settings.modelsPage.row.connected')}
        </div>
      )}

      {!isError && !isTesting && (
        <>
          <div className={styles.divider} />
          <div className={styles.count}>
            {noModels
              ? t('settings.modelsPage.row.noModelsHint')
              : t('settings.modelsPage.row.modelCount', { count: provider.modelCount })}
          </div>
        </>
      )}

      {isError ? (
        <Button size='small' status='danger' onClick={() => onFix(provider)}>
          {t('settings.modelsPage.row.fix')}
        </Button>
      ) : (
        !isTesting && (
          <Button size='small' onClick={() => onManage(provider)}>
            {t('settings.modelsPage.row.manage')}
          </Button>
        )
      )}
    </div>
  );
};

export default ConnectedRow;
