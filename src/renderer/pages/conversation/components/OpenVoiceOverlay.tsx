/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import { Button } from '@arco-design/web-react';
import { PhoneOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OpenVoicePhase } from '@/renderer/hooks/voice/useOpenVoiceSession';

const BAR_COUNT = 7;

/** Presentational live "call mode" banner. Driven entirely by props so it is
 *  testable without Web Audio. The waveform is a simple row of bars whose
 *  heights are scaled from a single RMS `level` (0..1) — no audio analysis here. */
export const OpenVoiceOverlay: React.FC<{
  phase: OpenVoicePhase;
  level: number;
  silenceMs: number;
  /** Per-conversation sensitivity margin bias (RMS units). >0 = less sensitive
   * (noisier room); shown so the user can see the adaptive gate responding. */
  sensitivityBias?: number;
  onEnd: () => void;
}> = ({ phase, level, silenceMs, sensitivityBias = 0, onEnd }) => {
  const { t } = useTranslation();

  const phaseLabel = useMemo(() => {
    switch (phase) {
      case 'capturing':
        return t('voice.phaseCapturing', { defaultValue: 'Listening...' });
      case 'transcribing':
        return t('voice.phaseTranscribing', { defaultValue: 'Transcribing...' });
      case 'listening':
      default:
        return t('voice.phaseListening', { defaultValue: 'Waiting for you' });
    }
  }, [phase, t]);

  // Clamp level to [0,1] so a stray RMS frame never breaks the layout.
  const clamped = Math.max(0, Math.min(1, level));
  const waitsLabel = t('voice.waits', {
    defaultValue: 'Waits {{seconds}}s',
    seconds: (silenceMs / 1000).toFixed(1),
  });

  // Surface the noise gate so the user sees adaptation. Bias > a small epsilon
  // means we've widened the gate for a noisy room (auto or by their request).
  const sensitivityLabel =
    sensitivityBias > 0.02
      ? t('voice.gateNoisy', { defaultValue: 'Noise gate: high' })
      : sensitivityBias < -0.02
        ? t('voice.gateSensitive', { defaultValue: 'Noise gate: sensitive' })
        : t('voice.gateAuto', { defaultValue: 'Noise gate: auto' });

  return (
    <div
      role='status'
      aria-live='polite'
      data-testid='open-voice-overlay'
      className='flex items-center gap-12px px-16px py-10px rd-12px b-1 b-solid'
      style={{
        borderColor: 'rgb(var(--primary-5))',
        background: 'color-mix(in srgb, rgb(var(--primary-6)) 8%, var(--color-bg-1))',
        boxShadow: '0 0 0 1px rgb(var(--primary-5)), 0 0 18px color-mix(in srgb, rgb(var(--primary-6)) 35%, transparent)',
      }}
    >
      <div className='flex items-end gap-2px h-20px' aria-hidden='true'>
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          // Center bars react more strongly so the row reads as a waveform.
          const weight = 1 - Math.abs(i - (BAR_COUNT - 1) / 2) / BAR_COUNT;
          const height = Math.max(3, Math.round(3 + clamped * weight * 17));
          return (
            <span
              key={i}
              data-testid='open-voice-bar'
              className='w-3px rd-1px'
              style={{ height: `${height}px`, background: 'rgb(var(--primary-6))', transition: 'height 80ms linear' }}
            />
          );
        })}
      </div>
      <div className='flex flex-col min-w-0'>
        <span className='text-13px font-medium text-t-primary'>{phaseLabel}</span>
        <span className='text-12px text-t-secondary'>
          {waitsLabel} · {sensitivityLabel}
        </span>
      </div>
      <div className='flex-1' />
      <Button
        size='small'
        type='primary'
        status='danger'
        icon={<PhoneOff size={14} />}
        onClick={onEnd}
        aria-label={t('voice.endCall', { defaultValue: 'End voice call' })}
      >
        {t('voice.endCallShort', { defaultValue: 'End call' })}
      </Button>
    </div>
  );
};
