---
name: perform-tech-debt-sprint
description: >-
  Orchestrates a focused technical debt reduction sprint by chaining five
  engineering skills into a systematic cleanup pipeline. Covers debt
  assessment, code smell detection, incremental refactoring, test
  improvement, and safe release of improvements.
  Use when the team has allocated dedicated time to reduce technical debt
  and needs a structured approach to maximize impact.
  Do NOT use for ongoing maintenance, single refactoring tasks, or
  debt work mixed with feature development.
license: Apache-2.0
type: workflow
skills: tech-debt-assessment code-smell-detection refactoring-patterns test-refactoring release-management
trigger_phrases: tech debt sprint reduce technical debt cleanup sprint code quality improvement refactoring sprint
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: refactoring testing architecture planning step-by-step
  category: software-project
  depends: tech-debt-assessment code-smell-detection refactoring-patterns test-refactoring release-management
  disclaimer: none
  difficulty: advanced
---

# Perform Tech Debt Sprint

**Estimated time:** 1-2 weeks (dedicated sprint with no feature work)

This workflow chains five atomic skills into a structured approach for reducing technical debt during a dedicated sprint. It moves from assessment through detection, refactoring, test improvement, and safe release. The workflow maximizes the impact of limited debt-reduction time by prioritizing debt that most affects developer productivity and system reliability.

**Critical note:** This workflow requires dedicated time with no feature work. Mixing tech debt reduction with feature development defeats the purpose because feature work introduces new dependencies on the code being refactored. Schedule this as a distinct sprint or allocated time block.

## When to Use

- Team has allocated a dedicated sprint or time block specifically for technical debt reduction
- Codebase has accumulated debt that measurably slows feature development or causes reliability issues
- User wants a structured approach to maximize the impact of limited debt-reduction time
- Preparing the codebase for a major feature initiative that requires cleaner foundations
- Do NOT use when: doing routine maintenance alongside feature work, fixing a single known issue (refactor directly), or the codebase needs a complete rewrite rather than incremental improvement

## Prerequisites

Before starting this workflow, ensure:

1. **Dedicated time is allocated:** The team has agreed to spend 1-2 weeks exclusively on debt reduction with no concurrent feature work
2. **Stakeholder buy-in exists:** Management understands that this sprint produces no user-visible features and supports the investment
3. **Baseline metrics are captured:** You have current measurements for build time, test suite duration, deployment frequency, and defect rate to measure improvement after the sprint
4. **CI pipeline is green:** All existing tests pass before the sprint begins. Do not start refactoring with a broken build.

## Steps

**Step 1: Assess and Prioritize Technical Debt** (uses: tech-debt-assessment)

Survey the codebase to catalog all technical debt and prioritize it by impact on developer productivity and system reliability. This step produces the sprint backlog with ranked items.

- Input: Codebase access, team feedback on pain points, incident history, build and test metrics, dependency audit results
- Output: Prioritized debt inventory with: categorized items (architecture, code quality, dependencies, test coverage, infrastructure), impact ratings (blocks features, causes incidents, slows development, cosmetic), estimated effort per item (hours), and a ranked sprint backlog selecting the highest-impact items that fit within the sprint duration
- Key focus: Prioritize debt that the team encounters daily over debt in rarely-changed code. A messy utility module that every feature touches matters more than a poorly-structured module that has not changed in a year. Use the formula: priority equals frequency-of-encounter times severity-of-impact divided by effort-to-fix.

**Step 2: Detect Code Smells and Anti-patterns** (uses: code-smell-detection)

Analyze the prioritized areas from Step 1 to identify specific code smells, anti-patterns, and structural issues. This step produces the detailed refactoring plan with specific changes for each debt item.

- Input: Prioritized debt inventory from Step 1, static analysis tool output (linting, complexity metrics, duplication reports), codebase hotspot analysis (most frequently changed files)
- Output: Detailed smell catalog with: specific instances of code smells (God classes, long methods, feature envy, shotgun surgery, primitive obsession), anti-patterns with location and suggested fix, dependency graphs showing circular or unnecessary dependencies, and a refactoring plan with specific steps for each smell
- Key focus: Distinguish smells that indicate real problems from acceptable patterns. A long method that clearly processes a sequence of steps may be fine. A long method that mixes validation, business logic, and persistence needs decomposition. Focus on smells in the high-priority areas from Step 1.

**Step 3: Refactor Incrementally** (uses: refactoring-patterns)

Execute the refactoring plan from Step 2 using safe, incremental refactoring patterns. Each refactoring preserves behavior while improving structure. Each change is small enough to be reviewed and merged independently.

- Input: Refactoring plan from Step 2, existing test suite, team coding standards, version control
- Output: Refactored code with: each refactoring as a separate, reviewable commit, all existing tests still passing after each change, code complexity metrics improved (measurable reduction in cyclomatic complexity, duplication, or coupling), and documentation updated to reflect structural changes
- Key focus: Apply one refactoring pattern at a time. Do not combine Extract Method with Rename Variable with Move Class in a single commit. Atomic refactorings are easy to review, easy to revert, and easy to verify. Run the full test suite after each refactoring. If tests fail, revert and investigate before retrying.

**Step 4: Improve Tests** (uses: test-refactoring)

Refactor the test suite alongside the production code. This step fixes test smells (slow tests, brittle assertions, excessive mocking, unclear test names) and fills coverage gaps exposed by the production code refactoring.

- Input: Refactored production code from Step 3, existing test suite, coverage reports, test duration metrics
- Output: Improved test suite with: test smells fixed (faster, more reliable, more readable), coverage gaps filled for refactored code paths, test execution time maintained or reduced, and test names that describe behavior rather than implementation
- Key focus: Prioritize test speed and reliability over coverage percentage. A test suite that runs in 2 minutes and is trusted by the team is more valuable than one that runs in 20 minutes and is frequently ignored. Remove or fix flaky tests during this step.

**Step 5: Release the Improvements** (uses: release-management)

Package and release the sprint's improvements using the team's release process. This step ensures the refactoring reaches production safely and the impact is measurable.

- Input: All refactored code and improved tests from Steps 3-4, release process documentation, baseline metrics captured in prerequisites
- Output: Release containing all sprint improvements with: changelog documenting what was improved (for the team, not users), before/after metrics comparison (build time, test time, complexity scores, dependency counts), deployment verification, and identified items for the next debt sprint (items that did not fit in this sprint)
- Key focus: Deploy the improvements incrementally if possible rather than as a single large release. If the sprint touched 50 files, deploy in batches of 10-15 files to reduce risk. After the full deployment, compare metrics against the baseline to quantify the sprint's impact.

## Decision Points

- **At Step 1:** If the debt assessment reveals a single dominant issue (e.g., a monolithic module that should be split), consider dedicating the entire sprint to that one issue rather than spreading effort across many small items. Deep improvement on one problem often delivers more value than shallow fixes on ten.

- **At Step 3:** If a refactoring reveals a deeper architectural issue that cannot be resolved within the sprint, stop and document it. Do not attempt architectural changes that require more time than the sprint allows. Add the architectural issue to the next sprint's backlog with the additional context discovered.

- **At Step 4:** If test coverage is below 40 percent for the refactored areas, invest more time in Step 4 even if it means refactoring fewer items from Step 3. Tests are the safety net for all future changes; improving test coverage has the longest-lasting impact.

## Failure Handling

- **Step 1 produces an overwhelming debt list:** If the assessment finds hundreds of items, focus on the top 10 by impact. A sprint cannot fix everything; it should fix the most impactful items thoroughly rather than many items superficially.

- **Step 3 refactoring breaks tests unexpectedly:** If a refactoring causes test failures that are not obviously related to the change, the test may be testing implementation details rather than behavior. Fix the test to test behavior (not implementation) and then retry the refactoring.

- **Step 3 refactoring introduces subtle bugs:** If a refactoring passes all tests but introduces a behavioral change discovered later, the test suite has a coverage gap. Add a test that catches the behavioral change, revert the refactoring, then redo it with the new test in place.

- **Sprint runs out of time before completing the plan:** This is normal and expected. Package and release what is complete. Document what remains for the next sprint. Partially completed refactorings should be either merged (if they improve the code on their own) or reverted (if they require further steps to be beneficial).

- **Team morale drops during the sprint:** Debt sprints can feel unrewarding because there are no visible feature deliverables. Share metric improvements daily: "Test suite is 30 seconds faster" and "Build is 2 minutes shorter" are tangible wins that motivate continued effort.

## Expected Outcome

When this workflow is complete, the user will have:

1. A comprehensive technical debt inventory prioritized by impact on developer productivity
2. Detailed code smell analysis with specific instances and refactoring plans
3. Refactored codebase with measurably reduced complexity, duplication, and coupling
4. Improved test suite with fewer flaky tests, faster execution, and better coverage
5. A release containing all improvements with before/after metrics demonstrating impact
6. A backlog of remaining debt items prioritized for the next sprint

## Output Format

```
TECH DEBT SPRINT REPORT
=========================

Sprint: [sprint identifier]
Duration: [start date] to [end date]
Team: [team members]

Metrics Before/After:
  Build time: [before] -> [after]
  Test suite: [before] -> [after]
  Coverage: [before] -> [after]
  Complexity: [before] -> [after]

[ ] Step 1: Debt Assessment
    Total items found: [count]
    Sprint backlog: [count] items selected

[ ] Step 2: Smell Detection
    Smells cataloged: [count]
    Anti-patterns found: [count]

[ ] Step 3: Refactoring
    Items completed: [count/planned]
    Commits: [count]
    Files changed: [count]

[ ] Step 4: Test Improvement
    Tests added: [count]
    Tests fixed: [count]
    Flaky tests removed: [count]

[ ] Step 5: Release
    Version: [version]
    Deployed: [date]
    Impact verified: [yes/no]

Remaining Backlog: [count] items for next sprint
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Scale the sprint duration based on team size and debt severity
- For small teams (1-2 developers), focus on a single area per sprint
- Capture before/after metrics to build the case for future debt sprints

## Edge Cases

- **No existing tests to protect refactoring:** If test coverage is below 20 percent, split the sprint: first half writes characterization tests for the code you plan to refactor, second half performs the refactoring with the new tests as the safety net.
- **Sprint interrupted by production incident:** Pause the debt sprint, handle the incident, then resume. If the incident was caused by technical debt, add it as evidence for the value of debt sprints in the sprint retrospective.
- **Team disagrees on priorities:** If developers disagree on which debt to tackle, use objective metrics: change frequency (how often the code changes), defect density (how often it breaks), and coupling impact (how many other modules depend on it). Data resolves priority disputes.
- **Debt is in shared libraries used by multiple teams:** Coordinate with other teams before refactoring shared code. Their tests must also pass after the refactoring. Consider running the full test suite across all dependent projects in Step 3.
- **Management asks for feature work mid-sprint:** Resist scope creep. A debt sprint with feature work mixed in delivers neither effectively. If the feature request is urgent, defer remaining debt items and complete the sprint with what has been accomplished.

## Example

**Scenario:** "The team has a 2-week sprint allocated for tech debt in a Python Django application. The test suite takes 25 minutes, builds take 8 minutes, and developers report that the user management module is the biggest pain point."

**Input:** Django application: 65,000 lines of Python, 890 tests (73 percent coverage), 25-minute test suite, 8-minute build. Team: 4 developers. Known pain points: user management module (3,400 lines in a single file), duplicated database query patterns across 8 views, 42 flaky tests that are randomly skipped.

**Output:** Measurably improved codebase with reduced complexity and faster feedback loops.

**Step 1 (tech-debt-assessment):** Assessment identifies 67 debt items across 4 categories. Sprint backlog selected (top 12 by impact): decompose user management monolith (highest impact, most frequently changed file), extract shared query utilities (reduces duplication in 8 views), fix 42 flaky tests (restore trust in test suite), upgrade Django from 3.2 to 4.2 (security patches, modern features). Estimated total effort: 9 developer-days (fits in 2-week sprint with 4 developers).

**Step 2 (code-smell-detection):** User management module analysis: God Class (UserManager handles authentication, authorization, profile management, notifications, and audit logging), Long Method (create_user is 340 lines), Feature Envy (profile methods reach into notification module), and Shotgun Surgery (changing user permissions requires edits in 11 files). Refactoring plan: Extract AuthenticationService, AuthorizationService, ProfileService, and NotificationService from UserManager.

**Step 3 (refactoring-patterns):** Week 1: Extracted AuthenticationService (12 commits, 4 review cycles). Extracted AuthorizationService (8 commits, 3 review cycles). Extracted shared QueryBuilder utility (6 commits, reducing duplication from 8 views to shared call). All 890 tests pass after each extraction. Complexity metrics: UserManager reduced from 3,400 to 890 lines, average method length reduced from 45 to 18 lines.

**Step 4 (test-refactoring):** Fixed 42 flaky tests: 28 were timing-dependent (added explicit waits or deterministic mocking), 9 had shared mutable state (isolated test fixtures), 5 were order-dependent (added proper setup/teardown). Added 34 new tests for extracted services. Test suite duration reduced from 25 to 14 minutes by parallelizing independent test modules. Coverage increased from 73 to 81 percent.

**Step 5 (release-management):** Sprint deployed in 3 batches over final 2 days. Batch 1: extracted services (verified in staging for 4 hours). Batch 2: query utilities and flaky test fixes (verified by running full test suite 5 times with zero failures). Batch 3: Django upgrade from 3.2 to 4.2 (staged rollout: 25 percent traffic for 2 hours, then 100 percent). Final metrics: build time 8 to 6 minutes, test suite 25 to 14 minutes, coverage 73 to 81 percent, zero flaky tests (down from 42).

**Result:** Sprint delivered measurable improvements across all tracked metrics. Team velocity in the following sprint increased 18 percent due to faster feedback loops and reduced confusion in the user management module. 55 remaining debt items documented in backlog for future sprints.
