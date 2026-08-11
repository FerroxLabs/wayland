/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { HOSTED_VOICE_CONSENT_VERSION, type HostedVoiceConsent } from '@/common/types/voiceConsent';
import {
  resolveVoiceLeg,
  type ConnectedVoiceCredentials,
  type VoiceLeg,
  type VoiceReadinessInput,
} from '@/common/voice/voiceReadiness';
import {
  DEFAULT_SPEECH_TO_TEXT_CONFIG,
  normalizeSpeechToTextConfig,
} from '@/renderer/components/settings/SettingsModal/contents/ToolsModalContent';
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
   */
  it('re-seeds a legacy disabled default-origin profile onto the floor', () => {
    const legacy = normalizeSpeechToTextConfig({ enabled: false, provider: 'openai' } as never);
    expect(legacy.origin).toBe('default');
    expect(resolveVoiceLeg('in', { sttConfig: legacy }).clickable).toBe(true);
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

  it('names the cause on a platform with no local synthesizer', () => {
    const leg = resolveVoiceLeg('out', { platform: 'win32' });
    expect(leg.status).toBe('unsupported');
    expect(leg.cause).toBe('no-local-adapter');
    expect(leg.clickable).toBe(false);
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
 * {Flux connected / OpenAI key / neither} x {consent granted / not granted}, on
 * a FACTORY profile with no manual setup. Every cell must resolve to a working
 * provider on BOTH legs.
 *
 * A cell FAILS on any of: stt-disabled, stt-unavailable, stt-needs-consent,
 * tts-needs-consent, or a speech-out leg with no provider. `stt-needs-consent`
 * counting as a FAILURE is the whole point - an earlier draft omitted it, the
 * table went green, and the user still hit a disclosure wall on first tap.
 */
const FAILING_CAUSES = ['stt-disabled', 'stt-unavailable', 'stt-needs-consent', 'tts-needs-consent'] as const;

const credentialCells: Array<[string, ConnectedVoiceCredentials]> = [
  ['Flux connected', { flux: true }],
  ['OpenAI key connected', { openai: true }],
  ['neither connected', {}],
];

const consentCells: Array<[string, HostedVoiceConsent | null]> = [
  ['consent granted', consentFor('openai', 'deepgram', 'flux-voice')],
  ['consent NOT granted', null],
];

describe('factory-profile truth table, both legs, no manual setup', () => {
  for (const [credentialLabel, connectedCredentials] of credentialCells) {
    for (const [consentLabel, consent] of consentCells) {
      it(`${credentialLabel} / ${consentLabel} works on both legs`, () => {
        const input: VoiceReadinessInput = {
          sttConfig: factorySttConfig(),
          platform: 'darwin',
          connectedCredentials,
          consent,
        };

        const inbound = resolveVoiceLeg('in', input);
        const outbound = resolveVoiceLeg('out', input);

        for (const leg of [inbound, outbound]) {
          expect(FAILING_CAUSES).not.toContain(leg.cause);
          expect(leg.status).toBe('ready');
          expect(leg.clickable).toBe(true);
        }
        // A speech-out leg with no provider is a failing cell.
        expect(outbound.provider).not.toBeNull();
        expect(inbound.provider).not.toBeNull();
      });
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
      resolveVoiceLeg('out', { platform: 'darwin', ttsConfig: { enabled: true, provider: 'kokoro-local' } }),
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
