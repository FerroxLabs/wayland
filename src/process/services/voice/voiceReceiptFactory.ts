/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import type { SpeechToTextProvider } from '@/common/types/speech';
import type { TextToSpeechProvider } from '@/common/types/ttsTypes';
import {
  buildVoiceReceipt,
  hostedVoiceCostUnavailable,
  onDeviceVoiceCost,
  type VoiceReceipt,
  type VoiceReceiptTerminalState,
} from '@/common/voice/voiceReceipt';

/** sha256 of the observed payload (bytes or UTF-8 text) as lowercase hex. */
export const sha256Hex = (data: Uint8Array | string): string =>
  createHash('sha256')
    .update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data)
    .digest('hex');

/**
 * Builds the receipt for one speech-to-text turn from observed boundary values:
 * the audio bytes we posted and the transcript text we received back.
 */
export const buildSttTurnReceipt = (args: {
  turnId: string;
  provider: SpeechToTextProvider;
  model: string;
  onDevice: boolean;
  audioBytes: Uint8Array;
  transcript: string;
  startedAt: number;
  completedAt: number;
  terminalState: VoiceReceiptTerminalState;
  correlationId?: string;
}): VoiceReceipt =>
  buildVoiceReceipt({
    modality: 'stt',
    provider: args.provider,
    model: args.model,
    turnId: args.turnId,
    correlationId: args.correlationId,
    startedAt: args.startedAt,
    completedAt: args.completedAt,
    terminalState: args.terminalState,
    audioInputBytes: args.audioBytes.byteLength,
    audioOutputBytes: 0,
    characterCount: 0,
    transcriptCharacterCount: args.transcript.length,
    requestDigest: sha256Hex(args.audioBytes),
    responseDigest: sha256Hex(args.transcript),
    requestBytes: args.audioBytes.byteLength,
    responseBytes: Buffer.byteLength(args.transcript, 'utf8'),
    cost: args.onDevice ? onDeviceVoiceCost() : hostedVoiceCostUnavailable(),
  });

/**
 * Builds the receipt for one text-to-speech turn from observed boundary values:
 * the input text we submitted and the audio bytes we received back.
 */
export const buildTtsTurnReceipt = (args: {
  turnId: string;
  provider: TextToSpeechProvider;
  model: string;
  onDevice: boolean;
  text: string;
  audio: Uint8Array;
  startedAt: number;
  completedAt: number;
  terminalState: VoiceReceiptTerminalState;
  correlationId?: string;
}): VoiceReceipt =>
  buildVoiceReceipt({
    modality: 'tts',
    provider: args.provider,
    model: args.model,
    turnId: args.turnId,
    correlationId: args.correlationId,
    startedAt: args.startedAt,
    completedAt: args.completedAt,
    terminalState: args.terminalState,
    audioInputBytes: 0,
    audioOutputBytes: args.audio.byteLength,
    characterCount: args.text.length,
    transcriptCharacterCount: 0,
    requestDigest: sha256Hex(args.text),
    responseDigest: sha256Hex(args.audio),
    requestBytes: Buffer.byteLength(args.text, 'utf8'),
    responseBytes: args.audio.byteLength,
    cost: args.onDevice ? onDeviceVoiceCost() : hostedVoiceCostUnavailable(),
  });
