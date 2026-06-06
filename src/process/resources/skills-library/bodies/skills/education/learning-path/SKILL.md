---
name: learning-path
description: |
  Creates sequenced learning paths with resources, milestones, and practice projects for professionals building specific skills. Produces an ordered curriculum the professional can follow independently.
  Use when a professional asks to learn a new skill, create a learning roadmap, find a structured path to competency, or plan self-directed professional learning.
  Do NOT use for academic study plans (use `study-plan`), for skill gap identification (use `skill-gap-analysis`), or for certification exam prep (use `certification-prep`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "teaching study-skills step-by-step"
  category: "education"
  subcategory: "professional-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Learning Path

## When to Use

Use this skill when a professional needs a structured, sequenced curriculum to build a specific skill from their current level to a defined competency target. Trigger scenarios include:

- A professional says "I want to learn [skill] -- where do I start and how do I get good at it?" and they need a complete roadmap, not just a resource list
- A developer, designer, analyst, manager, or other knowledge worker is transitioning into a new technical or functional area and needs a phased curriculum with clear progression logic
- Someone has tried to learn a skill informally (scattered tutorials, random books) and wants a structured path that fills gaps and creates coherent understanding
- A professional has a specific deadline or outcome -- "I need to be job-ready in data engineering in 6 months" -- and needs milestone-gated phases tied to that timeline
- Someone is re-entering a field after a gap and needs a path that accounts for prior foundational knowledge while updating them on what has changed
- A professional wants to build a skill adjacent to their current expertise -- a backend developer learning DevOps, a data analyst learning machine learning, a manager learning product strategy -- and needs a path calibrated to their transferable knowledge
- A self-directed learner who cannot afford or access formal training needs a curriculum that uses freely available and low-cost resources without sacrificing quality or sequence

**Do NOT use when:**
- The user needs to identify WHICH skills to build before planning how to build them -- use `skill-gap-analysis` first, then return here
- The user is preparing for a specific certification exam (AWS, PMP, CFA, etc.) -- use `certification-prep`, which handles exam-specific question banks, domain weighting, and pass-rate strategy
- The user is a student on an academic course with assigned syllabi and institutional deadlines -- use `study-plan`, which handles lectures, assignments, and grade-based milestones
- The user needs a training plan for others they manage or teach -- this skill is for self-directed individual learning only; use a curriculum design skill for instructional design work
- The user's primary need is evaluating multiple career options -- this skill assumes the skill target is already chosen
- The user needs coaching on learning habits, motivation, or focus -- this skill assumes the learner is ready to execute; address psychological blockers separately before building the path

---

## Process

### Step 1: Establish the Learning Contract

Before designing anything, collect four pieces of information. If the user has not provided them, ask in a single grouped question -- do not pepper them with sequential requests.

- **Target skill and specificity**: "Data analysis" is too broad. Push for specificity: data analysis in Python for business reporting, SQL-based analytics for a marketing team, or time-series analysis for financial modeling are separate paths. Ask: "What specifically will you be able to do when you've completed this path? What does success look like in practice?"
- **Current baseline**: Distinguish between zero knowledge, conceptual familiarity without hands-on practice, casual use, and regular professional use. Ask about transferable adjacent knowledge -- a statistician learning Python is not the same as a complete beginner. Ask: "What related experience or tools do you already work with?"
- **Available time commitment**: Distinguish weekly hours (5, 10, 20+) and total calendar horizon (8 weeks, 6 months, 1 year). These two numbers together determine how many phases fit and how deep each phase can go. A person with 5 hours/week and 3 months has ~60 hours total -- very different from 20 hours/week over 6 months (~480 hours).
- **Desired outcome context**: Is this for a job transition, a current project requirement, general career investment, or a specific deliverable? The outcome shapes whether to prioritize breadth (explore the field) or depth (master specific techniques), and whether the capstone project needs to be portfolio-grade.

### Step 2: Map the Competency Terrain

Before sequencing, decompose the target skill into its constituent sub-skills and identify their dependency structure. This is the core intellectual work of path design -- most thin paths skip it.

- **Identify atomic sub-skills**: Break the target into the 8-15 discrete capabilities that together constitute competency. For "Python for data analysis," this includes: basic syntax and data types, control flow and functions, file I/O, Pandas DataFrames, NumPy arrays, data cleaning and transformation, visualization with Matplotlib/Seaborn, statistical summarization, and communicating results. Each of these is separately learnable and verifiable.
- **Draw dependency arrows**: Some sub-skills require others as prerequisites (you cannot learn Pandas without understanding Python syntax). Some are parallel and can be learned in any order (visualization and statistical summarization are independent once Pandas is known). Explicitly map these dependencies -- they determine mandatory sequence versus flexible sequence.
- **Identify the irreducible minimum path**: If the user has a hard deadline, identify which sub-skills are on the critical path to the stated outcome and which are valuable but deferrable. A professional who needs to deliver a quarterly report in 6 weeks needs Pandas and basic visualization -- they can defer NumPy and advanced statistics.
- **Tag sub-skills by knowledge type**: Declarative knowledge (facts, concepts, terminology -- learned by reading and watching), procedural knowledge (how to execute a technique -- learned by guided practice), and adaptive knowledge (when to use which approach -- learned by varied problem-solving). Each type requires different resource formats. Do not assign a video course to a sub-skill that requires adaptive knowledge.

### Step 3: Design the Phase Architecture

Structure the path into 3-5 phases using the Gradual Exposure Principle: each phase should expand on the previous one and produce a concrete, testable artifact.

- **Phase 1 -- Foundations (15-25% of total time)**: Cover declarative knowledge and the most fundamental procedural skills. The goal is not mastery but sufficient grounding to make Phase 2 intelligible. Resources here should be curated and minimal -- beginners suffer from resource overload more than resource scarcity. Assign one primary resource per phase, not a list of five alternatives.
- **Phase 2 -- Core Competency (40-50% of total time)**: This is the longest phase. It builds the procedural and adaptive skills that constitute actual competency. Resources should be practice-heavy -- project-based tutorials, worked exercises with answer keys, problem sets. Passive video watching is not sufficient for this phase.
- **Phase 3 -- Applied Synthesis (20-30% of total time)**: The learner applies all prior skills to a realistic, unscaffolded project. No tutorial to follow -- they must make independent decisions. This phase is where skills consolidate into genuine capability.
- **Phase 4 -- Specialization or Depth (optional, 10-15% of total time)**: For learners with longer horizons or ambitious targets, add a phase that pushes into advanced techniques, performance optimization, or a sub-specialization. Not all paths need this phase.
- **Calendar the phases**: Convert time estimates into actual weeks using the learner's available hours/week. If Phase 1 requires 20 hours of work and the learner has 8 hours/week, Phase 1 is 2.5 weeks -- round to 3 weeks to allow for life interruption.

### Step 4: Select Resources with Specificity

Resource recommendations are the most commonly done poorly part of learning path design. Apply these selection criteria rigorously.

- **Match resource type to knowledge type**: Conceptual understanding -- well-written books, structured written tutorials with diagrams, university lecture notes. Procedural skill -- project-based courses, exercises with solutions to compare against, coding challenges. Adaptive judgment -- case studies, worked examples from practitioners, community problem-solving threads, documented real-world projects on GitHub or equivalent platforms.
- **Calibrate to level transition, not starting level**: Do not recommend a beginner resource for someone who will be intermediate by Phase 2. Sequence resources so each one deposits the learner at the entry point of the next resource. A mismatch of even one "level" creates frustration or boredom that causes abandonment.
- **Apply the 70/20/10 resource split**: 70% of learning time should be in active practice (building, solving, doing), 20% in structured instruction (courses, books, tutorials), and 10% in community and reference (documentation, forums, peer review). Most people invert this ratio and spend 70% consuming content, which produces recognition without recall.
- **Name specific resource types, not generic categories**: Instead of "find a Python course," specify "an interactive platform course that requires you to write and run code in the browser for every lesson, not just watch videos" -- this is an actionable recommendation even without naming a specific brand. Describe the characteristics of a good resource for this phase so the learner can evaluate options they find.
- **Include time estimates for each resource**: A 30-hour course is a fundamentally different commitment than a 6-hour tutorial. Without time estimates, learners cannot plan or track progress.

### Step 5: Design Verifiable Milestones

Every phase ends with a milestone that is binary -- the learner either passes or repeats the phase. Milestones must be observable behaviors, not self-assessed feelings.

- **Use behavioral milestone language**: "I can write a Python function that reads a CSV, filters rows by a condition, groups by a category column, and outputs a summary table -- without consulting a tutorial" is a milestone. "I feel comfortable with Pandas" is not.
- **Design practice projects at the right scope**: Phase 1 projects should take 2-4 hours and use only Phase 1 skills. Phase 2 projects should take 8-15 hours and require the learner to solve problems not explicitly covered in the resources. Phase 3 capstone projects should take 20-40 hours and produce something portfolio-worthy. Never assign a project that can be completed by following along with a tutorial -- that measures instruction-following, not competency.
- **Include a spaced retrieval check**: 3-7 days after completing each phase, the learner should attempt to reproduce the phase's core skills from memory without notes. Any sub-skill they cannot reproduce needs additional practice before moving on. This is non-optional -- spaced retrieval is the most empirically validated technique for moving knowledge from working memory to long-term memory.
- **Define "not ready to advance" conditions**: Specify what a Phase 1 milestone failure looks like so the learner knows to repeat rather than push forward. Pushing a shaky foundation into Phase 2 is the most common cause of learning path abandonment.

### Step 6: Build the Ongoing Development Tail

Competency reached at the end of Phase 3 is a perishable asset without deliberate maintenance. Design the post-path strategy.

- **Identify the practice cadence needed to maintain the skill**: Some skills decay rapidly without use (specific API syntax, configuration file formats). Others are durable once internalized (algorithmic thinking, statistical reasoning). Be explicit about what the learner must keep doing to retain what they built.
- **Name the communities and feedback loops**: A practitioner community (a subreddit, a professional Discord, a local meetup) provides two things learning resources cannot: novel problems and peer calibration. The learner needs to know where practitioners in this field actually gather and interact.
- **Identify the next level path**: What would a Level 2 version of this path look like? Name the 3-5 sub-skills or topics that represent the natural progression beyond this path's endpoint. This gives the learner a horizon to aim for rather than feeling like they have "finished" the skill.

---

## Output Format

```
## Learning Path: [Specific Skill Name]

**Target Outcome:** [Behavioral statement -- what the learner will be able to do]
**Starting Baseline:** [Assessed level and relevant prior knowledge]
**Total Time Estimate:** [X hours across Y weeks at Z hours/week]
**Path Architecture:** [Number of phases and their names]

---

### Competency Map

**Core sub-skills for this domain:**
| Sub-Skill | Knowledge Type | Phase | Dependencies |
|-----------|---------------|-------|--------------|
| [Sub-skill 1] | Declarative / Procedural / Adaptive | 1/2/3 | None / [Sub-skill X] |
| [Sub-skill 2] | ... | ... | ... |

**Critical path sub-skills** (required for stated outcome): [List]
**Deferrable sub-skills** (valuable but not blocking): [List]

---

### Phase 1: [Phase Name] -- [X] weeks ([Y] hours)

**Phase Objective:** [What the learner will know and be able to do by end of phase]

**Resources:**
| Resource | Type | Estimated Time | Purpose |
|----------|------|---------------|---------|
| [Specific resource description] | [Course/Book/Tutorial/Docs] | [X hours] | [Why this resource in this position] |

**Practice Project:** [Specific project description with scope and constraints]
- Scope: [Expected time and deliverable]
- Constraint: [What the learner is NOT allowed to look up or copy -- forces genuine application]
- Success indicator: [What a completed, passing project looks like]

**Phase Milestone:**
"I can [behavioral description] without [scaffolding or aids being removed]."
- Spaced retrieval check: [Specific things to reproduce from memory 3-7 days after phase end]
- Not-ready signal: [Observable behavior indicating the learner should repeat part of the phase]

---

### Phase 2: [Phase Name] -- [X] weeks ([Y] hours)

[Same structure as Phase 1]

---

### Phase 3: Applied Synthesis -- [X] weeks ([Y] hours)

**Capstone Project:** [Full description of unscaffolded, realistic project]
- Scope: [Expected time commitment]
- Inputs: [What the learner starts with]
- Required outputs: [What they must produce]
- Portfolio value: [Why this project demonstrates competency to an outside observer]

**Path Completion Milestone:**
"I can [full behavioral statement of target outcome]."

---

### Resource Selection Summary

| Phase | Primary Resource | Type | Hours | Why This Position |
|-------|-----------------|------|-------|------------------|
| 1 | [Description] | [Type] | [X] | [Rationale] |
| 2 | [Description] | [Type] | [X] | [Rationale] |
| 3 | [Capstone project] | Practice | [X] | [Rationale] |

**70/20/10 Time Allocation Check:**
- Active practice (70%): [X hours] -- [List of practice activities]
- Structured instruction (20%): [Y hours] -- [List of courses/reading]
- Community and reference (10%): [Z hours] -- [Forums, docs, peer review]

---

### Milestone Verification Schedule

| Milestone | Date Target | Pass Condition | Fail Condition |
|-----------|-------------|----------------|----------------|
| Phase 1 complete | [Date] | [Observable behavior] | [Observable behavior indicating repeat] |
| Phase 2 complete | [Date] | [Observable behavior] | [Observable behavior indicating repeat] |
| Spaced retrieval check 1 | [3-7 days after Phase 1] | [Can reproduce X, Y, Z from memory] | [Cannot reproduce -- repeat these sub-skills] |
| Path complete | [Date] | [Capstone passes criteria] | [Capstone reveals specific gaps] |

---

### Ongoing Development

**Maintenance cadence:** [How often the learner must use this skill to prevent decay]
**Practitioner communities:** [Where practitioners gather -- types of communities, not URLs]
**Next level sub-skills:** [3-5 topics representing natural progression beyond this path]
**Adjacent paths to consider:** [2-3 related skills that compound value with this one]
```

---

## Rules

1. **Never design a phase without a behavioral milestone** -- "complete the course" is not a milestone. Every phase must end with a binary, observable test the learner can administer to themselves. If you cannot write the behavioral milestone statement, the phase is not yet specific enough.

2. **Never recommend more than one primary resource per phase** -- resource overload is the leading cause of learning path abandonment. You may note 1-2 alternative resources in parentheses for learners who try the primary and find it a poor fit, but the default path has one primary per phase.

3. **Always calculate total hours and verify against the learner's stated availability** -- if the path requires 200 hours and the learner has 5 hours/week for 8 weeks, the path is impossible as designed. Either trim scope, extend the timeline, or explicitly acknowledge the tradeoff and ask the learner to choose.

4. **Never assign a Phase 2 or Phase 3 project that can be completed by following a tutorial step-by-step** -- tutorial-following measures compliance, not competency. Projects must require the learner to make at least 3 independent decisions not covered in any resource.

5. **Always map sub-skill dependencies before sequencing** -- sequencing without dependency mapping produces paths where learners hit a wall because a prerequisite skill was not yet covered. The dependency map is internal work the AI does before writing the path, even if it is not fully shown in the output.

6. **Apply the correct knowledge-type-to-resource match**: Declarative knowledge -- reading and watching. Procedural knowledge -- exercises with feedback and solutions to compare against. Adaptive knowledge -- varied problem sets, case studies, or real-world projects without prescribed solutions. Mismatching knowledge type to resource type is the most common structural error in self-designed learning paths.

7. **Always include a spaced retrieval check 3-7 days after each phase** -- this is not optional. Without spaced retrieval, learners systematically overestimate their retention and discover gaps only in Phase 3 when they are most costly to fix.

8. **Calibrate project scope to phase position**: Phase 1 projects: 2-4 hours, uses only Phase 1 skills. Phase 2 projects: 8-15 hours, requires independent problem-solving. Capstone: 20-40 hours, portfolio-ready. Projects outside these ranges are either too trivial (builds false confidence) or too large (causes abandonment).

9. **Do not conflate learning path with resource list** -- a list of books and courses is not a learning path. A learning path specifies sequence, time allocation, dependency logic, practice design, and milestone verification. If the output is just a list of resources, it is incomplete.

10. **Always design the ongoing development tail** -- a path that ends at "done" produces perishable competency. Every path must include a maintenance cadence recommendation, a practitioner community type, and at least 3 next-level sub-skills so the learner knows the skill has depth beyond this path.

---

## Edge Cases

### The Learner Has Significant Prior Knowledge in Adjacent Areas

A backend Java developer learning Python, or a biostatistician learning R, brings knowledge that invalidates the standard foundation sequence. Failing to account for this produces a path the learner will abandon in Phase 1 due to boredom and condescension.

- Conduct an explicit knowledge audit: list the core sub-skills of the target domain and ask the learner to self-rate each one (no knowledge / conceptual awareness / hands-on experience / regular professional use). Do not trust their overall self-assessment -- "I'm intermediate in Python" is not useful; "I've written Python scripts for data transformation but never used Pandas or object-oriented design" is.
- Compress or skip Phase 1 for sub-skills the audit shows are already at milestone level. A learner with strong statistical knowledge learning machine learning does not need Phase 1 probability theory -- they need Phase 1 ML-specific framework introduction only.
- Explicitly flag where adjacent knowledge creates false familiarity risk: a developer learning SQL often assumes relational thinking from their ORM experience, but set-based thinking in SQL is genuinely different. Name these deceptive similarities and build extra practice time around them.

### The Learner Has a Non-Negotiable Hard Deadline

When the learner says "I need to be able to do X in 6 weeks" and a full path would take 16 weeks, do not pretend a full path fits. This is the most common design dishonesty in learning path tools.

- Calculate the actual available hours: (hours/week) x (weeks available) = total hours. Then calculate the minimum viable path: which sub-skills are strictly on the critical path to the stated outcome?
- Design a Minimum Viable Competency path: a path that produces the specific, scoped outcome by the deadline, explicitly noting which sub-skills are deferred. Label this clearly -- "This 6-week path produces X capability. To reach full professional competency, a second path of Y weeks is needed."
- Increase the practice-to-instruction ratio under time pressure. When time is scarce, every hour of passive video watching costs one hour of practice. Reduce instructional resources to the irreducible minimum and maximize practice hours.
- Set honest expectations: the learner will be functional, not fluent, by the deadline. Describe what "functional" looks like and what it does not.

### The Learner Keeps Abandoning Learning Paths

Some professionals describe a pattern of starting a path, completing 20-30% of it, and stopping. This is not a motivation or discipline problem -- it is almost always a path design problem (wrong sequence, wrong resources, missing practice) or a goal clarity problem (the stated goal and the actual felt need are misaligned).

- Ask directly: "Have you tried to learn this before? Where did you stop and why?" The answer reveals the phase where the previous path failed.
- Redesign Phase 1 to be shorter and produce an immediately satisfying artifact. Learners who see a tangible result within the first 5-8 hours are significantly more likely to continue. If the current Phase 1 is "complete a 20-hour theory course before touching the tools," restructure it.
- Build in a 1-week commitment gate: design Phase 1 as a 1-week pilot that produces a small but real artifact. At the end of Phase 1, the learner consciously decides to continue. This converts a passive consumption commitment into an active recommitment.
- Check whether the stated goal matches the felt need: if someone says they want to learn machine learning but their actual driver is getting promoted, the path needs to be calibrated to promotion-relevant skills, not ML comprehensiveness.

### The Target Skill is Rapidly Evolving

In domains where the tooling, best practices, or ecosystem changes significantly year-over-year (cloud platforms, front-end JavaScript frameworks, generative AI tooling, security practices), standard learning path design has a shelf-life problem.

- Prioritize resources based on conceptual durability. A book on SQL query optimization or statistical inference will be relevant in 5 years. A tutorial on a specific cloud service's current console UI may not be. Sequence conceptual resources early (they transfer across versions) and tool-specific resources later (they are close to the practice projects where currency matters most).
- Build "documentation fluency" as an explicit sub-skill in Phase 1: the ability to read official documentation and extract how-to answers without a tutorial intermediary. This makes the learner resilient to tooling changes throughout their career.
- Note explicitly in the path which resources or sub-skills are high-decay (likely to need refreshing within 12-18 months) versus low-decay (durable across versions). This calibrates the learner's expectations about maintenance.

### The Skill is Deeply Interdisciplinary

Some skill targets genuinely require foundational knowledge in multiple separate domains -- for example, "machine learning engineering" requires software engineering, statistics, and ML-specific tools. A learner without all three foundations cannot skip any of them.

- Map the interdisciplinary dependencies honestly: identify which domains the learner already has foundations in versus which are gaps. Do not design a path that assumes foundations the learner does not have.
- If multiple foundational gaps exist, stage the path with an explicit "pre-path" that fills the most critical gaps before the main path begins. Label it as such. A learner who has no statistics background cannot meaningfully start a machine learning path -- they need a 4-6 week statistics pre-path first.
- Identify the integration points: phases where the learner is synthesizing across two sub-domains are where the most confusion occurs. Allocate extra practice time at these integration points and design milestone projects specifically around integration, not just within a single sub-domain.

### The Learner Wants to Build a Skill for a Specific Employer or Industry Context

"I want to learn data engineering" is different from "I want to learn data engineering for a job at a fintech startup" or "I want to learn data engineering to move into my company's platform team." The organizational context shapes which sub-skills are prioritized.

- Ask for any known context about the tool stack, methodology, or industry: specific platforms used, team size, whether the role is greenfield or maintaining existing systems. Even partial information significantly improves path calibration.
- Weight Phase 3 capstone projects toward realistic artifacts for the target context. A capstone project that mirrors the type of work the learner will actually do serves both as skill-building and as a portfolio item for job transition or internal advocacy.
- When the employer context is known, identify the "vocabulary and framing" sub-skills: terminology, common patterns, and standard tooling choices that are specific to that industry or company type. These are often low effort to learn but high value for professional credibility.

### The Learner Asks for Resources the AI Cannot Verify or Access

The learner may name a specific internal company resource, a paywalled platform, or a book whose current edition the AI cannot confirm. Do not fabricate resource details.

- Describe the characteristics of a good resource for that phase rather than naming a specific title: "You need a resource that gives you 40+ hands-on exercises with answer keys and real-world datasets, not just a video series" is actionable guidance the learner can apply to evaluate options they find.
- When the learner names a resource, ask them to describe it: "Can you tell me roughly what format that resource uses -- video, exercises, project-based?" Then evaluate whether it fits the phase requirements based on their description.
- Maintain the path structure even when specific resources are uncertain: the phase objectives, milestone design, and project structure do not depend on any specific resource. The path remains useful even when resource details are placeholder-level.

---

## Example

**Input:** "I'm a marketing analyst who has been using Excel for reporting for 3 years. I want to learn Python for data analysis. I have about 8-10 hours per week and want to be able to do my current job's analysis work in Python within about 4 months. I've heard about pandas and matplotlib but never used them."

---

## Learning Path: Python for Marketing Data Analysis

**Target Outcome:** Independently write Python scripts that replicate and extend the analyst's current Excel workflow -- reading data from CSVs and spreadsheets, cleaning and transforming records, building summary tables by segment and time period, producing visualizations for stakeholder reports, and exporting results -- without tutorial assistance.

**Starting Baseline:** 3 years professional Excel use (VLOOKUP, pivot tables, basic charting, conditional logic). Zero Python syntax experience. Conceptual awareness of Pandas and Matplotlib without hands-on exposure.

**Total Time Estimate:** ~150 hours across 17 weeks at ~9 hours/week average.

**Path Architecture:** 3 phases -- Python Foundations (3 weeks), Pandas and Analysis Workflow (8 weeks), Applied Marketing Analytics (6 weeks).

---

### Competency Map

**Core sub-skills for this domain:**

| Sub-Skill | Knowledge Type | Phase | Dependencies |
|-----------|---------------|-------|--------------|
| Python syntax: variables, types, operators | Declarative + Procedural | 1 | None |
| Control flow: if/else, for loops | Procedural | 1 | Python syntax |
| Functions: defining, calling, returning values | Procedural | 1 | Control flow |
| File I/O: reading CSVs, writing CSVs | Procedural | 1 | Functions |
| Lists and dictionaries | Procedural | 1 | Python syntax |
| Pandas: reading data, inspecting DataFrames | Procedural | 2 | File I/O, lists/dicts |
| Pandas: filtering, selecting, slicing | Procedural | 2 | Pandas basics |
| Pandas: groupby, aggregation, pivot tables | Procedural + Adaptive | 2 | Pandas filtering |
| Data cleaning: nulls, type casting, deduplication | Procedural + Adaptive | 2 | Pandas basics |
| Merging and joining DataFrames | Procedural | 2 | Pandas basics |
| Time series: date parsing, resampling, rolling windows | Procedural | 2 | Pandas groupby |
| Matplotlib: line, bar, scatter charts | Procedural | 2 | Pandas basics |
| Seaborn: styled charts for reporting | Procedural | 2 | Matplotlib basics |
| End-to-end analysis script structure | Adaptive | 3 | All Phase 2 |
| Translating Excel formulas to Pandas | Adaptive | 2 | Pandas filtering |
| Exporting results to Excel/CSV for stakeholders | Procedural | 2 | Pandas basics |

**Critical path sub-skills** (required for stated outcome): Python syntax, control flow, functions, File I/O, all Pandas sub-skills, Matplotlib basics, end-to-end script structure.

**Deferrable sub-skills** (valuable but not blocking within 4 months): Seaborn advanced styling, NumPy array operations, writing classes/OOP, statistical testing (scipy.stats), working with APIs or databases.

---

### Phase 1: Python Foundations -- 3 Weeks (25-27 hours)

**Phase Objective:** Write Python code fluently enough that syntax is not a barrier in Phase 2. Understand variables, data types, control flow, functions, and file reading. Recognize the equivalents of Excel concepts (a list is like a column; a dictionary is like a named lookup table).

**Resources:**

| Resource | Type | Estimated Time | Purpose |
|----------|------|---------------|---------|
| An interactive Python course that requires writing and running code in-browser for every lesson, covering variables through functions and file I/O, aimed at beginners with no CS background | Interactive course | 15-18 hours | Builds procedural fluency through immediate feedback -- do not substitute a video-only course |
| Official Python documentation: Built-in Types page and Functions section | Reference | 2-3 hours | Builds documentation reading habit early; all Python syntax questions should be answerable here |

**Practice Project: Excel-to-Python Translator**
- Scope: 4 hours
- Task: Take a real CSV of marketing data the learner already works with (or a sample with 500+ rows and 5+ columns including a date, a category column, and a numeric metric). Write a Python script -- no Pandas yet, only built-in Python -- that reads the CSV, calculates the sum and average of the numeric column, counts unique values in the category column, and writes a summary to a new CSV.
- Constraint: The learner may not use any library other than the built-in `csv` module. No Pandas. This forces genuine engagement with Python's core data structures.
- Success indicator: The script runs without errors, produces correct numbers matching what the learner can verify in Excel, and was written without copying code from any tutorial.

**Phase 1 Milestone:**

"I can write a Python script from scratch that reads a CSV file, processes each row using loops and conditionals, aggregates values into a dictionary, and writes results to a new file -- without looking at any tutorial or course material."

- Spaced retrieval check (3-5 days after Phase 1 ends): Close all references and write a function that takes a list of numbers and returns a dictionary containing the sum, mean, max, and min. If any piece of syntax requires looking up, note it and practice that specific piece for 30 minutes.
- Not-ready signal: If writing the function takes more than 20 minutes or requires repeated reference lookups, repeat the course's functions and loops sections before proceeding.

---

### Phase 2: Pandas and Marketing Analysis Workflow -- 8 Weeks (70-75 hours)

**Phase Objective:** Perform every analysis operation the learner currently does in Excel -- filtering, sorting, grouping, pivot tables, VLOOKUPs, date-based aggregation, basic charts -- using Pandas and Matplotlib. Translate specific known Excel workflows into Python equivalents.

**Resources:**

| Resource | Type | Estimated Time | Purpose |
|----------|------|---------------|---------|
| A comprehensive Pandas textbook or structured course covering all core DataFrame operations through groupby, merge, and time series, with exercises for each chapter | Book or structured course | 25-30 hours | Systematic coverage prevents the "I know some Pandas but have weird gaps" problem |
| Pandas official documentation: 10 Minutes to Pandas + User Guide sections on Indexing, GroupBy, and Time Series | Reference | 3-4 hours | Pandas documentation is exceptionally well-written; learning to navigate it is itself a career skill |
| The "Python for Excel Users" concept map: a reference table mapping common Excel operations (VLOOKUP, SUMIF, pivot table, conditional format) to their Pandas equivalents | Written reference / cheat sheet | 2 hours | Leverages 3 years of existing Excel mental models to accelerate Pandas acquisition -- reduces cognitive load significantly |

**Practice Projects (two projects in Phase 2):**

*Project 2A: Campaign Performance Aggregator (Week 5 of path, end of first half of Phase 2)*
- Scope: 8-10 hours
- Task: Given a dataset with columns for campaign name, channel, date, impressions, clicks, and conversions (use real data if available; otherwise generate with Python's random module per specific parameters provided), write a script that produces: (1) a summary table showing CTR and conversion rate by campaign and channel, (2) weekly totals for each metric, (3) identification of the top 3 performing campaigns by conversion rate, (4) a bar chart of impressions by channel saved as a PNG.
- Constraint: The learner may not use any loop to process the DataFrame rows -- all operations must use Pandas vectorized operations (groupby, apply, agg). This forces abandonment of the row-by-row Excel mental model.
- Success indicator: Script produces correct numbers (verify subset manually), chart is properly labeled with title and axis labels, and the whole script runs in under 5 seconds on a 100,000-row dataset.

*Project 2B: Monthly Reporting Automator (Week 11 of path, end of Phase 2)*
- Scope: 12-15 hours
- Task: Build a script that takes a folder of 12 monthly CSV files (one per month of a year), reads them all, concatenates them, cleans any common data quality issues (nulls in numeric columns, inconsistent category naming, duplicate rows), produces a full-year summary with month-over-month growth rates, and exports the results to a multi-sheet Excel workbook with separate sheets for each summary table. Include at least 3 charts.
- Constraint: The script must run correctly on all 12 files with a single execution -- no manually running it once per file. The learner decides the data quality cleaning rules and documents them in code comments.
- Success indicator: A colleague unfamiliar with the project could run the script on new monthly files and get correct output without modification.

**Phase 2 Milestone:**

"I can take a raw CSV dataset I have never seen before and, within 90 minutes, produce a summary report with at least 3 aggregation tables and 2 visualizations -- without following any tutorial, using only the Pandas documentation as reference."

- Spaced retrieval check (3-5 days after Phase 2 ends): Without looking at any code from Phase 2, write from memory the syntax for: (1) groupby with multiple aggregation functions, (2) merging two DataFrames on a common key, (3) filtering rows where a date column falls within a specific date range. Any syntax gap here should trigger 1 additional week of practice on that specific operation.
- Not-ready signal: If completing Project 2B required the learner to look up basic Pandas syntax (not edge cases -- basic operations like .groupby() or .merge()) more than 5 times, Phase 2 is not complete. The solution is more practice projects, not more reading.

---

### Phase 3: Applied Marketing Analytics -- 6 Weeks (45-50 hours)

**Phase Objective:** Complete a realistic, unscaffolded end-to-end analysis project that mirrors the learner's actual job. Produce a deliverable that could be shared with a manager or client without embarrassment. Consolidate and internalize all Phase 1 and 2 skills.

**Capstone Project: Full Marketing Performance Review**
- Scope: 25-35 hours over 5 weeks (1 week buffer for iteration)
- Inputs: The learner's actual work data if possible (anonymized or with permission), or a publicly available marketing dataset with sufficient complexity (multiple channels, 12+ months of data, 50,000+ rows)
- Required outputs:
  - A Python script (or structured set of scripts) that ingests raw data and produces all outputs from a single execution
  - At minimum 5 analysis tables: channel performance summary, time-series trend by month, cohort or segment comparison, top/bottom performers by a key metric, and an anomaly or outlier identification
  - At minimum 4 visualizations: a time-series line chart, a comparative bar chart, a scatter or bubble chart showing the relationship between two metrics, and one chart of the learner's own design showing an insight they discovered
  - An exported Excel workbook formatted well enough to hand to a stakeholder
  - A brief plain-language write-up (100-200 words) in a comment block at the top of the main script explaining what the analysis shows and what decisions it supports
- Portfolio value: This artifact demonstrates end-to-end Python data analysis capability with real marketing data, production-quality code organization (comments, meaningful variable names, no unnecessary repetition), and business communication ability. It is appropriate to include in a portfolio or show to an employer.

**Path Completion Milestone:**

"I can independently perform any analysis I currently do in Excel using Python, write reusable scripts that run on new data without modification, produce charts ready for stakeholder presentation, and export formatted results -- with the Pandas and Matplotlib documentation as my only reference, on data I have never seen before, in under half the time it would take me in Excel."

---

### Resource Selection Summary

| Phase | Primary Resource | Type | Hours | Why This Position |
|-------|-----------------|------|-------|------------------|
| 1 | Interactive in-browser Python course (variables through file I/O) | Interactive course | 17 | Immediate code-running feedback critical at syntax acquisition stage |
| 1 | Official Python docs: Built-in Types and Functions | Reference | 2 | Builds documentation habit before Pandas where the docs are more complex |
| 2 | Comprehensive Pandas textbook or structured course | Book / course | 28 | Systematic coverage of all DataFrame operations; fills gaps that YouTube-hopping leaves |
| 2 | Pandas official documentation: core sections | Reference | 4 | Pandas docs are excellent; navigating them is a core skill |
| 2 | Excel-to-Python operation mapping | Cheat sheet | 2 | Leverages prior Excel expertise to reduce Phase 2 cognitive load |
| 3 | Capstone project (self-directed) | Practice | 30 | Consolidation requires no more instruction -- only unscaffolded doing |

**70/20/10 Time Allocation Check:**
- Active practice (70%): ~105 hours -- Phase 1 practice project (4 hrs), Phase 2 Project 2A (10 hrs), Phase 2 Project 2B (14 hrs), daily exercises from course chapters (30 hrs), capstone project (30 hrs), spaced retrieval checks (6 hrs), exploration and experimentation (11 hrs)
- Structured instruction (20%): ~30 hours -- interactive course (17 hrs), textbook/structured course (13 hrs)
- Community and reference (10%): ~15 hours -- documentation reading (6 hrs), Python/Pandas community forums for troubleshooting (5 hrs), reviewing other analysts' public notebooks (4 hrs)

---

### Milestone Verification Schedule

| Milestone | Date Target | Pass Condition | Fail Condition |
|-----------|-------------|----------------|----------------|
| Phase 1 complete | End of Week 3 | Writes Excel-to-Python project script independently in under 2 hours | Requires tutorial reference for basic syntax -- repeat functions/loops section |
| Spaced retrieval check 1 | Week 4 (3 days after Phase 1) | Writes sum/mean/max/min function from memory in under 20 min | Takes 20+ min or requires lookups -- 30 min of targeted practice on that syntax |
| Phase 2 midpoint | End of Week 8 | Project 2A runs correctly and passes constraint (no row loops) | Uses row-by-row processing -- must re-do groupby and aggregation sections |
| Phase 2 complete | End of Week 13 | Project 2B runs correctly on all 12 files, exports clean Excel workbook | Requires basic Pandas syntax lookups 5+ times -- extend Phase 2 by 2 weeks |
| Spaced retrieval check 2 | Week 14 (3 days after Phase 2) | Writes groupby, merge, and date filter syntax from memory | Any gaps -- one additional week of practice on the missing operations |
| Path complete | End of Week 17 | Capstone project runs end-to-end, outputs are stakeholder-ready, no tutorial consulted | Output has significant quality gaps -- identify the specific sub-skill responsible and address it before declaring the path complete |

---

### Ongoing Development

**Maintenance cadence:** Python data analysis skills decay within 4-6 weeks without use. Once the path is complete, the learner should write at least one Python script per week for their actual job rather than reverting to Excel. The transition is the hardest part -- the first 4 weeks of using Python at work instead of Excel will be slower; this is normal and temporary.

**Practitioner communities:** Python data analysis has active communities in data-focused forums, subreddit communities for Python and data science, and professional Slack/Discord communities for analysts. The most valuable activity is not reading posts but sharing your work and asking for code review -- feedback from practitioners is the fastest source of adaptive knowledge growth.

**Next level sub-skills:** (1) Statistical testing and hypothesis analysis using scipy.stats for campaign significance analysis. (2) Data visualization libraries beyond Matplotlib -- specifically Plotly for interactive charts. (3) Automating script execution on a schedule rather than running manually. (4) Reading from and writing to databases (PostgreSQL, BigQuery) rather than CSV files. (5) Building reusable analysis functions in a personal utility module rather than copying code between scripts.

**Adjacent paths to consider:** SQL for analysts (high compounding value -- Python and SQL together cover 90% of an analyst's data access and processing needs), basic statistics for business (strengthens the analytical thinking behind the Python mechanics), and data visualization for communication (extends chart-making into storytelling and dashboard design).
