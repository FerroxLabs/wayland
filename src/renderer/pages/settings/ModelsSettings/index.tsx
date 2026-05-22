import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Spin } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryDetectedKey, IModelRegistryProviderView } from '@/common/adapter/ipcBridge';
import type { ProviderId } from '@process/providers/types';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { ModelRegistryProvider, useModelRegistry } from '@renderer/hooks/useModelRegistry';
import { consumePendingDeepLink } from '@renderer/hooks/system/useDeepLink';
import BrowseModal from './BrowseModal';
import ConnectPanel from './components/ConnectPanel';
import ConnectedRow from './components/ConnectedRow';
import EmptyState from './components/EmptyState';
import ManageProvider from './ManageProvider';
import { isCloudProvider } from './providerCatalog';
import styles from './ModelsSettings.module.css';

/** Stable identity for a detected key (provider + source). */
function detectedKeyId(dk: IModelRegistryDetectedKey): string {
  return `${dk.providerId}:${dk.source}`;
}

/**
 * Wave 3 Fix 12 — module-level seed for a deep-link-delivered api key.
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
 * Models settings page — the primary surface of the Models & Providers
 * redesign (prototype `#screen-models`).
 *
 * Three regions:
 *  1. Connect a provider (the always-visible hero) — detected-keys strip,
 *     paste-an-API-key with live recognition, Continue with Google, Browse.
 *  2. Connected providers — compact `ConnectedRow`s with a visible Manage.
 *  3. First-run / empty state — when there are no providers and no detected
 *     keys, the connect panel is the whole page plus a one-line nudge.
 */
const ModelsSettingsInner: React.FC = () => {
  const { t } = useTranslation();
  const { providers, loading, error, connect, detectKeys } = useModelRegistry();

  const [detectedKeys, setDetectedKeys] = useState<IModelRegistryDetectedKey[]>([]);
  const [ignoredKeys, setIgnoredKeys] = useState<Set<string>>(new Set());
  // Wave 3 Fix 12 — bump to re-trigger ConnectPanel's seed-consume effect
  // when a deep link delivers an api-key pre-fill after first mount.
  const [, setPanelSeedNonce] = useState(0);

  // View-switch seam: when a provider is selected for Manage, this holds its id
  // and the page swaps to `ManageProvider` (prototype `#screen-manage`).
  const [managedProviderId, setManagedProviderId] = useState<ProviderId | null>(null);

  // Whether the Browse-all-providers modal is open (prototype `#overlay-browse`).
  const [browseOpen, setBrowseOpen] = useState(false);
  // Optional pre-targeted provider — set when the connect-panel recognizes a
  // cloud key and routes the user straight to its credential form.
  const [browseInitialProvider, setBrowseInitialProvider] = useState<ProviderId | undefined>(undefined);

  // Auto-discover keys already on the machine (spec §4.4). Surfaced as the
  // consent strip — never used silently.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const keys = await detectKeys();
        if (!cancelled) setDetectedKeys(Array.isArray(keys) ? keys : []);
      } catch {
        // Auto-discovery is best-effort — a failure leaves the page fully usable.
        if (!cancelled) setDetectedKeys([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detectKeys]);

  // Wave 3 Fix 12 — consume any pending deep-link payload on mount. A
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
      // Cloud — open the Browse modal pre-targeted to that provider.
      setBrowseInitialProvider(targetId);
      setBrowseOpen(true);
      return;
    }
    // Non-cloud — set the panel seed (an api-key pre-fill consumed by the
    // ConnectPanel on its next render).
    if (pending.apiKey) {
      pendingDeepLinkSeed = { apiKey: pending.apiKey, baseUrl: pending.baseUrl };
      // Force the panel to re-read the seed by toggling a state nonce.
      setPanelSeedNonce((n) => n + 1);
    }
  }, []);

  const visibleDetected = useMemo(
    () => detectedKeys.filter((dk) => !ignoredKeys.has(detectedKeyId(dk))),
    [detectedKeys, ignoredKeys]
  );

  const connectKey = useCallback((providerId: ProviderId, key: string) => connect(providerId, { key }), [connect]);

  const useDetected = useCallback(
    async (dk: IModelRegistryDetectedKey) => {
      const res = await connect(dk.providerId, { useDiscovered: true });
      if (res.ok) {
        // Connected — drop it from the strip.
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

  // An errored provider also opens the Manage page — its header carries the
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
  // disconnected from another surface) — fall back to the Models page.
  useEffect(() => {
    if (managedProviderId && !loading && !managedProvider) {
      setManagedProviderId(null);
    }
  }, [managedProviderId, managedProvider, loading]);

  const showEmptyState = !loading && providers.length === 0 && visibleDetected.length === 0;

  if (managedProvider) {
    return (
      <ManageProvider provider={managedProvider} onBack={handleManageBack} onDisconnected={handleManageDisconnected} />
    );
  }

  return (
    <SettingsPageShell
      title={t('settings.modelsPage.title')}
      subtitle={t('settings.modelsPage.subtitle')}
      breadcrumb={[{ label: t('settings.modelsPage.crumbAiModels') }, { label: t('settings.modelsPage.title') }]}
    >
      <ConnectPanel
        detectedKeys={visibleDetected}
        onConnectKey={connectKey}
        onUseDetected={useDetected}
        onIgnoreDetected={ignoreDetected}
        onBrowse={handleBrowse}
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
          {providers.map((p) => (
            <ConnectedRow key={p.providerId} provider={p} onManage={handleManage} onFix={handleFix} />
          ))}
        </div>
      )}

      <BrowseModal visible={browseOpen} onClose={handleBrowseClose} initialProvider={browseInitialProvider} />
    </SettingsPageShell>
  );
};

/**
 * Page root — wraps the Models tree in a `ModelRegistryProvider` so the
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
