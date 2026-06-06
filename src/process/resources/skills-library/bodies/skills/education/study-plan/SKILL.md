---
name: study-plan
description: |
  Creates structured, time-boxed study plans with sessions, topics, milestones, and review checkpoints for learners. Uses spaced learning principles to produce a personalized schedule that prevents cramming and builds lasting retention.
  Use when a student or learner asks to create a study plan, organize their study time, prepare for a course, or structure their learning around a deadline.
  Do NOT use for exam-specific preparation (use `exam-prep-plan`), for educator lesson planning (use `lesson-plan-design`), or for professional certification study (use `certification-prep`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills teaching step-by-step guide"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Study Plan

## When to Use

- A student or self-directed learner explicitly asks for a study plan, study schedule, learning roadmap, or revision timetable for a course, subject, or skill
- A learner is starting a new course or subject and wants to organize their study time across multiple weeks or months before a non-exam deadline (project submission, portfolio review, job start date)
- A user describes feeling overwhelmed by the volume of material they need to learn and wants help breaking it into a manageable, structured sequence
- A learner wants to build long-term retention and consistent study habits rather than relying on last-minute cramming
- A user is returning to a subject after a gap (re-learning calculus, revisiting a language) and needs to systematically rebuild their knowledge
- A learner is studying a subject independently without a course structure and needs to construct their own curriculum and pacing
- A user mentions specific constraints -- available hours per week, a target date, a knowledge baseline -- and wants those constraints converted into a concrete schedule

**Do NOT use when:**
- The deadline is less than 7 days away and the user needs triage around a specific exam -- use `exam-prep-plan`, which is optimized for high-pressure short-horizon preparation with practice test strategies
- The user is a teacher, instructor, or tutor planning instruction for others -- use `lesson-plan-design`, which handles pedagogical sequencing, learning objectives, and classroom delivery
- The user is preparing for a professional certification exam (PMP, CISSP, CPA, bar exam) -- use `certification-prep`, which accounts for exam-specific formats, passing thresholds, and domain weighting published by certifying bodies
- The user is asking for a reading list or resource recommendations only, without wanting a schedule -- provide a curated resource list instead
- The user needs a single-session study strategy ("I have 3 hours tonight to study for tomorrow") -- that is a cramming mitigation task, not a study plan

---

## Process

### 1. Gather Learner Context Before Building Anything

Never generate a study plan without sufficient input. Ask for all of the following, or infer what you can from what the user has shared:

- **Subject and scope:** What exactly needs to be learned? "Statistics" is too broad -- "introductory statistics through regression for a psychology course" is actionable. If the scope is vague, ask the user to describe the course syllabus, textbook chapters, or skills they need to demonstrate.
- **Current knowledge level:** Where is the learner starting? Use three anchors: complete beginner (no prior exposure), partial background (took a related course or has practical experience), or reviewing (learned it before and needs to consolidate). This determines how much time to allocate per unit.
- **Available study time:** Ask for hours per day AND days per week, not just "a few hours per week." Most learners overestimate by 30-50%. If a user says "I can study 3 hours per day," treat it as 2 hours until told otherwise.
- **Deadline and its nature:** Is this a hard deadline (exam date, submission date) or a soft goal (personal improvement, job application in the future)? Hard deadlines require backward scheduling. Soft goals require SMART goal-setting first.
- **Weak areas and priorities:** What does the learner already know is difficult for them? What topics carry the most weight in their assessment?
- **Learning preferences and available resources:** Do they have a textbook, video course, or access to tutoring? What methods have worked for them before (reading, practice problems, watching lectures, teaching others)? This informs technique recommendations.

### 2. Map and Decompose the Subject into Study Units

Break the full subject into 5-15 discrete, coherent study units. Each unit should represent one meaningful chunk of learning that can be introduced, practiced, and reviewed independently.

- **Size each unit at 4-10 study hours** for a typical learner. Anything larger should be split. Anything smaller should be merged with a related topic.
- **Sequence by prerequisite dependency first, then by cognitive load.** Foundational concepts (definitions, frameworks, core mechanics) must precede applied concepts (problem-solving, analysis, synthesis). Do not let learners encounter terms in practice problems that they have not yet studied.
- **Flag units by priority tier:**
  - Tier 1 (essential): Concepts that appear in almost every subsequent unit or carry the highest exam/assessment weight. Cannot be skipped under any circumstances.
  - Tier 2 (important): Concepts that appear in some downstream units or carry moderate weight. Can be reduced in depth under time pressure but should not be skipped entirely.
  - Tier 3 (supplementary): Enrichment topics, advanced extensions, or low-frequency exam topics. First to cut if the learner is behind schedule.
- **Identify cognitive type for each unit:** Is it primarily memorization (vocabulary, formulas, dates), procedural (multi-step processes, calculations, algorithms), conceptual (understanding mechanisms, relationships, theory), or analytical (interpreting data, comparing approaches, making judgments)? This determines which study technique to apply later.

### 3. Calculate Total Available Hours and Build Time Budget

Before scheduling anything, confirm the math is realistic.

- **Total available hours** = (study hours per day) × (study days per week) × (number of weeks remaining)
- **Subtract 10-15% as buffer time** for missed sessions, slower-than-expected progress on difficult units, and review consolidation. Buffer is not free time -- it is reserved contingency.
- **Check feasibility:** Sum up the estimated hours for all study units. If unit hours exceed available hours minus buffer, the plan is not feasible as designed. You must either extend the timeline, reduce the scope (drop Tier 3 units), or increase daily study time. State this tension explicitly -- do not silently compress hours in a way that makes the plan unrealistic.
- **Distribute time by priority:** Tier 1 units should receive 50-60% of total planned hours. Tier 2 units receive 30-35%. Tier 3 receives whatever remains, if anything.
- **Allocate time within each session using a 50/30/20 rule as a starting structure:** 50% new material introduction, 30% practice and application, 20% review of previous material. Adjust ratios as the plan progresses -- in later weeks, review and practice should occupy more time than new material introduction.

### 4. Apply Spaced Repetition Scheduling

Spaced repetition is the single most evidence-supported technique for long-term retention. Build the review cadence directly into the schedule -- do not leave it as a suggestion.

- **Initial study session:** Introduce a new unit in a focused block of 25-50 minutes. For procedural or complex topics, limit initial sessions to 25-30 minutes with a break before continuing, to avoid cognitive overload.
- **Review 1 (Day 1-2 after introduction):** Brief active recall session, 15-20 minutes. The learner should attempt to retrieve the material from memory before checking notes. This is the most critical review -- do not let it slip past Day 2.
- **Review 2 (Day 4-7 after Review 1):** Medium retrieval session, 20-25 minutes. Include practice problems or Feynman explanation in addition to recall.
- **Review 3 (Day 10-14 after Review 2):** Consolidation check, 15-20 minutes. If the learner can reproduce the material accurately, the unit moves to "maintenance" status (monthly review). If not, reschedule it as if it were Review 1 again.
- **Interleaving:** After Week 1, every study session should contain at least two different units -- new material plus review of an older unit. This interleaving effect improves transfer and discrimination between similar concepts, even though it feels less productive than blocking (studying one topic for hours at a time). When a learner says "interleaving feels like it isn't working," that sensation is normal and expected -- it is a sign of productive difficulty, not a sign to stop.
- **Do not space reviews of foundational/Tier 1 units beyond 14 days in the active study period.** These should remain active in the schedule until the final week.

### 5. Build the Day-by-Day Weekly Schedule

With units sized, sequenced, and review cadences calculated, construct the actual schedule.

- **Use backward scheduling from the deadline.** Place the final comprehensive review week last, then fill in units working backward to the present. This ensures critical material is not front-loaded so heavily that it decays before the deadline.
- **Assign specific daily blocks, not just weekly topics.** "Study Unit 3 this week" is not a plan -- it is an intention. "Monday: Unit 3 SN2 mechanism introduction, 60 min new material + 20 min flashcard review of Unit 1" is a plan.
- **Structure each day's session explicitly:**
  - Opening retrieval (5-10 min): Before any new material, the learner writes down everything they remember from the previous session without notes. This primes memory consolidation.
  - New material (25-50 min): Introduction of new content using the recommended technique for that unit's cognitive type.
  - Practice (15-30 min): Active application of new material -- problems, summaries, worked examples.
  - Review (10-20 min): Spaced retrieval of material from 1-2 weeks prior.
- **Front-load Tier 1 content in the first 60% of the schedule.** Tier 2 content occupies the middle of the plan. Tier 3 is last and dropped first if behind.
- **Include one full rest day per week with no studying.** This is non-negotiable for consolidation. Sleep and rest are when memory consolidation and procedural skill solidification occur at the neurological level. Scheduling 7 days of study produces worse outcomes than 6 days.
- **Place milestone checkpoints at the end of every 1-2 weeks**, coinciding with the completion of a logical group of units.

### 6. Define Milestones and Progress Checkpoints

Every milestone must be specific and testable. Vague milestones ("feel comfortable with Unit 3") do not function as checkpoints because learners cannot accurately self-assess comfort -- they routinely overestimate understanding through the illusion of fluency (recognition feels like recall until the test).

- **Define a concrete task the learner can attempt independently** at each checkpoint. Examples: "Solve 5 practice problems from Chapter 4 without looking at notes and check answers," "Write a one-page explanation of [concept] in plain language without reference material," "Reproduce a diagram/formula/process from memory and compare to the source."
- **Define a passing threshold.** 70-80% accuracy on practice problems is a common minimum for moving forward. Below that threshold, the learner should not advance -- they should add a catch-up session before proceeding.
- **Define a "triage protocol" for each milestone in case the learner is behind schedule:**
  - Behind by 1-2 hours: Use buffer time to catch up, no curriculum changes.
  - Behind by 3-5 hours: Reduce depth on Tier 3 units, reallocate time to Tier 1.
  - Behind by 6+ hours: Drop Tier 3 entirely, reduce Tier 2 to overview only, concentrate remaining time on Tier 1 mastery.
- **Define an "ahead of schedule" extension for each milestone** to prevent the learner from feeling like the plan is done and disengaging: deeper practice sets, a related extension topic, or a teaching exercise (explaining the material to someone else or writing a mock tutoring response).

### 7. Assign Study Techniques to Each Unit by Cognitive Type

Generic advice like "review your notes" causes passive re-reading, which produces one of the weakest retention effects in learning science. Every unit must have a specific technique matched to its cognitive demands.

- **Memorization-heavy units (vocabulary, formulas, taxonomies, dates):** Spaced flashcard review using active recall (look at the prompt, generate the answer before flipping). Physical or digital flashcards work equally well if the learner actively retrieves rather than just re-reads. Memory palace (method of loci) is appropriate for ordered sequences. Mnemonics for enumerated lists. Avoid highlighting as a primary technique -- it creates an illusion of learning with minimal retention benefit.
- **Procedural units (calculations, algorithms, multi-step processes, reaction mechanisms):** Worked examples first (study a solved problem in detail, annotating each step), then partially worked problems (fill in missing steps), then independent problem solving without reference material. The most critical practice is solving problems from scratch with the textbook closed. Learners who only study solved examples perform 40-50% worse on novel problems than those who practice unsolved problems.
- **Conceptual units (understanding mechanisms, cause-and-effect, theory, frameworks):** Feynman technique -- write an explanation of the concept in simple language, as if teaching a 12-year-old. Identify the gaps where the explanation breaks down and return to the source material for those gaps only. Concept mapping (drawing relationships between ideas on paper) is highly effective for subjects with dense interconnections. Compare-and-contrast exercises for similar concepts (e.g., mitosis vs. meiosis, SN1 vs. SN2) build discrimination.
- **Analytical units (interpreting data, evaluating arguments, diagnosing problems, applying judgment):** Case study analysis -- examine real or hypothetical cases, generate an analysis, then compare to an expert analysis. Past exam questions with full justifications written out, not just answers circled. Error analysis -- study problems you got wrong and diagnose why, not just what the correct answer was.

---

## Output Format

```
## Study Plan: [Subject/Topic]

**Learner Profile:** [Beginner / Partial Background / Reviewing]
**Subject:** [Full descriptive subject name]
**Duration:** [X weeks]
**Daily Study Time:** [X hours/day, Y days/week]
**Total Available Hours:** [X hours gross, Y hours net after buffer]
**Deadline:** [Date or soft goal description]
**Primary Weakness / Focus Area:** [Stated weak area if any]

---

### Time Budget

| Category | Hours |
|----------|-------|
| Total available (gross) | X |
| Buffer (15%) | X |
| Net planned study hours | X |
| Tier 1 units (allocated) | X (XX%) |
| Tier 2 units (allocated) | X (XX%) |
| Tier 3 units (allocated) | X (XX%) |

---

### Study Units

| # | Unit Title | Cognitive Type | Priority Tier | Est. Hours | Prerequisites |
|---|------------|---------------|--------------|------------|---------------|
| 1 | [Unit name] | [Memorization/Procedural/Conceptual/Analytical] | [1/2/3] | X | None |
| 2 | [Unit name] | [Type] | [Tier] | X | Unit 1 |
| 3 | [Unit name] | [Type] | [Tier] | X | Units 1-2 |

---

### Study Techniques by Unit

| Unit | Technique | Implementation Detail |
|------|-----------|----------------------|
| 1 | [Technique name] | [Specific how-to for this unit] |
| 2 | [Technique name] | [Specific how-to for this unit] |

---

### Spaced Review Calendar

| Unit | Initial Study | Review 1 | Review 2 | Review 3 |
|------|--------------|----------|----------|----------|
| 1 | Week 1 Day 1 | Week 1 Day 3 | Week 2 Day 1 | Week 3 Day 2 |
| 2 | Week 1 Day 3 | Week 1 Day 5 | Week 2 Day 3 | Week 3 Day 5 |

---

### Weekly Schedule

#### Week [N]: [Theme/Focus Label]
**Goal for this week:** [One-sentence learning objective]

| Day | Opening Retrieval (10 min) | New Material (X min) | Practice (X min) | Spaced Review (X min) |
|-----|--------------------------|---------------------|-----------------|----------------------|
| Monday | Recall [prior unit] from memory | Unit [N]: [specific topic] | [Specific exercise] | Unit [prior]: [recall method] |
| Tuesday | Recall [prior unit] from memory | Unit [N]: [continued topic] | [Specific exercise] | -- |
| Wednesday | Recall [Units N-1] from memory | Unit [N+1]: [specific topic] | [Specific exercise] | Unit [N-2]: [recall method] |
| Thursday | Recall [Unit N] from memory | Unit [N+1]: continued | [Specific exercise] | Unit [N-1]: [recall method] |
| Friday | Recall this week's units | Practice session | Mixed problems from Units [X-Y] | Self-quiz |
| Saturday | Rest | -- | -- | -- |
| Sunday | Rest | -- | -- | -- |

**End-of-Week Milestone:** [Specific testable task] -- Target: [X]% accuracy or [specific output quality]

[Repeat structure for each week]

---

### Milestones and Checkpoints

| Checkpoint | Week | Units Covered | Testable Task | Passing Threshold | If Behind: Triage Action |
|------------|------|--------------|---------------|------------------|------------------------|
| Checkpoint 1 | End Week 2 | Units 1-3 | [Specific task] | [Threshold] | [Action] |
| Checkpoint 2 | End Week 4 | Units 4-6 | [Specific task] | [Threshold] | [Action] |
| Final Review | Week [N] | All units | [Specific task] | [Threshold] | [Action] |

---

### Triage Protocol Summary

**If behind by 1-2 hours total:** Use buffer days, no changes to curriculum.
**If behind by 3-5 hours total:** [Specific Tier 3 units to reduce].
**If behind by 6+ hours total:** Drop [list specific Tier 3 units], reduce [specific Tier 2 units] to overview only. Protect [list Tier 1 units] at all costs.

---

### Ahead of Schedule Extensions

| Milestone | Extension Activity |
|-----------|-------------------|
| After Checkpoint 1 | [Specific deeper activity] |
| After Checkpoint 2 | [Specific deeper activity] |
```

---

## Rules

1. **Never build the plan before gathering scope, time, and deadline.** A plan built on assumptions will be wrong on at least one critical constraint. If the user provides enough context in their first message, proceed -- but if subject scope, available hours, or deadline are missing, ask before generating.

2. **Never exceed the learner's stated available hours.** If the total unit hours exceed net available hours, name the conflict explicitly and force a scoping decision (extend timeline, drop units, or increase hours per day). A plan that secretly over-schedules will be abandoned by Week 2.

3. **Never schedule more than 3 hours of focused study in a single subject per day**, regardless of what the learner requests. Beyond 3 hours in one subject, cognitive performance on new material drops sharply and retention suffers. If a learner has more than 3 hours per day available, recommend distributing that time across subjects or using the additional time for spaced review and practice problems rather than new content intake.

4. **Always build the review schedule explicitly, not as a suggestion.** "Review previous units as needed" is not a study plan -- it is advice. The spaced review dates for every unit must appear in the schedule as specific calendar entries.

5. **Always include one full rest day per week.** If the learner objects that they need to use every available day, explain the consolidation function of rest and offer to schedule a "light review" day (30 minutes of passive review only) as a compromise -- but do not eliminate the rest day entirely and call it a rest day.

6. **Always assign a specific cognitive type and a specific study technique to each unit.** Generic study advice (re-read the chapter, review your notes, watch a video) produces weak retention outcomes. Every unit must have a technique chosen based on whether the unit is primarily memorization, procedural, conceptual, or analytical.

7. **All milestone criteria must be specific and self-testable without a teacher.** The learner must be able to evaluate their own performance. "Understand the concept" is not testable. "Write a 200-word explanation of [concept] without notes and identify three places where your explanation could be challenged" is testable.

8. **Always include a triage protocol at each milestone.** Learners will fall behind. A plan without a contingency degrades into a guilt spiral and abandonment. Every checkpoint needs a named set of actions for being behind by small, medium, or large amounts.

9. **Sequence units by prerequisite dependency, not by chapter order or alphabetical order.** Textbook chapter order is designed for completeness, not for optimal learning sequences. Always check whether chapter N depends on chapter N-1 or whether the order can be adjusted to optimize the learning sequence for the specific learner.

10. **If the deadline is fewer than 7 days away, do not create a standard study plan.** Redirect to exam-prep triage mode. A spaced repetition schedule with multiple review cycles cannot be executed in under 7 days -- attempting to do so produces a schedule the learner cannot follow and abandons by Day 2. Instead, focus on identifying high-weight topics, using active recall immediately, and maximizing practice under test conditions.

11. **Flag the illusion of fluency risk explicitly for recognition-heavy subjects.** When a learner is studying material that involves reading (history, law, literature, biology definitions), warn them that re-reading feels productive but produces weak recall. Require them to use retrieval practice (close the notes and write what they know) rather than re-reading as the primary review technique.

12. **Do not include URLs, specific app names for paid tools, or platform-specific instructions** that may be outdated. Reference techniques and approaches, not specific product implementations.

---

## Edge Cases

### Very Tight Timeline (7-14 Days)

Do not attempt a full spaced repetition schedule. The spacing intervals (1 day, 4-7 days, 10-14 days) require more time than is available. Instead:
- Conduct a rapid triage: identify the 3-5 topics with the highest assessment weight or the most downstream dependencies.
- Focus exclusively on active recall and practice problems. No passive reading.
- Use the Review 1 cadence only (review each topic 24 hours after introduction), accepting that deep consolidation will not occur.
- Be honest with the learner: in 7-14 days, they can build working knowledge and performance on high-priority topics, not mastery across the full subject.
- If this is for an exam, redirect to the `exam-prep-plan` skill.

### No Deadline or Soft Goal

Without a deadline, spaced repetition schedules and milestones lack the urgency that drives consistency. Handle this case by:
- Helping the learner construct a SMART goal: "By [specific date, typically 6-12 weeks out], I will be able to [specific demonstration of skill]."
- Framing the goal around a concrete use case: "By October 15, I will be able to read a basic Spanish newspaper article with no more than 5 dictionary lookups" -- not "by October 15, I will know intermediate Spanish."
- Building a soft-deadline plan with clear weekly milestones and an explicit commitment mechanism (telling someone about the goal, scheduling a self-test date, booking a practice event).

### Learner Has ADHD or Described Attention Difficulties

Standard 50-minute study blocks are not viable. Adapt the session structure significantly:
- Use 15-20 minute focused blocks (one pomodoro cycle at minimum duration), not 25-50 minutes. Four 20-minute blocks with movement breaks between them are more effective than one 80-minute block.
- Every session should include both a physical transition (standing, brief movement) and a cognitive transition (write one sentence summarizing what was just studied before moving on).
- Heavily weight active and varied techniques: flashcards, whiteboard diagramming, verbal explanation, practice problems. Eliminate passive reading as a primary study method -- it is the lowest-engagement method and collapses first under attention difficulties.
- Do not schedule the same technique twice in a row within a session. Alternate method types every 15-20 minutes.
- Prioritize the first 30-45 minutes of each study session for the hardest or most important material. Attention and working memory capacity peak early in a session and decline -- do not save difficult content for the end.

### Multiple Subjects Simultaneously

When a learner is managing 3+ subjects with overlapping deadlines:
- Assign each subject a "primary day" (two or three days per week dedicated predominantly to that subject) and a "maintenance slot" (15-20 minutes of spaced review on other days). This preserves depth on individual subjects while preventing complete decay on others.
- Never interleave more than two subjects within a single day's study session. Context switching between three or more distinct subjects within one sitting increases cognitive overhead and reduces productive study time by approximately 20-40%.
- Prioritize subjects by deadline proximity and assessment weight. The subject with the nearest hard deadline receives the majority of study hours regardless of the learner's subjective preference.
- Create a separate unit map and technique assignment for each subject, but integrate them into a single weekly calendar so the learner sees the full picture and can manage transitions.

### Complete Beginner in the Subject

Beginners systematically underestimate how long foundational units will take. Apply these adjustments:
- Add 25-30% to the estimated hours for Units 1-3, which are almost always foundational and require the learner to build both vocabulary and mental models from scratch.
- Include an explicit orientation unit at the start: "What this subject is, how it is structured, what the major concepts and vocabulary are, and how this subject connects to things the learner already knows." This unit takes 1-3 hours and pays dividends in every subsequent unit by reducing cognitive load.
- Use concrete-to-abstract sequencing strictly: every new concept must be introduced with a concrete example before the abstract definition or formula. Beginners who encounter abstract formulas without concrete grounding spend time memorizing symbols they do not understand rather than building usable knowledge.
- Set realistic expectations explicitly: "As a beginner, the first two weeks will feel slow. The rate of learning accelerates substantially after foundational vocabulary and mental models are established -- typically after 10-15 hours of focused study."

### Learner Has Already Started and Is Mid-Course

When the learner is not starting from zero but is already partway through a course:
- Begin with a rapid knowledge audit: ask the learner to identify which topics they have already studied, which they feel confident about, and which they feel shaky on.
- Treat confident topics as "maintenance" (quarterly review only). Treat shaky topics as if they were newly introduced (schedule full Review 1, 2, and 3 cycles from now). Treat unstarted topics as new introductions.
- Recalculate the time budget from the current date, not from the course start date.
- The plan should begin with a 1-2 day "knowledge consolidation" pass over material already studied before introducing new content -- this reactivates prior learning and allows accurate assessment of what is actually retained versus what merely feels familiar.

### Highly Interconnected Subject (Mathematics, Programming, Music Theory)

Some subjects have near-total prerequisite dependency chains where every topic builds directly on the previous one with minimal flexibility in ordering. In these cases:
- Do not attempt interleaving of topics from across the sequence. Unit 5 cannot be studied while Unit 3 is still incomplete because Unit 5 is not accessible without Unit 3.
- Instead, interleave practice types within a unit: within a single session on differentiation (calculus), alternate between computation problems, conceptual explanation tasks, and error-correction exercises. This preserves the interleaving benefit within the constraints of the prerequisite chain.
- Flag the compounding risk explicitly: falling behind in a highly sequential subject does not create a linear problem -- missing Unit 3 creates an exponentially larger gap because Units 4, 5, and 6 become partially inaccessible. Schedule extra buffer time and trigger triage protocols earlier (at 3 hours behind rather than 6).

---

## Example

**Input:** "I need a study plan for introductory statistics for a psychology research methods course. I have 8 weeks before my end-of-semester final project is due (not a written exam -- I need to run an actual analysis in R and write it up). I can study about 1.5 hours per day on weekdays and about 2 hours on Saturdays. I've never used R before and my math background is weak -- I struggled with algebra in high school. I'm especially worried about understanding which statistical test to use and when."

---

**Output:**

## Study Plan: Introductory Statistics for Psychology Research Methods

**Learner Profile:** Complete beginner -- no prior statistics background, weak algebra foundation, no R experience
**Subject:** Introductory statistics for psychology, with applied analysis in R and written interpretation
**Duration:** 8 weeks
**Daily Study Time:** 1.5 hours/weekday (Mon-Fri), 2 hours Saturday -- 0 hours Sunday
**Total Available Hours:** 9.5 hours/week × 8 weeks = 76 hours gross
**Buffer (12%):** 9 hours reserved
**Net Planned Study Hours:** 67 hours
**Final Deliverable:** Run a complete statistical analysis in R and write an APA-style results section
**Primary Concern:** Knowing which statistical test to apply in which situation

---

### Time Budget

| Category | Hours |
|----------|-------|
| Total available (gross) | 76 |
| Buffer (12%) | 9 |
| Net planned study hours | 67 |
| Tier 1 units (allocated) | 38 hours (57%) |
| Tier 2 units (allocated) | 22 hours (33%) |
| Tier 3 units (allocated) | 7 hours (10%) |

---

### Study Units

| # | Unit Title | Cognitive Type | Priority Tier | Est. Hours | Prerequisites |
|---|------------|---------------|--------------|------------|---------------|
| 1 | Statistics Orientation: What It Is and How Psychologists Use It | Conceptual | 1 | 3 | None |
| 2 | Descriptive Statistics: Mean, Median, Mode, Variance, SD | Procedural + Memorization | 1 | 5 | Unit 1 |
| 3 | R Basics: Interface, Objects, Data Import, Basic Commands | Procedural | 1 | 6 | None (parallel) |
| 4 | Normal Distribution, Z-Scores, and Probability Logic | Conceptual + Procedural | 1 | 6 | Unit 2 |
| 5 | Hypothesis Testing Logic: Null Hypothesis, p-values, Alpha, Power | Conceptual | 1 | 6 | Unit 4 |
| 6 | Test Selection Framework: Which Test for Which Data | Analytical | 1 | 7 | Units 2-5 |
| 7 | t-Tests (One-sample, Independent, Paired) | Procedural + Analytical | 1 | 7 | Units 5-6 |
| 8 | Correlation and Simple Regression | Procedural + Analytical | 2 | 6 | Units 5-7 |
| 9 | One-Way ANOVA | Procedural + Analytical | 2 | 6 | Units 5-7 |
| 10 | Chi-Square Test | Procedural | 2 | 4 | Unit 5 |
| 11 | APA-Style Reporting of Results | Procedural + Memorization | 2 | 5 | Units 7-10 |
| 12 | Full Analysis Workflow in R (Integration Unit) | Analytical | 1 | 6 | All |

**Total estimated hours:** 67 -- exactly at net available hours. No Tier 3 units included given the tight fit. The buffer of 9 hours is the safety margin.

---

### Study Techniques by Unit

| Unit | Technique | Implementation Detail |
|------|-----------|----------------------|
| 1 | Feynman technique | After reading an introductory overview, write a one-page explanation of what statistics does and why a psychologist needs it, in plain language with no formulas |
| 2 | Worked examples then independent practice | Study 3 solved examples computing SD by hand, then solve 5 problems independently with a basic calculator, no formula sheet |
| 3 | Deliberate practice with immediate feedback | Type every command discussed in tutorials by hand (no copy-paste). Run each command, observe the output, and write one sentence describing what the output means |
| 4 | Concrete-to-abstract then problem solving | Start with real-world examples (what does "2 standard deviations above the mean" mean for a test score?). Then practice converting raw scores to z-scores and back |
| 5 | Concept mapping + Feynman | Draw a flowchart of the hypothesis testing logic from research question to p-value decision. Explain each step in writing as if teaching a classmate |
| 6 | Decision tree construction + case application | Build a personal test-selection flowchart by hand as a study artifact. Apply it to 10 different hypothetical research scenarios, justifying each choice in writing |
| 7 | Worked examples then R implementation | For each t-test type: solve one example by hand (even approximately), then reproduce the same analysis in R, compare outputs, and interpret results in one sentence |
| 8 | Scatter plot intuition first, then R practice | Sketch predicted scatter plots before computing correlations to build intuition. Run correlations and regressions in R, interpret output in plain English |
| 9 | Compare-and-contrast against t-test | Explicitly compare ANOVA logic to independent t-test logic. When would you use each? Practice identifying the difference from research descriptions before running analyses |
| 10 | Worked examples with 2×2 tables | Build contingency tables by hand before using R. Verify chi-square output matches hand calculation to confirm understanding |
| 11 | Template + revision practice | Use an APA-format template for each test type, fill it in with results from previous practice problems, revise for clarity without looking at the template |
| 12 | Simulated final project | Run a complete analysis from data import to write-up on a practice dataset, mimicking the final project requirements exactly |

---

### Spaced Review Calendar

| Unit | Initial Study | Review 1 (Day 1-2) | Review 2 (Day 5-7) | Review 3 (Day 12-14) |
|------|--------------|-------------------|-------------------|---------------------|
| 1 | Week 1 Mon | Week 1 Wed | Week 2 Mon | Week 3 Mon |
| 2 | Week 1 Wed-Fri | Week 2 Mon | Week 2 Thu | Week 3 Wed |
| 3 | Week 1 Tue-Sat | Week 2 Wed | Week 3 Sat | Week 4 Sat |
| 4 | Week 2 Tue-Thu | Week 2 Fri | Week 3 Tue | Week 4 Mon |
| 5 | Week 3 Mon-Wed | Week 3 Thu | Week 4 Tue | Week 5 Mon |
| 6 | Week 3 Thu-Sat | Week 4 Mon | Week 4 Thu | Week 5 Thu |
| 7 | Week 4 Mon-Thu | Week 4 Fri | Week 5 Wed | Week 6 Mon |
| 8 | Week 5 Mon-Wed | Week 5 Thu | Week 6 Mon | Week 7 Mon |
| 9 | Week 5 Thu-Sat | Week 6 Tue | Week 6 Fri | Week 7 Wed |
| 10 | Week 6 Mon-Tue | Week 6 Thu | Week 7 Mon | Week 7 Fri |
| 11 | Week 6 Wed-Sat | Week 7 Mon | Week 7 Thu | Week 8 Mon |
| 12 | Week 7 full | Week 8 Tue | -- | -- |

---

### Weekly Schedule

#### Week 1: Orientation and Foundations
**Goal:** Build a conceptual map of what statistics is, compute basic descriptive statistics correctly, and run your first R commands.

**Note on math anxiety:** Algebra-level arithmetic (addition, division, square roots) is sufficient for this course. The formulas in Units 2-4 are algorithms to follow -- you do not need to derive them. Focus on understanding what each number means, not on the algebra behind it.

| Day | Opening Retrieval (10 min) | New Material (55 min) | Practice (25 min) | Spaced Review (10 min) |
|-----|--------------------------|----------------------|------------------|----------------------|
| Monday | Write everything you already know about statistics (even if it's very little) | Unit 1: What statistics does, key vocabulary, levels of measurement (nominal, ordinal, interval, ratio) | Create a vocabulary list of 10 terms with your own definitions | -- |
| Tuesday | Recall Unit 1 vocabulary from memory without notes | Unit 3: Download R and RStudio, orientation to the interface, your first 5 commands (print, c(), mean(), sd(), summary()) | Type all 5 commands, run them, write what each output means in one sentence | Unit 1: Add 3 more terms to your vocabulary list |
| Wednesday | Type the 5 R commands from Tuesday from memory | Unit 2: Mean, median, mode -- definitions and calculation | Solve 5 descriptive stats problems with a calculator | Unit 1: Feynman write -- explain levels of measurement without notes |
| Thursday | Recall median and mode formulas from memory | Unit 2: Variance and standard deviation -- formula walkthrough and meaning | Work 4 variance/SD problems by hand | Unit 1 spaced review: Levels of measurement quiz (5 scenarios) |
| Friday | Recall the SD formula and meaning from memory | Unit 3: Vectors, data frames, importing a CSV, computing mean() and sd() in R | Import a sample dataset, run descriptive stats, write an interpretation of the output | Unit 2: Recall mean/median/mode formulas without notes |
| Saturday | Recall key R commands and descriptive stats formulas | Unit 2 + 3 integration: Compute all descriptive statistics for a small dataset, first by hand, then verify in R | Compare hand results to R output. Write: what does the SD tell you about this dataset? | Mixed retrieval: Units 1-2 self-quiz (10 questions) |
| Sunday | Rest | -- | -- | -- |

**End-of-Week 1 Milestone:**
- Without looking at notes, compute mean, median, and standard deviation for a dataset of 8 numbers. Check against a calculator. Target: correct formula application and accurate calculation.
- In R, import a CSV file and run summary(). Interpret the output in plain English in 3-4 sentences.
- Score 7/10 or higher on a self-generated quiz covering levels of measurement and descriptive stats vocabulary.

**If behind at end of Week 1:** Shift Unit 3 (R basics) from parallel to sequential -- complete it fully in Week 2, Days 1-3, before advancing to Unit 4. The R component has no exam weight; the concepts in Units 2 and 4 do. Protect conceptual understanding first.

---

#### Week 2: Normal Distribution and Probability Foundation
**Goal:** Understand the normal distribution intuitively, convert raw scores to z-scores, and connect probability to statistical reasoning.

| Day | Opening Retrieval | New Material (55 min) | Practice (25 min) | Spaced Review (10 min) |
|-----|------------------|-----------------------|------------------|----------------------|
| Monday | Recall Unit 2: Define variance and SD from memory | Unit 4: The normal distribution -- shape, 68-95-99.7 rule, why psychological data often approximates it | Sketch a normal distribution from memory with labeled intervals. Describe what each region means for a real psychology example | Unit 1: Explain levels of measurement in 2 sentences |
| Tuesday | Recall 68-95-99.7 rule from memory | Unit 4: Z-score formula -- converting raw scores to z-scores | Solve 6 z-score conversion problems (3 raw-to-z, 3 z-to-raw) | Unit 2: SD problem -- one 5-minute recall problem |
| Wednesday | Recall z-score formula and its meaning | Unit 4: Using z-scores to find probabilities and percentile rank | 5 probability problems using z-score table | Unit 3: Write from memory the R commands for loading a CSV and computing summary stats |
| Thursday | Explain in one sentence why z-scores are useful | Unit 5: Null hypothesis, alternative hypothesis, p-value definition | Draw the hypothesis testing flowchart from memory | Unit 4: Explain the 68-95-99.7 rule without notes |
| Friday | Recall p-value definition in your own words | Unit 5: Alpha level, Type I error, Type II error, statistical power | Create a 2×2 error table from memory and define each cell | Unit 2 spaced review: Mixed descriptive stats problems |
| Saturday | Explain Type I and Type II error without notes | Unit 5 continued: One-tailed vs. two-tailed tests, what alpha = .05 actually means | Apply hypothesis testing logic to 3 research scenarios: write out H₀ and H₁ for each | Units 4-5 integration quiz: 8 questions mixing z-scores and hypothesis testing concepts |
| Sunday | Rest | -- | -- | -- |

**End-of-Week 2 Milestone:**
- Given a raw score, mean, and SD, compute a z-score and determine the approximate percentile rank.
- Write out the null and alternative hypotheses for 3 different psychology research questions.
- Explain in plain language what a p-value of .03 means and what a researcher would conclude if their alpha was .05. Target: explanation must be correct and contain no common misconceptions (p-value is NOT the probability that the null hypothesis is true -- if your explanation implies this, revise it).

---

#### Week 3: Test Selection Framework -- The Core Analytical Skill
**Goal:** Build and internalize the test selection decision framework. This is the learner's stated primary concern and a Tier 1 unit -- it receives the most intensive attention this week.

| Day | Opening Retrieval | New Material (55 min) | Practice (25 min) | Spaced Review (10 min) |
|-----|------------------|-----------------------|------------------|----------------------|
| Monday | Recall Units 4-5: Explain hypothesis testing steps | Unit 6: Test selection -- the decision variables (number of groups, measurement level, independence, paired vs. unpaired) | Draft your own test selection flowchart in pencil (will be revised all week) | Unit 2 maintenance: 3 quick SD problems |
| Tuesday | Explain the test selection variables from memory | Unit 6: Apply framework to 5 research scenarios -- t-test family identification | Revise your flowchart based on what you got wrong. Apply to 5 new scenarios | Units 4-5: Z-score and p-value recall problems |
| Wednesday | Draw the test selection flowchart from memory without notes | Unit 6: Extend framework to correlation, ANOVA, chi-square scenarios | Apply to 8 mixed scenarios. For each, write: what type of data, how many groups, which test, why | Unit 1: Levels of measurement -- 5 scenario classifications |
| Thursday | Apply test selection framework to 3 scenarios from memory | Unit 7 preview: What a t-test actually tests, the t-statistic conceptually | Draw what a t-distribution looks like and explain how it relates to a normal distribution | Unit 6: 5 more test selection scenarios |
| Friday | Recall t-test logic without notes | Unit 7: One-sample t-test -- when to use it, formula, interpretation | Solve 2 one-sample t-test problems by hand, interpret results | Unit 5: Explain alpha and Type II error |
| Saturday | Explain one-sample t-test in plain language | Unit 6-7 integration: Run through 10 mixed research scenarios, select the test, and justify | Peer review exercise: Write out your test selection rules as if explaining to a classmate | Units 1-5 comprehensive self-quiz: 15 questions |
| Sunday | Rest | -- | -- | -- |

**End-of-Week 3 Milestone:**
- Given 10 research scenarios (varying in number of groups, measurement level, and independence of samples), correctly identify the appropriate statistical test for at least 8 of 10. Write one-sentence justifications for each choice.
- Your written test-selection flowchart should be complete enough that a classmate could use it to make decisions. If it has gaps, fill them now.

---

#### Week 4: t-Tests in Depth and Introduction to R Analysis
**Goal:** Master all three t-test types -- conceptually, by hand, and in R. Connect test output to APA-style interpretation.

| Day | Opening Retrieval | New Material (55 min) | Practice (25 min) | Spaced Review (10 min) |
|-----|------------------|-----------------------|------------------|----------------------|
| Monday | Recall one-sample t-test formula and decision rule | Unit 7: Independent samples t-test -- logic, assumptions (normality, equal variance), formula | Solve 2 independent t-test problems by hand | Unit 6: Test selection -- 5 scenarios |
| Tuesday | Explain independent t-test assumptions from memory | Unit 7: Independent t-test in R (t.test() function, interpreting output, Welch correction) | Run an independent t-test in R on sample data, interpret every number in the output | Units 4-5: Z-score and hypothesis testing recall |
| Wednesday | Recall R syntax for t.test() from memory | Unit 7: Paired samples t-test -- when data is paired, how it differs from independent | Solve 2 paired t-test problems. Explain in writing why the paired design reduces error variance | Unit 3: Write from memory R commands for data manipulation |
| Thursday | Explain why pairing reduces variance in your own words | Unit 7: Paired t-test in R + comparing all three t-test types | Apply test selection to 5 scenarios that require distinguishing between t-test types | Unit 6 full review: Test selection flowchart quiz |
| Friday | Draw a comparison table of all three t-tests from memory | Unit 11 preview: How to write up t-test results in APA format -- t(df) = X.XX, p = .XXX | Write APA-style results sentences for 3 t-test outputs | Unit 7: Reproduce t-test output interpretation without notes |
| Saturday | Write an APA results sentence from memory for each t-test type | Integration: Run all three t-tests in R on a dataset, produce a complete results section for each | Review and compare your write-ups against model answers | Comprehensive review: Units 1-7 self-quiz, 20 questions |
| Sunday | Rest | -- | -- | -- |

**End-of-Week 4 Milestone:**
- Given a scenario, run the correct t-test in R and write an APA-style results paragraph (including t statistic, degrees of freedom, p-value, direction of the effect, and a plain-English conclusion). Do this for two different scenarios without referring to notes. Both write-ups should be accurate and in correct APA format.
- Score 80% or higher on the 20-question self-quiz covering Units 1-7.

**If behind at end of Week 4:** This is the most critical triage point. If behind by more than 4 hours, drop Unit 10 (chi-square) entirely from the active plan. Chi-square will be covered at overview level only (2 hours in Week 7). Protect Units 7-9 and Unit 12 at all costs -- these are the core of the final project.

---

#### Week 5: Correlation, Regression, and ANOVA
**Goal:** Add three major tests to the repertoire -- correlation, simple regression, and one-way ANOVA -- and integrate them into the test selection framework.

| Day | Opening Retrieval | New Material (55 min) | Practice (25 min) | Spaced Review (10 min) |
|-----|------------------|-----------------------|------------------|----------------------|
| Monday | Recall all t-test types and when to use each | Unit 8: Correlation -- Pearson r, what it measures, assumptions, interpretation of direction and magnitude | Draw 4 scatter plots showing different r values. Without computing, estimate direction and approximate magnitude | Unit 7: APA write-up for one t-test from memory |
| Tuesday | Explain correlation assumptions from memory | Unit 8: Computing and interpreting Pearson r in R (cor.test()), scatterplot with abline | Run a correlation in R, produce a scatterplot, write a results sentence | Units 5-6: Hypothesis testing and test selection review |
| Wednesday | Explain what r = -.62 means in plain language | Unit 8: Simple linear regression -- relationship to correlation, slope, intercept, R² | Interpret regression output in R (lm() function) for a sample analysis | Unit 8 Day 1 retrieval: Correlation assumptions |
| Thursday | Recall what R² tells you | Unit 9: One-way ANOVA logic -- why not multiple t-tests?, F-statistic, between vs. within variance | Explain in writing why running multiple t-tests inflates Type I error rate | Units 4-5: Normal distribution and hypothesis testing |
| Friday | Recall the F-statistic and what it tests | Unit 9: Running ANOVA in R (aov(), summary.aov()), post-hoc tests (Tukey HSD), interpreting output | Run an ANOVA in R with a post-hoc test, interpret which groups differ | Unit 8: Reproduce correlation and regression interpretation |
| Saturday | Write an APA-style sentence for an ANOVA result from memory | Units 8-9 integration: Update test selection flowchart to include correlation, regression, and ANOVA. Solve 10 mixed test selection scenarios | Run 3 different analyses in R (t
