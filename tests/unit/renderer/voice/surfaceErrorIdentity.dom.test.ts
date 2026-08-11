/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { useCallback, useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { VoiceSurfaceError } from '@/renderer/hooks/voice/useVoiceConversationSession';

/**
 * WHAT THIS FILE PROVES: that a refusal carrying a monotonic `seq` produces a
 * NEW render when the same reason is set twice, and that the plain-string shape
 * it replaces does not.
 *
 * Both shapes are exercised side by side in one test, because the claim is a
 * COMPARISON: "the object repaints" is only meaningful next to "the string does
 * not". The string arm is the negative control - if it ever starts repainting,
 * React's equality changed and this whole fix is moot, and the test says so.
 *
 * WHAT IT CANNOT PROVE: that the real hook's ~18 `setSurfaceError` call sites
 * are all reachable, or that anything appeared on screen. It proves the state
 * shape, which is the thing that was broken.
 */

/** The shape that shipped: a plain string. Byte-identical writes are no-ops. */
const useStringSurfaceError = () => {
  const [error, setError] = useState<string | null>(null);
  const renders = useRef(0);
  renders.current += 1;
  return { error, setError, renders: renders.current };
};

/** The shape under test, transcribed from `useVoiceConversationSession`. */
const useSeqSurfaceError = () => {
  const [error, setErrorState] = useState<VoiceSurfaceError | null>(null);
  const seqRef = useRef(0);
  const renders = useRef(0);
  renders.current += 1;
  const setError = useCallback((message: string | null) => {
    if (message === null) {
      setErrorState(null);
      return;
    }
    seqRef.current += 1;
    setErrorState({ message, seq: seqRef.current });
  }, []);
  return { error, setError, renders: renders.current };
};

const REFUSAL = 'The microphone is muted. Unmute it before starting a voice turn.';

describe('two taps with the same reason produce two distinct renders', () => {
  it('a plain string does NOT repaint - the negative control', () => {
    const { result } = renderHook(() => useStringSurfaceError());
    const before = result.current.renders;

    act(() => result.current.setError(REFUSAL));
    const afterFirst = result.current.renders;
    expect(afterFirst).toBeGreaterThan(before);

    // The second identical refusal. Object.is says nothing changed.
    act(() => result.current.setError(REFUSAL));
    expect(result.current.renders).toBe(afterFirst);
  });

  it('a seq-bearing object DOES repaint', () => {
    const { result } = renderHook(() => useSeqSurfaceError());

    act(() => result.current.setError(REFUSAL));
    const afterFirst = result.current.renders;
    const firstValue = result.current.error;

    act(() => result.current.setError(REFUSAL));

    expect(result.current.renders).toBeGreaterThan(afterFirst);
    expect(result.current.error).not.toBe(firstValue);
    expect(result.current.error?.message).toBe(REFUSAL);
    expect(result.current.error?.seq).toBe((firstValue?.seq ?? 0) + 1);
  });

  it('seq is monotonic across different reasons and survives a clear', () => {
    const { result } = renderHook(() => useSeqSurfaceError());

    act(() => result.current.setError('first'));
    act(() => result.current.setError('second'));
    act(() => result.current.setError('second'));
    expect(result.current.error?.seq).toBe(3);

    act(() => result.current.setError(null));
    expect(result.current.error).toBeNull();

    act(() => result.current.setError('second'));
    expect(result.current.error?.seq).toBe(4);
  });
});
