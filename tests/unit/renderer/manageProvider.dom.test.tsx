/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Manage Provider page (Packet 2B) - behavior contract.
 *
 * Covers the spec §3.6 / §4.5 surface:
 *  - recommended models render above the "More in the catalog" section
 *  - a row toggle flips state and calls `modelRegistry.toggleModel`
 *  - the search input filters the unified list
 *  - image / audio rows carry a capability tag
 *  - the header Refresh / Re-key / Disconnect actions are present and call IPC
 *  - Disconnect shows a confirmation before dropping the provider
 *
 * `ipcBridge` is mocked; the file name uses the `.dom.test.tsx` suffix so it
 * runs in the jsdom Vitest project (the `node` project only matches `.test.ts`).
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IModelRegistryProviderView } from '../../../src/common/adapter/ipcBridge';
import type { CatalogModel, CuratedModel } from '../../../src/process/providers/types';

// ---------------------------------------------------------------------------
// Mocks - i18n echoes the key (+ interpolation) so assertions read clean.
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts === 'object') {
        let out = key;
        for (const [k, v] of Object.entries(opts)) {
          if (k === 'defaultValue') continue;
          out += `:${k}=${String(v)}`;
        }
        return out;
      }
      return key;
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => React.createElement('span', null, i18nKey),
}));

// Hoisted spies for the imperative `Message` API - declared with `vi.hoisted`
// so they exist when the (also-hoisted) `vi.mock` factory below closes over them.
const { messageError, messageSuccess } = vi.hoisted(() => ({
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
}));

// `@arco-design/web-react` - keep every real component; only the imperative
// `Modal.confirm` and `Message` APIs use the legacy `ReactDOM.render` path,
// which the React 19 jsdom shim does not provide. Replace `Message` with a
// no-op and `Modal.confirm` with a lightweight in-tree confirm surface so the
// disconnect-guard behavior is still exercised.
vi.mock('@arco-design/web-react', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react');
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');

  // Holder for the live confirm config so a portal-free node can render it.
  const confirmState: { config: Record<string, unknown> | null } = { config: null };
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((fn) => fn());

  const ConfirmHost: React.FC = () => {
    const [, force] = ReactModule.useReducer((n: number) => n + 1, 0);
    ReactModule.useEffect(() => {
      const fn = () => force();
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    }, []);
    const cfg = confirmState.config;
    if (!cfg) return null;
    const close = () => {
      confirmState.config = null;
      notify();
    };
    return (
      <div role='dialog' data-testid='confirm'>
        <div>{String(cfg.title ?? '')}</div>
        <div>{String(cfg.content ?? '')}</div>
        <button
          type='button'
          onClick={() => {
            const ok = cfg.onOk as undefined | (() => unknown);
            close();
            void ok?.();
          }}
        >
          {String(cfg.okText ?? 'OK')}
        </button>
        <button type='button' onClick={close}>
          {String(cfg.cancelText ?? 'Cancel')}
        </button>
      </div>
    );
  };

  const Modal = Object.assign(
    (props: Record<string, unknown>) => {
      const ModalComp = actual.Modal as unknown as React.FC<Record<string, unknown>>;
      return <ModalComp {...props} />;
    },
    actual.Modal,
    {
      confirm: (config: Record<string, unknown>) => {
        confirmState.config = config;
        notify();
        return { close: () => undefined };
      },
    }
  );

  // `Message` - record `.error` / `.success` calls so tests can assert on them
  // (the real imperative API uses the legacy `ReactDOM.render` path).
  const Message = new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === 'error') return messageError;
        if (prop === 'success') return messageSuccess;
        return () => undefined;
      },
    }
  );

  return { ...actual, Modal, Message, __ConfirmHost: ConfirmHost };
});

// modelRegistry IPC surface (consumed by useModelRegistry + ManageProvider).
const mockList = vi.fn();
const mockGetCatalog = vi.fn();
const mockToggleModel = vi.fn();
const mockRefresh = vi.fn();
const mockRekey = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('../../../src/common/adapter/ipcBridge', () => ({
  modelRegistry: {
    list: { invoke: (...a: unknown[]) => mockList(...a) },
    detectKeys: { invoke: vi.fn().mockResolvedValue([]) },
    connect: { invoke: vi.fn() },
    testConnection: { invoke: vi.fn() },
    getCatalog: { invoke: (...a: unknown[]) => mockGetCatalog(...a) },
    toggleModel: { invoke: (...a: unknown[]) => mockToggleModel(...a) },
    refresh: { invoke: (...a: unknown[]) => mockRefresh(...a) },
    disconnect: { invoke: (...a: unknown[]) => mockDisconnect(...a) },
    rekey: { invoke: (...a: unknown[]) => mockRekey(...a) },
    curatedForAgent: { invoke: vi.fn() },
    // Automatic-refresh surface consumed by useModelRegistry (listChanged
    // subscription) + the refresh button / auto-refresh toggle.
    refreshAll: {
      invoke: vi.fn().mockResolvedValue({ ok: true, succeeded: [], failed: [], added: [], lastRefreshedAt: null }),
    },
    getRefreshState: { invoke: vi.fn().mockResolvedValue({ lastRefreshedAt: null, refreshing: false }) },
    getAutoRefresh: { invoke: vi.fn().mockResolvedValue(true) },
    setAutoRefresh: { invoke: vi.fn().mockResolvedValue({ ok: true }) },
    listChanged: { on: vi.fn(() => vi.fn()) },
  },
}));

// Import after the mocks are registered.
import ManageProvider from '../../../src/renderer/pages/settings/ModelsSettings/ManageProvider';
import * as Arco from '@arco-design/web-react';

// The mocked module exposes a portal-free host for `Modal.confirm` output.
const ConfirmHost = (Arco as unknown as { __ConfirmHost: React.FC }).__ConfirmHost;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const provider: IModelRegistryProviderView = {
  providerId: 'anthropic',
  connectedVia: 'api-key',
  state: 'connected',
  modelCount: 4,
};

/** A curated model with sensible defaults. */
const model = (over: Partial<CuratedModel>): CuratedModel => ({
  id: 'm-default',
  providerId: 'anthropic',
  displayName: 'Default Model',
  family: 'default',
  kind: 'text',
  enriched: true,
  tags: [],
  recommended: false,
  enabled: false,
  ...over,
});

const flagship = model({
  id: 'opus-4-7',
  displayName: 'Claude Opus 4.7',
  recommended: true,
  enabled: true,
  role: 'flagship',
  contextWindow: 200000,
  costInPerM: 15,
  costOutPerM: 75,
});

const sonnet = model({
  id: 'sonnet-4-6',
  displayName: 'Claude Sonnet 4.6',
  recommended: true,
  enabled: true,
});

const olderText = model({
  id: 'opus-3',
  displayName: 'Claude Opus 3',
  recommended: false,
  enabled: false,
});

const imageModel = model({
  id: 'gpt-image-1',
  displayName: 'GPT Image 1.5',
  kind: 'image',
  tags: ['image'],
  recommended: false,
  enabled: false,
});

const audioModel = model({
  id: 'whisper-v4',
  displayName: 'Whisper v4',
  kind: 'audio',
  tags: ['audio'],
  recommended: false,
  enabled: false,
});

const curated: CuratedModel[] = [flagship, sonnet, olderText, imageModel, audioModel];

/** A non-text catalog row - image / audio / embedding aren't in `curated`. */
function catalogOnly(id: string, kind: 'image' | 'audio' | 'embedding'): CatalogModel {
  // The Manage page derives tags off the persisted `tags` field; for fixtures
  // mirror the assembler's mapping (kind → primary specialty tag).
  const tagForKind: Record<typeof kind, 'image' | 'audio' | 'embeddings'> = {
    image: 'image',
    audio: 'audio',
    embedding: 'embeddings',
  };
  return {
    id,
    providerId: 'anthropic',
    displayName: id,
    family: id,
    kind,
    enriched: true,
    tags: [tagForKind[kind]],
  };
}

beforeEach(() => {
  mockList.mockReset().mockResolvedValue([provider]);
  mockGetCatalog.mockReset().mockResolvedValue({ catalog: [], curated });
  mockToggleModel.mockReset().mockResolvedValue({ ok: true });
  mockRefresh.mockReset().mockResolvedValue({ ok: true });
  mockRekey.mockReset().mockResolvedValue({ ok: true });
  mockDisconnect.mockReset().mockResolvedValue({ ok: true });
  messageError.mockReset();
  messageSuccess.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

const renderPage = (onDisconnected: () => void = vi.fn()) =>
  render(
    <>
      <ManageProvider provider={provider} onBack={vi.fn()} onDisconnected={onDisconnected} />
      <ConfirmHost />
    </>
  );

/** All model-row elements in DOM order. */
const rows = () => Array.from(document.querySelectorAll('[data-model]'));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ManageProvider page', () => {
  it('fetches the catalog for the managed provider', async () => {
    renderPage();
    await waitFor(() => expect(mockGetCatalog).toHaveBeenCalledWith({ providerId: 'anthropic' }));
  });

  it('renders recommended models above the "More in the catalog" section', async () => {
    renderPage();

    await waitFor(() => expect(rows().length).toBe(5));

    const ordered = rows().map((el) => el.getAttribute('data-model'));
    // Recommended models (flagship, sonnet) come before the rest.
    const recIdx = Math.max(ordered.indexOf('opus-4-7'), ordered.indexOf('sonnet-4-6'));
    const restIdx = Math.min(ordered.indexOf('opus-3'), ordered.indexOf('gpt-image-1'));
    expect(recIdx).toBeLessThan(restIdx);

    // Both section sub-headings render.
    expect(screen.getByText('settings.modelsPage.manage.recommendedHead')).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.manage.moreHead')).toBeInTheDocument();
  });

  it('flips a toggle and calls toggleModel with the new state', async () => {
    renderPage();

    await waitFor(() => expect(rows().length).toBe(5));

    // The older (off) model - turning it on.
    const olderRow = document.querySelector('[data-model="opus-3"]') as HTMLElement;
    expect(olderRow.getAttribute('data-enabled')).toBe('false');

    const toggle = within(olderRow).getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(mockToggleModel).toHaveBeenCalledWith({
        providerId: 'anthropic',
        modelId: 'opus-3',
        enabled: true,
      })
    );
    // Optimistic flip reflected in the DOM.
    await waitFor(() => expect(olderRow.getAttribute('data-enabled')).toBe('true'));
  });

  it('filters the unified list by the search input', async () => {
    renderPage();

    await waitFor(() => expect(rows().length).toBe(5));

    const search = screen.getByPlaceholderText('settings.modelsPage.manage.searchPlaceholder');
    fireEvent.change(search, { target: { value: 'whisper' } });

    await waitFor(() => {
      const visible = rows().map((el) => el.getAttribute('data-model'));
      expect(visible).toEqual(['whisper-v4']);
    });
  });

  it('shows a usage tag on image and audio rows', async () => {
    renderPage();

    await waitFor(() => expect(rows().length).toBe(5));

    const imageRow = document.querySelector('[data-model="gpt-image-1"]') as HTMLElement;
    const audioRow = document.querySelector('[data-model="whisper-v4"]') as HTMLElement;
    expect(within(imageRow).getByText('settings.modelsPage.manage.tagImage')).toBeInTheDocument();
    expect(within(audioRow).getByText('settings.modelsPage.manage.tagAudio')).toBeInTheDocument();

    // A text model in the fixture has no `tags` set - no usage chip renders.
    const textRow = document.querySelector('[data-model="opus-4-7"]') as HTMLElement;
    expect(within(textRow).queryByText(/manage\.tag/)).not.toBeInTheDocument();
  });

  it('renders the header Refresh / Re-key / Disconnect actions', async () => {
    renderPage();

    await waitFor(() => expect(rows().length).toBe(5));

    expect(screen.getByText('settings.modelsPage.manage.refresh')).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.manage.rekey')).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.manage.disconnect')).toBeInTheDocument();
  });

  it('calls refresh and reloads the catalog when Refresh is clicked', async () => {
    renderPage();
    await waitFor(() => expect(rows().length).toBe(5));

    fireEvent.click(screen.getByText('settings.modelsPage.manage.refresh'));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledWith({ providerId: 'anthropic' }));
    // getCatalog runs once on mount and again after a successful refresh.
    await waitFor(() => expect(mockGetCatalog).toHaveBeenCalledTimes(2));
  });

  it('shows a confirmation before disconnecting and calls disconnect on confirm', async () => {
    renderPage();
    await waitFor(() => expect(rows().length).toBe(5));

    fireEvent.click(screen.getByText('settings.modelsPage.manage.disconnect'));

    // The confirmation dialog renders with the disconnect copy - disconnect must
    // NOT have been called yet.
    expect(await screen.findByText('settings.modelsPage.manage.disconnectTitle')).toBeInTheDocument();
    expect(mockDisconnect).not.toHaveBeenCalled();

    // Confirm - the modal's primary action.
    fireEvent.click(screen.getByText('settings.modelsPage.manage.disconnectConfirm'));

    await waitFor(() => expect(mockDisconnect).toHaveBeenCalledWith({ providerId: 'anthropic' }));
  });

  it('opens the Re-key dialog and calls rekey with the new key', async () => {
    renderPage();
    await waitFor(() => expect(rows().length).toBe(5));

    fireEvent.click(screen.getByText('settings.modelsPage.manage.rekey'));

    const keyInput = await screen.findByPlaceholderText('settings.modelsPage.manage.rekeyPlaceholder');
    fireEvent.change(keyInput, { target: { value: 'sk-ant-new-key' } });
    fireEvent.click(screen.getByText('settings.modelsPage.manage.rekeyConfirm'));

    await waitFor(() =>
      expect(mockRekey).toHaveBeenCalledWith({
        providerId: 'anthropic',
        creds: { key: 'sk-ant-new-key' },
      })
    );
  });

  it('shows the error state when the catalog fetch fails', async () => {
    mockGetCatalog.mockRejectedValueOnce(new Error('network down'));
    renderPage();

    expect(await screen.findByText('settings.modelsPage.manage.loadError')).toBeInTheDocument();
  });

  it('shows the empty state when the provider returns no models', async () => {
    mockGetCatalog.mockResolvedValueOnce({ catalog: [], curated: [] });
    renderPage();

    expect(await screen.findByText('settings.modelsPage.manage.empty')).toBeInTheDocument();
  });

  it('reverts the optimistic toggle and shows an error when toggleModel resolves not-ok', async () => {
    mockToggleModel.mockResolvedValueOnce({ ok: false });
    renderPage();

    await waitFor(() => expect(rows().length).toBe(5));

    // The older (off) model - turning it on.
    const olderRow = document.querySelector('[data-model="opus-3"]') as HTMLElement;
    expect(olderRow.getAttribute('data-enabled')).toBe('false');

    fireEvent.click(within(olderRow).getByRole('switch'));

    // Optimistic flip happens, then reverts once the IPC resolves not-ok.
    await waitFor(() => expect(mockToggleModel).toHaveBeenCalled());
    await waitFor(() => expect(olderRow.getAttribute('data-enabled')).toBe('false'));
    expect(messageError).toHaveBeenCalledWith('settings.modelsPage.manage.toggleFailed');
  });

  it('reverts the optimistic toggle and shows an error when toggleModel rejects', async () => {
    mockToggleModel.mockRejectedValueOnce(new Error('network down'));
    renderPage();

    await waitFor(() => expect(rows().length).toBe(5));

    // The flagship (on) model - turning it off.
    const flagshipRow = document.querySelector('[data-model="opus-4-7"]') as HTMLElement;
    expect(flagshipRow.getAttribute('data-enabled')).toBe('true');

    fireEvent.click(within(flagshipRow).getByRole('switch'));

    // Optimistic flip to off, then reverts back to on once the IPC rejects.
    await waitFor(() => expect(mockToggleModel).toHaveBeenCalled());
    await waitFor(() => expect(flagshipRow.getAttribute('data-enabled')).toBe('true'));
    expect(messageError).toHaveBeenCalledWith('settings.modelsPage.manage.toggleFailed');
  });

  it('keeps the Re-key dialog open and shows the error when rekey resolves not-ok', async () => {
    mockRekey.mockResolvedValueOnce({ ok: false, error: 'unauthorized' });
    renderPage();
    await waitFor(() => expect(rows().length).toBe(5));

    fireEvent.click(screen.getByText('settings.modelsPage.manage.rekey'));

    const keyInput = await screen.findByPlaceholderText('settings.modelsPage.manage.rekeyPlaceholder');
    fireEvent.change(keyInput, { target: { value: 'sk-ant-bad-key' } });
    fireEvent.click(screen.getByText('settings.modelsPage.manage.rekeyConfirm'));

    await waitFor(() => expect(mockRekey).toHaveBeenCalled());

    // The localized `unauthorized` error renders in the dialog's alert element.
    const alert = await screen.findByText(/manage\.errorUnauthorized/, { selector: '[role="alert"]' });
    expect(alert).toBeInTheDocument();
    // The dialog stays open - its key input is still mounted.
    expect(screen.getByPlaceholderText('settings.modelsPage.manage.rekeyPlaceholder')).toBeInTheDocument();
  });

  it('renders image / audio / embedding rows from the full catalog (not just curated)', async () => {
    // The Curator filters non-text models out of `curated`, so the Manage
    // page must render from `catalog` and join curated flags on by id -
    // otherwise image / audio rows never reach the "More in the catalog"
    // section. Curated holds only the text models; catalog holds everything.
    mockGetCatalog.mockResolvedValueOnce({
      catalog: [
        // The text rows present in `curated`.
        { ...flagship, recommended: undefined, enabled: undefined } as unknown,
        { ...sonnet, recommended: undefined, enabled: undefined } as unknown,
        { ...olderText, recommended: undefined, enabled: undefined } as unknown,
        // Non-text rows that the Curator excludes from `curated`.
        catalogOnly('dalle-3', 'image'),
        catalogOnly('whisper-1', 'audio'),
        catalogOnly('ada-002', 'embedding'),
      ],
      // Text-only curated set (no image / audio / embedding).
      curated: [flagship, sonnet, olderText],
    });
    renderPage();

    // Wait for all 6 catalog rows.
    await waitFor(() => expect(rows().length).toBe(6));
    const ids = rows().map((el) => el.getAttribute('data-model'));
    expect(ids).toContain('dalle-3');
    expect(ids).toContain('whisper-1');
    expect(ids).toContain('ada-002');

    // Non-curated rows default off (the Manage page is the one place a user
    // turns them on).
    const dalle = document.querySelector('[data-model="dalle-3"]') as HTMLElement;
    expect(dalle.getAttribute('data-enabled')).toBe('false');
    // …and carry their usage tag derived from the persisted `tags` field.
    expect(within(dalle).getByText('settings.modelsPage.manage.tagImage')).toBeInTheDocument();
  });

  it('shows the no-match state when a search query matches no models', async () => {
    renderPage();
    await waitFor(() => expect(rows().length).toBe(5));

    const search = screen.getByPlaceholderText('settings.modelsPage.manage.searchPlaceholder');
    fireEvent.change(search, { target: { value: 'zzz-no-such-model' } });

    // The no-match state renders - distinct from the empty-catalog state.
    await waitFor(() => expect(rows().length).toBe(0));
    expect(screen.getByText('settings.modelsPage.manage.noMatch:query=zzz-no-such-model')).toBeInTheDocument();
    expect(screen.queryByText('settings.modelsPage.manage.empty')).not.toBeInTheDocument();
  });
});
