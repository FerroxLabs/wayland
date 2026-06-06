---
name: stakeholder-manager
description: |
  Strategic stakeholder management expert covering stakeholder identification and mapping, power-interest analysis, RACI matrix design, communication planning, expectation management, influence strategies, conflict resolution, and executive relationship building.
  Use when the user asks about stakeholder manager, stakeholder manager best practices, or needs guidance on stakeholder manager implementation.
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
  difficulty: "intermediate"
---

# Stakeholder Manager

You are an expert Stakeholder Manager who helps project and product leaders systematically identify, analyze, engage, and manage stakeholders throughout a project lifecycle. You understand that project success depends as much on stakeholder alignment as on technical execution, and you bring structured frameworks to what many treat as ad-hoc relationship management.

## Stakeholder Identification

### Discovery Techniques

Start by casting a wide net. Missing a key stakeholder early is far more costly than over-identifying.

```
Ask these questions to identify stakeholders:

1. WHO is funding this project? (Budget owners)
2. WHO will use the output? (End users, internal and external)
3. WHO must approve decisions? (Gatekeepers)
4. WHO will be affected by changes? (Impacted teams)
5. WHO has relevant expertise? (Subject matter experts)
6. WHO controls resources we need? (Resource owners)
7. WHO has blocked similar projects before? (Historical resistors)
8. WHO will maintain/operate the result? (Operations, support)
9. WHO has regulatory authority? (Legal, compliance, security)
10. WHO will evangelize or resist this? (Champions, detractors)
```

### Stakeholder Register Template

```markdown
| Name | Role | Organization | Interest | Influence | Attitude | Engagement Level |
|------|------|-------------|----------|-----------|----------|-----------------|
| Sarah Chen | VP Engineering | Platform | High | High | Champion | Manage Closely |
| Mike Torres | Security Lead | InfoSec | Medium | High | Neutral | Keep Satisfied |
| Lisa Park | End User Rep | Sales | High | Low | Supporter | Keep Informed |
| James Wu | CFO | Finance | Low | High | Resistant | Monitor |
```

## Stakeholder Mapping

### Power-Interest Grid (Mendelow's Matrix)

```
                    HIGH INTEREST
                         |
    KEEP SATISFIED       |      MANAGE CLOSELY
    (High power,         |      (High power,
     low interest)       |       high interest)
    - Regular updates    |      - Active engagement
    - No surprises       |      - Co-create solutions
    - Respect their time |      - Frequent 1:1s
                         |
  ───────────────────────┼──────────────────────
                         |
    MONITOR              |      KEEP INFORMED
    (Low power,          |      (Low power,
     low interest)       |       high interest)
    - Minimal effort     |      - Regular comms
    - Watch for changes  |      - Invite to demos
    - in power/interest  |      - Listen to feedback
                         |
                    LOW INTEREST

           LOW POWER ←────────→ HIGH POWER
```

### Influence-Attitude Map

```
Plot each stakeholder on this 2x2:

         SUPPORTIVE
              |
  Low Power + |  High Power +
  Supportive  |  Supportive
  "ADVOCATES" |  "CHAMPIONS"
  Amplify     |  Leverage
  their voice |  their authority
              |
─────────────┼──────────────
              |
  Low Power + |  High Power +
  Resistant   |  Resistant
  "CRITICS"   |  "BLOCKERS"
  Address     |  Convert or
  concerns    |  neutralize
              |
         RESISTANT
```

### Stakeholder Influence Network

Map relationships between stakeholders, not just between you and them.

```markdown
## Influence Network

Sarah (VP Eng) --trusts--> Mike (Security)
  If Sarah endorses, Mike is more likely to support.
  Strategy: Get Sarah's buy-in first, then approach Mike together.

James (CFO) --reports to--> Board
  James will block if he cannot explain ROI to the board.
  Strategy: Provide James with board-ready financial summary.

Lisa (Sales) --influences--> 50 sales reps
  Lisa is a force multiplier for adoption.
  Strategy: Make Lisa a co-designer so she becomes an evangelist.
```

## RACI Matrix

### Framework

```
R = Responsible  (Does the work)
A = Accountable  (Owns the decision, only ONE per row)
C = Consulted    (Provides input before the decision)
I = Informed     (Notified after the decision)
```

### RACI Template

```markdown
| Decision/Deliverable | PM | Eng Lead | Design | Security | Legal | Exec Sponsor |
|---------------------|-----|----------|--------|----------|-------|-------------|
| Architecture design | I | R/A | C | C | I | I |
| UI/UX design | C | C | R/A | I | I | I |
| Data model changes | I | R/A | I | C | C | I |
| Go/No-go launch | R | C | C | C | C | A |
| Budget approval | R | I | I | I | I | A |
| Vendor selection | R | C | I | C | A | I |
| Incident response | C | R/A | I | C | I | I |
| Roadmap priorities | R/A | C | C | I | I | C |
```

### RACI Rules
1. **Every row has exactly one A** -- if nobody is Accountable, nobody owns it
2. **Minimize Rs** -- too many Responsible people means diffusion of ownership
3. **C means you MUST consult them** -- not optional, happens BEFORE the decision
4. **I means they learn about it** -- after the fact, no input expected
5. **Review quarterly** -- roles shift as projects evolve

### RACI Anti-Patterns

```
PROBLEM: Every cell is R or C
  SYMPTOM: Decisions take forever, everyone has veto power
  FIX: Ask "Would this decision be materially different without their input?"
       If no, downgrade from C to I.

PROBLEM: Multiple As in one row
  SYMPTOM: Accountability is unclear, balls get dropped
  FIX: Only one person can be Accountable. They can delegate R work.

PROBLEM: RACI exists but nobody follows it
  SYMPTOM: People bypass the matrix and go directly to executives
  FIX: Executives must redirect to the Accountable person.
       "That is Sarah's call -- have you talked to Sarah?"
```

## Communication Planning

### Communication Plan Template

```markdown
## Stakeholder Communication Plan

### Executive Sponsors (Manage Closely)
- **Format**: 1:1 meetings + email summary
- **Frequency**: Biweekly 30-min check-in
- **Content**: Progress vs milestones, risks, decisions needed
- **Owner**: Project Manager
- **Channel**: Calendar invite + follow-up email

### Engineering Teams (Keep Informed)
- **Format**: Slack updates + sprint demos
- **Frequency**: Weekly Slack post, biweekly demo
- **Content**: What shipped, what is coming, how to give feedback
- **Owner**: Tech Lead
- **Channel**: #project-updates Slack channel

### End Users (Keep Informed)
- **Format**: Monthly newsletter + beta access
- **Frequency**: Monthly
- **Content**: New features, how to provide feedback, known issues
- **Owner**: Product Manager
- **Channel**: Email list + in-app announcements

### Security/Compliance (Keep Satisfied)
- **Format**: Review meetings at key milestones
- **Frequency**: At design review, pre-launch, post-launch
- **Content**: Architecture decisions, data flows, compliance checklist
- **Owner**: Tech Lead + PM
- **Channel**: Formal review meeting with documentation
```

### Tailoring Communication by Stakeholder Type

```
EXECUTIVES:
  - Lead with business impact, not technical details
  - Use dashboards and RAG status (Red/Amber/Green)
  - Always include "decisions needed" section
  - Keep to 5 minutes or 1 page

TECHNICAL PEERS:
  - Use architecture diagrams and code examples
  - Share trade-off analysis, not just decisions
  - Invite them to RFC reviews
  - Be transparent about technical debt

END USERS:
  - Focus on what changes for them
  - Provide migration guides and timelines
  - Open feedback channels (surveys, office hours)
  - Celebrate their input when you act on it

RESISTANT STAKEHOLDERS:
  - Listen first, present second
  - Acknowledge their concerns explicitly
  - Show how their input shaped the plan
  - Provide data, not opinions
```

## Expectation Management

### Setting Expectations Early

```markdown
## Project Expectations Document

### What This Project WILL Deliver
- [Specific, measurable deliverables]
- [By when, with what quality bar]

### What This Project Will NOT Deliver
- [Explicitly list out-of-scope items]
- [Future phases vs current phase]

### Known Risks and Constraints
- [Timeline risks]
- [Resource constraints]
- [Technical unknowns]

### How Decisions Will Be Made
- [Link to RACI matrix]
- [Escalation path]
- [Change request process]

### How Progress Will Be Communicated
- [Link to communication plan]
- [Where to find status updates]
- [How to raise concerns]
```

### Managing Scope Creep from Stakeholders

```
When a stakeholder requests scope expansion:

1. ACKNOWLEDGE: "I understand why that is important to you."
2. ASSESS: "Let me evaluate the impact on timeline and resources."
3. PRESENT TRADE-OFFS: "We can do X, but it means delaying Y by 2 weeks.
   Alternatively, we can include X in phase 2."
4. DOCUMENT: Record the decision and rationale.
5. COMMUNICATE: Inform all affected stakeholders of the change (or non-change).

NEVER say "no" without offering an alternative path.
NEVER say "yes" without quantifying the impact.
```

## Influence Strategies

### By Stakeholder Attitude

```
CHAMPIONS (Supportive + High Power):
  Strategy: Leverage and protect
  - Give them talking points to advocate on your behalf
  - Keep them informed so they are never caught off-guard
  - Ask them to open doors to resistant stakeholders
  - Protect their credibility by delivering on promises

SUPPORTERS (Supportive + Low Power):
  Strategy: Amplify
  - Feature their use cases in demos and reports
  - Connect them with Champions to amplify their voice
  - Give them early access to build enthusiasm
  - Ask them to recruit other supporters

NEUTRALS (Neither supportive nor resistant):
  Strategy: Educate and involve
  - Invite to demos and workshops (exposure builds support)
  - Ask for their input on specific decisions
  - Address their unstated concerns (neutrality often masks uncertainty)
  - Show how the project benefits their goals

CRITICS (Resistant + Low Power):
  Strategy: Address and contain
  - Listen to their concerns (they may have valid points)
  - Address concerns with data and evidence
  - Do not let their resistance spread to others
  - Keep them informed to prevent rumor-based resistance

BLOCKERS (Resistant + High Power):
  Strategy: Convert or navigate
  - Understand their REAL concern (often not what they state publicly)
  - Find common ground or shared goals
  - Enlist Champions to influence them
  - If conversion fails, find alternative approval paths
  - Never surprise them -- they will retaliate
```

### Influence Techniques

```
1. SOCIAL PROOF: "Teams X, Y, and Z have already adopted this approach."
2. RECIPROCITY: Help them with something first, then ask for support.
3. AUTHORITY: Bring external experts or industry benchmarks.
4. SCARCITY: "This window for migration closes in Q2."
5. CONSISTENCY: Reference their own stated goals and values.
6. COALITION: Build a group of supporters before approaching the blocker.
```

## Conflict Resolution

### Stakeholder Conflict Framework

```
STEP 1: DIAGNOSE THE CONFLICT
  - Is it about goals? (We want different outcomes)
  - Is it about approach? (Same goal, different methods)
  - Is it about resources? (We are competing for the same budget/people)
  - Is it about ego? (Positional, not substantive)

STEP 2: SEPARATE POSITIONS FROM INTERESTS
  Position: "We need to build this in-house"
  Interest: "We need to control our roadmap and not depend on vendors"
  The interest can be satisfied multiple ways.

STEP 3: FIND THE OVERLAP
  Map both parties' interests. Where do they align?
  Build the solution from shared interests outward.

STEP 4: PROPOSE OPTIONS
  Generate 3+ options that address core interests.
  Let stakeholders choose rather than imposing.

STEP 5: ESCALATE ONLY WHEN NECESSARY
  If alignment fails, escalate to the shared authority.
  Present the conflict neutrally with options, not complaints.
```

### Escalation Path Template

```markdown
## Escalation Path

Level 1: Direct conversation between disagreeing parties
  Timeframe: 2 business days to resolve

Level 2: Mediated discussion with Project Manager
  Timeframe: 3 business days to resolve

Level 3: Decision by shared manager/run-cmd sponsor
  Timeframe: 5 business days to resolve
  Input: Written summary of positions, trade-offs, and recommendation

Level 4: Steering committee decision
  Timeframe: Next scheduled meeting
  Input: Formal decision paper with impact analysis
```

## Stakeholder Review Cadence

### Monthly Stakeholder Health Check

```markdown
## Stakeholder Health Check - [Month]

| Stakeholder | Expected Attitude | Current Attitude | Trend | Action Needed |
|------------|-------------------|-----------------|-------|---------------|
| Sarah (VP) | Champion | Champion | Stable | Continue engagement |
| Mike (Sec) | Neutral | Resistant | Down | Schedule 1:1 to understand concerns |
| Lisa (Sales) | Supporter | Champion | Up | Leverage for user advocacy |
| James (CFO) | Neutral | Neutral | Stable | Send ROI update before board meeting |

### Changes This Month
- Mike shifted to resistant after learning about the data migration timeline
- ACTION: Schedule joint session with Mike and Sarah to address security concerns

### Upcoming Risks
- Board meeting in 3 weeks -- James needs updated financial projections
- Sales kickoff -- opportunity to demo to Lisa's team
```

## Quick Reference Card

```
IDENTIFY: Cast wide net, 10-question discovery checklist
MAP: Power-Interest grid, Influence-Attitude map
PLAN: RACI matrix (one A per row), Communication plan per segment
ENGAGE: Tailor by stakeholder type and attitude
MANAGE: Set expectations early, document scope boundaries
INFLUENCE: Leverage champions, convert blockers, amplify supporters
RESOLVE: Separate positions from interests, escalate with options
REVIEW: Monthly health check, track attitude trends
```

## When to Use

**Use this skill when:**
- Designing or implementing stakeholder manager solutions
- Reviewing or improving existing stakeholder manager approaches
- Making architectural or implementation decisions about stakeholder manager
- Learning stakeholder manager patterns and best practices
- Troubleshooting stakeholder manager-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Stakeholder Manager Analysis

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

**Input:** "Help me implement stakeholder manager for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended stakeholder manager approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When stakeholder manager must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
