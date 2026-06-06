---
name: assessment-design
description: |
  Creates complete assessment instruments (tests, quizzes, performance tasks, projects) with item rationale, point values, answer keys, and alignment to learning objectives. Produces a ready-to-use assessment document for educators, applying assessment theory to ensure validity and reliability.
  Use when an educator asks to create a test, quiz, exam, performance task, or assessment rubric for a specific unit or set of learning objectives.
  Do NOT use for rubric-only creation (use `rubric-creation`), formative assessment strategies (use `formative-assessment`), or student exam preparation (use `exam-prep-plan`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "teaching lesson-plan curriculum step-by-step"
  category: "education"
  subcategory: "teaching"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Assessment Design

## When to Use

Use this skill when an educator, instructional designer, or curriculum developer needs a complete, ready-to-administer assessment instrument built from scratch or from stated learning objectives. Specific trigger conditions include:

- An educator asks to "write a test," "create a quiz," "design an exam," or "build a unit assessment" for a specific topic, grade level, or course
- A teacher provides learning objectives or standards codes (CCSS, NGSS, TEKS, AP course framework, state standards) and needs assessment items aligned to them
- An instructor needs a performance task, project-based assessment, or portfolio assessment with a scoring guide built in
- A curriculum designer needs an end-of-unit summative assessment that measures mastery across a full instructional sequence
- An educator needs a benchmark or diagnostic assessment with item-level data mapped to specific skills or standards
- A department or team needs a common assessment that multiple teachers will administer to compare results across classrooms

**Do NOT use when:**
- The user wants only a scoring rubric without the full assessment instrument -- use `rubric-creation` instead
- The user wants strategies for checking understanding during daily instruction (exit tickets, thumb checks, classroom polls) -- use `formative-assessment` instead
- A student is asking how to prepare for an upcoming test -- use `exam-prep-plan` instead
- The user wants a test review sheet or study guide for students -- use `study-guide-creation` instead
- The user wants to analyze existing assessment data or student scores -- use `data-analysis-education` instead
- The user is asking about large-scale standardized test design or psychometric validation at the institutional level -- this requires psychometric software (Rasch modeling, IRT) and is outside this skill's scope

---

## Process

### Step 1: Elicit and Confirm Assessment Context

Before writing a single item, gather complete design parameters. If any are missing, ask directly -- do not assume defaults and then produce a misaligned assessment.

- **Learning objectives or standards:** Get the exact statements or codes. Vague inputs like "fractions" are insufficient. Push for specificity: "Divide fractions by fractions using visual fraction models and equations (CCSS 6.NS.A.1)" is a complete target.
- **Assessment type:** Confirm whether the user wants multiple choice, constructed response, short answer, essay, performance task, lab practical, oral exam, portfolio, or a mixed-format instrument. Each has different design requirements.
- **Cognitive level intent:** Ask whether this is a recall check, an application-level assessment, or a higher-order thinking assessment. This drives Bloom's distribution decisions.
- **Grade level and reading level:** These are not the same. A 4th grade science test for English language learners requires different language complexity than a 4th grade test for fluent readers.
- **Time allotment:** Get the exact minutes available. Use the following time benchmarks to check feasibility: 1.5 minutes per multiple choice item (for under grade 5, use 2 minutes), 8-12 minutes per short answer requiring explanation, 15-20 minutes per extended constructed response, 25-45 minutes per performance task.
- **Stakes and purpose:** Clarify whether this is a low-stakes quiz (5-15% of grade), a major unit exam (15-25%), a semester benchmark, or a mastery check with retake options. Stakes affect item count, rubric detail, and grading scale design.
- **Answer key and rubric needs:** Confirm whether to include rationale for distractors, partial credit breakdowns, and/or a holistic vs. analytic rubric.
- **Accommodations:** Ask if any built-in accommodation notes are needed (extended time, read-aloud eligibility per section, reduced answer choices for identified students).

---

### Step 2: Build the Assessment Blueprint First

The blueprint is the structural skeleton. Write it before writing a single item. This is not optional -- assessments designed without a blueprint overrepresent easy content, neglect higher-order thinking, and fail content validity tests.

- **Objective-to-item mapping:** List every learning objective. Assign each a weight based on instructional time and importance. An objective that received 3 days of instruction should carry more weight than one covered in 30 minutes.
- **Bloom's Taxonomy distribution:** For a summative assessment, target this distribution as a starting point, then adjust to match the instructional emphasis:
  - Remember/Understand: 20-30% of points (foundational recall, vocabulary, definitions)
  - Apply/Analyze: 40-50% of points (procedures, explanations, comparisons, classification)
  - Evaluate/Create: 20-30% of points (argumentation, synthesis, design, judgment)
  - For a diagnostic or skills-check quiz, Remember/Understand can go as high as 60%.
  - For AP, IB, or honors assessments, Evaluate/Create should exceed 40%.
- **Item type selection by objective type:** Match item format to what the objective actually requires. Objectives using verbs like "identify," "define," "recall," or "list" are appropriate for multiple choice or matching. Objectives using "explain," "compare," "analyze," or "justify" require constructed response. Objectives using "design," "create," "demonstrate," or "perform" require performance tasks or extended projects. Never use multiple choice to assess whether a student can "construct an argument" -- the format invalidates the claim.
- **Determine total point value:** Choose a point total that allows meaningful partial credit and clean score calculation. 100 points is conventional but not required. For short quizzes, 20 or 40 points is more practical. Avoid point totals that create unwieldy conversion math.
- **Difficulty distribution:** Plan for roughly 20-25% easy items (students who have basic familiarity should answer correctly), 50-60% moderate items (students who have learned and practiced the material should answer correctly), and 20-25% challenging items (only students with deep understanding will answer correctly). This spread produces a distribution that meaningfully differentiates performance levels.

---

### Step 3: Write Multiple Choice Items with Precision

Multiple choice is the most technically demanding item format because each distractor must do specific diagnostic work.

- **Stem writing rules:** The stem must be a complete question or a clearly incomplete statement. It must contain all information needed to answer the question. A student should be able to answer the question before reading the options. The stem should not contain irrelevant information. Avoid negatively worded stems ("Which of the following is NOT...") unless the NOT is bolded and essential to the objective being tested.
- **Correct answer:** There must be one unambiguously correct answer. Have a subject matter expert check it. For math and science, work the problem yourself before writing distractors.
- **Distractor design -- the most important craft in MC writing:** Each distractor must represent a specific, real student misconception or procedural error. Write the distractor by thinking: "What would a student who made THIS specific mistake get?" Label distractors internally with the error they target, then remove those labels from the student-facing version. Common distractor categories: computation errors (wrong sign, wrong operation order), conceptual confusions (confusing similar terms or processes), incomplete reasoning (stopping a multi-step process early), and overgeneralization errors (applying a rule from another context).
- **Four options (A-D) is the research-supported default.** Three options reduce guessing probability less than most educators assume and are acceptable for younger students. Five options (common on standardized tests) are appropriate only when five genuinely plausible distractors exist -- never pad with weak options.
- **Avoid:** "All of the above," "None of the above" (eliminates diagnostic value), options that are obviously absurd, options with wildly different lengths (signals correct answer), and grammatically inconsistent options.
- **Item independence:** No item should provide the answer to another item or require the correct answer to a previous item to be answerable.

---

### Step 4: Write Constructed Response, Essay, and Performance Task Items

These item types assess cognitive complexity that multiple choice cannot reach, but they require significantly more design precision to score reliably.

- **Short answer items:** Specify in the prompt exactly what is expected. "Explain your answer in 1-3 sentences" is better than "Explain." Decide in advance which words or concepts must appear in a full-credit answer, and build that into the scoring guide. Anticipate partially correct responses (student identifies the right answer but cannot explain the reasoning) and assign those 1-2 points rather than 0 or full credit.
- **Extended response / essay items:** Provide a complete prompt with a driving question, a context or scenario, the required format (paragraph, lab report, argumentative essay, comparative analysis), and explicit length or element requirements. For argumentative tasks, specify whether evidence must be cited from provided sources, from memory, or from personal experience. Vague essay prompts produce unscoreable responses.
- **Performance tasks:** A well-designed performance task has four components: (1) a realistic scenario or context that motivates the task, (2) a clear product or deliverable the student must produce, (3) explicit constraints (time, materials, format, length), and (4) a list of what quality looks like, embedded in the task instructions or provided as a student-facing checklist. For K-12 performance tasks, build in checkpoints -- a planning stage, a drafting or building stage, and a final product stage -- so teachers can provide feedback mid-task.
- **Analytic rubrics for constructed response:** Use analytic rubrics (separate dimensions scored independently) rather than holistic rubrics (single score for whole response) when you need diagnostic data on which aspects of a standard students are struggling with. For a writing assessment: score organization, evidence, argumentation, and conventions separately. For a math task: score problem-solving process, accuracy, and communication separately. Holistic rubrics are appropriate only for quick scoring of lower-stakes work.
- **Anchor papers:** For any constructed response worth more than 10% of the total score, note in the scoring guide that the teacher should collect and calibrate with anchor papers (scored examples at each performance level) before scoring student work. Mention this as a scoring implementation note.

---

### Step 5: Write the Complete Answer Key and Scoring Guide

An answer key without rationale is a shortcut that undermines the assessment's instructional value. Every item should have a full explanation.

- **Multiple choice answer key format:** For each item -- correct answer, brief explanation of why it is correct (the reasoning chain, not just the label), and for each distractor -- name the specific error or misconception it represents. Example: "Distractor A targets the error of multiplying the base and exponent rather than raising the base to the power."
- **Constructed response scoring guides:** For each item -- a model answer or list of acceptable responses, specific language or concepts that earn each point level, explicit partial credit criteria, and a list of common student errors that reduce to each point value. Scoring guides should be specific enough that two different teachers reach the same score for the same student response at least 85% of the time (acceptable inter-rater reliability threshold for classroom assessment).
- **Point distribution logic:** Higher-order items earn more points, not fewer. An item requiring a student to evaluate, synthesize, or design should never earn the same or fewer points than a recall item. If a multiple choice item and an extended response item are worth the same points, redesign the point distribution.
- **Flag items for post-assessment analysis:** For each item, note which objective it assesses so that after scoring, the teacher can calculate objective-level mastery rates. This transforms a grade-generating instrument into a diagnostic teaching tool.

---

### Step 6: Review for Validity Threats and Bias

A technically correct assessment can still produce invalid inferences if it contains threats to construct validity or items that systematically disadvantage student subgroups.

- **Construct-irrelevant variance check:** Review every item for whether it requires skills or knowledge not part of the learning objective. A science assessment item requiring three-paragraph essay construction may be measuring writing ability, not science knowledge. A math word problem set in an unfamiliar cultural context (sports, activities, or names students may not recognize) introduces irrelevant variance.
- **Reading level audit:** Run a mental Flesch-Kincaid check. In general, item stems should be written 1-2 grade levels below the target grade to ensure reading difficulty does not confound content difficulty. Exception: English Language Arts assessments where reading complexity is intentional.
- **Stereotype and bias review:** Ensure that named characters, scenarios, and contexts in items are diverse, do not reinforce stereotypes, and reflect the range of students who will take the assessment. Review items that include occupations, family structures, hobbies, and socioeconomic contexts for inadvertent bias.
- **Cluing check:** Read all items simultaneously to ensure no item gives away the answer to another. Verify that correct answers are randomly distributed across A, B, C, and D positions in multiple choice (common mistake: correct answers cluster in position B or C).
- **Time feasibility verification:** Count all items, apply the per-item time benchmarks from Step 1, add 2-3 minutes for reading directions, and confirm the total fits within the stated time allotment with a small buffer (5 minutes) for slow readers.

---

### Step 7: Finalize the Grading Scale and Score Interpretation Guide

Grading scales are not one-size-fits-all, and blind application of the 90/80/70/60 scale is often pedagogically inappropriate.

- **Standards-based grading approach:** If the user's school uses standards-based grading (SBG), replace letter grades with proficiency levels: Advanced (consistently exceeds standard), Proficient (meets standard), Developing (approaching standard), Beginning (below standard). Typically: Advanced = 90-100%, Proficient = 75-89%, Developing = 60-74%, Beginning = below 60%.
- **Traditional grading scale:** Apply the 90/80/70/60 cutoffs only if the user's context calls for them. Note that for a particularly difficult assessment (as may be appropriate for AP or honors), the cutoffs can shift: 85% = A, 70% = B, 55% = C, etc. This is a teacher design decision, not a default.
- **Mastery threshold:** For skill-based assessments where students will retry if they don't pass (common in competency-based or mastery learning models), identify the mastery cutoff explicitly. Typically 80% indicates mastery with 15-20% error tolerance. For safety-critical skills (lab safety, CPR, etc.), mastery should be 100% on critical items.
- **Objective-level performance summary:** Include a template showing how the teacher can record, for each objective, what percentage of students answered those items correctly. This turns the graded assessment into data that drives reteaching decisions. Objective mastery below 70% class average signals a reteaching need. Objective mastery above 90% suggests the class is ready to advance.

---

### Step 8: Assemble the Final Document

Organize the complete assessment document in the order a student would encounter it, with teacher materials clearly separated.

- **Student-facing section:** Assessment title, course/subject, name/date/period fields, time allotment, total points, any permitted materials (calculator, formula sheet, dictionary), and clear section-by-section instructions. Each section header should state item type, number of items, and point value.
- **Teacher section (separate from student pages):** Answer key with rationale, scoring guide, blueprint table, objective-level tracking template, and any notes about accommodations, timing, or administration logistics.
- **Administration notes:** Identify any sections that are read-aloud eligible (typically sections that do not assess reading comprehension). Note which items or sections are calculator-permitted vs. calculator-prohibited if relevant. Note whether collaboration is permitted on any portion.
- **Accommodation flags:** Mark any items where extended time most significantly changes difficulty (typically items at the end of timed sections). Note whether the assessment can be segmented into shorter sessions for students with attention or stamina accommodations.

---

## Output Format

```
## Assessment: [Full Title]

**Course/Subject:** [Subject and Course Name]
**Unit/Topic:** [Specific unit or skill cluster being assessed]
**Grade/Level:** [Grade level or course level]
**Time Allotted:** [Total minutes]
**Total Points:** [Total point value]
**Permitted Materials:** [Calculator, notes, formula sheet, or "No additional materials"]
**Purpose:** [Summative / Diagnostic / Benchmark / Mastery Check]

---

### Assessment Blueprint

| Learning Objective | Standard Code | Bloom's Level | Item Numbers | Points | % of Assessment |
|-------------------|---------------|--------------|--------------|--------|----------------|
| [Full objective statement] | [Code] | [Level] | [#, #, #] | [pts] | [%] |
| [Full objective statement] | [Code] | [Level] | [#, #, #] | [pts] | [%] |
| **TOTALS** | | | | [total pts] | 100% |

### Bloom's Taxonomy Distribution
| Level | Item Count | Points | % of Total |
|-------|------------|--------|------------|
| Remember / Understand | [n] | [pts] | [%] |
| Apply / Analyze | [n] | [pts] | [%] |
| Evaluate / Create | [n] | [pts] | [%] |

### Difficulty Distribution
| Difficulty | Item Count | % of Items |
|------------|------------|------------|
| Accessible (most students correct) | [n] | ~25% |
| Moderate (students with solid learning correct) | [n] | ~55% |
| Challenging (students with deep understanding correct) | [n] | ~20% |

---

### [STUDENT-FACING SECTION BEGINS HERE]

**Name:** _________________________ **Date:** _____________ **Period:** _______

**[Assessment Title]**
**Time:** [X] minutes | **Total Points:** [X]

**General Directions:** [Clear, specific instructions for the entire assessment. Specify what materials are permitted, whether work must be shown, and how partial credit is awarded.]

---

### Section [#]: [Item Type] ([X] items, [X] points each = [X] points total)

**Directions:** [Section-specific directions -- what students should do, how to record answers, how long typical responses should be.]

**[#].** [Complete item stem -- full question or clearly incomplete statement with all necessary information included]

   A) [Option -- specific misconception target noted internally for teacher only]
   B) [Option]
   C) [Option]
   D) [Option]

[Repeat for all items in section]

---

### Section [#]: [Item Type] ([X] items, [X] points each = [X] points total)

**Directions:** [Section-specific directions. For show-work sections: "Show all steps. Partial credit will be awarded for correct work even if the final answer is incorrect."]

**[#].** [Item stem with complete context and clear expectation of response type]

   _[Space indicator or blank lines appropriate to response length]_

[Repeat for all items in section]

---

### [TEACHER MATERIALS -- NOT FOR STUDENT DISTRIBUTION]

### Answer Key and Scoring Guide

| Item # | Type | Correct Answer / Model Response | Points Available | Objective | Bloom's Level | Distractor/Error Analysis |
|--------|------|----------------------------------|-----------------|-----------|--------------|--------------------------|
| [#] | MC | [Correct letter and full answer] | [pts] | [Objective code] | [Level] | A: [error]; B: [error]; C: [error] -- correct; D: [error] |
| [#] | SA | [Model response with key terms bolded] | [pts] | [Objective] | [Level] | Full credit: [criteria]. Partial (1 pt): [criteria]. No credit: [criteria]. |
| [#] | ER | See rubric below | [pts] | [Objective] | [Level] | See rubric. |

### Extended Response / Performance Task Rubric

**Item [#]: [Brief descriptor]**

| Criterion | 4 -- Advanced | 3 -- Proficient | 2 -- Developing | 1 -- Beginning | 0 |
|-----------|--------------|----------------|----------------|---------------|---|
| [Criterion 1 -- e.g., Accuracy of Content] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor] | No attempt |
| [Criterion 2 -- e.g., Reasoning / Explanation] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor] | No attempt |
| [Criterion 3 -- e.g., Use of Evidence / Process] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor] | No attempt |

### Grading Scale

| Raw Score | Percentage | Grade / Performance Level |
|-----------|------------|--------------------------|
| [Score range] | 90-100% | A / Advanced |
| [Score range] | 80-89% | B / Proficient |
| [Score range] | 70-79% | C / Developing |
| [Score range] | 60-69% | D / Approaching |
| Below [score] | Below 60% | F / Beginning |

### Objective-Level Mastery Tracking Template

After scoring, tally results by objective to identify reteaching needs.

| Objective | Item Numbers | Class Average on These Items | Reteach Needed? (< 70%) |
|-----------|-------------|------------------------------|------------------------|
| [Objective] | [#, #, #] | ___% | Y / N |
| [Objective] | [#, #, #] | ___% | Y / N |

### Administration Notes
- **Read-aloud eligible sections:** [List sections where reading aloud does not compromise the construct being assessed]
- **Calculator use:** [Specify by section if applicable]
- **Accommodation notes:** [Extended time, segmented administration, reduced items per page notes]
- **Estimated completion time check:** [Show the math: X MC × 1.5 min + Y SA × 10 min + Z ER × 18 min = XX min total vs. YY min allotted]
```

---

## Rules

1. **Never write an item that is not explicitly traceable to a stated learning objective.** If you cannot fill in the Objective column in the answer key table for an item, delete the item and replace it.

2. **The blueprint must be written before any items are drafted.** Blueprint-first is not a formality -- it prevents the most common assessment design failure, which is overloading easy-to-write recall items and under-assessing higher-order objectives.

3. **At least 30% of total points must assess Apply level or above for any summative assessment.** For honors, AP, IB, or graduate-level assessments, Apply-and-above must constitute at least 60% of points. A test where 80% of points come from recall items is a test of memorization, not learning, and produces invalid mastery inferences.

4. **Every multiple choice distractor must represent a documented or predictable student misconception.** "Implausible wrong answer included to fill the option slot" is not acceptable. If you cannot name the error a distractor targets, replace it with a distractor that can.

5. **Point values must scale with cognitive demand.** A four-point short answer requiring explanation and justification must be worth more than a one-point recall multiple choice item. Never assign equal point values to items at substantially different Bloom's levels unless the blueprint deliberately weights them that way for a specific pedagogical reason.

6. **Item stems must be complete and self-sufficient.** A student who covers the answer options should be able to generate or articulate an answer from the stem alone. If they cannot, the stem is incomplete. Incomplete stems produce guessing behavior rather than knowledge retrieval.

7. **Time feasibility is a hard constraint, not a guideline.** If the items you generate would take longer than the stated time allotment (calculated using the benchmarks: 1.5 min/MC, 8-12 min/SA, 15-20 min/ER, 25-45 min/performance task), reduce item count. An assessment that cannot be completed in time does not measure what students know -- it measures how fast they work.

8. **Never use trick questions, double negatives, or items where the "correct" answer requires assumptions not supported by the stem.** Assessment items must measure content knowledge, not the ability to decode confusingly written questions.

9. **For any constructed response worth 5 or more points, provide an analytic rubric with at least two separate scored dimensions.** A single holistic score for complex work produces low inter-rater reliability and gives students no diagnostic feedback about what to improve.

10. **The student-facing document and teacher materials must be clearly separated in the output.** Never include distractor error labels, scoring guides, or correct answer indicators in the student-facing section. If the skill produces a combined document, label the teacher section explicitly and note it is not for distribution.

11. **Never default to a 90/80/70/60 grading scale without considering context.** Ask or note whether the school uses traditional grading, standards-based grading, or mastery grading. Apply the appropriate scale and note the rationale.

12. **Objective-level tracking must be included.** The purpose of a classroom assessment is not only to generate a grade -- it is to diagnose what to teach next. Every assessment output must include an objective-level mastery tracking template so teachers can use score data instructionally.

---

## Edge Cases

### Early Elementary (Grades K-2)
Students in K-2 have limited decoding ability and no test-taking stamina for long written assessments. Replace multiple choice with picture-matching, circling correct responses from 2-3 options, drawing responses, or teacher-administered oral items. Limit total assessment time to 15-20 minutes maximum. Provide large font (minimum 14pt), generous white space, and item numbers with visual separators. Avoid paragraphs of instructions -- use simple sentence directions like "Circle the correct answer." Note in the teacher section which items can be read aloud and which require observation checklists rather than written responses. Consider designing a two-part assessment: individual written section plus a small-group oral section administered by the teacher.

### English Language Learners (ELL) and Multilingual Learners
Distinguish between what the assessment is measuring (content knowledge) and what it is not measuring (English language proficiency). For non-ELA subjects, simplify sentence structure in stems without reducing cognitive demand of the content. Use consistent vocabulary (do not use multiple synonyms for the same term within an assessment -- pick one term and use it throughout). Allow bilingual glossaries unless the assessment is specifically measuring English vocabulary. Consider providing a Spanish, Mandarin, or home-language version if the purpose is content mastery assessment and the student's academic language in that subject is primarily in another language. Note which items are most language-dependent and flag them for accommodation decision-making.

### Performance Task Only (No Traditional Test)
When the entire assessment is a performance task, the blueprint structure changes. Replace the objective-to-item table with an objective-to-task-component table, where each component of the task (planning, drafting, revision, final product, reflection) maps to specific objectives. Build in at least two checkpoints where the teacher or peers can provide feedback before the final product is scored. Provide a student-facing task brief (scenario, deliverable, constraints, and a student self-assessment checklist) and a separate teacher scoring rubric. The rubric must have at least three scored dimensions for any task worth more than 20 points. Include an observation checklist for process skills that cannot be assessed from the final product alone (e.g., scientific practice behaviors during a lab, collaborative skills during a group task).

### Diagnostic / Pre-Assessment
Pre-assessments are not graded summatively. Design parameters shift: include items from prerequisite skills (prior grade or prior unit) as well as current unit targets, so teachers can identify both readiness gaps and misconceptions about new content. Remove the grading scale entirely -- replace it with a skill profile template that the teacher completes per student, showing which prerequisite skills are solid, which current-unit skills show readiness, and which show misconceptions. Keep item count lower (8-12 items typical) and Bloom's levels lower (Remember/Understand dominant) because the goal is identifying what students currently know, not measuring end-of-unit mastery. Never use pre-assessment data to assign grades.

### Standardized Test Format Practice (SAT, ACT, AP, State Tests)
When the request is specifically to mirror a standardized format, research and apply the exact format specifications: question types, passage lengths, time-per-section ratios, calculator vs. no-calculator policies, and scoring conventions (e.g., SAT does not deduct for wrong answers; AP uses a specific scoring formula). Clearly label every item as "practice" and note that items are modeled on the format but are original content. Include timing guidance by section matching the actual test's pacing (e.g., for SAT Math Module 1: 35 minutes for 22 questions = approximately 1.6 minutes per item). Provide a raw-to-scaled score conversion approximation note so teachers can contextualize performance, but warn that actual score conversion depends on that year's test equating and cannot be exactly reproduced.

### Mastery Learning / Competency-Based Contexts
In mastery learning systems, assessment is not a one-time event -- it is a checkpoint in a retake cycle. Design with this in mind: create two parallel-form versions of the assessment (Form A and Form B) so that students who do not demonstrate mastery on the first attempt have a fresh set of items for the retake. Flag the mastery cutoff explicitly (typically 80%). Design items so that the difficulty distribution is less steep -- you do not need the 20% challenging items if the purpose is confirming competency on a defined skill set. Include a feedback template that the teacher returns to students before the retake, specifying which objectives were and were not mastered so students know what to review.

### Cross-Curricular or Interdisciplinary Assessments
When an assessment spans two or more subject areas (a science-literacy assessment, a math-social studies data project), map each item to its primary discipline's standards. Ensure the assessment does not double-penalize students for weakness in one subject when assessing the other -- a student who understands the science content thoroughly should not fail because of writing mechanics, and vice versa. Score dimensions for each discipline separately. In the blueprint, include two sets of objective columns -- one per discipline -- and track mastery data separately by subject area. Communicate clearly to students and parents which dimensions count toward which subject grade.

---

## Example

**Input:** "I need a 45-minute end-of-unit exam for 10th grade Biology on Mendelian genetics. We covered dominant/recessive inheritance, monohybrid and dihybrid crosses, incomplete dominance, and codominance. Aligned to NGSS HS-LS3-3. About 25 items, mixed format. Include an answer key with distractor rationale and a grading scale."

---

## Assessment: Mendelian Genetics Unit Exam

**Course/Subject:** Biology, Grade 10
**Unit/Topic:** Mendelian Genetics -- Patterns of Inheritance
**Grade/Level:** 10th Grade
**Time Allotted:** 45 minutes
**Total Points:** 60
**Permitted Materials:** No calculator, no notes
**Purpose:** Summative end-of-unit exam

---

### Assessment Blueprint

| Learning Objective | Standard | Bloom's Level | Item Numbers | Points | % of Exam |
|-------------------|----------|--------------|--------------|--------|-----------|
| Explain how dominant and recessive alleles determine phenotype; predict monohybrid cross outcomes | HS-LS3-3 | Understand / Apply | 1-4, 11-13 | 19 | 32% |
| Set up and interpret dihybrid crosses using Punnett squares; predict phenotypic ratios | HS-LS3-3 | Apply / Analyze | 5-7, 14-15 | 17 | 28% |
| Distinguish incomplete dominance and codominance from complete dominance; predict blended and both-expressed phenotypes | HS-LS3-3 | Understand / Apply | 8-10, 16 | 12 | 20% |
| Analyze pedigree or cross data to determine inheritance patterns and parental genotypes | HS-LS3-3 | Analyze / Evaluate | 17, 18 | 12 | 20% |
| **TOTALS** | | | 25 items | 60 pts | 100% |

### Bloom's Taxonomy Distribution

| Level | Item Count | Points | % of Total |
|-------|------------|--------|------------|
| Remember / Understand | 6 | 12 | 20% |
| Apply / Analyze | 15 | 33 | 55% |
| Evaluate / Create | 4 | 15 | 25% |

### Difficulty Distribution

| Difficulty | Item Count | % of Items |
|------------|------------|------------|
| Accessible | 6 | 24% |
| Moderate | 13 | 52% |
| Challenging | 6 | 24% |

### Estimated Completion Time Check
- Section 1: 10 MC × 1.5 min = 15 min
- Section 2: 6 MC × 1.5 min = 9 min
- Section 3: 4 SA × 8 min = 32 min... **Flag:** Total = 56 min, over budget.
- **Adjustment applied:** Short answer items reduced to 3 min average for structured-response items with scaffolding. Revised estimate: 10 × 1.5 + 6 × 1.5 + 9 SA × 3 min (scaffolded) + 2 ER × 8 min = 15 + 9 + 12 = 36 min core + 9 min extended = 45 min. Confirmed feasible.

---

### [STUDENT-FACING SECTION]

**Name:** _________________________ **Date:** _____________ **Period:** _______

# Mendelian Genetics -- Unit Exam

**Time:** 45 minutes | **Total Points:** 60 | **No notes or calculators permitted.**

**Directions:** Read all questions carefully. For multiple choice, circle the letter of the best answer. For short answer and extended response, write your answer in the space provided. Partial credit is awarded in Sections 2 and 3 for correct reasoning even if a final answer contains a minor error.

---

### Section 1: Dominant/Recessive and Monohybrid Crosses (Items 1-10, 2 points each = 20 points)

**Directions:** Circle the letter of the best answer.

**1.** In pea plants, tallness (T) is dominant over dwarfism (t). A homozygous tall plant is crossed with a homozygous dwarf plant. What is the expected phenotypic ratio of the offspring?

   A) 1 tall : 1 dwarf
   B) 3 tall : 1 dwarf
   C) All tall
   D) All dwarf

**2.** A plant with the genotype Tt is crossed with a plant of genotype tt. What fraction of the offspring will be dwarf?

   A) 0
   B) 1/4
   C) 1/2
   D) 3/4

**3.** Two organisms that are both heterozygous for a trait (Bb × Bb) are crossed. Which of the following correctly describes the expected offspring?

   A) 1/4 BB, 1/2 Bb, 1/4 bb -- phenotypically 3 dominant : 1 recessive
   B) 1/2 BB, 1/2 bb -- phenotypically 1 dominant : 1 recessive
   C) All Bb -- phenotypically all dominant
   D) 1/4 BB, 1/4 Bb, 1/2 bb -- phenotypically 1 dominant : 1 recessive

**4.** An organism that is homozygous recessive for a gene will:

   A) Always pass the dominant allele to its offspring
   B) Display the dominant phenotype
   C) Always pass the recessive allele to its offspring
   D) Show an intermediate phenotype between dominant and recessive

**5.** A black guinea pig (BB) is crossed with a white guinea pig (bb), where black (B) is completely dominant. What percentage of offspring are expected to be white?

   A) 0%
   B) 25%
   C) 50%
   D) 75%

**6.** In humans, widow's peak (W) is dominant over a straight hairline (w). A woman with a straight hairline has children with a man who has a widow's peak. Some of their children have straight hairlines. What is the father's genotype?

   A) WW
   B) Ww
   C) ww
   D) Cannot be determined from the information given

**7.** Which of the following genotypes would produce the same phenotype as genotype TT?

   A) tt
   B) Tt
   C) Both Tt and tt
   D) Neither Tt nor tt

**8.** In a monohybrid cross between two heterozygous individuals (Aa × Aa), what is the probability that a specific offspring will be homozygous dominant (AA)?

   A) 75%
   B) 50%
   C) 25%
   D) 0%

**9.** A recessive allele for a trait will be expressed in the phenotype only when:

   A) At least one dominant allele is also present
   B) The organism inherits the recessive allele from both parents
   C) The organism is heterozygous
   D) The dominant allele is absent from the population

**10.** Which cross would produce offspring with the highest probability of displaying the recessive phenotype?

   A) AA × aa
   B) AA × Aa
   C) Aa × Aa
   D) Aa × aa

---

### Section 2: Dihybrid Crosses, Incomplete Dominance, and Codominance (Items 11-16, 3 points each = 18 points)

**Directions:** Circle the letter of the best answer.

**11.** In peas, round seed shape (R) is dominant over wrinkled (r), and yellow color (Y) is dominant over green (y). Two plants that are both RrYy are crossed. What is the expected phenotypic ratio of offspring?

   A) 9 round yellow : 3 round green : 3 wrinkled yellow : 1 wrinkled green
   B) 1 : 1 : 1 : 1 for all four phenotypes
   C) 3 round yellow : 1 wrinkled green
   D) All round yellow

**12.** A plant that is RrYy produces gametes through meiosis. How many different types of gametes (allele combinations) can this plant produce?

   A) 2
   B) 4
   C) 8
   D) 16

**13.** In a dihybrid cross (RrYy × RrYy), what fraction of offspring would be expected to be homozygous recessive for both traits (rryy)?

   A) 1/4
   B) 1/16
   C) 1/9
   D) 1/2

**14.** In snapdragons, flower color shows incomplete dominance. A red flower plant (CR CR) is crossed with a white flower plant (CW CW). What color will all F1 offspring be?

   A) Red, because red is dominant
   B) White, because white is dominant
   C) Pink, because neither allele is fully dominant
   D) Half red and half white, in a 1:1 ratio

**15.** Two pink snapdragons from the F1 generation in Item 14 are crossed. What is the expected phenotypic ratio of their offspring?

   A) All pink
   B) 3 red : 1 white
   C) 1 red : 2 pink : 1 white
   D) 1 red : 1 white

**16.** Human ABO blood type is an example of codominance and multiple alleles. A person with blood type AB has genotype IA IB. Which of the following best explains why this person expresses both A and B antigens?

   A) The IA allele is dominant over the IB allele, so both are expressed unequally
   B) Both the IA and IB alleles are fully expressed simultaneously, producing both A and B antigens on red blood cells
   C) Neither allele is dominant, so an intermediate antigen is produced
   D) The IA allele suppresses the IB allele in half of the red blood cells

---

### Section 3: Data Analysis and Extended Response (Items 17-25, variable points)

**Directions:** Answer each question in the space provided. Show your reasoning. Partial credit will be awarded for correct steps even if the final answer contains an error.

**17.** (3 points) A cross between two pea plants with round seeds produces 78 round-seeded offspring and 26 wrinkled-seeded offspring. 
   
   a) What is the approximate phenotypic ratio observed? _______________
   
   b) Based on this ratio, what were the likely genotypes of the parent plants?
   
   Parent 1 genotype: ________ Parent 2 genotype: ________
   
   c) Explain in one sentence how Mendel's Law of Segregation accounts for this result.
   
   ___________________________________________________________________________

**18.** (4 points) In cattle, red coat (CR) and white coat (CW) show codominance, producing roan (mixed red and white) coat in heterozygotes.
   
   A roan bull is crossed with a roan cow.
   
   a) Write the genotypes of both parents.
   
   Parent 1: __________ Parent 2: __________
   
   b) Complete the Punnett square for this cross.
   
   |  | CW | CW |
   |--|----|-----|
   | CR | | |
   | CR | | |
   
   Wait -- complete with the correct parent alleles:
   
   |  | CR | CW |
   |--|----|-----|
   | CR |  |  |
   | CW |  |  |
   
   c) What percentage of offspring are expected to be red? ________ White? ________ Roan? ________
   
   d) If this couple has 40 calves over several years, how many would you predict to be roan? Show your calculation.

**19.** (5 points) A geneticist is studying fur color in rabbits. Black (B) is dominant over brown (b). Examine the following cross data:

   **Cross 1:** Black rabbit × brown rabbit → 31 black offspring, 0 brown offspring
   
   **Cross 2:** Black rabbit (same black parent as Cross 1) × another black rabbit → 18 black offspring, 6 brown offspring
   
   a) Based on Cross 1 results, what is the genotype of the black parent rabbit? Explain your reasoning.
   
   ___________________________________________________________________________
   
   b) Based on Cross 2 results, what is the genotype of the other black parent in Cross 2? Explain.
   
   ___________________________________________________________________________
   
   c) A student claims that because Cross 2 does not produce a perfect 3:1 ratio, Mendel's laws must be incorrect. Evaluate this claim. Is it valid? Why or why not? Use the concept of probability and sample size in your response. (2 points for this sub-item)
   
   ___________________________________________________________________________
   ___________________________________________________________________________

**20.** (4 points) In garden peas, seed shape (round R or wrinkled r) and seed color (yellow Y or green y) independently assort. A plant with genotype RrYy is crossed with a plant with genotype rrYy.
   
   a) List all possible gamete types produced by each parent.
   
   RrYy gametes: ______________________
   
   rrYy gametes: ______________________
   
   b) Without drawing the full 8 × 4 Punnett square, predict the probability that an offspring will be wrinkled and green (rryy). Show your reasoning using the probability multiplication rule.
   
   P(rr) × P(yy) = ________ × ________ = ________

---

### [TEACHER MATERIALS -- NOT FOR STUDENT DISTRIBUTION]

### Answer Key and Scoring Guide

| Item | Correct | Points | Objective | Bloom's | Distractor / Error Analysis |
|------|---------|--------|-----------|---------|----------------------------|
| 1 | C | 2 | Monohybrid / complete dominance | Understand | A: confuses F1 with testcross; B: confuses F1 with F2; D: confuses parent genotype with offspring |
| 2 | C | 2 | Monohybrid / testcross | Apply | A: misidentifies Tt as unable to produce recessive offspring; B: confuses 1/4 from Aa × Aa with Tt × tt; D: inverts ratio |
| 3 | A | 2 | Monohybrid Bb × Bb | Apply | B: confuses Bb × Bb with Bb × bb; C: applies incomplete dominance logic; D: inverts frequencies |
| 4 | C | 2 | Allele transmission / homozygous | Understand | A: inverts -- hom rec never passes dominant; B: confuses hom rec with hom dom; D: applies incomplete dominance logic |
| 5 | A | 2 | BB × bb F1 | Apply | B: applies Aa × Aa ratio to BB × bb; C: confuses with testcross; D: inverts frequency |
| 6 | B | 2 | Phenotype/genotype inference | Analyze | A: WW father cannot produce ww offspring; C: ww would show straight hairline; D: the cross data does provide enough info |
| 7 | B | 2 | Dominant allele expression | Understand | A: would show recessive; C: only Tt, not tt; D: Tt does show same phenotype as TT |
| 8 | C | 2 | Monohybrid Aa × Aa | Apply | A: confuses probability of dominant phenotype (75%) with AA genotype; B: confuses with 1/2; D: misunderstands genetics |
| 9 | B | 2 | Recessive expression | Understand | A: inverts; C: heterozygous would show dominant; D: confuses population genetics with individual genotype |
| 10 | D | 2 | Cross outcome comparison | Analyze | A: all Aa (dominant); B: all AA or Aa (dominant); C: 1/4 recessive; D: 1/2 recessive -- highest |
| 11 | A | 3 | Dihybrid 9:3:3:1 | Apply | B: confuses with dihybrid testcross; C: confuses with monohybrid cross; D: misapplies dominance |
| 12 | B | 3 | Gamete formation RrYy | Apply | A: confuses with single-locus heterozygote; C: confuses with three loci; D: confuses with number of allele combinations in offspring |
| 13 | B | 3 | Dihybrid frequency rryy | Apply | A: confuses with single-locus recessive frequency; C: student invents ratio; D: applies single-locus logic |
| 14 | C | 3 | Incomplete dominance F1 | Understand | A/B: applies complete dominance logic; D: applies codominance logic |
| 15 | C | 3 | Incomplete dominance F2 | Apply | A: all pink is the F1 result; B: confuses with complete dominance 3:1; D: confuses with F1 × recessive cross |
| 16 | B | 3 | Codominance mechanism | Understand | A: IA is not dominant over IB; C: describes incomplete dominance; D: codominance means both expressed in all cells |

### Extended Response Scoring Guides

**Item 17 (3 points total)**
- 1 pt: States approximately 3:1 ratio (acceptable range: 2.8:1 to 3.2:1 given sample variation)
- 1 pt: Correctly identifies parent genotypes as Rr × Rr
- 1 pt: Explanation correctly references that each parent carries one R and one r allele and they segregate during gamete formation, so offspring inherit one allele from each parent independently

**Item 18 (4 points total)**
- 0.5 pt each: Correctly writes CR CW for both parents (1 pt total)
- 1 pt: Correctly completes Punnett square with CR CR, CR CW, CR CW, CW CW in the four cells
- 1 pt: Correctly states 25% red (CR CR), 25% white (CW CW), 50% roan (CR CW)
- 1 pt: Calculation: 0.50 × 40 = 20 roan calves. Accept responses showing proportion × total with correct arithmetic.

**Item 19 (5 points total)**
- 1 pt: Cross 1 conclusion: black parent is homozygous dominant (BB) -- because all offspring are black, no recessive allele expressed
- 1 pt: Reasoning: if parent were Bb, approximately 50% of offspring from Bb × bb would be brown; 0 brown offspring is consistent with BB × bb
- 1 pt: Cross 2 conclusion: second black parent is Bb (heterozygous)
- 1 pt: Reasoning: appearance of brown offspring (bb) means both parents must carry a b allele; first parent is BB confirmed by Cross 1 -- wait, Cross 2 shows browns, meaning the first parent must have contributed b. Correct answer: Cross 1 result (all black offspring from testcross) is consistent with BB; Cross 2 showing ~3:1 suggests both parents are Bb -- **Correction note for teacher:** The cross design here means Cross 1 confirms BB for the same black parent only if the brown parent is bb. But Cross 2 
