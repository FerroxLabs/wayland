---
name: strategic-thinker
description: |
  Strategic thinking frameworks including scenario planning, game theory basics (Nash equilibrium, prisoner's dilemma), long-term thinking, second and third-order effects analysis, strategic frameworks (Blue Ocean Strategy, Wardley Maps), decision journals, pre-mortem analysis, and competitive strategy. Use when the user asks about strategic thinker or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy decision-making analysis frameworks"
  category: "productivity"
  subcategory: "methodology-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Strategic Thinker

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to strategic thinker.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on strategic thinker
- User asks about strategic thinker best practices or techniques
- User wants a structured approach to strategic thinker

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of strategic thinker

## Questions to Ask First

Before developing any strategic analysis, clarify:

1. **What decision or situation are you thinking strategically about?** (Business strategy, career, investment, competitive response, organizational design)
2. **What is the time horizon?** (Months, years, decades)
3. **Who are the key players/actors?** (Competitors, customers, regulators, partners, team members)
4. **What are your objectives?** (Growth, sustainability, market position, personal goals)
5. **What resources are available?** (Capital, people, time, technology, relationships)
6. **What constraints are non-negotiable?** (Legal, ethical, physical, financial)
7. **What information is uncertain?** (What do you not know that matters)
8. **What is the cost of being wrong?** (Reversible vs. irreversible decisions)

## Second-Order Thinking

### Beyond the Obvious Consequences

```
FIRST-ORDER THINKING:
  "What is the immediate result of this action?"
  Everyone does this. It's table stakes.

SECOND-ORDER THINKING:
  "And then what happens?"
  This is where strategic advantage begins.

THIRD-ORDER THINKING:
  "And then what happens after that?"
  This is where compounding effects and unintended consequences live.

THE FRAMEWORK:
  Action: [What you plan to do]
    |
    +-- First-order effect: [Immediate, obvious consequence]
    |     |
    |     +-- Second-order effect: [What that consequence causes]
    |     |     |
    |     |     +-- Third-order effect: [What the second effect causes]
    |     |
    |     +-- Second-order effect: [Another consequence branch]
    |
    +-- First-order effect: [Another immediate consequence]
          |
          +-- Second-order effect: [What that causes]

EXAMPLE: "Let's offer a 50% discount to boost sales"

  1st order: Sales volume increases significantly
  2nd order: Existing customers feel cheated (paid full price)
             New customers anchor to the discounted price
             Competitors respond with their own discounts
  3rd order: Price war erodes margins industry-wide
             Brand is perceived as "discount brand"
             Customers wait for sales instead of buying at full price
             Revenue drops despite higher volume

PRACTICE: For every major decision, trace at least 3 chains
of consequences to the second or third order. If most chains
lead to negative outcomes, reconsider the decision.
```

## Game Theory Basics

### The Prisoner's Dilemma

```
THE CLASSIC SETUP:
  Two suspects are arrested. Each can cooperate (stay silent)
  or defect (betray the other). They decide simultaneously
  without communication.

                    Player B
                 Cooperate    Defect
  Player A
  Cooperate    (-1, -1)     (-3,  0)
  Defect       ( 0, -3)     (-2, -2)

  (Numbers represent years in prison; lower is better)

  If both cooperate: 1 year each (best collective outcome)
  If both defect: 2 years each (worse for both)
  If one defects while the other cooperates: defector goes free,
    cooperator gets 3 years

  RATIONAL INDIVIDUAL CHOICE: Always defect (regardless of what
  the other does, defecting gives you a better personal outcome)

  BUT: Mutual defection is worse for both than mutual cooperation.

BUSINESS APPLICATIONS:
  - Pricing: Two competitors could cooperate (maintain prices)
    or defect (cut prices). Both cutting prices hurts both.
  - Arms races: Feature wars, marketing spend escalation
  - Negotiations: Trust and reciprocity vs. exploitation
  - Team dynamics: Contributing to shared work vs. free-riding

THE ITERATED PRISONER'S DILEMMA:
  When the game is played repeatedly, cooperation becomes viable.
  The winning strategy (Tit for Tat):
  1. Start by cooperating
  2. Do whatever the other player did last round
  3. Be forgiving (return to cooperation after retaliation)
  4. Be clear (your pattern should be obvious)

  INSIGHT: In repeated interactions, reputation and trust matter.
  Reciprocity enables cooperation. This is why business
  relationships are different from one-time transactions.
```

### Nash Equilibrium

```
DEFINITION: A state where no player can improve their outcome
by changing only their own strategy, assuming others don't change.

PRACTICAL MEANING:
  A Nash Equilibrium is a "stable state" -- everyone is doing
  the best they can given what everyone else is doing.

EXAMPLE - Market Entry:
  Two companies considering entering a small market that can
  only profitably support one firm.

                    Company B
                 Enter      Don't Enter
  Company A
  Enter        (-5, -5)    (10,  0)
  Don't Enter  ( 0, 10)    ( 0,  0)

  Nash Equilibria: (Enter, Don't Enter) and (Don't Enter, Enter)
  Both are stable -- once one enters, the other is best off staying out.

  STRATEGIC QUESTION: How do you become the one who enters first?
  Speed, commitment, credible signaling ("We've already invested
  $50M in this market").

APPLICATION:
  - When analyzing competitive situations, ask: "What is the
    stable state? Where is nobody motivated to change?"
  - If the current situation is NOT an equilibrium, expect change
  - To change an equilibrium, you must change the payoff structure
    (incentives, rules, information)
```

### Strategic Signaling

```
SIGNALING: Actions that communicate information about your
intentions, capabilities, or type.

CREDIBLE SIGNALS (costly or irreversible):
  - Burning bridges: "We've closed our other options" (commitment)
  - Sunk costs: "We've already invested $X in this direction"
  - Public commitments: Hard to back down from without reputation cost
  - Structural changes: Reorganizing around a strategy

NON-CREDIBLE SIGNALS (cheap talk):
  - Announcements without action
  - Threats that would be costly to carry out
  - Promises without enforcement mechanisms

STRATEGIC APPLICATION:
  To deter competitors: Signal commitment through irreversible investment
  To attract partners: Signal capability through demonstrated results
  To negotiate: Signal alternatives through credible BATNA development
```

## Scenario Planning

### The Scenario Planning Process

```
PURPOSE: Not to predict the future, but to prepare for
multiple possible futures and build strategic flexibility.

STEP 1: IDENTIFY THE FOCAL QUESTION
  "What is the strategic decision we need to make?"
  "What does our industry look like in 10 years?"
  "How should we allocate resources for the next 5 years?"

STEP 2: IDENTIFY KEY DRIVING FORCES
  List all forces that could shape the future:
  - Technology trends
  - Regulatory changes
  - Demographic shifts
  - Economic conditions
  - Competitor actions
  - Customer behavior changes
  - Geopolitical factors

STEP 3: RANK BY IMPORTANCE AND UNCERTAINTY
  Plot each force on a 2x2:

  High Importance |  MONITOR    |  SCENARIO
                  |             |  DRIVERS
  ----------------+-------------+-----------
  Low Importance  |  IGNORE     |  MONITOR
                  |             |
                  Low Uncertainty  High Uncertainty

  The top-right quadrant (high importance + high uncertainty)
  defines your scenario axes.

STEP 4: BUILD 2-4 SCENARIOS
  Select 2 critical uncertainties as axes, creating a 2x2 matrix.
  Each quadrant is a distinct, plausible future scenario.

  Example axes:
  - Technology adoption: Fast vs. Slow
  - Regulation: Strict vs. Permissive

  This creates 4 scenarios:
  A: Fast adoption + Strict regulation (managed innovation)
  B: Fast adoption + Permissive regulation (wild west)
  C: Slow adoption + Strict regulation (status quo)
  D: Slow adoption + Permissive regulation (gradual shift)

STEP 5: DEVELOP EACH SCENARIO
  For each, create a detailed narrative:
  - What does the world look like?
  - How did we get here?
  - Who are the winners and losers?
  - What are the opportunities and threats?
  - What is our position?

STEP 6: IDENTIFY STRATEGIC IMPLICATIONS
  - What strategies work across ALL scenarios? (Robust strategies)
  - What strategies only work in ONE scenario? (Bets)
  - What early indicators would tell us which scenario is unfolding?
    (Signposts to monitor)
  - What capabilities do we need regardless? (No-regret investments)

STEP 7: MONITOR SIGNPOSTS
  Create a dashboard of early indicators for each scenario.
  Review quarterly. Adjust strategy as scenarios become clearer.
```

## Blue Ocean Strategy

```
CORE CONCEPT: Instead of competing in existing market space
(red ocean, bloody with competition), create new market space
(blue ocean) where competition is irrelevant.

THE STRATEGY CANVAS:
  Map your industry's key competitive factors on the x-axis.
  Map the level of offering on the y-axis.
  Plot your company and competitors.

  Most competitors will cluster in similar patterns.
  Innovation means creating a DIFFERENT value curve.

THE FOUR ACTIONS FRAMEWORK:

  ELIMINATE: Which factors that the industry takes for granted
  should be eliminated?
  "What are we doing that customers don't actually value?"

  REDUCE: Which factors should be reduced well below the
  industry standard?
  "Where are we over-serving relative to what customers need?"

  RAISE: Which factors should be raised well above the
  industry standard?
  "Where is the industry under-delivering on what customers
  truly value?"

  CREATE: Which factors should be created that the industry
  has never offered?
  "What would make competition irrelevant?"

EXAMPLE - CIRQUE DU SOLEIL:
  Eliminated: Star performers, animal shows, concession sales
  Reduced: Fun and humor (vs. traditional circus), thrill and danger
  Raised: Artistic merit, unique venue, theme
  Created: Elegant environment, multiple productions, refined watching experience

  Result: Created a new market between circus and theater that
  no one was competing in.
```

## Wardley Maps

```
CONCEPT: A visual representation of the value chain that
shows how components evolve over time, enabling strategic
positioning.

THE AXES:
  Y-axis (top to bottom): Value chain
    User need at top, infrastructure at bottom
    Each component serves the ones above it

  X-axis (left to right): Evolution
    Genesis -> Custom -> Product -> Commodity/Utility
    (Novel)   (Built)   (Bought)  (Standard)

BUILDING A WARDLEY MAP:
  1. Start with the USER NEED at the top
  2. Map the VALUE CHAIN: What components serve that need?
  3. Place each component on the EVOLUTION axis
  4. Draw DEPENDENCIES (what depends on what)
  5. Identify MOVEMENT (which direction are things evolving?)

STRATEGIC INSIGHTS FROM WARDLEY MAPS:
  - Components on the left (genesis/custom) need innovation,
    exploration, and talent
  - Components on the right (commodity) need efficiency,
    standardization, and scale
  - The evolution is predictable: everything moves left to right
  - OPPORTUNITY: When a component moves from custom to product,
    the market shifts dramatically
  - Build competitive advantage in evolving components;
    use commodity components from vendors

STRATEGIC PLAYS:
  - Build in the genesis/custom space (differentiation)
  - Buy in the commodity space (efficiency)
  - Watch for components about to shift phases (timing)
  - Create ecosystems around your platform (leverage)
```

## Decision Journals

```
A DECISION JOURNAL is a systematic record of important decisions
that enables learning from outcomes.

FOR EACH SIGNIFICANT DECISION, RECORD:

  DATE: _______________
  DECISION: What am I deciding?
  CONTEXT: What is the situation? What information do I have?
  OPTIONS CONSIDERED: What alternatives did I evaluate?
  REASONING: Why am I choosing this option?
  EXPECTED OUTCOME: What do I predict will happen?
  CONFIDENCE LEVEL: How sure am I? (percentage)
  KEY ASSUMPTIONS: What must be true for this to work?
  RISKS: What could go wrong?
  EMOTIONAL STATE: How am I feeling right now?
  TIMELINE: When will I know if this was right?

  --- REVIEW (at the timeline date) ---

  ACTUAL OUTCOME: What actually happened?
  ACCURACY: Was my prediction correct?
  LESSONS: What did I learn?
  PROCESS QUALITY: Was my decision process good regardless
    of outcome? (Good process can lead to bad outcomes, and
    bad process can lead to good outcomes -- evaluate both)

WHY THIS MATTERS:
  Without a decision journal, you suffer from hindsight bias
  ("I knew that would happen") and outcome bias (judging
  decisions only by results, not process quality).

  A decision journal creates an honest record of your
  thinking at the time of the decision, enabling genuine
  learning from both successes and failures.
```

## Pre-Mortem Analysis

```
CONCEPT: Before executing a plan, imagine it has already failed.
Work backwards to identify the causes.

DEVELOPED BY: Gary Klein (psychologist studying expert decision-making)

THE PROCESS:
  1. Describe the plan or strategy clearly
  2. Set the scene: "It's 12 months from now. This plan has
     failed spectacularly. Not just underperformed -- failed."
  3. Each participant independently writes: "The plan failed because..."
  4. Share all reasons without judgment
  5. Categorize and prioritize the failure modes
  6. For each major failure mode, ask:
     - How likely is this?
     - How would we detect it early?
     - What can we do to prevent it?
     - What is our contingency plan?

WHY PRE-MORTEM > POST-MORTEM:
  - Overcomes groupthink (gives permission to voice concerns)
  - Cheaper to find problems before they happen
  - People are more creative about failure than about success
  - Creates early warning indicators you can monitor
  - Psychologically safer: "I'm not criticizing your plan,
    I'm imagining a failure scenario"

EXAMPLE:
  Plan: "Launch a new product line by Q3"

  Pre-mortem failure causes:
  - Supply chain delays pushed launch to Q4 (lost seasonal window)
  - Quality issues in first batch damaged brand reputation
  - Marketing team was still finishing the existing campaign
  - The target customer segment didn't want the features we built
  - Competitor launched a similar product 2 months earlier
  - Internal politics delayed key approvals

  For each: What early warning signs should we watch for?
  What preventive actions can we take NOW?
```

## Long-Term Thinking

```
TOOLS FOR THINKING BEYOND THE IMMEDIATE:

THE 10/10/10 FRAMEWORK (Suzy Welch):
  For any decision, ask:
  - How will I feel about this in 10 minutes?
  - How will I feel about this in 10 months?
  - How will I feel about this in 10 years?

  This separates emotional reactions from lasting impact.

REGRET MINIMIZATION (Jeff Bezos):
  "Project yourself to age 80. Looking back, which decision
   minimizes your regrets?"

  Particularly useful for: Career changes, entrepreneurship,
  bold personal choices where fear of failure dominates.

REVERSIBLE vs. IRREVERSIBLE DECISIONS:
  Reversible (Type 2): Decide fast, correct later
    Most decisions are reversible. Bias toward action.
  Irreversible (Type 1): Decide carefully
    Few decisions are truly irreversible. But for those:
    gather more information, consult widely, take your time.

COMPOUNDING:
  Small advantages compound over time.
  - 1% better each day = 37x improvement in a year
  - Relationships that compound: mentors, networks, partnerships
  - Skills that compound: writing, speaking, coding, management
  - Decisions that compound: health, savings, learning

  Strategic insight: Invest in compounding assets even when
  the short-term return seems small.
```

## Practice Exercises

### Exercise 1: Second-Order Mapping
Take a decision you're considering. Map it to three orders of consequences with at least 2 branches at each level. Evaluate whether the net effect across all branches is positive.

### Exercise 2: Scenario Planning Lite
Identify the 2 biggest uncertainties in your industry or career. Create a 2x2 scenario matrix. Write a 1-paragraph description of each scenario. Identify one action that's valuable in all four.

### Exercise 3: Decision Journal Start
For the next 30 days, record every significant decision using the decision journal template. After 30 days, review your earliest entries. What patterns do you notice?

### Exercise 4: Pre-Mortem
Take your most important current project. Run a solo pre-mortem. Imagine it failed. Write 10 reasons why. Create a monitoring plan for the top 3 risks.

### Exercise 5: Blue Ocean Canvas
Map your industry's competitive factors. Draw the typical value curve. Then use the Eliminate-Reduce-Raise-Create framework to design a different value curve.

### Exercise 6: Game Theory in Practice
Identify a situation in your work where two parties have competing interests. Map the payoff matrix. Identify the Nash Equilibrium. Is there a way to change the payoffs to enable cooperation?


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Strategic Thinker deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with strategic thinker for a mid-size project."

**Output:** A complete strategic thinker framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
