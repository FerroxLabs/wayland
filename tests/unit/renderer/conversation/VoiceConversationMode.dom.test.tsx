/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IConversationTurnCompletedEvent, IResponseMessage } from '@/common/adapter/ipcBridge';
import type { VoiceTurnSubmitDetail } from '@/renderer/pages/conversation/voice/voiceTurnBridge';
import { openVoiceMode, VOICE_TURN_SUBMIT_EVENT } from '@/renderer/pages/conversation/voice/voiceTurnBridge';

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
const mockStopConversation = vi.fn(async (_params: unknown) => ({ success: true }));
const mockNavigate = vi.fn();

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) => {
      if (key === 'tools.speechToText') return { enabled: true };
      if (key === 'tools.textToSpeech') {
        return {
          enabled: true,
          provider: 'system-native',
          voice: 'Samantha',
          speed: 1,
          autoReadResponses: false,
        };
      }
      return undefined;
    }),
  },
}));

vi.mock('@/renderer/hooks/system/useSpeechInput', () => ({
  useSpeechInput: ({ onTranscript: callback }: { onTranscript: (text: string) => void }) => {
    onTranscript = callback;
    return {
      availability: 'record',
      cancelRecording: mockCancelRecording,
      clearError: vi.fn(),
      errorCode: null,
      recordingLevels: [0.12, 0.25],
      startRecording: mockStartRecording,
      status: 'idle',
      stopRecording: mockStopRecording,
    };
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  conversation: {
    stop: { invoke: (...args: unknown[]) => mockStopConversation(...args) },
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
  voiceSynth: {
    speak: { invoke: (...args: unknown[]) => mockSpeak(...args) },
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import VoiceConversationMode from '@/renderer/pages/conversation/voice/VoiceConversationMode';

class MockAudio {
  src = '';
  private listeners = new Map<string, () => void>();

  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener);
  }

  pause() {}

  async play() {}
}

describe('VoiceConversationMode', () => {
  beforeEach(() => {
    responseListeners.splice(0);
    completionListeners.splice(0);
    confirmationListeners.splice(0);
    mockStartRecording.mockClear();
    mockStopRecording.mockClear();
    mockCancelRecording.mockClear();
    mockSpeak.mockClear();
    mockStopConversation.mockClear();
    mockNavigate.mockClear();
    onTranscript = null;
    vi.stubGlobal('Audio', MockAudio);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:voice') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  it('runs transcript and response through the same scoped conversation', async () => {
    const submitted: VoiceTurnSubmitDetail[] = [];
    window.addEventListener(VOICE_TURN_SUBMIT_EVENT, (event) => {
      submitted.push((event as CustomEvent<VoiceTurnSubmitDetail>).detail);
    });
    render(
      <VoiceConversationMode
        conversationId='conversation-1'
        conversationTitle='Book launch'
        actorLabel='Wayland Core'
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start Voice conversation' }));
    expect(await screen.findByRole('dialog', { name: 'Wayland voice conversation' })).toBeInTheDocument();
    expect(screen.getByText('Book launch')).toBeInTheDocument();
    expect(screen.getByText('Tap to speak')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
    expect(mockStartRecording).toHaveBeenCalledOnce();
    expect(screen.getByText('Listening')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop and send voice turn' }));
    expect(mockStopRecording).toHaveBeenCalledOnce();

    act(() => {
      onTranscript?.('Build the launch plan.');
    });
    expect(submitted).toHaveLength(1);
    expect(submitted[0]).toMatchObject({ conversationId: 'conversation-1', text: 'Build the launch plan.' });
    expect(screen.getByText('Thinking')).toBeInTheDocument();

    act(() => {
      for (const listener of responseListeners) {
        listener({
          type: 'content',
          data: 'The launch plan is ready.',
          msg_id: 'assistant-1',
          conversation_id: 'conversation-1',
        });
        listener({
          type: 'finish',
          data: null,
          msg_id: 'assistant-1',
          conversation_id: 'conversation-1',
        });
      }
    });

    await waitFor(() => expect(mockSpeak).toHaveBeenCalledWith({ text: 'The launch plan is ready.' }));
    expect(screen.getByText('Speaking')).toBeInTheDocument();
    expect(screen.getByText('The launch plan is ready.')).toBeInTheDocument();
  });

  it('opens from the scoped composer Voice control without affecting another conversation', async () => {
    render(<VoiceConversationMode conversationId='conversation-1' actorLabel='Wayland Core' />);

    act(() => openVoiceMode('conversation-2'));
    expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();

    act(() => openVoiceMode('conversation-1'));
    expect(await screen.findByRole('dialog', { name: 'Wayland voice conversation' })).toBeInTheDocument();
  });

  it('stops at a visual approval boundary and never offers spoken approval', async () => {
    render(<VoiceConversationMode conversationId='conversation-1' actorLabel='Wayland Core' />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Voice conversation' }));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop and send voice turn' }));
    act(() => onTranscript?.('Publish it.'));

    act(() => {
      for (const listener of confirmationListeners) {
        listener({ conversation_id: 'conversation-1', id: 'approval-1' });
      }
    });

    expect(screen.getByText('Needs your approval')).toBeInTheDocument();
    expect(screen.getByText(/Voice cannot approve it/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });

  it('cancels captured audio when returning to Chat instead of sending it', async () => {
    render(<VoiceConversationMode conversationId='conversation-1' actorLabel='Wayland Core' />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Voice conversation' }));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Return to Chat' }));

    expect(mockCancelRecording).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();
  });
});
