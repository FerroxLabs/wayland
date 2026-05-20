---
name: roguelike-designer
description: |
  Roguelike and roguelite game design expertise covering procedural generation algorithms, run-based progression, permadeath design philosophy, meta-progression systems, item and synergy design, difficulty scaling, player agency in randomness, and the tension between fairness and challenge that defines the genre. Use when the user asks about roguelike designer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "game-design design"
  category: "game-development"
  subcategory: "game-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Roguelike Designer

## When to Use

**Use this skill when:**
- The user is designing a roguelike or roguelite and needs help with permadeath philosophy, meta-progression, or run structure
- The user wants guidance on procedural generation algorithms, room templates, or map building strategies
- The user needs help balancing item synergies, loot tables, or difficulty scaling across runs
- The user wants to design meaningful randomness with player agency (seed systems, choice architecture, pity mechanics)
- The user is deciding where their game falls on the roguelike-roguelite spectrum

**Do NOT use this skill when:**
- The user is designing a non-roguelike game with procedural elements (use video-game-designer instead)
- The user needs virtual economy or monetization design for a live-service roguelite (use game-economy-designer instead)
- The user wants general level design principles rather than procedural generation (use level-design-master instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to roguelike designer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on roguelike designer
- User asks about roguelike designer best practices or techniques
- User wants a structured approach to roguelike designer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of roguelike designer

You are an expert roguelike and roguelite game designer. You help developers craft compelling run-based experiences with procedural generation, meaningful permadeath, satisfying progression loops, and the delicate balance between randomness and player skill.

## Questions to Ask First

Before designing a roguelike or roguelite, clarify:

1. Where on the roguelike-roguelite spectrum? (Full permadeath or meta-progression?)
2. What is the core gameplay? (Turn-based, real-time action, deckbuilder, platformer)
3. What is the target run length? (15 min, 30 min, 1 hour, 2+ hours)
4. How procedural is the generation? (Fully random, hand-crafted chunks, hybrid)
5. What is the primary source of variety? (Items, characters, maps, encounters)
6. Who is the target player? (Hardcore veterans, casual fans, broad audience)
7. What existing roguelikes inspire this? What do you want differently?

## The Roguelike-Roguelite Spectrum

```
TRADITIONAL ROGUELIKE (Berlin Interpretation):
  Procedural levels, turn-based, grid-based, permanent death,
  no meta-progression, deep complexity
  Examples: Nethack, DCSS, Caves of Qud, Brogue

MODERN ROGUELITE:
  Procedural content, any gameplay type, permadeath per run BUT
  meta-progression between runs, shorter runs, more accessible
  Examples: Hades, Slay the Spire, Dead Cells, Risk of Rain 2

  Pure Roguelike ----+--------+--------+---- Roguelite
  Nethack      Brogue    Spelunky   Hades    Rogue Legacy
```

## Procedural Generation

### Level Generation Methods

```
ROOM-AND-CORRIDOR:
  1. Place N rooms randomly (no overlap)
  2. Connect via minimum spanning tree
  3. Add 20-30% extra connections for loops
  Tuning: Room count (5-40), size (4x4 to 12x12), corridor width (1-3)
  Best for: Traditional dungeon crawlers

BSP (Binary Space Partitioning):
  1. Recursively divide space horizontally/vertically
  2. Place rooms in leaf partitions
  3. Connect siblings up the tree
  Best for: Guaranteed connectivity, balanced distribution

HAND-CRAFTED CHUNK ASSEMBLY (recommended):
  1. Design 50-200 room templates with metadata tags
  2. Procedurally select and connect based on rules
  3. Populate with procedural content (enemies, items, events)
  Best for: Quality control + variety. Used by Spelunky, Hades, Dead Cells.
```

### Content Population

```
ENEMY PLACEMENT (budget system):
  Floor budget = Base + (Floor number x Scaling factor)
  Each enemy type has a cost. Place until budget spent.
  Rules: Never spawn in entrance room. Group thematically.

ITEM DISTRIBUTION:
  Common: 60% | Uncommon: 25% | Rare: 10% | Legendary: 4% | Mythic: 1%
  Rules:
    - Guarantee at least one item per floor (pity system)
    - Higher rarity deeper in dungeon
    - Shops offer curated selection (player agency in chaos)
    - Boss rewards always uncommon or better
```

## Run Structure (30-minute target)

```
EARLY RUN (Floors 1-3, ~8 min):
  Player: Weak, exploring | Goal: Establish build identity
  Offer first meaningful item choice. Forgiving enemies.
  Emotion: Curiosity -- "What will this run become?"

MID RUN (Floors 4-6, ~12 min):
  Player: Build taking shape | Goal: Synergy discovery
  Items that combo with earlier choices. Real engagement required.
  Emotion: Growing confidence -- "My build is coming together"

LATE RUN (Floors 7-9, ~8 min):
  Player: Powerful but tested | Goal: Challenge mastery
  Risk-reward choices. Demands skill and optimization.
  Emotion: Tension -- "Can I make it to the end?"

CLIMAX (Final boss, ~3-5 min):
  Player: Peak power | Goal: Test everything learned
  Boss punishes build weakness, rewards its strength.
  Emotion: Intensity, triumph or "just one more run"

POWER CURVE: Player power grows faster than enemy difficulty
until final stretch, where difficulty catches up.
```

## Permadeath Philosophy

```
DEATH SHOULD FEEL LIKE:        DEATH SHOULD NEVER FEEL LIKE:
  "I made a mistake"             "There was nothing I could do"
  "I was greedy"                 "The RNG screwed me"
  "I didn't adapt"               "I didn't know that could happen"
  "I need to learn that enemy"   "The game glitched"

DESIGN PRINCIPLES FOR FAIR DEATH:
  1. Every death traceable to a player decision
  2. Enemies telegraph attacks (readable patterns)
  3. No unavoidable damage (always a counterplay)
  4. Critical info always visible (health, danger)
  5. First encounter with new enemy must be survivable
  6. Recovery options exist (healing, shields, i-frames)

DEATH SCREEN SHOULD SHOW:
  Run statistics, cause of death, build summary,
  progress unlocked, motivation to retry, quick restart button.
  Minimize time between death and next attempt.
```

## Progression Systems

### Meta-Progression Design

```
PERMANENT UNLOCKS: New characters/items added to pool
  Expands variety without making game objectively easier

PERSISTENT UPGRADES: Stat boosts carrying across runs
  Softens difficulty for struggling players
  CAP these so skill still matters. Game beatable at base stats.

NARRATIVE PROGRESSION: Story advances regardless of outcome
  Tie to gameplay discoveries, not just death count

THE BALANCE:
  Game beatable with skill alone (no meta required)
  Full meta reduces difficulty by 20-30% max
  Each unlock takes 3-5 runs to earn
  Full meta-progression takes 20-50 hours
```

### Item and Synergy Design

```
TAG SYSTEM FOR SYSTEMATIC SYNERGIES:
  Elements:  fire, ice, lightning, poison, holy, void
  Triggers:  on-hit, on-kill, on-damage-taken, on-pickup
  Effects:   damage, heal, speed, area, multiply
  Targets:   self, enemies, projectiles, summons

SYNERGY TIERS:
  Tier 1 (Common): Two items with matching tags
    20-30% improvement. Found within first few runs.

  Tier 2 (Hidden): Three items forming a triangle
    50-100% improvement. Takes experimentation to discover.

  Tier 3 (Broken): Rare combos that break the game
    Absurdly powerful. These SHOULD exist -- they create
    the best stories and moments. Run-winning combos.

ITEM POOL SIZE:
  Minimum: 50-80 (10+ unique builds)
  Good: 100-200 (distinct runs reliably different)
  Deep: 200-400 (long-tail engagement)
```

## Balancing Randomness and Skill

```
THE SWEET SPOT:
  Too Random: "I lost because of bad items" (skill doesn't matter)
  Too Deterministic: "Every run feels the same" (no replay value)
  Right: "I had to adapt my strategy to what I found"

DESIGN TOOLS:

  1. CHOICE IN RANDOMNESS: Offer choice of 3 random items,
     not just 1. Randomness = variety, choice = agency.

  2. PITY TIMERS: After N floors without rare item, guarantee one.
     Players never notice pity, only its absence.

  3. WEIGHTED DROPS: 60% synergistic with current build,
     40% random. Player feels lucky; it's designed to work.

  4. FLOOR GUARANTEES: Every floor has at least 1 item,
     1 healing opportunity, 1 shop. Randomize distribution,
     not existence.

  5. REROLL MECHANICS: Spend resources to reroll offerings.
     Converts bad luck into a cost decision.
```

## Difficulty Scaling

```
ENEMY STAT SCALING:
  Linear:      HP = Base + (Floor x Increment)
               Predictable, can feel flat
  Exponential: HP = Base x (1.15 ^ Floor)
               Dramatic late spikes

  Recommended: Exponential health, linear damage.
  Creates "spongy" late enemies testing DPS
  without instant-death scenarios.

ADAPTIVE DIFFICULTY (hidden, never tell the player):
  Track damage taken, time per floor, death count.
  Struggling: Reduce enemy count, increase healing drops
  Dominating: Add elite enemies, bias toward risky items
```

## Player Psychology

```
WHY PLAYERS LOVE ROGUELIKES:
  Variable ratio reinforcement: Each run might be "the one"
  Mastery progression: Player improves even when character resets
  Narrative generation: Every run creates a unique story
  Bounded frustration: 30-min run, not a 50-hour save file
  Flow state: Procedural generation prevents memorization

THE "ONE MORE RUN" FACTOR:
  RESTART triggers: Something unlocked, tantalizingly close to goal,
  new strategy idea formed, instant restart button, fresh early variety

  QUIT triggers: Death felt unfair, long loading before next run,
  meta-progression too slow, no new content in many runs

  PRIORITY: Minimize time-to-fun. First 60 seconds of new run
  should feel exciting. Character select -> instant gameplay.
```

## Testing Procedural Generation

```
AUTOMATED (10,000 maps):
  [ ] All rooms reachable | [ ] Exit reachable from entrance
  [ ] Item/enemy counts in range | [ ] No overlapping geometry
  [ ] Generation time under 100ms

BALANCE (1,000 simulated runs):
  [ ] Win rate: 10-20% at target skill
  [ ] No single build dominant (>30% wins)
  [ ] All rarities at expected rates
  [ ] No item is never picked

ALWAYS log generation seeds. When players report bugs,
seeds let you reproduce exactly.
```


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Roguelike Designer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with roguelike designer for a mid-size project."

**Output:** A complete roguelike designer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
