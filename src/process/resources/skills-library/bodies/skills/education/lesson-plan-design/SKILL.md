---
name: lesson-plan-design
description: |
  Creates complete, standards-aligned lesson plans using backward design methodology for any subject and grade level. Produces a filled-in lesson plan document with learning objectives, materials list, step-by-step procedure, assessment strategy, and differentiation notes -- not guidance on how to write one.
  Use when an educator asks to create a lesson plan, design a lesson, plan a class session, or build instructional materials for a specific topic.
  Do NOT use for full curriculum or unit planning (use `curriculum-mapping`), assessment-only design (use `assessment-design`), or student study plans (use `study-plan`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "lesson-plan teaching curriculum step-by-step"
  category: "education"
  subcategory: "teaching"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Lesson Plan Design

## When to Use

**Use this skill when:**
- An educator requests a complete, ready-to-use lesson plan for a specific topic, grade level, and class duration (e.g., "Write me a lesson plan on the American Revolution for 8th grade")
- A teacher wants a single class session designed with learning objectives, procedures, materials, and assessment -- even if they use informal language like "plan a class," "design a lesson," or "help me teach [topic]"
- An instructor needs instructional materials for a workshop, professional development session, tutoring session, or community education class on a defined topic
- A user provides a set of standards or learning outcomes and wants a lesson built backward from those outcomes
- A teacher is adapting an existing lesson for a new grade level, different class duration, or different delivery format (in-person to hybrid, general education to inclusion)
- A user mentions backward design (Wiggins and McTighe's Understanding by Design), the 5E Instructional Model, or other named frameworks and wants a lesson generated using that structure
- An educator specifies a particular teaching context such as a flipped classroom, project-based learning session, or Socratic seminar and needs the full plan built out

**Do NOT use when:**
- The user wants a multi-lesson arc, thematic unit, or semester-long curriculum map -- use `curriculum-mapping` instead, which sequences standards across time and establishes pacing
- The request is exclusively for assessment instrument design (rubric, test, performance task) without a surrounding lesson -- use `assessment-design` instead
- A student is asking for help studying, reviewing material, or preparing for an exam -- use `study-plan` instead, which is learner-facing rather than educator-facing
- The user needs an Individualized Education Program (IEP) goal or a 504 accommodation plan -- these are legal documents requiring specialized knowledge beyond lesson planning
- The user wants a complete professional development curriculum or training program for adult employees rather than a single instructional session -- consult `curriculum-mapping`
- The request is for tutoring session notes or flashcard sets for a single student rather than a classroom lesson

---

## Process

### Step 1 -- Gather Lesson Context Before Writing Anything

If the user's request is missing critical information, ask for it in a single consolidated message rather than multiple back-and-forth exchanges. The minimum viable inputs are: subject/topic, grade level or audience, and class duration. Everything else can be inferred or flagged as a note.

- **Subject and topic specificity**: Distinguish between the broad subject ("science") and the specific lesson topic ("density and buoyancy -- Day 1 of a 3-day sequence"). A vague topic like "fractions" requires follow-up: which fraction concept -- introducing equivalent fractions, comparing fractions with unlike denominators, fraction division? The lesson plan cannot be written without this distinction.
- **Grade level or audience**: For K-12, grade determines Lexile reading level, cognitive developmental stage (per Piaget's framework), and applicable standards. For adult learners, clarify whether audience is college students, professional development participants, or community adult learners -- the instructional approach differs substantially.
- **Class duration**: This is the single biggest structural variable. Map duration to format: 45-50 minutes = standard single period; 80-90 minutes = block schedule; 120+ minutes = workshop or lab; under 30 minutes = mini-lesson. Each format has a different procedure structure.
- **Standards framework**: Ask which system governs this lesson -- Common Core State Standards (CCSS) for ELA and math, Next Generation Science Standards (NGSS), College, Career, and Civic Life (C3) Framework for social studies, National Core Arts Standards, state-specific standards (Texas TEKS, Virginia SOL, California Content Standards), IB curriculum, or AP course descriptions. Without this, note that alignment should be added and proceed with Bloom's-anchored objectives.
- **Classroom composition**: Approximate class size matters (whole-class vs. small-group structures differ for 15 vs. 35 students). Ask about known diversity considerations: English Language Learners (ELL), students with IEPs or 504 plans, gifted learners, wide range of prior knowledge.
- **Available resources**: Technology access (1:1 devices, computer lab, shared carts, no technology), physical materials (lab equipment, art supplies, textbooks), and room configuration (fixed rows, flexible seating, tables) all constrain and shape instructional choices.
- **Prior knowledge baseline**: What did students learn in the preceding lesson or unit? This determines where direct instruction can begin and what background the hook can activate.

### Step 2 -- Write Measurable Learning Objectives Using Backward Design

Before designing any activities, establish what students must be able to do by lesson's end. This is Stage 1 of Understanding by Design (UbD): identify desired results.

- **Write 2-4 objectives** for a standard 50-minute lesson. A 90-minute block can support up to 5 objectives. Fewer than 2 suggests the lesson lacks instructional substance; more than 4 for 50 minutes indicates content overload -- split into multiple lessons.
- **Use Bloom's Revised Taxonomy action verbs** that are observable and measurable. Lower-order: *define, recall, identify, label, list, match, state, recognize*. Mid-order: *explain, describe, classify, compare, contrast, summarize, paraphrase, interpret, predict*. Higher-order: *analyze, differentiate, distinguish, evaluate, justify, critique, design, construct, produce, argue*. Never use *understand*, *know*, *appreciate*, or *be aware of* -- these are unobservable.
- **Apply the ABCD objective formula**: Audience (who) + Behavior (Bloom's verb + observable action) + Condition (given what context, tool, or constraints) + Degree (to what standard of accuracy or completeness). Example: "Given a data table of moth population counts across 5 generations (C), 10th-grade students (A) will construct a graph and write a 2-sentence explanation (B) that correctly identifies the advantageous trait and names at least 2 of the 4 conditions of natural selection (D)."
- **Sequence objectives from lower to higher order** within the lesson. Students should recall or identify key terms before they analyze or evaluate. The cognitive demand should escalate as the lesson progresses.
- **Tag each objective to a standard code** using exact language from the framework. For NGSS, cite the Performance Expectation (HS-LS4-3), not just the disciplinary core idea. For CCSS ELA, cite strand, grade, and standard number (CCSS.ELA-LITERACY.RI.8.6).
- **Translate educator-supplied vague goals** into measurable form. If a teacher says "I want students to understand the water cycle," rewrite as: "Students will label the stages of the water cycle (evaporation, condensation, precipitation, collection) on a blank diagram with 100% accuracy" (knowledge level) and "Students will explain why coastal areas receive more precipitation than inland deserts using at least 2 water cycle processes" (comprehension/application level).

### Step 3 -- Design the Assessment Strategy (Stage 2 of UbD)

Assessment design must happen before procedure design. Determining how you will know students met the objectives shapes every instructional decision that follows.

- **Map each objective to an assessment method** in a one-to-one relationship. Lower-order objectives (recall, identify) are efficiently assessed via exit tickets, quick polls, cold-calling with wait time, or whiteboards. Mid-order objectives (explain, compare) work well with think-pair-share, brief written responses, or graphic organizers. Higher-order objectives (analyze, evaluate, construct) require performance tasks, extended written responses, or demonstrated products.
- **Embed at least one formative assessment in the middle of the lesson**, not only at the end. Effective mid-lesson checks include: 3-2-1 cards (3 things learned, 2 questions, 1 connection), thumbs up/thumbs down/thumbs sideways polls, mini-whiteboards with concepts students hold up simultaneously, fist-to-five confidence checks, or targeted cold-calling using equity sticks (popsicle sticks with student names). These checks create a decision point -- if fewer than 70% of students demonstrate proficiency at the mid-lesson check, the teacher must slow down or reteach before moving on.
- **Define proficiency thresholds explicitly** for each objective. "Correctly identifies the trait" is not sufficient -- specify: "Names the correct trait AND provides at least one piece of numerical evidence from the data table." Rubric criteria should distinguish between levels: does not meet (0-1 of 4 criteria), approaching (2 of 4), meets (3 of 4), exceeds (4 of 4).
- **Choose formative vs. summative deliberately**. A single-period lesson typically uses only formative assessment (exit ticket, observation checklist, quick write). Summative assessment belongs to the end of a unit. If the educator expects a summative measure, note that it should be part of the unit assessment plan rather than built into this lesson.
- **Consider anonymized, simultaneous response formats** to get honest data without social pressure -- mini-whiteboards, Plickers cards, anonymous digital polls, or response cards all students hold up at the same moment prevent students from simply echoing a confident peer's answer.

### Step 4 -- Build the Instructional Procedure with Precise Timing

Now design the activities that will move students from prior knowledge to meeting the objectives. This is Stage 3 of UbD: plan learning experiences and instruction.

- **Standard 50-minute structure** (adjust proportionally for other durations):
  - Opening/Hook: 5-8 minutes -- activates prior knowledge, creates curiosity, establishes relevance
  - Direct Instruction/Modeling: 10-15 minutes -- teacher presents new content; includes think-alouds, worked examples, anchor charts
  - Guided Practice (We Do): 12-18 minutes -- structured activity with teacher support; students practice with feedback
  - Independent or Collaborative Practice (You Do): 10-12 minutes -- students apply with reduced scaffolding
  - Closure: 5-7 minutes -- formative assessment, synthesis, preview of next lesson
  - Total: 42-60 minutes (within range of a 50-minute class after transitions)

- **90-minute block structure**: Add a second cycle of guided/independent practice or a station rotation. Do not simply extend each segment proportionally -- cognitive attention peaks at 15-20 minutes, so build in a processing activity or movement break at the 40-45 minute mark.

- **Opening/Hook design principles**: The hook should create a problem to solve, a surprising fact to explain, a personal connection, or a compelling visual/audio stimulus. It must connect directly to the lesson's objectives -- not just be entertaining. Effective hook formats: a provocative question projected on entry ("If dogs are descended from wolves, why don't all wolves become dogs over time?"), a brief discrepant event (demonstrate a counterintuitive phenomenon), a short primary source or artifact, a 1-2 minute video clip with a specific viewing focus question.

- **Direct Instruction design principles**: Use explicit instruction with I Do/We Do/You Do (Gradual Release of Responsibility). Limit unbroken teacher talk to 10 minutes maximum before inserting a student processing task. For every concept introduced, provide at least one worked example and one non-example. Use visual anchors (anchor charts, graphic organizers projected on the board) that remain visible throughout the lesson for reference. Include strategic questioning during direct instruction using Bloom's hierarchy -- begin with recall ("What do you remember about...?"), move to comprehension ("In your own words, what does this mean?"), then application ("How would this apply if...?").

- **Guided Practice design principles**: The teacher should be actively circulating, not at the front. Design a task that requires students to produce something observable (a labeled diagram, a solved problem, a written paragraph, a graphic organizer) so the teacher can check work in real time. Build in a "stop and check" moment at the midpoint of guided practice where the teacher addresses 2-3 common errors seen while circulating.

- **Independent Practice design principles**: This segment should not introduce new content -- it applies what was taught. For collaborative formats, assign roles within groups (recorder, facilitator, timekeeper, reporter) to prevent social loafing. For truly independent work, ensure students have access to a reference tool (vocabulary list, sentence frames, formula sheet) so they are not stuck waiting for help.

- **Closure design principles**: Exit tickets should take no more than 3-4 minutes and require a specific response, not a reflection on feelings. Best practice is to collect exit tickets at the door as students leave so the teacher can sort them into three piles (mastered, approaching, not yet) before the next class day. Closure should also include a "connecting forward" statement that previews the next lesson and explains why today's content matters in the larger arc of learning.

- **Transition management**: Each transition between segments should be scripted with specific language and a clear signal. Total transition time budget: 3-5 minutes for a 50-minute class. Specify whether students move physically, change tools (put away pencils, open computers), or simply shift cognitive modes.

### Step 5 -- Design Differentiation for Three Learner Profiles

Differentiation is not three separate lessons -- it is modifications to content, process, or product for students whose readiness, learning profile, or interests differ from the design target.

- **Advanced learners -- accelerate depth, not pace**: Resist the urge to assign "more of the same." Instead, increase cognitive demand: require students to evaluate an argument, find a counterexample, design their own version of the activity, or connect the concept to an application domain they are interested in. Techniques: Socratic questioning cards with higher-order prompts, independent extension tasks available after core work is complete, "expert jigsaw" roles where advanced students become domain specialists who teach peers.

- **On-grade learners**: The core lesson as designed. Ensure the lesson does not "teach to the middle" in a way that leaves either tail behind -- the core lesson should be challenging but accessible.

- **Learners needing support -- reduce barriers, not rigor**: Scaffolding reduces cognitive load for specific barriers without eliminating the intellectual challenge. Specific tools: vocabulary preview list with visual examples, sentence frames or starters that preserve the requirement to produce an argument (e.g., "I claim ___ because the data shows ___"), partially completed graphic organizers, worked examples with annotations visible for reference during practice, chunked tasks with explicit stopping points. For English Language Learners specifically, provide bilingual vocabulary lists and allow responses in home language first before English.

- **Apply Universal Design for Learning (UDL) principles** across the whole lesson: provide multiple means of representation (visual diagram AND verbal explanation AND physical model), multiple means of engagement (individual reflection AND partner discussion AND group activity), and multiple means of expression (written response AND verbal explanation AND drawn diagram). When UDL is applied well, differentiation for individual learners is less intensive because the lesson design already removes common barriers.

- **Assign specific UDL accommodations to specific lesson segments**: for example, the anchor chart displayed during direct instruction serves the UDL principle of multiple representations and scaffolds learners needing support throughout the lesson without requiring the teacher to intervene for every student.

### Step 6 -- Compile Materials and Preparation Checklist

Every item in the lesson must have a corresponding entry in the materials list. Vague lists create failed lessons.

- **Physical materials**: List item name + quantity + specification. Not "markers" but "24 dry-erase markers, 1 per student, in a color other than red." Not "handouts" but "28 copies of the Double-Entry Journal template (1 per student) and 7 copies of the Small Group Data Recording Sheet (1 per group)."
- **Digital materials**: List by title and type. Not "a video" but "TED-Ed video 'How do viruses jump from animals to humans?' -- 5 min 16 sec -- queued to timestamp 1:22 for the 3-minute relevant segment." Include the specific tool or platform needed (Google Slides, Desmos graphing calculator, Nearpod, Padlet) and note whether it requires student accounts.
- **Room setup**: Specify desk arrangement (rows, small groups of 4, U-shape, lab stations) and any physical setup requirements (lab safety equipment placed at each station, chart paper posted on walls before class).
- **Pre-class preparation checklist**: Frame as checkboxes in chronological order of when tasks should be completed. Distinguish between tasks needed a day before (print handouts, prepare lab materials) versus tasks needed before class starts (test technology, arrange desks).
- **Teacher reference materials**: Note any content background the teacher should review -- a common misconception list, a key vocabulary glossary, a sample of a correct student response.

### Step 7 -- Add Post-Lesson Reflection Framework

A lesson plan is not complete without a structured reflection tool that the educator uses after teaching.

- Reflection questions must be specific to the objectives and assessment data collected in this lesson -- not generic.
- Prompt the teacher to act on the exit ticket data before the next lesson: if more than 30% of students missed a key objective on the exit ticket, the next lesson must open with reteaching before introducing new content.
- Include a question about pacing: Was the time allocation realistic? Which segment ran long, and what was cut?
- Include a question about differentiation effectiveness: Did the scaffolds reduce the achievement gap, or did the same students who typically struggle still struggle?
- Include a "keep, change, add" frame for rapid revision: What worked well enough to keep exactly? What should change? What should be added next time?

---

## Output Format

Produce the complete lesson plan as a filled-in document. Every field must contain specific, topic-relevant content -- no placeholder brackets left in the final output. The table of contents header and section structure below is the required format.

```
## Lesson Plan: [Specific Topic Title]

**Subject:** [Specific subject area -- e.g., "AP Chemistry," "7th Grade ELA," "Adult ESL -- Intermediate Level"]
**Grade/Level:** [Grade number or audience descriptor]
**Duration:** [Total minutes, format -- e.g., "50 minutes (standard period)," "90 minutes (block schedule)"]
**Class Size:** [Number of students]
**Standards Alignment:**
  - [Standard code]: [Full standard text]
  - [Standard code]: [Full standard text]

---

### Learning Objectives

By the end of this lesson, students will be able to:

| # | Objective (ABCD Format) | Bloom's Level | Aligned Standard |
|---|------------------------|---------------|-----------------|
| 1 | Given [condition], students will [Bloom's verb] [specific outcome] with [degree of accuracy/completeness] | [Level] | [Code] |
| 2 | Given [condition], students will [Bloom's verb] [specific outcome] with [degree of accuracy/completeness] | [Level] | [Code] |
| 3 | Given [condition], students will [Bloom's verb] [specific outcome] with [degree of accuracy/completeness] | [Level] | [Code] |

---

### Materials and Preparation

**Physical Materials:**
- [Item name -- quantity -- specification]
- [Item name -- quantity -- specification]

**Digital Materials and Technology:**
- [Tool/resource name -- purpose -- any platform or access requirement]

**Room Setup:**
- [Specific desk/furniture arrangement]
- [Any posted materials or station setup]

**Preparation Checklist (complete before class):**
- [ ] [Task -- when to complete (day before / 30 min before / immediately before)]
- [ ] [Task -- when to complete]
- [ ] [Task -- when to complete]

---

### Assessment Plan

| Objective | Assessment Method | Format | Proficiency Threshold | Decision Rule |
|-----------|------------------|--------|----------------------|---------------|
| Obj. 1 | [Method] | [Formative/Summative] | [Specific criterion] | [If < X% meet, then...] |
| Obj. 2 | [Method] | [Formative/Summative] | [Specific criterion] | [If < X% meet, then...] |
| Obj. 3 | [Method] | [Formative/Summative] | [Specific criterion] | [If < X% meet, then...] |

**Embedded Mid-Lesson Check:** [Specific method, timing, and what teacher does with results]

---

### Lesson Procedure

**Overview Timeline:**

| Time | Segment | Primary Strategy | Bloom's Level |
|------|---------|-----------------|---------------|
| 0:00-0:XX | Opening/Hook | [Strategy name] | Remember/Understand |
| 0:XX-0:XX | Direct Instruction | [Strategy name] | Understand/Apply |
| 0:XX-0:XX | Guided Practice | [Strategy name] | Apply/Analyze |
| 0:XX-0:XX | Independent/Collaborative Practice | [Strategy name] | Analyze/Evaluate |
| 0:XX-0:XX | Closure | [Strategy name] | Evaluate/Synthesize |

---

#### Segment 1: Opening/Hook ([X] min)

**Purpose:** Activate prior knowledge and create cognitive investment in the lesson question.

**Teacher Actions:**
[Specific, scripted or semi-scripted description of what the teacher says and does, including exact questions to pose]

**Student Actions:**
[Observable student behavior expected -- what students produce, say, or do]

**Transition to next segment:**
[Specific signal or language the teacher uses to move to direct instruction]

---

#### Segment 2: Direct Instruction ([X] min)

**Purpose:** Build conceptual understanding of [specific concept]; introduce [specific vocabulary/skill/procedure].

**Key Content Points to Cover:**
1. [Specific content point with common misconception to address]
2. [Specific content point with concrete example and non-example]
3. [Specific content point with visual or anchor reference]

**Teacher Actions:**
[Detailed description of instructional moves: think-aloud, modeling, worked example, questioning sequence]

**Checking for Understanding During Instruction:**
[Question or quick check embedded at the 5-7 minute mark to confirm students are following before continuing]

**Student Actions:**
[What students do during direct instruction -- note-taking format, responding to questions, completing an anchor chart]

**Transition to next segment:**
[Specific signal and setup instruction for guided practice]

---

#### Segment 3: Guided Practice ([X] min)

**Purpose:** Apply [specific concept/skill] with teacher support and peer collaboration.

**Task Description:**
[Complete description of the guided practice activity, including the specific prompt, materials, and expected output]

**Grouping:** [Individual / Pairs / Groups of 3-4 -- include role assignments if groups]

**Teacher Actions:**
[Circulation pattern, specific guiding questions to ask groups, what to look for and how to respond to common errors]

**Mid-Lesson Formative Check (at ~[X] min):**
[Specific method: what teacher asks, how students respond simultaneously, what the teacher does with the information before continuing]

**Student Actions:**
[Observable student behavior and expected product of the guided practice task]

**Transition to next segment:**
[How teacher signals end of guided practice and sets up independent practice]

---

#### Segment 4: Independent / Collaborative Practice ([X] min)

**Purpose:** Demonstrate [specific skill/concept application] with reduced scaffolding.

**Task Description:**
[Full description of the practice task: prompt, materials, expected product, time allocation per sub-task]

**Grouping:** [Individual or collaborative -- rationale for choice given the objective]

**Teacher Actions:**
[Circulation, targeted support for learners needing scaffolding, challenge prompt for advanced learners]

**Student Actions:**
[Observable behavior and product expected]

**Transition to closure:**
[Specific signal and cleanup or transition step]

---

#### Segment 5: Closure ([X] min)

**Purpose:** Consolidate learning, conduct formative assessment, and connect to the next lesson.

**Exit Ticket Prompt:**
[Exact text of the exit ticket question(s) -- must be answered in 3-4 minutes]

**Teacher Actions:**
[How to administer the exit ticket, how to collect it, what to do with results before next class]

**Connecting Forward:**
[Specific statement the teacher makes linking today's learning to the next lesson]

---

### Differentiation

| Learner Profile | Content Modification | Process Modification | Product Modification |
|----------------|---------------------|---------------------|---------------------|
| Advanced | [Specific extension -- deeper question, harder case, design task] | [Different process -- independent inquiry, peer teaching role] | [Alternative product -- extended argument, created artifact] |
| On-Grade | [Core lesson as designed] | [Core process as designed] | [Core product as designed] |
| Needing Support | [Scaffold -- reduced complexity, vocabulary list, worked example] | [Modified process -- sentence frames, partnering, chunked task] | [Scaffold -- partially completed template, oral response option] |
| English Language Learners | [Bilingual vocabulary, visual supports, translated materials] | [Extended think time, home language discussion before English] | [Graphic response option, oral explanation accepted] |

**UDL Notes:**
- Multiple Means of Representation: [Specific examples in this lesson]
- Multiple Means of Engagement: [Specific examples in this lesson]
- Multiple Means of Expression: [Specific examples in this lesson]

---

### Teacher Reflection (Complete Within 24 Hours of Teaching)

**Objective Attainment (based on exit ticket data):**

| Objective | % Students Proficient | Evidence Source | Action Needed Before Next Lesson |
|-----------|-----------------------|-----------------|----------------------------------|
| Obj. 1 | ___% | [Source] | [If <70%: reteach. If 70-85%: targeted small group. If >85%: proceed] |
| Obj. 2 | ___% | [Source] | [Action] |
| Obj. 3 | ___% | [Source] | [Action] |

**Pacing Notes:**
- Which segment ran over time?
- What was skipped or shortened?
- Recommended timing adjustment for next use:

**Differentiation Effectiveness:**
- Did scaffolds reduce barriers for learners needing support? Observation:
- Did extension tasks adequately challenge advanced learners? Observation:

**Keep / Change / Add:**
- Keep:
- Change:
- Add:
```

---

## Rules

1. **NEVER produce a lesson plan with unobservable objectives.** Verbs like "understand," "know," "appreciate," "be familiar with," or "learn about" are unacceptable -- they cannot be measured. If a user provides these as goals, rewrite them into Bloom's action verbs before proceeding.

2. **ALWAYS verify that time allocations sum to the stated class duration.** Off-by-one-minute is acceptable; a procedure that totals 40 minutes for a 50-minute class, or 60 minutes for a 50-minute class, is a usability failure. Build in 2-3 minutes of transition time within the period as part of the total.

3. **NEVER write fewer than 2 or more than 4 learning objectives for a 50-minute lesson.** One objective is too thin to justify a full class period. Five or more for 50 minutes creates cognitive overload and a rushed procedure. Scale: 2-3 objectives for 50 min, 3-5 for 90 min.

4. **ALWAYS include at least one embedded mid-lesson formative assessment** -- not just an exit ticket at the end. The mid-lesson check must occur before the lesson's most cognitively demanding segment so that the teacher has a decision point: slow down/reteach or proceed. Specify a decision rule: if fewer than 70% of students demonstrate proficiency at the check, what does the teacher do?

5. **NEVER allow the hook to be decorative.** The opening must directly set up the driving question or problem that the lesson's objectives will answer. A fun fact that does not connect to the lesson's objectives wastes 5-7 minutes and leaves students without a mental framework for the new content.

6. **ALWAYS specify materials by name, quantity, and specification.** "Handouts" is not a materials entry. "28 copies of the Argument Analysis graphic organizer (double-sided, 1 per student)" is acceptable. Vague materials lists produce prep failures.

7. **NEVER conflate formative and summative assessment.** A single 50-minute lesson should use only formative assessment (exit ticket, observation, quick write). If the user asks for a summative assessment in the lesson, explain that summative measures belong at the unit level and offer to design one separately using `assessment-design`.

8. **ALWAYS design differentiation as depth modification, not quantity modification.** Assigning advanced learners more problems of the same type is not differentiation -- it is punishment for competence. Extension tasks must increase cognitive demand (higher Bloom's level, greater transfer, more complex constraint) rather than increase volume.

9. **ALWAYS tag objectives to specific standard codes** if the user specifies a standards framework. Do not write "aligned to NGSS" -- write "NGSS HS-LS4-3" with full text. If the user names a state but no specific standard, note the framework and flag that the teacher should confirm specific code alignment against their pacing guide.

10. **NEVER skip the Teacher Reflection section.** Lesson plans that lack a reflection framework become static documents that are reused unchanged. The reflection must include a decision rule for what happens before the next class if students did not meet objectives -- this makes the lesson plan part of a responsive instructional cycle rather than a one-time script.

11. **ALWAYS design the procedure for real classrooms, not ideal ones.** Include what the teacher does when students are stuck, what the backup plan is if technology fails (for lessons relying on devices), and what the extension task is if the class finishes early. A lesson plan that only works when everything goes perfectly is not instructionally sound.

12. **NEVER write direct instruction as a monologue longer than 10 consecutive minutes.** Neuroscience of learning and attention research consistently shows cognitive engagement drops without active processing. Insert a brief student response activity (turn-and-talk, quick write, cold call with think time, thumbs check) at or before the 10-minute mark within any direct instruction segment.

---

## Edge Cases

### No Standards Specified
Ask once: "Which standards framework governs this lesson -- Common Core, NGSS, your state standards (which state?), IB, AP, or other?" If the user says none, cannot identify standards, or is writing for adult/professional audiences outside K-12, proceed by anchoring objectives to Bloom's Revised Taxonomy and note prominently at the top of the plan: *"Standards alignment not specified. Teacher should cross-reference objectives against applicable framework before submitting for formal review."* Do not invent standard codes.

### Very Short Mini-Lesson (Under 30 Minutes)
Restructure to a 3-segment format: Hook (3-5 min), Direct Instruction/Guided Practice combined (15-20 min), Exit Ticket Closure (3-5 min). Limit to 1-2 learning objectives. Use one closed question as the exit ticket. Note explicitly that this is a mini-lesson format and is not a complete instructional sequence -- it should be embedded in a larger lesson or unit.

### 90-Minute Block Schedule
Do not simply scale up a 50-minute plan. Design two instructional cycles within the block: Cycle 1 covers foundational content (objectives 1-2), Cycle 2 moves to application and analysis (objectives 3-4). Build in a 5-minute processing break at the 40-45 minute mark (movement activity, gallery walk, partner discussion). Attention management is the critical design variable for block schedules -- vary modality at least every 15-20 minutes.

### Multi-Day or Chunked Lesson
When a lesson spans multiple class periods (e.g., a 3-day lab sequence), produce a parent plan that shows the full arc and then a day-by-day procedure. Each day must have its own objectives (which may be sub-objectives of the larger lesson goals) and its own closure/entry routine. Day 2 and Day 3 must each open with a retrieval practice activity (3-5 minutes) that activates what was covered in the preceding session.

### Co-Teaching or Team-Teaching
Add a "Teaching Role" column to the procedure table specifying which teacher leads each segment. Explicitly name the co-teaching model for each segment: One Teach/One Observe (one teacher instructs, one collects observational data), One Teach/One Assist (one leads, one circulates and supports), Parallel Teaching (class split into two groups, each teacher leads same content simultaneously), Station Teaching (each teacher leads a different station), or Team Teaching (both teachers lead instruction simultaneously, presenting complementary perspectives). Note which model serves students with IEPs best in each segment.

### Online or Hybrid Delivery
Add a "Platform" column to the procedure table. For synchronous online delivery: embed a structured engagement check every 10 minutes (poll, chat prompt with specific question, breakout room task with a deliverable). For asynchronous components: specify exactly which activities are done independently before the synchronous session (flipped model) and what product students bring to the live session. For hybrid (some students in room, some remote): designate a "remote monitor" role in group activities, specify how the remote students see what in-room groups are doing (document camera, shared screen), and ensure the exit ticket is accessible in both formats (physical index card and digital form simultaneously).

### Lab or Hands-On Science Lesson
Add a **Safety Protocols** section immediately before the procedure. Include: required PPE (safety goggles, gloves, aprons) by activity segment, chemical/material hazards relevant to the specific experiment, disposal instructions for materials, emergency procedures (eyewash station location, spill procedure), and student behavior expectations in the lab. Add setup time (5-10 min at the start of the class) and cleanup time (5-8 min at the end) to the procedure timeline -- these eat into instructional time and must be accounted for. Specify student grouping (groups of 3 with assigned roles: lab manager, data recorder, safety monitor) and include a pre-lab safety quiz as the opening formative assessment.

### Content-Heavy Upper Secondary or AP/IB Course
For AP or IB courses, objectives must be written against course-specific frameworks: AP course frameworks specify "Big Ideas," "Enduring Understandings," and "Learning Objectives" with specific codes (e.g., AP Biology LO 1.A.2); IB courses specify "Assessment Objectives" (AO1-AO4 in most subjects). Use these codes instead of or in addition to Bloom's levels. For AP specifically, design at least one activity that mirrors the format of an AP free-response question or document-based question so students practice the cognitive mode they will encounter on the exam. Note the AP exam weighting of the content being taught (if available in the course description) so teachers can calibrate time investment.

### Socratic Seminar or Discussion-Based Lesson
The procedure structure changes significantly. Direct instruction is replaced by a Text Introduction segment (5-10 min) where students review the anchor text or primary source. Guided Practice becomes the Seminar itself (25-35 min for a 50-minute class), during which the teacher's role is facilitator -- not lecturer. Provide the teacher with 8-12 tiered discussion questions (3-4 opening/recall level, 3-4 analysis level, 2-3 synthesis/evaluation level) and a Seminar observation checklist. Assessment is based on quality of contributions, not quantity -- define "quality contribution" explicitly: cites textual evidence, builds on a previous speaker's point, introduces a counterargument, or asks a clarifying question that advances discussion.

---

## Example

**Input from Educator:** "I need a lesson plan for 8th grade ELA on identifying an author's argument and evaluating the strength of evidence. 50 minutes, Common Core aligned. 27 students, mixed ability, 4 students have IEPs for reading fluency. We have 1:1 Chromebooks."

---

## Lesson Plan: Evaluating an Author's Argument and Evidence Strength

**Subject:** 8th Grade English Language Arts -- Argumentation and Nonfiction Reading
**Grade/Level:** 8th Grade
**Duration:** 50 minutes (standard period)
**Class Size:** 27 students (4 students with IEPs for reading fluency)
**Standards Alignment:**
- CCSS.ELA-LITERACY.RI.8.6: Determine an author's point of view or purpose in a text and analyze how the author acknowledges and responds to conflicting evidence or viewpoints.
- CCSS.ELA-LITERACY.RI.8.8: Delineate and evaluate the argument and specific claims in a text, assessing whether the reasoning is sound and the evidence is relevant and sufficient, recognizing when irrelevant evidence is introduced.

---

### Learning Objectives

By the end of this lesson, students will be able to:

| # | Objective (ABCD Format) | Bloom's Level | Aligned Standard |
|---|------------------------|---------------|-----------------|
| 1 | Given a short nonfiction editorial (400-600 words), students will identify the author's central claim and at least 2 pieces of supporting evidence by annotating the text and completing a claim/evidence organizer with 100% accuracy on the claim and at least 2 of 3 evidence pieces correctly labeled | Remember / Understand | RI.8.6 |
| 2 | Given the identified claim and evidence, students will evaluate whether each piece of evidence is relevant and sufficient to support the claim, using 4 specific criteria (relevance, credibility, recency, specificity) and rating each piece on a 1-3 scale with a written justification of at least one complete sentence per rating | Evaluate | RI.8.8 |
| 3 | Given two editorial texts on the same topic with different quality of evidence, students will compare the strength of each author's argument in a written response of 3-5 sentences that cites specific textual evidence and uses at least 2 of the 4 evaluation criteria by name | Analyze / Evaluate | RI.8.8 |

---

### Materials and Preparation

**Physical Materials:**
- 27 copies of "Fast Food Nation, Student Edition Excerpt -- Editorial Version" (double-sided, stapled; 1 per student)
- 27 copies of the Claim/Evidence Evaluation Organizer (1 per student -- 4 columns: Evidence Quote, Relevant Y/N, Strength Rating 1-3, Justification Sentence)
- 27 copies of the Evidence Strength Reference Card (laminated, single-page -- can be reused; defines 4 criteria: relevance, credibility, recency, specificity with examples of each)
- 5 large sticky notes (neon yellow, posted on the board as the "Claim Parking Lot" before class)

**Digital Materials and Technology:**
- 27 Chromebooks (1:1, already assigned)
- Google Form: "Exit Ticket -- Evaluating Evidence" -- set up in advance, shared link on Google Classroom before class starts
- Teacher display: annotation of editorial displayed via Google Slides, with 3 slides (claim highlighted in yellow, Evidence 1 highlighted in blue, Evidence 2 highlighted in green, Evidence 3 highlighted in orange) -- prepared in advance, ready on teacher computer at projector
- Text-to-speech extension (Read&Write for Google Chrome) -- confirm it is installed on the 4 IEP students' Chromebooks before class

**Room Setup:**
- Desks in groups of 4 (6 groups of 4, one group of 3)
- Evidence Reference Cards pre-placed face-down on each desk
- Claim Parking Lot sticky notes pre-posted on the whiteboard with the heading "What is this author arguing?"

**Preparation Checklist:**
- [ ] Print 27 copies of editorial excerpt and 27 copies of Claim/Evidence Organizer -- complete day before
- [ ] Laminate or print 27 Evidence Strength Reference Cards -- complete day before
- [ ] Confirm Read&Write extension is active on the 4 IEP students' Chromebooks -- complete morning of
- [ ] Open Google Form exit ticket, test submission, post link to Google Classroom -- complete 30 minutes before class
- [ ] Load annotation Google Slides on teacher computer, confirm projector connection -- complete 10 minutes before class
- [ ] Post Claim Parking Lot sticky notes on whiteboard -- complete immediately before students enter

---

### Assessment Plan

| Objective | Assessment Method | Format | Proficiency Threshold | Decision Rule |
|-----------|------------------|--------|----------------------|---------------|
| Obj. 1 -- Identify claim and evidence | Claim/Evidence Organizer (collected) | Formative | Claim correctly identified + 2 of 3 evidence pieces correctly labeled | If <70% meet on mid-lesson check: pause guided practice, model one more example before students continue |
| Obj. 2 -- Evaluate evidence strength | Organizer rating + written justification sentences | Formative | At least 2 of 3 evidence ratings match teacher key AND each has a complete justification sentence citing at least 1 criterion | If <70% at closure: open next class with a 5-minute reteach of the criteria using one new example |
| Obj. 3 -- Compare two arguments | 3-5 sentence written comparison | Formative -- collected with exit ticket | Uses at least 2 criterion names; cites specific text from both editorials; makes a clear comparative judgment | If <60% meet: redesign next lesson to include structured comparison practice before moving to independent writing |

**Embedded Mid-Lesson Check (at 25 minutes):** Simultaneous whiteboard share -- teacher asks: "Hold up your organizer and point to where you identified the author's central claim." Teacher scans the room for 20 seconds. Students who have not found the claim receive a tap on the desk and a "Claim Finder" prompt card while the teacher addresses the group. If more than 8 students (30%) appear uncertain, teacher calls a 3-minute whole-class pause to model claim identification one more time with a new sentence from the text.

---

### Lesson Procedure

**Overview Timeline:**

| Time | Segment | Primary Strategy | Bloom's Level |
|------|---------|-----------------|---------------|
| 0:00-0:07 | Opening/Hook | Think-Pair-Share with opinion prompt | Remember / Understand |
| 0:07-0:18 | Direct Instruction | Explicit instruction + think-aloud annotation | Understand / Apply |
| 0:18-0:35 | Guided Practice | Paired annotation with Evidence Organizer | Apply / Evaluate |
| 0:35-0:44 | Independent Practice | Independent written comparison | Analyze / Evaluate |
| 0:44-0:50 | Closure | Google Form exit ticket + connecting forward | Evaluate |

---

#### Segment 1: Opening/Hook (7 min)

**Purpose:** Activate prior schema for "argument" in everyday life and create a need for systematic evaluation tools.

**Teacher Actions:**
Project the following prompt on the board as students enter: *"A student says: 'Phones should be allowed in school because my cousin says it helps kids learn.' Is that a strong argument? Why or why not? Write 2 sentences."* Give students 90 seconds to write independently. Then: "Turn to your shoulder partner and share your answer. You have 60 seconds." After pairs discuss, cold-call 2-3 students using equity sticks. Accept all responses without evaluating them. Then ask: "What would make that argument stronger? What's missing?" Guide students to the idea that the evidence (cousin's opinion) is not credible, specific, or sufficient. Say: "Today we're going to give you a set of exact tools to evaluate whether evidence in an argument is actually strong -- tools you can use on any text, in any class."

**Student Actions:**
Write 2-sentence response independently. Discuss with shoulder partner. Share with class. Respond to teacher follow-up questions about what makes evidence strong or weak.

**Transition to Direct Instruction:**
"Flip your editorial face-up. Read&Write users: put in one earbud if you want. We're going to read the first paragraph together as I model how I find the author's claim."

---

#### Segment 2: Direct Instruction (11 min)

**Purpose:** Build procedural and conceptual understanding of claim identification and the 4 Evidence Strength Criteria.

**Key Content Points to Cover:**
1. **What a claim is vs. what a topic is**: A claim takes a position; a topic is neutral. "School lunches" = topic. "School lunches should be eliminated from public funding" = claim. Common misconception to address explicitly: students often highlight the first sentence of a text as the claim, but claims frequently appear in the second paragraph after background context -- demonstrate this with the text.
2. **The 4 Evidence Strength Criteria** (reference Evidence Strength Reference Card):
   - *Relevance*: Does this evidence actually support the specific claim, or does it support a different, related claim?
   - *Credibility*: Who or what is the source? Expert testimony, peer-reviewed research, and government data outrank anecdotes and anonymous sources.
   - *Recency*: Is this evidence current enough to apply? Statistics from 15+ years ago on rapidly changing topics (technology, economics) may be outdated.
   - *Specificity*: Specific numbers, named studies, and verifiable facts are stronger than vague generalizations ("many studies show").
3. **How to rate evidence 1-3**: 1 = weak (fails 2+ criteria), 2 = adequate (meets 2-3 criteria), 3 = strong (meets all 4 criteria).

**Teacher Actions:**
Display the annotation Google Slides. Read the first two paragraphs of the editorial aloud. Think aloud: "I'm looking for a sentence that takes a position, not just states a fact. This sentence -- [read it] -- sounds factual. But this one -- [read highlighted sentence] -- this is an opinion backed by a reason. That's our claim." Click to reveal the yellow highlight. Then move to Evidence 1. Model applying the 4 criteria aloud, rating it, and writing one justification sentence on the board: "I give this a 2 because it is relevant and specific -- it cites an exact percentage -- but the source is not named, which hurts credibility." Ask: "Turn and tell your partner: which criterion did I say was missing? One word." Cold-call after 20 seconds.

**Checking for Understanding at 7-Minute Mark:**
"On your Reference Card, point to the criterion you think is hardest to judge. Give me a thumbs up when you're pointing." Scan the room. If more than half point to "relevance," spend 60 additional seconds on that criterion with a second example before moving on.

**Student Actions:**
Follow along with their own copy of the editorial. Students flip over their Reference Card (face-up now) as the teacher introduces the criteria. Students turn-and-talk to name the missing criterion. Students identify one criterion they find challenging.

**Transition to Guided Practice:**
"Take out your Claim/Evidence Organizer. Write the claim we identified together in the top box -- exactly what we agreed on. Then you and your partner are going to evaluate Evidence 2 and Evidence 3 together using the same process I just modeled. You have 12 minutes."

---

#### Segment 3: Guided Practice (17 min)

**Purpose:** Apply claim identification and the 4-criteria evaluation framework to 2 remaining evidence pieces with partner support.

**Task Description:**
Working in assigned pairs (seated next to each other in the group of 4), students complete the Claim/Evidence Organizer for Evidences 2 and 3 from the editorial. For each piece: (a) record the exact quote or paraphrase, (b) decide Relevant Y/N, (c) assign a 1-3 rating, (d) write one justification sentence that names at least 1 criterion. Partners must agree on the rating before writing. If they disagree, both partners write their rating and one sentence explaining the disagreement (this becomes a discussion prompt during the mid-lesson check).

**Grouping:** Pairs (pre-assigned by teacher to balance reading fluency; IEP students are paired with a patient on-grade peer, not necessarily the highest reader in the class)

**Teacher Actions:**
Circulate in a planned pattern (start at back-left, move clockwise through the room). Carry equity sticks. Do not answer "Is this right?" questions -- instead respond with: "What criterion are you applying? Walk me through your thinking." Specific guiding questions to use: "If the author removed this evidence entirely, would the argument still work? That tells you about relevance." "Who said this? What makes them an authority?" Look for: students copying their partner's rating without reasoning; students rating evidence 3 without reading it; students who have not written a justification sentence. At 8 minutes into guided practice (25 minutes total into the lesson), conduct the mid-lesson whiteboard check (described in Assessment Plan).

**Mid-Lesson Formative Check (at 25 minutes):**
"Everyone put your finger on the claim you wrote at the top of your organizer. I'm going to walk by and look." Teacher scans all organizers in 30-45 seconds. Taps desk of any student whose claim box is blank or contains a topic instead of a claim and leaves a "Claim Finder" prompt card (pre-printed: "A claim takes a position. It answers: What does the author WANT YOU TO BELIEVE?"). After scan: "Okay -- most of you have the claim. Hands up if you and your partner disagreed on a rating." Address 1-2 disagreements with the whole class as a 2-minute discussion, using them to reinforce the criteria.

**Student Actions:**
Read Evidences 2 and 3, complete the 4-column organizer for each, negotiate ratings with partner, write justification sentences. Students with disagreements flag their organizer for discussion.

**Transition to Independent Practice:**
"In 30 seconds, finish your last justification sentence. Leave your Claim/Evidence Organizer on your desk -- I'll collect these. Now open your Chromebook. Go to Google Classroom and find the second editorial -- same topic, different author. Read it silently for 2 minutes, then you'll write your comparison."

---

#### Segment 4: Independent Practice (9 min)

**Purpose:** Demonstrate the ability to compare argument strength across two texts using the evaluation criteria, with reduced scaffolding.

**Task Description:**
Students read the second editorial (same topic, weaker evidence overall) silently for 2 minutes (pre-loaded in Google Classroom as a Google Doc with read-along highlighting for IEP
