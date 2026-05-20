---
name: build-open-source-project
description: >-
  End-to-end workflow for launching a successful open source project from
  initial idea through repository setup, community building, and sustainable
  maintainership. Covers licensing, documentation, governance, funding, and the
  practices that separate abandoned repos from thriving communities.

  Use when the user wants to build open source project or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  startup-advisor readme-writer license-advisor git-workflow cicd-architect
  github-actions oss-documentation-system oss-community-builder
  oss-governance-architect release-manager maintainer-toolkit
  oss-funding-strategist
trigger_phrases: >-
  I want to start an open source project I want to launch an open source library
  I want to build a community around my project How do I open source my code
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: networking documentation step-by-step planning
  category: software-project
  depends: >-
    startup-advisor readme-writer license-advisor git-workflow cicd-architect
    github-actions oss-documentation-system oss-community-builder
    oss-governance-architect release-manager maintainer-toolkit
    oss-funding-strategist
  disclaimer: none
  difficulty: intermediate
---
# Build Open Source Project

**Estimated time:** 4-8 weeks

Launching a successful open source project is far more than pushing code to a public repository. It requires intentional design across licensing, documentation, community norms, release processes, and sustainability planning. This workflow guides you from a raw idea through a production-quality repository with an engaged contributor community and a path to long-term maintainership.

The workflow follows a proven sequence: validate the idea, establish the foundation (repo, license, docs), build contributor infrastructure, grow the community, and then set up governance and funding for sustainability.

## When to Use

- User wants to build open source project
- User needs a structured, step-by-step process for build open source project
- User wants to start an open source project
- User wants to launch an open source library
- User wants to build a community around my project
- Do NOT use when: the request is outside the scope of build open source project or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A working codebase or clear technical concept ready for implementation
- A GitHub (or similar platform) account with repository creation access
- Basic familiarity with Git branching and pull request workflows
- Willingness to engage with contributors and respond to issues
- Time commitment of at least 5 hours per week for community engagement

## Steps

**Step 1: Validate the Idea and Define Scope** (uses: startup-advisor)

validate your project idea. Assess the market landscape: are there existing tools that solve this problem? What is your unique value proposition? Define the minimum viable scope for your first public release. Write a one-paragraph mission statement that answers: "What does this project do, who is it for, and why should they use it instead of alternatives?"

- Input: Your project idea and the problem it solves, Existing alternatives and how yours differs, Target audience (developers, data scientists, DevOps engineers, etc.)
- Output: Project mission statement, Competitive landscape analysis, Minimum viable feature set for v0.1.0
- Key focus: Use the Startup Advisor skill to validate your project idea

**Step 2: Set Up Repository Foundation** (uses: git-workflow)

establish your repository structure. Set up a branching strategy appropriate for open source (typically trunk-based with release branches). Configure branch protection rules, commit conventions (Conventional Commits recommended), and PR templates. Create the directory structure, .gitignore, and .editorconfig files.

- Input: Project name and mission statement from Step 1, Language/framework decisions, Preferred branching strategy
- Output: Initialized Git repository with branch protection rules, `.gitignore`, `.editorconfig`, PR template, issue templates, Branching strategy documentation
- Key focus: Use the Git Workflow skill to establish your repository structure

**Step 3: Choose License and Legal Setup** (uses: license-advisor)

select the right license. Consider permissive (MIT, Apache 2.0) vs copyleft (GPL, AGPL) based on your goals. Add the LICENSE file, copyright headers, and a Developer Certificate of Origin (DCO) if needed. If your employer might have claims, resolve IP assignment before going public.

- Input: Project type (library, framework, CLI tool, application), Whether you want to allow proprietary use, Any employer intellectual property considerations
- Output: LICENSE file in repository root, Copyright header template for source files, CONTRIBUTOR LICENSE AGREEMENT (CLA) or DCO decision
- Key focus: Use the License Advisor skill to select the right license

**Step 4: Build Documentation Foundation** (uses: readme-writer)

Start with the README Writer skill to create a compelling README with badges, clear installation instructions, a quick-start guide, and a "Why this project?" section. Then build out CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, and initial user documentation. Your README is your project's front door -- make it welcoming.

- Input: Project mission statement and feature set, Installation requirements and dependencies, Basic usage patterns and examples
- Output: README.md with badges, installation, quick-start, and examples, CONTRIBUTING.md with setup instructions and PR process, CODE_OF_CONDUCT.md (Contributor Covenant recommended)
- Key focus: Start with the README Writer skill to create a compelling README with badges, clear installation instructions, a quick-start guide, and a "Why this project?" section

**Step 5: Set Up CI/CD and Release Pipeline** (uses: cicd-architect)

set up semantic versioning, automated changelog generation, and a release workflow that publishes to package registries. Ensure your pipeline runs fast enough that contributors get feedback within minutes.

- Input: Language/framework CI requirements, Target package registries (npm, PyPI, crates.io, etc.), Testing strategy (unit, integration, linting)
- Output: CI workflow (test, lint, build on every PR), Release workflow (tag-triggered publish to registry), Automated changelog generation configuration
- Key focus: Use the CI/CD Architect and GitHub Actions skills to build automated pipelines for testing, linting, and building on every PR

**Step 6: Prepare for Contributors** (uses: maintainer-toolkit)

create a contributor-friendly environment. Set up issue labels (good first issue, help wanted, bug, enhancement, documentation). Create issue templates for bug reports and feature requests. Write a "First Contribution" guide that walks newcomers through the exact steps to submit their first PR. Seed the issue tracker with 5-10 "good first issues" to attract initial contributors.

- Input: Types of contributions you want to encourage, Your response time expectations, Label taxonomy for issues
- Output: Issue label taxonomy, Bug report and feature request issue templates, First contribution guide
- Key focus: Use the Maintainer Toolkit skill to create a contributor-friendly environment

**Step 7: Launch and Build Community** (uses: oss-community-builder)

plan your launch and ongoing community engagement. Write a launch blog post or announcement. Share in relevant communities (not spammy -- provide genuine value). Set up a Discord or GitHub Discussions space for community interaction. Create a communication cadence: weekly updates, monthly newsletters, or regular office hours.

- Input: Target developer communities (Reddit, Hacker News, Discord, X/Twitter), Existing network and connections, Content you can create around the project
- Output: Launch announcement (blog post, social media), Community platform (Discord server or GitHub Discussions), Communication cadence plan
- Key focus: Use the OSS Community Builder skill to plan your launch and ongoing community engagement

**Step 8: Establish Governance** (uses: oss-governance-architect)

establish a lightweight governance model appropriate for your project's size. Start with a GOVERNANCE.md documenting how decisions are made, how maintainers are added, and the RFC process for significant changes. This can start simple (BDFL model) and evolve toward shared governance as the community grows.

- Input: Current contributor count and activity level, Decision-making bottlenecks you have experienced, Long-term project vision
- Output: GOVERNANCE.md, RFC process template, Maintainer nomination criteria
- Key focus: Use the OSS Governance Architect skill to establish a lightweight governance model appropriate for your project's size

**Step 9: Plan for Sustainability** (uses: oss-funding-strategist)

evaluate sustainability options. Set up GitHub Sponsors or Open Collective for donations. Identify companies that depend on your project as potential sponsors. Consider whether dual licensing, support contracts, or a hosted version could provide sustainability. The goal is ensuring the project does not depend on a single person's goodwill indefinitely.

- Input: Time commitment required for maintenance, Whether funding is needed or desired, Potential sponsors (companies using the project)
- Output: Funding platform setup (GitHub Sponsors / Open Collective), FUNDING.yml in repository, Sponsor outreach plan
- Key focus: Use the OSS Funding Strategist skill to evaluate sustainability options

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Pivot the concept or contribute to existing project
  - If **After Step 4**: Revise documentation until a newcomer can self-serve
  - If **After Step 7**: Increase outreach effort, improve "good first issues"

## Failure Handling

- **Building in private too long:** -- Launch early with a clear "alpha" label rather than waiting for perfection. Real users find real problems.
- **No response to contributors:** -- The fastest way to kill a community is ignoring PRs and issues. Set response time expectations and meet them.
- **Missing "good first issues":** -- Without clear entry points, potential contributors bounce. Maintain a backlog of accessible tasks.
- **Choosing the wrong license:** -- Changing licenses after the fact requires consent from all contributors. Get this right from the start.
- **Documentation rot:** -- Docs that do not match the code are worse than no docs. Automate where possible and review docs with every release.

## Expected Outcome

When this workflow is complete, the user will have:

1. Repository has clear documentation that enables self-service onboarding
2. CI/CD pipeline provides fast feedback on every contribution
3. At least 5 external contributors have merged PRs within the first 3 months
4. Community platform shows organic activity (questions, discussions, feature requests)
5. Governance model scales with community growth
6. Project has a realistic sustainability plan that does not depend on burnout

## Output Format

```
BUILD OPEN SOURCE PROJECT TRACKER
=================================

[ ] Step 1: Validate the Idea and Define Scope
    Status: [pending/in-progress/complete]
[ ] Step 2: Set Up Repository Foundation
    Status: [pending/in-progress/complete]
[ ] Step 3: Choose License and Legal Setup
    Status: [pending/in-progress/complete]
[ ] Step 4: Build Documentation Foundation
    Status: [pending/in-progress/complete]
[ ] Step 5: Set Up CI/CD and Release Pipeline
    Status: [pending/in-progress/complete]
[ ] Step 6: Prepare for Contributors
    Status: [pending/in-progress/complete]
[ ] Step 7: Launch and Build Community
    Status: [pending/in-progress/complete]
[ ] Step 8: Establish Governance
    Status: [pending/in-progress/complete]
[ ] Step 9: Plan for Sustainability
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Building in private too long:** -- Launch early with a clear "alpha" label rather than waiting for perfection. Real users find real problems.
- **No response to contributors:** -- The fastest way to kill a community is ignoring PRs and issues. Set response time expectations and meet them.
- **Missing "good first issues":** -- Without clear entry points, potential contributors bounce. Maintain a backlog of accessible tasks.
- **Choosing the wrong license:** -- Changing licenses after the fact requires consent from all contributors. Get this right from the start.

## Example

**Input:** "I want to build open source project and need a structured plan to follow step by step."

**Output:**

**Step 1 (startup-advisor):** Validate the Idea and Define Scope -- produces concrete deliverables for this phase.

**Step 2 (git-workflow):** Set Up Repository Foundation -- produces concrete deliverables for this phase.

**Step 3 (license-advisor):** Choose License and Legal Setup -- produces concrete deliverables for this phase.

**Step 4 (readme-writer-oss-documentation-system):** Build Documentation Foundation -- produces concrete deliverables for this phase.

**Step 5 (cicd-architect-github-actions-release-manager):** Set Up CI/CD and Release Pipeline -- produces concrete deliverables for this phase.

**Step 6 (maintainer-toolkit):** Prepare for Contributors -- produces concrete deliverables for this phase.

**Step 7 (oss-community-builder):** Launch and Build Community -- produces concrete deliverables for this phase.

**Step 8 (oss-governance-architect):** Establish Governance -- produces concrete deliverables for this phase.

**Step 9 (oss-funding-strategist):** Plan for Sustainability -- produces concrete deliverables for this phase.

**Result:** User has a complete build open source project plan with all deliverables produced, validated, and ready for implementation.
