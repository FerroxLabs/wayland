import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigStorage } from '@/common/config/storage';
import type { SpeechToTextConfig } from '@/common/types/speech';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import {
  DEFAULT_SPEECH_TO_TEXT_CONFIG,
  SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT,
  SpeechToTextSettingsSection,
  normalizeSpeechToTextConfig,
} from '@renderer/components/settings/SettingsModal/contents/ToolsModalContent';

const VoiceSettings: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SpeechToTextConfig>(DEFAULT_SPEECH_TO_TEXT_CONFIG);

  useEffect(() => {
    let cancelled = false;
    void ConfigStorage.get('tools.speechToText').then((stored) => {
      if (!cancelled) setConfig(normalizeSpeechToTextConfig(stored));
    });

    const handler = (event: Event) => {
      const next = (event as CustomEvent<SpeechToTextConfig>).detail;
      if (next) setConfig(normalizeSpeechToTextConfig(next));
    };
    window.addEventListener(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, handler);
    };
  }, []);

  const handleChange = useCallback(
    (updater: (current: SpeechToTextConfig) => SpeechToTextConfig) => {
      setConfig((prev) => {
        const next = updater(prev);
        ConfigStorage.set('tools.speechToText', next).catch((err) => {
          console.error('[VoiceSettings] persist failed:', err);
        });
        window.dispatchEvent(new CustomEvent(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, { detail: next }));
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
        'Speech-to-text providers used by the chat box on desktop and WebUI. Toggle on to enable voice input.'
      )}
    >
      <SpeechToTextSettingsSection config={config} onChange={handleChange} />
    </SettingsPageShell>
  );
};

export default VoiceSettings;
