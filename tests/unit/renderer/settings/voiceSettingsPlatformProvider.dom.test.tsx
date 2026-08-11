/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * The Windows speech-out floor has to be REACHABLE from the screen a user
 * actually opens, and pressing a control must never take it away.
 *
 * These render the real Voice settings page - its own load, its own
 * normalization, its own Test voice handler - under each of the three user
 * agents the app ships on. Nothing here hand-builds the config: a test that
 * passes in a config it normalized itself proves only that the test can
 * normalize. macOS is the known-positive control throughout, because it is the
 * platform where the picker already worked, so a failure there means the
 * harness is wrong rather than the product.
 */

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TEXT_TO_SPEECH_PROVIDERS } from '@/common/types/ttsTypes';

const speak = vi.fn();
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
  voiceSynth: { speak: { invoke: (...args: unknown[]) => speak(...args) } },
  voiceAsset: {
    exists: { invoke: vi.fn(async () => ({ installed: false })) },
    download: { invoke: vi.fn(async () => undefined) },
    cancel: { invoke: vi.fn(async () => undefined) },
    downloadProgress: { on: () => () => {} },
  },
  modelRegistry: { list: { invoke: vi.fn(async () => []) } },
}));

/**
 * `t` resolves against the REAL en-US bundle so a missing key falls through to
 * its `defaultValue` and the label assertions can tell a real translation from
 * a fallback. A blanket `defaultValue ?? key` mock cannot.
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

const messageError = vi.fn();
vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return { ...actual, Message: { ...actual.Message, error: (...args: unknown[]) => messageError(...args) } };
});

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

/**
 * Settings chrome only: the shell drags in the command palette, the layout
 * context and the settings router, none of which decide a TTS provider. The
 * page under test, its normalization and its Test voice handler are all real.
 */
vi.mock('@renderer/pages/settings/components/SettingsPageShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import VoiceSettings from '@/renderer/pages/settings/VoiceSettings';

class MockAudio {
  static instances: MockAudio[] = [];
  played = 0;
  constructor(public src: string) {
    MockAudio.instances.push(this);
  }
  addEventListener() {}
  pause() {}
  async play() {
    this.played += 1;
  }
}

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

const USER_AGENTS = {
  win32: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36',
  darwin: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36',
  linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36',
} as const;

const originalUserAgent = navigator.userAgent;
const originalPlatform = navigator.platform;

const setUserAgent = (value: string) => {
  Object.defineProperty(navigator, 'userAgent', { value, configurable: true });
  // `rendererPlatform` prefers userAgentData/platform when present; jsdom
  // exposes neither meaningfully, so the user agent is the live signal.
  Object.defineProperty(navigator, 'platform', { value: '', configurable: true });
};

afterEach(() => {
  Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
  Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true });
});

beforeEach(() => {
  vi.clearAllMocks();
  installMatchMedia();
  MockAudio.instances.splice(0);
  vi.stubGlobal('Audio', MockAudio);
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  // A profile that has never opened Voice settings: nothing stored, anywhere.
  storage.get.mockImplementation(async () => undefined);
  speak.mockResolvedValue({ ok: true, data: [82, 73, 70, 70], mimeType: 'audio/wav' });
});

/** Renders the real page and waits for its own config load to settle. */
const renderVoiceSettings = async (platform: keyof typeof USER_AGENTS) => {
  setUserAgent(USER_AGENTS[platform]);
  render(<VoiceSettings />);
  await waitFor(() => expect(storage.get).toHaveBeenCalledWith('tools.textToSpeech'));
  return await screen.findByTestId('tts-provider-select');
};

const pressTestVoice = async () => {
  const button = await screen.findByRole('button', { name: 'Test voice' });
  button.click();
};

/** The provider the page actually wrote to the user's profile, if it wrote one. */
const persistedProvider = (): string | undefined => {
  const write = storage.set.mock.calls.filter(([key]) => key === 'tools.textToSpeech').at(-1);
  return write ? (write[1] as { provider?: string }).provider : undefined;
};

describe('Voice settings: the provider a platform can actually run', () => {
  it('a fresh Windows profile resolves to the Windows synthesizer, and Test voice does not overwrite it', async () => {
    await renderVoiceSettings('win32');
    await pressTestVoice();

    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    // The whole defect in one assertion: pressing Test voice once used to write
    // the macOS provider into a Windows profile, permanently.
    expect(persistedProvider()).toBe('windows-native');
    expect(persistedProvider()).not.toBe('system-native');
  });

  it('KNOWN POSITIVE: a fresh macOS profile still resolves to and persists the macOS synthesizer', async () => {
    await renderVoiceSettings('darwin');
    await pressTestVoice();

    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(persistedProvider()).toBe('system-native');
  });

  it('never persists a local provider this operating system cannot run', async () => {
    for (const platform of ['win32', 'darwin', 'linux'] as const) {
      cleanup();
      vi.clearAllMocks();
      storage.get.mockImplementation(async () => undefined);
      speak.mockResolvedValue({ ok: true, data: [82], mimeType: 'audio/wav' });
      await renderVoiceSettings(platform);
      await pressTestVoice();
      if (platform === 'linux') {
        // Linux has no OS synthesizer at all, so there is nothing to test and
        // nothing worth writing. The panel says so instead.
        await waitFor(() => expect(messageError).toHaveBeenCalled());
        expect(speak).not.toHaveBeenCalled();
        expect(persistedProvider()).toBeUndefined();
        continue;
      }
      await waitFor(() => expect(speak).toHaveBeenCalled());
      expect(persistedProvider()).toBe(platform === 'win32' ? 'windows-native' : 'system-native');
    }
  });

  it('an unrelated control does not write the macOS leftover back into a Windows profile', async () => {
    storage.get.mockImplementation(async (key: string) =>
      key === 'tools.textToSpeech'
        ? { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false }
        : undefined
    );
    await renderVoiceSettings('win32');
    // Test voice is not the only writer. Every control on this panel persists
    // the whole object, so the leftover used to come back with the first
    // unrelated switch the user touched.
    (await screen.findByTestId('tts-auto-read-switch')).click();

    await waitFor(() => expect(persistedProvider()).toBeDefined());
    expect(persistedProvider()).toBe('windows-native');
    expect(speak).not.toHaveBeenCalled();
  });

  it('a Windows profile already carrying the macOS leftover is corrected, not honoured', async () => {
    // The profile a single pre-fix Test voice press produced.
    storage.get.mockImplementation(async (key: string) =>
      key === 'tools.textToSpeech'
        ? { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false }
        : undefined
    );
    const select = await renderVoiceSettings('win32');
    expect(select.textContent ?? '').toContain('Windows Voice');

    await pressTestVoice();
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(persistedProvider()).toBe('windows-native');
  });
});

describe('Voice settings: no raw enum reaches the screen', () => {
  /** Everything the picker renders, as a user would read it. */
  const pickerText = (select: HTMLElement) => select.textContent ?? '';

  it('Windows shows a translated label, not the "system-native" token', async () => {
    const select = await renderVoiceSettings('win32');
    expect(pickerText(select)).toContain('Windows Voice');
    for (const raw of TEXT_TO_SPEECH_PROVIDERS) {
      expect(pickerText(select)).not.toContain(raw);
    }
  });

  it('KNOWN POSITIVE: macOS shows its translated label, proving the label mechanism works', async () => {
    const select = await renderVoiceSettings('darwin');
    expect(pickerText(select)).toContain('System Native');
    for (const raw of TEXT_TO_SPEECH_PROVIDERS) {
      expect(pickerText(select)).not.toContain(raw);
    }
  });

  it('Linux shows a sentence, not the "system-native" token', async () => {
    const select = await renderVoiceSettings('linux');
    for (const raw of TEXT_TO_SPEECH_PROVIDERS) {
      expect(pickerText(select)).not.toContain(raw);
    }
    expect(pickerText(select)).toContain('Choose a voice provider');
    // And the panel still says out loud why, rather than showing an empty box.
    expect(document.body.textContent).toContain('This operating system has no built-in voice');
  });
});
