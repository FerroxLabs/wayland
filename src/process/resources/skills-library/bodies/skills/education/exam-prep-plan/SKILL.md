---
name: exam-prep-plan
description: |
  Creates exam preparation strategies with topic priority matrices, practice schedules, and weak-area focus plans for learners approaching a specific exam. Produces a targeted prep plan calibrated to the exam format and the learner's strengths and weaknesses.
  Use when a learner asks to prepare for a specific exam, create an exam study strategy, or prioritize topics for an upcoming test.
  Do NOT use for general study planning (use `study-plan`), for professional certification exams (use `certification-prep`), or for practice question generation (use `exam-practice`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills active-recall spaced-repetition step-by-step"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Exam Prep Plan

## When to Use

Use this skill when:

- A learner names a specific exam with a known or inferable format -- a course final, a unit test, a standardized test like the SAT, ACT, GRE, LSAT, MCAT, AP exam, IB exam, or a state-administered end-of-course assessment -- and asks how to prepare for it
- A student has a specific exam date and wants to build a backward-mapped study schedule that allocates time based on topic weight and personal confidence gaps
- A learner has completed initial content review and is entering the "exam mode" phase, where the goal shifts from learning new material to consolidating, retrieving, and applying what they know under timed, exam-like conditions
- A student has taken a diagnostic, mock exam, or practice test and has score data or error patterns they want to convert into a targeted weak-area focus plan
- A learner has limited time before an exam -- anywhere from 1 day to 6 weeks -- and needs to prioritize ruthlessly rather than reviewing everything equally

**Do NOT use when:**

- The learner wants a general semester-long or course-length study plan without an imminent exam driving the timeline -- use `study-plan` instead, which handles ongoing learning goals
- The learner is preparing for a professional certification exam (PMP, CPA, bar exam, NCLEX, AWS certifications) -- use `certification-prep`, which handles domain-specific content outlines, eligibility requirements, and pass-rate-calibrated strategies
- The learner wants practice questions, quizzes, or flashcard sets generated from their material -- use `exam-practice` for that output; this skill produces the strategic plan, not the practice items themselves
- The learner is a teacher or instructor designing an assessment or building a course exam -- check the teaching subcategory skills for assessment design
- The learner wants to understand a topic deeply for intrinsic reasons, without an exam creating urgency -- use `deep-learning` or `concept-map` skills, which prioritize understanding over score optimization

---

## Process

### Step 1: Gather Exam Intelligence (Do Not Skip)

Before building any plan, collect the following. If the learner has not provided it, ask explicitly:

- **The exam name and date** -- exact or approximate. Calculate days remaining. Flag if fewer than 72 hours remain; the prep strategy changes fundamentally at that threshold.
- **The exam format** -- multiple choice, free response, essay, problem-solving, lab practical, oral defense, or a combination. Each format requires different preparation mechanics.
- **The content scope** -- what topics, units, chapters, or learning objectives are explicitly covered. If the learner does not know, help them locate the syllabus, exam outline, or past exam for scope inference.
- **The weighting structure** -- how many points or what percentage of the exam each topic or section represents. If no official weighting exists, use frequency in past exams or instructor emphasis signals.
- **The learner's current state** -- what they feel confident in vs. shaky on. Accept self-report but calibrate it: students systematically overestimate familiarity and underestimate retrieval ability gaps. A student who says "I know this" should be asked: "Could you work an example problem right now without notes?"
- **Time available** -- total hours between now and the exam, minus sleep, classes, work, and other obligations. This is the scarcest resource and must be quantified before any schedule is built.
- **Resources on hand** -- textbook, lecture slides, course notes, past exams, official practice materials, a study group, a tutor. The plan should be built around what the learner actually has.

### Step 2: Build the Topic Inventory and Weight Map

Create a complete list of every testable topic derived from the scope information collected in Step 1.

- List topics at the right level of granularity -- not so broad ("chemistry") that they are unactionable, and not so narrow ("electron configuration exceptions for Cr and Cu") that the list becomes unwieldy. A good topic list for a 3-hour exam typically has 10--25 items.
- Assign an **exam weight** to each topic. Use the official weighting if available. If not, count the number of questions devoted to each topic on available past exams and calculate the proportion. If no past exams exist, use lecture time allocation as a proxy -- topics that received more lecture time are weighted more heavily by instructors.
- Assign a **confidence score** using a 1--5 scale: 1 = no idea, 2 = vague recognition, 3 = can explain it but would struggle on exam questions, 4 = solid understanding with minor gaps, 5 = can teach it without notes.
- Do NOT let the learner self-assess at the 5 level without a retrieval check. Ask them to recall the core procedure or explain the concept before accepting a confidence of 5.

### Step 3: Construct the Priority Matrix

Plot each topic into one of five priority tiers using the combination of exam weight and confidence score:

- **Tier 1 -- CRITICAL:** High exam weight (15%+ of total score) AND low confidence (1--2). These topics are where the most points are being lost. They receive maximum study time: 35--45% of total available hours.
- **Tier 2 -- HIGH:** High weight (15%+) AND medium confidence (3), OR medium weight (8--14%) AND low confidence (1--2). Strong return on investment. Allocate 25--30% of available hours.
- **Tier 3 -- MEDIUM:** Medium weight (8--14%) AND medium-high confidence (3--4), OR low weight (<8%) AND low confidence (1--2). Targeted review is worth doing. Allocate 15--20% of available hours.
- **Tier 4 -- MAINTENANCE:** High or medium weight AND high confidence (4--5). The student knows this -- light review to prevent forgetting, not re-learning. Allocate 5--10% of available hours.
- **Tier 5 -- DEPRIORITIZE:** Low weight (<8%) AND medium or high confidence (3--5). The expected point gain from studying these topics further is minimal. Skim once, then move on. Allocate no more than 5% of total hours.

A common mistake is treating all topics equally. The Priority Matrix forces the uncomfortable but necessary decision to deliberately underinvest in topics the student already knows.

### Step 4: Allocate Time to a Backward-Mapped Schedule

Work backward from the exam date:

- Divide available time into **phases**, not a flat daily schedule. Three phases work for most exam timelines:
  - **Consolidation Phase** (earliest portion): Full review of Tier 1 and Tier 2 topics using active methods -- not rereading. Use retrieval practice, worked examples, problem sets, or the Feynman Technique.
  - **Practice Phase** (middle portion): Timed practice tests and practice questions. The student moves from topic-by-topic study to integrated exam simulation. At minimum 2--3 full-length practice sets under real time conditions.
  - **Refinement Phase** (final portion, no more than 3--4 days out): Error analysis from practice tests drives review. Study only the specific gaps identified -- do not start new topics at this stage.
- Build a **daily hour-by-hour block** for each phase. Specify what topic, what activity, and what success criterion ends each block (e.g., "Complete 20 practice problems on stoichiometry with 85%+ accuracy" -- not "study stoichiometry for 2 hours").
- Enforce a **daily study ceiling**. Research on cognitive load and memory consolidation shows diminishing returns beyond 4--5 hours of focused study per day. Studying 4 high-quality hours beats 8 fatigued hours.
- Build in **sleep protection**. Memory consolidation happens during sleep -- specifically during slow-wave sleep for declarative knowledge. The night before an exam is not a recovery buffer; the student must sleep.

### Step 5: Prescribe Format-Specific Preparation Techniques

Match the exam format to the appropriate preparation mechanics:

**Multiple Choice:**
- Practice with answer explanation, not just right/wrong. The student must understand why each wrong answer is wrong, not just identify the right one.
- Analyze distractor patterns -- common wrong answers are often designed to catch specific misconceptions. Identifying the misconception the distractor targets is more valuable than memorizing the correct answer.
- Timed pacing practice: Calculate the target time per question (total time divided by total questions, with 5--10% buffer for review). Practice maintaining that pace.

**Free Response / Short Answer:**
- Practice writing answers from a blank page under time conditions. The student must know not just the content but the structure -- define the term, apply it to the scenario, explain the significance.
- Use the PREP framework: Point (state the answer directly), Reason (explain why), Evidence (give a specific example, equation, or data point), Point (restate the conclusion). This prevents rambling answers that miss points.

**Essay:**
- Outline 5--8 high-probability essay questions before the exam. Write one full timed essay. Analyze it against a strong model answer.
- The bottleneck for essays is not knowledge -- it is retrieval speed and argument structure under pressure. Practice outlining in under 3 minutes before writing.

**Problem-Solving (math, science, economics):**
- Categorize problem types, not just practice individual problems. A student who can identify "this is a conservation of momentum problem" can retrieve the appropriate framework. Unstructured problem repetition does not build this skill.
- Work problems backwards at least once per problem type: given the answer, reconstruct the solution path. This builds error-detection skills.
- Aim for 3x the practice volume the student thinks is necessary for procedural fluency. Motor-level familiarity with problem setups reduces cognitive load during the exam.

**Oral or Lab Practical:**
- Explain every topic aloud without notes. Record it. Listen back and identify gaps, filler words, and moments of hesitation -- these are diagnostic signals, not just performance issues.
- Practice with an interlocutor who asks follow-up questions at the end of each explanation.

### Step 6: Build the Weak-Area Focus Protocol

For each Tier 1 and Tier 2 topic, specify the exact intervention:

- **Knowledge gap:** If the student cannot explain the concept at all, they need an input pass first -- read the relevant pages, watch a target explanation, talk to a tutor -- then immediately follow it with retrieval practice. Never do only the input pass.
- **Retrieval gap:** If the student can recognize the answer but cannot recall it freely, they need active recall practice -- flashcards with production side first, blank-page recalls, practice problems without answer-checking until completion. Minimum 5 independent recalls per concept to begin closing a retrieval gap.
- **Application gap:** If the student understands the concept but fails on exam questions, they have a transfer problem. The intervention is varied practice -- applying the concept in 3--4 different question formats and contexts.
- **Procedural gap:** If the student knows the steps but makes execution errors, they need massed practice with immediate feedback -- not more conceptual review. Slow down the procedure and do it correctly at 50% speed before returning to exam pace.

For each weak area, set a measurable exit criterion: "I can solve 8 out of 10 practice problems on this type without consulting notes." This prevents endless review loops on the same material.

### Step 7: Embed Spaced Repetition Scheduling

Incorporate spaced repetition timing into the plan explicitly. Use the following intervals as defaults, adjusting based on observed confidence:

- **Initial encoding session** (Day 0): First study of the topic
- **First review** (Day 1--2): Before the material is fully forgotten -- cued recall, not rereading
- **Second review** (Day 4--6): Spacing effect begins here; retrieval at this interval strengthens memory more than shorter intervals
- **Third review** (Day 10--14): Approaching long-term consolidation for most academic material
- **Pre-exam review** (48 hours before): Final retrieval pass -- read summary notes, do 5 recall questions per topic

For exams fewer than 10 days away, compress this schedule: Day 0 review, Day 2 review, Day 5 review, Day before exam. Spaced repetition is still more effective than massed re-study even in compressed timelines.

Flag topics studied only once with no review scheduled as a risk: single-session study produces rapid forgetting. Every topic needs at least 2 study touches before the exam.

### Step 8: Define the Day-Before and Day-Of Protocols

These are frequently neglected and consequential:

**48 hours before:**
- Complete the final full practice test and conduct error analysis
- Build a one-page "cheat sheet" of concepts still shaky -- this is a retrieval aid, not a reading document; creating it is the study activity
- Confirm exam logistics: location, time, allowed materials, ID requirements

**Day before:**
- No new topics. Review summary notes and the cheat sheet only.
- Do 10--15 warm-up problems from strongest topic areas to build confidence and activate retrieval networks -- not to learn new material
- Sleep a full night. For adults, 7--9 hours. For adolescents, 8--10 hours. Sleep deprivation reduces working memory capacity and increases error rates on complex problems.

**Day of:**
- No cramming in the last 2 hours before the exam. If studying at all, do 3--5 easy retrieval questions to warm up, then stop.
- Eat a meal with protein and complex carbohydrates 90 minutes before the exam.
- During the exam: use the two-pass technique on multiple choice -- answer all confident questions first, flag uncertain ones, return for a second pass. This prevents time-wasting on hard questions while easy points are available.

---

## Output Format

```
## Exam Prep Plan: [Exam Name]

**Exam:** [Full name of exam]
**Subject/Course:** [Course name or subject area]
**Exam Date:** [Date]
**Days Remaining:** [Number]
**Exam Format:** [e.g., 50 MC + 2 free response + 1 essay]
**Total Available Study Hours:** [Estimated hours between now and exam, net of obligations]
**Time Pressure Category:** [Critical (≤3 days) / Compressed (4–10 days) / Standard (11–28 days) / Extended (29+ days)]

---

### Topic Inventory and Priority Matrix

| Topic | Exam Weight | Confidence (1–5) | Priority Tier | Hours Allocated | Study Method |
|-------|------------|-----------------|---------------|-----------------|--------------|
| [Topic 1] | [%] | [Score] | [Tier 1–5] | [Hours] | [Method] |
| [Topic 2] | [%] | [Score] | [Tier 1–5] | [Hours] | [Method] |
| [Topic 3] | [%] | [Score] | [Tier 1–5] | [Hours] | [Method] |
| [Topic 4] | [%] | [Score] | [Tier 1–5] | [Hours] | [Method] |
| [Topic 5] | [%] | [Score] | [Tier 1–5] | [Hours] | [Method] |

**Summary:** [X] Tier 1 topics, [X] Tier 2, [X] Tier 3, [X] Tier 4/5. Total hours: [X]

---

### Phase Schedule

#### Phase 1 -- Consolidation ([Dates], [X] hours)
**Goal:** Master Tier 1 and Tier 2 topics through active retrieval, not passive review.

| Day | Date | Topic(s) | Activity | Duration | Success Criterion |
|-----|------|----------|----------|----------|-------------------|
| 1 | [Date] | [Topic] | [Activity] | [Hours] | [Criterion] |
| 2 | [Date] | [Topic] | [Activity] | [Hours] | [Criterion] |
| ... | ... | ... | ... | ... | ... |

#### Phase 2 -- Practice ([Dates], [X] hours)
**Goal:** Integrated exam simulation; identify remaining gaps through full practice tests.

| Day | Date | Activity | Duration | Success Criterion |
|-----|------|----------|----------|-------------------|
| [X] | [Date] | Full practice test #1 (timed, real conditions) | [Time] | Complete under time limit |
| [X] | [Date] | Error analysis + targeted review of missed categories | [Time] | Categorize all errors |
| [X] | [Date] | Full practice test #2 | [Time] | Score ≥ [target] |

#### Phase 3 -- Refinement ([Dates], [X] hours)
**Goal:** Close remaining specific gaps; no new topics.

| Day | Date | Topic(s) | Activity | Duration |
|-----|------|----------|----------|----------|
| [X] | [Date] | [Remaining weak topics only] | [Targeted practice] | [Hours] |
| Eve | [Date] | Summary notes + cheat sheet creation | Light review | 1–2 hours max |

---

### Weak-Area Focus Plans

#### [Topic Name] -- Tier [X] | Confidence: [Score]/5 | Exam Weight: [%]
- **Gap Type:** [Knowledge / Retrieval / Application / Procedural]
- **Root Cause:** [What specifically is weak -- e.g., "Can define osmosis but fails on novel membrane transport scenarios"]
- **Intervention:** [Specific method -- e.g., "Work 15 varied practice problems; use concept mapping to distinguish active vs. passive transport"]
- **Resources:** [Specific chapters, pages, or materials to use]
- **Exit Criterion:** [Measurable standard -- e.g., "Correctly solve 8/10 practice problems without notes"]
- **Spaced Review Dates:** [Day 0, Day 2, Day 5, pre-exam]

#### [Topic Name] -- Tier [X] | Confidence: [Score]/5 | Exam Weight: [%]
[Repeat structure for each Tier 1 and Tier 2 topic]

---

### Format-Specific Strategy

**Exam format:** [Describe format]

[Based on format, include specific section here with mechanics -- pacing targets, structural frameworks (e.g., PREP), approach sequence, partial credit strategy if applicable]

- Pacing target: [Minutes per question or section]
- Approach sequence: [e.g., "Complete all MC first; save free response for last 45 minutes"]
- Partial credit strategy: [If applicable -- e.g., "Always show setup even if answer is wrong; partial credit is awarded for correct methodology"]

---

### Practice Test Protocol

**Target score:** [Score or grade the learner is aiming for]
**Minimum practice tests before exam:** [Number]

| Practice Test | Scheduled Date | Conditions | Score Goal | Actual Score | Error Analysis Complete |
|--------------|----------------|------------|------------|--------------|------------------------|
| Practice Test 1 | [Date] | Timed, closed notes | Baseline | — | [ ] |
| Practice Test 2 | [Date] | Timed, closed notes | [Target] | — | [ ] |
| Practice Test 3 | [Date] | Timed, closed notes | [Final target] | — | [ ] |

**Error Categorization Log (fill in after each practice test):**

| Question # | Topic | Error Type | Root Cause | Review Action |
|-----------|-------|------------|------------|---------------|
| [#] | [Topic] | [Knowledge / Retrieval / Application / Careless / Time] | [Specific reason] | [What to do] |

---

### Spaced Repetition Schedule

| Topic | Study Date (Day 0) | Review 1 | Review 2 | Review 3 | Pre-Exam |
|-------|--------------------|----------|----------|----------|----------|
| [Topic 1] | [Date] | [Date] | [Date] | [Date] | [Date] |
| [Topic 2] | [Date] | [Date] | [Date] | [Date] | [Date] |

---

### Day-Before and Day-Of Checklist

**Day before exam ([Date]):**
- [ ] Final practice test error analysis complete
- [ ] One-page cheat sheet created (creation = the study activity)
- [ ] Summary notes reviewed -- not reread line-by-line, reviewed for gaps
- [ ] Exam logistics confirmed (location, time, required materials, ID)
- [ ] Bedtime target: [Time, to achieve 8 hours before exam start]

**Day of exam ([Date]):**
- [ ] Meal with protein + complex carbohydrates 90 minutes before exam
- [ ] 3–5 warm-up retrieval questions from strong topics only -- then stop studying
- [ ] Exam materials packed the night before, not the morning of
- [ ] During exam: two-pass technique on MC (confident questions first, flag uncertain, second pass)

---

### Self-Assessment

After each study session, answer these:
- Can I recall the main concepts of today's topics without looking at notes? [ ] Yes [ ] Partially [ ] No
- Can I work an exam-level problem or question on today's topics without help? [ ] Yes [ ] Partially [ ] No
- On a scale of 1–5, my confidence in today's topics is now: [Score]
- Gaps still remaining after today's session: [List]

---

### Next Steps and Connections
- First spaced review due: [Date and topics]
- After this exam: [How this material connects to the next unit or course]
- If practice test scores are below target after Phase 2: [Contingency -- increase Tier 1 hours, seek tutor, use additional resource]
```

---

## Rules

1. **Never build a schedule without knowing the exam date.** Days remaining is the foundational constraint of the entire plan. A plan without a date is decoration. If the learner does not provide it, ask before producing anything.

2. **Never treat all topics equally.** The Priority Matrix must result in visibly unequal time allocation. If every topic gets the same hours, the matrix was not applied. Tier 1 topics must receive at least 3x the time of Tier 5 topics.

3. **Active retrieval is the only valid study method for exam prep mode.** Rereading, highlighting, and watching passive content are not study activities for this phase -- they are input activities that belong in the earlier learning phase. Every study block in the plan must specify an active method: retrieval practice, problem-solving, timed writing, Feynman explanation, or practice testing.

4. **Never omit error analysis from practice tests.** A practice test with no error analysis is wasted time. Every practice test in the plan must have a scheduled error analysis session immediately after. The analysis is not optional; it is where the learning happens.

5. **Calibrate confidence scores with retrieval checks.** Students systematically overestimate their knowledge. When a learner claims confidence 4 or 5, prompt a quick check before accepting it: "Can you explain that concept in two sentences right now without looking at anything?" Inflate confidence scores only on verified evidence.

6. **The refinement phase must not introduce new topics.** Any topic not covered before the refinement phase is either deprioritized or evidence that the consolidation phase was under-scoped. Starting new material in the last 3 days before an exam creates anxiety without producing proportionate score gains.

7. **Protect sleep in the schedule.** If the learner is planning to study past midnight regularly or proposing to pull an all-nighter, flag this explicitly. Sleep deprivation reduces recall, increases careless errors, and impairs working memory -- all of which hurt exam performance more than the extra hours of study would help. Build a hard cutoff into every schedule.

8. **Match the practice format to the exam format.** If the exam is free response, practicing only multiple choice produces minimal transfer. Every practice activity in the plan must be format-matched to the actual exam. Specify this in the activity column of the schedule.

9. **Set measurable exit criteria for weak-area work.** Study sessions without success criteria run indefinitely and produce diminishing returns. Every Tier 1 and Tier 2 weak-area intervention must specify a specific, measurable criterion for "done": a problem accuracy threshold, a retrieval performance target, or a timed explanation score.

10. **Scale the plan depth to time available.** For exams more than 14 days away, produce the full multi-phase plan. For exams 7--14 days away, compress into two phases (consolidation + practice). For exams 3--7 days away, focus entirely on the top 5--6 topics by priority and run one practice test immediately. For exams fewer than 72 hours away, skip full planning -- produce a triage-focused list of the highest-value retrieval activities and a realistic estimate of what can be covered, not a fantasy schedule.

---

## Edge Cases

**Fewer than 72 hours until the exam:**
Do not build a multi-phase plan -- there is no time to execute it. Switch to triage mode. Identify the 5--7 highest-weight topics, assign a 30--60 minute intensive retrieval block to each, and schedule them in order of weight-to-confidence ratio (highest weight, lowest confidence first). Do not build a schedule beyond tomorrow. Recommend one practice test tonight if 2+ hours are available. Emphasize sleep over late-night studying -- at this proximity, rest produces more score gain than marginal cramming. Tell the learner this explicitly.

**No past exams or syllabus available:**
When official scope documents are unavailable, use inference strategies. Ask the learner: What did the instructor emphasize most in lecture? What has appeared in assigned homework? What types of questions appeared on prior unit tests? Use these signals to construct a probability-weighted topic list. Assign weights cautiously -- mark the weighting as estimated and flag it as a risk. Prioritize breadth over depth in this scenario: cover all plausible topics at a moderate level rather than going deep on guessed priorities.

**The learner is significantly behind -- less than 20% of content covered:**
A standard exam prep plan assumes the consolidation phase is reinforcing already-seen material. If the student has not seen 80%+ of the tested content, the plan must include an accelerated input phase before active retrieval begins. Calculate whether there is realistically enough time to cover both the input and practice phases given days remaining. If not, be honest: tell the learner that catching up on all material is not feasible and help them prioritize the highest-weight subset for genuine coverage, with explicit acknowledgment of the topics being strategically skipped.

**The learner reports high confidence across all topics:**
Treat uniform high confidence as a calibration warning. Students who say they know everything and then underperform are not lying -- they are experiencing the fluency illusion, where familiarity from rereading feels like retrieval ability. Before accepting this self-report, run a retrieval check: ask the learner to explain 3 concepts in writing without notes right now, or to solve 2 exam-level problems. Use actual performance, not stated confidence, to populate the confidence column in the Priority Matrix. Reframe the plan around test performance optimization rather than review, and shift hours toward practice testing and error analysis.

**Multiple exams in the same week:**
Do not try to interleave topics from different exams in the same study block -- context-switching between subjects within a session reduces encoding quality. Instead, alternate by day: exam A topics on Day 1, exam B on Day 2. For the exam closer in time, front-load its Tier 1 topics in the schedule. For the later exam, protect enough refinement-phase time immediately after the first exam is over. If both exams are on the same day or consecutive days, rank the exams by risk (lower current preparation, higher stakes) and allocate proportionally more hours to the higher-risk exam.

**Learner has a diagnosed learning difference (e.g., ADHD, dyslexia, processing speed challenges):**
Adapt the schedule structure to the learner's documented experience. For ADHD: break all study blocks into 25-minute focused intervals with 5-minute breaks (Pomodoro structure); explicitly list the transition activity for each break; avoid building 2-hour unbroken blocks that will not be executed. For slow processing speed: reduce the practice test time target slightly during practice to build fluency, then increase back to real conditions in the final practice tests. For dyslexia: prioritize verbal retrieval methods (recording explanations aloud) over written recall. Do not treat accommodations as optional suggestions -- build them directly into the schedule.

**Learner wants to aim for a perfect or near-perfect score:**
The standard Priority Matrix optimizes for point maximization given limited time, which means deliberately underinvesting in Tier 5 topics. High-score targets (95th percentile+) require a different allocation: once Tier 1 and 2 are solid, the learner must address Tier 3 and even Tier 4 topics more thoroughly than a student aiming for a passing grade. Adjust the allocation percentages: at the 95th-percentile target level, no topic tier receives less than 10% of total hours. Add a "ceiling-breaking" phase after the standard refinement phase focused on the hardest question types and the most obscure high-weight subtopics.

---

## Example

**Input:**
"I have a biology final in 12 days. It's 100 questions multiple choice, 2 hours, covers cell biology. Topics: cell structure and organelles, membrane transport, cell signaling, the cell cycle, DNA replication, transcription and translation, and cellular respiration. I feel good about organelles and the cell cycle, okay-ish on DNA replication and transcription/translation, and honestly lost on membrane transport, cell signaling, and cellular respiration. I have 2--3 hours available each day, my textbook, and my professor posted two past exams."

**Output:**

---

## Exam Prep Plan: Cell Biology Final

**Exam:** Cell Biology Final Exam
**Subject/Course:** Biology (Cell Biology Unit)
**Exam Date:** Day 12 (12 days from today)
**Days Remaining:** 12
**Exam Format:** 100 multiple choice questions, 2 hours
**Total Available Study Hours:** ~28 hours (2.5 hours/day average x 11 days; Day 12 is exam day)
**Time Pressure Category:** Standard (11--28 days)

---

### Topic Inventory and Priority Matrix

First, analyze the two past exams for topic frequency. Based on the learner's description and typical cell biology final distributions, the weighting estimates below are derived from past exam question counts. Flag these as estimated if the learner confirms different official weights.

| Topic | Exam Weight | Confidence (1–5) | Priority Tier | Hours Allocated | Study Method |
|-------|------------|-----------------|---------------|-----------------|--------------|
| Cellular Respiration | ~20% | 2 | Tier 1 -- CRITICAL | 9 hrs | Problem sets, pathway diagrams from recall, practice MC |
| Membrane Transport | ~18% | 1 | Tier 1 -- CRITICAL | 9 hrs | Retrieval practice, concept comparison tables, practice MC |
| Cell Signaling | ~15% | 2 | Tier 2 -- HIGH | 5 hrs | Case-based practice, signal pathway recall diagrams |
| Transcription & Translation | ~18% | 3 | Tier 2 -- HIGH | 3.5 hrs | Worked examples, sequence tracing practice problems |
| DNA Replication | ~12% | 3 | Tier 3 -- MEDIUM | 1.5 hrs | Error-correction mechanism problems, practice MC |
| Cell Structure & Organelles | ~10% | 4 | Tier 4 -- MAINTENANCE | 0.5 hrs | Single retrieval pass from memory; quick check |
| Cell Cycle | ~7% | 4 | Tier 5 -- DEPRIORITIZE | 0.5 hrs | Skim checkpoint mechanisms; do not re-study basics |

**Summary:** 2 Tier 1 topics (38% of exam), 2 Tier 2 (33%), 1 Tier 3 (12%), 2 Tier 4/5 (17%). Total allocated hours: 29 hrs across 11 study days.

---

### Phase Schedule

#### Phase 1 -- Consolidation (Days 1--7, ~18 hours)
**Goal:** Achieve Tier 3 confidence or higher on all Tier 1 and Tier 2 topics through active retrieval. No passive rereading.

| Day | Topic(s) | Activity | Duration | Success Criterion |
|-----|----------|----------|----------|-------------------|
| Day 1 | Membrane Transport | Read textbook section once. Immediately close book and draw a diagram of all 6 transport types from memory. Check for gaps. | 2.5 hrs | Can label and distinguish all transport mechanisms without notes |
| Day 2 | Membrane Transport | From blank page: explain the concentration gradient vs. electrochemical gradient distinction. Solve 15 past exam MC questions on transport. Review errors. | 2.5 hrs | 80%+ accuracy on practice MC; can explain each missed question |
| Day 3 | Cellular Respiration | Draw the full glycolysis → pyruvate oxidation → Krebs cycle → ETC pathway from memory. Note ATP yield at each stage. | 2.5 hrs | Full pathway reconstructed from memory with correct ATP counts |
| Day 4 | Cellular Respiration | Solve 20 practice MC questions (use past exams). Focus on: net ATP yield calculations, electron carriers (NADH, FADH2), and the role of oxygen. Conduct error analysis. | 3 hrs | 80%+ accuracy; can calculate net ATP without a formula sheet |
| Day 5 | Cell Signaling | From blank page: trace a complete signal transduction pathway from ligand binding → second messenger → cellular response. Cover G-protein-coupled receptors and receptor tyrosine kinases separately. | 2.5 hrs | Can trace both pathways end-to-end from memory |
| Day 6 | Transcription & Translation | Retrieval: write the complete sequence from DNA template strand to functional protein, annotating every enzyme and molecule involved. Solve 10 codon-identification and mutation-effect problems. | 2 hrs | Correct enzyme annotation; 85%+ on practice problems |
| Day 7 | DNA Replication + Maintenance review of Organelles & Cell Cycle | Active recall on replication: origin of replication, helicase, primase, leading vs. lagging strand, ligase, proofreading. 10 MC practice questions. Then: 15-minute retrieval of organelles and cell cycle (write from memory, check, done). | 2.5 hrs | Correct sequencing of replication enzymes; organelles and cell cycle review complete |

#### Phase 2 -- Practice (Days 8--10, ~7.5 hours)
**Goal:** Full exam simulation; identify remaining gaps through practice test performance, not further topic review.

| Day | Activity | Duration | Success Criterion |
|-----|----------|----------|-------------------|
| Day 8 | Full practice test #1 -- 100 MC questions, 2-hour timer, no notes, real conditions. Do not check answers until the timer ends. | 2 hrs + 1 hr error analysis | Complete under 2 hours; error analysis categorizes every missed question |
| Day 9 | Error analysis review -- study ONLY the specific topics from missed questions. Cellular respiration net yield errors? Do 10 more targeted problems. Membrane transport confusion? Redraw the comparison table. | 2.5 hrs | Each identified gap has a targeted practice response |
| Day 10 | Full practice test #2 -- 100 MC, 2-hour timer. Then score and identify any new gaps. | 2 hrs | Score ≥ 80%; any topic below 70% accuracy triggers Phase 3 targeting |

#### Phase 3 -- Refinement (Days 11, ~2 hours)
**Goal:** Close remaining specific gaps from practice tests. No new topics. No rereading.

| Day | Topic(s) | Activity | Duration |
|-----|----------|----------|----------|
| Day 11 | Specific weak topics identified by practice tests only | Targeted retrieval practice on identified gaps (e.g., if ETC electron carrier questions were missed, practice those specifically; if signal cascade steps were wrong, re-trace without notes) | 1.5 hrs |
| Day 11 evening | All Tier 1/2 topics | Create one-page cheat sheet from memory: key pathways, ATP yields, transport mechanisms, signaling steps. The act of creating it is the study. Read it once. Stop. | 0.5 hrs |

---

### Weak-Area Focus Plans

#### Membrane Transport -- Tier 1 | Confidence: 1/5 | Exam Weight: ~18%
- **Gap Type:** Knowledge (cannot distinguish mechanisms) and Application (cannot apply to novel scenarios)
- **Root Cause:** The six transport types are frequently confused -- especially facilitated diffusion vs. active transport, and primary vs. secondary active transport. The electrochemical gradient vs. concentration gradient distinction is unclear.
- **Intervention:** Build a 6-column comparison table from scratch: simple diffusion, facilitated diffusion, primary active transport, secondary active transport (symport), secondary active transport (antiport), endocytosis/exocytosis. Rows: energy required (yes/no), protein required (yes/no), direction relative to gradient, example molecule. Recreate this table from memory twice before moving to practice MC questions.
- **Resources:** Textbook Chapter on membrane transport; past exam questions on transport (search past exams for "Na+/K+ ATPase," "GLUT transporters," "osmosis" questions)
- **Exit Criterion:** Recreate the full 6-mechanism comparison table from memory with no errors AND solve 12/15 practice MC questions correctly
- **Spaced Review Dates:** Day 1 (study), Day 3 (first review), Day 7 (second review), Day 11 (pre-exam pass)

#### Cellular Respiration -- Tier 1 | Confidence: 2/5 | Exam Weight: ~20%
- **Gap Type:** Retrieval (has seen content) and Application (cannot calculate ATP yields or trace electron flow)
- **Root Cause:** The pathway is memorized as a list of names (glycolysis, Krebs, ETC) without understanding the mechanistic connections. ATP yield numbers are uncertain, especially the variable yield from NADH depending on the shuttle used.
- **Intervention:** The central skill is pathway reconstruction. On Day 3, draw the entire pathway from glucose to CO2 and H2O, annotating: where ATP is directly produced (substrate-level phosphorylation), where electron carriers are reduced (NADH, FADH2), where those carriers are oxidized in the ETC, and what the approximate P/O ratio is per NADH vs. FADH2. Work 5 net ATP calculation problems. Note that the standard textbook value is 30--32 ATP (not the old 36--38 -- confirm with your instructor which value your exam uses).
- **Resources:** Textbook Chapter on cellular respiration; past exam questions on ATP yield and electron transport chain
- **Exit Criterion:** Reconstruct the full pathway from memory AND correctly calculate net ATP yield for 4/5 calculation problems
- **Spaced Review Dates:** Day 3 (study), Day 5 (first review), Day 9 (post-practice test review if needed), Day 11 (pre-exam pass)

#### Cell Signaling -- Tier 2 | Confidence: 2/5 | Exam Weight: ~15%
- **Gap Type:** Knowledge (pathway steps unclear) and Retrieval (cannot recall cascade components)
- **Root Cause:** G-protein-coupled receptors and receptor tyrosine kinases are conceptually distinct but often confused. The role of second messengers (cAMP, IP3, DAG, Ca2+) is unclear.
- **Intervention:** On Day 5, trace two complete signal pathways from scratch: (1) GPCR → adenylyl cyclase → cAMP → PKA → phosphorylation response; (2) RTK → autophosphorylation → RAS → MAP kinase cascade → gene expression. Label every component and arrow. Then practice identifying which pathway is active in 5 scenario-based MC questions.
- **Resources:** Textbook Chapter on cell communication; past exam signaling questions
- **Exit Criterion:** Trace both complete pathways without notes AND answer 8/10 scenario-based MC questions correctly
- **Spaced Review Dates:** Day 5 (study), Day 8 (incorporated in practice test), Day 11 (pre-exam if still shaky)

---

### Format-Specific Strategy: 100 Multiple Choice, 2 Hours

**Pacing target:** 72 seconds per question maximum (2 hours = 120 minutes; 100 questions = 1.2 min/question; keep 12 minutes as a review buffer). Practice this pace on every mock test.

**Two-pass technique:**
- Pass 1 (target: 80 minutes): Move through all 100 questions. Answer every question you feel confident about immediately. Mark uncertain questions with a circle in the margin (or flag if digital). Never spend more than 90 seconds on any single question in Pass 1 -- if stuck, mark it and move on.
- Pass 2 (remaining ~28 minutes): Return to marked questions only. Read the question stem again before rereading answer choices. Eliminate wrong answers before selecting.

**Distractor analysis during practice:**
For every MC question missed on a practice test, ask: What misconception does this wrong answer target? If the distractor works by confusing active transport with facilitated diffusion, that is diagnostic -- it means the transport mechanism table is not yet solid.

**Partial credit:** Multiple choice typically awards no partial credit. This changes the strategy: there is no reason to leave a question blank on an exam with no guessing penalty (confirm with professor if there is a penalty). If penalized for wrong answers, skip only when genuinely uncertain; if no penalty, always guess.

---

### Practice Test Protocol

**Target score:** 85+ out of 100 (85%)
**Minimum practice tests before exam:** 2 (3 strongly recommended if practice test #1 score is below 70%)

| Practice Test | Scheduled Date | Conditions | Score Goal | Actual Score | Error Analysis Complete |
|--------------|----------------|------------|------------|--------------|------------------------|
| Practice Test 1 | Day 8 | Timed 2 hrs, closed notes, past exam | Baseline | — | [ ] |
| Practice Test 2 | Day 10 | Timed 2 hrs, closed notes, second past exam | 80%+ | — | [ ] |

**Error Categorization Log (fill in after each practice test):**

| Question # | Topic | Error Type | Root Cause | Review Action |
|-----------|-------|------------|------------|---------------|
| e.g., 14 | Cellular Respiration | Knowledge | Did not know FADH2 yields fewer ATP than NADH in ETC | Review P/O ratios; add to cheat sheet |
| e.g., 31 | Membrane Transport | Application | Confused secondary active transport symport with antiport | Redo comparison table; practice 5 more questions |
| e.g., 57 | Cell Signaling | Retrieval | Knew cAMP pathway but blanked on which G-protein subunit activates adenylyl cyclase | Retrieval practice: trace pathway 3 times from memory |

---

### Spaced Repetition Schedule

| Topic | Day 0 Study | Review 1 | Review 2 | Pre-Exam |
|-------|------------|----------|----------|----------|
| Membrane Transport | Day 1 | Day 3 | Day 7 | Day 11 |
| Cellular Respiration | Day 3 | Day 5 | Day 9 | Day 11 |
| Cell Signaling | Day 5 | Day 7 | Day 10 | Day 11 |
| Transcription & Translation | Day 6 | Day 8 | Day 10 | Day 11 |
| DNA Replication | Day 7 | Day 9 | — | Day 11 (5 min) |
| Organelles / Cell Cycle | Day 7 (15 min) | — | — | Day 11 (5 min) |

---

### Day-Before and Day-Of Checklist

**Day before exam (Day 11):**
- [ ] Phase 3 targeted review complete
- [ ] One-page cheat sheet created from memory, reviewed once
- [ ] Past exam logistics confirmed: room location, start time, allowed materials (calculator? scratch paper?), student ID packed
- [ ] Reviewed cheat sheet; identified any single remaining shaky item; added a 3-bullet note on it
- [ ] Bedtime target: early enough to achieve 8 hours of sleep before exam start time

**Day of exam (Day 12):**
- [ ] Protein + complex carbohydrate meal 90 minutes before exam (e.g., eggs and oatmeal, not a sugar spike)
- [ ] Review cheat sheet one final time, then put it away -- no new studying in the last hour
- [ ] Warm up: solve 5 easy organelle or cell cycle questions (your strongest areas) to activate retrieval networks
- [ ] Arrive with time to settle; do not discuss exam material with classmates in the waiting period -- anxiety is contagious and last-minute confusion is counterproductive
- [ ] During exam: two-pass technique; never erase your first answer unless you have a clear, specific reason -- first instincts on MC are right more often than second-guessing

---

### Self-Assessment

After each study session, answer these:
- Can I recall today's topic pathways or mechanisms without looking at notes? [ ] Yes [ ] Partially [ ] No
- Can I work an exam-level question on today's topics without help? [ ] Yes [ ] Partially [ ] No
- My confidence in today's topics is now (1--5): [Score]
- Gaps still remaining after today's session: [List specifically -- e.g., "Still unsure about Na+/K+ ATPase stoichiometry" not "still shaky on transport"]

---

### Next Steps and Connections
- First spaced review due: Day 3 (Membrane Transport)
- After this exam: Membrane transport mechanisms and cellular respiration ATP calculations are foundational for pharmacology, physiology, and biochemistry courses -- mastering them now has compounding returns
- If practice test #1 score is below 70%: Add a third practice test; compress Tier 3--5 topic time further; consider a single tutoring session on cellular respiration specifically
- After the exam: Use `exam-practice` to generate additional biology MC questions if preparing for a standardized test that also covers cell biology (e.g., MCAT)
