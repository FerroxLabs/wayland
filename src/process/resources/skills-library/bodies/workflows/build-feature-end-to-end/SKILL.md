---
name: build-feature-end-to-end
description: >-
  Orchestrates the full software feature development lifecycle from specification
  through production deployment, chaining five engineering skills into a
  cohesive build pipeline. Covers requirements gathering, branch strategy, test-driven
  implementation, peer review, and deployment.
  Use when the user needs to build a complete feature from idea to production
  with structured engineering practices at every stage.
  Do NOT use for hotfixes, one-line changes, or exploratory prototypes that
  skip formal review and testing.
license: Apache-2.0
type: workflow
skills: feature-spec git-branching-strategy tdd-workflow code-review-patterns deployment-strategies
trigger_phrases: build a feature end to end implement a new feature full feature development lifecycle
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: architecture testing devops planning step-by-step
  category: software-project
  depends: feature-spec git-branching-strategy tdd-workflow code-review-patterns deployment-strategies
  disclaimer: none
  difficulty: advanced
---

# Build Feature End to End

**Estimated time:** 1-4 weeks (depending on feature scope, team size, and review cycles)

This workflow chains five atomic skills into the complete lifecycle of building a software feature from initial specification through production deployment. Each step produces artifacts that feed directly into the next, creating a traceable path from business requirement to deployed code. The workflow enforces engineering discipline at every stage: requirements are formalized before coding begins, tests are written before implementation, code is reviewed before merging, and deployment follows a verified strategy.

**Critical note:** This workflow assumes you are building a non-trivial feature that warrants formal specification, testing, and review. For trivial changes (typo fixes, config updates), skip directly to the deployment step with an abbreviated review.

## When to Use

- User needs to build a complete software feature from requirements through deployment
- User wants a structured development process that produces traceable artifacts at each stage
- User is implementing a feature that affects multiple components or requires coordination across the codebase
- User wants to enforce TDD and code review as part of their development workflow
- Do NOT use when: the change is a one-line fix, a configuration update, an exploratory prototype, or a hotfix that must bypass the full process
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

1. **Product context exists:** The feature request or user story has been discussed and prioritized. You know what the feature should accomplish and who benefits from it.
2. **Codebase is accessible:** You have a working development environment with the repository cloned, dependencies installed, and tests passing on the main branch.
3. **Branching strategy is defined:** The team has an agreed-upon branching model (or you will define one in Step 2). You know where feature branches originate from and where they merge to.
4. **CI pipeline is operational:** Automated tests run on every push or pull request. If no CI pipeline exists, consider using the setup-ci-cd-pipeline workflow first.

## Steps

**Step 1: Write the Feature Specification** (uses: feature-spec)

Translate the business requirement into a formal feature specification that developers can implement against. This step eliminates ambiguity before any code is written by defining acceptance criteria, data model changes, API contracts, and user-facing behavior in a structured document.

- Input: Business requirement or user story, product context, existing system architecture documentation
- Output: Feature specification document with acceptance criteria, data model changes, API endpoint definitions, UI wireframes or behavior descriptions, and scope boundaries (what is explicitly out of scope)
- Key focus: Define measurable acceptance criteria that can be translated directly into test assertions. Each criterion should be verifiable: "User can filter dashboard by date range and see results update within 2 seconds" rather than "Dashboard should be fast."

**Step 2: Create the Feature Branch** (uses: git-branching-strategy)

Set up the version control structure for the feature work. This step establishes the branch, naming convention, and merge strategy based on the team's branching model. The branch isolates the feature work from the main development line until it passes review.

- Input: Feature specification from Step 1, repository branching model, feature identifier or ticket number
- Output: Feature branch created from the correct base branch, naming convention applied, branch protection rules verified, merge strategy documented (squash, rebase, or merge commit)
- Key focus: Name the branch with a consistent pattern that includes the feature identifier (e.g., feature/TICKET-123-user-dashboard-filters). Verify the base branch is up to date before creating the feature branch to minimize merge conflicts later.

**Step 3: Implement Using Test-Driven Development** (uses: tdd-workflow)

Build the feature using a red-green-refactor cycle. Write failing tests first based on the acceptance criteria from Step 1, then write the minimum code to make them pass, then refactor for clarity and maintainability. This step produces both the implementation and a comprehensive test suite.

- Input: Feature specification with acceptance criteria from Step 1, feature branch from Step 2, existing test infrastructure
- Output: Implemented feature with passing unit tests, integration tests covering the acceptance criteria, and refactored code that meets the team's style and quality standards
- Key focus: Write one test per acceptance criterion before writing any implementation code. The test suite should serve as executable documentation of the feature's behavior. If a test is hard to write, the specification is likely ambiguous and you should return to Step 1 to clarify.

**Step 4: Conduct Code Review** (uses: code-review-patterns)

Submit the feature for peer review. This step ensures the implementation meets quality standards, follows team conventions, handles edge cases, and does not introduce security vulnerabilities or performance regressions. The review covers both the code and the test suite.

- Input: Implemented feature with tests from Step 3, pull request with description linking to the feature specification, team review checklist
- Output: Approved pull request with review feedback addressed, all CI checks passing, reviewer sign-off confirming the implementation matches the specification
- Key focus: Structure the pull request description to help reviewers understand the context without reading the entire specification. Include a summary of changes, links to the specification, screenshots or recordings for UI changes, and notes on decisions made during implementation that reviewers should evaluate.

**Step 5: Deploy to Production** (uses: deployment-strategies)

Merge the approved feature and deploy it to production using the team's deployment strategy. This step covers the merge, deployment verification, and post-deployment monitoring to confirm the feature works correctly in the production environment.

- Input: Approved pull request from Step 4, deployment strategy (blue-green, canary, rolling), monitoring dashboards, rollback procedure
- Output: Feature deployed to production, post-deployment verification confirming acceptance criteria pass in production, monitoring baselines updated to include the new feature's metrics
- Key focus: Verify the feature in a staging environment before production deployment. After production deployment, monitor error rates, response times, and feature-specific metrics for at least 30 minutes before declaring the deployment successful. Have the rollback procedure ready and tested before deploying.

## Decision Points

- **Before Step 1:** If the feature is a small enhancement (under 100 lines of code, no data model changes), consider an abbreviated specification: acceptance criteria only, skip formal API contract documentation. If the feature is large (over 1,000 lines estimated), consider breaking it into smaller features that can each follow this workflow independently.

- **At Step 3:** If TDD reveals that the specification from Step 1 is incomplete or contradictory, return to Step 1 and update the specification before continuing. Do not write code that deviates from the specification without updating the specification first.

- **At Step 4:** If the review reveals fundamental design issues, return to Step 1 (if the specification is flawed) or Step 3 (if the implementation approach is wrong). Do not patch fundamental issues with incremental review feedback.

- **After Step 5:** If post-deployment monitoring shows unexpected behavior, decide between a hotfix (minor issue, fix forward) and a rollback (major issue, revert and re-enter this workflow at Step 3).

## Failure Handling

- **Step 1 specification is vague or incomplete:** Ask the product owner for 3 specific user scenarios that demonstrate the feature working correctly. Build the specification around these scenarios rather than abstract requirements.

- **Step 3 tests fail unexpectedly after passing locally:** Check for environment differences between local and CI: database seeding, timezone settings, API mocking configuration, or race conditions in async tests. Fix the environment parity before retrying.

- **Step 4 review cycle takes too long:** If the pull request is too large for efficient review (over 500 lines changed), split it into smaller pull requests that can be reviewed independently. Each sub-PR should be deployable on its own even if the full feature is not complete (use feature flags to hide incomplete functionality).

- **Step 5 deployment fails:** Roll back immediately if users are affected. Diagnose whether the failure is in the deployment process (infrastructure issue) or the code (runtime error). If the code worked in staging but fails in production, investigate environment-specific differences (environment variables, database schema, third-party service configuration).

- **Scope creep during implementation:** If new requirements emerge during Steps 3-4, add them to the specification as a future iteration rather than expanding the current feature branch. Complete the current scope first, deploy it, then start a new iteration of this workflow for the additional requirements.

## Expected Outcome

When this workflow is complete, the user will have:

1. A formal feature specification with measurable acceptance criteria that serves as documentation
2. A clean feature branch with atomic commits following the team's branching and commit conventions
3. A comprehensive test suite covering all acceptance criteria, serving as executable documentation
4. A reviewed and approved pull request with documented review feedback and resolution
5. The feature deployed to production with post-deployment verification confirming correct behavior
6. Monitoring baselines updated to include the new feature's metrics for ongoing observability

## Output Format

```
FEATURE BUILD TRACKER
=====================

Feature: [feature name]
Ticket: [ticket ID]
Branch: feature/[ticket-id]-[description]

[ ] Step 1: Feature Specification
    Status: [pending/in-progress/complete]
    Artifact: docs/specs/[feature-name].md

[ ] Step 2: Branch Setup
    Status: [pending/in-progress/complete]
    Branch: feature/[ticket-id]-[description]

[ ] Step 3: TDD Implementation
    Status: [pending/in-progress/complete]
    Tests: [count] passing, [count] failing

[ ] Step 4: Code Review
    Status: [pending/in-progress/complete]
    PR: #[number]
    Reviewers: [names]

[ ] Step 5: Production Deployment
    Status: [pending/in-progress/complete]
    Environment: [staging/production]
    Verification: [pass/fail]

Timeline: ______ days
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on feature complexity and team review cadence
- Steps 3 and 4 may iterate multiple times before proceeding to Step 5
- For solo developers, Step 4 can be self-review with a structured checklist

## Edge Cases

- **Feature requires database migration:** Add migration planning to Step 1 (schema changes, data backfill strategy). Ensure migrations are backward-compatible so rollback in Step 5 does not require a reverse migration.
- **Feature spans multiple services:** Coordinate specifications for each service in Step 1. Create separate feature branches per service in Step 2. Deploy the backend service first in Step 5, then the frontend.
- **Feature needs a feature flag:** Add flag configuration to Step 2 (branch setup) and include flag removal as a tracked follow-up task after the feature is verified in production.
- **No existing test infrastructure:** If Step 3 is the first time writing tests in this codebase, spend additional time setting up test runners, fixtures, and CI integration before writing feature tests.
- **Regulatory or compliance requirements:** Add compliance review as a sub-step within Step 4 (code review). Document compliance-relevant decisions in the feature specification from Step 1.

## Example

**Scenario:** "Build a user notification preferences feature for a SaaS application. Users should be able to choose which notifications they receive and through which channels (email, in-app, push)."

**Input:** Product requirement: users want control over notification frequency and channels. Current system sends all notifications to all users with no preferences. Tech stack: React frontend, Node.js API, PostgreSQL database. Team: 3 developers, weekly release cycle.

**Output:** Deployed notification preferences feature with full test coverage.

**Step 1 (feature-spec):** Specification defines: database schema (notification_preferences table with user_id, notification_type, channel, enabled columns), API endpoints (GET/PUT /v1/users/:id/notification-preferences), UI component (preferences page with toggles per notification type per channel), acceptance criteria (user can enable/disable email notifications for each type, preferences persist across sessions, default preferences are all-enabled for new users).

**Step 2 (git-branching-strategy):** Feature branch created: feature/NOTIFY-42-notification-preferences from develop. Squash merge strategy selected to keep main branch history clean. Branch protection requires 1 reviewer approval and all CI checks passing.

**Step 3 (tdd-workflow):** Tests written first: unit tests for preference model (default creation, toggle logic, validation), API integration tests (CRUD operations, authorization checks, invalid input handling), UI component tests (toggle interaction, loading states, error display). Implementation follows: migration creates notification_preferences table, API endpoints with validation, React component with optimistic UI updates.

**Step 4 (code-review-patterns):** Pull request submitted with 347 lines changed across 12 files. Reviewer feedback: add rate limiting to PUT endpoint, add index on (user_id, notification_type) for query performance, extract preference validation into shared utility. Feedback addressed in 2 follow-up commits. CI passes, reviewer approves.

**Step 5 (deployment-strategies):** Deployed to staging, QA verifies all acceptance criteria. Deployed to production via rolling update. Post-deployment monitoring confirms: no error rate increase, notification preference API responds in under 50ms (p95), 23 users update preferences in the first hour. Feature flag removed after 48 hours of stable operation.

**Result:** Notification preferences feature live in production with 12 tests covering all acceptance criteria, zero post-deployment issues, and monitoring confirming expected usage patterns.
