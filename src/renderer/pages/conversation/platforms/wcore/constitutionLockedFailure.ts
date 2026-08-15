/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Classification the main process stamps on a terminal turn error when the
 * Constitution revision authority stored for this machine cannot be unlocked:
 * its ciphertext was sealed by a different installation of the app (Electron's
 * safeStorage keys by app identity), so nothing here can read it.
 *
 * Kept byte-identical to `CONSTITUTION_REVISION_AUTHORITY_UNAUTHENTICATED` in
 * `@process/services/constitution/constitutionRevisionAuthority`; the two are
 * pinned together by
 * `tests/unit/process/services/constitution/constitutionRevisionAuthority.test.ts`
 * so this copy cannot silently drift out of the process layer (which the
 * renderer must not import from).
 */
export const CONSTITUTION_LOCKED_ERROR_CODE = 'CONSTITUTION_FS_REVISION_AUTHORITY_UNAUTHENTICATED';

/**
 * True when a terminal turn error is a locked Constitution.
 *
 * Deliberately matches the structured `code` and never the message text: the
 * underlying failure is a raw crypto error whose wording is neither stable nor
 * localized, and substring classification of error prose is what misrouted
 * unrelated failures to the auth card in #624.
 */
export function isConstitutionLockedError(code: string | undefined): boolean {
  return code === CONSTITUTION_LOCKED_ERROR_CODE;
}
