/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SKILL_SCANNER_VERSION,
  type SkillFinding,
  type SkillSecurityReport,
  type SkillVerdict,
} from '@/common/types/skillTypes';
import { SKILL_GUARD_RULES, type SkillScanInput } from './skillGuardRules';
import { skillGuardLlmScan, type LlmScanCall } from './skillGuardLlmScan';
import { skillContentHash } from './skillContentHash';

/**
 * Skill Guard - layered security scan for imported / vendored skills.
 *
 * This is a WARNING system, NOT a guarantee. Reports are framed as
 * "Scanned - no red flags found", never as "verified safe". The agent
 * permission system (`AcpPermissionRequest`) is the real enforcement
 * boundary; Skill Guard surfaces signal so the user makes a better choice.
 */
export class SkillGuard {
  static async scan(
    skills: SkillScanInput[],
    opts: { llm?: boolean; llmCall?: LlmScanCall } = {}
  ): Promise<SkillSecurityReport[]> {
    // `llmScanned` on the report must reflect whether the LLM layer ACTUALLY
    // ran for each skill - not whether the caller merely requested it. If
    // `opts.llm` is true but no `llmCall` is wired, the seam returns
    // `ran: false` per skill and the report stays honest. (C2 fix.)
    const llmResults = opts.llm
      ? await skillGuardLlmScan(skills, opts.llmCall)
      : skills.map(() => ({ findings: [] as SkillFinding[], ran: false }));

    const scannedAt = Date.now();
    return skills.map((skill, i) => {
      const regexFindings = SKILL_GUARD_RULES.flatMap((rule) => rule.test(skill));
      const llmResult = llmResults[i] ?? { findings: [] as SkillFinding[], ran: false };
      const findings = [...regexFindings, ...llmResult.findings];
      return {
        verdict: computeVerdict(findings),
        findings,
        scannedAt,
        scannerVersion: SKILL_SCANNER_VERSION,
        llmScanned: llmResult.ran,
        // C5: bind the verdict to the exact content scanned. Keys the
        // review-consent confirm step and the rescan short-circuit.
        contentHash: skillContentHash(skill.body, skill.description),
      };
    });
  }
}

const computeVerdict = (findings: SkillFinding[]): SkillVerdict => {
  if (findings.length === 0) return 'clean';
  if (findings.some((f) => f.severity === 'critical')) return 'blocked';
  return 'review';
};
