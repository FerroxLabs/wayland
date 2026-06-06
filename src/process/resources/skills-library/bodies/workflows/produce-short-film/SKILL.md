---
name: produce-short-film
description: >-
  End-to-end short film production workflow from script development through
  budgeting, crew assembly, principal photography, post-production, and festival
  distribution. Covers screenwriting, production planning, directing, editing,
  sound design, color grading, and the film festival submission strategy needed
  to get your short film seen.

  Use when the user wants to produce short film or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "screenwriting-coach short-film-director video-editor-guide"
trigger_phrases: >-
  I want to make a short film produce a short film short film production guide
  how to direct a short film film festival submission make my first movie short
  film from script to screen
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: video-production editing step-by-step planning
  category: creative-project
  depends: "screenwriting-coach short-film-director video-editor-guide"
---
# Produce Short Film

**Estimated time:** 2-4 months

This workflow guides you through producing a short film from initial concept to
festival exhibition. Short films are the proving ground of cinema: they
demonstrate your ability to tell a complete story in a compressed format, they
serve as calling cards for future work, and they are the primary currency of
film festivals worldwide.

The workflow covers six phases: script development, pre-production planning,
crew and cast assembly, principal photography, post-production, and
distribution through festivals and online platforms. It is designed for
filmmakers working with limited budgets who want to produce something that
looks and sounds professional.

By the end of this workflow you will have: a polished short film script, a
production plan, a completed film with professional post-production, and a
festival submission strategy.

## When to Use

- User wants to produce short film
- User needs a structured, step-by-step process for produce short film
- User wants to make a short film
- produce a short film
- short film production guide
- Do NOT use when: the request is outside the scope of produce short film or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A story idea suitable for short film format (2-20 minutes)
- A camera capable of shooting video (even a smartphone with good technique)
- A computer capable of video editing
- Budget for production (even micro-budget shorts have some costs)
- Ability to recruit at least a small crew (or willingness to wear multiple hats)

## Steps

**Step 1: Develop Your Script** (uses: screenwriting-coach)

develop a production-ready script. Focus
on:

- Input: story idea or concept, Desired film length (target 5-15 minutes for festival viability), Genre preferences and tonal goals
- Output: Properly formatted short film script, One-sentence pitch for the film, One-page story summary for submissions
- Key focus: Use the Screenwriting Coach skill to develop a production-ready script

**Step 2: Plan Pre-Production** (uses: short-film-director)

Use the Short Film Director and Video Producer skills to plan every aspect of
production before the camera rolls.

- Input: `screenplay` from Step 1 (script to break down), Available budget and resources
- Output: Element-by-element production requirements, Line-item budget with contingency, Complete shot list with framing and technical notes
- Key focus: Script breakdown: identifying every element needed (cast, locations, props,

**Step 3: Assemble Crew and Cast** (uses: short-film-director)

build your team.

- Input: `script-breakdown` from Step 2 (roles needed), `production-budget` from Step 2 (compensation framework), `screenplay` from Step 1 (material for auditions)
- Output: Confirmed cast with contact information and availability, Confirmed crew with roles and responsibilities, Call sheets, release forms, and agreements
- Key focus: Identifying essential crew positions: DP/cinematographer, sound recordist,

**Step 4: Shoot Principal Photography** (uses: short-film-director)

Use the Short Film Director and Video Producer skills to execute principal
photography.

- Input: `shot-list` from Step 2 (shots to capture), `production-schedule` from Step 2 (daily shooting plan), `cast-list` and `crew-list` from Step 3 (your team)
- Output: Organized, labeled footage from all shoot days, Clean audio files synced with video, Notes on shots completed, issues, and pickup needs
- Key focus: Preparing detailed call sheets for each shoot day with locations, times,

**Step 5: Complete Post-Production** (uses: video-editor-guide)

Use the Video Editor Guide and Sound Designer skills to assemble and polish
the film.

- Input: `raw-footage` from Step 4 (material to edit), `sound-recordings` from Step 4 (audio to mix), `screenplay` from Step 1 (story to reference)
- Output: First assembly for feedback screening, Completed film with sound design and color grading, Final audio mix at broadcast standards
- Key focus: Organizing footage: syncing audio, creating bins, and logging selects

**Step 6: Distribute Through Festivals and Online** (uses: short-film-director)

Use the Short Film Director and Content Monetizer skills to get your film seen.

- Input: `final-cut` from Step 5 (completed film), `logline` and `synopsis` from Step 1 (submission materials), `export-package` from Step 5 (delivery formats)
- Output: Target festivals with submission deadlines and fees, Stills, director statement, bio, logline, synopsis, and poster, Festival applications with status tracking
- Key focus: Researching film festivals by tier: top-tier (Sundance, SXSW, Clermont-

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Writing beyond your budget:** A script requiring 20 locations, car chases, and crowd scenes on a micro-budget is a recipe for disappointment. Write for what you can actually produce.
- **Skipping pre-production:** Every hour of planning saves four hours on set. Do not show up to shoot without a shot list and schedule.
- **Neglecting sound:** Audiences forgive imperfect images but not bad audio. Invest in a decent microphone and record clean sound on set.
- **Shooting without coverage:** Getting only one angle per scene leaves the editor with no options. Capture wide, medium, and close-up for every important moment.
- **Festival submission without strategy:** Submitting to 50 random festivals wastes money. Research tier-appropriate festivals that program your genre and length.

## Expected Outcome

When this workflow is complete, the user will have:

1. A polished short film script tells a complete story in the target runtime
2. Pre-production planning prevents costly mistakes during shooting
3. Principal photography captures clean footage with professional audio
4. Post-production delivers a film with polished editing, sound, and color
5. The film is submitted to appropriate festivals and released online
6. The filmmaker has a finished calling card and documented lessons for the next project

## Output Format

```
PRODUCE SHORT FILM TRACKER
==========================

[ ] Step 1: Develop Your Script
    Status: [pending/in-progress/complete]
[ ] Step 2: Plan Pre-Production
    Status: [pending/in-progress/complete]
[ ] Step 3: Assemble Crew and Cast
    Status: [pending/in-progress/complete]
[ ] Step 4: Shoot Principal Photography
    Status: [pending/in-progress/complete]
[ ] Step 5: Complete Post-Production
    Status: [pending/in-progress/complete]
[ ] Step 6: Distribute Through Festivals and Online
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Writing beyond your budget:** A script requiring 20 locations, car chases, and crowd scenes on a micro-budget is a recipe for disappointment. Write for what you can actually produce.
- **Skipping pre-production:** Every hour of planning saves four hours on set. Do not show up to shoot without a shot list and schedule.
- **Neglecting sound:** Audiences forgive imperfect images but not bad audio. Invest in a decent microphone and record clean sound on set.
- **Shooting without coverage:** Getting only one angle per scene leaves the editor with no options. Capture wide, medium, and close-up for every important moment.

## Example

**Input:** "I want to produce short film and need a structured plan to follow step by step."

**Output:**

**Step 1 (screenwriting-coach):** Develop Your Script -- produces concrete deliverables for this phase.

**Step 2 (short-film-director-video-producer):** Plan Pre-Production -- produces concrete deliverables for this phase.

**Step 3 (short-film-director):** Assemble Crew and Cast -- produces concrete deliverables for this phase.

**Step 4 (short-film-director-video-producer):** Shoot Principal Photography -- produces concrete deliverables for this phase.

**Step 5 (video-editor-guide-sound-designer):** Complete Post-Production -- produces concrete deliverables for this phase.

**Step 6 (short-film-director-content-monetizer):** Distribute Through Festivals and Online -- produces concrete deliverables for this phase.

**Result:** User has a complete produce short film plan with all deliverables produced, validated, and ready for implementation.
