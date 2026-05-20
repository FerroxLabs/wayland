---
name: video-game-strategy-guide-writer
description: |
  Provides an intermediate framework for writing structured video game
  strategy guides: mechanic explanation patterns, progression charts,
  decision tree formats for branching content, boss encounter breakdowns,
  and resource optimization tables. Produces a reusable guide structure
  template adaptable to any game genre. Use when the user wants to write
  a strategy guide for a video game, needs a framework for explaining
  game mechanics, wants to create progression charts or decision trees,
  or needs to structure guide content for readability. Do NOT use for
  board game selection (use board-game-selection-guide), tabletop RPG
  campaigns (use tabletop-rpg-campaign-builder), or game streaming
  setup (use game-streaming-setup-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "guide template writing step-by-step"
  category: "hobbies-crafts"
  subcategory: "games-puzzles"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Video Game Strategy Guide Writer

## When to Use

- User wants to write a strategy guide for a video game
- User needs a template for explaining game mechanics clearly
- User wants to create progression charts, build guides, or tier lists
- User asks about structuring guide content for different game genres (RPG, FPS, strategy, survival)
- User wants to create decision trees for branching game content
- User needs a framework for boss encounter breakdowns or puzzle solutions
- User wants to organize guide content for readability and navigation
- Do NOT use when: user wants board game selection (use `board-game-selection-guide`), user wants tabletop RPG campaign design (use `tabletop-rpg-campaign-builder`), user wants streaming setup (use `game-streaming-setup-guide`), user wants creative fiction writing

## Process

1. **Gather the guide brief.** Ask the user for:
   - Game title and genre: RPG, action RPG, FPS, real-time strategy, turn-based strategy, survival, puzzle, platformer, fighting, racing, MOBA, battle royale
   - Guide scope: full game walkthrough, specific mechanic guide (builds, crafting, combat), boss guide, beginner's guide, advanced optimization guide
   - Target audience: absolute beginners (never played the genre), returning players, experienced players optimizing performance
   - Content depth: quick reference (tables and charts), detailed walkthrough (step-by-step), analysis and theory (why strategies work)
   - Format: text-only, text with annotated screenshots, video script with timestamps

2. **Select the guide structure based on genre.** Use the genre-structure mapping:

   | Game Genre | Primary Structure | Key Sections |
   |------------|-------------------|--------------|
   | RPG/Action RPG | Progression-based | Character builds, stat priorities, equipment progression, quest walkthrough, boss guides |
   | FPS/TPS | Mechanic + map-based | Weapon comparisons, map callouts, positioning guides, sensitivity settings, team compositions |
   | Real-time Strategy | Decision tree + build order | Opening build orders, unit counters, economic benchmarks, map-specific strategies |
   | Turn-based Strategy | Tier list + synergy | Unit/character tier lists, team composition synergies, resource management, turn optimization |
   | Survival/Crafting | Progression ladder | Early/mid/late game priorities, crafting recipes ranked by value, base layout guides |
   | Puzzle | Solution patterns | Mechanic explanation, solution logic, common patterns, difficulty spike walkthroughs |
   | Fighting | Frame data + matchup | Move lists with properties, combo routes, matchup charts, neutral game strategies |
   | MOBA | Role-based + meta | Champion/hero guides, role fundamentals, item builds, macro strategy, patch notes analysis |
   | Platformer | Level-by-level | Movement techniques, level walkthroughs, collectible locations, speedrun routes |

3. **Build the mechanic explanation pattern.** For each game mechanic the guide covers:

   **The 4-Part Mechanic Explanation:**
   - **What it is:** One-sentence plain-language definition. No jargon. If the mechanic has an in-game name, state it and then explain what it actually does.
   - **Why it matters:** How this mechanic affects gameplay outcomes. What happens if you ignore it? What advantage does understanding it provide?
   - **How it works:** Step-by-step mechanical breakdown. Include numbers, formulas, or thresholds if applicable. Example: "Armor reduces incoming damage by [damage reduction formula]. At 100 armor, incoming physical damage is reduced by 50%."
   - **When to use it:** Situational application. In which scenarios does this mechanic matter most? When should a player prioritize it? When is it irrelevant?

4. **Create progression charts.** For games with character or gear progression:

   **The Progression Table format:**
   | Phase | Level/Stage | Priority 1 | Priority 2 | Priority 3 | Avoid |
   |-------|-------------|------------|------------|------------|-------|
   | Early | 1-20 | [action] | [action] | [action] | [trap] |
   | Mid | 20-50 | [action] | [action] | [action] | [trap] |
   | Late | 50+ | [action] | [action] | [action] | [trap] |

   - Each row represents a game phase (early, mid, late, endgame)
   - Priorities are ranked actions the player should focus on
   - The "Avoid" column lists common mistakes or traps for that phase
   - Include specific numerical benchmarks: "By level 20, your character should have approximately X health and Y damage output"

5. **Design decision trees for branching content.** For games with meaningful choices:

   **The Decision Node format:**
   ```
   [Decision Point]: [What the player must choose]
   |
   |-- Option A: [choice name]
   |   Result: [immediate consequence]
   |   Long-term: [how this affects the rest of the game]
   |   Best for: [which playstyle or build benefits]
   |
   |-- Option B: [choice name]
   |   Result: [immediate consequence]
   |   Long-term: [how this affects the rest of the game]
   |   Best for: [which playstyle or build benefits]
   |
   |-- Option C (if applicable): [choice name]
   |   Result: [immediate consequence]
   |   Long-term: [how this affects the rest of the game]
   |   Best for: [which playstyle or build benefits]
   ```

   Include a "recommended for first playthrough" note if one option is clearly more forgiving for new players.

6. **Build boss encounter breakdowns.** For combat-focused games:

   **The Boss Breakdown format:**
   | Element | Detail |
   |---------|--------|
   | Name | [boss name] |
   | Location | [where the encounter takes place] |
   | Recommended level/gear | [minimum and recommended thresholds] |
   | Phase count | [number of distinct phases] |

   **Phase-by-phase breakdown:**
   | Phase | Health Range | Key Attacks | Safe Response | Punish Window |
   |-------|-------------|-------------|---------------|---------------|
   | 1 | 100%-70% | [attack name]: [what it does] | [how to avoid it] | [when to deal damage] |
   | 2 | 70%-30% | [new attacks added] | [adjusted strategy] | [adjusted windows] |
   | 3 | 30%-0% | [enrage or final patterns] | [survival priority] | [final push strategy] |

   - Include a "common mistakes" section: what causes most players to fail this encounter
   - Include a "gear check" note: what stats or equipment make the fight significantly easier

7. **Create comparison tables for builds and loadouts.** For games with character customization:

   **The Build Comparison format:**
   | Attribute | Build A | Build B | Build C |
   |-----------|---------|---------|---------|
   | Playstyle | [description] | [description] | [description] |
   | Difficulty | [easy/medium/hard] | [easy/medium/hard] | [easy/medium/hard] |
   | Strengths | [what it does well] | [what it does well] | [what it does well] |
   | Weaknesses | [what it struggles with] | [what it struggles with] | [what it struggles with] |
   | Key stats | [stat priorities] | [stat priorities] | [stat priorities] |
   | Key gear | [critical equipment] | [critical equipment] | [critical equipment] |
   | Best for | [content type] | [content type] | [content type] |
   | Beginner-friendly | [yes/no + why] | [yes/no + why] | [yes/no + why] |

8. **Structure the guide for navigation.** Organize the complete guide:
   - Table of contents with anchor links or section numbers
   - Quick-start section: the 5 most important things a new player needs to know, in a numbered list
   - Glossary: define all game-specific terms used in the guide
   - Each section should be independently readable (a player looking for boss strategies should not need to read the crafting section first)
   - Version tracking: note the game version the guide was written for, as patches change mechanics

## Output Format

```
## Strategy Guide Framework: [Game Title]

### Guide Brief
- Game: [title], [genre]
- Guide scope: [scope]
- Target audience: [audience]
- Game version: [version number or patch]

### Quick-Start: 5 Things Every New Player Should Know
1. [Most important tip with reasoning]
2. [Second most important tip]
3. [Third]
4. [Fourth]
5. [Fifth]

### Mechanic Explanation: [Mechanic Name]
| Element | Content |
|---------|---------|
| What it is | [one-sentence definition] |
| Why it matters | [gameplay impact] |
| How it works | [step-by-step with numbers] |
| When to use it | [situational application] |

### Progression Chart
| Phase | Level/Stage | Priority 1 | Priority 2 | Priority 3 | Avoid |
|-------|-------------|------------|------------|------------|-------|
| Early | [range] | [action] | [action] | [action] | [trap] |
| Mid | [range] | [action] | [action] | [action] | [trap] |
| Late | [range] | [action] | [action] | [action] | [trap] |

### Decision Tree: [Decision Point]
[Decision Node format as above]

### Boss Guide: [Boss Name]
[Boss Breakdown format as above]

### Build Comparison
[Build Comparison table as above]

### Glossary
| Term | Definition |
|------|-----------|
| [term] | [plain-language definition] |
```

## Rules

1. NEVER assume the reader has played the game before. Every game-specific term must be defined on first use or listed in the glossary.
2. Mechanic explanations must include specific numbers, formulas, or thresholds when available. "Armor is important" is useless. "100 armor reduces physical damage by 50%" is actionable.
3. Progression charts must include an "Avoid" column. Knowing what NOT to do is as valuable as knowing what to do, and prevents common traps that frustrate new players.
4. Decision trees must present all options without declaring one "correct" -- different playstyles benefit from different choices. A "recommended for first playthrough" note is acceptable.
5. Boss breakdowns must be phase-by-phase, not a single block of text. Players need to know when patterns change.
6. Build comparisons must include a "Beginner-friendly" row. Advanced optimization builds that require precise execution are poor recommendations for new players.
7. Guide content must be version-tagged. Game patches change mechanics, and outdated guides are worse than no guide at all.
8. NEVER include copyrighted game text, dialogue, or assets in the guide. Describe mechanics and strategies in original language.
9. The quick-start section must be readable in under 2 minutes. If a player reads nothing else, these 5 tips should meaningfully improve their experience.
10. Each guide section must be independently navigable. A player searching for boss strategies should not need to read unrelated sections.

## Edge Cases

- **User wants to write a guide for a game still in early access:** Note that mechanics may change with updates. Recommend structuring the guide with a clear version tag at the top of every section and a change log at the bottom. Focus on core mechanics that are unlikely to change rather than specific numbers that may be rebalanced.

- **User wants to write a multiplayer competitive guide:** Include a "meta" (most effective tactics available) section that acknowledges the current competitive landscape. Note that the meta shifts with patches and that the guide should be updated accordingly. Include counter-strategies for popular builds and compositions, not just the dominant ones.

- **User wants to write a speedrun or optimization guide:** This is an advanced audience. Skip basic mechanic explanations. Focus on: route optimization (the fastest sequence of actions), glitch utilization (if applicable and within community rules), frame data and timing windows, and comparison of route variants with time estimates for each.

- **User wants a guide for a story-driven game (RPG with branching narrative):** Use the decision tree format heavily. Mark spoiler sections clearly (e.g., "[SPOILER: Act 3 consequences]"). Provide a "blind playthrough" recommendation for first-time players (play without the guide first, then use the guide for subsequent playthroughs to see alternate paths).

- **User wants to create a tier list:** Provide the tier list framework: S/A/B/C/D tiers with specific criteria for each tier (not just "S is the best"). Include: the criteria used for ranking (damage output, survivability, versatility, ease of use), the game version, and a note that tier lists are opinion-based and depend on the evaluator's criteria.

## Example

**Input:** "I want to write a beginner's strategy guide for an action RPG. The guide should cover character builds, the first 10 hours of gameplay, and the first major boss. The audience is players who are new to the game and the genre."

**Output:**

## Strategy Guide Framework: [Action RPG Title]

### Guide Brief
- Game: [Title], Action RPG
- Guide scope: Beginner guide -- first 10 hours, character builds, first boss
- Target audience: New to this game and the action RPG genre
- Game version: [version/patch number]

### Quick-Start: 5 Things Every New Player Should Know
1. **Choose a melee build for your first character.** Ranged and magic builds require more game knowledge to play effectively. Melee builds are more forgiving because you can take hits while learning enemy patterns.
2. **Do not spread your stat points evenly.** Focus 70% of stat points into your primary damage stat and 30% into your survivability stat. Even distribution creates a character that is mediocre at everything.
3. **Explore every area before moving to the next.** The game rewards thorough exploration with hidden equipment, resources, and experience. Rushing the main path under-levels your character.
4. **Upgrade your weapon before your armor.** Damage output determines how fast you end fights. A fight that lasts 10 seconds requires less healing than one that lasts 60 seconds, regardless of armor.
5. **Save your premium currency for inventory expansion.** The most common beginner mistake is spending premium currency on cosmetics. Inventory space lets you carry more resources and equipment, which translates to sustained progress.

### Mechanic Explanation: Damage Calculation
| Element | Content |
|---------|---------|
| What it is | The formula that determines how much health an enemy loses when you hit them |
| Why it matters | Understanding the formula tells you which stats and equipment to prioritize for maximum damage output |
| How it works | Base damage = (Weapon damage + Stat bonus) x Skill multiplier - Enemy defense. Stat bonus = Primary stat x 1.5 (rounded down). If the result is below 1, the hit does 1 damage minimum. Critical hits multiply the final result by 1.5x (or 2.0x with the critical damage passive). |
| When to use it | Use this formula to compare weapons: a weapon with 10 higher base damage but a slower attack speed may deal less total damage than a faster weapon. Calculate damage-per-second, not damage-per-hit. |

### Progression Chart: First 10 Hours
| Phase | Hours | Priority 1 | Priority 2 | Priority 3 | Avoid |
|-------|-------|------------|------------|------------|-------|
| Tutorial (0-1h) | 0-1 | Complete all tutorial missions (they give unique starter equipment) | Experiment with both melee and ranged attacks to find your preference | Talk to every NPC in the starting area (some give free items) | Do not skip the tutorial boss -- it teaches the dodge mechanic |
| Early exploration (1-4h) | 1-4 | Follow the main quest to unlock the crafting system | Gather every resource you find (crafting materials are scarce early) | Upgrade your weapon to +3 at the first forge | Do not sell crafting materials to vendors -- they are worth more as crafted items |
| Pre-boss preparation (4-8h) | 4-8 | Complete side quests in the first two zones (experience and gear rewards) | Craft the [specific armor set] for the fire resistance it provides (needed for the first boss) | Stock up on 10+ healing items from gathering or purchase | Do not attempt the first boss below level 12 -- the damage check is strict |
| First boss (8-10h) | 8-10 | Study the boss attack patterns in Phase 1 before committing to offense | Use the fire resistance gear crafted earlier | Keep 2 healing items in reserve for Phase 3 (the enrage phase) | Do not panic-heal at full health -- healing items are limited |

### Build Comparison: Starter Builds
| Attribute | Warrior (Melee) | Ranger (Ranged) | Mage (Caster) |
|-----------|-----------------|-----------------|----------------|
| Playstyle | Close range, high durability, moderate damage | Mid range, mobile, sustained damage | Long range, high burst, fragile |
| Difficulty | Easy -- can take hits while learning | Medium -- must maintain distance | Hard -- requires positioning and cooldown management |
| Strengths | Survives mistakes, strong against single targets | Safe damage from distance, good for exploration | Highest damage potential, area attacks |
| Weaknesses | Slow against groups, limited range | Lower burst damage, weaker against fast enemies | Very low health, punished hard for positioning errors |
| Key stats | Strength (70%), Vitality (30%) | Dexterity (70%), Vitality (30%) | Intelligence (70%), Vitality (30%) |
| Key gear | Heaviest armor available, highest-damage melee weapon | Medium armor, fastest ranged weapon | Light armor, highest magic power staff |
| Best for | First playthrough, learning the game, solo play | Second playthrough, group play | Experienced players, optimization runs |
| Beginner-friendly | Yes -- the most forgiving build for learning enemy patterns and game mechanics | Somewhat -- safe but requires more awareness | No -- high skill floor, not recommended for first character |

### Boss Guide: [First Major Boss Name]
| Element | Detail |
|---------|--------|
| Name | [Boss name] |
| Location | [Area name], end of the first major zone |
| Recommended level | 12 minimum, 14 recommended |
| Recommended gear | Fire resistance armor (+30% minimum), upgraded weapon (+3 or higher) |
| Phase count | 3 phases |

**Phase-by-Phase Breakdown:**
| Phase | Health Range | Key Attacks | Safe Response | Punish Window |
|-------|-------------|-------------|---------------|---------------|
| 1 (Learning) | 100%-70% | **Swipe**: horizontal arc in front. **Charge**: runs forward in a straight line. | Dodge sideways for Swipe (1 dodge). Dodge sideways for Charge (wait until it starts moving). | After Charge: the boss pauses for 3 seconds. Attack during this window. |
| 2 (Escalation) | 70%-30% | All Phase 1 attacks plus **Fire Breath**: cone attack in a 90-degree arc. **Ground Slam**: area damage around the boss. | Fire Breath: run behind the boss (the cone does not reach behind). Ground Slam: dodge backward (roll away). | After Fire Breath: 4-second recovery. This is the longest punish window in the fight. |
| 3 (Enrage) | 30%-0% | All Phase 2 attacks but 30% faster. **Enrage Roar**: buffs the boss's damage by 50%. | Same dodges but with tighter timing. Prioritize survival over damage. Use healing items here. | The punish windows are 1 second shorter. Only attack during Fire Breath recovery (now 3 seconds). |

**Common Mistakes:**
- Attacking during Phase 3 without a punish window (greed kills more players than the boss does)
- Not bringing fire resistance gear (Fire Breath deals 3x more damage without it)
- Using all healing items in Phase 1-2 and having none for the enrage phase

### Glossary
| Term | Definition |
|------|-----------|
| Stat bonus | The additional damage provided by your character's primary stat (Strength for melee, Dexterity for ranged, Intelligence for magic) |
| Punish window | The period after a boss attack where the boss is vulnerable and you can safely deal damage |
| Enrage | A boss mechanic that increases the boss's damage and speed when its health drops below a threshold |
| Fire resistance | A defensive stat that reduces damage from fire-type attacks by a percentage |
| DPS | Damage per second -- total damage output over time, accounting for attack speed |
