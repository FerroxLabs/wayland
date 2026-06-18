/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Form, Input, Button, Space } from '@arco-design/web-react';
import { Mic, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ConfigStorage } from '@/common/config/storage';
import { voiceSynth } from '@/common/adapter/ipcBridge';
import { playAudioClip } from '@/renderer/utils/voicePlayback';
import { transcribeAudioBlob } from '@/renderer/services/SpeechToTextService';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';

const RECORD_DURATION_MS = 2500;

type RecorderState = 'idle' | 'requesting' | 'recording' | 'transcribing';

/**
 * Name pronunciation field group for Voice settings.
 *
 * Shows the read-only display name, an editable `user.spokenName` respelling,
 * a Preview button that synthesizes the respelling through the current TTS
 * chain, and a Re-detect button that records the user saying their name,
 * transcribes it via STT, and offers the transcript as a candidate respelling
 * the user confirms (accept / edit) before it is persisted.
 */
export const PronunciationField: React.FC<{ displayName: string; ttsConfig: TextToSpeechConfig }> = ({
  displayName,
  ttsConfig,
}) => {
  const { t } = useTranslation();
  const [spoken, setSpoken] = useState('');
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [candidate, setCandidate] = useState<string | null>(null);
  const [error, setError] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void ConfigStorage.get('user.spokenName').then((s) => setSpoken((s as string) ?? ''));
  }, []);

  const cleanupCapture = useCallback((): void => {
    if (stopTimerRef.current != null) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
  }, []);

  useEffect(() => cleanupCapture, [cleanupCapture]);

  const persist = useCallback((value: string): void => {
    setSpoken(value);
    void ConfigStorage.set('user.spokenName', value).catch(() => {});
  }, []);

  const onChange = (value: string): void => {
    persist(value);
  };

  const preview = async (): Promise<void> => {
    const phrase = spoken.trim() || displayName;
    if (!phrase) return;
    const result = await voiceSynth.speak.invoke({ text: phrase, config: ttsConfig });
    if (result.ok && result.data) {
      await playAudioClip(new Uint8Array(result.data), result.mimeType ?? 'audio/wav');
    }
  };

  const startReDetect = async (): Promise<void> => {
    setError('');
    setCandidate(null);
    setRecorderState('requesting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      cleanupCapture();
      setRecorderState('idle');
      setError(
        err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'SecurityError')
          ? t(
              'voice.reDetectPermission',
              'Microphone access blocked. Enable it in System Settings → Privacy → Microphone.'
            )
          : t('voice.reDetectFailed', 'Could not record. Please try again.')
      );
      return;
    }

    streamRef.current = stream;
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.addEventListener('dataavailable', (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    });
    recorder.addEventListener('stop', () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      cleanupCapture();
      setRecorderState('transcribing');
      transcribeAudioBlob(blob)
        .then((result) => {
          const text = (result?.text ?? '').trim();
          if (text) {
            setCandidate(text);
          } else {
            setError(t('voice.reDetectEmpty', "Didn't catch that. Try saying your name again."));
          }
        })
        .catch(() => {
          setError(t('voice.reDetectFailed', 'Could not record. Please try again.'));
        })
        .finally(() => {
          setRecorderState('idle');
        });
    });

    recorder.start();
    setRecorderState('recording');
    stopTimerRef.current = setTimeout(() => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    }, RECORD_DURATION_MS);
  };

  const stopReDetect = (): void => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    } else {
      cleanupCapture();
      setRecorderState('idle');
    }
  };

  const acceptCandidate = (): void => {
    if (candidate != null) persist(candidate);
    setCandidate(null);
  };

  const dismissCandidate = (): void => {
    setCandidate(null);
  };

  const isRecording = recorderState === 'requesting' || recorderState === 'recording';
  const isBusy = isRecording || recorderState === 'transcribing';

  return (
    <Form layout='horizontal' labelAlign='left' className='space-y-12px wayland-stack-form-mobile'>
      <Form.Item label={t('voice.displayName', { defaultValue: 'Your name' })}>
        <Input value={displayName} disabled />
      </Form.Item>
      <Form.Item
        label={t('voice.pronunciation', { defaultValue: 'Name pronunciation' })}
        extra={t('voice.pronunciationHint', {
          defaultValue: 'How your name sounds, spelled out (e.g. "shiv-AWN"). Only used for speech.',
        })}
      >
        <div className='flex flex-col gap-8px'>
          <div className='flex items-center gap-8px'>
            <Input
              aria-label={t('voice.pronunciation', { defaultValue: 'Name pronunciation' })}
              value={spoken}
              placeholder={displayName}
              onChange={onChange}
              className='flex-1'
            />
            <Button size='small' onClick={() => void preview()}>
              {t('voice.preview', { defaultValue: 'Preview' })}
            </Button>
            <Button
              size='small'
              icon={isRecording ? <Square size={12} /> : <Mic size={14} />}
              loading={recorderState === 'requesting' || recorderState === 'transcribing'}
              onClick={isRecording ? stopReDetect : () => void startReDetect()}
            >
              {isRecording
                ? t('voice.reDetectStop', { defaultValue: 'Stop' })
                : t('voice.reDetect', { defaultValue: 'Re-detect' })}
            </Button>
          </div>
          {recorderState === 'recording' && (
            <p className='text-12px m-0 text-t-secondary'>
              {t('voice.reDetectListening', { defaultValue: 'Listening - say your name…' })}
            </p>
          )}
          {candidate != null && (
            <div className='flex items-center gap-8px'>
              <span className='text-13px text-t-secondary'>
                {t('voice.reDetectHeard', { defaultValue: 'Heard:' })}
              </span>
              <Input
                aria-label={t('voice.reDetectHeard', { defaultValue: 'Heard:' })}
                value={candidate}
                onChange={(value: string) => setCandidate(value)}
                className='flex-1'
              />
              <Space size={4}>
                <Button size='small' type='primary' onClick={acceptCandidate}>
                  {t('voice.reDetectUse', { defaultValue: 'Use this' })}
                </Button>
                <Button size='small' onClick={dismissCandidate}>
                  {t('voice.reDetectDiscard', { defaultValue: 'Discard' })}
                </Button>
              </Space>
            </div>
          )}
          {error && !isBusy && <p className='text-12px m-0 text-[var(--danger)]'>{error}</p>}
        </div>
      </Form.Item>
    </Form>
  );
};
