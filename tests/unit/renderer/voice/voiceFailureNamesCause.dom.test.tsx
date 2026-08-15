/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IConversationTurnCompletedEvent, IResponseMessage } from '@/common/adapter/ipcBridge';
import { openVoiceMode } from '@/renderer/pages/conversation/voice/voiceTurnBridge';

/**
 * The failure panel, from the user's side.
 *
 * Two defects the owner hit on his own machine, with screenshots: the callout
 * was headed "Nothing hidden" - a riddle above a failure - and its body sent him
 * to the Chat tab for a cause that had already been handed to voice mode on the
 * same error frame. Both are render-layer, so jsdom carries them.
 */

type SpeechInputOptions = {
  onTranscript: (text: string) => void;
  endpointing?: boolean;
  onSpeechEnd?: () => void;
  onNoSpeech?: () => void;
  onEndpointingUnavailable?: () => void;
  onBargeIn?: () => void;
};

let onTranscript: ((text: string) => void) | null = null;
const responseListeners: Array<(message: IResponseMessage) => void> = [];
const completionListeners: Array<(event: IConversationTurnCompletedEvent) => void> = [];
const confirmationListeners: Array<(event: { conversation_id: string; id: string }) => void> = [];
const mockStartRecording = vi.fn(async () => undefined);
const mockStopRecording = vi.fn();
const mockCancelRecording = vi.fn();
const mockSpeak = vi.fn(async (_params: unknown) => ({
  ok: true as const,
  data: [82, 73, 70, 70],
  mimeType: 'audio/wav',
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) => {
      if (key === 'tools.speechToText') return { enabled: true };
      if (key === 'tools.textToSpeech') {
        return { enabled: true, provider: 'system-native', voice: 'Samantha', speed: 1, autoReadResponses: false };
      }
      return undefined;
    }),
  },
}));

vi.mock('@/renderer/hooks/system/useSpeechInput', () => ({
  useSpeechInput: (options: SpeechInputOptions) => {
    onTranscript = options.onTranscript;
    return {
      availability: 'record',
      cancelRecording: mockCancelRecording,
      clearError: vi.fn(),
      errorCode: null,
      recordingLevels: [0.12, 0.25],
      startMonitoring: vi.fn(async () => undefined),
      startRecording: mockStartRecording,
      status: 'idle',
      stopMonitoring: vi.fn(),
      stopRecording: mockStopRecording,
    };
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  conversation: {
    stop: { invoke: vi.fn(async () => ({ success: true })) },
    responseStream: {
      on: (listener: (message: IResponseMessage) => void) => {
        responseListeners.push(listener);
        return () => {
          const index = responseListeners.indexOf(listener);
          if (index >= 0) responseListeners.splice(index, 1);
        };
      },
    },
    turnCompleted: {
      on: (listener: (event: IConversationTurnCompletedEvent) => void) => {
        completionListeners.push(listener);
        return () => {
          const index = completionListeners.indexOf(listener);
          if (index >= 0) completionListeners.splice(index, 1);
        };
      },
    },
    confirmation: {
      add: {
        on: (listener: (event: { conversation_id: string; id: string }) => void) => {
          confirmationListeners.push(listener);
          return () => {
            const index = confirmationListeners.indexOf(listener);
            if (index >= 0) confirmationListeners.splice(index, 1);
          };
        },
      },
    },
  },
  voiceSynth: { speak: { invoke: (...args: unknown[]) => mockSpeak(...args) } },
}));

vi.mock('@/renderer/utils/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/renderer/utils/platform')>()),
  isMacOS: () => true,
  rendererPlatform: () => 'darwin',
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useInRouterContext: () => true,
}));

import enUS from '@/renderer/services/i18n/locales/en-US/index';

/**
 * Resolves against the SHIPPING en-US bundle rather than the call site's
 * `defaultValue`. A key that never made it into the locale files would
 * otherwise pass here on its fallback and ship untranslatable.
 */
const readKey = (key: string): unknown =>
  key.split('.').reduce<unknown>(
    (node, segment) => {
      if (typeof node !== 'object' || node === null) return undefined;
      return (node as Record<string, unknown>)[segment];
    },
    enUS as Record<string, unknown>
  );

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const value = readKey(key);
      if (typeof value !== 'string') return typeof options?.defaultValue === 'string' ? options.defaultValue : key;
      return value.replace(/\{\{(\w+)\}\}/g, (whole, name: string) =>
        typeof options?.[name] === 'string' ? (options[name] as string) : whole
      );
    },
  }),
}));

import VoiceConversationMode from '@/renderer/pages/conversation/voice/VoiceConversationMode';
import { VoiceSessionProvider } from '@/renderer/pages/conversation/voice/VoiceSessionContext';

class MockAudio {
  src = '';
  addEventListener() {}
  pause() {}
  async play() {}
}

/** Exactly what the owner's machine put on the wire, log suffix and all. */
const PLAINTEXT_REFUSAL =
  'Agent failed to start: wcore refused to start: WARNING: [storage.credentials] backend = "plaintext" is ' +
  'configured. Secrets are written UNENCRYPTED to /Users/owner/.wayland/credentials.toml and can be read by any ' +
  'process running as you. Remove the setting to use the OS keyring or the encrypted vault instead. ' +
  '(logs: /Users/owner/Library/Logs/Wayland/main.log)';

const renderVoice = () =>
  render(
    <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland Core'>
      <VoiceConversationMode />
    </VoiceSessionProvider>
  );

/** Opens voice, speaks a turn, then fails it the way wcore fails a bootstrap. */
const failOneTurn = async (data: unknown) => {
  renderVoice();
  act(() => openVoiceMode('conversation-1'));
  await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
  fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
  fireEvent.click(screen.getByRole('button', { name: 'Stop and send voice turn' }));
  await act(async () => {
    onTranscript?.('Build the launch plan.');
  });
  await act(async () => {
    for (const listener of responseListeners) {
      listener({ type: 'error', data, msg_id: 'assistant-1', conversation_id: 'conversation-1' } as IResponseMessage);
    }
  });
  return screen.getByRole('alert');
};

describe('voice failure panel', () => {
  beforeEach(() => {
    responseListeners.splice(0);
    completionListeners.splice(0);
    confirmationListeners.splice(0);
    mockStartRecording.mockClear();
    mockStopRecording.mockClear();
    mockSpeak.mockClear();
    onTranscript = null;
    vi.useRealTimers();
    vi.stubGlobal('Audio', MockAudio);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:voice') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  it('heads the failure with what happened, not with the app describing its own posture', async () => {
    const alert = await failOneTurn(PLAINTEXT_REFUSAL);

    // The riddle. It was the literal heading above a failed turn.
    expect(screen.queryByText('Nothing hidden')).not.toBeInTheDocument();

    const heading = alert.querySelector('strong');
    expect(heading?.textContent).toBe('The turn failed');
  });

  it('names the cause inside the voice panel instead of pointing at another tab', async () => {
    const alert = await failOneTurn(PLAINTEXT_REFUSAL);

    // The human part, on the line the user reads first.
    const summary = alert.querySelector('span')?.textContent ?? '';
    expect(summary).toContain('wcore refused to start');
    expect(summary).toContain('backend = "plaintext" is configured');

    // The rest is expandable rather than truncated into nonsense.
    expect(within(alert).getByText('Show the full message')).toBeInTheDocument();
    const expanded = alert.querySelector('details p')?.textContent ?? '';
    expect(expanded).toContain('Remove the setting to use the OS keyring or the encrypted vault instead.');
    expect(expanded).toBe(PLAINTEXT_REFUSAL);

    // The old copy sent the user somewhere else for the cause. It must not be
    // the only thing the panel says any more.
    expect(within(alert).queryByText('The turn failed. Inspect Chat for the exact error and recovery options.')).toBe(
      null
    );
  });

  it('stays useful when the failure arrived with no cause attached', async () => {
    const alert = await failOneTurn(null);

    expect(alert.querySelector('strong')?.textContent).toBe('The turn failed');
    // Never the literal word this project banned from failure copy.
    expect(alert.textContent ?? '').not.toMatch(/unknown/i);
    expect(within(alert).getByText(/Chat has the full turn/)).toBeInTheDocument();
  });

  it('stops captioning the error state with a nudge that names nothing', async () => {
    await failOneTurn(PLAINTEXT_REFUSAL);

    expect(screen.queryByText('Voice needs attention')).not.toBeInTheDocument();
    expect(screen.getByText('Voice stopped')).toBeInTheDocument();
  });
});
