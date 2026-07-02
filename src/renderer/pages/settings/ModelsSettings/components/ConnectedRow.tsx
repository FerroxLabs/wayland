import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Message, Spin, Switch, Tooltip } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryProviderView } from '@/common/adapter/ipcBridge';
import type { ConnectError, CuratedModel } from '@process/providers/types';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import FluxRouterMark from '@renderer/components/icons/FluxRouterMark';
import ProviderLogo from '@renderer/components/model/ProviderLogo';
import { providerMeta } from '../providerCatalog';
import { defaultOnIds, enabledCount, mergeCatalogRows } from './bulkToggle';
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
  // WebUI-only guard failures (#524); never produced on this desktop row path,
  // but the map must stay exhaustive over ConnectError.
  'https-required': 'errorUnknown',
  'csrf-invalid': 'errorUnknown',
  'auth-required': 'errorUnknown',
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
  const { getCatalog, toggleModel, registryVersion } = useModelRegistry();
  const meta = providerMeta(provider.providerId);

  const isError = provider.state === 'error';
  const isTesting = provider.state === 'testing';
  const noModels = !isError && !isTesting && provider.modelCount === 0;

  // Provider-level on/off toggle (#54). The row keeps a lightweight copy of the
  // provider's merged catalog rows just to derive "how many models are on" and
  // to know which ids a turn-on should enable. It re-fetches whenever the
  // registry changes (`registryVersion` bumps on every `listChanged` event and
  // on every reload - e.g. a per-model toggle inside Manage), so the switch and
  // count stay live without its own IPC subscription.
  const [rows, setRows] = useState<CuratedModel[] | null>(null);
  const [toggleBusy, setToggleBusy] = useState(false);
  // The switch toggle is optimistic; hold the user's intent so a re-derive from
  // a stale `registryVersion` during the in-flight bulk write can't flip it back.
  const pendingOn = useRef<boolean | null>(null);

  const canToggle = !isError && !isTesting;

  useEffect(() => {
    if (!canToggle) {
      setRows(null);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const view = await getCatalog(provider.providerId);
        if (alive) setRows(mergeCatalogRows(view));
      } catch {
        if (alive) setRows(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [canToggle, getCatalog, provider.providerId, registryVersion]);

  const enabledModels = useMemo(() => (rows ? enabledCount(rows) : 0), [rows]);
  // On = at least one model enabled. A partial set still reads as on - the
  // count next to it tells the user how many (kept simple, per the spec).
  const providerOn = pendingOn.current ?? enabledModels > 0;

  const handleProviderToggle = useCallback(
    async (on: boolean) => {
      if (!rows) return;
      const ids = on ? defaultOnIds(rows) : rows.filter((r) => r.enabled).map((r) => r.id);
      pendingOn.current = on;
      // Optimistic local flip so the switch + count react instantly.
      const idSet = new Set(ids);
      setRows((prev) => (prev ? prev.map((r) => (idSet.has(r.id) ? { ...r, enabled: on } : r)) : prev));
      if (ids.length === 0) {
        pendingOn.current = null;
        return;
      }
      setToggleBusy(true);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await toggleModel(provider.providerId, id, on);
            return Boolean(res?.ok);
          } catch {
            return false;
          }
        })
      );
      setToggleBusy(false);
      pendingOn.current = null;
      if (results.some((ok) => !ok)) {
        Message.error(t('settings.modelsPage.row.toggleFailed'));
        // Re-fetch authoritative state so the switch reflects what actually stuck.
        try {
          const view = await getCatalog(provider.providerId);
          setRows(mergeCatalogRows(view));
        } catch {
          /* leave optimistic state; next registryVersion bump will reconcile */
        }
      }
    },
    [rows, toggleModel, getCatalog, provider.providerId, t]
  );

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
        <ProviderLogo id={meta.id} mono={meta.mono} bg={meta.bg} darkText={meta.darkText} size={34} />
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

      {canToggle && (
        <Tooltip
          content={t(
            rows !== null && rows.length === 0
              ? 'settings.modelsPage.row.providerToggleNoModelsHint'
              : providerOn
                ? 'settings.modelsPage.row.providerToggleOffHint'
                : 'settings.modelsPage.row.providerToggleOnHint'
          )}
        >
          <Switch
            className={styles.providerToggle}
            size='small'
            checked={providerOn}
            loading={toggleBusy}
            disabled={rows === null || rows.length === 0}
            onChange={(checked) => void handleProviderToggle(checked)}
            aria-label={t('settings.modelsPage.row.providerToggleAria', { provider: meta.displayName })}
          />
        </Tooltip>
      )}
    </div>
  );
};

export default ConnectedRow;
