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
 * Storage is a read-modify-write of the WHOLE `assistants` array, so callers
 * must not run these concurrently (`skillsBridge.ts:186-188` documents the same
 * constraint for the import batch).
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
  getAssistants: () => Promise<AssistantRecord[]>;
  setAssistants: (next: AssistantRecord[]) => Promise<void>;
};

const defaultIo: EnableSkillIo = {
  getAssistants: async () => ((await ProcessConfig.get('assistants')) ?? []) as AssistantRecord[],
  setAssistants: async (next) => {
    await ProcessConfig.set('assistants', next);
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
  const assistants = await io.getAssistants();
  const index = assistants.findIndex((a) => a?.id === assistantId);
  if (index < 0) return false;

  const current = assistants[index].enabledSkills ?? [];
  if (current.includes(skillDirName)) return true;

  const next = assistants.map((a, i) => (i === index ? { ...a, enabledSkills: [...current, skillDirName] } : a));
  await io.setAssistants(next);
  return true;
}
