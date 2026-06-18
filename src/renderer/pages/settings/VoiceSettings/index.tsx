/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigStorage } from '@/common/config/storage';
import type { SpeechToTextConfig } from '@/common/types/speech';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';
import { DEFAULT_TTS_CONFIG, normalizeTextToSpeechConfig } from '@/common/types/ttsTypes';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import {
  DEFAULT_SPEECH_TO_TEXT_CONFIG,
  SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT,
  TTS_CONFIG_CHANGED_EVENT,
  SpeechToTextSettingsSection,
  TextToSpeechSettingsSection,
  normalizeSpeechToTextConfig,
} from '@renderer/components/settings/SettingsModal/contents/ToolsModalContent';
import { useUserDisplayName } from '@renderer/hooks/system/useUserDisplayName';
import ProviderHintBanner from './ProviderHintBanner';
import { PronunciationField } from './PronunciationField';

const VoiceSettings: React.FC = () => {
  const { t } = useTranslation();
  const [sttConfig, setSttConfig] = useState<SpeechToTextConfig>(DEFAULT_SPEECH_TO_TEXT_CONFIG);
  const [ttsConfig, setTtsConfig] = useState<TextToSpeechConfig>(DEFAULT_TTS_CONFIG);
  const { resolvedName } = useUserDisplayName();

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      ConfigStorage.get('tools.speechToText'),
      ConfigStorage.get('tools.textToSpeech'),
    ]).then(([storedStt, storedTts]) => {
      if (cancelled) return;
      setSttConfig(normalizeSpeechToTextConfig(storedStt));
      setTtsConfig(normalizeTextToSpeechConfig(storedTts ?? undefined));
    });

    const sttHandler = (event: Event) => {
      const next = (event as CustomEvent<SpeechToTextConfig>).detail;
      if (next) setSttConfig(normalizeSpeechToTextConfig(next));
    };
    const ttsHandler = (event: Event) => {
      const next = (event as CustomEvent<TextToSpeechConfig>).detail;
      if (next) setTtsConfig(normalizeTextToSpeechConfig(next));
    };
    window.addEventListener(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, sttHandler);
    window.addEventListener(TTS_CONFIG_CHANGED_EVENT, ttsHandler);
    return () => {
      cancelled = true;
      window.removeEventListener(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, sttHandler);
      window.removeEventListener(TTS_CONFIG_CHANGED_EVENT, ttsHandler);
    };
  }, []);

  const handleSttChange = useCallback(
    (updater: (current: SpeechToTextConfig) => SpeechToTextConfig) => {
      setSttConfig((prev) => {
        const next = updater(prev);
        ConfigStorage.set('tools.speechToText', next).catch((err) => {
          console.error('[VoiceSettings] stt persist failed:', err);
        });
        window.dispatchEvent(new CustomEvent(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, { detail: next }));
        return next;
      });
    },
    []
  );

  const handleTtsChange = useCallback(
    (updater: (current: TextToSpeechConfig) => TextToSpeechConfig) => {
      setTtsConfig((prev) => {
        const next = updater(prev);
        ConfigStorage.set('tools.textToSpeech', next).catch((err) => {
          console.error('[VoiceSettings] tts persist failed:', err);
        });
        window.dispatchEvent(new CustomEvent(TTS_CONFIG_CHANGED_EVENT, { detail: next }));
        return next;
      });
    },
    []
  );

  return (
    <SettingsPageShell
      title={t('settings.voicePage.title', 'Voice')}
      subtitle={t(
        'settings.voicePage.subtitle',
        'Speech-to-text and text-to-speech settings for the chat box. Toggle sections on to enable voice input and output.'
      )}
    >
      <div className='space-y-16px'>
        <ProviderHintBanner ttsConfig={ttsConfig} onChange={handleTtsChange} />
        <SpeechToTextSettingsSection config={sttConfig} onChange={handleSttChange} />
        <TextToSpeechSettingsSection config={ttsConfig} onChange={handleTtsChange} />
        <PronunciationField displayName={resolvedName} ttsConfig={ttsConfig} />
      </div>
    </SettingsPageShell>
  );
};

export default VoiceSettings;
