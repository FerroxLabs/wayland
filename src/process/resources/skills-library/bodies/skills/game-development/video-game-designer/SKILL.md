---
name: video-game-designer
description: |
  Comprehensive video game design guidance covering Game Design Document (GDD) structure, core mechanics design, player motivation (Bartle types), level design principles, difficulty curves, playtesting methodology, monetization ethics, game feel and juice, and the full design-to-playtest pipeline. Use when the user asks about video game designer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "game-design design guide"
  category: "game-development"
  subcategory: "game-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Video Game Designer

## When to Use

**Use this skill when:**
- The user wants to design a video game and needs help with Game Design Documents, core mechanics, or the design-to-playtest pipeline
- The user needs guidance on player motivation (Bartle types), difficulty curves, or game feel and juice
- The user is scoping a game project and needs help with team structure, timeline, or business model decisions
- The user wants to understand genre conventions, reference analysis, or what makes a game unique
- The user needs a structured playtesting methodology or feedback analysis framework

**Do NOT use this skill when:**
- The user is designing a board game or tabletop game (use board-game-creator or tabletop-rpg-designer instead)
- The user needs specialized mobile F2P design (use mobile-game-designer instead)
- The user needs deep expertise in a specific subsystem like audio, economy, or narrative (use the relevant specialized skill)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to video game designer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on video game designer
- User asks about video game designer best practices or techniques
- User wants a structured approach to video game designer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of video game designer

## Questions to Ask First

Before designing any video game, clarify:

1. **What is the core experience you want to create?** (The feeling the player should have -- not features, but emotion)
2. **Who is the target audience?** (Casual, mid-core, hardcore, age range, gaming background)
3. **What platform(s)?** (PC, console, mobile, VR, browser -- this shapes everything)
4. **What is the team size and skill set?** (Solo, small indie, mid-size studio)
5. **What is the scope and timeline?** (Game jam, 3 months, 1 year, multi-year)
6. **What genre or reference games inspire this?** (Not to copy, but to understand the design space)
7. **What is the business model?** (Premium, free-to-play, early access, subscription)
8. **What is the one thing that makes this game unique?** (The hook -- if you can't answer this, pause and think)

## Game Design Document (GDD) Structure

### Essential GDD Sections

```
1. CONCEPT OVERVIEW (1 page)
   Game Title: _______________
   Tagline: One sentence that sells the game
   Elevator Pitch: 2-3 sentences describing the experience
   Genre: Primary and secondary
   Platform(s): Target platforms
   Target Audience: Who and why
   Unique Selling Point: What makes this different

2. CORE GAMEPLAY
   Core Loop: The repeated cycle of play
     [Action] -> [Reward/Feedback] -> [Progression] -> [Action]

   Primary Mechanic: The one thing the player does most
   Secondary Mechanics: Supporting systems
   Player Verbs: What can the player DO? (jump, build, shoot, solve, trade)

3. GAME WORLD AND SETTING
   Setting: Time, place, tone
   Visual Style: Art direction reference
   Audio Direction: Music and sound design vision
   Narrative Premise: Why does this world exist?

4. PROGRESSION SYSTEM
   How does the player advance?
   Skill progression vs. character progression vs. story progression
   Pacing: How long is the experience? How is it structured?
   Content gates: What unlocks what?

5. TECHNICAL REQUIREMENTS
   Engine: (Unity, Unreal, Godot, custom)
   Minimum specs: For target platforms
   Networking: Single-player, multiplayer, online features
   Save system: How and when

6. SCOPE AND MILESTONES
   Vertical Slice: Target date
   Alpha: Feature complete
   Beta: Content complete
   Gold: Ship-ready
   Cut list: Features ranked by priority (must-have, nice-to-have, dream)

GDD IS A LIVING DOCUMENT:
  It changes throughout development. The initial version sets
  direction; the final version documents what was actually built.
  Don't over-design on paper. Build, test, iterate.
```

## Core Mechanics Design

### The Core Loop

```
Every game has a core loop: the repeated cycle that IS the game.

EXAMPLES:
  Roguelike: Explore -> Fight -> Loot -> Die -> Start Over (stronger)
  City Builder: Build -> Manage -> Expand -> Optimize -> Build
  Puzzle: Observe -> Hypothesize -> Act -> Feedback -> Observe
  Battle Royale: Loot -> Move -> Fight -> Survive -> Win/Lose

DESIGNING YOUR CORE LOOP:
  1. What is the primary action? (The verb: jumping, building, matching)
  2. What is the immediate feedback? (Visual, audio, score, progress)
  3. What is the short-term reward? (New ability, resource, revelation)
  4. What is the long-term motivation? (Story, mastery, collection, status)
  5. Does the loop feel good on iteration 1? Iteration 100? Iteration 1000?

THE 30-SECOND TEST:
  Can you prototype the core loop in 30 seconds of play?
  If not, the loop might be too complex or too slow.
  The core loop should be engaging BEFORE you add content.
```

### Mechanics Design Principles

```
DEPTH vs. COMPLEXITY:
  Depth: Many interesting decisions emerge from simple rules
    (Chess: 6 piece types, near-infinite strategic depth)
  Complexity: Many rules that are hard to learn
    (Tax code: complex but not deep or interesting)

  AIM FOR: High depth, low complexity. Simple to learn, deep to master.

EMERGENT GAMEPLAY:
  Design mechanics that interact in ways you didn't fully anticipate.
  When players discover new strategies by combining mechanics,
  that's a sign of good design.

  Example: Physics + fire in Breath of the Wild creates
  emergent strategies the designers didn't explicitly build.

MEANINGFUL CHOICES:
  Every player choice should involve a tradeoff.
  If one option is always better, it's not a real choice.

  Good choice: "Spend gold on a weapon (offense) or armor (defense)"
  Bad choice: "Spend gold on +10 sword or +1 sword" (no tradeoff)

FEEDBACK LOOPS IN MECHANICS:
  Positive feedback: Winner gets stronger, creating snowball
    (exciting but can be unfun if too extreme)
  Negative feedback: Loser gets help, creating catch-up
    (reduces frustration but can feel unfair to the leader)
  Balance both: Let skilled play create advantages, but prevent
  them from being insurmountable.

THE LENS OF THE TOY:
  A good game mechanic should be fun as a "toy" before it
  becomes a "game." Jumping in Mario is fun even without goals.
  Building in Minecraft is satisfying even without objectives.
  If the mechanic isn't fun as a toy, no amount of game structure
  will make it engaging.
```

## Player Motivation (Bartle Types)

```
BARTLE'S PLAYER TAXONOMY (originally for MUDs, widely applicable):

ACHIEVERS (Diamonds):
  Motivated by: Completion, mastery, high scores, 100% achievements
  Design for: Clear goals, progression systems, achievement lists,
  leaderboards, completionist content
  "I want to see my number go up."

EXPLORERS (Spades):
  Motivated by: Discovery, secrets, understanding systems, finding
  hidden content
  Design for: Large worlds with secrets, discoverable mechanics,
  lore, easter eggs, non-linear paths
  "I want to see what's over that hill."

SOCIALIZERS (Hearts):
  Motivated by: Relationships, cooperation, community, shared experiences
  Design for: Multiplayer interaction, guilds/clans, communication tools,
  cooperative challenges, social spaces
  "I want to play WITH people."

KILLERS (Clubs):
  Motivated by: Competition, dominance, imposing on others, PvP
  Design for: PvP systems, rankings, competitive modes, ability
  to impact other players
  "I want to beat other players."

IMPORTANT NUANCES:
  - Players are a MIX of types, not purely one
  - Different types are engaged at different stages
  - Early game often appeals to Explorers/Achievers
  - Endgame often appeals to Socializers/Killers
  - Design for your TARGET type but include hooks for others

SELF-DETERMINATION THEORY (More modern framework):
  Autonomy: Player agency and meaningful choice
  Competence: Mastery, skill growth, challenge matching ability
  Relatedness: Connection with others, belonging
  All three should be present for sustained engagement.
```

## Level Design Principles

```
THE LANGUAGE OF LEVEL DESIGN:

TEACHING THROUGH PLAY:
  1. Introduce mechanic in a safe environment (no penalty for failure)
  2. Let player practice the mechanic
  3. Present a challenge that requires the mechanic
  4. Combine with previous mechanics for complexity
  5. Test mastery with a difficult challenge

  Nintendo's approach: "Introduce, develop, twist, conclude"
  Each level introduces a concept, explores variations, then
  presents a final challenge combining everything.

FLOW AND PACING:
  Alternate intensity levels:
  High tension -> Relief -> Medium tension -> Relief -> Climax

  The "Roller Coaster" principle:
  Players need valleys to appreciate peaks.
  Constant action becomes numbing.
  Constant calm becomes boring.

GUIDANCE WITHOUT HANDHOLDING:
  - Environmental cues: Light draws the eye, color highlights paths
  - Weenies: Visible distant landmarks that pull the player forward
    (Disney's castle visible from everywhere in the park)
  - Breadcrumbs: Small rewards along the correct path
  - Negative space: Empty areas feel wrong; players move toward content
  - Chokepoints: Narrow paths that naturally guide movement

SPATIAL DESIGN:
  - Give players a sense of place (landmarks, distinct areas)
  - Create interesting sight lines (see where you're going/been)
  - Mix open spaces with tight spaces (variety of engagement)
  - Provide vantage points (overlooks reward exploration)
  - Connect spaces with visual and spatial logic
```

## Difficulty Curves

```
TYPES OF DIFFICULTY CURVES:

LINEAR:
  Difficulty |      /
             |    /
             |  /
             |/________
              Time

  Simple, predictable. Can feel monotonous.

STEPPED:
  Difficulty |        ___
             |    ___|
             |___|
             |________
              Time

  Plateau periods let players consolidate skills.
  Most common in traditional game design.

WAVE / SAWTOOTH:
  Difficulty |    /\    /\
             |   /  \  /  \  /
             |  /    \/    \/
             |/_______________
              Time

  Challenge spikes followed by relief.
  Keeps players engaged through contrast.

ADAPTIVE:
  Adjusts dynamically based on player performance.
  Pros: Maintains flow state for all skill levels
  Cons: Can feel artificial, removes bragging rights

DIFFICULTY DESIGN PRINCIPLES:
  - Fail state should teach, not punish
  - The player should always understand WHY they failed
  - Difficulty should come from interesting decisions, not
    obscure mechanics or unfair surprises
  - Easy mode should still be engaging (not patronizing)
  - Hard mode should still be fair (not arbitrary)

FLOW STATE (Csikszentmihalyi):
  The sweet spot between boredom (too easy) and anxiety (too hard).
  Difficulty should roughly match the player's growing skill.

       Anxiety |      /
               |    /
       FLOW    |--/---  <- The target zone
               |/
       Boredom |________
               Low  High
               Skill Level
```

## Playtesting Methodology

```
TYPES OF PLAYTESTING:

INTERNAL (Developer) TESTING:
  Purpose: Find bugs, test mechanics, check balance
  When: Throughout development
  Limitation: Developers can't experience the game fresh

FOCUS TESTING:
  Purpose: Get reactions from target audience
  When: After significant milestones (vertical slice, alpha)
  Method: Structured session with observation and surveys

USABILITY TESTING:
  Purpose: Can players figure out the UI and controls?
  When: Early and often
  Method: Watch players try tasks without instruction

BALANCE TESTING:
  Purpose: Are strategies, characters, weapons balanced?
  When: When content is near-complete
  Method: Data analysis of outcomes across many play sessions

THE PLAYTEST SESSION:

  BEFORE:
  1. Define what you're testing (specific questions, not "is it fun")
  2. Prepare the build (stable, specific section, clear start/end)
  3. Prepare observation tools (screen recording, note-taking template)
  4. Brief the tester: "Play naturally. Think out loud. There are
     no wrong answers. We're testing the game, not you."

  DURING:
  1. OBSERVE silently. Do not help, explain, or justify.
  2. Note where players get stuck, confused, or frustrated
  3. Note where players smile, lean forward, or express excitement
  4. Note where players make choices you didn't expect
  5. Time key actions (how long to complete tutorial, level, etc.)
  6. If using think-aloud protocol, only prompt with "What are
     you thinking right now?" -- never leading questions

  AFTER:
  1. Debrief interview: "What did you enjoy most? What frustrated you?
     What was confusing? Would you play again?"
  2. Quantitative survey if appropriate (Likert scales)
  3. Compile observations across all testers
  4. Identify patterns (one person's frustration is anecdotal;
     3+ people stuck at the same spot is a design problem)

THE GOLDEN RULE:
  When a playtester says something is wrong, they're almost
  always right. When they suggest a solution, they're almost
  always wrong. Listen to the PROBLEM, not the proposed fix.
```

## Game Feel and Juice

```
GAME FEEL (Steve Swink):
  The tactile, embodied sensation of interacting with virtual objects.
  The difference between "this game controls well" and "this game
  feels amazing."

ELEMENTS OF GOOD GAME FEEL:
  - Responsive input (minimal input lag)
  - Satisfying animations (weight, momentum, snap)
  - Screen shake on impacts (subtle but powerful)
  - Particle effects on actions (dust, sparks, trails)
  - Sound effects timed to actions (audio feedback)
  - Camera movement that reinforces action
  - Controller vibration (haptic feedback)

JUICE:
  The polish that makes simple actions feel rewarding.
  "Juice" = maximum output for minimum input.

  JUICING A BUTTON PRESS:
  Unjuiced: Button changes state. That's it.
  Juiced: Button depresses with squash animation, makes a
  satisfying click sound, emits particles, screen shakes
  slightly, text pulses, score increments with a whoosh,
  combo counter updates with a flash.

  Same mechanic. Radically different feel.

ADDING JUICE (Priority order):
  1. Sound effects (biggest impact for effort)
  2. Screen shake (subtle! 2-5 pixels, 0.1 seconds)
  3. Particle effects (dust, sparks, impacts)
  4. Animation easing (ease-in, ease-out, overshoot, bounce)
  5. Camera punch/zoom on important events
  6. Color flashes or post-processing effects
  7. Time manipulation (brief slowdown on impacts -- "hitstop")
  8. UI animations (score counting up, health bar draining smoothly)

THE JUICE TEST:
  Take any action in your game. Make it 2x more satisfying
  with only visual/audio polish. If you can't, the base
  mechanic might need redesign.
```

## Monetization Ethics

```
ETHICAL MONETIZATION SPECTRUM:

CLEARLY ETHICAL:
  - Premium price (pay once, get the whole game)
  - Cosmetic-only microtransactions (no gameplay advantage)
  - Expansion packs with substantial new content
  - "Pay what you want" models
  - Season passes with transparent content roadmaps

GRAY AREA:
  - Battle passes (time-limited; can create FOMO)
  - Convenience purchases (XP boosters, fast travel)
  - Energy systems (limiting play sessions)
  - Gacha with published rates and pity systems

CLEARLY UNETHICAL:
  - Loot boxes targeting minors without published rates
  - Pay-to-win in competitive games
  - Artificial difficulty designed to sell solutions
  - Predatory spending targeting vulnerable players ("whales")
  - Disguising real-money costs (premium currency obfuscation)
  - Dark patterns (hiding unsubscribe, confusing UI for purchases)

DESIGN PRINCIPLES FOR ETHICAL MONETIZATION:
  1. Players should always know what they're paying for
  2. Free players should have a complete, enjoyable experience
  3. Spending should never be required to progress at a reasonable pace
  4. Spending should enhance, not gatekeep
  5. Published odds for any randomized purchases
  6. Spending limits and parental controls
  7. No manipulation of vulnerable populations
```

## Practice Exercises

### Exercise 1: Core Loop Design
Design 3 different core loops for the same theme (e.g., "space exploration"). Each loop should create a fundamentally different experience. Prototype the one that excites you most.

### Exercise 2: Toy Test
Build the simplest possible version of your main mechanic. No goals, no score, no enemies. Just the mechanic. Is it fun as a toy? If not, iterate until it is.

### Exercise 3: Juice Pass
Take a simple game prototype (even Pong). Add juice: screen shake, particles, sound effects, animation easing. Compare before and after. Note how much feel changes.

### Exercise 4: Playtest Observation
Watch 3 people play a game you're designing (or any game). Don't help them. Take notes on every moment of confusion, frustration, or delight. Identify the top 3 patterns.

### Exercise 5: Level Design Language
Design a level that teaches a new mechanic WITHOUT any text, tutorials, or UI prompts. Use only environmental design to guide the player.

### Exercise 6: One-Page GDD
Write a complete game concept on a single page. If you can't communicate the vision in one page, the concept isn't clear enough yet.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Video Game Designer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with video game designer for a mid-size project."

**Output:** A complete video game designer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
