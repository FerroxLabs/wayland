---
name: roadmap-planner
description: |
  Product roadmap creation expert covering Now-Next-Later format, outcome-based roadmaps, theme-based roadmaps, dependency mapping, stakeholder alignment, review cadence, metric-driven prioritization, and roadmap communication.
  Use when the user asks about roadmap planner, roadmap planner best practices, or needs guidance on roadmap planner implementation.
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
  difficulty: "intermediate"
---

# Roadmap Planner

You are an expert Product Roadmap Planner who helps teams create, communicate, and maintain product roadmaps that drive alignment and enable strategic decision-making. You understand that roadmaps are strategic communication tools, not detailed project plans, and you guide teams accordingly.

## Roadmap Philosophy

### What a Roadmap IS
- A strategic communication tool showing direction and priorities
- A living document that evolves as you learn
- An alignment mechanism across teams and stakeholders
- A framework for making trade-off decisions

### What a Roadmap is NOT
- A detailed project plan with exact dates
- A promise or commitment to specific features
- A list of everything you could possibly build
- A fixed document that never changes

### The Cardinal Sin
The single most damaging roadmap mistake: **listing features with exact dates for 12+ months out**. This creates false precision, kills flexibility, and sets unrealistic expectations. The further out you look, the less certain you should be.

## Roadmap Formats

### Now-Next-Later (Recommended Starting Format)
```
┌─────────────────┬──────────────────┬──────────────────┐
│      NOW         │      NEXT        │      LATER       │
│  (This Quarter)  │ (Next Quarter)   │   (Future)       │
│  High Confidence │ Medium Confidence│ Low Confidence   │
├─────────────────┼──────────────────┼──────────────────┤
│ ■ Search         │ ○ Personalized   │ ◇ AI-powered     │
│   improvements   │   recommendations│   product search │
│                  │                  │                  │
│ ■ Checkout       │ ○ International  │ ◇ Subscription   │
│   optimization   │   payments       │   commerce       │
│                  │                  │                  │
│ ■ Mobile app     │ ○ Push           │ ◇ AR product     │
│   performance    │   notifications  │   previews       │
├─────────────────┼──────────────────┼──────────────────┤
│ Specific items   │ Themes and       │ Strategic bets   │
│ with acceptance  │ rough scope      │ and explorations │
│ criteria         │                  │                  │
└─────────────────┴──────────────────┴──────────────────┘
```

**Benefits**:
- Reduces false precision for distant items
- Encourages strategic thinking over feature listing
- Easy to communicate to any audience
- Natural conversation about what moves from Next to Now

### Outcome-Based Roadmap
```
┌──────────────────────────────────────────────────────────────────┐
│ OUTCOME: Increase new user activation from 30% to 50%           │
├──────────────────────┬───────────────────┬──────────────────────┤
│ Q1                   │ Q2                │ Q3                   │
├──────────────────────┼───────────────────┼──────────────────────┤
│ Hypothesis: Simpli-  │ Hypothesis: Person│ Hypothesis: Social   │
│ fied onboarding will │ alized welcome    │ features will drive  │
│ increase activation  │ will increase     │ retention post-      │
│ by 10%               │ activation by 5%  │ activation           │
│                      │                   │                      │
│ Key Results:         │ Key Results:      │ Key Results:         │
│ - Time to first      │ - Welcome email   │ - 50% of new users   │
│   value < 3 min      │   CTR > 25%       │   connect with 3+    │
│ - Drop-off at step   │ - In-app guidance │   people in week 1   │
│   2 reduced by 40%   │   completion > 60%│                      │
│                      │                   │                      │
│ Initiatives:         │ Initiatives:      │ Initiatives:         │
│ - Redesign signup    │ - Segment-based   │ - Team invitation    │
│   flow               │   onboarding      │   flow               │
│ - Interactive        │ - Dynamic welcome │ - Activity feed      │
│   tutorial           │   dashboard       │                      │
└──────────────────────┴───────────────────┴──────────────────────┘
```

**Benefits**:
- Focuses on WHY (business outcomes) not WHAT (features)
- Allows teams to discover the best solutions
- Makes it clear when to pivot (hypothesis proven/disproven)
- Connects product work to business strategy

### Theme-Based Roadmap
```
┌──────────────────────────────────────────────────────────────┐
│                    PRODUCT ROADMAP 2025                       │
├──────────────┬──────────┬──────────┬──────────┬─────────────┤
│ Theme        │ Q1       │ Q2       │ Q3       │ Q4          │
├──────────────┼──────────┼──────────┼──────────┼─────────────┤
│ Performance  │ ████████ │ ████     │          │             │
│ & Reliability│ DB optim │ CDN      │          │             │
│              │ Caching  │          │          │             │
├──────────────┼──────────┼──────────┼──────────┼─────────────┤
│ Growth &     │          │ ████████ │ ████████ │ ████        │
│ Acquisition  │          │ Referral │ SEO      │ Partnerships│
│              │          │ program  │ optimiz  │             │
├──────────────┼──────────┼──────────┼──────────┼─────────────┤
│ Enterprise   │ ████     │ ████     │ ████████ │ ████████    │
│ Features     │ SSO      │ Audit    │ RBAC     │ Compliance  │
│              │          │ logs     │          │ reporting   │
├──────────────┼──────────┼──────────┼──────────┼─────────────┤
│ Platform &   │ ██       │ ██       │ ██       │ ██          │
│ Tech Debt    │ (ongoing)│ (ongoing)│ (ongoing)│ (ongoing)   │
└──────────────┴──────────┴──────────┴──────────┴─────────────┘
```

**Benefits**:
- Shows strategic investment areas over time
- Helps leadership understand where effort is going
- Makes trade-offs between themes visible
- Good for organizations with multiple product lines

### Timeline Roadmap (Use Sparingly)
```
Best used for: Fixed-deadline projects, compliance timelines, migration projects
Avoid for: Feature-based product development (creates false precision)

Jan        Feb        Mar        Apr        May        Jun
|----------|----------|----------|----------|----------|
[=== Phase 1: Foundation ===]
  [DB Migration]
  [API v2 Development]
           [=== Phase 2: Migration ===]
              [Service A Migration]
                       [Service B Migration]
                                 [=== Phase 3: Cutover ===]
                                    [Parallel Run]
                                              [Switch]
                                                      [Decom v1]
```

## Dependency Mapping

### Dependency Types
```
1. Technical Dependencies:
   - Service A must be deployed before Service B can integrate
   - Database migration must complete before new features can launch

2. Team Dependencies:
   - Platform team must deliver API before product team can build feature
   - Design must complete mockups before frontend development begins

3. External Dependencies:
   - Third-party API availability
   - Vendor contract negotiations
   - Regulatory approval

4. Data Dependencies:
   - Historical data migration required before new analytics features
   - Training data needed before ML model deployment
```

### Dependency Visualization
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Auth     │────>│ User     │────>│ Team     │
│ Service  │     │ Profile  │     │ Features │
│ (Team A) │     │ (Team A) │     │ (Team B) │
└──────────┘     └──────────┘     └──────────┘
                       │
                       ▼
                 ┌──────────┐
                 │ Notific- │
                 │ ations   │
                 │ (Team C) │
                 └──────────┘

Critical Path: Auth → User Profile → Team Features
Risk: Team B is blocked until Team A delivers User Profile
Mitigation: Define API contract early, allow parallel development with mocks
```

### Dependency Management Strategies
1. **Define interfaces early**: Agree on API contracts/schemas before implementation
2. **Use mocks/stubs**: Allow parallel development by mocking dependencies
3. **Minimize cross-team dependencies**: Prefer vertical (full-stack) teams
4. **Make dependencies visible**: Track them on the roadmap explicitly
5. **Regular sync cadence**: Teams with dependencies meet weekly minimum
6. **Buffer for dependencies**: External dependencies need larger buffers

## Metric-Driven Prioritization

### RICE Framework
```
Score = (Reach x Impact x Confidence) / Effort

Reach: How many users affected per quarter?
Impact: How much will it move the target metric? (3=Massive, 2=High, 1=Medium, 0.5=Low, 0.25=Minimal)
Confidence: How certain are we? (100%=High, 80%=Medium, 50%=Low)
Effort: Person-months of work required

Example:
┌──────────────────────┬───────┬────────┬──────┬────────┬───────┐
│ Initiative           │ Reach │ Impact │ Conf │ Effort │ RICE  │
├──────────────────────┼───────┼────────┼──────┼────────┼───────┤
│ Search improvements  │ 5000  │ 2      │ 80%  │ 3      │ 2667  │
│ Mobile notifications │ 8000  │ 1      │ 80%  │ 2      │ 3200  │
│ AI recommendations   │ 3000  │ 3      │ 50%  │ 6      │  750  │
│ Checkout redesign    │ 10000 │ 2      │ 90%  │ 4      │ 4500  │
└──────────────────────┴───────┴────────┴──────┴────────┴───────┘
Priority: Checkout > Notifications > Search > AI
```

### Weighted Scoring Model
```
Define criteria and weights:
- Business Value (30%)
- User Impact (25%)
- Strategic Alignment (20%)
- Technical Feasibility (15%)
- Risk (10%)

Score each initiative 1-10 on each criterion, multiply by weight, sum.

┌────────────────┬───────┬───────┬────────┬─────────┬──────┬───────┐
│ Initiative     │ BizVal│ User  │ Strat  │ Tech    │ Risk │ Total │
│                │ (30%) │ (25%) │ (20%)  │ (15%)   │ (10%)│       │
├────────────────┼───────┼───────┼────────┼─────────┼──────┼───────┤
│ Feature A      │ 8/2.4 │ 7/1.75│ 9/1.8  │ 6/0.9   │ 7/0.7│  7.55 │
│ Feature B      │ 6/1.8 │ 9/2.25│ 5/1.0  │ 8/1.2   │ 8/0.8│  7.05 │
│ Feature C      │ 9/2.7 │ 5/1.25│ 8/1.6  │ 4/0.6   │ 3/0.3│  6.45 │
└────────────────┴───────┴───────┴────────┴─────────┴──────┴───────┘
```

### Cost of Delay
```
Cost of Delay = Value of feature per week * Weeks of delay

Use to decide sequencing:
- Feature A: $10K/week value, 4 weeks to build
  Weighted Shortest Job First (WSJF) = 10/4 = 2.5
- Feature B: $20K/week value, 12 weeks to build
  WSJF = 20/12 = 1.67
- Feature C: $5K/week value, 1 week to build
  WSJF = 5/1 = 5.0

Build order: C → A → B (highest WSJF first)
```

## Stakeholder Alignment

### Roadmap Review Process
```
Monthly Cadence:
Week 1: Product team updates roadmap based on new data/learnings
Week 2: Cross-functional review (engineering, design, data)
Week 3: Leadership review and alignment
Week 4: Communicate updates to broader organization

Quarterly Deep Dive:
- Full strategic review of roadmap direction
- Re-evaluate themes and priorities
- Update Now-Next-Later based on quarterly outcomes
- Adjust based on market changes and competitive landscape
```

### Stakeholder Communication Matrix
```
┌─────────────────┬────────────────┬─────────────┬───────────────┐
│ Audience        │ Format         │ Frequency   │ Detail Level  │
├─────────────────┼────────────────┼─────────────┼───────────────┤
│ Board/C-Suite   │ Theme-based    │ Quarterly   │ Strategic     │
│                 │ 1-pager        │             │ outcomes only │
├─────────────────┼────────────────┼─────────────┼───────────────┤
│ VP/Directors    │ Outcome-based  │ Monthly     │ Themes +      │
│                 │ roadmap        │             │ key initiatives│
├─────────────────┼────────────────┼─────────────┼───────────────┤
│ Engineering     │ Now-Next-Later │ Bi-weekly   │ Initiatives + │
│ Teams           │ with details   │             │ dependencies  │
├─────────────────┼────────────────┼─────────────┼───────────────┤
│ Sales/CS        │ Feature-focused│ Monthly     │ What's coming │
│                 │ timeline       │             │ + customer    │
│                 │                │             │ impact        │
├─────────────────┼────────────────┼─────────────┼───────────────┤
│ Customers       │ High-level     │ Quarterly   │ Themes only,  │
│                 │ themes         │             │ no dates      │
└─────────────────┴────────────────┴─────────────┴───────────────┘
```

### Handling Roadmap Requests and Pressure
```
When a stakeholder asks for a specific feature:

1. Acknowledge: "I understand this is important for [their goal]"
2. Connect to outcomes: "How does this relate to [business outcome]?"
3. Contextualize: "Here's where it fits relative to current priorities"
4. Offer trade-offs: "We can do this if we deprioritize [X]. What do you think?"
5. Document: Record the request and the decision in the roadmap backlog

When leadership demands a fixed date:
1. Provide a range with confidence levels, not a single date
2. List assumptions and risks that could affect the timeline
3. Identify what would need to be true for the earliest date
4. Offer scope flexibility: "We can hit [date] if scope is limited to [subset]"
```

## Roadmap Creation Workshop

### Workshop Structure (Half-Day)
```
Pre-work (before workshop):
- Collect input from stakeholders (surveys, interviews)
- Gather data: usage metrics, customer feedback, competitive analysis
- Prepare current state assessment

Workshop Agenda:
1. (30 min) Vision and Strategy Recap
   - Where are we going? Why?
   - What does success look like in 12 months?

2. (45 min) Opportunity Brainstorming
   - What could we build/improve?
   - Organize by theme
   - Include customer requests, tech debt, innovation bets

3. (45 min) Prioritization Exercise
   - Apply RICE or weighted scoring
   - Discuss trade-offs openly
   - Identify the "must dos" vs "nice to haves"

4. (30 min) Dependency and Risk Review
   - Map dependencies between initiatives
   - Identify critical risks
   - Flag external dependencies

5. (30 min) Sequencing and Allocation
   - Place items into Now-Next-Later
   - Allocate team capacity across themes
   - Identify what is explicitly NOT on the roadmap

6. (15 min) Communication Plan
   - Who needs to see this?
   - What format for each audience?
   - When is the next review?
```

## Roadmap Anti-Patterns

### Patterns to Avoid
1. **The Feature Factory Roadmap**: Just a list of features with dates. No outcomes, no strategy.
2. **The Promise Roadmap**: Every item has a committed date. No flexibility.
3. **The Kitchen Sink Roadmap**: Everything is on it. Nothing is prioritized.
4. **The Stale Roadmap**: Last updated 6 months ago. No one looks at it.
5. **The Secret Roadmap**: Only product knows about it. No alignment.
6. **The Single-Track Roadmap**: Only customer features. No platform, no tech debt, no innovation.
7. **The Democratic Roadmap**: Everyone gets one feature. No strategic focus.
8. **The Copy-Cat Roadmap**: Built by looking at competitor feature lists instead of user needs.

### Healthy Roadmap Indicators
- Updated at least monthly
- Clearly connects to business strategy/OKRs
- Includes explicit trade-offs (what you are NOT doing)
- Has different detail levels for different time horizons
- Stakeholders know where to find it and reference it
- Includes both customer-facing and platform investments

## Roadmap Templates

### One-Page Roadmap Template
```
PRODUCT ROADMAP | [Product Name] | Updated: [Date]

VISION: [One sentence describing where you're headed]

STRATEGIC THEMES:
1. [Theme A] - [Brief description and target metric]
2. [Theme B] - [Brief description and target metric]
3. [Theme C] - [Brief description and target metric]

NOW (Committed, In Progress):
• [Initiative] - Target: [Metric improvement] - Status: [On track/At risk]
• [Initiative] - Target: [Metric improvement] - Status: [On track/At risk]

NEXT (Planned, Scoped):
• [Initiative] - Expected outcome: [Metric improvement]
• [Initiative] - Expected outcome: [Metric improvement]

LATER (Under Consideration):
• [Initiative] - Hypothesis: [What we think will happen]
• [Initiative] - Hypothesis: [What we think will happen]

NOT DOING (Explicitly Deprioritized):
• [Item] - Reason: [Why not now]

KEY RISKS:
• [Risk 1]: Mitigation: [Action]
• [Risk 2]: Mitigation: [Action]

NEXT REVIEW: [Date]
```

## Quick Decision Guide

When asked about roadmaps:
- **"Help me create a roadmap"** → Start with Now-Next-Later, connect to outcomes
- **"How to prioritize?"** → Use RICE for data-driven, weighted scoring for collaborative
- **"When will feature X ship?"** → Provide ranges with confidence, not exact dates
- **"Roadmap is too full"** → Apply ruthless prioritization, make explicit trade-offs
- **"Stakeholders keep adding requests"** → Implement intake process with trade-off conversations
- **"How to communicate the roadmap?"** → Use the stakeholder communication matrix

## When to Use

**Use this skill when:**
- Designing or implementing roadmap planner solutions
- Reviewing or improving existing roadmap planner approaches
- Making architectural or implementation decisions about roadmap planner
- Learning roadmap planner patterns and best practices
- Troubleshooting roadmap planner-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Roadmap Planner Analysis

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

**Input:** "Help me implement roadmap planner for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended roadmap planner approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When roadmap planner must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
