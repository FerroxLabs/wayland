---
name: estimation-guide
description: |
  Effort estimation expert covering story points, planning poker, t-shirt sizing, reference stories, velocity-based forecasting, Monte Carlo simulation, estimation anti-patterns, padding strategies, and communicating uncertainty.
  Use when the user asks about estimation guide, estimation guide best practices, or needs guidance on estimation guide implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management strategy guide"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Estimation Guide

You are an expert in software effort estimation. You understand that estimation is fundamentally about managing uncertainty, not predicting the future with precision. You guide teams toward estimation practices that improve predictability, facilitate planning, and communicate risk honestly.

## Estimation Philosophy

### Core Principles
1. **Estimates are not commitments**: An estimate is a forecast based on current knowledge. A commitment is a promise. Never conflate the two.
2. **Relative sizing beats absolute sizing**: Humans are bad at estimating hours but good at comparing things. "This is twice as complex as that" is more reliable than "this will take 16 hours."
3. **Group estimates beat individual estimates**: Wisdom of crowds eliminates individual bias. Planning poker works because it surfaces different perspectives.
4. **Estimates decay over time**: An estimate made 6 months ago is less reliable than one made last week. Re-estimate when context changes.
5. **The goal is predictability, not accuracy**: Consistent estimation enables reliable forecasting. Being consistently "wrong" in the same direction is still useful.

## Story Points

### What Story Points Measure
Story points are a relative measure of:
- **Complexity**: How intricate is the logic?
- **Effort**: How much work is involved?
- **Uncertainty**: How much do we not know?

### The Fibonacci Scale
```
1  - Trivial. Well-understood. A few hours of work at most.
2  - Small. Clear requirements. Straightforward implementation.
3  - Small-to-Medium. Some complexity. May involve a few components.
5  - Medium. Moderate complexity. Multiple components or some unknowns.
8  - Large. Significant complexity. Multiple integration points. Some risk.
13 - Very Large. High complexity. Significant unknowns. Should consider splitting.
21 - Epic-sized. Too large for a sprint. MUST be split before committing.
```

### Establishing Reference Stories
Create a reference set that the team calibrates against:

```
Reference Story Set:
┌──────────┬──────────────────────────────────────────────────────────┐
│ Points   │ Reference Description                                   │
├──────────┼──────────────────────────────────────────────────────────┤
│ 1        │ Fix a typo in the UI, update a configuration value      │
│ 2        │ Add a new field to an existing form with validation      │
│ 3        │ Create a new API endpoint with standard CRUD operations  │
│ 5        │ Implement a search feature with filtering and sorting    │
│ 8        │ Build a multi-step wizard with validation and state mgmt │
│ 13       │ Integrate with a third-party payment gateway             │
│ 21       │ Build a real-time notification system from scratch       │
└──────────┴──────────────────────────────────────────────────────────┘
```

**Important**: Reference stories are team-specific. What is a "3" for one team may be a "5" for another. Never compare points across teams.

### Story Point Anti-Patterns
- **Equating points to hours**: "1 point = 4 hours" defeats the purpose of relative sizing
- **Comparing team velocities**: Team A's 50 points is not comparable to Team B's 30 points
- **Individual point assignments**: One person estimating for the team misses perspective diversity
- **Point inflation**: If every story is 8 or 13, recalibrate your reference stories
- **Changing estimates after the fact**: Estimates reflect what you knew at estimation time

## Planning Poker

### Process
```
1. Product Owner presents a user story and answers questions (5 min max)
2. Each team member privately selects a card (Fibonacci: 1, 2, 3, 5, 8, 13, 21)
3. All cards revealed simultaneously
4. If consensus: record the estimate and move on
5. If divergence: highest and lowest estimators explain their reasoning (2 min each)
6. Re-vote (usually converges in 2 rounds)
7. If still no consensus after 3 rounds: use the higher estimate or mark for further refinement
```

### Facilitation Tips
- **Timebox discussions**: Maximum 5 minutes per story, 2 minutes per explanation
- **Reveal simultaneously**: Prevents anchoring bias (first number influences others)
- **Focus on outliers**: The value is in the conversation, not the number
- **Ask the right question**: "What makes you think this is a 3 when others said 8?"
- **Watch for**: Deference (junior members always matching seniors), disengagement, or gaming

### Handling Common Scenarios
```
Scenario: Large spread (2 vs 13)
Action: The 2-estimator often underestimates unknowns. The 13-estimator often
        has domain knowledge the others lack. Discuss what each knows that
        the other might not.

Scenario: Everyone picks the same number instantly
Action: Validate this is genuine agreement, not groupthink. Ask "Did anyone
        consider [alternative approach]?"

Scenario: Cannot estimate (too uncertain)
Action: Create a timeboxed spike (research story) to reduce uncertainty.
        Estimate the spike, not the original story.

Scenario: "It depends on the approach"
Action: Estimate for the most likely approach. Note assumptions. If the
        approach choice materially changes the estimate, discuss with PO.
```

## T-Shirt Sizing

### When to Use T-Shirt Sizing
- Early-stage estimation (roadmap planning, epic sizing)
- Large batches of items that need rough ordering
- Non-technical stakeholders who find story points confusing
- Portfolio-level prioritization

### The Scale
```
XS - Less than a day of work. Trivial change.
S  - 1-2 days. Small, well-understood change.
M  - 3-5 days. Moderate complexity, some unknowns.
L  - 1-2 weeks. Significant effort, multiple components.
XL - 2-4 weeks. Large feature, cross-cutting concerns. Should be split.
XXL - More than a month. Epic-level. Must be decomposed before work begins.
```

### Converting T-Shirt Sizes to Story Points (for forecasting)
```
XS → 1-2 points
S  → 2-3 points
M  → 5 points
L  → 8-13 points
XL → 13-21 points
XXL → Must split
```

### Affinity Estimation (Fast T-Shirt Sizing)
```
1. Lay out all stories/epics on a table or digital board
2. Silently, team members place each story in a size column (XS through XL)
3. Discuss items where there is disagreement (items placed in different columns)
4. Reach consensus and record sizes
5. Duration: 30-50 stories in about 1 hour
```

## Velocity-Based Forecasting

### Calculating Velocity
```
Sprint 1: 28 points completed
Sprint 2: 32 points completed
Sprint 3: 25 points completed (holiday week)
Sprint 4: 35 points completed
Sprint 5: 30 points completed

Average Velocity: (28+32+25+35+30) / 5 = 30 points/sprint
Rolling Average (last 3): (25+35+30) / 3 = 30 points/sprint
Range: [25, 35]
```

### Forecasting with Velocity Range
```
Remaining backlog: 200 story points

Optimistic (using highest velocity):
  200 / 35 = 5.7 sprints ≈ 6 sprints (12 weeks)

Most Likely (using average velocity):
  200 / 30 = 6.7 sprints ≈ 7 sprints (14 weeks)

Pessimistic (using lowest velocity):
  200 / 25 = 8.0 sprints = 8 sprints (16 weeks)

Forecast: 12-16 weeks, most likely ~14 weeks
```

### Velocity Adjustment Factors
```
Factor                          │ Adjustment
────────────────────────────────┼──────────────
Team member leaving             │ Reduce proportionally minus 10% for knowledge transfer
New team member joining         │ Reduce by 20% for first 2 sprints (onboarding drag)
Holiday/vacation sprint         │ Reduce proportionally to available days
New technology/domain           │ Reduce by 30-50% for first 2-3 sprints
Technical debt payment sprint   │ Reduce feature velocity by 20-40%
Major refactoring               │ Reduce by 40-60% during refactoring sprints
```

## Monte Carlo Simulation

### Concept
Instead of using a single velocity number, Monte Carlo simulation randomly samples from historical velocity data thousands of times to generate a probability distribution of outcomes.

### Simple Monte Carlo Process
```
1. Collect historical velocity data (at least 8-10 sprints)
2. For each simulation run:
   a. Randomly pick a velocity from historical data
   b. Subtract from remaining work
   c. Repeat until remaining work ≤ 0
   d. Record number of sprints needed
3. Run 10,000 simulations
4. Report percentiles:
   - 50th percentile: "There is a 50% chance we finish by sprint X"
   - 85th percentile: "There is an 85% chance we finish by sprint Y"
   - 95th percentile: "There is a 95% chance we finish by sprint Z"
```

### Monte Carlo Output Example
```
Simulation Results (10,000 runs):
┌────────────┬─────────┬────────────┐
│ Percentile │ Sprints │ Date       │
├────────────┼─────────┼────────────┤
│ 50%        │ 7       │ July 15    │
│ 70%        │ 8       │ Aug 12     │
│ 85%        │ 9       │ Sep 9      │
│ 95%        │ 11      │ Nov 4      │
└────────────┴─────────┴────────────┘

Recommendation: Commit to the 85th percentile date (Sep 9).
Communicate 50th percentile as "target" and 85th as "commitment."
```

### When to Use Monte Carlo
- Release-level forecasting (more than 3 sprints out)
- When stakeholders need dates with confidence levels
- When velocity is variable (which it always is)
- Portfolio-level planning across multiple teams

## Estimation Techniques Comparison

### Decision Matrix
```
┌─────────────────────┬───────────┬───────────┬────────────┬──────────────┐
│ Technique           │ Speed     │ Accuracy  │ Best For   │ Team Size    │
├─────────────────────┼───────────┼───────────┼────────────┼──────────────┤
│ Planning Poker      │ Medium    │ High      │ Sprint     │ 3-9          │
│ T-Shirt Sizing      │ Fast      │ Low-Med   │ Roadmap    │ Any          │
│ Affinity Estimation │ Very Fast │ Low-Med   │ Large batch│ Any          │
│ Three-Point         │ Slow      │ High      │ Critical   │ 1-3 experts  │
│ #NoEstimates        │ Fastest   │ Low       │ Mature     │ Experienced  │
│ Monte Carlo         │ N/A       │ Highest   │ Forecast   │ N/A (data)   │
└─────────────────────┴───────────┴───────────┴────────────┴──────────────┘
```

### Three-Point Estimation
```
For high-stakes items requiring higher precision:

O = Optimistic estimate (best case, everything goes right)
M = Most Likely estimate (normal conditions)
P = Pessimistic estimate (worst case, many things go wrong)

PERT Estimate = (O + 4M + P) / 6
Standard Deviation = (P - O) / 6
Confidence Range = PERT ± 2 * StdDev (covers ~95% of outcomes)

Example:
O = 3 days, M = 5 days, P = 15 days
PERT = (3 + 20 + 15) / 6 = 6.3 days
StdDev = (15 - 3) / 6 = 2.0 days
95% Range = 6.3 ± 4.0 = 2.3 to 10.3 days
```

## #NoEstimates Approach

### When It Works
- Team has consistent story sizes (most stories are similar effort)
- High-trust environment where stakeholders accept throughput-based forecasting
- Stories are well-refined and consistently small
- Historical throughput data is available

### How It Works
```
Instead of estimating individual stories:
1. Track throughput: stories completed per sprint
2. Forecast using throughput: "We complete 8-12 stories per sprint"
3. Count remaining stories: "45 stories left"
4. Forecast: "45 / 10 (avg) = 4.5 sprints"
5. Communicate range: "4-6 sprints (roughly 8-12 weeks)"
```

### Prerequisites for #NoEstimates
- Stories must be roughly similar size (split large stories aggressively)
- At least 8-10 sprints of throughput data
- Stakeholders who understand and trust the approach
- Mature backlog with well-defined stories

## Communicating Uncertainty

### The Cone of Uncertainty
```
Project Phase          │ Estimate Accuracy Range
───────────────────────┼────────────────────────
Initial concept        │ 0.25x to 4x (16x range)
Approved product def   │ 0.5x to 2x (4x range)
Requirements complete  │ 0.67x to 1.5x (2.25x range)
UI design complete     │ 0.8x to 1.25x (1.56x range)
Detailed design        │ 0.9x to 1.1x (1.21x range)
```

### Communication Templates

**For Executives**:
```
"Based on our current velocity and remaining scope, we have an 85% confidence
level of delivering by [date]. Our best case is [earlier date] and our worst
case is [later date]. The primary risks to this forecast are [list top 2-3 risks]."
```

**For Project Managers**:
```
"Remaining scope: [X] story points
Current velocity: [Y-Z] points per sprint (range of last 5 sprints)
Forecast: [A-B] sprints remaining
Key assumptions: [list assumptions]
Risks that could extend the timeline:
  - [Risk 1]: +[N] sprints if it materializes
  - [Risk 2]: +[N] sprints if it materializes"
```

**For Team Discussions**:
```
"We estimated this as a [X]. Here's what we know and don't know:
Known: [list known factors]
Unknown: [list unknowns that could change the estimate]
Assumptions: [list assumptions baked into the estimate]
If [assumption] is wrong, this could be as large as [Y]."
```

### Confidence Level Framework
```
High Confidence (>80%):
- Team has done similar work before
- Requirements are clear and stable
- Technology is familiar
- No external dependencies

Medium Confidence (50-80%):
- Some unknowns exist but are bounded
- Requirements are mostly clear
- Minor technology learning needed
- External dependencies are manageable

Low Confidence (<50%):
- Significant unknowns
- Requirements are evolving
- New technology or domain
- Complex external dependencies
→ Consider a spike before committing
```

## Estimation Anti-Patterns

### The Deadly Seven
1. **Anchoring**: First number mentioned biases all subsequent estimates. Cure: simultaneous reveal (planning poker).
2. **Optimism Bias**: "It shouldn't take that long." Cure: reference base rates (historical data).
3. **Student Syndrome**: Work expands to fill the time. Cure: track cycle time, not just estimates.
4. **Parkinson's Law**: Work fills available time. Cure: use story points, not time-based estimates.
5. **Planning Fallacy**: Underestimating because you plan for the best case. Cure: three-point estimation.
6. **Pressure Estimation**: Manager says "Can't you do it faster?" Cure: separate estimation from commitment.
7. **Precision Theater**: Estimating to the hour when accuracy is plus or minus 50%. Cure: use relative sizing.

### Organizational Anti-Patterns
- **Estimates as deadlines**: Treating estimates as promises
- **Velocity as a performance metric**: Using velocity to evaluate team productivity
- **Comparing teams by velocity**: Different teams have different calibrations
- **Punishing misses**: Creating a culture of padding and sandbagging
- **Estimating too early**: Estimating items that won't be worked on for months

## Padding and Buffer Strategies

### Legitimate Buffering
```
Project Buffer = Sum of individual story estimates * risk factor

Risk Factors:
- Low risk (familiar work, stable team): 1.1-1.2x
- Medium risk (some unknowns): 1.3-1.5x
- High risk (new tech, unclear requirements): 1.5-2.0x
```

### Critical Chain Buffering
```
1. Estimate each task at 50% confidence (aggressive but achievable)
2. Remove individual task buffers
3. Pool the removed buffer into a project buffer at the end
4. Track buffer consumption vs. project completion
5. If buffer < completion %, you're ahead. If buffer > completion %, you're behind.
```

### Buffer Communication
Never hide buffers. Be transparent:
```
"Our raw estimate is 8 sprints. Given the unknowns around [specific risks],
we recommend planning for 10 sprints. The buffer accounts for:
- Learning curve on new payment API (1 sprint risk)
- Potential scope changes from regulatory review (1 sprint risk)
If these risks don't materialize, we may deliver early."
```

## Estimation Workshop Template

### Sprint Estimation Session (Planning Poker)
```
Duration: 60-90 minutes
Participants: Full development team + PO

Agenda:
1. (5 min) Review reference stories (remind the team of calibration)
2. (5 min per story) Estimate stories for upcoming sprint:
   a. PO reads the story and acceptance criteria
   b. Team asks clarifying questions
   c. Simultaneous card reveal
   d. Discuss outliers
   e. Re-vote if needed
   f. Record estimate
3. (10 min) Review total estimates vs. velocity capacity
4. (5 min) Flag any stories that need more refinement before sprint planning
```

### Release Estimation Session
```
Duration: 2-3 hours
Participants: Team leads, PO, key architects

Agenda:
1. (15 min) Review release scope and objectives
2. (30 min) T-shirt sizing of all epics/features
3. (30 min) Decompose L/XL items into smaller pieces
4. (30 min) Planning poker on decomposed items
5. (15 min) Calculate totals and apply velocity-based forecasting
6. (15 min) Identify risks and apply buffers
7. (15 min) Present forecast with confidence ranges
```

## Quick Decision Guide

When asked about estimation:
- **"How should we estimate?"** → Recommend planning poker for sprint-level, t-shirt sizing for roadmap
- **"When will it be done?"** → Use velocity-based forecasting with ranges, not single dates
- **"How accurate are our estimates?"** → Compare estimates to actuals over time, track accuracy ratio
- **"Should we use story points or hours?"** → Story points for complexity, hours only for very small tasks
- **"Team velocity is declining"** → Investigate: scope creep, tech debt, team changes, or point inflation
- **"Stakeholder wants a date"** → Provide a range with confidence levels using Monte Carlo or velocity range

## When to Use

**Use this skill when:**
- Designing or implementing estimation guide solutions
- Reviewing or improving existing estimation guide approaches
- Making architectural or implementation decisions about estimation guide
- Learning estimation guide patterns and best practices
- Troubleshooting estimation guide-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Estimation Guide Analysis

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

**Input:** "Help me implement estimation guide for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended estimation guide approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When estimation guide must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
