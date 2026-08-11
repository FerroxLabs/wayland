/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpeechToTextConfig } from '@/common/types/speech';
import { resolveVoiceLeg } from '@/common/voice/voiceReadiness';
import { normalizeSpeechToTextConfig } from '@/renderer/components/settings/SettingsModal/contents/ToolsModalContent';
import { describe, expect, it } from 'vitest';

/**
 * WHAT THIS FILE PROVES: the MIGRATION, driven over real legacy-shaped JSON
 * that has NO `origin` field. Asserting over a fixture that already carries
 * `origin` would prove only that a normalizer preserves a field it was handed,
 * which is not the claim.
 *
 * WHAT IT CANNOT PROVE: anything about audio. This is a pure data coercion.
 */

/**
 * Configs exactly as they exist on disk today, parsed from JSON so nothing in
 * the test can accidentally supply a field the real stored value lacks.
 */
const legacyJson = (raw: string): SpeechToTextConfig => JSON.parse(raw) as SpeechToTextConfig;

describe('pre-origin stored configs migrate to origin:default', () => {
  const legacyShapes: Array<[string, string]> = [
    ['the literal factory default as it shipped', '{"enabled":false,"provider":"openai"}'],
    [
      'a profile that opened Voice settings but changed nothing',
      '{"enabled":false,"provider":"openai","openai":{"apiKey":"","baseUrl":"","language":"","model":"whisper-1"}}',
    ],
    ['a deliberate keyless-OpenAI choice, indistinguishable from the above', '{"enabled":true,"provider":"openai"}'],
    ['a profile with speech-in switched on and nothing else set', '{"enabled":true}'],
    ['a deepgram user', '{"enabled":true,"provider":"deepgram","deepgram":{"apiKey":"dg","model":"nova-2"}}'],
  ];

  for (const [label, raw] of legacyShapes) {
    it(`${label} becomes origin:'default'`, () => {
      const stored = legacyJson(raw);
      // Control: the input genuinely has no origin, so this is a migration and
      // not a preservation.
      expect('origin' in stored).toBe(false);

      expect(normalizeSpeechToTextConfig(stored).origin).toBe('default');
    });
  }

  it('a config written AFTER this ships keeps its user origin', () => {
    const stored = legacyJson('{"enabled":true,"provider":"deepgram","origin":"user"}');
    expect(normalizeSpeechToTextConfig(stored).origin).toBe('user');
  });

  /**
   * The forward-only guarantee, stated as a test. A legacy keyless-OpenAI
   * choice IS re-seeded onto the floor, deliberately, because nothing on disk
   * distinguishes it from a factory profile. The same choice made after this
   * ships is NOT re-seeded.
   */
  it('re-seeds a legacy keyless-OpenAI choice but not a post-ship one', () => {
    const legacy = normalizeSpeechToTextConfig(legacyJson('{"enabled":true,"provider":"openai"}'));
    expect(resolveVoiceLeg('in', { sttConfig: legacy }).provider).toBe('whisper-local');

    const postShip = normalizeSpeechToTextConfig(legacyJson('{"enabled":true,"provider":"openai","origin":"user"}'));
    const leg = resolveVoiceLeg('in', { sttConfig: postShip });
    expect(leg.provider).toBe('openai');
    expect(leg.cause).toBe('stt-unavailable');
  });
});

describe('provider-validity coercion', () => {
  /**
   * `provider` used to be spread straight through with NO validation, unlike
   * the TTS normalizer. A stored value outside the union reached the resolver
   * and matched nothing.
   */
  const invalidProviders = ['whisper-cpp', 'azure', '', 'OPENAI', 'null'];

  for (const provider of invalidProviders) {
    it(`drops the out-of-union provider ${JSON.stringify(provider)} and forces origin:'default'`, () => {
      const stored = legacyJson(JSON.stringify({ enabled: true, provider, origin: 'user' }));
      const normalized = normalizeSpeechToTextConfig(stored);

      expect(normalized.provider).toBeUndefined();
      // Forced to 'default' REGARDLESS of the prior stated intent: an intent
      // naming an engine that does not exist cannot be honoured.
      expect(normalized.origin).toBe('default');
      // And the profile therefore reseeds to the on-device floor.
      expect(resolveVoiceLeg('in', { sttConfig: normalized }).provider).toBe('whisper-local');
    });
  }

  /**
   * The positive control for the same method. Every member of the real union
   * survives, so the assertions above are testing validity and not testing a
   * function that rejects everything.
   */
  it('preserves every valid union member, with origin intact', () => {
    for (const provider of ['openai', 'deepgram', 'whisper-local', 'flux-voice']) {
      const stored = legacyJson(JSON.stringify({ enabled: true, provider, origin: 'user' }));
      const normalized = normalizeSpeechToTextConfig(stored);
      expect(normalized.provider).toBe(provider);
      expect(normalized.origin).toBe('user');
    }
  });

  it('leaves an absent provider absent rather than inventing a hosted one', () => {
    const normalized = normalizeSpeechToTextConfig(legacyJson('{"enabled":true}'));
    expect(normalized.provider).toBeUndefined();
    expect(resolveVoiceLeg('in', { sttConfig: normalized }).provider).toBe('whisper-local');
  });
});
