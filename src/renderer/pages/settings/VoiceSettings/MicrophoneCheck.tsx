/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ported from Flow's MicCheckSettings.svelte pattern:
 * - 4-second timed test → auto-stop → single grade
 * - 5 grade states: no-signal / listening / too-quiet / good / too-hot
 * - Bar width driven via direct DOM mutation in RAF, not React state
 *   per frame. State only flips on the grade transition. This is the
 *   anti-flicker trick - React re-renders ~5x per test instead of ~240x.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@arco-design/web-react';
import { Mic, Square } from 'lucide-react';
import WaylandSelect from '@/renderer/components/base/WaylandSelect';
import { ipcBridge } from '@/common';

type CheckState = 'idle' | 'requesting' | 'listening' | 'graded' | 'error';
type Grade = 'no-signal' | 'too-quiet' | 'good' | 'too-hot';

const TEST_DURATION_MS = 4000;

// Grade thresholds - peak amplitude over the test window, 0-1.
const PEAK_NO_SIGNAL = 0.02; // below this → mic isn't picking anything up
const PEAK_TOO_QUIET = 0.12; // below this → speak louder
const PEAK_TOO_HOT = 0.85; // above this → clipping / reduce gain

const DEFAULT_DEVICE_ID = '';

const MicrophoneCheck: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<CheckState>('idle');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(DEFAULT_DEVICE_ID);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const peakOverWindowRef = useRef(0);

  const refreshDevices = useCallback(async (): Promise<void> => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === 'audioinput'));
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    void refreshDevices();
    if (!navigator.mediaDevices?.addEventListener) return;
    const handler = (): void => {
      void refreshDevices();
    };
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return (): void => {
      navigator.mediaDevices.removeEventListener('devicechange', handler);
    };
  }, [refreshDevices]);

  const cleanup = useCallback((options: { resetBar?: boolean } = {}): void => {
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
    // Default: hold the bar at the peak so the user can see the level that
    // triggered the grade. Only reset to 0 when the next test starts or the
    // component unmounts. Callers that want to wipe the bar pass resetBar=true.
    if (options.resetBar && barRef.current) {
      barRef.current.style.width = '0%';
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const finishWithGrade = useCallback((): void => {
    const peak = peakOverWindowRef.current;
    let finalGrade: Grade;
    if (peak < PEAK_NO_SIGNAL) finalGrade = 'no-signal';
    else if (peak < PEAK_TOO_QUIET) finalGrade = 'too-quiet';
    else if (peak >= PEAK_TOO_HOT) finalGrade = 'too-hot';
    else finalGrade = 'good';
    cleanup();
    setGrade(finalGrade);
    setState('graded');
  }, [cleanup]);

  const handleStop = useCallback((): void => {
    // User-cancelled - finalize whatever we observed so far rather than just bailing.
    if (state === 'listening') {
      finishWithGrade();
    } else {
      cleanup({ resetBar: true });
      setState('idle');
      setGrade(null);
    }
  }, [cleanup, finishWithGrade, state]);

  const handleStart = useCallback(async (): Promise<void> => {
    setState('requesting');
    setGrade(null);
    setErrorMsg('');
    peakOverWindowRef.current = 0;
    if (barRef.current) barRef.current.style.width = '0%';

    // Proactively request the macOS mic TCC grant so a signed/hardened build
    // shows the OS prompt (and a prior denial is surfaced) instead of a silent
    // flat meter. No-op off macOS (reports 'unsupported'); best-effort so any
    // IPC failure falls through to getUserMedia's own error handling.
    try {
      const micStatus = await ipcBridge.mic.requestAccess.invoke();
      if (micStatus === 'denied' || micStatus === 'restricted') {
        cleanup();
        setState('error');
        setErrorMsg(
          t(
            'settings.voiceMicPermissionBlocked',
            'Microphone access blocked. Open System Settings → Privacy → Microphone and enable Wayland.'
          )
        );
        return;
      }
    } catch {
      // Best-effort: fall through to getUserMedia.
    }

    const constraints: MediaStreamConstraints = {
      audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
    };

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
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
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setErrorMsg(
          t('settings.voiceMicNotFound', 'Selected microphone is not available. Pick another input device.')
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
    // Electron + Chromium ship AudioContext in `suspended` state until the
    // app explicitly resumes. The button click that calls handleStart counts
    // as user activation, but the AudioContext was created AFTER the await
    // for getUserMedia returned, which can push it out of the activation
    // window. Resume defensively before wiring the analyser, or the analyser
    // returns silence (timeDomain stays at 0x80 = midpoint = bar never moves).
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Browser may refuse without user gesture - proceed; the test will
        // report no-signal which is the honest result.
      }
    }
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;

    // refreshDevices() before flipping state to 'listening' so the device
    // label population doesn't cause a re-render mid-test (which clobbers
    // the DOM-mutated bar width back to the JSX initial value).
    void refreshDevices();

    setState('listening');
    const timeBuffer = new Uint8Array(analyser.fftSize);

    const tick = (): void => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(timeBuffer);

      let instantaneousPeak = 0;
      for (let i = 0; i < timeBuffer.length; i++) {
        const deviation = Math.abs(timeBuffer[i] - 128);
        if (deviation > instantaneousPeak) instantaneousPeak = deviation;
      }
      const normalized = instantaneousPeak / 128; // 0..1

      if (normalized > peakOverWindowRef.current) {
        peakOverWindowRef.current = normalized;
      }

      // Drive the bar via direct DOM, not React state - eliminates the
      // per-frame re-render cascade that caused flicker in the prior
      // implementation. The CSS transition (0.08s linear) smooths the bar.
      if (barRef.current) {
        const pct = Math.min(normalized * 100, 100);
        barRef.current.style.width = `${pct}%`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    stopTimerRef.current = setTimeout(finishWithGrade, TEST_DURATION_MS);
  }, [cleanup, finishWithGrade, refreshDevices, selectedDeviceId, t]);

  const isTesting = state === 'requesting' || state === 'listening';

  const deviceOptionLabel = (d: MediaDeviceInfo, index: number): string => {
    if (d.label) return d.label;
    return t('settings.voiceMicDeviceFallback', { defaultValue: 'Microphone {{n}}', n: index + 1 });
  };

  // Status sentence per state - matches Flow's MicCheckSettings copy 1:1.
  const statusText: string =
    state === 'listening'
      ? t('settings.voiceMicListening', 'Listening - say something to check levels…')
      : state === 'requesting'
        ? t('settings.voiceMicRequesting', 'Requesting microphone access…')
        : state === 'error'
          ? errorMsg
          : state === 'graded' && grade
            ? grade === 'no-signal'
              ? t('settings.voiceMicGradeNoSignal', 'No audio detected. Check your mic connection.')
              : grade === 'too-quiet'
                ? t('settings.voiceMicGradeQuiet', 'Voice is quiet. Try speaking louder or moving closer.')
                : grade === 'good'
                  ? t('settings.voiceMicGradeGood', 'Sounds good!')
                  : t('settings.voiceMicGradeHot', 'Level is very high. Try moving back or reducing input gain.')
            : t('settings.voiceMicIdleHint', 'Speak to test your microphone…');

  // Theme exposes --success/--warning/--danger as hex values (not RGB
  // triples), so callers use them directly via var() instead of rgb(var()).
  // The -6 suffix variants don't exist on :root and used to resolve to an
  // empty string - that's what made the "Level is very high" copy render
  // as black-on-black for Sean.
  const statusColorClass: string =
    state === 'graded' && grade === 'good'
      ? 'text-[var(--success)]'
      : state === 'graded' && (grade === 'too-quiet' || grade === 'too-hot')
        ? 'text-[var(--warning)]'
        : state === 'graded' && grade === 'no-signal'
          ? 'text-[var(--danger)]'
          : state === 'error'
            ? 'text-[var(--danger)]'
            : 'text-t-secondary';

  // While listening the bar runs orange - Sean's note: a grey bar reads
  // as "not working." Brand orange signals the mic is actively sampling.
  // The bar only flips to a status color once the grade settles
  // (good=success, quiet/hot=warning, no-signal=danger).
  //
  // Use --brand directly (a hex value) instead of rgb(var(--primary-6)).
  // The latter syntax only renders when UnoCSS parses it as part of an
  // opacity-modifier expression (e.g. `bg-[rgb(var(--primary-6))]/12`);
  // the bare form silently fails to generate the rule and the bar shows
  // as a faint gray fallback. Confirmed live via Playwright probe.
  const barColorClass: string =
    state === 'listening'
      ? 'bg-[var(--brand)]'
      : state === 'graded' && grade === 'good'
        ? 'bg-[var(--success)]'
        : state === 'graded' && (grade === 'too-quiet' || grade === 'too-hot')
          ? 'bg-[var(--warning)]'
          : state === 'graded' && grade === 'no-signal'
            ? 'bg-[var(--danger)]'
            : 'bg-[var(--color-text-4)]';

  return (
    <div className='flex flex-col gap-12px'>
      <div className='flex items-center gap-12px flex-wrap'>
        <WaylandSelect
          size='small'
          value={selectedDeviceId}
          onChange={(value: string) => setSelectedDeviceId(value)}
          disabled={isTesting}
          style={{ minWidth: 240 }}
        >
          <WaylandSelect.Option value={DEFAULT_DEVICE_ID}>
            {t('settings.voiceMicDeviceDefault', 'System default microphone')}
          </WaylandSelect.Option>
          {devices.map((device, index) => (
            <WaylandSelect.Option key={device.deviceId} value={device.deviceId}>
              {deviceOptionLabel(device, index)}
            </WaylandSelect.Option>
          ))}
        </WaylandSelect>
        <Button
          size='small'
          icon={isTesting ? <Square size={12} /> : <Mic size={14} />}
          loading={state === 'requesting'}
          onClick={isTesting ? handleStop : () => void handleStart()}
        >
          {isTesting
            ? t('settings.voiceMicStop', 'Stop Test')
            : t('settings.voiceMicTest', 'Test Microphone')}
        </Button>
      </div>

      <div className='flex flex-col gap-6px'>
        <div className='h-8px rd-full bg-[var(--color-fill-2)] overflow-hidden'>
          <div ref={barRef} className={`h-full rd-full ${barColorClass} mic-meter-bar`} />
        </div>
        <p className={`text-12px m-0 ${statusColorClass}`}>{statusText}</p>
      </div>

      {/* Initial width 0 lives in CSS, NOT inline style - otherwise every
          React render replays { width: '0%' } and clobbers the RAF-driven
          width mutation. The DOM-mutated width persists across renders
          because React doesn't touch a property it never set. */}
      <style>{`
        .mic-meter-bar {
          width: 0%;
          transition: width 0.08s linear, background-color 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default MicrophoneCheck;
