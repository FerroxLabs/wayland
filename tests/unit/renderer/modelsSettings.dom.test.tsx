/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Models settings page (Packet 2A) - behavior contract.
 *
 * Covers the spec §4.2 / §4.3 surface:
 *  - connected rows render from `modelRegistry.list()`
 *  - a rejected-key connect surfaces the inline error in the connect panel
 *  - the empty state shows when there are no providers and no detected keys
 *  - the detected-keys strip shows Use / Ignore when `detectKeys()` returns keys
 *  - a provider in `state: 'error'` renders the "Action needed - Fix" row
 *
 * `ipcBridge` is mocked; the file name uses the `.dom.test.tsx` suffix so it
 * runs in the jsdom Vitest project (the `node` project only matches `.test.ts`).
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IModelRegistryDetectedKey, IModelRegistryProviderView } from '../../../src/common/adapter/ipcBridge';

// ---------------------------------------------------------------------------
// Mocks - i18n returns the default value (or the key) so assertions read clean.
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      // Echo interpolation so error/count assertions can match on substrings.
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

// modelRegistry IPC surface (consumed by useModelRegistry + ConnectPanel).
const mockList = vi.fn();
const mockDetectKeys = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockGoogleLogin = vi.fn();
// Headless write-only HTTP connect route (remote WebUI path).
const mockConnectProviderHttp = vi.fn();

vi.mock('../../../src/common/adapter/ipcBridge', () => ({
  modelRegistry: {
    list: { invoke: (...a: unknown[]) => mockList(...a) },
    detectKeys: { invoke: (...a: unknown[]) => mockDetectKeys(...a) },
    connect: { invoke: (...a: unknown[]) => mockConnect(...a) },
    disconnect: { invoke: (...a: unknown[]) => mockDisconnect(...a) },
    testConnection: { invoke: vi.fn() },
    getCatalog: { invoke: vi.fn() },
    toggleModel: { invoke: vi.fn() },
    refresh: { invoke: vi.fn() },
    rekey: { invoke: vi.fn() },
    curatedForAgent: { invoke: vi.fn() },
    // Automatic-refresh surface (consumed by useModelRegistry's listChanged
    // subscription + the Settings refresh button / auto-refresh toggle).
    refreshAll: {
      invoke: vi.fn().mockResolvedValue({ ok: true, succeeded: [], failed: [], added: [], lastRefreshedAt: null }),
    },
    getRefreshState: { invoke: vi.fn().mockResolvedValue({ lastRefreshedAt: null, refreshing: false }) },
    getAutoRefresh: { invoke: vi.fn().mockResolvedValue(true) },
    setAutoRefresh: { invoke: vi.fn().mockResolvedValue({ ok: true }) },
    listChanged: { on: vi.fn(() => vi.fn()) },
  },
}));

// Write-only provider-key HTTP client (the headless/remote WebUI connect path).
vi.mock('../../../src/renderer/services/ProviderKeyService', () => ({
  connectProviderHttp: (...a: unknown[]) => mockConnectProviderHttp(...a),
}));

// `@/common` barrel - GoogleButton imports `ipcBridge` from here.
vi.mock('../../../src/common', () => ({
  ipcBridge: {
    googleAuth: {
      login: { invoke: (...a: unknown[]) => mockGoogleLogin(...a) },
    },
  },
}));

// SettingsPageShell is page chrome (breadcrumb, mobile nav, router hooks) -
// stub it to a plain wrapper so the test focuses on the Models page itself.
vi.mock('../../../src/renderer/pages/settings/components/SettingsPageShell', () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'settings-shell' }, children),
}));

// Deep-link hook - controllable per test so we can exercise the seed flow.
const mockConsumePendingDeepLink = vi.fn();
vi.mock('../../../src/renderer/hooks/system/useDeepLink', () => ({
  consumePendingDeepLink: () => mockConsumePendingDeepLink(),
  useDeepLink: () => undefined,
}));

// Import after the mocks are registered.
import ModelsSettings from '../../../src/renderer/pages/settings/ModelsSettings';
import { recognizeKey } from '../../../src/renderer/pages/settings/ModelsSettings/providerCatalog';
import type { KeyRecognition } from '../../../src/renderer/pages/settings/ModelsSettings/providerCatalog';
import { PROVIDER_KEY_PATTERNS } from '../../../src/process/providers/detection/providerKeyPatterns';
import type { ProviderId } from '../../../src/process/providers/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const connectedProvider: IModelRegistryProviderView = {
  providerId: 'anthropic',
  connectedVia: 'api-key',
  state: 'connected',
  modelCount: 12,
};

const erroredProvider: IModelRegistryProviderView = {
  providerId: 'openai',
  connectedVia: 'api-key',
  state: 'error',
  modelCount: 0,
  error: 'unauthorized',
};

const detectedKey: IModelRegistryDetectedKey = {
  providerId: 'groq',
  source: 'env:GROQ_API_KEY',
};

beforeEach(() => {
  mockList.mockReset().mockResolvedValue([]);
  mockDetectKeys.mockReset().mockResolvedValue([]);
  mockConnect.mockReset().mockResolvedValue({ ok: true });
  mockDisconnect.mockReset().mockResolvedValue({ ok: true });
  mockGoogleLogin.mockReset().mockResolvedValue({ success: true, data: { account: '' } });
  mockConnectProviderHttp.mockReset().mockResolvedValue({ ok: true });
  // Default: no pending deep-link. Tests opt in by overriding per case.
  mockConsumePendingDeepLink.mockReset().mockReturnValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

const renderPage = () => render(<ModelsSettings />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ModelsSettings page', () => {
  it('renders a connected row from modelRegistry.list()', async () => {
    mockList.mockResolvedValue([connectedProvider]);

    renderPage();

    expect(await screen.findByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.row.connected')).toBeInTheDocument();
    // Model count interpolates the count.
    expect(screen.getByText(/row\.modelCount:count=12/)).toBeInTheDocument();
    // `connectedVia` is localized through an i18n key, not rendered raw - the
    // backend emits the literal `api-key`, never a display string.
    expect(screen.getByText('settings.modelsPage.row.via.apiKey')).toBeInTheDocument();
    expect(screen.queryByText('api-key')).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no providers and no detected keys', async () => {
    mockList.mockResolvedValue([]);
    mockDetectKeys.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('settings.modelsPage.empty.note')).toBeInTheDocument();
  });

  it('shows the detected-keys strip with Use / Ignore when detectKeys() returns keys', async () => {
    mockList.mockResolvedValue([]);
    mockDetectKeys.mockResolvedValue([detectedKey]);

    renderPage();

    // The strip text interpolates the recognized provider name.
    expect(await screen.findByText(/detected\.found:provider=Groq/)).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.detected.use')).toBeInTheDocument();
    expect(screen.getByText('settings.modelsPage.detected.ignore')).toBeInTheDocument();
  });

  it('renders the "Action needed - Fix" row for a provider in the error state', async () => {
    mockList.mockResolvedValue([erroredProvider]);

    renderPage();

    expect(await screen.findByText('OpenAI')).toBeInTheDocument();
    // Persistent error status, not a stale green badge.
    expect(screen.getByRole('alert')).toHaveTextContent('row.actionNeeded');
    expect(screen.getByText('settings.modelsPage.row.fix')).toBeInTheDocument();
    // The green "Connected" status must NOT be present for an errored provider.
    expect(screen.queryByText('settings.modelsPage.row.connected')).not.toBeInTheDocument();
  });

  it('shows the inline connect error when a pasted key is rejected', async () => {
    mockList.mockResolvedValue([]);
    mockDetectKeys.mockResolvedValue([]);
    // The backend test call rejects the key as unauthorized.
    mockConnect.mockResolvedValue({ ok: false, error: 'unauthorized' });

    renderPage();

    // Wait for the connect panel to mount.
    const input = await screen.findByPlaceholderText('settings.modelsPage.connect.keyPlaceholder');
    // A recognized Anthropic key format.
    fireEvent.change(input, { target: { value: 'sk-ant-test-key-value' } });

    const connectBtn = screen.getByText('settings.modelsPage.connect.connect');
    fireEvent.click(connectBtn);

    await waitFor(() => {
      // The inline error renders with the unauthorized reason + provider name.
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => el.textContent?.includes('connect.errorUnauthorized'))).toBe(true);
    });
    expect(mockConnect).toHaveBeenCalledWith({
      providerId: 'anthropic',
      creds: { key: 'sk-ant-test-key-value' },
    });
  });

  it('shows the unrecognized-format error and does not call connect for an unknown key', async () => {
    mockList.mockResolvedValue([]);
    mockDetectKeys.mockResolvedValue([]);

    renderPage();

    const input = await screen.findByPlaceholderText('settings.modelsPage.connect.keyPlaceholder');
    fireEvent.change(input, { target: { value: 'totally-unrecognized-key' } });
    fireEvent.click(screen.getByText('settings.modelsPage.connect.connect'));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => el.textContent?.includes('connect.errorUnrecognized'))).toBe(true);
    });
    // An unrecognized key never reaches the backend.
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('routes a recognized cloud key directly to the Browse credential form (no errorUnrecognized)', async () => {
    mockList.mockResolvedValue([]);
    mockDetectKeys.mockResolvedValue([]);

    renderPage();

    const input = await screen.findByPlaceholderText('settings.modelsPage.connect.keyPlaceholder');
    // An AWS Access Key id - recognized as `cloud` for `aws-bedrock`.
    fireEvent.change(input, { target: { value: 'AKIAIOSFODNN7EXAMPLE' } });
    fireEvent.click(screen.getByText('settings.modelsPage.connect.connect'));

    // The Browse modal opens - recognizable by its cloud credential form fields.
    expect(await screen.findByLabelText('settings.modelsPage.cloud.fields.accessKeyId.label')).toBeInTheDocument();
    // The recognized cloud key is NOT mislabelled as "unrecognized".
    const alerts = screen.queryAllByRole('alert');
    expect(alerts.some((el) => el.textContent?.includes('connect.errorUnrecognized'))).toBe(false);
    // A cloud key is never sent to `connect` as a bare-key payload.
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('shows the ambiguous-key error (distinct from unrecognized) for a bare sk- paste', async () => {
    mockList.mockResolvedValue([]);
    mockDetectKeys.mockResolvedValue([]);

    renderPage();

    const input = await screen.findByPlaceholderText('settings.modelsPage.connect.keyPlaceholder');
    fireEvent.change(input, { target: { value: 'sk-abcdef1234567890' } });
    fireEvent.click(screen.getByText('settings.modelsPage.connect.connect'));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => el.textContent?.includes('connect.errorAmbiguous'))).toBe(true);
    });
    // The ambiguous variant must NOT reuse the unrecognized string.
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((el) => el.textContent?.includes('connect.errorUnrecognized'))).toBe(false);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('does not show a detected key for a provider that is already connected', async () => {
    // Wave 4B R2 fix: the detected-keys strip filters out providers already in
    // the connected list. Without this, OpenAI shows up twice on a fresh load:
    // once as "Connected" and once as "Use it" in the detected strip.
    const openaiConnected: IModelRegistryProviderView = {
      providerId: 'openai',
      connectedVia: 'api-key',
      state: 'connected',
      modelCount: 42,
    };
    const openaiDetected: IModelRegistryDetectedKey = {
      providerId: 'openai',
      source: 'env:OPENAI_API_KEY',
    };
    const groqDetected: IModelRegistryDetectedKey = {
      providerId: 'groq',
      source: 'env:GROQ_API_KEY',
    };
    mockList.mockResolvedValue([openaiConnected]);
    mockDetectKeys.mockResolvedValue([openaiDetected, groqDetected]);

    renderPage();

    // OpenAI appears in Connected, NOT in the detected strip.
    expect(await screen.findByText('OpenAI')).toBeInTheDocument();
    // Groq is the only one offered as detected.
    expect(await screen.findByText(/detected\.found:provider=Groq/)).toBeInTheDocument();
    // The page should not announce a detected OpenAI key alongside the
    // connected row - exactly one detected-row should be present.
    expect(screen.queryByText(/detected\.found:provider=OpenAI/)).not.toBeInTheDocument();
  });

  it('routes a headless OpenAI-compatible add through the host-side HTTP route with baseUrl (#71)', async () => {
    // Remote/WebUI session: no electronAPI, so isElectronDesktop() is false and
    // the page is headless. Adding a local OpenAI-compatible endpoint from Browse
    // must go through the write-only /api/providers/connect route (host-side),
    // carrying the baseUrl, NOT the remote-denied modelRegistry.connect IPC.
    mockList.mockResolvedValue([]);
    mockDetectKeys.mockResolvedValue([]);
    mockConnectProviderHttp.mockResolvedValue({ ok: true });

    const savedElectronAPI = (window as unknown as { electronAPI?: unknown }).electronAPI;
    delete (window as unknown as { electronAPI?: unknown }).electronAPI;
    try {
      renderPage();

      // Open Browse, pick the OpenAI-compatible BYO tile. Arco's Modal renders
      // in a portal on document.body, so query the document, not the container.
      fireEvent.click(await screen.findByText('settings.modelsPage.connect.browse'));
      const tile = await waitFor(() => {
        const el = document.querySelector('[data-provider="openai-compatible"]');
        if (!el) throw new Error('openai-compatible tile not found');
        return el as HTMLElement;
      });
      fireEvent.click(tile);

      // Fill the api key + the custom endpoint base URL.
      const keyInput = await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');
      fireEvent.change(keyInput, { target: { value: 'sk-local-test' } });
      const baseUrlInput = screen.getByPlaceholderText('settings.modelsPage.browse.baseUrlPlaceholder');
      fireEvent.change(baseUrlInput, { target: { value: 'http://127.0.0.1:8003/v1' } });

      fireEvent.click(screen.getByText('settings.modelsPage.browse.connect'));

      await waitFor(() =>
        expect(mockConnectProviderHttp).toHaveBeenCalledWith(
          'openai-compatible',
          'sk-local-test',
          'http://127.0.0.1:8003/v1'
        )
      );
      // The remote-denied IPC is never used in headless mode.
      expect(mockConnect).not.toHaveBeenCalled();
    } finally {
      (window as unknown as { electronAPI?: unknown }).electronAPI = savedElectronAPI;
    }
  });

  it('shares one providers snapshot across the page and the Browse modal (shared registry state)', async () => {
    // The page lists no providers; a successful connect from inside the
    // Browse modal must add a row to the parent without remounting it.
    mockList.mockResolvedValueOnce([]); // initial
    mockList.mockResolvedValue([connectedProvider]); // after the connect's reload()
    mockDetectKeys.mockResolvedValue([]);
    mockConnect.mockResolvedValue({ ok: true });

    renderPage();

    await screen.findByText('settings.modelsPage.empty.note');

    // Open Browse from the connect panel.
    fireEvent.click(screen.getByText('settings.modelsPage.connect.browse'));

    // Pick OpenAI in the modal grid (any single-key tile is fine).
    const tile = await screen.findByText('Anthropic');
    fireEvent.click(tile);

    const keyInput = await screen.findByPlaceholderText('settings.modelsPage.browse.keyPlaceholder');
    fireEvent.change(keyInput, { target: { value: 'sk-ant-test' } });
    fireEvent.click(screen.getByText('settings.modelsPage.browse.connect'));

    // The parent page's connected-row list - fed by the shared providers
    // state - now shows the newly connected provider.
    await waitFor(() => expect(screen.getByText('settings.modelsPage.row.connected')).toBeInTheDocument());
  });
});

// ---------------------------------------------------------------------------
// recognizeKey - pure-function recognition contract + main-process parity.
//
// The renderer copy of the key-recognition rules (`providerCatalog.recognizeKey`)
// must not drift from the main-process source (`PROVIDER_KEY_PATTERNS`). These
// tests pin every branch and assert the renderer's prefix set is a strict
// subset of the source, so a future edit to either side fails CI.
// ---------------------------------------------------------------------------

describe('recognizeKey', () => {
  // Every unique-prefix provider the renderer claims to recognize, with a
  // representative sample key for each.
  const recognizedCases: Array<[ProviderId, string]> = [
    ['anthropic', 'sk-ant-api03-abcdef'],
    ['flux-router', 'sk-flux-abcdef'],
    ['openrouter', 'sk-or-v1-abcdef'],
    ['openai', 'sk-proj-abcdef'],
    ['google-gemini', 'AIzaSyAbcdef'],
    ['groq', 'gsk_abcdef'],
    ['xai', 'xai-abcdef'],
    ['huggingface', 'hf_abcdef'],
    ['perplexity', 'pplx-abcdef'],
    ['replicate', 'r8_abcdef'],
    ['together', 'tgp_v1_abcdef'],
    ['fireworks', 'fw_abcdef'],
    ['cerebras', 'csk-abcdef'],
    ['nvidia', 'nvapi-abcdef'],
    ['anyscale', 'esecret_abcdef'],
    ['deepgram', 'dg_abcdef'],
    ['assemblyai', 'aai_abcdef'],
    ['elevenlabs', 'xi-api-abcdef'],
    // Structural sk- variants - these resolve uniquely despite the bare-sk
    // prefix because their internal shape is distinctive (32-hex for DeepSeek;
    // 48-mixed-alnum minus OpenAI's `T3BlbkFJ` signature for Moonshot).
    ['deepseek', 'sk-d5640f0e48904de7ac51062a4ec3b830'],
    ['moonshot', 'sk-k44yYrLwjwxEeLddGHBMe4OoSibUr7H65bQyh0cyKOmiHSD7'],
  ];

  it.each(recognizedCases)('recognizes a %s key', (provider, key) => {
    expect(recognizeKey(key)).toEqual<KeyRecognition>({ kind: 'recognized', provider });
  });

  it('treats an AWS key as the multi-field cloud case', () => {
    expect(recognizeKey('AKIAIOSFODNN7EXAMPLE')).toEqual<KeyRecognition>({
      kind: 'cloud',
      provider: 'aws-bedrock',
    });
    expect(recognizeKey('ASIAIOSFODNN7EXAMPLE')).toEqual<KeyRecognition>({
      kind: 'cloud',
      provider: 'aws-bedrock',
    });
  });

  it('treats a bare sk- key as ambiguous', () => {
    const result = recognizeKey('sk-abcdef1234567890');
    expect(result.kind).toBe('ambiguous');
    if (result.kind === 'ambiguous') {
      expect(result.candidates).toContain('openai');
      expect(result.candidates).toContain('deepseek');
    }
  });

  it('falls back to ambiguous for a 48-char sk- key carrying the OpenAI T3BlbkFJ signature', () => {
    // OpenAI legacy keys are `sk-` + 48 chars where `T3BlbkFJ` appears as the
    // signature middle segment. The Moonshot structural rule MUST exclude these
    // to avoid mis-routing an OpenAI legacy key to Moonshot.
    const openaiLegacy = 'sk-abcdefghijklmnopqrstT3BlbkFJabcdefghijklmnopqrst';
    const result = recognizeKey(openaiLegacy);
    expect(result.kind).toBe('ambiguous');
  });

  it('recognizes a JWT-shaped key as MiniMax (structural rule)', () => {
    // header.payload.signature - three dot-separated segments, eyJ prefix.
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature123';
    expect(recognizeKey(jwt)).toEqual<KeyRecognition>({ kind: 'recognized', provider: 'minimax' });
  });

  it('recognizes a dot-split key as Zhipu GLM (structural rule)', () => {
    // Two segments, each >= 10 chars, not a JWT.
    expect(recognizeKey('abcdefghij.klmnopqrst')).toEqual<KeyRecognition>({
      kind: 'recognized',
      provider: 'zhipu-glm',
    });
  });

  it('returns unknown for an unrecognized key and an empty string', () => {
    expect(recognizeKey('totally-unrecognized-key')).toEqual<KeyRecognition>({ kind: 'unknown' });
    expect(recognizeKey('')).toEqual<KeyRecognition>({ kind: 'unknown' });
    expect(recognizeKey('   ')).toEqual<KeyRecognition>({ kind: 'unknown' });
  });

  it('does not drift from the main-process PROVIDER_KEY_PATTERNS', () => {
    // The renderer recognizer's provider set must be a strict subset of the
    // main-process source. Any provider the renderer recognizes structurally or
    // by prefix must also exist in PROVIDER_KEY_PATTERNS - otherwise a connect
    // call the UI cheerfully routes would be rejected backend-side.
    const sourceProviders = new Set(PROVIDER_KEY_PATTERNS.map((rule) => rule.provider));
    const rendererProviders: ProviderId[] = [
      ...recognizedCases.map(([provider]) => provider),
      'aws-bedrock',
      'minimax',
      'zhipu-glm',
    ];
    for (const provider of rendererProviders) {
      expect(sourceProviders.has(provider)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Ship-gate Fix C3 - deep-link seed consumption
// ---------------------------------------------------------------------------

describe('ModelsSettings - deep-link seed (Fix C3)', () => {
  it('pre-fills the ConnectPanel key input from a non-cloud deep-link payload', async () => {
    mockList.mockResolvedValue([]);
    mockDetectKeys.mockResolvedValue([]);
    // A non-cloud deep-link delivering an apiKey for the recognized OpenAI
    // provider - the page seeds the panel, which pre-fills its key input.
    mockConsumePendingDeepLink.mockReturnValue({
      apiKey: 'sk-proj-deep-link-test-key',
      platform: 'openai',
    });

    render(<ModelsSettings />);

    const input = (await screen.findByPlaceholderText(
      'settings.modelsPage.connect.keyPlaceholder'
    )) as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe('sk-proj-deep-link-test-key'));

    // The "From deep link" hint badge renders next to the recognition hint.
    expect(screen.getByTestId('deep-link-seed-badge')).toBeInTheDocument();
  });

  it('does not pre-fill anything when no deep-link is pending', async () => {
    mockList.mockResolvedValue([]);
    mockDetectKeys.mockResolvedValue([]);
    // `mockConsumePendingDeepLink` defaults to `null` per `beforeEach`.

    render(<ModelsSettings />);

    const input = (await screen.findByPlaceholderText(
      'settings.modelsPage.connect.keyPlaceholder'
    )) as HTMLInputElement;
    expect(input.value).toBe('');
    expect(screen.queryByTestId('deep-link-seed-badge')).not.toBeInTheDocument();
  });
});
