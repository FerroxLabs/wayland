/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SkillFinding } from '@/common/types/skillTypes';
import type { SkillScanInput } from './skillGuardRules';

/**
 * Injectable LLM scan seam. The default Skill Guard implementation does not
 * call a real model - the import flow (task B12) wires the user's configured
 * model into this seam so semantic prompt-injection that regex cannot see
 * (paraphrase, translation across locales, indirection) gets a verdict too.
 */
export type LlmScanCall = (batch: SkillScanInput[]) => Promise<Array<{ findings: SkillFinding[] }>>;

/**
 * Per-skill LLM-scan result.
 *
 * `ran` is true ONLY when an injected `call` actually executed against the
 * skill - i.e. a real model returned (or attempted to return) findings.
 * Callers use `ran` to drive the `SkillSecurityReport.llmScanned` flag so
 * the UI can honestly distinguish "an LLM looked at this" from "the LLM
 * layer was a no-op stub." This is the C2 honesty fix.
 */
export type LlmScanResult = { findings: SkillFinding[]; ran: boolean };

/**
 * Per-import-batch LLM deep-scan. Without an injected `call`, returns empty
 * findings with `ran: false` - Skill Guard is a warning system, not a
 * guarantee, and the absence of an LLM scan must be recorded in the report
 * so the user sees it (never report a non-existent scan as if it ran).
 */
export const skillGuardLlmScan = async (
  batch: SkillScanInput[],
  call?: LlmScanCall
): Promise<LlmScanResult[]> => {
  if (call) {
    const results = await call(batch);
    return batch.map((_, i) => ({
      findings: results[i]?.findings ?? [],
      ran: true,
    }));
  }
  return batch.map(() => ({ findings: [] as SkillFinding[], ran: false }));
};
