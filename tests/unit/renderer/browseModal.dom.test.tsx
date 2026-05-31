/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Browse-all-providers modal + cloud credential form (Packet 2C) — behavior
 * contract.
 *
 * Covers the spec §3.7 / §4.6 surface:
 *  - the grid renders every provider grouped (Frontier / Cloud / Open / Chinese
 *    / Voice)
 *  - the search input filters the grid
 *  - an already-connected provider carries a "Connected" tag
 *  - selecting a single-key provider opens the key paste flow and connects
 *  - selecting a cloud provider opens `CloudCredentialForm` with the exact
 *    `CLOUD_REQUIRED_FIELDS` field set
 *  - submitting the cloud form calls `connect` with `{ fields }`
 *  - a failed connect surfaces the inline error
 *
 * `ipcBridge` is mocked; the file name uses the `.dom.test.tsx` suffix so it
 * runs in the jsdom Vitest project (the `node` project only matches `.test.ts`).
 * BrowseModal uses only declarative Arco components — no imperative `Message` /
 * `Modal.confirm` — so the real `@arco-design/web-react` is kept unmocked.
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IModelRegistryProviderView } from '../../../src/common/adapter/ipcBridge';

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

// modelRegistry IPC surface (consumed by useModelRegistry + BrowseModal).
const mockList = vi.fn();
const mockConnect = vi.fn();

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
  },
}));

// Import after the mocks are registered.
import BrowseModal from '../../../src/renderer/pages/settings/ModelsSettings/BrowseModal';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const connectedProvider: IModelRegistryProviderView = {
  providerId: 'openai',
  connectedVia: 'api-key',
  state: 'connected',
  modelCount: 6,
};

beforeEach(() => {
  mockList.mockReset().mockResolvedValue([]);
  mockConnect.mockReset().mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

const renderModal = (onClose: () => void = vi.fn()) => render(<BrowseModal visible onClose={onClose} />);

/** All provider-tile elements in DOM order. */
const tiles = () => Array.from(document.querySelectorAll('[data-provider]'));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BrowseModal', () => {
  it('renders the grouped provider grid', async () => {
    renderModal();

    // Every group label renders.
    expect(await screen.findByText('settings.modelsPage.browse.group.frontier')).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.browse.group.cloud')).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.browse.group.open')).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.browse.group.chinese')).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.browse.group.voice')).toBeInTheDocument();

    // All 32 providers render as tiles.
    expect(tiles().length).toBe(32);
  });

  it('filters the grid by the search input', async () => {
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    const search = screen.getByPlaceholderText('settings.modelsPage.browse.searchPlaceholder');
    fireEvent.change(search, { target: { value: 'anthropic' } });

    await waitFor(() => {
      const visible = tiles().map((el) => el.getAttribute('data-provider'));
      expect(visible).toEqual(['anthropic']);
    });
  });

  it('shows a no-match state when the search matches nothing', async () => {
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    const search = screen.getByPlaceholderText('settings.modelsPage.browse.searchPlaceholder');
    fireEvent.change(search, { target: { value: 'zzz-no-such-provider' } });

    await waitFor(() => expect(tiles().length).toBe(0));
    expect(screen.getByText('settings.modelsPage.browse.noMatch:query=zzz-no-such-provider')).toBeInTheDocument();
  });

  it('tags an already-connected provider', async () => {
    mockList.mockResolvedValue([connectedProvider]);
    renderModal();

    await waitFor(() => {
      const openaiTile = document.querySelector('[data-provider="openai"]') as HTMLElement;
      expect(within(openaiTile).getByText('settings.modelsPage.browse.connected')).toBeInTheDocument();
    });

    // A non-connected provider carries no tag.
    const anthropicTile = document.querySelector('[data-provider="anthropic"]') as HTMLElement;
    expect(within(anthropicTile).queryByText('settings.modelsPage.browse.connected')).not.toBeInTheDocument();
  });

  it('opens the single-key flow for a single-key provider and connects', async () => {
    const onClose = vi.fn();
    renderModal(onClose);
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    // Pick OpenAI — a single-key provider.
    fireEvent.click(document.querySelector('[data-provider="openai"]') as HTMLElement);

    const keyInput = await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');
    fireEvent.change(keyInput, { target: { value: 'sk-test-key' } });
    fireEvent.click(screen.getByText('settings.modelsPage.browse.connect'));

    await waitFor(() =>
      expect(mockConnect).toHaveBeenCalledWith({
        providerId: 'openai',
        creds: { key: 'sk-test-key' },
      })
    );
    // A successful connect closes the modal.
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows the inline error when a single-key connect fails', async () => {
    mockConnect.mockResolvedValue({ ok: false, error: 'unauthorized' });
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    fireEvent.click(document.querySelector('[data-provider="openai"]') as HTMLElement);

    const keyInput = await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');
    fireEvent.change(keyInput, { target: { value: 'sk-bad-key' } });
    fireEvent.click(screen.getByText('settings.modelsPage.browse.connect'));

    await waitFor(() => expect(mockConnect).toHaveBeenCalled());
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/browse\.errorUnauthorized/);
  });

  it('opens the cloud credential form with the exact Bedrock fields', async () => {
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    // Pick AWS Bedrock — a cloud provider.
    fireEvent.click(document.querySelector('[data-provider="aws-bedrock"]') as HTMLElement);

    // The form renders exactly the three CLOUD_REQUIRED_FIELDS for Bedrock.
    expect(await screen.findByLabelText('settings.modelsPage.cloud.fields.accessKeyId.label')).toBeInTheDocument();
    expect(screen.getByLabelText('settings.modelsPage.cloud.fields.secretAccessKey.label')).toBeInTheDocument();
    expect(screen.getByLabelText('settings.modelsPage.cloud.fields.region.label')).toBeInTheDocument();

    // No Vertex / Azure fields leak in.
    expect(screen.queryByLabelText('settings.modelsPage.cloud.fields.projectId.label')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('settings.modelsPage.cloud.fields.endpoint.label')).not.toBeInTheDocument();
  });

  it('opens the cloud credential form with the exact Vertex fields', async () => {
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    fireEvent.click(document.querySelector('[data-provider="vertex"]') as HTMLElement);

    expect(await screen.findByLabelText('settings.modelsPage.cloud.fields.projectId.label')).toBeInTheDocument();
    expect(screen.getByLabelText('settings.modelsPage.cloud.fields.region.label')).toBeInTheDocument();
    expect(screen.getByLabelText('settings.modelsPage.cloud.fields.serviceAccountJson.label')).toBeInTheDocument();
  });

  it('submits the cloud form via connect with a { fields } payload', async () => {
    const onClose = vi.fn();
    renderModal(onClose);
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    fireEvent.click(document.querySelector('[data-provider="aws-bedrock"]') as HTMLElement);

    fireEvent.change(await screen.findByLabelText('settings.modelsPage.cloud.fields.accessKeyId.label'), {
      target: { value: 'AKIAEXAMPLE' },
    });
    fireEvent.change(screen.getByLabelText('settings.modelsPage.cloud.fields.secretAccessKey.label'), {
      target: { value: 'secret-value' },
    });
    fireEvent.change(screen.getByLabelText('settings.modelsPage.cloud.fields.region.label'), {
      target: { value: 'us-east-1' },
    });

    fireEvent.click(screen.getByText('settings.modelsPage.cloud.submitConnect'));

    await waitFor(() =>
      expect(mockConnect).toHaveBeenCalledWith({
        providerId: 'aws-bedrock',
        creds: {
          fields: {
            accessKeyId: 'AKIAEXAMPLE',
            secretAccessKey: 'secret-value',
            region: 'us-east-1',
          },
        },
      })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps the cloud submit disabled until every field is filled', async () => {
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    fireEvent.click(document.querySelector('[data-provider="aws-bedrock"]') as HTMLElement);

    const submit = (await screen.findByText('settings.modelsPage.cloud.submitConnect')).closest('button')!;
    expect(submit).toBeDisabled();

    // Fill two of three fields — still disabled.
    fireEvent.change(screen.getByLabelText('settings.modelsPage.cloud.fields.accessKeyId.label'), {
      target: { value: 'AKIAEXAMPLE' },
    });
    fireEvent.change(screen.getByLabelText('settings.modelsPage.cloud.fields.secretAccessKey.label'), {
      target: { value: 'secret-value' },
    });
    expect(submit).toBeDisabled();

    // Fill the last one — now enabled.
    fireEvent.change(screen.getByLabelText('settings.modelsPage.cloud.fields.region.label'), {
      target: { value: 'us-east-1' },
    });
    await waitFor(() => expect(submit).not.toBeDisabled());
  });

  it('shows the inline error when a cloud connect fails', async () => {
    mockConnect.mockResolvedValue({ ok: false, error: 'unrecognized' });
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    fireEvent.click(document.querySelector('[data-provider="aws-bedrock"]') as HTMLElement);

    fireEvent.change(await screen.findByLabelText('settings.modelsPage.cloud.fields.accessKeyId.label'), {
      target: { value: 'AKIAEXAMPLE' },
    });
    fireEvent.change(screen.getByLabelText('settings.modelsPage.cloud.fields.secretAccessKey.label'), {
      target: { value: 'secret-value' },
    });
    fireEvent.change(screen.getByLabelText('settings.modelsPage.cloud.fields.region.label'), {
      target: { value: 'us-east-1' },
    });
    fireEvent.click(screen.getByText('settings.modelsPage.cloud.submitConnect'));

    await waitFor(() => expect(mockConnect).toHaveBeenCalled());
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/cloud\.errorUnrecognized/);
  });

  it('returns to the grid from a provider sub-view via the back button', async () => {
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    fireEvent.click(document.querySelector('[data-provider="openai"]') as HTMLElement);
    await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');

    fireEvent.click(screen.getByText('settings.modelsPage.browse.back'));

    // The grid is back.
    await waitFor(() => expect(tiles().length).toBe(32));
  });

  // ---- Ship-gate Fix B2 ----------------------------------------------------

  it('renders a Base URL input only for openai-compatible and submits it as creds.baseUrl', async () => {
    const onClose = vi.fn();
    renderModal(onClose);
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    // Pick openai-compatible — the baseUrl input must appear.
    fireEvent.click(document.querySelector('[data-provider="openai-compatible"]') as HTMLElement);

    const keyInput = await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');
    const baseUrlInput = await screen.findByLabelText('settings.modelsPage.browse.baseUrlLabel');

    fireEvent.change(keyInput, { target: { value: 'sk-anything' } });
    fireEvent.change(baseUrlInput, { target: { value: 'https://my-endpoint.example/v1' } });
    fireEvent.click(screen.getByText('settings.modelsPage.browse.connect'));

    await waitFor(() =>
      expect(mockConnect).toHaveBeenCalledWith({
        providerId: 'openai-compatible',
        creds: { key: 'sk-anything', baseUrl: 'https://my-endpoint.example/v1' },
      })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('omits creds.baseUrl when the openai-compatible baseUrl input is left blank', async () => {
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    fireEvent.click(document.querySelector('[data-provider="openai-compatible"]') as HTMLElement);

    const keyInput = await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');
    fireEvent.change(keyInput, { target: { value: 'sk-anything' } });
    fireEvent.click(screen.getByText('settings.modelsPage.browse.connect'));

    await waitFor(() =>
      expect(mockConnect).toHaveBeenCalledWith({
        providerId: 'openai-compatible',
        creds: { key: 'sk-anything' },
      })
    );
  });

  it('does NOT render the Base URL input for non-openai-compatible single-key providers', async () => {
    renderModal();
    await screen.findByText('settings.modelsPage.browse.group.frontier');

    fireEvent.click(document.querySelector('[data-provider="openai"]') as HTMLElement);

    await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');
    expect(screen.queryByLabelText('settings.modelsPage.browse.baseUrlLabel')).not.toBeInTheDocument();
  });
});
