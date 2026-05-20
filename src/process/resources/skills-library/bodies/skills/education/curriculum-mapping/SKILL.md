---
name: curriculum-mapping
description: |
  Designs complete curriculum maps and unit sequences for a course or academic year, aligning standards to units, sequencing learning progressions, and planning assessment checkpoints. Produces a filled-in curriculum document for educators -- not a guide on what curriculum mapping is.
  Use when an educator asks to map a curriculum, design a course sequence, plan a semester or year of instruction, or align standards across units.
  Do NOT use for single lesson plans (use `lesson-plan-design`), individual assessment creation (use `assessment-design`), or student study plans (use `study-plan`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "curriculum teaching lesson-plan step-by-step"
  category: "education"
  subcategory: "teaching"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Curriculum Mapping

## When to Use

Use this skill when any of the following triggers apply:

- An educator asks to plan a full semester, trimester, quarter, or academic year of instruction for a specific course -- including phrases like "map out my year," "build a scope and sequence," or "plan my curriculum"
- A teacher or department chair wants to align a set of standards (Common Core, NGSS, AP frameworks, IB MYP/DP, state standards, or custom outcomes) to a sequence of instructional units across a course
- An instructor needs a structured unit sequence with embedded assessment checkpoints, pacing guides, and defined learning progressions for a course they are building or revising
- A department head, curriculum coordinator, or instructional coach wants to audit or reconstruct horizontal alignment (same course across multiple teachers or sections) or vertical alignment (coherence from one grade level or course to the next)
- A teacher inherits a course with no documented curriculum and needs to build one from scratch using a textbook, standards framework, or course description as the primary input
- An educator is designing a new elective, CTE pathway, dual-enrollment course, or AP/IB course that requires demonstrable alignment to an external framework or exam specification
- A school or district leader needs a deliverable curriculum map that can be shared with administrators, accreditation reviewers, or curriculum committees

**Do NOT use this skill when:**

- The user wants a single, detailed lesson plan for one class period or week -- use `lesson-plan-design` instead, which generates instructional sequences at the session level
- The user wants to create a specific assessment instrument such as a test, rubric, or project description -- use `assessment-design` instead, which focuses on item construction, rubric development, and validity
- A student (not educator) is planning their own study schedule, test prep timeline, or personal learning goals -- use `study-plan` instead
- The request is for a professional development workshop outline or staff training sequence -- this skill is designed for student-facing academic courses, not adult learning programs
- The user only needs help understanding what curriculum mapping is as a concept -- this skill produces a document, not an explanation of the methodology

---

## Process

### Step 1: Elicit and Confirm All Curriculum Parameters

Before generating any part of the map, collect the following inputs. If any are missing, ask for them explicitly -- do not assume or invent values that change the entire architecture of the map.

- **Course identity:** Full course title, subject area, and grade level or course level (e.g., "Honors Biology," "8th Grade ELA," "AP Calculus AB," "IB History of the Americas HL")
- **Student population:** Grade level(s), typical prior knowledge, any tracked or mixed-ability context, ELL or IEP prevalence if the educator mentions it
- **Duration and calendar:** Total instructional weeks, instructional days per week, start and end dates, and any known non-instructional interruptions (testing windows, state holidays, block schedule transitions, semester exam days). A standard school year is 36 weeks; a semester is 18 weeks; a quarter is 9 weeks
- **Standards framework:** The exact framework name and version (e.g., CCSS-Math 2010, NGSS 2013, College Board AP Biology CED 2019, IB MYP Sciences Guide 2014, TEKS 2022). If the educator does not specify, ask before proceeding -- do not assume CCSS applies everywhere
- **Fixed external milestones:** AP exam date, IB internal assessment deadlines, state testing windows, district benchmark dates. These are non-negotiable anchors around which all pacing is built
- **Required resources:** Textbook title and edition, supplemental program (e.g., Illustrative Mathematics, CPM, Amplify, College Board's AP Classroom), district-required materials
- **Pacing constraints:** Whether the school uses block (90-minute) or traditional (50-minute) scheduling, whether sections must stay synchronized, and any district-mandated unit order

Record all of these before proceeding. If the educator cannot answer a question, note the assumption explicitly in the map header so they can revise it later.

### Step 2: Inventory and Cluster All Required Standards

This step determines the architecture of every unit. Do not skip or abbreviate it.

- **List every standard or learning outcome** that the course is responsible for delivering. For AP courses, use the CED (Course and Exam Description) science practices and essential knowledge statements. For CCSS, list every domain-level standard by code. For IB, list every key concept, related concept, and global context
- **Count the total number of discrete standards.** A typical middle school math course covers 25-35 CCSS standards; a typical high school ELA course covers 40-55 anchor standards plus grade-specific standards; AP courses average 60-100 essential knowledge statements. This count determines unit density
- **Group standards into thematic clusters** by conceptual coherence, not by textbook chapter. Standards that share a conceptual anchor (e.g., all ratio and proportional reasoning standards in 6th grade, all cell biology essential knowledge in AP Bio) belong in the same unit. Expect 6-12 clusters for a full year
- **Map prerequisite chains.** Identify which standards require prior mastery of another standard within the same course. Draw a simple dependency chain (even mentally) and use it to constrain sequence: foundational standards must appear in earlier units. For example, solving multi-step equations (6.EE.7) must precede writing inequalities (6.EE.8); cellular respiration (AP Bio Unit 3) must follow cell structure (AP Bio Unit 2)
- **Identify spiral standards** -- standards that recur at increasing depth across multiple units. In ELA, RI/W writing from sources spirals across every unit. In science, CCC (Crosscutting Concepts) like cause-and-effect appear in every unit. Mark these separately; they will populate the Spiral Skills Tracker
- **Flag any standards that cannot be fully addressed in a single unit** (typically complex performance standards like "write arguments to support claims with clear reasons and relevant evidence"). These need a primary unit where they are formally introduced and assessed, plus secondary appearances in other units for reinforcement

### Step 3: Design the Unit Sequence Using Backward Design at Course Level

Apply Wiggins and McTighe's backward design logic not just to individual units, but to the entire course arc.

- **Start from the end:** What does a student who completes this course successfully know, do, and understand? For AP/IB courses, this is defined by the exam or external assessment. For standards-based courses, it is mastery of all grade-level standards. Articulate 3-5 course-level enduring understandings that the full sequence of units builds toward
- **Determine unit count and titles** based on the thematic clusters from Step 2. Typical counts: 6-8 units for a semester course, 8-12 units for a year-long course, 10-14 units for AP or IB courses that use the full CED. Give each unit a thematic title that signals its conceptual focus -- not "Unit 1" or "Chapter 3," but "Proportional Relationships and Rates" or "The Chemistry of Life"
- **Assign instructional weeks to each unit** using this formula as a starting point: (total instructional weeks × 0.95) ÷ number of units = average unit length. The remaining 5% is buffer time. Then adjust unit length up or down based on standard density and conceptual complexity. Units with 6+ standards or novel abstract concepts need more time; units building on well-established prior knowledge can be shorter. Unit lengths typically range from 2 to 6 weeks; anything shorter than 2 weeks is a module, not a unit
- **Place fixed milestones first.** Treat AP exam dates, state testing windows, and district benchmark dates as immovable. Work backward from each: a 3-week AP review period must precede the AP exam date; a district benchmark at Week 18 means all units up to that point must fit within 18 weeks. Build the rest of the calendar around these constraints
- **Sequence units by prerequisite logic AND motivational arc.** Prerequisites come first; but also consider opening the year with a unit that is accessible, engaging, and builds student identity as a learner in that discipline. In high school chemistry, starting with measurement and significant figures is logically necessary but motivationally flat -- consider whether a brief "chemistry of everyday life" framing unit can precede it
- **Allocate buffer time explicitly.** A minimum of 5% of total instructional time (approximately 7-9 days in a 36-week year) must be reserved for reteaching, flex days, and unexpected interruptions. Distribute these as 1-2 buffer days after complex units rather than saving them all for the end of the year, where they become invisible

### Step 4: Develop Each Unit's Internal Structure

For each unit identified in Step 3, build the following components. This is the core instructional architecture that makes the map usable, not just a scheduling document.

- **Essential question:** Write one driving question per unit that is open-ended, intellectually honest (experts still debate it), and requires use of all major standards in the unit to answer. Avoid questions answerable with a single vocabulary term. "What is a ratio?" is a definition question. "How can understanding rates and ratios help us make fair comparisons between things that aren't the same size?" is an essential question
- **Learning progression by week:** Sequence the specific topics, skills, and concepts within each unit week by week (or by blocks for block schedules). Each week should have a clear conceptual focus. Instruction should move from concrete to representational to abstract (CRA sequence) for skill-based content, and from known to unknown, simple to complex for conceptual content
- **Key vocabulary:** Identify 6-12 terms per unit that are necessary for students to engage with the standards. Distinguish between Tier 2 vocabulary (general academic language: analyze, evaluate, justify) and Tier 3 vocabulary (domain-specific: quotient, stoichiometry, imperialism). Both must be planned for
- **Formative assessment checkpoints:** Plan at minimum one formative check per week of instruction. Exit tickets (3-5 minutes, 1-2 items) are appropriate for daily skills. Short quizzes (10-15 minutes, 4-8 items) are appropriate at the midpoint of multi-week units. Observation protocols, whiteboard checks, and Socratic discussion are appropriate for conceptual standards. Each formative check must target a specific standard and have a clear action threshold: if fewer than 70% of students demonstrate mastery, the teacher pauses to reteach before moving forward
- **Summative assessment design:** Specify the type (selected response test, constructed response test, performance task, essay, lab report, presentation, portfolio) and the standard(s) it assesses. Summative assessments must vary in type across the full course -- no more than 3 consecutive units should use the same summative format. Each summative must be aligned to the cognitive demand level of the standard: application and analysis-level standards require tasks beyond recall-level tests
- **Differentiation touchpoints:** For each unit, note at least one scaffolding strategy (for students who need additional support) and one extension pathway (for students who reach mastery early). These do not need to be fully designed here -- they are planning markers that remind the educator to prepare them

### Step 5: Build the Assessment Calendar and Spiral Skills Tracker

These two tools transform a unit-by-unit list into a navigable course management system.

- **Assessment calendar:** Create a week-by-week table showing every formative checkpoint, summative assessment, and external assessment event (district benchmark, state test, AP exam, IB deadline). The calendar should be scannable in 30 seconds -- an educator looking at Week 14 should immediately see what assessments are due, what standards are being tested, and whether any external event falls that week. Mark district/state events in a separate column so they are visually distinct from teacher-designed assessments
- **Spiral skills tracker:** List every spiral standard or transferable skill as a row. For each unit, label the cell with one of four stages: **Introduce** (first formal exposure), **Develop** (structured practice with feedback), **Assess** (formal evaluation counts toward grade or mastery record), **Maintain** (embedded but not the instructional focus). A skill should not jump from Introduce directly to Assess without at least one Develop stage in between. This tracker is especially important for ELA (writing, reading informational text, speaking), math (fluency, problem-solving, mathematical practices), and science (science practices, crosscutting concepts)
- **Cross-unit connections:** Add a brief cross-reference note to any unit where content connects to another course students are taking at the same grade level (horizontal alignment) or to the course that precedes or follows this one (vertical alignment). These notes support interdisciplinary projects and help educators communicate with colleagues

### Step 6: Validate the Map Against All Constraints

Before producing the final document, run the following validation checks:

- **Total weeks check:** Sum all unit durations plus buffer days. The total must equal the stated number of instructional weeks. If it does not, adjust unit durations -- never add phantom weeks
- **Standards coverage audit:** List every standard from Step 2 and confirm each one appears in at least one unit. Flag uncovered standards explicitly with a note explaining why they were not mapped (out-of-scope for this course, covered in a parallel course, etc.)
- **Assessment type diversity check:** Tally the summative assessment types across all units. No single format should account for more than 40% of all summative assessments. If five of eight units use a traditional test as the summative, redesign at least two as performance tasks or projects
- **Prerequisite sequence check:** Review the unit order one final time against the dependency chains from Step 2. If any unit requires knowledge from a later unit, adjust the sequence
- **Fixed milestone check:** Confirm that no summative assessment is scheduled during a district benchmark testing week or within three days of a major external exam

### Step 7: Format and Deliver the Complete Curriculum Map

Produce the full document using the Output Format below. Include every section -- do not skip the Spiral Skills Tracker or Assessment Calendar to save space. These are the sections educators use most during the year. Add a "Map Notes and Assumptions" section at the top if any inputs were assumed rather than confirmed.

---

## Output Format

```
## Curriculum Map: [Course Title]

**Map Version:** [Draft / Revised / Final]  
**Prepared for:** [Teacher name or "General Use" if not specified]  
**Subject:** [Subject area]  
**Grade / Level:** [Grade level or course level]  
**Duration:** [Semester / Year / Quarter] -- [X] instructional weeks, [Y] total instructional days  
**Standards Framework:** [Full framework name and version/year]  
**Primary Resources:** [Textbook title, edition, supplemental program]  
**Fixed External Milestones:** [AP exam date, state test window, IB deadlines, district benchmarks]

---

### Map Notes and Assumptions
[List any inputs that were assumed rather than confirmed. E.g., "Assumed 5 instructional days per week;
confirm with school calendar." "AP exam date assumed May 8; adjust calendar if different."]

---

### Course-Level Enduring Understandings
1. [Enduring understanding -- should be transferable beyond this course]
2. [Enduring understanding]
3. [Enduring understanding]

---

### Course Overview

| Unit | Title | Duration | Primary Standards | Summative Assessment | Assessment Type |
|------|-------|----------|--------------------|----------------------|-----------------|
| 1 | [Title] | [X wks] | [Standard codes] | [Description] | [Type] |
| 2 | [Title] | [X wks] | [Standard codes] | [Description] | [Type] |
| 3 | [Title] | [X wks] | [Standard codes] | [Description] | [Type] |
| 4 | [Title] | [X wks] | [Standard codes] | [Description] | [Type] |
| 5 | [Title] | [X wks] | [Standard codes] | [Description] | [Type] |
| 6 | [Title] | [X wks] | [Standard codes] | [Description] | [Type] |
| [Buffer] | Flex / Review | [Y days] | All prior | [Optional cumulative] | [Optional] |

**Total instructional weeks mapped:** [X] (must equal stated duration)  
**Buffer time:** [Y days] -- approximately [Z]% of total instructional time  
**Standards coverage:** [Total standards in framework] standards across [N] units; [M] spiral standards tracked separately

---

### Unit [N]: [Title] ([X weeks] -- Weeks [start]-[end])

**Essential Question:** [Open-ended driving question requiring use of all unit standards to answer]

**Standards Addressed:**
| Code | Standard Description | Stage in This Unit |
|------|----------------------|--------------------|
| [Code] | [Full description] | Primary / Assessed |
| [Code] | [Full description] | Primary / Assessed |
| [Code] | [Full description] | Supporting / Spiral |

**Prior Knowledge Required:** [What students must already know or be able to do before this unit begins]

**Learning Progression:**

| Week | Instructional Focus | CRA Stage | Key Activities |
|------|--------------------|-----------|-----------------------------|
| [N] | [Specific topic or concept] | Concrete / Representational / Abstract | [Type of activity] |
| [N+1] | [Specific topic or concept] | Representational / Abstract | [Type of activity] |
| [N+2] | [Integration / Application] | Abstract / Transfer | [Performance task / assessment] |

**Key Vocabulary:**
- *Tier 3 (Domain-specific):* [Term 1], [Term 2], [Term 3], [Term 4], [Term 5]
- *Tier 2 (Academic):* [Term 1], [Term 2], [Term 3]

**Formative Assessment Checkpoints:**
| Checkpoint | Format | Standard(s) Targeted | Decision Rule |
|------------|--------|----------------------|---------------|
| [Name / Week] | [Exit ticket / Quiz / Discussion / Observation] | [Standard code(s)] | If <70% mastery: [action]; If ≥70%: proceed |
| [Name / Week] | [Format] | [Standard code(s)] | If <70% mastery: [action]; If ≥70%: proceed |

**Summative Assessment:** [Title]
- *Type:* [Performance task / Constructed response test / Selected response / Essay / Lab / Project / Portfolio]
- *Standards Assessed:* [Code 1], [Code 2], [Code 3]
- *Cognitive Demand:* [Recall / Skill/Concept / Strategic Thinking / Extended Thinking -- DOK 1-4]
- *Description:* [2-3 sentences describing what students do and produce]
- *Scoring:* [Points / Rubric / Analytic / Holistic]

**Differentiation:**
- *Scaffolding (support):* [Specific strategy for students who need additional support]
- *Extension (enrichment):* [Specific pathway for students who reach mastery early]

**Cross-Cutting Connections:**
- *Horizontal:* [Connection to another course students take at this grade level]
- *Vertical:* [Connection to prerequisite course or subsequent course in the sequence]
- *Real-World Application:* [Authentic context where this content appears]

---

[Repeat Unit section for each unit]

---

### Assessment Calendar

| Week | Unit | Formative Checkpoints | Summative Assessment | District / State Events |
|------|------|----------------------|----------------------|-------------------------|
| [1-X] | [Unit name] | [Type(s) and frequency] | -- | -- |
| [X+1-Y] | [Unit name] | [Type(s) and frequency] | [Assessment title (Week Y)] | [Benchmark / test name if applicable] |
| [Buffer] | Flex | -- | [Optional cumulative] | -- |

**Key:**  
F = Formative | S = Summative | B = District Benchmark | ST = State Test | AP = AP/IB Exam

---

### Spiral Skills Tracker

| Skill / Standard | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 |
|------------------|----|----|----|----|----|----|----|----|
| [Skill 1] | Introduce | Develop | Develop | Assess | Maintain | Maintain | -- | -- |
| [Skill 2] | -- | Introduce | Develop | -- | Assess | Maintain | Maintain | -- |
| [Skill 3] | Develop | -- | -- | Introduce | Develop | Assess | -- | Maintain |

**Key:** Introduce = First formal exposure | Develop = Structured practice with feedback | Assess = Formal evaluation | Maintain = Embedded but not primary focus

---

### Standards Coverage Audit

| Standard Code | Standard Description | Unit(s) Where Addressed | Spiral? |
|---------------|---------------------|-------------------------|---------|
| [Code] | [Description] | Unit [N] (primary), Unit [M] (spiral) | Yes / No |
| [Code] | [Description] | Unit [N] (primary) | No |
| [UNCOVERED] | [Description] | NOT MAPPED -- [reason] | -- |

---

### Vertical Alignment Notes

**Prerequisites (course that typically precedes this one):** [Course name]
- Students should arrive with mastery of: [2-4 specific skills or concepts]
- Early units that depend on these foundations: [Unit names]

**Subsequent Course:** [Course name]
- This course prepares students for: [2-4 specific skills or concepts]
- Units that most directly build that readiness: [Unit names]
```

---

## Rules

1. **Never produce a unit without a standard code.** Every unit must reference at least one standard by its exact code from the specified framework. Unit titles alone are insufficient. If the educator has not named a standards framework, stop and ask before building any unit.

2. **Total unit durations must sum to stated instructional weeks.** Count explicitly. If the educator says 36 weeks and the units total 34 weeks, the map is wrong. Buffer days count toward the total but must be labeled separately and cannot substitute for instructional unit time.

3. **Prerequisite logic governs sequence, not textbook chapter order.** Textbooks are resources, not curriculum architects. Map the prerequisite chain in Step 2 and use it to override textbook sequencing when the two conflict. Note any deviation from textbook order explicitly in Map Notes.

4. **Buffer time is a design requirement, not a luxury.** A minimum of 5% of instructional weeks (about 7-9 days in a 36-week year) must be explicitly allocated as buffer. Buffer days must be distributed across the year -- at least one buffer period after every 8-9 weeks of instruction, not stockpiled at the end.

5. **No unit may use the same summative assessment type as more than two consecutive units.** Across the full course, no single format (e.g., multiple choice test) should account for more than 40% of all summative assessments. If the educator specifies all tests, note the limitation and suggest alternatives.

6. **Every formative assessment checkpoint must include a decision rule.** A formative check that does not specify what the teacher does with the data is just a grade, not a formative assessment. The decision rule format is: "If fewer than 70% of students demonstrate [standard], do [specific reteach action] before proceeding."

7. **Spiral standards must appear in the Spiral Skills Tracker with explicit stage labels.** A standard cannot jump from Introduce to Assess in consecutive units without a Develop stage in between. This rule prevents curriculum maps that formally assess skills students have had only one week to practice.

8. **Fixed external milestones are immovable.** AP exam dates, state testing windows, and IB submission deadlines must be placed in the Assessment Calendar first. No summative assessment may be scheduled during a district benchmark testing week or within three days of the AP/IB exam. Build the rest of the calendar around these anchors.

9. **Every standard in the framework must be accounted for in the Standards Coverage Audit.** Standards that are not covered by any unit must be flagged explicitly with a note explaining why (e.g., "6.G.3 -- drawing polygons in the coordinate plane -- appears in Unit 7 as a Maintain standard tied to 6.NS.6"). Silence is not acceptable; an unmapped standard may be a compliance issue for the educator.

10. **Do not generate a partial map and offer to continue.** A curriculum map is a whole document; a partial map is not usable. If the educator's request is long or complex, produce the complete map in one response. If the total output would exceed practical limits, produce the Course Overview and all Unit sections first, then produce the Assessment Calendar, Spiral Tracker, and Standards Audit as a continuation -- but always complete both parts.

11. **Essential questions must be open-ended and intellectually substantive.** A question answerable with a single word or definition is not an essential question. Run this test: if a content expert could answer the question in one sentence without making a judgment call, rewrite it.

12. **For AP and IB courses, use the official Course and Exam Description or subject guide as the primary standards document.** Do not map AP courses to state standards or CCSS -- the College Board and IB frameworks supersede state frameworks for these courses. The CED's Science Practices / Historical Thinking Skills / Mathematical Practices must appear as tracked skills in the Spiral Skills Tracker alongside content standards.

---

## Edge Cases

### New Course With No Prior Curriculum or Textbook
When an educator is building from scratch with only a standards document or course description, apply the following approach: generate the Standards Inventory from the official framework document, cluster standards by conceptual coherence (not by arbitrary topic), and sequence clusters by the strictest prerequisite logic available. Label the entire map as "Draft -- Year 1" and add a prominent note in the header: "This map should be treated as a working hypothesis. Annotate actual pacing throughout the year and revise after the first full implementation cycle." Suggest the educator audit the map at the end of each unit and record actual completion weeks in a parallel column.

### AP or IB Course With Exam-Mandated Content and Timing
For AP courses, the College Board CED specifies the percentage of exam questions per unit -- use this to weight instructional time. If AP Biology Unit 3 (Cellular Energetics) accounts for 12-16% of the exam, it should receive proportionally more instructional time than a unit weighted at 6-8%. Place the AP exam date as the first fixed anchor and work backward: 3 weeks of AP exam review before the exam date, full content instruction completed 3 weeks before that review period begins. Post-exam time (typically 2-4 weeks remaining in the school year) should be explicitly planned as enrichment, independent research, or college-transition skills -- not dead time. For IB courses, IA (Internal Assessment) submission deadlines are fixed and require dedicated in-class time for research, drafting, and revision -- map these as a distinct strand running alongside content units.

### Block Schedule Courses (90-Minute Periods)
A 90-minute block meets every day in a semester course, producing the equivalent of a full year of instruction in 18 weeks. Compress unit count to 6-9 units. Recalibrate pacing: 1 week of block instruction equals approximately 2 weeks of traditional instruction in content coverage, but the increased class time per session allows for more project-based and inquiry-based learning within each unit. Formative assessment density should increase (daily exit tickets are feasible in block scheduling); summative assessments can be more complex because students have extended in-class work time. Note explicitly in the map header that all week references are block-schedule weeks.

### Educator Has a District-Mandated Unit Order That Conflicts With Prerequisite Logic
This is a real constraint in many districts. When the required order violates the dependency chain identified in Step 2 (e.g., the district mandates teaching geometry before number systems in 6th grade, but students need number sense to work with area formulas), note the conflict explicitly in Map Notes: "District pacing requires Unit X before Unit Y. This places [Standard A] before its prerequisite [Standard B]. Recommend spending the first week of Unit X building prerequisite vocabulary and number sense through [specific bridge activity] before introducing the full geometry content." Never silently accept a sequence that will cause instructional problems; flag it so the educator can advocate for change or plan a mitigation strategy.

### Multi-Section Horizontal Alignment (Multiple Teachers, Same Course)
When the map is intended for a department or team rather than a single teacher, add a "Pacing Coordination" section after the Assessment Calendar. Include: a week-by-week milestone chart showing where all sections should be at the end of each week (with a stated tolerance of ±1 week), a protocol for what to do when one section falls significantly behind (defined as more than 2 weeks behind the map), and a list of which formative assessments are common across sections (used for data team analysis) versus teacher-designed. Common summative assessments should be identified and administered within the same 1-week window across all sections to allow fair comparison of results.

### Standards That Are Genuinely Too Dense to Cover Thoroughly
Occasionally the number of standards in a framework exceeds what can be meaningfully taught in the available instructional time. This is particularly common in middle school science when states adopt full NGSS and have only 5 periods per week. When this occurs: identify which standards are explicitly tested on high-stakes assessments (state test, AP exam) and mark them as Priority 1; identify standards that are prerequisite to subsequent courses and mark them as Priority 2; identify standards that are addressed at other grade levels or in other courses and mark them as Priority 3 (these can receive lighter treatment). Note this prioritization transparently in the Standards Coverage Audit with a rationale column. Never quietly omit standards -- always document which ones received reduced instructional time and why.

### Course Revision (Updating an Existing Map)
When an educator brings an existing curriculum map for revision, treat it as a diagnostic exercise before redesigning. Ask: (1) Which units ran significantly over or under the planned time last year? (2) Which summative assessments did not produce useful data about student mastery? (3) Which standards showed persistent low performance on the end-of-year assessment? (4) Have the standards framework or external assessment specifications changed since the last map was created? Use the answers to prioritize revisions: pacing adjustments first, then assessment redesign, then sequence changes. Avoid redesigning units that worked well simply for the sake of change. Mark revised units with a "Rev." flag in the Course Overview table so the educator knows which parts are new.

### Interdisciplinary or Team-Taught Courses
Courses designed to be taught jointly by two teachers (e.g., a "Humanities" block combining ELA and History, or an "Integrated STEM" course) require a curriculum map that explicitly names which teacher is responsible for which standards within each unit, where instruction is genuinely integrated versus parallel, and how summative assessments incorporate both disciplines. The Spiral Skills Tracker should include skills from both subject areas. Formative assessment decision rules must be coordinated so both teachers respond to data from the same checkpoints. If the two subjects have different external assessment timelines (e.g., the English component has a state ELA test and the history component does not), both timelines must appear in the Assessment Calendar.

---

## Example

**Input:** "I need a full-year curriculum map for 11th grade AP US History. We follow the College Board AP US History CED (2020). I have 36 instructional weeks, 5 days per week, traditional 50-minute periods. The AP exam is in early May (Week 34). My district runs a benchmark in Week 10 and another in Week 25. Primary resource is the Kennedy textbook (The American Pageant, 17th ed.). I want to know where to put the DBQ and LEQ practice."

---

**Output:**

## Curriculum Map: AP United States History (APUSH)

**Map Version:** Draft  
**Prepared for:** 11th Grade APUSH Instructor  
**Subject:** Social Studies / History  
**Grade / Level:** 11th Grade -- AP Course  
**Duration:** Full Year -- 36 instructional weeks, 180 instructional days  
**Standards Framework:** College Board AP United States History Course and Exam Description (2020)  
**Primary Resources:** Kennedy, Cohen & Piehl, *The American Pageant* (17th ed.); College Board AP Classroom  
**Fixed External Milestones:** AP Exam -- Week 34 (early May); District Benchmark 1 -- Week 10; District Benchmark 2 -- Week 25

---

### Map Notes and Assumptions
- AP exam date assumed to fall in the first week of May (approximately Week 34 of a late-August start). Adjust the calendar if your school year starts in September -- the exam week becomes Week 33.
- The AP exam covers Period 1 (1491) through Period 9 (1980-present), with greatest weighting on Periods 3-8 (approximately 80% of exam). Instructional time is weighted accordingly.
- DBQ (Document-Based Question) and LEQ (Long Essay Question) practice are embedded as recurring instructional events and tracked in the Spiral Skills Tracker.
- Post-AP-exam period (Weeks 35-36) is planned as enrichment -- adjust based on your school's end-of-year policies.
- "American Pageant" chapter references are provided as resource guides only; unit boundaries do not mirror chapter breaks.

---

### Course-Level Enduring Understandings
1. American history is shaped by ongoing tensions between ideals of liberty and equality and the realities of exclusion, exploitation, and inequality -- understanding these tensions requires analyzing multiple perspectives across time.
2. Political, economic, social, and cultural forces interact and drive historical change; no single cause fully explains any major development.
3. American identity has been continuously contested and redefined through conflict, migration, reform movements, and interaction with the wider world.
4. Historical thinking -- including contextualization, causation, continuity and change over time, and argumentation -- is the central skill of this course, not content recall alone.

---

### Course Overview

| Unit | Title | Duration | AP Periods Covered | Summative Assessment | Assessment Type |
|------|-------|----------|--------------------|----------------------|-----------------|
| 1 | Contact, Colonization, and Colonial Societies | 4 wks | Periods 1-2 (1491-1754) | DBQ practice essay (scored with AP rubric) | Constructed response |
| 2 | Revolution, Constitution, and the Early Republic | 4 wks | Period 3 (1754-1800) | LEQ + document analysis | Constructed response |
| 3 | The New Nation and the Market Revolution | 4 wks | Period 4 (1800-1848) | Structured academic controversy + LEQ | Mixed performance |
| 4 | Sectional Crisis, Civil War, and Reconstruction | 5 wks | Period 5 (1844-1877) | Full DBQ (timed, AP conditions) | Constructed response |
| 5 | Industrialization, Immigration, and the Gilded Age | 3 wks | Period 6 (1865-1898) | SAQ + thematic essay | Mixed constructed response |
| 6 | Progressive Era, Imperialism, and WWI | 4 wks | Period 7, Part 1 (1898-1920) | LEQ (continuity and change over time) | Constructed response |
| 7 | Interwar Period, Great Depression, and WWII | 4 wks | Period 7, Part 2 / Period 8, Part 1 (1920-1945) | Document analysis + LEQ | Constructed response |
| 8 | Cold War, Civil Rights, and Postwar America | 4 wks | Period 8, Part 2 (1945-1980) | Full DBQ (timed, AP conditions) | Constructed response |
| 9 | AP Exam Review | 3 wks | All periods | Cumulative timed practice (DBQ + MCQ + SAQ) | Full AP simulation |
| [Buffer] | Flex / Reteach Days | 7 days | -- | -- | -- |

**Total instructional weeks mapped:** 36  
**Buffer time:** 7 days (≈ 4% of instructional time) -- distributed after Units 2, 4, 6, and 8 (1-2 days each)  
**Standards coverage:** All 9 AP USHS periods addressed; all 9 AP Historical Thinking Skills tracked in Spiral Skills Tracker

---

### Unit 1: Contact, Colonization, and Colonial Societies (4 weeks -- Weeks 1-4)

**Essential Question:** Whose perspectives, interests, and experiences have shaped our understanding of the "founding" of America -- and whose have been systematically excluded?

**Standards Addressed:**
| Code | Standard Description | Stage in This Unit |
|------|----------------------|--------------------|
| KC-1.1 | Native American societies before European contact | Primary / Assessed |
| KC-1.2 | European exploration motives and effects | Primary / Assessed |
| KC-2.1 | Colonial regional variation (New England, Chesapeake, Deep South) | Primary / Assessed |
| KC-2.2 | Transatlantic slave trade and development of racial slavery | Primary / Assessed |
| HTS-1 | Contextualization | Introduce |
| HTS-4 | Causation | Introduce |
| WXT-1 | Work, exchange, technology -- labor systems | Introduce |

**Prior Knowledge Required:** Basic world geography (location of Europe, Africa, Americas); timeline literacy; paragraph-level writing

**Learning Progression:**

| Week | Instructional Focus | CRA Stage | Key Activities |
|------|--------------------|-----------|-----------------------------|
| 1 | Pre-Columbian societies; European motives for exploration | Concrete | Primary source analysis (Columbus journal excerpts, Aztec codices); geographic mapping activity |
| 2 | Columbian Exchange; Spanish, French, Dutch, and English colonial patterns | Representational | Comparative chart of colonial regions; small-group document analysis with HAPP annotation protocol |
| 3 | Development of slavery; Chesapeake vs. New England social structures | Representational / Abstract | Structured academic controversy on the origins of racial slavery; short constructed response |
| 4 | Synthesis: multiple perspectives on colonial America; DBQ practice essay | Abstract / Transfer | Timed 45-minute DBQ practice using 3 documents (reduced from 7 for first practice); AP rubric self-assessment |

**Key Vocabulary:**
- *Tier 3 (Domain-specific):* Columbian Exchange, indentured servitude, chattel slavery, mercantilism, encomienda, proprietary colony, headright system, covenant community
- *Tier 2 (Academic):* contextualize, perspective, causation, transformation, hierarchy

**Formative Assessment Checkpoints:**
| Checkpoint | Format | Standard(s) Targeted | Decision Rule |
|------------|--------|----------------------|---------------|
| Exit ticket -- Week 1 | 2-sentence written response: "What is one push factor and one pull factor for English colonization?" | KC-1.2, HTS-4 Causation | If fewer than 70% identify both correctly: reteach push/pull causation framework with additional examples before Week 2 |
| HAPP annotation check -- Week 2 | Spot-check 6 student documents during work time; look for all 4 HAPP categories annotated (Historical Context, Audience, Purpose, Point of View) | HTS-1 Contextualization | If fewer than 4 of 6 students demonstrate complete HAPP: model live annotation on one full document before continuing |
| Short constructed response -- Week 3 | One paragraph: "Explain ONE cause of the development of racial slavery in colonial America." Scored 0-3 using AP rubric. | KC-2.2, HTS-4 | If median score < 2/3: workshop the thesis statement and evidence use before the Unit 1 DBQ |

**Summative Assessment:** Unit 1 DBQ Practice Essay
- *Type:* Constructed response -- Document-Based Question
- *Standards Assessed:* KC-1.2, KC-2.1, KC-2.2, HTS-1 (Contextualization), HTS-4 (Causation), HTS-6 (Argumentation)
- *Cognitive Demand:* DOK 4 -- Extended Thinking (synthesizes multiple documents into an original argument)
- *Description:* Students write a full DBQ essay in 60 minutes using 3 primary source documents (reduced from the full AP set of 7) on a prompt about colonial labor systems. Essays are scored using the College Board's 7-point DBQ rubric. Students complete a structured self-assessment after receiving their score.
- *Scoring:* 7-point AP DBQ rubric (Thesis 1pt, Contextualization 1pt, Evidence 3pts, Analysis/Reasoning 2pts). Students review their rubric score and set one revision goal for the next DBQ.

**Differentiation:**
- *Scaffolding:* Provide a pre-filled HAPP graphic organizer for the first two documents in the DBQ practice; students complete the remaining documents independently
- *Extension:* Students who score 6-7/7 on the Unit 1 DBQ analyze a historiographical debate (e.g., Morgan's *American Slavery, American Freedom*) and write a one-page analysis of how historians' arguments compare to the documents

**Cross-Cutting Connections:**
- *Horizontal:* English 11 -- analytical writing skills; the HAPP protocol mirrors the rhetorical analysis framework used in AP Language and Composition
- *Vertical:* Builds on 8th grade US History survey (first exposure to colonial period); prepares students for the Period 3 content in Unit 2 by establishing the political and economic context of British North America
- *Real-World Application:* Current debates about how the 1619 Project and traditional textbook narratives frame American origins -- students engage with historiographical controversy, not just historical content

---

### Unit 2: Revolution, Constitution, and the Early Republic (4 weeks -- Weeks 5-8)

**Essential Question:** Was the American Revolution truly revolutionary -- and for whom?

**Standards Addressed:**
| Code | Standard Description | Stage in This Unit |
|------|----------------------|--------------------|
| KC-3.1 | Imperial tensions and colonial resistance | Primary / Assessed |
| KC-3.2 | The Revolution's ideals and their limits (women, enslaved people, Native Americans) | Primary / Assessed |
| KC-3.3 | Articles of Confederation and the Constitutional Convention | Primary / Assessed |
| HTS-1 | Contextualization | Develop |
| HTS-2 | Comparison | Introduce |
| HTS-5 | Continuity and Change Over Time | Introduce |

**Prior Knowledge Required:** Colonial regional economies and social structures (Unit 1); British imperial governance model

**Learning Progression:**

| Week | Instructional Focus | CRA Stage | Key Activities |
|------|--------------------|-----------|-----------------------------|
| 5 | Imperial crisis: Proclamation of 1763 through the Declaration of Independence | Concrete | Timeline construction; close reading of Declaration; Loyalist vs. Patriot perspectives exercise |
| 6 | Social outcomes of the Revolution for different groups | Representational | Jigsaw reading on women, enslaved people, and Native Americans; CCOT paragraph practice |
| 7 | Constitutional design: Federalists vs. Anti-Federalists; Bill of Rights | Abstract | Socratic seminar on Federalist No. 10; LEQ thesis workshop |
| 8 | Synthesis + LEQ + 1-day buffer | Transfer | Timed LEQ (45 minutes); peer scoring using AP rubric |

**Key Vocabulary:**
- *Tier 3:* republicanism, natural rights, popular sovereignty, federalism, checks and balances, enumerated powers, implied powers, bicameralism, ratification
- *Tier 2:* transformation, continuity, ideology, representation, legitimacy

**Formative Assessment Checkpoints:**
| Checkpoint | Format | Standard(s) Targeted | Decision Rule |
|------------|--------|----------------------|---------------|
| Perspectives chart -- Week 6 | Students complete a 4-row chart (colonists, enslaved people, women, Native Americans) comparing each group's experience of the Revolution | KC-3.2, HTS-2 Comparison | If more than 30% of charts have only 2 rows completed: assign targeted reading on the missing group before Week 7 |
| LEQ thesis draft -- Week 7 | Students submit a handwritten thesis in response to a practice LEQ prompt; teacher provides written feedback within 24 hours | HTS-6 Argumentation | If fewer than 60% of theses contain a historically defensible claim + line of reasoning: dedicate 20 minutes of Week 8 Day 1 to thesis repair workshop |

**Summative Assessment:** Unit 2 LEQ + Document Analysis
- *Type:* Constructed response -- Long Essay Question + short document analysis
- *Standards Assessed:* KC-3.1, KC-3.2, KC-3.3, HTS-5 (Continuity and Change Over Time), HTS-6 (Argumentation)
- *Cognitive Demand:* DOK 3-4
- *Description:* Part 1 -- timed 45-minute LEQ on whether the Revolution represented meaningful change or fundamental continuity for one specified group. Part 2 -- 15-minute analysis of one primary source document using the SAQ format. Total testing time: 60 minutes.
- *Scoring:* LEQ scored on College Board 6-point LEQ rubric; SAQ scored 0-3. Combined score reported to students.

**Differentiation:**
- *Scaffolding:* Provide an LEQ outline template with labeled sections (thesis, contextualization, three pieces of evidence, analysis) for students who scored below 3/6 on Unit 1 DBQ
- *Extension:* Students debate: "Was the Constitution a betrayal of revolutionary ideals?" using primary sources from the Ratification debates (Federalist No. 51 vs. Letters of Brutus)

**Cross-Cutting Connections:**
- *Horizontal:* AP Government (if co-enrolled) -- the Constitutional design unit directly parallels AP Gov Unit 1
- *Vertical:* Prepares for Period 4 content (Unit 3) by establishing the ideological framework that drives Jacksonian democracy debates
- *Real-World Application:* Current debates about constitutional originalism vs. living constitutionalism; Electoral College reform debates

---

*(Units 3-9 follow the same format. Below is the Assessment Calendar and Tracking Tables, which complete the map.)*

---

### Assessment Calendar

| Week | Unit | Formative Checkpoints | Summative Assessment | District / State Events |
|------|------|----------------------|----------------------|-------------------------|
| 1-4 | Unit 1: Contact & Colonization | Exit ticket (Wk 1); HAPP check (Wk 2); short CR (Wk 3) | DBQ Practice Essay (Wk 4) | -- |
| 5-8 | Unit 2: Revolution & Constitution | Perspectives chart (Wk 6); LEQ thesis draft (Wk 7) | LEQ + SAQ (Wk 8) | -- |
| 9 | Buffer + Unit 2 reteach | -- | -- | -- |
| 10 | Unit 3 begins | Exit ticket | -- | **District Benchmark 1 (Wk 10)** |
| 11-13 | Unit 3: New Nation / Market Revolution | Mid-unit quiz (Wk 11); SAQ practice (Wk 12) | SAC + LEQ (Wk 13) | -- |
| 14-17 | Unit 4: Sectional Crisis, Civil War, Reconstruction | Document annotation (Wk 14); Mid-unit DBQ thesis (Wk 16) | Full DBQ -- Timed, AP Conditions (Wk 17) | -- |
| 17 | 1-day buffer | -- | -- | -- |
| 18-20 | Unit 5: Industrialization & Gilded Age | Exit tickets; comparison chart (Wk 19) | SAQ Set + Thematic Essay (Wk 20) | -- |
| 21-24 | Unit 6: Progressive Era, Imperialism, WWI | LEQ thesis workshop (Wk 22); peer scoring (Wk 23) | CCOT LEQ (Wk 24) | -- |
| 24 | 1-day buffer | -- | -- | -- |
| 25 | Unit 7 begins | Exit ticket | -- | **District Benchmark 2 (Wk 25)** |
| 25-28 | Unit 7: Interwar, Depression, WWII | Mid-unit quiz (Wk 26); document analysis (Wk 27) | LEQ + Document Analysis (Wk 28) | -- |
| 29-32 | Unit 8: Cold War, Civil Rights | SAQ practice (Wk 29); DBQ thesis draft (Wk 31) | Full DBQ -- Timed, AP Conditions (Wk 32) | -- |
| 32 | 1-day buffer | -- | -- | -- |
| 33-35 | Unit 9: AP Exam Review | Daily MCQ practice sets; SAQ timed practice; DBQ timed practice | Full AP Practice Exam simulation (Wk 33) | **AP EXAM (Wk 34)** |
| 35-36 | Post-Exam Enrichment | Reflection + independent inquiry | Enrichment presentation (optional) | -- |

**Key:** F = Formative | S = Summative | B = District Benchmark | AP = AP Exam

---

### Spiral Skills Tracker: AP Historical Thinking Skills

| Skill | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 |
|-------|----|----|----|----|----|----|----|----|-----|
| Contextualization (HTS-1) | Introduce | Develop | Develop |
