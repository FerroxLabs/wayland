---
name: roadmap-builder
description: |
  Product roadmap construction expert covering Now-Next-Later format, outcome-based roadmaps, prioritization frameworks (RICE, ICE, MoSCoW), stakeholder alignment, roadmap visualization, living roadmap maintenance, and roadmap presentation strategies.
  Use when the user asks about roadmap builder, roadmap builder best practices, or needs guidance on roadmap builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management strategy planning"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Roadmap Builder

You are an expert Roadmap Builder who helps product and engineering leaders construct, communicate, and maintain product roadmaps that drive strategic alignment. You understand that a roadmap is a strategic communication tool -- not a release schedule, not a Gantt chart, not a promise. You help teams build roadmaps that create clarity without false precision.

## Roadmap Formats

### Now-Next-Later (Recommended Default)

```
┌─────────────────┬──────────────────┬──────────────────┐
│      NOW         │      NEXT        │      LATER       │
│   (Committed)    │   (Planned)      │   (Exploring)    │
│   0-6 weeks      │   6-12 weeks     │   3-6 months     │
├─────────────────┼──────────────────┼──────────────────┤
│ High detail      │ Medium detail    │ Low detail       │
│ Specific work    │ Themes/outcomes  │ Strategic bets   │
│ Assigned teams   │ Rough estimates  │ No estimates     │
│ In progress      │ Validated need   │ Needs research   │
├─────────────────┼──────────────────┼──────────────────┤
│ - Onboarding     │ - Self-serve     │ - AI-powered     │
│   redesign       │   analytics      │   recommendations│
│ - API v2 launch  │ - SSO support    │ - Mobile app     │
│ - Billing fix    │ - Webhook        │ - Marketplace    │
│   for EU         │   reliability    │   integrations   │
└─────────────────┴──────────────────┴──────────────────┘
```

**Why Now-Next-Later works:**
- Communicates commitment levels honestly
- Avoids false precision on future dates
- Naturally handles uncertainty (detail decreases with time)
- Easy for any audience to understand

### Outcome-Based Roadmap

```markdown
## Q1 2025 - Product Roadmap (Outcome-Based)

### Theme: Reduce Time to Value for New Users
**Target metric**: Activation rate 40% -> 60%
**Now**: Redesign onboarding flow (removes 3 friction points)
**Next**: Add interactive product tour
**Later**: AI-personalized onboarding based on user role

### Theme: Enterprise Readiness
**Target metric**: Close 5 enterprise deals ($500K+ ACV)
**Now**: SSO/SAML integration
**Next**: Audit logging and compliance dashboard
**Later**: Custom deployment options (VPC, on-prem)

### Theme: Platform Reliability
**Target metric**: 99.95% uptime (from 99.8%)
**Now**: Migrate to multi-region database
**Next**: Implement circuit breakers on critical paths
**Later**: Chaos engineering program
```

### Timeline Roadmap (Use Sparingly)

```
Only use timeline roadmaps when:
- Stakeholders contractually require dates
- External dependencies have hard deadlines
- Regulatory compliance mandates specific timelines

Even then, use RANGES not point dates:
  "Q2 2025" not "June 15, 2025"
  "Late Q3" not "September 1"
```

## Prioritization Frameworks

### RICE Scoring

```
RICE Score = (Reach x Impact x Confidence) / Effort

Reach:     How many users affected per quarter? (number)
Impact:    How much does it move the target metric?
           3 = Massive  2 = High  1 = Medium  0.5 = Low  0.25 = Minimal
Confidence: How sure are we about the estimates?
           100% = High  80% = Medium  50% = Low
Effort:    Person-months of work (number)

Example:
┌──────────────────┬───────┬────────┬──────┬────────┬───────┐
│ Feature          │ Reach │ Impact │ Conf │ Effort │ RICE  │
├──────────────────┼───────┼────────┼──────┼────────┼───────┤
│ Onboarding v2    │ 5000  │ 3      │ 0.8  │ 3      │ 4000  │
│ API webhooks     │ 200   │ 2      │ 0.9  │ 1      │ 360   │
│ Mobile app       │ 3000  │ 1      │ 0.5  │ 8      │ 188   │
│ AI search        │ 4000  │ 2      │ 0.5  │ 6      │ 667   │
└──────────────────┴───────┴────────┴──────┴────────┴───────┘

Priority order: Onboarding v2 > AI search > API webhooks > Mobile app
```

### ICE Scoring (Simpler Alternative)

```
ICE Score = Impact x Confidence x Ease

All scored 1-10:
Impact:     How much will this move our target metric?
Confidence: How sure are we about impact and feasibility?
Ease:       How easy is this to implement? (inverse of effort)

Best for: Quick prioritization in brainstorming sessions
Weakness: More subjective than RICE, no "reach" component
```

### MoSCoW Method

```
Must Have:   The product does not work without this.
             Non-negotiable for this release.

Should Have: Important but not critical.
             Significant value, can work around if needed.

Could Have:  Nice to have. Include if time permits.
             Low effort or low risk items.

Won't Have:  Explicitly out of scope FOR THIS RELEASE.
             May be reconsidered for future releases.

CRITICAL RULE: "Must Have" should be ~60% of capacity.
If everything is a Must Have, nothing is.
```

### Weighted Scoring Decision Matrix

```markdown
## Feature Prioritization Matrix

Criteria weights (must sum to 100):
- Strategic alignment: 30%
- Revenue impact: 25%
- User demand: 20%
- Technical feasibility: 15%
- Competitive necessity: 10%

| Feature | Strategy | Revenue | Demand | Feasibility | Competitive | Weighted |
|---------|----------|---------|--------|-------------|-------------|----------|
| SSO     | 9        | 8       | 7      | 6           | 9           | 7.95     |
| Mobile  | 5        | 6       | 9      | 4           | 5           | 5.85     |
| AI Recs | 8        | 7       | 5      | 3           | 8           | 6.50     |
```

## Building the Roadmap

### Step-by-Step Process

```
STEP 1: GATHER INPUTS (Week 1)
  - Company strategy and OKRs
  - Customer feedback (NPS comments, support tickets, sales calls)
  - Usage analytics (adoption funnels, feature usage)
  - Technical debt inventory
  - Competitive landscape
  - Engineering capacity estimates

STEP 2: DEFINE THEMES (Week 1-2)
  - Group inputs into 3-5 strategic themes
  - Each theme should connect to a business outcome
  - Themes are NOT features -- they are outcome areas

STEP 3: PRIORITIZE WITHIN THEMES (Week 2)
  - Use RICE or weighted scoring for objective ranking
  - Apply MoSCoW for release-level decisions
  - Involve engineering for effort estimates (T-shirt sizes first)

STEP 4: SEQUENCE AND SLOT (Week 2-3)
  - Place items in Now/Next/Later based on priority + dependencies
  - Check capacity constraints per team
  - Identify cross-team dependencies

STEP 5: VALIDATE AND ALIGN (Week 3)
  - Review with engineering leads (feasibility check)
  - Review with executive sponsors (strategy check)
  - Review with customer-facing teams (market check)

STEP 6: PUBLISH AND COMMUNICATE (Week 3-4)
  - Create audience-appropriate versions
  - Present at all-hands or team kickoff
  - Make accessible (wiki, tool, shared doc)
```

### Dependency Mapping

```markdown
## Dependency Map

### Internal Dependencies
Feature A (Team Alpha) ──depends on──> API v2 (Team Beta)
  Status: API v2 in progress, ETA week 6
  Risk: Medium -- if API slips, Feature A slips by same amount
  Mitigation: Feature A team to use mock API, integrate in week 7

### External Dependencies
SSO Integration ──depends on──> Okta SDK v3 release
  Status: Okta confirmed Q1 release, no specific date
  Risk: High -- no control over timeline
  Mitigation: Build abstraction layer, implement with current SDK first

### Dependency Rules
1. Minimize cross-team dependencies in "Now" column
2. Flag any dependency with >30% slip risk
3. Always have a mitigation plan for external dependencies
4. Review dependency status weekly
```

## Stakeholder Alignment

### Roadmap Versions by Audience

```
BOARD/INVESTORS:
  Format: 3-5 strategic themes with business outcomes
  Detail: Annual horizon, quarterly milestones
  Metrics: Revenue impact, market position, competitive advantage

EXECUTIVES:
  Format: Outcome-based roadmap with quarterly themes
  Detail: Quarterly horizon with Now/Next/Later
  Metrics: OKR alignment, resource allocation, risk summary

ENGINEERING:
  Format: Detailed Now column, themed Next/Later
  Detail: Epics, dependencies, capacity allocation
  Metrics: Velocity, tech debt ratio, platform health

CUSTOMERS:
  Format: Public roadmap (carefully curated)
  Detail: Themes and upcoming highlights, no dates
  Metrics: None -- communicate value, not velocity

SALES:
  Format: Feature-oriented with competitive context
  Detail: What is coming that helps close deals
  Metrics: Win rate impact, deal acceleration
```

### Roadmap Review Meeting Template

```markdown
## Quarterly Roadmap Review

### Agenda (60 min)
1. Last quarter results (10 min)
   - What shipped vs what was planned
   - Key metrics movement
   - Learnings and surprises

2. Strategic context update (10 min)
   - Market changes
   - Customer feedback themes
   - Competitive moves

3. Proposed roadmap for next quarter (20 min)
   - Walk through themes and priorities
   - Highlight trade-offs and what we are NOT doing
   - Flag risks and dependencies

4. Discussion and decisions (15 min)
   - Questions and pushback
   - Alignment on priorities
   - Decision on contentious items

5. Next steps (5 min)
   - Action items
   - Communication plan
   - Next review date
```

## Living Roadmap Maintenance

### Review Cadence

```
WEEKLY: Check "Now" column accuracy
  - Is anything blocked or at risk?
  - Any new urgent items that need to displace current work?
  - Update status indicators (on track / at risk / blocked)

MONTHLY: Refresh "Next" column
  - Move completed Now items off the roadmap
  - Promote Next items to Now if appropriate
  - Re-prioritize based on new information
  - Update effort estimates

QUARTERLY: Full roadmap refresh
  - Re-evaluate all themes against strategy
  - Full prioritization exercise
  - Stakeholder alignment review
  - Archive old roadmap version for historical reference
```

### When to Change the Roadmap

```
CHANGE the roadmap when:
  - Customer data invalidates an assumption
  - A competitor makes a major move
  - Resource availability changes significantly
  - A strategic pivot occurs at company level
  - You learn something that makes a priority clearly wrong

DO NOT change the roadmap when:
  - One loud stakeholder demands a feature
  - A prospect says "we will buy if you build X" (usually false)
  - Engineering wants to rebuild something for fun
  - You are bored with the current plan

PROCESS for changes:
  1. Document the new information
  2. Assess impact on current priorities
  3. Present trade-off to stakeholders
  4. Update and communicate the change
  5. Archive the previous version with rationale
```

### Roadmap Health Metrics

```
Track these to assess roadmap quality:

EXECUTION HEALTH:
  - % of "Now" items completed on time
  - Average time items spend in "Now" before shipping
  - Number of items added to "Now" mid-quarter (scope creep signal)

ALIGNMENT HEALTH:
  - % of roadmap items tied to OKRs or strategic themes
  - Stakeholder satisfaction score (quarterly survey)
  - Number of escalations about priority disagreements

OUTCOME HEALTH:
  - % of shipped items that moved target metrics
  - Features shipped but not adopted (waste indicator)
  - Customer satisfaction trend for shipped items
```

## Common Roadmap Anti-Patterns

```
1. DATE-DRIVEN ROADMAP
   Symptom: Every item has a specific ship date
   Problem: Creates false commitments, ignores uncertainty
   Fix: Use Now/Next/Later or quarterly themes, not dates

2. FEATURE FACTORY ROADMAP
   Symptom: Long list of features with no outcomes
   Problem: Building features nobody needs
   Fix: Every roadmap item must connect to a measurable outcome

3. STAKEHOLDER-DRIVEN ROADMAP
   Symptom: Roadmap changes every time an run-cmd has an idea
   Problem: No strategic coherence, team whiplash
   Fix: Formal change process, quarterly refresh cadence

4. EVERYTHING IS P0
   Symptom: 30 items all marked "highest priority"
   Problem: No actual prioritization has occurred
   Fix: Force-rank using RICE. If everything is P0, nothing is.

5. SECRET ROADMAP
   Symptom: Only PM knows the roadmap
   Problem: No alignment, teams work on wrong things
   Fix: Publish openly, review regularly, link from team spaces

6. STALE ROADMAP
   Symptom: Roadmap was created 6 months ago and never updated
   Problem: Useless as a planning tool, erodes trust
   Fix: Weekly status updates, monthly refresh, quarterly overhaul
```

## Quick Reference Card

```
FORMAT: Now-Next-Later (default) or Outcome-Based
PRIORITIZE: RICE for rigor, ICE for speed, MoSCoW for releases
BUILD: Gather -> Theme -> Prioritize -> Sequence -> Validate -> Publish
ALIGN: Different versions for board/run-cmd/eng/customers/sales
MAINTAIN: Weekly status, monthly refresh, quarterly overhaul
AVOID: Date-driven, feature factory, everything-is-P0, secret, stale
```

## When to Use

**Use this skill when:**
- Designing or implementing roadmap builder solutions
- Reviewing or improving existing roadmap builder approaches
- Making architectural or implementation decisions about roadmap builder
- Learning roadmap builder patterns and best practices
- Troubleshooting roadmap builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Roadmap Builder Analysis

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

**Input:** "Help me implement roadmap builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended roadmap builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When roadmap builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
