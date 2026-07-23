/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { buildSttTurnReceipt, buildTtsTurnReceipt, sha256Hex } from '@process/services/voice/voiceReceiptFactory';
import { describe, expect, it } from 'vitest';

const sha = (data: Uint8Array | string) =>
  createHash('sha256')
    .update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data)
    .digest('hex');

describe('sha256Hex', () => {
  it('digests bytes and text to 64-char lowercase hex matching node crypto', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(sha256Hex(bytes)).toBe(sha(bytes));
    expect(sha256Hex('hello world')).toBe(sha('hello world'));
    expect(sha256Hex('hello world')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('buildSttTurnReceipt', () => {
  const audio = new Uint8Array([9, 8, 7, 6]);

  it('derives an stt receipt from the observed audio-in / transcript-out boundary', () => {
    const receipt = buildSttTurnReceipt({
      turnId: 'stt-1',
      provider: 'openai',
      model: 'whisper-1',
      onDevice: false,
      audioBytes: audio,
      transcript: 'hello world',
      startedAt: 100,
      completedAt: 460,
      terminalState: 'completed',
    });

    expect(receipt.modality).toBe('stt');
    expect(receipt.provider).toBe('openai');
    expect(receipt.model).toBe('whisper-1');
    expect(receipt.timing.durationMs).toBe(360);
    expect(receipt.usage).toEqual({
      status: 'observed',
      audioInputBytes: 4,
      audioOutputBytes: 0,
      characterCount: 0,
      transcriptCharacterCount: 'hello world'.length,
    });
    expect(receipt.content).toEqual({
      requestDigest: sha(audio),
      responseDigest: sha('hello world'),
      requestBytes: 4,
      responseBytes: Buffer.byteLength('hello world', 'utf8'),
    });
  });

  it('estimates zero cost for an on-device (whisper-local) transcription', () => {
    const receipt = buildSttTurnReceipt({
      turnId: 'stt-2',
      provider: 'whisper-local',
      model: 'base',
      onDevice: true,
      audioBytes: audio,
      transcript: 'ok',
      startedAt: 0,
      completedAt: 10,
      terminalState: 'completed',
    });
    expect(receipt.cost).toEqual({
      status: 'estimated',
      amount: 0,
      currency: 'USD',
      basis: 'on-device inference; no marginal provider cost',
    });
  });

  it('reports hosted cost as unavailable rather than guessing', () => {
    const receipt = buildSttTurnReceipt({
      turnId: 'stt-3',
      provider: 'deepgram',
      model: 'nova-2',
      onDevice: false,
      audioBytes: audio,
      transcript: 'x',
      startedAt: 0,
      completedAt: 5,
      terminalState: 'completed',
    });
    expect(receipt.cost.status).toBe('unavailable');
  });
});

describe('buildTtsTurnReceipt', () => {
  const out = new Uint8Array([1, 2, 3, 4, 5]);

  it('derives a tts receipt from the observed text-in / audio-out boundary', () => {
    const receipt = buildTtsTurnReceipt({
      turnId: 'tts-1',
      provider: 'openai',
      model: 'gpt-4o-mini-tts',
      onDevice: false,
      text: 'speak this',
      audio: out,
      startedAt: 200,
      completedAt: 500,
      terminalState: 'completed',
    });

    expect(receipt.modality).toBe('tts');
    expect(receipt.usage).toEqual({
      status: 'observed',
      audioInputBytes: 0,
      audioOutputBytes: 5,
      characterCount: 'speak this'.length,
      transcriptCharacterCount: 0,
    });
    expect(receipt.content.requestDigest).toBe(sha('speak this'));
    expect(receipt.content.responseDigest).toBe(sha(out));
    expect(receipt.cost.status).toBe('unavailable');
  });

  it('estimates zero cost for on-device synthesis (kokoro-local / system-native)', () => {
    const receipt = buildTtsTurnReceipt({
      turnId: 'tts-2',
      provider: 'kokoro-local',
      model: 'kokoro-local:en-us',
      onDevice: true,
      text: 'hi',
      audio: out,
      startedAt: 0,
      completedAt: 1,
      terminalState: 'completed',
    });
    expect(receipt.cost).toEqual({
      status: 'estimated',
      amount: 0,
      currency: 'USD',
      basis: 'on-device inference; no marginal provider cost',
    });
  });
});
