// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';

const store: Record<string, unknown> = {};
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (k: string) => store[k]),
    set: vi.fn(async (k: string, v: unknown) => {
      store[k] = v;
    }),
  },
}));
const { speak } = vi.hoisted(() => ({
  speak: vi.fn(async () => ({ ok: true, data: [82, 73, 70, 70], mimeType: 'audio/wav' })),
}));
vi.mock('@/common/adapter/ipcBridge', () => ({ voiceSynth: { speak: { invoke: speak } } }));
vi.mock('@/renderer/utils/voicePlayback', () => ({
  playAudioClip: vi.fn(async () => ({ ok: true })),
  stopVoicePlayback: vi.fn(),
}));
vi.mock('@/renderer/services/SpeechToTextService', () => ({ transcribeAudioBlob: vi.fn() }));

import { PronunciationField } from '@/renderer/pages/settings/VoiceSettings/PronunciationField';

// Arco's Form/Grid subscribes to a responsive observer that reads
// window.matchMedia, which jsdom does not implement. Stub it so the real
// Arco components mount.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.clearAllMocks();
});

describe('PronunciationField', () => {
  it('persists spokenName on change', async () => {
    const { getByLabelText } = render(
      <PronunciationField displayName='Siobhan' ttsConfig={{ chain: ['kokoro-local'], engines: {} } as never} />
    );
    fireEvent.change(getByLabelText(/pronunciation/i), { target: { value: 'shiv-AWN' } });
    await waitFor(() => expect(store['user.spokenName']).toBe('shiv-AWN'));
  });

  it('preview synthesizes the spoken name', async () => {
    const { getByLabelText, getByText } = render(
      <PronunciationField displayName='Siobhan' ttsConfig={{ chain: ['kokoro-local'], engines: {} } as never} />
    );
    fireEvent.change(getByLabelText(/pronunciation/i), { target: { value: 'shiv-AWN' } });
    fireEvent.click(getByText(/preview/i));
    await waitFor(() => expect(speak).toHaveBeenCalled());
    expect(speak.mock.calls[0][0].text).toBe('shiv-AWN');
  });
});
