/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, HelpCircle, RotateCcw } from 'lucide-react';
import {
  ConfigStorage,
  type IConfigStorageRefer,
  type IMcpServer,
  BUILTIN_IMAGE_GEN_ID,
} from '@/common/config/storage';
import type { SpeechToTextConfig, SpeechToTextProvider } from '@/common/types/speech';
import type { TextToSpeechConfig, TextToSpeechProvider } from '@/common/types/ttsTypes';
import { DEFAULT_TTS_CONFIG, normalizeTextToSpeechConfig } from '@/common/types/ttsTypes';
import { acpConversation, voiceAsset, voiceSynth } from '@/common/adapter/ipcBridge';
import {
  isImageModelName,
  imageModelDisplayLabel,
  isFluxProviderRow,
  FLUX_RECOMMENDED_IMAGE_ID,
} from '@/common/config/imageModels';
import type { VoiceAsset } from '@/common/types/voiceAsset';
import {
  voiceModelsFor,
  type VoiceModelEntry,
} from '@/common/voice/voiceModelCatalog';
import { useVoiceModelCatalog } from '@/renderer/hooks/voice/useVoiceModelCatalog';
import {
  Divider,
  Form,
  Message,
  Button,
  Switch,
  Input,
  Slider,
  Progress,
  Tooltip,
} from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DownloadProgress } from '@/common/types/voiceAsset';
import { useTranslation } from 'react-i18next';
import useConfigModelListWithImage from '@/renderer/hooks/agent/useConfigModelListWithImage';
import WaylandScrollArea from '@/renderer/components/base/WaylandScrollArea';
import WaylandSelect from '@/renderer/components/base/WaylandSelect';
import McpAgentStatusDisplay from '@/renderer/pages/settings/ToolsSettings/McpAgentStatusDisplay';
import {
  useMcpServers,
  useMcpAgentStatus,
  useMcpOperations,
} from '@/renderer/hooks/mcp';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { useSettingsViewMode } from '../settingsViewContext';
import MicrophoneCheck from '@/renderer/pages/settings/VoiceSettings/MicrophoneCheck';
import { playAudioClip, stopVoicePlayback } from '@/renderer/utils/voicePlayback';
import { speakWithSystemVoice } from '@/renderer/utils/systemVoice';
import { useSystemVoices } from '@/renderer/hooks/voice/useSystemVoices';
import { useSignedInProviders } from '@/renderer/hooks/voice/useSignedInProviders';
import { useHardwareVoiceRecommendation } from '@/renderer/hooks/voice/useHardwareVoiceRecommendation';
import { RecommendedVoiceHint } from '@/renderer/components/voice/RecommendedVoiceHint';
import HuggingFaceModelSearch from '@/renderer/components/voice/HuggingFaceModelSearch';
import type { HfSearchResult } from '@/renderer/services/huggingFaceVoiceSearch';
import { isBelowVersion } from '@/renderer/utils/versionCompare';
import { SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT } from './speechToTextEvents';

// Re-exported so existing importers can keep using this module path.
export { SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT };

const isBuiltinImageGenServer = (server: IMcpServer) => server.builtin === true && server.id === BUILTIN_IMAGE_GEN_ID;
export const DEFAULT_SPEECH_TO_TEXT_CONFIG: SpeechToTextConfig = {
  enabled: false,
  provider: 'openai',
  openai: {
    apiKey: '',
    baseUrl: '',
    language: '',
    model: 'whisper-1',
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

export const normalizeSpeechToTextConfig = (config?: SpeechToTextConfig): SpeechToTextConfig => ({
  ...DEFAULT_SPEECH_TO_TEXT_CONFIG,
  ...config,
  openai: {
    ...DEFAULT_SPEECH_TO_TEXT_CONFIG.openai,
    ...config?.openai,
  },
  deepgram: {
    ...DEFAULT_SPEECH_TO_TEXT_CONFIG.deepgram,
    ...config?.deepgram,
  },
});

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
  'large-v3-turbo': {
    id: 'whisper-ggml-large-v3-turbo',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin',
    destPath: '',
    sha256: '',
  },
};

type DownloadState = 'idle' | 'downloading' | 'installing' | 'success' | 'error';

const WhisperLocalDownloadControl: React.FC<{
  model: string;
  onModelChange: (model: string) => void;
  /** Catalog entries for whisper-local, sourced from the data-driven catalog. */
  models: VoiceModelEntry[];
}> = ({ model, onModelChange, models }) => {
  const { t } = useTranslation();
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [installed, setInstalled] = useState<boolean | null>(null);
  const cancelledRef = React.useRef(false);
  const asset = WHISPER_MODEL_ASSETS[model];
  // Live byte-progress for the active model download (same emitter the TTS
  // models use). null until the first progress frame arrives.
  const downloadPercent = useAssetDownloadProgress(asset?.id ?? '');
  const selectedEntry = models.find((m) => m.modelId === model);
  const sizeLabel = selectedEntry?.sizeLabel ?? '';

  // Probe install state on mount + every model switch so the UI shows
  // "Installed" instead of a Download button when the file already exists
  // on disk. Krug / Sutherland: don't make the user wonder.
  useEffect(() => {
    let cancelled = false;
    if (!asset) return;
    void voiceAsset.exists
      .invoke({ id: asset.id })
      .then((r) => {
        if (!cancelled) setInstalled(Boolean(r?.installed));
      })
      .catch(() => {
        if (!cancelled) setInstalled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [model, downloadState, asset]);

  const handleDownload = useCallback(async () => {
    const target = WHISPER_MODEL_ASSETS[model];
    if (!target) return;
    cancelledRef.current = false;
    setDownloadState('downloading');
    setErrorMsg('');
    try {
      await voiceAsset.download.invoke(target);
      if (cancelledRef.current) return;
      // Download resolved (bytes verified + atomically placed). Confirm on disk
      // before flipping to Installed - shows a brief "Installing…" while the
      // exists-probe runs.
      setDownloadState('installing');
      const r = await voiceAsset.exists.invoke({ id: target.id }).catch(() => ({ installed: false }));
      if (cancelledRef.current) return;
      setInstalled(Boolean(r?.installed));
      setDownloadState(r?.installed ? 'success' : 'error');
      if (!r?.installed) setErrorMsg(t('settings.speechToTextDownloadError', { defaultValue: 'Download failed' }));
    } catch (err) {
      if (!cancelledRef.current) {
        setDownloadState('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    }
  }, [model, t]);

  const handleCancel = useCallback(async () => {
    cancelledRef.current = true;
    const asset = WHISPER_MODEL_ASSETS[model];
    if (asset) {
      await voiceAsset.cancel.invoke({ assetId: asset.id }).catch(() => {});
    }
    setDownloadState('idle');
  }, [model]);

  return (
    <>
      <Form.Item
        label={
          <span className='flex items-center gap-4px'>
            {t('settings.speechToTextWhisperModel')}
            <Tooltip
              content={
                <div className='flex flex-col gap-6px max-w-280px text-12px'>
                  <span>{t('settings.whisperModelHelpIntro', { defaultValue: 'Bigger models are more accurate but slower and larger to download. A bundled tiny model already works offline with no download.' })}</span>
                  {models.map((m) => (
                    <span key={m.modelId}><b>{m.label} · {m.sizeLabel}</b> — {m.blurb}</span>
                  ))}
                </div>
              }
            >
              <HelpCircle size={13} className='text-t-tertiary cursor-help' />
            </Tooltip>
          </span>
        }
      >
        <div className='flex flex-col gap-4px'>
          <WaylandSelect value={model} onChange={onModelChange}>
            {models.map((m) => (
              <WaylandSelect.Option key={m.modelId} value={m.modelId}>
                {m.label} · {m.sizeLabel}
              </WaylandSelect.Option>
            ))}
          </WaylandSelect>
          {selectedEntry && (
            <span className='text-11px text-t-tertiary'>{selectedEntry.blurb}</span>
          )}
        </div>
      </Form.Item>
      <Form.Item label={t('settings.speechToTextDownloadModel')}>
        <div className='flex flex-col gap-8px'>
          {selectedEntry?.bundled ? (
            <div className='flex items-center gap-8px h-32px px-12px rd-8px bg-[var(--color-fill-2)]'>
              <span className='flex items-center gap-8px text-12px text-[var(--success)]'>
                <CheckCircle2 size={14} />
                {t('settings.speechToTextBundled', { defaultValue: 'Built in — works offline, no download' })}
              </span>
            </div>
          ) : downloadState === 'downloading' ? (
            <>
              <div className='flex items-center gap-8px'>
                <Progress
                  percent={downloadPercent ?? 0}
                  animation={downloadPercent === null}
                  className='flex-1'
                />
                <Button size='mini' onClick={handleCancel}>
                  {t('settings.speechToTextCancelDownload')}
                </Button>
              </div>
              <span className='text-12px text-t-tertiary'>
                {downloadPercent === null
                  ? t('settings.speechToTextDownloadStarting', { defaultValue: 'Starting download… ({{size}})', size: sizeLabel })
                  : t('settings.speechToTextDownloadingPct', { defaultValue: 'Downloading {{pct}}% of {{size}}', pct: downloadPercent, size: sizeLabel })}
              </span>
            </>
          ) : downloadState === 'installing' ? (
            <div className='flex items-center gap-8px'>
              <Progress percent={100} animation className='flex-1' />
              <span className='text-12px text-t-tertiary shrink-0'>
                {t('settings.speechToTextInstalling', { defaultValue: 'Installing…' })}
              </span>
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

export { TTS_CONFIG_CHANGED_EVENT } from '@/renderer/hooks/voice/useTtsConfig';

/** Tracks real-time download progress for a specific asset id. */
function useAssetDownloadProgress(assetId: string): number | null {
  const [percent, setPercent] = useState<number | null>(null);
  useEffect(() => {
    const off = voiceAsset.downloadProgress.on((p: DownloadProgress) => {
      if (p.assetId !== assetId) return;
      if (p.totalBytes && p.totalBytes > 0) {
        setPercent(Math.round((p.bytesDownloaded / p.totalBytes) * 100));
      }
    });
    return () => { off(); setPercent(null); };
  }, [assetId]);
  return percent;
}

const KOKORO_ASSET: VoiceAsset = {
  id: 'kokoro-onnx-model',
  url: 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
  destPath: '',
  sha256: '',
};

const KOKORO_VOICES_ASSET: VoiceAsset = {
  id: 'kokoro-voices',
  url: 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin',
  destPath: '',
  sha256: '',
};

const KOKORO_PKG = 'kokoro-onnx';
const KOKORO_REQUIRED_SPACE = '~490 MB';
const KOKORO_DEFAULT_VOICE = 'af_sky';
const KOKORO_VOICES: { value: string; label: string }[] = [
  { value: 'af_sky',      label: 'Sky (American Female)' },
  { value: 'af_bella',    label: 'Bella (American Female)' },
  { value: 'af_heart',    label: 'Heart (American Female)' },
  { value: 'af_sarah',    label: 'Sarah (American Female)' },
  { value: 'af_nicole',   label: 'Nicole (American Female)' },
  { value: 'af_nova',     label: 'Nova (American Female)' },
  { value: 'af_alloy',    label: 'Alloy (American Female)' },
  { value: 'af_jessica',  label: 'Jessica (American Female)' },
  { value: 'af_river',    label: 'River (American Female)' },
  { value: 'am_adam',     label: 'Adam (American Male)' },
  { value: 'am_echo',     label: 'Echo (American Male)' },
  { value: 'am_eric',     label: 'Eric (American Male)' },
  { value: 'am_liam',     label: 'Liam (American Male)' },
  { value: 'am_michael',  label: 'Michael (American Male)' },
  { value: 'am_onyx',     label: 'Onyx (American Male)' },
  { value: 'bf_emma',     label: 'Emma (British Female)' },
  { value: 'bf_alice',    label: 'Alice (British Female)' },
  { value: 'bf_isabella', label: 'Isabella (British Female)' },
  { value: 'bf_lily',     label: 'Lily (British Female)' },
  { value: 'bm_george',   label: 'George (British Male)' },
  { value: 'bm_daniel',   label: 'Daniel (British Male)' },
  { value: 'bm_lewis',    label: 'Lewis (British Male)' },
  { value: 'bm_fable',    label: 'Fable (British Male)' },
];

// Piper default-voice assets - model + config both required next to each other.
// destPath + sha256 are resolved server-side by voiceAssetRegistry.ts (pinned
// digests live there); the renderer just supplies the id + url.
const PIPER_MODEL_ASSET: VoiceAsset = {
  id: 'piper-voice-en_US-lessac-medium',
  url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx',
  destPath: '',
  sha256: '',
};

const PIPER_CONFIG_ASSET: VoiceAsset = {
  id: 'piper-voice-en_US-lessac-medium-config',
  url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json',
  destPath: '',
  sha256: '',
};

const PIPER_PKG = 'piper-tts';
const PIPER_REQUIRED_SPACE = '~65 MB';
const PIPER_DEFAULT_VOICE = 'en_US-lessac-medium';
// Mirrors PIPER_VOICES in @process/services/voice/engine/tts/piperEngine.ts -
// kept as a renderer-side copy (same ids) because the engine module imports
// node builtins the sandboxed renderer cannot bundle.
const PIPER_VOICES: { value: string; label: string }[] = [
  { value: 'en_US-lessac-medium', label: 'Lessac — English (US)' },
  { value: 'es_ES-davefx-medium', label: 'DaveFX — Español' },
  { value: 'fr_FR-siwis-medium', label: 'Siwis — Français' },
  { value: 'de_DE-thorsten-medium', label: 'Thorsten — Deutsch' },
];

const MLX_AUDIO_PKG = 'mlx-audio';
// MLX_AUDIO_MIN_VERSION 0.2.0 chosen as the first release with stable server mode
// (used by the warm-worker pattern later).
const MLX_AUDIO_MIN_VERSION = '0.2.0';
const MLX_AUDIO_DEFAULT_MODEL = 'mlx-community/lucasnewman-f5-tts-mlx';
const IS_APPLE_SILICON = process.platform === 'darwin' && process.arch === 'arm64';

type PipState = 'idle' | 'installing' | 'removing' | 'error';

type LocalSetupPhase = 'idle' | 'installing' | 'installed' | 'error';

type LocalSetupAsset = { asset: VoiceAsset; label: string };

/**
 * Generic "download N assets, then uv-install a package" setup flow shared by
 * the local TTS providers (Kokoro, Piper). The progress bar splits evenly
 * across the asset downloads plus a final package segment; the package step
 * has no byte-level events (uv downloads silently) so it sits at its segment
 * start with animation.
 */
const LocalAssetSetupControl: React.FC<{
  assets: LocalSetupAsset[];
  pkg: string;
  requiredSpace: string;
  installedLabel: string;
  installLabel: string;
  onRefresh: () => void;
  startSignal?: number;
  onPhaseChange?: (phase: LocalSetupPhase) => void;
}> = ({ assets, pkg, requiredSpace, installedLabel, installLabel, onRefresh, startSignal = 0, onPhaseChange }) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<LocalSetupPhase>('idle');
  // null = idle; 0..assets.length-1 = downloading that asset; assets.length = package install.
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const cancelledRef = useRef(false);
  const handledSignalRef = useRef(0);

  const totalSteps = assets.length + 1;
  const segment = 100 / totalSteps;
  const activeAsset = stepIndex !== null && stepIndex < assets.length ? assets[stepIndex] : null;
  const activePercent = useAssetDownloadProgress(activeAsset?.asset.id ?? '');

  const overallPercent = stepIndex === null
    ? 0
    : activeAsset
      ? Math.round(stepIndex * segment + ((activePercent ?? 0) / 100) * segment)
      : Math.round(assets.length * segment);
  const overallAnimation = stepIndex !== null && (!activeAsset || activePercent === null);
  const stepLabel = stepIndex === null ? '' : activeAsset ? activeAsset.label : 'Installing…';

  const checkInstalled = useCallback(async () => {
    const results = await Promise.all([
      ...assets.map(({ asset }) =>
        voiceAsset.exists.invoke({ id: asset.id }).catch(() => ({ installed: false }))),
      voiceAsset.uvStatus.invoke({ pkg }).catch(() => ({ installed: false })),
    ]);
    setPhase(results.every((r) => Boolean(r?.installed)) ? 'installed' : 'idle');
  }, [assets, pkg]);

  useEffect(() => { void checkInstalled(); }, [checkInstalled]);

  const runInstall = useCallback(async (skipPackage = false) => {
    cancelledRef.current = false;
    setPhase('installing');
    setErrorMsg('');
    try {
      for (let i = 0; i < assets.length; i++) {
        setStepIndex(i);
        await voiceAsset.download.invoke(assets[i].asset);
        if (cancelledRef.current) return;
      }

      if (!skipPackage) {
        setStepIndex(assets.length);
        const result = await voiceAsset.uvInstall.invoke({ pkg });
        if (!result?.ok) throw new Error(result?.error ?? 'Install failed');
      }

      if (!cancelledRef.current) {
        setStepIndex(null);
        setPhase('installed');
        onRefresh();
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setStepIndex(null);
        setPhase('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    }
  }, [assets, pkg, onRefresh]);

  const handleInstall = useCallback(() => runInstall(false), [runInstall]);

  // Begin installation when the parent requests it (the provider-row Install
  // button). Each increment of startSignal triggers exactly one install run;
  // the parent resets the signal on refresh so a remount cannot re-trigger.
  useEffect(() => {
    if (startSignal > handledSignalRef.current) {
      handledSignalRef.current = startSignal;
      void runInstall(false);
    }
  }, [startSignal, runInstall]);

  // Let the parent mirror the install lifecycle (e.g. the provider-row button
  // shows "Installing…" while the setup control works).
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  const handleRedownload = useCallback(async () => {
    const pkgRes = await voiceAsset.uvStatus.invoke({ pkg }).catch(() => ({ installed: false }));
    if (!pkgRes?.installed) {
      await runInstall(false);
    } else {
      await Promise.all(assets.map(({ asset }) => voiceAsset.delete.invoke({ id: asset.id }).catch(() => {})));
      await runInstall(true);
    }
  }, [assets, pkg, runInstall]);

  const handleCancel = useCallback(async () => {
    cancelledRef.current = true;
    if (activeAsset) await voiceAsset.cancel.invoke({ assetId: activeAsset.asset.id }).catch(() => {});
    setStepIndex(null);
    setPhase('idle');
  }, [activeAsset]);

  const handleDelete = useCallback(async () => {
    await Promise.all(assets.map(({ asset }) => voiceAsset.delete.invoke({ id: asset.id }).catch(() => {})));
    await voiceAsset.uvRemove.invoke({ pkg }).catch(() => {});
    setPhase('idle');
    onRefresh();
  }, [assets, pkg, onRefresh]);

  if (phase === 'installing') {
    return (
      <div className='flex items-center gap-8px'>
        <Progress percent={overallPercent} animation={overallAnimation} className='flex-1' />
        <span className='text-12px text-t-tertiary shrink-0'>{stepLabel}</span>
        <Button size='mini' onClick={handleCancel}>
          {t('settings.textToSpeechCancelDownload')}
        </Button>
      </div>
    );
  }

  if (phase === 'installed') {
    return (
      <div className='flex items-center justify-between gap-8px h-32px px-12px rd-8px bg-[var(--color-fill-2)]'>
        <span className='flex items-center gap-8px text-12px text-[var(--success)]'>
          <CheckCircle2 size={14} />
          {installedLabel}
        </span>
        <div className='flex items-center gap-8px'>
          <Button type='text' size='mini' icon={<RotateCcw size={12} />} onClick={handleRedownload} className='text-12px text-t-tertiary'>
            {t('settings.textToSpeechRedownload', { defaultValue: 'Re-download' })}
          </Button>
          <Button type='text' size='mini' onClick={handleDelete} className='text-12px text-[var(--danger)]'>
            {t('settings.ttsDeleteModel', { defaultValue: 'Delete' })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-8px'>
      <Button type='outline' onClick={handleInstall} size='small'>
        {installLabel}
      </Button>
      <span className='text-11px text-t-tertiary text-center'>(approx. {requiredSpace} required)</span>
      {phase === 'error' && (
        <span className='text-12px text-[var(--danger)]'>{errorMsg}</span>
      )}
    </div>
  );
};

const KOKORO_SETUP_ASSETS: LocalSetupAsset[] = [
  { asset: KOKORO_ASSET, label: 'Downloading model…' },
  { asset: KOKORO_VOICES_ASSET, label: 'Downloading voice data…' },
];

const KokoroSetupControl: React.FC<{
  onRefresh: () => void;
  startSignal?: number;
  onPhaseChange?: (phase: LocalSetupPhase) => void;
}> = ({ onRefresh, startSignal, onPhaseChange }) => {
  const { t } = useTranslation();
  return (
    <LocalAssetSetupControl
      assets={KOKORO_SETUP_ASSETS}
      pkg={KOKORO_PKG}
      requiredSpace={KOKORO_REQUIRED_SPACE}
      installedLabel={t('settings.kokoroInstalled', { defaultValue: 'Kokoro TTS installed' })}
      installLabel={t('settings.kokoroInstall', { defaultValue: 'Install Kokoro TTS' })}
      onRefresh={onRefresh}
      startSignal={startSignal}
      onPhaseChange={onPhaseChange}
    />
  );
};

const PIPER_SETUP_ASSETS: LocalSetupAsset[] = [
  { asset: PIPER_MODEL_ASSET, label: 'Downloading model…' },
  { asset: PIPER_CONFIG_ASSET, label: 'Downloading voice data…' },
];

const PiperSetupControl: React.FC<{
  onRefresh: () => void;
  startSignal?: number;
  onPhaseChange?: (phase: LocalSetupPhase) => void;
}> = ({ onRefresh, startSignal, onPhaseChange }) => {
  const { t } = useTranslation();
  return (
    <LocalAssetSetupControl
      assets={PIPER_SETUP_ASSETS}
      pkg={PIPER_PKG}
      requiredSpace={PIPER_REQUIRED_SPACE}
      installedLabel={t('settings.piperInstalled', { defaultValue: 'Piper TTS installed' })}
      installLabel={t('settings.piperInstall', { defaultValue: 'Install Piper TTS' })}
      onRefresh={onRefresh}
      startSignal={startSignal}
      onPhaseChange={onPhaseChange}
    />
  );
};

const UvPackageControl: React.FC<{
  pkg: string;
  installedLabel: string;
  installLabel: string;
  note?: string;
  minVersion?: string;
  onRefresh: () => void;
}> = ({ pkg, installedLabel, installLabel, note, minVersion, onRefresh }) => {
  const { t } = useTranslation();
  const [uvState, setUvState] = useState<PipState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [version, setVersion] = useState<string | undefined>(undefined);
  // During install, uv binary download emits progress with the uv-runtime asset id.
  const uvBinaryPercent = useAssetDownloadProgress(`uv-runtime-${process.platform}-${process.arch}`);

  const probe = useCallback(() => {
    void voiceAsset.uvStatus
      .invoke({ pkg })
      .then((r) => {
        setInstalled(Boolean(r?.installed));
        setVersion(r?.version);
      })
      .catch(() => { setInstalled(false); setVersion(undefined); });
  }, [pkg]);

  useEffect(() => { probe(); }, [probe, uvState]);

  const needsUpgrade = Boolean(
    installed && version && minVersion && isBelowVersion(version, minVersion),
  );

  const handleInstall = useCallback(async () => {
    setUvState('installing');
    setErrorMsg('');
    try {
      const installPkg = needsUpgrade && minVersion ? `${pkg}>=${minVersion}` : pkg;
      const result = await voiceAsset.uvInstall.invoke({ pkg: installPkg });
      if (result?.ok) { setUvState('idle'); onRefresh(); }
      else { setUvState('error'); setErrorMsg(result?.error ?? 'Install failed'); }
    } catch (err) {
      setUvState('error');
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }, [pkg, minVersion, needsUpgrade, onRefresh]);

  const handleRemove = useCallback(async () => {
    setUvState('removing');
    setErrorMsg('');
    try {
      const result = await voiceAsset.uvRemove.invoke({ pkg });
      if (result?.ok) { setUvState('idle'); onRefresh(); }
      else { setUvState('error'); setErrorMsg(result?.error ?? 'Remove failed'); }
    } catch (err) {
      setUvState('error');
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }, [pkg, onRefresh]);

  return (
    <div className='flex flex-col gap-8px'>
      {uvState === 'installing' || uvState === 'removing' ? (
        <div className='flex items-center gap-8px h-32px px-12px rd-8px bg-[var(--color-fill-2)]'>
          <Progress percent={uvBinaryPercent ?? 0} animation={uvBinaryPercent === null} className='flex-1' />
          <span className='text-12px text-t-tertiary'>
            {uvState === 'installing' ? 'Installing…' : 'Removing…'}
          </span>
        </div>
      ) : installed && !needsUpgrade ? (
        <div className='flex items-center justify-between gap-8px h-32px px-12px rd-8px bg-[var(--color-fill-2)]'>
          <span className='flex items-center gap-8px text-12px text-[var(--success)]'>
            <CheckCircle2 size={14} />
            {installedLabel}
          </span>
          <Button type='text' size='mini' onClick={handleRemove} className='text-12px text-[var(--danger)]'>
            Remove
          </Button>
        </div>
      ) : (
        <div className='flex flex-col gap-4px'>
          <Button type='outline' onClick={handleInstall} size='small'>
            {needsUpgrade && version && minVersion
              ? t('settings.uvUpgradePackage', {
                  defaultValue: 'Upgrade {{pkg}} (v{{from}} → v{{to}})',
                  pkg,
                  from: version,
                  to: minVersion,
                })
              : installLabel}
          </Button>
          {note && <span className='text-11px text-t-tertiary'>{note}</span>}
        </div>
      )}
      {uvState === 'error' && (
        <span className='text-12px text-[var(--danger)]'>{errorMsg}</span>
      )}
    </div>
  );
};

const MlxAudioInstallControl: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <UvPackageControl
    pkg={MLX_AUDIO_PKG}
    installedLabel='mlx-audio installed'
    installLabel='Install mlx-audio (uv)'
    note='Apple Silicon only · downloads model from HuggingFace on first use'
    minVersion={MLX_AUDIO_MIN_VERSION}
    onRefresh={onRefresh}
  />
);

/** Sentinel select value for the "custom HuggingFace id" escape hatch. */
const MLX_CUSTOM_MODEL_VALUE = '__custom__';

/**
 * mlx-audio model field: a dropdown rendered from the data-driven catalog (per
 * option: label · size, plus a hover tooltip + inline blurb) with a free-text
 * "custom HF id" escape hatch for models not in the catalog.
 */
const MlxAudioModelControl: React.FC<{
  value: string;
  models: VoiceModelEntry[];
  onChange: (value: string) => void;
}> = ({ value, models, onChange }) => {
  const { t } = useTranslation();
  // Custom mode is active when the configured id isn't a known catalog entry,
  // or when the user explicitly picked the custom option (tracked locally).
  const isKnown = models.some((m) => m.modelId === value);
  const [customMode, setCustomMode] = useState(!isKnown);
  const selectValue = customMode || !isKnown ? MLX_CUSTOM_MODEL_VALUE : value;
  const selectedEntry = models.find((m) => m.modelId === value);

  const handleSelect = useCallback(
    (next: string) => {
      if (next === MLX_CUSTOM_MODEL_VALUE) {
        setCustomMode(true);
        return;
      }
      setCustomMode(false);
      onChange(next);
    },
    [onChange]
  );

  return (
    <div className='flex flex-col gap-4px'>
      <WaylandSelect value={selectValue} onChange={handleSelect}>
        {models.map((m) => (
          <WaylandSelect.Option key={m.modelId} value={m.modelId}>
            <span className='inline-flex items-center gap-6px'>
              {m.label} · {m.sizeLabel}
              {m.recommended && (
                <span className='text-9px font-700 leading-none tracking-[0.05em] uppercase text-[rgb(var(--primary-6))] bg-[rgb(var(--primary-6)/0.12)] rd-5px px-6px py-2px'>
                  {t('settings.ttsMlxRecommended', { defaultValue: 'Recommended' })}
                </span>
              )}
              <Tooltip
                content={
                  <div className='flex flex-col gap-2px max-w-280px text-12px'>
                    <span>{m.blurb}</span>
                    {m.quant && <span className='text-t-tertiary'>{m.quant}</span>}
                  </div>
                }
              >
                <HelpCircle size={12} className='text-t-tertiary cursor-help' />
              </Tooltip>
            </span>
          </WaylandSelect.Option>
        ))}
        <WaylandSelect.Option value={MLX_CUSTOM_MODEL_VALUE}>
          {t('settings.ttsMlxCustomModel', { defaultValue: 'Custom HuggingFace id…' })}
        </WaylandSelect.Option>
      </WaylandSelect>
      {selectValue === MLX_CUSTOM_MODEL_VALUE ? (
        <Input
          value={value}
          placeholder={MLX_AUDIO_DEFAULT_MODEL}
          onChange={onChange}
        />
      ) : (
        selectedEntry && (
          <span className='text-11px text-t-tertiary'>
            {selectedEntry.blurb}
            {selectedEntry.quant ? ` · ${selectedEntry.quant}` : ''}
          </span>
        )
      )}
    </div>
  );
};

export const TextToSpeechSettingsSection: React.FC<{
  config: TextToSpeechConfig;
  onChange: (updater: (current: TextToSpeechConfig) => TextToSpeechConfig) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  const catalog = useVoiceModelCatalog();
  // mlx-audio is Apple-Silicon-only; gate its catalog entries by platform so the
  // dropdown never offers a model the host cannot run.
  const mlxModels = useMemo(
    () => (IS_APPLE_SILICON ? voiceModelsFor(catalog, 'mlx-audio-local') : []),
    [catalog]
  );
  // Prefer the catalog's recommended entry (a verified, live HF id) as the
  // mlx-audio default over the engine const, whose mlx-community mirror id does
  // not resolve. Falls back to the const if no recommendation is present.
  const mlxDefaultModel = useMemo(
    () => mlxModels.find((m) => m.recommended)?.modelId ?? MLX_AUDIO_DEFAULT_MODEL,
    [mlxModels]
  );
  const [installKey, setInstallKey] = useState(0);
  const [installSignal, setInstallSignal] = useState(0);
  const [setupPhase, setSetupPhase] = useState<LocalSetupPhase>('idle');
  const [kokoroInstalled, setKokoroInstalled] = useState<boolean | null>(null);
  const [piperInstalled, setPiperInstalled] = useState<boolean | null>(null);
  const [testVoiceLoading, setTestVoiceLoading] = useState(false);
  const systemVoices = useSystemVoices();
  const signedInProviders = useSignedInProviders();
  const recommendation = useHardwareVoiceRecommendation(signedInProviders);

  useEffect(() => {
    void Promise.all([
      voiceAsset.exists.invoke({ id: KOKORO_ASSET.id }).catch(() => ({ installed: false })),
      voiceAsset.exists.invoke({ id: KOKORO_VOICES_ASSET.id }).catch(() => ({ installed: false })),
      voiceAsset.uvStatus.invoke({ pkg: KOKORO_PKG }).catch(() => ({ installed: false })),
    ]).then(([m, v, p]) => {
      setKokoroInstalled(Boolean(m?.installed) && Boolean(v?.installed) && Boolean(p?.installed));
    });
    void Promise.all([
      voiceAsset.exists.invoke({ id: PIPER_MODEL_ASSET.id }).catch(() => ({ installed: false })),
      voiceAsset.exists.invoke({ id: PIPER_CONFIG_ASSET.id }).catch(() => ({ installed: false })),
      voiceAsset.uvStatus.invoke({ pkg: PIPER_PKG }).catch(() => ({ installed: false })),
    ]).then(([m, c, p]) => {
      setPiperInstalled(Boolean(m?.installed) && Boolean(c?.installed) && Boolean(p?.installed));
    });
  }, [installKey]);

  // A monotonically increasing token identifies the current test request.
  // Bumping it (provider change, new test) makes any in-flight test stale:
  // its response is ignored instead of playing audio or toggling state.
  const testTokenRef = useRef(0);

  const resetVoiceTest = useCallback(() => {
    testTokenRef.current += 1;
    stopVoicePlayback();
    setTestVoiceLoading(false);
  }, []);

  const handleProviderChange = useCallback(
    (value: string) => {
      const provider = value as TextToSpeechProvider;
      resetVoiceTest();
      onChange((current) => {
        const isValidKokoroVoice = KOKORO_VOICES.some((v) => v.value === current.voice);
        const isValidPiperVoice = PIPER_VOICES.some((v) => v.value === current.voice);
        const voice = provider === 'mlx-audio-local' && !current.voice?.includes('/')
          ? MLX_AUDIO_DEFAULT_MODEL
          : provider === 'kokoro-local' && !isValidKokoroVoice
            ? KOKORO_DEFAULT_VOICE
            : provider === 'piper-local' && !isValidPiperVoice
              ? PIPER_DEFAULT_VOICE
              : current.voice;
        // The chain (v2 authority) must follow the selection - normalize only
        // migrates configs WITHOUT a chain, so a stale persisted chain would
        // otherwise keep synthesizing with the previous provider.
        return {
          ...current,
          provider,
          voice,
          chain: provider === 'system-native'
            ? (['system-native'] as TextToSpeechProvider[])
            : ([provider, 'system-native'] as TextToSpeechProvider[]),
          engines: { ...current.engines, [provider]: { voice, speed: current.speed } },
        };
      });
    },
    [onChange, resetVoiceTest]
  );

  /** Voice/speed edits must update both the v1 fields and the engine entry the chain runner reads. */
  const updateVoice = useCallback(
    (value: string) => {
      onChange((current) => ({
        ...current,
        voice: value,
        engines: {
          ...current.engines,
          [current.provider]: { ...current.engines?.[current.provider], voice: value },
        },
      }));
    },
    [onChange]
  );

  const updateSpeed = useCallback(
    (value: number) => {
      onChange((current) => ({
        ...current,
        speed: value,
        engines: {
          ...current.engines,
          [current.provider]: { ...current.engines?.[current.provider], speed: value },
        },
      }));
    },
    [onChange]
  );

  const handleTestVoice = useCallback(async () => {
    const phrase = t('settings.textToSpeechTestPhrase', 'Voice check.');
    if (config.provider === 'system-native') {
      // Web Speech API with the user's chosen OS voice (same path on every
      // platform; config.voice holds the voiceURI).
      void speakWithSystemVoice(phrase, { voiceURI: config.voice, rate: config.speed });
      return;
    }
    const token = ++testTokenRef.current;
    const isStale = () => token !== testTokenRef.current;
    setTestVoiceLoading(true);
    try {
      // Whole-clip path for the one-shot Test phrase. The warm worker (pre-warmed
      // on conversation open) makes this near real-time; streaming's first-chunk
      // win is for multi-sentence auto-read, which uses playStreamedAudio.
      const result = await voiceSynth.speak.invoke({ text: phrase, config });
      if (isStale()) return;
      if (!result.ok || !result.data || result.data.length === 0) {
        Message.error(`Voice test failed: ${result.error ?? 'no audio produced'}`);
        setTestVoiceLoading(false);
        return;
      }
      const playback = await playAudioClip(new Uint8Array(result.data), result.mimeType ?? 'audio/wav');
      if (isStale()) return;
      setTestVoiceLoading(false);
      if (!playback.ok) Message.error(`Audio playback failed: ${playback.error}`);
    } catch (err) {
      if (isStale()) return;
      const msg = err instanceof Error ? err.message : String(err);
      Message.error(`Voice test failed: ${msg}`);
      setTestVoiceLoading(false);
    }
  }, [config, t]);

  const refreshInstallState = useCallback(() => {
    // Reset the install signal so the remounted setup control (new installKey)
    // does not see a stale request and re-run the install.
    setInstallSignal(0);
    setInstallKey((k) => k + 1);
  }, []);

  // The local providers need a download before they can speak: while assets
  // are missing the provider-row button becomes the install entry point, and
  // while the install state is still being probed (null) testing is held off.
  const selectedLocalInstalled = config.provider === 'kokoro-local'
    ? kokoroInstalled
    : config.provider === 'piper-local'
      ? piperInstalled
      : true;
  const needsLocalInstall = selectedLocalInstalled === false;
  const localProbing = selectedLocalInstalled === null;
  const localInstalling = setupPhase === 'installing';
  const handleInstallClick = useCallback(() => setInstallSignal((s) => s + 1), []);

  return (
    <div className='px-[12px] md:px-[32px] py-[24px] bg-[var(--color-bg-2)] rd-12px border-2 border-solid border-[var(--color-border-2)]'>
      <div className='flex items-center justify-between gap-12px mb-8px'>
        <div className='flex flex-col gap-4px'>
          <span className='text-14px text-t-primary'>{t('settings.textToSpeech')}</span>
          <span className='text-13px text-t-secondary'>{t('settings.textToSpeechDescription')}</span>
        </div>
        <Switch
          checked={config.enabled}
          onChange={(checked) => onChange((current) => ({ ...current, enabled: checked }))}
        />
      </div>

      <Divider className='mt-0px mb-20px' />

      {recommendation && (
        <div className='mb-12px'>
          <RecommendedVoiceHint recommendation={recommendation} />
        </div>
      )}

      <Form layout='horizontal' labelAlign='left' className='space-y-12px wayland-stack-form-mobile'>
        <Form.Item label={t('settings.textToSpeechProvider')}>
          <div className='flex items-center gap-8px'>
            <WaylandSelect value={config.provider} onChange={handleProviderChange} className='flex-1'>
              <WaylandSelect.Option value='kokoro-local'>
                {kokoroInstalled
                  ? t('settings.textToSpeechProviderKokoroLocal')
                  : t('settings.kokoroPending', {
                      defaultValue: 'Kokoro - Download Model ({{space}})',
                      space: KOKORO_REQUIRED_SPACE,
                    })}
              </WaylandSelect.Option>
              {IS_APPLE_SILICON && (
                <WaylandSelect.Option value='mlx-audio-local'>
                  {t('settings.ttsMlxAudioProvider', { defaultValue: 'MLX Audio (Apple Silicon)' })}
                </WaylandSelect.Option>
              )}
              <WaylandSelect.Option value='piper-local'>
                {t('settings.ttsPiperProvider', { defaultValue: 'Piper (Local, multilingual)' })}
              </WaylandSelect.Option>
              <WaylandSelect.Option value='system-native'>
                {t('settings.textToSpeechProviderSystemNativeDefault', { defaultValue: 'System Native (default)' })}
              </WaylandSelect.Option>
            </WaylandSelect>
            {needsLocalInstall ? (
              <Button
                size='small'
                type='primary'
                onClick={handleInstallClick}
                loading={localInstalling}
                disabled={localInstalling}
              >
                {localInstalling
                  ? t('settings.kokoroInstalling', { defaultValue: 'Installing…' })
                  : t('settings.kokoroInstallShort', { defaultValue: 'Install' })}
              </Button>
            ) : (
              <Button
                size='small'
                onClick={handleTestVoice}
                loading={testVoiceLoading}
                disabled={testVoiceLoading || localProbing}
              >
                {t('settings.textToSpeechTestVoice', 'Test voice')}
              </Button>
            )}
          </div>
        </Form.Item>

        <Form.Item label={config.provider === 'mlx-audio-local'
          ? t('settings.ttsMlxModel', { defaultValue: 'Model (HuggingFace ID)' })
          : t('settings.textToSpeechVoice')}>
          {config.provider === 'kokoro-local' ? (
            <WaylandSelect
              value={kokoroInstalled ? (config.voice || KOKORO_DEFAULT_VOICE) : undefined}
              placeholder={kokoroInstalled ? undefined : 'Awaiting model download and install'}
              disabled={!kokoroInstalled}
              onChange={updateVoice}
            >
              {KOKORO_VOICES.map((v) => (
                <WaylandSelect.Option key={v.value} value={v.value}>
                  {v.label}
                </WaylandSelect.Option>
              ))}
            </WaylandSelect>
          ) : config.provider === 'piper-local' ? (
            <WaylandSelect
              value={piperInstalled ? (config.voice || PIPER_DEFAULT_VOICE) : undefined}
              placeholder={piperInstalled ? undefined : 'Awaiting model download and install'}
              disabled={!piperInstalled}
              onChange={updateVoice}
            >
              {PIPER_VOICES.map((v) => (
                <WaylandSelect.Option key={v.value} value={v.value}>
                  {v.label}
                </WaylandSelect.Option>
              ))}
            </WaylandSelect>
          ) : config.provider === 'mlx-audio-local' ? (
            <div className='flex flex-col gap-8px'>
              <MlxAudioModelControl
                value={config.voice || mlxDefaultModel}
                models={mlxModels}
                onChange={updateVoice}
              />
              {/* Discover more MLX voices on HuggingFace; selecting sets the
                  model id (mlx-audio fetches the weights on first synthesis). */}
              <HuggingFaceModelSearch kind='tts' onSelect={(e: HfSearchResult) => updateVoice(e.modelId)} />
            </div>
          ) : config.provider === 'system-native' ? (
            systemVoices.length > 0 ? (
              <WaylandSelect
                value={config.voice || undefined}
                placeholder={t('settings.systemVoiceDefault', { defaultValue: 'System default voice' })}
                onChange={updateVoice}
                showSearch
              >
                {systemVoices.map((v) => (
                  <WaylandSelect.Option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </WaylandSelect.Option>
                ))}
              </WaylandSelect>
            ) : (
              <span className='text-12px text-t-tertiary'>
                {t('settings.systemVoiceNone', { defaultValue: 'Using the operating system default voice.' })}
              </span>
            )
          ) : (
            <Input
              value={config.voice}
              placeholder=''
              onChange={updateVoice}
            />
          )}
        </Form.Item>

        <Form.Item label={t('settings.textToSpeechSpeed')}>
          <div className='px-20px'>
            <Slider
              min={0.5}
              max={2.0}
              step={0.1}
              value={config.speed}
              onChange={(value) => updateSpeed(value as number)}
              marks={{ 0.5: '0.5×', 1: '1×', 1.5: '1.5×', 2: '2×' }}
              className='w-full'
            />
          </div>
        </Form.Item>

        <Form.Item label={t('settings.textToSpeechAutoRead')}>
          <Switch
            checked={config.autoReadResponses}
            onChange={(checked) => onChange((current) => ({ ...current, autoReadResponses: checked }))}
          />
        </Form.Item>

        {config.provider === 'kokoro-local' && (
          <Form.Item label={t('settings.kokoroSetup', { defaultValue: 'Setup' })}>
            <KokoroSetupControl
              key={installKey}
              startSignal={installSignal}
              onPhaseChange={setSetupPhase}
              onRefresh={refreshInstallState}
            />
          </Form.Item>
        )}

        {config.provider === 'piper-local' && (
          <Form.Item label={t('settings.kokoroSetup', { defaultValue: 'Setup' })}>
            <PiperSetupControl
              key={installKey}
              startSignal={installSignal}
              onPhaseChange={setSetupPhase}
              onRefresh={refreshInstallState}
            />
          </Form.Item>
        )}

        {config.provider === 'mlx-audio-local' && IS_APPLE_SILICON && (
          <Form.Item label={t('settings.ttsMlxAudioInstall', { defaultValue: 'mlx-audio' })}>
            <MlxAudioInstallControl key={installKey} onRefresh={refreshInstallState} />
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export const SpeechToTextSettingsSection: React.FC<{
  config: SpeechToTextConfig;
  onChange: (updater: (current: SpeechToTextConfig) => SpeechToTextConfig) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const catalog = useVoiceModelCatalog();
  const whisperModels = useMemo(() => voiceModelsFor(catalog, 'whisper-local'), [catalog]);
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

  const handleProviderChange = useCallback(
    (value: string) => {
      onChange((current) => ({
        ...current,
        provider: value as SpeechToTextProvider,
      }));
    },
    [onChange]
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
        <Form.Item
          label={t('settings.speechToTextAutoSend', { defaultValue: 'Send after transcription' })}
          extra={t('settings.speechToTextAutoSendDescription', {
            defaultValue: 'Automatically send dictated messages instead of leaving them in the input.',
          })}
        >
          <Switch
            checked={config.autoSend === true}
            onChange={(checked) => {
              onChange((current) => ({
                ...current,
                autoSend: checked,
              }));
            }}
          />
        </Form.Item>

        <Form.Item label={t('settings.speechToTextProvider')}>
          <WaylandSelect value={config.provider} onChange={handleProviderChange}>
            <WaylandSelect.Option value='openai'>{t('settings.speechToTextProviderOpenAI')}</WaylandSelect.Option>
            <WaylandSelect.Option value='deepgram'>{t('settings.speechToTextProviderDeepgram')}</WaylandSelect.Option>
            <WaylandSelect.Option value='whisper-local'>
              {t('settings.speechToTextProviderWhisperLocal')}
            </WaylandSelect.Option>
          </WaylandSelect>
        </Form.Item>

        <Form.Item label={t('settings.voiceMicCheckLabel', 'Microphone')}>
          <MicrophoneCheck />
        </Form.Item>

        {config.provider === 'openai' ? (
          <>
            <Form.Item label={renderSpeechToTextFieldLabel('settings.speechToTextApiKey', 'required')}>
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
        ) : config.provider === 'whisper-local' ? (
          <WhisperLocalDownloadControl
            model={config.whisperLocal?.model ?? 'base'}
            models={whisperModels}
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
          <span className='text-14px text-t-primary'>
            {t('settings.mcpSettings', { defaultValue: 'MCP Servers' })}
          </span>
          <span className='text-13px text-t-secondary'>
            {t(
              'settings.mcpModalDeprecatedBody',
              'Browse, install, and manage MCP servers in the new MCP Library.'
            )}
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

      const updatedServer: IMcpServer = {
        ...builtinServer,
        transport: { ...builtinServer.transport, env },
        updatedAt: Date.now(),
      };

      const updatedServers = mcpServers.map((s) => (s.id === BUILTIN_IMAGE_GEN_ID ? updatedServer : s));
      await saveMcpServers(updatedServers);
      if (updatedServer.enabled) {
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

      const updatedServer: IMcpServer = {
        ...builtinImageGenServer,
        enabled: checked,
        updatedAt: Date.now(),
      };

      setIsUpdatingImageGeneration(true);
      skipNextImageGenerationAutoCheckRef.current = checked;
      try {
        await saveMcpServers((prevServers) =>
          prevServers.map((server) => (isBuiltinImageGenServer(server) ? updatedServer : server))
        );

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
          <div className='px-[12px] md:px-[32px] py-[24px] bg-2 rd-12px md:rd-16px flex flex-col min-h-0 border border-border-2'>
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
