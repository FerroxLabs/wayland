/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { resolveFluxSttDefault } from '@/process/utils/fluxSttDefault';
import type { SpeechToTextConfig } from '@/common/types/speech';

const enabledConfig = (overrides: Partial<SpeechToTextConfig> = {}): SpeechToTextConfig => ({
  enabled: true,
  provider: 'openai',
  ...overrides,
});

describe('resolveFluxSttDefault', () => {
  it('seeds Flux Voice when Flux is connected and no STT engine is configured', () => {
    const result = resolveFluxSttDefault({
      current: enabledConfig(), // openai provider, no apiKey
      fluxKey: 'sk-flux-test',
    });
    expect(result).not.toBeNull();
    expect(result?.provider).toBe('flux-voice');
    expect(result?.fluxVoice?.apiKey).toBe('sk-flux-test');
    expect(result?.fluxVoice?.baseUrl).toBe('https://api.fluxrouter.ai/v1');
    expect(result?.fluxVoice?.model).toBe('flux-voice');
    // Flux creds must NOT leak into the shared openai block (#277).
    expect(result?.openai).toBeUndefined();
  });

  it('seeds Flux Voice when no config exists at all (first boot)', () => {
    const result = resolveFluxSttDefault({ current: undefined, fluxKey: 'sk-flux-test' });
    expect(result).not.toBeNull();
    expect(result?.provider).toBe('flux-voice');
    expect(result?.fluxVoice?.apiKey).toBe('sk-flux-test');
  });

  it('preserves enabled/autoSend from the existing config', () => {
    const result = resolveFluxSttDefault({
      current: enabledConfig({ enabled: true, autoSend: true }),
      fluxKey: 'sk-flux-test',
    });
    expect(result?.enabled).toBe(true);
    expect(result?.autoSend).toBe(true);
  });

  /**
   * Rewritten, not relaxed: the SUBJECT of the old assertion - the
   * `enabled: false` write - is the thing being deleted. Seeding a provider and
   * then writing `enabled:false` produced a config main's own gate rejects with
   * STT_DISABLED. The assertion now pins the opposite, which is the behaviour
   * that makes the seed usable.
   */
  it('enables speech-to-text when it seeds into an empty config', () => {
    const result = resolveFluxSttDefault({ current: undefined, fluxKey: 'sk-flux-test' });
    expect(result?.enabled).toBe(true);
  });

  /**
   * The case the guard above did NOT cover, and the common one.
   *
   * `current?.enabled ?? true` only reached `true` when there was no config at
   * all. Every profile that upgraded from a version before this shipped HAS a
   * config and it says `enabled:false`, because that was the factory default -
   * so the seed re-emitted `enabled:false` alongside a working transcriber, and
   * main's own gate throws STT_DISABLED on it.
   *
   * There is no live defect today only because the one caller checks `enabled`
   * and throws before it gets here. That is a property of the caller, not of
   * this function, and it is not what the function should depend on. Driven as
   * raw JSON with no `origin`, exactly as it sits on disk.
   */
  it('never re-emits a legacy enabled:false alongside the provider it just seeded', () => {
    for (const json of [
      '{"enabled":false,"provider":"openai"}',
      '{"enabled":false}',
      '{"enabled":false,"provider":"openai","autoSend":true}',
    ]) {
      const result = resolveFluxSttDefault({ current: JSON.parse(json), fluxKey: 'sk-flux-test' });
      expect(result?.provider).toBe('flux-voice');
      expect(result?.enabled).toBe(true);
    }
  });

  it('does NOT seed when Flux is not connected (no key)', () => {
    expect(resolveFluxSttDefault({ current: undefined, fluxKey: undefined })).toBeNull();
    expect(resolveFluxSttDefault({ current: enabledConfig(), fluxKey: undefined })).toBeNull();
  });

  it('does NOT seed when the user already has an OpenAI API key configured', () => {
    const result = resolveFluxSttDefault({
      current: enabledConfig({ provider: 'openai', openai: { apiKey: 'sk-oai-user', model: 'whisper-1' } }),
      fluxKey: 'sk-flux-test',
    });
    expect(result).toBeNull();
  });

  it('does NOT seed when the user chose Deepgram', () => {
    const result = resolveFluxSttDefault({
      current: enabledConfig({ provider: 'deepgram', deepgram: { apiKey: 'dg-key', model: 'nova-2' } }),
      fluxKey: 'sk-flux-test',
    });
    expect(result).toBeNull();
  });

  it('does NOT seed when the user chose Whisper (local)', () => {
    const result = resolveFluxSttDefault({
      current: enabledConfig({ provider: 'whisper-local', whisperLocal: { model: 'base' } }),
      fluxKey: 'sk-flux-test',
    });
    expect(result).toBeNull();
  });

  it('does NOT seed when already using flux-voice (idempotent)', () => {
    const result = resolveFluxSttDefault({
      current: enabledConfig({
        provider: 'flux-voice',
        openai: { apiKey: 'sk-flux-test', model: 'flux-voice' },
      }),
      fluxKey: 'sk-flux-test',
    });
    expect(result).toBeNull();
  });
});
