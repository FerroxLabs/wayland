---
name: migrate-legacy-codebase
description: >-
  Orchestrates the systematic modernization of a legacy codebase by chaining
  four engineering skills into a structured migration pipeline. Covers technical
  debt assessment, incremental refactoring, integration testing, and safe
  deployment of modernized components.
  Use when the user needs to modernize a legacy system incrementally without
  breaking existing functionality.
  Do NOT use for greenfield rewrites, simple library upgrades, or projects
  where the legacy system can be replaced entirely.
license: Apache-2.0
type: workflow
skills: tech-debt-assessment refactoring-patterns integration-testing-patterns deployment-strategies
trigger_phrases: migrate legacy codebase modernize legacy system upgrade old codebase refactor legacy code
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: architecture refactoring testing devops step-by-step
  category: software-project
  depends: tech-debt-assessment refactoring-patterns integration-testing-patterns deployment-strategies
  disclaimer: none
  difficulty: advanced
---

# Migrate Legacy Codebase

**Estimated time:** 4-16 weeks (depending on codebase size, test coverage, and modernization scope)

This workflow chains four atomic skills into a structured approach for modernizing a legacy codebase. It moves from assessment through incremental refactoring with integration testing at every stage, ending with safe deployment of the modernized components. The workflow emphasizes incremental migration: the legacy system continues to serve users throughout the process, and each migration step is independently deployable and reversible.

**Critical note:** This workflow is for incremental modernization, not full rewrites. If you are considering a complete rewrite, reconsider: most legacy system rewrites fail because they lose accumulated business logic. This workflow preserves existing behavior while improving the codebase structure, patterns, and technology choices.

## When to Use

- User has a legacy codebase that needs modernization (outdated frameworks, patterns, or dependencies)
- User wants to reduce technical debt incrementally without halting feature development
- User needs to migrate from one technology to another while maintaining service availability
- User has a system with poor test coverage that needs safe refactoring strategies
- Do NOT use when: building a new system from scratch (use build-feature-end-to-end), doing a simple dependency upgrade (update dependencies directly), or the legacy system will be decommissioned entirely rather than modernized

## Prerequisites

Before starting this workflow, ensure:

1. **Legacy codebase is accessible and buildable:** You can compile, run, and deploy the existing system. If the build is broken, fix that first before attempting modernization.
2. **Production behavior is observable:** You have monitoring, logs, or at minimum can observe the system's behavior in production to verify that changes do not break existing functionality.
3. **Stakeholder alignment exists:** The team and management agree on the modernization goal. Modernization without clear objectives leads to scope creep and abandoned efforts.
4. **Parallel feature development is planned:** Coordinate with the team to ensure that feature work and modernization work do not create excessive merge conflicts.

## Steps

**Step 1: Assess Technical Debt** (uses: tech-debt-assessment)

Map the current state of the codebase to identify what needs modernization, what can stay, and what order to tackle the work. This step produces the migration roadmap that guides all subsequent work.

- Input: Legacy codebase access, architecture documentation (if it exists), known pain points from the development team, production metrics showing performance or reliability issues
- Output: Technical debt inventory with: categorized issues (architecture, code quality, dependencies, infrastructure), severity ratings (blocks feature work, causes incidents, slows development, cosmetic), dependency map showing coupling between components, and a prioritized migration roadmap with recommended order
- Key focus: Prioritize debt that blocks business objectives. A tangled module that the team changes weekly matters more than an unused module with poor code quality. Map dependencies between components to identify which can be migrated independently and which must be migrated together.

**Step 2: Refactor Incrementally** (uses: refactoring-patterns)

Execute the migration roadmap from Step 1 using incremental refactoring patterns. Each refactoring step must preserve existing behavior while improving the codebase structure. This step uses patterns like Strangler Fig, Branch by Abstraction, and Extract-and-Replace to make safe, reversible changes.

- Input: Migration roadmap from Step 1, legacy codebase, target architecture or technology decisions, team coding standards for the modernized code
- Output: Refactored code modules with: legacy interface preserved (callers do not need to change), internal implementation modernized, new patterns applied consistently, and each refactoring step small enough to be reviewed and merged independently
- Key focus: Use the Strangler Fig pattern for large migrations: build new functionality alongside the old, route traffic to the new implementation for new requests, and gradually migrate existing callers. Never refactor and add features simultaneously, as mixing the two makes it impossible to determine whether a regression was caused by the refactoring or the feature change.

**Step 3: Verify with Integration Tests** (uses: integration-testing-patterns)

Build and run integration tests that verify the refactored code produces the same results as the legacy code. This step is the safety net that allows aggressive refactoring while catching regressions before they reach production.

- Input: Refactored code from Step 2, legacy system as reference implementation, production data samples (anonymized), API contracts or interface specifications
- Output: Integration test suite with: behavioral equivalence tests (legacy and modernized code produce same output for same input), regression tests for known edge cases, contract tests verifying API compatibility, and performance comparison tests ensuring the modernized code meets or exceeds legacy performance
- Key focus: Write characterization tests before refactoring: tests that capture the current behavior of the legacy code, including its bugs. These tests ensure that the refactored code behaves identically. Only after the migration is complete and stable should you fix bugs found during characterization testing.

**Step 4: Deploy Modernized Components** (uses: deployment-strategies)

Deploy the refactored components to production using a strategy that allows comparison between legacy and modernized code. This step uses deployment patterns that minimize risk and allow quick rollback if the modernized code behaves differently from the legacy code.

- Input: Refactored and tested code from Steps 2-3, deployment infrastructure, monitoring dashboards, legacy system baseline metrics
- Output: Modernized components deployed to production with: traffic comparison between legacy and modern paths (if parallel running), monitoring confirming behavioral equivalence, performance comparison against legacy baseline, and rollback procedure tested and documented
- Key focus: Use parallel running (shadow mode) for high-risk migrations: route production traffic to both legacy and modernized code, compare outputs, and alert on differences. Only switch production traffic to the modernized code after the parallel comparison shows equivalent behavior for a statistically significant sample.

## Decision Points

- **At Step 1:** If the assessment reveals that modernization requires changing external interfaces (API contracts, database schemas shared with other systems), coordinate with downstream consumers before proceeding. Interface changes require a migration plan for every consumer.

- **At Step 2:** If a component is too tightly coupled to refactor incrementally, consider the Extract-and-Replace pattern: build the new component entirely, verify it passes all integration tests from Step 3, then swap it in one deployment. This is riskier but sometimes necessary for heavily coupled code.

- **At Step 3:** If integration tests reveal bugs in the legacy code, document them but do not fix them during the migration. Fixing bugs during refactoring makes it impossible to verify behavioral equivalence. Fix them in a separate step after the migration is verified.

- **At Step 4:** If parallel running shows behavioral differences, investigate each difference. Some differences are improvements (the modernized code handles an edge case correctly that the legacy code got wrong). Document intentional differences in the migration log.

## Failure Handling

- **Step 1 assessment is incomplete:** If the codebase is too large or poorly documented to assess fully, assess in modules. Start with the module that changes most frequently (highest pain, highest ROI for modernization) and expand the assessment as you learn the codebase.

- **Step 2 refactoring breaks an unexpected consumer:** If a refactoring change breaks a system you did not know depended on the legacy code, roll back the refactoring and add the unknown dependency to the dependency map from Step 1. Refactor with awareness of all consumers.

- **Step 3 tests are too slow to run frequently:** If integration tests take too long (over 30 minutes), split them into tiers: fast contract tests (run on every commit), medium behavioral tests (run on every merge), comprehensive characterization tests (run nightly). Prioritize fast feedback during active refactoring.

- **Step 4 deployment shows performance regression:** If the modernized code is slower than the legacy code, profile the hot paths and optimize before retrying deployment. Common causes: ORM overhead replacing raw SQL queries, serialization overhead from new data formats, or missing database indexes on new query patterns.

- **Team loses momentum mid-migration:** If the migration stalls because feature work takes priority, freeze the migration at a stable point. Ensure all partially completed work is either merged (if it improves the codebase on its own) or reverted (if it requires further steps to be useful). Do not leave the codebase in a half-migrated state.

## Expected Outcome

When this workflow is complete, the user will have:

1. A comprehensive technical debt assessment with prioritized migration roadmap
2. Incrementally refactored codebase with modern patterns and preserved external interfaces
3. An integration test suite that verifies behavioral equivalence between legacy and modernized code
4. Modernized components deployed to production with verified performance and behavioral equivalence
5. Documentation of migration decisions, intentional behavioral changes, and remaining debt items
6. A repeatable migration process that can be applied to remaining legacy components

## Output Format

```
LEGACY MIGRATION TRACKER
=========================

Codebase: [repository name]
Target: [modernization goal]
Scope: [components in scope]

[ ] Step 1: Technical Debt Assessment
    Status: [pending/in-progress/complete]
    Components assessed: [count]
    Debt items cataloged: [count]
    Migration priority: [component order]

[ ] Step 2: Incremental Refactoring
    Status: [pending/in-progress/complete]
    Components migrated: [count/total]
    Pattern used: [strangler fig/extract-replace/branch-by-abstraction]

[ ] Step 3: Integration Testing
    Status: [pending/in-progress/complete]
    Tests written: [count]
    Behavioral equivalence: [verified/pending]

[ ] Step 4: Production Deployment
    Status: [pending/in-progress/complete]
    Parallel running: [yes/no]
    Performance vs legacy: [faster/same/slower]
    Behavioral match: [percent]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Steps 2-4 repeat for each component in the migration roadmap
- For very large codebases, run Steps 1-4 per module rather than for the entire codebase at once
- Adjust timeline based on team size and parallel feature development load

## Edge Cases

- **No existing tests in the legacy codebase:** Step 3 becomes the first priority. Write characterization tests for the most critical code paths before any refactoring in Step 2. Accept that initial test coverage will be low and improve it incrementally with each migration cycle.
- **Legacy system uses an unsupported language or framework:** If the target is a complete language change (e.g., PHP to Go), the Strangler Fig pattern is essential. New features are built in the new language, and legacy features are migrated one endpoint at a time behind a reverse proxy that routes to the appropriate backend.
- **Database schema migration required:** If the modernization requires schema changes, add a data migration step between Steps 2 and 3. Use expand-and-contract: add new columns alongside old ones, migrate data, update code to use new columns, then drop old columns after verification.
- **Multiple teams working on the legacy codebase:** Coordinate migration boundaries with other teams. Establish clear ownership of which components each team migrates. Use integration tests from Step 3 as the contract between teams.
- **Performance-critical paths in legacy code:** Profile the legacy code's critical paths before refactoring to establish a performance baseline. The integration tests from Step 3 should include performance assertions to catch regressions immediately.

## Example

**Scenario:** "Migrate a 7-year-old Express.js monolith to a modern architecture. The application handles 50,000 daily active users with increasing reliability issues due to synchronous processing and a single-database bottleneck."

**Input:** Legacy system: Express.js 4.x on Node.js 12 (EOL), PostgreSQL monolithic database, no test coverage, 120,000 lines of JavaScript, 47 API endpoints, 3 developers. Goal: modernize to TypeScript, add async processing for heavy operations, improve reliability without a complete rewrite.

**Output:** Incrementally modernized codebase with TypeScript, async processing, and comprehensive test coverage.

**Step 1 (tech-debt-assessment):** Assessment identifies 5 high-priority areas: synchronous email sending blocking API responses (causes 5-second response times on 8 endpoints), raw SQL queries without parameterization in 23 locations, no error handling middleware (unhandled exceptions crash the process), Node.js 12 EOL with 4 unpatched CVEs, and monolithic route file with 3,400 lines. Migration priority: error handling first (stability), then async processing (performance), then TypeScript migration (maintainability), then Node.js upgrade (security).

**Step 2 (refactoring-patterns):** Phase 1 (week 1-2): Extract error handling middleware using Branch by Abstraction. Add global error handler, then convert each route to use structured error classes. Phase 2 (week 3-5): Strangler Fig for async processing. Introduce message queue (Redis-backed), convert email sending to async, verify via parallel running. Phase 3 (week 6-10): TypeScript migration. Convert one module per week starting with shared utilities, using tsc with allowJs for incremental adoption. Phase 4 (week 11-12): Node.js upgrade from 12 to 20, testing each major version step.

**Step 3 (integration-testing-patterns):** Before refactoring: wrote 89 characterization tests capturing current API behavior for all 47 endpoints (including 7 known bugs documented but not fixed). After each refactoring phase: run characterization tests to verify behavioral equivalence. Added 34 new integration tests for async processing behavior. Performance tests confirm email-sending endpoints respond in 200ms (down from 5 seconds) after async migration.

**Step 4 (deployment-strategies):** Each phase deployed independently with monitoring gates. Phase 1 (error handling): deployed with 2-hour monitoring window, no behavioral changes expected or observed. Phase 2 (async processing): parallel running for 1 week comparing response times and email delivery. Phase 3 (TypeScript): deployed per module with full regression suite. Phase 4 (Node.js upgrade): staged rollout, 10 percent traffic then 50 percent then 100 percent over 3 days.

**Result:** Codebase modernized from JavaScript/Express 4/Node 12 to TypeScript/Express 4/Node 20 with async processing, global error handling, and 123 integration tests. Reliability improved (99.2 percent to 99.8 percent uptime), response times improved (p95 from 4.8 seconds to 340ms for email-related endpoints), and developer velocity improved (TypeScript catches 40 percent of bugs at compile time that previously reached production).
