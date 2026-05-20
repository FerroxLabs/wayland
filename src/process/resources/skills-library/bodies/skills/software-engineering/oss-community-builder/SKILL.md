---
name: oss-community-builder
description: |
  Design and grow thriving open source communities with governance models, codes of conduct, onboarding programs, and communication strategies
  Use when the user asks about oss community builder, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of oss community builder or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices checklist template guide testing emergency-preparedness performing-arts accessibility"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# OSS Community Builder

You are an open source community strategist who helps project leaders build inclusive, self-sustaining communities around their projects. You guide through governance structures, conduct standards, contributor onboarding, and communication channel management.


## When to Use

**Use this skill when:**
- User asks about oss community builder techniques or best practices
- User needs guidance on oss community builder concepts
- User wants to implement or improve their approach to oss community builder

**Do NOT use when:**
- The request falls outside the scope of oss community builder
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Governance Models

### Model Comparison

| Model | Description | Best For | Risks |
|-------|-------------|----------|-------|
| Benevolent Dictator | Single leader with final say | Small projects, strong vision | Bus factor of 1, burnout |
| Core Team | Small elected or appointed group | Medium projects | Can become insular |
| Meritocracy | Earned authority through contribution | Technical projects | Can exclude non-code contributors |
| Consensus | All maintainers agree on decisions | Small, aligned teams | Slow decisions, lowest common denominator |
| Voting Council | Elected representatives with terms | Large projects | Political dynamics, campaigns |
| Foundation-Backed | Non-profit organization oversight | Enterprise-critical projects | Bureaucracy, slow processes |

### Governance Document Template

```markdown
# Project Governance

## Decision-Making Process

### Day-to-Day Decisions
- Any maintainer can merge routine PRs in their area
- Two maintainer approvals required for cross-cutting changes
- One week comment period for significant design changes

### Significant Decisions
- Proposed via RFC (Request for Comments) process
- Minimum 2-week comment period
- Requires supermajority (2/3) of active maintainers
- Decision recorded in decision log with rationale

### Conflict Resolution
1. Discuss in the relevant issue or PR
2. If unresolved, bring to maintainer discussion channel
3. If still unresolved, lead maintainer makes final call
4. Decisions can be revisited after 6 months with new information

## Roles and Responsibilities

### Users
- Use the project and report issues
- Participate in discussions

### Contributors
- Submit patches, documentation, or other improvements
- Follow the contribution guidelines

### Maintainers
- Review and merge contributions
- Triage issues and guide contributors
- Participate in project decisions
- Commit to at least [X] hours per month

### Lead Maintainer
- Sets project vision and roadmap
- Resolves deadlocked decisions
- Manages maintainer onboarding and offboarding
- Represents the project externally

## Becoming a Maintainer
- Nominated by an existing maintainer
- Demonstrated sustained quality contributions (6+ months)
- Approved by existing maintainer supermajority
- 1-month trial period with mentoring

## Stepping Down
- Maintainers may step down at any time with notice
- Emeritus status for past maintainers (advisory, no voting)
- Inactive maintainers (6+ months no activity) moved to emeritus
```

## Code of Conduct

### Essential Components

```markdown
# Code of Conduct

## Our Pledge

We are committed to providing a welcoming and inclusive experience
for everyone, regardless of background, identity, or experience level.

## Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy toward other community members
- Give and receive feedback professionally

## Unacceptable Behavior

- Harassment, intimidation, or discrimination of any kind
- Trolling, insulting, or derogatory comments
- Personal or political attacks
- Publishing others' private information without consent
- Sustained disruption of discussions or events
- Any conduct that a reasonable person would consider inappropriate

## Enforcement

### Reporting
Report violations to conduct@project.org. Reports are confidential.
You will receive a response within 48 hours.

### Consequences
1. **Warning**: Private written notice with explanation
2. **Temporary Ban**: Removed from community spaces for a set period
3. **Permanent Ban**: Permanent removal from all community spaces

### Appeals
Decisions can be appealed by emailing appeals@project.org within
30 days. Appeals are reviewed by a different team member.

## Scope

This code of conduct applies to all project spaces, including
repositories, issue trackers, chat channels, mailing lists,
events, and any public space where someone represents the project.
```

### Enforcement Process

```
Report Received
    │
    ├─ Acknowledge receipt within 48 hours
    │
    ├─ Assess severity and urgency
    │   ├─ Immediate danger → Emergency ban, investigate after
    │   └─ Non-urgent → Standard investigation
    │
    ├─ Investigate
    │   ├─ Review the reported behavior
    │   ├─ Gather context from witnesses
    │   └─ Consider the reporter's perspective
    │
    ├─ Decide on action (2+ enforcement team members)
    │
    ├─ Communicate decision to:
    │   ├─ The reporter (what action was taken)
    │   └─ The violator (what they did and consequences)
    │
    └─ Document the incident (privately)
```

## Contributor Onboarding

### Onboarding Funnel

```
Discovery → First Visit → First Contribution → Return Contribution → Regular Contributor

Key metrics at each stage:
- Discovery: GitHub stars, website visits
- First Visit: README effectiveness (time to first clone)
- First Contribution: Time from issue to merged PR
- Return Contribution: Percentage who contribute again within 90 days
- Regular Contributor: Sustained activity over 6+ months
```

### New Contributor Welcome Package

```markdown
# Welcome to [Project Name]

## Getting Started in 5 Minutes

1. Fork and clone the repository
2. Run `make setup` to install dependencies
3. Run `make test` to verify your environment
4. Pick an issue labeled `good first issue`
5. Read CONTRIBUTING.md for workflow details

## Where to Ask Questions

- **GitHub Discussions**: For design questions and help
- **Chat channel**: For quick questions and socializing
- **Issue tracker**: For bugs and feature requests

## Your First PR

We recommend starting with one of these curated issues:
[link to filtered issue view with good-first-issue label]

Each issue has context about what needs to change and where
to look in the codebase. A maintainer is assigned to mentor
you through the process.

## Mentorship

New contributors are paired with a maintainer for their
first 3 contributions. Tag your assigned mentor in your PR
for guidance.
```

### Mentorship Program Structure

| Phase | Duration | Activities |
|-------|----------|------------|
| Orientation | Week 1 | Repository tour, local setup, first issue selection |
| First Contribution | Weeks 2-3 | Guided work on first PR with mentor review |
| Growing Independence | Weeks 4-8 | Contributor selects own issues, lighter mentoring |
| Graduation | Week 8+ | Contributor mentors the next newcomer |

## Communication Strategy

### Channel Architecture

| Channel | Purpose | Response Time | Audience |
|---------|---------|---------------|----------|
| GitHub Issues | Bug reports, feature requests | 48 hours | Contributors, users |
| GitHub Discussions | Q&A, design proposals, showcases | 1 week | Community |
| Chat (Discord/Slack) | Real-time help, social connection | Best effort | Active community |
| Mailing List | Announcements, major decisions | N/A (broadcast) | All stakeholders |
| Blog | Release notes, tutorials, roadmap | Monthly | Public |
| Social Media | Visibility, celebrations | Weekly | Public |

### Communication Templates

```markdown
# Release Announcement
We are excited to announce [Project] vX.Y.Z!

Highlights:
- Feature A: brief description
- Feature B: brief description
- Performance: X% improvement in [area]

Upgrade guide: [link]
Full changelog: [link]

Thank you to our N contributors for this release:
@user1, @user2, @user3...

# Community Update (Quarterly)
## Project Health
- X new contributors this quarter
- Y issues closed, Z PRs merged
- Major milestone: [achievement]

## Roadmap Update
- Completed: [items]
- In Progress: [items]
- Upcoming: [items]

## Call for Help
We are looking for contributors in these areas:
- [area 1]: brief description of need
- [area 2]: brief description of need
```

## Growing the Community

### Growth Strategies by Stage

```
Stage 1: Founding (0-10 contributors)
  - Focus on excellent documentation
  - Write about the project on blogs and forums
  - Present at local meetups
  - Make the first contribution experience flawless
  - Personally thank every contributor

Stage 2: Building (10-50 contributors)
  - Establish governance and roles
  - Create contributor ladder and recognition
  - Set up automated onboarding
  - Start regular community calls
  - Develop mentorship program

Stage 3: Scaling (50-200 contributors)
  - Delegate area ownership
  - Formalize decision-making processes
  - Create working groups for major areas
  - Invest in contributor tooling
  - Attend and sponsor conferences

Stage 4: Sustaining (200+ contributors)
  - Consider foundation or organizational backing
  - Professional community management
  - Regional community groups
  - Annual contributor summit
  - Formal training and certification programs
```

### Community Health Metrics

```markdown
## Monthly Dashboard

### Engagement
- New contributors this month: ___
- Returning contributors: ___
- First-time contributor retention (90-day): ___%
- Average PR review time: ___ days
- Average issue response time: ___ hours

### Sentiment
- Positive issue interactions: ___%
- Code of conduct reports: ___
- Contributor satisfaction survey score: ___/10

### Growth
- GitHub stars (delta): +___
- Package downloads (delta): +___
- Documentation page views: ___
- Community channel active members: ___
```

## Handling Difficult Situations

### Conflict De-escalation Guide

| Situation | Response Strategy |
|-----------|-------------------|
| Heated technical debate | Acknowledge both sides, propose time-boxed evaluation |
| Entitled user demands | Redirect to contribution opportunities, set boundaries |
| Drive-by criticism | Respond factually once, do not engage in back-and-forth |
| Maintainer disagreement | Move to private discussion, use governance process |
| Feature request rejection anger | Empathize, explain reasoning, suggest alternatives |
| Spam or trolling | Remove content, warn or ban, do not engage |

### Saying No Constructively

```markdown
# Template for declining a contribution or request

Thank you for [the suggestion / this PR / your interest in this area].

After careful consideration, we have decided not to [merge this /
implement this feature / make this change] because:

- [Specific technical or strategic reason]
- [How it conflicts with project goals]

We appreciate the effort you put into this. Some alternatives
you might consider:

- [Alternative approach within the project]
- [Fork or extension mechanism]
- [Related project that might be a better fit]

We value your contribution to the community and hope to
collaborate on future work that aligns with the project direction.
```

## Inclusive Community Practices

### Accessibility Checklist

- [ ] Documentation is available in plain text (not just video)
- [ ] Communication happens in asynchronous channels (not just real-time)
- [ ] Meeting times rotate to accommodate different time zones
- [ ] Technical jargon is explained or linked to glossary
- [ ] Multiple contribution types are valued (code, docs, design, testing)
- [ ] Language is kept inclusive and free of unnecessary jargon
- [ ] Non-English speakers are supported with clear, simple language
- [ ] Contribution process does not assume specific hardware or OS


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to oss community builder
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Oss Community Builder Analysis

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

**Input:** "Help me with oss community builder for my current situation"

**Output:**

Based on your situation, here is a structured approach to oss community builder:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
