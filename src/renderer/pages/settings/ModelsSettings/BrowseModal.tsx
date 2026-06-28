import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, List, Modal, Spin } from '@arco-design/web-react';
import { AlertTriangle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryConnectResult } from '@/common/adapter/ipcBridge';
import type { ConnectError, ProviderId } from '@process/providers/types';
import type { CatalogProviderEntry } from '@process/providers/catalog/catalogProvider';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import FluxRouterMark from '@renderer/components/icons/FluxRouterMark';
import ProviderLogo from '@renderer/components/model/ProviderLogo';
import CloudCredentialForm, { isCloudFormProvider, type CloudProviderId } from './CloudCredentialForm';
import {
  BYO_PROVIDER_IDS,
  BYO_PROVIDERS,
  PROVIDER_GROUP_ORDER,
  type ProviderGroup,
  type ProviderMeta,
  providerMatchesQuery,
  providerMeta,
  providersInGroup,
} from './providerCatalog';
import styles from './BrowseModal.module.css';

type Props = {
  /** Whether the modal is open. */
  visible: boolean;
  /** Close the modal (cancel or after a successful connect). */
  onClose: () => void;
  /**
   * Optional provider to open the modal pre-targeted at - used when the
   * connect-panel recognizes a cloud key (e.g. an AWS `AKIA…` paste) and
   * routes the user straight to the matching cloud / key sub-view instead of
   * the grid (spec §4.3).
   */
  initialProvider?: ProviderId;
  /**
   * Connect a single-key provider, threading an optional `baseUrl`. Supplied by
   * the parent so the connect routes through its headless-aware path: on desktop
   * the `modelRegistry.connect` IPC, in a remote/WebUI session the write-only
   * `/api/providers/connect` HTTP route (the IPC is remote-denied). This is what
   * lets a remote WebUI add a local OpenAI-compatible endpoint host-side (#71).
   */
  connectKey: (providerId: ProviderId, key: string, baseUrl?: string) => Promise<IModelRegistryConnectResult>;
};

/** Map a `ConnectError` code to its inline-error i18n key suffix. */
const ERROR_KEY: Record<ConnectError, string> = {
  unauthorized: 'errorUnauthorized',
  'no-credit': 'errorNoCredit',
  offline: 'errorOffline',
  unrecognized: 'errorUnrecognized',
  'no-models': 'errorNoModels',
  unknown: 'errorUnknown',
};

/** Which inner view the modal is showing. */
type View =
  | { kind: 'grid' }
  | { kind: 'catalog' }
  | { kind: 'key'; provider: ProviderMeta }
  | { kind: 'cloud'; provider: CloudProviderId };

/** Fetch lifecycle for the named-provider catalog list. */
type CatalogState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; entries: CatalogProviderEntry[] }
  | { status: 'error' };

/**
 * The Browse-all-providers modal (prototype `#overlay-browse`, spec §4.6).
 *
 * One clean modal with three views:
 *  1. `grid` - a search input + every provider grouped (Frontier / Cloud /
 *     Open inference / Chinese frontier / Voice). Connected providers tagged.
 *  2. `key` - a single-key paste flow for the chosen provider (the provider is
 *     already known, so no recognition is needed - just the key field).
 *  3. `cloud` - the `CloudCredentialForm` for a chosen cloud provider.
 *
 * A successful connect closes the modal; `useModelRegistry.connect` reloads the
 * connected list on its own.
 */
/**
 * Providers that connect WITHOUT an API key. A local Ollama daemon needs no
 * credential (the backend explicitly accepts an empty key for `ollama-local`),
 * so the connect view hides the key field and connects against the canonical
 * `localhost:11434` default. Without this the tile rendered a key-only form that
 * rejected every input ("OpenAI API key is required" / "Couldn't connect").
 */
const KEYLESS_PROVIDER_IDS = new Set<ProviderId>(['ollama-local']);
const isKeylessProvider = (id: ProviderId): boolean => KEYLESS_PROVIDER_IDS.has(id);

const BrowseModal: React.FC<Props> = ({ visible, onClose, initialProvider, connectKey }) => {
  const { t } = useTranslation();
  const { providers, connect, getProviderCatalog } = useModelRegistry();

  const [view, setView] = useState<View>({ kind: 'grid' });
  const [query, setQuery] = useState('');

  // Catalog (~100 named providers) view state. The list is searched by a
  // separate query so leaving the grid search untouched on back-navigation.
  const [catalogState, setCatalogState] = useState<CatalogState>({ status: 'idle' });
  const [catalogQuery, setCatalogQuery] = useState('');

  // Single-key view state.
  const [keyValue, setKeyValue] = useState('');
  // Ship-gate Fix B2: `openai-compatible` accepts an optional custom `baseUrl`
  // alongside the api key. The backend (modelRegistryIpc) already passes
  // `creds.baseUrl` through to `ApiProviderSource` for refresh + chat-start,
  // but the connect view previously collected only the key - so a user picking
  // OpenAI-compatible from Browse had no way to set their endpoint.
  const [baseUrlValue, setBaseUrlValue] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Each open of the modal starts on a fresh view. If `initialProvider` is
  // supplied (the connect-panel recognized a cloud / single-key key and routed
  // here), open the matching sub-view directly instead of the grid.
  useEffect(() => {
    if (visible) {
      if (initialProvider) {
        if (isCloudFormProvider(initialProvider)) {
          setView({ kind: 'cloud', provider: initialProvider });
        } else {
          setView({ kind: 'key', provider: providerMeta(initialProvider) });
        }
      } else {
        setView({ kind: 'grid' });
      }
      setQuery('');
      setKeyValue('');
      setBaseUrlValue('');
      setConnecting(false);
      setErrorKey(null);
      setCatalogState({ status: 'idle' });
      setCatalogQuery('');
    }
  }, [visible, initialProvider]);

  /** The set of already-connected provider ids - drives the connected tag. */
  const connectedIds = useMemo<Set<ProviderId>>(() => new Set(providers.map((p) => p.providerId)), [providers]);

  // ---- Grid: search-filtered groups -------------------------------------
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searching = q.length > 0;
    return PROVIDER_GROUP_ORDER.map((group) => {
      const items = providersInGroup(group).filter((p) => {
        // When NOT searching, the featured Flux hero and the BYO front section
        // own these ids, so keep them out of the grouped tiles to avoid showing
        // them twice. While searching, both sections are hidden, so every
        // provider (including Flux + BYO) is searchable in its own group.
        if (!searching) return p.id !== 'flux-router' && !BYO_PROVIDER_IDS.has(p.id);
        return providerMatchesQuery(p, q);
      });
      return { group, items };
    }).filter((g) => g.items.length > 0);
  }, [query]);

  // The BYO front section only shows when not searching - a search folds those
  // providers back into their groups (handled above).
  const showByo = !query.trim();

  // ---- Tile selection ----------------------------------------------------
  const handlePick = useCallback((provider: ProviderMeta) => {
    if (isCloudFormProvider(provider.id)) {
      setView({ kind: 'cloud', provider: provider.id });
    } else {
      setKeyValue('');
      setBaseUrlValue('');
      setErrorKey(null);
      setView({ kind: 'key', provider });
    }
  }, []);

  const backToGrid = useCallback(() => {
    setView({ kind: 'grid' });
    setKeyValue('');
    setBaseUrlValue('');
    setErrorKey(null);
  }, []);

  // ---- Catalog (~100 named providers) -----------------------------------
  // Fetch lazily the first time the user opens the catalog view, and on retry
  // after a fetch error. The IPC returns the full connectable catalog sorted by
  // displayName; selecting an entry connects with just an api key (the engine
  // resolves its baseUrl from the catalog), so no manual endpoint is needed.
  const loadCatalog = useCallback(async () => {
    setCatalogState({ status: 'loading' });
    try {
      const entries = await getProviderCatalog();
      setCatalogState(Array.isArray(entries) ? { status: 'ready', entries } : { status: 'error' });
    } catch {
      setCatalogState({ status: 'error' });
    }
  }, [getProviderCatalog]);

  const openCatalog = useCallback(() => {
    setCatalogQuery('');
    setView({ kind: 'catalog' });
    // Fetch once; a previously-loaded list stays cached across back-navigation.
    setCatalogState((s) => {
      if (s.status === 'ready' || s.status === 'loading') return s;
      void loadCatalog();
      return { status: 'loading' };
    });
  }, [loadCatalog]);

  // Pick a catalog entry: open the same key view, key-only (no baseUrl). The
  // catalog's real displayName is carried onto the generic-fallback tile.
  const handlePickCatalog = useCallback((entry: CatalogProviderEntry) => {
    setKeyValue('');
    setBaseUrlValue('');
    setErrorKey(null);
    setView({ kind: 'key', provider: { ...providerMeta(entry.id), displayName: entry.displayName } });
  }, []);

  // ---- Single-key connect ------------------------------------------------
  const handleKeyConnect = useCallback(async () => {
    if (view.kind !== 'key') return;
    const key = keyValue.trim();
    // Keyless providers (local Ollama) connect with an empty key; everyone else
    // needs one before the request is worth sending.
    if (!key && !isKeylessProvider(view.provider.id)) return;
    // Ship-gate Fix B2: `openai-compatible` accepts an optional `baseUrl`. A
    // non-empty value is submitted as `creds.baseUrl`; an empty value falls
    // back to the canonical default at chat-start time (no harm in sending
    // `''` either, but omitting keeps the wire shape tidy).
    const baseUrl = view.provider.id === 'openai-compatible' ? baseUrlValue.trim() : '';
    setConnecting(true);
    setErrorKey(null);
    try {
      // Route through the parent's headless-aware connect so a remote/WebUI
      // session adds the endpoint host-side over the write-only HTTP route
      // instead of the remote-denied `modelRegistry.connect` IPC (#71).
      const res = await connectKey(view.provider.id, key, baseUrl || undefined);
      if (res.ok) {
        onClose();
      } else {
        setErrorKey(ERROR_KEY[res.error ?? 'unknown']);
      }
    } catch {
      setErrorKey(ERROR_KEY.unknown);
    } finally {
      setConnecting(false);
    }
  }, [view, keyValue, baseUrlValue, connectKey, onClose]);

  // ---- Cloud connect (passed to CloudCredentialForm) ---------------------
  const handleCloudConnect = useCallback(
    async (providerId: CloudProviderId, fields: Record<string, string>): Promise<IModelRegistryConnectResult> => {
      const res = await connect(providerId, { fields });
      if (res.ok) onClose();
      return res;
    },
    [connect, onClose]
  );

  // ---- Title + subtitle per view ----------------------------------------
  const headerTitle =
    view.kind === 'grid'
      ? t('settings.modelsPage.browse.title')
      : view.kind === 'catalog'
        ? t('settings.modelsPage.browse.catalog.title')
        : view.kind === 'key'
          ? view.provider.displayName
          : providerMeta(view.provider).displayName;

  const headerSub =
    view.kind === 'grid'
      ? t('settings.modelsPage.browse.subtitle')
      : view.kind === 'catalog'
        ? t('settings.modelsPage.browse.catalog.subtitle')
        : view.kind === 'key'
          ? isKeylessProvider(view.provider.id)
            ? t('settings.modelsPage.browse.keylessSubtitle', { provider: view.provider.displayName })
            : t('settings.modelsPage.browse.keySubtitle', { provider: view.provider.displayName })
          : undefined;

  // ---- Tile renderer -----------------------------------------------------
  const renderTile = (provider: ProviderMeta) => {
    const connected = connectedIds.has(provider.id);
    const cloud = isCloudFormProvider(provider.id);
    return (
      <Button
        key={provider.id}
        type='text'
        className={styles.tile}
        data-provider={provider.id}
        onClick={() => handlePick(provider)}
        aria-label={t('settings.modelsPage.browse.connectAria', { provider: provider.displayName })}
      >
        <ProviderLogo id={provider.id} mono={provider.mono} bg={provider.bg} darkText={provider.darkText} size={28} />
        <span className={styles.tileText}>
          <span className={styles.tileName}>{provider.displayName}</span>
          {cloud && <span className={styles.tileSub}>{t('settings.modelsPage.browse.cloudTag')}</span>}
        </span>
        {connected && (
          <span className={styles.connectedTag}>
            <Check size={10} aria-hidden='true' />
            {t('settings.modelsPage.browse.connected')}
          </span>
        )}
      </Button>
    );
  };

  // ---- Catalog row renderer ---------------------------------------------
  const renderCatalogRow = (entry: CatalogProviderEntry) => {
    const meta = providerMeta(entry.id);
    const connected = connectedIds.has(entry.id);
    return (
      <List.Item
        key={entry.id}
        className={styles.catalogRow}
        data-provider={entry.id}
        onClick={() => handlePickCatalog(entry)}
        role='button'
        tabIndex={0}
        aria-label={t('settings.modelsPage.browse.connectAria', { provider: entry.displayName })}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePickCatalog(entry);
          }
        }}
      >
        <ProviderLogo id={entry.id} mono={meta.mono} bg={meta.bg} darkText={meta.darkText} size={28} />
        <span className={styles.tileName}>{entry.displayName}</span>
        {connected && (
          <span className={styles.connectedTag}>
            <Check size={10} aria-hidden='true' />
            {t('settings.modelsPage.browse.connected')}
          </span>
        )}
      </List.Item>
    );
  };

  // ---- Group label ------------------------------------------------------
  const groupLabel = (group: ProviderGroup) => t(`settings.modelsPage.browse.group.${group}`);

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      title={null}
      className={styles.modal}
      autoFocus={false}
      unmountOnExit
    >
      <div className={styles.head}>
        {view.kind !== 'grid' && (
          <Button
            className={styles.back}
            type='text'
            size='small'
            icon={<ChevronLeft size={14} aria-hidden='true' />}
            onClick={backToGrid}
          >
            {t('settings.modelsPage.browse.back')}
          </Button>
        )}
        <div className={styles.title}>{headerTitle}</div>
        {headerSub && <div className={styles.sub}>{headerSub}</div>}
      </div>

      {view.kind === 'grid' && (
        <>
          <div className={styles.searchWrap}>
            <Input.Search
              allowClear
              value={query}
              onChange={setQuery}
              placeholder={t('settings.modelsPage.browse.searchPlaceholder')}
              aria-label={t('settings.modelsPage.browse.searchPlaceholder')}
            />
          </div>
          <div className={styles.body}>
            {/* Featured Flux Router - Wayland's own first-party router, top and
                center. Hidden while searching so it isn't counted among the
                filtered results (Flux re-joins the groups during a search).
                Picking it routes to the same single-key connect view as the old
                flux-router tile (handlePick), so no new connect flow. */}
            {!query.trim() && (
              <Button
                type='text'
                className={styles.featured}
                data-provider='flux-router'
                data-testid='browse-featured-flux'
                onClick={() => handlePick(providerMeta('flux-router'))}
                aria-label={t('settings.modelsPage.browse.connectAria', {
                  provider: t('settings.modelsPage.flux.name'),
                })}
              >
                <span className={styles.featuredGlyph} aria-hidden>
                  <FluxRouterMark size={20} />
                </span>
                <span className={styles.featuredText}>
                  <span className={styles.featuredTitleRow}>
                    <span className={styles.featuredName}>{t('settings.modelsPage.flux.name')}</span>
                    <span className={styles.featuredTag}>{t('settings.modelsPage.flux.recommended')}</span>
                  </span>
                  <span className={styles.featuredSub}>{t('settings.modelsPage.browse.featuredFluxTagline')}</span>
                </span>
                {connectedIds.has('flux-router') && (
                  <span className={`${styles.connectedTag} ${styles.featuredConnected}`}>
                    <Check size={10} aria-hidden='true' />
                    {t('settings.modelsPage.browse.connected')}
                  </span>
                )}
              </Button>
            )}
            {/* Bring-your-own-endpoint - pulled to the front. The custom /
                self-hosted / OpenAI-compatible connect was the hardest thing to
                find (buried under "Open inference"); now it leads. Hidden while
                searching, where these providers fold back into their groups. */}
            {showByo && (
              <div className={styles.byo}>
                <div className={styles.byoHead}>
                  <span className={styles.byoTitle}>{t('settings.modelsPage.browse.byo.title')}</span>
                  <span className={styles.byoDesc}>{t('settings.modelsPage.browse.byo.desc')}</span>
                </div>
                <div className={styles.byoLead}>{t('settings.modelsPage.browse.byo.lead')}</div>
                <div className={styles.byoGrid}>
                  {BYO_PROVIDERS.map((p) => {
                    const primary = p.id === 'openai-compatible';
                    const name = primary ? t('settings.modelsPage.browse.byo.openaiName') : p.displayName;
                    const connected = connectedIds.has(p.id);
                    return (
                      <Button
                        key={p.id}
                        type='text'
                        className={`${styles.byoCard} ${primary ? styles.byoPrimary : ''}`}
                        data-provider={p.id}
                        onClick={() => handlePick(p)}
                        aria-label={t('settings.modelsPage.browse.connectAria', { provider: name })}
                      >
                        <ProviderLogo id={p.id} mono={p.mono} bg={p.bg} darkText={p.darkText} size={34} />
                        <span className={styles.byoText}>
                          <span className={styles.byoName}>{name}</span>
                          <span className={styles.byoSub}>{t(`settings.modelsPage.browse.byo.sub.${p.id}`)}</span>
                        </span>
                        {connected && (
                          <span className={styles.connectedTag}>
                            <Check size={10} aria-hidden='true' />
                            {t('settings.modelsPage.browse.connected')}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
                <div className={styles.byoNote}>{t('settings.modelsPage.browse.byo.aliasHint')}</div>
              </div>
            )}
            {filteredGroups.length === 0 && (
              <div className={styles.noMatch}>{t('settings.modelsPage.browse.noMatch', { query: query.trim() })}</div>
            )}
            {filteredGroups.map(({ group, items }) => (
              <div key={group}>
                <div className={styles.groupLabel}>{groupLabel(group)}</div>
                <div className={styles.grid}>{items.map(renderTile)}</div>
              </div>
            ))}
            {/* Escape hatch into the full named-provider catalog (~100 entries).
                Hidden while the user is searching - the grid filter already
                covers the curated tiles, and the catalog has its own search. */}
            {!query.trim() && (
              <Button
                type='outline'
                long
                className={styles.catalogEntry}
                onClick={openCatalog}
                data-testid='browse-catalog-entry'
              >
                <span>{t('settings.modelsPage.browse.catalog.entry')}</span>
                <ChevronRight size={15} aria-hidden='true' />
              </Button>
            )}
          </div>
        </>
      )}

      {view.kind === 'catalog' && (
        <>
          <div className={styles.searchWrap}>
            <Input.Search
              allowClear
              value={catalogQuery}
              onChange={setCatalogQuery}
              placeholder={t('settings.modelsPage.browse.catalog.searchPlaceholder')}
              aria-label={t('settings.modelsPage.browse.catalog.searchPlaceholder')}
            />
          </div>
          {catalogState.status === 'loading' && (
            <div className={styles.catalogStatus}>
              <Spin />
              <span>{t('settings.modelsPage.browse.catalog.loading')}</span>
            </div>
          )}
          {catalogState.status === 'error' && (
            <div className={styles.catalogStatus} role='alert'>
              <AlertTriangle size={16} aria-hidden='true' />
              <span>{t('settings.modelsPage.browse.catalog.error')}</span>
              <Button size='small' onClick={() => void loadCatalog()}>
                {t('settings.modelsPage.browse.catalog.retry')}
              </Button>
            </div>
          )}
          {catalogState.status === 'ready' &&
            (() => {
              const q = catalogQuery.trim().toLowerCase();
              const entries = q
                ? catalogState.entries.filter(
                    (e) => e.displayName.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
                  )
                : catalogState.entries;
              if (entries.length === 0) {
                return (
                  <div className={styles.noMatch}>
                    {t('settings.modelsPage.browse.catalog.noMatch', { query: catalogQuery.trim() })}
                  </div>
                );
              }
              return (
                <List
                  className={styles.catalogList}
                  size='small'
                  bordered={false}
                  dataSource={entries}
                  virtualListProps={{ height: 360, itemHeight: 52 }}
                  aria-label={t('settings.modelsPage.browse.catalog.title')}
                  render={(entry: CatalogProviderEntry) => renderCatalogRow(entry)}
                />
              );
            })()}
        </>
      )}

      {view.kind === 'key' && (
        <div className={styles.keyForm}>
          {!isKeylessProvider(view.provider.id) && (
            <>
              <div className={styles.keyLabel}>{t('settings.modelsPage.browse.keyLabel')}</div>
              <Input.Password
                value={keyValue}
                onChange={(v) => {
                  setKeyValue(v);
                  setErrorKey(null);
                }}
                onPressEnter={() => void handleKeyConnect()}
                placeholder={t('settings.modelsPage.browse.keyPlaceholder')}
                aria-label={t('settings.modelsPage.browse.keyLabel')}
                disabled={connecting}
              />
            </>
          )}
          {/* Ship-gate Fix B2: `openai-compatible` connect collects an optional
              `baseUrl` alongside the api key so the user can point at a custom
              endpoint (the backend already routes `creds.baseUrl` through to
              both refresh + chat-start). Empty value falls back to the
              provider's canonical default. */}
          {view.provider.id === 'openai-compatible' && (
            <>
              <div className={styles.keyLabel} style={{ marginTop: 12 }}>
                {t('settings.modelsPage.browse.baseUrlLabel')}
              </div>
              <Input
                value={baseUrlValue}
                onChange={(v) => {
                  setBaseUrlValue(v);
                  setErrorKey(null);
                }}
                onPressEnter={() => void handleKeyConnect()}
                placeholder={t('settings.modelsPage.browse.baseUrlPlaceholder')}
                aria-label={t('settings.modelsPage.browse.baseUrlLabel')}
                disabled={connecting}
              />
            </>
          )}
          {errorKey && (
            <div className={styles.keyError} role='alert'>
              <AlertTriangle size={14} aria-hidden='true' />
              <span>{t(`settings.modelsPage.browse.${errorKey}`, { provider: view.provider.displayName })}</span>
            </div>
          )}
          <Button
            type='primary'
            long
            loading={connecting}
            disabled={!isKeylessProvider(view.provider.id) && !keyValue.trim()}
            onClick={() => void handleKeyConnect()}
            className={styles.keySubmit}
          >
            {t('settings.modelsPage.browse.connect')}
          </Button>
        </div>
      )}

      {view.kind === 'cloud' && (
        <div className={styles.cloudForm}>
          <CloudCredentialForm providerId={view.provider} onSubmit={handleCloudConnect} mode='connect' />
        </div>
      )}
    </Modal>
  );
};

export default BrowseModal;
