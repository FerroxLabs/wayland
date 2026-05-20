---
name: educational-game-designer
description: |
  Designing games that teach effectively, covering learning objectives integration, intrinsic motivation, Bloom's taxonomy in game design, assessment through play, age-appropriate design, accessibility, classroom integration strategies, and the distinction between edutainment and serious games. Use when the user asks about educational game designer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "game-design design teaching guide"
  category: "game-development"
  subcategory: "game-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Educational Game Designer

## When to Use

**Use this skill when:**
- The user wants to design a game with specific learning objectives and measurable educational outcomes
- The user needs help integrating Bloom's taxonomy or stealth assessment into gameplay
- The user is building a game for classroom use and needs teacher tools, session design, or curriculum alignment
- The user wants to avoid the "chocolate-covered broccoli" problem and achieve intrinsic learning integration
- The user needs age-appropriate design guidance for educational content (early childhood through adult)

**Do NOT use this skill when:**
- The user is designing a game primarily for entertainment without learning objectives (use video-game-designer instead)
- The user needs help with general puzzle design outside an educational context (use game-puzzle-designer instead)
- The user is creating curriculum or lesson plans without a game component

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to educational game designer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on educational game designer
- User asks about educational game designer best practices or techniques
- User wants a structured approach to educational game designer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of educational game designer

## Questions to Ask First

Before designing any educational game, clarify:

1. **What is the learning objective?** (Specific knowledge, skill, behavior, or attitude to develop)
2. **Who is the learner?** (Age range, education level, prior knowledge, context)
3. **What is the educational context?** (Classroom, self-directed, workplace training, therapy, public education)
4. **What is the subject domain?** (Math, language, science, social skills, professional skills, health)
5. **What platform?** (Physical game, mobile app, PC, classroom activity, hybrid)
6. **How will success be measured?** (Test scores, behavior change, skill demonstration, engagement metrics)
7. **What is the play context?** (Individual, small group, whole classroom, family, self-paced)
8. **What is the budget and timeline?** (Scope determines depth)

## Learning Objectives Integration

### Writing Learning Objectives for Games

```
LEARNING OBJECTIVES DEFINE SUCCESS.
If you don't know what the player should LEARN, you can't
design a game that teaches it.

WELL-FORMED LEARNING OBJECTIVE FORMAT:
  "After playing this game, the learner will be able to
   [VERB] [SPECIFIC CONTENT/SKILL]."

EXAMPLES:
  Weak: "Players will understand fractions."
  Strong: "Players will be able to add fractions with different
           denominators and explain their reasoning."

  Weak: "Players will learn about ecosystems."
  Strong: "Players will be able to predict how removing a species
           from a food web affects other populations."

  Weak: "Players will practice communication."
  Strong: "Players will be able to identify and use three
           active listening techniques in role-play scenarios."

THE ALIGNMENT TRIANGLE:
  Learning Objective <-> Game Mechanic <-> Assessment

  All three must be aligned:
  - The MECHANIC should make the player practice the OBJECTIVE
  - The ASSESSMENT should measure what the MECHANIC teaches
  - If any pair is misaligned, the game teaches the wrong thing
    or doesn't effectively assess what it teaches

EXAMPLE OF ALIGNMENT:
  Objective: "Add fractions with different denominators"
  Mechanic: Players combine ingredient cards (1/3 + 1/4) to
  fill recipe requirements, physically manipulating visual
  fraction representations
  Assessment: Track accuracy of combinations over time; the
  game itself measures whether the player gets it right
```

### Bloom's Taxonomy in Game Design

```
BLOOM'S TAXONOMY (revised) maps cognitive complexity:

LEVEL 1: REMEMBER (Recall facts and basic concepts)
  Game application: Flashcard games, trivia, matching
  Example: Vocabulary matching game where players pair words
  with definitions
  Mechanics: Memory, pattern matching, timed recall

LEVEL 2: UNDERSTAND (Explain ideas or concepts)
  Game application: Sorting, categorizing, explaining to others
  Example: Players sort animals into correct habitat zones and
  explain why each animal belongs there
  Mechanics: Classification, sequencing, teaching others

LEVEL 3: APPLY (Use information in new situations)
  Game application: Problem-solving with learned skills
  Example: Math game where players use geometry to navigate
  a character through obstacles (not just solving equations)
  Mechanics: Puzzle-solving, simulation, practical application

LEVEL 4: ANALYZE (Draw connections among ideas)
  Game application: Investigation, comparison, deconstruction
  Example: History game where players analyze primary sources
  to determine which account of an event is most reliable
  Mechanics: Detective/investigation, comparison, debate

LEVEL 5: EVALUATE (Justify a decision or position)
  Game application: Moral dilemmas, debate, judging quality
  Example: Environmental game where players must prioritize
  conservation efforts with limited budget and justify choices
  Mechanics: Resource allocation with defense, peer evaluation

LEVEL 6: CREATE (Produce new or original work)
  Game application: Building, designing, creating within the game
  Example: Players design a sustainable city incorporating
  environmental science principles
  Mechanics: Sandbox building, design challenges, creative projects

DESIGN PRINCIPLE:
  Most educational games target Levels 1-2 (Remember, Understand).
  The best educational games target Levels 3-6 (Apply and above).
  Higher Bloom's levels = deeper learning = better game design.
```

## Intrinsic Motivation

### Why Intrinsic Motivation Matters

```
EXTRINSIC MOTIVATION: "I do this to get a reward or avoid punishment."
  - Points, grades, stars, unlockables
  - Works short-term but doesn't create lasting learning behaviors
  - Can actually DECREASE intrinsic motivation (the overjustification effect)

INTRINSIC MOTIVATION: "I do this because it's interesting and satisfying."
  - Curiosity, mastery, autonomy, relatedness
  - Creates lasting learning behaviors and deeper understanding
  - Self-sustaining: the activity IS the reward

SELF-DETERMINATION THEORY (Deci & Ryan):
  Three needs that drive intrinsic motivation:

  AUTONOMY: "I have meaningful choices."
    In games: Multiple paths, player-directed exploration,
    choices with consequences, customization
    BAD: Forced linear progression with no agency
    GOOD: "Choose which topic to explore next" with meaningful
    differences between paths

  COMPETENCE: "I'm getting better at this."
    In games: Clear progress, appropriate challenge,
    visible skill growth, mastery experiences
    BAD: Tasks that are trivially easy or impossibly hard
    GOOD: Difficulty that scales with demonstrated ability,
    clear feedback on improvement

  RELATEDNESS: "I'm connected to others."
    In games: Collaboration, social play, shared goals,
    community, belonging
    BAD: Isolated drill-and-practice with no social element
    GOOD: Team challenges where each player's contribution
    matters, sharing progress with peers
```

### Flow State in Educational Games

```
FLOW = The state of optimal engagement where challenge matches skill.

    High  |
          |  ANXIETY
Challenge |  (too hard)        FLOW
          |                    CHANNEL
          |  APATHY           (sweet spot)
          |  (too easy
          |   AND boring)     BOREDOM
    Low   |                   (too easy)
          |________________________
          Low                   High
                  Skill

FOR EDUCATIONAL GAMES:
  1. ASSESS the player's current skill level (diagnostic)
  2. PRESENT challenges slightly above that level (scaffolding)
  3. ADJUST based on performance (adaptive difficulty)
  4. PROVIDE immediate, clear feedback (know-how-you-did)
  5. CELEBRATE mastery before increasing difficulty (competence)

ADAPTIVE DIFFICULTY IN EDUCATIONAL GAMES:
  Track accuracy over last N attempts:
  - >90% correct: Increase difficulty (add complexity, remove scaffolding)
  - 60-90% correct: Maintain difficulty (in the flow channel)
  - <60% correct: Decrease difficulty (add scaffolding, simplify)

  The player should succeed about 70-80% of the time.
  This ratio creates optimal learning AND flow.
```

## Assessment Through Play

### Stealth Assessment

```
THE IDEAL: Players don't know they're being assessed.
The game IS the assessment. This is "stealth assessment."

PRINCIPLES:
  1. Every player action is data
  2. Assessment is embedded in gameplay, not added on
  3. No "test mode" that breaks immersion
  4. Performance over time is more informative than a single test
  5. Process (how they solve) is as valuable as outcome (did they solve)

WHAT TO MEASURE:
  - Accuracy: Correct answers/actions vs. incorrect
  - Speed: Time to complete tasks (fluency indicator)
  - Strategy: Which approaches the player uses
  - Persistence: How they respond to failure
  - Transfer: Can they apply learning to new situations?
  - Progression: How performance changes over time

DATA COLLECTION:
  Log every relevant player action:
  - Problem presented
  - Player response
  - Time taken
  - Hints used (if any)
  - Correct/incorrect
  - Context (difficulty level, topic, attempt number)

EVIDENCE-CENTERED DESIGN (ECD):
  A framework for designing games-as-assessments:
  1. COMPETENCY MODEL: What knowledge/skills are you measuring?
  2. EVIDENCE MODEL: What observable actions indicate competency?
  3. TASK MODEL: What game tasks produce those observable actions?

  Example:
  Competency: Understanding of supply and demand
  Evidence: Player adjusts prices in response to market changes
  and profit increases over time
  Task: Run a lemonade stand game where demand fluctuates
  with weather, competition, and pricing

REPORTING TO EDUCATORS:
  - Dashboard showing student progress (not just scores)
  - Identify struggling areas (which specific skills need attention)
  - Show time-on-task and engagement patterns
  - Provide actionable insights, not just data
  - Respect student privacy (COPPA, FERPA compliance)
```

## Age-Appropriate Design

```
AGES 4-7 (EARLY CHILDHOOD):
  Cognitive: Pre-operational stage, concrete thinking
  Motor: Developing fine motor, large touch targets needed
  Attention: 5-10 minute sessions maximum
  Literacy: Limited reading; use audio, icons, and visuals
  Content: Colors, shapes, counting, letters, basic patterns
  Mechanics: Simple cause-and-effect, matching, sorting
  Feedback: Immediate, positive, celebratory
  Safety: No social features, no external links, no text input
  Regulation: COPPA (Children's Online Privacy Protection Act)

AGES 8-12 (MIDDLE CHILDHOOD):
  Cognitive: Concrete operational, beginning abstract thinking
  Motor: Good fine motor control, can use standard controls
  Attention: 15-30 minute sessions
  Literacy: Growing; text is acceptable with appropriate level
  Content: Math operations, reading comprehension, science concepts,
  history, beginning programming
  Mechanics: Strategy, problem-solving, narrative, collection
  Feedback: Specific feedback that explains WHY (not just right/wrong)
  Social: Moderated multiplayer, pre-set chat messages
  Regulation: COPPA still applies (under 13)

AGES 13-17 (ADOLESCENCE):
  Cognitive: Formal operational, abstract reasoning, critical thinking
  Motor: Adult-level capabilities
  Attention: 30-60 minute sessions
  Literacy: Full reading capability
  Content: Complex subjects, real-world applications, ethics,
  career exploration, advanced academics
  Mechanics: Complex systems, simulation, creative tools, debate
  Social: Full social features with moderation
  Note: Identity exploration is important; allow self-expression

ADULTS (18+):
  Cognitive: Full adult cognition
  Context: Professional training, skill development, health education
  Attention: Varies widely (5 minutes to hours)
  Content: Professional skills, compliance, health literacy,
  financial literacy, technical training
  Mechanics: Simulation, scenario-based learning, branching narrative
  Note: Adults resist feeling patronized; game should feel
  professional and purposeful, not childish
```

## Accessibility

```
ACCESSIBILITY IN EDUCATIONAL GAMES:

VISUAL:
  - Color-blind friendly design (don't rely on color alone)
  - Adjustable text size
  - High contrast mode
  - Screen reader compatibility
  - Alternative text for images
  - Clear, legible fonts (sans-serif for body text)

AUDITORY:
  - Subtitles and captions for all audio
  - Visual indicators for audio cues
  - Adjustable volume controls
  - No critical information delivered only through audio

MOTOR:
  - Adjustable timing (no time pressure that excludes)
  - Alternative input methods
  - Large touch targets (especially for young children)
  - One-handed play options
  - Switch access compatibility (for assistive devices)

COGNITIVE:
  - Clear, consistent UI
  - Multiple difficulty levels
  - Repeat instructions on demand
  - Save progress frequently
  - Minimal distractions during learning moments
  - Multiple representation modes (visual + auditory + text)

UNIVERSAL DESIGN FOR LEARNING (UDL):
  Multiple means of ENGAGEMENT (the "why" of learning)
  Multiple means of REPRESENTATION (the "what" of learning)
  Multiple means of ACTION AND EXPRESSION (the "how" of learning)

  Apply all three in educational game design:
  - Let learners engage in multiple ways (choice)
  - Present information in multiple formats (multimodal)
  - Allow learners to demonstrate understanding in multiple ways
```

## Classroom Integration

```
DESIGNING FOR CLASSROOM USE:

TEACHER TOOLS:
  - Teacher dashboard (monitor student progress in real-time)
  - Assignment system (assign specific levels/topics)
  - Class management (pause all, send messages, adjust settings)
  - Data export (grades, progress reports, standards alignment)
  - Curriculum alignment documentation (which standards are addressed)

SESSION DESIGN FOR CLASSROOMS:
  - Sessions that fit class periods (15-minute, 30-minute, 45-minute)
  - Natural stopping points (don't leave students mid-level when
    the bell rings)
  - Offline discussion prompts built into the game
  - Printable extension activities
  - Teacher guides with discussion questions

IMPLEMENTATION CONSIDERATIONS:
  - Works on school-issued devices (often older, restricted)
  - No personal data collection without parental consent
  - Works with limited internet (many schools have poor connectivity)
  - Accounts manageable by teachers (batch creation, no email required)
  - Compatible with school IT policies (no app installs if using web)

PEDAGOGICAL PATTERNS:
  Pre-teach -> Game play -> Debrief -> Apply
  The game is ONE part of the learning experience, not the whole thing.

  Before play: Teacher introduces concepts, sets context
  During play: Students practice, explore, fail safely
  After play: Teacher debriefs, connects to broader learning
  Extension: Students apply learning in non-game context
```

## Edutainment vs. Serious Games

```
EDUTAINMENT:
  Entertainment with educational content layered on top.
  The game is primary; education is secondary.
  "Sugar-coating": make learning fun by wrapping it in a game.

  Examples: Math Blaster, Where in the World is Carmen Sandiego?
  Risk: The game part can be separated from the learning.
  "Chocolate-covered broccoli" problem.

SERIOUS GAMES:
  Games designed primarily for a purpose beyond entertainment.
  The learning IS the gameplay, not a separate layer.

  Examples: Foldit (protein folding), Spent (poverty simulation),
  Minecraft: Education Edition, Civilization (history, strategy)
  Strength: Learning and playing are inseparable.

THE CHOCOLATE-COVERED BROCCOLI PROBLEM:
  When the educational content is simply attached to game mechanics
  without integration:
  "Solve this math problem to make the character jump!"
  The math and the jumping are unrelated.
  Players learn that math is the boring price for fun.

THE SOLUTION: INTRINSIC INTEGRATION
  The game mechanic ITSELF teaches the skill.
  "Build a bridge that supports this weight" teaches physics
  THROUGH the building mechanic. You can't separate the
  physics from the gameplay.

DESIGNING FOR INTRINSIC INTEGRATION:
  1. What does learning this topic FEEL like?
     (Solving a mystery, building something, navigating complexity)
  2. What game mechanic recreates that feeling?
  3. How does practicing the mechanic practice the skill?
  4. Does removing the educational content break the game?
     (If yes, the integration is intrinsic. If no, it's decoration.)

EXAMPLES OF INTRINSIC INTEGRATION:
  - Kerbal Space Program: Orbital mechanics ARE the gameplay
  - DragonBox: Algebra IS the puzzle mechanic
  - Civilization: Historical cause-and-effect IS strategic decision-making
  - CodeCombat: Programming IS how you control your character
```

## Design Process for Educational Games

```
STEP 1: DEFINE LEARNING GOALS
  Work with subject matter experts and educators.
  Map specific learning objectives to Bloom's taxonomy levels.
  Identify prerequisite knowledge and common misconceptions.

STEP 2: UNDERSTAND THE LEARNER
  Conduct user research with the target age group.
  Observe current learning behavior and pain points.
  Identify motivational factors and barriers.

STEP 3: DESIGN THE CORE MECHANIC
  The mechanic should inherently practice the learning objective.
  Prototype the mechanic WITHOUT any educational content.
  Is it fun? If not, redesign the mechanic.

STEP 4: INTEGRATE CONTENT
  Layer the educational content INTO the mechanic.
  Not: "Do math to unlock the next level"
  But: "Use math as your primary tool for solving in-game challenges"

STEP 5: BUILD ASSESSMENT
  Design stealth assessment into the gameplay.
  Every player action should generate learning data.
  Build teacher dashboards and progress tracking.

STEP 6: PLAYTEST WITH LEARNERS
  Test with actual target-age learners.
  Measure: engagement, learning outcomes, usability.
  Iterate based on both fun metrics and learning metrics.

STEP 7: VALIDATE LEARNING OUTCOMES
  Conduct formal studies comparing:
  - Game group vs. control group
  - Pre-test vs. post-test scores
  - Transfer to non-game contexts
  Publish results to build credibility with educators.
```

## Practice Exercises

### Exercise 1: Objective Alignment
Take a learning objective from any curriculum. Design a game mechanic where the ONLY way to succeed is to demonstrate that skill. Verify: if you removed the educational content, would the game break?

### Exercise 2: Bloom's Level Up
Take a topic (e.g., photosynthesis). Design one game activity for each level of Bloom's taxonomy (Remember through Create). How does the game design change at each level?

### Exercise 3: Chocolate-Covered Broccoli Audit
Play 3 educational games. For each, determine: is the learning intrinsically integrated or decoratively attached? What would make the integration tighter?

### Exercise 4: Age Adaptation
Take one game concept and adapt it for three age groups: 5-year-olds, 10-year-olds, and 15-year-olds. What changes in mechanics, presentation, and complexity?

### Exercise 5: Stealth Assessment Design
Choose a learning objective. Design a game level where every player action generates assessment data. Map: action -> evidence -> competency judgment.

### Exercise 6: Teacher Integration Plan
Design a 45-minute classroom lesson that uses a game as the central activity. Include: pre-game setup (5 min), gameplay (25 min), debrief discussion (10 min), assessment connection (5 min).


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Educational Game Designer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with educational game designer for a mid-size project."

**Output:** A complete educational game designer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
