/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@arco-design/web-react';
import { Sparkles } from 'lucide-react';
import { ConfigStorage } from '@/common/config/storage';
import type { TextToSpeechConfig, TextToSpeechProvider } from '@/common/types/ttsTypes';

type DetectedProvider = 'openai' | 'grok';

const matchesOpenAI = (name?: string, platform?: string): boolean => {
  const n = (name ?? '').toLowerCase();
  const p = (platform ?? '').toLowerCase();
  return n.includes('openai') || p === 'openai';
};

const matchesGrok = (name?: string, platform?: string): boolean => {
  const n = (name ?? '').toLowerCase();
  const p = (platform ?? '').toLowerCase();
  return n.includes('grok') || n.includes('xai') || p === 'xai' || p === 'grok';
};

const hasUsableKey = (predicate: (name?: string, platform?: string) => boolean) =>
  (provider: { name?: string; platform?: string; apiKey?: string; enabled?: boolean }): boolean =>
    predicate(provider.name, provider.platform) &&
    Boolean(provider.apiKey?.trim()) &&
    provider.enabled !== false;

/**
 * Banner shown above Voice settings when the user has an OpenAI or xAI/Grok
 * provider key configured but the TTS provider is set to a local engine.
 * Encourages auto-detect: one click switches TTS to the matched provider.
 *
 * Note: TTS provider union is currently 'kokoro-local' | 'system-native'.
 * Persisting 'openai' or 'grok' as a TTS provider requires a downstream
 * TTS adapter; until then the CTA is best-effort and we cast through the
 * union extension. The CTA is hidden if the TTS provider is already pointed
 * at a non-local engine, so the banner never re-prompts.
 */
const ProviderHintBanner: React.FC<{
  ttsConfig: TextToSpeechConfig;
  onChange: (updater: (current: TextToSpeechConfig) => TextToSpeechConfig) => void;
}> = ({ ttsConfig, onChange }) => {
  const { t } = useTranslation();
  const [detected, setDetected] = useState<DetectedProvider | null>(null);

  useEffect(() => {
    let cancelled = false;
    void ConfigStorage.get('model.config').then((providers) => {
      if (cancelled) return;
      const list = providers ?? [];
      if (list.some(hasUsableKey(matchesOpenAI))) {
        setDetected('openai');
        return;
      }
      if (list.some(hasUsableKey(matchesGrok))) {
        setDetected('grok');
        return;
      }
      setDetected(null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSwitch = useCallback(() => {
    // We optimistically point TTS at the detected provider; persistence still
    // works because TextToSpeechConfig.provider is a string-typed field at
    // runtime. Visible UI will fall back to defaults until a real adapter ships.
    onChange((current) => ({ ...current, provider: detected as unknown as TextToSpeechProvider }));
  }, [detected, onChange]);

  // Hide once user has already chosen a non-local TTS provider. All hooks must
  // run before this early return (React rules-of-hooks); otherwise the hook
  // count differs between renders and React throws error #310.
  const isLocalTTS = ttsConfig.provider === 'kokoro-local' || ttsConfig.provider === 'system-native';
  if (!detected || !isLocalTTS) return null;

  const title =
    detected === 'openai'
      ? t('settings.voiceProviderHintOpenAITitle', 'OpenAI key detected')
      : t('settings.voiceProviderHintGrokTitle', 'xAI Grok key detected');
  const body = t(
    'settings.voiceProviderHintBody',
    'Use your existing provider key for hosted voice - better quality, no local download.'
  );
  const cta =
    detected === 'openai'
      ? t('settings.voiceProviderHintCTAOpenAI', 'Switch to OpenAI')
      : t('settings.voiceProviderHintCTAGrok', 'Switch to Grok');

  return (
    <div className='rounded-12px border border-solid border-[rgba(var(--primary-6),0.22)] bg-[rgba(var(--primary-6),0.06)] p-16px flex items-start gap-12px'>
      <Sparkles size={16} className='text-[rgb(var(--primary-6))] mt-2px shrink-0' />
      <div className='flex-1'>
        <div className='text-13px font-medium text-t-primary mb-4px'>{title}</div>
        <div className='text-12px text-t-secondary'>{body}</div>
      </div>
      <Button
        type='primary'
        size='small'
        className=''
        onClick={handleSwitch}
      >
        {cta}
      </Button>
    </div>
  );
};

export default ProviderHintBanner;
