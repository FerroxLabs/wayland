/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Switch ONE skill on for ONE assistant, by directory name.
 *
 * This exists because nothing in MAIN mutates `enabledSkills` today. A skill
 * pack that installs but stays switched off is a pack the user has to go and
 * find in Settings, which is the friction the whole install flow exists to
 * remove.
 *
 * DELIBERATELY the narrowest possible write:
 *   - APPEND ONLY. It never removes a skill and never reorders the list. A user
 *     who has curated their skills must not have that curation rewritten by an
 *     install.
 *   - It never creates an assistant. An unknown id is `false`, not an insert -
 *     a typo must not conjure a half-formed record into the config.
 *   - It touches no neighbouring field on the record it edits.
 *   - Already-enabled is success WITHOUT a write, so a re-install is idempotent
 *     and cannot duplicate an entry.
 *
 * MATCHED BY DIRECTORY NAME, which is the subtle part. `AcpSkillManager.
 * discoverSkills` matches on the directory a skill lives in, while
 * `consumePendingSessionSkills` matches on the SkillLibrary index name. Those
 * two are not always the same string, and `enabledSkills` is consumed on the
 * directory side - so the caller must pass the installed directory name, which
 * is what `installExtractedPack` returns.
 *
 * Storage is a read-modify-write of the WHOLE `assistants` array, so it runs
 * inside `ProcessConfig.update` - the read and the write share one critical
 * section. The earlier get/set pair could lose a concurrent edit made in
 * Settings, because its read happened before the queue.
 */

import { ProcessConfig } from '@process/utils/initStorage';
import type { AcpBackendConfig } from '@/common/types/acpTypes';

/**
 * The assistant a purchased skill pack is switched on for.
 *
 * Stored builtin records are keyed `builtin-<presetId>` - see the stale-record
 * pruning block in `initStorage.ts`, which documents that the `builtin-` prefix
 * is what identifies a preset-sourced row. The preset id is `smart-trader`.
 *
 * It lives HERE rather than in the bridge so a test can assert it against the
 * shipped preset list without pulling electron in. A wrong value fails CLOSED
 * and SILENTLY - the pack installs and is simply never switched on - which is
 * exactly the kind of defect that only surfaces in front of a customer.
 */
export const SMART_TRADER_ASSISTANT_ID = 'builtin-smart-trader';

/**
 * The stored record type. Deliberately the REAL config type rather than a
 * narrow local shape: this function writes the whole array back, so anything it
 * cannot see is anything it could silently drop.
 */
type AssistantRecord = AcpBackendConfig;

export type EnableSkillIo = {
  /**
   * Read-modify-write the `assistants` array ATOMICALLY.
   *
   * The seam is an `update(fn)` rather than a get/set PAIR on purpose. A pair
   * lets the read happen outside the persistence queue, and the whole array is
   * then written back from a snapshot that may already be stale - so an install
   * that starts while the user is editing assistants in Settings writes its old
   * copy over their change and silently deletes an assistant. Serialising the
   * WRITES does not fix that; the READ has to be inside the same critical
   * section, which is what `ProcessConfig.update` gives us.
   */
  update: (mutator: (assistants: AssistantRecord[]) => AssistantRecord[]) => Promise<void>;
};

const defaultIo: EnableSkillIo = {
  update: async (mutator) => {
    await ProcessConfig.update('assistants', async (current) => mutator((current ?? []) as AssistantRecord[]));
  },
};

/**
 * @returns `true` when the skill is enabled for the assistant afterwards
 *   (including when it already was), `false` when the assistant does not exist.
 */
export async function enableSkillForAssistant(
  assistantId: string,
  skillDirName: string,
  io: EnableSkillIo = defaultIo
): Promise<boolean> {
  let found = false;
  await io.update((assistants) => {
    const index = assistants.findIndex((a) => a?.id === assistantId);
    if (index < 0) return assistants;
    found = true;

    const current = assistants[index].enabledSkills ?? [];
    if (current.includes(skillDirName)) return assistants;

    return assistants.map((a, i) => (i === index ? { ...a, enabledSkills: [...current, skillDirName] } : a));
  });
  return found;
}
