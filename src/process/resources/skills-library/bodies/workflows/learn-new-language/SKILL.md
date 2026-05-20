---
name: learn-new-language
description: >-
  Structured language acquisition workflow from initial assessment and method
  selection through immersion, deliberate practice, and formal certification for
  achieving real-world fluency in a new language.

  Use when the user wants to learn new language or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "goal-setter study-planner language-partner flashcard-creator habit-tracker"
trigger_phrases: >-
  I want to learn a new language help me learn Spanish how to become fluent in a
  language language learning plan I want to speak another language teach me a
  foreign language
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: language-learning study-skills step-by-step planning
  category: life-event
  depends: "goal-setter study-planner language-partner flashcard-creator habit-tracker"
  disclaimer: none
  difficulty: intermediate
---
# Learn New Language

**Estimated time:** 6-18 months

This workflow takes you from zero (or rusty) in a new language through to
functional fluency using a structured, research-backed approach. Language
learning fails most often because people lack a system: they dabble with apps,
skip the hard parts, and quit when progress stalls. This workflow fixes that
by sequencing five phases -- assessment, method selection, immersion, deliberate
practice, and certification -- into a clear progression.

The workflow adapts to any target language, your available time, and your
specific motivation (travel, career, heritage, or personal enrichment).

By the end of this workflow you will have: a clear understanding of your
starting level, a personalized learning method, an immersion environment
even if you cannot travel, a deliberate practice system for the hard skills,
and optionally a formal certification proving your level.

## When to Use

- User wants to learn new language
- User needs a structured, step-by-step process for learn new language
- User wants to learn a new language
- User wants to learn Spanish
- how to become fluent in a language
- Do NOT use when: the request is outside the scope of learn new language or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A specific target language chosen (or willingness to choose during Step 1)
- At least 30 minutes per day available for study and practice
- A device with internet access for digital tools and content
- Willingness to feel uncomfortable making mistakes (this is how learning works)
- A clear reason for learning (motivation sustains effort through the hard months)

## Steps

**Step 1: Assess Your Starting Point and Set Goals** (uses: goal-setter)

establish a clear starting point and define what
success looks like.

- Input: target language and motivation for learning, Any prior experience with the target language or related languages, Available time per day and week for study
- Output: Current level, target language difficulty, and baseline skills, SMART goals at 1, 3, 6, and 12 month milestones, Weekly time allocation plan for language study
- Key focus: Target language selection rationale (difficulty tier, resources available)

**Step 2: Choose Your Method and Build Your Stack** (uses: study-planner)

design a comprehensive learning methodology
that combines multiple approaches for each language skill.

- Input: `language-assessment` from Step 1 (level determines appropriate methods), `learning-goals` from Step 1 (goals shape method priorities), `time-budget` from Step 1 (time determines method intensity)
- Output: Core methodology with rationale for each approach chosen, Complete list of tools, apps, and resources with purpose of each, Daily and weekly schedule with specific activities and durations
- Key focus: Core method selection (structured course, textbook, tutor, app, or hybrid)

**Step 3: Build Your Immersion Environment** (uses: language-partner)

create an immersion environment without
requiring travel. The goal is surrounding yourself with the target language
so that exposure becomes effortless and continuous.

- Input: `method-plan` from Step 2 (immersion supplements formal study), `tool-stack` from Step 2 (integration with existing tools), `learning-goals` from Step 1 (immersion intensity matches goals)
- Output: Daily immersion activities integrated with normal routine, Curated TV, films, podcasts, music, and reading materials by level, Schedule and platforms for speaking practice
- Key focus: Media immersion: switch phone language, follow social media in target language

**Step 4: Practice Deliberately and Track Progress** (uses: flashcard-creator)

build a spaced repetition system for
vocabulary and grammar, and establish a deliberate practice routine for the
hardest skills.

- Input: `study-schedule` from Step 2 (structured practice times), `immersion-plan` from Step 3 (immersion generates material for practice), `learning-goals` from Step 1 (goals define what to measure)
- Output: Configured spaced repetition deck with card creation process, Daily deliberate practice plan targeting weak skills, Tracked recurring errors with targeted correction exercises
- Key focus: Spaced repetition deck building from immersion encounters (not random word lists)

**Step 5: Certify and Formalize Your Level** (uses: habit-tracker)

maintain momentum while preparing for a formal
certification exam that validates your level. Certification is optional but
valuable: it provides external validation, a concrete target, and proof for
employers or institutions.

- Input: `progress-journal` from Step 4 (current level determines exam readiness), `learning-goals` from Step 1 (whether certification was a stated goal), target proficiency level and relevant exams
- Output: Selected exam, date, format breakdown, and preparation timeline, Exam preparation schedule integrated with ongoing learning, Scores and analysis from practice tests
- Key focus: Selecting the appropriate exam (DELE, DELF, JLPT, HSK, Goethe, TOPIK, etc.)

## Decision Points

- **After Step 1:** What difficulty category is your target language?
  - If **Category I (Spanish, French, Italian, Portuguese)**: ~600 hours to proficiency. Fastest path. Many cognates with English.
  - If **Category II (German, Indonesian, Swahili)**: ~900 hours. More complex grammar or different structures, but still manageable.
  - If **Category III (Russian, Hindi, Thai, Vietnamese)**: ~1,100 hours. Different alphabet, tones, or complex grammar. Plan for longer timeline.
  - If **Category IV (Mandarin, Japanese, Korean, Arabic)**: ~2,200 hours. New writing system, tones, and grammar. Requires significant time commitment.
- **After Step 4:** Do you want to pursue formal certification?
  - If **Yes, for career or education**: Full exam prep with targeted practice tests and formal registration.
  - If **Yes, as a personal milestone**: Exam prep with flexible timeline. Certification as motivation, not obligation.
  - If **No, practical fluency is enough**: Continue immersion and practice. Skip exam preparation entirely.

## Failure Handling

- **App-only learning:** Apps are tools, not methods. They build vocabulary but rarely develop speaking or listening.
- **Avoiding speaking:** Speaking is the hardest skill and the one people avoid most. Start speaking from week one, even if badly.
- **Perfectionism:** Mistakes are not failures -- they are data. Every error corrected is a lesson learned.
- **Inconsistency:** 30 minutes every day beats 3 hours on weekends. Language learning depends on frequency.
- **Isolated vocabulary:** Learning words in isolation without context leads to knowledge you cannot use. Learn phrases and sentences.

## Expected Outcome

When this workflow is complete, the user will have:

1. CEFR level has demonstrably improved from the baseline assessment
2. The user can hold a basic conversation in the target language (A2+ minimum)
3. Daily study and immersion habits are established and sustainable
4. Vocabulary spaced repetition system is active with consistent reviews
5. The user feels progress is real and continuing, not stalled
6. Language learning is integrated into daily life, not a separate burden

## Output Format

```
LEARN NEW LANGUAGE TRACKER
==========================

[ ] Step 1: Assess Your Starting Point and Set Goals
    Status: [pending/in-progress/complete]
[ ] Step 2: Choose Your Method and Build Your Stack
    Status: [pending/in-progress/complete]
[ ] Step 3: Build Your Immersion Environment
    Status: [pending/in-progress/complete]
[ ] Step 4: Practice Deliberately and Track Progress
    Status: [pending/in-progress/complete]
[ ] Step 5: Certify and Formalize Your Level
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **App-only learning:** Apps are tools, not methods. They build vocabulary but rarely develop speaking or listening.
- **Avoiding speaking:** Speaking is the hardest skill and the one people avoid most. Start speaking from week one, even if badly.
- **Perfectionism:** Mistakes are not failures -- they are data. Every error corrected is a lesson learned.
- **Inconsistency:** 30 minutes every day beats 3 hours on weekends. Language learning depends on frequency.


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

## Example

**Input:** "I want to learn new language and need a structured plan to follow step by step."

**Output:**

**Step 1 (goal-setter):** Assess Your Starting Point and Set Goals -- produces concrete deliverables for this phase.

**Step 2 (study-planner):** Choose Your Method and Build Your Stack -- produces concrete deliverables for this phase.

**Step 3 (language-partner):** Build Your Immersion Environment -- produces concrete deliverables for this phase.

**Step 4 (flashcard-creator):** Practice Deliberately and Track Progress -- produces concrete deliverables for this phase.

**Step 5 (habit-tracker):** Certify and Formalize Your Level -- produces concrete deliverables for this phase.

**Result:** User has a complete learn new language plan with all deliverables produced, validated, and ready for implementation.
