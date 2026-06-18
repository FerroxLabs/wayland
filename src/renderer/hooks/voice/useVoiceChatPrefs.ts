/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useState } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import {
  normalizeVoiceChatPrefs,
  type ChatSpeakOverride,
  type VoiceChatPrefs,
} from '@/common/types/voiceChatPrefs';

export const VOICE_CHAT_PREFS_CHANGED_EVENT = 'wayland:voice-chat-prefs-changed';

/** Per-conversation speak overrides, synced across components. */
export const useVoiceChatPrefs = (): [VoiceChatPrefs, (conversationId: string, override: ChatSpeakOverride) => void] => {
  const [prefs, setPrefs] = useState<VoiceChatPrefs>(() => normalizeVoiceChatPrefs());

  useEffect(() => {
    let cancelled = false;
    void ConfigStorage.get('tools.voiceChatPrefs').then((stored) => {
      if (!cancelled) setPrefs(normalizeVoiceChatPrefs(stored ?? undefined));
    });
    const handler = (event: Event) => {
      const next = (event as CustomEvent<VoiceChatPrefs>).detail;
      if (next) setPrefs(normalizeVoiceChatPrefs(next));
    };
    window.addEventListener(VOICE_CHAT_PREFS_CHANGED_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(VOICE_CHAT_PREFS_CHANGED_EVENT, handler);
    };
  }, []);

  const setOverride = useCallback((conversationId: string, override: ChatSpeakOverride) => {
    setPrefs((current) => {
      const overrides = { ...current.overrides };
      if (override === 'inherit') delete overrides[conversationId];
      else overrides[conversationId] = override;
      const next = { overrides };
      void ConfigStorage.set('tools.voiceChatPrefs', next).catch(() => {});
      window.dispatchEvent(new CustomEvent(VOICE_CHAT_PREFS_CHANGED_EVENT, { detail: next }));
      return next;
    });
  }, []);

  return [prefs, setOverride];
};
