---
name: modernize-legacy-system
description: >-
  Systematic legacy system modernization workflow covering code review and
  assessment, technical debt analysis, strategic refactoring, test coverage
  improvement, containerization, and CI/CD pipeline setup for a safe,
  incremental transition from legacy to modern architecture.

  Use when the user wants to modernize legacy system or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  code-reviewer tech-debt-analyzer refactoring-guru unit-test-writer
  docker-engineer cicd-architect
trigger_phrases: >-
  modernize my legacy system how to refactor old code migrate legacy application
  reduce technical debt update old codebase legacy system migration plan
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: refactoring devops step-by-step planning
  category: software-project
  depends: >-
    code-reviewer tech-debt-analyzer refactoring-guru unit-test-writer
    docker-engineer cicd-architect
  disclaimer: none
  difficulty: advanced
---
# Modernize Legacy System

**Estimated time:** 4-12 weeks

This workflow guides engineering teams through the disciplined process of
modernizing a legacy system. Rather than a risky big-bang rewrite, this workflow
follows the proven strangler fig pattern: assess the current state, build a
safety net of tests, refactor incrementally, containerize, and establish modern
CI/CD practices.

Each step is designed to reduce risk. You build confidence through understanding
before changing code, add tests before refactoring, and containerize before
deploying to new infrastructure.

By the end of this workflow you will have: a comprehensive understanding of
your codebase's health, a prioritized tech debt remediation plan, refactored
code with test coverage, Docker containers, and a CI/CD pipeline for safe
ongoing deployment.

## When to Use

- User wants to modernize legacy system
- User needs a structured, step-by-step process for modernize legacy system
- modernize my legacy system
- how to refactor old code
- migrate legacy application
- Do NOT use when: the request is outside the scope of modernize legacy system or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Access to the legacy system's source code and version control
- Ability to run the system locally or in a development environment
- Knowledge of the system's business purpose and critical paths
- Stakeholder buy-in for dedicated modernization time
- At least one developer who understands the existing system

## Steps

**Step 1: Review the Codebase** (uses: code-reviewer)

perform a comprehensive assessment of the
legacy codebase. This is a diagnostic step -- understand before you change.

- Input: Access to the legacy codebase and its repository history, Any existing documentation (even if outdated), Knowledge of the system's primary use cases and critical paths
- Output: Comprehensive health report of the legacy system, Third-party dependency versions, vulnerabilities, and upgrade paths, Current system architecture documentation
- Key focus: Code structure analysis (module organization, dependency graph)

**Step 2: Analyze Technical Debt** (uses: tech-debt-analyzer)

quantify and prioritize the technical debt
in the system.

- Input: `codebase-assessment` from Step 1 (code quality findings), `dependency-audit` from Step 1 (outdated and vulnerable dependencies), `critical-paths` from Step 1 (business-critical areas to protect)
- Output: Categorized and prioritized technical debt register, Quantitative measurements of code health, Phased plan for debt reduction with effort estimates
- Key focus: Categorizing debt by type (design debt, code debt, test debt, dependency debt,

**Step 3: Refactor the Code** (uses: refactoring-guru)

systematically refactor the codebase. This is
the core transformation step.

- Input: `debt-inventory` from Step 2 (what to refactor, in priority order), `remediation-roadmap` from Step 2 (phasing and sequencing), `critical-paths` from Step 1 (areas requiring extra caution)
- Output: Record of all refactorings applied with rationale, Updated codebase with improved structure and quality, Documentation of architectural changes made
- Key focus: Starting with the highest-priority, lowest-risk refactorings

**Step 4: Build the Test Safety Net** (uses: unit-test-writer)

build a comprehensive test suite that serves
as a safety net for ongoing changes.

- Input: `critical-paths` from Step 1 (highest-priority areas for test coverage), `codebase-assessment` from Step 1 (existing test gaps), `refactored-code` from Step 3 (refactored code to protect with tests)
- Output: Comprehensive test suite covering critical paths, Code coverage metrics with gap analysis, Testing standards and patterns for the team
- Key focus: Characterization tests for legacy code (capture current behavior before changing it)

**Step 5: Containerize the System** (uses: docker-engineer)

containerize the modernized application.

- Input: `architecture-map` from Step 1 (system components to containerize), `dependency-audit` from Step 1 (runtime dependencies to include), `refactored-code` from Step 3 (the modernized codebase)
- Output: Production-ready Dockerfiles for all components, Docker Compose for local development, Guide for transitioning from bare-metal to containerized deployment
- Key focus: Creating Dockerfiles for each service component

**Step 6: Establish CI/CD Pipeline** (uses: cicd-architect)

establish automated build, test, and deploy
pipelines.

- Input: `test-suite` from Step 4 (tests to run in CI), `dockerfiles` from Step 5 (container builds for the pipeline), `architecture-map` from Step 1 (deployment topology)
- Output: CI configuration with all quality gates, CD configuration with staging and production environments, Procedures for rolling back failed deployments
- Key focus: CI pipeline: lint, build, test, security scan on every push

## Decision Points

- **After Step 2:** What modernization strategy will you follow?
  - If **Incremental refactoring (strangler fig)**: Safest approach. Refactor piece by piece while keeping the system running. Recommended for most cases.
  - If **Parallel rewrite**: Build a new system alongside the old one. Higher risk, but necessary when the codebase is beyond refactoring. Step 3 focuses on the new codebase.
  - If **Lift and shift first**: Containerize the legacy system as-is first, then refactor in containers. Good when infrastructure modernization is the priority.

## Failure Handling

- **Big-bang rewrites:** Rewriting from scratch fails more often than it succeeds. Refactor incrementally.
- **Refactoring without tests:** Never refactor code that is not under test. Write tests first.
- **Boiling the ocean:** Do not try to fix everything at once. Follow the prioritized roadmap.
- **Ignoring the team:** Modernization requires team buy-in. Communicate the plan and progress regularly.
- **No metrics tracking:** Without before-and-after metrics, you cannot prove the investment was worthwhile.

## Expected Outcome

When this workflow is complete, the user will have:

1. Code quality metrics show measurable improvement over the starting baseline
2. Critical business paths have automated test coverage
3. The system runs in containers with automated deployment
4. The team can deploy to production confidently and frequently
5. Technical debt has been reduced to manageable levels
6. The system is easier for new developers to understand and contribute to

## Output Format

```
MODERNIZE LEGACY SYSTEM TRACKER
===============================

[ ] Step 1: Review the Codebase
    Status: [pending/in-progress/complete]
[ ] Step 2: Analyze Technical Debt
    Status: [pending/in-progress/complete]
[ ] Step 3: Refactor the Code
    Status: [pending/in-progress/complete]
[ ] Step 4: Build the Test Safety Net
    Status: [pending/in-progress/complete]
[ ] Step 5: Containerize the System
    Status: [pending/in-progress/complete]
[ ] Step 6: Establish CI/CD Pipeline
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Big-bang rewrites:** Rewriting from scratch fails more often than it succeeds. Refactor incrementally.
- **Refactoring without tests:** Never refactor code that is not under test. Write tests first.
- **Boiling the ocean:** Do not try to fix everything at once. Follow the prioritized roadmap.
- **Ignoring the team:** Modernization requires team buy-in. Communicate the plan and progress regularly.

## Example

**Input:** "I want to modernize legacy system and need a structured plan to follow step by step."

**Output:**

**Step 1 (code-reviewer):** Review the Codebase -- produces concrete deliverables for this phase.

**Step 2 (tech-debt-analyzer):** Analyze Technical Debt -- produces concrete deliverables for this phase.

**Step 3 (refactoring-guru):** Refactor the Code -- produces concrete deliverables for this phase.

**Step 4 (unit-test-writer):** Build the Test Safety Net -- produces concrete deliverables for this phase.

**Step 5 (docker-engineer):** Containerize the System -- produces concrete deliverables for this phase.

**Step 6 (cicd-architect):** Establish CI/CD Pipeline -- produces concrete deliverables for this phase.

**Result:** User has a complete modernize legacy system plan with all deliverables produced, validated, and ready for implementation.
