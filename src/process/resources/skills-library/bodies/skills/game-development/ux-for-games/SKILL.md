---
name: ux-for-games
description: |
  Game UX design covering UI patterns and HUD design, menu systems, onboarding and tutorial flows, accessibility standards, player feedback systems, input design, information hierarchy, playtesting for UX, and the unique challenges of designing interfaces for interactive entertainment. Use when the user asks about ux for games or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
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

# Ux For Games

## When to Use

**Use this skill when:**
- The user needs to design game UI, HUD layouts, menu systems, or information hierarchy for a game
- The user wants guidance on onboarding flows, tutorial design, or first-time user experience in games
- The user needs help with game accessibility standards (colorblind support, remapping, subtitles, difficulty options)
- The user wants to improve player feedback systems, input design, or control feel across platforms
- The user is playtesting for UX issues and needs structured observation and analysis methods

**Do NOT use this skill when:**
- The user is designing UX for a non-game application or website (use the appropriate UX/UI skill instead)
- The user needs overall game design guidance beyond the interface layer (use video-game-designer instead)
- The user wants to design game audio feedback rather than visual/interaction UX (use game-audio-designer instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to ux for games.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on ux for games
- User asks about ux for games best practices or techniques
- User wants a structured approach to ux for games

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of ux for games

You are a senior game UX designer who has worked across mobile, console, and PC titles. You understand that game UX is fundamentally different from application UX because games intentionally create friction, challenge, and emotional states that would be failures in a productivity app. Your job is to remove unintentional friction while preserving intentional challenge, ensuring that every player can understand, navigate, and enjoy the game regardless of their experience level.

## Questions to Ask First

1. What platform(s) is your game targeting? (PC, console, mobile, VR, cross-platform)
2. What genre is the game? (Action, RPG, strategy, puzzle, simulation, narrative)
3. Who is your target audience? (Hardcore, casual, all ages, specific demographic)
4. What is the current state of the UI? (Concept, prototype, production, shipped and iterating)
5. What engine are you using? (Unity, Unreal, Godot, custom)
6. What input methods must you support? (Controller, keyboard+mouse, touch, VR controllers)
7. What are the biggest UX complaints from playtesters?
8. Does the game have accessibility features? Which ones?
9. How complex is the game's systems layer? (Simple arcade to deep simulation)
10. What games do you look to as UX benchmarks?

## Game UI Patterns

### HUD Design
```
HUD (Heads-Up Display) DESIGN PRINCIPLES:

1. SHOW ONLY WHAT THE PLAYER NEEDS RIGHT NOW
   Context-sensitive HUD: Elements appear when relevant, hide when not.
   Example: Health bar appears when taking damage, fades when at full health.
   Ammo count appears when weapon is drawn, hides during exploration.

2. HIERARCHY OF INFORMATION
   Critical (always visible): Health, minimap, objective marker
   Important (visible during gameplay): Ammo, abilities, compass
   Secondary (on demand): Inventory, quest log, detailed map
   Tertiary (in menus only): Settings, lore, statistics

3. SCREEN REAL ESTATE
   Corners: Static information (health bottom-left, minimap top-right)
   Center: Temporary information (damage indicators, prompts, crosshair)
   Edges: Dynamic information (notifications, buff/debuff timers)

   RULE: The center of the screen is sacred. Never clutter it.
   The player's eyes need to focus on the game world.

4. DIEGETIC vs NON-DIEGETIC UI
   Diegetic: UI exists in the game world
     Example: Health displayed on the character's suit (Dead Space)
     Pros: Immersive, does not break the fourth wall
     Cons: Harder to read, limited information density

   Non-diegetic: Traditional overlay UI
     Example: Health bar in the corner of the screen
     Pros: Clear, readable, flexible
     Cons: Less immersive, can clutter the screen

   Spatial: UI attached to objects in the world
     Example: Enemy health bars floating above their heads
     Example: Interaction prompts appearing near objects

   Meta: UI that exists between diegetic and non-diegetic
     Example: Blood splatter on screen when damaged
     Example: Screen desaturation when low health

HUD DESIGN CHECKLIST:
  - [ ] Critical information is readable at a glance (under 0.5 seconds)
  - [ ] Non-critical elements can be hidden or toggled
  - [ ] HUD works at all supported resolutions and aspect ratios
  - [ ] HUD elements do not obscure gameplay-critical visuals
  - [ ] Colors provide sufficient contrast against all backgrounds
  - [ ] HUD scales appropriately for display distance (TV vs monitor vs mobile)
```

### Menu Systems
```
MENU HIERARCHY:
  Main Menu:
    - Continue / New Game / Load Game
    - Settings
    - Credits
    - Quit

  Pause Menu:
    - Resume (most prominent, easiest to reach)
    - Settings (subset: audio, controls, display)
    - Save / Load
    - Quit to Main Menu

  In-Game Menus:
    - Inventory / Equipment
    - Map
    - Quest Log / Journal
    - Character / Skills
    - Codex / Lore
    - Social (multiplayer)

MENU DESIGN RULES:
  1. The player should reach any menu within 2 button presses
  2. Back/Cancel should always work and never lose progress
  3. The most common action should be the default selection
  4. Settings changes should preview in real-time (not after Apply)
  5. Save status should be visible (when did I last save?)
  6. Loading screens should show useful information (tips, lore, controls)
  7. Menu navigation should feel responsive (< 100ms response time)
  8. Menus should be navigable by BOTH controller and mouse
     (even on PC, many players use controllers)

INVENTORY UI PATTERNS:
  Grid layout: Visual, good for small inventories (Resident Evil)
  List layout: Efficient, good for large inventories (Elder Scrolls)
  Tab-based: Categories organized by type (weapons, armor, consumables)
  Radial menu: Quick selection during gameplay (Zelda: BotW)
  Equipment paper doll: Visual representation of equipped items

  KEY: Always show what an item DOES (stats, effects, comparison)
  before the player commits to using or equipping it.
```

## Onboarding and Tutorial Design

### Teaching Players Without Boring Them
```
THE ONBOARDING SPECTRUM:
  EXPLICIT TUTORIAL: Step-by-step instructions, hold the player's hand
    When to use: Complex systems, older/casual audience, unique mechanics
    Risk: Boring experienced players, feels like homework

  CONTEXTUAL TEACHING: Prompts appear when the player needs them
    When to use: Most games, most of the time
    Example: "Press X to interact" appears when near an interactable object
    Risk: Player may miss prompts, no guarantee they learn

  GATED DISCOVERY: Introduce mechanics one at a time through level design
    When to use: Action games, platformers, puzzle games
    Example: First room only has one mechanic. Second room adds another.
    Risk: Requires careful level design

  SINK OR SWIM: No tutorial, player figures it out
    When to use: Intentionally challenging games (Dark Souls, roguelikes)
    Risk: High player drop-off, frustration

ONBOARDING DESIGN PRINCIPLES:
  1. Teach through PLAY, not through TEXT
     BAD: "Press LB to dodge. Dodging makes you invulnerable for 0.3 seconds."
     GOOD: Put an enemy that telegraphs a slow attack. Player naturally
     tries to dodge. Success teaches the timing. Failure is low-cost.

  2. One mechanic at a time
     Never introduce two new systems simultaneously.
     Let the player master each one before adding complexity.

  3. Safe space to fail
     First encounters should be forgiving. Low stakes.
     Do not put the hardest content in the first hour.

  4. Allow skipping
     Experienced players should be able to skip or speed through tutorials.
     Never force a veteran player through basic instructions.

  5. Remind without nagging
     Show control prompts the first 3 times, then hide them.
     Make a control reference accessible in the pause menu.

ONBOARDING FLOW TEMPLATE:
  Minute 0-2: Player has control. Something simple and satisfying happens.
  Minute 2-5: Introduce core movement and interaction mechanics.
  Minute 5-10: Introduce the primary gameplay mechanic (combat, building, etc).
  Minute 10-20: First real challenge using the mechanics taught.
  Minute 20-30: Introduce the game's systems (inventory, upgrades, map).
  Minute 30-60: Player is autonomous and exploring/playing without prompts.

  By the end of the first hour, the player should:
  - Understand all basic controls
  - Have experienced the core gameplay loop at least once
  - Have a goal or objective they care about
  - Feel competent (not frustrated, not bored)
```

## Accessibility

### Game Accessibility Standards
```
VISUAL ACCESSIBILITY:
  - [ ] Colorblind modes (protanopia, deuteranopia, tritanopia)
    Do not just shift colors -- use shapes, patterns, and labels as well
  - [ ] Text size options (minimum 28px on console at 1080p)
  - [ ] High contrast mode for UI elements
  - [ ] Subtitle options: Size, background, speaker identification, color
  - [ ] Screen reader support for menus (where possible)
  - [ ] Reduce/disable screen shake and flash effects
  - [ ] Photosensitivity warning for intense visual effects

AUDITORY ACCESSIBILITY:
  - [ ] Subtitles and closed captions (not just dialogue -- sound effects too)
  - [ ] Visual cues for important audio events (directional damage, alarms)
  - [ ] Independent volume sliders (music, SFX, dialogue, ambient)
  - [ ] Speaker labels on subtitles
  - [ ] Mono audio option (for players with single-sided hearing)

MOTOR ACCESSIBILITY:
  - [ ] Fully remappable controls (every button)
  - [ ] One-handed control options
  - [ ] Toggle vs hold options for all sustained inputs (sprint, aim, crouch)
  - [ ] Auto-aim or aim assist options
  - [ ] Adjustable input timing windows (QTEs, combo timing)
  - [ ] Skip or simplify complex input sequences
  - [ ] Controller vibration toggle

COGNITIVE ACCESSIBILITY:
  - [ ] Difficulty options that are clearly described (not just Easy/Hard)
  - [ ] Quest markers and navigation aids (toggleable)
  - [ ] Objective reminders accessible at any time
  - [ ] Clear, consistent iconography
  - [ ] Option to slow game speed
  - [ ] Recap or journal features for returning after a break

ACCESSIBILITY IS NOT OPTIONAL:
  15-20% of players have some form of disability.
  Accessibility features also help non-disabled players
  (subtitles in a loud room, remappable controls for comfort).
  Build accessibility from the start, not as an afterthought.
```

## Player Feedback Systems

### Communicating State to the Player
```
FEEDBACK TYPES:
  VISUAL FEEDBACK:
    - Damage numbers floating above enemies
    - Screen flash on hit (taken or dealt)
    - Health bar color change (green -> yellow -> red)
    - UI animation on pickup or achievement
    - Enemy stagger animation on critical hit
    - Environmental changes (door opening, light turning on)

  AUDIO FEEDBACK:
    - Distinct sounds for: hit, miss, critical, kill, pickup, error
    - Music intensity changes with gameplay intensity
    - Environmental audio cues (approaching danger, nearby treasure)
    - UI sounds for navigation (hover, select, back, error)

  HAPTIC FEEDBACK (controller vibration):
    - Rumble on impact, weapon fire, explosions
    - Subtle vibration for environmental awareness
    - DualSense adaptive triggers for weapon resistance

  INFORMATIONAL FEEDBACK:
    - Damage numbers (how much damage you dealt)
    - XP gains and progress bars
    - Achievement notifications
    - Combo counters
    - Score multipliers

FEEDBACK DESIGN RULES:
  1. EVERY player action should produce visible/audible feedback
     If I press a button and nothing happens, that is a UX failure.

  2. Positive actions should feel GOOD (satisfying sound, visual pop)
     Negative actions should feel CLEAR (distinct error sound, shake)

  3. Feedback intensity should match action importance
     Picking up a coin: Small sound + small number
     Defeating a boss: Screen shake + particle explosion + music swell

  4. Feedback should be IMMEDIATE (< 100ms)
     Delayed feedback breaks the connection between action and result.

  5. Allow players to adjust feedback intensity
     Some players want maximum juice. Others find it overwhelming.
```

## Playtesting for UX

### UX Playtest Methodology
```
WHAT TO TEST:
  - Can players complete the tutorial without external help?
  - Do players understand what to do next at all times?
  - Can players find and use menu features?
  - Do players understand the HUD information?
  - Are there moments of confusion or frustration?
  - Do players miss important information or mechanics?

PLAYTEST FORMAT:
  1. OBSERVATION (most valuable)
     Watch the player play. Do not help. Do not explain.
     Note where they hesitate, struggle, misclick, or express confusion.
     Record the session (screen + face camera if possible).

  2. THINK-ALOUD
     Ask the player to narrate their thoughts as they play.
     "I think I need to go over there... I am not sure what this icon means..."
     This reveals their mental model and expectations.

  3. POST-PLAY INTERVIEW
     After the session, ask:
     - What was confusing or frustrating?
     - What did you enjoy most?
     - Was there a moment where you did not know what to do?
     - What would you change about the controls?
     - Rate the difficulty (too easy, just right, too hard)

  4. QUANTITATIVE DATA (at scale)
     Heatmaps: Where do players spend time? Where do they die?
     Funnels: Where do players drop off in the tutorial or progression?
     Session data: How long do players play? When do they quit?
     Completion rates: What percentage of players reach key milestones?

PLAYTEST CADENCE:
  Prototype: Test with 3-5 people every 2 weeks
  Alpha: Test with 10-20 people monthly
  Beta: Test with 50+ people, collect quantitative data
  Post-launch: Monitor analytics, respond to community feedback

THE 5-PLAYER RULE:
  5 playtesters will find 80% of usability issues.
  You do not need 50 testers to find UX problems.
  You need 5 testers and the discipline to watch them struggle.
```

## Output Checklist

- [ ] HUD designed with information hierarchy and context sensitivity
- [ ] Menu system navigable within 2 button presses to any screen
- [ ] Onboarding flow designed to teach through play, not text
- [ ] Tutorial is skippable for experienced players
- [ ] Accessibility features implemented across visual, audio, motor, cognitive
- [ ] Controls are fully remappable with toggle/hold options
- [ ] Player feedback system provides clear response to every action
- [ ] Subtitles and closed captions available with customization
- [ ] UX playtesting conducted with observation and think-aloud methods
- [ ] Input works consistently across all supported platforms and devices


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Ux For Games deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with ux for games for a mid-size project."

**Output:** A complete ux for games framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
