/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * "Has the user been offered the Classic/Cockpit choice yet?"
 *
 * This is deliberately a SEPARATE flag from `ui.shell`. `resolveShellExperience`
 * maps anything that is not literally `'cockpit'` to Classic, so the stored
 * shell cannot distinguish "chose Classic" from "never asked". Without this
 * flag the prompt would either reappear forever for someone who already said no,
 * or we would have to write `'classic'` on dismissal and lose the ability to ask
 * at all.
 *
 * Mirrored into localStorage for the same reason OnboardingOverlay mirrors its
 * completion marker: localStorage is synchronous and always local, so a dismiss
 * survives a restart even when the cross-process bridge write never lands. The
 * read is OR-ed across both, so either surface recording the prompt is enough to
 * stop it coming back.
 */

import { ConfigStorage } from '@/common/config/storage';

const LOCAL_MARKER_KEY = 'shellChoicePrompted';

function readLocalMarker(): boolean {
  try {
    return localStorage.getItem(LOCAL_MARKER_KEY) === '1';
  } catch {
    return false;
  }
}

function writeLocalMarker(): void {
  try {
    localStorage.setItem(LOCAL_MARKER_KEY, '1');
  } catch {
    // No localStorage (or quota) — the bridge flag remains the source of truth.
  }
}

/**
 * True when the choice has already been put in front of the user.
 *
 * Fails SAFE: on a read error we report `true`, because showing a returning user
 * a prompt they already answered is worse than never showing it at all.
 */
export async function hasBeenPromptedForShell(): Promise<boolean> {
  if (readLocalMarker()) return true;
  try {
    return Boolean(await ConfigStorage.get('ui.shellChoicePrompted'));
  } catch {
    return true;
  }
}

/**
 * Record that the choice was offered — whichever way the user answered, and also
 * when they dismissed without choosing. Writes the synchronous local marker
 * first so a failed bridge write cannot resurrect the prompt on next launch.
 */
export async function markShellChoicePrompted(): Promise<void> {
  writeLocalMarker();
  try {
    await ConfigStorage.set('ui.shellChoicePrompted', true);
  } catch {
    // Best-effort: the local marker above already covers the restart case.
  }
}

/** Test seam — clears both halves of the marker. */
export function resetShellChoicePromptedForTests(): void {
  try {
    localStorage.removeItem(LOCAL_MARKER_KEY);
  } catch {
    // ignore
  }
}
