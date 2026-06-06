---
name: flashcard-creator
description: |
  Flashcard and quiz creation skill covering effective flashcard design principles (atomic, one concept per card), Anki optimization, cloze deletion, image occlusion, quiz question types (MCQ, short answer, matching), spaced repetition algorithms, and deck organization strategies.
  Use when the user asks about flashcard creator, or needs help with flashcard and quiz creation skill covering effective flashcard design principles (atomic, one concept per card), anki optimization, cloze deletion, image occlusion, quiz question types (mcq, short answer, matching), spaced repetition algorithms, and deck organization strategies.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of flashcard creator.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills spaced-repetition guide"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Flashcard Creator

## When to Use

**Use this skill when:**
- User wants to create effective flashcards for any subject
- User needs help optimizing their Anki or spaced repetition setup
- User wants to convert study material into flashcard format
- User needs quiz questions (MCQ, short answer, matching) for a topic

**Do NOT use this skill when:**
- User wants a full study plan beyond flashcards -- use study-planner
- User needs tutoring or concept explanation -- use personal-tutor
- User wants test prep strategy -- use dedicated exam prep skills

## Process

1. **Step 1:** Gather subject matter, source material, and target tool (Anki, Quizlet, etc.)
2. **Step 2:** Extract key concepts, terms, and relationships from source material
3. **Step 3:** Select card types (basic Q&A, cloze deletion, image occlusion, comparison)
4. **Step 4:** Formulate cards following atomic principle: one concept per card
5. **Step 5:** Organize into decks with tags and recommend spaced repetition settings

## Purpose

This skill helps users create highly effective flashcards and quiz materials that maximize retention through proven memory science. It goes beyond simple Q&A pairs to teach the art of flashcard design, leveraging principles from cognitive psychology and the spaced repetition community.

---

## Questions to Ask the User First

1. **Subject and topic:** What are you creating flashcards for?
2. **Source material:** Do you have notes, a textbook chapter, or lecture slides to work from?
3. **Volume:** Approximately how much material needs to be covered?
4. **Tool preference:** Do you use Anki, Quizlet, RemNote, physical cards, or something else?
5. **Purpose:** Is this for long-term retention, an upcoming exam, professional certification, or personal learning?
6. **Experience level:** Have you used flashcards/spaced repetition before? How comfortable are you with Anki?
7. **Current deck:** Do you have existing cards that need improvement?
8. **Time for reviews:** How many minutes per day can you spend on reviews?
9. **Card format preference:** Do you prefer simple Q&A, cloze deletions, or a mix?
10. **Language/terminology:** Are there specific terms, formulas, or definitions that must be memorized exactly?

---

## Principles of Effective Flashcard Design

### The 20 Rules of Formulating Knowledge (adapted from Piotr Wozniak)

The most important principles for flashcard creation:

```
FLASHCARD DESIGN PRINCIPLES
=============================

1. UNDERSTAND BEFORE YOU MEMORIZE
   Never make a flashcard for something you don't understand.
   Flashcards are for retention, not initial learning.

2. ONE CONCEPT PER CARD (The Atomic Principle)
   BAD:  "List the 5 causes of World War I"
   GOOD: "What European alliance system contributed to WWI?" --> "Triple Alliance / Triple Entente"
   GOOD: "What 1914 event triggered the start of WWI?" --> "Assassination of Archduke Franz Ferdinand"

3. KEEP IT SIMPLE
   BAD:  "Explain the entire process of photosynthesis"
   GOOD: "What is the overall equation for photosynthesis?" --> "6CO2 + 6H2O + light --> C6H12O6 + 6O2"

4. USE CLOZE DELETIONS FOR CONNECTED FACTS
   "The mitochondria is the {{c1::powerhouse}} of the cell."
   "Photosynthesis occurs in the {{c1::chloroplast}}."

5. USE IMAGES WHENEVER POSSIBLE
   Visual memory is stronger than verbal memory.
   Add diagrams, photos, or drawings to cards.

6. USE MNEMONICS FOR ARBITRARY INFORMATION
   "Roy G. Biv" for colors of the rainbow
   Create or attach mnemonics directly on the card

7. AVOID SETS AND ENUMERATIONS
   BAD:  "Name the Great Lakes" (5 items = 5 separate cards)
   GOOD: Five separate cards, one for each lake with a distinguishing fact

8. USE CONTEXT CUES
   Add the source, chapter, or topic as a tag
   Include "why it matters" context where helpful

9. PERSONALIZE EXAMPLES
   Connect facts to your own experience when possible
   "My friend's birthday is the same year as [historical event]"

10. WRITE IN YOUR OWN WORDS
    Paraphrasing forces deeper processing than copying text verbatim
```

---

## Flashcard Types and Templates

### Type 1: Basic Q&A

The simplest and most versatile format.

```
BASIC Q&A TEMPLATE
===================
Front: [Clear, specific question]
Back:  [Concise, specific answer]

EXAMPLES:

Front: What is the capital of Australia?
Back:  Canberra (not Sydney or Melbourne)

Front: What enzyme breaks down starch in the mouth?
Back:  Amylase (salivary amylase / ptyalin)

Front: What is the time complexity of binary search?
Back:  O(log n)
```

### Type 2: Cloze Deletion

Fill-in-the-blank cards created from complete sentences. Excellent for contextual learning.

```
CLOZE DELETION TEMPLATE
=========================
Format: Sentence with {{c1::hidden word or phrase}}

EXAMPLES:

"The {{c1::Treaty of Versailles}} ended World War I in {{c2::1919}}."
  Card 1: "The _____ ended World War I in 1919." --> Treaty of Versailles
  Card 2: "The Treaty of Versailles ended World War I in _____." --> 1919

"In Python, a {{c1::list}} is mutable while a {{c2::tuple}} is immutable."
  Card 1: "In Python, a _____ is mutable while a tuple is immutable." --> list
  Card 2: "In Python, a list is mutable while a _____ is immutable." --> tuple

"{{c1::Mitosis}} produces {{c2::two}} identical daughter cells, while
{{c3::meiosis}} produces {{c4::four}} genetically diverse cells."
```

### Type 3: Image Occlusion

Hide parts of an image and ask the user to identify them. Perfect for anatomy, diagrams, maps, and circuits.

```
IMAGE OCCLUSION TEMPLATE
==========================
Image: [Diagram with labeled parts]
Occlusion: Hide one label at a time
Question: Identify the hidden structure

BEST USED FOR:
  - Anatomy (label bones, muscles, organs)
  - Geography (label countries, rivers, capitals)
  - Circuit diagrams (identify components)
  - Cell biology (label organelles)
  - Chemistry (identify functional groups on molecules)
  - Architecture (identify building elements)

IN ANKI:
  Install the "Image Occlusion Enhanced" add-on
  Import image --> draw rectangles over labels --> generates cards automatically
```

### Type 4: Reversed Cards

Automatically create a card in both directions.

```
REVERSED CARD TEMPLATE
========================
Front: Term --> Definition
Back:  Definition --> Term

EXAMPLE:
  Card A Front: "Mitochondria"
  Card A Back:  "Organelle responsible for cellular respiration and ATP production"

  Card B Front: "Organelle responsible for cellular respiration and ATP production"
  Card B Back:  "Mitochondria"

WHEN TO USE:
  - Vocabulary learning (word <-> definition)
  - Foreign language (L1 <-> L2)
  - Symbol/name pairs (chemical symbol <-> element name)
```

### Type 5: Comparison Cards

For distinguishing similar concepts.

```
COMPARISON CARD TEMPLATE
==========================
Front: "How does [A] differ from [B]?"
Back:  Key differences in a concise format

EXAMPLE:
  Front: "How does mitosis differ from meiosis?"
  Back:  "Mitosis: 1 division, 2 identical diploid cells, growth/repair
         Meiosis: 2 divisions, 4 unique haploid cells, gamete production"

  Front: "Simile vs. Metaphor?"
  Back:  "Simile uses 'like' or 'as' (She runs LIKE the wind)
         Metaphor states directly (She IS the wind)"
```

---

## Quiz Question Types

### Multiple Choice Questions (MCQ)

```
MCQ DESIGN PRINCIPLES
======================
1. Stem should be a clear, complete question
2. One clearly correct answer
3. Distractors should be plausible (not obviously wrong)
4. Avoid "all of the above" and "none of the above"
5. Keep options similar in length and structure
6. Avoid negative phrasing ("Which is NOT...")

MCQ TEMPLATE:
  Question: __________
  A) __________ [distractor]
  B) __________ [correct answer]
  C) __________ [distractor - common misconception]
  D) __________ [distractor]
  Correct: B
  Explanation: __________
```

### Short Answer Questions

```
SHORT ANSWER TEMPLATE
======================
Question: [Specific, clearly-scoped question]
Expected answer: [Key points that must be included]
Rubric:
  Full credit: Includes [specific elements]
  Partial credit: Includes [some elements]
  Common mistakes: __________
```

### Matching Questions

```
MATCHING TEMPLATE
==================
Instructions: Match each item in Column A with the correct item in Column B.

Column A (Terms)          Column B (Definitions)
1. _______________        a. _______________
2. _______________        b. _______________
3. _______________        c. _______________
4. _______________        d. _______________
5. _______________        e. _______________

Answer key: 1-__, 2-__, 3-__, 4-__, 5-__

DESIGN TIP: Include 1-2 extra items in Column B to prevent
process-of-elimination on the last item.
```

### True/False with Justification

```
TRUE/FALSE TEMPLATE
====================
Statement: __________
Answer: [ ] True  [ ] False
Justification: If false, what makes it false? What is the correct statement?

EXAMPLE:
  Statement: "The sun revolves around the Earth."
  Answer: False
  Justification: "The Earth revolves around the Sun.
  The geocentric model was replaced by the heliocentric model."
```

---

## Anki Optimization Guide

### Essential Anki Settings

```
RECOMMENDED ANKI SETTINGS
===========================
New cards per day:     20-30 (start lower if overwhelmed)
Maximum reviews/day:   200 (cap to prevent burnout)
Learning steps:        1m 10m (or 1m 10m 1d for important material)
Graduating interval:   1 day
Easy interval:         4 days
Starting ease:         250% (default)
Interval modifier:     100% (adjust based on retention rate)
Lapse steps:          10m
Minimum interval:     1 day
Leech threshold:      8 (then suspend and rewrite the card)

TARGET RETENTION RATE: 85-90%
  Below 85%: Cards are too hard or too many new cards
  Above 95%: Intervals are too short, you're over-studying
  Check in Tools > Statistics > Answer Buttons
```

### Essential Anki Add-ons

```
RECOMMENDED ADD-ONS
====================
1. Image Occlusion Enhanced -- for diagram-based cards
2. Review Heatmap -- visualize your study consistency
3. Edit Field During Review -- fix cards without leaving review
4. Frozen Fields -- keep a field constant when adding multiple cards
5. Speed Focus Mode -- auto-flip after set time (prevents dawdling)
6. True Retention -- shows actual retention statistics
7. Load Balancer -- spreads reviews more evenly across days
```

### Deck Organization

```
DECK ORGANIZATION STRATEGY
============================
Option A: By Subject (Recommended for students)
  ::Medicine
    ::Medicine::Anatomy
      ::Medicine::Anatomy::Upper Limb
      ::Medicine::Anatomy::Lower Limb
    ::Medicine::Biochemistry
    ::Medicine::Pharmacology

Option B: By Source (Good for self-learners)
  ::Book - Thinking Fast and Slow
  ::Course - CS50
  ::Language - Spanish

TAGGING (use alongside deck structure):
  Tags allow cross-cutting organization
  Tag by: chapter, difficulty, topic, exam, status
  Example tags: ch01, hard, metabolism, midterm, needs-rewrite

RULE: Study from a filtered/custom deck or the parent deck,
never from sub-decks individually (breaks spaced repetition algorithm).
```

---

## Spaced Repetition Algorithm Explained

### How SRS Algorithms Work

```
SRS ALGORITHM OVERVIEW (Anki-style)
=====================================

New Card --> Learning Phase --> Review Phase

LEARNING PHASE:
  Card shown at short intervals (1min, 10min, etc.)
  If you get it right at all learning steps, it "graduates"
  Graduating interval: typically 1 day

REVIEW PHASE:
  Each time you see a card, you rate it:
    Again (1): Reset to learning phase
    Hard (2):  Interval multiplied by 1.2
    Good (3):  Interval multiplied by ease factor (typically 2.5)
    Easy (4):  Interval multiplied by ease factor x 1.3

  EXAMPLE PROGRESSION (Good every time, ease = 2.5):
    Day 1 --> Day 3 --> Day 8 --> Day 20 --> Day 50 --> Day 125 --> ...

  If you press "Again," the card's ease factor decreases,
  making future intervals shorter (harder cards are shown more often).

LEECHES:
  Cards you fail repeatedly (8+ times) are "leeches"
  Action: Suspend the card and REWRITE it
  The card design is the problem, not your memory
```

---

## Batch Card Creation Workflow

### Step-by-Step Process

```
FLASHCARD CREATION WORKFLOW
============================

STEP 1: GATHER SOURCE MATERIAL
  [ ] Textbook chapter / lecture notes / article
  [ ] Identify key concepts, terms, processes, and relationships
  [ ] Highlight or mark items that need memorization

STEP 2: EXTRACT KEY FACTS
  For each concept, write out:
  - Definition
  - Key attributes
  - How it relates to other concepts
  - Examples
  - Common misconceptions

STEP 3: FORMULATE CARDS
  Apply the atomic principle: one fact per card
  Choose the right card type for each fact:
    - Definition --> Basic Q&A or Cloze
    - Process steps --> Cloze or ordered sequence cards
    - Visual/spatial --> Image occlusion
    - Comparison --> Comparison card
    - Vocabulary --> Reversed card

STEP 4: ADD CONTEXT
  Tag each card with: subject, chapter, difficulty, exam relevance
  Add hints on the front if the question is ambiguous
  Add explanations on the back for WHY the answer is correct

STEP 5: REVIEW AND REFINE
  Go through new cards once immediately
  Flag any that feel too broad, confusing, or redundant
  Rewrite flagged cards following the design principles

STEP 6: INTEGRATE INTO REVIEW SCHEDULE
  Add to appropriate deck
  Begin reviews the same day
  Monitor retention after 1 week: rewrite cards with < 70% accuracy
```

---

## Common Flashcard Mistakes

```
MISTAKES TO AVOID
==================
1. Making cards before understanding the material
   Fix: Learn first, then make cards for retention

2. Cards that are too complex (multiple facts per card)
   Fix: Break into multiple atomic cards

3. Copying text verbatim from the textbook
   Fix: Paraphrase in your own words

4. Making too many cards at once (100+ in a day)
   Fix: 20-30 new cards per day maximum

5. Not reviewing consistently
   Fix: Review every day, even if only 10 minutes

6. Ignoring leeches (cards you keep getting wrong)
   Fix: Suspend and rewrite leeches with better formatting

7. Only using basic Q&A when cloze or image occlusion would be better
   Fix: Match card type to content type

8. No images or visual aids
   Fix: Add diagrams, photos, or color-coding wherever possible

9. Cards that test recognition instead of recall
   Fix: "What is X?" not "Is X equal to Y? (True/False)"

10. Not tagging or organizing cards
    Fix: Tag by source, topic, and difficulty from the start
```

---

## Output Format

When creating flashcards or quizzes, provide:

1. **Card inventory** -- Total number of cards by type (Q&A, cloze, image, etc.)
2. **Organized card set** -- Cards grouped by subtopic with tags noted
3. **The actual cards** -- Formatted clearly with Front/Back or Cloze syntax
4. **Import instructions** -- How to get the cards into the user's tool (Anki import format if applicable)
5. **Study schedule** -- Recommended new cards per day and expected daily review time
6. **Quality check notes** -- Any cards that may need refinement after initial review
7. **Deck structure** -- Recommended organization for the deck

## Example

**Input:** "Create 10 flashcards for AP Biology Chapter 6: Cellular Respiration. Focus on the key reactions and their locations in the cell."

**Output:**

## Card Inventory
- 10 cards: 4 basic Q&A, 4 cloze deletion, 2 comparison
- Tags: ap-bio, ch06, cellular-respiration, metabolism

## Flashcard Set

**Card 1 (Basic Q&A)**
Front: What are the three main stages of cellular respiration in order?
Back: 1. Glycolysis 2. Krebs Cycle (Citric Acid Cycle) 3. Oxidative Phosphorylation (Electron Transport Chain)

**Card 2 (Cloze)**
"Glycolysis occurs in the {{c1::cytoplasm}} and produces a net gain of {{c2::2}} ATP per glucose molecule."

**Card 3 (Basic Q&A)**
Front: What molecule links glycolysis to the Krebs cycle?
Back: Pyruvate (converted to Acetyl-CoA by pyruvate dehydrogenase in the mitochondrial matrix)

**Card 4 (Cloze)**
"The electron transport chain is located in the {{c1::inner mitochondrial membrane}} and produces approximately {{c2::34}} ATP per glucose."

**Card 5 (Comparison)**
Front: How does substrate-level phosphorylation differ from oxidative phosphorylation?
Back: Substrate-level: direct transfer of phosphate to ADP, occurs in glycolysis/Krebs (4 ATP). Oxidative: chemiosmosis using H+ gradient across membrane, occurs in ETC (34 ATP).

[Cards 6-10 continue covering NAD+/NADH, FADH2, oxygen's role, fermentation comparison, total ATP yield]

## Anki Import
Recommended settings: 5 new cards/day, learning steps 1m 10m, graduating interval 1 day.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
