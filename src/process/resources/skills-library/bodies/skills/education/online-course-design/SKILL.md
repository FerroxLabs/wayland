---
name: online-course-design
description: |
  Designs online course modules with learning objectives, content outlines, activity types, assessment strategies, and engagement mechanisms for educators creating digital learning experiences. Produces a complete module outline that can be implemented in any LMS.
  Use when an educator asks to design an online course module, create a digital learning experience, structure an asynchronous or hybrid course, or build an e-learning unit.
  Do NOT use for in-person lesson plans (use `lesson-plan-design`), for full curriculum mapping (use `curriculum-mapping`), or for student course study guides (use `course-companion`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "teaching curriculum lesson-plan step-by-step"
  category: "education"
  subcategory: "teaching"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Online Course Design

## When to Use

**Use this skill when:**
- An educator, instructional designer, or subject matter expert asks to design, build, or structure a specific online course module, unit, or week of learning for digital delivery
- An instructor needs to convert existing in-person course content into an asynchronous, synchronous, or hybrid online format and wants a module-level blueprint
- A user describes wanting to create an e-learning experience with specific learning outcomes, and needs help sequencing content, activities, and assessments inside an LMS
- A corporate trainer or academic faculty member asks for help designing a self-paced or cohort-based digital learning unit with defined objectives and measurable outcomes
- An instructional designer needs a structured module outline they can hand off to a developer, LMS administrator, or faculty member for implementation
- A user mentions terms like "Canvas module," "Moodle course shell," "H5P activity," "discussion board," "SCORM package," "asynchronous unit," or "online learning experience"
- An educator needs to build assessment scaffolding -- rubrics, quiz structures, peer review protocols -- for a digital course context

**Do NOT use when:**
- The user wants a face-to-face lesson plan with classroom logistics, seating, and real-time facilitation moves -- use `lesson-plan-design` instead
- The user needs to map outcomes and sequences across an entire program, multiple courses, or a full curriculum framework -- use `curriculum-mapping` instead
- The user is a student seeking help navigating, studying, or succeeding in an existing online course -- use `course-companion` instead
- The user needs a microlearning asset (a single 5-minute training video script or a standalone infographic) without module-level scaffolding -- this skill is overkill for atomic assets
- The user needs a corporate onboarding program with HR compliance integration, organizational workflow mapping, or role-based training paths -- the scope and constraints differ enough to warrant a specialized skill
- The user is asking about LMS administration, technical setup, or platform configuration rather than instructional design -- that is a technical support task, not a course design task

---

## Process

### Step 1: Gather Context Before Designing Anything

Do not begin designing until you have collected all of the following. If the user has not provided them, ask in a single consolidated question rather than one item at a time.

- **Course identity:** Full course title, subject domain, and level (introductory undergraduate, graduate seminar, professional certification, K-12, corporate training)
- **Target audience:** Prior knowledge level, age range or career stage, technical comfort, any known accessibility needs, motivation context (required vs. elective, intrinsic vs. extrinsic)
- **Module scope:** Which module number this is out of how many total, what came before it, what follows it, and how many weeks or days it covers
- **Delivery mode:** Fully asynchronous (no required live sessions), synchronous-online (all live via video), or hybrid (some live, some self-paced). Clarify whether synchronous means scheduled sessions or optional live office hours.
- **Platform:** Canvas, Moodle, Blackboard Ultra, Brightspace (D2L), Google Classroom, Teachable, or custom LMS. Platform choice affects which native tools are available (e.g., Canvas SpeedGrader and Outcomes alignment, Moodle's Lesson activity, Brightspace's Release Conditions).
- **Enrollment size:** Matters for discussion scaling, group formation, and grading load
- **Estimated hours per week:** Accreditation standards specify approximately 3 hours of student work per credit hour per week. A 3-credit course in a 15-week semester = ~9 hours/week. Confirm the target.
- **Assessment constraints:** Does the institution require proctored exams? Is there a grade weighting policy? Does the LMS gradebook need to map to a specific grading schema?
- **New build vs. conversion:** Conversions require a content audit step that new builds do not.

### Step 2: Establish the Module Learning Objectives Using Bloom's Taxonomy

Apply Bloom's Revised Taxonomy with precision. The level of the cognitive demand in the objective determines the type of activity and assessment required.

- Write 2-5 objectives per module. Fewer than 2 is too shallow; more than 5 overloads a single module.
- Use the appropriate Bloom's verb tier for the module's position in the course arc. Early modules (weeks 1-3) should cluster in Remember and Understand. Mid-course modules should move through Apply and Analyze. Capstone modules should reach Evaluate and Create.
- Each objective must contain: (1) an observable action verb, (2) the specific content, and (3) a context or condition that clarifies the scope. Example: "Analyze a provided dataset using descriptive statistics to identify distribution shape and outliers" is a complete objective. "Understand statistics" is not.
- Run each objective through a measurability test: can you write an assessment item that would prove mastery of this objective? If not, rewrite the objective.
- Map each content item, activity, and assessment to at least one objective. Any element not tied to an objective is a candidate for removal.
- Distinguish between terminal objectives (what students achieve by module end) and enabling objectives (sub-skills needed to reach the terminal objective). Design lessons around enabling objectives; assess terminal objectives.

### Step 3: Apply Backward Design to Sequence the Entire Module

Use Wiggins and McTighe's Understanding by Design framework -- begin with the end assessment and work backward.

- **Stage 1 -- Desired results:** Confirm the terminal objectives. Ask: what does mastery of this module look like? What can a student do at the end that they could not do at the beginning?
- **Stage 2 -- Evidence of mastery:** Design the summative assessment first. It must require students to demonstrate the terminal objectives in an authentic context, not just recall information. A memory-retrieval multiple-choice quiz measures only the lower tiers; a case analysis, project deliverable, or simulation performance measures higher-order mastery.
- **Stage 3 -- Learning plan:** Now design the activities and content. Each activity should either build a skill the assessment requires or give feedback that helps students self-correct before the summative.
- Sequence activities using a concrete framework: (1) Activate prior knowledge, (2) Present new information in digestible chunks, (3) Guided practice with feedback, (4) Independent application, (5) Reflection and consolidation. This maps to Gagné's Nine Events of Instruction at the module level.
- Check that the module cognitive load is appropriate. A single module should not introduce more than 5-7 new core concepts (Miller's Law applied to instructional design). If the content exceeds this, split the module or create a prerequisite review.

### Step 4: Design Each Content Component with Specific Parameters

Every content element has a known set of design constraints. Apply each:

**Video lectures:**
- Maximum segment length: 6-9 minutes for introductory content; up to 12 minutes for complex worked examples. Research by Guo et al. (edX dataset) shows median engagement time plateaus around 6 minutes. Never assign a single unbroken video longer than 12 minutes.
- Break longer recordings into named segments (e.g., "Part 1: The Encoding Process," "Part 2: Short-Term vs. Working Memory"). Give each segment a clear outcome statement in its title or description.
- Embed active learning interruptions (Kaltura quizzes, Panopto inline questions, YouTube chapter markers with reflection prompts) every 3-5 minutes within a segment. These are not optional -- passive video watching produces minimal learning.
- Every video must have a text transcript (accessibility) and closed captions reviewed for accuracy (auto-generated captions average 80% accuracy; corrected captions are required for compliance with WCAG 2.1 and Section 508).
- Instructor-facing video (talking head) performs better than screen-only lectures for emotional connection. Use picture-in-picture for annotated slide + face visibility simultaneously.

**Readings:**
- Estimate reading time at approximately 200-250 words per minute for academic text. A 25-page chapter = approximately 45-55 minutes. Always state the page range, not just the chapter.
- Provide a reading guide with 3-5 focus questions for every assigned reading. This prevents passive skimming and gives students a pre-assessment of their comprehension.
- Distinguish between required reading (tested/referenced in assessments) and recommended/enrichment reading (clearly labeled as optional). Students overwhelmed by undifferentiated reading lists disengage.
- For converted courses, do not assign the same readings as the in-person version without evaluating digital accessibility. Check that PDFs are OCR-searchable and screen-reader compatible.

**Interactive and practice elements:**
- H5P (built into Canvas, Moodle, and Brightspace) provides drag-and-drop, interactive video, branching scenarios, image hotspots, and matching activities at no cost and with full LMS integration.
- Branching scenarios are the most cognitively demanding interactive type -- reserve them for modules where decision-making is a core skill (clinical judgment, ethical reasoning, professional communication).
- Self-assessment activities (e.g., a short quiz with immediate feedback and explanations) serve a dual purpose: formative feedback for students and data for the instructor about where the class is struggling.
- Simulations and virtual labs (PhET for physics/chemistry, HHMI BioInteractive for biology, virtual dissection tools) replace hands-on components in converted lab courses. Verify these meet the same learning objectives as the physical lab.

**Discussion forums:**
- Structured discussion is not the same as "posting questions." A high-quality prompt requires students to (1) take a position or make an argument, (2) connect it to course material with specificity, and (3) apply or analyze -- not just summarize.
- Standard timing structure for asynchronous cohort discussions: initial posts due by Wednesday at 11:59 PM; peer replies due by Sunday at 11:59 PM. This ensures a 2-3 day window for meaningful interaction.
- Do not use a single whole-class forum for courses with more than 30 students. Create discussion pods of 15-20 students. This increases the quality of peer interaction and reduces the grading burden.
- Require reply posts to add substantive new insight, apply a different framework to the same example, or offer a respectful counter-argument. "Great post, I agree!" replies receive zero points. State this explicitly in the rubric.

### Step 5: Build the Assessment Strategy with Integrity and Feedback Design

Every module needs both formative and summative assessment components. Design these with specific parameters, not general descriptions.

**Formative assessment design:**
- One auto-graded quiz per module (10-15 questions, 2 attempts allowed with different question pools, immediate feedback with rationale shown after submission). This serves as a learning tool, not just a grade.
- Use the quiz data diagnostically. If 60%+ of students miss the same item, the content delivery for that concept needs revision -- do not just re-explain it in an announcement.
- Ungraded but required activities (reflection journals, self-assessment checklists, concept maps) signal instructor presence and encourage metacognition without adding to grading load.
- Place formative checks at module entry (prior knowledge activation) and module midpoint (comprehension check before the summative).

**Summative assessment design:**
- Summative assessments should require higher-order thinking (Bloom's Apply level or above) even in introductory courses. Replace pure recall exams with application tasks: analyze a case, solve a novel problem, produce a product, evaluate competing arguments.
- For academic integrity in asynchronous courses: use open-book/open-note design with prompts that require integration and synthesis; assign unique or rotated prompts each term; use submission timestamps and LMS logs; require process artifacts (outlines, drafts) alongside final submissions. Proctoring software is a last resort and creates equity concerns for students without reliable webcams or private spaces.
- Every subjective assessment (paper, project, discussion, presentation) requires a rubric built before the assignment is posted. Rubrics must specify criteria, performance level descriptors, and point values. Students who can read the rubric before starting perform significantly better and submit fewer "what exactly do you want?" questions.
- Use analytic rubrics (separate criteria rated independently) for complex assignments -- holistic rubrics are faster to grade but provide less actionable feedback.
- Provide model or exemplar submissions (with instructor annotations) for high-stakes assignments when possible. This reduces grade disputes and calibrates student expectations.

**Feedback timing:**
- Formative quiz: immediate automated feedback.
- Discussion forum: instructor acknowledgment within 48 hours of initial post due date; grades returned within 7 days.
- Written assignments: substantive feedback within 10-14 days. Longer return times reduce the value of the feedback because students have moved on.

### Step 6: Engineer Deliberate Engagement Mechanisms

Online courses fail primarily through disengagement and isolation, not through content deficiency. Design engagement explicitly.

**Instructor presence (the single most important engagement variable):**
- Post a weekly module overview announcement every Monday (or the first day of each module). Include: a brief 2-3 sentence context-setter connecting this module to the previous one, the week's key objectives in plain language, a "what to tackle first" recommendation, and one hook (a compelling question, a surprising statistic, a news item related to the topic).
- Record a 2-3 minute "talking head" welcome video for the first module of each major course unit. Instructor face-time video significantly increases student sense of connection and retention rates.
- Respond to discussion forums within 24-48 hours of the initial post deadline. Do not grade discussions silently -- post 2-3 substantive replies that model the type of analysis you expect, name-drop well-reasoned student posts, and ask follow-up questions.
- Send a mid-module check-in announcement (mid-week) acknowledging common points of confusion visible in the quiz data or discussion posts.

**Social and peer presence:**
- Require peer interaction in every module. Rotate the form: discussion forum (weeks 1-3), peer review of a written draft (weeks 4-5), group collaborative document or shared analysis (weeks 6-7), structured peer debate (weeks 8-9). Repetition of only discussion forums erodes engagement.
- For peer review, provide a structured feedback protocol (not "give your classmate feedback"). The protocol should specify: identify one strength with evidence, identify one area for revision with a specific suggestion, ask one question that prompts the author to think more deeply. Unstructured peer review produces unhelpful praise.
- Use Canvas Groups, Moodle Groups, or Brightspace Groups to create persistent small learning communities (5-8 students) for the duration of the course. Students who feel they "belong" to a subgroup complete the course at higher rates.

**Motivation and progress architecture:**
- Use completion requirements in the LMS to enforce sequencing. Students should not be able to access the summative assignment until they have at least viewed all content items and submitted the formative quiz. This prevents assessment-only students from skipping learning.
- Progress bars (visible in Canvas student view, configurable in Moodle and Brightspace) provide tangible feedback on module completion. Students who see themselves as "70% done" on a Thursday have a concrete target.
- Cognitive signposting: begin each lesson with a "by the end of this lesson, you will be able to..." statement and end with a "what we covered" summary. This is not redundant -- it serves distinct cognitive encoding functions (advance organizer vs. consolidation).
- Variety of submission types prevents fatigue: rotate among written text submissions, audio recordings (voice memos), video responses (Flip, formerly Flipgrid), annotated image uploads, structured templates, and collaborative documents.

### Step 7: Specify Accessibility, Technical, and Logistics Requirements

These are non-negotiable compliance and quality requirements, not optional add-ons.

**Accessibility requirements (WCAG 2.1 Level AA minimum):**
- All videos: accurate closed captions + downloadable transcripts
- All images: descriptive alt text (not "image" or file names)
- All PDFs: OCR-readable, tagged for screen readers, logical reading order
- Color: never use color alone to convey meaning (add icons, patterns, or text labels)
- Font size: minimum 16px for body text in HTML pages; avoid justified text alignment
- All interactive H5P activities: keyboard navigable

**Technical logistics:**
- State file size limits for student uploads (most LMS platforms default to 500MB; video uploads should use a media tool like Kaltura or Canvas Studio, not direct file upload)
- Specify acceptable file formats for each submission type and provide a submission guide for first-time users
- Test every link, embedded activity, and media file before the module opens. Broken content is the number-one student complaint in online courses.
- Provide a tech support resource link and a "how to submit" practice activity in Module 1

**Logistics calendar:**
- Map all module deadlines to the course calendar. Avoid deadlines that fall on holidays recognized by major student populations.
- Create a consistent weekly rhythm so students can predict when things are due without consulting the syllabus every week. Example: "Content opens Monday, initial posts due Wednesday, replies and assignments due Sunday" -- and hold this pattern for every module.

### Step 8: Review the Completed Module Design for Coherence

Before finalizing the module outline, run it through this alignment audit:

- **Objective-activity alignment:** Every stated objective is addressed by at least one learning activity and one assessment item
- **Cognitive load check:** Total estimated student time for the module matches the target hours. A 3-credit, 15-week course module should have approximately 9 hours/week. Recalculate estimated times and adjust if the module is over- or under-loaded.
- **Bloom's progression check:** The sequence moves from lower to higher cognitive demand within the module (not just across the course)
- **Variety check:** No single activity type (video, reading, quiz) appears more than three times in a row in the module sequence
- **Feedback check:** Every assessment item has a defined feedback mechanism (automated, rubric-based instructor feedback, or peer review protocol)
- **Accessibility check:** All media and documents meet WCAG 2.1 requirements
- **Integrity check:** The summative assessment design is resistant to simple copy-paste or AI-generated responses (authentic context, personal application, or process documentation requirement)

---

## Output Format

Produce the complete module outline in the following structure. Fill in every field specifically -- never leave a placeholder unfilled.

```
## Online Course Module: [Full Module Title]

**Course:** [Course name and number]
**Module:** [Number] of [Total]
**Position in Course Arc:** [Early / Mid-course / Capstone] -- [Brief context: what preceded this module, what follows]
**Duration:** [X weeks / X days], [Y hours] estimated total student time
**Delivery Mode:** [Asynchronous / Synchronous / Hybrid -- specify live session schedule if synchronous]
**LMS Platform:** [Platform name and relevant tools available]
**Enrollment:** [Approximate number of students]
**Bloom's Level Target:** [Levels this module operates at, e.g., "Apply and Analyze"]

---

### Module Learning Objectives

By the end of this module, students will be able to:

| # | Objective | Bloom's Level | Assessed By |
|---|-----------|---------------|-------------|
| 1 | [Full objective with action verb, content, context] | [Level] | [Activity/assessment name] |
| 2 | [Full objective] | [Level] | [Activity/assessment name] |
| 3 | [Full objective] | [Level] | [Activity/assessment name] |

---

### Weekly Overview Announcement Script

> [2-3 sentence context connector to prior module]
> **This week you will:** [Plain-language summary of objectives]
> **Start here:** [First recommended activity]
> **Key question to keep in mind:** [A hook question that motivates engagement with the content]

---

### Module Schedule

| Day/Timeframe | Activity | Type | Estimated Time | Points | Objective(s) |
|---------------|----------|------|---------------|--------|--------------|
| [Day 1] | [Activity name] | [Video/Reading/Quiz/Discussion/Assignment] | [X min] | [pts or --] | [Obj #] |
| [Day 2-3] | [Activity name] | [Type] | [X min] | [pts or --] | [Obj #] |
| [Day 3 deadline] | [Activity name] | [Type] | [X min] | [pts] | [Obj #] |
| [Day 5-6] | [Activity name] | [Type] | [X min] | [pts or --] | [Obj #] |
| [Day 7 deadline] | [Activity name] | [Type] | [X min] | [pts] | [Obj #] |

**Module Total: [X hours] estimated student time | [Y] total points**

---

### Content Breakdown

#### Lesson [#]: [Title]
**Objectives addressed:** [List objective numbers]
**Bloom's level:** [Level]

**Video: "[Segment title]" ([X] min)**
- Topics covered: [Specific list]
- Embedded question at minute [X]: "[Exact question text]"
- Transcript and captions: Required
- Production note: [Talking head + slides / screen recording + narration / animated explainer]

**Reading: [Title, author, pages/URL]** ([Estimated time])
- Purpose: [What this reading adds that the video did not cover]
- Reading guide focus questions:
  1. [Question 1]
  2. [Question 2]
  3. [Question 3]
- Required or enrichment: [Required / Enrichment]

**Activity: [Activity title]** ([Estimated time] | [Points or ungraded])
- Tool: [H5P type / Canvas Quiz / Google Doc / external sim]
- Description: [Exactly what students do]
- Feedback mechanism: [Immediate automated / instructor review / peer]

---

#### Lesson [#]: [Title]
[Same structure repeated]

---

### Discussion Forum

**Forum title:** [Title]
**Groups:** [Whole class / Pods of [X] students]

**Prompt:**
> [Full discussion prompt written in final form -- not a description of the prompt, but the actual words students will read]

**Requirements:**
- Initial post: [Word count range], due [Day] at [Time]
- Peer replies: [Number] replies, [Word count range] each, due [Day] at [Time]
- Reply requirement: [Specific instructions -- what "substantive" means in this context]

**Discussion Rubric:**

| Criterion | Full Credit ([pts]) | Partial Credit ([pts]) | No Credit (0) |
|-----------|---------------------|------------------------|---------------|
| [Criterion 1: content/argument quality] | [Specific descriptor] | [Specific descriptor] | [Specific descriptor] |
| [Criterion 2: connection to course material] | [Specific descriptor] | [Specific descriptor] | [Specific descriptor] |
| [Criterion 3: peer engagement quality] | [Specific descriptor] | [Specific descriptor] | [Specific descriptor] |

---

### Assessments

#### Formative: [Quiz/Activity Title]
- **Type:** Auto-graded quiz
- **Questions:** [Number and format, e.g., "12 multiple-choice questions drawn from a 25-question pool"]
- **Attempts:** [Number], [with/without] different question pools per attempt
- **Feedback:** [Immediate / delayed] -- [What feedback students see: correct answer only / correct answer + rationale]
- **Points:** [X]
- **Objectives:** [List numbers]

#### Summative: [Assignment Title]
- **Type:** [Written assignment / Project / Presentation / Simulation performance]
- **Length/scope:** [Word count, file type, or performance criteria]
- **Prompt:**
  > [Full assignment prompt in final form]
- **Academic integrity design:** [Specific features that make this assignment resistant to contract cheating or AI generation without engagement with the specific course material]
- **Points:** [X]
- **Objectives:** [List numbers]

**Summative Rubric:**

| Criterion | Exemplary ([max pts]) | Proficient ([pts]) | Developing ([pts]) | Beginning ([pts]) |
|-----------|----------------------|-------------------|-------------------|------------------|
| [Criterion 1] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor] |
| [Criterion 2] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor] |
| [Criterion 3] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor] |
| [Criterion 4] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor] |

---

### Engagement and Instructor Presence Plan

| Touchpoint | Day/Timing | Action | Purpose |
|------------|------------|--------|---------|
| Module overview announcement | [Day 1] | [Specific content] | Orientation and motivation |
| Mid-module check-in | [Day 3-4] | [Specific content] | Address confusion, acknowledge progress |
| Discussion engagement | [Within 48 hrs of initial post deadline] | [Specific action] | Model analysis, social presence |
| Feedback on summative | [Within X days of deadline] | Rubric + written comments | Learning-oriented feedback |

---

### Accessibility Checklist

- [ ] All videos have corrected closed captions
- [ ] All videos have downloadable text transcripts
- [ ] All images have descriptive alt text
- [ ] All PDFs are OCR-readable and screen-reader tagged
- [ ] All H5P activities are keyboard navigable
- [ ] Module HTML pages use heading hierarchy (H1 > H2 > H3)
- [ ] No meaning conveyed by color alone
- [ ] All links use descriptive anchor text (not "click here")

---

### Alignment Summary

| Objective | Content Item | Activity | Assessment |
|-----------|-------------|----------|------------|
| [Obj 1 text] | [Video/Reading] | [Activity] | [Quiz item / Discussion / Assignment] |
| [Obj 2 text] | [Video/Reading] | [Activity] | [Quiz item / Discussion / Assignment] |
| [Obj 3 text] | [Video/Reading] | [Activity] | [Quiz item / Discussion / Assignment] |
```

---

## Rules

1. **Never write a learning objective using non-observable verbs.** Words like "understand," "appreciate," "know," "learn," or "be familiar with" cannot be assessed and must never appear in an objective. Rewrite any user-supplied objective that uses these words using Bloom's action verbs before building the module around it.

2. **Never design a video segment longer than 12 minutes without splitting it.** The split must produce complete, titled segments with individual purposes -- not arbitrary cuts. If a topic cannot be taught in 12 minutes, it requires two videos with distinct sub-objectives, not one long video.

3. **Never design a module where all assessment is summative.** Every module must include at least one formative check with automated feedback before the summative. Students with no formative feedback reach summative assessments without diagnostic information, and instructors have no early warning data about conceptual gaps.

4. **Never use a single whole-class discussion forum for a course with more than 30 students enrolled.** The cognitive overhead of reading 30+ posts is prohibitive, the average response quality degrades, and grading becomes unmanageable. Use discussion pods of 15-20 students maximum.

5. **Never assign estimated student time that exceeds the target credit-hour workload.** Calculate: (credit hours) × 3 hours × (1 for lecture replacement + 2 for outside work) = maximum weekly workload. A 3-credit course allows approximately 9 hours/week of total student engagement. If the module design exceeds this, remove content -- do not compress time estimates.

6. **Every subjective assessment must have a rubric finalized before the module opens.** A rubric written after students submit is affected by anchoring bias from early submissions. Build the rubric during module design, share it with students in the assignment instructions, and use the exact same rubric for grading.

7. **Never design discussion prompts that can be answered with summary or definition alone.** Discussion prompts must require students to apply, analyze, evaluate, or create -- not merely recall or restate what the readings said. If the prompt can be answered without having done the readings, redesign it.

8. **Always map every content item and every assessment item to at least one specific learning objective.** Any element that cannot be mapped to an objective is instructional noise. Present the alignment table in the module design output so the instructor can see and verify the connections.

9. **Never ignore academic integrity design.** For every summative assessment, specify at least one feature that makes generic or recycled responses inadequate: a unique dataset provided in the module, a reference to a specific case study or simulation result the student performed, a required connection to the student's own professional or personal context, or a process artifact (annotated draft, revision memo) required alongside the final submission.

10. **Never design a fully asynchronous module with zero instructor presence touchpoints.** At minimum, every module requires a posted module overview announcement and at least one visible instructor engagement in the discussion forum. Instructor absence in asynchronous courses is the leading predictor of student dropout and is within the designer's control.

11. **Always specify accessibility requirements for every media item at design time, not after production.** Retrofitting accessibility to video, PDFs, and interactive activities is significantly more expensive and time-consuming than building it in. The module design document must include accessibility specifications as deliverables, not afterthoughts.

12. **Do not recommend proctoring software as a primary academic integrity strategy.** Proctoring software creates significant equity barriers (private space, webcam, high-speed connection requirements), introduces legal and privacy concerns (biometric data collection), and generates high rates of false positives that penalize students unfairly. Design assessments that are intrinsically resistant to dishonesty through authentic task design.

---

## Edge Cases

### 1. The Module Has Too Much Content for One Week
This is the most common problem in course conversions. An in-person lecture covers significantly less ground than instructors believe because actual class time includes transitions, questions, and cognitive processing pauses. When the content audit reveals too much material, apply the following triage in order: (a) Identify which content is prerequisite knowledge that could be assigned as pre-module review rather than new instruction. (b) Move enrichment content to clearly labeled optional resources. (c) Split the module into two, adjusting the course timeline. (d) Consolidate related sub-topics into a single integrated treatment rather than covering each discretely. Do not simply list more readings and expect students to cover the gap independently -- this increases inequity between students who have time and those who do not.

### 2. Fully Synchronous Online Course (Live Sessions Only)
Design each live session like a well-structured interactive class, not a webinar. Break each 75-minute session into segments no longer than 20 minutes of direct instruction before a structured active learning break. Use breakout rooms (5-6 students, 8-10 minutes) with a specific collaborative task and a spokesperson report-out. Use live polling tools (Mentimeter, Poll Everywhere, or the LMS's built-in polling) at the opening of each session for prior knowledge activation and at the midpoint for comprehension checks. Record every session and post the recording within 24 hours -- this is non-negotiable for accessibility and time-zone equity. Design a "synchronous equivalent" activity for students who miss sessions: a 300-word reflection on the recording, not just "watch the recording," ensures engagement with the content.

### 3. Self-Paced Course with No Cohort and No Deadlines
The absence of social pressure and external deadlines is the primary completion risk. Compensate through structural and motivational design: use LMS completion conditions to lock modules until prerequisites are complete (this creates psychological momentum); divide each module into approximately 45-minute sessions with clear start-and-stop points that fit working adults' schedules; include a course roadmap with recommended timeline milestones ("Most students complete Modules 1-3 in the first two weeks"); use automated "check-in" messages triggered by LMS inactivity (most LMS platforms allow rule-based messaging: if a student has not logged in for 7 days, send an automated encouragement message); replace live peer interaction with structured self-assessment activities using answer keys and exemplars; add a module completion reflection prompt ("What from this module will you apply in your work? What questions do you still have?") to provide the metacognitive function that peer discussion normally serves.

### 4. Large Enrollment (100+ Students, Single Instructor)
Grade the gradeable items strategically. Auto-grade all objective assessments (quizzes, structured H5P activities). Use discussion pods of 15-20 students and assign each pod to a specific section or TA. Implement peer review for written assignments using a structured protocol (Calibrated Peer Review, Canvas Peer Review tool, or Moodle Workshop) -- well-designed peer review produces feedback quality comparable to instructor feedback for many assignment types, and the reviewing process itself is a learning activity. Create video feedback for whole-class common errors rather than writing the same individual comment 100 times (record a 4-minute screencast addressing the top 3 misconceptions visible in the submissions, post it as a module announcement). Use rubric-anchored grading in SpeedGrader, Moodle's marking tool, or Brightspace's rubric tool to minimize time per submission while maintaining quality and consistency. Brief TA graders with rubric norming sessions -- have all graders grade the same three sample submissions independently, then discuss discrepancies to calibrate standards before grading the full batch.

### 5. Converting an In-Person Course to Online
Never port in-person content directly to online format. The in-person version has invisible scaffolding (real-time facial expressions, spontaneous Q&A, body language feedback, hallway conversations) that does not transfer. Conduct a content audit: list every 10-minute segment of in-person instruction and classify it as (a) conceptual explanation best replaced by a video, (b) procedural demonstration best replaced by a screencast with pause-and-practice, (c) discussion/debate best replaced by an asynchronous forum or synchronous breakout, (d) in-class activity best replaced by a simulation, collaborative document, or structured peer task, or (e) formative check best replaced by an auto-graded quiz or reflection prompt. The primary failure mode in conversions is recording 50-minute lectures verbatim and posting them as online "videos." Chunk all lecture recordings to 10 minutes maximum, re-record with interactivity designed in, and restructure the remaining contact time into student-active engagement.

### 6. Courses for Non-Traditional Students (Working Adults, Part-Time Enrollment)
Design for maximum flexibility without sacrificing rigor. All content delivery must be asynchronous with flexible access windows (never "watch the video at 7 PM"). Keep file sizes small enough for mobile data access -- avoid embedding high-resolution media that requires high-bandwidth downloads. Discussion deadlines should be generous (48-hour initial post window, 4-day reply window) to accommodate shift workers and caregivers. Offer multiple acceptable formats for submission when possible: written response, recorded video response, or annotated template -- students with strong verbal but limited writing fluency benefit significantly from audio/video options. State explicitly in the module overview approximately how many hours the module requires, broken into sessions: "This module takes approximately 8 hours total. You can complete it in four 2-hour sessions, two 4-hour sessions, or any other combination." Working adults are expert at time allocation when given accurate information.

### 7. Students With Significant Range in Prior Knowledge (Heterogeneous Cohort)
When the enrollment spans a wide range of background knowledge (common in professional development courses, continuing education, or mixed-level graduate seminars), design modular prerequisite scaffolding. Provide an optional "Module 0" or "Foundations" unit containing foundational content that advanced students can skip and novices can use. Use a diagnostic quiz at module entry (ungraded, with a self-assessment framework: "If you scored 8-10, you have strong foundations and can skim the first video; if you scored below 5, start with the foundations reading") to help students self-sort. Offer enrichment paths within each module: clearly labeled "Going Deeper" resources for advanced students that extend the module content without being required. Avoid designing every module for the most underprepared student -- this bores and disengages advanced learners. Design for the middle of the distribution and scaffold up and down.

### 8. Modules That Must Include Lab, Clinical, or Studio Components
Hands-on components require the most creative online translation work. For lab sciences: identify whether the learning objective requires the physical experience (developing motor skills in pipetting technique) or the cognitive experience (understanding what happens when a buffer is overwhelmed). Motor skill development cannot be fully replicated online; cognitive science objectives can be addressed through virtual labs, simulation tools, or pre-recorded lab demonstrations with structured observation guides. For clinical education: use high-fidelity video case studies with structured decision-making prompts, branching scenario simulations, and reflective analysis assignments. For studio arts: require students to document their process (not just the product) with time-stamped photos or video of work in progress; use peer critique with a structured protocol adapted from in-person critique formats; synchronous critique sessions can be held live or asynchronously through recorded video critiques posted in discussion forums.

---

## Example

**Input from user:** "I need to design Module 7 of 10 for an online undergraduate Business Ethics course. It's on stakeholder theory and corporate social responsibility (CSR). The course is fully asynchronous on Canvas, 3 credit hours, 15-week semester. About 60 students enrolled. One instructor, no TAs."

---

## Online Course Module: Stakeholder Theory and Corporate Social Responsibility

**Course:** Business Ethics (MGMT 3310)
**Module:** 7 of 10
**Position in Course Arc:** Mid-to-late course -- students have covered ethical frameworks (utilitarianism, deontology, virtue ethics) in Modules 1-3, corporate governance and fiduciary duty in Modules 4-5, and environmental ethics in Module 6. This module applies ethical frameworks to stakeholder-facing decisions. Module 8 will apply these concepts to whistleblowing and corporate misconduct.
**Duration:** 1 week, approximately 9 hours estimated total student time
**Delivery Mode:** Fully asynchronous (no live sessions)
**LMS Platform:** Canvas (SpeedGrader, Peer Review, H5P, Canvas Studio for video, Groups tool)
**Enrollment:** 60 students
**Bloom's Level Target:** Apply and Evaluate

---

### Module Learning Objectives

By the end of this module, students will be able to:

| # | Objective | Bloom's Level | Assessed By |
|---|-----------|---------------|-------------|
| 1 | Explain Freeman's stakeholder theory and distinguish it from Friedman's shareholder primacy model using specific characteristics of each framework | Understand | Module quiz (items 1-5), discussion post |
| 2 | Apply a stakeholder analysis framework to a real company decision, identifying all affected stakeholders, their interests, and the power/interest relationship | Apply | Stakeholder Analysis Assignment |
| 3 | Evaluate a company's published CSR report using at least two ethical frameworks from earlier in the course, identifying strengths and contradictions in the company's stated commitments | Evaluate | Stakeholder Analysis Assignment |
| 4 | Construct an argued recommendation for how a company should prioritize competing stakeholder claims in a conflict scenario | Create | Discussion initial post + Assignment conclusion |

---

### Weekly Overview Announcement Script

> In Module 6, we examined how companies relate to the natural environment -- now we zoom out further to examine the full landscape of everyone a company affects and is affected by. The tension at the center of this module is one of the most consequential in modern business: does a corporation exist to maximize value for shareholders, or does it owe obligations to a broader web of stakeholders? Your answer to that question shapes every subsequent ethical judgment you make about corporate behavior.
>
> **This week you will:** Distinguish Freeman's stakeholder theory from Friedman's shareholder primacy; apply a structured stakeholder analysis to a real company decision; and evaluate a published CSR report using the ethical frameworks you built in Modules 1-3.
>
> **Start here:** Open Lesson 1 and watch the two video segments before reading the chapter. The videos will give you the conceptual scaffolding that makes the reading significantly clearer.
>
> **Key question to keep in mind as you work through the module:** When a company claims to "care about all stakeholders," what would we need to see in their actual decisions -- not their press releases -- to believe them?

---

### Module Schedule

| Day | Activity | Type | Estimated Time | Points | Objective(s) |
|-----|----------|------|---------------|--------|--------------|
| Monday | Video: "Two Models of the Corporation" Seg A (9 min) | Video | 9 min | -- | 1 |
| Monday | Video: "Two Models of the Corporation" Seg B (8 min) | Video | 8 min | -- | 1 |
| Monday | Reading: Textbook Ch. 12, pp. 287-318 | Reading | 55 min | -- | 1, 2 |
| Monday--Tuesday | H5P: Stakeholder Mapping Interactive | Interactive | 25 min | 5 | 2 |
| Tuesday | Quiz: Stakeholder Theory Foundations | Auto-graded quiz | 20 min | 15 | 1 |
| Wednesday | Video: "Reading a CSR Report Critically" (10 min) | Video | 10 min | -- | 3 |
| Wednesday | Reading: Two real CSR report excerpts (provided PDFs) | Reading | 40 min | -- | 3 |
| Wednesday | Discussion: Stakeholder Priority Debate | Forum initial post | 40 min | 15 | 1, 4 |
| Thursday--Friday | Case reading: "The Costco Paradox" (provided) | Reading | 30 min | -- | 2, 3 |
| Friday--Sunday | Discussion: Peer replies | Forum replies | 30 min | 10 | 4 |
| Sunday 11:59 PM | Stakeholder Analysis Assignment | Written assignment | 120 min | 40 | 2, 3, 4 |

**Module Total: approximately 9 hours estimated student time | 85 total points**

---

### Content Breakdown

#### Lesson 1: Two Models of the Corporation (Monday)
**Objectives addressed:** 1
**Bloom's level:** Understand

**Video Segment A: "Two Models of the Corporation -- Friedman vs. Freeman" (9 min)**
- Topics covered: Milton Friedman's 1970 shareholder primacy argument; the historical context of corporate personhood and fiduciary duty; Freeman's 1984 stakeholder theory introduction; the philosophical roots of each position
- Embedded question at minute 4: "Friedman argues that a corporate executive who spends company money on social causes is effectively imposing an unauthorized tax on shareholders. Which ethical framework from Module 2 best supports this argument -- and which undermines it?"
- Transcript and captions: Required. Captions to be reviewed and corrected before posting.
- Production note: Instructor talking head + annotated slide with side-by-side comparison diagram

**Video Segment B: "Stakeholder Theory in Practice" (8 min)**
- Topics covered: Freeman's definition of stakeholder (any group that can affect or be affected by the achievement of the firm's objectives); primary vs. secondary stakeholders; stakeholder salience model (power, legitimacy, urgency); examples from Target, Patagonia, and ExxonMobil
- Embedded question at minute 5: "Apply the salience model: a local environmental group is organizing a boycott of a company's product. Using the three dimensions of salience, how would you classify this stakeholder's claim?"
- Transcript and captions: Required
- Production note: Same format -- talking head + diagram of the three-circle salience model

**Reading: Textbook Chapter 12, "Corporate Stakeholders and Social Responsibility" (pp. 287-318)** (estimated 55 minutes)
- Purpose: Deepens the video content with additional cases, introduces Carroll's CSR Pyramid (philanthropic/ethical/legal/economic responsibilities), and covers ISO 26000 social responsibility standards
- Reading guide focus questions:
  1. How does Carroll's Pyramid order the four responsibilities, and what is the ethical argument for that ordering?
  2. What distinguishes a "stakeholder" from a "stockholder" in Freeman's framework? What are the implications of that distinction?
  3. The chapter presents the Business Roundtable's 2019 Statement on the Purpose of a Corporation. What changed from their 1997 statement, and what critics argue the change was rhetorical rather than substantive?
- Required: Yes

**Activity: H5P Stakeholder Mapping Interactive** (25 min | 5 points)
- Tool: H5P branching scenario embedded directly in Canvas module page
- Description: Students are presented with a fictional mid-size manufacturer (Apex Components Inc.) that is considering outsourcing its production to a lower-cost country. The H5P activity walks them through identifying all stakeholders, classifying each by the salience model dimensions, and mapping them on a Power/Interest grid. The activity asks three decision-point questions where students choose which stakeholder group to prioritize and receive feedback explaining the trade-offs of each choice.
- Feedback mechanism: Immediate automated feedback after each branching choice, with rationale grounded in Freeman and Carroll's frameworks. Completion is auto-logged in Canvas gradebook.

---

#### Lesson 2: Evaluating CSR Commitments (Wednesday)
**Objectives addressed:** 3
**Bloom's level:** Evaluate

**Video: "Reading a CSR Report Critically" (10 min)**
- Topics covered: What companies are legally required vs. voluntarily choosing to disclose; the difference between GRI Standards-aligned reporting and marketing-oriented "impact reports"; common rhetorical moves in CSR reports (reframing liabilities as opportunities, vague commitments without timelines, selective metric reporting); a side-by-side comparison of a substantive disclosure vs. a greenwashing example
- Transcript and captions: Required
- Production note: Screen recording of two real CSR report PDFs with instructor narration and annotation; no talking head needed for this segment

**Reading: CSR Report Excerpts (provided as tagged PDF)** (estimated 40 minutes)
- Purpose: Gives students primary source material to practice critical evaluation skills
- Excerpt A: Selected pages from a large retailer's annual sustainability report (chosen for substantive, metrics-grounded disclosure)
- Excerpt B: Selected pages from an energy company's "impact report" (chosen for rhetorical strategies and unverifiable commitments)
- Reading guide focus questions:
  1. For each excerpt: what stakeholders are named explicitly? What stakeholders are absent from the narrative?
  2. What ethical framework (utilitarian, deontological, or virtue ethics) does each company appear to be invoking in justifying its CSR commitments?
  3. What would you need to know to verify the claims made in each excerpt?
- Required: Yes

**Case Reading: "The Costco Paradox" (instructor-provided PDF)** (30 min)
- A 2,400-word case study examining Costco's business model: above-market wages, premium benefits for hourly workers, resistance to analyst pressure to cut labor costs, and strong financial performance. The case presents shareholder pressure from Wall Street analysts arguing Costco's labor costs reduce shareholder returns, and counter-arguments from labor economists and CSR proponents.
- Reading guide: Students should come to the assignment and discussion having identified (1) which stakeholders Costco is explicitly prioritizing, (2) what evidence Costco leadership cites for this priority, and (3) how a Friedman advocate would critique the strategy.
- Required: Yes

---

### Discussion Forum

**Forum title:** The Stakeholder Priority Debate
**Groups:** Three pods of 20 students each (pre-assigned in Canvas Groups at course start, maintained throughout the semester)

**Prompt:**
> The Costco case presents a company that consistently prioritizes employee welfare even under significant shareholder pressure. Critics argue this violates fiduciary duty to shareholders. Defenders argue it creates long-term shareholder value. But here is the harder question: suppose Costco's strategy did NOT produce superior financial returns -- suppose employee-first policies reduced shareholder value by 15%.
>
> In your initial post (250-350 words), address the following:
> 1. Using Freeman's stakeholder theory, construct the argument that Costco's employee-first approach is ethically justified even if it reduces shareholder returns. Be specific -- reference the framework, not just the general concept.
> 2. Using Friedman's shareholder primacy argument, construct the strongest possible counter-argument. (Note: you are not endorsing this view -- you are demonstrating you understand it well enough to argue it.)
> 3. State and defend your own position: which framework better guides corporate decision-making, and why? Your defense must engage with at least one specific piece of evidence from the Costco case or the CSR report excerpts.
>
> You are not being graded on which position you take -- you are being graded on the rigor with which you argue it and your ability to engage accurately with both frameworks.

**Requirements:**
- Initial post: 250-350 words, posted by Wednesday at 11:59 PM
- Peer replies: 2 replies within your pod, 80-120 words each, posted by Sunday at 11:59 PM
- Reply requirement: Each reply must either (a) identify a specific assumption in your classmate's argument that you think is contestable and explain why, or (b) offer a real-world example that either strengthens or complicates their position. "I agree with your analysis" alone earns zero points for the reply criterion.

**Discussion Rubric:**

| Criterion | Full Credit | Partial Credit | No Credit |
|-----------|-------------|----------------|-----------|
| Freeman argument (5 pts) | Accurately constructs Freeman's argument with specific reference to stakeholder theory concepts; argument is logically structured | Freeman's framework referenced but imprecisely or incompletely applied | Freeman not engaged or substantially incorrect |
| Friedman counter-argument (5 pts) | Accurately represents Friedman's position; demonstrates steel-man ability (strongest version of opposing argument) | Friedman referenced but caricatured or oversimplified | Friedman absent or misrepresented |
| Personal position with evidence (5 pts) | Takes a clear position with explicit reasoning; cites specific evidence from case or CSR excerpts | Position stated but not supported with evidence, or
