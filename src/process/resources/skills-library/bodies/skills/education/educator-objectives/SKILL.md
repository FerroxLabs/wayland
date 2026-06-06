---
name: educator-objectives
description: |
  Creates measurable learning objectives using Bloom's taxonomy for educators designing lessons, units, or courses. Produces a set of aligned, leveled objectives with action verbs, conditions, and criteria that can be directly inserted into lesson plans or syllabi.
  Use when an educator asks to write learning objectives, create learning outcomes, align objectives to Bloom's taxonomy, or design measurable goals for instruction.
  Do NOT use for student personal learning goals (use `learning-objectives`), for full lesson plan creation (use `lesson-plan-design`), or for curriculum-level outcomes (use `curriculum-mapping`).
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
# Educator Objectives

## When to Use

Use this skill when an educator is designing instruction and needs formally written, measurable learning objectives -- not vague goals or activity descriptions.

**Trigger scenarios:**
- An educator says "I need learning objectives for my lesson on [topic]" or "help me write learning outcomes for my syllabus"
- A teacher presents vague goals like "students should understand fractions" and needs them converted into measurable, assessable form
- An instructor wants to align existing objectives to Bloom's taxonomy and verify they span appropriate cognitive levels
- A curriculum writer needs objectives that map to specific standards codes (Common Core, NGSS, C3 Framework, state standards, CEFR language levels, AP course frameworks)
- A professor designing a college course needs course-level Student Learning Outcomes (SLOs) that satisfy accreditation requirements (e.g., regional accreditors, program accreditors like ABET or NCATE)
- A professional trainer or instructional designer needs measurable objectives for a workplace learning module that will feed into a SCORM package or LMS gradebook
- An educator is splitting a vague unit goal into layered lesson objectives that show a coherent learning progression

**Do NOT use when:**
- The user is a student writing their own personal learning goals -- use `learning-objectives` instead
- The request is for a complete lesson plan including procedures, materials, and timing -- use `lesson-plan-design` instead (objectives produced here can be inserted into that skill's output)
- The request is for course-wide curriculum mapping across units and standards -- use `curriculum-mapping` instead
- The educator only wants a rubric or assessment tool, not the objectives themselves -- use an assessment design skill instead
- The user wants to evaluate whether existing objectives are well-written rather than create new ones -- this skill can assess and revise, but flag if the task is purely editorial

---

## Process

### Step 1: Gather the Four Essential Context Variables

Before writing a single word of an objective, collect all four variables. If any are missing, ask -- do not invent them.

- **Topic and subject area:** The specific instructional content (e.g., "the water cycle," "solving quadratic equations," "the Harlem Renaissance," "informed consent in clinical ethics") -- not just the course name
- **Audience:** Grade level (K-12), year in college (freshman, sophomore), professional context (new employee, advanced practitioner), or CEFR/ELL proficiency level if language instruction
- **Scope:** Single lesson (typically 45-90 minutes), multi-day unit (3-15 days), or full course -- this determines how many objectives are appropriate and how specific the Degree component must be
- **Standards framework:** Ask explicitly. Common frameworks include Common Core State Standards (CCSS), Next Generation Science Standards (NGSS), C3 Framework for Social Studies, state-specific standards, AP course and exam descriptions, CEFR levels (A1-C2), IB frameworks, ISTE standards for technology, and NCLEX competency frameworks for nursing
- **Existing vague goals:** Ask the educator to share any goals they have already written. Converting their own language into measurable objectives is more useful than starting from scratch and produces output they recognize.

If the educator is in a hurry and only provides topic + grade level, proceed with those and note which variables were assumed.

### Step 2: Determine the Required Bloom's Coverage

Do not default to all objectives at the Remember or Understand level. Use scope to determine the required spread:

- **Single lesson (45-90 min):** Write 2-5 objectives. Cover at least 2 Bloom's levels. At least one objective must be at Apply level or above. Do not attempt Evaluate or Create unless the lesson is a culminating performance task.
- **Multi-day unit (3-15 days):** Write 5-10 objectives. Cover at least 3 Bloom's levels. Include a minimum of one Analyze, Evaluate, or Create objective. The Create level is most appropriate for unit-final projects.
- **Full course / SLOs:** Write 5-8 broad course-level outcomes. These should be distributed across all six levels. Each SLO should be demonstrable through a major assessment (exam section, project, portfolio entry, performance).
- **Cognitive complexity constraint:** For K-2 and foundational adult learners, peak at Apply level. For high school AP or dual enrollment, require at least one Evaluate or Create objective per unit. For graduate seminars, the majority of objectives should sit at Analyze, Evaluate, and Create.

Bloom's level decisions also affect verb selection, assessment type, and time-on-task estimates. A single Create-level objective in a 50-minute lesson is almost always miscalibrated -- flag it.

### Step 3: Write Each Objective Using the ABCD Structure

Every objective must contain all four ABCD components on every write. No exceptions.

**A -- Audience:** Almost always "Students will be able to..." (SWBAT) for K-12. For higher education, "Upon successful completion of this course, students will..." For professional training, "Participants will be able to..." Do not vary the Audience component within a single objective set -- consistency matters for syllabi and accreditation documents.

**B -- Behavior:** The observable, measurable action verb. This is the single most important component. Selecting the wrong verb level is the most common error.

Full verb bank by Bloom's level:

| Bloom's Level | High-Frequency Verbs | Verbs to Use Carefully | Banned Verbs |
|---|---|---|---|
| Remember | list, name, recall, identify, match, state, define, recognize, label | describe (use at Understand) | know, memorize (not measurable as written) |
| Understand | explain, summarize, paraphrase, classify, interpret, predict (simple), illustrate, give examples of | understand (not a behavior), comprehend | appreciate, grasp, be aware of |
| Apply | solve, demonstrate, calculate, use, complete, execute, implement, sketch, produce (simple) | apply (too vague alone -- pair with content) | practice (not measurable as written) |
| Analyze | compare, contrast, differentiate, examine, categorize, deconstruct, distinguish, organize, map, break down | analyze (too vague alone -- specify what is being analyzed) | look at, explore |
| Evaluate | judge, evaluate, critique, justify, defend, assess, argue, prioritize, rank, recommend | evaluate (specify criteria) | think about, consider |
| Create | design, construct, compose, develop, formulate, propose, produce (complex), write, plan, invent, synthesize | create (too vague alone -- specify the artifact) | make, do |

**C -- Condition:** The learning context, materials provided, or constraints under which the behavior is performed. Common condition types:
- Materials provided: "given a periodic table," "using a provided data set," "with access to a calculator"
- Prior activity: "after reading the primary source document," "following the lab procedure"
- Setting: "in a Socratic seminar," "during a timed assessment," "working independently"
- Constraints: "without referring to notes," "in a written paragraph," "using standard essay format"

The Condition component is the most frequently omitted. If the behavior is the same in any context, a Condition is still useful -- it specifies the assessment scenario and prevents ambiguity about what "doing" the skill looks like.

**D -- Degree:** The measurable performance standard. Must be specific enough that two different evaluators would reach the same judgment. Weak degrees say "accurately" or "correctly" -- these push the standard back into subjective territory. Strong degrees specify:
- Quantity: "identifying at least 3 of 4 MAIN causes," "listing all 8 planets in order," "correctly solving at least 4 of 5 problems"
- Quality rubric threshold: "earning a score of 3 or higher on the argument rubric," "meeting the Proficient standard on the district writing rubric"
- Accuracy rate: "with at least 80% accuracy," "making no more than 2 errors"
- Completeness: "labeling all four chambers of the heart," "including a claim, at least 2 pieces of evidence, and a warrant"
- Time constraint (when applicable): "within 10 minutes," "in a single class period" -- use sparingly; only when time is a legitimate learning criterion

### Step 4: Apply the Measurability Test to Every Objective

Before finalizing any objective, run it through this four-question test. If any answer is "no," revise before outputting:

1. **Observable:** Could an evaluator watch or review student work and determine whether the student met this objective? If the only way to know is to read the student's mind, the verb is wrong.
2. **Specific enough to assess:** Is the verb tied to a specific product or performance? "Students will analyze the poem" is not specific. "Students will analyze the poem's tone by identifying at least 3 word choices that contribute to it and explaining the emotional effect of each" passes.
3. **Scoped to the timeframe:** Can a typical student achieve this objective within the stated lesson or unit duration? An objective like "Students will design and build a functional trebuchet" cannot be achieved in a 45-minute lesson.
4. **Aligned to Bloom's level:** Does the required cognitive operation match the stated Bloom's level? "Students will create a list of..." is actually a Remember-level task despite the word "create." Use "list" and assign it to Remember.

### Step 5: Map to Standards Codes

If the educator provided a standards framework, map each objective to the most specific standard code available. Follow these guidelines:

- Use the most granular code available (e.g., CCSS.ELA-LITERACY.RI.9-10.8 rather than CCSS.ELA-LITERACY.RI.9-10)
- One objective may address multiple standards; list all relevant codes
- One standard may be addressed by multiple objectives; this is expected in a unit
- If no standard applies directly, note "Not directly aligned to [framework] -- local curriculum goal"
- If the educator did not specify a framework, produce objectives without standard codes and add a note: "Provide the standards framework used (e.g., CCSS, NGSS, C3) to add alignment codes"

### Step 6: Sequence Objectives and Establish the Learning Progression

Order objectives from lower to higher cognitive demand within the lesson or unit. This is not merely cosmetic -- it reflects the intended instructional sequence and shows that foundational knowledge (Remember, Understand) must precede application and analysis.

Sequencing rules:
- Never place an Analyze or Evaluate objective before the Understand objectives that build the conceptual foundation
- Within the same Bloom's level, sequence from simpler to more complex content
- For units, identify which objectives are prerequisites for others and make that dependency explicit in the Learning Progression narrative
- When objectives span multiple Bloom's levels and multiple days, assign each objective to the approximate day or phase of the unit (Day 1-2: objectives 1-2; Day 3-4: objective 3; Day 5: objective 4)

### Step 7: Generate Assessment Alignment

For every objective, identify the most appropriate assessment method. Assessment methods must be achievable within the lesson or unit context and must directly measure the stated behavior and degree.

Match assessment method to Bloom's level:

| Bloom's Level | Appropriate Formative Methods | Appropriate Summative Methods |
|---|---|---|
| Remember | flashcard check, matching quiz, fill-in-the-blank | multiple choice, short answer recall |
| Understand | exit ticket (explain in own words), graphic organizer, annotation | short answer, concept map, quiz |
| Apply | worked problem set, lab procedure execution, demonstration | problem set, performance task, simulation |
| Analyze | compare/contrast chart, sorting task, case study analysis | analytical essay, structured comparison, case analysis |
| Evaluate | Socratic seminar, debate, written argument | argumentative essay, recommendation memo, critique |
| Create | draft artifact, design proposal, prototype | project, portfolio, original composition |

Flag mismatches: if an educator's intended assessment (e.g., multiple choice only) cannot adequately measure their Evaluate-level objective, note this explicitly and suggest a supplementary method.

### Step 8: Produce Final Output and Flag Calibration Issues

After writing all objectives, check for these systemic issues and flag them in a Calibration Notes section if they apply:

- **Too many objectives for scope:** More than 5 for a single lesson or more than 12 for a unit signals the scope is too ambitious -- recommend splitting
- **Ceiling too low:** All objectives at Remember/Understand for a high school or college audience -- recommend adding at least one Apply or Analyze objective
- **Ceiling too high:** Multiple Create-level objectives in a single 50-minute lesson -- recommend moving to unit level or restructuring as a project
- **Standards gaps:** If a standard in the framework has no corresponding objective, note the gap
- **Assessment mismatch:** If only one assessment method (e.g., a single exam) is planned for 8+ objectives, flag that some objectives will not be adequately measured

---

## Output Format

```
## Learning Objectives: [Specific Topic]

**Subject:** [e.g., 9th Grade World History / AP Chemistry / ENGL 101 / ESL Level 3]
**Grade / Level:** [e.g., Grade 9 / First-Year Undergraduate / B1 CEFR]
**Scope:** [Single Lesson (50 min) / 5-Day Unit / Full Course]
**Standards Framework:** [e.g., C3 Framework for Social Studies / NGSS / CCSS ELA / None specified]
**Total Objectives:** [N]

---

### Conversion from Vague Goals
*(Include only if educator provided vague goals; omit section if not applicable)*

| Original Vague Goal | Problem with Original | Converted Measurable Objective |
|---|---|---|
| "[Original exact text]" | Uses non-measurable verb "[verb]"; missing Condition and Degree | See Objective [#] below |
| "[Original exact text]" | Scope too broad for a single lesson | See Objectives [#] and [#] below |

---

### Objectives

| # | Bloom's Level | Full Objective (ABCD) | Standard Code |
|---|---|---|---|
| 1 | [Level] | Students will be able to **[verb]** [content] [condition phrase], [degree criterion]. | [Code or N/A] |
| 2 | [Level] | Students will be able to **[verb]** [content] [condition phrase], [degree criterion]. | [Code or N/A] |
| 3 | [Level] | Students will be able to **[verb]** [content] [condition phrase], [degree criterion]. | [Code or N/A] |
| 4 | [Level] | Students will be able to **[verb]** [content] [condition phrase], [degree criterion]. | [Code or N/A] |
| 5 | [Level] | Students will be able to **[verb]** [content] [condition phrase], [degree criterion]. | [Code or N/A] |

---

### Bloom's Coverage Summary

| Bloom's Level | Count | Objective Numbers |
|---|---|---|
| Remember | [N] | [e.g., #1] |
| Understand | [N] | [e.g., #2] |
| Apply | [N] | [e.g., #3] |
| Analyze | [N] | [e.g., #4] |
| Evaluate | [N] | [e.g., #5] |
| Create | [N] | [e.g., none] |
| **Total** | **[N]** | |

**Cognitive Range:** [e.g., Remember → Evaluate (Levels 1-5)]
**Recommended range for this scope:** [e.g., For a single 9th grade lesson, Levels 1-4 is appropriate]

---

### Learning Progression

**Sequence rationale:** [Narrative explanation of why objectives are ordered as they are and how each builds on prior objectives]

**Prerequisite map (for units):**
- Objective 1 must precede Objective 3 (provides factual foundation for analysis)
- Objectives 2 and 3 must both precede Objective 4 (evaluation requires conceptual and analytical groundwork)
- Objective 5 (Create) requires all prior objectives as foundation

*(For single lessons, a simpler 1 → 2 → 3 progression description is sufficient)*

---

### Assessment Alignment

| Objective | Bloom's Level | Suggested Assessment Method | Format | Timing |
|---|---|---|---|---|
| 1 | [Level] | [Specific assessment description] | [Formative / Summative] | [During lesson / End of unit] |
| 2 | [Level] | [Specific assessment description] | [Formative / Summative] | [During lesson / End of unit] |
| 3 | [Level] | [Specific assessment description] | [Formative / Summative] | [During lesson / End of unit] |

---

### ABCD Checklist (Self-Verification)

| Objective | Audience ✓ | Measurable Verb ✓ | Condition ✓ | Degree ✓ | Measurability Test ✓ |
|---|---|---|---|---|---|
| 1 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | ✓ | ✓ | ✓ | ✓ | ✓ |

---

### Calibration Notes
*(Include only if issues exist; omit this section if objectives pass all checks)*

- [Issue]: [Explanation and recommendation]
```

---

## Rules

1. **Never use non-measurable verbs as the Behavior component.** The banned list is non-negotiable: understand, know, appreciate, learn about, become familiar with, be aware of, grasp, comprehend (used alone), explore, study, think about, recognize the importance of. If the educator uses one of these, convert it and show the before/after. Do not let the banned verb appear in a final objective.

2. **The Degree component must be independently scorable by two evaluators.** If the threshold requires professional judgment without criteria (e.g., "writes a good essay"), it is not a Degree -- it is a vague standard. Replace with a rubric score ("earning at least a 3 on the district argumentative writing rubric"), a quantity ("identifying at least 4 of 5 structural elements"), or an accuracy rate ("with no more than 2 computational errors").

3. **Scope determines the maximum number of objectives.** Single lesson: 2-5 objectives maximum. Multi-day unit: 5-12 objectives. Full course / SLOs: 5-8 objectives. Exceeding these limits without educator confirmation means the scope is miscalibrated. Flag it and ask whether to split the lesson, extend the unit, or consolidate objectives.

4. **Never write a set of objectives that are all at the same Bloom's level.** A lesson with 4 Remember-level objectives is not a lesson plan -- it is a memorization task. A lesson with 4 Create-level objectives is not achievable in the timeframe. Always include at least 2 distinct Bloom's levels in a lesson set and at least 3 in a unit set.

5. **The Create level requires a specified artifact.** "Students will create a model" passes only if the model type, its components, and the evaluation criteria are specified. "Students will create a persuasive poster arguing for a position on water conservation, including a claim, at least 2 pieces of evidence, and a labeled visual element" is acceptable. Vague Create objectives are actually worse than no Create objective.

6. **Bloom's verb must match Bloom's level in the table.** Do not label an objective "Analyze" if the verb is "list" or "describe." The label in the table drives the assessment design decision -- a mislabeled objective causes educators to design the wrong kind of assessment. When in doubt, check the four-question measurability test: the cognitive operation required to perform the behavior should match the Bloom's level.

7. **The Condition component cannot be omitted even if it seems obvious.** "After completing the reading" is a legitimate condition. "Given a blank outline template" is a condition. Even "working from memory, without notes" is a condition. The absence of a condition forces the educator to guess during assessment -- does the student use a formula sheet or not? That ambiguity invalidates the assessment.

8. **Objectives must describe learning outcomes, not learning activities.** "Students will complete a lab on cell division" is an activity. "Students will be able to identify the four stages of mitosis in microscope slide images, correctly labeling at least 3 of 4 stages with 100% accuracy" is an objective. If the educator submits activities as objectives, convert them and explain the distinction.

9. **Standard code alignment must use the most granular code available.** Do not align to "CCSS.ELA-LITERACY.W.9-10" when "CCSS.ELA-LITERACY.W.9-10.1.a" exists. Granular codes allow educators to use the objectives for standards-based reporting, gradebook setup, and curriculum audits. Coarse alignment wastes the mapping exercise.

10. **Flag cognitive mismatch between objectives and intended assessments.** If an educator mentions they plan to assess all objectives with a single multiple-choice test, note explicitly which objectives (Evaluate and Create level) cannot be validly measured by multiple choice alone and recommend a supplementary method. Do not silently produce objectives that the educator's planned assessments cannot measure.

---

## Edge Cases

### Affective Domain Objectives (Attitudes, Values, Dispositions)

Educators in social-emotional learning (SEL), ethics, health education, and civic education frequently need affective domain objectives. Use Krathwohl's affective taxonomy (1964), which is a separate hierarchy from Bloom's cognitive taxonomy:

| Affective Level | Description | Sample Verbs |
|---|---|---|
| Receiving | Willingness to attend to a stimulus | listen, attend, be present, notice |
| Responding | Actively participating or reacting | participate, comply, discuss, answer |
| Valuing | Attaching worth or commitment to a belief | argue for, defend, explain the importance of |
| Organizing | Comparing and synthesizing values into a system | compare values, formulate a position, weigh priorities |
| Characterizing | Acting consistently with an internalized value | exemplify, demonstrate consistently, integrate into practice |

Assessment strategies for affective objectives are observation-based: participation rubrics, structured reflection journals, behavior logs, and self-assessment scales. Alert the educator that affective objectives are harder to grade objectively and suggest formative (not high-stakes summative) assessment for Receiving and Responding levels.

### Psychomotor Domain Objectives (Physical Skills, Lab Technique, Performance Arts)

Use Dave's or Simpson's psychomotor taxonomy for PE, lab science, music performance, CTE, nursing clinical skills, and fine arts:

| Psychomotor Level | Description | Sample Verbs |
|---|---|---|
| Imitation | Copying a demonstrated movement | imitate, replicate, follow a model |
| Manipulation | Reproducing a skill from instruction | perform, execute, carry out |
| Precision | Executing skill with accuracy and economy | demonstrate with accuracy, perform independently |
| Articulation | Combining skills smoothly | coordinate, integrate, adapt the technique |
| Naturalization | Automatic, expert-level performance | perform fluently, demonstrate mastery |

Degree components for psychomotor objectives must reference observable performance criteria: "pipetting 1.0 mL volumes within ±0.05 mL of target," "playing the assigned 32-bar passage at 120 BPM with no more than 2 missed notes," "suturing the wound closure using the mattress stitch with no deviation from sterile field protocol."

### Very Young Learners (Pre-K through Grade 2)

Bloom's taxonomy applies but with significant modifications:

- Degree thresholds use child-appropriate quantities: "3 of 4 objects," "the first 10 sight words from the Dolch Pre-Primer list," rather than percentages
- Conditions emphasize manipulatives, visuals, and teacher support: "using pattern blocks," "with picture cards," "during whole-group instruction"
- Create-level objectives at this age involve highly scaffolded products: "draw and label two differences they observed," not "design an original experiment"
- Affective and psychomotor objectives are often equally or more important than cognitive objectives at this stage -- do not neglect them
- SWBAT phrasing may be replaced with more accessible teacher-facing language: "The student will sort..." is clearer than formal ABCD framing for a kindergarten behavior

### Higher Education Course-Level Student Learning Outcomes (SLOs)

College SLOs written for accreditation or program review differ from lesson objectives in three important ways:

1. **Grain size:** SLOs span an entire course (15 weeks) and must be demonstrable through major summative assessments -- capstone projects, final exams, portfolios, comprehensive performances
2. **Assessment mapping:** Each SLO must be mapped to one or more specific assessments in the course. Accreditors require evidence of measurement; a SLO that is never assessed is a liability, not a feature
3. **Program alignment:** Course SLOs typically ladder up to program-level learning outcomes and may further connect to institutional-level outcomes (e.g., written communication, critical thinking). Produce a mapping table showing these connections when the educator is working in this context

For SLO writing, verb selection tends toward the higher Bloom's levels (Analyze, Evaluate, Create) because courses are expected to develop sophisticated competencies, not just recall. Flag if a college course's SLOs are all at the Remember/Understand level -- this is a common finding in academic program review that leads to required revisions.

### Objectives for English Language Learners (ELL) and Language Instruction

Language learning objectives require integration of both content objectives and language objectives. Use the WIDA Framework or CEFR level descriptors to set the Degree component:

- **Content objective:** "Students will be able to compare the life cycles of two organisms using a Venn diagram, correctly identifying at least 3 similarities and 3 differences."
- **Language objective:** "Students will be able to write comparison sentences using comparative adjectives (e.g., 'both,' 'while,' 'unlike') with at least 4 of 6 target structures used correctly."

Do not write a single objective that conflates content mastery with language production unless the topic is language arts. Separate content from language objectives to allow differentiated assessment of what the student knows (content) versus what they can express in the target language (language production).

### Converting Vague Goals from Non-Educator Sources

Sometimes the educator is working from goals handed down by an administrator, textbook chapter titles, or state standards written as broad competencies rather than classroom objectives. These require decomposition before conversion:

- A state standard like "Understand and apply properties of operations and the relationship between addition and subtraction" is a standard, not an objective. Decompose it into 3-5 lesson-level objectives, each addressing a specific property or relationship
- A textbook chapter goal like "Chapter 7: The Cell" must be analyzed for its actual instructional targets (cell structure, organelle function, cell types, cell division) before objectives can be written
- Administrator-mandated goals like "students will develop critical thinking" require the educator to specify the disciplinary context before ABCD objectives can be written -- flag this and ask for the context

In all decomposition cases, produce a mapping that shows which original goal each new objective addresses, so the educator can document alignment to their mandated goals.

### Interdisciplinary and Project-Based Learning Objectives

When objectives span two or more subject areas (e.g., a science-ELA unit on climate change), write separate objective sets per discipline and then produce an integration table:

| Objective | Primary Discipline | Secondary Discipline | Integration Point |
|---|---|---|---|
| Analyze climate data sets to identify 3 trends | Science (NGSS) | Math (CCSS) | Data literacy bridges both |
| Write an evidence-based argument on a climate policy | ELA (CCSS.W) | Science (NGSS practices) | Argumentation from evidence |

This prevents the common error of writing a single objective that tries to assess two disciplines simultaneously -- which produces an objective no teacher can score independently.

---

## Example

**Input from educator:** "I'm a 10th grade biology teacher. I have a 5-day unit on cell division -- mitosis and meiosis. My goals right now are for students to understand the stages of mitosis, know the difference between mitosis and meiosis, and appreciate why cell division matters for cancer. I'm using NGSS. Can you write objectives for the unit?"

---

## Learning Objectives: Cell Division -- Mitosis and Meiosis

**Subject:** Biology
**Grade / Level:** Grade 10
**Scope:** 5-Day Unit
**Standards Framework:** Next Generation Science Standards (NGSS)
**Total Objectives:** 7

---

### Conversion from Vague Goals

| Original Vague Goal | Problem with Original | Converted Measurable Objective |
|---|---|---|
| "Understand the stages of mitosis" | "Understand" is not measurable; no Condition or Degree specified | See Objectives 1 and 2 below |
| "Know the difference between mitosis and meiosis" | "Know" is not an observable behavior; "the difference" is vague -- which differences? | See Objective 4 below |
| "Appreciate why cell division matters for cancer" | "Appreciate" is an affective verb (Krathwohl) that cannot be assessed as written; "matters" has no cognitive level or criterion | See Objective 6 below |

---

### Objectives

| # | Bloom's Level | Full Objective (ABCD) | Standard Code |
|---|---|---|---|
| 1 | Remember | Students will be able to **list** the four stages of mitosis (prophase, metaphase, anaphase, telophase) in sequence, given a blank diagram of a dividing cell, naming all four stages correctly with no sequencing errors. | HS-LS1-4 |
| 2 | Understand | Students will be able to **describe** the key chromosomal events occurring during each stage of mitosis -- using annotated diagrams provided in the lab workbook -- correctly explaining the primary event of each stage (chromosome condensation, alignment, separation, and cytokinesis) in 1-2 sentences per stage. | HS-LS1-4 |
| 3 | Apply | Students will be able to **identify** the stage of mitosis occurring in a set of 10 microscope slide images of onion root tip cells, correctly classifying at least 8 of 10 images to the appropriate stage. | HS-LS1-4 |
| 4 | Analyze | Students will be able to **compare** mitosis and meiosis by constructing a comparison table that differentiates the two processes across at least 5 of the following 7 dimensions: purpose, number of divisions, number of daughter cells produced, genetic outcome (identical vs. varied), ploidy of daughter cells, occurrence of crossing over, and cell types produced. | HS-LS3-2 |
| 5 | Analyze | Students will be able to **explain** how errors in cell division (nondisjunction during meiosis, failure of checkpoints during mitosis) produce chromosomal abnormalities or uncontrolled cell growth, citing at least one specific example of each error type using correct terminology. | HS-LS3-2 |
| 6 | Evaluate | Students will be able to **evaluate** the claim that cancer is fundamentally a disease of cell division by writing a structured argument -- using evidence from at least 3 unit resources (readings, data sets, case studies) -- that includes a claim, at least 2 pieces of evidence, and a warrant connecting each piece of evidence to the claim, earning a score of 3 or higher on the district evidence-based argument rubric. | HS-LS1-1 |
| 7 | Create | Students will be able to **design** an annotated diagram or physical model of the cell cycle that correctly represents all phases of interphase and mitosis, includes labels for at least 6 distinct events or structures (e.g., DNA replication, spindle formation, sister chromatids, cleavage furrow), and includes a written caption explaining how disruption at one checkpoint could lead to uncontrolled division. | HS-LS1-4 |

---

### Bloom's Coverage Summary

| Bloom's Level | Count | Objective Numbers |
|---|---|---|
| Remember | 1 | #1 |
| Understand | 1 | #2 |
| Apply | 1 | #3 |
| Analyze | 2 | #4, #5 |
| Evaluate | 1 | #6 |
| Create | 1 | #7 |
| **Total** | **7** | |

**Cognitive Range:** Remember → Create (all six levels represented)
**Recommended range for this scope:** A 5-day unit for 10th grade biology should span at least 3 Bloom's levels and include at least one Evaluate or Create objective. This set spans all 6 levels, which is appropriate for a unit that culminates in a project.

---

### Learning Progression

**Sequence rationale:** Objectives are ordered from lowest to highest cognitive demand to mirror the instructional sequence across the 5 days.

- **Day 1 (Objectives 1-2):** Students build factual and conceptual foundations for mitosis -- they must be able to name and describe before they can do anything analytical. Objective 1 (Remember) is the prerequisite for Objective 2 (Understand).
- **Day 2 (Objective 3):** Students apply their conceptual knowledge to real microscope images. This Apply-level objective requires Objectives 1 and 2 as prerequisites -- students cannot classify what they cannot yet name and describe.
- **Day 3 (Objective 4):** Students encounter meiosis for the first time and immediately analyze it in comparison to mitosis. This Analyze-level task requires Objective 2 as a prerequisite (must understand mitosis before comparing it to meiosis).
- **Day 4 (Objectives 5-6):** Students analyze error mechanisms (Objective 5) and evaluate the cancer connection (Objective 6). Objective 5 is the prerequisite for Objective 6 -- students must understand how division errors occur before they can evaluate the claim that cancer is a division disease.
- **Day 5 (Objective 7):** The Create objective is a culminating task requiring all prior objectives as its foundation. Students cannot design a correct, annotated model unless they can recall stages, describe events, apply identification skills, compare the two processes, explain errors, and evaluate significance.

**Prerequisite map:**
- Obj 1 → required before Obj 2, 3, 4, 7
- Obj 2 → required before Obj 3, 4, 5, 7
- Obj 3 → enriches but not strictly required for Obj 6 or 7
- Obj 4 → required before Obj 7
- Obj 5 → required before Obj 6 and Obj 7

---

### Assessment Alignment

| Objective | Bloom's Level | Suggested Assessment Method | Format | Timing |
|---|---|---|---|---|
| 1 | Remember | Blank cell division diagram -- students label all 4 stages in sequence | Formative (collected) | End of Day 1 |
| 2 | Understand | Annotated diagram with 1-2 sentence descriptions per stage | Formative (collected) | End of Day 1 |
| 3 | Apply | Microscope slide identification task (10 onion root tip images, multiple choice + short justification) | Formative (scored) | Day 2 lab |
| 4 | Analyze | Mitosis vs. meiosis comparison table with 5-7 dimensions completed | Formative (scored with checklist) | End of Day 3 |
| 5 | Analyze | Short constructed response: describe one mitosis error and one meiosis error, each with a named example | Formative (scored with 4-point rubric) | Day 4 warm-up |
| 6 | Evaluate | Evidence-based argument paragraph scored on district argument rubric | Summative (graded) | End of Day 4 |
| 7 | Create | Annotated diagram or physical model with written caption -- scored on a 3-criteria rubric (accuracy of labels, completeness of events, quality of caption explanation) | Summative (graded) | Day 5 / due end of unit |

---

### ABCD Checklist (Self-Verification)

| Objective | Audience ✓ | Measurable Verb ✓ | Condition ✓ | Degree ✓ | Measurability Test ✓ |
|---|---|---|---|---|---|
| 1 | ✓ (SWBAT) | ✓ (list) | ✓ (given a blank diagram) | ✓ (all 4, no sequencing errors) | ✓ |
| 2 | ✓ | ✓ (describe) | ✓ (using annotated diagrams in workbook) | ✓ (1-2 sentences per stage, primary event correct) | ✓ |
| 3 | ✓ | ✓ (identify) | ✓ (set of 10 microscope images) | ✓ (at least 8 of 10 correct) | ✓ |
| 4 | ✓ | ✓ (compare) | ✓ (constructing a comparison table) | ✓ (at least 5 of 7 specified dimensions) | ✓ |
| 5 | ✓ | ✓ (explain) | ✓ (implied: from unit instruction and resources) | ✓ (one specific example per error type, correct terminology) | ✓ |
| 6 | ✓ | ✓ (evaluate) | ✓ (using at least 3 unit resources) | ✓ (claim + 2 evidence + warrant; score ≥3 on district rubric) | ✓ |
| 7 | ✓ | ✓ (design) | ✓ (annotated diagram or physical model) | ✓ (6+ labeled elements, written caption, checkpoint disruption addressed) | ✓ |

---

### Bloom's Taxonomy Verb Reference

Use this reference when modifying or extending the objectives above:

| Bloom's Level | Action Verbs (domain-specific for biology) | Question Stems for Assessments |
|---|---|---|
| Remember | list, name, label, match, state, identify, define, recognize | Name the four stages of... What is the function of...? List the parts of... |
| Understand | describe, explain, summarize, interpret, classify, give an example of | Explain how... What happens during...? Describe the relationship between... |
| Apply | identify in a new context, use a procedure, calculate, demonstrate, execute | Identify the stage shown in this image. Calculate the number of cells produced. |
| Analyze | compare, contrast, differentiate, examine, map, categorize, break down | How does mitosis differ from meiosis? What are the consequences of a spindle failure? |
| Evaluate | assess, evaluate, justify, defend, argue, recommend | Is the claim that cancer is a division disease well-supported? Which evidence is strongest? |
| Create | design, construct, develop, produce, compose, propose, model | Design a diagram that shows... Develop a model that explains... |

---

### Calibration Notes

No calibration issues identified for this objective set.

- 7 objectives for a 5-day unit falls within the recommended 5-12 range for a unit scope.
- All 6 Bloom's levels are represented, which is appropriate for a 10th grade unit that culminates in a summative project.
- The three original vague goals have been converted, with the "appreciate" goal appropriately elevated to an Evaluate-level cognitive objective (Objective 6) rather than an affective objective, which would have been unassessable in this context. If the educator also wants an affective objective about student attitudes toward the social implications of cancer research, that can be added as a supplementary Responding-level objective to be assessed via reflection journal.
- NGSS codes used (HS-LS1-4, HS-LS3-2, HS-LS1-1) are performance expectations; for standards-based reporting, the educator should also reference the associated Science and Engineering Practices (e.g., SEP-6: Constructing Explanations) and Crosscutting Concepts (e.g., CCC-2: Cause and Effect) if required by their district's reporting format.
