/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pins the "have we asked?" flag behind the Classic/Cockpit chooser.
 *
 * This flag exists because `ui.shell` cannot answer the question on its own:
 * `resolveShellExperience` maps everything that is not literally 'cockpit' to
 * Classic, so a user who chose Classic and a user who was never asked are
 * indistinguishable from the stored shell alone. Get this wrong and we either
 * nag someone who already declined on every launch, or never ask at all.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getSpy, setSpy } = vi.hoisted(() => ({ getSpy: vi.fn(), setSpy: vi.fn() }));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: getSpy, set: setSpy },
}));

import {
  hasBeenPromptedForShell,
  markShellChoicePrompted,
  resetShellChoicePromptedForTests,
} from '@renderer/utils/ui/shellChoice';

describe('shell choice prompted flag', () => {
  beforeEach(() => {
    getSpy.mockReset();
    setSpy.mockReset();
    resetShellChoicePromptedForTests();
  });

  it('reports not-yet-prompted on a fresh install', async () => {
    getSpy.mockResolvedValue(undefined);
    await expect(hasBeenPromptedForShell()).resolves.toBe(false);
  });

  it('reports prompted once the stored flag is set', async () => {
    getSpy.mockResolvedValue(true);
    await expect(hasBeenPromptedForShell()).resolves.toBe(true);
  });

  it('writes both the local marker and the durable flag when recorded', async () => {
    setSpy.mockResolvedValue(undefined);
    await markShellChoicePrompted();

    expect(localStorage.getItem('shellChoicePrompted')).toBe('1');
    expect(setSpy).toHaveBeenCalledWith('ui.shellChoicePrompted', true);
  });

  it('still reports prompted when the durable write failed but the local marker landed', async () => {
    // The cross-process bridge write is the flaky half; localStorage is not.
    setSpy.mockRejectedValue(new Error('bridge down'));
    await markShellChoicePrompted();

    getSpy.mockResolvedValue(undefined);
    await expect(hasBeenPromptedForShell()).resolves.toBe(true);
  });

  it('fails safe to prompted when the flag cannot be read', async () => {
    // Showing a returning user a question they already answered is worse than
    // never showing it, so an unreadable flag must suppress the prompt.
    getSpy.mockRejectedValue(new Error('storage unavailable'));
    await expect(hasBeenPromptedForShell()).resolves.toBe(true);
  });

  it('does not treat a Classic shell as evidence the user was asked', async () => {
    // The regression this whole flag exists to prevent: `ui.shell` being absent
    // or 'classic' must not be read as "already answered".
    getSpy.mockImplementation(async (key: string) => (key === 'ui.shell' ? 'classic' : undefined));
    await expect(hasBeenPromptedForShell()).resolves.toBe(false);
  });
});
