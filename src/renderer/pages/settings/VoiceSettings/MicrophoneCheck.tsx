/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@arco-design/web-react';
import { Mic } from 'lucide-react';

type CheckState = 'idle' | 'requesting' | 'live' | 'done' | 'error';

const TEST_DURATION_MS = 5000;
// Silence threshold: peak amplitude % under this for the full window = "muted".
const SILENCE_PEAK_PCT = 2;

/**
 * Microphone check — requests user media, plots a live amplitude bar for
 * 5 seconds, then reports success / silence / permission-denied. All streams
 * are released on cleanup.
 */
const MicrophoneCheck: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<CheckState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [level, setLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const peakRef = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (stopTimerRef.current != null) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Always release on unmount.
  useEffect(() => cleanup, [cleanup]);

  const handleStart = useCallback(async () => {
    setState('requesting');
    setErrorMsg('');
    setLevel(0);
    peakRef.current = 0;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      cleanup();
      setState('error');
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setErrorMsg(
          t(
            'settings.voiceMicPermissionBlocked',
            'Microphone access blocked. Open System Settings → Privacy → Microphone and enable Wayland.'
          )
        );
      } else {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
      return;
    }

    streamRef.current = stream;
    const ContextClass: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new ContextClass();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128; // 64 frequency bins
    source.connect(analyser);
    analyserRef.current = analyser;

    setState('live');
    const buffer = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(buffer);
      let peak = 0;
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] > peak) peak = buffer[i];
      }
      const pct = Math.round((peak / 255) * 100);
      setLevel(pct);
      if (pct > peakRef.current) peakRef.current = pct;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    stopTimerRef.current = setTimeout(() => {
      const silent = peakRef.current < SILENCE_PEAK_PCT;
      cleanup();
      if (silent) {
        setState('error');
        setErrorMsg(t('settings.voiceMicSilent', 'Mic appears muted. Check your input device.'));
      } else {
        setState('done');
      }
    }, TEST_DURATION_MS);
  }, [cleanup, t]);

  const buttonLabel =
    state === 'requesting'
      ? t('settings.voiceMicRequesting', 'Requesting access…')
      : state === 'live'
        ? t('settings.voiceMicListening', 'Listening…')
        : t('settings.voiceMicTest', 'Test microphone');

  return (
    <div className='flex flex-col gap-8px'>
      <div className='flex items-center gap-12px'>
        <Button
          type='outline'
          size='small'
          icon={<Mic size={14} />}
          loading={state === 'requesting'}
          disabled={state === 'requesting' || state === 'live'}
          onClick={handleStart}
        >
          {buttonLabel}
        </Button>
        {state === 'live' && (
          <div className='flex-1 h-8px rd-full bg-[var(--color-fill-2)] overflow-hidden'>
            <div
              className='h-full bg-[rgb(var(--primary-6))] transition-[width] duration-75'
              style={{ width: `${level}%` }}
            />
          </div>
        )}
      </div>
      {state === 'done' && (
        <span className='text-12px text-[rgb(var(--success-6))]'>
          {t('settings.voiceMicWorking', 'Microphone is working.')}
        </span>
      )}
      {state === 'error' && <span className='text-12px text-[rgb(var(--danger-6))]'>{errorMsg}</span>}
    </div>
  );
};

export default MicrophoneCheck;
