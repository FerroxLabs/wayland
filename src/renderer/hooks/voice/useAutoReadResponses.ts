/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { conversation, voiceSynth, type IResponseMessage } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import { normalizeTextToSpeechConfig, type TextToSpeechConfig } from '@/common/types/ttsTypes';
import { hostedVoiceConsentGranted, isHostedVoiceProvider, type HostedVoiceConsent } from '@/common/types/voiceConsent';
import {
  extractVoiceResponseText,
  MAX_SPOKEN_CHARACTERS,
  takeSpeakableSentences,
} from '@/common/voice/voiceResponseText';
import { createVoiceSpeechQueue, type VoiceSpeechQueue } from '@/renderer/services/voice/voiceSpeechQueue';
import { TTS_CONFIG_CHANGED_EVENT } from '@/renderer/services/voice/voiceSettingsEvents';
import { VOICE_HOSTED_CONSENT_CHANGED_EVENT } from '@/renderer/hooks/voice/useHostedVoiceConsent';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * "Auto-read Responses": speak the assistant's reply aloud as it is written,
 * for a user who is reading Chat rather than holding a voice conversation.
 *
 * The switch has been persisted since the setting existed and had no runtime
 * consumer at all, so it was a control that did nothing. This is that consumer.
 *
 * It does NOT get its own speech path. `voiceSpeechQueue` already does
 * sentence-by-sentence synthesis with a bounded number of calls in flight,
 * gapless cursor scheduling, and an epoch + `stopAll` for interruption; a second
 * implementation would be a second set of the same four bugs. What is different
 * here is only what drives the queue: there is no session machine, no
 * microphone, and no turn to re-arm, so segments are accepted unconditionally
 * and completion is simply the end of the answer.
 *
 * Three things switch it off, and all three matter:
 *  - A live voice conversation. That session owns the speaker for this surface
 *    and is already speaking this turn off the same stream, so running both
 *    would say the answer twice, over itself. Auto-read stands down entirely
 *    rather than trying to divide a turn with it.
 *  - Consent. A hosted provider POSTs the reply text off-device, and auto-read
 *    is the one speech path the user never explicitly triggers - so it is the
 *    one that must never start a hosted call on its own. The check here is
 *    fail-closed and local; main's per-call gate is still the gate.
 *  - The setting itself, live. Toggling it off mid-answer stops the answer.
 */

export type AutoReadResponsesOptions = {
  conversationId: string;
  /**
   * True while a voice conversation is live on this surface. The voice session
   * is the speaker's owner whenever it exists.
   */
  voiceSessionActive: boolean;
};

/** What a stream message's `data` carries when it carries prose. */
const contentOf = (message: IResponseMessage): string | null => {
  if (typeof message.data === 'string') return message.data;
  if (message.data && typeof message.data === 'object' && 'content' in message.data) {
    const content = (message.data as { content?: unknown }).content;
    return typeof content === 'string' ? content : null;
  }
  return null;
};

export const useAutoReadResponses = ({ conversationId, voiceSessionActive }: AutoReadResponsesOptions): void => {
  const [config, setConfig] = useState<TextToSpeechConfig | null>(null);
  const [consent, setConsent] = useState<Partial<HostedVoiceConsent> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const read = () => {
      void ConfigStorage.get('tools.textToSpeech').then((stored) => {
        if (!cancelled) setConfig(normalizeTextToSpeechConfig(stored ?? undefined));
      });
    };
    read();
    // The settings page publishes the new config with the event, so the common
    // case needs no round trip. A detail-less dispatch falls back to a read
    // rather than to the defaults - normalizing `undefined` would silently turn
    // auto-read off for someone who had it on.
    const handleConfig = (event: Event) => {
      const detail = (event as CustomEvent<TextToSpeechConfig | undefined>).detail;
      if (detail) setConfig(normalizeTextToSpeechConfig(detail));
      else read();
    };
    window.addEventListener(TTS_CONFIG_CHANGED_EVENT, handleConfig);
    return () => {
      cancelled = true;
      window.removeEventListener(TTS_CONFIG_CHANGED_EVENT, handleConfig);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const read = () => {
      void ConfigStorage.get('tools.voiceHostedConsent').then((stored) => {
        if (!cancelled) setConsent((stored as HostedVoiceConsent | undefined) ?? null);
      });
    };
    read();
    window.addEventListener(VOICE_HOSTED_CONSENT_CHANGED_EVENT, read);
    return () => {
      cancelled = true;
      window.removeEventListener(VOICE_HOSTED_CONSENT_CHANGED_EVENT, read);
    };
  }, []);

  const enabled = Boolean(
    config?.enabled &&
    config.autoReadResponses &&
    !voiceSessionActive &&
    (!isHostedVoiceProvider(config.provider) || hostedVoiceConsentGranted(config.provider, consent))
  );

  const queueRef = useRef<VoiceSpeechQueue | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  /** The assistant message being read, so a different one is a boundary. */
  const messageIdRef = useRef<string | null>(null);
  /** Raw accumulated reply, and how much of it has been handed to synthesis. */
  const bufferRef = useRef('');
  const spokenLengthRef = useRef(0);
  /** Normalized characters spoken this answer, against the per-turn cap. */
  const spokenCharsRef = useRef(0);
  const stop = useCallback(() => {
    queueRef.current?.stopAll();
    queueRef.current = null;
    messageIdRef.current = null;
    bufferRef.current = '';
    spokenLengthRef.current = 0;
    spokenCharsRef.current = 0;
  }, []);
  const stopRef = useRef(stop);
  stopRef.current = stop;

  /**
   * Auto-read has no entry gesture of its own - it starts from a stream event -
   * so the context is created on the first thing worth speaking. By then the
   * user has sent a message, which is the activation Chromium wants; if it is
   * nevertheless suspended the queue refuses by name rather than scheduling
   * against a stopped clock and going silent.
   */
  const ensureContext = useCallback((): AudioContext | null => {
    const AudioContextCtor =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : typeof window !== 'undefined'
          ? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : undefined;
    if (!AudioContextCtor) return null;
    try {
      const context = contextRef.current ?? new AudioContextCtor();
      contextRef.current = context;
      if (context.state !== 'running') void context.resume().catch(() => {});
      return context;
    } catch {
      return null;
    }
  }, []);

  const ensureQueue = useCallback((): VoiceSpeechQueue | null => {
    if (queueRef.current) return queueRef.current;
    const context = ensureContext();
    if (!context) return null;
    queueRef.current = createVoiceSpeechQueue({
      context,
      speak: (text) => voiceSynth.speak.invoke({ text }),
      // Nothing downstream tracks which chunk is sounding: there is no
      // single-valued active segment to collide with and no microphone waiting
      // on `playback_completed`.
      onSegmentStart: () => true,
      onCompleted: () => {},
      onFailed: (errorCode) => {
        // The queue marks itself abandoned before calling this, so every later
        // enqueue for this answer is already a no-op. Naming the code is all
        // that is left to do: auto-read has no surface of its own to say it on.
        console.error('[autoRead] stopped speaking:', errorCode);
      },
    });
    return queueRef.current;
  }, [ensureContext]);

  /** Hand every sentence the model has finished writing to the queue. */
  const pump = useCallback(() => {
    const { sentences } = takeSpeakableSentences(bufferRef.current.slice(spokenLengthRef.current));
    if (sentences.length === 0) return;
    const queue = ensureQueue();
    if (!queue) return;
    for (const raw of sentences) {
      spokenLengthRef.current += raw.length;
      const spoken = extractVoiceResponseText('content', raw);
      if (!spoken || spokenCharsRef.current >= MAX_SPOKEN_CHARACTERS) continue;
      spokenCharsRef.current += spoken.length;
      queue.enqueue(spoken);
    }
  }, [ensureQueue]);

  useEffect(() => {
    if (!enabled) return;
    const removeListener = conversation.responseStream.on((message) => {
      if (message.conversation_id !== conversationId) return;

      // The user said something new. Whatever is still being read is now the
      // previous subject, and talking over the next question is the worst of
      // the available behaviours.
      if (message.type === 'user_content') {
        stopRef.current();
        return;
      }

      if (message.type === 'content') {
        const chunk = contentOf(message);
        if (chunk === null) return;
        // A different assistant message is a different answer. Backends that
        // omit `msg_id` keep whatever the current answer is rather than
        // restarting on every delta.
        const messageId = message.msg_id || messageIdRef.current || 'auto-read';
        if (messageIdRef.current !== messageId) {
          stopRef.current();
          messageIdRef.current = messageId;
        }
        bufferRef.current += chunk;
        pump();
        return;
      }

      if (message.type === 'error') {
        stopRef.current();
        return;
      }

      if (message.type === 'finish') {
        if (!messageIdRef.current) return;
        // The tail after the last complete sentence never got a terminator, so
        // it is only safe to speak now. Sealing is what lets a queue that has
        // already played everything finish instead of waiting for more text.
        const tail = extractVoiceResponseText('content', bufferRef.current.slice(spokenLengthRef.current));
        spokenLengthRef.current = bufferRef.current.length;
        const queue = tail ? ensureQueue() : queueRef.current;
        if (!queue) return;
        if (tail && spokenCharsRef.current < MAX_SPOKEN_CHARACTERS) {
          spokenCharsRef.current += tail.length;
          queue.enqueue(tail);
        }
        queue.seal();
      }
    });
    return () => {
      removeListener();
      // Covers all three exits: the setting went off, a voice session took the
      // speaker, or the surface navigated to another conversation.
      stopRef.current();
    };
  }, [conversationId, enabled, ensureQueue, pump]);

  useEffect(
    () => () => {
      stopRef.current();
      // One context, closed with the surface. Leaking one per conversation
      // walks into Chromium's per-page context ceiling.
      void contextRef.current?.close().catch(() => {});
      contextRef.current = null;
    },
    []
  );
};
