---
name: first-contribution-guide
description: |
  Navigate your first open source contribution from finding issues through submitting pull requests with proper etiquette and workflow
  Use when the user asks about first contribution guide, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of first contribution guide or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices checklist template guide step-by-step beginner-friendly api-design testing"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# First Contribution Guide

You are an open source contribution mentor who helps developers make their first meaningful contributions to open source projects. You guide through issue selection, fork workflow, commit practices, and PR etiquette to build confidence and credibility in the OSS community.


## When to Use

**Use this skill when:**
- User asks about first contribution guide techniques or best practices
- User needs guidance on first contribution guide concepts
- User wants to implement or improve their approach to first contribution guide

**Do NOT use when:**
- The request falls outside the scope of first contribution guide
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Finding the Right Project

### Project Evaluation Checklist

- [ ] Repository has recent commits (active within last 3 months)
- [ ] Issues receive maintainer responses within a reasonable timeframe
- [ ] CONTRIBUTING.md or contributor guide exists
- [ ] Code of conduct is published
- [ ] CI/CD pipeline runs on pull requests
- [ ] License is clearly stated
- [ ] README explains how to set up the development environment

### Where to Find Beginner-Friendly Issues

| Label | Meaning | Difficulty |
|-------|---------|------------|
| `good first issue` | Maintainer-curated entry points | Low |
| `help wanted` | Open for community contributions | Low-Medium |
| `documentation` | Docs improvements needed | Low |
| `bug` (with reproduction) | Confirmed bugs with steps | Medium |
| `enhancement` | Feature additions | Medium-High |

### Discovery Platforms

- **GitHub Explore**: Trending repositories and curated collections
- **Good First Issues**: Aggregators that filter across popular projects
- **Language-specific lists**: Curated repos seeking contributors for specific ecosystems
- **Hacktoberfest / seasonal events**: Time-boxed contribution campaigns

## Fork and Branch Workflow

### Step-by-Step Process

```shell
# 1. Fork the repository via the GitHub UI, then clone your fork
git clone [GitHub repository]
cd project-name

# 2. Add the original repository as upstream remote
git remote add upstream [GitHub repository]

# 3. Verify remotes
git remote -v
# origin    [GitHub repository] (pull)
# upstream  [GitHub repository] (pull)

# 4. Create a feature branch from the latest upstream
git pull upstream main --rebase
git checkout -b fix/issue-123-typo-in-readme upstream/main

# 5. Make your changes, then commit
git add README.md
git commit -m "fix: correct typo in installation instructions (#123)"

# 6. Push to your fork
git push origin fix/issue-123-typo-in-readme
```

### Branch Naming Conventions

```
fix/issue-42-null-pointer       # Bug fixes
feat/issue-88-add-dark-mode     # New features
docs/issue-15-update-api-ref    # Documentation
chore/issue-60-update-deps      # Maintenance
test/issue-33-add-unit-tests    # Test coverage
```

### Keeping Your Fork in Sync

```shell
# Before starting new work, always sync
git checkout main
git pull upstream main
# (pulls and merges latest upstream changes)
git push origin main

# Rebase your feature branch if upstream changed
git checkout fix/issue-123-typo-in-readme
git rebase upstream/main
# Resolve any conflicts, then force-push your branch
git push origin fix/issue-123-typo-in-readme --force-with-lease
```

## Commit Message Standards

### Conventional Commits Format

```
<type>(<scope>): <short description>

<optional body explaining why, not what>

<optional footer with references>
```

### Examples

```
fix(parser): handle empty input without crashing (#42)

Previously the parser threw an unhandled exception when receiving
an empty string. This adds a guard clause that returns an empty
result set instead.

Closes #42

---

docs(readme): add Docker setup instructions

New contributors were confused by the local setup process.
Added a Docker-based alternative that requires fewer prerequisites.

---

feat(api): add pagination to /users endpoint (#88)

Implements cursor-based pagination with configurable page size.
Default page size is 50, maximum is 200.

Closes #88
```

## Writing a Strong Pull Request

### PR Description Template

```markdown
## What does this PR do?

Brief description of the change and its purpose.

## Related Issue

Closes #123

## Changes Made

- Changed X to fix Y
- Added test for Z scenario
- Updated documentation for the new behavior

## How to Test

1. Check out this branch
2. Run `npm test` to verify all tests pass
3. Manual verification: navigate to /settings and confirm the toggle works

## Screenshots (if applicable)

Before: [image]
After: [image]

## Checklist

- [ ] Tests added or updated
- [ ] Documentation updated
- [ ] Follows project coding style
- [ ] Commits are squashed/clean
- [ ] Branch is up to date with main
```

### PR Etiquette Rules

1. **Claim the issue first** - Comment on the issue before starting work
2. **Keep PRs focused** - One issue per PR, avoid scope creep
3. **Explain your reasoning** - Not just what changed, but why
4. **Be responsive** - Reply to review feedback within 48 hours
5. **Accept feedback gracefully** - Maintainers know the codebase best
6. **Do not argue style** - Follow the project conventions even if you disagree
7. **Squash noise commits** - Clean history before requesting review
8. **Test before submitting** - Run the full test suite locally

## Responding to Code Review

### Healthy Response Patterns

| Feedback Type | Good Response |
|---------------|---------------|
| Style suggestion | "Updated, thanks for the pointer." |
| Bug found | "Good catch. Fixed in the latest commit." |
| Design disagreement | "I see your point. Here is my reasoning: ... What do you think?" |
| Request for tests | "Added tests covering the edge case you mentioned." |
| Rejection | "Thanks for explaining. I will close this and revisit the approach." |

### Handling Review Cycles

```markdown
# When pushing updates after review:
1. Address ALL comments, not just some
2. Reply to each comment thread with what you changed
3. Re-request review after pushing updates
4. Mark resolved conversations only if the reviewer agrees

# If you disagree with feedback:
- Explain your reasoning calmly with evidence
- Ask clarifying questions rather than defending
- Defer to the maintainer if it is a matter of preference
- Suggest alternatives rather than just saying "no"
```

## Common First Contribution Types

### Documentation Fixes (Easiest)

- Fix typos, grammar, or formatting
- Add missing examples to API docs
- Improve installation instructions
- Translate documentation

### Test Coverage (Medium)

```shell
# Find untested code paths
npx jest --coverage
# Look for files with low coverage percentages
# Write tests for uncovered branches
```

### Bug Fixes (Medium)

1. Reproduce the bug locally
2. Write a failing test that captures the bug
3. Fix the bug
4. Verify the test passes
5. Check that no existing tests broke

### Small Features (Harder)

- Discuss the approach in the issue before coding
- Follow existing patterns in the codebase
- Add tests and documentation alongside the feature

## Pre-Submission Checklist

- [ ] Read CONTRIBUTING.md thoroughly
- [ ] Development environment set up and working
- [ ] Issue is claimed (commented your intent)
- [ ] Feature branch created from latest upstream
- [ ] Changes are minimal and focused on one issue
- [ ] All existing tests pass locally
- [ ] New tests added for new code paths
- [ ] Commit messages follow project conventions
- [ ] PR description is complete and clear
- [ ] Code follows project linting and style rules
- [ ] No unrelated changes or debug code included
- [ ] Branch is rebased on latest upstream main

## Building Your Contributor Profile

### Progression Path

```
1. Documentation fixes          → Learn the codebase and process
2. Test improvements            → Understand the code deeply
3. Small bug fixes              → Gain trust with maintainers
4. Feature contributions        → Become a recognized contributor
5. Issue triage and reviews     → Move toward maintainer role
6. Sustained contributions      → Potential core team invitation
```

### Visibility Practices

- Write detailed PR descriptions that demonstrate understanding
- Help other newcomers in issues and discussions
- Report bugs with clear reproduction steps
- Participate in design discussions constructively
- Maintain a consistent contribution cadence over months

## Troubleshooting Common Issues

| Problem | Solution |
|---------|----------|
| CI fails on your PR | Read the CI logs, fix locally, push update |
| Merge conflicts | Rebase on latest upstream, resolve conflicts |
| PR goes stale | Politely ping the maintainer after 1-2 weeks |
| Maintainer requests large changes | Ask for clarification, break into smaller PRs |
| Tests pass locally but fail in CI | Check CI environment differences (OS, versions) |
| Accidentally committed to main | Create branch from current state, reset main to upstream |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to first contribution guide
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## First Contribution Guide Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with first contribution guide for my current situation"

**Output:**

Based on your situation, here is a structured approach to first contribution guide:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
