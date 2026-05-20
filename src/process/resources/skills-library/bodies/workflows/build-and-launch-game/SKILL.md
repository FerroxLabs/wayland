---
name: build-and-launch-game
description: >-
  Complete workflow for building and shipping a video game from concept through
  prototype, art and audio production, core development, testing, and release.
  Covers game design documentation, rapid prototyping, iterative playtesting,
  and the discipline needed to actually ship a finished game.

  Use when the user wants to build and launch game or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  video-game-designer game-narrative-writer level-design-master
  game-economy-designer game-audio-designer game-jam-guide unit-test-writer
  load-tester roadmap-planner community-led-growth
trigger_phrases: >-
  I want to build a video game I want to make a game How do I develop and ship a
  game I want to launch an indie game
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: game-design step-by-step planning
  category: creative-project
  depends: >-
    video-game-designer game-narrative-writer level-design-master
    game-economy-designer game-audio-designer game-jam-guide unit-test-writer
    load-tester roadmap-planner community-led-growth
  disclaimer: none
  difficulty: advanced
---
# Build And Launch Game

**Estimated time:** 3-12 months

Shipping a game is one of the hardest creative endeavors because it requires the intersection of design, art, audio, engineering, narrative, and business. Most game projects never ship -- they succumb to scope creep, perfectionism, or burnout. This workflow provides the discipline and structure to go from concept to a released game by focusing on rapid prototyping, iterative playtesting, and scope management.

The workflow follows the proven sequence used by successful indie developers: start with a clear concept and a rapid prototype, playtest early and often, build the core gameplay loop before anything else, then layer on art, audio, narrative, and polish. Every decision is filtered through one question: "Does this help the game ship?"

## When to Use

- User wants to build and launch game
- User needs a structured, step-by-step process for build and launch game
- User wants to build a video game
- User wants to make a game
- How do I develop and ship a game
- Do NOT use when: the request is outside the scope of build and launch game or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A game concept or genre you want to explore
- Game engine installed and basics understood (Unity, Godot, Unreal, or similar)
- Programming ability (or an engine with visual scripting)
- Time commitment (10+ hours per week for solo developers)
- Willingness to playtest with real people and accept critical feedback
- A target platform (PC, web, mobile, console)

## Steps

**Step 1: Define the Concept and Scope** (uses: video-game-designer)

write a one-page Game Design Document (GDD) that captures the core concept. Define: the core mechanic (what the player does most), the core loop (what keeps them doing it), the target feeling (what emotion you want to evoke), and the scope (what is in v1.0 and what is cut). Use the Game Jam Guide skill for scope discipline -- treat your first release like a game jam: cut everything that is not essential to the core experience. A finished small game beats an unfinished ambitious one.

- Input: Game idea and inspirations, Target audience, Available development time and resources
- Output: One-page Game Design Document (core mechanic, loop, feeling, scope), Feature list classified as Must-Have, Nice-to-Have, and Cut, Target audience definition
- Key focus: Use the Video Game Designer skill to write a one-page Game Design Document (GDD) that captures the core concept

**Step 2: Build a Rapid Prototype** (uses: game-jam-guide)

build a playable prototype as fast as possible. The prototype should prove or disprove one thing: is the core mechanic fun? Use placeholder art (colored rectangles, free assets), no menus, no polish. Focus entirely on the moment-to-moment gameplay. Can you play the core loop for 10 minutes and want to keep going? If not, the mechanic needs iteration before you invest in anything else.

- Input: Core mechanic from Step 1, Chosen game engine, Programmer art is acceptable (no final art needed)
- Output: Playable prototype with core mechanic, Prototype build for target platform, Playtest notes from self-testing
- Key focus: Use the Game Jam Guide skill to build a playable prototype as fast as possible

**Step 3: Playtest and Iterate the Core Loop** (uses: video-game-designer)

design playtesting sessions. Watch people play without helping them -- note where they get confused, frustrated, bored, or delighted. Use the Level Design Master skill to iterate on the level or environment design based on playtest feedback. Iterate the core loop until playtesters independently express that the game is fun. This is the most critical step -- do not proceed until the core loop works. Everything else (art, audio, story) amplifies fun that already exists; it cannot create fun from nothing.

- Input: Playable prototype from Step 2, 5-10 playtesters (friends, community members, target audience), Observation and feedback framework
- Output: Playtest session recordings or detailed notes, Player feedback summary (patterns across testers), Core loop iteration changelog
- Key focus: Use the Video Game Designer skill to design playtesting sessions

**Step 4: Design Content and Progression** (uses: game-narrative-writer)

design the full level/content progression. Map the difficulty curve, pacing, and introduction of new mechanics. Use the Game Narrative Writer skill to develop the story, characters, and environmental storytelling (if applicable). Use the Game Economy Designer skill to balance progression systems: resource generation, spending, upgrade costs, and reward schedules. The goal is to create a complete content plan that maps every element the player will experience from start to finish.

- Input: Validated core loop from Step 3, Game scope from Step 1, Content volume targets (number of levels, missions, items)
- Output: Level/content progression map (full game flow), Difficulty curve visualization, Narrative outline (story beats, character arcs, dialogue)
- Key focus: Use the Level Design Master skill to design the full level/content progression

**Step 5: Produce Art and Audio** (uses: game-audio-designer)

design the audio landscape: music themes for different game states, sound effects for player actions and feedback, and ambient sounds for atmosphere. For art, establish a style guide early and stick to it -- consistency matters more than fidelity. Prioritize art and audio for the core loop first, then extend to secondary content. If you are a solo developer, consider: asset stores for base assets, procedural generation, or a deliberately simple art style (pixel art, minimalism) that you can produce yourself.

- Input: Content plan from Step 4, Art style decisions, Audio requirements (music, SFX, ambient)
- Output: Art style guide (reference images, color palette, proportions), Core asset list with production status, Music tracks for key game states
- Key focus: Use the Game Audio Designer skill to design the audio landscape: music themes for different game states, sound effects for player actions and feedback, and ambient sounds for atmosphere

**Step 6: Build, Test, and Polish** (uses: unit-test-writer)

write automated tests for critical game systems (save/load, economy calculations, state machines, progression tracking). Use the Load Tester skill if the game has networking (multiplayer, leaderboards). Fix bugs systematically: gameplay-breaking first, then progression-blocking, then visual/audio polish. Add "game juice" -- screen shake, particle effects, animation easing, sound on every interaction. Polish the first 5 minutes obsessively -- this is what determines if players continue or quit.

- Input: Game with validated core loop, content, art, and audio, Target platform requirements, Quality bar for release
- Output: Bug database with severity classifications, Automated tests for critical systems, Performance profiling results (target: stable frame rate)
- Key focus: Use the Unit Test Writer skill to write automated tests for critical game systems (save/load, economy calculations, state machines, progression tracking)

**Step 7: Launch and Build Community** (uses: roadmap-planner)

plan the launch timeline: store page setup, marketing materials, trailer, press outreach, launch day activities, and post-launch patch schedule. Use the Community-Led Growth skill to build a player community before and after launch. Create a compelling store page with screenshots, trailer, and description. Set up a Discord for player feedback. Plan the first post-launch update to show the game is actively supported. Consider early access if the game benefits from player feedback during development.

- Input: Release-ready game from Step 6, Target platform storefronts (Steam, itch.io, App Store, etc.), Marketing assets and social media presence
- Output: Store page with screenshots, trailer, and description, Launch timeline with milestones, Marketing plan (social media, press, community)
- Key focus: Use the Roadmap Planner skill to plan the launch timeline: store page setup, marketing materials, trailer, press outreach, launch day activities, and post-launch patch schedule

## Decision Points

- **After Step ?:** 
  - If **After Step 2**: Pivot the mechanic or try a different concept
  - If **After Step 3**: Continue iterating until fun is proven
  - If **After Step 4**: Cut content scope to fit available time
  - If **After Step 6**: Fix critical issues before launch

## Failure Handling

- **Scope creep:** -- The number one killer of game projects. Define your scope early, cut aggressively, and resist adding features mid-development.
- **Art before fun:** -- Beautiful games that are not fun fail. Validate the core loop with placeholder art before investing in production art.
- **No playtesting:** -- Developers are too close to their own game to see problems. External playtesters find issues you will never find yourself.
- **Perfectionism:** -- A shipped game with rough edges beats an unshipped masterpiece. Target "good enough" for v1.0 and polish in updates.
- **Building systems not content:** -- Spending months on a procedural generation system when 20 hand-crafted levels would ship faster. Systems serve content, not the other way around.

## Expected Outcome

When this workflow is complete, the user will have:

1. Game ships as a finished, playable experience (most important metric)
2. Core loop is validated through external playtesting before full production
3. Game runs at stable frame rate on target platforms
4. Store page conversion rate (views to downloads) exceeds platform average
5. Player reviews are predominantly positive (> 70% positive on Steam)
6. Post-launch support plan addresses player feedback within the first month

## Output Format

```
BUILD AND LAUNCH GAME TRACKER
=============================

[ ] Step 1: Define the Concept and Scope
    Status: [pending/in-progress/complete]
[ ] Step 2: Build a Rapid Prototype
    Status: [pending/in-progress/complete]
[ ] Step 3: Playtest and Iterate the Core Loop
    Status: [pending/in-progress/complete]
[ ] Step 4: Design Content and Progression
    Status: [pending/in-progress/complete]
[ ] Step 5: Produce Art and Audio
    Status: [pending/in-progress/complete]
[ ] Step 6: Build, Test, and Polish
    Status: [pending/in-progress/complete]
[ ] Step 7: Launch and Build Community
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Scope creep:** -- The number one killer of game projects. Define your scope early, cut aggressively, and resist adding features mid-development.
- **Art before fun:** -- Beautiful games that are not fun fail. Validate the core loop with placeholder art before investing in production art.
- **No playtesting:** -- Developers are too close to their own game to see problems. External playtesters find issues you will never find yourself.
- **Perfectionism:** -- A shipped game with rough edges beats an unshipped masterpiece. Target "good enough" for v1.0 and polish in updates.

## Example

**Input:** "I want to build and launch game and need a structured plan to follow step by step."

**Output:**

**Step 1 (video-game-designer-game-jam-guide):** Define the Concept and Scope -- produces concrete deliverables for this phase.

**Step 2 (game-jam-guide):** Build a Rapid Prototype -- produces concrete deliverables for this phase.

**Step 3 (video-game-designer-level-design-master):** Playtest and Iterate the Core Loop -- produces concrete deliverables for this phase.

**Step 4 (game-narrative-writer-game-economy-designer-level-design-master):** Design Content and Progression -- produces concrete deliverables for this phase.

**Step 5 (game-audio-designer):** Produce Art and Audio -- produces concrete deliverables for this phase.

**Step 6 (unit-test-writer-load-tester):** Build, Test, and Polish -- produces concrete deliverables for this phase.

**Step 7 (roadmap-planner-community-led-growth):** Launch and Build Community -- produces concrete deliverables for this phase.

**Result:** User has a complete build and launch game plan with all deliverables produced, validated, and ready for implementation.
