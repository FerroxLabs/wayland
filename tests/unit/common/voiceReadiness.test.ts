/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpeechToTextConfig } from '@/common/types/speech';
import { HOSTED_VOICE_CONSENT_VERSION, type HostedVoiceConsent } from '@/common/types/voiceConsent';
import { resolveVoiceSessionReadiness, type VoiceReadinessInput } from '@/common/voice/voiceReadiness';
import { normalizeSpeechToTextConfig } from '@/renderer/components/settings/SettingsModal/contents/ToolsModalContent';
import { describe, expect, it } from 'vitest';

const consentFor = (...providers: HostedVoiceConsent['acceptedProviders']): HostedVoiceConsent => ({
  version: HOSTED_VOICE_CONSENT_VERSION,
  acceptedProviders: providers,
  updatedAt: 1,
});

/**
 * An EXPLICIT user configuration. `origin: 'user'` is what every row in the
 * table below has always meant - each one describes a provider the user
 * deliberately selected, and the reason each is refused.
 *
 * It has to be said out loud now because the ladder resolves `origin:'default'`
 * to the on-device floor and never to a hosted provider, so a fixture without
 * it no longer describes the situation it is named after. Nothing about the
 * refusals below is relaxed; the fixture just states the premise it relied on.
 */
const stt = (overrides: Partial<SpeechToTextConfig> = {}): Partial<SpeechToTextConfig> => ({
  enabled: true,
  origin: 'user',
  provider: 'whisper-local',
  ...overrides,
});

describe('resolveVoiceSessionReadiness', () => {
  /**
   * The positive control. A table where every row is `false` proves only that
   * the function can say no - this row is the one that proves it can say yes,
   * and it is the exact configuration a default macOS user lands on.
   */
  it('is ready for the all-local macOS path', () => {
    const result = resolveVoiceSessionReadiness({
      ttsConfig: { enabled: true, provider: 'system-native' },
      sttConfig: stt(),
      platform: 'darwin',
      audioContextState: 'running',
    });
    expect(result).toEqual({
      ready: true,
      reason: 'ok',
      ttsProvider: 'system-native',
      sttProvider: 'whisper-local',
    });
  });

  const table: Array<[string, VoiceReadinessInput, string]> = [
    [
      'speech output switched off by the user',
      { ttsConfig: { enabled: false, provider: 'system-native' }, sttConfig: stt() },
      'tts-disabled-by-user',
    ],
    [
      'kokoro selected - it has never had a binary',
      { ttsConfig: { enabled: true, provider: 'kokoro-local' }, sttConfig: stt() },
      'kokoro-unavailable',
    ],
    [
      'system-native off macOS - `say` does not exist there',
      { ttsConfig: { enabled: true, provider: 'system-native' }, sttConfig: stt(), platform: 'win32' },
      'no-local-adapter',
    ],
    [
      'system-native on linux',
      { ttsConfig: { enabled: true, provider: 'system-native' }, sttConfig: stt(), platform: 'linux' },
      'no-local-adapter',
    ],
    [
      'hosted speech out with no accepted disclosure',
      { ttsConfig: { enabled: true, provider: 'openai' }, sttConfig: stt() },
      'tts-needs-consent',
    ],
    [
      'hosted speech out accepted for a DIFFERENT provider',
      { ttsConfig: { enabled: true, provider: 'openai' }, sttConfig: stt(), consent: consentFor('deepgram') },
      'tts-needs-consent',
    ],
    [
      'transcription switched off deliberately by the user',
      { ttsConfig: { enabled: true, provider: 'system-native' }, sttConfig: stt({ enabled: false }) },
      'stt-disabled',
    ],
    [
      'hosted transcriber with no key',
      { ttsConfig: { enabled: true, provider: 'system-native' }, sttConfig: stt({ provider: 'openai' }) },
      'stt-unavailable',
    ],
    [
      'hosted transcriber with a key but no accepted disclosure',
      {
        ttsConfig: { enabled: true, provider: 'system-native' },
        sttConfig: stt({ provider: 'openai', openai: { apiKey: 'sk-test', model: 'whisper-1' } }),
      },
      'stt-needs-consent',
    ],
    [
      'flux voice with a key but no accepted disclosure',
      {
        ttsConfig: { enabled: true, provider: 'system-native' },
        sttConfig: stt({ provider: 'flux-voice', fluxVoice: { apiKey: 'sk-flux', model: 'whisper-1' } }),
      },
      'stt-needs-consent',
    ],
    [
      'a suspended AudioContext outranks everything - nothing can sound',
      {
        ttsConfig: { enabled: true, provider: 'system-native' },
        sttConfig: stt(),
        audioContextState: 'suspended',
      },
      'audio-blocked',
    ],
    [
      'a closed AudioContext blocks too',
      { ttsConfig: { enabled: true, provider: 'system-native' }, sttConfig: stt(), audioContextState: 'closed' },
      'audio-blocked',
    ],
  ];

  it.each(table)('reports %s as %s', (_name, input, expected) => {
    const result = resolveVoiceSessionReadiness(input);
    expect(result.reason).toBe(expected);
    expect(result.ready).toBe(false);
  });

  it('accepts both hosted legs once both disclosures are accepted', () => {
    const result = resolveVoiceSessionReadiness({
      ttsConfig: { enabled: true, provider: 'openai' },
      sttConfig: stt({ provider: 'deepgram', deepgram: { apiKey: 'dg-test', model: 'nova' } }),
      consent: consentFor('openai', 'deepgram'),
      platform: 'win32',
    });
    expect(result).toEqual({ ready: true, reason: 'ok', ttsProvider: 'openai', sttProvider: 'deepgram' });
  });

  /**
   * Consent for the speaking leg is not consent for the listening leg. They are
   * two disclosures to two potentially different companies, and the microphone
   * is the louder of the two.
   */
  it('does not let consent for the speaking leg cover the microphone', () => {
    const result = resolveVoiceSessionReadiness({
      ttsConfig: { enabled: true, provider: 'openai' },
      sttConfig: stt({ provider: 'openai', openai: { apiKey: 'sk-test', model: 'whisper-1' } }),
      consent: consentFor('openai'),
    });
    // Same provider name, so one acceptance genuinely covers both parties here.
    expect(result.ready).toBe(true);

    const crossed = resolveVoiceSessionReadiness({
      ttsConfig: { enabled: true, provider: 'openai' },
      sttConfig: stt({ provider: 'deepgram', deepgram: { apiKey: 'dg', model: 'nova' } }),
      consent: consentFor('openai'),
    });
    expect(crossed.reason).toBe('stt-needs-consent');
  });

  /**
   * The factory default is no longer a refusal at all. This is the row that
   * replaces "transcription off - the factory default": a profile that has
   * never been configured resolves to the on-device floor and is READY, which
   * is the entire point of the ladder.
   */
  it('is ready on a default-origin profile with nothing configured', () => {
    // Through the real normalizer, because that is where a default-origin
    // config's `enabled` is re-seeded from the current factory floor. Handing
    // the resolver a raw `enabled:false` would test a state the app never
    // produces.
    const result = resolveVoiceSessionReadiness({
      ttsConfig: { enabled: true, provider: 'system-native' },
      sttConfig: normalizeSpeechToTextConfig({ enabled: false, provider: 'openai' } as never),
      platform: 'darwin',
    });
    expect(result.ready).toBe(true);
    expect(result.sttProvider).toBe('whisper-local');
  });

  it('treats a stale consent version as no consent at all', () => {
    const result = resolveVoiceSessionReadiness({
      ttsConfig: { enabled: true, provider: 'openai' },
      sttConfig: stt(),
      consent: { version: 0, acceptedProviders: ['openai'], updatedAt: 1 },
    });
    expect(result.reason).toBe('tts-needs-consent');
  });

  it('does not treat an uncreated AudioContext as blocked', () => {
    const result = resolveVoiceSessionReadiness({
      ttsConfig: { enabled: true, provider: 'system-native' },
      sttConfig: stt(),
      audioContextState: undefined,
    });
    expect(result.ready).toBe(true);
  });

  it('reports the providers it judged even when it says no', () => {
    const result = resolveVoiceSessionReadiness({
      ttsConfig: { enabled: false, provider: 'openai' },
      sttConfig: stt({ provider: 'deepgram' }),
    });
    expect(result.ttsProvider).toBe('openai');
    expect(result.sttProvider).toBe('deepgram');
  });
});
