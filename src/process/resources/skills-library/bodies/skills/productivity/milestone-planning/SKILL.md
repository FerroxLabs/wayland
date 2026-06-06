---
name: milestone-planning
description: |
  Breaks a project goal into a milestone sequence with dependencies, durations, and critical path identification. Produces a milestone table with dates, owners, and completion criteria for each milestone.
  Use when the user asks about breaking a project into phases, creating a milestone plan, identifying project dependencies, or building a project timeline.
  Do NOT use for daily task scheduling (use daily-planning), full project kickoff documents (use project-kickoff), or enterprise program management (use business project-management skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management planning checklist"
  category: "productivity"
  subcategory: "project-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Milestone Planning

## When to Use

**Use this skill when:**
- The user has a defined project goal and needs to decompose it into a structured sequence of phases with concrete deliverables -- for example, launching a product, completing a certification, building a software feature set, or executing a marketing campaign
- The user explicitly asks for a milestone plan, project timeline, phase breakdown, or delivery schedule
- The user wants to understand what must happen before something else can start -- they are asking about sequencing, dependencies, or "what comes first"
- The user needs to know whether a project can realistically hit a target date and wants a structured way to evaluate that
- The user is starting a new project and wants to get from "vague goal" to "actionable roadmap" in one structured output
- The user has been given a deadline from a stakeholder and needs to back-calculate whether the timeline is achievable given available effort
- The user is resuming a stalled project and needs to replan from the current state forward

**Do NOT use when:**
- The user needs a full project kickoff document with scope statements, stakeholder matrices, RACI charts, or budget planning -- use `project-kickoff` instead
- The user is scheduling tasks for a single day or week -- use `daily-planning` or `weekly-planning` instead
- The user needs a formal risk register with probability scoring, impact matrices, and mitigation owners -- use `risk-assessment` instead
- The user is managing an enterprise program with multiple interdependent project streams, resource pools, or portfolio-level reporting -- use business program management skills instead
- The user wants to report current status against an existing milestone plan (percent complete, RAG status, variance) -- use `project-status-report` instead
- The user is trying to estimate the cost of a project -- milestone planning produces timelines, not budget estimates; route financial questions to appropriate costing skills
- The user needs a detailed work breakdown structure (WBS) with task-level decomposition below the milestone layer -- WBS is a different artifact; note the distinction and offer to build it separately

---

## Process

### Step 1: Capture Project Parameters

Before producing any plan, gather the four inputs that determine whether a milestone plan is possible to build and whether it will be meaningful.

- **Final deliverable:** Ask the user to describe the end state in concrete terms. "The project is done when [X exists or [Y is true]." If the answer is vague ("when the product is ready"), push back once: "What specifically would you hand to a stakeholder or customer to prove the project is complete?"
- **Target date or desired duration:** Get either an absolute date ("must launch by March 15") or a relative duration ("within 3 months"). If the user has neither, you will generate a recommended timeline based on the work estimate and output it with explicit caveat that it is a bottom-up estimate, not a commitment.
- **Available effort per week:** This is the single most misunderstood input in project planning. Hours per week must reflect real working hours on this project only -- not total working hours. Ask: "How many hours per week can you or your team realistically dedicate to this project, accounting for meetings, other work, and interruptions?" A typical knowledge worker self-reports 40 hours/week but has only 20-25 productively available for focused project work.
- **Known constraints or fixed dates:** Hard gates (board review dates, regulatory submission windows, trade show deadlines, vendor contract expiry) are non-negotiable anchors. Collect these before building the sequence so they shape milestone placement, not the reverse.

If the user cannot provide one or more of these, apply the defaults described in Edge Cases rather than blocking progress.

### Step 2: Decompose the Project into Milestones

Milestones are not tasks -- they are meaningful state changes in the project. A milestone is a point in time when the project is verifiably different from how it was the day before.

- **Target 5-8 milestones** for any single project strand. Fewer than 4 usually means the milestones are too coarse to be actionable; more than 9 at the top level creates planning noise. If the project naturally has more phases, group them into parent milestones and offer sub-breakdown on request.
- **Name milestones as completed states, not activities.** Use past-tense or noun-form names: "Research Complete," "Prototype Validated," "Content Approved," "System Deployed." Not "Do Research," "Build Prototype," "Write Content." The naming convention reinforces that a milestone is a destination, not a journey.
- **Apply the SMART-M test to each milestone name:** Can you point to a Specific artifact or condition? Is it Measurable (binary pass/fail)? Is it Achievable within the project? Is it Relevant to the final deliverable? Does it have a Time boundary?
- **Use natural domain phases as your decomposition guide.** Most project categories follow well-established phase patterns. Software: Discovery --> Design --> Build --> Test --> Deploy --> Stabilize. Physical product: Concept --> Prototype --> Test --> Refine --> Manufacture --> Ship. Content: Research --> Outline --> Draft --> Edit --> Review --> Publish. Marketing campaign: Strategy --> Creative Brief --> Asset Production --> Approval --> Launch --> Measure. Use these as starting scaffolds, then modify for the user's specific situation.
- **Every milestone must have at least one tangible artifact.** If you cannot name what exists in the world when this milestone is done, it is not a milestone -- it is either a vague phase or it needs to be merged with an adjacent milestone.

### Step 3: Estimate Duration for Each Milestone

Duration estimation is the most error-prone step in milestone planning. The research on planning fallacy is consistent: people underestimate duration by 25-50% for familiar tasks and by 50-100% for novel tasks. Build this into the plan structurally, not as a vague "add contingency."

- **Start with effort hours, not calendar time.** Ask: "How many hours of focused work would it take to complete this milestone if you had uninterrupted time?" This isolates the estimate from calendar math, which comes next.
- **Convert effort to calendar duration using the formula:** Calendar weeks = Effort hours / Available hours per week. Example: 40 effort hours / 10 available hours per week = 4 calendar weeks.
- **Apply the novelty buffer (1.5x multiplier)** to any milestone that the person has not personally completed before in substantially the same form. "Novelty" includes: doing it for the first time ever, doing it in a new domain, doing it with a new tool, or doing it at a significantly larger scale than before.
- **Apply the external dependency buffer (1.25x multiplier)** to any milestone that requires input, approval, or action from a person outside the project team. External dependencies include: client sign-off, vendor delivery, regulatory review, beta tester feedback, legal approval. The 1.25x buffer accounts for scheduling friction, not just the actual wait time.
- **Do not double-apply buffers.** If a milestone is both novel AND has external dependencies, use the larger buffer (1.5x), not multiplicative stacking (1.875x would be unrealistic overestimate).
- **Anchor estimates using reference class forecasting** when the user is uncertain. Ask: "Have you done anything similar before? How long did that take?" If they have a reference case, use it as the base estimate and adjust for scope differences rather than estimating from scratch. Reference class anchoring is consistently more accurate than bottom-up task estimation for novel work.
- **Flag any single milestone consuming more than 30% of total project effort.** This is a concentration risk indicator. A milestone that dominates the plan is often under-decomposed (it should be split into 2-3 sub-milestones) or it is genuinely the hardest part of the project and should be positioned as the primary risk to manage.

### Step 4: Map Dependencies

Dependency mapping determines the logical constraint structure of the project. There are four dependency types in formal project management; use all four when relevant.

- **Finish-to-Start (FS):** B cannot start until A is finished. This is the default dependency type and covers most milestone relationships. Use it unless there is a specific reason for another type.
- **Start-to-Start (SS):** B can start as soon as A starts, but does not require A to finish. Common in parallel workstreams that share a common kickoff (e.g., two development tracks that both begin after requirements are complete).
- **Finish-to-Finish (FF):** B cannot finish until A finishes. Common when a support activity (documentation, testing) must run to completion alongside a primary activity.
- **Start-to-Finish (SF):** B cannot finish until A starts. Rare -- most commonly used in shift handover scenarios. Flag this type explicitly if it appears, because it is often a sign of a planning error.
- **Identify all predecessor milestones before drawing any arrows.** For each milestone, ask: "What is the minimum prior state required for work on this milestone to begin?" Then ask: "Is that dependency truly hard (cannot proceed without it) or soft (would prefer to have it, but could start without it)?" Soft dependencies are parallelization opportunities.
- **External dependencies (outside the project) are different from internal dependencies.** Mark them distinctly in the dependency map. External dependencies introduce timeline uncertainty that internal dependencies do not, because you cannot control the pace of an external party.

### Step 5: Identify the Critical Path

The critical path is the sequence of milestones with zero float -- meaning any delay in any milestone on this path delays the project end date by exactly the same amount.

- **Calculate Early Start (ES) and Early Finish (EF) using a forward pass.** Start at M1. ES of M1 = project start date. EF of each milestone = ES + Duration. For a milestone with multiple predecessors, ES = the latest EF among all predecessors.
- **Calculate Late Start (LS) and Late Finish (LF) using a backward pass.** Start from the last milestone. LF of last milestone = project end date. LS = LF -- Duration. For a milestone with multiple successors, LF = the earliest LS among all successors.
- **Float = LS -- ES** (or equivalently LF -- EF). Milestones with Float = 0 are on the critical path. Milestones with positive float have scheduling flexibility.
- **When calculating by hand or in plain text, use the longest path method** as a shortcut: trace every path from start to end, sum the durations on each path, and the longest total duration is the critical path. Verify that the identified path cannot be shortened through parallelism.
- **Mark critical path milestones explicitly** in the milestone table with "Yes" in the Critical Path column and with a note on the dependency map (e.g., bold arrows or a legend marker).
- **The critical path is not permanent.** If a non-critical milestone slips enough to consume all its float, it becomes critical and may even extend the project end date beyond the original critical path duration. Flag the milestone with the least float as the "near-critical" milestone -- it is the most likely candidate to become a new constraint.

### Step 6: Define Completion Criteria

Completion criteria are the enforcement mechanism that prevents scope creep, avoids "98% done" syndrome, and creates shared understanding of when a milestone is truly finished.

- **Completion criteria must be binary.** The milestone is either done or it is not. "The draft is mostly written" is not a completion criterion. "The draft contains a complete chapter for each of the 10 outline entries, totaling at least 40,000 words, with no placeholder sections" is a completion criterion.
- **Every milestone needs three elements:** a specific observable condition, a named deliverable or artifact (something that can be pointed to, saved, sent, or measured), and a review action (who confirms it is done and by what method).
- **Use definition-of-done (DoD) thinking from software development** even for non-software projects. The DoD principle says that a piece of work is not done until it meets all agreed quality criteria, not just the minimum condition. Ask: "What would make a stakeholder refuse to call this milestone complete even if the primary deliverable existed?"
- **Avoid "sent" as a completion criterion for milestones with external dependencies.** "Sent to client for review" is not the same as "Client review complete." Distinguish between the action you control (sending) and the outcome you need (approval). If you only control the sending, completion of that milestone should be "submitted for review" -- and the approval should be a separate downstream milestone.

### Step 7: Assemble, Check, and Output the Plan

Before delivering the plan, run these quality checks:

- **Timeline feasibility check:** Does the critical path duration fit within the target date? If not, calculate the gap (in days or weeks) and present the shortfall explicitly. Never silently adjust the plan to fit the target date without flagging the compression.
- **Effort sanity check:** Is the total estimated effort plausible given the available weekly hours? Divide total hours by weekly hours to get the minimum calendar duration. If this number alone exceeds the target date before even accounting for sequencing, the project is mathematically impossible as scoped.
- **Load distribution check:** Are milestones reasonably distributed across the timeline, or is 80% of the work compressed into the last half? Front-loaded plans are more resilient -- they discover problems early. Back-loaded plans are fragile.
- **Single point of failure check:** Is there any milestone where a single person, vendor, or approval gate is the only path forward? These are project chokepoints. Flag them as risk items and suggest mitigation (a backup resource, an alternative approval path, a pre-agreed SLA with the dependency owner).
- Produce the final output using the Output Format below. Do not omit any section. If a section is not applicable (e.g., no parallel opportunities exist), include the section and explain why it is not applicable -- do not silently delete it.

---

## Output Format

```
## Milestone Plan: [Project Name]

### Project Parameters
| Parameter | Value |
|-----------|-------|
| Final deliverable | [concrete description of what done looks like] |
| Target completion | [date or week number] |
| Available effort | [hours/week, and who is contributing] |
| Total estimated effort | [hours, after buffers] |
| Minimum calendar duration | [calculated from critical path] |
| Timeline feasibility | [Fits target / Shortfall of X weeks -- see notes] |

---

### Milestone Sequence

| # | Milestone Name | Deliverable/Artifact | Effort (hrs, raw) | Buffer Applied | Effort (hrs, buffered) | Calendar Duration | Start | End | Dependencies | Critical Path |
|---|----------------|---------------------|------------------|----------------|----------------------|------------------|-------|-----|-------------|---------------|
| M1 | [State-change name] | [Named artifact] | [hrs] | None | [hrs] | [wks] | Week 1 | Week X | None | Yes/No |
| M2 | [State-change name] | [Named artifact] | [hrs] | 1.5x (novel) | [hrs] | [wks] | Week X | Week Y | M1 | Yes/No |
| M3 | [State-change name] | [Named artifact] | [hrs] | 1.25x (ext. dep) | [hrs] | [wks] | Week X | Week Y | M1 | Yes/No |
| M4 | [State-change name] | [Named artifact] | [hrs] | None | [hrs] | [wks] | Week X | Week Y | M2, M3 | Yes/No |

---

### Dependency Map

```
Legend: --> = Finish-to-Start dependency | [CP] = Critical Path

[Start]
  |
  v
M1: [Name] [CP]
  |         \
  v          v
M2: [Name]  M3: [Name]
[CP]         (float: X wks)
  |          /
  v         /
M4: [Name] [CP]
  |
  v
[End: Project Complete]
```

---

### Critical Path Analysis

- **Critical path:** M1 --> M2 --> M4 --> [etc.]
- **Critical path duration:** [X weeks]
- **Target date:** [date or week number]
- **Feasibility verdict:** [Fits / Shortfall of X weeks]
- **Near-critical milestone (least float):** [milestone name] -- [X days of float; risk of becoming critical if slips]
- **Highest risk milestones on critical path:**
  - [Milestone name]: [reason -- novel work / external dependency / single point of failure / large effort concentration]
  - [Milestone name]: [reason]

---

### Float and Parallel Opportunities

| Milestone | Total Float | Can Run Alongside | Scheduling Flexibility |
|-----------|-------------|------------------|----------------------|
| [M3 name] | [X weeks] | [M2 name] | Can start as early as [date], must complete by [date] |
| [M5 name] | [X weeks] | [M2, M3, M4 names] | Flexible; only gates M6 |

---

### Completion Criteria

| # | Milestone | Done When (observable condition) | Deliverable | Review Action | Owner |
|---|-----------|----------------------------------|-------------|--------------|-------|
| M1 | [Name] | [Binary condition] | [Artifact name and format] | [Who reviews, how, and what they are looking for] | [Person or role] |
| M2 | [Name] | [Binary condition] | [Artifact name and format] | [Who reviews, how, and what they are looking for] | [Person or role] |
| M3 | [Name] | [Binary condition] | [Artifact name and format] | [Who reviews, how, and what they are looking for] | [Person or role] |
| M4 | [Name] | [Binary condition] | [Artifact name and format] | [Who reviews, how, and what they are looking for] | [Person or role] |

---

### Buffer and Contingency Summary

| Category | Applied To | Multiplier | Hours Added |
|----------|-----------|-----------|-------------|
| Novelty buffer | [milestone names] | 1.5x | +[hrs] |
| External dependency buffer | [milestone names] | 1.25x | +[hrs] |
| **Total buffer** | | | **+[hrs] ([X]% of base effort)** |

**Contingency triggers and responses:**
- If [milestone] slips by more than [threshold: typically 20-25% of its duration], reassess all downstream dates and alert stakeholders
- If total project slippage reaches [1-2 weeks depending on project length], trigger a scope reduction review: options are [remove specific milestone or deliverable], [reduce quality bar on non-critical milestones], or [increase weekly effort by X hours to recover]
- If external dependency [milestone] is not resolved by [specific date], activate contingency path: [describe alternative]

---

### Assumptions and Risks

| # | Assumption/Risk | Type | Impact if Wrong | Mitigation |
|---|----------------|------|----------------|-----------|
| 1 | [stated assumption] | Assumption | [consequence] | [action] |
| 2 | [stated risk] | Risk | [consequence] | [action] |
```

---

## Rules

1. **Never produce a milestone plan without dates.** Milestones without start and end dates are wishes, not plans. If the user has not given a start date, default to "Week 1" as the anchor and output relative dates (Week 1, Week 4, etc.). If the user provides an absolute start date, translate all dates to calendar dates.

2. **Every milestone must have a named deliverable -- not just a description of activity.** "Research complete" is a milestone name. "Annotated bibliography of 15 sources, saved as research-notes.docx" is the deliverable. Without a deliverable, there is no way to confirm the milestone is done.

3. **Apply duration buffers structurally, not as a vague note.** Show the raw estimate, the buffer multiplier applied, and the buffered estimate in separate columns. This makes planning assumptions visible and adjustable rather than hidden in inflated numbers.

4. **Never report the total project duration as the sum of all milestone durations.** Total duration is the critical path duration. Summing all milestones double-counts parallel work and always overstates the timeline. Calculate the forward pass correctly.

5. **Flag any milestone that represents more than 30% of total buffered effort as a concentration risk.** These over-weight milestones are the most common source of project failure. Always recommend splitting them into 2-3 sub-milestones or at minimum identify a midpoint checkpoint within the milestone.

6. **The critical path must be re-evaluated any time a milestone is added, removed, or significantly re-scoped.** Communicate this clearly to the user: the plan is a snapshot, and structural changes invalidate the critical path analysis.

7. **Completion criteria must never use relative language.** Words like "mostly," "substantially," "mostly done," "largely complete," or "reviewed" without specifying what review means are forbidden in the Done When column. Every completion criterion must be testable by a third party who was not involved in the work.

8. **External dependencies must be identified and distinguished from internal ones in every plan section.** External dependencies carry schedule risk that internal dependencies do not. They require different mitigation strategies: SLA agreements, early engagement, buffer time, and alternative paths.

9. **If the critical path duration exceeds the target date, present the shortfall before delivering the plan** and offer three resolution options: (a) extend the target date to match the bottom-up estimate, (b) reduce scope by removing the lowest-priority milestones, (c) increase available effort (more hours per week, add a resource). Do not silently compress the plan to fit the target.

10. **Do not use generic milestone names like "Phase 1," "Phase 2," or "Stage 3."** Every milestone name must communicate what state the project is in when that milestone is complete. A reader who has never seen the project should be able to read the milestone sequence and understand what the project produces and in what order.

---

## Edge Cases

**The user has no time estimate for their milestones and cannot guess.**
Use relative sizing with a T-shirt sizing anchor. Ask: "Which milestone feels like the largest single chunk of work in this project?" Assign it a reference size of 10 units. Ask the user to rate each remaining milestone relative to that one (half as much work = 5 units, twice as much = 20 units). Once all milestones have relative sizes, ask for the user's best guess at how long the reference milestone would take in hours. Use that to calculate a unit-to-hour conversion ratio and derive all other estimates. Document the reference anchor and conversion factor in the Assumptions section so the estimates are traceable.

**All milestones are sequentially dependent with no parallelism (pure waterfall sequence).**
This is a high-risk plan structure. Any single milestone delay cascades to the project end date without exception, and there is no float anywhere in the plan. When you encounter this, do three things: (1) Flag it explicitly in the Critical Path Analysis section with the phrase "No float exists anywhere in this plan -- this is a high-fragility schedule." (2) Actively look for hidden parallel opportunities that the user may not have considered: documentation, procurement, stakeholder communication, environment setup, or preparation work that can begin before a predecessor is fully complete. (3) Recommend Start-to-Start dependencies where a downstream milestone can begin with a partial output from the predecessor (e.g., testing can begin on the first completed module before all modules are built).

**The user wants more than 9 milestones in the top-level plan.**
Group smaller milestones into parent milestones to keep the top-level plan at 5-8 items. Present the grouped plan first, then offer: "I can expand [Milestone Name] into its 3 sub-milestones if you want that level of detail." Use a two-level numbering scheme for sub-milestones: M3 at the top level, M3.1, M3.2, M3.3 at the sub-level. The critical path analysis operates at the top level; sub-milestone detail is for execution planning, not timeline management.

**One or more milestones have external dependencies with completely unknown timelines (e.g., waiting for regulatory approval, vendor contract negotiation, client budget approval).**
Mark these milestones with the state label "Pending -- External." Apply a 2x multiplier to the expected wait time if the user has any reference for how long this type of dependency typically takes. If there is no reference at all, use the following defaults by dependency type: regulatory review in a standard domain -- 8-12 weeks; legal/contract review -- 2-4 weeks; client budget approval -- 2-6 weeks; vendor delivery of a standard product -- 4-8 weeks. Set a "dependency resolution checkpoint" date at the halfway point of the wait estimate. Include an explicit contingency note: "If [dependency] is not resolved by [date], the project end date will slip to [recalculated date] unless scope is reduced or an alternative path is identified."

**The project has already started and some milestones are complete.**
Record completed milestones with actual start and end dates (not estimated). If any completed milestone ran over its original estimate, apply a "velocity adjustment factor" to all remaining similar milestones. The formula is: Adjustment factor = Actual duration / Estimated duration for completed milestones. If the average velocity adjustment factor is greater than 1.2 (project is running 20%+ over estimates), apply it to all remaining milestone estimates and recalculate the critical path and feasibility verdict. Be explicit about this adjustment in the Assumptions section.

**The user provides a target date that is shorter than the minimum mathematical duration (total critical path effort hours / available weekly hours).**
This is a plan that is impossible as scoped, regardless of any optimization. Do not attempt to fit the plan to the target -- doing so produces a plan that is internally inconsistent and that the user will discover is broken almost immediately. Instead: (1) State the mathematical minimum: "Based on the total estimated effort of [X hours] and [Y hours/week] available, the minimum possible duration is [Z weeks], which is [N weeks] longer than your target." (2) Offer only legitimate resolution paths: increase weekly hours, reduce scope (name specific milestones that could be deferred), or adjust the target date. (3) If the user insists on the original target, produce the plan with a prominent warning section titled "TIMELINE WARNING" before the milestone table and state the assumptions required to make it work (e.g., 20 hours/week instead of 8).

**The project involves a team rather than a single person.**
Assign owners to milestones, not just to tasks. One person should be accountable for each milestone even if multiple people contribute. Add an "Owner" column to both the Milestone Sequence table and the Completion Criteria table. Flag any milestone where the same person is the owner of three or more sequential milestones on the critical path -- this is a single point of failure risk. Note that effort estimation changes with teams: parallelism is possible within a milestone (multiple people working simultaneously), which can reduce calendar duration below what the individual-based calculation would suggest, but coordination overhead (typically 10-15% of total effort for teams of 3-5 people) must be added to the total.

---

## Example

**Input:** "I'm building an online course about personal finance for beginners. I need to script, record, and edit the videos, create worksheets, set up the course platform, and launch it. I can work about 10 hours a week on this. I want to launch in 4 months."

**Output:**

---

## Milestone Plan: Personal Finance Beginner Online Course

### Project Parameters
| Parameter | Value |
|-----------|-------|
| Final deliverable | Published online course on a course platform, with 8-10 video modules, one downloadable worksheet per module, and a functioning enrollment and payment flow |
| Target completion | 17 weeks (4 months) from project start |
| Available effort | 10 hours/week (solo creator) |
| Total estimated effort | 163 hours (after buffers) |
| Minimum calendar duration | 16.3 weeks (rounds to 17 weeks) |
| Timeline feasibility | Fits target -- margin of approximately 0.7 weeks (5 days); tight but achievable if no milestone slips significantly |

---

### Milestone Sequence

| # | Milestone Name | Deliverable/Artifact | Effort (hrs, raw) | Buffer Applied | Effort (hrs, buffered) | Calendar Duration | Start | End | Dependencies | Critical Path |
|---|----------------|---------------------|------------------|----------------|----------------------|------------------|-------|-----|-------------|---------------|
| M1 | Course Outline Finalized | Module outline document: 8-10 modules, each with learning objectives, key topics, and one worksheet concept | 10 | None | 10 | 1 week | Week 1 | Week 1 | None | Yes |
| M2 | All Scripts Written | 8-10 completed video scripts (estimated 1,500-2,500 words each), saved as individual script files | 45 | None | 45 | 4.5 weeks | Week 2 | Week 6 | M1 | Yes |
| M3 | All Worksheets Created | 8-10 designed worksheet PDFs, one per module, matched to script content | 20 | None | 20 | 2 weeks | Week 2 | Week 3 | M1 | No |
| M4 | Raw Video Recorded | Raw video files for all 8-10 modules, recorded with consistent audio and lighting setup | 30 | 1.5x (novel -- first time recording a course) | 45 | 4.5 weeks | Week 7 | Week 11 | M2 | Yes |
| M5 | Course Platform Configured | Fully configured course platform: enrollment page live, payment gateway tested, module structure built, placeholder content uploaded | 12 | 1.5x (novel -- first time using platform) | 18 | 1.8 weeks | Week 2 | Week 4 | M1 | No |
| M6 | Videos Edited and Finalized | Edited video files for all modules: cuts, captions, intro/outro, and audio levels normalized | 35 | 1.5x (novel -- first time editing course video at this volume) | 52.5 | 5.25 weeks | Week 12 | Week 17 | M4 | Yes |
| M7 | Course Content Uploaded | All videos and worksheets uploaded to platform, module descriptions written, preview video live | 8 | None | 8 | 0.8 weeks | Week 17 | Week 17 | M5, M6, M3 | Yes |

**Total buffered effort:** 198.5 hours
**Revised minimum calendar duration:** 19.85 weeks

---

> **TIMELINE WARNING:** After applying novelty buffers to M4, M5, and M6 (all first-time activities at this scale), the total buffered effort is 198.5 hours. At 10 hours/week, the minimum calendar duration is approximately 19-20 weeks -- 3 weeks beyond the 17-week (4-month) target. See the Contingency section for resolution options.

---

### Dependency Map

```
Legend: --> = Finish-to-Start | [CP] = Critical Path | (float: Xw) = available float

[Project Start: Week 1]
         |
         v
M1: Course Outline Finalized [CP]
         |
  _______|_______________________________
  |              |                      |
  v              v                      v
M2: All Scripts  M3: All Worksheets    M5: Platform
Written [CP]     Created               Configured
(Wk 2-6)         (Wk 2-3, float: 13w) (Wk 2-4, float: 13w)
  |              |                      |
  v              |                      |
M4: Raw Video    |                      |
Recorded [CP]    |                      |
(Wk 7-11)        |                      |
  |              |                      |
  v              |                      |
M6: Videos       |                      |
Edited [CP]      |                      |
(Wk 12-17)       |                      |
  |______________|______________________|
                 v
M7: Course Content Uploaded [CP]
(Wk 17)
         |
         v
[Project Complete: Course Launched]
```

---

### Critical Path Analysis

- **Critical path:** M1 --> M2 --> M4 --> M6 --> M7
- **Critical path duration:** 17 weeks (raw, before buffer realization)
- **Buffered duration:** 19-20 weeks
- **Target date:** Week 17
- **Feasibility verdict:** Shortfall of 2-3 weeks after applying appropriate novelty buffers to M4, M5, and M6. See Contingency section for options.
- **Near-critical milestone (least float):** M5 (Platform Configured) -- 13 weeks of float when scheduled Week 2-4, but must complete before M7; no risk of becoming critical unless delayed past Week 16.
- **Highest risk milestones on critical path:**
  - **M4 (Raw Video Recorded):** First-time recording at this volume. Audio setup, lighting, reshoots, and script stumbles routinely double first-time recording estimates. Novelty buffer of 1.5x already applied; this milestone should have a midpoint checkpoint at Week 9 to assess pace.
  - **M6 (Videos Edited):** Editing is consistently the most underestimated phase of course production. Creators typically discover audio problems, continuity errors, and content gaps during editing that require reshoot segments. Largest single effort block at 52.5 buffered hours (26% of total effort). Recommend splitting into M6a: "First 5 Modules Edited" and M6b: "All Modules Edited" if possible.
  - **M2 (All Scripts Written):** 45 hours of scriptwriting assumes consistent output of approximately 10 hours per script. If the creator gets stuck on early modules (common for first-time course creators as they over-research and over-structure), downstream compression begins here.

---

### Float and Parallel Opportunities

| Milestone | Total Float | Can Run Alongside | Scheduling Flexibility |
|-----------|-------------|------------------|----------------------|
| M3 (Worksheets Created) | ~13 weeks | M2, M4, M6 | Can start Week 2, must complete by Week 16; highly flexible; ideal to schedule during low-intensity scripting weeks |
| M5 (Platform Configured) | ~13 weeks | M2, M3, M4 | Can start as early as Week 2, must complete by Week 16; recommend completing by Week 8 to allow time for troubleshooting payment/enrollment issues well before launch |

**Parallelism note:** M3 and M5 can both run alongside M2. Strategically, the best use of these parallel slots is: complete M5 early (Weeks 2-4) while scripting is in flow, and spread worksheet creation (M3) across Weeks 2-6 by building each worksheet immediately after its corresponding script is drafted. This "rolling" approach to M3 is not reflected in the milestone table (which shows it as a single block) but is a valid execution pattern that reduces late-stage compression.

---

### Completion Criteria

| # | Milestone | Done When (observable condition) | Deliverable | Review Action | Owner |
|---|-----------|----------------------------------|-------------|--------------|-------|
| M1 | Course Outline Finalized | All 8-10 modules are listed with: (a) a one-sentence learning objective, (b) 3-5 key topic bullets, (c) one worksheet concept name -- with no placeholder entries | course-outline.docx (or equivalent) | Self-review: read the outline start to finish and confirm a beginner could follow the progression; no module is "TBD" | Creator |
| M2 | All Scripts Written | Every module has a complete script with: (a) an opening hook, (b) all teaching content, (c) a call-to-action or summary close; scripts are between 1,200 and 2,800 words each; no script contains "[insert example here]" or similar placeholders | Individual script files, one per module, named by module number | Self-review: read each script aloud; if any section takes longer than 30 minutes to record naturally, it needs splitting | Creator |
| M3 | All Worksheets Created | One PDF worksheet exists for every module in the outline; each worksheet has: (a) a title matching the module name, (b) at least 3 exercises or fill-in-the-blank sections, (c) a consistent visual template | PDF files, one per module (e.g., Module-01-Worksheet.pdf) | Self-review: complete one worksheet as if you are a student; if any question is ambiguous or unanswerable from the module content alone, revise | Creator |
| M4 | Raw Video Recorded | Raw video files exist for all modules; each recording (a) has clean audio with no background noise spikes, (b) is recorded in a single consistent background/lighting setup, (c) contains the complete script content (partial recordings do not count); total recorded content is 40-80 minutes across all modules | Raw .mp4 or equivalent files, one per module | Review: play first 2 minutes and last 2 minutes of each raw file to confirm no cut-off recording exists; check audio with headphones on at least 3 random modules | Creator |
| M5 | Course Platform Configured | Platform account is live with: (a) all module slots created in correct order, (b) enrollment page with a complete course description and placeholder pricing, (c) payment gateway connected and a $1 test transaction successfully processed, (d) at least one test student account has enrolled and accessed a module | Platform URL (live link) and test enrollment confirmation email | Test: create a new browser incognito session, enroll as a test student, complete the payment, and access at least one module | Creator |
| M6 | Videos Edited and Finalized | Edited video files exist for all modules with: (a) all significant stumbles and long pauses removed, (b) consistent intro and outro segments added, (c) captions added (auto-generated is acceptable if reviewed for accuracy), (d) audio normalized to -14 LUFS (standard for online video); no module has a dead-air segment longer than 3 seconds | Edited .mp4 files, one per module, stored in a clearly named export folder | Review: watch 5 minutes of the middle of the longest module at 1x speed; if any caption is wrong enough to confuse a viewer, flag for correction before marking complete | Creator |
| M7 | Course Content Uploaded | All video and worksheet files are live on the platform; each module has: (a) the edited video uploaded and playable, (b) the corresponding worksheet attached as a downloadable file, (c) a module description of at least 50 words, (d) the course preview video is set to public; enrollment is open with final pricing | Course listing URL (publicly accessible) | Final test: enroll a friend or trusted contact as a free test student; ask them to access Module 1, download the worksheet, and report any errors | Creator |

---

### Buffer and Contingency Summary

| Category | Applied To | Multiplier | Raw Hours | Buffered Hours | Hours Added |
|----------|-----------|-----------|----------|---------------|------------|
| Novelty buffer | M4 (Recording) | 1.5x | 30 | 45 | +15 |
| Novelty buffer | M5 (Platform) | 1.5x | 12 | 18 | +6 |
| Novelty buffer | M6 (Editing) | 1.5x | 35 | 52.5 | +17.5 |
| No buffer | M1, M2, M3, M7 | 1.0x | 93 | 93 | 0 |
| **Total** | | | **170 hrs** | **208.5 hrs** | **+38.5 hrs** |

**Note:** M5 novelty buffer not shown in original milestone table (was listed as 18 hours). Total recalculated above.

**Resolution options for the 2-3 week shortfall:**

Option 1 -- Extend the target date by 3 weeks (to Week 20):
This is the recommended option. The buffer-adjusted estimate is 19-20 weeks. A 3-week extension gives approximately 1 week of remaining contingency and produces a plan that is honest about first-time creator timelines.

Option 2 -- Increase weekly effort to 12-13 hours/week:
At 12.5 hours/week, the 208.5 buffered hours complete in 16.7 weeks -- within the 17-week target. This requires consistently finding 2.5 additional hours per week, which is achievable but eliminates all schedule cushion.

Option 3 -- Reduce course scope from 10 modules to 8 modules:
Removing 2 modules reduces M2 (scripts) by approximately 9 hours and M3 (worksheets) by 4 hours, M4 (recording) by 6 hours, and M6 (editing) by 7 hours -- approximately 26 hours saved, reducing the timeline by 2-2.5 weeks. An 8-module course is a complete and valid product; this is not a significant quality reduction.

**Contingency triggers:**
- If M2 (scripts) is not complete by Week 7 (1 week late), begin evaluating Option 3 (8-module scope) immediately -- do not wait to see if the delay can be recovered
- If M4 (recording) is not complete by Week 12 (1 week late), add 2 hours/week for the remainder of the project to compress M6
- If any milestone is tracking 25% over its estimated duration at its midpoint, flag the specific milestone in a weekly review and adjust remaining estimates accordingly

---

### Assumptions and Risks

| # | Assumption/Risk | Type | Impact if Wrong | Mitigation |
|---|----------------|------|----------------|-----------|
| 1 | Creator has a quiet recording environment with acceptable baseline audio quality using existing equipment | Assumption | If equipment is inadequate, M4 duration could double; audio problems discovered in editing create M4 reshoots that cascade into M6 | Test record one full module in Week 7 before committing to the recording schedule; identify audio issues before all scripts are locked |
| 2 | Course platform choice is already decided; no platform evaluation phase is included | Assumption | Platform selection and learning curve could add 5-10 hours if the creator is still deciding | Decide on the platform before Week 2; recommended platforms for solo creators include Teachable, Podia, and Thinkific for their enrollment/payment integration |
| 3 | Creator has sufficient personal finance domain knowledge to script without extensive external research | Assumption | Heavy research needs during M2 could add 15-20 hours to scripting, compressing or eliminating M2 float | Validate this assumption during M1: if more than 20% of module topics require significant new research, flag it at the outline stage and add 15 hours to M2 |
| 4 | No external reviewers, co-instructors, or business partners need to approve content | Assumption | Any required external review adds 1-3 weeks of wait time and converts M2 or M6 into milestones with external dependencies | If an external reviewer is needed, insert a milestone "Content Reviewed and Approved" between M2 and M4, add 1.25x external dependency buffer, and recalculate the critical path |
| 5 | Video editing will be performed by the creator using consumer editing software | Risk | Professional video editing is a skill with a steep learning curve; a first-time editor using software like DaVinci Resolve, CapCut, or iMovie may spend more than the buffered 52.5 hours | Consider outsourcing editing for the first course iteration if the creator has no prior editing experience; a freelance editor for a 10-module course typically costs $300-$800 and could save 30+ hours |
