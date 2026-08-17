/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Why the legacy backup providers return a RESULT and never a rejection.
 *
 * The IPC bridge has no error channel at all. `buildProvider(...).provider(fn)`
 * calls `fn(data).then(emitCallback)` with no `.catch`, and the matching
 * `invoke` is a `new Promise(resolve)` with no reject and no timeout. So a
 * provider that throws produces an unhandledRejection in main and an `await` in
 * the renderer that NEVER SETTLES: the Restore button sits on its spinner for
 * the rest of the session, with no message, even after the dialog is cancelled.
 *
 * A mistyped backup passphrase is the everyday way to reach that. `speechToText`
 * and `voiceSynth.speak` already return `{ok:false, errorCode}` for exactly this
 * reason; the storage backup pair is their sibling and must do the same.
 *
 * The vocabulary is declared ONCE here so the classifier and the renderer derive
 * from it instead of re-typing it. A hand-copied second list is what let seven
 * speech codes reach a user as raw enum text.
 */
export const LEGACY_BACKUP_ERROR_CODES = [
  /** The archive's encrypted keys would not decrypt with the supplied passphrase. */
  'BAD_PASSPHRASE',
  /** "Include API keys" was ticked with no passphrase to encrypt them under. */
  'PASSPHRASE_REQUIRED',
  /** Anything else. Deliberately opaque: see the note below. */
  'BACKUP_FAILED',
] as const;

export type LegacyBackupErrorCode = (typeof LEGACY_BACKUP_ERROR_CODES)[number];

/**
 * The failure half of a legacy backup provider result.
 *
 * `failed` is what separates "it failed" from "the user cancelled the native
 * file dialog", which both arrive as `ok: false`. Cancelling must stay silent;
 * failing must be reported.
 *
 * There is deliberately no message field. A decrypt or zip error can carry file
 * content, a userData path or a passphrase fragment in its text, and this
 * channel ends at a toast the user reads and pastes into a bug report. The
 * renderer translates the code itself.
 */
export type LegacyBackupFailure = {
  ok: false;
  failed: true;
  errorCode: LegacyBackupErrorCode;
};

/**
 * Narrows a thrown error to the declared vocabulary by its `CODE:` prefix, the
 * same shape `publicSpeechErrorCode` uses. Anything unrecognised becomes
 * `BACKUP_FAILED`, so a main-process stack, path or file fragment can never
 * reach the renderer through this channel.
 */
export const publicBackupErrorCode = (error: unknown): LegacyBackupErrorCode => {
  const message = error instanceof Error ? error.message : String(error);
  const [code] = message.split(':');
  return (LEGACY_BACKUP_ERROR_CODES as readonly string[]).includes(code)
    ? (code as LegacyBackupErrorCode)
    : 'BACKUP_FAILED';
};
