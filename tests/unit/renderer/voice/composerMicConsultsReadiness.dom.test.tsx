/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VoiceLeg } from '@/common/voice/voiceReadiness';
import { resolveVoiceLeg } from '@/common/voice/voiceReadiness';
import { useSpeechInput } from '@/renderer/hooks/system/useSpeechInput';

/**
 * WHAT THIS FILE PROVES: that the COMPOSER path refuses before it opens the
 * microphone, and refuses with the leg's named cause. Before this lane
 * `useSpeechInput` had zero references to readiness of any kind - a
 * known-positive control for that grep is in the lane report.
 *
 * WHAT IT CANNOT PROVE: that a microphone opened, that audio was captured, or
 * that anything was transcribed. jsdom has no getUserMedia and no MediaRecorder,
 * so the assertion is on the REFUSAL, which happens before either is touched.
 */

const getUserMedia = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
});

const legFor = (input: Parameters<typeof resolveVoiceLeg>[1]): VoiceLeg => resolveVoiceLeg('in', input);

describe('the composer mic consults the ladder before it opens anything', () => {
  it('refuses a needsSetup leg and never reaches getUserMedia', async () => {
    const leg = legFor({ sttConfig: { enabled: false, origin: 'user' } });
    expect(leg.status).toBe('needsSetup');

    const { result } = renderHook(() => useSpeechInput({ onTranscript: vi.fn(), leg }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.errorCode).toBe('not-configured');
  });

  it('refuses a warming leg rather than opening the mic into a 5-10 second wait', async () => {
    const leg = legFor({ sttConfig: { enabled: true, origin: 'default' }, localSttReady: false });
    expect(leg.status).toBe('warming');

    const { result } = renderHook(() => useSpeechInput({ onTranscript: vi.fn(), leg }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    // The SPECIFIC code, not merely "some error": jsdom also refuses for a
    // missing MediaRecorder, so a status-only assertion would pass against a
    // hook with no readiness gate at all.
    expect(result.current.errorCode).toBe('local-engine-failed');
  });

  it('refuses when no model is connected, because nothing could answer', async () => {
    const leg = legFor({ sttConfig: { enabled: true, origin: 'default' }, modelConnected: false });
    expect(leg.cause).toBe('no-model-connected');

    const { result } = renderHook(() => useSpeechInput({ onTranscript: vi.fn(), leg }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(result.current.errorCode).toBe('not-configured');
  });

  /**
   * The POSITIVE CONTROL. Without this the three refusals above would also pass
   * against a hook that refuses unconditionally, which would prove nothing.
   * A ready leg gets past the readiness gate and reaches the environment check.
   */
  it('lets a ready leg through the readiness gate', async () => {
    const leg = legFor({ sttConfig: { enabled: true, origin: 'default' }, localSttReady: true });
    expect(leg.clickable).toBe(true);

    const { result } = renderHook(() => useSpeechInput({ onTranscript: vi.fn(), leg }));

    await act(async () => {
      await result.current.startRecording();
    });

    // jsdom has no MediaRecorder, so it stops at the environment check rather
    // than at readiness - which is exactly the point: a different refusal,
    // reached only because the readiness gate let it past.
    expect(result.current.errorCode).toBe('recording-unsupported');
  });
});
