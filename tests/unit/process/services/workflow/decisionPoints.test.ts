/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Unit tests for decisionPoints.ts
// Real excerpts from bundled workflow bodies are quoted in test fixtures below.

import { describe, expect, it } from 'vitest';
import {
  parseDecisionPointSteps,
  stepHasDecisionPoint,
  shouldReviewAfterStep,
} from '@process/services/workflow/decisionPoints';

// ---------------------------------------------------------------------------
// Real body excerpts (quoted from bundled workflows)
// ---------------------------------------------------------------------------

// From debug-production-issue/SKILL.md -- uses "At Step N:" and "After Step N:"
const DEBUG_PRODUCTION_ISSUE_BODY = `
## Steps

**Step 1: Triage and Classify the Incident** (uses: incident-response)

Assess the issue.

**Step 2: Isolate the Root Cause**

Dig into logs.

**Step 3: Profile Performance**

Run profiling.

**Step 4: Implement and Verify the Fix**

Ship the fix.

## Decision Points

- **At Step 1:** If the triage reveals the issue is a security breach or data loss, stop this workflow and escalate to the security-audit-codebase or handle-production-incident workflow. Security incidents require additional coordination beyond technical debugging.

- **At Step 2:** If logs are insufficient to identify the root cause (poor logging coverage, logs rotated, or no structured logging), skip to Step 3 (performance profiling) to gather data from a different angle. Add improved logging as a follow-up task.

- **At Step 3:** If the issue is not performance-related (functional bug, incorrect business logic, data corruption), skip this step and proceed directly to fix implementation and Step 4 verification.

- **After Step 4:** If the fix does not resolve the issue (metrics do not return to baseline), the root cause hypothesis was incorrect. Return to Step 2 with new information and investigate alternative hypotheses.

## Failure Handling

- Step 1 cannot determine severity.
`;

// From build-ai-powered-feature/SKILL.md -- uses nested "If **After Step N**:" form
const BUILD_AI_FEATURE_BODY = `
## Steps

**Step 1: Define the Problem** (uses: product-strategy)

Define success criteria.

**Step 2: Choose the AI Approach**

Pick a model.

**Step 3: Build the AI Component**

Implement it.

**Step 4: Evaluate and Validate**

Measure accuracy.

**Step 5: Integrate into the Product**

Wire it in.

**Step 6: Secure the AI Feature**

Run security audit.

## Decision Points

- **After Step ?:**
  - If **After Step 1**: Reconsider whether AI is the right solution
  - If **After Step 2**: Explore alternative approaches or simplify the problem
  - If **After Step 4**: Iterate on AI component until targets are met
  - If **After Step 6**: Fix security issues before user exposure

## Failure Handling

No AI fallback path.
`;

// From security-audit-codebase/SKILL.md -- uses "Before Step N:" and "At Step N:"
const SECURITY_AUDIT_BODY = `
## Steps

**Step 1: Define Scope and Threat Model** (uses: system-design)

Map the attack surface.

**Step 3: Run Automated Scanning** (uses: security-tools)

Run scanners.

**Step 5: Compliance Mapping**

Map to frameworks.

## Decision Points

- **Before Step 1:** If the codebase has never had a security review, expect the audit to take longer. Allocate additional time for Steps 2-3 as there will likely be more findings. If the codebase is under 10,000 lines, consider combining Steps 2 and 3 into a single review pass.

- **At Step 3:** If automated scanning reveals critical vulnerabilities (remote code execution, SQL injection in production), stop the audit and remediate the critical findings immediately before continuing. Critical vulnerabilities supersede the audit timeline.

- **At Step 5:** If no compliance framework applies (internal tool, no regulatory requirements), skip this step entirely. The findings from Steps 1-4 provide sufficient security improvement guidance without compliance mapping.

## Expected Outcome

Security improved.
`;

// A body with NO Decision Points section at all
const NO_DECISION_POINTS_BODY = `
## Steps

**Step 1: Setup** (uses: setup-tool)

Install dependencies.

**Step 2: Build**

Compile.

## Expected Outcome

Things work.
`;

// A body with a Decision Points section that has no step number references
const EMPTY_DECISION_POINTS_BODY = `
## Steps

**Step 1: Setup**

Do the thing.

## Decision Points

This workflow has no branching -- proceed through all steps sequentially.

## Expected Outcome

Done.
`;

// ---------------------------------------------------------------------------
// parseDecisionPointSteps
// ---------------------------------------------------------------------------

describe('parseDecisionPointSteps', () => {
  describe('returns empty Set when no Decision Points section exists', () => {
    it('body with no ## Decision Points heading', () => {
      expect(parseDecisionPointSteps(NO_DECISION_POINTS_BODY).size).toBe(0);
    });

    it('empty string', () => {
      expect(parseDecisionPointSteps('').size).toBe(0);
    });
  });

  describe('returns empty Set when section exists but has no step numbers', () => {
    it('prose-only decision points section', () => {
      expect(parseDecisionPointSteps(EMPTY_DECISION_POINTS_BODY).size).toBe(0);
    });
  });

  describe('"At Step N:" form (debug-production-issue excerpt)', () => {
    it('extracts steps 1, 2, 3, 4 from "At Step N:" and "After Step N:" mix', () => {
      const steps = parseDecisionPointSteps(DEBUG_PRODUCTION_ISSUE_BODY);
      expect(steps).toEqual(new Set([1, 2, 3, 4]));
    });

    it('step 1 is present', () => {
      expect(parseDecisionPointSteps(DEBUG_PRODUCTION_ISSUE_BODY).has(1)).toBe(true);
    });

    it('step 4 is present (After Step 4 form)', () => {
      expect(parseDecisionPointSteps(DEBUG_PRODUCTION_ISSUE_BODY).has(4)).toBe(true);
    });

    it('step 5 is absent (not referenced)', () => {
      expect(parseDecisionPointSteps(DEBUG_PRODUCTION_ISSUE_BODY).has(5)).toBe(false);
    });
  });

  describe('nested "If **After Step N**:" form (build-ai-powered-feature excerpt)', () => {
    it('extracts steps 1, 2, 4, 6 from nested sub-bullets', () => {
      const steps = parseDecisionPointSteps(BUILD_AI_FEATURE_BODY);
      expect(steps).toEqual(new Set([1, 2, 4, 6]));
    });

    it('does NOT add a step for the "?" placeholder top-level bullet', () => {
      // Only 4 unique step numbers: 1, 2, 4, 6
      expect(parseDecisionPointSteps(BUILD_AI_FEATURE_BODY).size).toBe(4);
    });

    it('step 3 is absent (not referenced)', () => {
      expect(parseDecisionPointSteps(BUILD_AI_FEATURE_BODY).has(3)).toBe(false);
    });

    it('step 5 is absent (not referenced)', () => {
      expect(parseDecisionPointSteps(BUILD_AI_FEATURE_BODY).has(5)).toBe(false);
    });
  });

  describe('"Before Step N:" form (security-audit-codebase excerpt)', () => {
    it('extracts steps 1, 3, 5 from Before/At forms', () => {
      const steps = parseDecisionPointSteps(SECURITY_AUDIT_BODY);
      expect(steps).toEqual(new Set([1, 3, 5]));
    });

    it('step 1 is present (Before Step 1)', () => {
      expect(parseDecisionPointSteps(SECURITY_AUDIT_BODY).has(1)).toBe(true);
    });

    it('step 2 is absent (not referenced)', () => {
      expect(parseDecisionPointSteps(SECURITY_AUDIT_BODY).has(2)).toBe(false);
    });
  });

  describe('section boundary -- does not bleed into adjacent sections', () => {
    it('step numbers in Failure Handling section are not collected', () => {
      // DEBUG body has "Step 1 cannot determine severity" under Failure Handling
      // that should not inflate the set
      const steps = parseDecisionPointSteps(DEBUG_PRODUCTION_ISSUE_BODY);
      // Failure Handling references "Step 1" but it is below ## Failure Handling,
      // so the set should be exactly {1, 2, 3, 4}, not larger
      expect(steps.size).toBe(4);
    });

    it('step numbers before ## Decision Points are not collected', () => {
      const body = `
## Steps

**Step 7: Preamble step**

Do things at Step 7.

## Decision Points

- **At Step 2:** Branch here.

## Expected Outcome

Done.
`;
      const steps = parseDecisionPointSteps(body);
      expect(steps).toEqual(new Set([2]));
    });
  });

  describe('edge cases', () => {
    it('handles Decision Points section at end of document (no trailing ##)', () => {
      const body = `
## Steps

**Step 1: Only Step**

Do this.

## Decision Points

- **At Step 1:** Decide here.
`;
      expect(parseDecisionPointSteps(body)).toEqual(new Set([1]));
    });

    it('deduplicates step numbers referenced more than once', () => {
      const body = `
## Decision Points

- **At Step 2:** First mention.
- **After Step 2:** Second mention of the same step.
- **Before Step 3:** Another step.
`;
      expect(parseDecisionPointSteps(body)).toEqual(new Set([2, 3]));
    });

    it('case-insensitive matching for "After", "At", "Before", "Step"', () => {
      const body = `
## Decision Points

- **AFTER STEP 1:** Uppercase.
- **at step 2:** Lowercase.
- **Before STEP 3:** Mixed.
`;
      expect(parseDecisionPointSteps(body)).toEqual(new Set([1, 2, 3]));
    });

    it('does not match non-decision-points step references in body prose', () => {
      // Step references in a Failure Handling section should not be returned
      const body = `
## Decision Points

- **At Step 1:** Branch here.

## Failure Handling

- Step 2 fails: do this.
- At Step 3: if this fails, retry.
`;
      // Only step 1 from the Decision Points section
      expect(parseDecisionPointSteps(body)).toEqual(new Set([1]));
    });
  });
});

// ---------------------------------------------------------------------------
// stepHasDecisionPoint
// ---------------------------------------------------------------------------

describe('stepHasDecisionPoint', () => {
  it('returns true for a step that has a decision point', () => {
    expect(stepHasDecisionPoint(DEBUG_PRODUCTION_ISSUE_BODY, 1)).toBe(true);
    expect(stepHasDecisionPoint(DEBUG_PRODUCTION_ISSUE_BODY, 4)).toBe(true);
  });

  it('returns false for a step that does not have a decision point', () => {
    expect(stepHasDecisionPoint(DEBUG_PRODUCTION_ISSUE_BODY, 5)).toBe(false);
    expect(stepHasDecisionPoint(DEBUG_PRODUCTION_ISSUE_BODY, 99)).toBe(false);
  });

  it('returns false when the body has no Decision Points section', () => {
    expect(stepHasDecisionPoint(NO_DECISION_POINTS_BODY, 1)).toBe(false);
  });

  it('returns true for nested sub-bullet form (build-ai-powered-feature)', () => {
    expect(stepHasDecisionPoint(BUILD_AI_FEATURE_BODY, 6)).toBe(true);
  });

  it('returns false for step 3 which is absent in build-ai-powered-feature', () => {
    expect(stepHasDecisionPoint(BUILD_AI_FEATURE_BODY, 3)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// shouldReviewAfterStep
// ---------------------------------------------------------------------------

describe('shouldReviewAfterStep', () => {
  it('returns true when hasDecisionPoint is true and producedArtifact is false', () => {
    expect(
      shouldReviewAfterStep({ hasDecisionPoint: true, producedArtifact: false }),
    ).toBe(true);
  });

  it('returns true when hasDecisionPoint is false and producedArtifact is true', () => {
    expect(
      shouldReviewAfterStep({ hasDecisionPoint: false, producedArtifact: true }),
    ).toBe(true);
  });

  it('returns true when both are true', () => {
    expect(
      shouldReviewAfterStep({ hasDecisionPoint: true, producedArtifact: true }),
    ).toBe(true);
  });

  it('returns false when both are false (mechanical step, flow straight through)', () => {
    expect(
      shouldReviewAfterStep({ hasDecisionPoint: false, producedArtifact: false }),
    ).toBe(false);
  });
});
