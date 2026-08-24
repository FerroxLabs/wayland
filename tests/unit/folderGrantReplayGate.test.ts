/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect } from 'vitest';
import {
  FOLDER_GRANT_REPLAY_AVAILABLE,
  PATH_BOUNDARY_REMEMBER_FOLDER,
  PATH_BOUNDARY_GRANT_FOLDER,
  PATH_BOUNDARY_DENY,
  isPathBoundaryOptionValue,
  isPathBoundaryConfirmation,
} from '@/common/chat/pathBoundaryConsent';
import { buildPathBoundaryOptionsForTest } from '@process/task/WCoreManager';

/**
 * The "remember this folder" button promises the folder is still open next
 * time. Until `grant_path` is sendable, nothing re-applies it, so the promise
 * is false. These pin the button to the GATE rather than to its current value,
 * so they keep meaning something on the day the gate flips instead of becoming
 * a test that has to be deleted.
 */
describe('the durable folder-grant option is gated on replay actually working', () => {
  const root = '/Users/someone/Reports';

  it('offers the durable option if and only if a remembered folder is re-applied', () => {
    const values = buildPathBoundaryOptionsForTest(root).map((o) => o.value);
    // The claim is the BICONDITIONAL, not "the button is absent" - a test that
    // asserted absence would have to be rewritten when the gate flips, and a
    // test you have to rewrite is one nobody trusts at the moment it matters.
    expect(values.includes(PATH_BOUNDARY_REMEMBER_FOLDER)).toBe(FOLDER_GRANT_REPLAY_AVAILABLE);
  });

  it('still offers the session grant and the refusal either way', () => {
    // The positive control. Without it the test above passes just as happily on
    // a card that lost every option, or on no card at all.
    const values = buildPathBoundaryOptionsForTest(root).map((o) => o.value);
    expect(values).toContain(PATH_BOUNDARY_GRANT_FOLDER);
    expect(values).toContain(PATH_BOUNDARY_DENY);
  });

  it('is still structurally a boundary card, so every auto-approve exclusion still fires', () => {
    // Gating the option must not gate the card OUT of the exclusions that keep
    // yolo mode and the remote gateway away from it. That would turn a cosmetic
    // change into a security regression.
    const options = buildPathBoundaryOptionsForTest(root);
    expect(isPathBoundaryConfirmation({ options })).toBe(true);
  });

  it('keeps the durable value in the shared vocabulary even while it is not offered', () => {
    // `isPathBoundaryOptionValue` is what the transport gate and every
    // exclusion read. A value that stops being recognised while the store can
    // still hold it is how a gated feature becomes an ungated hole.
    expect(isPathBoundaryOptionValue(PATH_BOUNDARY_REMEMBER_FOLDER)).toBe(true);
  });

  it('names the folder on every option that opens one', () => {
    for (const option of buildPathBoundaryOptionsForTest(root)) {
      if (option.value === PATH_BOUNDARY_DENY) continue;
      expect(option.params?.folder).toBe(root);
    }
  });
});
