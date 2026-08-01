/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildVoiceReceipt,
  hostedVoiceCostUnavailable,
  onDeviceVoiceCost,
  type VoiceReceiptDraft,
} from '@/common/voice/voiceReceipt';
import { VoiceAdapterRegistry } from '@/common/voice/adapterRegistry';
import { describe, expect, it } from 'vitest';

const draft = (overrides: Partial<VoiceReceiptDraft> = {}): VoiceReceiptDraft => ({
  modality: 'stt',
  provider: 'openai',
  model: 'whisper-1',
  turnId: 'stt-abc',
  startedAt: 1_000,
  completedAt: 1_250,
  terminalState: 'completed',
  audioInputBytes: 42,
  audioOutputBytes: 0,
  characterCount: 0,
  transcriptCharacterCount: 11,
  requestDigest: 'a'.repeat(64),
  responseDigest: 'b'.repeat(64),
  requestBytes: 42,
  responseBytes: 11,
  cost: hostedVoiceCostUnavailable(),
  ...overrides,
});

describe('buildVoiceReceipt', () => {
  it('derives id, identity, and measured timing from observed boundary values', () => {
    const receipt = buildVoiceReceipt(draft());

    expect(receipt.id).toBe('voc-stt-stt-abc');
    expect(receipt.authority).toBe('desktop');
    expect(receipt.identity).toEqual({ turnId: 'stt-abc', correlationId: 'stt-abc' });
    expect(receipt.observedAt).toBe(1_250);
    expect(receipt.timing).toEqual({
      status: 'authoritative',
      startedAt: 1_000,
      completedAt: 1_250,
      durationMs: 250,
    });
  });

  it('never reports negative duration when the clock is non-monotonic', () => {
    const receipt = buildVoiceReceipt(draft({ startedAt: 2_000, completedAt: 1_900 }));
    expect(receipt.timing.durationMs).toBe(0);
  });

  it('carries observed usage counts verbatim', () => {
    const receipt = buildVoiceReceipt(draft({ audioInputBytes: 7, transcriptCharacterCount: 3 }));
    expect(receipt.usage).toEqual({
      status: 'observed',
      audioInputBytes: 7,
      audioOutputBytes: 0,
      characterCount: 0,
      transcriptCharacterCount: 3,
    });
  });

  it('prefers an explicit correlationId when supplied', () => {
    const receipt = buildVoiceReceipt(draft({ correlationId: 'conv-9' }));
    expect(receipt.identity).toEqual({ turnId: 'stt-abc', correlationId: 'conv-9' });
  });

  it('supports every terminal state', () => {
    expect(buildVoiceReceipt(draft({ terminalState: 'failed' })).terminalState).toBe('failed');
    expect(buildVoiceReceipt(draft({ terminalState: 'cancelled' })).terminalState).toBe('cancelled');
  });
});

describe('voice cost estimates', () => {
  it('reports zero marginal cost for on-device inference', () => {
    expect(onDeviceVoiceCost()).toEqual({
      status: 'estimated',
      amount: 0,
      currency: 'USD',
      basis: 'on-device inference; no marginal provider cost',
    });
  });

  it('reports hosted cost as honestly unavailable rather than fabricating a number', () => {
    const cost = hostedVoiceCostUnavailable();
    expect(cost.status).toBe('unavailable');
    expect(cost).not.toHaveProperty('amount');
  });
});

describe('VoiceAdapterRegistry', () => {
  type FakeAdapter = { provider: 'a' | 'b'; label: string };
  const make = () => new VoiceAdapterRegistry<'a' | 'b', FakeAdapter>();

  it('registers and resolves adapters by provider key', () => {
    const registry = make().register({ provider: 'a', label: 'alpha' });
    expect(registry.resolve('a').label).toBe('alpha');
    expect(registry.has('a')).toBe(true);
    expect(registry.has('b')).toBe(false);
    expect(registry.providers()).toEqual(['a']);
  });

  it('fails closed on an unregistered provider instead of a silent default', () => {
    expect(() => make().resolve('b')).toThrow('no voice adapter registered for provider: b');
  });

  it('rejects duplicate registration of the same provider', () => {
    const registry = make().register({ provider: 'a', label: 'alpha' });
    expect(() => registry.register({ provider: 'a', label: 'dup' })).toThrow(
      'voice adapter already registered for provider: a'
    );
  });
});
