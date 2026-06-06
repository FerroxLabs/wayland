---
name: game-narrative-writer
description: |
  Interactive storytelling for games covering branching narratives, dialogue trees, environmental storytelling, lore design, character writing for games, quest design, player agency, world-building for interactive media, and narrative integration with game mechanics. Use when the user asks about game narrative writer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "game-design creative-writing writing"
  category: "game-development"
  subcategory: "game-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Game Narrative Writer

## When to Use

**Use this skill when:**
- The user wants to write branching narratives, dialogue trees, or quest storylines for a game
- The user needs help with environmental storytelling, lore design, or world-building for interactive media
- The user is designing player agency and consequence systems for narrative-driven gameplay
- The user wants guidance on writing game characters (companions, NPCs, antagonists, silent protagonists)
- The user needs to plan narrative structure (linear, foldback, hub-and-spoke, or systemic) for their game

**Do NOT use this skill when:**
- The user is writing a novel, screenplay, or non-interactive story (use the appropriate writing skill instead)
- The user needs narrative system architecture and documentation rather than story content (use narrative-designer instead)
- The user is designing game mechanics unrelated to story (use video-game-designer instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to game narrative writer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on game narrative writer
- User asks about game narrative writer best practices or techniques
- User wants a structured approach to game narrative writer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of game narrative writer

## Questions to Ask First

Before writing any game narrative, clarify:

1. **What genre is the game?** (RPG, adventure, action, horror, puzzle, visual novel, walking simulator)
2. **How central is narrative?** (Story-driven, narrative-enhanced, or mechanics-first with story wrapper)
3. **What is the core mechanic?** (Narrative must serve and be served by gameplay)
4. **What is the player's role?** (Defined character, blank slate avatar, omniscient controller, multiple characters)
5. **Does the story branch?** (Linear, branching, open world, procedural)
6. **What is the narrative delivery method?** (Cutscenes, dialogue, environmental, audio logs, text)
7. **What is the emotional journey?** (The feeling the player should experience from start to finish)
8. **What is the scope?** (2-hour experience, 20-hour campaign, 100+ hour open world)

## Interactive Storytelling Fundamentals

```
GAME NARRATIVE IS NOT FILM OR LITERATURE:
  The player is an ACTIVE PARTICIPANT, not a passive audience.
  This fundamentally changes how stories are told.

KEY DIFFERENCES:
  Film: Writer controls pacing, sequence, and perspective.
  Games: Player controls pacing, may control sequence and perspective.

  Film: Character development through observation.
  Games: Character development through EXPERIENCE and CHOICE.

  Film: Tension from watching someone in danger.
  Games: Tension from BEING in danger.

  Film: Emotional beats are precisely timed.
  Games: Emotional beats happen when the player reaches them.

THE NARRATIVE DESIGNER'S CHALLENGE:
  Create a compelling story that works REGARDLESS of:
  - Player pace (speed-runners to completionists)
  - Player sequence (in non-linear games)
  - Player choice (in branching narratives)
  - Player engagement (some skip dialogue; some read every note)

FUNDAMENTAL RULE:
  Never take control away from the player to tell your story
  unless the moment absolutely demands it. The best game narratives
  happen THROUGH gameplay, not despite it.
```

## Branching Narratives

### Branch Structures

```
LINEAR:
  A -> B -> C -> D -> End
  No choices. Story is fixed.
  Best for: Short experiences, action games, guided narratives
  Example: Uncharted, The Last of Us (mostly linear)

BRANCHING (TREE):
  A -> B1 -> C1 -> End 1
    -> B2 -> C2 -> End 2
         -> C3 -> End 3
  Each choice creates a new path.
  Problem: Content explosion (2^n paths for n choices)
  Best for: Visual novels, short branching experiences
  Example: Until Dawn, Detroit: Become Human

FOLDBACK (BRANCHING WITH CONVERGENCE):
  A -> B1 -> C (common) -> D1 -> End
    -> B2 ->            -> D2 ->
  Choices diverge then converge at key story beats.
  Pro: Manageable content, player feels agency
  Con: Players may notice the convergence ("my choices didn't matter")
  Best for: Most narrative games (this is the industry standard)
  Example: Mass Effect, The Witcher

MODULAR / HUB AND SPOKE:
  Central hub -> Quest A (self-contained story)
             -> Quest B
             -> Quest C
  Player completes modules in any order, returns to hub.
  Best for: Open-world RPGs, mission-based games
  Example: Skyrim, Fallout

DYNAMIC / SYSTEMIC:
  Story emerges from game systems interacting.
  Not pre-written, but generated by player actions within systems.
  Best for: Simulation games, roguelikes, emergent narrative
  Example: Dwarf Fortress, RimWorld, Crusader Kings
```

### Managing Branch Complexity

```
THE CONTENT EXPLOSION PROBLEM:
  If every choice creates a unique path, 10 binary choices
  create 1,024 unique paths. This is unproducible.

SOLUTIONS:

STATE FLAGS (not full branches):
  Track choices as variables, not separate scenes.
  "Player saved the merchant: TRUE/FALSE"
  Then reference that flag in future dialogue:
  IF saved_merchant: "Thank you for saving me!"
  ELSE: [NPC doesn't appear]

  This creates the FEELING of branching without separate paths.

QUALITY-BASED NARRATIVE:
  Track numerical qualities (reputation, morality, relationships).
  Content gates based on thresholds, not specific choices.
  "If Reputation > 50: People trust you."
  Many different choices can lead to the same quality threshold.

LATE-BRANCHING:
  Keep the middle of the game mostly convergent.
  Reserve major branches for the final act.
  Players remember the ending most vividly.

COSMETIC vs. STRUCTURAL BRANCHING:
  Cosmetic: Dialogue changes, NPC reactions differ, but story
  proceeds similarly.
  Structural: Entire plot lines, locations, or characters change.
  Most games use 80% cosmetic, 20% structural branching.

THE ILLUSION OF CHOICE:
  Sometimes the story goes to the same place regardless.
  This is fine IF the player doesn't notice.
  If both options lead to the same outcome, make the JOURNEY
  feel different even if the destination is the same.
```

## Dialogue Trees

### Dialogue System Design

```
DIALOGUE NODE STRUCTURE:

  NPC_LINE: "I need someone to retrieve the crystal from the cave."

  PLAYER_OPTIONS:
    [1] "I'll do it. What's the pay?"
        -> RESPONSE: "500 gold, and my eternal gratitude."
           -> SET_FLAG: quest_accepted = true
           -> NEXT_NODE: quest_details

    [2] "That cave is dangerous. What's in it for me?"
        -> RESPONSE: "More than you'd earn in a month. Plus, the
            alternative is that the village is destroyed."
           -> PLAYER_OPTIONS:
              [2a] "Fine. I'll do it."
              [2b] "Find someone else."

    [3] [IF charisma > 15] "Sounds like you're desperate. I want 1000 gold."
        -> RESPONSE: "You drive a hard bargain... but I need this done."
           -> SET_FLAG: quest_reward = 1000

    [4] "I'm not interested." [END CONVERSATION]

DIALOGUE WRITING PRINCIPLES:
  1. Player options should reflect genuinely different approaches
     (not just three ways to say "yes")
  2. Each NPC should have a distinct voice and vocabulary
  3. Dialogue should reveal character, not just convey information
  4. Keep individual lines SHORT for games (2-3 sentences maximum)
  5. Read all dialogue aloud -- if it sounds unnatural, rewrite
  6. Respect the player's time -- get to the point
  7. Gating options behind skills/stats rewards character builds
```

### Writing Game Characters

```
CHARACTER WRITING FOR GAMES vs. OTHER MEDIA:

IN FILM: Characters reveal themselves through dialogue and action.
IN GAMES: Characters also reveal themselves through INTERACTION
          with the player across potentially hundreds of encounters.

COMPANION CHARACTERS:
  - Must be interesting across MANY hours (not just one scene)
  - Need opinions on player actions (reactive, not passive)
  - Should have their own goals that sometimes conflict with the player
  - Relationship should evolve based on player behavior
  - Need enough dialogue for the full game duration
  - Idle/ambient dialogue prevents companions from feeling like furniture

NPC DESIGN (NON-COMPANION):
  - Memorable NPCs need ONE strong defining trait (voice, look, behavior)
  - They should serve a clear function (quest giver, vendor, lore source)
  - Even minor NPCs benefit from personality
  - Avoid "exposition dump" NPCs -- convey information through
    character-appropriate dialogue

ANTAGONIST DESIGN:
  - The best game villains think they're the hero of their own story
  - Personal connection to the player character creates stakes
  - The player should encounter the villain's IMPACT before meeting them
  - Boss fights should be narratively satisfying, not just mechanically
  - Let the player understand the villain's perspective (not agree with it)

THE SILENT PROTAGONIST:
  If your player character doesn't speak (Link, Gordon Freeman):
  - Other characters must carry ALL the dialogue
  - Environmental storytelling becomes critical
  - NPCs should react to the player's actions, not their words
  - The player projects their own personality onto the character
```

## Environmental Storytelling

```
TELLING STORIES WITHOUT WORDS:

ENVIRONMENTAL STORYTELLING TECHNIQUES:

1. ARRANGEMENT:
   A room tells a story through how objects are placed.
   - An overturned chair, scattered papers, and an open window
     suggest a hasty escape.
   - A child's drawing on a refrigerator in an abandoned house
     tells you a family lived here.

2. CONTRAST:
   Juxtapose expectation with reality.
   - A beautiful garden surrounding a burned house.
   - A cheerful children's classroom covered in dust and cobwebs.

3. PROGRESSION:
   Show change over time through the environment.
   - Walking through increasingly desperate living conditions
     in a collapsing civilization.
   - Graffiti that tells its own story across a neighborhood.

4. PERSONAL ARTIFACTS:
   Diaries, letters, photos, recordings, emails.
   Players who explore deeply are rewarded with richer narrative.
   These should be FINDABLE but not required for the main story.

5. VISUAL HIERARCHY:
   Important narrative elements should draw the eye naturally.
   Use lighting, color, composition, and placement to guide
   attention to storytelling moments.

6. SHOW THE AFTERMATH:
   Don't show the event -- show what it left behind.
   The player's imagination fills in the details more powerfully
   than a cutscene could.

ENVIRONMENTAL STORYTELLING RULES:
  - Every environment should suggest a history
  - Details should be internally consistent
  - The story should be discoverable but not mandatory
  - Reward curiosity without punishing players who don't explore
  - Less is more: a single powerful detail beats a cluttered scene
```

## Lore Design

```
BUILDING A LORE SYSTEM:

THE ICEBERG PRINCIPLE:
  Write 10x more lore than the player will ever see.
  This depth creates consistency and richness.
  The player sees the tip; the rest supports it.

LORE DELIVERY METHODS (Ranked by engagement):
  1. Through gameplay (learning by experiencing) -- BEST
  2. Through environmental storytelling
  3. Through NPC dialogue (in character, not exposition)
  4. Through collectible documents (journals, logs, emails)
  5. Through codex/database entries (for deep-divers) -- LEAST

LORE DESIGN PRINCIPLES:
  - Lore should enhance gameplay, not replace it
  - Every lore element should connect to something the player
    experiences (abstract history with no gameplay relevance = skip)
  - Contradictions and mysteries are MORE interesting than
    complete answers
  - Multiple perspectives on the same event create depth
  - Leave some things unexplained (preserves sense of wonder)

WORLD-BUILDING DOCUMENT STRUCTURE:
  1. Cosmology: How the world works (physics, magic, technology)
  2. History: Key events that shaped the current state
  3. Geography: Places and their significance
  4. Factions: Groups, their goals, conflicts, and relationships
  5. Culture: How people live, what they believe, social structures
  6. Technology/Magic: What is possible and what are the limits
  7. Current Conflicts: The tensions that drive the narrative
```

## Quest Design

```
QUEST STRUCTURES:

THE BASIC QUEST:
  Hook -> Objective -> Obstacle -> Resolution -> Reward

  HOOK: Why does the player care? (Personal motivation, NPC request,
  discovered mystery, environmental pull)
  OBJECTIVE: What needs to be done? (Clear, specific, achievable)
  OBSTACLE: What makes it difficult? (Combat, puzzle, moral dilemma,
  travel, information gathering)
  RESOLUTION: How does it end? (Multiple possible outcomes if branching)
  REWARD: What does the player get? (XP, items, narrative payoff,
  new abilities, relationship changes, world state changes)

QUEST TYPES:
  Fetch quest: Get thing, bring it back (boring alone, works when
  the CONTEXT is interesting)
  Investigation: Gather clues, solve mystery (requires good info design)
  Escort: Protect NPC (requires good companion AI)
  Defense: Protect location/object (wave-based encounters)
  Infiltration: Stealth into hostile territory (requires stealth mechanics)
  Moral dilemma: Choose between imperfect options (the best quests)
  Multi-stage: Quest evolves as you complete stages (the most satisfying)

QUEST DESIGN PRINCIPLES:
  1. The quest should make narrative sense (not just be a gameplay task)
  2. Multiple solutions for key quests (combat, stealth, diplomacy)
  3. Consequences that matter (quest outcomes affect the world)
  4. Subvert expectations occasionally (the obvious villain isn't,
     the treasure isn't what you expected, the rescue mission
     becomes something else)
  5. Side quests should feel as crafted as main quests (just shorter)
  6. Avoid quest bloat -- quality over quantity
```

## Player Agency

```
TYPES OF PLAYER AGENCY:

MECHANICAL AGENCY:
  Choice in HOW to approach challenges (combat vs. stealth vs. diplomacy).
  This is the baseline. Games without this feel restrictive.

NARRATIVE AGENCY:
  Choice in how the STORY unfolds (who lives, who dies, what ending).
  This requires branching narrative infrastructure.

EXPLORATORY AGENCY:
  Choice in WHERE to go and WHAT to investigate.
  Open worlds provide this; linear games may restrict it.

EXPRESSIVE AGENCY:
  Choice in HOW the player character looks, acts, and speaks.
  Character customization, dialogue tone options, playstyle.

AGENCY PRINCIPLES:
  1. Player choices should have visible consequences
     (If no one notices, it doesn't feel like a choice)
  2. Respect the player's intelligence -- don't mark the "right" answer
  3. Let players fail in interesting ways (failure can be agency too)
  4. Irreversible choices create the most dramatic moments
  5. Smaller, frequent choices are more engaging than rare big ones
  6. Acknowledge player choices through NPC reactions, world changes,
     and narrative callbacks

THE AGENCY PARADOX:
  Maximum freedom can feel directionless.
  Some constraint creates better stories than total freedom.
  The art is finding the right amount of guided choice:
  not a hallway (no choice) and not an empty field (too much choice)
  but a garden with paths (structured freedom).
```

## Practical Workflow

```
GAME NARRATIVE WRITING PROCESS:

1. STORY BIBLE (Pre-production)
   - World overview, lore, factions, key characters
   - Main story arc (beginning, middle, end)
   - Tone and theme documentation
   - Relationship to gameplay mechanics

2. STORY OUTLINE (Pre-production)
   - Beat sheet for main story (every major plot point)
   - Side quest outlines
   - Branching points and consequences
   - Character arcs mapped to game progression

3. SCRIPT WRITING (Production)
   - Dialogue for all NPCs and scenes
   - Barks (short reactive lines -- combat, discovery, idle)
   - Environmental text (signs, books, terminals)
   - UI text (menus, tutorials, item descriptions)
   - Cinematics/cutscene scripts

4. IMPLEMENTATION (Production)
   - Work with programmers to implement dialogue systems
   - Set state flags and condition logic
   - Trigger environmental storytelling elements
   - Voice direction (if applicable)

5. ITERATION (Testing)
   - Playtest for narrative coherence
   - Check all branches and conditions
   - Verify consequences propagate correctly
   - Get feedback on pacing and engagement
   - Cut what doesn't serve the experience
```

## Practice Exercises

### Exercise 1: Environmental Scene
Design a room that tells a complete story without any text or dialogue. List every object and its placement. What story does the arrangement convey?

### Exercise 2: Branching Dialogue
Write a dialogue tree for a quest-giver NPC with at least 3 player approaches (helpful, aggressive, deceptive). Each should lead to a different quest experience while remaining producible.

### Exercise 3: Quest Subversion
Take a standard retrieve quest. Now subvert it -- the item isn't what it seems, the quest-giver has hidden motives, or the objective changes mid-quest. Make the familiar feel fresh.

### Exercise 4: Character Voice Test
Write the same piece of exposition delivered by three different NPCs. Each should have a distinct voice, vocabulary, and attitude while conveying the same core information.

### Exercise 5: Agency Audit
Play through a narrative game. At every choice point, ask: "Did this feel meaningful? Did I see consequences?" Map the real vs. perceived agency. What creates the feeling of agency even when outcomes converge?

### Exercise 6: Lore Iceberg
Create a piece of lore 10 levels deep. The player sees level 1 (a mysterious artifact). Levels 2-10 explain its history, significance, and connections. Show how the depth supports the surface even when unseen.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Game Narrative Writer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with game narrative writer for a mid-size project."

**Output:** A complete game narrative writer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
