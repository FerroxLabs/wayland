/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useState } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import {
  DEFAULT_SENSITIVITY_BIAS,
  DEFAULT_SILENCE_MS,
  normalizeVoiceChatPrefs,
  resolveSensitivityBias,
  resolveSilenceMs,
  type VoiceChatPrefs,
} from '@/common/types/voiceChatPrefs';
import { VOICE_CHAT_PREFS_CHANGED_EVENT } from '@/renderer/hooks/voice/useVoiceChatPrefs';

type OpenVoicePrefs = {
  silenceMs(conversationId: string | undefined): number;
  setConversationSilence(conversationId: string, ms: number): void;
  sensitivityBias(conversationId: string | undefined): number;
  setConversationSensitivity(conversationId: string, bias: number): void;
};

export const useOpenVoicePrefs = (): OpenVoicePrefs => {
  const [silenceOverrides, setSilenceOverrides] = useState<Record<string, number>>({});
  const [systemDefault, setSystemDefault] = useState<number>(DEFAULT_SILENCE_MS);
  const [sensitivityOverrides, setSensitivityOverrides] = useState<Record<string, number>>({});
  const [systemSensitivityDefault, setSystemSensitivityDefault] =
    useState<number>(DEFAULT_SENSITIVITY_BIAS);

  useEffect(() => {
    let cancelled = false;

    // Load system-wide default silence on mount
    void ConfigStorage.get('tools.voiceOpenDefaults').then((stored) => {
      if (!cancelled) {
        const ms = stored?.silenceMs;
        setSystemDefault(typeof ms === 'number' ? ms : DEFAULT_SILENCE_MS);
        const bias = stored?.sensitivityBias;
        setSystemSensitivityDefault(typeof bias === 'number' ? bias : DEFAULT_SENSITIVITY_BIAS);
      }
    });

    // Load per-conversation silence + sensitivity overrides on mount
    void ConfigStorage.get('tools.voiceChatPrefs').then((stored) => {
      if (!cancelled) {
        const prefs = normalizeVoiceChatPrefs(stored ?? undefined);
        setSilenceOverrides(prefs.silenceOverrides ?? {});
        setSensitivityOverrides(prefs.sensitivityOverrides ?? {});
      }
    });

    // Listen for prefs changes (from this hook or useVoiceChatPrefs)
    const handler = (event: Event) => {
      const next = (event as CustomEvent<VoiceChatPrefs>).detail;
      if (next) {
        const normalized = normalizeVoiceChatPrefs(next);
        setSilenceOverrides(normalized.silenceOverrides ?? {});
        setSensitivityOverrides(normalized.sensitivityOverrides ?? {});
      }
    };
    window.addEventListener(VOICE_CHAT_PREFS_CHANGED_EVENT, handler);

    return () => {
      cancelled = true;
      window.removeEventListener(VOICE_CHAT_PREFS_CHANGED_EVENT, handler);
    };
  }, []);

  const silenceMsFn = useCallback(
    (conversationId: string | undefined): number =>
      resolveSilenceMs({ conversationId, systemDefault, overrides: silenceOverrides }),
    [systemDefault, silenceOverrides],
  );

  const setConversationSilence = useCallback((conversationId: string, ms: number): void => {
    setSilenceOverrides((current) => {
      const next: Record<string, number> = { ...current, [conversationId]: ms };
      void ConfigStorage.get('tools.voiceChatPrefs').then((stored) => {
        const prefs = normalizeVoiceChatPrefs(stored ?? undefined);
        const updatedPrefs: VoiceChatPrefs = { ...prefs, silenceOverrides: next };
        void ConfigStorage.set('tools.voiceChatPrefs', updatedPrefs).catch(() => {});
        window.dispatchEvent(
          new CustomEvent(VOICE_CHAT_PREFS_CHANGED_EVENT, { detail: updatedPrefs }),
        );
      });
      return next;
    });
  }, []);

  const sensitivityBiasFn = useCallback(
    (conversationId: string | undefined): number =>
      resolveSensitivityBias({
        conversationId,
        systemDefault: systemSensitivityDefault,
        overrides: sensitivityOverrides,
      }),
    [systemSensitivityDefault, sensitivityOverrides],
  );

  const setConversationSensitivity = useCallback((conversationId: string, bias: number): void => {
    setSensitivityOverrides((current) => {
      const next: Record<string, number> = { ...current, [conversationId]: bias };
      void ConfigStorage.get('tools.voiceChatPrefs').then((stored) => {
        const prefs = normalizeVoiceChatPrefs(stored ?? undefined);
        const updatedPrefs: VoiceChatPrefs = { ...prefs, sensitivityOverrides: next };
        void ConfigStorage.set('tools.voiceChatPrefs', updatedPrefs).catch(() => {});
        window.dispatchEvent(
          new CustomEvent(VOICE_CHAT_PREFS_CHANGED_EVENT, { detail: updatedPrefs }),
        );
      });
      return next;
    });
  }, []);

  return {
    silenceMs: silenceMsFn,
    setConversationSilence,
    sensitivityBias: sensitivityBiasFn,
    setConversationSensitivity,
  };
};
