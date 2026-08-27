/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * "Should we offer to turn long-term memory on?"
 *
 * Core defaults memory ON (`MemoryConfig::default` - F-091), so a fresh install
 * never sees this. The population that does is users whose config was rewritten
 * by an OLDER Core: `patch_config_file_at` re-serializes the entire typed
 * `ConfigFile` on any single-field patch, so one unrelated write under a build
 * whose default was `false` stamped `[memory] enabled = false` in permanently.
 * Those users are silently memory-less and have no reason to suspect it.
 *
 * The hard part is that `enabled = false` on disk is BYTE-IDENTICAL whether it
 * was stamped by that bug or chosen deliberately in Settings -> Wayland Core ->
 * Memory, which is a real user-facing toggle. Nothing in the file distinguishes
 * them. So this is an OFFER, never a silent migration: flipping a privacy
 * feature back on for someone who switched it off would be a worse breach of
 * trust than the bug it is meant to repair.
 *
 * Mirrored into localStorage for the same reason the shell chooser is:
 * localStorage is synchronous and always local, so an answer survives a restart
 * even when the cross-process bridge write never lands. The read is OR-ed across
 * both, so either surface recording the answer is enough to stop it returning.
 */

import { ConfigStorage } from '@/common/config/storage';

const LOCAL_MARKER_KEY = 'memoryEnableOffered';

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
    // No localStorage (or quota) - the bridge flag remains the source of truth.
  }
}

/**
 * True when the question has already been put to the user.
 *
 * Fails SAFE: on a read error we report `true`. Staying quiet costs a user a
 * feature they can still switch on in Settings; nagging someone who already
 * declined pushes them on a privacy choice they have already made, and that is
 * the worse error.
 */
export async function hasAnsweredMemoryOffer(): Promise<boolean> {
  if (readLocalMarker()) return true;
  try {
    return Boolean(await ConfigStorage.get('memory.enableOffered'));
  } catch {
    return true;
  }
}

/**
 * Record that the user has answered - accepted, declined, or dismissed, and
 * ALSO whenever they flip the Settings toggle in either direction.
 *
 * The toggle case is the one that matters most: someone who has just turned
 * memory OFF in Settings has answered this question by definition, and must
 * never then be offered it back on.
 *
 * Writes the synchronous local marker FIRST so a failed bridge write cannot
 * resurrect the offer on the next launch.
 */
export async function markMemoryOfferAnswered(): Promise<void> {
  writeLocalMarker();
  try {
    await ConfigStorage.set('memory.enableOffered', true);
  } catch {
    // Best-effort: the local marker above already covers the restart case.
  }
}

/**
 * Whether to show the offer right now.
 *
 * `memoryEnabled` must come from the ENGINE config, not from any Desktop-side
 * mirror - Desktop does not own this value and a stale mirror would offer to
 * enable something already on.
 *
 * `undefined` means the engine config could not be read. That is NOT the same
 * as "memory is off", and is deliberately treated as "do not offer": guessing
 * would put a misleading prompt in front of a user whose memory is working.
 */
export async function shouldOfferMemoryEnable(memoryEnabled: boolean | undefined): Promise<boolean> {
  if (memoryEnabled !== false) return false;
  return !(await hasAnsweredMemoryOffer());
}

/** Test seam - clears the local half of the marker. */
export function resetMemoryOfferForTests(): void {
  try {
    localStorage.removeItem(LOCAL_MARKER_KEY);
  } catch {
    // ignore
  }
}
