/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechProvider } from '@/common/types/ttsTypes';

/**
 * Prosody is per-provider, and it has to stay that way.
 *
 * `[[slnc N]]` is a macOS `say` speech command. Sent to a hosted synthesizer it
 * is not a command at all - OpenAI TTS would read "bracket bracket s l n c"
 * aloud. So the shared normalizer stays provider-agnostic (markdown, safety,
 * length) and anything that shapes delivery lives here, keyed by who is
 * speaking. A single normalizer emitting speech commands would be audibly wrong
 * on every provider but one.
 *
 * What this fixes, graded by ear on real hardware rather than inferred:
 *
 *   raw commas          3.82 s  - sounds like it is reading the punctuation
 *   comma -> [[slnc]]   3.87 s  - "less rushed and more natural"   <- shipped
 *   commas deleted      3.38 s  - rushed
 *
 * The first two are the same length, which is the whole point: the defect was
 * never timing. `say` performs a grammatical intonation contour at a comma, and
 * that contour is what reads as "pronouncing the grammar". Deleting the comma
 * removes the contour but takes the breath with it, which is why the fastest
 * variant sounded the worst. The fix is to remove the comma and put the breath
 * back explicitly.
 *
 * A numeric read of those durations picks the wrong winner. This ordering came
 * from listening.
 */

/** Roughly the pause a comma buys, without the intonation that comes with it. */
const COMMA_SILENCE_MS = 150;

/**
 * `say` interprets `[[...]]` anywhere in its input as a command, so model prose
 * containing `[[` can already issue commands - it can mute itself with
 * `[[volm 0]]`. Latent until now; unignorable once we deliberately emit command
 * syntax of our own, because after that our commands and the model's are
 * indistinguishable. Neutralised by breaking the opening bracket pair.
 */
const neutralizeSpeechCommands = (text: string): string => text.replace(/\[\[/g, '[ [');

const applySystemNativeProsody = (text: string): string =>
  neutralizeSpeechCommands(text)
    // Only a comma followed by whitespace is syntactic. "1,000" has no space
    // after the comma and must keep it, or the number is read as two numbers.
    .replace(/,(\s)/g, ` [[slnc ${COMMA_SILENCE_MS}]]$1`);

/**
 * Shapes delivery for the provider that will actually speak. Providers with no
 * prosody control return the text untouched rather than being given syntax they
 * would pronounce.
 */
export const applyVoiceProsody = (text: string, provider: TextToSpeechProvider): string =>
  provider === 'system-native' ? applySystemNativeProsody(text) : text;
