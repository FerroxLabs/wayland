---
name: produce-documentary
description: >-
  End-to-end documentary filmmaking workflow from subject selection and research
  through shooting, interview technique, editing, and distribution. Covers
  documentary storytelling, ethical considerations, interview methodology,
  archival research, verite and observational techniques, narrative structure in
  nonfiction, and festival and streaming distribution strategies.

  Use when the user wants to produce documentary or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "documentary-maker video-editor-guide content-monetizer"
trigger_phrases: >-
  I want to make a documentary produce a documentary film documentary filmmaking
  guide how to shoot a documentary tell a true story on film nonfiction
  filmmaking documentary from start to finish
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: >-
    video-production interview-prep editing creative-writing step-by-step
    planning
  category: creative-project
  depends: "documentary-maker video-editor-guide content-monetizer"
---
# Produce Documentary

**Estimated time:** 3-8 months

This workflow guides you through producing a documentary from subject selection
to distribution. Documentary filmmaking is a unique discipline: unlike fiction
film, you cannot fully script reality. You must research deeply, build trust
with subjects, capture authentic moments, and then find the story in the editing
room. The best documentaries change how people see the world.

The workflow covers five phases: subject research and development, pre-production
and planning, shooting (interviews and verite footage), post-production, and
distribution. It works for feature-length documentaries, short docs, and
docuseries episodes.

By the end of this workflow you will have: a thoroughly researched subject, a
shooting plan, captured interviews and verite footage, a professionally edited
documentary, and a distribution strategy through festivals, streaming, or
online platforms.

## When to Use

- User wants to produce documentary
- User needs a structured, step-by-step process for produce documentary
- User wants to make a documentary
- produce a documentary film
- documentary filmmaking guide
- Do NOT use when: the request is outside the scope of produce documentary or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A subject you are passionate about and have access to
- A camera capable of recording video and a quality microphone
- Access to interview subjects who are willing to participate
- Understanding that documentary filmmaking requires ethical sensitivity
- Budget for production (travel, equipment, post-production)

## Steps

**Step 1: Research Your Subject** (uses: documentary-maker)

Use the Documentary Maker and Story Writer skills to research the subject
deeply and develop the documentary's approach.

- Input: documentary subject or topic area, Existing knowledge and access to the subject, Target format: feature (60-90 min), short (10-40 min), or series
- Output: The driving question the documentary explores, Background research, existing coverage, and gap analysis, Key interview subjects with access assessment
- Key focus: Defining the central question the documentary will explore (documentaries

**Step 2: Plan Your Production** (uses: documentary-maker)

Use the Documentary Maker and Video Producer skills to plan the production.

- Input: `treatment` from Step 1 (documentary approach), `subject-access-plan` from Step 1 (who and where to shoot), `research-file` from Step 1 (content to cover)
- Output: Question guides for each interview subject, Production timeline with locations and subjects, Gear list and rental needs
- Key focus: Creating an interview schedule: who to interview, in what order, and what

**Step 3: Shoot Interviews and Verite Footage** (uses: documentary-maker)

Use the Documentary Maker and Video Producer skills to capture the documentary's
raw material.

- Input: `interview-guides` from Step 2 (questions to ask), `shooting-schedule` from Step 2 (production plan), `equipment-plan` from Step 2 (gear to use)
- Output: All interview recordings with audio synced, Observational footage captured during production, Categorized b-roll footage for editing
- Key focus: Setting up interviews: proper lighting, clean audio (two audio sources for

**Step 4: Edit and Assemble** (uses: video-editor-guide)

Use the Video Editor Guide and Sound Designer skills to find and construct the
story in the editing room.

- Input: `interview-footage` from Step 3 (core content), `verite-footage` from Step 3 (observational material), `b-roll-library` from Step 3 (visual support)
- Output: Complete transcriptions of all interviews, Selected segments and proposed narrative structure, First assembly for feedback
- Key focus: Transcribing all interviews (this is essential; you edit documentaries from

**Step 5: Distribute and Share** (uses: content-monetizer)

Use the Content Monetizer and Documentary Maker skills to get the documentary
to audiences.

- Input: `final-cut` from Step 4 (completed documentary), `treatment` from Step 1 (pitch material to adapt), `export-package` from Step 4 (delivery formats)
- Output: Trailer, stills, director's statement, synopsis, and poster, Target festivals with submission deadlines, Platform pitches, broadcast sales, and online release timing
- Key focus: Creating submission materials: trailer, director's statement, synopsis,

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Starting with an answer instead of a question:** Documentaries that set out to prove a predetermined thesis feel like propaganda. Start with a genuine question and let the research and subjects provide answers.
- **Too many talking heads, not enough visual storytelling:** A documentary that is just interviews with b-roll is a radio show with pictures. Plan verite footage, archival materials, and visual sequences that tell the story visually.
- **Not transcribing before editing:** Editing a documentary by scrubbing through hours of footage is impossibly slow. Transcribe everything and paper-edit from transcripts first.
- **Manipulating through music:** Laying emotional music under an interview to tell the audience how to feel is manipulative. Let the content carry the emotion. Use music sparingly and honestly.
- **Ignoring ethical obligations:** Your subjects trusted you with their stories. Representing them fairly, honoring agreements about what to include, and obtaining proper consent are not optional.

## Expected Outcome

When this workflow is complete, the user will have:

1. The central question drives a compelling narrative
2. Research is thorough and provides context the audience needs
3. Interviews capture authentic, revealing moments from key subjects
4. Verite footage provides visual storytelling beyond talking heads
5. The edit constructs a clear narrative from raw material
6. The documentary is distributed through appropriate channels and reaches its audience
7. Ethical responsibilities to subjects are honored throughout

## Output Format

```
PRODUCE DOCUMENTARY TRACKER
===========================

[ ] Step 1: Research Your Subject
    Status: [pending/in-progress/complete]
[ ] Step 2: Plan Your Production
    Status: [pending/in-progress/complete]
[ ] Step 3: Shoot Interviews and Verite Footage
    Status: [pending/in-progress/complete]
[ ] Step 4: Edit and Assemble
    Status: [pending/in-progress/complete]
[ ] Step 5: Distribute and Share
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Starting with an answer instead of a question:** Documentaries that set out to prove a predetermined thesis feel like propaganda. Start with a genuine question and let the research and subjects provide answers.
- **Too many talking heads, not enough visual storytelling:** A documentary that is just interviews with b-roll is a radio show with pictures. Plan verite footage, archival materials, and visual sequences that tell the story visually.
- **Not transcribing before editing:** Editing a documentary by scrubbing through hours of footage is impossibly slow. Transcribe everything and paper-edit from transcripts first.
- **Manipulating through music:** Laying emotional music under an interview to tell the audience how to feel is manipulative. Let the content carry the emotion. Use music sparingly and honestly.


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

### Success Indicators

Track these signals to confirm the workflow is on track:

- Each step produces a concrete, reviewable deliverable
- User confidence increases as steps are completed
- Deliverables from early steps remain valid as later steps are executed
- No critical assumptions from earlier steps are invalidated
- External feedback (where applicable) is incorporated before proceeding

## Example

**Input:** "I want to produce documentary and need a structured plan to follow step by step."

**Output:**

**Step 1 (documentary-maker-story-writer):** Research Your Subject -- produces concrete deliverables for this phase.

**Step 2 (documentary-maker-video-producer):** Plan Your Production -- produces concrete deliverables for this phase.

**Step 3 (documentary-maker-video-producer):** Shoot Interviews and Verite Footage -- produces concrete deliverables for this phase.

**Step 4 (video-editor-guide-sound-designer):** Edit and Assemble -- produces concrete deliverables for this phase.

**Step 5 (content-monetizer-documentary-maker):** Distribute and Share -- produces concrete deliverables for this phase.

**Result:** User has a complete produce documentary plan with all deliverables produced, validated, and ready for implementation.
