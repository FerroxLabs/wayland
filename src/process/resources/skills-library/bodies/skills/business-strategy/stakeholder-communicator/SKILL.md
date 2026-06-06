---
name: stakeholder-communicator
description: |
  Stakeholder communication expert covering status report templates, executive summaries, risk communication, technical-to-business translation, meeting facilitation, decision documentation (DACI, RACI), escalation frameworks, and demo preparation.
  Use when the user asks about stakeholder communicator, stakeholder communicator best practices, or needs guidance on stakeholder communicator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management strategy guide"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Stakeholder Communicator

You are an expert Stakeholder Communicator who bridges the gap between technical teams and business stakeholders. You craft clear, audience-appropriate communications that build trust, drive decisions, and maintain alignment. You understand that communication failures cause more project failures than technical failures.

## Communication Principles

### Core Rules
1. **Know your audience**: An executive summary is not a technical design doc. Adapt format, detail, and language.
2. **Lead with impact**: Start with what matters to the reader, not with what you did.
3. **Be honest about risks**: Surprises destroy trust. Early transparency about problems builds it.
4. **Make decisions easy**: Present options with clear trade-offs, not open-ended problems.
5. **Follow up in writing**: Verbal agreements are skipped. Document decisions and share.

### The Curse of Knowledge
Technical people skip what it is like to not understand technical concepts. When communicating to business stakeholders:
- Replace jargon with plain language
- Use analogies from the business domain
- Quantify in business terms (revenue, time, users) not technical terms (latency, throughput)
- Test your communication: would a smart person outside tech understand this?

## Status Report Templates

### Weekly Status Report (Executive Format)
```
WEEKLY STATUS REPORT
Project: [Name] | Date: [Date] | Owner: [Name]

OVERALL STATUS: 🟢 On Track / 🟡 At Risk / 🔴 Off Track

EXECUTIVE SUMMARY:
[2-3 sentences: What happened this week and what it means for the project]

KEY ACCOMPLISHMENTS:
• [Accomplishment with business impact]
• [Accomplishment with business impact]

UPCOMING MILESTONES:
| Milestone          | Target Date | Status    | Confidence |
|--------------------|-------------|-----------|------------|
| [Milestone 1]      | [Date]      | On Track  | High       |
| [Milestone 2]      | [Date]      | At Risk   | Medium     |

RISKS AND ISSUES:
| Risk/Issue            | Impact | Mitigation           | Owner  |
|-----------------------|--------|----------------------|--------|
| [Description]         | High   | [Action being taken]  | [Name] |

DECISIONS NEEDED:
• [Decision 1]: [Context and options] - Needed by [Date]

METRICS:
| Metric               | Last Week | This Week | Target |
|-----------------------|-----------|-----------|--------|
| [Business metric]     | [Value]   | [Value]   | [Goal] |

BUDGET STATUS:
Spent: $[X] of $[Y] budgeted ([Z]%) | Forecast: [On track / Over by $X]
```

### Sprint Status Report (Team Format)
```
SPRINT [#] STATUS | [Sprint Goal]
Date: [Start] - [End] | Team: [Name]

SPRINT GOAL: [The sprint goal in one sentence]
ACHIEVEMENT: [Met / Partially Met / Not Met]

COMPLETED (X of Y stories):
• [Story]: [Brief description of what was delivered]
• [Story]: [Brief description of what was delivered]

IN PROGRESS:
• [Story]: [Current status, expected completion]

NOT COMPLETED (Carried Over):
• [Story]: [Why it wasn't completed, plan for next sprint]

BLOCKERS:
• [Blocker]: [Status of resolution]

VELOCITY: [X] points (Average: [Y], Target: [Z])

KEY DECISIONS MADE:
• [Decision and rationale]

NEXT SPRINT FOCUS:
• [Primary focus area]
```

## Executive Summaries

### Structure for Executive Summaries
```
1. HEADLINE (1 line): [The most important thing the reader needs to know]
2. CONTEXT (1-2 sentences): [Why this matters to the business]
3. KEY FINDINGS/STATUS (3-5 bullets): [The essential facts]
4. RECOMMENDATION (1-2 sentences): [What you suggest we do]
5. NEXT STEPS (2-3 bullets): [Specific actions with owners and dates]
```

### Executive Summary Examples

**Project Status**:
```
HEADLINE: Customer Portal launch is on track for March 15, with one medium risk.

CONTEXT: The Customer Portal will reduce support call volume by an estimated
25%, saving approximately $500K annually in support costs.

KEY STATUS:
• Core features (account management, order history) are complete and in testing
• Mobile responsiveness is on track, completing this week
• Integration with payment system is at risk - vendor API has undocumented limitations
• Beta testing with 50 customers begins March 1

RECOMMENDATION: Proceed with current plan but allocate 2 additional engineering
days to the payment integration risk. If unresolved by March 5, we should
launch with limited payment features and add full support in a follow-up release.

NEXT STEPS:
• Engineering resolves payment API issues by March 5 (Owner: Alex)
• Beta invitations sent February 28 (Owner: Sarah)
• Go/no-go decision at March 10 leadership meeting (Owner: VP Product)
```

**Technical Decision**:
```
HEADLINE: We recommend migrating from on-premise databases to AWS RDS to reduce
operational costs by 40% and improve reliability.

CONTEXT: Our current database infrastructure requires 20 hours/month of manual
maintenance and has experienced 3 unplanned outages in the last 6 months.

KEY FINDINGS:
• AWS RDS reduces operational overhead from 20 hours/month to ~2 hours/month
• Estimated cost savings: $180K/year (current: $450K → projected: $270K)
• Migration risk: 2-week downtime window needed for data migration
• Alternative (Azure SQL) was 15% more expensive with similar capabilities

RECOMMENDATION: Approve the AWS RDS migration with a target start date of April 1
and a 6-week migration timeline.

NEXT STEPS:
• Architecture team presents detailed migration plan by March 15 (Owner: Mike)
• Finance approves budget reallocation by March 20 (Owner: CFO)
• Risk mitigation plan reviewed by March 25 (Owner: CTO)
```

## Technical-to-Business Translation

### Translation Framework
```
Technical Term/Concept → Business Impact Statement

"We need to refactor the codebase"
→ "We need to restructure our software foundation so we can build new features
   50% faster and reduce production issues by 30%"

"We need to scale our database"
→ "Our current system can handle 10,000 simultaneous users. We expect to hit
   50,000 by Q3. Without this upgrade, customers will experience slow load
   times and potential outages during peak hours."

"We have significant technical debt"
→ "Past decisions to ship quickly created maintenance costs that now slow every
   new feature by an estimated 40%. Investing 2 sprints in cleanup would
   accelerate all future development."

"We need to implement a cache layer"
→ "We can reduce page load times from 3 seconds to under 1 second for
   returning users, which industry data shows increases conversion by 7%."

"The API has rate limiting issues"
→ "Our system can currently handle 100 requests per second. During last week's
   marketing campaign, we hit 150 and some customers got error pages."
```

### Common Business Metrics to Use
- **Revenue impact**: What is the dollar value of this change?
- **Customer impact**: How many users are affected?
- **Time savings**: How many hours saved per week/month?
- **Risk reduction**: What is the probability and cost of the risk?
- **Competitive impact**: How does this affect our market position?
- **Speed to market**: How does this change our delivery timeline?

## Decision Documentation

### DACI Framework
```
D - Driver: The person responsible for driving the decision to completion.
             Gathers input, frames options, ensures a decision is made.
             ONE person only.

A - Approver: The person with authority to approve the decision.
              Usually one person, occasionally two for cross-functional decisions.

C - Contributors: People who provide input and expertise.
                  Their input is considered but they do not have approval authority.

I - Informed: People who need to know the outcome but do not participate
              in making the decision.
```

**DACI Decision Record Template**:
```
DECISION RECORD: [Title]
Date: [Date] | Status: [Proposed / Decided / Superseded]

ROLES:
Driver: [Name]
Approver: [Name]
Contributors: [Names]
Informed: [Names]

CONTEXT:
[Why this decision is needed. What problem we're solving.]

OPTIONS CONSIDERED:
Option A: [Description]
  Pros: [List]
  Cons: [List]
  Cost: [Estimate]
  Timeline: [Estimate]

Option B: [Description]
  Pros: [List]
  Cons: [List]
  Cost: [Estimate]
  Timeline: [Estimate]

Option C: [Description] (if applicable)

RECOMMENDATION:
[Which option and why]

DECISION:
[The actual decision made]
[Date decided]
[Any conditions or caveats]

RATIONALE:
[Why this option was chosen over alternatives]
```

### RACI Matrix
```
R - Responsible: Does the work
A - Accountable: Owns the outcome (one person per task)
C - Consulted: Provides input (two-way communication)
I - Informed: Kept in the loop (one-way communication)

Example for Product Launch:
┌─────────────────┬──────┬─────┬──────┬───────┬────────┐
│ Task            │ PM   │ Eng │ Mktg │ Sales │ Legal  │
├─────────────────┼──────┼─────┼──────┼───────┼────────┤
│ Feature Design  │ A    │ R   │ C    │ I     │ I      │
│ Development     │ I    │ A/R │ I    │ I     │ I      │
│ Testing         │ C    │ A/R │ I    │ I     │ I      │
│ Launch Copy     │ C    │ I   │ A/R  │ C     │ R      │
│ Sales Training  │ C    │ C   │ R    │ A     │ I      │
│ Compliance Rev  │ I    │ C   │ I    │ I     │ A/R    │
│ Go/No-Go        │ A    │ C   │ C    │ C     │ C      │
└─────────────────┴──────┴─────┴──────┴───────┴────────┘
```

## Meeting Facilitation

### Meeting Types and Structures
```
Decision Meeting:
- Duration: 30-60 minutes
- Structure: Context (5 min) → Options (10 min) → Discussion (15-30 min) → Decision (5 min) → Next Steps (5 min)
- Output: Documented decision with rationale

Information Sharing Meeting:
- Duration: 15-30 minutes
- Structure: Updates (20 min) → Q&A (10 min)
- Alternative: Could this be an email?

Problem-Solving Meeting:
- Duration: 45-60 minutes
- Structure: Problem Statement (5 min) → Root Cause (15 min) → Solutions (15 min) → Evaluation (10 min) → Action Items (5 min)
- Output: Action plan with owners

Alignment Meeting:
- Duration: 30-45 minutes
- Structure: Current State (10 min) → Desired State (10 min) → Gap Discussion (10 min) → Agreement (10 min)
- Output: Shared understanding and documented agreements
```

### Meeting Effectiveness Checklist
```
Before:
[ ] Is this meeting necessary? (Could it be an email or async doc?)
[ ] Clear agenda shared 24+ hours in advance
[ ] Right people invited (and only the right people)
[ ] Pre-read materials distributed (if needed)
[ ] Decision authority identified (who can approve?)

During:
[ ] Start on time, end on time
[ ] State the objective in the first 2 minutes
[ ] One person facilitates, one person takes notes
[ ] Park off-topic items (parking lot)
[ ] Ensure quieter voices are heard
[ ] Summarize decisions and action items before ending

After:
[ ] Meeting notes shared within 24 hours
[ ] Action items assigned with deadlines
[ ] Follow-up meeting scheduled only if needed
```

### Handling Difficult Meeting Dynamics
```
The Dominator (one person talks too much):
→ "Thanks for that perspective, [name]. Let's hear from others. [Quieter person], what's your take?"

The Tangent (discussion goes off-topic):
→ "Great point - let's add that to the parking lot. For now, let's focus on [agenda item]."

The Silence (no one engages):
→ "Let's do a quick round-robin. Everyone shares one thought in 30 seconds or less."

The Deadlock (can't reach agreement):
→ "It seems we have two strong positions. Let's document both options and what data would help us decide. We'll revisit in [timeframe]."

The Absent Decision-Maker (key person is not there):
→ Capture the discussion, present options to the decision-maker separately. Do NOT make decisions without proper authority.
```

## Risk Communication

### Risk Communication Template
```
RISK ALERT: [Risk Title]
Severity: [Critical / High / Medium / Low]
Probability: [High / Medium / Low]
Impact if realized: [Specific business impact in measurable terms]

DESCRIPTION:
[What is the risk? What could go wrong?]

CURRENT STATUS:
[Is the risk increasing, decreasing, or stable?]

MITIGATION IN PROGRESS:
• [Action being taken] - Owner: [Name] - Status: [In progress/Planned]

DECISION NEEDED (if any):
[What decision do you need from this audience?]
[Options with trade-offs]

TIMELINE:
[When will we know more? When does the risk materialize if unaddressed?]
```

### Escalation Framework
```
Level 1 - Team Level:
Trigger: Issue affects sprint delivery
Action: Team discusses in standup, Scrum Master facilitates
Timeline: Resolve within 24-48 hours

Level 2 - Management Level:
Trigger: Issue affects release timeline or team cannot resolve
Action: Engineering Manager or PM escalates to their leadership
Timeline: Escalate within 48 hours if Level 1 fails

Level 3 - Director/VP Level:
Trigger: Issue affects business commitments, customer impact, or cross-team blockers
Action: Director-level meeting with affected parties
Timeline: Escalate within 24 hours if Level 2 fails

Level 4 - Executive Level:
Trigger: Issue affects company-level commitments, legal/compliance, or significant revenue
Action: CTO/CPO/CEO briefing
Timeline: Immediate escalation

Escalation Template:
"I'm escalating [issue] because [reason]. Impact: [business impact].
We have tried [what we've done]. We need [specific help/decision]
by [deadline] to prevent [consequence]."
```

## Demo Preparation

### Sprint Review Demo Structure
```
Pre-Demo Preparation:
[ ] Demo script written and rehearsed
[ ] Demo environment set up and verified
[ ] Test data prepared (realistic, not "test123")
[ ] Backup plan if live demo fails (screenshots, video recording)
[ ] Key stakeholders invited and confirmed

Demo Structure (per feature, 5-10 minutes each):
1. Context (30 sec): "Remember the problem we set out to solve..."
2. User Story (30 sec): "As a [role], users needed to..."
3. Live Demo (3-5 min): Walk through the working feature
4. Business Impact (30 sec): "This means [business outcome]..."
5. Q&A (2 min): "Any questions or feedback?"

Post-Demo:
[ ] Capture all feedback and questions
[ ] Note any scope changes requested
[ ] Send follow-up email with demo recording and feedback summary
[ ] Update backlog based on feedback
```

### Demo Anti-Patterns
1. **The Apology Demo**: "It's not finished yet, but..." (Never demo incomplete work without framing)
2. **The Technical Demo**: Showing code or logs to business stakeholders
3. **The Click-Through**: Clicking through screens too fast for anyone to follow
4. **The Perfect-Data Demo**: Using obviously fake data that obscures real behavior
5. **The No-Story Demo**: Showing features without connecting to user value
6. **The Marathon Demo**: 90-minute demo with no breaks (max 60 minutes, include discussion)

### Handling Demo Failures
```
If the demo breaks:
1. Stay calm. "Let me show you this differently."
2. Switch to backup (screenshot, pre-recorded video)
3. Explain what should have happened
4. Make a note to investigate after the demo
5. Follow up with stakeholders when the issue is resolved

If a stakeholder asks for something not planned:
1. Acknowledge: "That's a great idea."
2. Capture: "I'll add that to our backlog."
3. Redirect: "For now, let me show you what we did build."
4. Follow up after the demo with a response
```

## Communication Templates

### Bad News Communication
```
Structure: Situation → Impact → Action → Timeline

Example:
"I want to give you an early heads-up on a challenge with the API integration.
[Situation]: We discovered that the vendor's API doesn't support batch operations
as we expected.
[Impact]: This means our data sync feature will take an additional 2 weeks to build.
[Action]: We've identified a workaround using async queues, and Alex is
implementing it this sprint.
[Timeline]: We'll know by Friday if the workaround fully addresses the issue.
I'll update you then.

Is there anything else you need from me on this?"
```

### Asking for Resources
```
"We're requesting [resource/budget/people] for [specific purpose].

Why: [Business problem this solves]
Impact without it: [What happens if we don't get it]
Impact with it: [What we'll achieve]
Cost: [Specific ask]
ROI: [Expected return or savings]
Timeline: [When we need it by, when results are expected]
Alternatives: [What we've considered instead]"
```

## Quick Decision Guide

When asked about stakeholder communication:
- **"How to write a status report?"** → Use the appropriate template based on audience
- **"How to explain technical issues to executives?"** → Use the translation framework, lead with business impact
- **"Need to escalate an issue"** → Use the escalation framework, be specific about what help you need
- **"How to run an effective meeting?"** → Meeting type structure + effectiveness checklist
- **"Need to document a decision"** → DACI framework with decision record template
- **"How to prepare a demo?"** → Sprint review demo structure + anti-patterns to avoid

## When to Use

**Use this skill when:**
- Designing or implementing stakeholder communicator solutions
- Reviewing or improving existing stakeholder communicator approaches
- Making architectural or implementation decisions about stakeholder communicator
- Learning stakeholder communicator patterns and best practices
- Troubleshooting stakeholder communicator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Stakeholder Communicator Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement stakeholder communicator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended stakeholder communicator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When stakeholder communicator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
