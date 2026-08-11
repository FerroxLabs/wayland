/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * The Voice panel must not contradict itself about where the audio goes.
 *
 * Seen in the running app, on one screen, simultaneously: the provider dropdown
 * read "Whisper (Local)", and the line directly beneath it read "Currently
 * using OpenAI Whisper, because it is connected and no engine was chosen here"
 * followed by "This provider processes audio and text off your device". The
 * measured behaviour in that exact state was zero network requests and a fully
 * on-device transcription.
 *
 * That is the most damaging possible direction for a privacy claim to be wrong
 * in: the user is told their microphone audio is being uploaded to a third
 * party when it never leaves the machine.
 *
 * The cause is that the panel asked a DIFFERENT resolver than the one that
 * routes the audio. `resolveEffectiveSttProvider` predates the on-device-first
 * ladder and still ends in `return 'openai'`; the transcriber that actually
 * runs comes from `resolveVoiceLeg('in', ...)`, which sends a default-origin
 * profile to the bundled on-device engine no matter what is connected.
 *
 * The mirror case is pinned alongside it deliberately. The off-device warning
 * is load-bearing and the fix must not be "stop warning" - so a genuinely
 * hosted resolution still has to produce it.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SpeechToTextConfig } from '@/common/types/speech';

const modelRegistryList = vi.hoisted(() => vi.fn(async (): Promise<unknown[]> => []));
const storage = vi.hoisted(() => ({
  get: vi.fn(async (_key: string): Promise<unknown> => undefined),
  set: vi.fn(async () => undefined),
}));

vi.mock('@/common/config/storage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/common/config/storage')>()),
  ConfigStorage: {
    get: (...args: unknown[]) => storage.get(...(args as [string])),
    set: (...args: unknown[]) => storage.set(...(args as [string, unknown])),
    remove: vi.fn(async () => undefined),
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  voiceSynth: { speak: { invoke: vi.fn(async () => ({ ok: true, data: [], mimeType: 'audio/wav' })) } },
  voiceAsset: {
    exists: { invoke: vi.fn(async () => ({ installed: true })) },
    download: { invoke: vi.fn(async () => undefined) },
    cancel: { invoke: vi.fn(async () => undefined) },
    downloadProgress: { on: () => () => {} },
  },
  modelRegistry: { list: { invoke: (...args: unknown[]) => modelRegistryList(...(args as [])) } },
}));

/**
 * `t` resolves against the REAL en-US bundle so a key that does not exist falls
 * through to its `defaultValue`. That distinction matters here: the assertions
 * below are about shipped copy, and a blanket `defaultValue ?? key` mock would
 * pass for a string that no locale actually carries.
 */
vi.mock('react-i18next', async () => {
  const settings = (await import('@/renderer/services/i18n/locales/en-US/settings.json')).default as Record<
    string,
    string
  >;
  return {
    useTranslation: () => ({
      t: (key: string, second?: unknown, third?: unknown) => {
        const options = (typeof second === 'object' ? second : third) as
          | (Record<string, unknown> & { defaultValue?: string })
          | undefined;
        const fallback = typeof second === 'string' ? second : options?.defaultValue;
        const bare = key.startsWith('settings.') ? key.slice('settings.'.length) : key;
        const template = settings[bare] ?? fallback ?? key;
        return Object.entries(options ?? {}).reduce<string>(
          (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
          template
        );
      },
    }),
  };
});

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

import { SpeechToTextSettingsSection } from '@/renderer/components/settings/SettingsModal/contents/ToolsModalContent';
import { normalizeSpeechToTextConfig } from '@/common/voice/speechToTextConfig';

/** Arco's responsive grid subscribes to media queries jsdom does not implement. */
const installMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};

/** Exactly what a fresh profile holds: enabled, default origin, provider unset. */
const factoryConfig = (): SpeechToTextConfig => normalizeSpeechToTextConfig(undefined);

const renderSection = (config: SpeechToTextConfig) => {
  const onChange = vi.fn();
  render(<SpeechToTextSettingsSection config={config} onChange={onChange} />);
  return { onChange };
};

const connectedOpenAI = [{ providerId: 'openai', state: 'connected' }];

/** The off-device claim, however it is worded. */
const OFF_DEVICE = /off your device|leaves your device|processes audio/i;

beforeEach(() => {
  vi.clearAllMocks();
  installMatchMedia();
  storage.get.mockImplementation(async () => undefined);
  modelRegistryList.mockResolvedValue([]);
});

describe('Voice panel - the explanatory copy must match the transcriber that actually runs', () => {
  it('does not claim audio leaves the device when the on-device floor is what resolved', async () => {
    // The exact reported state: a factory profile WITH OpenAI connected.
    modelRegistryList.mockResolvedValue(connectedOpenAI);
    renderSection(factoryConfig());

    // Wait for the registry read to land, so this is asserting the settled
    // state rather than the frame before `openAIConnected` flips.
    await waitFor(() => expect(modelRegistryList).toHaveBeenCalled());
    const line = await screen.findByTestId('stt-effective-provider');

    // The panel must not tell the user their microphone audio is uploaded.
    expect(line.textContent ?? '').not.toMatch(OFF_DEVICE);
    expect(screen.queryByTestId('stt-consent-pending')).toBeNull();
    expect(document.body.textContent ?? '').not.toMatch(OFF_DEVICE);

    // And it must name the engine that is genuinely in the path.
    expect(line.textContent ?? '').toMatch(/Whisper \(Local\)/);
    expect(line.textContent ?? '').not.toMatch(/OpenAI/);
  });

  it('names the on-device engine even with nothing connected at all', async () => {
    renderSection(factoryConfig());

    await waitFor(() => expect(modelRegistryList).toHaveBeenCalled());
    const line = await screen.findByTestId('stt-effective-provider');
    expect(line.textContent ?? '').toMatch(/Whisper \(Local\)/);
    expect(line.textContent ?? '').not.toMatch(OFF_DEVICE);
  });

  /**
   * KNOWN POSITIVE. If this ever goes green by the warning disappearing
   * everywhere, the fix was "delete the warning" and the disclosure is gone.
   */
  it('KNOWN POSITIVE: a genuinely hosted resolution still warns that audio leaves the device', async () => {
    modelRegistryList.mockResolvedValue(connectedOpenAI);
    renderSection(
      normalizeSpeechToTextConfig({ enabled: true, origin: 'user', provider: 'openai' } as Partial<SpeechToTextConfig>)
    );

    await waitFor(() => expect(modelRegistryList).toHaveBeenCalled());
    const warning = await screen.findByTestId('stt-consent-pending');
    expect(warning.textContent ?? '').toMatch(OFF_DEVICE);

    const line = await screen.findByTestId('stt-effective-provider');
    expect(line.textContent ?? '').toMatch(/OpenAI/);
  });

  /**
   * KNOWN POSITIVE for the naming, which used to be a two-way ternary that
   * rendered everything-that-is-not-Flux as "OpenAI Whisper". Deepgram is the
   * case that silently mislabelled.
   */
  it('KNOWN POSITIVE: a hosted engine that is neither OpenAI nor Flux is named correctly', async () => {
    renderSection(
      normalizeSpeechToTextConfig({
        enabled: true,
        origin: 'user',
        provider: 'deepgram',
      } as Partial<SpeechToTextConfig>)
    );

    await waitFor(() => expect(modelRegistryList).toHaveBeenCalled());
    const line = await screen.findByTestId('stt-effective-provider');
    expect(line.textContent ?? '').toMatch(/Deepgram/);
    expect(line.textContent ?? '').not.toMatch(/OpenAI/);
  });
});
