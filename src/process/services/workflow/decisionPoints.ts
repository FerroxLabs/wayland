/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Static Decision Point parser for workflow SKILL.md bodies.
 *
 * Workflow bodies have a `## Decision Points` section containing bullet items
 * that reference step numbers in three main forms (grounded in real bodies):
 *
 *   **After Step N:**   - most common; in debug/build/migrate workflows
 *   **At Step N:**      - common; in launch-saas, setup-ci-cd-pipeline, etc.
 *   **Before Step N:**  - seen in build-feature-end-to-end, security-audit, etc.
 *
 * Some bodies also use a nested format where the top-level bullet has
 * `**After Step ?:**` (a placeholder `?`) and sub-bullets carry the real step
 * numbers as `If **After Step N**:` or `If **After Step N:**`.
 * Example from build-ai-powered-feature:
 *
 *   - **After Step ?:**
 *     - If **After Step 1**: Reconsider whether AI is the right solution
 *     - If **After Step 2**: Explore alternative approaches
 *
 * The `?` placeholder does NOT produce a step number; only numeric references
 * are extracted. All step numbers are 1-based, matching parseSteps numbering.
 */

// Matches any of:
//   **After Step 3:**
//   **At Step 3:**
//   **Before Step 3:**
//   If **After Step 3**:   (nested bullet sub-variant)
//   If **After Step 3:**   (nested bullet sub-variant)
// Captures the digit(s) only when the token is a real number (not `?`).
const STEP_REF_RE =
  /(?:\*\*(?:after|at|before)\s+step\s+(\d+)[^*]*\*\*|if\s+\*\*(?:after|at|before)\s+step\s+(\d+)[^*]*\*\*)/gi;

/**
 * Extract the `## Decision Points` section body from a workflow body string.
 * Returns the text between the `## Decision Points` heading and the next `##`
 * heading (or end of string). Returns `null` if the section does not exist.
 */
function extractDecisionPointsSection(body: string): string | null {
  // Match "## Decision Points" heading (level-2 only, case-insensitive)
  const sectionStart = body.search(/^[ \t]*##[ \t]+decision\s+points[ \t]*$/im);
  if (sectionStart === -1) return null;

  // Advance past the heading line
  const afterHeading = body.indexOf('\n', sectionStart);
  if (afterHeading === -1) return '';
  const contentStart = afterHeading + 1;

  // Find the next ## heading (level-2 or any shallower heading)
  const nextSection = body.slice(contentStart).search(/^[ \t]*##[ \t]+\S/m);
  if (nextSection === -1) return body.slice(contentStart);
  return body.slice(contentStart, contentStart + nextSection);
}

/**
 * Parse all step numbers referenced in the `## Decision Points` section of a
 * workflow body. Returns a Set of 1-based step numbers. If the section is
 * absent or contains no numeric step references, returns an empty Set.
 *
 * Robust to the real phrasings found in bundled workflows:
 *   - "**After Step N:**", "**At Step N:**", "**Before Step N:**"
 *   - Nested: "If **After Step N**:" / "If **After Step N:**"
 * Does NOT extract step numbers from `?` placeholders.
 */
export function parseDecisionPointSteps(body: string): Set<number> {
  const section = extractDecisionPointsSection(body);
  if (section === null || section.trim() === '') return new Set();

  const steps = new Set<number>();
  STEP_REF_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = STEP_REF_RE.exec(section)) !== null) {
    // Group 1 = top-level form; group 2 = nested "If **...**" form
    const raw = m[1] ?? m[2];
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 1) {
      steps.add(n);
    }
  }
  return steps;
}

/**
 * Returns true when step `stepN` (1-based) has a Decision Point in the body.
 */
export function stepHasDecisionPoint(body: string, stepN: number): boolean {
  return parseDecisionPointSteps(body).has(stepN);
}

/**
 * Gate for the step-review beat in step-by-step run mode.
 *
 * The UI should pause for review after a step when EITHER:
 *   - the step has a static Decision Point in the workflow body, OR
 *   - the step produced a user-facing artifact at runtime
 *
 * The `producedArtifact` signal is dynamic and supplied by the caller; this
 * function only handles the gate logic itself.
 */
export function shouldReviewAfterStep(args: {
  hasDecisionPoint: boolean;
  producedArtifact: boolean;
}): boolean {
  return args.hasDecisionPoint || args.producedArtifact;
}
