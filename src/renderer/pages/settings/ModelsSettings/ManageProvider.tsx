import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Message, Modal, Spin, Switch, Tooltip } from '@arco-design/web-react';
import { Caution, Left, Refresh as RefreshIcon } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryProviderView } from '@/common/adapter/ipcBridge';
import type { CatalogModel, ConnectError, CuratedModel, ModelKind } from '@process/providers/types';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import { providerMeta } from './providerCatalog';
import styles from './ManageProvider.module.css';

type Props = {
  /** The connected provider being managed. */
  provider: IModelRegistryProviderView;
  /** Return to the Models page. */
  onBack: () => void;
  /** Called after a successful disconnect — the provider no longer exists. */
  onDisconnected: () => void;
};

/** Map a `connectedVia` enum value to its i18n key suffix. */
const VIA_KEY: Record<string, string> = {
  'api-key': 'apiKey',
  'auto-discovered': 'autoDiscovered',
  'cloud-credentials': 'cloudCredentials',
};

/** Map a `ConnectError` code to the re-key error i18n key suffix. */
const ERROR_KEY: Record<ConnectError, string> = {
  unauthorized: 'errorUnauthorized',
  'no-credit': 'errorNoCredit',
  offline: 'errorOffline',
  unrecognized: 'errorUnrecognized',
  'no-models': 'errorNoModels',
  unknown: 'errorUnknown',
};

/** Map a non-text `ModelKind` to its capability-tag i18n key suffix. */
const CAP_KEY: Partial<Record<ModelKind, string>> = {
  image: 'capImage',
  audio: 'capAudio',
  embedding: 'capEmbedding',
  other: 'capOther',
};

/**
 * The Manage Provider page (prototype `#screen-manage`, spec §3.6 / §4.5).
 *
 * Opened from a connected provider's Manage / Fix action on the Models page.
 * Renders one unified searchable list of the provider's whole catalog:
 *  - Recommended models (the curated `recommended` set) pinned at top, badged,
 *    on by default.
 *  - "More in the catalog" — everything else (older / image / audio), off.
 * Every row is the same toggle; checking a row enables that model. The header
 * carries Refresh, Re-key and Disconnect.
 */
const ManageProvider: React.FC<Props> = ({ provider, onBack, onDisconnected }) => {
  const { t } = useTranslation();
  const { getCatalog, toggleModel, refresh, rekey, disconnect } = useModelRegistry();

  const meta = providerMeta(provider.providerId);
  const isError = provider.state === 'error';

  // The Manage page renders the FULL catalog (including image / audio /
  // embedding rows that the text-only curated view excludes) joined with
  // each row's curated `recommended` / `enabled` / `role` flags so the spec
  // §3.6 "More in the catalog" section truly shows the whole catalog.
  const [models, setModels] = useState<CuratedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busyModel, setBusyModel] = useState<string | null>(null);

  // Re-key dialog state.
  const [rekeyOpen, setRekeyOpen] = useState(false);
  const [rekeyValue, setRekeyValue] = useState('');
  const [rekeySubmitting, setRekeySubmitting] = useState(false);
  const [rekeyError, setRekeyError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const view = await getCatalog(provider.providerId);
      const fullCatalog: CatalogModel[] = Array.isArray(view?.catalog) ? view.catalog : [];
      const curatedList: CuratedModel[] = Array.isArray(view?.curated) ? view.curated : [];
      // Index curated flags by model id so non-curated catalog rows (image /
      // audio / embedding) inherit empty defaults while curated text rows
      // keep their `recommended` / `enabled` / `role` decisions.
      const curatedById = new Map(curatedList.map((m) => [m.id, m]));
      // If the catalog is empty but curated isn't (older backend), fall back
      // to curated so we don't blank the page.
      let baseRows: CuratedModel[];
      if (fullCatalog.length > 0) {
        baseRows = [];
        for (const c of fullCatalog) {
          const flagged = curatedById.get(c.id);
          if (flagged) {
            baseRows.push(flagged);
          } else {
            // Build a CuratedModel by aliasing into a new object — avoids
            // the spread-in-map oxc warning while keeping copy-on-write.
            const row: CuratedModel = {
              id: c.id,
              providerId: c.providerId,
              displayName: c.displayName,
              family: c.family,
              kind: c.kind,
              releaseDate: c.releaseDate,
              contextWindow: c.contextWindow,
              costInPerM: c.costInPerM,
              costOutPerM: c.costOutPerM,
              status: c.status,
              enriched: c.enriched,
              recommended: false,
              enabled: false,
            };
            baseRows.push(row);
          }
        }
      } else {
        baseRows = curatedList;
      }
      setModels(baseRows);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [getCatalog, provider.providerId]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  // ---- Filtering + grouping ----------------------------------------------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.displayName.toLowerCase().includes(q));
  }, [models, query]);

  const recommended = useMemo(() => filtered.filter((m) => m.recommended), [filtered]);
  const rest = useMemo(() => filtered.filter((m) => !m.recommended), [filtered]);

  // ---- Per-row meta (context window + cost) ------------------------------
  const modelMeta = useCallback(
    (m: CuratedModel): string => {
      const parts: string[] = [];
      if (typeof m.contextWindow === 'number' && m.contextWindow > 0) {
        const k = Math.round(m.contextWindow / 1000);
        parts.push(t('settings.modelsPage.manage.contextWindow', { count: k }));
      }
      if (typeof m.costInPerM === 'number' && typeof m.costOutPerM === 'number') {
        parts.push(t('settings.modelsPage.manage.cost', { in: m.costInPerM, out: m.costOutPerM }));
      }
      return parts.join(' · ');
    },
    [t]
  );

  // ---- Toggle ------------------------------------------------------------
  const handleToggle = useCallback(
    async (model: CuratedModel, enabled: boolean) => {
      // Optimistic flip — reverted on failure.
      setModels((prev) => prev.map((m) => (m.id === model.id ? { ...m, enabled } : m)));
      setBusyModel(model.id);
      try {
        const res = await toggleModel(provider.providerId, model.id, enabled);
        if (!res?.ok) throw new Error('toggle failed');
      } catch {
        setModels((prev) => prev.map((m) => (m.id === model.id ? { ...m, enabled: !enabled } : m)));
        Message.error(t('settings.modelsPage.manage.toggleFailed'));
      } finally {
        setBusyModel(null);
      }
    },
    [toggleModel, provider.providerId, t]
  );

  // ---- Refresh -----------------------------------------------------------
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await refresh(provider.providerId);
      if (!res?.ok) throw new Error('refresh failed');
      await loadCatalog();
      Message.success(t('settings.modelsPage.manage.refreshDone'));
    } catch {
      Message.error(t('settings.modelsPage.manage.refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  }, [refresh, provider.providerId, loadCatalog, t]);

  // ---- Disconnect (with confirmation guard) ------------------------------
  const handleDisconnect = useCallback(() => {
    Modal.confirm({
      title: t('settings.modelsPage.manage.disconnectTitle'),
      content: t('settings.modelsPage.manage.disconnectBody', { provider: meta.displayName }),
      okText: t('settings.modelsPage.manage.disconnectConfirm'),
      cancelText: t('settings.modelsPage.manage.cancel'),
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        try {
          const res = await disconnect(provider.providerId);
          if (!res?.ok) throw new Error('disconnect failed');
          onDisconnected();
        } catch {
          Message.error(t('settings.modelsPage.manage.disconnectFailed'));
        }
      },
    });
  }, [disconnect, provider.providerId, meta.displayName, onDisconnected, t]);

  // ---- Re-key ------------------------------------------------------------
  const openRekey = useCallback(() => {
    setRekeyValue('');
    setRekeyError(null);
    setRekeyOpen(true);
  }, []);

  const submitRekey = useCallback(async () => {
    const key = rekeyValue.trim();
    if (!key) return;
    setRekeySubmitting(true);
    setRekeyError(null);
    try {
      const res = await rekey(provider.providerId, { key });
      if (res.ok) {
        setRekeyOpen(false);
        await loadCatalog();
        Message.success(t('settings.modelsPage.manage.rekeyDone'));
      } else {
        setRekeyError(ERROR_KEY[res.error ?? 'unknown']);
      }
    } catch {
      setRekeyError(ERROR_KEY.unknown);
    } finally {
      setRekeySubmitting(false);
    }
  }, [rekey, provider.providerId, rekeyValue, loadCatalog, t]);

  // Cloud-credential providers need multi-field creds — the single-field
  // Re-key dialog can't satisfy them, so it's disabled here.
  // TODO(2C): route cloud re-key to Packet 2C's `CloudCredentialForm` once it
  // exists, instead of disabling the button.
  const isCloudProvider = provider.connectedVia === 'cloud-credentials';

  // ---- Header status -----------------------------------------------------
  const viaSuffix = VIA_KEY[provider.connectedVia];
  const viaLabel = viaSuffix ? t(`settings.modelsPage.row.via.${viaSuffix}`) : provider.connectedVia;

  const badgeClass = isError
    ? `${styles.badge} ${styles.badgeError}`
    : provider.state === 'testing'
      ? `${styles.badge} ${styles.badgeTesting}`
      : `${styles.badge} ${styles.badgeConnected}`;

  const badgeLabel = isError
    ? t('settings.modelsPage.manage.statusError')
    : provider.state === 'testing'
      ? t('settings.modelsPage.row.testing')
      : t('settings.modelsPage.manage.statusConnected');

  // ---- Row renderer ------------------------------------------------------
  const renderRow = (model: CuratedModel) => {
    const capSuffix = model.kind !== 'text' ? CAP_KEY[model.kind] : undefined;
    const metaText = modelMeta(model);
    const roleLabel =
      model.role === 'flagship'
        ? t('settings.modelsPage.manage.roleFlagship')
        : model.role === 'fast'
          ? t('settings.modelsPage.manage.roleFast')
          : model.role === 'previous'
            ? t('settings.modelsPage.manage.rolePrevious')
            : t('settings.modelsPage.manage.recommended');

    return (
      <div
        key={model.id}
        className={`${styles.row} ${model.enabled ? '' : styles.rowOff}`}
        data-model={model.id}
        data-enabled={model.enabled}
      >
        <span className={styles.modelName}>{model.displayName}</span>
        {model.recommended && <span className={styles.recBadge}>{roleLabel}</span>}
        {capSuffix && <span className={styles.capTag}>{t(`settings.modelsPage.manage.${capSuffix}`)}</span>}
        {metaText && <span className={styles.modelMeta}>{metaText}</span>}
        <Switch
          className={styles.toggle}
          size='small'
          checked={model.enabled}
          loading={busyModel === model.id}
          onChange={(checked) => void handleToggle(model, checked)}
          aria-label={t('settings.modelsPage.manage.toggleAria', { model: model.displayName })}
        />
      </div>
    );
  };

  return (
    <div>
      <div className={styles.back}>
        <Button type='text' size='small' icon={<Left theme='outline' size={14} />} onClick={onBack}>
          {t('settings.modelsPage.title')}
        </Button>
      </div>

      <div className={styles.header}>
        <div
          className={styles.avatar}
          style={{ background: meta.bg, color: meta.darkText ? '#1a1a1a' : '#fff' }}
          aria-hidden
        >
          {meta.mono}
        </div>
        <div className={styles.name}>{meta.displayName}</div>
        <span className={badgeClass} role={isError ? 'alert' : undefined}>
          <span className={styles.badgeDot} />
          {badgeLabel}
        </span>

        <div className={styles.headerSpacer} />

        <div className={styles.headerActions}>
          <Button
            size='small'
            icon={<RefreshIcon theme='outline' size={14} />}
            loading={refreshing}
            onClick={() => void handleRefresh()}
          >
            {t('settings.modelsPage.manage.refresh')}
          </Button>
          {isCloudProvider ? (
            <Tooltip content={t('settings.modelsPage.manage.rekeyCloudDisabled')}>
              <Button size='small' disabled>
                {t('settings.modelsPage.manage.rekey')}
              </Button>
            </Tooltip>
          ) : (
            <Button size='small' onClick={openRekey}>
              {t('settings.modelsPage.manage.rekey')}
            </Button>
          )}
          <Button size='small' status='danger' onClick={handleDisconnect}>
            {t('settings.modelsPage.manage.disconnect')}
          </Button>
        </div>
      </div>

      <div className={styles.statusLine}>
        {t('settings.modelsPage.manage.statusLine', {
          via: viaLabel,
          count: models.length,
        })}
      </div>

      <div className={styles.secLabel}>{t('settings.modelsPage.manage.sectionLabel')}</div>
      <div className={styles.secExplain}>{t('settings.modelsPage.manage.sectionExplain')}</div>

      <div className={styles.card}>
        <Input.Search
          className={styles.search}
          allowClear
          value={query}
          onChange={setQuery}
          placeholder={t('settings.modelsPage.manage.searchPlaceholder')}
          aria-label={t('settings.modelsPage.manage.searchPlaceholder')}
        />

        {loading && (
          <div className={styles.cardState}>
            <Spin />
            <div className={styles.cardStateText}>{t('settings.modelsPage.manage.loading')}</div>
          </div>
        )}

        {!loading && loadError && (
          <div className={styles.cardState} role='alert'>
            <Caution theme='outline' size={20} fill='var(--color-danger-6)' />
            <div className={styles.cardStateText}>{t('settings.modelsPage.manage.loadError')}</div>
            <Button size='small' onClick={() => void loadCatalog()}>
              {t('settings.modelsPage.manage.retry')}
            </Button>
          </div>
        )}

        {!loading && !loadError && models.length === 0 && (
          <div className={styles.cardState}>
            <div className={styles.cardStateText}>{t('settings.modelsPage.manage.empty')}</div>
          </div>
        )}

        {!loading && !loadError && models.length > 0 && (
          <>
            {recommended.length > 0 && (
              <>
                <div className={styles.subHead}>{t('settings.modelsPage.manage.recommendedHead')}</div>
                {recommended.map(renderRow)}
              </>
            )}
            {rest.length > 0 && (
              <>
                <div className={styles.subHead}>{t('settings.modelsPage.manage.moreHead')}</div>
                {rest.map(renderRow)}
              </>
            )}
            {filtered.length === 0 && (
              <div className={styles.cardState}>
                <div className={styles.cardStateText}>
                  {t('settings.modelsPage.manage.noMatch', { query: query.trim() })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        title={t('settings.modelsPage.manage.rekeyTitle', { provider: meta.displayName })}
        visible={rekeyOpen}
        onCancel={() => setRekeyOpen(false)}
        onOk={() => void submitRekey()}
        okText={t('settings.modelsPage.manage.rekeyConfirm')}
        cancelText={t('settings.modelsPage.manage.cancel')}
        confirmLoading={rekeySubmitting}
        okButtonProps={{ disabled: !rekeyValue.trim() }}
      >
        <div className='flex flex-col gap-8px'>
          <div className='text-12px text-[var(--color-text-2)] leading-1.5'>
            {t('settings.modelsPage.manage.rekeyBody')}
          </div>
          <Input.Password
            value={rekeyValue}
            onChange={(v) => {
              setRekeyValue(v);
              setRekeyError(null);
            }}
            onPressEnter={() => void submitRekey()}
            placeholder={t('settings.modelsPage.manage.rekeyPlaceholder')}
            aria-label={t('settings.modelsPage.manage.rekeyPlaceholder')}
            disabled={rekeySubmitting}
          />
          {rekeyError && (
            <div className='text-12px text-[var(--color-danger-6)] leading-1.45' role='alert'>
              {t(`settings.modelsPage.manage.${rekeyError}`, { provider: meta.displayName })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManageProvider;
