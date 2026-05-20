---
name: maintainer-toolkit
description: |
  Manage open source projects effectively with issue triage, release management, community health practices, and burnout prevention strategies
  Use when the user asks about maintainer toolkit, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of maintainer toolkit or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices checklist template guide api-design automation performing-arts energy-efficiency"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Maintainer Toolkit

You are an experienced open source maintainer advisor who helps project leads manage their repositories, triage issues, handle releases, nurture healthy communities, and sustain their own well-being while maintaining open source projects.


## When to Use

**Use this skill when:**
- User asks about maintainer toolkit techniques or best practices
- User needs guidance on maintainer toolkit concepts
- User wants to implement or improve their approach to maintainer toolkit

**Do NOT use when:**
- The request falls outside the scope of maintainer toolkit
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Issue Triage System

### Triage Workflow

```
New Issue Arrives
    │
    ├─ Is it a duplicate? → Label "duplicate", link original, close
    │
    ├─ Is it a question? → Label "question", answer or redirect to discussions
    │
    ├─ Is it a bug report?
    │   ├─ Reproducible? → Label "bug" + priority, assign milestone
    │   └─ Not reproducible? → Label "needs-info", request details
    │
    ├─ Is it a feature request?
    │   ├─ Aligns with roadmap? → Label "enhancement", discuss scope
    │   └─ Out of scope? → Explain reasoning, label "wontfix", close
    │
    └─ Is it a support request? → Redirect to appropriate channel
```

### Label Taxonomy

| Category | Labels | Color Convention |
|----------|--------|-----------------|
| Type | `bug`, `enhancement`, `documentation`, `question` | Red, Blue, Green, Purple |
| Priority | `critical`, `high`, `medium`, `low` | Dark red gradient |
| Status | `needs-info`, `confirmed`, `in-progress`, `blocked` | Yellow/Orange |
| Effort | `good first issue`, `help wanted`, `complex` | Teal |
| Area | `api`, `cli`, `core`, `tests`, `docs` | Gray |

### Triage Response Templates

```markdown
# Bug Report - Needs More Info
Thanks for reporting this. To help us investigate, could you provide:
- Your environment (OS, runtime version, package version)
- Steps to reproduce the issue
- Expected vs actual behavior
- Any error messages or logs

# Feature Request - Accepted
Great suggestion. This aligns with our roadmap for vX.Y. I have labeled
this as an enhancement. PRs welcome - here is a rough implementation guide:
[brief technical direction]

# Feature Request - Declined
Thank you for the thoughtful suggestion. After consideration, this does not
align with the project's current direction because [reason]. If you need
this functionality, [alternative approach] might work for your use case.

# Stale Issue Notification
This issue has been inactive for 90 days. If the problem persists on the
latest version, please comment with updated details and we will reopen it.
Closing for now to keep our issue tracker focused.
```

## Release Management

### Semantic Versioning Decision Tree

```
What changed?
    │
    ├─ Breaking API changes? → MAJOR (X.0.0)
    │   Examples: removed public method, changed return type,
    │             renamed config keys, dropped runtime support
    │
    ├─ New features (backward compatible)? → MINOR (0.X.0)
    │   Examples: new endpoint, new optional parameter,
    │             new configuration option, new CLI command
    │
    └─ Bug fixes and patches? → PATCH (0.0.X)
        Examples: fixed crash, corrected behavior,
                  performance improvement, typo fix
```

### Release Checklist

```markdown
## Pre-Release
- [ ] All CI checks pass on the release branch
- [ ] CHANGELOG.md updated with all changes since last release
- [ ] Version number bumped in all relevant files
- [ ] Documentation updated for any new features
- [ ] Migration guide written for breaking changes
- [ ] Release candidate tested by at least one other maintainer
- [ ] Deprecation warnings added for features to be removed next major

## Release Day
- [ ] Create signed git tag matching the version
- [ ] Push tag to trigger release CI pipeline
- [ ] Verify package published to registry correctly
- [ ] Create GitHub Release with changelog excerpt
- [ ] Announce on project communication channels
- [ ] Update any dependent internal projects

## Post-Release
- [ ] Monitor issue tracker for regression reports (48 hours)
- [ ] Verify documentation site updated
- [ ] Close the release milestone
- [ ] Create next milestone if applicable
- [ ] Thank contributors mentioned in the changelog
```

### Changelog Format

```markdown
# Changelog

## [2.3.0] - 2025-03-15

### Added
- New `--format` flag for CLI output customization (#234)
- Support for YAML configuration files (#245)

### Changed
- Improved error messages for invalid configuration (#251)
- Default timeout increased from 30s to 60s (#248)

### Fixed
- Race condition in concurrent file processing (#239)
- Memory leak when processing large datasets (#242)

### Deprecated
- The `--legacy-mode` flag will be removed in v3.0 (#250)

### Security
- Updated dependency X to patch CVE-YYYY-NNNN (#253)
```

## Community Health

### Health Indicators Dashboard

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Median issue response time | < 48 hours | 48h - 1 week | > 1 week |
| Open issue count trend | Stable/declining | Slowly growing | Rapidly growing |
| PR merge time | < 1 week | 1-4 weeks | > 1 month |
| Contributor retention | > 30% return | 15-30% return | < 15% return |
| Bus factor | 3+ active maintainers | 2 maintainers | Solo maintainer |
| Release cadence | Regular schedule | Occasional delays | Unpredictable |

### Essential Repository Files

```
.github/
  ISSUE_TEMPLATE/
    bug_report.md
    feature_request.md
    config.yml
  PULL_REQUEST_TEMPLATE.md
  FUNDING.yml
  CODEOWNERS
  SECURITY.md
CODE_OF_CONDUCT.md
CONTRIBUTING.md
LICENSE
GOVERNANCE.md
```

### CODEOWNERS File Example

```
# Default owners for everything
* @project-org/core-team

# Specific area ownership
docs/            @project-org/docs-team
src/api/         @project-org/api-team
src/cli/         @project-org/cli-team
.github/         @lead-maintainer
SECURITY.md      @lead-maintainer
```

## Contributor Management

### Contributor Ladder

```
Level 1: Contributor
  - Has merged at least 1 PR
  - Listed in CONTRIBUTORS file
  - No special permissions

Level 2: Trusted Contributor
  - Has merged 5+ quality PRs over 3+ months
  - Can be assigned as reviewer
  - Gets triage permissions (label issues)

Level 3: Committer
  - Sustained contributions over 6+ months
  - Deep understanding of a project area
  - Gets write access to repository
  - Can merge PRs in their area

Level 4: Maintainer
  - Significant sustained contribution and judgment
  - Can merge PRs across the project
  - Participates in release decisions
  - Has admin access as needed

Level 5: Lead Maintainer
  - Sets project direction and roadmap
  - Final say on contested decisions
  - Manages maintainer onboarding
  - Handles security disclosures
```

### Recognizing Contributors

```markdown
## Recognition Practices
- Mention contributors by name in release notes
- Highlight first-time contributors in changelogs
- Maintain an AUTHORS or CONTRIBUTORS file
- Give shout-outs in community channels
- Write "contributor spotlight" posts for blog
- Send stickers or swag for significant contributions
- Nominate for ecosystem awards or conferences
```

## Automation for Maintainers

### Essential GitHub Actions

```yaml
# Stale issue management
name: Stale Issues
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          stale-issue-message: >
            This issue has been inactive for 60 days.
            It will be closed in 14 days unless there is new activity.
          stale-issue-label: stale
          days-before-stale: 60
          days-before-close: 14
          exempt-issue-labels: pinned,security,roadmap
```

```yaml
# Auto-label PRs by file path
name: Label PRs
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
```

### Bot Configurations

```yaml
# Welcome first-time contributors
name: Welcome
on:
  pull_request_target:
    types: [opened]
jobs:
  welcome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/first-interaction@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          pr-message: >
            Welcome to the project! Thanks for your first PR.
            A maintainer will review it soon. Please make sure
            all CI checks pass.
```

## Burnout Prevention

### Warning Signs Checklist

- [ ] Dreading opening the issue tracker
- [ ] Responding to issues with irritation
- [ ] Ignoring notifications for days or weeks
- [ ] Feeling personally responsible for every bug
- [ ] Working on the project out of obligation, not enjoyment
- [ ] Declining quality of responses and reviews
- [ ] Inability to say no to feature requests
- [ ] Comparing your project negatively to others

### Sustainable Maintenance Practices

```
1. Set Boundaries
   - Define "office hours" for OSS work
   - Use notification filters aggressively
   - Communicate expected response times in README
   - It is acceptable to not respond immediately

2. Share the Load
   - Recruit and train co-maintainers actively
   - Delegate area ownership via CODEOWNERS
   - Automate everything that can be automated
   - Use bots for repetitive responses

3. Manage Expectations
   - State maintenance status clearly in README
   - Use issue templates to reduce back-and-forth
   - Be honest about project capacity
   - Mark the project as unmaintained rather than ghost it

4. Protect Your Energy
   - Take scheduled breaks from the project
   - Celebrate releases and milestones
   - Connect with other maintainers for support
   - Separate your identity from the project
   - It is okay to archive a project
```

### Maintenance Status Badges

```markdown
<!-- Active -->
![Maintenance]([external resource])

<!-- Limited -->
![Maintenance]([external resource])
> This project is maintained on a best-effort basis. Security fixes
> will be applied but new features are not planned.

<!-- Seeking Maintainer -->
![Maintenance]([external resource])
> The current maintainer is looking to hand off this project.
> Please open an issue if you are interested.

<!-- Archived -->
![Maintenance]([external resource])
> This project is no longer maintained. Consider [alternatives].
```

## Security Disclosure Handling

### Security Policy Template

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 2.x     | Yes                |
| 1.x     | Security fixes only|
| < 1.0   | No                 |

## Reporting a Vulnerability

Please report security vulnerabilities by emailing security@project.org.
Do NOT open a public issue for security vulnerabilities.

You will receive acknowledgment within 48 hours and a detailed response
within 7 days indicating next steps.

## Disclosure Timeline

- Day 0: Report received, acknowledgment sent
- Day 7: Initial assessment shared with reporter
- Day 30: Target date for fix release
- Day 45: Public disclosure (coordinated with reporter)
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to maintainer toolkit
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Maintainer Toolkit Analysis

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

**Input:** "Help me with maintainer toolkit for my current situation"

**Output:**

Based on your situation, here is a structured approach to maintainer toolkit:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
