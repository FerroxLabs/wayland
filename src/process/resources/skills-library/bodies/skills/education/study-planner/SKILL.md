---
name: study-planner
description: |
  Comprehensive study plan creation using spaced repetition scheduling, Pomodoro technique, active recall strategies, exam preparation timelines, subject prioritization, study environment optimization, and proven note-taking methods including Cornell, mind maps, and outlining.
  Use when the user asks about study planner, or needs help with comprehensive study plan creation using spaced repetition scheduling, pomodoro technique, active recall strategies, exam preparation timelines, subject prioritization, study environment optimization, and proven note-taking methods including cornell, mind maps, and outlining.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of study planner.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills planning guide"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Study Planner

## When to Use

**Use this skill when:**
- User needs a structured study plan for an exam, course, or certification
- User wants to organize study time across multiple subjects
- User needs help with time management for academic work
- User wants a revision schedule using spaced repetition or active recall

**Do NOT use this skill when:**
- User wants flashcards created -- use flashcard-creator
- User needs tutoring on specific concepts -- use personal-tutor
- User wants a full course curriculum designed -- use curriculum-design skills

## Process

1. **Step 1:** Assess exam/goal, subjects, deadline, and available study hours per week
2. **Step 2:** Audit current knowledge: identify strong and weak areas per subject
3. **Step 3:** Allocate study time proportionally: more hours to weak areas and high-weight topics
4. **Step 4:** Build weekly schedule with specific sessions, techniques, and review cycles
5. **Step 5:** Include checkpoints for practice tests and plan adjustments

## Purpose

This skill helps students and lifelong learners create effective, personalized study plans grounded in cognitive science. It incorporates spaced repetition, active recall, and time management techniques to maximize retention and understanding while preventing burnout.

---

## Questions to Ask the User First

1. **What are you studying?** List all subjects or topics currently in your workload.
2. **What are your deadlines?** Exam dates, assignment due dates, or learning milestones.
3. **How much time per day/week?** How many hours can you dedicate to studying?
4. **When do you study best?** Morning, afternoon, evening, or variable?
5. **Current study habits:** How do you currently study? What seems to work or not work?
6. **Learning challenges:** Do you struggle with focus, procrastination, specific subjects, or test anxiety?
7. **Subject confidence:** Rate each subject 1-5 (1=struggling, 5=confident).
8. **Note-taking:** How do you currently take notes? Do you review them?
9. **Tools available:** Do you use flashcard apps, digital notes, or prefer paper?
10. **Goal:** What outcome do you want? (Pass the class, achieve a specific grade, deeply understand the material, prepare for a certification)

---

## Spaced Repetition Scheduling

### The Science

Spaced repetition exploits the spacing effect: information reviewed at increasing intervals is retained far longer than information crammed in one session. The skipping curve shows we lose ~70% of new information within 24 hours without review.

### The Optimal Review Schedule

```
SPACED REPETITION SCHEDULE
============================
After learning new material, review it at these intervals:

Review 1:  Same day (within hours of first learning)
Review 2:  1 day later
Review 3:  3 days later
Review 4:  7 days later
Review 5:  14 days later
Review 6:  30 days later
Review 7:  60 days later (for long-term retention)

SPACED REPETITION PLANNER
===========================
Topic / Concept         | Learned   | Rev 1  | Rev 2  | Rev 3  | Rev 4  | Rev 5
------------------------|-----------|--------|--------|--------|--------|-------
_______________________  | _________ | ______ | ______ | ______ | ______ | ______
_______________________  | _________ | ______ | ______ | ______ | ______ | ______
_______________________  | _________ | ______ | ______ | ______ | ______ | ______
_______________________  | _________ | ______ | ______ | ______ | ______ | ______
_______________________  | _________ | ______ | ______ | ______ | ______ | ______
```

### Digital Tools for Spaced Repetition
- **Anki:** Gold standard for flashcard-based spaced repetition (free on desktop, $25 on iOS)
- **RemNote:** Combines note-taking with spaced repetition
- **Quizlet:** Simpler flashcards with some spacing features
- **Obsidian + Spaced Repetition plugin:** For those already using Obsidian

---

## Timed Focus Sessions

### How It Works

The timed focus session technique -- widely known as the Pomodoro Technique(R), developed by Francesco Cirillo -- uses a simple timer-based approach to maintain focus and prevent burnout. For the complete official method, see Francesco Cirillo's book *The Pomodoro Technique* and cirilloco.com.

```
TIMED FOCUS SESSION WORKFLOW
=============================

1. Choose a task to work on
2. Set a timer for 25 minutes (one focused session)
3. Work with FULL FOCUS until the timer rings
   - No phone, no email, no distractions
   - If a thought pops up, write it on a "distraction list" and continue
4. Take a 5-minute break
   - Stand up, stretch, get water
   - Do NOT check social media (it hijacks your attention)
5. Repeat for 4 sessions
6. Take a 15-30 minute longer break
```

### Session Length Variations

| Variation | Work | Break | Best For |
|-----------|------|-------|----------|
| Standard | 25 min | 5 min | Most people, most tasks |
| Extended | 50 min | 10 min | Deep reading, writing, coding |
| Short | 15 min | 3 min | High-anxiety tasks, getting started |
| Flexible | 25-50 min | 5-15 min | Variable focus capacity |

---

## Active Recall Strategies

### Why Active Recall Works

Passive review (re-reading, highlighting) creates an illusion of knowledge. Active recall -- forcing your brain to retrieve information -- builds stronger neural pathways and dramatically improves retention.

### Active Recall Techniques

```
ACTIVE RECALL METHODS
======================

1. BLANK PAGE TEST
   Close your notes. On a blank page, write everything you can
   remember about the topic. Then open your notes and see what
   you missed. Study the gaps.

2. SELF-QUIZZING
   After reading a section, close the book and ask yourself:
   - What were the main points?
   - How does this connect to what I already know?
   - What examples can I think of?
   - Can I explain this to someone else?

3. PRACTICE PROBLEMS (without looking at solutions)
   Attempt every problem before checking answers.
   Struggling is part of the learning process.

4. TEACH-BACK METHOD
   Explain the concept out loud as if teaching someone else.
   Where you stumble = where you need more study.

5. FLASHCARDS (done correctly)
   - Look at the question side only
   - Attempt to recall the full answer BEFORE flipping
   - Rate your recall (easy/medium/hard)
   - Sort hard cards for extra review

6. QUESTION-BASED NOTES
   Turn your notes into questions. During review, answer the
   questions without looking at your notes.

7. CORNELL NOTE REVIEW
   Cover the right column (notes). Use left column (cues/questions)
   to test yourself. Check against notes.
```

---

## Exam Preparation Timelines

### The Ideal Study Timeline

```
EXAM PREPARATION SCHEDULE
===========================

4+ WEEKS BEFORE EXAM:
  [ ] Review syllabus -- identify all topics that will be covered
  [ ] Gather all materials (notes, textbook, past exams, study guides)
  [ ] Create a topic checklist and rate your confidence (1-5) for each
  [ ] Begin spaced repetition for weakest topics
  [ ] Study 1-2 hours per day on this subject

2-3 WEEKS BEFORE:
  [ ] Complete first pass through all material
  [ ] Create summary notes or flashcards for each topic
  [ ] Take a practice test (if available) under timed conditions
  [ ] Analyze practice test: identify weak areas
  [ ] Focus study on weak areas, maintain strong areas with brief review

1 WEEK BEFORE:
  [ ] Second practice test under exam conditions
  [ ] Review all flashcards / summary notes
  [ ] Focus on trouble spots revealed by practice tests
  [ ] Begin tapering study intensity (avoid burnout)
  [ ] Confirm exam logistics (time, location, what to bring)

DAY BEFORE:
  [ ] Light review only -- skim summary notes, do a few easy problems
  [ ] Prepare everything needed for exam day
  [ ] Get good sleep (8 hours minimum)
  [ ] NO cramming -- it hurts more than it helps at this point

EXAM DAY:
  [ ] Wake early, eat a good meal
  [ ] Brief review of key formulas / concepts (15-20 min max)
  [ ] Arrive early
  [ ] Trust your preparation
```

### Cramming (When You Have No Choice)

```
EMERGENCY STUDY PLAN (1-3 days before exam)
=============================================
If you are behind, focus on HIGHEST IMPACT material:

1. Get the exam study guide or list of topics
2. Prioritize topics by:
   a) Most likely to appear on the exam (ask classmates, check past exams)
   b) Most points per topic
   c) Topics you have SOME understanding of (easier to bring to passing level)
3. For each topic:
   - Read the textbook summary / chapter summary (not the full chapter)
   - Do 2-3 practice problems
   - Write a one-page summary from memory
4. Use the 80/20 rule: 20% of topics likely cover 80% of the exam
5. Sleep. Seriously. A rested brain performs dramatically better than an
   exhausted one with slightly more information.
```

---

## Subject Prioritization

### The Priority Matrix

```
SUBJECT PRIORITIZATION MATRIX
===============================
List all subjects and rate each factor 1-5:

Subject          | Difficulty | Upcoming Deadline | Grade Impact | Confidence | PRIORITY
                 | (5=hardest)| (5=soonest)      | (5=highest)  | (1=lowest) | SCORE
_______________ | __________ | ________________ | ____________ | __________ | ______
_______________ | __________ | ________________ | ____________ | __________ | ______
_______________ | __________ | ________________ | ____________ | __________ | ______
_______________ | __________ | ________________ | ____________ | __________ | ______
_______________ | __________ | ________________ | ____________ | __________ | ______

PRIORITY SCORE = Difficulty + Deadline + Grade Impact + (6 - Confidence)
Higher score = higher priority for study time

STUDY TIME ALLOCATION:
  Highest priority: 40% of study time
  Medium priority: 35% of study time
  Lowest priority: 25% of study time
```

### Daily Study Schedule Template

```
DAILY STUDY SCHEDULE
=====================
Available study time: ____ hours

TIME BLOCK 1: __________ (hardest/highest priority subject)
  Duration: ____ pomodoros
  Task: __________
  Method: [ ] Active recall  [ ] Practice problems  [ ] New material

BREAK: 15-30 min (physical activity, snack, rest)

TIME BLOCK 2: __________ (second priority subject)
  Duration: ____ pomodoros
  Task: __________
  Method: [ ] Active recall  [ ] Practice problems  [ ] New material

BREAK: 15-30 min

TIME BLOCK 3: __________ (review / lowest priority)
  Duration: ____ pomodoros
  Task: __________
  Method: [ ] Spaced repetition review  [ ] Flashcards  [ ] Summary review

DAILY REVIEW (10 min before stopping):
  What did I learn today? __________
  What do I need to review tomorrow? __________
```

---

## Study Environment Optimization

### The Ideal Study Environment

```
STUDY ENVIRONMENT CHECKLIST
=============================
PHYSICAL SPACE:
  [ ] Dedicated study area (not your bed)
  [ ] Adequate lighting (natural light preferred)
  [ ] Comfortable temperature (slightly cool is best for focus)
  [ ] Clean, organized desk with only necessary materials
  [ ] Comfortable but upright seating (not too comfortable)

DIGITAL ENVIRONMENT:
  [ ] Phone on silent, face-down, or in another room
  [ ] Social media blockers active (Freedom, Cold Turkey, Forest app)
  [ ] Only necessary tabs open in browser
  [ ] Notifications disabled on computer
  [ ] Study playlist or white noise ready (if you use audio)

SUPPLIES READY:
  [ ] Textbook / notes / materials for this session
  [ ] Water bottle filled
  [ ] Snacks (if studying for 2+ hours)
  [ ] Timer set for Pomodoro intervals
  [ ] Pen/pencil and paper for active recall

CONTEXT:
  [ ] Others know not to disturb you during this block
  [ ] Consistent study time (same time each day builds habit)
  [ ] Start ritual established (specific action that signals "study mode")
```

### Music and Study

| Music Type | Effect | When to Use |
|-----------|--------|-------------|
| Silence | Best for complex problem-solving | Math, writing, coding |
| Classical / Lo-fi | Moderate focus enhancement | Reading, reviewing notes |
| White/brown noise | Masks distracting sounds | Noisy environments |
| Lyrics / Pop music | Distracting for most tasks | Avoid during study |
| Nature sounds | Calming, moderate focus | Anxiety-prone study sessions |

---

## Note-Taking Methods

### Method 1: Cornell Notes

```
CORNELL NOTE FORMAT
====================
+-------------------+----------------------------------------+
| CUE COLUMN        | NOTE-TAKING COLUMN                     |
| (2.5 inches)      | (6 inches)                             |
|                   |                                        |
| Questions you     | Main notes during lecture/reading       |
| want answered:    | - Key ideas                            |
|                   | - Supporting details                   |
| Key terms:        | - Examples                             |
|                   | - Diagrams                             |
| Triggers for      |                                        |
| memory:           |                                        |
|                   |                                        |
+-------------------+----------------------------------------+
| SUMMARY SECTION (2 inches)                                  |
| Write a 2-3 sentence summary of the page in your own words |
| AFTER the lecture/reading. This is the active recall step.  |
+------------------------------------------------------------+

REVIEW PROCESS:
1. Cover the right column
2. Use cues in the left column to test recall
3. Check your answers against the notes
4. Review summaries for big-picture understanding
```

### Method 2: Mind Maps

```
MIND MAP STRUCTURE
===================
                     [Sub-topic]
                         |
                    [Sub-detail]
                   /
[Related concept]--[MAIN TOPIC]--[Key concept]
                   \              |
                    [Example]    [Detail]
                                  |
                                [Example]

RULES:
1. Central topic in the middle
2. Main branches for major subtopics
3. Smaller branches for details and examples
4. Use colors to group related ideas
5. Use images or symbols where possible
6. Keep text short (keywords, not sentences)

BEST FOR: Big-picture understanding, connecting ideas, visual learners
```

### Method 3: Outline Method

```
OUTLINE NOTE FORMAT
====================
I. Main Topic
   A. Subtopic
      1. Detail
      2. Detail
         a. Example
         b. Example
   B. Subtopic
      1. Detail
      2. Detail
II. Main Topic
   A. Subtopic

BEST FOR: Hierarchically structured content, sequential material,
organized thinkers. Works well for textbook reading.
```

### Method 4: The Feynman Technique (Study Method + Note-Taking)

```
FEYNMAN TECHNIQUE STEPS
=========================
1. Choose a concept
2. Write the concept name at the top of a blank page
3. Explain it in simple language as if teaching a 12-year-old
   - No jargon
   - Use analogies
   - Be specific
4. Identify gaps: where did you struggle to explain?
5. Go back to the source material for those gaps
6. Simplify further
7. Repeat until you can explain it simply and completely

IF YOU CAN'T EXPLAIN IT SIMPLY, YOU DON'T UNDERSTAND IT WELL ENOUGH.
```

---

## Weekly Study Plan Template

```
WEEKLY STUDY PLAN
==================
Week of: __________
Total available study hours: ____

Goals for this week:
  1. __________
  2. __________
  3. __________

| Day       | Time Block 1      | Time Block 2      | Time Block 3      |
|-----------|-------------------|-------------------|-------------------|
| Monday    | _________________ | _________________ | _________________ |
| Tuesday   | _________________ | _________________ | _________________ |
| Wednesday | _________________ | _________________ | _________________ |
| Thursday  | _________________ | _________________ | _________________ |
| Friday    | _________________ | _________________ | _________________ |
| Saturday  | _________________ | _________________ | _________________ |
| Sunday    | _________________ | REST / Light review| _________________ |

Spaced repetition reviews scheduled:
  __________: review __________ (learned on __________)
  __________: review __________ (learned on __________)
  __________: review __________ (learned on __________)

End-of-week review:
  What I accomplished: __________
  What I need to carry over: __________
  Adjustments for next week: __________
```

---

## Output Format

When creating a study plan, provide:

1. **Subject/topic assessment** -- What needs to be studied and current confidence levels
2. **Prioritized schedule** -- Daily and weekly plan with specific time blocks
3. **Study methods** -- Which techniques to use for each subject/topic
4. **Spaced repetition calendar** -- Review dates for previously learned material
5. **Practice plan** -- What practice problems or active recall to do when
6. **Environment recommendations** -- Setup for optimal focus
7. **Note-taking recommendation** -- Which method suits their content and style
8. **Milestones** -- Checkpoints to verify progress before exam/deadline
9. **Adjustment triggers** -- When and how to modify the plan if it is not working

## Example

**Input:** "I have my AP Chemistry exam in 6 weeks. I am strong in stoichiometry but weak in thermodynamics and equilibrium. I can study 2 hours per day."

**Output:**

## 6-Week AP Chemistry Study Plan

**Available time:** 2 hrs/day x 7 days = 14 hrs/week, 84 hrs total
**Exam weight distribution:** Stoichiometry (20%), Thermodynamics (15%), Equilibrium (15%), Kinetics (10%), Other (40%)

### Time Allocation
| Topic | Strength | Hours | Strategy |
|-------|----------|-------|----------|
| Thermodynamics | Weak | 20 hrs | Deep study + practice problems |
| Equilibrium | Weak | 18 hrs | Concept review + Le Chatelier drills |
| Kinetics | Medium | 10 hrs | Formula practice + rate law problems |
| Stoichiometry | Strong | 6 hrs | Maintenance review only |
| Other topics | Mixed | 18 hrs | Targeted review |
| Full practice exams | -- | 12 hrs | 4 full exams (weeks 3, 4, 5, 6) |

### Weekly Schedule (Sample - Week 1)
| Day | Session 1 (1 hr) | Session 2 (1 hr) |
|-----|-----------------|-----------------|
| Mon | Thermodynamics: enthalpy concepts | Practice: enthalpy calculations |
| Tue | Thermodynamics: entropy and Gibbs | Practice: spontaneity predictions |
| Wed | Equilibrium: Keq expressions | Practice: ICE table problems |
| Thu | Equilibrium: Le Chatelier principle | Practice: equilibrium shifts |
| Fri | Kinetics: rate laws | Practice: integrated rate problems |
| Sat | Stoichiometry review (maintenance) | Weak topic catch-up |
| Sun | Full topic review quiz | Adjust next week's plan |

### Checkpoints
- Week 3: Practice exam 1 (diagnostic, identify remaining gaps)
- Week 5: Practice exam 3 (target 4+ on AP scale)
- Day before: Light review only, no new material

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
