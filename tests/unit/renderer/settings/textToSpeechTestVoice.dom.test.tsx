/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';

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
 * `t` resolves against the REAL en-US bundle, so a key that does not exist
 * falls through to its `defaultValue` and the assertions below can tell the two
 * apart. A blanket `defaultValue ?? key` mock cannot.
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

import { TextToSpeechSettingsSection } from '@/renderer/components/settings/SettingsModal/contents/ToolsModalContent';

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

const HOSTED_CONFIG: TextToSpeechConfig = {
  enabled: true,
  provider: 'openai',
  voice: 'marin',
  speed: 1,
  autoReadResponses: false,
  model: 'gpt-4o-mini-tts',
};

const renderSection = (config: TextToSpeechConfig = HOSTED_CONFIG) => {
  const onChange = vi.fn();
  render(<TextToSpeechSettingsSection config={config} onChange={onChange} />);
  return { onChange };
};

const clickTestVoice = async () => {
  const button = await screen.findByRole('button', { name: 'Test voice' });
  button.click();
};

describe('Test voice — hosted consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installMatchMedia();
    MockAudio.instances.splice(0);
    vi.stubGlobal('Audio', MockAudio);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    storage.get.mockImplementation(async () => undefined);
    speak.mockResolvedValue({ ok: true, data: [82, 73, 70, 70], mimeType: 'audio/wav' });
  });

  it('asks for consent instead of synthesizing when the hosted provider is unconsented', async () => {
    renderSection();
    await screen.findByTestId('tts-consent-pending');
    await clickTestVoice();

    // The disclosure, not a synthesis call that main will refuse.
    await screen.findByText(/processes your audio and\/or text/);
    expect(speak).not.toHaveBeenCalled();
  });

  it('speaks once the user accepts the disclosure', async () => {
    renderSection();
    await screen.findByTestId('tts-consent-pending');
    await clickTestVoice();

    const accept = await screen.findByTestId('voice-consent-accept');
    accept.click();

    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(storage.set).toHaveBeenCalledWith('tools.voiceHostedConsent', expect.anything());
    await waitFor(() => expect(MockAudio.instances[0]?.played).toBe(1));
  });

  it('says something human, not a code, when the user declines', async () => {
    renderSection();
    await screen.findByTestId('tts-consent-pending');
    await clickTestVoice();

    const cancel = await screen.findByTestId('voice-consent-cancel');
    cancel.click();

    await waitFor(() => expect(messageError).toHaveBeenCalled());
    const shown = String(messageError.mock.calls[0][0]);
    expect(shown).not.toMatch(/TTS_|_REQUIRED|[A-Z]{3,}_[A-Z]/);
    expect(shown.length).toBeGreaterThan(20);
    expect(speak).not.toHaveBeenCalled();
  });

  it('control: a local provider speaks with no disclosure at all', async () => {
    renderSection({ ...HOSTED_CONFIG, provider: 'system-native', voice: 'default', model: undefined });
    await clickTestVoice();

    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/processes your audio and\/or text/)).toBeNull();
  });

  it('control: an already-consented hosted provider speaks with no disclosure', async () => {
    storage.get.mockImplementation(async (key: string) =>
      key === 'tools.voiceHostedConsent' ? { version: 1, acceptedProviders: ['openai'], updatedAt: 1 } : undefined
    );
    renderSection();
    await waitFor(() => expect(storage.get).toHaveBeenCalledWith('tools.voiceHostedConsent'));
    await clickTestVoice();

    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/processes your audio and\/or text/)).toBeNull();
  });
});

describe('Auto-read — hosted consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installMatchMedia();
    storage.get.mockImplementation(async () => undefined);
  });

  const autoReadSwitch = () => screen.findByTestId('tts-auto-read-switch');

  /** `onChange` takes an updater, so the decision is in what it produces. */
  const appliedTo = (onChange: ReturnType<typeof vi.fn>, current: TextToSpeechConfig) => {
    const last = onChange.mock.calls.at(-1);
    expect(last).toBeDefined();
    return (last as [(c: TextToSpeechConfig) => TextToSpeechConfig])[0](current);
  };

  it('asks for the disclosure before turning on for a hosted provider', async () => {
    const { onChange } = renderSection();
    await screen.findByTestId('tts-consent-pending');
    (await autoReadSwitch()).click();

    await screen.findByText(/processes your audio and\/or text/);
    // Nothing is persisted until the user answers.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('turns on once the user accepts', async () => {
    const { onChange } = renderSection();
    await screen.findByTestId('tts-consent-pending');
    (await autoReadSwitch()).click();
    (await screen.findByTestId('voice-consent-accept')).click();

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(appliedTo(onChange, HOSTED_CONFIG).autoReadResponses).toBe(true);
  });

  it('stays off when the user declines', async () => {
    const { onChange } = renderSection();
    await screen.findByTestId('tts-consent-pending');
    (await autoReadSwitch()).click();
    const cancel = await screen.findByTestId('voice-consent-cancel');
    expect(cancel).toBeVisible();
    cancel.click();

    // Arco hides the modal rather than unmounting it, so visibility - not
    // presence - is what says the promise actually settled.
    await waitFor(() => expect(cancel).not.toBeVisible());
    expect(onChange).not.toHaveBeenCalled();
    expect((await autoReadSwitch()).getAttribute('aria-checked')).toBe('false');
  });

  it('control: turning it OFF never asks for a disclosure', async () => {
    const { onChange } = renderSection({ ...HOSTED_CONFIG, autoReadResponses: true });
    await screen.findByTestId('tts-consent-pending');
    (await autoReadSwitch()).click();

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(appliedTo(onChange, { ...HOSTED_CONFIG, autoReadResponses: true }).autoReadResponses).toBe(false);
    expect(screen.queryByText(/processes your audio and\/or text/)).toBeNull();
  });

  it('control: a local provider turns on with no disclosure at all', async () => {
    const local: TextToSpeechConfig = { ...HOSTED_CONFIG, provider: 'system-native', voice: 'default' };
    const { onChange } = renderSection(local);
    (await autoReadSwitch()).click();

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(appliedTo(onChange, local).autoReadResponses).toBe(true);
    expect(screen.queryByText(/processes your audio and\/or text/)).toBeNull();
  });
});

describe('Test voice — the spoken phrase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installMatchMedia();
    MockAudio.instances.splice(0);
    vi.stubGlobal('Audio', MockAudio);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    storage.get.mockImplementation(async () => undefined);
    speak.mockResolvedValue({ ok: true, data: [82, 73, 70, 70], mimeType: 'audio/wav' });
  });

  it('greets the user from a real locale key, not a hardcoded English fallback', async () => {
    renderSection({ ...HOSTED_CONFIG, provider: 'system-native', voice: 'default', model: undefined });
    await clickTestVoice();

    await waitFor(() => expect(speak).toHaveBeenCalledWith({ text: "Hi, I'm Wayland. How are you?" }));
  });
});
