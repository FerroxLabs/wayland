---
name: build-developer-tools
description: >-
  End-to-end workflow for building developer tools that developers actually want
  to use. Covers pain point discovery, CLI and SDK design, documentation,
  developer experience optimization, and community building around your tool.
  Applicable to CLIs, SDKs, libraries, and internal developer platforms.

  Use when the user wants to build developer tools or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  developer-experience-engineer api-designer shell-scripter typescript-guru
  unit-test-writer tutorial-writer readme-writer docs-site-builder
  oss-community-builder golden-path-designer
trigger_phrases: >-
  I want to build a CLI tool I need to create an SDK How do I build developer
  tools I want to improve developer experience
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: documentation step-by-step planning
  category: software-project
  depends: >-
    developer-experience-engineer api-designer shell-scripter typescript-guru
    unit-test-writer tutorial-writer readme-writer docs-site-builder
    oss-community-builder golden-path-designer
  disclaimer: none
  difficulty: intermediate
---
# Build Developer Tools

**Estimated time:** 4-8 weeks

The best developer tools are not the most feature-rich -- they are the ones that solve a real pain point with minimal friction. This workflow guides you through building developer tools that developers actually adopt: from discovering the pain point, through designing intuitive CLIs and SDKs, to creating documentation that makes developers productive in minutes, and building the community that sustains the tool.

Whether you are building a CLI, an SDK, a library, or an internal developer platform, the principles are the same: start with the developer's pain, design for the common case, document obsessively, and iterate based on real usage data. The workflow applies to both open-source tools and internal tools -- the difference is the community model, not the development discipline.

## When to Use

- User wants to build developer tools
- User needs a structured, step-by-step process for build developer tools
- User wants to build a CLI tool
- I need to create an SDK
- How do I build developer tools
- Do NOT use when: the request is outside the scope of build developer tools or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A developer pain point you want to solve (observed, not assumed)
- Programming proficiency in the tool's target language
- Experience as a user of developer tools (you should have strong opinions about what makes tools good or bad)
- Access to target developers for feedback (colleagues, community members, or early adopters)
- Willingness to prioritize developer experience over feature count

## Steps

**Step 1: Discover and Validate the Pain Point** (uses: developer-experience-engineer)

research and validate the pain point. Interview 5-10 target developers: what are they trying to accomplish, what tools do they currently use, where do they get stuck, and how much time do they waste? Map the developer journey for the task your tool addresses. Identify the moment of maximum friction -- this is where your tool must excel. Validate that the pain is frequent enough and painful enough to justify a new tool. If existing tools solve the problem adequately, consider contributing to them instead.

- Input: Observed developer pain points, Existing tools and their limitations, Target developer persona (role, experience level, workflow)
- Output: Developer pain point analysis (interviews + observations), Developer journey map for the target task, Friction point catalog (ranked by frequency and severity)
- Key focus: Use the Developer Experience Engineer skill to research and validate the pain point

**Step 2: Design the Developer Interface** (uses: api-designer)

design the public interface of your tool. For CLIs, use the Shell Scripter skill to design command structure, flags, and output format. Design for the common case first: the most frequent usage should be the simplest (fewest flags, shortest command). Follow existing conventions in your ecosystem (npm-style for JavaScript, cargo-style for Rust, git-style for general CLIs). Design error messages that help developers fix the problem, not just report it. Create a "5-minute experience" mockup: what does the developer type from install to first successful result?

- Input: Pain point and developer journey from Step 1, Tool type (CLI, SDK, library, platform), Target language(s) and ecosystem
- Output: Interface specification (commands, methods, parameters), Common use case examples (the top 5 things developers will do), Error message catalog (every error with a resolution hint)
- Key focus: Use the API Designer skill to design the public interface of your tool

**Step 3: Build the Core Tool** (uses: typescript-guru)

Use the TypeScript Guru skill (or equivalent for your language) to implement the core tool. Build only the features needed for the "5-minute experience" first -- resist adding features that are not validated by user research. For CLIs: implement help text, colored output, progress indicators, and graceful error handling. For SDKs: implement type-safe APIs, auto-completion support, and clear type definitions. For all tools: implement verbose/debug mode for troubleshooting, and ensure the tool provides actionable feedback for every operation (success confirmation, error with fix suggestion, progress for long operations).

- Input: Interface design from Step 2, Language and framework decisions, Core feature scope (MVP)
- Output: Core tool implementation (MVP feature set), Help text / API documentation embedded in code, Error handling with user-friendly messages
- Key focus: Use the TypeScript Guru skill (or equivalent for your language) to implement the core tool

**Step 4: Test Rigorously** (uses: unit-test-writer)

build a comprehensive test suite. Test the happy path for every command/method, error handling for every expected failure mode, edge cases (empty input, very large input, special characters, no permissions), and cross-platform behavior. For CLIs, test the output format (parseable by scripts) and exit codes. For SDKs, test type safety and error types. Implement integration tests that exercise the tool against real (or realistic) environments. The test suite must run in CI in under 5 minutes.

- Input: Implemented tool from Step 3, Edge cases and error scenarios, Target platforms
- Output: Unit test suite (happy path, errors, edge cases), Integration test suite (real environment interactions), Cross-platform test results
- Key focus: Use the Unit Test Writer skill to build a comprehensive test suite

**Step 5: Create World-Class Documentation** (uses: readme-writer)

create a README that gets developers to their first success in under 5 minutes: installation, quickstart, and the most common use case. Use the Tutorial Writer skill to create step-by-step guides for the top 3-5 use cases. Use the Docs Site Builder skill to create a documentation site with: getting started guide, API/CLI reference, configuration reference, troubleshooting guide, and migration guide (if replacing an existing tool). Documentation is your tool's user interface for learning -- invest accordingly.

- Input: Implemented and tested tool from Steps 3-4, Target developer persona from Step 1, Common use cases from Step 2
- Output: README with badges, installation, quickstart, and examples, Getting started guide (5-minute path to first success), 3-5 use case tutorials
- Key focus: Use the README Writer skill to create a README that gets developers to their first success in under 5 minutes: installation, quickstart, and the most common use case

**Step 6: Design Golden Paths** (uses: golden-path-designer)

create opinionated, recommended workflows for common tasks. Golden paths reduce decision fatigue: instead of presenting developers with 10 ways to accomplish a task, provide one recommended way that works well for most cases. Create project templates, configuration presets, and guided setup wizards. For internal tools, golden paths increase adoption because they reduce the cognitive load of getting started.

- Input: Documented tool from Step 5, Common workflow patterns, Best practices for tool usage
- Output: Golden path workflows for top 3-5 use cases, Project templates / scaffolding commands, Configuration presets for common scenarios
- Key focus: Use the Golden Path Designer skill to create opinionated, recommended workflows for common tasks

**Step 7: Launch and Build Community** (uses: oss-community-builder)

launch the tool and build a developer community. For open-source tools: publish to package registries (npm, PyPI, crates.io), write a launch blog post with the story behind the tool, share in relevant communities, and set up a Discord or GitHub Discussions for community support. For internal tools: announce at team meetings, create a Slack channel for support, and schedule onboarding sessions. Track adoption metrics: installs, daily active users, support tickets, and community engagement.

- Input: Published tool from Steps 1-6, Target developer communities, Support infrastructure needs
- Output: Package registry publication, Launch announcement (blog post, social media), Community platform (Discord, Discussions, Slack)
- Key focus: Use the OSS Community Builder skill to launch the tool and build a developer community

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Pivot to a different pain point or contribute to existing tools
  - If **After Step 2**: Iterate on interface design based on feedback
  - If **After Step 4**: Fix platform-specific issues before documenting
  - If **After Step 5**: Improve docs until self-service onboarding works

## Failure Handling

- **Building for yourself, not your users:** -- Your workflow is not everyone's workflow. Validate with target developers, not just your own preferences.
- **Feature over experience:** -- A tool with 50 commands and poor error messages loses to a tool with 5 commands and great error messages. Optimize for DX.
- **Documentation as afterthought:** -- If developers cannot figure out your tool from the docs, they will abandon it. Invest in docs from day one.
- **Breaking changes without warning:** -- Developers who integrate your tool into their workflows depend on stability. Version carefully and communicate changes.
- **Ignoring error messages:** -- Cryptic error messages are the number one source of developer frustration. Every error should tell the developer what to do next.

## Expected Outcome

When this workflow is complete, the user will have:

1. Time to first success is under 5 minutes for new users
2. Adoption grows consistently month over month
3. Support volume decreases as documentation improves
4. Developer satisfaction score exceeds 8/10
5. Community contributes bug reports, feature requests, and eventually code
6. Tool is recommended organically by developers to their peers

## Output Format

```
BUILD DEVELOPER TOOLS TRACKER
=============================

[ ] Step 1: Discover and Validate the Pain Point
    Status: [pending/in-progress/complete]
[ ] Step 2: Design the Developer Interface
    Status: [pending/in-progress/complete]
[ ] Step 3: Build the Core Tool
    Status: [pending/in-progress/complete]
[ ] Step 4: Test Rigorously
    Status: [pending/in-progress/complete]
[ ] Step 5: Create World-Class Documentation
    Status: [pending/in-progress/complete]
[ ] Step 6: Design Golden Paths
    Status: [pending/in-progress/complete]
[ ] Step 7: Launch and Build Community
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Building for yourself, not your users:** -- Your workflow is not everyone's workflow. Validate with target developers, not just your own preferences.
- **Feature over experience:** -- A tool with 50 commands and poor error messages loses to a tool with 5 commands and great error messages. Optimize for DX.
- **Documentation as afterthought:** -- If developers cannot figure out your tool from the docs, they will abandon it. Invest in docs from day one.
- **Breaking changes without warning:** -- Developers who integrate your tool into their workflows depend on stability. Version carefully and communicate changes.

## Example

**Input:** "I want to build developer tools and need a structured plan to follow step by step."

**Output:**

**Step 1 (developer-experience-engineer):** Discover and Validate the Pain Point -- produces concrete deliverables for this phase.

**Step 2 (api-designer-shell-scripter):** Design the Developer Interface -- produces concrete deliverables for this phase.

**Step 3 (typescript-guru-shell-scripter):** Build the Core Tool -- produces concrete deliverables for this phase.

**Step 4 (unit-test-writer):** Test Rigorously -- produces concrete deliverables for this phase.

**Step 5 (readme-writer-tutorial-writer-docs-site-builder):** Create World-Class Documentation -- produces concrete deliverables for this phase.

**Step 6 (golden-path-designer):** Design Golden Paths -- produces concrete deliverables for this phase.

**Step 7 (oss-community-builder):** Launch and Build Community -- produces concrete deliverables for this phase.

**Result:** User has a complete build developer tools plan with all deliverables produced, validated, and ready for implementation.
