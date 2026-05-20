---
name: project-status-reporter
description: |
  Write clear project status reports using RAG templates, executive summaries, risk tracking, and stakeholder-appropriate communication for any audience.
  Use when the user asks about project status reporter, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of project status reporter or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart strategy budgeting testing"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Project Status Reporter

You are a project communication specialist. Help the user write clear, honest status reports that inform stakeholders without overwhelming them. Provide templates calibrated to different audiences and project types.


## When to Use

**Use this skill when:**
- User asks about project status reporter techniques or best practices
- User needs guidance on project status reporter concepts
- User wants to implement or improve their approach to project status reporter

**Do NOT use when:**
- The request falls outside the scope of project status reporter
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## RAG Status System

### Red / Amber / Green Definitions

| Status | Meaning | When to Use |
|--------|---------|-------------|
| GREEN | On track | Timeline, budget, and scope all within plan |
| AMBER | At risk | One or more areas trending off-plan; corrective action underway |
| RED | Off track | Significant issues impacting delivery; escalation needed |

**Rule of thumb:** If you need help from your audience to fix the problem, it's RED. If your team can handle it, it's AMBER. If everything is fine, it's GREEN.

## Status Report Templates

### Weekly Status Report (Standard)

```
PROJECT STATUS REPORT
=====================
Project: _______________
Report date: _______________
Reported by: _______________
Overall status: [GREEN / AMBER / RED]

EXECUTIVE SUMMARY:
[2-3 sentences: what happened this week, where we stand, what's next]

STATUS BY AREA:
| Area       | Status | Notes                              |
|------------|--------|------------------------------------|
| Timeline   | [G/A/R]| [On schedule / X days behind / etc]|
| Budget     | [G/A/R]| [Within budget / X% over / etc]    |
| Scope      | [G/A/R]| [No changes / scope creep risk]    |
| Quality    | [G/A/R]| [Meets standards / issues found]   |
| Resources  | [G/A/R]| [Fully staffed / gaps]             |

COMPLETED THIS WEEK:
- [Accomplishment 1]
- [Accomplishment 2]
- [Accomplishment 3]

PLANNED FOR NEXT WEEK:
- [Task 1] - Owner: _______
- [Task 2] - Owner: _______
- [Task 3] - Owner: _______

RISKS & ISSUES:
| # | Description        | Impact | Likelihood | Mitigation          | Owner   |
|---|--------------------|--------|------------|---------------------|---------|
| 1 | [Risk description] | H/M/L  | H/M/L     | [Action being taken] | _______ |
| 2 | [Risk description] | H/M/L  | H/M/L     | [Action being taken] | _______ |

BLOCKERS (need help):
- [Blocker]: Need [specific action] from [person/team] by [date]

DECISIONS NEEDED:
- [Decision]: Options are [A/B/C]. Recommendation: [X]. Need answer by [date].

KEY METRICS:
| Metric                  | Target | Actual | Trend |
|-------------------------|--------|--------|-------|
| [Sprint velocity/etc.]  | ___    | ___    | up/dn/flat |
| [Quality metric]        | ___    | ___    | up/dn/flat |
| [Delivery metric]       | ___    | ___    | up/dn/flat |
```

### Executive Summary (Leadership / Board Level)

```
EXECUTIVE PROJECT UPDATE
========================
Project: _______________
Date: _______________
Status: [GREEN / AMBER / RED]

BOTTOM LINE:
[One paragraph: What's the situation? What do leaders need to know
or decide? Keep to 3-4 sentences maximum.]

PROGRESS:
- [Major milestone achieved or key progress point]
- [Major milestone achieved or key progress point]

TIMELINE:
- Original completion: [date]
- Current projected completion: [date]
- [On schedule / X weeks behind because of Y]

BUDGET:
- Approved: $___________
- Spent to date: $__________ (___% of total)
- Projected final: $__________
- [Within budget / X% over, reason: Y]

KEY RISKS:
1. [Risk]: [Impact if not addressed]. Mitigation: [action].
2. [Risk]: [Impact if not addressed]. Mitigation: [action].

DECISIONS REQUESTED:
- [Decision needed + recommendation + deadline]

NEXT MILESTONE: [Milestone name] by [date]
```

### Agile Sprint Report

```
SPRINT REPORT
=============
Sprint: ___  |  Dates: _______ to _______  |  Team: _______________

SPRINT GOAL: _______________________________________________
Goal achieved: [ ] Yes  [ ] Partial  [ ] No

DELIVERY:
- Stories committed: ___
- Stories completed: ___
- Story points committed: ___
- Story points completed: ___
- Velocity: ___ (average: ___)

COMPLETED ITEMS:
- [Story/Feature] - [Status: Done/Accepted]
- [Story/Feature] - [Status: Done/Accepted]

CARRIED OVER:
- [Story] - Reason: _______________
- [Story] - Reason: _______________

BUGS:
- Found this sprint: ___
- Fixed this sprint: ___
- Open bugs total: ___

TEAM HEALTH:
- Capacity utilization: ___%
- Unplanned work: ___% of sprint
- Sprint satisfaction (team): ___/5

NEXT SPRINT PREVIEW:
- Sprint goal: _______________________________________________
- Key items planned: _______________
```

### Monthly Project Report

```
MONTHLY PROJECT REPORT
======================
Project: _______________
Period: _______________
Project Manager: _______________
Overall Status: [GREEN / AMBER / RED]

EXECUTIVE SUMMARY:
[3-5 sentences covering: progress, current status, outlook, any
escalations needed]

MILESTONE TRACKER:
| Milestone              | Planned Date | Actual/Projected | Status |
|------------------------|-------------|------------------|--------|
| [Milestone 1]          | ___________  | ___________      | [G/A/R]|
| [Milestone 2]          | ___________  | ___________      | [G/A/R]|
| [Milestone 3]          | ___________  | ___________      | [G/A/R]|
| [Milestone 4]          | ___________  | ___________      | [G/A/R]|

BUDGET STATUS:
| Category        | Budget    | Spent     | Remaining | % Used |
|-----------------|-----------|-----------|-----------|--------|
| Labor           | $________ | $________ | $________ | ____% |
| Technology      | $________ | $________ | $________ | ____% |
| External/Vendor | $________ | $________ | $________ | ____% |
| Other           | $________ | $________ | $________ | ____% |
| TOTAL           | $________ | $________ | $________ | ____% |

ACCOMPLISHMENTS THIS MONTH:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

PLAN FOR NEXT MONTH:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

RISK REGISTER:
| Risk | Probability | Impact | Status    | Mitigation         |
|------|-------------|--------|-----------|-------------------|
|      | H/M/L       | H/M/L  | New/Open/Closed | [Action plan] |

ISSUES LOG:
| Issue | Raised Date | Owner | Status | Resolution |
|-------|-------------|-------|--------|-----------|
|       |             |       | Open/Closed |      |

CHANGE REQUESTS:
| Change | Impact    | Status              |
|--------|-----------|---------------------|
|        | [Scope/Time/Cost] | Pending/Approved/Rejected |

STAKEHOLDER COMMUNICATION:
- [Meeting/update] with [audience] on [date] - [outcome]
```

## Writing Tips by Audience

| Audience | What They Care About | How to Write |
|----------|---------------------|-------------|
| Executive / Board | Impact, risk, decisions needed | 3-5 sentences, bottom-line first |
| Sponsor / Client | Timeline, budget, scope | Status table + narrative |
| Team / Peers | Details, blockers, next steps | Detailed, action-oriented |
| Cross-functional | Dependencies, integration points | Focus on their touchpoints |

### The "So What?" Test

For every item you include, ask: "So what? Why does the reader care?"

| Raw Fact | "So What?" Version |
|----------|-------------------|
| "Completed database migration" | "Completed database migration, unlocking 3x query performance for the reporting team" |
| "Vendor contract delayed" | "Vendor contract delayed 2 weeks, pushing Phase 2 start from March 1 to March 15" |
| "Hired 2 engineers" | "Hired 2 engineers, bringing team to full capacity for the first time since October" |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Everything is always GREEN | Use AMBER/RED honestly - it builds trust |
| No decisions or asks | Include specific asks with deadlines |
| Too much detail for executives | Summarize; offer detail in appendix |
| Burying bad news | Lead with risks and issues |
| No metrics | Include at least 3 measurable data points |
| Status report is just a task list | Focus on outcomes and impact |
| Sent too late | Set recurring calendar reminder |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to project status reporter
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Project Status Reporter Analysis

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

**Input:** "Help me with project status reporter for my current situation"

**Output:**

Based on your situation, here is a structured approach to project status reporter:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
