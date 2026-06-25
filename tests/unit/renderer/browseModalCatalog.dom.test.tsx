/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Browse modal — named-provider catalog list (T3.4) behavior contract.
 *
 * Covers the searchable ~100-provider catalog added to the Browse modal:
 *  - the grid carries a "Browse 100+ providers" entry that opens the catalog
 *  - the catalog fetches via `modelRegistry.getProviderCatalog` (MOCKED here —
 *    the live handler lands in lane T3.3 and is not depended on)
 *  - a loading spinner shows while the fetch is in flight
 *  - entries render with their catalog displayName + a generic avatar
 *  - the catalog search filters by displayName / id
 *  - an empty search shows the no-match state
 *  - a fetch error shows the error + retry, and retry re-fetches
 *  - selecting a catalog provider opens the key-only flow and connects with
 *    `{ providerId, creds: { key } }` (NO baseUrl — the engine resolves it)
 *  - MIGRATION SAFETY (audit H-7 / M-1): an existing openai-compatible
 *    connection (`{ key, baseUrl }`) still resolves through the unchanged
 *    generic manual-baseUrl path.
 *
 * `ipcBridge` is fully mocked; the `.dom.test.tsx` suffix runs this in the
 * jsdom Vitest project. The real `@arco-design/web-react` is kept unmocked so
 * the Arco `List` virtualization renders.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IModelRegistryProviderView } from '../../../src/common/adapter/ipcBridge';
import type { CatalogProviderEntry } from '../../../src/process/providers/catalog/catalogProvider';

// ---------------------------------------------------------------------------
// Mocks — i18n echoes the key (+ interpolation) so assertions read clean.
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

const mockList = vi.fn();
const mockConnect = vi.fn();
const mockGetProviderCatalog = vi.fn();
// The single-key connect (catalog + openai-compatible) now routes through the
// parent's headless-aware `connectKey(providerId, key, baseUrl?)` prop (#71);
// BrowseModal's contract is to invoke it, so these tests assert against it.
const mockConnectKey = vi.fn();

vi.mock('../../../src/common/adapter/ipcBridge', () => ({
  modelRegistry: {
    list: { invoke: (...a: unknown[]) => mockList(...a) },
    detectKeys: { invoke: vi.fn().mockResolvedValue([]) },
    connect: { invoke: (...a: unknown[]) => mockConnect(...a) },
    testConnection: { invoke: vi.fn() },
    getCatalog: { invoke: vi.fn() },
    toggleModel: { invoke: vi.fn() },
    refresh: { invoke: vi.fn() },
    disconnect: { invoke: vi.fn() },
    rekey: { invoke: vi.fn() },
    curatedForAgent: { invoke: vi.fn() },
    // FROZEN IPC CONTRACT (T3.3): channel `modelRegistry.getProviderCatalog`
    // returns CatalogProviderEntry[] sorted by displayName. Mocked here.
    getProviderCatalog: { invoke: (...a: unknown[]) => mockGetProviderCatalog(...a) },
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
import BrowseModal from '../../../src/renderer/pages/settings/ModelsSettings/BrowseModal';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const catalogEntries: CatalogProviderEntry[] = [
  { id: 'novita', displayName: 'Novita', baseUrl: 'https://api.novita.ai', envVar: 'NOVITA_API_KEY' },
  { id: 'deepinfra', displayName: 'DeepInfra', baseUrl: 'https://api.deepinfra.com', envVar: 'DEEPINFRA_API_KEY' },
  { id: 'sambanova', displayName: 'SambaNova', baseUrl: 'https://api.sambanova.ai', envVar: 'SAMBANOVA_API_KEY' },
];

const GROUP = 'settings.modelsPage.browse.group.frontier';
const CATALOG_ENTRY = 'settings.modelsPage.browse.catalog.entry';

beforeEach(() => {
  mockList.mockReset().mockResolvedValue([]);
  mockConnect.mockReset().mockResolvedValue({ ok: true });
  mockConnectKey.mockReset().mockResolvedValue({ ok: true });
  mockGetProviderCatalog.mockReset().mockResolvedValue(catalogEntries);
});

afterEach(() => {
  vi.clearAllMocks();
});

const renderModal = (onClose: () => void = vi.fn()) =>
  render(<BrowseModal visible onClose={onClose} connectKey={mockConnectKey} />);

/** Open the catalog view from the grid. */
const openCatalog = async () => {
  await screen.findByText(GROUP);
  fireEvent.click(screen.getByText(CATALOG_ENTRY));
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BrowseModal — named-provider catalog', () => {
  it('exposes a catalog entry in the grid that opens the catalog and fetches via getProviderCatalog', async () => {
    renderModal();
    await openCatalog();

    expect(mockGetProviderCatalog).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Novita')).toBeInTheDocument();
    expect(screen.getByText('DeepInfra')).toBeInTheDocument();
    expect(screen.getByText('SambaNova')).toBeInTheDocument();
  });

  it('shows a loading state while the catalog fetch is in flight', async () => {
    let resolve!: (v: CatalogProviderEntry[]) => void;
    mockGetProviderCatalog.mockReturnValue(new Promise<CatalogProviderEntry[]>((r) => (resolve = r)));
    renderModal();
    await openCatalog();

    expect(await screen.findByText('settings.modelsPage.browse.catalog.loading')).toBeInTheDocument();

    resolve(catalogEntries);
    await waitFor(() => expect(screen.getByText('Novita')).toBeInTheDocument());
  });

  it('filters catalog entries by the catalog search input', async () => {
    renderModal();
    await openCatalog();
    await screen.findByText('Novita');

    const search = screen.getByPlaceholderText('settings.modelsPage.browse.catalog.searchPlaceholder');
    fireEvent.change(search, { target: { value: 'deep' } });

    await waitFor(() => {
      expect(screen.getByText('DeepInfra')).toBeInTheDocument();
      expect(screen.queryByText('Novita')).not.toBeInTheDocument();
      expect(screen.queryByText('SambaNova')).not.toBeInTheDocument();
    });
  });

  it('shows the no-match state when the catalog search matches nothing', async () => {
    renderModal();
    await openCatalog();
    await screen.findByText('Novita');

    const search = screen.getByPlaceholderText('settings.modelsPage.browse.catalog.searchPlaceholder');
    fireEvent.change(search, { target: { value: 'zzz-nope' } });

    await waitFor(() =>
      expect(screen.getByText('settings.modelsPage.browse.catalog.noMatch:query=zzz-nope')).toBeInTheDocument()
    );
  });

  it('shows an error + retry when the catalog fetch fails, and retry re-fetches', async () => {
    mockGetProviderCatalog.mockRejectedValueOnce(new Error('boom'));
    renderModal();
    await openCatalog();

    expect(await screen.findByText('settings.modelsPage.browse.catalog.error')).toBeInTheDocument();

    // Retry now succeeds.
    fireEvent.click(screen.getByText('settings.modelsPage.browse.catalog.retry'));
    expect(await screen.findByText('Novita')).toBeInTheDocument();
    expect(mockGetProviderCatalog).toHaveBeenCalledTimes(2);
  });

  it('selecting a catalog provider connects with { key } only — NO baseUrl', async () => {
    const onClose = vi.fn();
    renderModal(onClose);
    await openCatalog();

    fireEvent.click(await screen.findByText('Novita'));

    // The key-only flow opens; no Base URL input (that is openai-compatible only).
    const keyInput = await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');
    expect(screen.queryByLabelText('settings.modelsPage.browse.baseUrlLabel')).not.toBeInTheDocument();

    fireEvent.change(keyInput, { target: { value: 'sk-novita-key' } });
    fireEvent.click(screen.getByText('settings.modelsPage.browse.connect'));

    // Routes through `connectKey` with no baseUrl (the engine resolves it).
    await waitFor(() => expect(mockConnectKey).toHaveBeenCalledWith('novita', 'sk-novita-key', undefined));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('tags an already-connected catalog provider', async () => {
    const connected: IModelRegistryProviderView = {
      providerId: 'novita',
      connectedVia: 'api-key',
      state: 'connected',
      modelCount: 4,
    };
    mockList.mockResolvedValue([connected]);
    renderModal();
    await openCatalog();

    await waitFor(() => {
      const row = document.querySelector('[data-provider="novita"]') as HTMLElement;
      expect(row.textContent).toContain('settings.modelsPage.browse.connected');
    });
  });

  // ---- MIGRATION SAFETY (audit H-7 / M-1) --------------------------------

  it('keeps the generic openai-compatible manual-baseUrl path intact', async () => {
    const onClose = vi.fn();
    renderModal(onClose);
    await screen.findByText(GROUP);

    // The generic openai-compatible tile still exists in the grid.
    fireEvent.click(document.querySelector('[data-provider="openai-compatible"]') as HTMLElement);

    // Its manual Base URL field still renders and submits as creds.baseUrl.
    const keyInput = await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');
    const baseUrlInput = await screen.findByLabelText('settings.modelsPage.browse.baseUrlLabel');

    fireEvent.change(keyInput, { target: { value: 'sk-custom' } });
    fireEvent.change(baseUrlInput, { target: { value: 'https://my-endpoint.example/v1' } });
    fireEvent.click(screen.getByText('settings.modelsPage.browse.connect'));

    // The manual baseUrl is threaded through `connectKey` as its third arg.
    await waitFor(() =>
      expect(mockConnectKey).toHaveBeenCalledWith('openai-compatible', 'sk-custom', 'https://my-endpoint.example/v1')
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
