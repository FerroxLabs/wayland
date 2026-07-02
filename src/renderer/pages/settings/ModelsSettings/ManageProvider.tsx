import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Message, Modal, Spin, Switch, Tooltip } from '@arco-design/web-react';
import { AlertTriangle, ChevronLeft, RefreshCw as RefreshIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryProviderView } from '@/common/adapter/ipcBridge';
import type { ConnectError, CuratedModel, UsageTag } from '@process/providers/types';
import { FLUX_MODEL_IDS, FLUX_PROVIDER_ID } from '@/common/config/flux';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import FluxRouterMark from '@renderer/components/icons/FluxRouterMark';
import { providerMeta } from './providerCatalog';
import { allVisibleEnabled, mergeCatalogRows, rowsToFlip } from './components/bulkToggle';
import XGrokButton from './components/XGrokButton';
import ChatGptButton from './components/ChatGptButton';
import styles from './ManageProvider.module.css';

type Props = {
  /** The connected provider being managed. */
  provider: IModelRegistryProviderView;
  /** Return to the Models page. */
  onBack: () => void;
  /** Called after a successful disconnect - the provider no longer exists. */
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
  // WebUI-only guard failures (#524); never produced on this desktop re-key
  // path, but the map must stay exhaustive over ConnectError.
  'https-required': 'errorUnknown',
  'csrf-invalid': 'errorUnknown',
  'auth-required': 'errorUnknown',
  unknown: 'errorUnknown',
};

/**
 * Map a `UsageTag` to its label i18n key suffix. The `chat` tag is the most
 * common ("good for chat"), so it's marked `tagPrimary` in the row renderer
 * to read as the model's primary purpose. The rest are neutral chips.
 */
const TAG_KEY: Record<UsageTag, string> = {
  chat: 'tagChat',
  vision: 'tagVision',
  image: 'tagImage',
  audio: 'tagAudio',
  embeddings: 'tagEmbeddings',
  reasoning: 'tagReasoning',
  tools: 'tagTools',
  research: 'tagResearch',
};

/** Tags shown with the brand-coloured `.tagPrimary` style - model's PRIMARY purpose. */
const PRIMARY_TAGS = new Set<UsageTag>(['chat', 'image', 'audio', 'embeddings', 'reasoning']);

/**
 * The Manage Provider page (prototype `#screen-manage`, spec §3.6 / §4.5).
 *
 * Opened from a connected provider's Manage / Fix action on the Models page.
 * Renders one unified searchable list of the provider's whole catalog:
 *  - Recommended models (the curated `recommended` set) pinned at top, badged,
 *    on by default.
 *  - "More in the catalog" - everything else (older / image / audio), off.
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
  const [bulkBusy, setBulkBusy] = useState(false);

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
      // The Manage page renders the FULL catalog joined with each row's curated
      // `recommended` / `enabled` / `role` flags - the same merge the Models row
      // uses for its provider on/off toggle (see `mergeCatalogRows`).
      setModels(mergeCatalogRows(view));
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

  // Flux is a router: its four routing tiers (Auto / Reasoning / Standard /
  // Fast) are the headline picks and must sit at the top in picker order, with
  // the pinned + image models below - not scattered by the generic
  // `recommended` flag (which only tags Auto + Fast). Other providers keep the
  // curated `recommended` split.
  const isFluxRouter = provider.providerId === FLUX_PROVIDER_ID;
  const fluxTierOrder = useMemo(() => new Map(FLUX_MODEL_IDS.map((id, i) => [id as string, i])), []);
  const recommended = useMemo(() => {
    if (isFluxRouter) {
      return filtered
        .filter((m) => fluxTierOrder.has(m.id))
        .toSorted((a, b) => (fluxTierOrder.get(a.id) ?? 0) - (fluxTierOrder.get(b.id) ?? 0));
    }
    return filtered.filter((m) => m.recommended);
  }, [filtered, isFluxRouter, fluxTierOrder]);
  const rest = useMemo(() => {
    if (isFluxRouter) return filtered.filter((m) => !fluxTierOrder.has(m.id));
    return filtered.filter((m) => !m.recommended);
  }, [filtered, isFluxRouter, fluxTierOrder]);

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
      // Optimistic flip - reverted on failure.
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

  // ---- Bulk toggle (respects the active search) --------------------------
  // Flips only the rows currently visible after filtering — never the
  // filtered-out rows. Each flip routes through the same `toggleModel` path a
  // single-row Switch uses, so there is no new registry endpoint. Optimistic
  // UI updates the visible rows up front and reverts any row whose backend
  // call fails.
  const handleBulkToggle = useCallback(
    async (enable: boolean) => {
      const ids = rowsToFlip(filtered, enable);
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      setBulkBusy(true);
      setModels((prev) => prev.map((m) => (idSet.has(m.id) ? { ...m, enabled: enable } : m)));
      // Fire the per-model toggles in parallel — they are independent IPC
      // calls — and collect the ids whose call rejected or returned not-ok so
      // only the failed rows are reverted.
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await toggleModel(provider.providerId, id, enable);
            return { id, ok: Boolean(res?.ok) };
          } catch {
            return { id, ok: false };
          }
        })
      );
      const failed = results.filter((r) => !r.ok).map((r) => r.id);
      if (failed.length > 0) {
        const failedSet = new Set(failed);
        setModels((prev) => prev.map((m) => (failedSet.has(m.id) ? { ...m, enabled: !enable } : m)));
        Message.error(t('settings.modelsPage.manage.toggleFailed'));
      }
      setBulkBusy(false);
    },
    [filtered, toggleModel, provider.providerId, t]
  );

  const allEnabled = useMemo(() => allVisibleEnabled(filtered), [filtered]);

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

  // Cloud-credential providers need multi-field creds - the single-field
  // Re-key dialog can't satisfy them, so it's disabled here.
  // TODO(2C): route cloud re-key to Packet 2C's `CloudCredentialForm` once it
  // exists, instead of disabling the button.
  const isCloudProvider = provider.connectedVia === 'cloud-credentials';

  // xAI (Grok) connects through the native "Sign in with X" OAuth, so its
  // reconnect path is that flow - not just the API-key Re-key dialog. Surface
  // the X sign-in here alongside Re-key (especially useful in the error state,
  // where a revoked / expired token needs re-auth). `XGrokButton` shows its own
  // connected / reconnect affordance and the OAuth waiting + paste-fallback UI.
  const isXai = provider.providerId === 'xai';
  const isChatGpt = provider.providerId === 'chatgpt-subscription';
  // Flux is a router (tiers across many models), not a vendor catalog, so its
  // models-section explainer is Flux-specific rather than the shared copy.
  const isFlux = isFluxRouter;

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
    const metaText = modelMeta(model);
    const tags = Array.isArray(model.tags) ? model.tags : [];
    // The role dot is a tiny brand-coloured marker showing the model's family
    // role (flagship / previous). Replaces the loud "MOST CAPABLE" badge so
    // usage tags carry the primary visual weight. Hidden for the "Latest" dot
    // when it would just clutter the row (non-recommended models).
    const showRoleDot = model.recommended && (model.role === 'flagship' || model.role === 'previous');
    const roleAriaLabel =
      model.role === 'flagship'
        ? t('settings.modelsPage.manage.roleFlagship')
        : model.role === 'previous'
          ? t('settings.modelsPage.manage.rolePrevious')
          : '';
    const roleDotClass = model.role === 'previous' ? `${styles.roleDot} ${styles.roleDotPrevious}` : styles.roleDot;

    return (
      <div
        key={model.id}
        className={`${styles.row} ${model.enabled ? '' : styles.rowOff}`}
        data-model={model.id}
        data-enabled={model.enabled}
      >
        {showRoleDot && <span className={roleDotClass} aria-label={roleAriaLabel} role='img' />}
        <span className={styles.modelName}>{model.displayName}</span>
        {tags.length > 0 && (
          <span className={styles.tags}>
            {tags.map((tag) => (
              <span key={tag} className={PRIMARY_TAGS.has(tag) ? `${styles.tag} ${styles.tagPrimary}` : styles.tag}>
                {t(`settings.modelsPage.manage.${TAG_KEY[tag]}`)}
              </span>
            ))}
          </span>
        )}
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
        <Button type='text' size='small' icon={<ChevronLeft size={14} aria-hidden='true' />} onClick={onBack}>
          {t('settings.modelsPage.title')}
        </Button>
      </div>

      <div className={styles.header}>
        {meta.id === 'flux-router' ? (
          <div className={styles.avatar} style={{ background: '#141414' }} aria-hidden>
            <FluxRouterMark size={28} />
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
        <div className={styles.name}>{meta.displayName}</div>
        <span className={badgeClass} role={isError ? 'alert' : undefined}>
          <span className={styles.badgeDot} />
          {badgeLabel}
        </span>

        <div className={styles.headerSpacer} />

        <div className={styles.headerActions}>
          <Button
            size='small'
            icon={<RefreshIcon size={14} aria-hidden='true' />}
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

      {isXai && (
        <div className='mt-12px'>
          <XGrokButton />
        </div>
      )}

      {isChatGpt && (
        <div className='mt-12px'>
          <ChatGptButton />
        </div>
      )}

      <div className={styles.secLabel}>{t('settings.modelsPage.manage.sectionLabel')}</div>
      <div className={styles.secExplain}>
        {t(isFlux ? 'settings.modelsPage.manage.sectionExplainFlux' : 'settings.modelsPage.manage.sectionExplain')}
      </div>

      <div className={styles.card}>
        <Input.Search
          className={styles.search}
          allowClear
          value={query}
          onChange={setQuery}
          placeholder={t('settings.modelsPage.manage.searchPlaceholder')}
          aria-label={t('settings.modelsPage.manage.searchPlaceholder')}
        />

        {!loading && !loadError && filtered.length > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>
              {t('settings.modelsPage.manage.bulkVisibleCount', { count: filtered.length })}
            </span>
            <div className={styles.bulkSpacer} />
            <Button
              type='text'
              size='mini'
              loading={bulkBusy}
              disabled={allEnabled}
              onClick={() => void handleBulkToggle(true)}
            >
              {t('settings.modelsPage.manage.selectAll')}
            </Button>
            <Button
              type='text'
              size='mini'
              loading={bulkBusy}
              disabled={rowsToFlip(filtered, false).length === 0}
              onClick={() => void handleBulkToggle(false)}
            >
              {t('settings.modelsPage.manage.deselectAll')}
            </Button>
          </div>
        )}

        {loading && (
          <div className={styles.cardState}>
            <Spin />
            <div className={styles.cardStateText}>{t('settings.modelsPage.manage.loading')}</div>
          </div>
        )}

        {!loading && loadError && (
          <div className={styles.cardState} role='alert'>
            <AlertTriangle size={20} color='var(--danger)' aria-hidden='true' />
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
          <div className='text-12px text-[var(--color-text-2)] leading-relaxed'>
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
            <div className='text-12px text-[var(--danger)] leading-1.45' role='alert'>
              {t(`settings.modelsPage.manage.${rekeyError}`, { provider: meta.displayName })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManageProvider;
