import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal } from '@arco-design/web-react';
import { AlertTriangle, Check, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IModelRegistryConnectResult } from '@/common/adapter/ipcBridge';
import type { ConnectError, ProviderId } from '@process/providers/types';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import FluxRouterMark from '@renderer/components/icons/FluxRouterMark';
import CloudCredentialForm, { isCloudFormProvider, type CloudProviderId } from './CloudCredentialForm';
import {
  PROVIDER_GROUP_ORDER,
  type ProviderGroup,
  type ProviderMeta,
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
type View = { kind: 'grid' } | { kind: 'key'; provider: ProviderMeta } | { kind: 'cloud'; provider: CloudProviderId };

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
const BrowseModal: React.FC<Props> = ({ visible, onClose, initialProvider }) => {
  const { t } = useTranslation();
  const { providers, connect } = useModelRegistry();

  const [view, setView] = useState<View>({ kind: 'grid' });
  const [query, setQuery] = useState('');

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
    }
  }, [visible, initialProvider]);

  /** The set of already-connected provider ids - drives the connected tag. */
  const connectedIds = useMemo<Set<ProviderId>>(() => new Set(providers.map((p) => p.providerId)), [providers]);

  // ---- Grid: search-filtered groups -------------------------------------
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROVIDER_GROUP_ORDER.map((group) => {
      const items = providersInGroup(group).filter((p) => !q || p.displayName.toLowerCase().includes(q));
      return { group, items };
    }).filter((g) => g.items.length > 0);
  }, [query]);

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

  // ---- Single-key connect ------------------------------------------------
  const handleKeyConnect = useCallback(async () => {
    if (view.kind !== 'key') return;
    const key = keyValue.trim();
    if (!key) return;
    // Ship-gate Fix B2: `openai-compatible` accepts an optional `baseUrl`. A
    // non-empty value is submitted as `creds.baseUrl`; an empty value falls
    // back to the canonical default at chat-start time (no harm in sending
    // `''` either, but omitting keeps the wire shape tidy).
    const baseUrl = view.provider.id === 'openai-compatible' ? baseUrlValue.trim() : '';
    setConnecting(true);
    setErrorKey(null);
    try {
      const creds = baseUrl ? { key, baseUrl } : { key };
      const res = await connect(view.provider.id, creds);
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
  }, [view, keyValue, baseUrlValue, connect, onClose]);

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
      : view.kind === 'key'
        ? view.provider.displayName
        : providerMeta(view.provider).displayName;

  const headerSub =
    view.kind === 'grid'
      ? t('settings.modelsPage.browse.subtitle')
      : view.kind === 'key'
        ? t('settings.modelsPage.browse.keySubtitle', { provider: view.provider.displayName })
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
        {provider.id === 'flux-router' ? (
          <span className={styles.tileAvatar} style={{ background: '#141414' }} aria-hidden>
            <FluxRouterMark size={17} />
          </span>
        ) : (
          <span
            className={styles.tileAvatar}
            style={{ background: provider.bg, color: provider.darkText ? '#1a1a1a' : '#fff' }}
            aria-hidden
          >
            {provider.mono}
          </span>
        )}
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
            {filteredGroups.length === 0 && (
              <div className={styles.noMatch}>{t('settings.modelsPage.browse.noMatch', { query: query.trim() })}</div>
            )}
            {filteredGroups.map(({ group, items }) => (
              <div key={group}>
                <div className={styles.groupLabel}>{groupLabel(group)}</div>
                <div className={styles.grid}>{items.map(renderTile)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {view.kind === 'key' && (
        <div className={styles.keyForm}>
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
            disabled={!keyValue.trim()}
            onClick={() => void handleKeyConnect()}
            className={styles.keySubmit}
          >
            {t('settings.modelsPage.browse.connect')}
          </Button>
        </div>
      )}

      {view.kind === 'cloud' && (
        <CloudCredentialForm providerId={view.provider} onSubmit={handleCloudConnect} mode='connect' />
      )}
    </Modal>
  );
};

export default BrowseModal;
