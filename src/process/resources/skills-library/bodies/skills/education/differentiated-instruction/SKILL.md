---
name: differentiated-instruction
description: |
  Creates differentiated lesson adaptations for diverse learners using Universal Design for Learning (UDL) and differentiated instruction (DI) frameworks. Produces three learner-profile adaptations (advanced, on-grade, support-needed) of a single lesson for educators.
  Use when an educator asks to differentiate a lesson, adapt instruction for diverse learners, create tiered activities, or apply UDL principles to an existing lesson plan.
  Do NOT use for creating the original lesson plan (use `lesson-plan-design`), for individual student feedback (use `student-feedback`), or for student self-paced learning (use `study-plan`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "teaching lesson-plan step-by-step guide"
  category: "education"
  subcategory: "teaching"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Differentiated Instruction

## When to Use

Use this skill when any of the following conditions are present:

- An educator submits an existing lesson plan (or describes one in sufficient detail) and asks for tiered versions, differentiated versions, or adaptations for mixed-ability classrooms
- A teacher names specific learner populations in their class -- gifted students, students with IEPs, ELL/emergent bilingual students, below-grade readers -- and asks how to reach all of them in the same lesson
- An instructor explicitly references differentiated instruction (DI), Universal Design for Learning (UDL), tiered assignments, scaffolded activities, learning menus, RAFT tasks, cubing, or flexible grouping as the output they want
- A teacher reports that some students finish activities too quickly and others cannot access the material, and asks for a structural solution
- A curriculum coach, instructional designer, or department chair asks for a differentiation framework to apply across a unit or course
- A teacher needs to align an existing lesson to a student's IEP, 504, or ELL language development plan without redesigning the core lesson from scratch
- A special education co-teacher or paraprofessional needs concrete parallel materials to use with a pull-out or push-in group

**Do NOT use this skill when:**

- The user has no existing lesson or topic -- they need to build a lesson from scratch first (use `lesson-plan-design`)
- The request is for feedback written to an individual student about their specific work (use `student-feedback`)
- A student (not an educator) is asking for a personalized study plan or adapted materials for themselves (use `study-plan`)
- The user is asking for a formal IEP document, a 504 plan, or a legal accommodation plan -- these require licensed specialists and are outside the scope of instructional skill
- The request is purely about classroom management or behavior intervention (use a behavior-support skill)
- The educator wants assessment design as the primary output -- differentiation of assessment format is a component here, but full rubric or assessment design is a separate task

---

## Process

### Step 1: Collect the Source Lesson and Learner Context

Gather every piece of the existing lesson before designing any adaptations. Missing information at this stage causes misaligned tiers.

- **Required lesson information:** Topic, grade level, content standard(s) addressed, learning objective(s) written in measurable terms, the main instructional activity (what students do during the lesson), how students currently demonstrate mastery, and total available time
- **Required learner population information:** Approximate number of students in each readiness band (advanced, on-grade, support-needed), presence of ELL/emergent bilingual students and their proficiency level (WIDA or ELPAC levels 1-6 if available), presence of students with IEPs or 504s and the general category of need (processing, reading fluency, expressive language, attention, etc.), and any known student interest clusters or learning preference patterns
- **Required resource constraints:** Whether the teacher has access to a co-teacher or paraprofessional, available technology, printable materials vs. digital-only, and physical classroom setup (flexible seating vs. fixed rows)
- If the teacher cannot provide learner population data, design with three representative profiles and note that tier placement requires teacher judgment
- If the teacher can only provide topic and grade level (minimum viable input), proceed but flag that adaptations will be generic archetypes, not context-specific

### Step 2: Unpack the Standards and Identify the Non-Negotiable Core

Every tier must be built around the same essential understanding. Identify it precisely before writing a single activity.

- Extract the **essential question** the lesson answers -- the conceptual core every student must touch, regardless of readiness level
- Separate the learning objective into three components: (a) the **declarative knowledge** (facts, vocabulary, definitions), (b) the **procedural knowledge** (skills, sequences, processes), and (c) the **conceptual understanding** (why it works, what it means, how it connects)
- Identify which of these three components is the non-negotiable core for ALL tiers -- this is typically the procedural or conceptual target, not the declarative facts
- Map the objective to Bloom's Taxonomy levels. On-grade work typically sits at Apply or Analyze. Support-needed scaffolding brings students to Understand and Apply. Advanced work extends to Analyze, Evaluate, or Create. Never let advanced work stay at Apply while calling it differentiated -- that is more practice, not more complexity
- Flag any prerequisite knowledge gaps that Tier 1 adaptations must address -- if a student cannot access the activity without first knowing vocabulary, the scaffold must include vocabulary support, not assume it

### Step 3: Determine Which Dimension(s) to Differentiate

Tomlinson's framework identifies four differentiation dimensions. Attempting all four in a single lesson design creates unmanageable complexity. Select the highest-leverage dimension(s) for this specific lesson.

- **Content differentiation** -- varying what students access or the complexity of the material itself. Use when the same concept exists at genuinely different levels of abstraction (e.g., fractions as parts of a whole vs. fractions as ratios vs. fractions as division). Best for subjects with clear vertical progression (math, reading levels, science complexity)
- **Process differentiation** -- varying how students engage with and make sense of the content. Use when the core activity has variable cognitive demand without changing the concept (e.g., guided note-taking vs. open-ended inquiry on the same topic). Most frequently used dimension; applicable in nearly every lesson
- **Product differentiation** -- varying how students demonstrate understanding. Use when the teacher has flexibility in assessment format and when the core understanding can be validly demonstrated through multiple modalities. Creates maximum student agency. Avoid when the product format IS the skill being taught (e.g., in a writing lesson, writing cannot be optional)
- **Learning environment differentiation** -- varying the structure, pacing, or physical/social conditions. Use when some students need quiet independent work and others need collaborative discourse to process. Often combined with process differentiation
- For most single-lesson differentiation requests, differentiate **Process AND Product** -- this is the highest-leverage combination and produces clear tier distinctions without requiring separate content tracks
- Avoid differentiating content alone without process -- students at different complexity levels still need different levels of scaffolding for how they engage with that content

### Step 4: Design Three Learner-Profile Adaptations

Apply Tomlinson's DI framework with Bloom's Taxonomy as the cognitive scaffold. Each tier must be a coherent, complete activity -- not a stripped-down or padded version of another tier.

**Tier 3: Advanced / Extended Learners**
- Elevate the Bloom's level -- if Tier 2 operates at Analyze, Tier 3 operates at Evaluate or Create
- Increase **abstraction**: move from concrete to conceptual, from single-context to cross-context, from known scenarios to novel or ambiguous ones
- Increase **open-endedness**: replace closed tasks with problems that have multiple valid solutions or require the student to frame the question, not just answer it
- Remove scaffolds that were provided to Tier 2 -- do not give Tier 3 graphic organizers they do not need; the absence of scaffold IS part of the advanced adaptation
- Add **transfer requirements**: the advanced task should require applying the concept in a new context, comparing two systems or concepts, or generating something new (a model, an argument, a design, a prediction)
- Assign meaningful roles: expert consultant to small group, designer of a teaching artifact, peer reviewer using a technical rubric -- these must require mastery of the core concept to execute, not just extroversion
- Avoid "more of the same" at all costs: 25 math problems instead of 12 is not advanced differentiation; a proof, a generalization, or a real-world application problem is

**Tier 2: On-Grade / Core Learners**
- This is the base lesson as designed for the majority of students
- Ensure the Tier 2 activity genuinely reflects the grade-level standard and sits at the Apply or Analyze level of Bloom's -- if the original lesson was too low (rote memorization) or too high, flag this to the teacher
- Tier 2 should include **guided practice with clear instructions**, structured feedback loops, and an opportunity for peer collaboration
- Do not over-scaffold Tier 2 by instinct -- on-grade students often perform better with moderate challenge and agency than with excessive support

**Tier 1: Support-Needed / Scaffolded Learners**
- Maintain the same **conceptual core** as Tier 2 -- the goal is access, not a reduced curriculum
- Use named, specific scaffolds: graphic organizers with labeled sections, word banks with definitions and example sentences, sentence starters (not just sentence frames -- starters with the first half of the sentence), partially completed models, annotated examples, visual step-by-step process guides
- Chunk multi-step instructions into single-step directions, one per page or card if possible
- Build in **distributed practice** -- more frequent check-ins at smaller increments rather than one extended task
- Every scaffold must be designed for removal: fading occurs when students demonstrate accuracy across 3 consecutive attempts without the scaffold. Name the fading plan explicitly
- Never simplify by removing the conceptual understanding requirement -- simplify the input and output format, not the thinking demand

### Step 5: Apply UDL Principles Across All Three Tiers

UDL is not the same as differentiation. DI responds to readiness, interest, and learning profile. UDL proactively removes barriers for all learners. They complement each other -- apply both.

- **Multiple Means of Representation (the "what" of learning):** Every tier should present the core concept in at least two modalities. Visual + text is the minimum. Add manipulatives, video clips (with captions), worked examples, diagrams, or physical demonstrations for lessons where abstract content is the primary barrier
- **Multiple Means of Action and Expression (the "how" of learning):** Across all tiers, offer at least two ways to demonstrate understanding. This does not mean every student has unlimited choice -- it means the teacher has designed two valid pathways (e.g., write an explanation OR record a 60-second verbal explanation OR build a labeled model)
- **Multiple Means of Engagement (the "why" of learning):** Each tier should include a relevance hook -- a connection to students' lives, interests, or real-world applications. Tier 3 students lose engagement when bored by under-challenge; Tier 1 students lose engagement when overwhelmed by inaccessibility. The relevance hook is the fastest re-engagement tool for both
- Check that the lesson meets minimum UDL accessibility thresholds: all written materials at or near grade-level reading (with below-grade alternatives for Tier 1), all diagrams labeled, all complex tasks chunked with checkpoints

### Step 6: Write ELL/Emergent Bilingual and IEP Overlays

These are cross-cutting modifications that apply regardless of tier placement. Do NOT conflate language proficiency with academic readiness.

- **ELL Language Scaffolds (applied at any tier):**
  - WIDA Levels 1-2 (Entering/Emerging): Picture-supported vocabulary cards, bilingual glossaries, yes/no and single-word response options, L1-accessible visual representations
  - WIDA Levels 3-4 (Developing/Expanding): Sentence frames, graphic organizers with academic language prompts, structured partner discussion protocols (e.g., think-pair-share with a sentence starter), vocabulary previews 24 hours before the lesson if possible
  - WIDA Levels 5-6 (Bridging/Reaching): Discipline-specific academic vocabulary support, complex sentence structures modeled, comparison tasks that leverage bilingual cognitive advantages
- **IEP Accommodation Overlays:** Identify which accommodations are legally required (extended time, reduced distractors, read-aloud, scribe, calculator, preferential seating) and note them explicitly in the Teacher Implementation Notes, not embedded in a tier as if they are optional. These are non-negotiable regardless of tier
- A gifted student who is also an ELL receives Tier 3 cognitive challenge PLUS the appropriate ELL language scaffold for their WIDA level -- these two dimensions never cancel each other out
- A student with a processing disability may sit in Tier 2 academically but require Tier 1 scaffolding for instructions only -- note these as "accommodation overlays" rather than full tier changes

### Step 7: Write Teacher Implementation Notes

The differentiation guide is only useful if a teacher can implement it on a regular school day. Practical logistics matter as much as pedagogical design.

- **Grouping strategy:** Specify whether tiers work independently, in homogeneous groups, in heterogeneous groups for part of the lesson, or in a combination. Research supports flexible grouping -- no student should be locked into the same tier for every lesson
- **Materials distribution logistics:** Specify how materials reach students without publicly signaling ability levels. Options include: color-coded folders with neutral labels, a "choice board" where students select their challenge level, materials pre-placed at seats before students arrive, or digital delivery through an LMS with tiered assignments
- **Transition and pacing plan:** Tier 3 students frequently finish first. What do they do? Specify this: peer teaching, extension problem, reflection journal, or beginning the next-lesson application. Tier 1 students frequently need more time -- identify which parts of the assessment are priority if they cannot complete everything
- **Progress monitoring during the lesson:** Provide two specific check-in prompts -- one at the midpoint of the activity and one at the close -- that tell the teacher whether a student is correctly placed in their tier
- **Tier re-placement criteria:** Specify the observable evidence that suggests a student should move up (completing Tier 1 with 90%+ accuracy across 2-3 lessons) or move down (repeated frustration, inability to start Tier 2 tasks without step-by-step teacher help for 3+ consecutive lessons). Avoid making tier changes based on a single lesson

---

## Output Format

```markdown
## Differentiated Lesson: [Topic]

**Source Lesson Title:** [Original lesson title or teacher-provided description]
**Grade/Level:** [Grade and subject]
**Primary Standard(s):** [Exact standard code(s) and text]
**Core Objective (All Tiers):** [The non-negotiable learning target in measurable terms --
  all tiers must achieve this]
**Differentiation Dimension(s):** [Process / Product / Content / Environment -- select
  the dimension(s) applied]
**Lesson Duration:** [Total minutes available]

---

### Learner Population Summary

| Tier | Number of Students | Special Populations in This Tier |
|------|-------------------|----------------------------------|
| Tier 3: Advanced/Extended | [n] | [Gifted designation, dual-exceptionality, etc.] |
| Tier 2: On-Grade/Core | [n] | [General education, any IEP students at grade level] |
| Tier 1: Support-Needed | [n] | [ELL levels, IEP categories, below-grade readers] |

---

### Non-Negotiable Core Understanding

**Essential Question:** [The big conceptual question all students answer through this lesson]
**Bloom's Level for Tier 2 (baseline):** [Remember / Understand / Apply / Analyze /
  Evaluate / Create]
**Prerequisite Knowledge Required:** [What students must already know to access
  this lesson at any tier]

---

### Tier 3: Advanced / Extended Learners

**Bloom's Level:** [One or two levels above Tier 2]
**Modified Objective:** [Extended objective -- same core concept, higher cognitive demand]

**Differentiation Rationale:**
[1-2 sentences explaining WHY this specific extension is appropriate -- what cognitive
  demand is added and how it connects to the core concept]

**Scaffolds Removed (vs. Tier 2):**
- [Name the Tier 2 scaffold that Tier 3 does not receive and why]

**Activity Description:**
[Complete, step-by-step description of what the student does, what materials they have,
  how long it takes, and what their product looks like at the end]

**Specific Materials Needed:**
- [Item 1 -- e.g., scenario cards with specific content described]
- [Item 2]

**Assessment:**
- Criteria: [Specific criteria with point values]
- Format: [How the student submits or presents their work]
- Total points: [X]

**Early-Finisher Extension:**
[What Tier 3 students do if they complete the activity before time is called]

---

### Tier 2: On-Grade / Core Learners

**Bloom's Level:** [Baseline level for this lesson]
**Objective:** [Core objective as written]

**Activity Description:**
[Complete description of the standard activity -- this should match the original lesson
  with any necessary clarifications]

**Specific Materials Needed:**
- [Item 1]
- [Item 2]

**Guided Practice Structure:**
- [Modeling phase: what the teacher demonstrates and for how long]
- [Practice phase: what students do independently or in pairs]
- [Check-in point: at what moment the teacher circulates and what they look for]

**Assessment:**
- Criteria: [Specific criteria with point values]
- Format: [How the student demonstrates mastery]
- Total points: [X]

---

### Tier 1: Support-Needed / Scaffolded Learners

**Bloom's Level:** [Understand → Apply, with scaffolded access to Analyze if possible]
**Modified Objective:** [Same core concept; simplified format and complexity of output]

**Differentiation Rationale:**
[1-2 sentences explaining the primary barrier being addressed and the primary scaffold
  being applied]

**Scaffolds Provided:**

| Scaffold Type | Specific Scaffold | Fading Plan |
|---------------|-------------------|-------------|
| Vocabulary | [e.g., Word bank with 8 terms, each with a definition and example sentence] | [Remove definitions after 3 lessons with 85%+ accuracy] |
| Structural | [e.g., Graphic organizer with headers pre-filled and first example row completed] | [Remove pre-filled example after 2 lessons] |
| Linguistic | [e.g., Sentence starters: "This process causes ___ because ___"] | [Replace with sentence frames, then remove at WIDA Level 5] |
| Procedural | [e.g., Step-by-step instruction card with one step per card, numbered] | [Student self-selects which steps they still need after first independent attempt] |

**Activity Description:**
[Complete, step-by-step description of the scaffolded activity -- same concept as Tier 2,
  accessed through scaffolds]

**Specific Materials Needed:**
- [Item 1]
- [Item 2]

**ELL-Specific Additions (if applicable):**
- [Language scaffold 1 by WIDA level]
- [Language scaffold 2]

**IEP/504 Accommodation Overlays (if applicable):**
- [Accommodation 1 -- e.g., extended time: allow 15 additional minutes beyond class period]
- [Accommodation 2]

**Assessment:**
- Criteria: [Same core concept measured; format modified for accessibility]
- Format: [How the student demonstrates mastery with scaffolds intact]
- Total points: [X -- note if scoring rubric is modified from Tier 2]

---

### UDL Alignment Summary

| UDL Guideline | Tier 3 Implementation | Tier 2 Implementation | Tier 1 Implementation |
|---------------|----------------------|----------------------|----------------------|
| Representation: Multiple formats | [Specific modalities used] | [Specific modalities used] | [Specific modalities used] |
| Representation: Language & symbols | [How academic language is addressed] | [How academic language is addressed] | [Vocabulary/glossary supports] |
| Action & Expression: Options for response | [Response format available] | [Response format available] | [Response format available] |
| Engagement: Relevance & authenticity | [Real-world connection] | [Real-world connection] | [Real-world connection] |
| Engagement: Challenge & support | [How challenge is calibrated] | [How challenge is calibrated] | [How support prevents frustration] |

---

### Teacher Implementation Notes

**Grouping Strategy:**
[Specific grouping configuration -- who works with whom, whether groups are homogeneous
  or heterogeneous, and for which parts of the lesson]

**Materials Distribution (without signaling ability levels):**
[Specific method -- e.g., color-coded folders with student names, choice board posted on
  board, pre-placed at seats, digital LMS assignment by roster section]

**Pacing and Transitions:**
- [0-X minutes]: [What all students do -- launch, hook, or direct instruction]
- [X-Y minutes]: [When tiered activities begin -- what each tier is doing simultaneously]
- [Y-Z minutes]: [Closure structure -- how tiers reconvene or share]
- Tier 3 early-finish protocol: [Specific task]
- Tier 1 priority task (if time runs short): [Which assessment items are essential vs.
  optional]

**Mid-Lesson Progress Monitoring:**
- Check-in prompt at [X minutes]: [Specific question or task the teacher uses to gauge
  tier-fit -- observable in 30 seconds per student]
- End-of-lesson exit ticket (all tiers): [Single prompt that every student answers in
  the same format -- allows cross-tier comparison]

**Tier Re-Placement Criteria:**
- Move UP from Tier 1 to Tier 2 when: [Observable, measurable criterion across
  2-3 lessons]
- Move DOWN from Tier 2 to Tier 1 when: [Observable, measurable criterion across
  2-3 lessons]
- Move UP from Tier 2 to Tier 3 when: [Observable, measurable criterion]

**Flexible Grouping Note:**
[Which upcoming lessons this differentiation should be revisited for -- tier placement
  should be fluid, not permanent]
```

---

## Rules

1. **Never reduce the core concept for Tier 1 -- reduce the access barriers instead.** A Tier 1 student who matches vocabulary to definitions is accessing the same concept as a Tier 2 student who writes explanations, as long as both are working with the same essential understanding. Replacing the concept (e.g., giving Tier 1 a simpler, unrelated task) is tracking, not differentiation.

2. **Bloom's level must demonstrably increase from Tier 2 to Tier 3.** If Tier 2 is at Apply, Tier 3 must reach Analyze, Evaluate, or Create. Adding more items at the same cognitive level (20 problems instead of 10, a longer essay, additional research) is quantity inflation, not differentiation. Name the Bloom's level for each tier explicitly.

3. **Every scaffold must be named with specificity.** "Provide support" and "offer guidance" are not scaffolds. Acceptable scaffold descriptions include: "word bank of 10 terms with definitions in student-friendly language and an example sentence for each," "graphic organizer with the central concept pre-labeled and three evidence boxes numbered 1-3," "sentence starter: 'One piece of evidence that supports this is ___, which shows that ___'." The specificity is what makes the scaffold usable by a substitute or paraprofessional.

4. **Every scaffold must include a fading plan.** Scaffolds without fading plans create dependency. The fading plan must be observable (not "when the student is ready") and criterion-referenced (e.g., "remove the word bank when the student uses all 10 terms correctly in context across 3 independent writing tasks").

5. **ELL language scaffolds are never the same as academic readiness scaffolds.** Language proficiency and academic readiness are independent variables. An ELL student at Tier 3 receives the Tier 3 cognitive task PLUS WIDA-appropriate language supports. Never place an ELL student in Tier 1 based on language proficiency alone -- assess their academic readiness in their strongest language if possible, then overlay language scaffolds.

6. **IEP accommodations are mandatory overlays, not tier assignments.** A student with an IEP for extended time receives extended time at whatever tier they are placed in. Document IEP accommodations in a separate overlay section, not embedded within the tier description as if they are optional scaffolds.

7. **Tier labels used with students must be neutral or invisible.** Never use labels like "high group," "low group," "the yellow group" (when yellow is known to be easier), or any descriptor that signals ability ranking to students. Use interest-based names ("Builders," "Designers," "Investigators"), task-based names ("Tier A," "Option 1"), or distribute materials without visible grouping at all.

8. **Assessment across all tiers must measure the same core objective.** Tier 1 assessment may use a different format (matching instead of written explanation) but must still require the student to demonstrate understanding of the same essential concept. If Tier 1 students can pass the assessment by recognizing answers without any understanding of the concept, the assessment is not measuring the objective -- it is measuring pattern recognition.

9. **Tier 3 must not require additional prep burden from the teacher.** Extension tasks should use existing materials in a new way (analysis, comparison, application), peer teaching structures, or student-driven inquiry that the teacher facilitates but does not create new materials for. If Tier 3 requires the teacher to locate, copy, and distribute entirely separate materials, the design is not sustainable.

10. **Include a concrete, lesson-specific early-finisher protocol for Tier 3.** "Work on something else" or "help a classmate" are not protocols. The early-finisher task must directly extend the lesson concept (not be a reward activity), must not require teacher attention to launch, and must produce something the student can share during closure. Name it, describe it in two to three sentences, and ensure it is self-directed.

11. **Progress monitoring must occur at least once mid-lesson, not only at the end.** A single exit ticket at the end of a 50-minute period tells the teacher that a student was misplaced after the misplacement already caused 50 minutes of frustration or boredom. Design one mid-lesson check-in (at the 15-20 minute mark for a standard period) that takes 30-60 seconds per student to evaluate and gives a clear signal: this student is correctly placed, stretched too far, or not challenged enough.

12. **The three tiers are starting points, not ceilings or floors.** Always include explicit re-placement criteria so students can move between tiers across lessons. Research indicates that fixed ability grouping over time has negative effects on Tier 1 students' self-efficacy and achievement expectations. Build in built-in movement by re-assessing tier placement every 3-5 lessons in a unit.

---

## Edge Cases

**Case 1: The teacher reports that most students are in Tier 1 (more than 50% of the class needs significant support)**

This is a signal that the original lesson design may be pitched at the wrong level, not that the class is unusually low-performing. Before designing three tiers, flag this to the teacher: if more than half the class needs Tier 1 scaffolds, the Tier 2 activity should be redesigned to incorporate many of those scaffolds as standard features, with Tier 1 adding additional support beyond that new baseline. Redesigning the baseline does not require the `lesson-plan-design` skill -- it is a prerequisite calibration step within this skill. Ask the teacher: "Should we adjust what 'on-grade' looks like for this class before creating tiers?" Then design accordingly.

**Case 2: The teacher has no co-teacher or paraprofessional, and implementation logistics seem impossible**

Single-teacher differentiation is the most common scenario and requires a different logistics model than multi-adult classrooms. In this case: (a) limit tiered activities to the independent practice portion of the lesson only -- direct instruction and closure are whole-class; (b) design Tier 1 and Tier 3 activities to be fully self-directed so the teacher can circulate to Tier 2; (c) use learning stations where students rotate through the same stations but interact with them at different levels of complexity; (d) use a choice board (learning menu) where all students choose from options at 3 levels of challenge -- this is more sustainable than teacher-sorted tiers in a solo classroom. Flag the logistics constraint explicitly and offer the choice-board alternative.

**Case 3: A student has a dual exceptionality (gifted + learning disability, or gifted + autism spectrum, or gifted + ADHD)**

Dual-exceptional (2e) students represent one of the most frequently mishandled differentiation cases. They are typically misplaced in Tier 1 because their disability masks their giftedness, or in Tier 3 with no disability supports. The correct approach: place in Tier 3 for cognitive challenge (the giftedness is the readiness signal) and apply disability-specific accommodations as an overlay. Common 2e overlays include: extended time at Tier 3, reduced written output requirement with an oral alternative for students with dysgraphia, structured task-initiation supports for students with executive function challenges, and sensory-friendly material presentation for students with sensory processing differences. Never conflate disability accommodation with cognitive under-challenge.

**Case 4: The subject matter has very limited tiering range (e.g., a single-answer procedural skill like a specific grammar rule or a binary math operation)**

Not all lesson content can be differentiated meaningfully at the content level. For procedural skills with limited conceptual range, differentiate the **product** dimension instead: Tier 1 identifies and applies the rule in pre-identified sentences, Tier 2 applies the rule in self-generated sentences, Tier 3 analyzes published text to find cases where the rule is broken intentionally by the author and explains the rhetorical effect. All three tiers know the same rule. The cognitive demand -- recognition vs. application vs. critical analysis -- creates the genuine differentiation. Flag narrow-tiering lessons to the teacher and explain the product-differentiation workaround.

**Case 5: The teacher is designing for a standards-mastery context (the lesson is tied to a high-stakes benchmark where every student must reach the same proficiency level)**

Standards-mastery contexts appear to conflict with differentiation but do not. The misconception is that differentiation means different standards for different students. Reframe: all tiers share the same mastery target; the tiers differ in the amount of scaffolding, pacing, and practice needed to get there. In a mastery-based context, redesign the tiers as a progression: Tier 1 represents early mastery (with scaffolds), Tier 2 represents developing mastery, and Tier 3 represents mastery-demonstrated with extension. Students cycle through tiers within the unit, not across the year. Build in a reassessment protocol so Tier 1 students can demonstrate mastery removal from scaffolds before the summative assessment.

**Case 6: The lesson is in a subject with significant cultural responsiveness considerations (social studies, history, literature, social-emotional learning)**

Differentiation in culturally responsive contexts requires a fourth dimension of awareness beyond readiness, interest, and learning profile: **cultural and linguistic asset integration**. Tier 1 scaffolds should not default to simplified "neutral" examples that erase students' cultural knowledge -- they should include culturally resonant examples that draw on funds of knowledge students bring. Tier 3 extensions in history or literature should not default to Western academic perspectives as the most complex -- they should include analysis from multiple cultural standpoints as the extension. When the teacher identifies that the class includes students from specific cultural or linguistic communities, note this explicitly and ask whether culturally relevant text, examples, or scenarios should be incorporated into each tier.

**Case 7: The request comes mid-unit and some students have already demonstrated mastery while others are two weeks behind**

Mid-unit differentiation requires a diagnostic step before tier design. Ask the teacher for any available formative assessment data (exit tickets, quiz scores, observation notes). Assign tiers based on demonstrated performance on the current unit's objectives, not on general ability perception. Students who have demonstrated mastery of the current objective should receive Tier 3 work that extends to the next objective in the sequence. Students who have not yet demonstrated mastery of the prerequisite objective from a prior lesson should receive Tier 1 work with embedded review of that prerequisite. Document this in the Teacher Implementation Notes as "prerequisite gap scaffolding" so it is clear that Tier 1 is temporarily addressing a gap, not permanently assigning a student to a low track.

**Case 8: The teacher wants to involve students in choosing their own tier (student self-differentiation)**

Student self-selection works well when combined with a structured, low-stakes system -- it builds metacognitive awareness and reduces the stigma of externally assigned tiers. Effective implementation requires: (a) presenting all three options as genuine choices with transparent differences (not "easy, medium, hard"); (b) a brief student self-assessment (1-2 questions like "rate your confidence with this skill from 1-4") to guide the choice; (c) teacher override capability for clear mismatches; and (d) a mid-activity check-in for students who chose a level that is clearly too high or too low. Research shows that most students self-select appropriately when given honest, non-stigmatizing descriptions and when the choice is framed as "where you want to start today" rather than "where you belong." Build this option into the Implementation Notes when the teacher mentions student agency or choice-based learning.

---

## Example

**Input from Teacher:** "I'm teaching a 9th grade English Language Arts lesson on analyzing theme in literature. We're reading 'The Outsiders.' The main activity is a paragraph where students identify a theme and support it with two pieces of textual evidence. I have 28 students: 6 advanced readers (two of whom are testing for dual enrollment), 16 on-grade, and 6 who need support -- including 3 ELL students at WIDA levels 2, 3, and 4, and 2 students with IEPs for written expression. I'm the only teacher."

---

## Differentiated Lesson: Analyzing Theme in The Outsiders

**Source Lesson Title:** Identifying and Supporting Theme with Textual Evidence
**Grade/Level:** 9th Grade English Language Arts
**Primary Standard(s):** CCSS.ELA-LITERACY.RL.9-10.2 -- Determine a theme or central idea of a text and analyze in detail its development over the course of the text, including how it shapes and are shaped by specific details
**Core Objective (All Tiers):** Students will identify a theme in The Outsiders and support it with specific textual evidence, explaining how the evidence develops that theme
**Differentiation Dimension(s):** Process and Product
**Lesson Duration:** 50 minutes

---

### Learner Population Summary

| Tier | Number of Students | Special Populations in This Tier |
|------|-------------------|----------------------------------|
| Tier 3: Advanced/Extended | 6 | 2 dual-enrollment candidates |
| Tier 2: On-Grade/Core | 16 | General education |
| Tier 1: Support-Needed | 6 | 3 ELL (WIDA 2, 3, 4); 2 IEP/written expression; 1 below-grade reader |

---

### Non-Negotiable Core Understanding

**Essential Question:** How does an author use specific details and character events to build a theme that says something meaningful about human experience?

**Bloom's Level for Tier 2 (baseline):** Analyze -- students must not only identify a theme but explain how evidence develops it (not just "find examples")

**Prerequisite Knowledge Required:** Students must be able to distinguish theme (a universal message about life) from topic (a subject like "loyalty") and must have read at least through Chapter 7 of The Outsiders. If students cannot make the theme/topic distinction, the Tier 1 scaffold must address this directly before evidence selection begins.

---

### Tier 3: Advanced / Extended Learners

**Bloom's Level:** Evaluate and Create (above Tier 2's Analyze)

**Modified Objective:** Students will evaluate how Hinton develops two competing or complementary themes simultaneously across the novel and construct a written argument about which theme is more central to the author's overall purpose, supporting the argument with evidence from multiple chapters.

**Differentiation Rationale:**
Identifying a single theme and supporting it with two quotes is an Analyze-level task that advanced readers can complete without meaningful challenge. Asking students to hold two themes in tension, weigh their relative centrality, and construct an argument introduces Evaluate-level thinking -- students must apply criteria (author's purpose, frequency of development, resolution at the novel's end) to make a judgment, not just describe.

**Scaffolds Removed (vs. Tier 2):**
- No provided theme list -- Tier 3 students generate their own theme statements from scratch
- No graphic organizer for organizing evidence -- students design their own organizational structure
- No sentence starters of any kind

**Activity Description:**
Students receive the Tier 3 task card: "Hinton is doing more than one thing thematically in this novel. Choose two themes you believe she is developing simultaneously (e.g., class division + the cost of violence, OR loyalty + the futility of cycles of revenge). Write a structured analytical paragraph for each theme (8-10 sentences each), then write a concluding 4-6 sentence argument for which theme is more central to Hinton's purpose. Your argument must reference at least four distinct pieces of textual evidence total, drawn from at least three different chapters. Use specific page numbers." Students work independently for 30 minutes. At the 20-minute mark, students swap drafts with their Tier 3 partner for a 5-minute peer review focused on one question: "Did the writer prove which theme is more central, or just describe both themes equally?" Revision continues for 5 minutes.

**Specific Materials Needed:**
- Tier 3 task card (described above)
- Their annotated copy of The Outsiders
- No additional materials provided

**Assessment:**
- Theme 1 paragraph: accurate theme statement as universal claim (2 pts), 2 pieces of evidence correctly cited with page numbers (2 pts), analysis explaining how each piece develops the theme (2 pts) -- subtotal 6 pts
- Theme 2 paragraph: same criteria -- subtotal 6 pts
- Argument paragraph: clear claim about which theme is more central (2 pts), criterion-based reasoning (not just "I think") explaining why (3 pts), evidence-linked to the argument (2 pts) -- subtotal 7 pts
- **Total: 19 points**

**Early-Finisher Extension:**
Students who complete all three paragraphs with time remaining find one passage in the novel where Hinton appears to develop both themes simultaneously in a single scene. They write 3-4 sentences identifying the scene and explaining how both themes operate at once, ready to share during the whole-class closure.

---

### Tier 2: On-Grade / Core Learners

**Bloom's Level:** Analyze

**Objective:** Identify a theme in The Outsiders and support it with two pieces of specific textual evidence, explaining in each case how the evidence develops the theme.

**Activity Description:**
The teacher opens with a 5-minute whole-class reminder of the theme vs. topic distinction using one teacher-modeled example on the board (topic: "loyalty"; theme statement: "True loyalty demands sacrifice of personal safety"). The teacher models writing the first sentence of an analytical paragraph aloud ("In S.E. Hinton's The Outsiders, the theme that _____ is developed through...") then releases students. Students receive the Tier 2 graphic organizer (one box for their theme statement written as a complete sentence, two evidence boxes each containing sub-prompts: "Exact quote or paraphrase," "Chapter and page number," "What this shows about the theme"). After completing the graphic organizer (approximately 15 minutes), students use it to write a single analytical paragraph (6-8 sentences). Paragraph structure: topic sentence stating the theme → evidence 1 introduction → evidence 1 quote or paraphrase → analysis of evidence 1 → evidence 2 introduction → evidence 2 quote or paraphrase → analysis of evidence 2 → closing sentence. Students work independently; they may quietly consult a partner only for the question "does this count as theme or topic?"

**Specific Materials Needed:**
- Tier 2 graphic organizer (described above -- can be a half-sheet)
- Their copy of The Outsiders
- Paragraph structure reminder posted on board or included at the bottom of the graphic organizer

**Guided Practice Structure:**
- Modeling phase (5 minutes): Teacher writes topic vs. theme example on board, models first sentence of analytical paragraph
- Practice phase (25 minutes): Students complete graphic organizer (15 min) then write paragraph (10 min)
- Check-in at minute 20: Teacher circulates and reads each student's theme statement -- if a student wrote a topic instead of a theme, the teacher asks one question: "What does Hinton seem to be saying about [topic] -- what does it mean for human beings?"

**Assessment:**
- Theme statement written as a universal claim, not a topic (2 pts)
- Evidence 1: specific, accurate quote or paraphrase with citation (2 pts)
- Analysis 1: at least one sentence explaining how the evidence develops the theme (2 pts)
- Evidence 2: specific, accurate quote or paraphrase with citation (2 pts)
- Analysis 2: at least one sentence explanation (2 pts)
- Paragraph structure: logical sequence with clear opening and closing (1 pt)
- **Total: 11 points**

---

### Tier 1: Support-Needed / Scaffolded Learners

**Bloom's Level:** Understand → Apply (with structured scaffolding for Analyze-level thinking embedded in the scaffold)

**Modified Objective:** Using a word bank of theme statements and a graphic organizer with sentence starters, students will select one theme from The Outsiders, locate two pieces of supporting textual evidence, and complete a structured paragraph that explains how each piece of evidence connects to the theme.

**Differentiation Rationale:**
The primary barriers for this group are (a) generating a theme statement as a complete universal claim rather than a topic label -- addressed by providing a pre-written theme menu; and (b) writing an analytical explanation -- addressed by sentence starters that scaffold the analysis without providing the analysis itself. The conceptual task (theme identification + evidence analysis) remains intact.

**Scaffolds Provided:**

| Scaffold Type | Specific Scaffold | Fading Plan |
|---------------|-------------------|-------------|
| Conceptual entry | Theme menu: 5 complete theme statements from The Outsiders written as universal claims (e.g., "People who society rejects often find belonging in unexpected communities") -- students choose one or write their own if ready | Remove theme menu after student independently generates an accurate theme statement for 2 consecutive tasks |
| Structural | Graphic organizer identical to Tier 2's but with first sub-prompt completed as a model: Evidence Box 1 contains a pre-filled example ("In Chapter 5, when Ponyboy recites poetry to Johnny, Hinton shows...") which students read and then complete Evidence Box 2 independently | Remove the pre-filled example after 3 lessons with 85%+ accuracy on evidence selection |
| Linguistic | Sentence starters for each paragraph component: Topic sentence: "In The Outsiders, S.E. Hinton develops the theme that _____ through the experiences of her characters." Analysis starters: "This shows the theme because ___" and "Hinton uses this moment to show that ___" | Replace full starters with frames (blanks only, no stem) after student uses starters correctly for 4 consecutive writing tasks |
| Procedural | Step-by-step task card: (1) Choose a theme from the menu. (2) Find one moment in the book that shows this theme. (3) Write the quote or write what happened in your own words. (4) Use the analysis starter to explain the connection. (5) Repeat for a second moment. (6) Connect your boxes into a paragraph using the sentence starters. | Student self-removes cards they no longer need |

**Activity Description:**
Students receive the Tier 1 packet containing: the theme menu (5 theme statements plus a blank for student-generated themes), the scaffold graphic organizer with one pre-filled evidence example, and the step-by-step task card. The teacher spends 3 minutes at the Tier 1 table during the first 5 minutes of independent work to launch the task (confirm each student understands which theme they chose and can identify at least one place in the book where that theme appears). Students work independently through the graphic organizer using their copy of The Outsiders. The goal is completing both evidence boxes and both analysis starters before the period ends. If a student completes the graphic organizer, they attempt to write the paragraph using the sentence starters. The paragraph is not required if they cannot finish -- the graphic organizer alone is assessed.

**Specific Materials Needed:**
- Tier 1 packet: theme menu, scaffolded graphic organizer, step-by-step task card
- Their copy of The Outsiders with any prior annotations
- Sticky notes for marking relevant pages before writing

**ELL-Specific Additions:**

- **WIDA Level 2 (Entering):** Bilingual vocabulary card with 8 literary terms (theme, evidence, quote, paraphrase, develop, universal, claim, analysis) in English with L1 definition and a visual icon. The student may complete the evidence boxes in their L1 if L1 text is available, or use a bilingual dictionary. The teacher or a bilingual peer reads the theme menu options aloud to the student at the start. Assessment: evaluated on concept accuracy, not English fluency.
- **WIDA Level 3 (Developing):** Sentence starters as above plus a sentence frame for analysis: "This shows the theme of [THEME] because the character [CHARACTER NAME] [VERB] [WHAT HAPPENED], which means that [UNIVERSAL MEANING]." The student receives the additional academic vocabulary preview card (introduced the previous day if possible): evoke, struggle, reveal, demonstrate.
- **WIDA Level 4 (Expanding):** Standard Tier 1 scaffolds apply. The student additionally receives a model paragraph (a different literary example, not The Outsiders) showing what a complete theme analysis paragraph looks like, with the theme statement, evidence, and analysis labeled in the margins.

**IEP/504 Accommodation Overlays:**

- **IEP/Written Expression (2 students):** Extended time -- these students may complete the assessment paragraph as homework due the following class period. They may also dictate their paragraph orally and record it on a device, or use text-to-speech for composition. The graphic organizer is the in-class product; the paragraph is the extended-time product.
- If a student with a written expression IEP has an aide/scribe assigned, the scribe writes exactly what the student dictates -- the scribe does not add analytical language.

**Assessment:**
- Theme statement selected or written as a universal claim (2 pts -- selecting from menu earns full credit; writing one's own earns 2 pts only if it is a universal claim, not a topic)
- Evidence 1: specific quote or accurate paraphrase with chapter identification (2 pts)
- Analysis 1: sentence starter completed with a logical connection to the theme -- not just restating the quote (2 pts)
- Evidence 2: specific quote or accurate paraphrase with chapter identification (2 pts)
- Analysis 2: sentence starter completed with a logical connection (2 pts)
- **Total: 10 points (graphic organizer only; paragraph earns 1 additional bonus point for students who complete it)**
- Note: If the student with an IEP submits a dictated paragraph the following day, the paragraph is assessed on the same 11-point Tier 2 rubric, with accommodations noted on the rubric

---

### UDL Alignment Summary

| UDL Guideline | Tier 3 Implementation | Tier 2 Implementation | Tier 1 Implementation |
|---------------|----------------------|----------------------|----------------------|
| Representation: Multiple formats | Student-annotated text + peer oral feedback | Modeled example on board + graphic organizer + paragraph structure guide | Theme menu (visual list) + pre-filled example + step-by-step card + teacher verbal launch |
| Representation: Language & symbols | No additional support (deliberate) | "Theme vs. topic" example on board with labeling | Bilingual vocabulary card, L1 option for ELL, academic vocabulary preview card |
| Action & Expression: Options for response | Written analytical paragraphs + oral peer review | Graphic organizer → paragraph | Graphic organizer alone (sufficient) OR graphic organizer + paragraph; oral dictation for IEP students |
| Engagement: Relevance & authenticity | Authentic interpretive argument -- same kind of thinking college and AP students do; students who write strong arguments share during closure | Connection to a book they've been reading + choice of which theme resonates with them | Theme menu includes themes connected to class identity, belonging, and social division -- relevant to adolescent experience |
| Engagement: Challenge & support | Challenge: self-selected competing themes; no safety net of scaffold | Challenge: genuine Analyze-level task; peer check available only for theme/topic question | Support: teacher checks in first 5 minutes; step-by-step card prevents "I don't know where to start" |

---

### Teacher Implementation Notes

**Grouping Strategy:**
Tier 3 works in pairs for the peer review section only (minutes 20-25); otherwise independently. Tier 2 works independently at their seats; may quietly check with a neighbor only on the theme/topic question. Tier 1 works at a cluster of 4-6 desks near the teacher's circulation path (not a separate table with a stigmatizing name). ELL students sit near bilingual peers if possible -- one established peer partnership per ELL student.

**Materials Distribution (without signaling ability levels):**
Pre-place differentiated packets face-down at seats before students arrive. Each packet is a different color (consistent with the classroom's existing color-coding for workshop stations -- do not introduce a new color code for this lesson only). Teacher says: "Turn over your packet when I give the signal. Your packet has everything you need. You may notice packets look different -- that's because today you're each working with a version that fits where you are in your thinking about theme. All of you are working on the same question." This framing normalizes differentiation without assigning ability labels.

**Pacing and Transitions:**
- 0-5 minutes: Whole-class -- teacher models theme vs. topic distinction on board; all students present for this direct instruction moment
- 5-10 minutes: Teacher releases students to packets; circulates to Tier 1 cluster for a 3-minute launch check
- 10-30 minutes: Independent differentiated work -- teacher circulates between Tier 2 (checking theme statements at the 20-minute mark) and Tier 1 (checking evidence selection at the
