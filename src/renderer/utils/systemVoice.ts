/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * System-native TTS via the Web Speech API (`speechSynthesis`). This is the one
 * path that works consistently on every OS — Chromium bridges it to the native
 * voice engine (macOS NSSpeechSynthesizer incl. Siri voices, Windows SAPI,
 * Linux speech-dispatcher). It replaces the macOS-only `say` command so the
 * "System Native" choice sounds the same everywhere (and on Windows/Linux,
 * where the old main-process path returned silent audio, it now actually
 * speaks). Degrades gracefully: if no voices are installed (e.g. a bare Linux
 * box), `getSystemVoices()` is empty and `speakWithSystemVoice` uses the OS
 * default (or no-ops if the engine itself is absent).
 */

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;

/** Installed system voices for the current OS (empty until the engine loads them). */
export const getSystemVoices = (): SpeechSynthesisVoice[] => synth()?.getVoices() ?? [];

/**
 * Voices load asynchronously on some platforms; resolve once they're available
 * (or immediately if already loaded). Subscribe via `voiceschanged`.
 */
export const onSystemVoicesChanged = (cb: (voices: SpeechSynthesisVoice[]) => void): (() => void) => {
  const s = synth();
  if (!s) return () => {};
  const handler = () => cb(s.getVoices());
  s.addEventListener('voiceschanged', handler);
  // Fire once with whatever is already loaded.
  cb(s.getVoices());
  return () => s.removeEventListener('voiceschanged', handler);
};

/** Stop any in-progress system speech. */
export const stopSystemVoice = (): void => {
  synth()?.cancel();
};

/**
 * Speak `text` with the selected system voice. `voiceURI` selects a specific
 * installed voice (from getSystemVoices); when absent or not found, the OS
 * default voice is used. Resolves when speech ends (or immediately if the
 * engine is unavailable, so callers never hang).
 */
export const speakWithSystemVoice = (
  text: string,
  opts: { voiceURI?: string; rate?: number } = {},
): Promise<void> => {
  const s = synth();
  if (!s) return Promise.resolve();
  s.cancel();
  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (opts.voiceURI) {
      const match = s.getVoices().find((v) => v.voiceURI === opts.voiceURI);
      if (match) utterance.voice = match;
    }
    if (typeof opts.rate === 'number' && opts.rate > 0) utterance.rate = opts.rate;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    s.speak(utterance);
  });
};
