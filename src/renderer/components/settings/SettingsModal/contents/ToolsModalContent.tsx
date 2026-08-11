/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { CheckCircle2, RotateCcw } from 'lucide-react';
import {
  ConfigStorage,
  type IConfigStorageRefer,
  type IMcpServer,
  BUILTIN_IMAGE_GEN_ID,
} from '@/common/config/storage';
import { FLUX_PROVIDER_ID } from '@/common/config/flux';
import {
  isSpeechToTextProvider,
  type SpeechToTextConfig,
  type SpeechToTextConfigOrigin,
  type SpeechToTextProvider,
} from '@/common/types/speech';
import { resolveEffectiveSttProvider } from '@/common/voice/sttProviderResolution';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';
import { isTextToSpeechProvider } from '@/common/types/ttsTypes';
import { modelRegistry, voiceAsset, voiceSynth } from '@/common/adapter/ipcBridge';
import {
  isImageModelName,
  imageModelDisplayLabel,
  isFluxProviderRow,
  FLUX_RECOMMENDED_IMAGE_ID,
} from '@/common/config/imageModels';
import type { VoiceAsset } from '@/common/types/voiceAsset';
import { Divider, Form, Message, Button, Switch, Input, Slider, Progress } from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useConfigModelListWithImage from '@/renderer/hooks/agent/useConfigModelListWithImage';
import WaylandScrollArea from '@/renderer/components/base/WaylandScrollArea';
import WaylandSelect from '@/renderer/components/base/WaylandSelect';
import McpAgentStatusDisplay from '@/renderer/pages/settings/ToolsSettings/McpAgentStatusDisplay';
import { useMcpServers, useMcpAgentStatus, useMcpOperations } from '@/renderer/hooks/mcp';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { useSettingsViewMode } from '../settingsViewContext';
import MicrophoneCheck from '@/renderer/pages/settings/VoiceSettings/MicrophoneCheck';
import { useHostedVoiceConsent, hostedVoiceConsentErrorGuidance } from '@/renderer/hooks/voice/useHostedVoiceConsent';

const isBuiltinImageGenServer = (server: IMcpServer) => server.builtin === true && server.id === BUILTIN_IMAGE_GEN_ID;
export const SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT = 'wayland:speech-to-text-config-changed';
/**
 * The factory floor for speech-to-text.
 *
 * `enabled: true` with the provider deliberately UNSET. Unset resolves to the
 * bundled on-device Whisper (see `resolveVoiceLeg`), which is always present,
 * needs no key, owes no disclosure and sends no audio off the machine - so
 * turning it on by default costs the user nothing and asks them nothing.
 *
 * The previous floor was `{enabled:false, provider:'openai'}`, which is the
 * worst of both: speech-in was off, and the one thing waiting behind the switch
 * was a hosted transcriber with no key. There must be no path where an absent
 * provider means "a hosted service with no key".
 */
export const DEFAULT_SPEECH_TO_TEXT_CONFIG: SpeechToTextConfig = {
  enabled: true,
  origin: 'default',
  openai: {
    apiKey: '',
    baseUrl: '',
    language: '',
    model: 'whisper-1',
  },
  fluxVoice: {
    apiKey: '',
    baseUrl: '',
    language: '',
    model: 'flux-voice',
  },
  deepgram: {
    apiKey: '',
    baseUrl: '',
    detectLanguage: true,
    language: '',
    model: 'nova-2',
    punctuate: true,
    smartFormat: true,
  },
};

/**
 * Coerces arbitrary stored input into a config the ladder can trust.
 *
 * Two coercions, both deliberate:
 *
 * 1. ORIGIN. Every config that arrives without an `origin` is a pre-origin
 *    config and becomes `origin:'default'`. See `SpeechToTextConfigOrigin` for
 *    why that is the only honest migration and why the never-re-seed guarantee
 *    is forward-only.
 *
 * 2. PROVIDER VALIDITY. `provider` used to be spread straight through with no
 *    validation at all, unlike its TTS sibling, so a garbage or retired value
 *    reached the resolver and matched nothing. A provider that is not a member
 *    of the union is dropped AND forces `origin:'default'` regardless of prior
 *    intent - a stored intent naming an engine that does not exist is not an
 *    intent that can be honoured, and the floor is the only safe landing.
 */
export const normalizeSpeechToTextConfig = (
  config?: SpeechToTextConfig
): SpeechToTextConfig & { origin: SpeechToTextConfigOrigin } => {
  const storedProvider = config?.provider;
  const providerIsValid = storedProvider === undefined || isSpeechToTextProvider(storedProvider);
  const isUserOrigin = providerIsValid && config?.origin === 'user';

  return {
    ...DEFAULT_SPEECH_TO_TEXT_CONFIG,
    ...config,
    provider: providerIsValid ? storedProvider : undefined,
    origin: isUserOrigin ? 'user' : 'default',
    /**
     * 3. ENABLED. A default-origin config's `enabled` is not the user's answer,
     *    it is whatever the factory floor happened to be when it was written -
     *    and the pre-origin floor was `false`. A stored `false` there is
     *    indistinguishable from "never touched", so it is re-seeded from the
     *    CURRENT floor rather than honoured. A user-origin `false` is a real
     *    answer and is kept.
     */
    enabled: isUserOrigin ? (config?.enabled ?? DEFAULT_SPEECH_TO_TEXT_CONFIG.enabled) : DEFAULT_SPEECH_TO_TEXT_CONFIG.enabled,
    openai: {
      ...DEFAULT_SPEECH_TO_TEXT_CONFIG.openai,
      ...config?.openai,
    },
    fluxVoice: {
      ...DEFAULT_SPEECH_TO_TEXT_CONFIG.fluxVoice,
      ...config?.fluxVoice,
    },
    deepgram: {
      ...DEFAULT_SPEECH_TO_TEXT_CONFIG.deepgram,
      ...config?.deepgram,
    },
  };
};

// Whisper model asset descriptor - model + binary are both required for local STT.
// destPath + sha256 are resolved server-side by voiceAssetRegistry.ts before
// the download starts; the renderer just supplies the id + url.
const WHISPER_MODEL_ASSETS: Record<string, VoiceAsset> = {
  base: {
    id: 'whisper-ggml-base',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    destPath: '',
    sha256: '',
  },
  small: {
    id: 'whisper-ggml-small',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    destPath: '',
    sha256: '',
  },
};

type DownloadState = 'idle' | 'downloading' | 'success' | 'error';

/**
 * Shared download-with-progress controller for the local voice models (Whisper
 * + Kokoro). Owns the download lifecycle, the on-disk install probe, and the
 * live progress subscription so both controls render a real <Progress/> bar
 * instead of the old hardcoded 0%. Pass `undefined` when no asset is selected
 * (the hook stays inert until one is).
 */
const useVoiceAssetDownload = (asset: VoiceAsset | undefined) => {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [percent, setPercent] = useState(0);
  const cancelledRef = useRef(false);
  const assetId = asset?.id;

  // Probe install state on mount + every asset switch and after each download
  // so the UI flips to "Installed" when the file already exists on disk.
  useEffect(() => {
    if (!assetId) return;
    let cancelled = false;
    void voiceAsset.exists
      .invoke({ id: assetId })
      .then((r) => {
        if (!cancelled) setInstalled(Boolean(r?.installed));
      })
      .catch(() => {
        if (!cancelled) setInstalled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assetId, downloadState]);

  // Subscribe to streamed progress and translate bytes into a percentage.
  // When the server omits Content-Length totalBytes is null and we stay at 0
  // (indeterminate) rather than dividing by nothing.
  useEffect(() => {
    if (!assetId) return;
    const removeListener = voiceAsset.downloadProgress.on((evt) => {
      if (!evt || evt.assetId !== assetId) return;
      setPercent(evt.totalBytes ? Math.min(100, Math.round((evt.bytesDownloaded / evt.totalBytes) * 100)) : 0);
    });
    return () => {
      removeListener();
    };
  }, [assetId]);

  const handleDownload = useCallback(async () => {
    if (!asset) return;
    cancelledRef.current = false;
    setPercent(0);
    setDownloadState('downloading');
    setErrorMsg('');
    try {
      // The bridge reports failure as data, not as a rejection - it cannot
      // reject, because the transport has no error channel and a throw would
      // leave this await pending forever with the bar stuck at "downloading".
      // So a resolved promise is NOT proof of success and must be inspected.
      const outcome = await voiceAsset.download.invoke(asset);
      if (cancelledRef.current) return;
      if (outcome?.ok === false) {
        setDownloadState('error');
        setErrorMsg(outcome.detail ? `${outcome.errorCode}: ${outcome.detail}` : outcome.errorCode);
        return;
      }
      setDownloadState('success');
    } catch (err) {
      if (!cancelledRef.current) {
        setDownloadState('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    }
  }, [asset]);

  const handleCancel = useCallback(async () => {
    cancelledRef.current = true;
    if (assetId) {
      await voiceAsset.cancel.invoke({ assetId }).catch(() => {});
    }
    setDownloadState('idle');
    setPercent(0);
  }, [assetId]);

  return { downloadState, errorMsg, installed, percent, handleDownload, handleCancel };
};

const WhisperLocalDownloadControl: React.FC<{
  model: string;
  onModelChange: (model: string) => void;
}> = ({ model, onModelChange }) => {
  const { t } = useTranslation();
  const { downloadState, errorMsg, installed, percent, handleDownload, handleCancel } = useVoiceAssetDownload(
    WHISPER_MODEL_ASSETS[model]
  );

  return (
    <>
      <Form.Item label={t('settings.speechToTextWhisperModel')}>
        <WaylandSelect value={model} onChange={onModelChange}>
          <WaylandSelect.Option value='base'>base</WaylandSelect.Option>
          <WaylandSelect.Option value='small'>small</WaylandSelect.Option>
        </WaylandSelect>
      </Form.Item>
      <Form.Item label={t('settings.speechToTextDownloadModel')}>
        <div className='flex flex-col gap-8px'>
          {downloadState === 'downloading' ? (
            <div className='flex items-center gap-8px'>
              <Progress percent={percent} animation className='flex-1' />
              <Button size='mini' onClick={handleCancel}>
                {t('settings.speechToTextCancelDownload')}
              </Button>
            </div>
          ) : installed ? (
            <div className='flex items-center justify-between gap-8px h-32px px-12px rd-8px bg-[var(--color-fill-2)]'>
              <span className='flex items-center gap-8px text-12px text-[var(--success)]'>
                <CheckCircle2 size={14} />
                {t('settings.speechToTextModelInstalled', { defaultValue: 'Installed' })}
              </span>
              <Button
                type='text'
                size='mini'
                icon={<RotateCcw size={12} />}
                onClick={handleDownload}
                className='text-12px text-t-tertiary'
              >
                {t('settings.speechToTextRedownload', { defaultValue: 'Re-download' })}
              </Button>
            </div>
          ) : (
            <Button type='outline' onClick={handleDownload} size='small'>
              {t('settings.speechToTextDownloadModel')}
            </Button>
          )}
          {downloadState === 'error' && (
            <span className='text-12px text-[var(--danger)]'>
              {t('settings.speechToTextDownloadError')}: {errorMsg}
            </span>
          )}
        </div>
      </Form.Item>
    </>
  );
};

export { TTS_CONFIG_CHANGED_EVENT } from '@/renderer/services/voice/voiceSettingsEvents';

const OPENAI_TTS_VOICES = [
  'marin',
  'cedar',
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse',
] as const;

/**
 * Test voice must always end in a sound or a sentence - never in nothing.
 *
 * The IPC transport cannot carry a rejection: its provider side has no
 * `.catch`, so a main-process throw leaves `invoke()` pending forever. Both
 * bridges this screen touches now return their failures as data, but a pending
 * promise is still reachable if a provider is unregistered or main is wedged,
 * and its symptom is precisely the one being fixed here - a button that
 * produces no sound, no error and no toast. This converts that into a named
 * failure the user can act on.
 */
export const TEST_VOICE_TIMEOUT_MS = 20_000;

/**
 * The sentence to put in front of the user for a `CODE: detail` failure.
 *
 * Prefers the detail, because that is the half written for a human. Falls back
 * to the bare code only when there is nothing else - a code alone tells the
 * user what broke but never what to do about it.
 */
/**
 * Every raw failure code the voice subsystems can emit, as a CLOSED type.
 *
 * The "unknown" the owner saw is not a missing translation - a locale grep
 * comes back clean - it is an unmapped RAW CODE flowing through
 * `describeVoiceFailure` at runtime and out the other side untouched. Closing
 * the union and switching on it exhaustively is what turns "we forgot a code"
 * from a runtime string into a build failure.
 */
export const VOICE_FAILURE_CODES = [
  'STT_DISABLED',
  'STT_OPENAI_NOT_CONFIGURED',
  'STT_DEEPGRAM_NOT_CONFIGURED',
  'STT_FLUX_NOT_CONFIGURED',
  'STT_FLUX_AUTH_ERROR',
  'STT_FLUX_PREMIUM_LOCKED',
  'STT_HOSTED_CONSENT_REQUIRED',
  'STT_FILE_TOO_LARGE',
  'STT_RATE_LIMITED',
  'STT_REQUEST_FAILED',
  'STT_LOCAL_ENGINE_FAILED',
  'TTS_SYSTEM_NATIVE_UNAVAILABLE',
  'TTS_KOKORO_UNAVAILABLE',
  'TTS_HOSTED_CONSENT_REQUIRED',
  'TTS_EMPTY_AUDIO',
  'TTS_PLAYBACK_FAILED',
  'TTS_AUDIO_CONTEXT_BLOCKED',
  'TTS_NO_RESPONSE',
  'TTS_REQUEST_FAILED',
] as const;

export type VoiceFailureCode = (typeof VOICE_FAILURE_CODES)[number];

const isVoiceFailureCode = (value: string): value is VoiceFailureCode =>
  (VOICE_FAILURE_CODES as readonly string[]).includes(value);

/**
 * The sentence shown for a code with no detail attached.
 *
 * Exhaustive, with a compile-time `never` on the default branch. Adding a
 * member to `VOICE_FAILURE_CODES` without a case here fails the typecheck.
 */
const voiceFailureSentence = (code: VoiceFailureCode): string => {
  switch (code) {
    case 'STT_DISABLED':
      return 'Speech input is switched off. Turn it on in Voice settings.';
    case 'STT_OPENAI_NOT_CONFIGURED':
      return 'OpenAI transcription has no API key yet. Add one in Voice settings.';
    case 'STT_DEEPGRAM_NOT_CONFIGURED':
      return 'Deepgram transcription has no API key yet. Add one in Voice settings.';
    case 'STT_FLUX_NOT_CONFIGURED':
      return 'Flux Voice is not connected yet. Connect Flux Router in Models and Providers.';
    case 'STT_FLUX_AUTH_ERROR':
      return 'Flux Router rejected the credential. Reconnect it in Models and Providers.';
    case 'STT_FLUX_PREMIUM_LOCKED':
      return 'Flux Voice transcription is not included in this plan.';
    case 'STT_HOSTED_CONSENT_REQUIRED':
      return 'This transcriber sends audio off your device and needs your agreement first.';
    case 'STT_FILE_TOO_LARGE':
      return 'That recording is too large to transcribe. Record a shorter one.';
    case 'STT_RATE_LIMITED':
      return 'The transcription service is rate limiting this account. Wait a moment and try again.';
    case 'STT_REQUEST_FAILED':
      return 'The transcription request failed. Check the connection and try again.';
    case 'STT_LOCAL_ENGINE_FAILED':
      return 'The on-device transcription engine could not run.';
    case 'TTS_SYSTEM_NATIVE_UNAVAILABLE':
      return 'This operating system has no built-in voice. Choose a different speech provider.';
    case 'TTS_KOKORO_UNAVAILABLE':
      return 'Kokoro has no working voice yet. Choose System Voice or OpenAI Speech.';
    case 'TTS_HOSTED_CONSENT_REQUIRED':
      return 'This voice sends the reply off your device and needs your agreement first.';
    case 'TTS_EMPTY_AUDIO':
      return 'Speech output returned no audio.';
    case 'TTS_PLAYBACK_FAILED':
      return 'The audio could not be played on this device.';
    case 'TTS_AUDIO_CONTEXT_BLOCKED':
      return 'This window is not allowed to play audio yet. Try the control again.';
    case 'TTS_NO_RESPONSE':
      return 'Speech output did not respond in time.';
    case 'TTS_REQUEST_FAILED':
      return 'The speech request failed. Check the connection and try again.';
    default: {
      const exhaustive: never = code;
      return exhaustive;
    }
  }
};

/**
 * The sentence to put in front of the user for a `CODE: detail` failure.
 *
 * Prefers the detail, because that is the half written for a human. Then the
 * mapped sentence for the code. A code that is in NEITHER - the case that
 * produced the literal word "unknown" - falls back to a named sentence that
 * identifies the subsystem and never says "unknown".
 */
export const describeVoiceFailure = (raw: string): string => {
  const separator = raw.indexOf(':');
  const code = (separator === -1 ? raw : raw.slice(0, separator)).trim();
  const detail = separator === -1 ? '' : raw.slice(separator + 1).trim();

  if (detail) return detail;
  if (isVoiceFailureCode(code)) return voiceFailureSentence(code);

  return code
    ? `The voice subsystem reported ${code}, which this version does not recognize. The complete answer is still in Chat.`
    : 'The voice subsystem failed without saying why. The complete answer is still in Chat.';
};

export const withTestVoiceTimeout = <T,>(work: Promise<T>, timeoutMs = TEST_VOICE_TIMEOUT_MS): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TTS_NO_RESPONSE')), timeoutMs);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

export const TextToSpeechSettingsSection: React.FC<{
  config: TextToSpeechConfig;
  onChange: (updater: (current: TextToSpeechConfig) => TextToSpeechConfig) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const testAudioUrlRef = useRef<string | null>(null);
  const { ensureConsent, needsConsent, consentModal } = useHostedVoiceConsent();

  const handleProviderChange = useCallback(
    (value: string) => {
      if (!isTextToSpeechProvider(value)) return;
      // Hosted providers require the VOC-03 disclosure before selection sticks.
      void ensureConsent(value).then((accepted) => {
        if (!accepted) return;
        onChange((current) => ({
          ...current,
          provider: value,
          voice: value === 'openai' ? 'marin' : 'default',
          model: value === 'openai' ? 'gpt-4o-mini-tts' : undefined,
        }));
      });
    },
    [onChange, ensureConsent]
  );

  /**
   * Turning auto-read ON is the one speech decision the user makes ahead of
   * time, for replies that have not been written yet - so on a hosted provider
   * the disclosure is due here, at the moment of the decision, and not from
   * inside a streaming answer where a modal would be an ambush. Turning it OFF
   * needs no disclosure.
   */
  const handleAutoReadChange = useCallback(
    (checked: boolean) => {
      if (!checked) {
        onChange((current) => ({ ...current, autoReadResponses: false }));
        return;
      }
      void ensureConsent(config.provider).then((accepted) => {
        if (!accepted) return;
        onChange((current) => ({ ...current, autoReadResponses: true }));
      });
    },
    [config.provider, ensureConsent, onChange]
  );

  const clearTestAudio = useCallback(() => {
    testAudioRef.current?.pause();
    testAudioRef.current = null;
    if (testAudioUrlRef.current) {
      URL.revokeObjectURL(testAudioUrlRef.current);
      testAudioUrlRef.current = null;
    }
  }, []);

  useEffect(() => clearTestAudio, [clearTestAudio]);

  const handleTestVoice = useCallback(async () => {
    clearTestAudio();
    /**
     * The disclosure comes first, on the panel the user is already standing on.
     *
     * Going to main without it only earns `TTS_HOSTED_CONSENT_REQUIRED`, and the
     * guidance that code maps to says "open Voice settings and accept the
     * disclosure" - which is this screen, and there was no way to accept from
     * here. The consent flow this section already owns is the way out; the error
     * mapping below stays as the backstop for a main-side gate the renderer
     * cannot see.
     */
    if (!(await withTestVoiceTimeout(ensureConsent(config.provider)).catch(() => false))) {
      Message.error(t('settings.textToSpeechTestConsentDeclined'));
      return;
    }
    try {
      // Every await between here and playback is inside the guard, not just the
      // synthesis call. A live CDP run reproduced the reported "no sound, no
      // error, no toast" on `system-native` - a provider with no credential and
      // no runtime to fail on - with ZERO synthesizer activity in the main log,
      // which means the handler died or hung BEFORE reaching the synthesizer.
      // Persisting the config is the only other IPC round trip on that path, and
      // the transport it uses cannot report a rejection either. Guarding only
      // `speak` would have left exactly that hang silent.
      const result = await withTestVoiceTimeout(
        (async () => {
          // A failure to persist must not cancel the test: the user pressed
          // "Test voice", not "Save". It is reported, then the test proceeds
          // with the config already in hand.
          try {
            await ConfigStorage.set('tools.textToSpeech', config);
          } catch (persistError) {
            console.error('[TextToSpeech] could not persist config before test:', persistError);
          }
          return voiceSynth.speak.invoke({ text: t('settings.textToSpeechTestPhrase') });
        })()
      );
      if (result.ok === false) {
        throw new Error(result.detail ? `${result.errorCode}: ${result.detail}` : result.errorCode);
      }
      if (result.data.length === 0) throw new Error('TTS_EMPTY_AUDIO');
      const bytes = Uint8Array.from(result.data);
      const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: result.mimeType }));
      const audio = new Audio(url);
      testAudioRef.current = audio;
      testAudioUrlRef.current = url;
      audio.addEventListener('ended', clearTestAudio, { once: true });
      await audio.play();
    } catch (error) {
      clearTestAudio();
      const raw = error instanceof Error ? error.message : 'unavailable';
      const guidance = hostedVoiceConsentErrorGuidance(raw);
      if (guidance) {
        Message.error(t('settings.voiceHostedConsentRequired', { defaultValue: guidance }));
      } else {
        Message.error(
          t('settings.textToSpeechTestFailed', {
            defaultValue: 'Voice test failed: {{reason}}',
            // Main composes a human sentence after the code ("OpenAI is
            // connected but its saved credential cannot be decrypted…"). Show
            // that when it exists; a bare code is a dead end for the user.
            reason: describeVoiceFailure(raw),
          })
        );
      }
    }
  }, [clearTestAudio, config, ensureConsent, t]);

  return (
    <div className='px-[12px] md:px-[32px] py-[24px] bg-[var(--color-bg-2)] rd-12px border-2 border-solid border-[var(--color-border-2)]'>
      {consentModal}
      <div className='flex items-center justify-between gap-12px mb-8px'>
        <div className='flex flex-col gap-4px'>
          <span className='text-14px text-t-primary'>{t('settings.textToSpeech')}</span>
          <span className='text-13px text-t-secondary'>{t('settings.textToSpeechDescription')}</span>
        </div>
        <Switch
          checked={config.enabled}
          onChange={(checked) => {
            onChange((current) => ({ ...current, enabled: checked }));
          }}
        />
      </div>

      <Divider className='mt-0px mb-20px' />

      <Form layout='horizontal' labelAlign='left' className='space-y-12px wayland-stack-form-mobile'>
        <Form.Item label={t('settings.textToSpeechProvider')}>
          <div className='flex items-center gap-8px'>
            <WaylandSelect
              value={config.provider}
              onChange={handleProviderChange}
              className='flex-1'
              data-testid='tts-provider-select'
            >
              <WaylandSelect.Option value='system-native'>
                {t('settings.textToSpeechProviderSystemNative')}
              </WaylandSelect.Option>
              <WaylandSelect.Option value='openai'>OpenAI Speech</WaylandSelect.Option>
              <WaylandSelect.Option value='kokoro-local' disabled>
                {t('settings.textToSpeechProviderKokoroLocal')} · Runtime unavailable
              </WaylandSelect.Option>
            </WaylandSelect>
            <Button size='small' onClick={handleTestVoice} disabled={config.provider === 'kokoro-local'}>
              {t('settings.textToSpeechTestVoice', 'Test voice')}
            </Button>
          </div>
          {needsConsent(config.provider) && (
            <div
              data-testid='tts-consent-pending'
              className='mt-6px text-12px text-t-secondary flex items-center gap-6px flex-wrap'
            >
              <span>
                {t('settings.voiceHostedConsentPending', 'This provider processes audio and text off your device.')}
              </span>
              <Button
                type='text'
                size='mini'
                className='!px-0 !h-auto'
                data-testid='tts-consent-review'
                onClick={() => void ensureConsent(config.provider)}
              >
                {t('settings.voiceReviewHostedConsent', 'Review consent')}
              </Button>
            </div>
          )}
        </Form.Item>

        <Form.Item label={t('settings.textToSpeechVoice')}>
          {config.provider === 'openai' ? (
            <WaylandSelect
              value={config.voice === 'default' ? 'marin' : config.voice}
              onChange={(value) => onChange((current) => ({ ...current, voice: value }))}
            >
              {OPENAI_TTS_VOICES.map((voice) => (
                <WaylandSelect.Option key={voice} value={voice}>
                  {voice.charAt(0).toUpperCase() + voice.slice(1)}
                </WaylandSelect.Option>
              ))}
            </WaylandSelect>
          ) : (
            <Input value={config.voice} onChange={(value) => onChange((current) => ({ ...current, voice: value }))} />
          )}
        </Form.Item>

        {config.provider === 'openai' && (
          <Form.Item label='Connection'>
            <span className='text-12px text-t-secondary'>
              Uses the OpenAI credential connected in Models and Providers.
            </span>
          </Form.Item>
        )}

        <Form.Item label={t('settings.textToSpeechSpeed')}>
          {/* Reserve the same horizontal gutter on both sides as the
              widest tick label, so Arco's translateX(-50%) centering on
              the leftmost (0.5×) and rightmost (2×) marks doesn't push
              the label past the form container. 20px is enough for "0.5×"
              (~24px wide, half = 12px) with a small visual breather. */}
          <div className='px-20px'>
            <Slider
              min={0.5}
              max={2.0}
              step={0.1}
              value={config.speed}
              onChange={(value) => onChange((current) => ({ ...current, speed: value as number }))}
              marks={{ 0.5: '0.5×', 1: '1×', 1.5: '1.5×', 2: '2×' }}
              className='w-full'
            />
          </div>
        </Form.Item>

        <Form.Item label={t('settings.textToSpeechAutoRead')}>
          <Switch
            data-testid='tts-auto-read-switch'
            checked={config.autoReadResponses}
            onChange={handleAutoReadChange}
          />
        </Form.Item>

        {config.provider === 'kokoro-local' && (
          <Form.Item label='Availability'>
            <span className='text-12px text-[var(--warning)]'>
              Kokoro is preserved as an experimental migration value, but Wayland will not claim it is ready until the
              model, voice data, phonemizer, and executable runtime all pass a real synthesis check.
            </span>
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export const SpeechToTextSettingsSection: React.FC<{
  config: SpeechToTextConfig;
  onChange: (updater: (current: SpeechToTextConfig) => SpeechToTextConfig) => void;
}> = ({ config, onChange: onChangeRaw }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  /**
   * Every write from this panel stamps `origin:'user'`, at ONE place.
   *
   * Touching any control here is the only signal that exists that the user made
   * a speech-in decision, and after this the ladder will stop re-seeding them.
   * Stamping it per control would mean a new control silently ships without it -
   * the divergence is designed out rather than maintained.
   */
  const onChange = useCallback(
    (updater: (current: SpeechToTextConfig) => SpeechToTextConfig) => {
      onChangeRaw((current) => ({ ...updater(current), origin: 'user' }));
    },
    [onChangeRaw]
  );
  const { ensureConsent, needsConsent, consentModal } = useHostedVoiceConsent();
  // Whether OpenAI is connected in the shared provider registry (the same store
  // Models/Providers shows as "Connected"). When it is, OpenAI Whisper uses that
  // key automatically, so the panel confirms the key is present instead of
  // telling the user to go configure it.
  const [openAIConnected, setOpenAIConnected] = useState<boolean | null>(null);
  // Flux connectivity comes from the same registry read. Main seeds Flux Voice
  // as the zero-config transcriber when Flux is connected and no STT engine was
  // ever chosen, so without this the panel cannot know which company is actually
  // receiving the audio.
  const [fluxConnected, setFluxConnected] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void modelRegistry.list
      .invoke()
      .then((providers) => {
        if (cancelled) return;
        setOpenAIConnected(providers.some((p) => p.providerId === 'openai' && p.state === 'connected'));
        setFluxConnected(providers.some((p) => p.providerId === FLUX_PROVIDER_ID && p.state === 'connected'));
      })
      .catch(() => {
        if (!cancelled) setOpenAIConnected(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * The transcriber that will actually receive the audio, which is not always
   * the one stored in settings. Consent is per-recipient, so every consent
   * decision on this panel is made about THIS provider - asking about the stored
   * one is how a user ends up accepting a disclosure that never unblocks
   * anything.
   *
   * Main additionally requires the connected provider's stored key to be
   * non-empty, which the renderer cannot see; a provider marked connected with
   * an empty key would make this optimistic. That errs toward offering consent
   * for a provider that then goes unused, which is harmless - the reverse, no
   * consent for the provider actually used, is the failure being fixed.
   */
  const effectiveProvider = resolveEffectiveSttProvider({
    stored: config,
    hasConnectedOpenAIKey: openAIConnected === true,
    hasConnectedFluxKey: fluxConnected,
  });
  const handleOpenProvidersPage = useCallback(() => {
    try {
      navigate('/settings/models');
    } catch {
      // Settings modal context may not have a router - fall back to hash route.
      if (typeof window !== 'undefined') {
        window.location.hash = '#/settings/models';
      }
    }
  }, [navigate]);
  const renderSpeechToTextFieldLabel = useCallback(
    (labelKey: string, requirement: 'required' | 'optional') => (
      <span className='inline-flex items-center gap-6px'>
        <span>{t(labelKey)}</span>
        <span aria-hidden='true' className='text-12px text-t-tertiary'>
          ({t(requirement === 'required' ? 'settings.speechToTextRequired' : 'settings.speechToTextOptional')})
        </span>
      </span>
    ),
    [t]
  );

  /**
   * What the panel DRAWS. An unset `provider` is the on-device floor, so it must
   * render as whisper-local rather than falling through to whichever branch
   * happens to be last - which was Deepgram, meaning a factory profile showed
   * Deepgram's fields for an engine it was not using.
   */
  const displayProvider: SpeechToTextProvider = config.provider ?? 'whisper-local';

  const handleProviderChange = useCallback(
    (value: string) => {
      // Hosted STT providers require the VOC-03 disclosure before selection sticks.
      void ensureConsent(value).then((accepted) => {
        if (!accepted) return;
        onChange((current) => ({
          ...current,
          provider: value as SpeechToTextProvider,
        }));
      });
    },
    [onChange, ensureConsent]
  );

  const handleOpenAIChange = useCallback(
    (field: keyof NonNullable<SpeechToTextConfig['openai']>, value: string) => {
      onChange((current) => ({
        ...current,
        openai: {
          ...current.openai,
          [field]: value,
        },
      }));
    },
    [onChange]
  );

  const handleDeepgramChange = useCallback(
    (field: keyof NonNullable<SpeechToTextConfig['deepgram']>, value: string | boolean) => {
      onChange((current) => ({
        ...current,
        deepgram: {
          ...current.deepgram,
          [field]: value,
        },
      }));
    },
    [onChange]
  );

  return (
    <div className='px-[12px] md:px-[32px] py-[24px] bg-[var(--color-bg-2)] rd-12px border-2 border-solid border-[var(--color-border-2)]'>
      {consentModal}
      <div className='flex items-center justify-between gap-12px mb-8px'>
        <div className='flex flex-col gap-4px'>
          <span className='text-14px text-t-primary'>{t('settings.speechToText')}</span>
          <span className='text-13px text-t-secondary'>{t('settings.speechToTextDescription')}</span>
        </div>
        <Switch
          checked={config.enabled}
          onChange={(checked) => {
            onChange((current) => ({
              ...current,
              enabled: checked,
            }));
          }}
        />
      </div>

      <Divider className='mt-0px mb-20px' />

      <Form layout='horizontal' labelAlign='left' className='space-y-12px wayland-stack-form-mobile'>
        <Form.Item label={t('settings.speechToTextProvider')}>
          <WaylandSelect value={displayProvider} onChange={handleProviderChange} data-testid='stt-provider-select'>
            <WaylandSelect.Option value='openai'>{t('settings.speechToTextProviderOpenAI')}</WaylandSelect.Option>
            <WaylandSelect.Option value='deepgram'>{t('settings.speechToTextProviderDeepgram')}</WaylandSelect.Option>
            <WaylandSelect.Option value='flux-voice'>
              {t('settings.speechToTextProviderFluxVoice')}
            </WaylandSelect.Option>
            <WaylandSelect.Option value='whisper-local'>
              {t('settings.speechToTextProviderWhisperLocal')}
            </WaylandSelect.Option>
          </WaylandSelect>
          {effectiveProvider !== config.provider && (
            <div data-testid='stt-effective-provider' className='mt-6px text-12px text-t-secondary'>
              {t('settings.speechToTextSeededProvider', {
                defaultValue: 'Currently using {{provider}}, because it is connected and no engine was chosen here.',
                provider: t(
                  `settings.speechToTextProvider${effectiveProvider === 'flux-voice' ? 'FluxVoice' : 'OpenAI'}`
                ),
              })}
            </div>
          )}
          {needsConsent(effectiveProvider) && (
            <div
              data-testid='stt-consent-pending'
              className='mt-6px text-12px text-t-secondary flex items-center gap-6px flex-wrap'
            >
              <span>
                {t('settings.voiceHostedConsentPending', 'This provider processes audio and text off your device.')}
              </span>
              <Button
                type='text'
                size='mini'
                className='!px-0 !h-auto'
                data-testid='stt-consent-review'
                onClick={() => void ensureConsent(effectiveProvider)}
              >
                {t('settings.voiceReviewHostedConsent', 'Review consent')}
              </Button>
            </div>
          )}
        </Form.Item>

        <Form.Item label={t('settings.voiceMicCheckLabel', 'Microphone')}>
          <MicrophoneCheck />
        </Form.Item>

        {displayProvider === 'openai' ? (
          <>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextApiKey', 'required')}>
              {/* Three distinct states: connected (true) shows the "using your
                  key" banner; not-connected (false) shows the configure/defer
                  banner; loading (null) renders nothing so the defer banner -
                  the exact Bug B symptom - never flashes for a connected user. */}
              {openAIConnected === true ? (
                <div className='rounded-12px bg-[var(--color-fill-2)] p-12px flex flex-col sm:flex-row sm:items-center sm:justify-between gap-12px'>
                  <div className='min-w-0'>
                    <div className='text-13px font-medium text-t-primary'>
                      {t('settings.voiceProviderKeyConnectedTitle', 'Using your connected OpenAI key')}
                    </div>
                    <div className='text-12px text-t-secondary'>
                      {t(
                        'settings.voiceProviderKeyConnectedBody',
                        'Speech-to-text uses the OpenAI provider you connected in Models. No extra key needed here.'
                      )}
                    </div>
                  </div>
                  <Button size='small' className='w-full sm:w-auto shrink-0' onClick={handleOpenProvidersPage}>
                    {t('settings.voiceProviderKeyManageCTA', 'Manage in Providers →')}
                  </Button>
                </div>
              ) : openAIConnected === false ? (
                <div className='rounded-12px bg-[var(--color-fill-2)] p-12px flex flex-col sm:flex-row sm:items-center sm:justify-between gap-12px'>
                  <div className='min-w-0'>
                    <div className='text-13px font-medium text-t-primary'>
                      {t('settings.voiceProviderKeyDeferTitle', 'Configure your OpenAI key in Providers')}
                    </div>
                    <div className='text-12px text-t-secondary'>
                      {t(
                        'settings.voiceProviderKeyDeferBody',
                        'Provider keys live in one place so every feature can use them.'
                      )}
                    </div>
                  </div>
                  <Button size='small' className='w-full sm:w-auto shrink-0' onClick={handleOpenProvidersPage}>
                    {t('settings.voiceProviderKeyDeferCTA', 'Open Providers →')}
                  </Button>
                </div>
              ) : null}
            </Form.Item>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextBaseUrl', 'optional')}>
              <Input value={config.openai?.baseUrl} onChange={(value) => handleOpenAIChange('baseUrl', value)} />
            </Form.Item>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextModel', 'optional')}>
              <Input value={config.openai?.model} onChange={(value) => handleOpenAIChange('model', value)} />
            </Form.Item>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextLanguage', 'optional')}>
              <Input value={config.openai?.language} onChange={(value) => handleOpenAIChange('language', value)} />
            </Form.Item>
          </>
        ) : displayProvider === 'whisper-local' ? (
          <WhisperLocalDownloadControl
            model={config.whisperLocal?.model ?? 'base'}
            onModelChange={(model) =>
              onChange((current) => ({
                ...current,
                whisperLocal: { ...current.whisperLocal, model },
              }))
            }
          />
        ) : (
          <>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextApiKey', 'required')}>
              <Input.Password
                value={config.deepgram?.apiKey}
                visibilityToggle
                onChange={(value) => handleDeepgramChange('apiKey', value)}
              />
            </Form.Item>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextBaseUrl', 'optional')}>
              <Input value={config.deepgram?.baseUrl} onChange={(value) => handleDeepgramChange('baseUrl', value)} />
            </Form.Item>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextModel', 'optional')}>
              <Input value={config.deepgram?.model} onChange={(value) => handleDeepgramChange('model', value)} />
            </Form.Item>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextLanguage', 'optional')}>
              <Input value={config.deepgram?.language} onChange={(value) => handleDeepgramChange('language', value)} />
            </Form.Item>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextDetectLanguage', 'optional')}>
              <Switch
                checked={config.deepgram?.detectLanguage !== false}
                onChange={(checked) => handleDeepgramChange('detectLanguage', checked)}
              />
            </Form.Item>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextPunctuate', 'optional')}>
              <Switch
                checked={config.deepgram?.punctuate !== false}
                onChange={(checked) => handleDeepgramChange('punctuate', checked)}
              />
            </Form.Item>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextSmartFormat', 'optional')}>
              <Switch
                checked={config.deepgram?.smartFormat !== false}
                onChange={(checked) => handleDeepgramChange('smartFormat', checked)}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  );
};

/**
 * MCP management in the legacy settings modal is now just a pointer at the
 * new full-page MCP Library. The old inline CRUD (browse / add / edit /
 * delete server rows) was removed in P8 in favor of `/settings/mcp-library`.
 * We keep a small CTA here so users opening Tools -> MCP from the modal land
 * somewhere useful.
 */
const ModalMcpLibraryLinkSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleOpenLibrary = useCallback(() => {
    try {
      navigate('/settings/mcp-library/installed');
    } catch {
      if (typeof window !== 'undefined') {
        window.location.hash = '#/settings/mcp-library/installed';
      }
    }
  }, [navigate]);

  return (
    <div className='flex flex-col gap-12px min-h-0'>
      <div className='flex items-center justify-between gap-12px'>
        <div className='flex flex-col gap-4px'>
          <span className='text-14px text-t-primary'>{t('settings.mcpSettings', { defaultValue: 'MCP Servers' })}</span>
          <span className='text-13px text-t-secondary'>
            {t('settings.mcpModalDeprecatedBody', 'Browse, install, and manage MCP servers in the new MCP Library.')}
          </span>
        </div>
        <Button type='outline' shape='round' onClick={handleOpenLibrary}>
          {t('settings.mcpModalOpenLibraryCTA', 'Open MCP Library')}
        </Button>
      </div>
    </div>
  );
};

const ToolsModalContent: React.FC = () => {
  const { t } = useTranslation();
  const [mcpMessage, mcpMessageContext] = Message.useMessage({ maxCount: 10 });
  const [imageGenerationModel, setImageGenerationModel] = useState<
    IConfigStorageRefer['tools.imageGenerationModel'] | undefined
  >();
  const [speechToTextConfig, setSpeechToTextConfig] = useState<SpeechToTextConfig>(DEFAULT_SPEECH_TO_TEXT_CONFIG);
  const [isUpdatingImageGeneration, setIsUpdatingImageGeneration] = useState(false);
  const { modelListWithImage: data } = useConfigModelListWithImage();
  const { mcpServers, saveMcpServers } = useMcpServers();
  const { agentInstallStatus, setAgentInstallStatus, isServerLoading, checkSingleServerInstallStatus } =
    useMcpAgentStatus();
  const { syncMcpToAgents, removeMcpFromAgents } = useMcpOperations(mcpServers, mcpMessage);
  const builtinImageGenServer = useMemo(() => mcpServers.find(isBuiltinImageGenServer), [mcpServers]);
  const skipNextImageGenerationAutoCheckRef = useRef(false);
  const imageGenerationInstalledAgents = builtinImageGenServer?.name
    ? (agentInstallStatus[builtinImageGenServer.name] ?? [])
    : [];

  const navigate = useNavigate();
  const handleOpenProvidersPage = useCallback(() => {
    try {
      navigate('/settings/models');
    } catch {
      if (typeof window !== 'undefined') {
        window.location.hash = '#/settings/models';
      }
    }
  }, [navigate]);

  const imageGenerationModelList = useMemo(() => {
    if (!data) return [];
    // Filter to providers exposing image-capable models, then float Flux to the
    // top so its recommended "Flux Image" default leads the picker.
    const list = (data || [])
      .filter((v) => v.model.some(isImageModelName))
      .map((v) => Object.assign({}, v, { model: v.model.filter(isImageModelName) }));
    return list.toSorted((a, b) => Number(isFluxProviderRow(b)) - Number(isFluxProviderRow(a)));
  }, [data]);

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const storedModel = await ConfigStorage.get('tools.imageGenerationModel');
        const storedSpeechToTextConfig = await ConfigStorage.get('tools.speechToText');
        if (storedModel) {
          setImageGenerationModel(storedModel);
        }
        setSpeechToTextConfig(normalizeSpeechToTextConfig(storedSpeechToTextConfig));
      } catch (error) {
        console.error('Failed to load tools config:', error);
      }
    };

    void loadConfigs();
  }, []);

  const updateSpeechToTextConfig = useCallback((updater: (current: SpeechToTextConfig) => SpeechToTextConfig) => {
    setSpeechToTextConfig((current) => {
      const next = normalizeSpeechToTextConfig(updater(current));
      ConfigStorage.set('tools.speechToText', next).catch((error) => {
        console.error('Failed to save speech-to-text config:', error);
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!builtinImageGenServer?.name || !builtinImageGenServer.enabled) return;
    if (skipNextImageGenerationAutoCheckRef.current) {
      skipNextImageGenerationAutoCheckRef.current = false;
      return;
    }
    void checkSingleServerInstallStatus(builtinImageGenServer.name);
  }, [builtinImageGenServer?.enabled, builtinImageGenServer?.name, checkSingleServerInstallStatus]);

  const clearImageGenerationAgentStatus = useCallback(
    (serverName: string) => {
      const updated = { ...agentInstallStatus };
      delete updated[serverName];
      setAgentInstallStatus(updated);
      void ConfigStorage.set('mcp.agentInstallStatus', updated).catch((error) => {
        console.error('Failed to clear image generation agent install status:', error);
      });
    },
    [setAgentInstallStatus, agentInstallStatus]
  );

  // Sync image generation model config to the built-in MCP server's transport.env
  const syncMcpServerEnv = useCallback(
    async (model: Partial<IConfigStorageRefer['tools.imageGenerationModel']>) => {
      const builtinServer = mcpServers.find(isBuiltinImageGenServer);
      if (!builtinServer || builtinServer.transport.type !== 'stdio') return;

      const env: Record<string, string> = { ...builtinServer.transport.env };
      if (model.platform) {
        env.WAYLAND_IMG_PLATFORM = model.platform;
      } else {
        delete env.WAYLAND_IMG_PLATFORM;
      }
      if (model.baseUrl) {
        env.WAYLAND_IMG_BASE_URL = model.baseUrl;
      } else {
        delete env.WAYLAND_IMG_BASE_URL;
      }
      if (model.apiKey) {
        env.WAYLAND_IMG_API_KEY = model.apiKey;
      } else {
        delete env.WAYLAND_IMG_API_KEY;
      }
      if (model.useModel) {
        env.WAYLAND_IMG_MODEL = model.useModel;
      } else {
        delete env.WAYLAND_IMG_MODEL;
      }

      let updatedServer: IMcpServer | undefined;
      await saveMcpServers((current) => {
        updatedServer = undefined;
        return current.map((candidate) => {
          if (candidate.id !== BUILTIN_IMAGE_GEN_ID || candidate.transport.type !== 'stdio') return candidate;
          updatedServer = {
            ...candidate,
            transport: { ...candidate.transport, env },
            updatedAt: Math.max(Date.now(), candidate.updatedAt + 1),
          };
          return updatedServer;
        });
      });
      if (updatedServer?.enabled) {
        await syncMcpToAgents(updatedServer, true);
      }
    },
    [mcpServers, saveMcpServers, syncMcpToAgents]
  );

  // Sync imageGenerationModel apiKey when provider apiKey changes
  useEffect(() => {
    if (!imageGenerationModel || !data) return;

    const currentProvider = data.find((p) => p.id === imageGenerationModel.id);

    if (currentProvider && currentProvider.apiKey !== imageGenerationModel.apiKey) {
      const updatedModel = {
        ...imageGenerationModel,
        apiKey: currentProvider.apiKey,
      };

      setImageGenerationModel(updatedModel);
      ConfigStorage.set('tools.imageGenerationModel', updatedModel).catch((error) => {
        console.error('Failed to save image generation model config:', error);
      });
      void syncMcpServerEnv(updatedModel);
    } else if (!currentProvider) {
      setImageGenerationModel(undefined);
      ConfigStorage.remove('tools.imageGenerationModel').catch((error) => {
        console.error('Failed to remove image generation model config:', error);
      });
      void syncMcpServerEnv({});
    }
  }, [data, imageGenerationModel?.id, imageGenerationModel?.apiKey, syncMcpServerEnv]);

  const handleImageGenerationModelChange = useCallback(
    (value: Partial<IConfigStorageRefer['tools.imageGenerationModel']>) => {
      setImageGenerationModel((prev) => {
        const newImageGenerationModel = { ...prev, ...value };
        ConfigStorage.set('tools.imageGenerationModel', newImageGenerationModel).catch((error) => {
          console.error('Failed to update image generation model config:', error);
        });
        // Sync env vars to the built-in MCP server
        void syncMcpServerEnv(newImageGenerationModel);
        return newImageGenerationModel;
      });
    },
    [syncMcpServerEnv]
  );

  const handleImageGenerationToggle = useCallback(
    async (checked: boolean) => {
      if (!builtinImageGenServer) return;

      setIsUpdatingImageGeneration(true);
      skipNextImageGenerationAutoCheckRef.current = checked;
      try {
        let updatedServer: IMcpServer | undefined;
        await saveMcpServers((current) => {
          updatedServer = undefined;
          return current.map((candidate) => {
            if (!isBuiltinImageGenServer(candidate)) return candidate;
            updatedServer = {
              ...candidate,
              enabled: checked,
              updatedAt: Math.max(Date.now(), candidate.updatedAt + 1),
            };
            return updatedServer;
          });
        });
        if (!updatedServer) return;

        setImageGenerationModel((prev) => {
          if (!prev) return prev;
          const next = { ...prev, switch: checked };
          ConfigStorage.set('tools.imageGenerationModel', next).catch((error) => {
            console.error('Failed to sync image generation switch state:', error);
          });
          return next;
        });

        if (checked) {
          clearImageGenerationAgentStatus(updatedServer.name);
          await syncMcpToAgents(updatedServer, true);
          await checkSingleServerInstallStatus(updatedServer.name);
        } else {
          await removeMcpFromAgents(updatedServer.name, undefined, updatedServer.transport.type);
          clearImageGenerationAgentStatus(updatedServer.name);
        }
      } catch (error) {
        skipNextImageGenerationAutoCheckRef.current = false;
        console.error('Failed to toggle image generation MCP server:', error);
      } finally {
        if (!checked) {
          skipNextImageGenerationAutoCheckRef.current = false;
        }
        setIsUpdatingImageGeneration(false);
      }
    },
    [
      builtinImageGenServer,
      checkSingleServerInstallStatus,
      clearImageGenerationAgentStatus,
      removeMcpFromAgents,
      saveMcpServers,
      syncMcpToAgents,
    ]
  );

  const viewMode = useSettingsViewMode();
  const isPageMode = viewMode === 'page';

  return (
    <div className='flex flex-col h-full w-full'>
      {mcpMessageContext}

      {/* Content Area */}
      <WaylandScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow={isPageMode}>
        <div className='space-y-16px'>
          {/* MCP tool configuration */}
          <div className='px-[12px] md:px-[32px] py-[24px] bg-2 rd-12px md:rd-16px flex flex-col min-h-0 border border-2'>
            <div className='flex-1 min-h-0'>
              <WaylandScrollArea
                className={classNames('h-full', isPageMode && 'overflow-visible')}
                disableOverflow={isPageMode}
              >
                <ModalMcpLibraryLinkSection />
              </WaylandScrollArea>
            </div>
          </div>
          {/* Image generation */}
          <div className='px-[12px] md:px-[32px] py-[24px] bg-[var(--color-bg-2)] rd-12px border-2 border-solid border-[var(--color-border-2)]'>
            <div className='flex items-center justify-between mb-16px'>
              <span className='text-14px text-t-primary'>{t('settings.imageGeneration')}</span>
              <div className='flex items-center gap-8px'>
                {builtinImageGenServer?.enabled && builtinImageGenServer.name && (
                  <McpAgentStatusDisplay
                    serverName={builtinImageGenServer.name}
                    agentInstallStatus={agentInstallStatus}
                    isLoadingAgentStatus={
                      isServerLoading(builtinImageGenServer.name) && imageGenerationInstalledAgents.length === 0
                    }
                    alwaysVisible
                  />
                )}
                <Switch
                  disabled={
                    isUpdatingImageGeneration ||
                    !builtinImageGenServer ||
                    !imageGenerationModelList.length ||
                    !imageGenerationModel?.useModel
                  }
                  checked={Boolean(builtinImageGenServer?.enabled)}
                  onChange={handleImageGenerationToggle}
                />
              </div>
            </div>

            <Divider className='mt-0px mb-20px' />

            <Form layout='horizontal' labelAlign='left' className='space-y-12px wayland-stack-form-mobile'>
              <Form.Item label={t('settings.imageGenerationModel')}>
                {imageGenerationModelList.length > 0 ? (
                  <WaylandSelect
                    triggerProps={{ className: 'wl-image-model-popup' }}
                    value={
                      imageGenerationModel?.id && imageGenerationModel?.useModel
                        ? `${imageGenerationModel.id}|${imageGenerationModel.useModel}`
                        : undefined
                    }
                    onChange={(value) => {
                      const [platformId, modelName] = value.split('|');
                      const platform = imageGenerationModelList.find((p) => p.id === platformId);
                      if (platform) {
                        handleImageGenerationModelChange({
                          ...platform,
                          useModel: modelName,
                        });
                      }
                    }}
                  >
                    {imageGenerationModelList.map(({ model, ...platform }) => (
                      <WaylandSelect.OptGroup label={platform.name} key={platform.id}>
                        {model.map((modelName) => (
                          <WaylandSelect.Option key={platform.id + modelName} value={platform.id + '|' + modelName}>
                            <span className='inline-flex items-center gap-6px'>
                              {imageModelDisplayLabel(modelName)}
                              {modelName === FLUX_RECOMMENDED_IMAGE_ID && (
                                <span className='text-9px font-700 leading-none tracking-[0.05em] uppercase text-[rgb(var(--primary-6))] bg-[rgb(var(--primary-6)/0.12)] rd-5px px-6px py-2px'>
                                  {t('settings.imageGenRecommended', 'Recommended')}
                                </span>
                              )}
                            </span>
                          </WaylandSelect.Option>
                        ))}
                      </WaylandSelect.OptGroup>
                    ))}
                  </WaylandSelect>
                ) : (
                  // No image-capable model connected (nothing installed, no key,
                  // or only a CLI like Claude Code). Image generation stays
                  // disabled until one is available - recommend Flux, mirroring
                  // the models panel's Flux hero.
                  <div className='rounded-12px bg-[var(--color-fill-2)] p-12px flex flex-col sm:flex-row sm:items-center sm:justify-between gap-12px'>
                    <div className='min-w-0'>
                      <div className='text-13px font-medium text-t-primary'>
                        {t('settings.imageGenNoModelTitle', 'No image model connected')}
                      </div>
                      <div className='text-12px text-t-secondary'>
                        {t(
                          'settings.imageGenNoModelBody',
                          'Connect Flux Router to generate images. One key, every model, and it picks the right one for each request.'
                        )}
                      </div>
                    </div>
                    <Button
                      type='primary'
                      size='small'
                      className='w-full sm:w-auto shrink-0'
                      onClick={handleOpenProvidersPage}
                    >
                      {t('settings.imageGenNoModelCta', 'Connect Flux')}
                    </Button>
                  </div>
                )}
              </Form.Item>
            </Form>
          </div>
          <SpeechToTextSettingsSection config={speechToTextConfig} onChange={updateSpeechToTextConfig} />
        </div>
      </WaylandScrollArea>
    </div>
  );
};

export default ToolsModalContent;
