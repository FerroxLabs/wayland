/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-shot startup reclaim: delete the two voice model trees whose consumers
 * no longer exist.
 *
 * `voice/kokoro/kokoro-v1.0.onnx` is 325 MB and `voice/whisper/ggml-*.bin` is
 * 148 MB on a machine that ever pressed "Download Model". Neither was ever
 * read: the Kokoro synthesizer's `resolveBinary` returned null unconditionally,
 * and local transcription runs on the bundled Whisper-tiny model inside the
 * renderer worker, which never looks in this tree. Roughly half a gigabyte of
 * disk with no reader.
 *
 * Silent, not a prompt. There is nothing for the user to decide - the files
 * cannot be used by any code path that still exists - so asking would only be
 * asking them to authorize the removal of something they were never told they
 * had. The byte count is logged so the reclaim is auditable after the fact.
 */

import { ProcessConfig } from './initStorage';
import { getPlatformServices } from '@/common/platform';
import { readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const FLAG_KEY = 'system.voiceOrphansReclaimed_v1' as const;
const LOG_TAG = '[voiceOrphanReclaim]';

/**
 * Subdirectories of `<userData>/voice/` to remove. Names only - never absolute
 * paths, never anything derived from config or IPC - so there is no input that
 * can steer this at a different tree.
 */
export const RECLAIMABLE_VOICE_SUBDIRS = ['kokoro', 'whisper'] as const;

/** Recursive byte total. Missing paths contribute 0 rather than throwing. */
const directoryBytes = async (dir: string): Promise<number> => {
  let total = 0;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await directoryBytes(child);
    } else if (entry.isFile()) {
      try {
        total += (await stat(child)).size;
      } catch {
        // Vanished between readdir and stat - contributes nothing.
      }
    }
  }
  return total;
};

/**
 * The absolute path to delete for `name`, or a throw.
 *
 * This is the containment check, and it is the load-bearing line in this file,
 * not a formality: a `rm(..., { recursive: true })` aimed one level too high
 * takes the user's whole profile with it. It is a named export purely so it can
 * be handed an escaping value directly. While it was inlined in the loop below
 * its only inputs were the two clean constants, which meant the branch that
 * throws could be deleted outright with the suite staying green - an untested
 * containment guard on a delete path.
 *
 * `root` must already be resolved. Equality with `root` is refused alongside
 * escape, because `rm`-ing the voice directory itself is not containment.
 */
export const resolveReclaimTarget = (root: string, name: string): string => {
  const target = path.resolve(root, name);
  if (target === root || !target.startsWith(root + path.sep)) {
    throw new Error(`${LOG_TAG} refused to delete outside the voice directory: ${target}`);
  }
  return target;
};

/**
 * Deletes the orphaned voice trees under `voiceRoot` and returns the reclaimed
 * byte count.
 *
 * `voiceRoot` is injectable so tests run against a fabricated profile. Every
 * target goes through `resolveReclaimTarget` before deletion.
 */
export const reclaimVoiceOrphansAt = async (voiceRoot: string): Promise<number> => {
  const root = path.resolve(voiceRoot);
  let reclaimed = 0;

  for (const name of RECLAIMABLE_VOICE_SUBDIRS) {
    const target = resolveReclaimTarget(root, name);
    reclaimed += await directoryBytes(target);
    await rm(target, { recursive: true, force: true });
  }

  return reclaimed;
};

/**
 * Safe to invoke unconditionally on startup: short-circuits once the flag is
 * set, and never throws - a failed reclaim must not block app launch, and the
 * flag is deliberately left unset on failure so the next launch retries.
 */
export async function reclaimVoiceOrphans_v1(): Promise<void> {
  try {
    if ((await ProcessConfig.get(FLAG_KEY)) === true) return;

    const voiceRoot = path.join(getPlatformServices().paths.getDataDir(), 'voice');
    const reclaimed = await reclaimVoiceOrphansAt(voiceRoot);

    await ProcessConfig.set(FLAG_KEY, true);
    console.log(`${LOG_TAG} Reclaimed ${reclaimed} bytes from abandoned voice models under ${voiceRoot}`);
  } catch (err) {
    console.error(`${LOG_TAG} Reclaim failed; will retry on next launch:`, err);
  }
}
