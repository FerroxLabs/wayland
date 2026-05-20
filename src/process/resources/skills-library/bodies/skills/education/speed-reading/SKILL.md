---
name: speed-reading
description: |
  Teaches speed reading techniques with comprehension verification for learners who want to read faster without sacrificing understanding. Produces technique-specific exercises with before/after measurement -- not a generic list of speed reading tips.
  Use when a learner asks to read faster, improve reading speed, learn speed reading techniques, or increase their reading efficiency.
  Do NOT use for study planning (use `study-plan`), for book summarization (use `book-summary`), or for note taking from reading (use `cornell-notes`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills step-by-step guide beginner-friendly"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Speed Reading

## When to Use

- Learner asks to use speed reading with comprehension verification for studying
- Student wants to create technique exercises with WPM measurement and comprehension checks
- User mentions speed reading or related study techniques
- User wants help applying speed reading with comprehension verification to their study material
- User asks for a speed reading for a specific subject or topic

**Do NOT use when:**
- User is an educator creating teaching materials (check teaching subcategory skills)
- User wants a different study technique (check other self-learning skills)
- User wants exam-format practice questions (use `exam-practice`)

## Process

1. **Collect context.** Ask the learner for:
   - Subject and specific topic
   - Source material (notes, textbook chapter, lecture content)
   - Current knowledge level
   - Purpose (exam prep, deep understanding, memorization, integration)
   - Time available for this study session

2. **Apply the speed reading with comprehension verification.** Measure baseline reading speed (WPM). Teach specific techniques: minimize subvocalization, use a pointer/pacer, expand peripheral vision, practice chunking. Measure again. Verify comprehension with summary test.

3. **Build the artifact.** Create the technique exercises with WPM measurement and comprehension checks:
   - Use the learner's actual content, not generic examples
   - Follow the method's structure precisely
   - Include all required components of the technique
   - Add self-check questions or verification steps

4. **Verify understanding.** Speed without comprehension is skimming. Every speed increase must be verified with a comprehension check.
   - Include a self-assessment: "Can you explain this to someone else without looking at your notes?"
   - Identify any remaining gaps and suggest targeted review
   - Recommend when to revisit this material (spaced repetition timing)

5. **Connect to broader study plan.** Link this session to the learner's overall goals:
   - How does this technique complement other study methods?
   - When should the learner use this technique vs. alternatives?
   - Schedule the next review of this material
   - Suggest a follow-up technique for deeper processing

## Output Format

```
## Speed Reading: [Topic]

**Subject:** [Subject]
**Topic:** [Specific topic]
**Method:** speed reading with comprehension verification
**Source Material:** [What was used]
**Date:** [When created]

---

### Technique exercises with WPM measurement and comprehension checks

[Complete artifact following the method's structure]

---

### Self-Check
- Can you explain the main concept without looking at this document? [ ] Yes [ ] No
- Can you identify 3 key relationships or facts from memory? [ ] Yes [ ] No
- Are there gaps in your understanding? If yes: [List them]

### Next Steps
- Review this material on: [Date based on spaced repetition]
- Complementary technique to try next: [Suggestion]
- Connection to other topics: [How this links to broader learning]
```

## Rules

1. ALWAYS use the learner's actual content -- never substitute generic examples when specific material is provided
2. ALWAYS follow the speed reading with comprehension verification structure precisely -- do not skip required components
3. Include a self-check section so the learner can verify their understanding
4. NEVER produce the artifact without the learner providing source material first -- ask for it
5. Include specific spaced repetition timing for when to review (1 day, 3 days, 7 days)
6. ALWAYS connect the technique to the learner's broader study goals
7. The artifact must be complete and usable -- not a template with blanks
8. NEVER include external URLs
9. If the learner's material is insufficient for the technique, ask for more before proceeding
10. Include at least one recommendation for a complementary study technique

## Edge Cases

- **Material is too simple for the technique:** If the content is straightforward enough that speed reading adds no value, say so and recommend a simpler technique. Not every method fits every content type.

- **Material is in a language the learner is still learning:** Allow the learner to use their native language for the technique while studying foreign-language content. The goal is understanding, not language practice (use language-learning skills for that).

- **Learner has no source material yet:** Help the learner identify what they need to study first. Provide guidance on gathering materials, then apply the technique once materials are available.

- **Very large amount of content:** Break into multiple sessions. Apply the technique to one section at a time rather than trying to process everything at once. Provide a plan for covering all sections over multiple study sessions.

- **Learner is unfamiliar with the technique:** Provide a brief (3-sentence) explanation of the technique and why it works before applying it. Then demonstrate with a small example before applying to the full content.

## Example

**Input:** "Help me create speed reading for my psychology lecture on classical conditioning (Pavlov's experiments, conditioned vs unconditioned stimuli, acquisition, extinction, generalization, discrimination)."

**Output:**

## Speed Reading: Classical Conditioning

**Subject:** Psychology
**Topic:** Classical Conditioning
**Method:** speed reading with comprehension verification
**Source Material:** Lecture notes on Pavlov's experiments
**Date:** [Current date]

---

### Technique exercises with WPM measurement and comprehension checks

**Key Concepts:**
- Unconditioned Stimulus (UCS): A stimulus that naturally triggers a response (food)
- Unconditioned Response (UCR): The natural response to the UCS (salivation to food)
- Conditioned Stimulus (CS): A previously neutral stimulus paired with the UCS (bell)
- Conditioned Response (CR): The learned response to the CS (salivation to bell)

**Process:**
1. Before conditioning: Bell (neutral) produces no salivation. Food (UCS) produces salivation (UCR).
2. During conditioning: Bell + Food paired repeatedly. Bell becomes associated with food.
3. After conditioning: Bell alone (CS) produces salivation (CR).

**Key Phenomena:**
- Acquisition: The initial learning phase where the CS-UCS association is formed (requires multiple pairings)
- Extinction: The gradual weakening of the CR when the CS is presented without the UCS
- Spontaneous recovery: The reappearance of an extinguished CR after a rest period
- Generalization: Responding to stimuli similar to the CS (a different-pitched bell also triggers salivation)
- Discrimination: Learning to respond only to the specific CS and not to similar stimuli

**Analogy:** Classical conditioning is like your phone notification sound. At first, the sound meant nothing. After hundreds of pairings with messages (rewarding), the sound alone now triggers anticipation. If you changed your notification sound and never got messages with the old sound, eventually the old sound would stop triggering a response (extinction).

---

### Self-Check
- Can you diagram the before/during/after conditioning process without notes? [ ] Yes [ ] No
- Can you explain the difference between generalization and discrimination with a new example? [ ] Yes [ ] No
- Can you identify UCS, UCR, CS, and CR in a novel scenario? [ ] Yes [ ] No

### Next Steps
- Review this material on: Tomorrow (Day 1), then Day 4, then Day 11
- Complementary technique: Create flashcards for the key terms using `flashcard-generation`
- Connection: Compare classical conditioning with operant conditioning in your next lecture


### Speed Reading Techniques

**Technique 1: Pointer/Pacer Method**
Use your finger or a pen to guide your eyes along each line. This prevents regression (re-reading) and maintains a steady pace. Start at your normal speed, then gradually increase the pace of your pointer.

**Technique 2: Reduce Subvocalization**
Subvocalization is "hearing" each word in your head. To reduce it:
- Hum or count "1-2-3-4" silently while reading (occupies the inner voice)
- Focus on seeing word groups rather than individual words
- Accept that you will not eliminate subvocalization entirely -- reducing it is sufficient

**Technique 3: Expand Peripheral Vision (Chunking)**
Instead of reading one word at a time, train yourself to see 3-5 word chunks:
- Normal: "The / cat / sat / on / the / mat" (6 fixations)
- Chunked: "The cat sat / on the mat" (2 fixations)
- Practice by reading a column of text (newspaper-width) in one fixation per line

**Technique 4: Previewing**
Before reading in detail:
1. Read headings, subheadings, and bold text
2. Read the first sentence of each paragraph
3. Look at diagrams, charts, and images
4. Read the conclusion or summary
This creates a mental framework that speeds detailed reading by 20-30%

### Measurement Protocol

**Baseline Test:**
1. Choose a passage of 500-1000 words on a topic you know moderately well
2. Set a timer
3. Read at your normal pace
4. Record time
5. Answer 5 comprehension questions (write them before reading or use a standard test)
6. Calculate: WPM = (word count / time in minutes), Comprehension = correct answers / 5

**Progress Test (repeat weekly):**
Same protocol with different passages of similar difficulty.

**Speed-Comprehension Tradeoff:**
| WPM Range | Comprehension Target | Classification |
|-----------|---------------------|----------------|
| 150-250 | 90%+ | Normal reading speed |
| 250-400 | 80%+ | Competent speed reading |
| 400-600 | 70%+ | Advanced speed reading |
| 600+ | 60%+ | Skimming (not true reading) |

If comprehension drops below 70%, you are skimming, not speed reading. Slow down.

### When NOT to Speed Read

- Dense technical material with formulas or code
- Legal documents or contracts
- Poetry or literature meant to be savored
- Material in a language you are still learning
- Content you need to memorize (use active recall instead)

---

<!-- Additional content from FoundryVerse archive -->

## Purpose

This skill helps users increase their reading speed while maintaining or improving comprehension. It teaches evidence-based techniques for different reading contexts, provides a progressive training program, and helps users develop strategic reading habits that match their reading speed to the material's demands.

---

## Questions to Ask the User First

1. **Current reading speed:** Do you know your words-per-minute (WPM)? (We can test this)
2. **Reading purpose:** Why do you want to read faster? (Academic, professional, pleasure, information consumption)
3. **Primary reading material:** What do you mostly read? (Textbooks, articles, reports, fiction, news, technical docs)
4. **Current challenges:** What slows you down? (Re-reading, vocalization, distraction, vocabulary, fatigue)
5. **Comprehension concern:** Are you willing to trade some comprehension for speed, or is full comprehension essential?
6. **Reading volume:** How much do you read per day/week?
7. **Time available for practice:** How many minutes per day can you dedicate to speed reading training?
8. **Digital vs. physical:** Do you mostly read on screen or paper?
9. **Previous training:** Have you tried speed reading techniques before?
10. **Goal:** What WPM or reading volume would you like to achieve?

---

## Baseline Assessment

### Measuring Your Current Reading Speed

```
READING SPEED TEST PROTOCOL
=============================

STEP 1: Select a passage you haven't read before
  - Non-fiction at a comfortable difficulty level
  - At least 500 words long
  - No images or complex formatting

STEP 2: Set a timer for exactly 1 minute

STEP 3: Read at your normal pace until the timer stops
  - Read for understanding, not just speed
  - Don't skim or skip

STEP 4: Mark where you stopped

STEP 5: Count the words read (or estimate)
  Quick estimation: count words in 3 lines, average them,
  multiply by number of lines read

STEP 6: Test comprehension
  Without looking back, write down:
  - Main idea of the passage
  - 3 key details
  - Author's purpose or conclusion

YOUR BASELINE:
  Words per minute: __________
  Comprehension: ___/5 (rate your recall quality)

READING SPEED BENCHMARKS:
  100-150 WPM:  Below average (possible subvocalization or regression issues)
  200-250 WPM:  Average adult reader
  300-400 WPM:  Above average
  400-600 WPM:  Fast reader
  600-800 WPM:  Very fast (speed reading range)
  800+ WPM:     Exceptional (likely skimming for most material)

Note: Comprehension should stay above 70% for the speed to be useful.
Speed without comprehension is just page-turning.
```

---

## Core Speed Reading Techniques

### Technique 1: Eliminating Subvocalization

**What it is:** The inner voice that "reads aloud" in your head. Most people subvocalize every word, which caps speed at speech rate (~150-250 WPM).

```
REDUCING SUBVOCALIZATION
=========================
The goal is NOT to eliminate subvocalization entirely (that often
hurts comprehension) but to reduce it for familiar, simple text.

EXERCISE 1: COUNTING WHILE READING
  Read while counting "1, 2, 3, 4" out loud or humming a tune.
  This occupies the vocal system, forcing visual-only processing.
  Practice 5 minutes daily. Comprehension will be low at first -- that's OK.

EXERCISE 2: INCREASE SPEED BEYOND VOCALIZATION RATE
  Force yourself to read faster than you can possibly speak.
  Use a pacer (finger, pen) moving faster than comfortable.
  Your brain will begin to process words visually.

EXERCISE 3: WORD GROUP RECOGNITION
  Instead of reading word-by-word, practice seeing groups of 3-5 words
  at once. Your brain can process a phrase as a single unit, just as
  you read "New York City" as one concept, not three words.

NOTE: Keep subvocalization for:
  - Complex or technical material
  - Poetry and literature (where sound matters)
  - Material you must memorize precisely
  - Legal or contractual text
```

### Technique 2: Chunking

**What it is:** Reading groups of words together rather than one word at a time.

```
CHUNKING EXERCISE
==================

BEFORE (word by word):
  The | quick | brown | fox | jumps | over | the | lazy | dog.
  9 eye fixations

AFTER (chunked):
  The quick brown | fox jumps over | the lazy dog.
  3 eye fixations

PROGRESSIVE CHUNKING DRILL:
  Week 1: Read in 2-word chunks
    "The quick" / "brown fox" / "jumps over" / "the lazy" / "dog."

  Week 2: Read in 3-word chunks
    "The quick brown" / "fox jumps over" / "the lazy dog."

  Week 3: Read in 4-5 word chunks
    "The quick brown fox" / "jumps over the lazy dog."

  Week 4+: Read in phrase-length chunks (natural language groups)
    "The quick brown fox" / "jumps over" / "the lazy dog."

PRACTICE METHOD:
  1. Use a column of text (narrow width forces fewer fixations per line)
  2. Draw vertical lines dividing text into chunk groups
  3. Practice fixating on the CENTER of each chunk
  4. Gradually widen your chunks
```

### Technique 3: Meta-Guiding (Using a Pointer)

**What it is:** Using your finger, a pen, or cursor to guide your eyes along the text, reducing regression (re-reading) and maintaining pace.

```
META-GUIDING METHODS
=====================

METHOD 1: UNDERLINE GUIDE
  Run your finger or pen under each line as you read.
  Your eyes follow the pointer, maintaining smooth movement.
  Gradually increase the speed of your pointer.

METHOD 2: PACING CARD
  Use a blank card or piece of paper to cover text ABOVE the line
  you are reading. This prevents regression (looking back up).
  Move the card down at a steady pace.

METHOD 3: Z-PATTERN
  For wider text blocks, move your pointer in a Z pattern:
  --> across line 1 from left to right
  \ diagonally to the start of line 3 (skipping line 2 peripheral vision)
  --> across line 3 from left to right
  (Your peripheral vision catches line 2 between the sweeps)
  Advanced technique -- only for fast readers.

METHOD 4: CENTER FIXATION
  For narrow columns (phones, e-readers):
  Fixate on the CENTER of each line.
  Your peripheral vision captures the whole line.
  Just move your eyes straight down the page.

TRAINING SCHEDULE:
  Day 1-3: Underline guide at comfortable speed
  Day 4-7: Underline guide 20% faster than comfortable
  Day 8-14: Experiment with pacing card
  Day 15+: Practice without guide (internalized pacing)
```

### Technique 4: RSVP (Rapid Serial Visual Presentation)

**What it is:** Words or groups of words flash on screen one at a time at a set speed, eliminating eye movement entirely.

```
RSVP READING
==============
Words appear one at a time at a fixed point on the screen.
Your eyes stay still -- only the words change.

BENEFITS:
  - Eliminates eye movement overhead
  - Eliminates regression
  - Easy to control speed precisely

LIMITATIONS:
  - Cannot look back or re-read
  - Fatigue increases with speed
  - Comprehension drops for complex material
  - Less effective for material with figures or tables

RSVP APPS AND TOOLS:
  - Spreeder (web-based, free)
  - Reedy (browser extension)
  - ReadMe! (iOS/Android)
  - SwiftRead (Chrome extension)

RECOMMENDED RSVP TRAINING:
  Start: Your current WPM
  Increase: 25 WPM per week
  Ceiling: 500-600 WPM for good comprehension
  Use for: News articles, email, simple non-fiction
  Avoid for: Technical text, literature, anything requiring re-reading
```

---

## The SQ3R Method (Strategic Reading)

A structured approach for reading textbooks and academic material:

```
SQ3R METHOD
=============

S - SURVEY (2-5 minutes)
  Before reading in detail, survey the material:
  [ ] Read the title, headings, and subheadings
  [ ] Look at images, charts, graphs, and captions
  [ ] Read the introduction and conclusion/summary
  [ ] Read bold/italic terms
  [ ] Note the length and structure
  PURPOSE: Get the big picture. Your brain now has a framework
  to organize the detailed information.

Q - QUESTION (1-2 minutes)
  Turn each heading into a question:
  Heading: "The Causes of the French Revolution"
  Question: "What were the causes of the French Revolution?"

  Write your questions down. This activates curiosity and
  gives your reading a PURPOSE.

R1 - READ (main time investment)
  Read to answer your questions.
  Read one section at a time, not the entire chapter.
  Highlight or mark key information sparingly.
  Don't take extensive notes while reading (slows you down).

R2 - RECITE (after each section)
  After reading a section, CLOSE THE BOOK.
  Answer your question from memory.
  Summarize the key points out loud or in writing.
  If you can't recall the main points, re-read that section.

R3 - REVIEW (at the end and later)
  After finishing all sections:
  - Review your questions and answers
  - Create a summary of the entire reading
  - Schedule a spaced repetition review
  - Connect new information to what you already knew
```

---

## Skimming and Scanning Strategies

### When to Skim vs. Scan vs. Read Carefully

```
READING SPEED SELECTION
========================

SCANNING (fastest -- looking for specific information)
  Speed: 1,000+ WPM
  Use when: Finding a name, date, keyword, or specific fact
  How: Move eyes quickly over text, looking for target information
  Comprehension: Very low for overall content; high for target info

SKIMMING (fast -- getting the gist)
  Speed: 600-1,000 WPM
  Use when: Previewing material, deciding if something is worth reading,
            reviewing previously-read material
  How: Read first/last paragraphs, first sentence of each paragraph,
       headings, and emphasized text
  Comprehension: Moderate for main ideas; low for details

RAPID READING (above average)
  Speed: 400-600 WPM
  Use when: Reading familiar-topic non-fiction, news, email, reports
  How: Chunking, minimal subvocalization, meta-guiding
  Comprehension: Good for most material

CAREFUL READING (normal)
  Speed: 200-300 WPM
  Use when: New or complex material, instructions, contracts, studying
  How: Full attention, note-taking, re-reading as needed
  Comprehension: High

ANALYTICAL READING (slow and deep)
  Speed: 100-200 WPM
  Use when: Legal documents, poetry, philosophy, dense technical writing
  How: Sentence-by-sentence analysis, annotation, reflection
  Comprehension: Very high
```

### Skimming Technique

```
HOW TO SKIM EFFECTIVELY
=========================

1. Read the title, subtitle, and author
2. Read the entire first paragraph
3. Read the FIRST SENTENCE of every subsequent paragraph
   (Topic sentences carry the main idea)
4. Look for: bold text, italics, bullet points, numbered lists
5. Glance at all images, charts, and captions
6. Read the entire last paragraph or conclusion
7. Time: Should take 2-5 minutes for a typical article

AFTER SKIMMING, ask yourself:
  - What is the main argument or topic?
  - What are the 3-5 key points?
  - Is this worth reading in full? If yes, do a full read.
```

---

## Annotation Methods

```
ANNOTATION SYSTEM
==================

HIGHLIGHTING (use sparingly -- max 10-15% of text)
  Yellow: Key definitions and concepts
  Green: Supporting evidence and examples
  Blue: Things to review or look up later
  Pink: Connections to other material

MARGINAL NOTES:
  "?" = I don't understand this
  "!" = Important / surprising
  "*" = Key concept
  "cf" = Compare with (another section/source)
  "ex" = Good example
  Summary phrase in margin every 1-2 paragraphs

DIGITAL ANNOTATION TOOLS:
  - PDF: Adobe Reader, PDF Expert, Hypothes.is
  - E-books: Kindle highlights, Apple Books
  - Web: Liner, Diigo, Hypothes.is
  - Notes: Export annotations for review

RULE: Highlighting without active processing is nearly useless.
Always add a marginal note or mental summary WITH each highlight.
```

---

## Retention Techniques

```
RETENTION AFTER READING
=========================

IMMEDIATE (within 30 minutes of reading):
  [ ] Write a 3-5 sentence summary from memory
  [ ] Explain the main idea to someone (or pretend to)
  [ ] Create 3-5 flashcards on key concepts
  [ ] Note 3 things you want to remember

SHORT-TERM (within 24 hours):
  [ ] Review your annotations and marginal notes
  [ ] Answer the SQ3R questions without the text
  [ ] Connect new information to something you already know

LONG-TERM (spaced repetition):
  [ ] Review summaries at day 1, 3, 7, 14, 30
  [ ] Quiz yourself on key concepts
  [ ] Apply the information (discussion, writing, teaching)
  [ ] Revisit annotations during related future reading

THE skipping CURVE:
  Without review: ~70% skipped within 24 hours
  With one review: ~50% skipped within a week
  With spaced reviews: ~90%+ retained long-term
```

---

## Progressive Training Plan

```
4-WEEK SPEED READING TRAINING PLAN
=====================================

WEEK 1: AWARENESS AND BASELINE
  Day 1: Baseline speed test (3 passages, average the WPM)
  Day 2: Practice meta-guiding (finger under each line) -- 15 min
  Day 3: Practice chunking with 2-word groups -- 15 min
  Day 4: Practice reducing regression (use a card to cover read text) -- 15 min
  Day 5: Speed test (should see 10-20% improvement)
  Day 6: Practice all three techniques together -- 20 min
  Day 7: Rest or pleasure reading at comfortable speed

WEEK 2: BUILDING SPEED
  Day 1: Meta-guiding at 30% faster than comfortable -- 15 min
  Day 2: Chunking with 3-word groups -- 15 min
  Day 3: RSVP app at current WPM + 50 -- 10 min
  Day 4: Practice SQ3R method on an article -- 30 min
  Day 5: Speed test
  Day 6: Timed reading challenges (read X pages in Y minutes) -- 20 min
  Day 7: Rest or pleasure reading

WEEK 3: COMPREHENSION FOCUS
  Day 1: Speed read an article, then test comprehension -- 20 min
  Day 2: Practice skimming technique -- 15 min
  Day 3: Practice scanning for specific information -- 15 min
  Day 4: Speed + annotation practice -- 25 min
  Day 5: Speed test with comprehension check
  Day 6: Adjust speed/comprehension balance based on results
  Day 7: Rest

WEEK 4: INTEGRATION AND HABIT BUILDING
  Day 1: Full SQ3R session with speed reading in the "Read" step
  Day 2: Read a full chapter using all techniques -- timed
  Day 3: Practice choosing the right speed for different material
  Day 4: Speed test (final assessment)
  Day 5: Set ongoing practice schedule
  Day 6: Read for pleasure using improved techniques
  Day 7: Reflect on progress, set next goals

TRACKING TABLE:
  Week | Baseline WPM | End-of-Week WPM | Comprehension | Notes
  1    | __________   | __________      | ___/5         | ______
  2    | __________   | __________      | ___/5         | ______
  3    | __________   | __________      | ___/5         | ______
  4    | __________   | __________      | ___/5         | ______

REALISTIC EXPECTATIONS:
  Typical improvement: 50-100% increase in 4-8 weeks
  200 WPM --> 300-400 WPM is very achievable
  400+ WPM with full comprehension requires months of practice
  Claims of 1,000+ WPM with full comprehension are not supported by research
```

---

## Comprehension vs. Speed Tradeoffs

```
THE SPEED-COMPREHENSION CURVE
===============================

At very low speeds: comprehension can be LOW (mind wanders)
At comfortable speed: comprehension is HIGHEST
At high speeds: comprehension decreases gradually
At very high speeds: comprehension drops sharply

THE SWEET SPOT: fastest speed where comprehension stays above 70-80%

HOW TO FIND YOUR SWEET SPOT:
1. Read a passage at increasing speeds (increase by 50 WPM each time)
2. After each reading, test comprehension
3. When comprehension drops below 70%, back off by 50 WPM
4. That's your current sweet spot for that material type

MATERIAL DIFFICULTY ADJUSTMENT:
  Easy/familiar material:     sweet spot + 100 WPM
  Medium difficulty:           sweet spot speed
  Hard/technical material:     sweet spot - 100 WPM
  Critical material (legal):   slow down as much as needed
```

---
