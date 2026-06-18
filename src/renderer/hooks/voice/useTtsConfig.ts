/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useState } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import { normalizeTextToSpeechConfig, type TextToSpeechConfig } from '@/common/types/ttsTypes';

export const TTS_CONFIG_CHANGED_EVENT = 'wayland:tts-config-changed';

/** Single source of truth for the TTS config in the renderer. Loads on mount,
 * stays in sync via TTS_CONFIG_CHANGED_EVENT, persists + broadcasts on update. */
export const useTtsConfig = (): [TextToSpeechConfig, (next: Partial<TextToSpeechConfig>) => void] => {
  const [config, setConfig] = useState<TextToSpeechConfig>(() => normalizeTextToSpeechConfig());

  useEffect(() => {
    let cancelled = false;
    void ConfigStorage.get('tools.textToSpeech').then((stored) => {
      if (!cancelled) setConfig(normalizeTextToSpeechConfig(stored ?? undefined));
    });
    const handler = (event: Event) => {
      const next = (event as CustomEvent<TextToSpeechConfig>).detail;
      if (next) setConfig(normalizeTextToSpeechConfig(next));
    };
    window.addEventListener(TTS_CONFIG_CHANGED_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(TTS_CONFIG_CHANGED_EVENT, handler);
    };
  }, []);

  const update = useCallback((patch: Partial<TextToSpeechConfig>) => {
    setConfig((current) => {
      const next = normalizeTextToSpeechConfig({ ...current, ...patch });
      void ConfigStorage.set('tools.textToSpeech', next).catch(() => {});
      window.dispatchEvent(new CustomEvent(TTS_CONFIG_CHANGED_EVENT, { detail: next }));
      return next;
    });
  }, []);

  return [config, update];
};
