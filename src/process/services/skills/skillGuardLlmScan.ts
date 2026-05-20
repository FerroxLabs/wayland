/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SkillFinding } from '@/common/types/skillTypes';
import type { SkillScanInput } from './skillGuardRules';

/**
 * Injectable LLM scan seam. The default Skill Guard implementation does not
 * call a real model — the import flow (task B12) wires the user's configured
 * model into this seam so semantic prompt-injection that regex cannot see
 * (paraphrase, translation across locales, indirection) gets a verdict too.
 */
export type LlmScanCall = (batch: SkillScanInput[]) => Promise<Array<{ findings: SkillFinding[] }>>;

/**
 * Per-import-batch LLM deep-scan. Without an injected `call`, returns empty
 * findings — Skill Guard is a warning system, not a guarantee, and the
 * absence of an LLM scan is recorded in the report so the user sees it.
 */
export const skillGuardLlmScan = async (batch: SkillScanInput[], call?: LlmScanCall): Promise<Array<{ findings: SkillFinding[] }>> => {
  if (call) return call(batch);
  return batch.map(() => ({ findings: [] as SkillFinding[] }));
};
