/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, RotateCcw } from 'lucide-react';
import {
  ConfigStorage,
  type IConfigStorageRefer,
  type IMcpServer,
  BUILTIN_IMAGE_GEN_ID,
} from '@/common/config/storage';
import type { SpeechToTextConfig, SpeechToTextProvider } from '@/common/types/speech';
import type { TextToSpeechConfig, TextToSpeechProvider } from '@/common/types/ttsTypes';
import { voiceAsset } from '@/common/adapter/ipcBridge';
import {
  isImageModelName,
  imageModelDisplayLabel,
  isFluxProviderRow,
  FLUX_RECOMMENDED_IMAGE_ID,
} from '@/common/config/imageModels';
import type { VoiceAsset } from '@/common/types/voiceAsset';
import {
  Divider,
  Form,
  Message,
  Button,
  Switch,
  Input,
  Slider,
  Progress,
} from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const isBuiltinImageGenServer = (server: IMcpServer) => server.builtin === true && server.id === BUILTIN_IMAGE_GEN_ID;
export const SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT = 'wayland:speech-to-text-config-changed';
export const DEFAULT_SPEECH_TO_TEXT_CONFIG: SpeechToTextConfig = {
  enabled: false,
  provider: 'openai',
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

export const normalizeSpeechToTextConfig = (config?: SpeechToTextConfig): SpeechToTextConfig => ({
  ...DEFAULT_SPEECH_TO_TEXT_CONFIG,
  ...config,
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
};

type DownloadState = 'idle' | 'downloading' | 'success' | 'error';

const WhisperLocalDownloadControl: React.FC<{
  model: string;
  onModelChange: (model: string) => void;
}> = ({ model, onModelChange }) => {
  const { t } = useTranslation();
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [installed, setInstalled] = useState<boolean | null>(null);
  const cancelledRef = React.useRef(false);

  // Probe install state on mount + every model switch so the UI shows
  // "Installed" instead of a Download button when the file already exists
  // on disk. Krug / Sutherland: don't make the user wonder.
  useEffect(() => {
    let cancelled = false;
    const asset = WHISPER_MODEL_ASSETS[model];
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
  }, [model, downloadState]);

  const handleDownload = useCallback(async () => {
    const asset = WHISPER_MODEL_ASSETS[model];
    if (!asset) return;
    cancelledRef.current = false;
    setDownloadState('downloading');
    setErrorMsg('');
    try {
      await voiceAsset.download.invoke(asset);
      if (!cancelledRef.current) setDownloadState('success');
    } catch (err) {
      if (!cancelledRef.current) {
        setDownloadState('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    }
  }, [model]);

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
      <Form.Item label={t('settings.speechToTextWhisperModel')}>
        <WaylandSelect value={model} onChange={onModelChange}>
          <WaylandSelect.Option value='base'>base</WaylandSelect.Option>
          <WaylandSelect.Option value='small'>small</WaylandSelect.Option>
        </WaylandSelect>
      </Form.Item>
      <Form.Item label={t('settings.speechToTextDownloadModel')}>
        <div className='flex flex-col gap-8px'>
          {downloadState === 'downloading' ? (
            <>
              <div className='flex items-center gap-8px'>
                <Progress percent={0} animation className='flex-1' />
                <Button size='mini' onClick={handleCancel}>
                  {t('settings.speechToTextCancelDownload')}
                </Button>
              </div>
              <span className='text-12px text-t-tertiary'>
                {t('settings.speechToTextDownloadProgressNotReported', 'Downloading… (progress reporting coming soon)')}
              </span>
            </>
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

export const TTS_CONFIG_CHANGED_EVENT = 'wayland:tts-config-changed';

// Hoisted out of the component body so React doesn't see a new object
// identity every render - the previous in-body literal forced every
// useCallback dependent on KOKORO_ASSET to re-create, which in turn
// thrashed the install probe's effect.
const KOKORO_ASSET: VoiceAsset = {
  id: 'kokoro-onnx-model',
  url: 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
  destPath: '',
  sha256: '',
};

export const TextToSpeechSettingsSection: React.FC<{
  config: TextToSpeechConfig;
  onChange: (updater: (current: TextToSpeechConfig) => TextToSpeechConfig) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [installed, setInstalled] = useState<boolean | null>(null);
  const cancelledRef = React.useRef(false);

  // Same install probe as Whisper - flip the UI from "Download Model" to
  // "Installed" when the on-disk file already exists.
  useEffect(() => {
    let cancelled = false;
    void voiceAsset.exists
      .invoke({ id: KOKORO_ASSET.id })
      .then((r) => {
        if (!cancelled) setInstalled(Boolean(r?.installed));
      })
      .catch(() => {
        if (!cancelled) setInstalled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [downloadState]);

  const handleDownloadKokoro = useCallback(async () => {
    cancelledRef.current = false;
    setDownloadState('downloading');
    setErrorMsg('');
    try {
      await voiceAsset.download.invoke(KOKORO_ASSET);
      if (!cancelledRef.current) setDownloadState('success');
    } catch (err) {
      if (!cancelledRef.current) {
        setDownloadState('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    }
  }, []);

  const handleCancelDownload = useCallback(async () => {
    cancelledRef.current = true;
    await voiceAsset.cancel.invoke({ assetId: KOKORO_ASSET.id }).catch(() => {});
    setDownloadState('idle');
  }, []);

  const handleProviderChange = useCallback(
    (value: string) => {
      onChange((current) => ({ ...current, provider: value as TextToSpeechProvider }));
    },
    [onChange]
  );

  const handleTestVoice = useCallback(() => {
    // Test playback uses window.speechSynthesis regardless of stored provider -
    // gives users a "does my output device work" sanity check before they commit
    // to downloading a local model or wiring a hosted provider key.
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(t('settings.textToSpeechTestPhrase', 'Voice check.'));
    if (typeof config.speed === 'number' && config.speed > 0) {
      utterance.rate = config.speed;
    }
    window.speechSynthesis.speak(utterance);
  }, [config.speed, t]);

  return (
    <div className='px-[12px] md:px-[32px] py-[24px] bg-[var(--color-bg-2)] rd-12px border-2 border-solid border-[var(--color-border-2)]'>
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
            <WaylandSelect value={config.provider} onChange={handleProviderChange} className='flex-1'>
              <WaylandSelect.Option value='kokoro-local'>
                {t('settings.textToSpeechProviderKokoroLocal')}
              </WaylandSelect.Option>
              <WaylandSelect.Option value='system-native'>
                {t('settings.textToSpeechProviderSystemNative')}
              </WaylandSelect.Option>
            </WaylandSelect>
            <Button size='small' onClick={handleTestVoice}>
              {t('settings.textToSpeechTestVoice', 'Test voice')}
            </Button>
          </div>
        </Form.Item>

        <Form.Item label={t('settings.textToSpeechVoice')}>
          <Input value={config.voice} onChange={(value) => onChange((current) => ({ ...current, voice: value }))} />
        </Form.Item>

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
            checked={config.autoReadResponses}
            onChange={(checked) => onChange((current) => ({ ...current, autoReadResponses: checked }))}
          />
        </Form.Item>

        {config.provider === 'kokoro-local' && (
          <Form.Item label={t('settings.textToSpeechDownloadModel')}>
            <div className='flex flex-col gap-8px'>
              {downloadState === 'downloading' ? (
                <div className='flex items-center gap-8px'>
                  <Progress percent={0} animation className='flex-1' />
                  <Button size='mini' onClick={handleCancelDownload}>
                    {t('settings.textToSpeechCancelDownload')}
                  </Button>
                </div>
              ) : installed ? (
                <div className='flex items-center justify-between gap-8px h-32px px-12px rd-8px bg-[var(--color-fill-2)]'>
                  <span className='flex items-center gap-8px text-12px text-[var(--success)]'>
                    <CheckCircle2 size={14} />
                    {t('settings.textToSpeechModelInstalled', { defaultValue: 'Installed' })}
                  </span>
                  <Button
                    type='text'
                    size='mini'
                    icon={<RotateCcw size={12} />}
                    onClick={handleDownloadKokoro}
                    className='text-12px text-t-tertiary'
                  >
                    {t('settings.textToSpeechRedownload', { defaultValue: 'Re-download' })}
                  </Button>
                </div>
              ) : (
                <Button type='outline' onClick={handleDownloadKokoro} size='small'>
                  {t('settings.textToSpeechDownloadModel')}
                </Button>
              )}
              {downloadState === 'error' && (
                <span className='text-12px text-[var(--danger)]'>
                  {t('settings.textToSpeechDownloadError')}: {errorMsg}
                </span>
              )}
            </div>
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
