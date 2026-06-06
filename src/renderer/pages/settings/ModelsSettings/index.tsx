import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Message, Spin, Switch } from '@arco-design/web-react';
import { RefreshCw as RefreshIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  IModelRegistryDetectedKey,
  IModelRegistryProviderView,
  IModelRegistryRefreshSummary,
} from '@/common/adapter/ipcBridge';
import { ipcBridge } from '@/common';
import type { ProviderId } from '@process/providers/types';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import SettingsPageWrapper from '@renderer/pages/settings/components/SettingsPageWrapper';
import { ModelRegistryProvider, useModelRegistry, useRefreshState } from '@renderer/hooks/useModelRegistry';
import { consumePendingDeepLink } from '@renderer/hooks/system/useDeepLink';
import BrowseModal from './BrowseModal';
import ConnectPanel from './components/ConnectPanel';
import ConnectedRow from './components/ConnectedRow';
import EmptyState from './components/EmptyState';
import FluxRouterHero from './components/FluxRouterHero';
import ManageProvider from './ManageProvider';
import { isCloudProvider } from './providerCatalog';
import styles from './ModelsSettings.module.css';

/** Stable identity for a detected key (provider + source). */
function detectedKeyId(dk: IModelRegistryDetectedKey): string {
  return `${dk.providerId}:${dk.source}`;
}

/**
 * Build the "updated Xh ago" / "Never" freshness label from the success-only
 * `lastRefreshedAt` epoch-ms timestamp. Sub-hour ages floor to "0h ago" so the
 * label stays a whole-hours summary (the scheduler cadence is 24h, not minutes).
 */
function freshnessLabel(t: ReturnType<typeof useTranslation>['t'], lastRefreshedAt: number | null): string {
  if (lastRefreshedAt == null) return t('settings.modelsPage.refresh.never');
  const hours = Math.max(0, Math.floor((Date.now() - lastRefreshedAt) / 3_600_000));
  return t('settings.modelsPage.refresh.updatedAgo', { hours });
}

/**
 * New-model toast (SPEC §4.4). Shows up to 3 humanized names + "and N more".
 * Names come from the summary's `added[].displayName` (already diffed + deduped
 * against `announcedModelIds` by the main process). Suppressed entirely on a
 * first-populate run - when `lastRefreshedAt` was `null` *before* this refresh,
 * every model is "new" and announcing them would be noise. No em-dash (repo
 * ship-gate): the separator is "·".
 */
function showNewModelsToast(
  t: ReturnType<typeof useTranslation>['t'],
  summary: IModelRegistryRefreshSummary,
  hadPriorRefresh: boolean
): void {
  if (!hadPriorRefresh) return; // first-populate - never announce
  const added = summary.added ?? [];
  if (added.length === 0) return;

  const names = added.map((a) => a.displayName);
  const SHOWN = 3;
  const shown = names.slice(0, SHOWN);
  const remaining = names.length - shown.length;
  // Join the shown names with a "·" separator; when some are elided, append the
  // "and N more" fragment as the final segment.
  const namesText =
    remaining > 0 ? [...shown, t('models.toast.andMore', { count: remaining })].join(' · ') : shown.join(' · ');

  Message.info(t('models.toast.newModels', { count: added.length, names: namesText }));
}

/**
 * Wave 3 Fix 12 - module-level seed for a deep-link-delivered api key.
 * Set by `ModelsSettingsInner` on mount when `consumePendingDeepLink` returns
 * non-cloud creds. Read by `ConnectPanel` via `getPendingDeepLinkSeed` and
 * cleared after the panel pre-fills its input.
 */
let pendingDeepLinkSeed: { apiKey?: string; baseUrl?: string } | null = null;
/** Public read-and-clear getter for the panel to consume. */
export function getPendingDeepLinkSeed(): { apiKey?: string; baseUrl?: string } | null {
  const seed = pendingDeepLinkSeed;
  pendingDeepLinkSeed = null;
  return seed;
}

/**
 * Models settings page - the primary surface of the Models & Providers
 * redesign (prototype `#screen-models`).
 *
 * Three regions:
 *  1. Connect a provider (the always-visible hero) - detected-keys strip,
 *     paste-an-API-key with live recognition, Continue with Google, Browse.
 *  2. Connected providers - compact `ConnectedRow`s with a visible Manage.
 *  3. First-run / empty state - when there are no providers and no detected
 *     keys, the connect panel is the whole page plus a one-line nudge.
 */
const ModelsSettingsInner: React.FC = () => {
  const { t } = useTranslation();
  const { providers, loading, error, connect, detectKeys, refreshAll } = useModelRegistry();
  const refreshState = useRefreshState();

  // Local in-flight flag for the header button (the click owns the spinner;
  // the scheduler-driven `refreshState.refreshing` covers background runs).
  const [refreshingNow, setRefreshingNow] = useState(false);

  // ── Auto-refresh master switch (models.autoRefresh, default on) ──────────
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [autoRefreshLoading, setAutoRefreshLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await ipcBridge.modelRegistry.getAutoRefresh.invoke();
        // Default to `on` when the value is unset or the read fails.
        if (!cancelled) setAutoRefresh(res ?? true);
      } catch {
        if (!cancelled) setAutoRefresh(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAutoRefreshChange = useCallback(
    async (enabled: boolean) => {
      // Optimistic flip - revert on failure.
      setAutoRefresh(enabled);
      setAutoRefreshLoading(true);
      try {
        const res = await ipcBridge.modelRegistry.setAutoRefresh.invoke({ value: enabled });
        if (!res?.ok) throw new Error('setAutoRefresh failed');
      } catch {
        setAutoRefresh(!enabled);
        Message.error(t('settings.modelsPage.autoRefresh.saveFailed'));
      } finally {
        setAutoRefreshLoading(false);
      }
    },
    [t]
  );

  // ── Global "Refresh models" handler ──────────────────────────────────────
  // Capture the prior freshness so the toast can suppress on first-populate.
  const handleRefreshAll = useCallback(async () => {
    const hadPriorRefresh = refreshState.lastRefreshedAt != null;
    setRefreshingNow(true);
    try {
      const summary = await refreshAll();
      showNewModelsToast(t, summary, hadPriorRefresh);
    } catch {
      Message.error(t('settings.modelsPage.refresh.failed'));
    } finally {
      setRefreshingNow(false);
    }
  }, [refreshAll, refreshState.lastRefreshedAt, t]);

  const refreshing = refreshingNow || refreshState.refreshing;
  const noProviders = providers.length === 0;

  const [detectedKeys, setDetectedKeys] = useState<IModelRegistryDetectedKey[]>([]);
  const [ignoredKeys, setIgnoredKeys] = useState<Set<string>>(new Set());
  // Wave 3 Fix 12 - bump to re-trigger ConnectPanel's seed-consume effect
  // when a deep link delivers an api-key pre-fill after first mount.
  // Ship-gate Fix C3 - the panel reads this as a prop now so the effect
  // actually re-fires on a later deep-link.
  const [panelSeedNonce, setPanelSeedNonce] = useState(0);

  // View-switch seam: when a provider is selected for Manage, this holds its id
  // and the page swaps to `ManageProvider` (prototype `#screen-manage`).
  const [managedProviderId, setManagedProviderId] = useState<ProviderId | null>(null);

  // Whether the Browse-all-providers modal is open (prototype `#overlay-browse`).
  const [browseOpen, setBrowseOpen] = useState(false);
  // Optional pre-targeted provider - set when the connect-panel recognizes a
  // cloud key and routes the user straight to its credential form.
  const [browseInitialProvider, setBrowseInitialProvider] = useState<ProviderId | undefined>(undefined);

  // Auto-discover keys already on the machine (spec §4.4). Surfaced as the
  // consent strip - never used silently.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const keys = await detectKeys();
        if (!cancelled) setDetectedKeys(Array.isArray(keys) ? keys : []);
      } catch {
        // Auto-discovery is best-effort - a failure leaves the page fully usable.
        if (!cancelled) setDetectedKeys([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detectKeys]);

  // Wave 3 Fix 12 - consume any pending deep-link payload on mount. A
  // `wayland://add-provider?platform=...&apiKey=...` URL fires from the OS
  // shell, the main process navigates the renderer to `/settings/models`, and
  // we read the pre-fill data here. Cloud providers route into the Browse
  // modal's cloud form; non-cloud keys pre-fill the ConnectPanel via a
  // module-level seed read by the panel.
  useEffect(() => {
    const pending = consumePendingDeepLink();
    if (!pending) return;

    // Translate a legacy `platform` string into the corresponding ProviderId.
    // Mirrors `legacyModelConfigMigration`'s `DIRECT_PLATFORM_MAP` so a
    // user-facing add-provider link works against the new registry.
    const platformToId = (platform: string | undefined): ProviderId | undefined => {
      if (!platform) return undefined;
      switch (platform) {
        case 'anthropic':
          return 'anthropic';
        case 'openai':
          return 'openai';
        case 'gemini':
        case 'gemini-with-google-auth':
          return 'google-gemini';
        case 'bedrock':
          return 'aws-bedrock';
        case 'gemini-vertex-ai':
          return 'vertex';
        default:
          return undefined;
      }
    };

    const targetId = platformToId(pending.platform);
    if (targetId && isCloudProvider(targetId)) {
      // Cloud - open the Browse modal pre-targeted to that provider.
      setBrowseInitialProvider(targetId);
      setBrowseOpen(true);
      return;
    }
    // Non-cloud - set the panel seed (an api-key pre-fill consumed by the
    // ConnectPanel on its next render).
    if (pending.apiKey) {
      pendingDeepLinkSeed = { apiKey: pending.apiKey, baseUrl: pending.baseUrl };
      // Force the panel to re-read the seed by toggling a state nonce.
      setPanelSeedNonce((n) => n + 1);
    }
  }, []);

  // Wave 4B R2 fix: never offer a detected key for a provider that's already
  // connected. Without this, a fresh page mount (`ignoredKeys` is renderer-only
  // state and resets) re-surfaces e.g. OpenAI in both the Connected list and
  // the detected strip. The user just sees "OpenAI · Use it" next to "OpenAI ·
  // Connected", which reads as a bug.
  const connectedProviderIds = useMemo(() => new Set(providers.map((p) => p.providerId)), [providers]);
  const visibleDetected = useMemo(
    () => detectedKeys.filter((dk) => !ignoredKeys.has(detectedKeyId(dk)) && !connectedProviderIds.has(dk.providerId)),
    [detectedKeys, ignoredKeys, connectedProviderIds]
  );

  const connectKey = useCallback((providerId: ProviderId, key: string) => connect(providerId, { key }), [connect]);

  // Flux Router is the recommended provider - connect it from the hero.
  const connectFluxKey = useCallback((key: string) => connect('flux-router', { key }), [connect]);

  // Whether `flux-router` is already a connected provider - drives the hero's
  // reinforcement-vs-recommendation state. Read straight from the registry list
  // the page already loads (no extra detection call).
  const fluxConnected = useMemo(() => providers.some((p) => p.providerId === 'flux-router'), [providers]);

  // Pin Flux Router to the top of the connected list; the rest keep their
  // existing (registry insertion) order. Stable single-key sort.
  const orderedProviders = useMemo(
    () =>
      providers.toSorted((a, b) => {
        if (a.providerId === 'flux-router') return b.providerId === 'flux-router' ? 0 : -1;
        if (b.providerId === 'flux-router') return 1;
        return 0;
      }),
    [providers]
  );

  const useDetected = useCallback(
    async (dk: IModelRegistryDetectedKey) => {
      const res = await connect(dk.providerId, { useDiscovered: true });
      if (res.ok) {
        // Connected - drop it from the strip.
        setIgnoredKeys((prev) => new Set(prev).add(detectedKeyId(dk)));
      }
      return res;
    },
    [connect]
  );

  const ignoreDetected = useCallback((dk: IModelRegistryDetectedKey) => {
    setIgnoredKeys((prev) => new Set(prev).add(detectedKeyId(dk)));
  }, []);

  const handleBrowse = useCallback((providerId?: ProviderId) => {
    setBrowseInitialProvider(providerId);
    setBrowseOpen(true);
  }, []);

  const handleBrowseClose = useCallback(() => {
    setBrowseOpen(false);
    setBrowseInitialProvider(undefined);
  }, []);

  const handleManage = useCallback((provider: IModelRegistryProviderView) => {
    setManagedProviderId(provider.providerId);
  }, []);

  // An errored provider also opens the Manage page - its header carries the
  // real Re-key dialog (spec §4.5), the proper recovery for a revoked key.
  const handleFix = useCallback((provider: IModelRegistryProviderView) => {
    setManagedProviderId(provider.providerId);
  }, []);

  const handleManageBack = useCallback(() => {
    setManagedProviderId(null);
  }, []);

  // The Manage page disconnects via `useModelRegistry`; on success it returns
  // here, since the provider it was managing no longer exists.
  const handleManageDisconnected = useCallback(() => {
    setManagedProviderId(null);
  }, []);

  const managedProvider = useMemo(
    () => (managedProviderId ? (providers.find((p) => p.providerId === managedProviderId) ?? null) : null),
    [managedProviderId, providers]
  );

  // The managed provider was selected but is no longer in the list (e.g. it was
  // disconnected from another surface) - fall back to the Models page.
  useEffect(() => {
    if (managedProviderId && !loading && !managedProvider) {
      setManagedProviderId(null);
    }
  }, [managedProviderId, managedProvider, loading]);

  const showEmptyState = !loading && providers.length === 0 && visibleDetected.length === 0;

  if (managedProvider) {
    // ManageProvider carries its own back-link + header, so wrap in the
    // lower-level SettingsPageWrapper (NOT SettingsPageShell, which would
    // duplicate the page header). This restores the same horizontal/vertical
    // padding the Models index gets via SettingsPageShell.
    return (
      <SettingsPageWrapper>
        <ManageProvider
          provider={managedProvider}
          onBack={handleManageBack}
          onDisconnected={handleManageDisconnected}
        />
      </SettingsPageWrapper>
    );
  }

  const headerActions = (
    <div className='flex items-center gap-12px'>
      <span className='text-12px text-t-tertiary whitespace-nowrap'>
        {refreshing ? t('settings.modelsPage.refresh.refreshing') : freshnessLabel(t, refreshState.lastRefreshedAt)}
      </span>
      <Button
        size='small'
        icon={<RefreshIcon size={14} aria-hidden='true' />}
        loading={refreshing}
        disabled={noProviders}
        onClick={() => void handleRefreshAll()}
      >
        {t('settings.modelsPage.refresh.button')}
      </Button>
    </div>
  );

  return (
    <SettingsPageShell
      title={t('settings.modelsPage.title')}
      subtitle={t('settings.modelsPage.subtitle')}
      breadcrumb={[{ label: t('settings.modelsPage.crumbAiModels') }, { label: t('settings.modelsPage.title') }]}
      actions={headerActions}
    >
      <FluxRouterHero connected={fluxConnected} onConnectKey={connectFluxKey} />

      <ConnectPanel
        detectedKeys={visibleDetected}
        onConnectKey={connectKey}
        onUseDetected={useDetected}
        onIgnoreDetected={ignoreDetected}
        onBrowse={handleBrowse}
        deepLinkSeedNonce={panelSeedNonce}
      />

      {error && (
        <div className={styles.connectError} role='alert'>
          <span>{t('settings.modelsPage.loadError')}</span>
        </div>
      )}

      <div className={styles.sectionLabel}>{t('settings.modelsPage.connectedLabel')}</div>

      {loading && providers.length === 0 && (
        <div className={styles.loadingRow}>
          <Spin />
        </div>
      )}

      {showEmptyState && <EmptyState />}

      {providers.length > 0 && (
        <div className={styles.connectedList}>
          {orderedProviders.map((p) => (
            <ConnectedRow key={p.providerId} provider={p} onManage={handleManage} onFix={handleFix} />
          ))}
        </div>
      )}

      <div className='flex items-center justify-between gap-16px pt-8px'>
        <div className='flex flex-col gap-2px min-w-0'>
          <span className='text-13px text-t-primary'>{t('settings.modelsPage.autoRefresh.label')}</span>
          <span className='text-12px text-t-tertiary'>{t('settings.modelsPage.autoRefresh.hint')}</span>
        </div>
        <Switch
          checked={autoRefresh}
          loading={autoRefreshLoading}
          onChange={(checked) => void handleAutoRefreshChange(checked)}
        />
      </div>

      <BrowseModal visible={browseOpen} onClose={handleBrowseClose} initialProvider={browseInitialProvider} />
    </SettingsPageShell>
  );
};

/**
 * Page root - wraps the Models tree in a `ModelRegistryProvider` so the
 * page, the Manage view and the Browse modal share one `providers` snapshot.
 * Any disconnect / rekey / Browse-modal connect performed by a child surface
 * refreshes the parent's row list and header badges immediately.
 */
const ModelsSettings: React.FC = () => (
  <ModelRegistryProvider>
    <ModelsSettingsInner />
  </ModelRegistryProvider>
);

export default ModelsSettings;
