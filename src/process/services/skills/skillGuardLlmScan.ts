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
 *
 * Fail-open (C1): when an injected `call` throws (model unavailable, timeout,
 * unparseable output surfaced as an error), the deep sweep is treated as
 * inconclusive - `ran: false`, no findings - so the import falls back to the
 * regex verdict rather than blocking on a model failure or, worse, silently
 * claiming a scan happened. A regex `blocked` still blocks regardless; the
 * fail-open only affects the LLM layer's contribution.
 */
export const skillGuardLlmScan = async (batch: SkillScanInput[], call?: LlmScanCall): Promise<LlmScanResult[]> => {
  if (call) {
    try {
      const results = await call(batch);
      return batch.map((_, i) => ({
        findings: results[i]?.findings ?? [],
        ran: true,
      }));
    } catch {
      // Deep sweep failed - fall back to the regex verdict, honestly marked
      // as un-scanned by the LLM layer. Never invent findings, never claim
      // the model ran.
      return batch.map(() => ({ findings: [] as SkillFinding[], ran: false }));
    }
  }
  return batch.map(() => ({ findings: [] as SkillFinding[], ran: false }));
};
