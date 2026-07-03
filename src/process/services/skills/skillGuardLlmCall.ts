/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SkillFinding } from '@/common/types/skillTypes';
import { oneShotCompleteBest } from '@process/services/completion/oneShot';
import type { SkillScanInput } from './skillGuardRules';
import type { LlmScanCall } from './skillGuardLlmScan';
import { buildSkillScanPrompt, parseSkillScanResponse } from './skillGuardLlmPrompt';

/**
 * Concrete `LlmScanCall` backing the import-path Security Sweep (C1).
 *
 * One `oneShotCompleteBest` call per skill in the batch - imports are
 * single-skill events, so this is one model call per import (the spec's cost
 * bound). `oneShotCompleteBest` picks the most capable model the user already
 * has a key for and returns a RAW string; we build a JSON-requesting prompt and
 * parse it strictly. Any failure (no usable model, network error, unparseable
 * reply) PROPAGATES so `skillGuardLlmScan` fails open to the regex verdict and
 * marks the report `llmScanned: false` - never a fabricated "clean."
 *
 * The `complete` function is injectable so tests can drive parsing without a
 * real provider.
 */
export function makeOneShotLlmScanCall(
  complete: (prompt: string) => Promise<string> = (prompt) => oneShotCompleteBest(prompt, { maxTokens: 800 })
): LlmScanCall {
  return async (batch: SkillScanInput[]): Promise<Array<{ findings: SkillFinding[] }>> => {
    // Sequential by design: the batch is normally a single imported skill, and
    // one-call-per-skill keeps the cost bound explicit.
    const out: Array<{ findings: SkillFinding[] }> = [];
    for (const skill of batch) {
      const prompt = buildSkillScanPrompt(skill);
      // eslint-disable-next-line no-await-in-loop
      const reply = await complete(prompt);
      out.push({ findings: parseSkillScanResponse(reply) });
    }
    return out;
  };
}
