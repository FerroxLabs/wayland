---
name: game-jam-guide
description: |
  Complete guide to creating a game in 48 hours covering the most common scoping mistakes, tool selection (Unity, Godot, Pico-8), team roles and communication, time management, idea generation from themes, polish priorities, submission best practices, and post-jam development paths. Use when the user asks about game jam guide or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "game-design guide step-by-step"
  category: "game-development"
  subcategory: "game-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Game Jam Guide

## When to Use

**Use this skill when:**
- A user is actively preparing for or participating in a timed game jam (Ludum Dare, Global Game Jam, itch.io jams, JS13K, GMTK Jam, Brackeys Jam) and needs a structured execution plan
- A user asks how to scope a game idea for a 24-, 48-, or 72-hour competition and wants concrete time-boxing guidance
- A user needs help selecting tools or an engine for a jam based on their existing skill set and the jam's constraints
- A user wants a framework for generating ideas from a revealed theme and testing whether those ideas are buildable in time
- A user is struggling with a specific phase of a jam in progress -- prototyping a mechanic, prioritizing polish, or building and submitting a game page
- A user wants to understand which post-jam games are worth continuing to develop versus which should be archived
- A user is participating in their first jam and wants to avoid the most destructive beginner mistakes before they happen

**Do NOT use this skill when:**
- The user is designing a commercial game on a months-long or years-long timeline -- use the video-game-designer skill instead
- The user wants deep game design theory (lenses, player psychology, formal systems design) rather than rapid prototyping tactics -- use the video-game-designer skill instead
- The user wants to design a tabletop, card, or board game for a physical jam -- use the board-game-creator skill instead
- The user is asking about game programming architecture, engine-specific implementation, or code patterns -- use an engine-specific skill or programming skill instead
- The user is asking about publishing a completed game commercially, pricing, or storefronts -- use a game publishing skill instead
- The user needs help writing a game design document for a full production project -- use the game-design-document skill instead

---

## Process

### Step 1: Establish the User's Context

Before delivering any advice, gather the minimum viable context. Ask exactly these questions if they haven't already been answered -- do not proceed with assumptions:

- **Which jam, and what are the rules?** Jam name, time limit (24h/48h/72h), solo vs. team allowed, theme announcement timing, tool or engine restrictions, required submission format (itch.io page, binary, web build), and whether jam ratings are jury or community-based.
- **Solo or team? Who is on the team and what are their skills?** A solo non-programmer has entirely different options than a duo of programmers.
- **What engine and tools does the user already know?** Not what they want to learn -- what they can execute in under 2 hours right now.
- **What is their primary goal?** Finish any game, learn a skill, compete for ratings, build a portfolio piece, or just have fun. Goal determines every trade-off.
- **How much time is realistically available?** Many participants have jobs, families, or sleep requirements. A 48-hour jam may practically be a 20-hour jam.
- **First jam or experienced?** First-timers need the scoping warning most urgently. Veterans may need targeted advice on a specific phase.

Once you have this context, tailor every piece of advice that follows. Do not deliver a generic plan -- always tie recommendations to their actual engine, team size, and goal.

---

### Step 2: Scope the Game with the One-Mechanic Rule

This is the most critical phase. More games fail jams from over-scoping than from any other cause. Apply this framework rigorously:

- **State the mechanic as a single verb or verb phrase.** "Jumping," "rotating the world," "connecting nodes," "shrinking," "reversing time." Everything in the game exists to serve and decorate that verb. If you need two verbs to describe the mechanic, you have two games -- pick one.
- **Apply the 25% Rule.** Whatever the user imagines building, they will realistically complete roughly 25% of it under jam conditions. Take their full vision, cut it in half, then cut it in half again. That is the target scope.
- **Define the Cut List explicitly with three tiers:**
  - **MUST HAVE:** The core mechanic is functional, 1--3 levels exist (or equivalent content), there is a way to start and a way to end.
  - **NICE TO HAVE:** Additional levels, sound effects, basic music, a title screen, juice (screen shake, particles).
  - **DREAM LIST:** Boss fights, multiple mechanics, branching paths, online features, cutscenes, leaderboards, procedural generation.
- **Scope by asking: "Can a fully playable version of this be built in 8 hours?"** If the answer is no, simplify until it is. The first 8 hours produce the prototype that determines whether the game is fun. If it is not fun at hour 8, no amount of content will save it.
- **Flag scope killers immediately.** Common ones: original art for more than 4--6 character states, voice acting, online multiplayer, more than 5 distinct room types, physics-based puzzles with emergent complexity, or any mechanic the user has never programmed before.

---

### Step 3: Select Tools Based on Existing Skill, Not Aspiration

Run through this decision tree with the user based on their actual knowledge:

**Engine Selection:**

| Engine | Language | Best Fit | Realistic Jam Output |
|--------|----------|----------|----------------------|
| Godot 4 | GDScript / C# | 2D games, solo or small team | Polished 2D game in 48h |
| Unity | C# | 2D or 3D, larger teams | Functional prototype in 48h |
| GameMaker | GML | Arcade/action 2D | Fast and well-tested for jams |
| Pico-8 | Lua | Tiny retro games, solo | Highly constrained, focused output |
| Love2D | Lua | Programmer-only, lightweight 2D | Fast if user knows Lua well |
| Twine / Ink | None / Ink | Interactive fiction, narrative | Complete narrative game in 24h |
| Construct 3 | Event-based | Non-programmer, 2D only | Rapid 2D prototype with no code |
| Phaser | JavaScript | Web-only, programmer | Good for HTML5-first jams like JS13K |

- **The Jam Engine Rule:** Use the engine you know best, not the one you most want to learn. A jam is a sprint, not a tutorial.
- **If the user insists on a new engine:** Warn them they will spend 6--10 of their first 12 hours on setup, documentation, and debugging unfamiliar behavior. This almost always results in a dropped entry.
- **Art tools for non-artists:** Aseprite (pixel art, $20, industry standard for jams), Piskel (free web-based pixel art), LibreSprite (free Aseprite fork). Free asset packs from Kenney.nl are structured, permissive, and stylistically consistent -- using them is not cheating.
- **Audio tools:** BFXR and sfxr generate retro sound effects in under 30 seconds each. Bosca Ceoil produces simple chiptune music with no music theory required. LMMS is free and more powerful but has a learning curve. Freesound.org provides CC-licensed effects -- always verify the license.
- **Web export check:** If targeting HTML5 (recommended for maximum plays), verify the engine's web export works before the jam starts. Unity and Godot both have known web export quirks that can consume hours if discovered at submission time.

---

### Step 4: Build the 48-Hour Schedule

Construct a phase-locked schedule. Times are for a 48-hour jam -- scale proportionally for 24h or 72h jams.

```
PHASE 1 -- IDEATION (Hours 0 to 4)
  - Generate 20+ raw ideas before evaluating any of them.
  - For each promising idea, state the core mechanic as one verb.
  - Elevator pitch test: Can you describe the game in one sentence?
  - Scope test: Can you prototype it in 8 hours?
  - COMMIT by hour 4. An okay idea executed well always beats
    a brilliant idea still being debated at hour 12.

PHASE 2 -- PROTOTYPE (Hours 4 to 14)
  - Build the core mechanic with placeholder art (colored rectangles).
  - No audio. No UI. No menus. No polish.
  - Target: The game's one mechanic is playable and testable.
  - FUN CHECK at hour 14: Is playing the mechanic for 60 seconds
    engaging? If no, diagnose and fix -- or pivot scope. Do not add
    content to an unfun mechanic hoping it improves.

PHASE 3 -- CONTENT (Hours 14 to 32)
  - Build 3 levels (or equivalent content units).
  - Replace placeholder art with real (or asset-pack) art.
  - Add 3--5 sound effects (at minimum: one action sound, one UI
    click, one success/failure signal).
  - COMPLETABILITY CHECKPOINT at hour 32: Can a player start
    the game and reach an end state without crashing? If no,
    cut scope to what IS complete. Cut everything else.

PHASE 4 -- POLISH (Hours 32 to 44)
  - Screen shake on impacts (2--4px offset, 0.1--0.15s duration).
  - Particle effects on key events (landing, hitting, collecting).
  - Title screen with game name, one-key start, and control list.
  - Game over / win screen with score and restart option.
  - One looping music track that matches the tone.
  - UI: score or progress indicator visible during play.

PHASE 5 -- SUBMISSION (Hours 44 to 48)
  - Build for web (HTML5) first. Test the build in a browser.
  - Write the game page: screenshot or GIF, description, controls,
    theme interpretation, credits.
  - SUBMIT by hour 46 at the latest. Buffer for platform issues.
  - You can update until the deadline -- submit early, update often.
```

- **Sleep guidance:** 6--7 hours per night is the minimum viable sleep for productive coding. Sleep-deprived programmers generate more bugs than they fix. For a 48-hour jam: sleep from approximately hour 18 to hour 25. Do not try to work through both nights.
- **Micro-break protocol:** 10-minute break every 90--120 minutes. Real meals (not just snacks). Step outside at least once per day. These are not optional for sustained output.

---

### Step 5: Generate Ideas from the Theme

When the theme is announced, run through this structured ideation process before committing to any idea:

- **Timed free association (10 minutes):** Write down every word or image the theme evokes. Include literal, metaphorical, emotional, mechanical, and absurd interpretations. Aim for 20+ entries. "Out of control" -> chaos, autopilot, no brakes, spinning top, broken remote, runaway train, overthinking, emotional breakdown, procedural generation, inverted controls.
- **Combine with a genre or mechanic (10 minutes):** Take 5 of the most interesting associations and pair each with a simple genre. "No brakes + platformer = character who can't stop running and must navigate obstacles using only jumps." "Broken remote + puzzle = you give commands to a robot but they execute with a delay -- you must predict ahead."
- **Add a twist (10 minutes):** The twist should subvert the player's expectation of the mechanic in a way that reinforces the theme. "No brakes" + "but the obstacles are trying to slow you down, which is bad" inverts the expected danger relationship.
- **Elevator pitch test (5 minutes):** State the full game in one sentence. Subject, verb, goal, obstacle. If you need two sentences, the idea is too complex.
- **Scope reality check (5 minutes):** Can the core playable prototype be built in 8 hours with the tools you have? If no -- remove a layer of complexity and repeat the check.
- **Anti-patterns to call out immediately:**
  - "It's like [popular game] but with the theme as the story wrapper" -- this scores poorly for theme integration in judged jams
  - "We'll figure out how it connects to the theme later" -- this produces games that feel arbitrary
  - Choosing the first idea because it's safe -- the first idea is usually derivative; push into the uncomfortable combinations

---

### Step 6: Assign Team Roles and Establish Communication

Team size and role clarity determine whether collaboration accelerates or kills a jam entry:

**Solo:** Total creative control, no communication overhead. Biggest risk is scope -- no one to check ambition.

**Duo (ideal for most jams):** Programmer + Artist/Designer. Decisions are fast. Check in at each phase boundary (hour 4, 14, 32). Share assets through Git or a shared cloud folder.

**Trio:** Programmer + Artist + Designer/Audio person. Needs explicit role ownership. Assign responsibilities at the start and do not redesign them mid-jam.

**Quad or larger:** Diminishing returns past 4 people. Communication overhead increases, idle time increases. Assign one integrator (the programmer who pulls everything together) and one scope owner (the designer who says no).

**Sync cadence for all team sizes:** A 5-minute check-in every 4--6 hours covers three items only: what did you complete, what are you doing next, what is blocking you. No longer. No design debates at check-in. Scope debates happen only at designated phase boundaries.

**Conflict resolution rule:** The person who implements the feature decides its implementation. The designer defines intent. The programmer defines feasibility. If there is disagreement, the rule is: agree on a 30-minute experiment, then evaluate.

---

### Step 7: Prioritize Polish Using the Juice Stack

Polish has wildly asymmetric returns on time investment. Apply in this order to maximize perceived quality per minute spent:

| Priority | Feature | Time Cost | Perceived Impact |
|----------|---------|-----------|-----------------|
| 1 | Sound effects (3--5 key sounds) | 20--40 min | Highest -- transforms game feel instantly |
| 2 | Screen shake on impact events | 10--20 min | Very High -- makes game feel physical |
| 3 | Title screen with name and controls | 20--30 min | High -- sets professionalism expectations |
| 4 | Win/lose screen with restart | 15--20 min | High -- game feels complete, not abandoned |
| 5 | Particle effects on key events | 20--40 min | High -- visual richness and feedback |
| 6 | One looping background track | 20--40 min | Medium-High -- sets tone and atmosphere |
| 7 | Smooth camera follow / easing | 15--20 min | Medium -- removes jank from movement |
| 8 | UI (score, health, timer visible) | 20--30 min | Medium -- players understand state |
| 9 | Animation easing (squash/stretch) | 20--30 min | Medium -- professional feel |
| 10 | Settings screen or volume slider | 30--45 min | Low -- skip in a jam context |

- **Do not attempt all 10.** Items 1--5 in 90 minutes transform a prototype into a polished-feeling entry. Items 6--8 are additive if time allows.
- **Screen shake parameters:** 3--5px maximum offset, 0.1--0.15 second duration, exponential decay. More than this causes nausea. Less than this is invisible.
- **Sound first, music second.** Players notice the absence of sound effects more acutely than the absence of music. Three well-chosen SFX (action sound, hit/impact, win/lose) do more for game feel than a full soundtrack.

---

### Step 8: Handle Submission and Post-Jam Decision

**Pre-submission checklist (execute in order):**
- Game runs from start to a defined end state without crashing
- All intended controls are functional
- Volume is reasonable (not ear-piercing, not silent)
- Web build tested in Chrome and Firefox (if applicable)
- Tested on a different machine or in a fresh browser profile if possible
- Game page contains: title, at least one screenshot or GIF, one-paragraph description, complete control list, theme interpretation statement, full credits (including asset sources)
- Submission made at least 2 hours before deadline

**Post-jam decision framework:**

Continue developing the game if ALL of the following are true:
- The core mechanic is genuinely fun and has depth that is not yet expressed
- Players who tried it asked for more content unprompted
- You, the developer, are personally excited to play the next version
- The game has a clear audience identity (who plays this and why)

Archive or move on if ANY of the following are true:
- The mechanic is a one-time gimmick that works exactly once
- The theme was the only interesting part and cannot survive a post-jam version
- You feel obligation rather than excitement toward it
- The jam code is held together by global variables and 2am patch logic (it is -- rebuild from scratch if continuing)

**If continuing post-jam:**
- Write a post-mortem first: 3 things that worked, 3 that failed, 3 changes for the next project
- Treat the jam version as a proof of concept, not a foundation
- Rebuild the project from scratch with proper architecture
- Set a realistic expanded scope (months, not weeks, for a commercial release)
- Examples of jam-to-commercial successes as data points: Celeste began as a Pico-8 prototype, Superhot was built in 7 days for the 7DFPS jam, Baba Is You was a Global Game Jam entry

---

## Output Format

When delivering a game jam plan to a user, structure the response as follows. Populate every section with specifics drawn from their context -- never use placeholder text.

---

### [USER'S JAM NAME] -- Execution Plan

**Jam Parameters**
- Jam: [name, URL]
- Duration: [hours]
- Solo / Team: [composition and skills]
- Engine / Tools: [confirmed tools]
- Goal: [stated primary goal]
- Practical Hours Available: [realistic hours accounting for sleep and obligations]

---

**The Game Concept**
- Core mechanic (one verb): [verb]
- Elevator pitch (one sentence): [subject + verb + goal + obstacle]
- Theme integration: [how the mechanic embodies or reflects the theme]

---

**Scope Definition**

| Tier | Feature | Estimated Hours |
|------|---------|----------------|
| MUST HAVE | [mechanic name] functional | [X hours] |
| MUST HAVE | [level count] playable levels | [X hours] |
| MUST HAVE | Win/lose state | [X hours] |
| NICE TO HAVE | Sound effects (3--5) | [X hours] |
| NICE TO HAVE | Title screen | [X hours] |
| NICE TO HAVE | Screen shake / particles | [X hours] |
| DREAM | [feature name] | -- (cut) |
| DREAM | [feature name] | -- (cut) |

**Total Must-Have Hours:** [X] -- this must be under 60% of available time.

---

**Phase Schedule**

| Phase | Hours | Deliverable | Checkpoint Condition |
|-------|-------|-------------|---------------------|
| Ideation | 0--[N] | Committed concept | One-sentence pitch exists |
| Prototype | [N]--[N] | Core mechanic playable | Fun check passes at 60 seconds |
| Content | [N]--[N] | Game completable end-to-end | Player can start and finish |
| Polish | [N]--[N] | Juice applied in priority order | Top 5 polish items complete |
| Submission | [N]--[N] | Build live on platform | Submitted at least 2h early |

---

**Tool Confirmation**
- Engine: [name, why it fits]
- Art: [tool or asset source]
- Audio: [SFX tool, music tool, or source]
- Version control: [Git repo URL or cloud backup plan]

---

**Team Roles** (if applicable)
- [Name]: [specific responsibilities]
- Sync schedule: Every [X] hours, 5 minutes, covering: done / doing / blocked

---

**Top 3 Risks for This Specific Plan**
1. [Risk] -- Mitigation: [specific action]
2. [Risk] -- Mitigation: [specific action]
3. [Risk] -- Mitigation: [specific action]

---

**Cut Trigger:** If the game is not completable end-to-end by hour [N], immediately drop [specific feature] and [specific feature] from scope.

---

## Rules

1. **Never suggest learning a new engine or tool during a jam.** The cost is always 6--12 hours of friction on setup, documentation, and unfamiliar errors. No jam feature is worth that trade.

2. **Scope to a single core mechanic.** If the mechanic requires more than one verb to describe, it is two mechanics. Cut one. Games built around a single well-executed mechanic consistently outperform games built around three half-implemented mechanics in community ratings.

3. **Do not let ideation run past 4 hours in a 48-hour jam.** An okay idea executed cleanly beats a brilliant idea debated past hour 6. Facilitate a decision -- do not optimize for the perfect concept.

4. **The fun check at prototype phase is mandatory.** If the core mechanic is not engaging after 60 seconds of play with no context, more content will not save it. The correct response is to diagnose the mechanic (feedback timing, input feel, challenge curve) -- not to add features on top.

5. **Always recommend web (HTML5) export as the primary build target.** Web builds receive 3--10x more plays than downloadable builds on itch.io in typical jam contexts, which means more ratings, more feedback, and better visibility. Confirm the web export pipeline works before the jam starts.

6. **Apply polish in order of impact, not preference.** Sound effects before music. Screen shake before animation easing. Title screen before settings menu. Developers often gravitate toward visually satisfying polish that scores low on actual player-perceived quality improvement.

7. **Commit to Git (or equivalent) every hour.** Disk failures, accidental file overwrites, and scene corruption are real jam killers. A remote backup (GitHub, GitLab, any cloud) is insurance against losing 8+ hours of work. If the user does not know Git, guide them to automatic cloud backup for their project folder.

8. **Submit at least 2 hours before the deadline.** Jam submission servers get hammered in the final 90 minutes. Upload failures, file size limits, and platform processing delays are common. An early submission can be updated; a missed deadline cannot be recovered.

9. **Do not recommend online multiplayer in any jam context.** Networking introduces bugs that are disproportionately complex to diagnose under time pressure. Even an experienced networked-game developer should not attempt online multiplayer in a 48-hour jam without a pre-built framework they are deeply familiar with.

10. **Post-jam continuation decisions must be based on mechanic depth and personal excitement, not sunk cost.** The most common post-jam mistake is continuing a project out of obligation because time was invested in it. If the mechanic is a one-trick gimmick or the developer's interest is low, the correct advice is to write a post-mortem and move on.

---

## Edge Cases

### User reveals the theme mid-conversation and wants idea generation right now
The theme is announced and the user is generating ideas in real time. Do not evaluate or kill ideas during the initial brainstorm phase -- all output is valid for 10 minutes. Then apply the elevator pitch test and scope test to the top 3 candidates. If the user is stuck, offer 3 unexpected thematic associations yourself and pair them with simple mechanic verbs to demonstrate the combination technique. Prioritize ideas where the theme is mechanically integrated (the theme affects how the player interacts with the game) rather than narratively wrapped (the theme only appears in the story framing).

### User is a solo non-programmer
Twine (text/narrative games), Construct 3 (visual event-based 2D), and GB Studio (Game Boy-style games with no programming knowledge) are legitimate options. Set expectations honestly: the mechanical depth achievable without programming is lower, but narrative games, puzzle games built from pre-built building blocks, and top-down RPG Maker games are all viable jam entries. Kenney.nl asset packs plus Construct 3 is a realistic path to a completable 2D arcade game in 48 hours for a non-programmer.

### User is mid-jam and is 30 hours in with an unplayable game
This is a rescue scenario. Do not address root causes -- address only what is actionable in the remaining time. Ask: What is the minimum change that makes the game completable end-to-end? Often this means cutting 70% of the planned content, wiring up a hard-coded end screen, disabling broken features, and replacing them with placeholder text. A submitted game that is half-broken is always better than an unsubmitted game. Help the user identify the smallest path to a submittable state, not the best possible game.

### User's jam has engine or tool restrictions
Some jams (JS13K, Pico-8 jams, Game Boy jams) restrict the engine, file size, or rendering target. These constraints are features, not obstacles -- they force focus. For JS13K specifically: the 13KB limit (zipped JavaScript) rules out most engines, but Phaser with tree-shaking or a custom lightweight framework is viable. For Pico-8 jams: the 128x128 screen, 16-color palette, and token limit (8192 tokens) are the design space. Advise the user to embrace the constraint as a creative tool rather than fighting it.

### Team has a conflict or misalignment mid-jam
Disagreements most commonly arise over: the core concept, art style, which features to cut, or whether to sleep. The conflict resolution rule is non-negotiable: the person who implements the feature decides its implementation. For concept or scope conflicts after hour 4, the scope owner (or in a duo, whoever is the designated decision-maker agreed upon at the start) has final say. A jam is too short for design-by-committee. If the conflict cannot be resolved in 10 minutes, split the disputed feature onto the DREAM tier (cut it) and move forward.

### User wants to enter a jam for the first time and has never shipped a game
Adjust expectations and goals explicitly. The primary goal for a first jam is to submit something -- anything. A two-level platformer with rectangle art and three sound effects that reaches a game over screen is a complete success. Recommend a well-documented engine (Godot 4 for 2D with GDScript, or GameMaker if they know it), direct them to Kenney.nl for art assets, and have them build the core mechanic first with no art. First-timer failure modes are almost exclusively: trying to learn a new engine AND make a game simultaneously, or scoping a game far beyond what is feasible. Both of these are scope/tool problems, not skill problems.

### User wants to continue their jam game into a commercial release
Validate the decision against the three-part test (mechanic depth, player demand, personal excitement). If continuation is confirmed, give these specific directives: (1) Rest for one week before touching the project -- post-jam burnout is real and destroys commercial development momentum. (2) The jam codebase is a prototype -- rebuild it from scratch with clean architecture before adding new features. (3) Write a proper game design document for the expanded scope before writing a line of new code. (4) Playtest with at least 5 people who did not play the jam version -- their feedback is uncontaminated by nostalgia for the original. Reference examples: Celeste was a Pico-8 prototype rebuilt in Unity; Superhot was a 7DFPS jam entry rebuilt over 2 years; both teams cite the rebuild as essential to the commercial product's quality.

---

## Example

**Input from user:**
"I'm doing Ludum Dare 56 solo. The theme just dropped -- it's 'Tiny Creatures.' I use Godot 4 with GDScript, I can do basic pixel art in Aseprite, and I've done two jams before but never finished one. I have roughly 36 usable hours over the 72-hour window because of work. My goal is to finally finish and submit something."

---

**Output:**

### Ludum Dare 56 -- Execution Plan: "Tiny Creatures"

**Jam Parameters**
- Jam: Ludum Dare 56 (Compo -- solo, 72-hour window)
- Duration: 72-hour window, 36 hours realistically available
- Solo: Programmer + basic pixel artist (you)
- Engine / Tools: Godot 4, GDScript, Aseprite
- Goal: Submit a complete entry -- this is the primary success condition
- Practical Hours Available: 36

---

**Identifying the Failure Pattern**

You have not finished previous jams. This means the problem is almost certainly scope, not skill. Everything in this plan is optimized for finishing, not for making the best possible game.

---

**Ideation: Applying the Theme**

Free association from "Tiny Creatures" (sample output):
ants, microbes, insects, fairies, bacteria, gnomes, pixels, atoms, seeds, spores, cells, dust mites, sprites, bonsai, miniaturized humans, scale illusion

Promising mechanic combinations:
- Ants + platformer = Character is an ant navigating a giant human kitchen (scale illusion -- small creature, huge world)
- Bacteria + growth = You are a bacterium that must grow a colony by consuming cells (real-time strategy without the complexity)
- Miniaturized human + puzzle = You are shrunk and must navigate objects as if they were landscapes

**Recommended concept:** The ant-in-a-kitchen platformer.

- Core mechanic (one verb): **Navigating** (avoiding hazards while reaching a goal)
- Elevator pitch: "You are an ant navigating a kitchen counter, where everyday objects are massive obstacles, collecting crumbs to reach the anthill."
- Theme integration: The entire visual and gameplay design expresses smallness -- giant scissors as walls, a soap bar as a platform, a crumb as the win condition. Theme is mechanically integrated, not narrative wrapper.
- Scope test: Core prototype (ant character, one screen of platforms, one collectible, one end condition) is buildable in 6 hours in Godot 4.

---

**Scope Definition**

| Tier | Feature | Estimated Hours |
|------|---------|----------------|
| MUST HAVE | Ant character with left/right/jump | 2 hours |
| MUST HAVE | 3 levels (kitchen counter, floor, table) | 6 hours |
| MUST HAVE | One hazard type (water drop, human foot) | 2 hours |
| MUST HAVE | Crumb collectible and win state | 1 hour |
| MUST HAVE | Game over on hazard contact | 1 hour |
| NICE TO HAVE | 3--5 sound effects (step, collect, die, win) | 1 hour |
| NICE TO HAVE | Title screen with name and WASD/arrow controls listed | 1 hour |
| NICE TO HAVE | Screen shake on death | 0.5 hours |
| NICE TO HAVE | Particle dust on landing | 0.5 hours |
| DREAM | 4th level, boss object, multiple ant types | -- (cut) |
| DREAM | Procedurally generated kitchen | -- (cut) |

**Total Must-Have Hours: 12** -- leaves 24 hours of buffer for art, polish, and submission. This is intentionally easy because finishing is the goal.

---

**Phase Schedule (36 usable hours)**

| Phase | Usable Hours | Deliverable | Checkpoint Condition |
|-------|-------------|-------------|---------------------|
| Ideation | 0--2 | Committed concept, one-sentence pitch | Pitch stated above -- already done |
| Prototype | 2--8 | Ant moves, jumps, collects crumb, dies to hazard | Playable loop exists -- is it fun for 60 seconds? |
| Content | 8--22 | 3 complete levels, pixel art replacing rects, 3 SFX | Player can start and complete level 3 |
| Polish | 22--32 | Title screen, screen shake, particles, music | Top 5 polish items complete |
| Submission | 32--36 | HTML5 build live on itch.io | Submitted by hour 34 at latest |

**Sleep:** With a 72-hour window and 36 hours of work, sleep is not a constraint. Work in comfortable 4--6 hour blocks with real breaks.

---

**Tool Confirmation**
- Engine: Godot 4 with GDScript -- correct choice, you know it, web export is well-supported
- Art: Aseprite for pixel art. Style decision: 16x16 ant sprite, limited 8-color palette (black, brown, cream, red, grey, white, soft yellow, dark green). This is achievable in 3 hours total across all art assets.
- Audio: BFXR for all sound effects (footstep, collect crumb, death, level complete). Bosca Ceoil for one looping 30-second track. Total audio time budget: 90 minutes.
- Version control: Git repository, push to GitHub after every phase checkpoint. If not set up: enable Godot's built-in editor autosave at 5-minute intervals AND use a cloud-synced folder as backup.

---

**Top 3 Risks for This Specific Plan**

1. **Risk: You spend 8+ hours on pixel art and fall behind on content.**
Mitigation: Set a hard cap of 45 minutes per level's art assets. Use colored rectangles as placeholder until all 3 levels are complete and playable, then replace art. Art never before code completion.

2. **Risk: The jump feel is bad and you spend hours tuning physics.**
Mitigation: Use these starting values in Godot 4 for a responsive platformer feel: gravity 1500, jump velocity -400, max fall speed 800, horizontal speed 200, floor snap 4px. Tune for 30 minutes maximum, then lock and move on.

3. **Risk: Godot HTML5 export fails at submission time.**
Mitigation: Export to HTML5 and test in a browser at the end of the Prototype phase (hour 8). Fix any web export issues early. Common fix: enable "Thread Support" off in export settings if the game freezes on web.

---

**Cut Trigger:** If the game is not completable end-to-end (start through all 3 levels to win screen) by usable hour 22, immediately cut level 3, drop all NICE TO HAVE items except the title screen, and submit a 2-level game. A 2-level complete game beats a 3-level broken game in every rating category.

---

**Quick Reference Card**

```
YOUR USABLE HOUR TARGETS:
  Hour 2:  Concept committed (done -- see above)
  Hour 8:  Prototype playable -- fun check
  Hour 22: All 3 levels completable -- content lock
  Hour 32: Polish complete -- build ready
  Hour 34: HTML5 build submitted to itch.io

THE ONLY SUCCESS CONDITION:
  A submitted game. Any submitted game.
  Simple + finished > ambitious + broken.
```
