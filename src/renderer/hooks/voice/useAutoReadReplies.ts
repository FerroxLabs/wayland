/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef } from 'react';
import { useTtsConfig } from './useTtsConfig';
import { useVoiceChatPrefs } from './useVoiceChatPrefs';
import { resolveSpeakState } from '@/common/types/voiceChatPrefs';
import { toSpeakableText } from '@/common/voice/speakableText';
import { playStreamedAudio, stopVoicePlayback } from '@/renderer/utils/voicePlayback';
import { useUserDisplayName } from '@/renderer/hooks/system/useUserDisplayName';
import { ConfigStorage } from '@/common/config/storage';
import { voiceSynth } from '@/common/adapter/ipcBridge';

export type FailoverNotice = { failedEngine: string; fellBackTo: string; error: string };

export type LatestAssistant = { id: string; done: boolean; text: string } | null;

export type AutoReadAction = { speak: true; messageId: string; text: string } | { speak: false };

/** Pure decision: should the latest assistant message be spoken now? */
export const computeAutoReadAction = (args: {
  enabled: boolean;
  speakState: boolean;
  lastSpokenId: string | null;
  latestAssistant: LatestAssistant;
}): AutoReadAction => {
  const m = args.latestAssistant;
  if (!args.enabled || !args.speakState || !m || !m.done) return { speak: false };
  if (m.id === args.lastSpokenId) return { speak: false };
  // text here is already the extracted speakable text (caller extracts)
  if (!m.text) return { speak: false };
  return { speak: true, messageId: m.id, text: m.text };
};

/**
 * Auto-read controller. Mount once inside the active conversation view.
 * Watches `latestAssistant` (id + done + raw markdown); when the effective
 * speak state is on and a new assistant turn completes, plays its prose
 * aloud via the streaming chain. Fires once per message.
 */
export const useAutoReadReplies = (args: {
  conversationId: string | undefined;
  latestAssistant: { id: string; done: boolean; rawText: string } | null;
  /** Called with chain failover notices after a reply is spoken, so the mount
   * site can surface them inline in the conversation. */
  onFailover?: (notices: FailoverNotice[]) => void;
}): void => {
  const [ttsConfig] = useTtsConfig();
  const [chatPrefs] = useVoiceChatPrefs();
  const { resolvedName: displayName } = useUserDisplayName();
  const lastSpokenIdRef = useRef<string | null>(null);
  const spokenNameRef = useRef<string>('');
  const warmedConversationRef = useRef<string | null>(null);

  useEffect(() => {
    void ConfigStorage.get('user.spokenName').then((s) => {
      spokenNameRef.current = (s as string) ?? '';
    });
  }, []);

  // Pre-warm the active engine (start the persistent worker + load the model)
  // before the user's first reply lands, so the first auto-read is near
  // real-time. Once per conversation (re-warm is cheap/idempotent server-side,
  // but the ref keeps us from spamming on every render).
  useEffect(() => {
    const speakState = resolveSpeakState({
      conversationId: args.conversationId,
      systemDefault: ttsConfig.autoReadDefault,
      prefs: chatPrefs,
    });
    if (!ttsConfig.enabled || !speakState || !args.conversationId) return;
    if (warmedConversationRef.current === args.conversationId) return;
    warmedConversationRef.current = args.conversationId;
    void voiceSynth.warmup.invoke({ config: ttsConfig });
  }, [args.conversationId, ttsConfig, chatPrefs]);

  // Stop playback when the user navigates to a different conversation.
  useEffect(() => {
    return () => stopVoicePlayback();
  }, [args.conversationId]);

  useEffect(() => {
    const speakState = resolveSpeakState({
      conversationId: args.conversationId,
      systemDefault: ttsConfig.autoReadDefault,
      prefs: chatPrefs,
    });
    const m = args.latestAssistant;
    const speakable =
      m && m.done ? toSpeakableText(m.rawText, { displayName, spokenName: spokenNameRef.current }) : '';
    const action = computeAutoReadAction({
      enabled: ttsConfig.enabled,
      speakState,
      lastSpokenId: lastSpokenIdRef.current,
      latestAssistant: m ? { id: m.id, done: m.done, text: speakable } : null,
    });
    if (action.speak) {
      lastSpokenIdRef.current = action.messageId;
      void playStreamedAudio({ text: action.text, config: ttsConfig }).then((r) => {
        if (r.notices && r.notices.length > 0) args.onFailover?.(r.notices);
      });
    }
  }, [args.conversationId, args.latestAssistant, ttsConfig, chatPrefs, displayName]);
};
