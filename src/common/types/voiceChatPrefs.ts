/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** Per-chat speak-replies override. 'inherit' = follow the system-wide default. */
export type ChatSpeakOverride = 'inherit' | 'on' | 'off';

/** Persisted under ConfigStorage key 'tools.voiceChatPrefs'. */
export type VoiceChatPrefs = {
  overrides: Record<string, ChatSpeakOverride>;
  /** Per-conversation open-voice silence-gap overrides (ms). Keyed by conversationId. */
  silenceOverrides?: Record<string, number>;
  /** Per-conversation mic-sensitivity margin-bias overrides (RMS units). Keyed by conversationId. */
  sensitivityOverrides?: Record<string, number>;
};

export const DEFAULT_VOICE_CHAT_PREFS: VoiceChatPrefs = { overrides: {} };

export const normalizeVoiceChatPrefs = (prefs?: Partial<VoiceChatPrefs>): VoiceChatPrefs => ({
  overrides: prefs?.overrides ?? {},
  silenceOverrides: prefs?.silenceOverrides ?? {},
  sensitivityOverrides: prefs?.sensitivityOverrides ?? {},
});

/** The effective "speak this chat's replies aloud" decision. */
export const resolveSpeakState = (args: {
  conversationId: string | undefined;
  systemDefault: boolean;
  prefs: VoiceChatPrefs;
}): boolean => {
  const override = args.conversationId ? args.prefs.overrides[args.conversationId] : undefined;
  if (override === 'on') return true;
  if (override === 'off') return false;
  return args.systemDefault; // inherit / absent
};

/** Tri-state cycle for the per-chat speaker button. */
export const cycleSpeakOverride = (current: ChatSpeakOverride | undefined): ChatSpeakOverride => {
  switch (current) {
    case undefined:
    case 'inherit':
      return 'on';
    case 'on':
      return 'off';
    case 'off':
      return 'inherit';
  }
};

export const DEFAULT_SILENCE_MS = 1200;
export const SILENCE_MS_BOUNDS = { min: 600, max: 4000 } as const;
const SILENCE_STEP_MS = 600;

/** Per-conversation open-voice silence overrides (separate map from speak overrides). */
export type VoiceSilencePrefs = { silenceOverrides: Record<string, number> };

export const resolveSilenceMs = (args: {
  conversationId: string | undefined;
  systemDefault: number;
  overrides: Record<string, number>;
}): number => {
  const o = args.conversationId ? args.overrides[args.conversationId] : undefined;
  return typeof o === 'number' ? o : args.systemDefault;
};

export const stepSilenceMs = (current: number, direction: 'longer' | 'shorter'): number => {
  const next = direction === 'longer' ? current + SILENCE_STEP_MS : current - SILENCE_STEP_MS;
  return Math.min(SILENCE_MS_BOUNDS.max, Math.max(SILENCE_MS_BOUNDS.min, next));
};

export const DEFAULT_SENSITIVITY_BIAS = 0;
export const SENSITIVITY_BIAS_BOUNDS = { min: -0.06, max: 0.2 } as const;
const SENSITIVITY_STEP = 0.04;

/**
 * The effective mic-sensitivity margin bias (RMS units) for a conversation.
 * A higher bias means LESS sensitive (more headroom required before a frame
 * counts as speech); a lower/negative bias means MORE sensitive.
 */
export const resolveSensitivityBias = (args: {
  conversationId: string | undefined;
  systemDefault: number;
  overrides: Record<string, number>;
}): number => {
  const o = args.conversationId ? args.overrides[args.conversationId] : undefined;
  return typeof o === 'number' ? o : args.systemDefault;
};

export const stepSensitivityBias = (current: number, direction: 'less' | 'more'): number => {
  const next = direction === 'less' ? current + SENSITIVITY_STEP : current - SENSITIVITY_STEP;
  return Math.min(SENSITIVITY_BIAS_BOUNDS.max, Math.max(SENSITIVITY_BIAS_BOUNDS.min, next));
};
