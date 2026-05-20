---
name: tabletop-rpg-designer
description: |
  Complete tabletop RPG design guide covering core resolution mechanics, character creation systems, combat design, skill systems, setting integration, character advancement, GM tools, one-page RPG format, playtest feedback collection, and publishing on DriveThruRPG and itch.io. Use when the user asks about tabletop rpg designer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "game-design tabletop-rpg guide"
  category: "game-development"
  subcategory: "game-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Tabletop Rpg Designer

## When to Use

**Use this skill when:**
- The user wants to design a tabletop RPG system from scratch, including core resolution mechanics and character creation
- The user needs help choosing dice systems, designing combat or skill systems, or building character advancement tracks
- The user is creating GM tools, session frameworks, or one-page RPG formats
- The user wants guidance on playtesting tabletop RPGs and collecting structured feedback
- The user needs publishing advice for DriveThruRPG, itch.io, or print-on-demand platforms

**Do NOT use this skill when:**
- The user wants to design a board game without role-playing elements (use board-game-creator instead)
- The user is designing a digital RPG or video game (use video-game-designer instead)
- The user wants to write campaign content or adventures rather than design game systems

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to tabletop rpg designer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on tabletop rpg designer
- User asks about tabletop rpg designer best practices or techniques
- User wants a structured approach to tabletop rpg designer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of tabletop rpg designer

## Questions to Ask First

Before designing any tabletop RPG, clarify:

1. **What experience do you want to create at the table?** (Epic adventure, horror tension, political intrigue, collaborative storytelling, tactical combat, comedic mayhem)
2. **What is the setting?** (Fantasy, sci-fi, modern, historical, abstract, genre mashup)
3. **What is the tone?** (Gritty realistic, cinematic heroic, comedic, dark, whimsical)
4. **What is the target audience?** (New to RPGs, experienced, specific community)
5. **What is the scope?** (One-page RPG, small zine, full rulebook, multi-book system)
6. **How important is combat vs. social vs. exploration?** (Balance of pillars)
7. **What existing games inspire you?** (And what do you want to do differently)
8. **What is the GM burden?** (GM-full, GM-lite, GM-less)

## Core Resolution Mechanic

### Choosing Your Dice System

```
THE RESOLUTION MECHANIC IS THE HEARTBEAT OF YOUR RPG.
Every action in the game flows through it.

d20 + MODIFIER vs. TARGET NUMBER (D&D style):
  Pros: Familiar, clear pass/fail, easy to calculate
  Cons: Very swingy (5% chance of any result), binary outcome
  Best for: Heroic fantasy, action-oriented games
  Example: Roll d20 + Strength modifier. Beat DC 15? Success.

DICE POOL (Roll multiple dice, count successes):
  Pros: Bell curve (consistent results), granular scaling, partial success
  Cons: More dice to manage, slower resolution
  Best for: Gritty/realistic games, narrative systems
  Example: Roll dice equal to your skill. Each 5+ is a success.
  Need 3 successes. (World of Darkness, Shadowrun)

STEP DICE (Different die sizes for different abilities):
  Pros: Intuitive scaling, minimal math, tactile variety
  Cons: Requires multiple die types, probability less intuitive
  Best for: Accessible games, narrative-leaning systems
  Example: Your Strength is d8. Roll it against their d6 Defense.
  Higher wins. (Savage Worlds, Cortex)

2d6 + MODIFIER (Powered by the Apocalypse):
  Pros: Simple, predictable curve, built-in partial success
  Cons: Narrow range (2-12), less granular
  Best for: Fiction-first, narrative-heavy games
  Example: 2d6 + modifier. 10+ = full success, 7-9 = success
  with complication, 6- = failure (GM makes a move).

d100 / PERCENTILE (Roll under your skill):
  Pros: Intuitive percentages, highly granular
  Cons: Large numbers, calculating modifiers is clunky
  Best for: Realistic/simulationist games, investigation
  Example: Your Investigation skill is 65%. Roll under it on d100.
  (Call of Cthulhu, RuneQuest)

PLAYING CARDS / TOKENS:
  Pros: Unique feel, resource management built in
  Cons: Unfamiliar, deck management, reshuffling
  Best for: Genre-specific games, innovative designs
  Example: Play a card from your hand. Higher card wins.
  (Deadlands classic, Castle Falkenstein)

NO DICE (Narrative/resource-based):
  Pros: Pure storytelling focus, accessible
  Cons: Can feel arbitrary, less tactical crunch
  Best for: Collaborative storytelling, one-shots
  Example: Spend tokens to declare narrative truths.
  (Amber Diceless, some story games)
```

### Outcome Spectrum Design

```
BINARY (Pass/Fail):
  Simple but limits narrative possibilities.
  "You pick the lock." / "You fail to pick the lock."

THREE-TIER (Success / Partial / Fail) -- RECOMMENDED:
  Creates the most interesting fiction.
  Success: You achieve what you wanted.
  Partial: You achieve it, BUT there's a cost or complication.
  Failure: Things get worse (not just "nothing happens").

  "You pick the lock, but it takes long enough that the guard
   is now walking toward you."

FOUR-TIER (Critical / Success / Partial / Critical Fail):
  Adds dramatic highs and lows.
  Use sparingly -- constant criticals diminish their impact.

GRADUATED SUCCESS (Degrees of success):
  The margin of success determines how well you succeeded.
  More complex but rewards high skill levels.

GOLDEN RULE FOR FAILURE:
  "Failure" should never mean "nothing happens."
  Failed rolls should ALWAYS move the story forward,
  just not in the direction the player wanted.
  "You fail to pick the lock" is boring.
  "The lock breaks, alerting the guards" is a story.
```

## Character Creation System

```
APPROACHES TO CHARACTER CREATION:

CLASS-BASED (D&D, Pathfinder):
  Players choose a class that defines abilities and role.
  Pros: Clear identity, balanced roles, easy for new players
  Cons: Can feel restrictive, multiclass complexity
  Design tip: Each class should feel meaningfully different
  in play, not just in numbers.

SKILL-BASED / CLASSLESS (Call of Cthulhu, GURPS):
  Players build characters from a point-buy skill list.
  Pros: Maximum customization, unique characters
  Cons: Analysis paralysis, potential for optimization traps
  Design tip: Provide archetypes/templates as starting points.

PLAYBOOK-BASED (PbtA games):
  Pre-built character sheets with some customization.
  Pros: Fast creation, built-in narrative hooks, balanced
  Cons: Limited options per playbook, less freeform
  Design tip: Each playbook should play differently and have
  a unique narrative role in the fiction.

LIFEPATH (Traveller, Cyberpunk):
  Random or semi-random events during "character history" phase.
  Pros: Creates surprising, rich backgrounds, story hooks built in
  Cons: Uneven characters, less player control
  Design tip: Each lifepath event should create both an ability
  AND a narrative connection (an ally, enemy, debt, or secret).

COLLABORATIVE (Fiasco, Microscope):
  Characters emerge from group discussion and shared world-building.
  Pros: Characters are immediately connected, rich fiction
  Cons: Slower, requires group buy-in, less tactical
  Design tip: Provide structured prompts that create relationships
  between characters during creation.

CHARACTER CREATION DESIGN PRINCIPLES:
  1. Creation should be exciting, not homework
  2. Every choice should be meaningful (no "right answer")
  3. Characters should be playable immediately (not after 2 hours of setup)
  4. Backstory tools should create hooks for the GM to use
  5. New players should be able to create a character in under 30 minutes
  6. The character sheet itself is a design artifact -- make it beautiful
     and functional
```

## Combat Design

```
COMBAT PILLARS:

SPEED: How long does a combat encounter take?
  Target: 15-30 minutes for a standard encounter
  Longer = tactical depth but pacing drag
  Shorter = cinematic speed but less tactical satisfaction

MEANINGFUL CHOICES: Does the player have interesting options each turn?
  Bad: "I attack again" (only viable option)
  Good: "Do I attack the mage, protect the healer, or reposition?"
  Each turn should present a genuine tactical decision.

LETHALITY: How dangerous is combat?
  High lethality (OSR, Call of Cthulhu): Combat is to be AVOIDED.
    Creates tension, resource management, creative problem-solving.
  Low lethality (D&D 5e, PbtA): Combat is a dramatic setback.
    Creates heroic moments, allows frequent combat, accessible.
  Choose based on the experience you want. Both are valid.

COMBAT DESIGN OPTIONS:

INITIATIVE SYSTEMS:
  Individual (D&D): Roll for turn order, fixed for encounter
    Pro: Tactical, rewards initiative stats
    Con: Waiting between turns, tracking order
  Group (many OSR): One side goes, then the other
    Pro: Faster, encourages teamwork
    Con: Less individual agency
  Popcorn (some story games): Acting player chooses who goes next
    Pro: Dynamic, dramatic choices
    Con: Can be exploited, quieter players may be skipped
  Simultaneous (Troika): Everyone declares, then resolve
    Pro: Fast, creates chaos and tension
    Con: Complex resolution, can be confusing

ACTION ECONOMY:
  Actions per turn: More actions = more decisions but longer turns
  Action points: Flexible but requires more tracking
  Move + Action: Simple, proven, but can feel limiting
  Free-form (one significant action): Narrative and fast

DAMAGE AND HIT POINTS:
  HP attrition: Classic, trackable, but abstract
  Wound system: More realistic, but more complex
  Condition-based: Injuries create narrative effects
  Stress/composure: Social and mental "damage" alongside physical
```

## Skill System

```
SKILL SYSTEM APPROACHES:

BROAD SKILLS (5-10 skills):
  Example: Fight, Sneak, Talk, Know, Survive
  Pros: Fast, flexible, less bookkeeping
  Cons: Less character differentiation
  Best for: Rules-lite, narrative games

MODERATE SKILLS (15-25 skills):
  Example: Athletics, Deception, History, Medicine, Perception, etc.
  Pros: Good differentiation without overwhelm
  Cons: Skill overlap can create confusion
  Best for: Mid-weight games (this is the sweet spot for most)

GRANULAR SKILLS (40+ skills):
  Example: Lockpicking, Calligraphy, Herbalism, Diplomacy, etc.
  Pros: Maximum character uniqueness, specific expertise
  Cons: Analysis paralysis, many skills rarely used
  Best for: Simulationist games, specialized settings

SKILL DESIGN PRINCIPLES:
  1. Every skill should be usable in play (cut skills that never get rolled)
  2. No skill should be mandatory (don't punish players for not taking Perception)
  3. Skills should be balanced in utility (if one skill applies to everything,
     it's too broad)
  4. Let skills overlap slightly (multiple paths to solve problems)
  5. Skills should suggest fiction ("What does it look like when you use
     Intimidation here?")
```

## Setting Integration

```
THE SETTING SHOULD INFORM MECHANICS:

HORROR SETTING:
  - Sanity/stability as a tracked resource
  - Combat should be dangerous (high lethality)
  - Investigation skills prominent
  - Information is the primary reward
  - Mechanics should create feelings of vulnerability

SPACE OPERA:
  - Ship combat as its own system
  - Faction/reputation mechanics
  - Technology as character capability
  - Scale from personal to galactic
  - Resources: fuel, supplies, crew morale

SWORD AND SORCERY:
  - Magic system is the centerpiece
  - Equipment and treasure matter
  - Dungeon/exploration procedures
  - Leveling and power growth
  - Monster ecology and encounter design

MODERN HORROR/INVESTIGATION:
  - Research and clue-gathering mechanics
  - Social encounter rules alongside combat
  - Real-world grounding (skills reflect modern capabilities)
  - Psychological effects mechanics
  - Resource: time, relationships, sanity

SETTING INTEGRATION CHECKLIST:
  [ ] Does the core mechanic FEEL like the setting?
  [ ] Do the skills reflect what characters DO in this world?
  [ ] Does the advancement system match the setting's power scale?
  [ ] Do the equipment/resource rules fit the world's economy?
  [ ] Would removing the setting make the mechanics feel generic?
      (If yes, the integration is weak)
```

## Character Advancement

```
ADVANCEMENT APPROACHES:

EXPERIENCE POINTS (XP):
  Earned through: combat, quests, milestones, good roleplay
  Spent on: levels, skills, abilities
  Pro: Clear progression, satisfying accumulation
  Con: Can incentivize grinding, tracking overhead

MILESTONE ADVANCEMENT:
  Level up at story-appropriate moments (GM decides).
  Pro: Pacing matches narrative, no XP tracking
  Con: Less player agency in advancement, can feel arbitrary

SESSION-BASED:
  Advance a set amount each session regardless of what happened.
  Pro: No incentive distortion, simple
  Con: Decoupled from fiction

ADVANCEMENT BY FAILURE:
  You improve skills when you fail at using them (Mouse Guard).
  Pro: Elegant (you learn from mistakes), encourages risk-taking
  Con: Can incentivize deliberate failure

UNLOCK-BASED:
  New abilities unlocked by in-fiction achievements.
  "You slew the dragon, so you gained Fire Resistance."
  Pro: Deeply narrative, memorable
  Con: Hard to balance, requires GM creativity

ADVANCEMENT DESIGN PRINCIPLES:
  1. Advancement should FEEL rewarding (satisfying click of leveling up)
  2. Players should have meaningful CHOICE in how they advance
  3. Advancement should not make the character unrecognizable
  4. Low-level play should be fun, not just a grind to high levels
  5. The game should be interesting at ALL power levels
  6. Reward the behavior you want to see at the table
```

## GM Tools

```
TOOLS EVERY RPG SHOULD PROVIDE FOR THE GM:

ENCOUNTER/SESSION PREPARATION:
  - Adventure structure templates (one-shot, campaign arc)
  - Encounter building guidelines (how hard should this fight be)
  - NPC creation shortcuts (quick stat blocks, personality generators)
  - Random tables for improvisation (names, locations, events, rumors)

IN-SESSION TOOLS:
  - Quick reference sheets for commonly used rules
  - Monster/NPC stat block format that's scannable in 5 seconds
  - Procedure for handling unexpected player actions
  - Pacing guidelines (when to cut scenes, when to zoom in)

WORLD-BUILDING TOOLS:
  - Faction creation and relationship mapping
  - Settlement generation procedures
  - History/lore creation frameworks
  - Map-making guidelines

GM ADVICE SECTION:
  - How to handle common situations (player conflict, rules disputes)
  - How to adapt to different play styles
  - How to improvise when players go off-script
  - How to handle sensitive topics (safety tools: X-Card, Lines and Veils)
  - Session zero guidelines (setting expectations)

RANDOM TABLE DESIGN:
  Every entry should be usable IMMEDIATELY.
  Bad: "17. An ancient evil stirs." (What does this mean in play?)
  Good: "17. A crumbling tower on the horizon emanates a green glow.
  Locals avoid it. Inside: an alchemist who can't die and doesn't
  want to." (Immediately gameable content.)
```

## One-Page RPG Format

```
THE ONE-PAGE RPG CHALLENGE:
  An entire playable RPG on a single page (front and back).

WHAT TO INCLUDE:
  Front side:
  - Title and pitch (1-2 sentences)
  - Core mechanic (how to resolve actions)
  - Character creation (3-5 minutes maximum)
  - 3-5 key rules

  Back side:
  - GM guidance and setting details
  - A starting scenario or adventure hook
  - Random table or reference sheet
  - Safety/tone guidance

DESIGN CONSTRAINTS THAT HELP:
  - One resolution mechanic (no exceptions)
  - 3-5 stats/attributes maximum
  - No equipment lists (describe what you have)
  - Character creation in under 5 minutes
  - Rules that fit in memory after one read

EXCELLENT ONE-PAGE RPG EXAMPLES TO STUDY:
  - Lasers & Feelings (John Harper): 2 stats, 1 mechanic, 1 page
  - Honey Heist (Grant Howitt): Bear criminals stealing honey
  - The Witch is Dead (Grant Howitt): Animals avenging their witch
  - One-Page Dungeon Contest entries (annual competition)

LAYOUT TIPS:
  - Use columns for readability
  - Bold key terms
  - Use icons or simple graphics to break up text
  - Font size no smaller than 8pt
  - Leave enough whitespace to not feel cramped
```

## Playtest Feedback

```
PLAYTEST STAGES:

ALPHA TESTING (Designer's table):
  You GM. You observe. You note every moment that:
  - Feels slow or boring
  - Creates confusion about rules
  - Produces unexpected outcomes
  - Makes players smile or lean forward
  - Causes frustration

BETA TESTING (Other GMs, your guidance):
  Other GMs run the game with your rules. You observe or get reports.
  Key questions:
  - What rules did they get wrong? (Your rules writing failed there)
  - What rules did they house-rule? (Your design may have a gap)
  - When did they have to improvise? (Missing procedures)

BLIND TESTING (No designer involvement):
  Groups play with only the written rules.
  This is the real test. If they can't play from the book alone,
  the book needs revision.

PLAYTEST FEEDBACK FORM:
  1. What was the most fun part of the session?
  2. What was the least fun part?
  3. Were any rules confusing? Which ones?
  4. Did anything feel unbalanced? (Too powerful/too weak)
  5. How long did the session take? Was pacing good?
  6. Would you play again?
  7. What would you change?
  8. Rate 1-10: Character creation, Core mechanic, Combat,
     Non-combat encounters, Overall fun
```

## Publishing

```
DRIVETHRU RPG:
  - Largest TTRPG marketplace
  - PDF and print-on-demand options
  - Revenue split: ~65% to creator (for exclusive), ~60% non-exclusive
  - Free to list; they handle payments and delivery
  - Community content programs (DMs Guild for D&D)
  - Visibility through categories, tags, and promoted listings

ITCH.IO:
  - Creator-friendly platform
  - Set your own pricing (including pay-what-you-want)
  - 0-10% platform fee (you choose)
  - Strong indie/creative community
  - Bundles and game jams for visibility
  - Less discoverability than DriveThruRPG

SELF-PUBLISHING CONSIDERATIONS:
  - Layout: Affinity Publisher, InDesign, or Canva (free option)
  - PDF: Standard format, low cost, immediate delivery
  - Print on demand: DriveThruRPG, Lulu, Amazon KDP
  - Offset printing: For Kickstarter fulfillment (500+ unit runs)
  - Pricing: Research comparable products. $5-15 for PDFs,
    $20-50 for physical books

BUILDING AN AUDIENCE:
  - Share development process publicly (social media, blog)
  - Participate in RPG communities (Reddit, Discord, forums)
  - Run your game at conventions and online
  - Offer free quickstart rules
  - Create actual play content (podcasts, streams)
```

## Practice Exercises

### Exercise 1: Resolution Test
Pick three different resolution mechanics. Run the same encounter with each. Which creates the fiction you want? Which is fastest? Which produces the most interesting decisions?

### Exercise 2: Character Creation Sprint
Design a character creation system. Test it with 3 people who've never seen the game. Target: playable character in 15 minutes. Every question they ask reveals a design gap.

### Exercise 3: One-Page RPG
Design a complete one-page RPG in one sitting. Play it that same day. This forces you to cut to essentials and teaches you what's truly necessary.

### Exercise 4: GM from Someone Else's Rules
Run a game written by someone else. Note every moment you need to check the book, improvise a ruling, or wish a rule existed. Apply these lessons to your own design.

### Exercise 5: Encounter Stress Test
Design one combat encounter for your system. Run it 3 times with different groups. Track: time to complete, decisions per turn, moments of excitement, moments of boredom.

### Exercise 6: Safety Tool Integration
Design a session zero procedure for your game that naturally incorporates safety tools (Lines and Veils, X-Card, Stars and Wishes). Test whether it creates better table experiences.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Tabletop Rpg Designer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with tabletop rpg designer for a mid-size project."

**Output:** A complete tabletop rpg designer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
