---
name: create-tabletop-rpg
description: >-
  End-to-end workflow for designing, playtesting, illustrating, laying out, and
  publishing a tabletop role-playing game. Covers core system design, character
  creation mechanics, setting development, playtesting methodology, art
  direction, layout and graphic design, and publishing on DriveThruRPG, itch.io,
  and through Kickstarter campaigns.

  Use when the user wants to create tabletop rpg or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "tabletop-rpg-designer worldbuilding-master digital-illustrator self-publishing-guide"
trigger_phrases: >-
  I want to create a tabletop RPG design my own RPG system make a TTRPG publish
  a tabletop game create an RPG rulebook design a role-playing game TTRPG from
  scratch
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: tabletop-rpg game-design content-marketing step-by-step planning
  category: creative-project
  depends: "tabletop-rpg-designer worldbuilding-master digital-illustrator self-publishing-guide"
---
# Create Tabletop Rpg

**Estimated time:** 4-8 months

This workflow guides you through creating a complete tabletop role-playing game
from initial system concept through design, playtesting, art, layout, and
publication. The indie TTRPG scene has exploded in recent years, with platforms
like itch.io and DriveThruRPG making it possible for solo designers to reach
thousands of players. But creating a good TTRPG requires a rare combination of
game design skill, writing ability, visual presentation, and willingness to
playtest relentlessly.

The workflow covers six phases: system design, worldbuilding and writing,
playtesting iteration, art direction and creation, layout and graphic design,
and publishing and distribution. It works for anything from a one-page micro-RPG
to a full 200+ page rulebook.

By the end of this workflow you will have: a playtested game system, a
written and edited rulebook, professional art and layout, and a published game
available for purchase.

## When to Use

- User wants to create tabletop rpg
- User needs a structured, step-by-step process for create tabletop rpg
- User wants to create a tabletop RPG
- design my own RPG system
- make a TTRPG
- Do NOT use when: the request is outside the scope of create tabletop rpg or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Experience playing tabletop RPGs (understanding what makes them work)
- A game concept or mechanical idea you want to explore
- Access to playtest groups (in-person or online)
- Basic writing ability (the rulebook is a technical document that must be clear)
- Budget for art and layout (or willingness to learn these skills)

## Steps

**Step 1: Design Your Core System** (uses: tabletop-rpg-designer)

Use the Tabletop RPG Designer and D&D Master skills to design the core
mechanical framework.

- Input: game concept and mechanical ideas, Target play experience (combat-focused, narrative-driven, investigation, horror), Complexity level (rules-light, medium-crunch, heavy-crunch)
- Output: Resolution system, character creation, and action economy, Attributes, skills, classes/playbooks, and advancement, Combat or challenge resolution rules
- Key focus: Defining the core resolution mechanic: what dice do players roll, what

**Step 2: Build the World and Write the Rules** (uses: worldbuilding-master)

Use the Worldbuilding Master and Game Narrative Writer skills to create the
setting and write the complete rulebook text.

- Input: `core-mechanics` from Step 1 (system that the world must serve), `design-pillars` from Step 1 (principles guiding world design), `character-system` from Step 1 (world context for character options)
- Output: World, factions, locations, and adventure hooks, Complete first draft of all game text, Introductory scenario for new groups
- Key focus: Building a setting that the mechanics reinforce (a horror game needs a

**Step 3: Playtest and Iterate** (uses: tabletop-rpg-designer)

run structured playtests and iterate.

- Input: `rulebook-draft` from Step 2 (rules to test), `starter-adventure` from Step 2 (scenario for testing), `core-mechanics` from Step 1 (systems to validate)
- Output: Structured feedback from all playtest sessions, Rules changes documented with rationale, Character options, abilities, and encounters tested for balance
- Key focus: Running at least 3 internal playtests (you as GM, observing where players

**Step 4: Commission or Create Art** (uses: digital-illustrator)

plan and create (or commission) the art
that brings the game to life.

- Input: `revised-rulebook` from Step 3 (content that needs illustration), `setting-bible` from Step 2 (visual reference for the world), `character-system` from Step 1 (character types to depict)
- Output: Style guide, mood boards, and visual identity document, Detailed descriptions for each illustration needed, Complete set of illustrations for the rulebook
- Key focus: Creating an art direction document: style, mood, color palette, and reference

**Step 5: Layout and Graphic Design** (uses: digital-illustrator)

Use the Digital Illustrator and Self-Publishing Guide skills to create a
professional layout.

- Input: `revised-rulebook` from Step 3 (text to lay out), `finished-artwork` from Step 4 (art to integrate), `art-direction` from Step 4 (visual identity to maintain)
- Output: Complete InDesign or Affinity Publisher files, Screen-optimized PDF with bookmarks and hyperlinks, Print-ready PDF with bleeds and crop marks
- Key focus: Choosing layout software: Affinity Publisher, Adobe InDesign, or Canva for

**Step 6: Publish and Distribute** (uses: self-publishing-guide)

Use the Self-Publishing Guide and Community Builder skills to get the game into
players' hands.

- Input: `digital-pdf` and `print-pdf` from Step 5 (products to sell), `cover-art` from Step 4 (marketing asset), `starter-adventure` from Step 2 (free sample content)
- Output: Active listings on DriveThruRPG and itch.io, Free sample version for marketing, Discord, forum, or social media presence for the game
- Key focus: Publishing on DriveThruRPG (the dominant TTRPG marketplace) with optimized

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Designing in a vacuum without playtesting:** Theory is not practice. A mechanic that seems elegant on paper may be clunky at the table. Playtest early, playtest often.
- **Rules ambiguity:** If two playtesters interpret a rule differently, the rule is unclear. Blind playtests reveal ambiguities you cannot see because you know what you meant.
- **Feature creep:** Adding more subsystems does not make a better game. Discipline yourself to the design pillars and cut mechanics that do not serve them.
- **Neglecting the GM section:** Players interact with the game through mechanics. GMs interact through tools and guidance. A weak GM section means poorly run games.
- **Skipping layout and design:** A beautifully designed game with ugly layout will be judged by the layout. Professional presentation signals professional content.

## Expected Outcome

When this workflow is complete, the user will have:

1. A core mechanic delivers a distinctive play experience
2. Playtesting has validated that the rules are clear, balanced, and fun
3. The rulebook is written in clear, unambiguous prose with examples
4. Professional art and layout make the book inviting to read
5. The game is published on digital marketplaces and available for purchase
6. A community exists for players and GMs to share experiences

## Output Format

```
CREATE TABLETOP RPG TRACKER
===========================

[ ] Step 1: Design Your Core System
    Status: [pending/in-progress/complete]
[ ] Step 2: Build the World and Write the Rules
    Status: [pending/in-progress/complete]
[ ] Step 3: Playtest and Iterate
    Status: [pending/in-progress/complete]
[ ] Step 4: Commission or Create Art
    Status: [pending/in-progress/complete]
[ ] Step 5: Layout and Graphic Design
    Status: [pending/in-progress/complete]
[ ] Step 6: Publish and Distribute
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Designing in a vacuum without playtesting:** Theory is not practice. A mechanic that seems elegant on paper may be clunky at the table. Playtest early, playtest often.
- **Rules ambiguity:** If two playtesters interpret a rule differently, the rule is unclear. Blind playtests reveal ambiguities you cannot see because you know what you meant.
- **Feature creep:** Adding more subsystems does not make a better game. Discipline yourself to the design pillars and cut mechanics that do not serve them.
- **Neglecting the GM section:** Players interact with the game through mechanics. GMs interact through tools and guidance. A weak GM section means poorly run games.

## Example

**Input:** "I want to create tabletop rpg and need a structured plan to follow step by step."

**Output:**

**Step 1 (tabletop-rpg-designer-dnd-master):** Design Your Core System -- produces concrete deliverables for this phase.

**Step 2 (worldbuilding-master-game-narrative-writer):** Build the World and Write the Rules -- produces concrete deliverables for this phase.

**Step 3 (tabletop-rpg-designer):** Playtest and Iterate -- produces concrete deliverables for this phase.

**Step 4 (digital-illustrator):** Commission or Create Art -- produces concrete deliverables for this phase.

**Step 5 (digital-illustrator-self-publishing-guide):** Layout and Graphic Design -- produces concrete deliverables for this phase.

**Step 6 (self-publishing-guide-community-builder):** Publish and Distribute -- produces concrete deliverables for this phase.

**Result:** User has a complete create tabletop rpg plan with all deliverables produced, validated, and ready for implementation.
