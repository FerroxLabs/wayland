/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1024 drift pin. The renderer must not import from the process layer, so
 * `engineConfigFailure.ts` carries its own copy of the splice error's `code`.
 * This test is the only thing stopping the two from silently diverging - and a
 * divergence is invisible in the UI: the recovery card just never appears and the
 * user is back to the dead end the issue was filed about.
 *
 * Mirrors the arrangement used for `CONSTITUTION_LOCKED_ERROR_CODE`.
 */
import { describe, expect, it } from 'vitest';
import { DesktopProfileSpliceError } from '@process/agent/wcore/desktopProfileSplice';
import {
  ENGINE_CONFIG_INVALID_ERROR_CODE,
  isEngineConfigInvalidError,
} from '@renderer/pages/conversation/platforms/wcore/engineConfigFailure';

describe('engine config invalid error code', () => {
  it('matches DesktopProfileSpliceError.code byte for byte', () => {
    const error = new DesktopProfileSpliceError('existing content is not valid TOML: Invalid TOML document');
    expect(error.code).toBe(ENGINE_CONFIG_INVALID_ERROR_CODE);
    expect(isEngineConfigInvalidError(error.code)).toBe(true);
  });

  it('does not claim an unrelated or absent code', () => {
    expect(isEngineConfigInvalidError(undefined)).toBe(false);
    expect(isEngineConfigInvalidError('CONSTITUTION_FS_REVISION_AUTHORITY_UNAUTHENTICATED')).toBe(false);
    expect(isEngineConfigInvalidError('PROFILE_ISOLATION')).toBe(false);
  });
});
