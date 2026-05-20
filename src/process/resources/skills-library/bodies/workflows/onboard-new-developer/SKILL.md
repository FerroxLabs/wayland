---
name: onboard-new-developer
description: >-
  Orchestrates structured developer onboarding by chaining five engineering
  skills into a progressive learning pipeline. Covers documentation review,
  version control setup, code review participation, test-driven first
  contribution, and commit conventions.
  Use when onboarding a new developer to a team or project with structured
  knowledge transfer.
  Do NOT use for self-directed learning, conference workshops, or onboarding
  non-developers to technical projects.
license: Apache-2.0
type: workflow
skills: technical-documentation git-pr-workflow code-review-patterns tdd-workflow conventional-commits
trigger_phrases: onboard new developer new team member setup developer onboarding process new hire developer
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: teaching career step-by-step planning guide
  category: software-project
  depends: technical-documentation git-pr-workflow code-review-patterns tdd-workflow conventional-commits
  disclaimer: none
  difficulty: intermediate
---

# Onboard New Developer

**Estimated time:** 1-2 weeks (first contribution within 3-5 days, full onboarding within 2 weeks)

This workflow chains five atomic skills into a structured onboarding process for new developers joining a team or project. It moves progressively from documentation and environment setup through version control practices, code review participation, a test-driven first contribution, and commit conventions. Each step builds confidence and competence, ensuring the new developer contributes safely and effectively from their first week.

**Critical note:** The goal is a productive first contribution within the first week, not complete mastery of the codebase. Onboarding is an ongoing process; this workflow covers the structured initial period that gets the developer to their first merged pull request.

## When to Use

- A new developer is joining the team and needs a structured onboarding plan
- User wants to create a repeatable onboarding process for their engineering team
- User is the new developer and wants a self-guided onboarding checklist
- User is transitioning a developer from one project to another within the organization
- Do NOT use when: onboarding a non-developer (product manager, designer) to the team, the developer is attending a workshop or conference talk, or the developer is learning programming from scratch (use education skills directly)

## Prerequisites

Before starting this workflow, ensure:

1. **Development environment documentation exists:** There is a README or setup guide that covers how to install dependencies, build the project, and run tests. If this does not exist, creating it is Step 1's first deliverable.
2. **Repository access is granted:** The new developer has access to the source code repository, CI system, deployment dashboards, and internal communication channels.
3. **Onboarding buddy is assigned:** An experienced team member is available to answer questions and review the new developer's first contributions.
4. **First task is identified:** A small, well-defined task (bug fix, small feature, documentation improvement) is selected for the new developer's first contribution.

## Steps

**Step 1: Review and Improve Project Documentation** (uses: technical-documentation)

Walk the new developer through the project's technical documentation. This step serves dual purposes: the new developer learns the system architecture, and gaps in documentation are identified and filled as they encounter them.

- Input: Existing project documentation (README, architecture docs, API docs, deployment guides), new developer's technical background and experience level
- Output: Updated documentation with gaps filled (the new developer writes documentation for anything that was unclear or missing), architecture overview understood, development environment set up and verified, and a list of questions or areas that need further explanation from the team
- Key focus: The new developer should be able to set up the development environment, run the test suite, and start the application locally by the end of this step. Any step in the setup process that is undocumented or unclear is a documentation gap that the new developer fixes as their first contribution to the project.

**Step 2: Set Up Git Workflow** (uses: git-pr-workflow)

Establish the new developer's version control workflow including branching, pull request creation, and merge processes. This step ensures the developer understands how code flows from their local machine to production.

- Input: Project branching strategy documentation, CI pipeline configuration, pull request template, merge requirements (required reviewers, CI checks)
- Output: New developer has: cloned the repository, created a practice branch, made a small change (documentation fix from Step 1), created a pull request following the team template, and understands the merge requirements and CI feedback
- Key focus: The first pull request should be low-stakes (documentation fix, typo correction, or README update) so the developer learns the mechanical process of branch, commit, push, PR, review, merge without the pressure of getting code right. This builds confidence with the tooling before writing production code.

**Step 3: Participate in Code Reviews** (uses: code-review-patterns)

The new developer participates in code reviews as both a reviewer and a reviewee. Reviewing existing pull requests teaches codebase patterns faster than reading documentation alone.

- Input: Open pull requests from team members, team code review guidelines, codebase conventions documentation, the new developer's first pull request from Step 2
- Output: New developer has: reviewed at least 2 pull requests from team members (leaving substantive comments), received review feedback on their own pull request, merged their first pull request, and developed familiarity with the most active areas of the codebase
- Key focus: Assign the new developer to review pull requests in the area of the codebase where they will work. Reviewing code teaches patterns, conventions, and architectural decisions faster than reading code alone. Encourage the developer to ask questions in reviews; "Why is this pattern used here?" is a valuable review comment from a new team member.

**Step 4: Complete First Feature Using TDD** (uses: tdd-workflow)

The new developer implements their first task using test-driven development. Writing tests first forces them to understand the existing test infrastructure, assertion patterns, and the behavior they are implementing before writing production code.

- Input: First task from prerequisites (small, well-defined bug fix or feature), existing test suite as examples, acceptance criteria for the task, team testing conventions
- Output: Completed implementation with: tests written first (following existing test patterns), implementation passing all tests, code meeting team style conventions, and a pull request ready for review
- Key focus: The first task should be scoped to 1-3 days of work. The onboarding buddy should be available for questions but should not pair-program the solution. The developer needs to struggle productively with the codebase to build genuine understanding. If the developer is blocked for more than 30 minutes, they should ask for guidance.

**Step 5: Apply Commit Conventions** (uses: conventional-commits)

The new developer learns and applies the team's commit conventions to all their work. This step ensures consistent commit history that supports automated changelog generation, semantic versioning, and clear change documentation.

- Input: Team commit convention documentation, git log examples showing good commit messages, semantic versioning policy, changelog generation process
- Output: New developer has: reformatted their feature branch commits to follow conventions, understands the relationship between commit types and version bumps, can write commit messages that describe the "why" in the subject and the "what" in the body, and has merged their first feature contribution with properly formatted commits
- Key focus: Commit conventions are habits that must be established early. Review commit messages with the same rigor as code during the first few pull requests. Common mistakes: using "fix" for features, omitting the scope, writing "what" instead of "why" in the subject line.

## Decision Points

- **Before Step 1:** Assess the new developer's experience level. If they are a senior developer joining the team, abbreviate Steps 1-2 (they know how to set up an environment and create PRs) and spend more time on Steps 3-4 (learning this specific codebase's patterns and conventions).

- **At Step 2:** If the project does not have a defined branching strategy, this is a gap. Either define one (using git-branching-strategy skill) or adopt a simple trunk-based model for now and revisit later.

- **At Step 4:** Choose the first task carefully. It should touch the area of the codebase the developer will work in most frequently. Avoid tasks that require understanding the entire system; choose a task scoped to one module or feature.

## Failure Handling

- **Step 1 environment setup fails:** This is the most common onboarding failure. If the README instructions do not work, the new developer should document every deviation between the instructions and what actually works. This is their first contribution: fixing the setup documentation.

- **Step 3 new developer does not feel qualified to review code:** Emphasize that review is a learning tool, not a gatekeeping role. The new developer's fresh perspective catches things the team has become blind to. Encourage questions over approvals: asking "What does this do?" is more valuable than approving code they do not understand.

- **Step 4 first task is too large or complex:** If the developer is struggling after 2 days, the task is likely too large. Split it into a smaller deliverable that can be completed and merged. A smaller completed contribution is more valuable for onboarding than a larger incomplete one.

- **Step 5 developer resists commit conventions:** Show the concrete benefits: automated changelogs, clear blame history, semantic version bumps. If the team does not have these automated benefits configured, set them up to demonstrate the value of consistent conventions.

- **Onboarding buddy is unavailable:** If the assigned buddy is pulled into other work, escalate to the team lead. Dedicated onboarding time is an investment that pays off in the developer's productivity for months afterward. An extra hour this week saves days of confusion next month.

## Expected Outcome

When this workflow is complete, the user will have:

1. A development environment set up and documented with gaps filled by the new developer's fresh perspective
2. A working Git workflow with pull request process practiced through at least one low-stakes contribution
3. Code review experience both as reviewer (learning codebase patterns) and reviewee (learning team conventions)
4. A completed first feature contribution built with TDD practices and merged to the main branch
5. Commit convention habits established with proper formatting applied to all contributions

## Output Format

```
DEVELOPER ONBOARDING TRACKER
==============================

Developer: [name]
Team: [team name]
Start Date: [date]
Onboarding Buddy: [buddy name]

[ ] Step 1: Documentation Review
    Status: [pending/in-progress/complete]
    Environment: [set up / verified / issues]
    Docs improved: [count of updates]

[ ] Step 2: Git Workflow Setup
    Status: [pending/in-progress/complete]
    First PR: #[number] [merged/open]

[ ] Step 3: Code Review Participation
    Status: [pending/in-progress/complete]
    PRs reviewed: [count]
    Comments given: [count]

[ ] Step 4: First Feature (TDD)
    Status: [pending/in-progress/complete]
    Task: [task description]
    Tests written: [count]
    PR: #[number] [merged/open]

[ ] Step 5: Commit Conventions
    Status: [pending/in-progress/complete]
    Convention followed: [yes/learning]

Timeline: ______ days
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- For senior developers, abbreviate Steps 1-2 and focus on Steps 3-4
- For remote developers, add extra check-in points between steps
- Adjust first task complexity based on developer experience level

## Edge Cases

- **No existing documentation:** Step 1 becomes "create documentation from scratch." The new developer interviews team members and documents what they learn. This is an exceptionally valuable first contribution.
- **New developer is more experienced than the team:** Focus Step 3 on learning the specific codebase rather than general engineering patterns. Encourage the developer to share knowledge while still learning the project-specific context.
- **Multiple new developers starting simultaneously:** Pair them together for Steps 1-2 (they can help each other with setup issues) but give them separate first tasks in Step 4 (they each need individual contribution experience).
- **Project has no tests:** Step 4 becomes "set up test infrastructure and write the first tests." This is harder than adding tests to an existing suite but equally valuable for onboarding.
- **Remote-first team:** Add asynchronous communication checkpoints between steps. Use screen recordings for environment setup walkthroughs and recorded architecture overviews that the new developer can review at their own pace.

## Example

**Scenario:** "Onboard a mid-level developer joining a team of 5 working on a React and Node.js e-commerce platform. The developer has 3 years of experience with React but has not used the team's specific tech stack (Next.js, Prisma, PostgreSQL)."

**Input:** New developer: 3 years React experience, familiar with Git basics, no experience with Next.js or Prisma. Project: e-commerce platform with 45,000 lines of code, 340 tests, GitHub for source control, Vercel for deployment. First task selected: add a "sort by price" feature to the product listing page.

**Output:** Developer completes first feature contribution within 5 days with full test coverage.

**Step 1 (technical-documentation):** Developer follows README setup instructions. Discovers 3 gaps: .env.example is missing 2 required variables, database seeding instructions reference a deprecated command, and the Prisma migration step requires a specific Node.js version not mentioned. Developer creates PR with documentation fixes and has the full application running locally within 4 hours.

**Step 2 (git-pr-workflow):** Developer creates feature branch from main, pushes documentation fixes from Step 1, creates PR using the team template (title, description, testing notes, screenshots). PR passes CI checks. Learns the team uses squash merge. Merges first PR after a single review approval.

**Step 3 (code-review-patterns):** Developer reviews 3 open PRs over 2 days. Comments include: "I see this pattern uses server components for data retrieval; is this the team convention for all list pages?" (learning question), "This error message could be more specific about which field failed validation" (useful feedback from fresh eyes). Receives review feedback on their own Step 1 PR: "Good catch on the env variables; can you also add comments explaining what each variable is for?"

**Step 4 (tdd-workflow):** Developer implements "sort by price" feature. Day 1: writes 4 tests (sort ascending, sort descending, sort with filters active, sort with empty results). Tests fail. Day 2: implements sort parameter in the API query, adds sort dropdown to the product listing component, all tests pass. Day 3: refactors dropdown to use the existing UI component library, adds loading state during re-sort. PR created with 247 lines changed, 4 new tests plus 1 updated existing test. Reviewed and merged on Day 4.

**Step 5 (conventional-commits):** Developer reformats commits: "feat(products): add price sorting to product listing page" (subject), "Users can sort product listings by price ascending or descending. Sort state persists across pagination. Default sort order is relevance." (body). Buddy reviews commit messages and suggests adding the ticket number to the footer. Developer amends final commit before merge.

**Result:** New developer merged 2 pull requests in first week (documentation fix + sort feature), reviewed 3 peer pull requests, and is now familiar with the team's Git workflow, testing patterns, code review expectations, and commit conventions. The developer is assigned a second, larger task starting week 2 with reduced buddy oversight.
