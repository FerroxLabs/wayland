/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { registerTtsEngine, getTtsEngine, listTtsEngines, _resetRegistryForTest } from '@process/services/voice/engine/registry';
import type { TtsEngine } from '@process/services/voice/engine/types';

const fakeEngine = (id: string, local = true): TtsEngine => ({
  id,
  local,
  streaming: false,
  available: async () => ({ ok: true }),
  voices: async () => [{ id: 'v1', label: 'Voice 1' }],
  synthesize: async () => {},
});

describe('voice engine registry', () => {
  it('registers and retrieves a TTS engine by id', () => {
    _resetRegistryForTest();
    registerTtsEngine(fakeEngine('kokoro-local'));
    expect(getTtsEngine('kokoro-local')?.id).toBe('kokoro-local');
  });

  it('returns null for unknown engine ids', () => {
    _resetRegistryForTest();
    expect(getTtsEngine('nope')).toBeNull();
  });

  it('lists engines in registration order', () => {
    _resetRegistryForTest();
    registerTtsEngine(fakeEngine('a'));
    registerTtsEngine(fakeEngine('b'));
    expect(listTtsEngines().map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('re-registering an id replaces the engine (idempotent init)', () => {
    _resetRegistryForTest();
    registerTtsEngine(fakeEngine('a', true));
    registerTtsEngine(fakeEngine('a', false));
    expect(listTtsEngines()).toHaveLength(1);
    expect(getTtsEngine('a')?.local).toBe(false);
  });
});
