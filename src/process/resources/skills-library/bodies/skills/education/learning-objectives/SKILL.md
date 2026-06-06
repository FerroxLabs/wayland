---
name: learning-objectives
description: |
  Creates SMART learning objectives with milestones for self-directed learners planning their own study. Uses Bloom's taxonomy to help learners define what they want to learn in measurable terms -- distinct from educator-facing objective writing.
  Use when a learner asks to set learning goals, define what they want to learn, create personal learning objectives, or plan self-study milestones.
  Do NOT use for educator-facing objectives (use `educator-objectives`), for full study plans (use `study-plan`), or for professional skill gap analysis (use `skill-gap-analysis`).
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
# Learning Objectives

## When to Use

Use this skill when a self-directed learner needs to transform a vague learning intention into a structured, measurable objective with clear milestones and self-assessment criteria.

**Trigger scenarios:**

- A learner says something like "I want to learn machine learning" or "I need to get better at Spanish" and needs help converting that vague intention into something concrete and trackable
- A learner is starting a self-study project and wants to define what success looks like before they begin -- preventing the common trap of studying indefinitely without knowing when they've "learned" something
- A learner is preparing for a certification, language proficiency test, or skill demonstration and wants to reverse-engineer their objectives from the end goal backward
- A learner has a fixed time window (3 weeks before an interview, 2 months before a trip, one semester) and needs to scope their objectives to what is realistically achievable
- A learner has completed a first pass through material and wants to deepen their understanding -- moving from surface recall to application or analysis using Bloom's taxonomy as a progression guide
- A learner returns to a topic they studied before and needs to reset objectives based on what they retained versus what faded, rather than starting from scratch
- A learner wants to split a large domain (like "data science") into a sequenced set of sub-objectives with dependencies, so they know what order to learn things in

**Do NOT use when:**

- The user is a teacher, professor, or instructional designer writing objectives for a course or curriculum -- those follow different standards (Mager format, ABCD objectives, institutional alignment requirements); use `educator-objectives` instead
- The user wants a complete, day-by-day or week-by-week study schedule with resource recommendations -- that requires resource curation and scheduling logic; use `study-plan` instead
- The user is conducting a professional skills inventory for career development, promotion readiness, or hiring decisions -- that requires gap analysis against job requirements; use `skill-gap-analysis` instead
- The user wants practice questions, quizzes, or exam simulation -- the objective is to test existing knowledge, not define targets; use `exam-practice` instead
- The user already has well-formed objectives and wants help executing against them -- they need study technique guidance, not objective setting

---

## Process

### Step 1: Intake -- Gather the Right Context Before Writing Anything

Ask the learner for the following information. Do not proceed to writing objectives until you have at least the topic, purpose, and time horizon. The other fields add precision but are not blockers.

- **Topic and scope:** What specifically do they want to learn? "Python" is too broad. "Python for data manipulation using pandas" is scoped. If they give a broad domain, help them scope it in the next step.
- **Current knowledge level:** Complete beginner, some familiarity, or returning learner? This determines the starting Bloom's level and the size of achievable milestones.
- **Purpose and end use:** Why are they learning this? Job interview, personal project, upcoming trip, professional certification, academic exam, or genuine curiosity? The purpose determines what "done" looks like. An interview requires Apply-level fluency; personal curiosity may stop at Understand.
- **Time horizon:** When do they need to demonstrate this learning? Open-ended vs. deadline-driven objectives are structured differently. A 6-week window with a fixed end date produces tighter milestones than an open-ended self-improvement goal.
- **Available study time per week:** Hours matter for milestone spacing. 3 hours/week and 15 hours/week require completely different milestone widths.
- **Source material:** What will they study? Textbook, online course, video series, articles, practice problems? If they don't have source material yet, flag this and guide them to gather it before setting objectives (see Edge Cases).

### Step 2: Scope the Domain -- Convert Vague Intentions to a Focused Target

Many learners arrive with domain-level goals ("learn machine learning") rather than skill-level goals ("implement and tune a logistic regression classifier on a tabular dataset"). Your job is to scope the domain down to something achievable in their time window before writing any objectives.

- Use the **4-question scoping method:** (1) What is the smallest version of this topic that would be useful to you? (2) What would you be able to do differently after learning this? (3) Is there a specific situation where you'll need to use this? (4) What can you deprioritize for now?
- Apply the **80/20 principle:** Identify the 20% of the domain that delivers 80% of functional ability. For example, in Spanish for travel: greetings, numbers, food ordering, asking for directions, and past/present tense covers most real situations. Advanced subjunctive does not.
- Set a **scope boundary statement** -- one sentence that explicitly says what is OUT of scope for this learning objective. This prevents scope creep. Example: "This objective covers SQL SELECT queries, filtering, aggregation, and joins. It does not cover stored procedures, indexing strategy, or database administration."
- For beginners: scope to 1-2 Bloom's levels above their starting point. A complete beginner aiming for Remember and Understand in one objective set is appropriate. Jumping to Create is not.

### Step 3: Write the SMART Objective

Convert the scoped topic into a SMART objective using precise language. Each component must be substantive -- not a checkbox.

- **Specific:** Use a verb that describes a concrete output. "Understand X" is not specific. "Explain X using Y without referring to notes" is specific. "Build a working X that does Y" is specific.
- **Measurable:** Define a concrete success criterion. This is the most commonly skipped component. The criterion must be testable without a teacher. Examples: "achieve 85% accuracy on a set of 20 practice problems," "complete a 10-minute conversation with a native speaker," "deploy a working Flask app to a local server," "solve 5 LeetCode Easy problems in Python without hints."
- **Achievable:** Cross-check against available hours. A realistic learning rate for a technical skill from scratch is approximately 20-30 hours to reach basic Apply-level competency. For a language, 120+ hours to conversational. If the learner's time budget doesn't match the objective, adjust scope -- never just label an unrealistic goal "achievable."
- **Relevant:** Tie the objective explicitly to their stated purpose. "Because I am preparing for a backend developer interview at a mid-size company, this objective focuses on Python data structures and algorithm complexity rather than web frameworks."
- **Time-bound:** Set a specific date, not a duration. "By March 15" is better than "in 6 weeks" because it creates real accountability and integrates with the learner's calendar.

Write the final SMART objective as a single, grammatically complete sentence that contains all five components. Example: "By April 30, I will be able to write Python functions that process and filter a pandas DataFrame -- including groupby, merge, and apply operations -- demonstrating this by completing a real dataset project without referring to documentation for syntax."

### Step 4: Select the Right Bloom's Taxonomy Level and Assign Verbs

Bloom's taxonomy is not just a vocabulary list -- it is a cognitive load progression model. The level you target determines how the learner studies and how they self-test. Each level requires different study activities.

**Match the level to the purpose:**

| Bloom's Level | What the Learner Can Do | Required Study Activity | Appropriate For |
|---|---|---|---|
| **Remember** | Recall facts, terms, definitions, sequences | Flashcards, repetition, labeling diagrams | Early phase of any new topic; prerequisite for all higher levels |
| **Understand** | Explain in own words, paraphrase, give examples, classify | Summarization, concept mapping, explaining aloud, rewriting in own words | Building conceptual foundation; precedes application |
| **Apply** | Use a procedure in a new situation, execute a technique | Practice problems, worked examples with variation, projects | Skill-building for practical use; required for most job-relevant goals |
| **Analyze** | Break down components, compare, differentiate, identify causes | Case studies, comparative analysis, debugging, critique | Deep understanding; required for professional-level competency |
| **Evaluate** | Make judgments, critique, justify a choice, weigh trade-offs | Debates, written critiques, design reviews, recommendation documents | Advanced competency; relevant when learner needs to make decisions |
| **Create** | Produce something new from learned components | Projects, original writing, building tools, designing systems | Mastery-level; appropriate as a capstone, not a starting point |

- Never set a Create-level objective for a beginner. The cognitive prerequisites at lower levels must be met first.
- Most self-study objectives for practical goals (job prep, certification, skill building) should target Apply or Analyze.
- Academic and conceptual goals (understanding a theory, reading in a field) often target Understand or Analyze.
- Assign specific Bloom's verbs to the objective and each milestone. Avoid verbs like "know," "understand," "learn," or "be familiar with" -- these are unmeasurable. Use: define, list, label (Remember); explain, paraphrase, classify, summarize (Understand); solve, demonstrate, use, execute, compute (Apply); compare, differentiate, break down, diagram, infer (Analyze); judge, justify, critique, recommend (Evaluate); design, build, construct, produce, compose (Create).

### Step 5: Build Milestones with Bloom's Progression

Milestones are not just calendar checkpoints -- they are cognitive waypoints that mark the learner's progression up the Bloom's hierarchy. Each milestone should represent a new cognitive capability, not just "more time spent."

- **Rule of thirds for time allocation:** In any learning objective, roughly the first third of time should target Remember and Understand (building foundation), the second third should target Apply (skill-building through practice), and the final third should target Analyze or Evaluate (consolidation and deepening). Adjust based on purpose.
- **Milestone granularity:** For objectives of 4 weeks or less, use weekly milestones. For 1-3 month objectives, use biweekly milestones. For 3+ month objectives, use monthly milestones with a biweekly check-in.
- **Each milestone must have its own self-test:** Not "review chapter 3" but "be able to explain the difference between supervised and unsupervised learning with two examples each without referring to notes."
- **Milestone dependencies:** Label which milestones are prerequisites for the next. This tells the learner they should not advance if they cannot pass the current milestone's self-test.
- **Build in a buffer milestone:** The penultimate milestone should be a consolidation milestone -- review, integration, and gap-filling -- not new content. This prevents the common failure of "learning everything" but having no time to solidify.

### Step 6: Design the Self-Assessment Protocol

The self-assessment section is the most critical differentiator between a real learning objective and a wishful goal. Without it, learners cannot know when they've succeeded.

- **Criterion test:** Define the minimum pass threshold. Not "I feel like I understand it" but "I can solve 8 out of 10 practice problems correctly" or "I can explain this concept without hesitation to someone who hasn't studied it."
- **Bloom's-appropriate self-tests:** The test must match the target level. A Remember-level test is a blank recall quiz. An Apply-level test is a novel problem the learner hasn't seen. An Analyze-level test is a compare-and-contrast with unfamiliar cases.
- **The "cold start" test:** The strongest self-assessment is to close all materials and attempt the task from scratch 24 hours after the last study session. If the learner can still perform at the criterion level, the objective is met.
- **The "teach it" test:** For Understand and above, asking the learner to explain the concept aloud (the Feynman technique) is highly effective. Gaps in explanation reveal gaps in understanding.
- **Identify disconfirming tests:** Ask what evidence would tell the learner they have NOT met the objective. This prevents premature declaration of success.

### Step 7: Connect to Spaced Repetition Timing

Objectives set the destination; spaced repetition ensures the learning persists. Build review timing into every objective.

- **Forgetting curve anchors:** Research on the Ebbinghaus forgetting curve suggests reviewing material at approximately 1 day, 3 days, 7 days, 14 days, and 30 days after initial learning retains roughly 80%+ of material versus the roughly 20% retained without review.
- **Assign specific review dates:** Convert these intervals to calendar dates at the time the objective is created. "Review on [date + 1], [date + 3], [date + 7]" is actionable. "Review in a few days" is not.
- **Milestone-level review vs. topic-level review:** Each completed milestone should trigger a 1-day and 7-day review of that milestone's content before the learner advances. Full objective review should happen at the 30-day mark after the final milestone.
- **Flag review-resistant content:** Some content types (procedural skills, foreign vocabulary, mathematical formulas) decay faster than others (conceptual frameworks, causal reasoning). Flag high-decay content for shorter review intervals (1, 3, 5, 10 days instead of 1, 3, 7, 14, 30).

### Step 8: Output the Completed Objectives Document

Assemble all components into the formatted output below. Every field must be populated with the learner's actual content -- no blanks, no generic placeholders. Before delivering, verify:

- The SMART objective contains all five components in the written sentence
- Every milestone has a specific Bloom's level and a concrete self-test
- The self-assessment protocol has a defined pass threshold
- Review dates are calculated and listed as actual calendar dates (or day offsets if date unknown)
- The scope boundary statement is present and explicit
- A recommended follow-on skill or next learning objective is suggested

---

## Output Format

```
## Learning Objectives: [Specific Topic, Not Domain]

**Learner:** [Self (name optional)]
**Subject Area:** [Broad domain]
**Specific Topic:** [Scoped focus area]
**Purpose:** [Why the learner is studying this -- one sentence]
**Time Horizon:** [Start date -- End date, or "X weeks beginning [date]"]
**Available Study Time:** [Hours per week]
**Source Material:** [Textbook title/edition, course name, article set, etc.]
**Scope Boundary:** [One sentence stating what is explicitly OUT of scope]

---

### SMART Objective

> [One complete sentence containing all five SMART components, written in first person]

**Bloom's Target Level:** [Level] -- [Selected verb from that level]
**Success Criterion:** [The specific, testable threshold that defines "done"]

---

### Milestone Plan

| Milestone | Target Date | Bloom's Level | What I Can Do | Self-Test |
|---|---|---|---|---|
| 1 -- Foundation | [Date] | Remember | [Specific recall targets] | [Blank-recall quiz, labeling exercise, etc.] |
| 2 -- Comprehension | [Date] | Understand | [Specific explanation targets] | [Teach-it test, paraphrase test] |
| 3 -- Skill-Building | [Date] | Apply | [Specific practice targets] | [Novel problem set, mini-project] |
| 4 -- Consolidation | [Date] | Apply + Analyze | [Integration of prior milestones] | [Mixed problem set, comparison task] |
| 5 -- Mastery Check | [Date] | [Target Level] | [Full objective demonstration] | [Cold-start criterion test] |

**Milestone Dependency Note:** Milestone 2 requires passing Milestone 1 self-test. Do not advance until self-test is passed.

---

### Self-Assessment Protocol

**Cold-Start Test:** [What the learner will attempt from scratch, with all materials closed, 24 hours after last study session]

**Pass Threshold:** [Specific minimum -- e.g., "8/10 correct," "5-minute explanation with no gaps," "working program that passes all test cases"]

**Disconfirming Evidence:** [What would tell the learner they have NOT yet met the objective]

**Bloom's-Matched Self-Tests by Level:**
- Remember check: [Specific test]
- Understand check: [Specific test]
- Apply check: [Specific test]
- [Higher level if applicable]: [Specific test]

---

### Spaced Repetition Review Schedule

**First Study Session Completion:** [Date]

| Review # | Date | Focus |
|---|---|---|
| Review 1 | [Date + 1 day] | Full topic rapid recall -- 15 minutes |
| Review 2 | [Date + 3 days] | Practice 3 sample problems or re-explain key concepts aloud |
| Review 3 | [Date + 7 days] | Full cold-start test -- attempt criterion task without notes |
| Review 4 | [Date + 14 days] | Focus on weak areas identified in Review 3 |
| Review 5 | [Date + 30 days] | Full objective re-demonstration -- confirm retention |

---

### What's Out of Scope (For Now)

[Explicit list of 3-5 related sub-topics that are deliberately excluded from this objective, with brief rationale]

---

### After This Objective

**Logical next objective:** [What to learn next, in sequence, with rationale]
**Recommended technique:** [Study skill to use for next phase, e.g., `flashcard-generation`, `study-plan`, `exam-practice`]
**Connection to broader goal:** [How this objective fits into the learner's larger learning arc]
```

---

## Rules

1. **Never write an objective without a measurable success criterion.** "I will understand classical conditioning" is not an objective -- it is a wish. Every objective must answer: "How will I know, with certainty, that I have achieved this?" The criterion must be passable or fail-able by the learner alone, without a teacher.

2. **Never let the Bloom's level of the objective exceed the learner's available time and resources.** A beginner with 2 hours/week cannot reach Analyze-level in 4 weeks on a complex topic. Downscope the objective honestly rather than letting the learner set themselves up for failure and discouragement.

3. **Scope boundary statements are mandatory.** Every objectives document must include an explicit statement of what is out of scope. This is not optional -- scope creep is the single most common reason self-study objectives fail. Learners without scope boundaries add "just one more thing" until the objective becomes unachievable.

4. **Milestones must represent cognitive progression, not just time passage.** A milestone that says "Week 2: Continue reading chapter 3-5" is not a milestone -- it is a reading schedule. Every milestone must describe a new capability the learner will have: what they can do, explain, or produce that they could not before.

5. **Do not use unmeasurable Bloom's verbs.** The following verbs are banned from objectives and milestones: know, learn, understand, be familiar with, appreciate, get a grasp of, study, cover, go through. Replace them with level-specific action verbs from the Bloom's taxonomy table in Step 4.

6. **The SMART objective must be a single grammatically complete sentence.** Not a list of five bullets -- one sentence. This disciplines the objective to be coherent and integrated rather than five loosely connected requirements. If it cannot be written as one sentence, the scope is probably too broad.

7. **Achievability must be cross-checked against realistic learning rates.** Use these empirical anchors: basic familiarity with a new technical concept requires approximately 5-10 hours; Apply-level competency in a new technical skill requires approximately 20-40 hours; conversational fluency in a new language requires 120-150+ hours for closely related languages and 500+ hours for distant ones. If the learner's time budget falls short, adjust scope.

8. **Spaced repetition dates must be calculated and stated explicitly.** Do not say "review in a few days." Calculate actual dates using the 1/3/7/14/30 day schedule from the first session completion date and state them. If the learner doesn't know their exact start date, use day offsets (Day 1, Day 3, Day 7, etc.).

9. **The self-assessment protocol must include a disconfirming test.** Learners are prone to illusions of knowing -- feeling like they understand something when they actually only recognize it. The disconfirming test ("what would prove I have NOT met this objective?") counteracts this by forcing the learner to define failure, not just success.

10. **If the learner's stated purpose and their requested objective are misaligned, flag the mismatch before writing.** For example: if a learner says "I have a job interview in 2 weeks for a data analyst role" but then asks to set objectives for learning R from scratch, flag that 2 weeks is insufficient for Apply-level R competency and suggest either rescoping (focus on Excel/SQL they already know) or adjusting timeline expectations. Helping a learner set objectives that will fail is not helpful.

---

## Edge Cases

### The Learner Has No Source Material Yet

If the learner wants to learn something but has no textbook, course, or structured material identified, do not write objectives against an undefined corpus. Instead:
- Help them identify 2-3 credible source options appropriate to their level (structured course for complete beginners, reference documentation for experienced learners, textbook for academic topics)
- Write a preliminary "source selection" milestone as Milestone 0 before the main milestone plan
- Clarify that scope and achievability cannot be finalized until source material is confirmed, because the depth and sequencing of the material directly affects milestone design
- Return to the objectives after source material is selected

### The Goal Spans Multiple Years or a Very Large Domain

If a learner wants to "become a software engineer" or "master Japanese," a single SMART objective cannot capture the full scope. Handle this with a layered approach:
- Write a **horizon objective** -- the multi-year ultimate goal, stated qualitatively (this is the exception to the single-sentence measurable rule, and should be labeled "Horizon Goal, Not Measurable Objective")
- Write one **near-term SMART objective** that covers the next 4-12 weeks and moves them meaningfully toward the horizon goal
- Include a note that the next SMART objective should be written after the current one is completed, because competency at higher levels enables more accurate scoping of subsequent objectives
- Reference `study-plan` for multi-month scheduling

### The Learner Is Returning to a Topic After a Gap

A learner who studied something 6 months or 2 years ago is not starting from zero -- but they have experienced significant decay, particularly for procedural and factual content. Handle this differently from a beginner:
- Recommend a **retention assessment** before setting objectives: spend 30 minutes attempting the criterion-level tasks from the last time they studied and honestly recording what they can and cannot still do
- Set Milestone 1 as a **recovery milestone** targeting the prior Apply-level competency they had, rather than rebuilding from Remember
- Expect recovery to take approximately 30-50% of the original learning time, not 100%
- Flag that re-exposure to previously learned material is faster but requires active practice, not passive re-reading

### The Learner Sets an Objective That Conflicts With Their Time Budget

This is one of the most important mismatches to catch early. If a learner says "I want to learn calculus from scratch in 2 weeks studying 1 hour per day" (14 hours), that is approximately 100-150 hours short of Apply-level competency for a typical adult learner:
- Do not write the unrealistic objective. Do not soften it with "this might be challenging."
- State the conflict explicitly with numbers: "Your time budget is approximately 14 hours. Apply-level calculus from scratch typically requires 80-120 hours. Here are three ways to resolve this:"
- Offer three genuine options: (1) Extend the timeline to match the goal, (2) Shrink the objective to what 14 hours can achieve (e.g., "understand limits and basic derivatives conceptually"), (3) Change the purpose (if the real goal is to pass a specific test, focus exclusively on tested topics)
- Let the learner choose; then write the objective for the option they select

### The Learner Is Highly Anxious About Failure or Perfectionism

Some learners set objectives that are either impossibly demanding (perfectionism) or deliberately easy (fear of failure). Watch for these signals: objectives with pass thresholds of "100% correct," objectives that have no stretch at all ("I will read one page per week"), or learners who revise objectives downward repeatedly before starting.
- For perfectionists: point out that 85-90% criterion thresholds are appropriate for self-study objectives, that professional standards in most fields do not require 100% recall, and that setting a 100% threshold guarantees chronic perceived failure
- For avoidant learners: gently escalate the pass threshold to something that requires actual learning effort -- "reviewing the material" is not a pass criterion, "reproducing the key concepts from memory" is
- In both cases, normalize that the objective can be revised after the first milestone is reached -- the goal is a good-faith starting point, not a permanent contract

### The Learner Wants Objectives in a Domain Where AI Knowledge Has Limits

For very recent, highly specialized, or rapidly evolving topics (a specific new regulatory framework, bleeding-edge research, niche industry practices), acknowledge the limitation explicitly:
- Write the structural objective (SMART format, milestones, self-tests) using the learner's description of what they need to learn
- Note that the specific content within the objectives should be verified against authoritative current sources, and name what those source types should be (regulatory body publications, peer-reviewed journals, official documentation)
- Do not invent specific facts, benchmarks, or techniques in domains where currency of information matters

### The Learner Wants to Set Objectives for a Skill That Requires Human Feedback

Some objectives -- public speaking, creative writing, surgical technique, instrument performance -- cannot be fully self-assessed because the quality criterion requires an outside evaluator. Do not pretend the cold-start self-test is sufficient here.
- Write the structural objective normally
- Replace the solo self-assessment criterion with a hybrid: "I will self-assess against [specific rubric] AND receive feedback from [peer, instructor, recording review] at milestone 3 and at the final criterion test"
- Suggest that the learner identify a feedback source before beginning -- a language exchange partner, a writing group, a recording and self-review protocol, a practice test grader
- Adjust milestone dates to account for scheduling feedback sessions, which adds lead time

---

## Example

**Input:** "I want to learn SQL. I'm a complete beginner. I've heard I need it for data analyst jobs. I have about 8 hours a week and want to be job-ready in 2 months."

**Intake assessment:**
- Topic: SQL
- Current level: Complete beginner
- Purpose: Data analyst job readiness
- Time horizon: 2 months (approximately 8 weeks)
- Available hours: 8 hours/week = approximately 64 total hours
- Source material: Not yet specified -- needs to be identified
- Scope check: 64 hours is realistic for Apply-level SQL competency in core querying. It is NOT sufficient for advanced optimization, database design, or administration.

**Note to learner before writing objectives:** "64 hours is a solid foundation for SQL as a data analyst. You will reach confident Apply-level competency in SELECT, filtering, aggregation, joins, and subqueries -- which covers approximately 80% of what data analysts actually use day-to-day. It will not be enough to cover window functions deeply, stored procedures, indexing strategy, or database administration. I'll set the scope boundary accordingly and recommend those as a follow-on objective."

**Output:**

---

## Learning Objectives: SQL for Data Analysis -- Core Querying

**Learner:** Self
**Subject Area:** Data Engineering / Analytics
**Specific Topic:** SQL querying for data analysis (SELECT, filtering, aggregation, joins, subqueries)
**Purpose:** Build job-ready SQL competency for data analyst roles, demonstrating the ability to extract, filter, and summarize data from relational databases
**Time Horizon:** Week 1 through Week 8 (64 hours total at 8 hours/week)
**Available Study Time:** 8 hours/week
**Source Material:** To be confirmed -- recommend one structured beginner SQL course (video-based) plus a practice environment (PostgreSQL via a free cloud sandbox or SQLiteOnline)
**Scope Boundary:** This objective covers SELECT queries, WHERE filtering, GROUP BY aggregation, HAVING, INNER and LEFT JOINs, and single-level subqueries. It explicitly excludes window functions, CTEs, stored procedures, indexing strategy, database design, and database administration.

---

### SMART Objective

> By [8 weeks from start], I will be able to write correct SQL queries -- including multi-table joins, GROUP BY aggregations, and subqueries -- against an unfamiliar database schema to answer realistic data analyst questions, demonstrating this by completing a timed 10-question SQL challenge on an unseen dataset with at least 8 out of 10 correct answers without referring to documentation.

**Bloom's Target Level:** Apply -- *execute, construct, produce*
**Success Criterion:** 8/10 correct answers on a 10-question SQL challenge using an unfamiliar dataset, completed without reference to notes or documentation, within a 90-minute window

---

### Milestone Plan

| Milestone | Target Date | Bloom's Level | What I Can Do | Self-Test |
|---|---|---|---|---|
| 1 -- Foundation | End of Week 2 | Remember + Understand | Name and explain the purpose of SELECT, FROM, WHERE, ORDER BY, LIMIT, and basic data types (INT, VARCHAR, DATE); explain what a relational table and primary key are | Close all materials and write a correct query from memory to retrieve all rows from a named table where a date column is after a given value; explain what a primary key does in one sentence without notes |
| 2 -- Aggregation | End of Week 4 | Apply | Write GROUP BY queries with COUNT, SUM, AVG, MIN, MAX; filter grouped results with HAVING; distinguish WHERE from HAVING with a concrete example | Given a table schema (customer orders), answer 5 aggregation questions: total revenue by region, count of orders per customer, average order value by product category -- all from memory, no documentation |
| 3 -- Joins | End of Week 6 | Apply | Write INNER JOIN and LEFT JOIN queries across 2-3 tables; explain when to use each join type with a real example; identify when a query requires a join vs. a filter | Given a 3-table schema (customers, orders, products), answer 4 questions that require joining 2 or 3 tables -- at least 3 out of 4 correct, no documentation |
| 4 -- Consolidation | End of Week 7 | Apply + Analyze | Combine all prior skills (aggregation + joins + subqueries) in multi-step queries; identify and correct common SQL errors (wrong join type, missing GROUP BY column, incorrect aggregation); explain query logic in plain English | Attempt a 5-question mixed challenge (aggregation + join + subquery). Then explain each query's logic aloud as if walking a non-technical colleague through it. Identify at least one efficiency concern in your own query |
| 5 -- Mastery Check | End of Week 8 | Apply | Demonstrate full objective: answer 10 realistic analyst questions against an unfamiliar schema, 90 minutes, no notes | Cold-start 10-question challenge. Pass = 8/10 correct |

**Milestone Dependency Note:** Do not begin Milestone 3 (Joins) until you have passed the Milestone 2 self-test (5 aggregation questions, at least 4/5 correct). Join queries that involve aggregation require confident aggregation skills as a prerequisite -- attempting them before that foundation is solid will produce confusion rather than learning.

---

### Self-Assessment Protocol

**Cold-Start Test:** On the day after completing Milestone 5 study, open a fresh practice database you have not used before. Attempt 10 realistic analyst questions (e.g., "Which 5 customers had the highest total spend last quarter?" "What percentage of orders included product category X?") without opening any notes, documentation, or prior query files. Record your score.

**Pass Threshold:** 8 out of 10 correct answers, completed within 90 minutes, with no reference to documentation or notes

**Disconfirming Evidence:** You have NOT met this objective if: (1) you cannot write a correct multi-table join query without looking up syntax; (2) you cannot distinguish when to use HAVING versus WHERE when asked on the spot; (3) you require more than 15 minutes per question on the criterion challenge; (4) you cannot explain what your own query is doing in plain English after writing it

**Bloom's-Matched Self-Tests by Level:**

- **Remember check (Milestone 1):** Cover your screen. Write out, from memory, the correct SQL syntax for a basic SELECT query with a WHERE clause, an ORDER BY, and a LIMIT. Then name the five main aggregate functions and what each computes.
- **Understand check (Milestone 1-2):** Explain out loud, without notes, the difference between WHERE and HAVING. Give one example where each is needed. If you hesitate or cannot produce an example, return to the source material before advancing.
- **Apply check (Milestone 2-4):** Given a schema you haven't seen before, write 3 queries without documentation: one aggregation, one join, one that combines both. Score yourself: correct syntax + correct logic = pass.
- **Analyze check (Milestone 4):** Review a query you wrote in Week 6. Identify at least one thing you would do differently now and explain why (better join type, more efficient filter, cleaner subquery structure). If you cannot critique your earlier work, you have not yet reached Analyze level.

---

### Spaced Repetition Review Schedule

**First Study Session Completion:** Day 1 (Week 1, Session 1)

| Review # | Timing | Focus |
|---|---|---|
| Review 1 | Day 2 | Rapid recall: write SELECT, WHERE, ORDER BY syntax from memory without looking. 15 minutes maximum. |
| Review 2 | Day 4 | Write 3 fresh queries against the practice database using only what you've learned so far. No copy-pasting from prior queries. |
| Review 3 | Day 8 | Cold-start: close all notes and attempt to answer 5 questions from a fresh prompt. Note which concepts required hesitation. |
| Review 4 | Day 15 | Focus review on hesitation points from Review 3. Re-attempt the same 5 questions plus 2 new ones. |
| Review 5 | Day 30 | Full Milestone 2 self-test (aggregation challenge). At this point you should pass 4/5 with confidence. |

**Note on high-decay content:** SQL syntax (exact keyword order, JOIN syntax, GROUP BY placement rules) decays faster than conceptual understanding. Use a brief 5-minute syntax recall exercise at the start of every study session throughout the 8 weeks -- not just at formal review points.

---

### What's Out of Scope (For Now)

The following are deliberately excluded from this objective. They are not unimportant -- they are next steps, not this step:

1. **Window functions (ROW_NUMBER, RANK, LAG, LEAD, OVER):** These are highly valued in data analyst roles but require confident Apply-level join and aggregation skills first. Target these in Objective 2.
2. **Common Table Expressions (CTEs) and complex nested subqueries:** Useful for readability and complex logic, but not required for most entry-level analyst tasks. Include in Objective 2.
3. **Indexing and query performance optimization:** This is a database engineering concern, not a data analyst day-one skill. Relevant if the role involves large-scale data engineering.
4. **Database design and normalization:** Creating tables, defining schemas, and establishing relationships are database administrator and engineer skills -- out of scope for analyst querying.
5. **Dialect-specific syntax differences (MySQL vs. PostgreSQL vs. SQL Server):** Core querying is approximately 90% consistent across dialects. Dialect-specific features (date functions, string handling) should be learned on the job against whichever system the employer uses.

---

### After This Objective

**Logical next objective:** "By [4 weeks after completing this objective], I will be able to write SQL queries using window functions (ROW_NUMBER, RANK, LAG, LEAD, PARTITION BY) to perform running totals, rankings, and period-over-period comparisons, demonstrating this by completing a 5-question window function challenge on an unfamiliar dataset with at least 4/5 correct without documentation."

**Recommended technique:** Use `flashcard-generation` for SQL syntax recall during Milestones 1-2, and `exam-practice` to simulate the 10-question criterion challenge before your final mastery check in Week 8.

**Connection to broader goal:** SQL is typically one of three technical components evaluated in data analyst interviews. After completing this objective, prioritize Excel/Python for data manipulation and data visualization. A competent data analyst candidate demonstrates SQL querying, a data manipulation language (Python pandas or Excel pivot tables), and the ability to present findings visually.

---

### Reference: SMART Framework Quick-Check

Use this table to verify your objective before beginning study. Every column must have a substantive answer -- not "yes" or "TBD."

| Component | Question to Answer | This Objective's Answer |
|---|---|---|
| **Specific** | What exactly will I be able to do? | Write correct SQL queries including joins, aggregations, and subqueries against unfamiliar schemas |
| **Measurable** | What is the pass/fail threshold? | 8/10 correct on a 10-question challenge, 90 minutes, no documentation |
| **Achievable** | Do I have the time and resources for this? | Yes -- 64 hours is realistic for Apply-level SQL core querying |
| **Relevant** | Why does this matter to my actual goal? | SQL is a primary technical requirement in data analyst job postings |
| **Time-bound** | By what specific date? | End of Week 8 (specify the actual calendar date) |

---

### Reference: Bloom's Verb Selector

Use this when writing milestones or revising your objective. Swap any banned verb (know, understand, learn) for a specific verb from the appropriate level.

| If your goal is to... | Use these verbs | Avoid |
|---|---|---|
| Memorize facts and syntax | define, list, label, recall, name, state, identify | know, learn, memorize (too vague) |
| Explain concepts | explain, describe, paraphrase, summarize, classify, give an example of | understand, grasp, be familiar with |
| Use skills in practice | execute, solve, compute, construct, use, demonstrate, produce, write | practice (too vague -- practice what, exactly?) |
| Compare and break down | compare, differentiate, examine, distinguish, diagram, infer, analyze | analyze (too vague without specifying what is being broken down) |
| Make judgments | evaluate, justify, critique, recommend, assess, argue | think about, consider |
| Build something new | design, create, compose, construct, develop, produce | make (too vague) |
