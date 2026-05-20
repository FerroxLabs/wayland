---
name: rubric-creation
description: |
  Creates complete analytic rubrics with criteria, performance levels, and descriptors for any assignment type. Produces a filled-in rubric document that educators can use directly for grading and student feedback -- not a tutorial on rubric design.
  Use when an educator asks to create a rubric, scoring guide, or grading criteria for an assignment, project, presentation, or performance task.
  Do NOT use for creating the assessment itself (use `assessment-design`), for student self-assessment tools (use `learning-objectives`), or for feedback writing (use `student-feedback`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "teaching lesson-plan step-by-step guide"
  category: "education"
  subcategory: "teaching"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Rubric Creation

## When to Use

Use this skill when:

- An educator explicitly asks to "create a rubric," "build a scoring guide," "make grading criteria," or "develop a rating scale" for any assignment, project, presentation, lab report, portfolio, or performance task
- A teacher wants to standardize grading across multiple sections, co-teachers, or instructional aides -- rubrics reduce inter-rater variability and need to be calibrated in advance
- An instructor is preparing an assignment where student expectations need to be communicated transparently before work begins -- rubrics double as instructional tools when shared ahead of time
- A department chair, curriculum coordinator, or instructional coach needs a rubric that aligns to a specific framework (Common Core State Standards, Next Generation Science Standards, AP scoring guidelines, IB criteria, state-specific standards)
- A user wants to revise or improve an existing rubric that is too vague, produces grade inflation, or does not differentiate between high and low performance
- An educator is designing a performance task, portfolio review, or capstone project and needs criteria for evaluating complex, multidimensional work that cannot be scored by a simple answer key
- An educator asks for a "single-point rubric," "holistic rubric," "analytic rubric," "4-point scale," "mastery-based rubric," or any named rubric format

Do NOT use when:

- The user wants to create the actual test, essay prompt, project instructions, or assignment itself -- use `assessment-design` instead; the rubric presupposes the assessment exists
- The user wants to write narrative feedback or comments for a specific student's already-graded paper -- use `student-feedback` instead; this skill creates instruments, not feedback prose
- A student asks what a rubric means, how they are being graded, or wants help understanding learning targets -- use `learning-objectives` to clarify student-facing goals
- The user wants to design a self-assessment checklist or peer-review form for students to complete -- these are related but structurally different from teacher-facing rubrics and require `student-feedback` or `assessment-design`
- The user needs a standards alignment document, curriculum map, or scope-and-sequence -- rubric creation is one component of curriculum design, not a substitute for it
- The assignment is purely objective with a clear answer key (multiple-choice tests, computation problems, fill-in-the-blank) -- rubrics are for evaluating work where quality exists on a continuum, not binary correct/incorrect

---

## Process

### Step 1: Gather Rubric Context Before Generating Anything

Never generate a rubric without first confirming the critical inputs. If the user's request is incomplete, ask for the missing items as a single grouped question -- do not ask one at a time.

**Required inputs:**
- Assignment type and description (e.g., "5-paragraph persuasive essay," "science fair research poster," "10-minute Socratic seminar contribution," "calculus problem set with work shown")
- Grade level and subject/course (grade level affects vocabulary of descriptors; a 4th-grade descriptor uses different language than a 12th-grade one even for the same skill)
- Learning objectives or standards being assessed (request at least 2-3; if the user cannot supply them, propose standards and confirm before proceeding)
- Total points, grade weight, or percentage of the course grade
- Rubric format preference: analytic (default), holistic, or single-point -- if the user does not specify, default to analytic and note the choice
- Number of performance levels: default to 4 if unspecified; note that 3-level and 5-level rubrics exist and offer trade-offs

**Useful but optional:**
- Whether the rubric will be shared with students in advance (affects descriptor language -- student-facing language is simpler and more empowering)
- Whether multiple raters will use it (affects need for calibration notes and anchor examples)
- Whether the assignment has required components (page count, citation style, format) that should be embedded in a criterion or treated as a completion check

**If context is missing:** Ask a single grouped prompt: "To build the most useful rubric, I need a few details: What is the assignment? What grade level and subject? What learning objectives or standards does it address? How many total points? Any preference on rubric format (analytic, holistic, single-point)?"

---

### Step 2: Determine Rubric Format

Select the appropriate format based on purpose and context -- do not default to analytic without considering the alternatives.

**Analytic rubric (default for most assignments):**
- Separate criteria scored independently; each criterion has its own row and descriptor set
- Best for: essays, research papers, projects, presentations, lab reports, performances
- Advantage: granular diagnostic feedback; students know exactly where they lost points
- Disadvantage: time-intensive to score; can feel reductive for highly creative work
- Use when the assignment has 3 or more distinct, independently evaluable dimensions

**Holistic rubric:**
- Single score based on overall impression; one paragraph per performance level describing the whole work
- Best for: timed writing, quick formative checks, when rater time is severely limited, early drafts
- Advantage: fast to score; captures gestalt quality of complex work
- Disadvantage: minimal diagnostic value; difficult to use for targeted feedback
- Use when the assignment is short, speed is prioritized, or criteria are deeply interdependent

**Single-point rubric:**
- Only the "Proficient/Meets Standard" level is described in the center column; raters annotate the blank columns with specific strengths or growth areas
- Best for: growth-mindset classrooms, portfolios, self-assessment, formative feedback
- Advantage: avoids "chasing points" behavior; focuses attention on quality description
- Disadvantage: requires raters who can generate specific, personalized feedback -- not suitable for high-stakes summative grading where consistency is critical
- Use when feedback quality matters more than score precision

**Task-specific vs. general rubric:**
- Task-specific: descriptors reference the actual content of the assignment (mentions specific authors, required sources, named concepts from the unit)
- General (transferable): descriptors describe skills in subject-neutral terms and can be reused across multiple assignments
- Default to task-specific unless the educator explicitly wants a reusable instrument

---

### Step 3: Identify and Sequence Criteria

Criteria are the evaluable dimensions of the assignment. Selecting the right criteria is the most intellectually demanding step -- poor criteria produce rubrics that feel arbitrary.

**How to derive criteria:**
- Map each criterion to a distinct learning objective or standard; a rubric should not contain criteria that no learning objective supports
- Start with the assignment type and ask: what would an expert reviewer notice first? (For essays: argument quality; for lab reports: hypothesis and conclusion logic; for presentations: claim clarity and evidence)
- 4-6 criteria is optimal for most analytic rubrics; fewer than 3 produces a rubric that is too coarse, more than 7 produces cognitive overload for raters and students
- Criteria must be mutually exclusive -- if a student's poor grammar also lowers their "clarity of argument" score, you are double-penalizing one flaw; separate the criterion clearly

**Weighting decisions:**
- Weight criteria by their centrality to the learning objectives, not by how easy they are to see or count
- A useful heuristic: the criterion that most directly demonstrates the primary learning objective should carry 25-35% of total points
- Secondary criteria (supporting skills, format, conventions) should carry 10-20% each
- Conventions/mechanics should rarely exceed 15-20% of total points -- this signals to students that ideas matter more than surface correctness
- Common weighting errors: overweighting mechanics, underweighting analysis, giving equal weight to unequal criteria

**Common criteria by assignment type:**

| Assignment Type | Typical Criteria Set |
|----------------|---------------------|
| Argumentative essay | Thesis/claim, evidence & reasoning, counterargument, organization, conventions |
| Research paper | Research question, source quality & integration, analysis, organization, citations/format |
| Science lab report | Hypothesis & background, methodology, data & analysis, conclusions, communication |
| Oral presentation | Content accuracy, organization, evidence & support, delivery & communication, visual aids |
| Creative writing | Voice & style, narrative structure, character/imagery development, originality, conventions |
| Math problem set | Conceptual understanding, procedure & method, accuracy, communication of reasoning |
| Group project | Research/content quality, collaboration & process, presentation/product, individual contribution |
| Socratic seminar | Quality of contributions, use of textual evidence, responsiveness to peers, discussion skills |

**Sequencing:** List criteria in order of importance to the learning objectives, not in the order a student would complete them. Most important criterion first; conventions last.

---

### Step 4: Write Performance Level Descriptors

This is where most rubrics fail. Vague descriptors produce unreliable scoring. Every descriptor must be written so that two independent raters, reading the same student work, would assign the same score.

**Performance level naming conventions:**
- 4-level: Exemplary / Proficient / Developing / Beginning (clearest for most contexts)
- 4-level alternative: Distinguished / Proficient / Approaching / Beginning (useful for standards-based grading)
- 4-level alternative: Advanced / Meets Standard / Approaching Standard / Below Standard (common in standards-referenced systems)
- 3-level (when 4 produces too many shades): Exceeds / Meets / Does Not Yet Meet
- 5-level: Exemplary / Strong / Proficient / Developing / Beginning (useful when assignment populations are wide-ranging)
- Never use letter grades (A/B/C) as level names -- this conflates criterion scores with course grades

**Writing each descriptor -- the ABCD test:**
Every descriptor should be Accurate (reflects what students actually produce), Behavioral (describes observable outputs, not internal states), Clear (readable by a student), and Differentiating (clearly distinct from adjacent levels).

Prohibited descriptor language:
- "shows understanding" -- replace with "correctly identifies," "accurately explains," "provides examples of"
- "demonstrates knowledge" -- replace with "names," "defines," "applies," "calculates"
- "adequate," "good," "excellent" -- these are evaluative labels, not descriptors
- "some" without quantity -- replace with "1-2," "at least 3," "fewer than half"
- "mostly," "often," "sometimes" -- replace with "in 3 of 4 instances," "in the majority of paragraphs," "consistently throughout"

**Constructing parallel descriptors:**
- If the Exemplary descriptor says "uses 4 or more sources with MLA citations," the Proficient must say "uses 3 sources with mostly correct MLA citations," Developing must say "uses 1-2 sources or citations contain significant errors," and Beginning must say "no sources cited or sources are unrelated"
- The key variable that shifts across levels should be consistent: quantity (4+ / 3 / 1-2 / 0), quality (sophisticated / competent / partial / minimal), or frequency (consistently / usually / sometimes / rarely)
- Pick ONE primary variable to shift across levels per criterion -- mixing quantity variables in one row and quality variables in another produces inconsistency

**Writing the Proficient descriptor first:** Start with the Proficient/Meets Standard level -- this anchors the criterion. Then write Exemplary (what does exceeding proficiency look like?), then Beginning (what does near-failure look like?), then Developing (what falls in between?). Developing is the hardest descriptor to write because it requires identifying the specific gap between partial and full achievement.

**Language register by grade level:**
- K-5: Short, simple sentences; use student-facing language; pictures may supplement
- 6-8: Complete sentences; some academic vocabulary with clear meaning
- 9-12: Academic register; subject-specific vocabulary appropriate
- Higher education: Technical vocabulary; professional register throughout

---

### Step 5: Assign Point Values and Calculate Totals

Point distribution is a policy decision with real consequences for grade fairness. Do it deliberately.

**Two calculation methods:**

*Method 1 -- Weighted multiplier:* Each criterion has a base score (1-4) multiplied by a weight. Example: Thesis criterion, weight 7, maximum score = 4 × 7 = 28 points. This method allows fine-grained weighting.

*Method 2 -- Fixed points per level:* Each criterion has a maximum point value, and each level earns a percentage: Exemplary = 100%, Proficient = 75%, Developing = 50%, Beginning = 25%. Simpler to communicate to students, less flexible for weighting.

**Choosing total point values:**
- If the assignment grade is a percentage of a 100-point scale, anchor the rubric to 100 points
- If the assignment is worth a specific number of points in a gradebook (e.g., 50 points), design the rubric to sum to that value exactly -- do not create a rubric that sums to 80 and scale it; this introduces rounding errors and confuses students
- Common configuration: 5 criteria summing to 100 points -- Criterion A (28), Criterion B (28), Criterion C (20), Criterion D (12), Criterion E (12)

**Grade boundary derivation:**
- Grade boundaries should reflect the meaning of each performance level, not arbitrary percentage cutoffs
- A student who scores Proficient (3) on all criteria earns 75% of total points -- this should map to a B or equivalent "meets standard" grade
- A student who scores Developing (2) on all criteria earns 50% -- this is typically a D or "approaching"
- Adjust grade boundaries based on the assignment's stake (summative vs. formative) and the course's grading philosophy

---

### Step 6: Write Detailed Descriptors Section

The summary table (Step 4) contains compressed descriptors. The detailed descriptors section expands each one into 2-4 sentences with specific, quotable indicators. This section is what makes the rubric usable for calibration and feedback.

**Each detailed descriptor should:**
- State the observable evidence explicitly (what does the rater look for on the page, in the presentation, or in the performance?)
- Include a concrete example or threshold where meaningful (e.g., "at least three pieces of evidence, each followed by 2-3 sentences of analysis")
- Avoid restating the criterion name -- describe what the work looks like, not what the category is called
- For the Proficient level, optionally include an exemplar sentence or phrase showing the kind of writing/work that meets standard

---

### Step 7: Add Scoring Notes and Calibration Guidance

A rubric without scoring notes is a rubric that will be applied inconsistently.

**Required scoring notes:**
- **Between-level scoring:** State the policy explicitly. Options: (a) always round to the lower level and note strengths from the higher level in feedback; (b) allow half-point or intermediate scores; (c) use professional judgment and document reasoning. Choose one and state it.
- **Zero policy:** A 0 should mean "criterion was not attempted or is entirely absent," not "attempted poorly." The Beginning level (1) covers poor attempts. Reserve 0 for missing components, academic integrity violations, or entirely off-topic submissions.
- **Missing components:** If the assignment requires specific elements (a Works Cited page, a labeled diagram, a specific section), state whether missing those elements affects a single criterion or creates an automatic cap.
- **Late work:** Do not embed late penalties in the rubric criteria -- rubric scores should reflect quality, not timeliness. Handle lateness in the gradebook separately. State this explicitly in scoring notes.
- **Academic integrity:** Note that plagiarized sections cannot receive criterion scores; specify what happens when only a portion of the work is flagged.

**Calibration notes (for multi-rater contexts):**
- Recommend at least one norming session before large-scale grading
- Suggest using 3 anchor papers (one clear Exemplary, one clear Developing, one border case) to align rater interpretation
- Note the criteria most likely to produce inter-rater disagreement (typically: creativity, voice, analysis depth) and where to apply the most careful judgment

---

### Step 8: Review the Rubric for Validity and Reliability

Before delivering the rubric, run a quick internal check:

**Validity check:**
- Does every criterion trace to a learning objective? If a criterion exists that no learning objective supports, remove it or it may be legally indefensible for high-stakes assessments.
- Would a student who achieved all the learning objectives score at Proficient or Exemplary? If not, the criteria do not reflect the objectives.
- Are the highest-weighted criteria the most educationally important ones?

**Reliability check:**
- Could two raters read the same student paper and use the same level descriptor without conferring? If not, the descriptor is too vague.
- Are adjacent levels clearly distinguishable? Read Proficient and Developing for each criterion side by side -- a rater should not hesitate about which applies.
- Are all descriptors written in parallel structure within each criterion?

**Bias check:**
- Do any descriptors privilege particular cultural contexts, communication styles, or background knowledge? (Example: penalizing non-standard dialect features under "conventions" without specifying that Standard Academic English is the target register and why)
- Do any criteria inadvertently assess identity rather than skill? (Example: "enthusiasm" in participation rubrics can reflect cultural communication norms, not academic engagement)

---

## Output Format

```
## Rubric: [Assignment Title]

**Assignment:** [1-2 sentence description of the task, including any required length,
format, or components]
**Subject/Course:** [Subject and grade level or course name]
**Total Points:** [Number]
**Assignment Weight:** [Percentage of course grade or gradebook category, if known]
**Rubric Format:** Analytic | Holistic | Single-Point
**Standards Addressed:** [List specific standards codes and names, e.g.,
CCSS.ELA-LITERACY.W.9-10.1 -- Write arguments to support claims]

---

### Quick Reference Scoring Table

| Criterion | Exemplary (4) | Proficient (3) | Developing (2) | Beginning (1) | Weight | Max Points |
|-----------|--------------|----------------|----------------|---------------|--------|------------|
| [Criterion 1 name] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | ×[N] | /[max] |
| [Criterion 2 name] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | ×[N] | /[max] |
| [Criterion 3 name] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | ×[N] | /[max] |
| [Criterion 4 name] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | ×[N] | /[max] |
| [Criterion 5 name] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | [compressed descriptor] | ×[N] | /[max] |

**Total: /[Total Points]**

---

### Detailed Descriptors

#### Criterion 1: [Name] (×[Weight] = [Max Points] points)

*What this criterion assesses: [One sentence explaining what skill or objective this measures]*

| Level | Score | Descriptor |
|-------|-------|------------|
| Exemplary | [N] | [2-4 sentences. Observable evidence. Specific thresholds. Optional: example phrase or sentence.] |
| Proficient | [N] | [2-4 sentences. Observable evidence. This is the target level. Describe what success looks like.] |
| Developing | [N] | [2-4 sentences. Name the specific gap. What is present and what is missing?] |
| Beginning | [N] | [2-4 sentences. Describe minimal or absent evidence. What would a rater see?] |

#### Criterion 2: [Name] (×[Weight] = [Max Points] points)

*What this criterion assesses: [One sentence]*

| Level | Score | Descriptor |
|-------|-------|------------|
| Exemplary | [N] | [...] |
| Proficient | [N] | [...] |
| Developing | [N] | [...] |
| Beginning | [N] | [...] |

[Repeat for each criterion]

---

### Grade Boundaries

| Total Score | Percentage | Grade | Interpretation |
|-------------|-----------|-------|----------------|
| [X-Y] | 90-100% | A | Exceeds expectations; work demonstrates mastery |
| [X-Y] | 80-89% | B | Meets expectations; solid performance with minor gaps |
| [X-Y] | 70-79% | C | Approaching expectations; key elements present but underdeveloped |
| [X-Y] | 60-69% | D | Below expectations; significant revision or reteaching needed |
| Below [X] | Below 60% | F | Does not meet minimum expectations; student conference recommended |

*Grade boundaries may be adjusted to match course grading policy.*

---

### Scoring Notes

**Between levels:** [State the policy -- round down and note strengths, allow half-points, etc.]
**Zero policy:** Score of 0 is reserved for [missing component / entirely off-topic / academic integrity violation]. A poor attempt earns a 1 (Beginning), not a 0.
**Late work:** Score rubric criteria on quality only. Apply late penalties separately in the gradebook per classroom policy.
**Missing required components:** [Specify what happens if a required element (Works Cited, labeled diagram, required section) is absent -- does it cap the criterion score or affect a specific criterion only?]
**Academic integrity:** [State policy for plagiarized or AI-generated sections]

---

### Calibration Notes *(for use when multiple raters will score this assignment)*

- Criteria most likely to produce inter-rater variation: [name the 1-2 hardest criteria to score consistently]
- Suggested anchor papers: select one paper that clearly meets Exemplary, one at Proficient, and one border case between Developing and Proficient
- Recommend a 30-minute norming session before scoring begins; each rater scores the same 3 anchor papers independently, then discusses discrepancies
```

---

## Rules

1. **Never use evaluative labels without observable evidence.** Words like "excellent," "adequate," "good," "strong," and "weak" are not descriptors -- they are conclusions. Every descriptor must state what a rater can see, count, quote, or measure in the student work. Violating this rule produces a rubric that cannot be used reliably.

2. **Descriptors within a criterion must shift on one primary variable.** If the Exemplary/Proficient/Developing/Beginning distinction in one criterion is based on quantity (number of sources), it should not suddenly shift to quality (depth of analysis) in the same criterion. Pick the primary differentiating variable and hold it consistent across all four levels. Mixing variables within a criterion produces logical incoherence.

3. **Weight criteria in proportion to their importance to the learning objectives -- never equally by default.** Equal weighting is a policy choice, not a neutral default. If a teacher's primary learning objective is "construct a reasoned argument," the thesis and evidence criteria should collectively carry at least 40-50% of total points. Conventions should rarely exceed 15-20% unless the course objective is explicitly about writing mechanics.

4. **The Proficient level must describe what mastery of the learning objective looks like -- not what average students produce.** Proficient means "meets the standard," not "typical." If a standard requires students to "analyze how an author's choices shape meaning," the Proficient descriptor must describe genuine analysis, not summary. A rubric that sets Proficient too low rewards underperformance and inflates grades.

5. **Adjacent performance levels must be clearly distinguishable without conferring.** Read every pair of adjacent descriptors (Exemplary vs. Proficient, Proficient vs. Developing, Developing vs. Beginning) aloud. If a rater would need to re-read a student paper to decide between them, the descriptors are too similar. The primary variable should create a clear, unambiguous step between levels.

6. **Do not embed completion requirements or late penalties in criterion scores.** Rubric criteria assess quality of work, not whether the work was turned in. A missing Works Cited page should be handled in a separate completion criterion or as a mandatory component note -- not by capping the Evidence criterion. Mixing quality judgments with compliance requirements corrupts the rubric's diagnostic value.

7. **All point values must sum to the stated total.** Confirm arithmetic before delivery. Multiply each criterion's weight by 4 (Exemplary), sum the products, and verify the total equals the specified assignment point value. A rubric that does not sum correctly is unusable in a gradebook.

8. **Write descriptors at the appropriate language register for the grade level.** A 5th-grade rubric shared with students must use language a 10-year-old can read independently. A college seminar rubric can use disciplinary vocabulary. Mismatching register undermines the rubric's instructional value and creates equity concerns for English language learners and students with reading disabilities.

9. **Never include a criterion that cannot be evaluated independently of all other criteria.** If scoring Criterion A requires knowing the score on Criterion B, the criteria are entangled and will produce circular scoring. Test each criterion by asking: "Could I score only this criterion on a paper while covering everything else?" If no, redesign the criteria boundaries.

10. **For group projects and collaborative work, always include an individual contribution criterion.** Giving all group members the same score for a group product is both pedagogically and ethically indefensible -- students who contribute minimally receive the same grade as those who do the majority of work. The individual contribution criterion should be scored using observable evidence (drafts submitted, meeting logs, peer evaluation data, presentation role), not self-report alone.

11. **Performance level names must not be letter grades.** Never label levels A/B/C/D. This conflates the criterion-level score with the final course grade and creates confusion when students ask why they got a "B" on Evidence but a different grade on their transcript. Use named levels (Exemplary/Proficient/Developing/Beginning or equivalent).

12. **Always include scoring notes.** A rubric without clear guidance on how to handle border cases, zero scores, missing components, and late work will be applied inconsistently by the same rater on different days, let alone across multiple raters. Scoring notes are not optional scaffolding -- they are a required component of a defensible assessment instrument.

---

## Edge Cases

### Holistic Rubric Requested
Holistic rubrics require a fundamentally different structure. Instead of a table with rows per criterion, produce a single column with 4-6 performance levels, each described by a paragraph that addresses all major dimensions of the work simultaneously. Each paragraph should run 5-8 sentences and address the same set of qualities in the same sequence across all levels -- this creates implicit structure without the rigidity of separate criteria. Include a "best fit" scoring note: "Select the level whose description most closely matches the overall work. No single piece of work will match every sentence in one level's description; choose the level where the majority of descriptors apply." Holistic rubrics are appropriate for timed in-class writing and early-draft formative assessment but should not be used for high-stakes summative grading where students need diagnostic feedback.

### Single-Point Rubric Requested
Single-point rubrics describe only the Proficient/Meets Standard level for each criterion. The table has three columns: "Evidence of Exceeding Standard" (blank, for rater comments), "Standard Description" (the filled descriptor), and "Areas for Growth" (blank, for rater comments). Do not write Exemplary or Beginning descriptors. The rater's written annotations in the blank columns serve as personalized feedback. Include a note that this format is most effective when raters have time to write specific, substantive annotations -- it should not be used by raters who will leave the columns blank, which renders it less informative than an analytic rubric. Pair with a recommendation to share the rubric with students before the assignment so they can use the "Standard Description" column as a self-check.

### Creative Assignments (Art, Music, Creative Writing, Design, Performance)
Creative work requires two distinct criterion types: **craft criteria** (technique, control, skill -- e.g., use of imagery, compositional balance, rhythmic precision) and **creative criteria** (originality, voice, risk-taking, interpretive choices). Never collapse these. Never score creativity as binary (present/absent) -- describe creativity as a continuum from "relies heavily on familiar conventions without departure" to "makes surprising, intentional choices that meaningfully expand or subvert conventions." Weight craft and creativity according to the assignment's purpose: a skill-building exercise (first sonnet, first oil painting) should weight craft more heavily (60-70%); an expression assignment (personal narrative, capstone performance) should weight creative criteria more heavily (50-60%). For any criterion involving subjective aesthetic judgment, include an explicit statement in scoring notes that raters should evaluate the intentionality and control of creative choices, not personal preference.

### Standards-Based or Mastery-Based Grading Contexts
Some schools use standards-based grading (SBG) where scores represent mastery levels (4 = Exceeds, 3 = Meets, 2 = Approaching, 1 = Beginning) and do not convert to percentages in the traditional sense. In these contexts: (a) do not create a weighted multiplier system -- each criterion is scored independently and reported as a mastery level; (b) do not create grade boundaries that map to A/B/C; (c) instead provide an interpretation table showing what each mastery level means for re-assessment eligibility and reporting. In SBG contexts, a student who scores 2 (Approaching) is not "failing" -- they are expected to re-attempt after reteaching. Note this in the scoring notes and avoid deficit language in the descriptor for level 2.

### Participation and Discussion Rubrics
Participation rubrics are among the most frequently misused instruments in education. The primary failure mode is scoring personality traits, cultural communication styles, or neurological presentation rather than academic behaviors. Rules for participation rubrics: (1) every descriptor must reference observable behavior, not inferred internal states -- "speaks at least once per 30-minute discussion period" is scorable; "actively engaged and enthusiastic" is not; (2) include multiple modalities of participation to prevent penalizing introverted or differently-abled students -- "contributes verbally OR submits a written reflection that responds to a peer's idea" acknowledges that thinking-out-loud is not the only form of academic engagement; (3) never score eye contact, body language, or volume as standalone criteria -- these can reflect disability, cultural background, or anxiety rather than academic engagement; (4) include a criterion for quality of contribution, not just frequency -- one substantive, evidence-based comment is more valuable than five superficial comments.

### Rubrics for English Language Learners and Students with Disabilities (Accommodation Contexts)
When the educator indicates the rubric will be used with English language learners (ELLs) or students with disabilities receiving accommodations under an IEP or 504 plan: (1) offer to create a parallel "student-facing" version with simplified language alongside the teacher-facing version; (2) note in scoring notes which criteria assess the content/skill (and should be scored for all students) vs. which criteria assess language conventions (which may be modified per IEP/504 -- e.g., mechanics criteria may be graded differently for students with documented language-processing disabilities); (3) never place mechanics/conventions as a gate criterion -- a student with dyslexia who writes a brilliant argument with spelling errors should not fail the assignment because conventions are worth 30% of the grade; (4) recommend that language convention criteria state "Standard Academic English is the target register; consult student's IEP/504 for accommodation guidance before scoring this criterion."

### Very Short Assignments (1-Page Response, Exit Ticket, Journal Entry)
Short assignments do not justify a 5-criterion, 100-point analytic rubric -- the rubric would be heavier than the assignment. For short-form work: (a) reduce to 2-3 criteria maximum; (b) consider a 3-level scale (Meets / Approaching / Not Yet) rather than 4; (c) use a single-point rubric format for its efficiency; (d) point values should reflect the assignment's weight -- a journal entry worth 5 points might have a simple 3-level, 2-criterion structure with a 5/4/3/2/1 scoring conversion. State explicitly that designing an elaborate rubric for a low-stakes assignment creates unnecessary burden and can undermine the formative purpose of the task.

### Rubrics Requiring Standards Alignment Documentation
When an educator needs the rubric to explicitly map to standards (for curriculum audit, accreditation, or accountability purposes): add a "Standards Alignment" column to the Quick Reference table listing the specific standard code each criterion addresses. Include the full standard language in the header section. If a criterion addresses multiple standards, list all of them. If no learning objective or standard maps to a criterion, flag it for the educator -- including criteria that no standard supports can create compliance problems during audits and dilutes the assessment's validity evidence.

---

## Example

**Input:** "Can you make a rubric for an 8th-grade science research poster on climate change? Students research one cause of climate change and present their findings on a poster. 100 points total. I want them to be assessed on their science content accuracy, quality of sources, data representation (graphs or diagrams), explanation of evidence, and presentation neatness. They'll present these in class and I'll use the rubric while they present."

---

## Rubric: Climate Change Research Poster

**Assignment:** Students independently research one cause of climate change (e.g., deforestation, fossil fuel combustion, industrial agriculture, permafrost thaw) and create a display poster that explains the cause, presents relevant data using at least one original graph or diagram, cites credible sources, and is presented to the class during a 3-5 minute oral explanation.
**Subject/Course:** 8th Grade Earth Science
**Total Points:** 100
**Rubric Format:** Analytic
**Standards Addressed:**
- NGSS MS-ESS3-5 -- Ask questions to clarify evidence of the factors that have caused the rise in global temperatures over the past century
- NGSS MS-ESS3-4 -- Construct an argument supported by evidence for how increases in human population and per-capita consumption of natural resources impact Earth's systems
- CCSS.ELA-LITERACY.RST.6-8.7 -- Integrate quantitative or technical information expressed in words in a version with a version expressed visually
- CCSS.ELA-LITERACY.WHST.6-8.9 -- Draw evidence from informational texts to support analysis

---

### Quick Reference Scoring Table

| Criterion | Exemplary (4) | Proficient (3) | Developing (2) | Beginning (1) | Weight | Max Points |
|-----------|--------------|----------------|----------------|---------------|--------|------------|
| Science Content Accuracy | All claims are scientifically accurate, include specific mechanisms and data; no misconceptions | Claims are mostly accurate; mechanisms explained; 1 minor factual error | Some accurate claims mixed with 2-3 factual errors or misconceptions; mechanisms vague | Multiple significant factual errors or misconceptions about climate science | ×7 | /28 |
| Source Quality & Use | 4+ credible scientific sources; sources are cited and directly quoted or paraphrased with analysis | 3 credible sources; mostly correct citations; sources connected to claims | 2 sources, one of which may lack credibility; citations incomplete; sources listed but not integrated | 0-1 sources; no credible scientific sources; no citations | ×5 | /20 |
| Data Representation | Original graph or diagram is accurate, clearly labeled (title, axes, units), and directly supports the central claim | Graph or diagram is accurate and labeled; minor formatting gaps; clearly connected to content | Graph or diagram present but missing labels, inaccurate data, or only loosely connected to content | No graph or diagram, OR visual is so incomplete it conveys no data | ×6 | /24 |
| Explanation of Evidence | During presentation, clearly explains how each piece of evidence supports the cause; makes explicit connections; uses domain vocabulary correctly | Explains evidence and makes connections; domain vocabulary mostly used correctly; 1-2 missed connections | Restates evidence without fully explaining its significance; limited domain vocabulary | Reads from the poster without explanation; does not connect evidence to the cause | ×4 | /16 |
| Poster Organization & Neatness | Logical visual layout with clear sections; text is readable at 3 feet; graphics are purposeful; no major mechanical errors | Generally organized; readable; minor layout inconsistencies; few mechanical errors | Some organization present but sections are hard to find; text is cramped or hard to read; several errors | No clear organization; text is illegible or chaotic; major errors throughout | ×3 | /12 |

**Total: /100**

---

### Detailed Descriptors

#### Criterion 1: Science Content Accuracy (×7 = 28 points maximum)

*What this criterion assesses: Whether the student correctly understands and communicates the scientific mechanism by which their chosen cause contributes to climate change, including relevant data and current scientific consensus.*

| Level | Score | Descriptor |
|-------|-------|------------|
| Exemplary | 4 | All claims on the poster are factually accurate and consistent with current scientific consensus. The student correctly explains the specific mechanism connecting their cause to climate change (e.g., explains how deforestation reduces carbon sinks by removing trees that absorb CO₂ during photosynthesis, thereby increasing atmospheric CO₂ concentration). Specific quantitative data is cited (e.g., "Deforestation accounts for approximately 10% of annual global CO₂ emissions"). No scientific misconceptions are present. |
| Proficient | 3 | Claims are mostly accurate and reflect current scientific understanding. The central mechanism is explained correctly, though the explanation may lack specific quantitative data or one step in the causal chain is incomplete. No more than one minor factual error is present and it does not undermine the main argument. |
| Developing | 2 | The poster contains a mix of accurate and inaccurate claims. Two to three factual errors or misconceptions are present (e.g., confusing climate and weather, stating that CO₂ "traps the sun's heat" rather than explaining the greenhouse effect mechanism). The causal mechanism is described in vague terms ("burning fossil fuels causes global warming") without explanation of the process. |
| Beginning | 1 | Multiple significant factual errors or scientific misconceptions are present throughout the poster. The student may conflate correlation with causation, misidentify the cause-effect relationship, or present claims that contradict scientific consensus. The content does not demonstrate understanding of how the chosen cause contributes to climate change. |

---

#### Criterion 2: Source Quality & Use (×5 = 20 points maximum)

*What this criterion assesses: Whether the student located credible, scientific sources and integrated them meaningfully into the poster content rather than simply listing them.*

| Level | Score | Descriptor |
|-------|-------|------------|
| Exemplary | 4 | The poster draws on 4 or more credible scientific sources -- such as peer-reviewed articles, government science agencies (NASA, NOAA, IPCC), or established science journalism (Scientific American) -- listed in a bibliography with complete citation information (author, title, publication, date). Each source is visibly integrated: data or quotations from sources are referenced on the poster with in-text attribution ("According to NOAA, 2023..."). Sources represent a mix of types (at minimum: one data source and one explanatory source). |
| Proficient | 3 | Three credible scientific sources are used and cited in a bibliography. Sources are connected to content -- data or claims on the poster can be traced to a specific source. Citations are mostly complete (1-2 minor formatting errors are acceptable). All three sources are from credible outlets (no Wikipedia as a primary source, no personal blogs). |
| Developing | 2 | One to two sources are cited. At least one source may lack clear credibility (e.g., an advocacy website without scientific authorship, an undated web page). The bibliography is incomplete or informal. Sources are listed but not visibly integrated -- it is unclear which claims on the poster come from which source. |
| Beginning | 1 | No sources are cited, or only one low-credibility source is listed. The bibliography is absent. Content on the poster cannot be traced to any identifiable source. Alternatively, all sources are non-scientific (Wikipedia, personal blog, social media) with no credible scientific basis. |

---

#### Criterion 3: Data Representation (×6 = 24 points maximum)

*What this criterion assesses: Whether the student created an original visual representation of data (graph, chart, or labeled diagram) that is accurate, properly formatted, and meaningfully connected to the poster's central claim.*

| Level | Score | Descriptor |
|-------|-------|------------|
| Exemplary | 4 | The poster includes at least one original graph or diagram (hand-drawn or digitally created) that accurately represents real data from a cited source. The visual is fully formatted: it has a descriptive title, labeled axes with units (for graphs), a legend if applicable, and the data points are accurately plotted or depicted. The student explicitly connects the visual to their central claim in text ("This graph shows CO₂ levels rising in direct correlation with industrialization, demonstrating that..."). The visual adds information that text alone cannot convey. |
| Proficient | 3 | The graph or diagram is accurate and clearly connected to the content. All major formatting elements are present (title, labeled axes), though one minor element may be missing (e.g., units absent from one axis, legend slightly unclear). A viewer can read the visual and understand what data it represents without assistance. |
| Developing | 2 | A graph or diagram is present, but it contains one or more of the following: missing title, unlabeled axes, inaccurate data (does not match the cited source), or a weak connection to the poster's central claim (the visual appears decorative rather than informational). The viewer must work to understand what the visual is showing. |
| Beginning | 1 | No original data visualization is present. If an image exists, it is a clip art, stock photograph, or copied image without data. Alternatively, an attempt at a graph is so incomplete (no labels, no data, no title) that it communicates no quantitative information. |

---

#### Criterion 4: Explanation of Evidence (×4 = 16 points maximum)

*What this criterion assesses: During the 3-5 minute oral presentation, whether the student can explain how the evidence on their poster supports their central scientific claim -- going beyond reading the poster to demonstrate understanding.*

| Level | Score | Descriptor |
|-------|-------|------------|
| Exemplary | 4 | During the presentation, the student explicitly connects each major piece of evidence to the central claim using logical reasoning ("This data matters because it shows that..."). The student uses domain-specific vocabulary correctly and unprompted (greenhouse gas, carbon cycle, radiative forcing, feedback loop -- as appropriate to their chosen cause). When asked a follow-up question by the teacher, the student can extend their explanation beyond what is written on the poster. |
| Proficient | 3 | The student explains the significance of their main pieces of evidence and makes the connection to the central claim clear. Domain vocabulary is used correctly in most instances, with 1-2 terms used imprecisely. The student does not simply read sentences from the poster -- there is evidence of understanding in the presentation. |
| Developing | 2 | The student restates what the poster says without explaining why the evidence matters or how it connects to the cause of climate change. Domain vocabulary is limited or used incorrectly (e.g., using "pollution" as a synonym for all greenhouse gases). The presentation is primarily a reading of the poster text. |
| Beginning | 1 | The student reads directly from the poster with little or no additional explanation. No connections between evidence and claim are articulated. Domain vocabulary is absent. If asked a follow-up question, the student cannot respond beyond what is written on the poster. |

---

#### Criterion 5: Poster Organization & Neatness (×3 = 12 points maximum)

*What this criterion assesses: Whether the poster is visually organized in a way that helps the viewer navigate the content, and whether the presentation is polished enough to be taken seriously as a scientific product.*

| Level | Score | Descriptor |
|-------|-------|------------|
| Exemplary | 4 | The poster has a clear visual hierarchy: a title is prominently displayed, sections are labeled and logically ordered (introduction → evidence → conclusion/implications), and white space is used intentionally. All text is readable at a distance of approximately 3 feet. Graphics are purposeful and placed near relevant text. 0-2 spelling or grammatical errors are present. The overall impression is that of a polished scientific display. |
| Proficient | 3 | The poster is generally organized and readable. A viewer can identify the main sections without assistance. Minor layout inconsistencies are present (e.g., one section feels crowded, one graphic is poorly placed). 3-5 mechanical errors (spelling, grammar) are present but do not impede comprehension. |
| Developing | 2 | Sections exist but are difficult to navigate -- a viewer must search for the main claim, the data visual, or the bibliography. Text is cramped, too small to read at 3 feet, or uses inconsistent formatting. 6-10 mechanical errors are present and occasionally interrupt comprehension. The overall impression suggests the poster was assembled quickly. |
| Beginning | 1 | The poster lacks clear organization. There is no evident visual hierarchy; content appears random or disordered. Text is illegible (too small, poor contrast, covered by images). 11 or more mechanical errors are present. The poster could not function as a standalone scientific display. |

---

### Grade Boundaries

| Total Score | Percentage | Grade | Interpretation |
|-------------|-----------|-------|----------------|
| 90-100 | 90-100% | A | Exceeds expectations; demonstrates mastery of science content, research skills, and scientific communication |
| 80-89 | 80-89% | B | Meets expectations; solid scientific understanding with minor gaps in evidence or presentation |
| 70-79 | 70-79% | C | Approaching expectations; core content present but evidence explanation or data representation needs strengthening |
| 60-69 | 60-69% | D | Below expectations; significant gaps in content accuracy, sources, or data representation; revision recommended |
| Below 60 | Below 60% | F | Does not meet minimum expectations; student conference and opportunity to revise recommended |

*Grade boundaries may be adjusted to match your school's grading scale (e.g., if your school uses 93+ for A, adjust accordingly).*

---

### Scoring Notes

**Between levels:** Score each criterion at the level where the majority of descriptors apply. If work is genuinely split between two adjacent levels, score the lower level and note the specific strengths from the higher level in written or verbal feedback.

**Zero policy:** A score of 0 is reserved for criteria that are entirely absent -- a student who did not create any data visualization (Criterion 3) receives a 0, not a 1. A student who made a poor attempt at a graph receives a 1 (Beginning). A student who submitted no poster receives 0 across all criteria.

**Oral presentation (Criterion 4):** This criterion is scored during the live presentation. If a student is absent on presentation day and presents later, score on the makeup presentation, not the poster alone. If a student cannot present due to an IEP accommodation, consult the IEP for alternative evidence of understanding.

**Late posters:** Score all criteria on content quality. Apply late penalties separately per your classroom late work policy. Do not lower criterion scores to penalize lateness.

**Source credibility guidance for Criterion 2:** Credible sources include NASA Climate, NOAA, IPCC reports, National Geographic Science, EPA, peer-reviewed articles accessed through school databases (EBSCO, JSTOR), and established science textbooks. Wikipedia may be used to find sources but may not count as a primary source. Personal blogs, social media posts, and advocacy websites without scientific authorship do not qualify as credible scientific sources.

**Academic integrity:** Copied text that is not attributed to a source cannot earn higher than a 2 (Developing) on the Source Quality criterion. Wholesale copying of another student's poster warrants a 0 and referral per school policy.

---

### Calibration Notes *(for use if multiple teachers or aides are scoring)*

- Criterion 4 (Explanation of Evidence) is the most subjective criterion because it is scored during a live presentation. If possible, two raters should observe the same presentations and score independently.
- Criterion 1 (Science Content Accuracy) requires the rater to have basic climate science knowledge. Review the following before scoring: the difference between the greenhouse effect (natural) and the enhanced greenhouse effect (anthropogenic); the carbon cycle; and the major causes of rising CO₂ and methane.
- Recommended anchor posters: before scoring, identify one poster that clearly meets Exemplary on most criteria, one that clearly meets Proficient, and one border case between Developing and Proficient. Score these three as a team before scoring the full class set.
