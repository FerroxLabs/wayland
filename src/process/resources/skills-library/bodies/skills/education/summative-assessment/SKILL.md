---
name: summative-assessment
description: |
  Creates end-of-unit summative assessments with prompts, rubrics, and exemplar descriptions for educators. Produces a complete summative assessment package including the student-facing task, scoring criteria, and benchmark examples -- distinct from formative checks used during instruction.
  Use when an educator asks to create an end-of-unit assessment, final project, performance task, or summative evaluation for a completed unit of study.
  Do NOT use for in-class formative checks (use `formative-assessment`), for standalone rubrics (use `rubric-creation`), or for student exam preparation (use `exam-prep-plan`).
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
# Summative Assessment

## When to Use

Use this skill when an educator explicitly needs a complete, deployable summative assessment package -- not just a rubric, not just a task prompt, but the full artifact set a teacher can hand to students and use for grading.

**Trigger scenarios where this skill applies:**
- An educator has finished teaching a unit and needs a culminating assessment to measure how well students met the stated learning objectives or standards
- A teacher asks for an end-of-unit test, final project, performance task, capstone presentation, or unit exam and mentions content already taught
- A curriculum designer needs an assessment to anchor a unit -- working backward from the assessment to plan instruction (Understanding by Design / backward design workflow)
- An educator wants to submit a standards-aligned assessment to a department chair, instructional coach, or district curriculum office and needs a professionally formatted product with scoring documentation
- A teacher needs to differentiate a summative assessment across two or three versions -- standard, modified for IEP/504 accommodations, and re-assessment -- and wants all versions built consistently
- An administrator or instructional coach is auditing whether classroom assessments align to grade-level standards and needs a standards-to-items alignment map
- An educator is building a portfolio assessment and needs both the artifact collection requirements and a holistic portfolio rubric that evaluates growth rather than individual pieces

**Do NOT use this skill when:**
- The educator wants a quick check for understanding during instruction -- use `formative-assessment` instead, which handles exit tickets, checks for understanding, and low-stakes in-class tasks
- The user only needs a rubric without the full assessment task -- use `rubric-creation`, which has deeper rubric-building logic including analytic vs. holistic vs. single-point formats
- The user is a student preparing to take an exam -- use `exam-prep-plan`, which generates study guides, practice questions, and review strategies from the student perspective
- The request is for a benchmark or diagnostic assessment given across a whole school or grade level at the start of a term -- those require norm-referencing logic outside this skill's scope
- The educator needs standardized test preparation or practice items modeled on a specific external exam format (SAT, AP, state testing) -- those involve test-specific item types and accommodations rules governed by the testing organization
- The educator wants a grading policy, grade weighting scheme, or overall course assessment plan -- that is curriculum design work, not assessment construction

---

## Process

### Step 1: Collect all essential context before generating anything

Before drafting a single question, gather the following. If any critical piece is missing, ask for it explicitly -- do not assume or invent.

- **Unit title and learning objectives or standards:** Ask for the exact standards codes if available (NGSS, CCSS, state standards). If the educator only has informal objectives ("students should understand fractions"), map those to Bloom's taxonomy levels before selecting item types.
- **Grade level and subject area:** This determines vocabulary level, reading complexity, appropriate item formats, and how specific rubric descriptors should be.
- **Assessment format preference:** Written test, performance task, project, portfolio, Socratic seminar, lab practical, oral defense, or mixed format. If the educator has no preference, recommend a format based on the objectives (see Step 2).
- **Time constraints:** In-class time available (single period vs. multi-day vs. take-home). A 45-minute period can hold approximately 10-15 multiple choice items plus 2-3 short answer plus 1 extended response. A 90-minute block doubles this. Multi-day projects need milestone checkpoints built in.
- **Point value and grade weighting:** How many total points? What percentage of the quarter, semester, or course grade? This affects how detailed the scoring guide needs to be.
- **Prior assessment context:** What formative data exists? What do students already know is coming? Has a study guide been issued? This prevents the assessment from testing material never addressed in instruction.
- **Accommodation needs:** Any ELL students, IEP/504 requirements, or gifted learners who need differentiated versions? Flag this upfront -- it is far easier to build modified versions alongside the original than to retrofit them later.
- **District or school format requirements:** Some districts require specific headers, standards citations on student-facing documents, or particular rubric formats. Ask if any exist.

### Step 2: Select and justify the assessment format based on what objectives actually require

Match assessment format to cognitive demand using Bloom's taxonomy as the primary framework. Do not default to multiple choice for everything -- it cannot assess synthesis, evaluation, or complex application.

- **Remember and Understand (Bloom's levels 1-2):** Selected response (multiple choice, true/false, matching), short identification items. Maximum cognitive ceiling is recognition and recall. Appropriate for vocabulary, definitions, factual content, and procedural steps that have a single correct answer.
- **Apply and Analyze (Bloom's levels 3-4):** Short answer, constructed response, problem sets, data analysis tasks, case studies, lab reports. Students must do something with knowledge, not just recognize it. These items require partial-credit rubrics, not answer keys.
- **Evaluate and Create (Bloom's levels 5-6):** Extended response essays, research papers, design projects, performances, presentations, portfolios, experimental designs. These require multi-criterion rubrics and clear exemplar descriptions because "correct" is not a binary judgment.
- **Most units span multiple Bloom's levels.** The point distribution of the assessment should mirror the instructional emphasis: if 60% of instruction focused on application and analysis, 60% of the points should come from apply/analyze items.
- **Red flag:** If all unit objectives are at levels 1-2 (pure recall), either the objectives are written too narrowly or the unit needs instructional redesign. Flag this to the educator. Even recall-heavy units should have at least one item above level 2.
- **Performance tasks are appropriate when:** the objective requires demonstrating a process (science lab, oral language, physical education), the product cannot be reduced to a written response (art, music, woodshop), or the real-world application context matters to the learning (economic analysis, civic writing, engineering design).
- **Mixed formats** work best for most middle and high school units. A common structure: 20-25% selected response (knowledge check), 30-40% short constructed response (application), 35-50% extended response or performance task (synthesis). Adjust percentages based on instructional emphasis.

### Step 3: Write the student-facing assessment document

This is the artifact students receive. It must be complete, unambiguous, and usable without teacher narration.

- **Header block:** Unit title, subject, grade level, date, student name field, total points, time allotted. Also include the allowed resources (formula sheet, diagram, notes, calculator, nothing).
- **Student instructions:** Write these at one grade level below the assessed grade to ensure language complexity doesn't become a confounding variable. Instructions should state: what to do, how long to spend on each section (recommended time per section helps pacing), what to submit, and what resources are allowed.
- **Section organization:** Group items by format type (all multiple choice together, all short answer together) OR by content area (all food web questions together, all symbiosis questions together). Format grouping is standard for tests; content grouping works better for projects and performance tasks.
- **Item writing for selected response:** Each multiple choice item should have one clearly correct answer, three plausible distractors based on common misconceptions (not absurd distractors), and stem language that does not cue the answer. Avoid "all of the above," "none of the above," and double negatives. Items should be independent -- answering one should not give away the answer to another.
- **Item writing for constructed response:** Provide explicit scaffolding language: "Using evidence from the passage...", "Name and explain two specific examples...", "In 3-5 sentences, describe...". The response format expectation (number of sentences, required components) must be in the prompt, not just in the rubric.
- **Item writing for performance tasks:** Include the scenario/context, the required deliverables (what format the product takes), the audience (who the work is for), and all required components. Performance task prompts should use the GRASPS framework: Goal, Role, Audience, Situation, Product/Performance, Standards. This gives students a realistic context and makes scoring criteria feel authentic rather than arbitrary.
- **Provide all necessary materials in-document:** food web diagrams, reading passages, data tables, maps, primary sources. Students should not need anything beyond the assessment packet itself.
- **Point values visible to students:** Label every section and item with its point value. This helps students allocate time and effort appropriately.

### Step 4: Build the scoring guide -- answer key plus rubric

The scoring guide is the teacher's document. It must allow a substitute teacher to grade consistently with the teacher who wrote the assessment.

- **Answer key for selected response:** List item number, correct answer, point value, and the standard the item addresses. For items with common wrong answers, add a brief note: "Students who choose B likely confuse X with Y -- see misconception note."
- **Rubric structure for constructed and extended response:** Use an analytic rubric (separate criteria rated independently) rather than a holistic rubric (single overall score) for any response that has multiple distinct components. Analytic rubrics produce more actionable feedback and are more defensible to parents and administrators.
- **Rubric scales:** Four-level scales (4-3-2-1 or Exemplary/Proficient/Developing/Beginning) are standard and well-supported in educational research. A five-level scale adds discrimination at the top; a three-level scale loses discrimination in the middle. For standards-based grading contexts, use 4-3-2-1 mapped directly to each standard.
- **Rubric descriptors must be criterion-specific:** "Student uses scientific vocabulary accurately and consistently" is a rubric descriptor. "Good use of language" is not. Every cell in an analytic rubric should describe observable evidence in the student's work, not evaluate the student's effort or attitude.
- **Distinguish adjacent levels with specific behavioral anchors:** The gap between Proficient (3) and Developing (2) should be described by what is present vs. absent, not by adverbs like "mostly" vs. "somewhat." Example -- Proficient: "Names two specific organisms and explains their ecological roles using food web terminology." Developing: "Names two organisms but does not explain their roles or uses general terms like 'animal' instead of species-specific names."
- **Partial credit for short answer:** Provide a clear point breakdown. A 5-point short answer might be: 2 pts for identifying the correct concept, 2 pts for an accurate explanation, 1 pt for a specific example. This prevents all-or-nothing grading and encourages students to attempt items even when unsure.
- **Total point distribution alignment check:** After building the scoring guide, verify that the point weight of items aligned to each standard matches the instructional emphasis for that standard. If a standard was covered for three weeks but only has 5% of the points, the assessment is misaligned.

### Step 5: Write exemplar descriptions for each performance level

Exemplar descriptions serve three purposes: they calibrate inter-rater reliability among multiple graders, they inform teachers where to focus reteaching, and they can be shared with students before the assessment as a model.

- **Exemplary (4 / A-level):** Describe the specific features of top-level work. What specific content is included? What vocabulary is used? How complex is the reasoning? How is evidence used? "The response accurately traces energy loss across three trophic levels, cites the 10% rule by name, and connects energy flow to a specific organism pair from the class food web diagram" is exemplary description. "The response is thorough and well-organized" is not.
- **Proficient (3 / B-level):** This is the target performance -- meeting grade-level expectations. Proficient work is complete, accurate, and demonstrates the standard without requiring exceptional depth or extension. Describe what "complete and accurate" looks like in this specific content area.
- **Developing (2 / C-level):** Partial understanding with identifiable gaps. The key instructional signal here is: what misconception or missing piece separates this student from proficiency? Name it specifically.
- **Beginning (1 / D-F level):** Significant conceptual errors or nearly absent response. Describe the most common foundational misconceptions at this level so teachers know what intervention is needed.
- **Common error analysis:** Include a separate section listing the 3-5 most frequent errors you predict based on the content, which items or rubric criteria they affect, and what instructional response is warranted. This is the highest-leverage feedback a scoring guide can provide.

### Step 6: Generate the standards alignment map

This is a one-page artifact that shows which items assess which standards. It is essential for standards-based grading, district curriculum audits, and data-driven reteaching.

- Create a table with standards on one axis and item numbers on the other. Mark each cell where an item assesses a standard.
- For each standard, count the total points across all items assessing it. This is the standard's total score in the grade book if using standards-based grading.
- Flag any stated unit standard with fewer than 2 items -- it is under-assessed and teachers should either add an item or acknowledge the gap.
- Flag any item that does not map to a stated standard -- it may be assessing content outside the unit scope, which could be a validity problem.

### Step 7: Build the differentiated and re-assessment versions (if requested)

If the educator needs modified versions, build them from the original rather than from scratch to maintain alignment.

- **Modified version (IEP/504):** Reduce item count by 20-30% while maintaining coverage of all standards. Simplify sentence-level language in prompts (target a 1-2 grade level reduction using Flesch-Kincaid as a guide). Provide visual supports (graphic organizers, sentence starters, labeled diagrams). Do not remove cognitive demand -- reduce language complexity, not thinking complexity.
- **Re-assessment version:** Replace content items with parallel items (different numbers, organisms, scenarios, texts) testing the same objectives at the same Bloom's level. Use the same rubric. Add a brief reflection prompt at the top: "Before retaking this assessment, describe one thing you studied or practiced that you didn't understand the first time." This builds metacognitive habit.
- **Extension version for advanced learners:** Add 2-3 items that require transferring unit concepts to novel, unfamiliar contexts. These items should assess Bloom's levels 5-6 and be marked clearly as "challenge" or "extension" items so they do not penalize students who cannot reach them.

---

## Output Format

```
## Summative Assessment: [Unit Title]

**Subject:** [Subject area]
**Grade/Level:** [Grade]
**Unit:** [Unit number and title]
**Time Allotted:** [Duration, e.g., 50 minutes / 2 class periods / 1 week take-home]
**Total Points:** [Number]
**Weight in Grade:** [Percentage of quarter/semester/course grade]
**Assessment Format:** [Written test / Performance task / Project / Mixed format]
**Allowed Resources:** [List exactly: e.g., provided diagram, calculator, nothing]
**Versions Available:** [Standard / Modified (IEP/504) / Re-assessment]

---

### Standards Assessed

| Standard Code | Standard Description | Bloom's Level | Points Allocated |
|---------------|---------------------|---------------|-----------------|
| [Code] | [Description] | [Level] | [#] |
| [Code] | [Description] | [Level] | [#] |

---

### Student-Facing Assessment

#### Instructions to Students
[Written directly to the student. Include: time guidance per section, allowed resources,
submission format, what to do if a question is unclear.]

---

#### Part 1: [Format Type] -- [Points] points
*Suggested time: [X] minutes*

[Assessment items numbered consecutively]

---

#### Part 2: [Format Type] -- [Points] points
*Suggested time: [X] minutes*

[Assessment items continued in sequence]

---

#### Part 3: [Format Type] -- [Points] points
*Suggested time: [X] minutes*

[Performance task prompt using GRASPS format if applicable]

---

### Scoring Guide

#### Part 1: Answer Key

| Item # | Correct Answer | Points | Standard | Misconception Note |
|--------|---------------|--------|----------|--------------------|
| [#] | [Answer] | [#] | [Code] | [Common wrong answer and what it signals] |

---

#### Part 2: Constructed Response Scoring (per item)

**Item [#] -- [X] points**
- [X] pts: [Description of full-credit response]
- [X-1] pts: [Description of partial-credit response]
- [X-2] pts: [Description of minimal-credit response]
- 0 pts: No response or response does not address the question

---

#### Part 3: Analytic Rubric

| Criterion | Weight | Exemplary (4) | Proficient (3) | Developing (2) | Beginning (1) |
|-----------|--------|--------------|----------------|----------------|---------------|
| [Criterion 1] | [X pts] | [Specific observable descriptor] | [Specific observable descriptor] | [Specific observable descriptor] | [Specific observable descriptor] |
| [Criterion 2] | [X pts] | [Specific observable descriptor] | [Specific observable descriptor] | [Specific observable descriptor] | [Specific observable descriptor] |
| [Criterion 3] | [X pts] | [Specific observable descriptor] | [Specific observable descriptor] | [Specific observable descriptor] | [Specific observable descriptor] |

---

### Standards Alignment Map

| Standard | Part 1 Items | Part 2 Items | Part 3 Criteria | Total Points |
|----------|-------------|-------------|-----------------|--------------|
| [Code] | [Item #s] | [Item #s] | [Criterion names] | [#] |

---

### Exemplar Descriptions

**Exemplary Performance ([X]-[Y] points):**
[Specific, content-grounded description. Name the vocabulary, evidence, reasoning moves,
and structural features of top-level work on THIS assessment.]

**Proficient Performance ([X]-[Y] points):**
[Specific description of grade-level mastery work. What is present, accurate, and complete
without requiring exceptional extension?]

**Developing Performance ([X]-[Y] points):**
[What partial understanding looks like. Name the specific gap or misconception that
separates this student from proficiency.]

**Beginning Performance (below [X] points):**
[What foundational errors look like. What intervention does this level signal?]

---

### Common Errors and Instructional Response

| Error Pattern | Items Affected | What It Signals | Recommended Response |
|---------------|---------------|-----------------|---------------------|
| [Specific error] | [Item #s] | [Misconception name] | [Specific instructional move] |
| [Specific error] | [Item #s] | [Misconception name] | [Specific instructional move] |
| [Specific error] | [Item #s] | [Misconception name] | [Specific instructional move] |
```

---

## Rules

1. **Never write items that test content not explicitly listed in the unit objectives or standards.** An assessment has construct validity only when every item traces to a stated learning target. If the educator's objectives don't cover a topic, exclude it even if it seems relevant. Flag the gap and ask if the objectives need updating.

2. **Every item must map to at least one stated standard or learning objective.** Build the standards alignment map before finalizing the assessment. Any orphaned item -- one that doesn't map anywhere -- must be revised or cut. This rule prevents "interesting but irrelevant" items from distorting grades.

3. **Point distribution must mirror instructional emphasis, not the number of items by format.** If the teacher spent 60% of instruction on one standard, approximately 60% of the total points should assess that standard. Check the standards alignment map for proportional weighting before finalizing.

4. **Selected response (multiple choice) alone cannot assess Bloom's levels 5-6.** Any unit with objectives at the evaluate or create level must include at least one constructed or extended response item. If the educator requests a pure multiple choice assessment for a unit with synthesis objectives, flag the alignment problem and recommend adding at least one written response item.

5. **Rubric descriptors must describe observable evidence in student work, not judge student character or effort.** Phrases like "student demonstrates effort," "student seems to understand," or "excellent grasp of the topic" are not rubric descriptors -- they are impressions. Every rubric cell must describe what is present or absent in the written, spoken, or physical product being evaluated.

6. **Adjacent rubric levels must be distinguishable by a single, specific behavioral difference.** The grader should be able to determine a score of 3 vs. 2 by reading the descriptors alone, without relying on professional intuition or gut feeling. If you cannot articulate what specifically separates two levels, collapse them or add a distinguishing criterion.

7. **Student-facing instructions must be fully self-contained.** A student who was absent on the day the teacher explained the assessment must be able to complete it correctly using only the written instructions. Test this by re-reading the instructions as if you know nothing about the class.

8. **For any group component in a project or performance task, individual accountability must be built into the assessment structure.** This means individual written reflections, assigned roles documented in a division of labor log, or individual oral defense questions. Group-only grades for summative assessments are pedagogically and legally problematic in many jurisdictions.

9. **Re-assessment versions must use parallel items, not easier items.** A re-assessment must test the same standards at the same Bloom's level with different content details. Lowering the cognitive demand rewards avoidance rather than learning. If the re-assessment is noticeably easier, it cannot be used as evidence that the student met the standard.

10. **Exemplar descriptions must be content-specific, not generic quality labels.** "The exemplary response demonstrates thorough understanding" is useless. The exemplary description must name the specific vocabulary, evidence, reasoning moves, and structural features that characterize top-level work on THIS assessment for THIS content. If the exemplar description could apply to any subject, it is not specific enough.

11. **Do not include items that rely on information not provided in the assessment packet.** If a question requires a food web diagram, the diagram must be in the packet. If a question references "the article we read in class," either include the article or reframe the item to not require prior access. Students should not be penalized for not having access to external materials.

12. **Time estimates must be realistic for the grade level.** A general planning guideline: middle school students write approximately 15-20 words per minute for constructed response; high school students write 20-30 words per minute. A 200-word extended response paragraph requires 8-12 minutes of writing time after reading and planning. Build this into suggested time per section.

---

## Edge Cases

### Project-based summative assessment (multi-day or take-home)
When the assessment spans multiple days or takes the form of a project, the standard one-period test format does not apply. Replace the time-limited test structure with a project brief that includes: a clear deliverables list (what is submitted, in what format, by what deadline), milestone checkpoints with dates (e.g., proposal due Day 2, draft due Day 5, final product due Day 8), a product rubric assessing the final deliverable, and a separate process rubric assessing research, drafting, or iteration work. For multi-day projects, include a daily progress log students submit with the final product so teachers can evaluate process, not just the polished final output. Group projects require an individual contribution documentation requirement -- a division of labor form and an individual written reflection are the minimum.

### Portfolio assessment
A portfolio assessment evaluates a curated collection of student work over time, not a single performance. The assessment package must specify: which artifacts are required (minimum count), whether artifacts are teacher-selected, student-selected, or a mix, and the reflection prompt for each artifact ("Why did you include this piece? What does it demonstrate about your learning?"). The portfolio-level rubric must assess growth across the collection -- not the quality of any individual artifact. Key criteria include: range of standards addressed, evidence of revision and improvement, depth of student self-reflection, and connection between artifacts and stated learning goals. Avoid rubrics that simply average the scores of individual pieces -- that defeats the purpose of portfolio assessment, which is to show trajectory, not average performance.

### Standards-based grading (no percentage-based scores)
If the educator's school uses standards-based grading rather than points, the assessment format shifts significantly. There is no total score -- there is a proficiency level (4-3-2-1) reported per standard. Each item must be cleanly mapped to a single standard (multi-standard items create reporting ambiguity). The scoring guide reports student performance by standard, not by section. For each standard, the teacher records the highest sustained evidence of proficiency across items -- not an average. This means if a student scores 2 on two items for Standard A but then scores 4 on the extended response for Standard A, the grade for Standard A is 4, not the average of 2+2+4=2.67. Make this scoring logic explicit in the teacher guide.

### Accommodated and modified assessment versions
When building a modified version for students with IEPs, 504 plans, or ELL designations, maintain the cognitive demand while reducing language and format barriers. Specific modifications: reduce reading level of prompts by one to two grade levels using a Flesch-Kincaid readability check; provide sentence starters for constructed response items ("One example of mutualism is __ because __"); replace purely text-based distractors with labeled diagrams or images where possible; chunk multi-part questions into separate numbered prompts rather than one compound question. Do not remove higher-order items from the modified version -- that changes what the assessment measures and may violate a student's right to access grade-level curriculum. Accommodation notes (extended time, scribe, calculator) belong in the teacher's administration guide, not the student-facing document.

### Oral and performance-based summative assessments
For oral defenses, Socratic seminars, laboratory practicals, physical education demonstrations, and fine arts performances, the "document" students produce is ephemeral. The scoring guide must include: an observation checklist the teacher can complete in real time, a numbered sequence of observable behaviors or required components (not impressionistic judgments), and a protocol for the teacher to follow (what question to ask, in what order, what probing follow-up to use if a student gives a minimal answer). For oral assessments, include 3-5 standardized probing questions the teacher can use when a student gives an ambiguous response, so all students are probed equally. Record video when possible for inter-rater calibration.

### Assessment security and multiple class sections
When a teacher has multiple class sections taking the same assessment at different times, item security matters. Identify which items are highest-priority to keep secure (typically the extended response prompt, since it's easily shared). For parallel sections, build a small bank of parallel items (same standard, same Bloom's level, different content details) so item substitutions are available if security is compromised. Note which items can be safely used for public exemplars and which should remain secured for possible future use in re-assessments.

### Backward design alignment audit
When an educator has an existing unit but suspects their assessment is misaligned, use this skill to run an alignment audit rather than build from scratch. The process is: list all stated unit objectives, map each objective to Bloom's taxonomy level, inventory all existing assessment items and classify each by standard and Bloom's level, identify gaps (objectives with no items), identify excess (items with no corresponding objective), and calculate point weights by standard. Report findings in a table before recommending revisions. This is a distinct workflow from building a new assessment -- acknowledge the difference and ask whether the goal is audit-and-revise or build-new.

---

## Example

**Input:** "Create a summative assessment for a 7th grade science unit on ecosystems. The unit covered food webs, energy flow, symbiosis, and human impact on ecosystems. I want a mix of multiple choice, short answer, and one extended response. 45 minutes. NGSS standards. 50 total points. This is worth 20% of the quarter grade."

---

## Summative Assessment: Ecosystems Unit

**Subject:** Life Science -- 7th Grade
**Unit:** Unit 4 -- Ecosystems
**Time Allotted:** 45 minutes
**Total Points:** 50 points
**Weight in Grade:** 20% of quarter grade
**Assessment Format:** Mixed -- selected response, short constructed response, extended response
**Allowed Resources:** Provided food web diagram (attached); no notes, no textbook
**Versions Available:** Standard (this document); Modified (IEP/504) and Re-assessment available upon request

---

### Standards Assessed

| Standard Code | Standard Description | Bloom's Level | Points Allocated |
|---------------|---------------------|---------------|-----------------|
| NGSS MS-LS2-1 | Analyze and interpret data to provide evidence for effects of resource availability on organisms | Analyze (4) | 12 pts |
| NGSS MS-LS2-2 | Construct an explanation predicting patterns of interactions among organisms across multiple ecosystems | Apply / Analyze (3-4) | 10 pts |
| NGSS MS-LS2-3 | Develop a model to describe cycling of matter and flow of energy among organisms | Apply (3) | 18 pts |
| NGSS MS-LS2-4 | Construct an argument supported by evidence for how changes affect populations | Evaluate (5) | 10 pts |

---

### Student-Facing Assessment

#### Instructions to Students

Read all directions carefully before you begin. You have 45 minutes total. A suggested time for each section is printed at the top of each part -- use it to pace yourself.

**Allowed resources:** The food web diagram attached to this test. No notes, no textbook, no phone.

**Part 1 (Multiple Choice):** Circle the letter of the best answer. Each question is worth 2 points.

**Part 2 (Short Answer):** Answer in 2-4 sentences. Partial credit is available. Write in complete sentences and use scientific vocabulary from our unit.

**Part 3 (Extended Response):** Write a full response using the prompt and the four required components listed. Read the components carefully -- you must address all four to earn full credit.

If a question is unclear, raise your hand. Your teacher can clarify what is being asked but cannot tell you the answer.

---

#### Part 1: Multiple Choice -- 20 points
*Suggested time: 12 minutes (about 1 minute per question)*

**1.** Which organism in a food web is the original source of all energy for that ecosystem?
- a) Decomposer
- b) Primary consumer
- c) Producer
- d) Apex predator

**2.** Energy flows through an ecosystem in which direction?
- a) From consumers to producers
- b) From producers to consumers, with some lost at each level as heat
- c) In a complete cycle with no net loss
- d) From decomposers to producers to consumers

**3.** Approximately what percentage of the energy at one trophic level is available to the next trophic level?
- a) 100% -- energy is fully conserved
- b) 50%
- c) 25%
- d) 10%

**4.** A prairie dog colony's burrows provide shelter for burrowing owls. The prairie dogs are not helped or harmed by the owls' presence. What type of symbiosis does this describe?
- a) Mutualism
- b) Parasitism
- c) Commensalism
- d) Predation

**5.** Mycorrhizal fungi grow on the roots of pine trees. The fungi receive sugars from the tree; the tree receives water and phosphorus from the fungi. This relationship is best described as:
- a) Parasitism, because the fungi take something from the tree
- b) Commensalism, because only the fungi benefit
- c) Mutualism, because both organisms benefit
- d) Competition, because both organisms want the same resources

**6.** Look at the food web diagram. If the mouse population is suddenly reduced by 75% due to a disease, what would most likely happen to the hawk population over the following season?
- a) Increase, because hawks no longer compete with mice for grass
- b) Decrease, because a major food source is reduced
- c) Stay the same, because hawks can fully substitute other prey immediately
- d) Increase, because less competition exists among hawks

**7.** Which of the following correctly explains why an energy pyramid has fewer organisms at the top than at the base?
- a) Top predators reproduce more slowly than producers
- b) Producers are smaller than consumers
- c) Less total energy is available at each successive trophic level due to metabolic heat loss
- d) Decomposers remove energy from the top of the pyramid

**8.** A farmer applies pesticide to crops. The pesticide does not break down and is stored in the body fat of organisms. As you move up the food chain, the concentration of pesticide in each organism's body increases. This process is called:
- a) Eutrophication
- b) Biological magnification
- c) Decomposition
- d) Nutrient cycling

**9.** Which human activity most directly and immediately fragments wildlife habitat and reduces biodiversity?
- a) Using solar panels
- b) Land clearing and development
- c) Recycling paper products
- d) Monitoring water quality

**10.** Decomposers are essential to an ecosystem primarily because they:
- a) Produce energy from sunlight through photosynthesis
- b) Reduce competition among primary consumers
- c) Break down dead organic matter and return nutrients to the soil, making them available to producers again
- d) Regulate the populations of apex predators

---

#### Part 2: Short Answer -- 15 points
*Suggested time: 15 minutes (about 5 minutes per question)*

**11. (5 points)** Using the food web diagram provided, trace TWO complete energy pathways from the sun to a tertiary consumer. Write each pathway as a chain showing every organism in order. Then explain, in 1-2 sentences, why there are fewer tertiary consumers than there are producers in the same ecosystem.

**12. (5 points)** A tick attaches to a deer and feeds on its blood. The tick benefits and the deer is weakened. Name the type of symbiosis this represents. Then explain how it is different from commensalism. Use one additional example of commensalism (not from the food web diagram) to support your explanation.

**13. (5 points)** An invasive plant species is introduced to a grassland ecosystem. Within three years, it outcompetes native grasses and covers 80% of the grassland. Predict two specific effects this change would have on animals in the food web. For each effect, explain the chain of events that would cause it.

---

#### Part 3: Extended Response -- 15 points
*Suggested time: 18 minutes*

**14.** A county government is considering approving a plan to drain and develop 200 acres of wetland for a commercial warehouse facility. You are an ecologist hired to advise the county.

Write a scientific argument addressed to the county planning board that explains the ecological consequences of this decision. Your response must include ALL FOUR of the following components:

**(a)** Identify and explain the impact on at least two specific populations of organisms that depend on the wetland ecosystem.

**(b)** Describe how the energy flow in the wetland ecosystem would be disrupted, using the terms producer, consumer, and trophic level.

**(c)** Identify one specific symbiotic relationship present in a wetland ecosystem that would be disrupted. Name the organisms involved, the type of symbiosis, and how the disruption would affect each organism.

**(d)** Propose one scientifically specific mitigation strategy that would reduce the environmental impact of the development. Explain the ecological reasoning behind your suggestion.

---

*[Attach food web diagram showing: Sun → Marsh grass → Grasshopper → Frog → Heron; Sun → Marsh grass → Muskrat → Mink; Sun → Algae → Aquatic invertebrates → Perch → Heron; Decomposers connected to all dead matter]*

---

### Scoring Guide

#### Part 1: Answer Key

| Item # | Correct Answer | Points | Standard | Misconception Note |
|--------|---------------|--------|----------|--------------------|
| 1 | c -- Producer | 2 | MS-LS2-3 | Students choosing b (primary consumer) are confusing energy source with energy flow direction |
| 2 | b | 2 | MS-LS2-3 | Students choosing c believe energy cycles like matter; address the matter-energy distinction |
| 3 | d -- 10% | 2 | MS-LS2-3 | Students choosing b (50%) have a quantitative misconception; reteach the 10% rule with a specific calculation |
| 4 | c -- Commensalism | 2 | MS-LS2-2 | Students choosing a (mutualism) assume benefit must be reciprocal; emphasize "neither helped nor harmed" |
| 5 | c -- Mutualism | 2 | MS-LS2-2 | Students choosing a (parasitism) focus only on the taking aspect; redirect to outcomes for both organisms |
| 6 | b -- Decrease | 2 | MS-LS2-1 | Students choosing c have an "instant substitution" misconception; populations cannot fully substitute prey immediately |
| 7 | c | 2 | MS-LS2-3 | Students choosing a confuse reproductive rate with energy availability; the pyramid reflects energy, not reproduction speed |
| 8 | b -- Biological magnification | 2 | MS-LS2-4 | Students choosing d (nutrient cycling) are confusing a natural process with a pollution mechanism |
| 9 | b -- Land clearing | 2 | MS-LS2-4 | Students choosing d (monitoring water quality) may not recognize it as a beneficial activity rather than a harm |
| 10 | c | 2 | MS-LS2-3 | Students choosing a are confusing decomposers with producers; revisit decomposer role in nutrient cycling |

---

#### Part 2: Short Answer Scoring

**Item 11 -- 5 points**
- 2 pts: Two complete, accurate energy pathways traced from sun through to a tertiary consumer (1 pt each pathway; both must name each organism in sequence and be consistent with the diagram)
- 2 pts: Accurate explanation of why fewer tertiary consumers exist, referencing energy loss across trophic levels (must mention 10% rule or "energy lost as heat" -- general statements like "less food" earn 1 pt)
- 1 pt: Uses at least two unit vocabulary terms correctly (trophic level, producer, consumer, energy pyramid, 10% rule)
- 0 pts on any component: Energy pathway is invented (not from diagram), or explanation inverts the relationship

**Item 12 -- 5 points**
- 2 pts: Correctly names the tick-deer relationship as parasitism AND accurately identifies that the tick benefits (+1) and the deer is harmed (+1)
- 2 pts: Accurately explains the difference from commensalism: in commensalism one organism benefits and the other is neither helped nor harmed (+1), with a specific, accurate example of commensalism from outside the diagram (+1)
- 1 pt: Uses correct scientific vocabulary for both symbiosis types
- Common error: Students define commensalism as "both benefit" -- this is the mutualism definition; award 0 for the distinction criterion and note for reteaching

**Item 13 -- 5 points**
- 2 pts each (up to 4 pts) for each predicted effect: Award 1 pt for correctly identifying the affected animal/population and 1 pt for explaining the causal chain (e.g., "native grasses are displaced → grasshoppers lose food source → grasshopper population declines → insectivore birds lose prey → bird population declines")
- 1 pt: Both effects are ecologically plausible and connected to the food web (not generic "animals will suffer")
- Deduct 1 pt if student predicts only direct effects without tracing the cascade (e.g., says "grasshoppers lose food" but does not extend to the next trophic level)

---

#### Part 3: Analytic Rubric

| Criterion | Weight | Exemplary (4) | Proficient (3) | Developing (2) | Beginning (1) |
|-----------|--------|--------------|----------------|----------------|---------------|
| **(a) Organism Impacts** | 4 pts | Names two specific wetland organisms (e.g., great blue heron, painted turtle, muskrat) with their ecological roles; explains how loss of habitat directly affects breeding, feeding, or shelter needs for each | Names two specific organisms and states that their populations would decline; explains impact for at least one organism in ecological terms | Names one specific organism with impact explained, or names two organisms without explaining ecological mechanism | Names no specific organisms, or claims only generic "animals" would be affected |
| **(b) Energy Flow Disruption** | 4 pts | Accurately explains that removal of wetland producers (marsh grasses, algae) eliminates the energy base; traces disruption through at least two trophic levels using terms producer, consumer, and trophic level correctly; notes that less energy enters the ecosystem overall | Explains that producers would be lost and that consumers would be affected; uses producer and consumer correctly; explains disruption at one trophic level | Mentions energy or food chain in a general way without correctly using trophic level vocabulary, or describes disruption but reverses direction | Does not mention energy flow, or states that energy would "move elsewhere" without ecological basis |
| **(c) Symbiotic Relationship** | 4 pts | Names a specific symbiotic pair found in wetlands (e.g., egret and water buffalo in commensal relationship; clover and nitrogen-fixing bacteria in mutualism; reed warbler and cuckoo in brood parasitism); correctly identifies symbiosis type; explains how development would disrupt the relationship and what would happen to each organism independently | Names a plausible wetland symbiotic pair; correctly names the symbiosis type; explains disruption for at least one organism | Describes a symbiotic relationship without naming organism types, or names organisms but misidentifies the relationship type | Does not include a symbiotic relationship, or example is from a non-wetland ecosystem with no explanation of relevance |
| **(d) Mitigation Strategy** | 3 pts | Proposes a specific, scientifically grounded strategy (e.g., constructed wetland mitigation at a 2:1 replacement ratio; wildlife corridor design connecting remaining habitat patches; development footprint reduction using structured parking to limit impervious surface); explains the ecological mechanism by which the strategy reduces harm | Proposes a relevant mitigation strategy (e.g., "preserve some wetland area nearby"); gives a reason for why it helps | Suggests a general environmental action (e.g., "plant more trees") that is not specific to wetland ecology | Suggests an irrelevant action or no mitigation strategy |

**Total Points for Part 3:** Sum of four criterion scores. A score of 4+4+4+3 = 15 points maximum.

---

### Standards Alignment Map

| Standard | Part 1 Items | Part 2 Items | Part 3 Criteria | Total Points |
|----------|-------------|-------------|-----------------|--------------|
| MS-LS2-1 | 6 (2 pts) | 11 (partial: energy pyramid component, 2 pts), 13 (4 pts) | None directly | 8 pts |
| MS-LS2-2 | 4, 5 (4 pts) | 12 (5 pts) | Criterion (c) (4 pts) | 13 pts |
| MS-LS2-3 | 1, 2, 3, 7, 10 (10 pts) | 11 (3 pts), partial 13 | Criterion (b) (4 pts) | 17 pts |
| MS-LS2-4 | 8, 9 (4 pts) | partial 13 (2 pts) | Criteria (a) and (d) (7 pts) | 13 pts |

*Note: MS-LS2-3 carries the heaviest weight (17 points / 34%) reflecting that energy flow and food web structure were the primary instructional focus of the unit. MS-LS2-1 is lightly assessed (8 points / 16%) -- consider adding one additional short answer item if resource availability and population data analysis received significant instructional time.*

---

### Exemplar Descriptions

**Exemplary Performance (45-50 points):**
The student correctly answers 9-10 multiple choice items including the conceptually demanding items on biological magnification (item 8) and energy pyramid explanation (item 7). Short answer responses use precise vocabulary -- trophic level, 10% rule, biological magnification, symbiosis type names -- not just general terms like "food chain" or "animals." Food web pathways in item 11 are traced accurately through all organisms shown in the diagram, and the explanation of tertiary consumer scarcity specifically references heat loss at each trophic level rather than simply stating "less food." The extended response addresses all four components with named wetland species (not generic "animals"), a correctly traced energy disruption through at least two trophic levels, a named and correctly typed symbiotic pair, and a specific mitigation strategy with ecological reasoning (not just "save the environment").

**Proficient Performance (38-44 points):**
The student answers 7-8 multiple choice items correctly, with errors most likely on items 3 (10% rule) and 8 (biological magnification) -- both involve specific terminology introduced late in the unit. Short answer responses are generally accurate and include scientific vocabulary, though one component per item may be missing or imprecise. The extended response addresses 3-4 required components; energy flow and organism impacts are present, though trophic level vocabulary may be used inconsistently. The mitigation strategy is plausible but may lack specific ecological justification.

**Developing Performance (25-37 points):**
The student answers 5-6 multiple choice items correctly. The most common errors are on items 3 (substituting 50% for the 10% rule), 4-5 (confusing commensalism and mutualism), and 7 (explaining energy pyramid by reproductive rate rather than energy availability). Short answer responses address the question but lack specific examples or use vocabulary imprecisely. In the extended response, the student identifies that organisms would be harmed but cannot trace the cascade through the food web; energy flow is described in general terms ("animals won't have food") rather than in trophic-level terms. The mitigation strategy, if present, is generic.

**Beginning Performance (below 25 points):**
The student answers fewer than 5 multiple choice items correctly, with systematic errors suggesting foundational misconceptions: energy cycles like matter (items 2, 7), or all symbiosis involves an organism being harmed (items 4, 5). Short answer responses are absent, incomplete, or demonstrate confusion between relationship types. The extended response addresses fewer than two required components and does not demonstrate understanding of food web connections or energy flow. Intervention priority: direct instruction on the distinction between matter cycling and one-way energy flow, and a structured comparison of all three symbiosis types using a graphic organizer.

---

### Common Errors and Instructional Response

| Error Pattern | Items Affected | What It Signals | Recommended Response |
|---------------|---------------|-----------------|---------------------|
| Selects 50% for energy transfer between trophic levels | Item 3 | Knows energy is lost but does not know the approximate rate; may be confusing with other percentages from class | Use a concrete calculation: 1000 kcal at grass level → 100 kcal at grasshopper level → 10 kcal at frog level. Have students calculate the actual numbers rather than memorize the percentage. |
| Describes energy as cycling back through the system | Items 2, 7, 11 | Conflating matter cycling (which does cycle) with energy flow (which is one-way); a fundamental conceptual confusion | Teach matter and energy as parallel but distinct systems in the same ecosystem. Use two different colored arrows on the same diagram -- one for matter cycling, one for energy flow direction. |
| Calls the tick-deer relationship mutualism because "both organisms get something" | Item 5, Short Answer 12 | Applying a transactional (exchange) framework instead of an outcomes (benefit/harm) framework for symbiosis | Reframe the definition: classify by what HAPPENS to each organism (benefited, unaffected, harmed), not by what is exchanged. Have students fill in a two-column table for each relationship. |
| Predicts only direct first-order effects in cascade scenarios (e.g., "the muskrat will have less food" but does not extend to mink or heron) | Items 6, 13, Extended Response (a) | Understands direct predation relationships but has not internalized the cascading nature of food web disruptions | Practice "If-Then-Because" chains with three or more steps using the class food web diagram. Require students to trace each disruption at least two trophic levels away from the initial change. |
| Proposes a mitigation strategy that is generic environmental action rather than ecosystem-specific | Extended Response (d) | Knows that environmental protection is important but lacks specific knowledge of ecological engineering or conservation biology tools | Introduce three to four specific, named mitigation strategies (wetland mitigation banking, wildlife corridors, buffer zones, permeable surface requirements) with examples from real cases. |
