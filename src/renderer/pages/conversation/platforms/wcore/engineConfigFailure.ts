/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Classification the main process stamps on a terminal turn error when the
 * engine's global `config.toml` is not valid TOML, so Desktop refused to splice
 * its reserved launch profile into it (#1024).
 *
 * Kept byte-identical to `DesktopProfileSpliceError.code` in
 * `@process/agent/wcore/desktopProfileSplice`; the two are pinned together by
 * `tests/unit/process/agent/wcore/engineConfigFailureCode.test.ts` so this copy
 * cannot silently drift out of the process layer (which the renderer must not
 * import from). Same arrangement as `constitutionLockedFailure.ts`.
 */
export const ENGINE_CONFIG_INVALID_ERROR_CODE = 'DESKTOP_PROFILE_SPLICE_INVALID';

/**
 * True when a terminal turn error is an unparseable engine config.
 *
 * Matches the structured `code`, never the message text: the prose names the
 * reserved profile table and the parser's reason, is not localized, and
 * substring classification of error prose is what misrouted unrelated failures
 * to the auth card in #624.
 */
export function isEngineConfigInvalidError(code: string | undefined): boolean {
  return code === ENGINE_CONFIG_INVALID_ERROR_CODE;
}
