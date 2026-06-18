/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** One frame of synthesized audio. Non-streaming engines emit exactly one with final=true. */
export type TtsChunk = {
  data: Uint8Array;
  mimeType: string;
  seq: number;
  final: boolean;
};

export type EngineAvailability = { ok: boolean; reason?: string };

export type TtsSynthesisOpts = { voice?: string; speed?: number };

export type EngineErrorKind = 'auth' | 'quota' | 'rate-limit' | 'network' | 'internal';

/** Typed engine failure so the chain runner can decide demotion vs failover. */
export class EngineError extends Error {
  constructor(public readonly kind: EngineErrorKind, message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

/**
 * A text-to-speech engine. Streaming-first: synthesize() emits chunks via
 * onChunk and resolves when the utterance is complete. Implementations
 * resolve/reject normally - the CHAIN RUNNER converts errors to envelopes;
 * engines themselves never cross the IPC bridge directly.
 */
export type TtsEngine = {
  readonly id: string;
  readonly local: boolean;
  readonly streaming: boolean;
  available(): Promise<EngineAvailability>;
  voices(): Promise<{ id: string; label: string }[]>;
  synthesize(
    text: string,
    opts: TtsSynthesisOpts,
    onChunk: (c: TtsChunk) => void,
    signal?: AbortSignal,
  ): Promise<void>;
  warmup?(): Promise<void>;
  dispose?(): Promise<void>;
};

export type SttEvent = { text: string; final: boolean };

export type SttEngine = {
  readonly id: string;
  readonly local: boolean;
  readonly streaming: boolean;
  available(): Promise<EngineAvailability>;
  transcribe(
    audio: { data: Uint8Array; mimeType: string; fileName: string },
    onEvent: (e: SttEvent) => void,
    signal?: AbortSignal,
  ): Promise<void>;
};
