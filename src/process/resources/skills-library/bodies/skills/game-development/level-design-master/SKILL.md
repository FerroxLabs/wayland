---
name: level-design-master
description: |
  Comprehensive level design expertise covering flow theory application, pacing and intensity curves, environmental storytelling, spatial composition, player guidance without hand-holding, playtesting methodology, iterative blockout workflow, and the craft of building spaces that teach, challenge, and delight players. Use when the user asks about level design master or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
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

# Level Design Master

## When to Use

**Use this skill when:**
- The user needs to design game levels with proper pacing, intensity curves, and flow theory application
- The user wants guidance on spatial composition, player guidance techniques, or environmental storytelling within levels
- The user is building a blockout or greybox and needs iterative level design workflow advice
- The user needs help with level difficulty progression, safe rooms, or gating mechanics
- The user wants playtesting methodology specific to level design and spatial navigation

**Do NOT use this skill when:**
- The user needs overall game design guidance beyond level layout (use video-game-designer instead)
- The user is writing game narrative or dialogue rather than designing spaces (use game-narrative-writer instead)
- The user is designing puzzle mechanics rather than level structure (use game-puzzle-designer instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to level design master.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on level design master
- User asks about level design master best practices or techniques
- User wants a structured approach to level design master

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of level design master

You are an expert level designer with deep knowledge of spatial design, player psychology, flow theory, environmental storytelling, and iterative design methodology. You help game developers build levels that guide players intuitively, create memorable moments, and maintain engagement through carefully crafted pacing.

## Questions to Ask First

Before designing any level, clarify:

1. What is the game genre and perspective? (FPS, platformer, RPG, top-down, 3D)
2. What core mechanic should this level showcase or test?
3. Where does this level sit in overall progression? (Early, mid, late, optional)
4. What is the target duration? (2 minutes, 10 minutes, 30 minutes)
5. What is the emotional arc? (Tension, exploration, relief, climax, mystery)
6. What mechanics has the player already learned? What is new?
7. What is the difficulty target relative to surrounding levels?
8. Is this linear, open area, hub, or branching path?

## Flow Theory in Level Design

```
FLOW STATE: Challenge matches skill. Not too easy, not too hard.

       Challenge
       High  |     ANXIETY
             |    /
             |   / FLOW CHANNEL  <-- Target zone
             |  /
       Low   |/ BOREDOM
             +---------------
             Low         High
                  Skill

LEVEL DESIGN FLOW TOOLS:
  - Ramp difficulty with enemy count before new types
  - Safe spaces to practice new mechanics
  - Checkpoint after learning, before testing
  - Optional challenge rooms for above-flow players
  - Accessibility options for below-flow players
```

### Teaching Through Level Design

```
STAGE 1 -- INTRODUCTION (Safe):
  Present mechanic with zero failure consequence.
  Example: Short wall with reward on top. Fall = safe ground.

STAGE 2 -- PRACTICE (Low stakes):
  Require mechanic to proceed with generous margins.
  Example: Three wall jumps with wide walls.

STAGE 3 -- CHALLENGE (Moderate):
  Combine new mechanic with previously learned mechanics.
  Example: Wall jump over enemy, land on moving platform.

STAGE 4 -- MASTERY TEST (High stakes):
  Demanding execution under pressure.
  Example: Vertical shaft with hazards and time limit.

STAGE 5 -- TWIST (Subversion):
  Use mechanic in unexpected context.
  Example: Wall jump to redirect a projectile.

NINTENDO'S STRUCTURE: Introduce, Develop, Twist, Conclude
```

## Pacing and Intensity

### The Intensity Curve

```
Intensity
  High |           *
       |         *   *
       |    *  *       *
       |  *              *
  Low  |*                   *
       +----------------------
       A    B   C   D   E   F

  A = Opening (establish mood, orient player)
  B = Rising action (challenge builds, stakes increase)
  C = Breather (safe area, reward, story moment)
  D = Escalation (harder challenges, new combinations)
  E = Climax (peak challenge, boss, set piece)
  F = Resolution (reward, debrief, transition)

PACING RULES:
  1. Never two high-intensity sections back-to-back without relief
  2. Relief = healing, resources, story, beauty
  3. Longest calm section precedes hardest challenge
  4. Post-climax decompression prevents exhaustion
  5. Optional content lives in lower-intensity zones
```

### Encounter Design

```
COMBAT ENCOUNTER TEMPLATE:
  Setup (5-10s) -> Trigger -> Wave 1 -> Escalation -> Peak -> Cleanup -> Reward

ARENA CHECKLIST:
  [ ] Multiple cover positions and flanking routes
  [ ] Verticality (high ground advantage)
  [ ] Environmental hazards (optional player use)
  [ ] Health/ammo in risky positions (risk-reward)
  [ ] Exit visible but locked during combat

PUZZLE TEMPLATE:
  Observation -> Experimentation -> Insight -> Execution -> Reward

PUZZLE RULES:
  1. All elements visible from one vantage point
  2. Solution feels clever, not obscure
  3. Feedback on partial progress
  4. Maximum 3 steps per single puzzle
```

## Environmental Storytelling

```
TECHNIQUES:

1. VIGNETTES: Self-contained scenes telling micro-stories
   Two chairs by a cold fireplace. A child's toy near a skeleton.
   Ask: "What happened here?"

2. BREADCRUMB NARRATIVES: Connected details across rooms
   Room 1: Empty birdcage, open window
   Room 2: Feathers on floor
   Room 3: Note about "the last bird"

3. CONTRAST: Elements creating tension through juxtaposition
   Beautiful garden next to destroyed house.
   Children's drawings on prison walls.

4. LIVED-IN DETAILS: Wear patterns, personal belongings,
   food in stages of decay, graffiti, daily life traces

5. ARCHITECTURE AS NARRATIVE:
   Grand hall = authority. Cramped corridors = oppression.
   Overgrown ruins = time passed. Fortified = fear.

CHECKLIST PER MAJOR SPACE:
  [ ] Who used this space?
  [ ] What happened here?
  [ ] What story does this tell without text?
  [ ] Does lighting/color support the intended emotion?
```

## Player Guidance

### Guiding Without Hand-Holding (subtle to overt)

```
1. SPATIAL COMPOSITION: Leading lines, framing, negative space,
   converging geometry pointing toward objectives

2. LIGHTING: Light draws players (bright destination, dim elsewhere)
   Warm = safe, cool = danger. Dynamic light catches attention.

3. COLOR: Interactive objects share consistent color language.
   High contrast on important elements. Red = danger, green = safe.

4. AUDIO: Directional sound toward goals. Music intensity = proximity.

5. LANDMARKS (Weenies): Tall visible structures seen from anywhere.
   Establishes direction and distance. Disney's castle principle.

6. BREADCRUMBS: Collectibles along correct path. Resources as guide.

7. EXPLICIT UI (sparingly): Waypoints, minimap, tutorial text.
   Supplement spatial design, don't replace it.
```

### Spatial Composition

```
VISTA MOMENTS: Viewpoints showing destination and journey so far.
  Place at section transitions.

FRAMING: Architecture frames important elements.
  Doorway frames next area. Window frames distant landmark.

DENIAL AND REVEAL: Block view, then reveal dramatically.
  Narrow corridor opens to vast cavern. Underground to mountaintop.

T-INTERSECTION RULE: Place reward in dead-end direction,
  progression in other. Players explore, find reward, continue.

LOOP-BACK PRINCIPLE: Exploration loops back to main path.
  Dead ends frustrate. Loops reward. Unlock shortcuts.

THREE-DOOR CHOICE: One obvious path, one hidden/difficult path
  with reward, one that circles back with bonus.
```

## Playtesting Methodology

```
DEFINE QUESTIONS (never just "is it fun?"):
  Can players find the critical path without help?
  Where do they get lost or confused?
  Is difficulty matching intended intensity?
  How long does each section take vs. target?

THE CARDINAL RULE: Do not help. Do not explain. Watch silently.

OBSERVE:
  [ ] Where player looks first in each new space
  [ ] Where player goes vs. where you intended
  [ ] Hesitation (confusion or deciding)
  [ ] Delight (leaning forward, smiling)
  [ ] Frustration (repeated attempts, sighing)

ANALYZE (5+ testers):
  Pattern = 3+ testers same behavior (design problem)
  Coincidence = 1 tester unusual behavior (ignore)

PRIORITIZE:
  Critical: Player cannot progress (blocked, softlocked)
  Major: Player gets lost or has wrong experience
  Minor: Player misses optional content
  Polish: Fine-tuning timing, visuals, audio cues
```

## Iteration Workflow

```
PHASE 1: PAPER DESIGN (1-2 days)
  Sketch level flow, map intensity curve, define key moments

PHASE 2: GRAYBOX BLOCKOUT (3-7 days)
  Primitive shapes only. Focus: scale, flow, sightlines, pacing.
  NO art. Playtest with 3-5 people. Iterate.
  This is where 80% of design decisions happen.

PHASE 3: GAMEPLAY PASS (5-10 days)
  Add enemies, items, triggers, scripted events.
  Placeholder audio and lighting. Playtest with 5+ people.

PHASE 4: ART PASS (varies)
  Replace graybox with final art. Add details, storytelling,
  lighting, atmosphere. Playtest: Does art help or confuse navigation?

PHASE 5: POLISH (3-5 days)
  Final audio, performance, bugs, accessibility. Fresh player test.

RULES:
  Never skip graybox. Each phase ends with playtest.
  Kill your darlings: beautiful section with bad flow = fix the flow.
  Done when playtests produce no critical issues.
```

## Level Design Metrics

```
| Metric              | Casual    | Core      | Hardcore  |
|---------------------|-----------|-----------|-----------|
| Completion rate      | >90%      | >70%      | >40%     |
| Deaths per level     | 0-1       | 2-5       | 5-15     |
| Secret discovery     | >50%      | 20-40%    | 10-25%   |
| Navigation accuracy  | >85%      | >70%      | >50%     |
| Duration accuracy    | +/- 20%   | +/- 30%   | +/- 50%  |
```

## Common Mistakes

```
NAVIGATION: Invisible wall maze | Dead ends with no reward
  Critical path looks like side path | Same-looking corridors

PACING: Two bosses back-to-back | 10-min section with zero encounters
  Cutscene interrupting high tension | Level that overstays its welcome

DIFFICULTY: Sudden spike with no ramp | Checkpoint before cutscene
  New enemies AND new mechanics at once | Punishing with lost progress

SPATIAL: Rooms with no purpose | Corridors longer than needed
  Scale mismatch | No vertical space use | No visual hierarchy

STORYTELLING: All story in text logs | Over-explaining what
  environment shows | Important details in easily missed locations
```


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Level Design Master deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with level design master for a mid-size project."

**Output:** A complete level design master framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
