/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What Wayland says first, when a voice conversation opens.
 *
 * Entering voice mode used to land on an orb captioned "Tap to speak" - a
 * silent surface waiting for a second gesture, from a product whose whole
 * promise is that you can just talk to it. A voice assistant opens by saying
 * something, and then listens.
 *
 * Every line here is a KEY, never a sentence. The greeting is the one string in
 * the session that is synthesized rather than read, so a hardcoded English
 * template interpolated with a name would be spoken in English out loud to
 * someone running the app in Japanese - the loudest possible untranslated
 * string. There are two families per variant because "Hey {{name}}" with an
 * empty name is not a greeting in any language, and because word order around a
 * vocative is not something a caller can assemble by concatenation.
 */

export type VoiceGreetingVariantId =
  | 'howAreYou'
  | 'imListening'
  | 'readyWhenYouAre'
  | 'goodToHear'
  | 'whereToStart';

/**
 * The pool, in a fixed order. Fixed because the order is what `roll` indexes
 * into, so a test can pin a variant by pinning a number.
 */
export const VOICE_GREETING_VARIANT_IDS: readonly VoiceGreetingVariantId[] = [
  'howAreYou',
  'imListening',
  'readyWhenYouAre',
  'goodToHear',
  'whereToStart',
] as const;

/**
 * How much of a display name is spoken.
 *
 * The name reaches a synthesizer, and on the hosted leg it is billed by the
 * character. `user.displayName` is free text the user can set to anything, and
 * an unbounded one would be read out in full before the greeting ever got to
 * the question.
 */
export const MAX_GREETING_NAME_LENGTH = 40;

/**
 * A display name reduced to something safe to speak.
 *
 * Control characters and newlines are removed rather than escaped: they are
 * inaudible, they are what a name would carry if it were ever assembled from
 * somewhere less trusted than local config, and `say` takes the spoken text as
 * a positional argument. Returns '' for anything that is not worth saying,
 * which is the caller's signal to use the name-less variant.
 */
export const sanitizeGreetingName = (raw?: string | null): string => {
  if (typeof raw !== 'string') return '';
  const collapsed = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return collapsed.slice(0, MAX_GREETING_NAME_LENGTH).trim();
};

export type VoiceGreetingSelection = {
  variantId: VoiceGreetingVariantId;
  /** The i18n key to translate. Never a sentence. */
  key: string;
  /** The `{{name}}` interpolation, or null when the name-less variant was chosen. */
  name: string | null;
};

/** The i18n key for one variant, in whichever family the name decides. */
export const voiceGreetingKey = (variantId: VoiceGreetingVariantId, named: boolean): string =>
  `conversation.chat.voice.greeting.${named ? 'named' : 'anonymous'}.${variantId}`;

/** Every greeting key that must exist in every locale. */
export const VOICE_GREETING_KEYS: readonly string[] = VOICE_GREETING_VARIANT_IDS.flatMap((id) => [
  voiceGreetingKey(id, true),
  voiceGreetingKey(id, false),
]);

/**
 * Pick one greeting for one session.
 *
 * `roll` is a number in [0, 1) - `Math.random()` in production, a pinned value
 * in a test. It is a parameter rather than a call inside this function because
 * a greeting that cannot be pinned cannot be asserted, and "it said one of five
 * things" is not an assertion.
 */
export const selectVoiceGreeting = ({
  displayName,
  roll = Math.random(),
}: {
  displayName?: string | null;
  roll?: number;
} = {}): VoiceGreetingSelection => {
  const name = sanitizeGreetingName(displayName);
  const bounded = Number.isFinite(roll) ? Math.min(Math.max(roll, 0), 0.999999) : 0;
  const variantId = VOICE_GREETING_VARIANT_IDS[Math.floor(bounded * VOICE_GREETING_VARIANT_IDS.length)];
  return {
    variantId,
    key: voiceGreetingKey(variantId, name.length > 0),
    name: name.length > 0 ? name : null,
  };
};
