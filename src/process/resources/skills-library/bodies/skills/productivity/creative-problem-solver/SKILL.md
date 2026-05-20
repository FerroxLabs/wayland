---
name: creative-problem-solver
description: |
  Structured creativity methodologies including TRIZ (Theory of Inventive Problem Solving), lateral thinking (Edward de Bono), design thinking (5 stages), brainstorming techniques (SCAMPER, reverse brainstorming, worst possible idea), constraint-based creativity, and analogical thinking for innovation. Use when the user asks about creative problem solver or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "decision-making strategy frameworks"
  category: "productivity"
  subcategory: "methodology-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Creative Problem Solver

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to creative problem solver.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on creative problem solver
- User asks about creative problem solver best practices or techniques
- User wants a structured approach to creative problem solver

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of creative problem solver

## Questions to Ask First

Before applying creative problem-solving methods, clarify:

1. **What is the problem you are trying to solve?** (State it precisely, then restate it 3 different ways)
2. **What solutions have already been tried?** (What worked partially, what failed completely)
3. **What are the actual constraints?** (Budget, time, regulations, physics vs. assumed constraints)
4. **Who is this solution for?** (The end user, customer, team, yourself)
5. **What does success look like?** (Measurable criteria for a good solution)
6. **Are you looking for incremental improvement or breakthrough innovation?** (10% better vs. 10x different)
7. **What resources and skills are available?** (People, technology, budget, expertise)
8. **What is the timeline?** (Hours, weeks, months)

## TRIZ Methodology (Theory of Inventive Problem Solving)

### TRIZ Foundation

```
TRIZ was developed by Genrich Altshuller after analyzing over
200,000 patents. His discovery: inventive solutions follow
patterns, and these patterns can be learned and applied.

CORE INSIGHT:
  Most problems have already been solved in another domain.
  TRIZ provides systematic methods to find and apply those
  solutions to your problem.

THE THREE LEVELS OF TRIZ APPLICATION:
  Level 1: 40 Inventive Principles (most accessible)
  Level 2: Contradiction Matrix (structured application)
  Level 3: ARIZ Algorithm (advanced, systematic)
```

### The 40 Inventive Principles (Key Selection)

```
PRINCIPLE 1: SEGMENTATION
  Divide an object or system into independent parts.
  Example: Modular furniture, microservices architecture,
  sectioned pill organizers.
  Apply when: A monolithic solution is too rigid.

PRINCIPLE 2: TAKING OUT / EXTRACTION
  Remove the problematic part or the only necessary part.
  Example: Remote work (extract the employee from the office).
  Apply when: Something is beneficial but its location isn't.

PRINCIPLE 5: MERGING / CONSOLIDATION
  Combine identical or related objects or operations.
  Example: Swiss Army knife, all-in-one printer, unified platforms.
  Apply when: Multiple separate tools could be one.

PRINCIPLE 10: PRELIMINARY ACTION
  Perform the action in advance (fully or partially).
  Example: Pre-cut vegetables, pre-configured templates, pre-built
  development environments.
  Apply when: Preparation time is the bottleneck.

PRINCIPLE 13: INVERSION / THE OTHER WAY ROUND
  Do the opposite of what's conventionally done.
  Example: Instead of the customer going to the store, the store
  goes to the customer (delivery). Instead of pushing content,
  let users pull it.
  Apply when: The conventional approach has fundamental limitations.

PRINCIPLE 15: DYNAMIZATION
  Make a rigid system flexible or adaptable.
  Example: Adjustable-height desks, dynamic pricing, adaptive learning.
  Apply when: One-size-fits-all doesn't fit all.

PRINCIPLE 25: SELF-SERVICE
  Make the object or system serve itself or maintain itself.
  Example: Self-cleaning ovens, self-checkout, wikis.
  Apply when: Maintenance or operation is a bottleneck.

PRINCIPLE 35: PARAMETER CHANGE
  Change the physical state, concentration, flexibility, temperature,
  or other parameters of an object.
  Example: Freeze-dried food (change state for preservation).
  Apply when: Changing a fundamental parameter might bypass a limitation.
```

### TRIZ Contradiction Resolution

```
TRIZ identifies two types of contradictions:

TECHNICAL CONTRADICTION:
  Improving one parameter worsens another.
  "Making the product stronger makes it heavier."
  "Making the software more feature-rich makes it slower."

PHYSICAL CONTRADICTION:
  A parameter must be in two opposite states simultaneously.
  "The packaging must be strong (for shipping) AND weak (for opening)."
  "The meeting must be long (for thorough discussion) AND short
   (to respect everyone's time)."

RESOLVING PHYSICAL CONTRADICTIONS:

  Separation in TIME:
    The product is strong during shipping, weak at opening
    (perforated packaging, pull tabs)

  Separation in SPACE:
    Strong on the outside, weak along the opening line
    (reinforced exterior, scored opening)

  Separation by CONDITION:
    Strong at one temperature, weak at another
    (heat-activated adhesive release)

  Separation by SCALE:
    Strong at macro level, flexible at micro level
    (chain mail: rigid overall, flexible link by link)
```

## Edward de Bono's Lateral Thinking

### Parallel Thinking (Multi-Perspective Analysis)

Edward de Bono developed a structured approach to parallel thinking that uses distinct thinking modes to explore a problem from all angles. His Six Thinking Hats framework assigns different cognitive roles -- such as factual analysis, emotional response, risk assessment, optimistic evaluation, creative generation, and process management -- to ensure a group examines every dimension of a problem before converging on solutions. For the complete framework, see de Bono's *Six Thinking Hats*.

**The core principle:** Instead of everyone thinking differently at the same time (which leads to arguments), everyone thinks in the same mode at the same time, then switches together. This prevents the common problem of one person generating ideas while another simultaneously critiques them.

**Practical application:**
- Dedicate 5-10 minutes to each thinking mode
- Separate fact-gathering from emotional reaction from creative ideation from risk analysis
- Have one mode dedicated to managing the process itself
- Cycle through all modes before making a decision

This structured approach produces more thorough analysis and more creative solutions than unstructured group discussion.

### Lateral Thinking Techniques

```
RANDOM ENTRY:
  Pick a random word from a dictionary. Force connections between
  that word and your problem.

  Problem: "How to reduce customer churn"
  Random word: "Lighthouse"
  Connections: Warning system (early churn signals), guiding beacon
  (onboarding), standing firm in storms (crisis support), visible
  from far away (brand visibility), rotating light (regular check-ins)

  Often produces: At least 1-2 genuinely novel ideas from forced
  connections that wouldn't arise from conventional thinking.

PROVOCATION (Po):
  Make a deliberately absurd statement, then extract useful ideas.

  "Po: We should PAY customers to leave."
  Extraction: What if we offered a "leaving bonus" to unhappy
  customers, guaranteeing that only genuinely satisfied customers
  stay? (Zappos actually offers new hires money to quit.)

  "Po: The product should have NO features."
  Extraction: What if we stripped to the absolute minimum? What is
  the one feature that matters most?

CHALLENGE:
  Question why something is done the current way.
  "Why do meetings have to be synchronous?"
  "Why does a resume have to be a document?"
  "Why does education take 4 years?"
  "Why do restaurants have menus?"

  The answer "because that's how it's always been done" is the
  starting point for innovation, not the end of the conversation.
```

## Design Thinking (5 Stages)

```
STAGE 1: EMPATHIZE
  Deeply understand the people you're designing for.

  METHODS:
  - Contextual observation (watch people in their natural environment)
  - Empathy interviews (open-ended: "Tell me about the last time...")
  - Journey mapping (map the entire experience step by step)
  - "Day in the life" shadowing
  - Extreme user research (people who use the most/least)

  KEY: Set aside your assumptions. You are not the user.

STAGE 2: DEFINE
  Synthesize observations into a clear problem statement.

  FORMAT: Point of View (POV) statement
  "[User] needs [need] because [insight]"

  Example: "Busy parents need a way to prepare nutritious meals in
  under 15 minutes because they value health but have no time after
  work and before activities."

  GOOD PROBLEM STATEMENTS:
  - Focus on the user's need, not a specific solution
  - Are specific enough to be actionable
  - Are broad enough to allow creative solutions

STAGE 3: IDEATE
  Generate a wide range of possible solutions.

  RULES:
  - Defer judgment (no evaluation during ideation)
  - Encourage wild ideas (they spark practical ones)
  - Build on others' ideas ("Yes, and..." not "Yes, but...")
  - Go for quantity (100 ideas in 30 minutes is achievable)
  - Be visual (sketch, don't just write)
  - One conversation at a time
  - Stay focused on the problem statement

STAGE 4: PROTOTYPE
  Build quick, cheap representations of solutions to learn from.

  PROTOTYPE PRINCIPLES:
  - Speed over quality (hours, not weeks)
  - Low fidelity is fine (paper, cardboard, sketches, role-play)
  - Build to think, not to prove
  - Multiple prototypes test multiple ideas simultaneously
  - Build with a question in mind: "What are we testing?"

  PROTOTYPE TYPES:
  - Paper prototypes (UI/UX)
  - Storyboards (service/experience)
  - Role-play (interactions/services)
  - Physical mockups (products)
  - Wizard of Oz (fake the backend, test the frontend)

STAGE 5: TEST
  Get feedback on prototypes from real users.

  TEST PRINCIPLES:
  - Test with real users, not colleagues
  - Observe behavior, don't just ask opinions
  - Ask "why" when you see something unexpected
  - Separate the idea from your ego
  - Be prepared to go back to any previous stage
  - What surprised you? That's where the learning is

  KEY QUESTIONS:
  "What worked?"
  "What didn't?"
  "What questions does this raise?"
  "What would you change?"
```

## Brainstorming Techniques

### SCAMPER

```
A checklist for systematic idea generation:

S - SUBSTITUTE: What can be substituted?
    Substitute materials, people, processes, places, approaches
    "What if we used AI instead of humans for this step?"
    "What if we used video instead of text?"

C - COMBINE: What can be combined?
    Merge functions, features, products, ideas
    "What if we combined onboarding with the first purchase?"
    "What if the packaging WAS the product?"

A - ADAPT: What can be adapted from elsewhere?
    Borrow from other industries, nature, history
    "How does nature solve this?" (biomimicry)
    "What does the hospitality industry do that we could borrow?"

M - MODIFY / MAGNIFY / MINIMIZE: What can be changed?
    Make it bigger, smaller, faster, slower, more frequent
    "What if it was 10x larger? 10x smaller?"
    "What if it happened daily instead of annually?"

P - PUT TO OTHER USES: What else could this be used for?
    Repurpose existing solutions for new problems
    "What else could our customer data be useful for?"
    "What if this tool was used by a completely different audience?"

E - ELIMINATE: What can be removed?
    Strip away features, steps, components, rules
    "What if we removed the sign-up process entirely?"
    "What is the minimum viable version?"

R - REARRANGE / REVERSE: What if the order changed?
    Reverse sequences, flip perspectives, reorganize
    "What if the customer paid BEFORE seeing the product?"
    "What if the last step came first?"
```

### Reverse Brainstorming

```
Instead of "How do we solve this?", ask "How do we make this WORSE?"

PROCESS:
  1. State the problem clearly
  2. Reverse it: "How could we cause this problem?"
     or "How could we make this as bad as possible?"
  3. Generate ideas enthusiastically (this is fun and freeing)
  4. Reverse each "bad" idea into a good solution

EXAMPLE:
  Problem: "How do we reduce customer churn?"

  Reversed: "How do we MAXIMIZE customer churn?"
  - Make the product confusing and hard to use
  - Never respond to support tickets
  - Change pricing randomly without notice
  - Hide the cancel button (so they feel trapped and resentful)
  - Never onboard new users
  - Remove features people rely on without warning

  Reversed back to solutions:
  - Simplify the UI ruthlessly
  - Guarantee support response within 2 hours
  - Transparent, predictable pricing with advance notice of changes
  - Make cancellation easy (reduces resentment, increases willingness to return)
  - Build a structured onboarding program
  - Communicate before removing any feature and provide alternatives

  WHY IT WORKS: It's psychologically easier to think of ways to
  fail than to succeed. The reversal often reveals non-obvious solutions.
```

### Worst Possible Idea

```
PROCESS:
  1. Deliberately generate the worst, most ridiculous solutions
  2. For each terrible idea, ask: "What makes this terrible?"
  3. Invert those qualities into design principles
  4. Generate ideas that embody those principles

EXAMPLE:
  Challenge: Design a better commute experience

  Worst ideas:
  - Make everyone walk backwards to work
  - Commute should take 8 hours
  - Everyone commutes at 3 AM
  - The commute should be blindfolded

  What makes them terrible -> Inverted principle:
  - Backwards/inefficient -> Optimize the direction/route dynamically
  - 8 hours -> Minimize time; make any time used productive
  - 3 AM -> Optimize timing for the individual, not the system
  - Blindfolded -> Make the journey visually engaging or productive
```

## Constraint-Based Creativity

```
COUNTERINTUITIVE PRINCIPLE:
  Constraints enhance creativity rather than limiting it.
  "Write a story" is paralyzing.
  "Write a story in exactly 6 words" produces masterpieces.

USEFUL CONSTRAINTS TO IMPOSE:

TIME BOX:
  "We have 10 minutes to generate 20 ideas."
  Urgency prevents overthinking and self-censoring.

RESOURCE LIMIT:
  "Solve this with zero budget."
  Forces innovation instead of throwing money at problems.

FORMAT CONSTRAINT:
  "Explain it in one drawing."
  Forces simplification and visual thinking.

ELIMINATION CONSTRAINT:
  "Solve it without [your main tool/approach]."
  Forces alternative thinking.

EXTREME CONSTRAINT:
  "What if we had to do this in 1/10 the time?"
  "What if we could only use 1 feature?"
  Reveals what's truly essential vs. habitual.

CUSTOMER CONSTRAINT:
  "Design this for a 5-year-old."
  "Design this for someone who's never seen a computer."
  Forces simplicity and accessibility.
```

## Analogical Thinking

```
FINDING SOLUTIONS IN OTHER DOMAINS:

THE PROCESS:
  1. Abstract your problem to its essential structure
     Not: "Our app has too many features"
     Abstracted: "How do you simplify a complex tool without
     losing capability?"

  2. Identify domains that have solved this abstract problem
     - Swiss Army knives (many tools, one interface)
     - Professional kitchens (complex equipment, standardized stations)
     - Cockpits (hundreds of controls, critical ones prominent)
     - Musical instruments (complex capability, years of practice)

  3. Study the specific solutions
     Swiss Army knife: Fold away unused tools
     Cockpit: Most-used controls front and center; others accessible
     but not visible
     Musical instrument: Progressive mastery; simple at first,
     complex capabilities revealed with skill

  4. Translate the solution
     "Progressive disclosure: Start simple, reveal complexity
     as the user's skill grows. Hide advanced features behind
     a deliberate action, not behind complexity."

DOMAINS RICH IN ANALOGIES:
  - Nature/biology (billions of years of R&D)
  - Military strategy (resource allocation under uncertainty)
  - Sports (teamwork, performance optimization, competition)
  - Architecture (structure, flow, experience design)
  - Music (composition, harmony, rhythm, improvisation)
  - Cooking (combining ingredients, timing, presentation)
```

## Practice Exercises

### Exercise 1: SCAMPER Sprint
Take any product you use daily. Apply all 7 SCAMPER prompts. Generate at least 2 ideas per prompt (14+ ideas in 15 minutes).

### Exercise 2: Random Entry
Open a dictionary to a random page. Pick the first noun. Set a timer for 10 minutes. Force at least 8 connections between that word and a current problem you're working on.

### Exercise 3: Constraint Challenge
Take a current project and impose one extreme constraint (zero budget, 1 day instead of 1 month, must fit on a single page). See what solutions emerge.

### Exercise 4: Cross-Domain Analogy
Abstract a current problem. Find 3 domains that have solved a similar abstract problem. Study their solutions and translate at least one back to your domain.

### Exercise 5: Six Hats Session
Gather 2-4 people. Spend 5 minutes in each hat (30 minutes total) on a real problem. Notice how the structured approach produces different results than free-form discussion.

### Exercise 6: Reverse Brainstorm
Take your biggest current challenge. Spend 10 minutes generating the worst possible ideas. Then invert each one. Identify the 2-3 most promising inverted solutions.

### Exercise 7: Provocation Exercise
Write 5 deliberately absurd "Po" statements about your industry. For each, extract at least one genuinely useful idea. The more absurd the provocation, the more innovative the extraction.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Creative Problem Solver deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with creative problem solver for a mid-size project."

**Output:** A complete creative problem solver framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
