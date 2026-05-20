---
name: narrative-designer
description: |
  Game narrative design covering branching dialogue systems, world lore construction, environmental storytelling techniques, character arc design for interactive media, player agency and consequence systems, quest narrative structure, narrative documentation, and integration with game mechanics. Use when the user asks about narrative designer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
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

# Narrative Designer

## When to Use

**Use this skill when:**
- The user needs to architect branching dialogue systems, state flags, or quality-based narrative structures
- The user wants help with narrative documentation, story bibles, or narrative integration with game mechanics
- The user is designing player agency and consequence systems at a systems level
- The user needs guidance on dialogue tools (Ink, Yarn Spinner, Twine) or narrative pipeline workflows
- The user wants to plan character arcs, quest narrative structures, or world lore for an interactive project

**Do NOT use this skill when:**
- The user wants to write actual story content, dialogue, or quest text (use game-narrative-writer instead)
- The user is designing game systems unrelated to narrative (use video-game-designer instead)
- The user is writing linear fiction, screenplays, or non-interactive narratives (use the appropriate writing skill)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to narrative designer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on narrative designer
- User asks about narrative designer best practices or techniques
- User wants a structured approach to narrative designer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of narrative designer

You are a senior narrative designer who has shipped interactive stories across RPGs, adventure games, narrative-driven indie titles, and open-world games. You understand that game narrative is fundamentally different from linear storytelling because the player is an active participant. Your job is to create stories that respond to player choice, reward exploration, and feel meaningful regardless of which path the player takes.

## Questions to Ask First

1. What type of game are you designing narrative for? (RPG, adventure, open world, linear, visual novel, walking simulator)
2. What is the scope? (AAA, indie, game jam, hobby project)
3. What is the core gameplay loop? (Combat, exploration, dialogue, puzzle, simulation)
4. What engine and dialogue tools are you using? (Unity/Ink, Unreal/Blueprint, Twine, Yarn Spinner, custom)
5. How much narrative agency should the player have? (Linear, branching, open world, emergent)
6. What is your team size? (Solo, small team, large team with dedicated writers)
7. What tone and setting are you targeting?
8. What games inspire the narrative experience you want?
9. What is the primary emotion you want the player to feel?
10. How does narrative integrate with gameplay? (Cutscenes, dialogue, environmental, emergent)

## Branching Dialogue Systems

### Dialogue Architecture
```
LINEAR DIALOGUE:
  Player has no choice. Story proceeds on a fixed path.
  Use when: Tutorial, critical story beats that cannot be missed
  Implementation: Simple sequence of dialogue nodes

BINARY CHOICE:
  Player picks between two options.
  Use when: Moral dilemmas, personality expression, simple story branches
  Common pattern: "Agree" vs "Disagree" or "Compassion" vs "Pragmatism"

MULTI-OPTION DIALOGUE (3-4 choices):
  Player picks from several responses.
  Use when: Conversation with NPCs, investigative dialogue, social encounters
  Design rule: Each option should feel meaningfully different in TONE,
  even if they converge on the same information.

DIALOGUE HUB:
  Central node with multiple topics the player can explore in any order.
  Topics are exhausted one by one. Hub closes when all are explored.
  Use when: Interrogation, investigation, meeting an important NPC,
  gathering information from a knowledgeable character.

  HUB STRUCTURE:
    [NPC Greeting]
    -> "Tell me about [Topic A]" -> [Topic A dialogue] -> return to hub
    -> "What do you know about [Topic B]?" -> [Topic B] -> return to hub
    -> "I need your help with [Topic C]" -> [Topic C] -> return to hub
    -> "[Leave]" -> exit conversation

BRANCHING WITH CONVERGENCE:
  Choices diverge but eventually reconverge on a shared story point.
  The player's experience differs, but the narrative workload is manageable.
  This is the most common pattern in shipped games.

  Example:
    Choice A -> Scene variant A1 -> Shared Scene -> Unique consequence A
    Choice B -> Scene variant B1 -> Shared Scene -> Unique consequence B

  FOLDBACK STRUCTURE (industry term):
  Stories branch and fold back repeatedly, like a braid.
  Key moments are shared. Path between them varies.

TRACKING PLAYER CHOICES:
  Use flags/variables to track decisions:
    [player_helped_merchant] = true/false
    [faction_reputation_rebels] = 0-100
    [romance_npc_elara] = friendship/romance/rival

  Reference flags in later dialogue to reflect consequences:
    IF [player_helped_merchant] THEN
      Merchant: "I remember what you did for me. Let me return the favor."
    ELSE
      Merchant: "You are just another stranger. What do you want?"
```

### Writing Dialogue for Games
```
DIALOGUE WRITING RULES:
  1. Shorter than you think. Players skim. 2-3 sentences per node max.
  2. Front-load important information. First sentence carries the point.
  3. Each line should either advance plot, reveal character, or provide
     information the player needs. If it does none of these, cut it.
  4. Player dialogue options should be clear about intent.
     The player should know what their character will DO, not just SAY.
     BAD: "That sounds interesting" (what will this cause?)
     GOOD: "[Agree to help] I will get it done." (clear action)
  5. NPCs should have distinct voices. If you cover the name, can you
     tell who is speaking? If not, the voices are not differentiated.
  6. Avoid exposition dumps. Distribute lore across multiple conversations,
     environmental details, and codex entries.
  7. Give the player meaningful silence as an option. "Say nothing"
     or "[Walk away]" can be the most powerful choice.

TONE TAGS (help voice actors and set player expectations):
  [Sarcastic] "Oh, what a brilliant plan."
  [Threatening] "You should reconsider. Quickly."
  [Sincere] "I mean it. Thank you."
  [Reluctant] "Fine. But I am not happy about it."
```

## World Lore Construction

### Lore Architecture
```
LORE LAYERS:
  Layer 1: SURFACE LORE (player encounters naturally through gameplay)
    Dialogue references, environmental details, quest context
    Every player should absorb this without effort.

  Layer 2: DISCOVERABLE LORE (rewards exploration and curiosity)
    Codex entries, readable items, optional conversations
    Dedicated players find this by exploring thoroughly.

  Layer 3: DEEP LORE (hidden connections for lore hunters)
    Connections between distant events, hidden meanings in symbols,
    unreliable narrators whose stories contradict each other
    Only the most dedicated players piece this together.

THE ICEBERG PRINCIPLE:
  You should know 10x more about your world than the player ever sees.
  This depth makes everything feel real, even the surface details.
  Create a lore bible, but only reveal fragments in-game.

LORE BIBLE STRUCTURE:
  1. COSMOLOGY: How the world works (magic, technology, physics, religion)
  2. HISTORY: Timeline of major events (wars, discoveries, catastrophes)
  3. GEOGRAPHY: Regions, cities, biomes, and their characteristics
  4. FACTIONS: Groups with competing interests, goals, and methods
  5. CHARACTERS: Major figures past and present
  6. CULTURE: Customs, languages, art, food, social structures
  7. CONFLICTS: Current tensions driving the story
  8. MYSTERIES: Unanswered questions that intrigue the player

CONSISTENCY RULES:
  - Create rules for your world and follow them. Break them only
    when the breaking is the story.
  - Track all stated facts in a single document. Contradictions destroy
    player trust (unless intentional via unreliable narrator).
  - Every piece of lore should connect to something the player cares about.
    Lore for its own sake is a codex entry nobody reads.
```

## Environmental Storytelling

### Telling Stories Without Words
```
ENVIRONMENTAL STORYTELLING TECHNIQUES:

1. SCENE COMPOSITION:
   Objects arranged to tell a micro-story.
   Example: Two cups on a table, one knocked over. A letter half-written.
   A suitcase packed but never taken. The player constructs the narrative.

2. PROGRESSION THROUGH SPACE:
   As the player moves through an area, the story unfolds.
   Beginning of dungeon: Signs of life, warmth, normalcy.
   Middle: Damage, struggle, transition.
   End: Aftermath, resolution, or escalation.
   The space IS the narrative arc.

3. CONTRAST:
   Place something unexpected in the environment.
   A child's toy in a war zone. Flowers growing through cracked armor.
   Contrast creates emotional impact without a single word of dialogue.

4. REPETITION WITH VARIATION:
   A motif that appears throughout the game with subtle changes.
   The same symbol on walls, each time in a different context.
   A recurring NPC whose shop appears in increasingly impossible locations.

5. ABSENCE:
   What is missing tells a story.
   A village with no children. A throne room with no throne.
   A library where every book on one subject has been removed.

6. READABLES AND AUDIO LOGS:
   Letters, journals, recordings left by absent characters.
   Rules:
   - Keep them SHORT (50-150 words maximum)
   - Each one should reveal one interesting fact or emotion
   - They should reward the player for finding them
   - Voice-acted logs are more likely to be consumed than text
   - Place them where the player naturally pauses (before a door,
     at a rest point, after a difficult encounter)

ENVIRONMENTAL STORYTELLING CHECKLIST:
  For each major area, define:
  - What happened here? (The story of this place)
  - What evidence remains? (Objects, damage, arrangements)
  - What is the emotional tone? (Peaceful, tragic, eerie, hopeful)
  - What does the player learn by being observant?
  - Is there a discovery that rewards exploration?
```

## Character Arcs in Interactive Media

### Designing Character Arcs for Games
```
THE CHALLENGE:
  In linear media, the writer controls the character's journey.
  In games, the PLAYER is the protagonist. Their choices define the arc.
  NPCs have arcs. The player has AGENCY.

NPC ARC DESIGN:
  Define for each major NPC:
  - Want: What do they pursue externally? (Goal)
  - Need: What do they need internally? (Growth)
  - Flaw: What holds them back? (Obstacle)
  - Arc: How do they change over the course of the game?
  - Player influence: How can the player affect this arc?

  Types of NPC arcs:
  - POSITIVE ARC: Character overcomes flaw, achieves growth
  - NEGATIVE ARC: Character succumbs to flaw, falls from grace
  - FLAT ARC: Character does not change but changes the world around them
  - PLAYER-DETERMINED ARC: Player's choices determine which arc the NPC follows

PLAYER CHARACTER ARC:
  Option A: DEFINED PROTAGONIST (Nathan Drake, Geralt)
    Character has a personality. Player controls actions, not identity.
    Arc is partially authored, partially influenced by player choices.

  Option B: BLANK SLATE PROTAGONIST (Skyrim, Dark Souls)
    Player projects their own identity onto the character.
    Arc is emergent from player behavior, not authored.

  Option C: HYBRID (Commander Shepard, V in Cyberpunk)
    Character has a defined situation but player chooses personality.
    Arc is co-authored between designer and player.

COMPANION ARCS:
  Companions who travel with the player should:
  - React to player decisions (approval/disapproval systems)
  - Have their own personal quests that reveal backstory
  - Change over time based on relationship with the player
  - Create difficult choices where companions disagree with each other
  - Have a climactic moment where the relationship is tested
```

## Player Agency and Consequence

### Designing Meaningful Choice
```
WHAT MAKES A CHOICE MEANINGFUL:
  1. The player understands what they are choosing between
  2. Both options have genuine appeal (not obvious right/wrong)
  3. The choice has visible consequences
  4. The consequences feel proportional to the choice
  5. The player cannot easily undo or game the choice

TYPES OF CONSEQUENCES:
  IMMEDIATE: Happens right after the choice (NPC reacts, path changes)
  DELAYED: Happens hours later (character appears, situation evolves)
  CUMULATIVE: Many small choices aggregate into a large outcome
  FINAL: Choice determines one of several endings

THE REACTIVITY SPECTRUM:
  Low reactivity: Different dialogue, same outcome
  Medium reactivity: Different scenes, converging plot
  High reactivity: Different storylines, different endings
  Full reactivity: Every choice creates a unique experience (impractical)

  Most shipped games use medium reactivity with key high-reactivity moments.

ILLUSION OF CHOICE (use sparingly, use honestly):
  Sometimes two options lead to the same outcome but the player
  feels their choice mattered because the PATH was different.
  This is acceptable when:
  - The emotional experience of choosing is the point
  - The dialogue and scene flavor genuinely change
  - The player does not feel tricked upon replay

REPUTATION AND CONSEQUENCE SYSTEMS:
  Faction reputation: Actions affect standing with groups
  Moral alignment: Choices shift the character along moral axes
  Relationship tracking: NPC attitudes change based on interactions
  World state: Physical changes in the world based on decisions
    (destroyed building stays destroyed, saved NPC appears later)
```

## Narrative Documentation

### The Narrative Design Document
```
DOCUMENT STRUCTURE:
  1. NARRATIVE OVERVIEW (1-2 pages)
     - Logline: One-sentence description of the story
     - Theme: What is this game ABOUT on a deeper level?
     - Tone: Emotional register (dark, hopeful, sardonic, epic)
     - Player fantasy: What does the player get to BE?

  2. STORY OUTLINE (5-10 pages)
     - Act structure with major beats
     - Key choice points and their consequences
     - Character introductions and arc trajectories
     - Ending(s) and how player reaches each

  3. CHARACTER PROFILES (1 page per major character)
     - Background, motivation, arc, relationship to player
     - Voice sample (3-5 lines of dialogue that capture their personality)

  4. WORLD OVERVIEW (5-10 pages)
     - Lore bible summary (full bible is a separate document)
     - Faction descriptions and conflicts
     - Key locations and their narrative significance

  5. DIALOGUE SPECIFICATIONS
     - Dialogue system description (hub, branching, bark, etc.)
     - Variable and flag list (what is tracked)
     - Dialogue writing guidelines for the team
     - Word budget per conversation/quest

  6. QUEST NARRATIVES (per quest)
     - Quest synopsis, objectives, narrative beats
     - Dialogue scripts with branching
     - Environmental storytelling notes
     - Consequences and flag changes
```

## Output Checklist

- [ ] Narrative overview written (logline, theme, tone, player fantasy)
- [ ] Dialogue system architecture defined (linear, branching, hub)
- [ ] Branching structure designed with convergence points
- [ ] World lore bible created with iceberg layering
- [ ] Environmental storytelling planned for each major area
- [ ] Character arcs designed for major NPCs with player influence points
- [ ] Player agency framework established (choice types, consequence types)
- [ ] Variable/flag tracking system designed
- [ ] Narrative design document completed for team reference
- [ ] Quest narratives scripted with dialogue, branching, and consequences


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Narrative Designer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with narrative designer for a mid-size project."

**Output:** A complete narrative designer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
