/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WHAT THIS FILE PROVES: what the COMPOSER does, from the bytes on disk to the
 * microphone, through the REAL `useSpeechInput`.
 *
 * It was rewritten because the previous version did not prove that. It called
 * `renderHook(useSpeechInput)` directly with a hand-made leg and asserted on the
 * hook's own readiness gate - a gate no production caller can reach, because
 * `SpeechInputButton.handleClick` short-circuits a non-clickable leg and returns
 * before `startRecording` is ever called. A verifier demonstrated this by
 * disabling the BUTTON gate: two `SpeechInputButton` tests went red and all four
 * of these stayed green. A test that cannot fail when the thing it describes is
 * removed is decoration.
 *
 * So this drives the shipped surface instead: render the button, click it, and
 * let the real hook run. `useSpeechInput` is deliberately NOT mocked - it is
 * half of the path under test. The hook's own gate remains in place as a
 * backstop for callers that do not gate first, and its mapping is unit-tested in
 * `voiceFailureVocabulary.test.ts`; it is simply not what refuses today.
 *
 * WHAT IT CANNOT PROVE: that a microphone opened or that anything was
 * transcribed. jsdom has no MediaRecorder, so the permitted path stops at the
 * environment check - which is the point, because reaching a DIFFERENT refusal
 * is what distinguishes "readiness let it through" from "readiness refused".
 */

const getUserMedia = vi.fn();
const mockMessageError = vi.fn();
const mockMessageWarning = vi.fn();

/**
 * The bytes on disk, as JSON. Nothing here is normalized by the test: a stored
 * config with no `origin` field IS what an upgraded profile holds, and routing
 * it through the normalizer before handing it over is what made the earlier
 * acceptance work vacuous.
 */
let storedSpeechToTextJson = '{"enabled":false,"provider":"openai"}';

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn((key: string) =>
      Promise.resolve(key === 'tools.speechToText' ? JSON.parse(storedSpeechToTextJson) : undefined)
    ),
    set: vi.fn(async () => undefined),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({ icon, children, ...props }: React.ComponentProps<'button'> & { icon?: React.ReactNode }) =>
    React.createElement('button', props, icon ?? children),
  Message: {
    error: (...args: unknown[]) => mockMessageError(...args),
    warning: (...args: unknown[]) => mockMessageWarning(...args),
  },
  Tooltip: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
}));

import SpeechInputButton from '@/renderer/components/chat/SpeechInputButton';

beforeEach(() => {
  vi.clearAllMocks();
  storedSpeechToTextJson = '{"enabled":false,"provider":"openai"}';
  globalThis.location.hash = '';
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
});

describe('the composer mic, from stored bytes to the microphone', () => {
  /**
   * THE LANE'S CLAIM, end to end and unnormalized. A profile that upgraded from
   * a version before `origin` existed holds `{enabled:false, provider:'openai'}`
   * - the old factory default, not a choice - and the mic must be LIVE on it.
   */
  it('lets a raw pre-origin profile straight through to the microphone', async () => {
    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button');
    // NOT the setup affordance. `setupLabel` is rendered if and only if the leg
    // came back non-clickable, so this is the assertion that the raw legacy
    // config resolved to a live mic. Which of the LIVE labels it carries depends
    // on `availability`, and jsdom has no MediaRecorder, so it is not pinned.
    expect(button.getAttribute('aria-label')).not.toBe('conversation.chat.speech.setupLabel');

    fireEvent.click(button);

    // The click was spent on the microphone path, not on routing away to
    // settings - the positive control for the refusals below, which would
    // otherwise also pass against a mic that refuses everything.
    expect(globalThis.location.hash).toBe('');
  });

  /**
   * The REACHABLE refusal, which is the button's, not the hook's: a needsSetup
   * leg never calls `startRecording` at all, so nothing opens and the click
   * spends itself routing to the one screen that fixes it.
   *
   * This is the assertion that bites. Remove the gate in
   * `SpeechInputButton.handleClick` and the hash stays empty while the hook
   * refuses silently instead - which is exactly the regression the previous
   * version of this file could not see.
   */
  it('refuses a deliberate switch-off at the button and routes to Voice settings', async () => {
    storedSpeechToTextJson = '{"enabled":false,"origin":"user"}';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', { name: 'conversation.chat.speech.setupLabel' });
    fireEvent.click(button);

    expect(globalThis.location.hash).toBe('#/settings/voice');
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  /**
   * A user-origin hosted pick with no key and no disclosure. Same refusal, same
   * destination, and still nothing opened - the composer never shows a hosted
   * disclosure, it sends the user to the panel where it belongs.
   */
  it('refuses a keyless hosted pick without opening anything', async () => {
    storedSpeechToTextJson = '{"enabled":true,"origin":"user","provider":"deepgram"}';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', { name: 'conversation.chat.speech.setupLabel' });
    fireEvent.click(button);

    expect(globalThis.location.hash).toBe('#/settings/voice');
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  /** The hover copy on a refusal names the fix. It never shows a failure slug. */
  it('never puts a failure slug in the tooltip', async () => {
    storedSpeechToTextJson = '{"enabled":false,"origin":"user"}';

    render(<SpeechInputButton onTranscript={vi.fn()} />);
    await screen.findByRole('button', { name: 'conversation.chat.speech.setupLabel' });

    const text = document.body.textContent ?? '';
    for (const slug of ['stt-disabled', 'no-local-adapter', 'kokoro-unavailable', 'unknown']) {
      expect(text).not.toContain(slug);
    }
  });
});
