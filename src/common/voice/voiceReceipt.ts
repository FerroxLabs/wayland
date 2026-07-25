/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * VOC-04 — Authoritative VoiceReceipt.
 *
 * One receipt per completed speech turn (speech-to-text OR text-to-speech).
 * Modelled on the OUT-01 execution-receipt lineage (`ExecutionReceipt`,
 * `AuthoritativeUsage`, `AuthoritativeLatency`): every field is DERIVED FROM THE
 * OBSERVED request/response boundary the desktop itself measured — never from a
 * model's self-report.
 *
 *   - `provider`/`model` are the RESOLVED transport the desktop actually called.
 *   - `timing` is wall-clock measured around the provider call.
 *   - `usage` counts bytes/characters the desktop observed crossing the boundary.
 *   - `content` digests the exact observed request/response payloads.
 *   - `cost` is an ESTIMATE (or honestly `unavailable`) — a hosted provider's
 *     authoritative cost only exists once a provider/Flux cost receipt is wired
 *     into the voice path, which it is not yet.
 *
 * `authority: 'desktop'` states plainly that the desktop is the observer of
 * record here, not a provider-signed authority. The receipt is advisory in the
 * UI and MUST NOT gate speech.
 */

export type VoiceModality = 'stt' | 'tts';

export type VoiceReceiptTerminalState = 'completed' | 'failed' | 'cancelled';

export type VoiceReceiptIdentity = Readonly<{
  /** Stable id for this single speech turn. */
  turnId: string;
  /** Correlates this turn with the wider conversation/execution when available. */
  correlationId: string;
}>;

/** Wall-clock timing measured by the desktop around the provider call. */
export type VoiceTimingObservation = Readonly<{
  status: 'authoritative';
  startedAt: number;
  completedAt: number;
  durationMs: number;
}>;

/** Quantities the desktop observed crossing the request/response boundary. */
export type VoiceUsageObservation = Readonly<{
  status: 'observed';
  /** Audio bytes submitted (STT). Zero for TTS. */
  audioInputBytes: number;
  /** Audio bytes produced (TTS). Zero for STT. */
  audioOutputBytes: number;
  /** Characters submitted for synthesis (TTS). Zero for STT. */
  characterCount: number;
  /** Characters returned as transcript (STT). Zero for TTS. */
  transcriptCharacterCount: number;
}>;

/**
 * Cost is derived, never claimed. On-device providers have no marginal provider
 * cost (estimated 0). Hosted providers are honestly `unavailable` until a
 * provider/Flux cost receipt is wired into the voice path.
 */
export type VoiceCostEstimate =
  | Readonly<{ status: 'estimated'; amount: number; currency: string; basis: string }>
  | Readonly<{ status: 'unavailable'; reason: string }>;

/** Digests of the exact observed payloads — proves identity without retaining content. */
export type VoiceContentIdentity = Readonly<{
  /** sha256 of the observed request payload (STT audio bytes / TTS input text). */
  requestDigest: string;
  /** sha256 of the observed response payload (STT transcript / TTS audio bytes). */
  responseDigest: string;
  requestBytes: number;
  responseBytes: number;
}>;

export type VoiceReceipt = Readonly<{
  id: string;
  modality: VoiceModality;
  authority: 'desktop';
  provider: string;
  model: string;
  identity: VoiceReceiptIdentity;
  observedAt: number;
  terminalState: VoiceReceiptTerminalState;
  timing: VoiceTimingObservation;
  usage: VoiceUsageObservation;
  cost: VoiceCostEstimate;
  content: VoiceContentIdentity;
}>;

export type VoiceReceiptDraft = Readonly<{
  modality: VoiceModality;
  provider: string;
  model: string;
  turnId: string;
  correlationId?: string;
  startedAt: number;
  completedAt: number;
  terminalState: VoiceReceiptTerminalState;
  audioInputBytes: number;
  audioOutputBytes: number;
  characterCount: number;
  transcriptCharacterCount: number;
  requestDigest: string;
  responseDigest: string;
  requestBytes: number;
  responseBytes: number;
  cost: VoiceCostEstimate;
}>;

/** Estimated cost for on-device (local) providers: no marginal provider spend. */
export const onDeviceVoiceCost = (): VoiceCostEstimate => ({
  status: 'estimated',
  amount: 0,
  currency: 'USD',
  basis: 'on-device inference; no marginal provider cost',
});

/**
 * Hosted providers carry no authoritative voice cost yet — the provider/Flux
 * cost-receipt path that OUT-01 uses for execution is not wired to the voice
 * boundary. We refuse to fabricate a number and report it honestly unavailable.
 */
export const hostedVoiceCostUnavailable = (): VoiceCostEstimate => ({
  status: 'unavailable',
  reason: 'authoritative hosted-provider voice cost requires a provider/Flux cost receipt not yet emitted for the voice path',
});

/** Assembles a VoiceReceipt from already-observed boundary values. Pure. */
export const buildVoiceReceipt = (draft: VoiceReceiptDraft): VoiceReceipt => {
  const observedAt = draft.completedAt;
  return {
    id: `voc-${draft.modality}-${draft.turnId}`,
    modality: draft.modality,
    authority: 'desktop',
    provider: draft.provider,
    model: draft.model,
    identity: {
      turnId: draft.turnId,
      correlationId: draft.correlationId ?? draft.turnId,
    },
    observedAt,
    terminalState: draft.terminalState,
    timing: {
      status: 'authoritative',
      startedAt: draft.startedAt,
      completedAt: draft.completedAt,
      durationMs: Math.max(0, draft.completedAt - draft.startedAt),
    },
    usage: {
      status: 'observed',
      audioInputBytes: draft.audioInputBytes,
      audioOutputBytes: draft.audioOutputBytes,
      characterCount: draft.characterCount,
      transcriptCharacterCount: draft.transcriptCharacterCount,
    },
    cost: draft.cost,
    content: {
      requestDigest: draft.requestDigest,
      responseDigest: draft.responseDigest,
      requestBytes: draft.requestBytes,
      responseBytes: draft.responseBytes,
    },
  };
};
