/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveLocalTtsProvider, type TextToSpeechProvider } from '@/common/types/ttsTypes';
import { HOSTED_VOICE_CONSENT_VERSION, type HostedVoiceConsent } from '@/common/types/voiceConsent';
import {
  platformNativeTtsProvider,
  resolveVoiceLeg,
  resolveVoiceSessionReadiness,
  type ConnectedVoiceCredentials,
  type VoiceLeg,
  type VoiceReadinessInput,
} from '@/common/voice/voiceReadiness';
import { DEFAULT_SPEECH_TO_TEXT_CONFIG, normalizeSpeechToTextConfig } from '@/common/voice/speechToTextConfig';
import { describe, expect, it } from 'vitest';

/**
 * WHAT THIS FILE PROVES, AND WHAT IT CANNOT.
 *
 * PROVES: the resolver's decisions. Given a config, a platform, a consent record
 * and a credential picture, which provider is chosen, whether the control is
 * clickable, and which named cause comes back.
 *
 * CANNOT PROVE: that any byte reached a speaker or a microphone. jsdom has no
 * AudioContext, no HTMLMediaElement decode, no worker WASM and no OS speech
 * APIs. Nothing here says voice "works" - it says the ladder resolves the way
 * the product requires, which is a necessary and very much not sufficient part
 * of that.
 */

const consentFor = (...providers: HostedVoiceConsent['acceptedProviders']): HostedVoiceConsent => ({
  version: HOSTED_VOICE_CONSENT_VERSION,
  acceptedProviders: providers,
  updatedAt: 1,
});

/** A factory profile: nothing stored at all, read through the real normalizer. */
const factorySttConfig = () => normalizeSpeechToTextConfig(undefined);

describe('the speech-in ladder is on-device first', () => {
  it('resolves a factory profile to the bundled on-device engine, not a hosted one', () => {
    const leg = resolveVoiceLeg('in', { sttConfig: factorySttConfig() });
    expect(leg).toEqual<VoiceLeg>({
      direction: 'in',
      status: 'ready',
      cause: 'ok',
      provider: 'whisper-local',
      clickable: true,
    });
  });

  /**
   * The single most important assertion in the lane. A ladder of
   * "flux -> openai -> local" hands the most common fresh-install user a legal
   * disclosure modal on their first tap, because `hostedVoiceConsentGranted` is
   * fail-closed and flux-voice is a hosted provider.
   */
  it('does NOT route a connected-Flux factory profile to Flux Voice', () => {
    const leg = resolveVoiceLeg('in', {
      sttConfig: factorySttConfig(),
      connectedCredentials: { flux: true },
      consent: null,
    });
    expect(leg.provider).toBe('whisper-local');
    expect(leg.cause).not.toBe('stt-needs-consent');
    expect(leg.clickable).toBe(true);
  });

  it('does NOT route a connected-OpenAI factory profile to OpenAI', () => {
    const leg = resolveVoiceLeg('in', {
      sttConfig: factorySttConfig(),
      connectedCredentials: { openai: true },
      consent: null,
    });
    expect(leg.provider).toBe('whisper-local');
    expect(leg.clickable).toBe(true);
  });

  /**
   * A pre-origin profile stored `enabled:false`, which is indistinguishable
   * from the old factory value. Honouring it would leave every existing install
   * exactly as broken as it is today.
   *
   * Driven RAW, through the resolver, with no normalization step in the test.
   * This assertion used to normalize its own fixture first, which meant it
   * passed against a resolver that trusts whatever it is handed - and both
   * production read paths handed it the raw value.
   */
  it('re-seeds a legacy disabled default-origin profile onto the floor', () => {
    const legacy = JSON.parse('{"enabled":false,"provider":"openai"}');
    expect(legacy.origin).toBeUndefined();
    const leg = resolveVoiceLeg('in', { sttConfig: legacy });
    expect(leg.provider).toBe('whisper-local');
    expect(leg.clickable).toBe(true);
  });

  /**
   * The verifier's own probe, kept verbatim as a row.
   *
   * `{"enabled":false,"provider":"openai"}` with `{enabled:true,
   * provider:'system-native'}` on darwin is a real upgraded macOS profile, and
   * it must come back READY through the function the session calls.
   */
  it('is ready for a real upgraded macOS profile, unnormalized', () => {
    const result = resolveVoiceSessionReadiness({
      sttConfig: JSON.parse('{"enabled":false,"provider":"openai"}'),
      ttsConfig: { enabled: true, provider: 'system-native' },
      platform: 'darwin',
    });
    expect(result).toEqual({
      ready: true,
      reason: 'ok',
      ttsProvider: 'system-native',
      sttProvider: 'whisper-local',
    });
  });

  it('honours an explicit user switch-off, because that one is distinguishable', () => {
    const chosen = normalizeSpeechToTextConfig({ enabled: false, origin: 'user' } as never);
    const leg = resolveVoiceLeg('in', { sttConfig: chosen });
    expect(leg.status).toBe('needsSetup');
    expect(leg.cause).toBe('stt-disabled');
    expect(leg.clickable).toBe(false);
  });

  it('honours an explicit hosted pick, disclosure and all', () => {
    const chosen = normalizeSpeechToTextConfig({ enabled: true, origin: 'user', provider: 'openai' } as never);
    const blocked = resolveVoiceLeg('in', { sttConfig: chosen, connectedCredentials: { openai: true } });
    expect(blocked.cause).toBe('stt-needs-consent');
    expect(blocked.clickable).toBe(false);

    const granted = resolveVoiceLeg('in', {
      sttConfig: chosen,
      connectedCredentials: { openai: true },
      consent: consentFor('openai'),
    });
    expect(granted.cause).toBe('ok');
    expect(granted.provider).toBe('openai');
  });

  it('reports an unset provider on a user-origin config as the floor, never keyless OpenAI', () => {
    const chosen = normalizeSpeechToTextConfig({ enabled: true, origin: 'user' } as never);
    const leg = resolveVoiceLeg('in', { sttConfig: chosen });
    expect(leg.provider).toBe('whisper-local');
    expect(leg.cause).toBe('ok');
  });
});

describe('the speech-out ladder is platform-native first', () => {
  it('resolves darwin with no TTS config to the platform voice', () => {
    const leg = resolveVoiceLeg('out', { platform: 'darwin' });
    expect(leg).toEqual<VoiceLeg>({
      direction: 'out',
      status: 'ready',
      cause: 'ok',
      provider: 'system-native',
      clickable: true,
    });
  });

  it('resolves win32 with no TTS config to the Windows voice', () => {
    const leg = resolveVoiceLeg('out', { platform: 'win32' });
    expect(leg).toEqual<VoiceLeg>({
      direction: 'out',
      status: 'ready',
      cause: 'ok',
      provider: 'windows-native',
      clickable: true,
    });
  });

  it('names the cause on a platform with no local synthesizer', () => {
    // Linux, which genuinely has neither `say` nor System.Speech in this build.
    const leg = resolveVoiceLeg('out', { platform: 'linux' });
    expect(leg.status).toBe('unsupported');
    expect(leg.cause).toBe('no-local-adapter');
    expect(leg.clickable).toBe(false);
    expect(leg.provider).toBeNull();
  });

  /**
   * A STORED local provider is judged against this OS, not silently corrected.
   *
   * `normalizeTextToSpeechConfig` preserves a stored provider rather than
   * rewriting a preference, so `synthesizeSystemNative` really would throw off
   * darwin - and the honest answer is the named cause plus the one-tap route to
   * the Voice panel, which is where `resolveRunnableTtsProvider` heals it.
   */
  it('does not honour an OS synthesizer belonging to a different OS', () => {
    for (const [provider, platform] of [
      ['windows-native', 'darwin'],
      ['system-native', 'win32'],
    ] as const) {
      const leg = resolveVoiceLeg('out', { ttsConfig: { enabled: true, provider }, platform });
      expect(leg.status).toBe('unsupported');
      expect(leg.cause).toBe('no-local-adapter');
      expect(leg.clickable).toBe(false);
    }
  });

  /** Flux Voice is speech-to-text ONLY and is not in the TTS union at all. */
  it('never yields flux-voice on the speaking leg', () => {
    const inputs: VoiceReadinessInput[] = [
      { platform: 'darwin', connectedCredentials: { flux: true } },
      { platform: 'win32', connectedCredentials: { flux: true }, consent: consentFor('flux-voice') },
      { platform: 'linux', connectedCredentials: { flux: true, openai: true } },
    ];
    for (const input of inputs) {
      expect(resolveVoiceLeg('out', input).provider).not.toBe('flux-voice');
    }
  });
});

/**
 * THE ACCEPTANCE TRUTH TABLE.
 *
 * {stored profile} x {platform} x {credentials} x {consent}, driven through
 * `resolveVoiceSessionReadiness` - the function production actually calls -
 * with the stored profile as RAW JSON off disk.
 *
 * The raw JSON is the whole point. An earlier version of this table built its
 * input by calling `normalizeSpeechToTextConfig` itself, while neither
 * production read path did, so it proved the ladder only for a shape the app
 * never produced. On a genuinely upgraded profile - `{enabled:false,
 * provider:'openai'}`, no `origin` field, which is the pre-origin factory
 * default and not a decision anyone made - the old resolver still said
 * `stt-disabled`. Nothing below may pre-process its input; if the resolver
 * needs a config normalized, the resolver normalizes it.
 *
 * A cell FAILS on any of: stt-disabled, stt-unavailable, stt-needs-consent,
 * tts-needs-consent, or a leg with no provider. `stt-needs-consent` counting as
 * a FAILURE is the whole point - an earlier draft omitted it, the table went
 * green, and the user still hit a disclosure wall on first tap.
 */
const FAILING_CAUSES = ['stt-disabled', 'stt-unavailable', 'stt-needs-consent', 'tts-needs-consent'] as const;

/**
 * Stored profiles as they exist ON DISK, parsed from JSON so nothing here can
 * accidentally carry a field a real config would not have. None declares
 * `origin`, because no version that has shipped ever wrote one.
 */
const storedProfileCells: Array<[string, unknown]> = [
  ['nothing stored at all', undefined],
  ['pre-origin profile, the shipped factory default', JSON.parse('{"enabled":false,"provider":"openai"}')],
  ['pre-origin profile that named Deepgram', JSON.parse('{"enabled":false,"provider":"deepgram"}')],
  [
    'pre-origin profile with a stale OpenAI key',
    JSON.parse('{"enabled":false,"provider":"openai","openai":{"apiKey":"sk-old","model":"whisper-1"}}'),
  ],
];

const credentialCells: Array<[string, ConnectedVoiceCredentials]> = [
  ['Flux connected', { flux: true }],
  ['OpenAI key connected', { openai: true }],
  ['neither connected', {}],
];

const consentCells: Array<[string, HostedVoiceConsent | null]> = [
  ['consent granted', consentFor('openai', 'deepgram', 'flux-voice')],
  ['consent NOT granted', null],
];

/**
 * The PLATFORM axis, and the honest answer on each.
 *
 * Every cell of the previous table hardcoded `darwin`, so "voice works out of
 * the box" was proved on one of the three platforms this ships to and quietly
 * assumed on the other two. Speech IN is unaffected by platform - the bundled
 * Whisper is a WASM worker with no platform story at all - so the listening
 * half of the table is a genuine cross-platform claim. Speech OUT is not: it is
 * whatever synthesizer the OS itself ships, and the third column NAMES it
 * rather than asserting a bare boolean.
 *
 * macOS has `say` (`system-native`) and Windows has System.Speech
 * (`windows-native`), both landed. Linux has neither in this build, so `null`
 * is its real answer and the row says so out loud instead of being omitted.
 *
 * This column used to be `speechOutWorks: boolean` with `win32` pinned to
 * `false` as a tripwire for `packet/wl-voice-wintts`. That lane has landed and
 * the seam (`platformNativeTtsProvider` -> `resolveLocalTtsProvider`) is wired,
 * so `win32` now carries the provider it actually resolves to. Naming the
 * provider is what keeps the row from passing for the wrong reason: a regression
 * that made Windows fall back to `system-native` would still be "working" under
 * the old boolean and is red here.
 */
const platformCells: Array<[string, string, TextToSpeechProvider | null]> = [
  ['darwin', 'darwin', 'system-native'],
  ['win32', 'win32', 'windows-native'],
  ['linux', 'linux', null],
];

describe('acceptance truth table: raw stored config, every platform, both legs', () => {
  for (const [profileLabel, storedSttJson] of storedProfileCells) {
    for (const [platformLabel, platform, nativeTtsProvider] of platformCells) {
      for (const [credentialLabel, connectedCredentials] of credentialCells) {
        for (const [consentLabel, consent] of consentCells) {
          it(`${profileLabel} on ${platformLabel} / ${credentialLabel} / ${consentLabel}`, () => {
            const input: VoiceReadinessInput = {
              // RAW. Straight off disk, exactly as `ConfigStorage.get` returns
              // it. Normalizing here is what made the old table vacuous.
              sttConfig: storedSttJson as VoiceReadinessInput['sttConfig'],
              platform,
              connectedCredentials,
              consent,
            };

            // The production entry point, not a helper assembled for the test.
            const session = resolveVoiceSessionReadiness(input);
            const inbound = resolveVoiceLeg('in', input);
            const outbound = resolveVoiceLeg('out', input);

            // LISTENING works on every platform, on every legacy profile, with
            // no setup and no disclosure. This is the lane's core claim.
            expect(FAILING_CAUSES).not.toContain(inbound.cause);
            expect(inbound.status).toBe('ready');
            expect(inbound.clickable).toBe(true);
            expect(inbound.provider).toBe('whisper-local');
            expect(session.sttProvider).toBe('whisper-local');

            if (nativeTtsProvider) {
              expect(FAILING_CAUSES).not.toContain(outbound.cause);
              expect(outbound.status).toBe('ready');
              expect(outbound.clickable).toBe(true);
              // The provider BY NAME, so macOS and Windows cannot pass for each
              // other's reasons.
              expect(outbound.provider).toBe(nativeTtsProvider);
              expect(session.ttsProvider).toBe(nativeTtsProvider);
              expect(session.ready).toBe(true);
              expect(session.reason).toBe('ok');
            } else {
              // The CURRENT Linux outcome, stated out loud.
              expect(outbound.status).toBe('unsupported');
              expect(outbound.cause).toBe('no-local-adapter');
              expect(outbound.clickable).toBe(false);
              expect(outbound.provider).toBeNull();
              expect(session.ready).toBe(false);
              expect(session.reason).toBe('no-local-adapter');
            }
          });
        }
      }
    }
  }

  /**
   * The guard that proves the table BITES. `enabled:false` is what the factory
   * default used to be, and the mutation that restores it must turn every cell
   * red rather than being absorbed.
   */
  it('the factory default is the thing the table depends on', () => {
    expect(DEFAULT_SPEECH_TO_TEXT_CONFIG.enabled).toBe(true);
    expect(DEFAULT_SPEECH_TO_TEXT_CONFIG.provider).toBeUndefined();
    expect(DEFAULT_SPEECH_TO_TEXT_CONFIG.origin).toBe('default');
  });

  /**
   * The NEGATIVE CONTROL for the raw-input claim above.
   *
   * Without this, "the table drives raw legacy JSON" is only a comment. This
   * asserts that the exact bytes the table feeds in are the broken shape: no
   * `origin`, and `enabled:false`. If a future edit quietly starts normalizing
   * the fixtures, this row is what notices.
   */
  it('feeds the resolver the broken shape, not a pre-cleaned one', () => {
    for (const [, stored] of storedProfileCells) {
      if (stored === undefined) continue;
      const raw = stored as Record<string, unknown>;
      expect(raw.origin).toBeUndefined();
      expect(raw.enabled).toBe(false);
    }
  });

  /**
   * THE SEAM, NOW SATISFIED.
   *
   * One function decides whether the OS provides a synthesizer, and it is the
   * only place in `voiceReadiness` that compares a platform string. It is a
   * delegate to `resolveLocalTtsProvider`, so this row is also what catches the
   * delegate being unwired back to a macOS-only literal - the whole table
   * follows it.
   */
  it('names the platform-native synthesizer seam', () => {
    expect(platformNativeTtsProvider('darwin')).toBe('system-native');
    expect(platformNativeTtsProvider('win32')).toBe('windows-native');
    expect(platformNativeTtsProvider('linux')).toBeNull();
    expect(platformNativeTtsProvider).toBe(resolveLocalTtsProvider);
  });
});

describe('the cold start is visible instead of silent', () => {
  it('reports warming, and refuses the click, while the on-device model loads', () => {
    const leg = resolveVoiceLeg('in', { sttConfig: factorySttConfig(), localSttReady: false });
    expect(leg.status).toBe('warming');
    expect(leg.cause).toBe('local-engine-warming');
    expect(leg.clickable).toBe(false);
  });

  it('reports ready once the model is loaded', () => {
    const leg = resolveVoiceLeg('in', { sttConfig: factorySttConfig(), localSttReady: true });
    expect(leg.status).toBe('ready');
    expect(leg.clickable).toBe(true);
  });

  /** `undefined` means "not known here" and must never warm-block. */
  it('does not warm-block when local readiness is unknown', () => {
    expect(resolveVoiceLeg('in', { sttConfig: factorySttConfig() }).status).toBe('ready');
  });
});

describe('the third leg: can this session even reply', () => {
  it('refuses BOTH directions when no model is connected', () => {
    for (const direction of ['in', 'out'] as const) {
      const leg = resolveVoiceLeg(direction, { sttConfig: factorySttConfig(), modelConnected: false });
      expect(leg.status).toBe('needsSetup');
      expect(leg.cause).toBe('no-model-connected');
      expect(leg.clickable).toBe(false);
    }
  });

  it('outranks a merely warming on-device engine, because it is the more useful truth', () => {
    const leg = resolveVoiceLeg('in', {
      sttConfig: factorySttConfig(),
      modelConnected: false,
      localSttReady: false,
    });
    expect(leg.cause).toBe('no-model-connected');
  });

  it('does not block when model connectivity is unknown', () => {
    expect(resolveVoiceLeg('in', { sttConfig: factorySttConfig() }).cause).toBe('ok');
  });
});

describe('no control is ever clickable into a dead end', () => {
  it('couples clickability to ready across every reachable leg', () => {
    const legs: VoiceLeg[] = [
      resolveVoiceLeg('in', { sttConfig: factorySttConfig() }),
      resolveVoiceLeg('in', { sttConfig: factorySttConfig(), localSttReady: false }),
      resolveVoiceLeg('in', { sttConfig: factorySttConfig(), modelConnected: false }),
      resolveVoiceLeg('in', { sttConfig: factorySttConfig(), audioContextState: 'suspended' }),
      resolveVoiceLeg('in', { sttConfig: normalizeSpeechToTextConfig({ enabled: false, origin: 'user' } as never) }),
      resolveVoiceLeg('out', { platform: 'darwin' }),
      resolveVoiceLeg('out', { platform: 'win32' }),
      // `kokoro-local` used to sit here. It is gone from the provider union
      // entirely, so the live analogue is the other unrunnable speaking leg: an
      // OS synthesizer that belongs to a different OS.
      resolveVoiceLeg('out', { platform: 'darwin', ttsConfig: { enabled: true, provider: 'windows-native' } }),
      resolveVoiceLeg('out', { platform: 'darwin', ttsConfig: { enabled: false, provider: 'system-native' } }),
    ];

    // Positive control: this set genuinely contains both outcomes, so the
    // assertion below is not vacuously true over an all-false list.
    expect(legs.some((leg) => leg.clickable)).toBe(true);
    expect(legs.some((leg) => !leg.clickable)).toBe(true);

    for (const leg of legs) {
      expect(leg.clickable).toBe(leg.status === 'ready');
      expect(leg.cause === 'ok').toBe(leg.status === 'ready');
    }
  });

  it('reports a suspended audio context as preparing, not as a failure', () => {
    const leg = resolveVoiceLeg('out', { platform: 'darwin', audioContextState: 'suspended' });
    expect(leg.status).toBe('preparing');
    expect(leg.cause).toBe('audio-blocked');
    expect(leg.clickable).toBe(false);
  });
});
