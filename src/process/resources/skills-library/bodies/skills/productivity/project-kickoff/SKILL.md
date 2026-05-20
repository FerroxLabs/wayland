---
name: project-kickoff
description: |
  Produces a complete project kickoff document with scope statement, success criteria, milestone list with dates, stakeholder map, risk list, and communication plan. Built from the user's project description for personal or small-team projects.
  Use when the user asks about starting a new project, creating a project plan, writing a project charter, or setting up a project for success.
  Do NOT use for enterprise project management with multiple teams (use business project-management skills), product roadmap creation (use business strategy skills), or ongoing project status tracking (use project-status-report).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management planning template"
  category: "productivity"
  subcategory: "project-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Project Kickoff

## When to Use

**Use this skill when:**
- A user is starting a new personal or small-team project (1-5 people) and needs to crystallize thinking into a structured plan before writing a single line of code, spending money, or committing to a deadline
- A user asks for a "project plan," "project charter," "kickoff doc," or any phrasing that signals they want to organize a project before beginning work -- including phrases like "I want to finally do X" or "I have this idea I want to make real"
- A user wants to define scope, milestones, and success criteria so the project has a clear definition of done rather than drifting indefinitely
- A user is restarting a previously failed or abandoned project and wants to approach it more rigorously this time
- A user has a rough idea and wants help stress-testing it: identifying what they're actually committing to, what risks exist, and whether the timeline is realistic
- A user is working with 1-3 collaborators informally (no contracts, no formal team structure) and needs a shared reference document to prevent misaligned expectations
- A user explicitly says they "tend to lose momentum" or "never finish projects" -- this skill creates the structure that maintains accountability

**Do NOT use when:**
- The project involves multiple teams, departmental budgets, formal procurement, or executive sponsorship -- use business project-management skills instead, which handle RACI matrices, governance structures, and stage-gate reviews
- The user wants a product roadmap with feature prioritization, market positioning, or quarterly OKRs -- use business strategy skills which handle Now/Next/Later frameworks and opportunity sizing
- The user needs ongoing status tracking for an already-running project -- use `project-status-report` which produces progress-against-baseline reports rather than a kickoff document
- The user needs only a risk analysis of an existing plan -- use `risk-assessment` which performs structured risk identification using FMEA or bow-tie analysis
- The user wants to decompose a specific milestone into sprint tasks or a work breakdown structure -- use `milestone-planning` after this skill has established the milestone structure
- The user needs a project budget with line items, actuals tracking, and variance analysis -- use `project-budget-tracker` as a companion to this skill, not a substitute for it
- The user is asking about how to manage people, handle team conflict, or write performance reviews -- those are leadership skills, not project-kickoff territory

## Process

### Step 1: Elicit the Core Project Parameters

Before generating a single section of the document, gather enough information to write a specific, non-generic kickoff. Do not accept vague inputs and try to fill in the blanks -- ask targeted questions.

- Ask for the project name and a one-sentence "elevator pitch" description that names the deliverable, not the activity (say "a deployed mobile app for tracking workouts" not "working on fitness")
- Ask what "done" looks like in concrete, observable terms: what will exist in the world when this project is complete that does not exist today?
- Ask for the target completion date or desired timeframe; if none, ask "when would you want to be using the finished result?"
- Ask who is involved: just the user, or named collaborators? For each collaborator, what is their role?
- Ask for time availability: hours per week the user can realistically dedicate -- note that most people overestimate by 30-50%, so probe: "Does that include evenings and weekends?"
- Ask about known constraints up front: budget ceiling (even if zero), technology requirements, dependencies on third parties, regulatory requirements, or fixed external deadlines
- If the user has already started, ask what exists today -- completed work should be reflected as done milestones, not re-planned

**Elicitation threshold:** If the user provides a project name + description + timeline, that is sufficient to produce a full kickoff document. Do not interrogate exhaustively -- fill reasonable defaults and flag them explicitly with [ASSUMPTION] markers.

### Step 2: Write the Scope Statement Using the INVEST-Adjacent Framing

The scope statement is the most important section -- it prevents the two most common personal project failure modes: scope creep (the project grows until it collapses) and scope fog (nobody knows when it's actually done).

- **In Scope:** List specific, tangible deliverables -- not activities. Write "a 5-page static website deployed at a URL" not "build a website." Each in-scope item should be something you could check off with yes/no. Target 4-8 in-scope items.
- **Out of Scope:** This is equally critical. For every in-scope deliverable, ask "what related thing might someone assume is included?" and put that thing out of scope explicitly. Example: if the website is in scope, "SEO optimization campaigns," "backend API," and "mobile app version" are all plausible scope creep targets to exclude.
- **Assumptions:** List facts the plan treats as given but has not verified. Examples: "assumes the user already has all required photography," "assumes API access will be granted within week 1." Each assumption is a latent risk.
- **Constraints:** List real limits that shape how the project must be executed -- budget ceiling, technology mandates, fixed deadlines, required tools, people who cannot be replaced.
- Apply the "newspaper test": read the in-scope list to someone unfamiliar with the project. If they could reasonably think something else is included, add an out-of-scope line for it.

### Step 3: Define Success Criteria Using SMART-C Principles

Success criteria are the contractual definition of done. They must pass the SMART-C test: Specific, Measurable, Achievable, Relevant, Time-bound, and Checkable by a third party.

- Write minimum 3, maximum 7 success criteria. Below 3 is insufficient to capture a real project; above 7 usually means you are tracking metrics, not criteria.
- Classify each criterion by type: **Date** (completed by X), **Quantity** (at least N of something), **Quality** (meets standard Y), or **Functional** (system does Z under conditions W)
- Every criterion must name its measurement method -- not "the design looks good" but "passes review against a checklist of 5 design principles" or "receives positive feedback from 3 test users"
- Include a "minimum viable success" threshold and an "ideal success" threshold for criteria where there is a meaningful range -- this helps the user distinguish completing the project from perfecting it
- At least one criterion must be time-bound with a hard date; at least one must be quality-related so the user cannot declare success with shoddy output that technically shipped

### Step 4: Build the Milestone Plan with Calendar Dates

Milestones are the backbone of accountability. A milestone is not a task -- it is an observable state of the world that either exists or does not.

- Target 4-8 milestones for a 4-12 week project; for a 1-3 week project, use 2-4 milestones; for a project longer than 12 weeks, use 8-10 milestones maximum and plan to re-kickoff after week 12
- Every milestone must have: a descriptive name, a one-sentence description of what is true when it is complete, a calendar target date (not "week 3" -- use actual dates calculated from kickoff), completion criteria that pass the newspaper test, and a dependency list
- Space milestones to create natural checkpoints every 1-2 weeks for short projects and every 2-3 weeks for longer ones -- monthly milestones are too sparse to catch drift early
- Apply the "M0 rule": milestone 1 should be achievable within the first 7-10 days. Early wins build momentum and reveal planning errors before significant work is invested. Examples: "development environment set up and hello-world app running," "first draft outline written and reviewed," "supplier quotes received and vendor selected"
- The final milestone is always the project completion event: the deliverable is done, deployed, distributed, or whatever "done" means. Do not make the final milestone a review -- reviews are process; delivery is the milestone.
- Flag critical path milestones -- those where a delay cascades to all subsequent milestones. These are the milestones requiring the most risk attention.

### Step 5: Map Stakeholders -- Even for Solo Projects

Stakeholder mapping is not just for multi-person projects. Even solo projects have stakeholders: people who will use the output, people whose approval is needed, people whose lives are affected by the time you spend on this project.

- Define stakeholder roles using RACI lite: **Responsible** (does the work), **Accountable** (owns the outcome), **Consulted** (provides input or expertise), **Informed** (needs to know status or results). For a solo project, the user is both R and A; family members, managers, or clients may be C or I.
- For each stakeholder, identify their primary interest: what do they care about? What does a successful project mean to them specifically? A spouse might care about the time investment; a client might care about the delivery date; a collaborator might care about the quality of their contribution.
- Define what each stakeholder needs from the project: information, deliverables, approvals, or just a heads-up at completion
- Define communication method for each: not "email" but "weekly Slack message with current milestone status" or "one-line text when each milestone completes"
- Identify decision-makers explicitly: when there is a conflict, disagreement, or major scope change decision, who has authority? For solo projects, the user is the decision-maker, but this is worth stating -- it means the user is not waiting for permission

### Step 6: Build the Risk Register Using Likelihood × Impact Scoring

Risk identification should be systematic, not a brainstorm of fears. Use three lenses to surface risks:

- **Execution risks:** Can we do the work? Skills gaps, tool uncertainty, time underestimates, dependencies on external parties who may not deliver
- **Scope risks:** Will we know when we're done? Unclear requirements, shifting goals, perfectionism traps, third-party requirements changing mid-project
- **Motivation risks:** Will we keep going? Energy drain, competing priorities, loss of interest, collaborator dropping out, life events

Rate each risk on a 1-3 scale for both Likelihood and Impact. Multiply to get a Risk Score (1-9). Scores of 6-9 are high priority and require a concrete mitigation plan. Scores of 3-5 are monitor-and-respond. Scores of 1-2 are accepted risks.

- Mitigation strategies must be specific actions, not platitudes. Not "be careful" but "allocate the first 10 hours to the learning curve before touching project deliverables" or "confirm external API access in writing during week 1 before any integration work begins"
- Include a contingency for the top 2 risks: "if this risk materializes, we will..."
- Minimum 3 risks, maximum 8. Below 3 means you haven't thought hard enough; above 8 for a personal project indicates the project is too complex for this skill's scope.

### Step 7: Define a Concrete Communication and Accountability Plan

The communication plan for personal/small-team projects is really an accountability plan. The most common failure mode is not bad planning -- it is the absence of a system that creates a moment to notice when things are off track.

- **Solo projects:** Weekly review cadence is the minimum effective frequency. Define a specific day, time, and format: "Every Sunday evening, spend 10 minutes reviewing current milestone status, updating completion percentage, and noting any blockers." A weekly review takes less time than restarting a drifted project.
- **Collaborative projects:** Define synchronous check-in cadence (a standing meeting, video call, or shared document review). Weekly for projects under 8 weeks; biweekly for longer ones. Asynchronous updates (Slack, email, shared doc) should happen when a milestone completes, not on a fixed schedule.
- **Progress tracking tool:** Name the actual tool, not a category. Personal Kanban (Trello, Notion, a physical whiteboard), a shared Google Sheet milestone tracker, a GitHub Projects board, or a plain text journal -- all work. The key is that it matches the user's existing workflow so it doesn't create its own adoption barrier.
- **Decision log:** Any time a scope change, milestone adjustment, or significant pivot occurs, it must be written down with a date and rationale. One sentence is enough. This prevents "I thought we decided..." disputes and helps the user learn from the project afterward.
- **Escalation path:** For collaborative projects, define what happens when someone is blocked more than 24-48 hours: who do they tell, and how?

### Step 8: Write the Next Actions List and Assemble the Document

The kickoff document should end with exactly 3 concrete next actions. Not 5, not 10 -- 3. The purpose is to reduce the activation energy between "reading the plan" and "starting the project."

- Each next action must be completable within 24-48 hours and require no more than 1-2 hours of effort
- Each next action must be specific enough that the user does not need to make a decision to start it: "Spend 45 minutes reading the official Hugo quickstart tutorial" is correct; "research static site generators" is not
- The first next action should always be possible today -- no dependencies on other people, no waiting for deliveries, no blocking prerequisites
- After writing next actions, do a final consistency check: do the milestones trace back to the success criteria? Do the risks map to actual vulnerabilities in the scope? Is the total hours available (hours/week × weeks) plausible for the scope defined? Flag any inconsistency with a note rather than silently papering over it.

## Output Format

```markdown
## Project Kickoff: [Project Name]

### Project Overview
| Field | Value |
|-------|-------|
| Project Name | [name] |
| Description | [one-sentence deliverable-focused description] |
| Owner | [name or "User"] |
| Start Date | [date] |
| Target Completion | [specific date, calculated] |
| Total Duration | [X weeks] |
| Time Budget | [hours/week] × [weeks] = [total hours] |
| Collaborators | [names and roles, or "Solo"] |

---

### Scope Statement

**In Scope:**
- [Specific deliverable 1 -- tangible and checkable]
- [Specific deliverable 2]
- [Specific deliverable 3]
- [Specific deliverable 4]

**Out of Scope:**
- [Excluded item 1] -- [why excluded / what to do instead]
- [Excluded item 2] -- [why excluded]
- [Excluded item 3] -- [why excluded]

**Assumptions:**
- [Assumption 1 -- what is being treated as given without verification]
- [Assumption 2]

**Constraints:**
- [Hard constraint 1 -- budget, time, technology, external dependency]
- [Hard constraint 2]

---

### Success Criteria
| # | Criterion | How Measured | Minimum Threshold | Ideal Target | Type |
|---|-----------|--------------|-------------------|--------------|------|
| 1 | [criterion] | [measurement method] | [minimum acceptable] | [ideal] | Date |
| 2 | [criterion] | [measurement method] | [minimum acceptable] | [ideal] | Quality |
| 3 | [criterion] | [measurement method] | [minimum acceptable] | [ideal] | Quantity |
| 4 | [criterion] | [measurement method] | [minimum acceptable] | [ideal] | Functional |

---

### Milestone Plan

**Total project duration:** [X weeks] | **Milestones:** [N] | **Average milestone spacing:** [X days]

| # | Milestone | What Is True When Complete | Target Date | Completion Criteria | Dependencies | Critical Path? |
|---|-----------|---------------------------|-------------|-------------------|-------------|----------------|
| M1 | [name] | [observable state] | [specific date] | [binary check] | None | Yes/No |
| M2 | [name] | [observable state] | [specific date] | [binary check] | M1 | Yes/No |
| M3 | [name] | [observable state] | [specific date] | [binary check] | M2 | Yes/No |
| M4 | [name] | [observable state] | [specific date] | [binary check] | M3 | Yes/No |
| M5 | [name] *(Project Complete)* | [final deliverable exists] | [specific date] | [binary check] | M4 | Yes |

---

### Stakeholder Map

| Name | RACI Role | Primary Interest | Needs from Project | Communication Method | Frequency |
|------|-----------|-----------------|-------------------|---------------------|-----------|
| [name] | Responsible + Accountable | [what they care about] | [deliverables/information] | [specific tool/method] | [cadence] |
| [name] | Consulted | [what they care about] | [input needed] | [specific tool/method] | [cadence] |
| [name] | Informed | [what they care about] | [status or final result] | [specific tool/method] | [milestone completion] |

**Decision Authority:** [who has final say on scope changes and milestone extensions]

---

### Risk Register

| # | Risk | Category | Likelihood (1-3) | Impact (1-3) | Score | Priority | Mitigation | Contingency |
|---|------|----------|------------------|--------------|-------|----------|------------|-------------|
| R1 | [risk description] | Execution | [1-3] | [1-3] | [L×I] | High/Med/Low | [specific action] | [if it happens...] |
| R2 | [risk description] | Scope | [1-3] | [1-3] | [L×I] | High/Med/Low | [specific action] | [if it happens...] |
| R3 | [risk description] | Motivation | [1-3] | [1-3] | [L×I] | High/Med/Low | [specific action] | [if it happens...] |

**Highest priority risk:** R[N] -- [name]. Owner: [user/collaborator]. Review at: [milestone].

---

### Communication and Accountability Plan

**Progress Tracking Tool:** [specific tool -- Notion board, GitHub Projects, physical Kanban, shared Google Sheet]

**Review Cadence:**
- Weekly self-review: [specific day + time] -- 10-minute format: milestone status, blockers, next week plan
- Milestone review: at each milestone completion -- verify completion criteria met before advancing
- Plan review: at midpoint ([specific date]) -- reassess timeline and scope against actuals

**Stakeholder Updates:**
- [Stakeholder name]: [method] at [frequency or trigger event]
- [Stakeholder name]: [method] at [frequency or trigger event]

**Decision Log:** Maintained in [location -- e.g., project notes in Notion, bottom of this document, README]. Log format: [Date] | [Decision] | [Rationale] | [Who decided]

**Escalation:** If blocked for more than [24/48] hours, [action -- notify collaborator via Slack, note in decision log, consult external expert]

---

### Feasibility Check

| Check | Status | Note |
|-------|--------|------|
| Total hours available: [hours/week × weeks] = [total] | [Sufficient / Tight / Insufficient] | [note] |
| Milestone spacing averages [X days] | [Appropriate / Too sparse / Too dense] | [note] |
| All success criteria traceable to scope | [Yes / Gaps noted] | [note] |
| Highest risk (score [N]) has mitigation plan | [Yes / Needs work] | [note] |

---

### ⚡ Next Actions (Do These First)

1. **[Action 1 -- completable today, under 2 hours]**
   - Why first: [reason this unblocks everything else]
   - Time: ~[X minutes]

2. **[Action 2 -- completable within 48 hours]**
   - Why second: [reason]
   - Time: ~[X minutes]

3. **[Action 3 -- completable within 48 hours]**
   - Why third: [reason]
   - Time: ~[X minutes]

---
*Kickoff completed: [date]. Next plan review: [midpoint date]. Project completion target: [end date].*
```

## Rules

1. **Never produce a generic kickoff document.** Every section must contain information specific to the user's actual project. A kickoff document that could describe any project has failed its purpose. If you lack enough information, ask before writing -- do not fill sections with placeholders.

2. **Scope statement out-of-scope items are mandatory.** The in-scope list describes the project; the out-of-scope list protects it. For every project, there are at least 3 plausible things a reasonable person might assume are included that are not. Find those things and exclude them explicitly. This is the single highest-leverage section for preventing project failure.

3. **Milestones must use calendar dates, not relative references.** "Week 3" is not a date. Calculate the actual date from the project start date and write "Tuesday, March 11" or "March 11." Relative dates expire the moment you read the document two weeks later.

4. **Apply the M0 rule without exception.** The first milestone must be achievable within 7-10 days. If the user's initial milestone is set at week 4, decompose it. Early milestones serve two functions: momentum generation and plan validation. A plan that is wrong reveals itself at week 1 instead of week 4.

5. **Success criteria must be falsifiable.** Each criterion must be something that a person who did not work on the project could evaluate as pass/fail using only observable evidence. "The website looks professional" fails this test. "The website passes Lighthouse performance score ≥ 80 on mobile" passes it. If a criterion cannot be verified by someone other than the author, rewrite it.

6. **Risk scoring must be multiplicative, not categorical.** Likelihood × Impact on a 1-3 scale produces scores from 1-9. Do not accept risks rated as simply "High" or "Low" without the underlying scores. A risk that is likelihood 1 × impact 3 (score 3) has the same label as likelihood 3 × impact 1 (score 3) but very different management implications -- the first is a tail-risk requiring a contingency plan; the second is a routine nuisance.

7. **The feasibility check is not optional.** After assembling the document, calculate total available hours (time/week × weeks) and compare to total scope. If the project requires an estimated 60 hours but the user has 30 hours available, the plan is infeasible and must say so explicitly. Do not silently produce an infeasible plan. Flag it and suggest either scope reduction or timeline extension.

8. **Communication plans must name the specific tool.** "Track progress somehow" is not a plan. "Maintain a Trello board with one card per milestone, moving cards to Done when completion criteria are met, and doing a 10-minute review every Sunday evening" is a plan. The tool should match the user's existing workflow -- if they live in Notion, use Notion; if they prefer paper, use a physical wall card system.

9. **Do not include budget sections unless the user has stated a budget.** Adding a $0 budget line when the user said "no budget" is noise. Add a note: "Budget tracking not included -- if this project acquires costs, use `project-budget-tracker` to add a budget section." This keeps the document proportional.

10. **Three next actions, not a task list.** The next actions section exists to reduce activation energy. It must contain exactly 3 actions, each doable within 24-48 hours with zero blocking dependencies. If you find yourself writing 8 next actions, you are writing a task list -- stop and reduce to the 3 that most unblock the rest. The first action must be startable immediately, today, with no setup required.

## Edge Cases

**The user has only a vague concept, not a project.**
If the user says something like "I want to learn to paint" or "I want to get healthier," that is not a project -- it is a goal. Before generating a kickoff, apply the Goal-to-Project conversion: identify a specific, bounded deliverable that would demonstrate progress toward the goal. "Complete a 30-day beginner watercolor course and produce 8 finished paintings" is a project. "Learn to paint" is not. Run the elicitation questions with this framing and present the converted project description back to the user for confirmation before proceeding.

**The user has dramatically underestimated the scope.**
This is the most common failure pattern. A user says "I'll build a mobile app in 4 weeks, 5 hours a week." A minimum viable mobile app (one screen, one feature, deployed) requires roughly 40-80 hours for an experienced developer, more for a learner. When the math does not work, do not silently accept it. Add a Feasibility Check section and flag: "Your available hours (20) appear insufficient for the scope described (estimated 50-80 hours based on typical project complexity). Options: (1) reduce scope to a proof-of-concept, (2) extend timeline to 10-16 weeks, (3) increase time investment to 15 hours/week." Give the user real options, not a plan that is pre-loaded to fail.

**The user is restarting an abandoned project.**
This requires a modified kickoff process. First, conduct an honest post-mortem on why the project was abandoned: scope too large, motivation collapsed, a specific technical blocker, life events, or undefined "done" criteria. Then build the new kickoff addressing that root cause specifically. If scope was the issue, cut it by 30-40%. If motivation was the issue, add a "why this matters" statement and a shorter initial milestone. Mark the restart date explicitly. Reusing the old plan without modification almost always produces the same abandonment outcome.

**The project has a hard external deadline (not user-controlled).**
When the deadline is fixed by an external party -- a conference submission date, a product launch tied to an event, a client delivery date -- the planning direction reverses. Instead of "start today, finish in X weeks," the process is backward-planning: start from the deadline, subtract the critical path milestone durations, and find the real start date. If the real start date is in the past, the project is already behind and the user must immediately choose scope reduction or additional resource allocation. State this plainly: "To meet [deadline] with the current scope, work should have started [date]. Available options are..."

**One collaborator is significantly less committed than the others.**
In small-team projects, one uncommitted collaborator can block an entire project because the team is too small to route around the dependency. If the user describes a collaborator whose involvement is uncertain, optional, or historically unreliable, do two things: (1) identify every milestone that depends on that collaborator's contribution and mark those milestones as high-risk, and (2) write the scope statement so that the minimum viable project is achievable without that collaborator. The uncertain collaborator's contributions become scope extensions or "nice to have" milestones, not critical path items.

**The user's project is actually three projects masquerading as one.**
Some users describe what is really a sequence of related projects as a single project. Signs: the scope list has more than 10 items, there are multiple separate "audiences" or "deliverables" that could stand alone, or the timeline exceeds 6 months. When this occurs, do not produce a single massive kickoff. Instead, decompose the mega-project into 2-3 sequenced projects, produce a kickoff for the first one, and note: "Projects 2 and 3 should be kicked off after Project 1 completes -- information learned in Project 1 will change how they are planned." This approach dramatically improves completion rates because it produces an early win.

**The user keeps changing requirements during the elicitation phase.**
If a user revises their description of the project multiple times before the kickoff is produced -- changing the deliverable, the audience, the timeline, or the success criteria -- this is a signal that they have not yet committed to a project direction. Producing a kickoff document in this state wastes both parties' time because the user will revise it immediately. Apply a "parking lot" technique: note the alternative ideas the user mentioned, write the kickoff for the most recently stated version, and add a section at the bottom titled "Deferred Ideas" listing the alternatives. This validates the user's thinking while anchoring the project to a single executable version.

**The project has a meaningful budget (even a small one).**
If the user mentions any budget -- $50 for tooling, $200 for materials, $1,000 for freelance help -- add a Budget Snapshot to the Project Overview section: total budget, major spending categories with estimated amounts, and a note to use `project-budget-tracker` for detailed tracking. Do not build a full budget here, but do not ignore money entirely. Even a $50 tool purchase decision should be noted in the scope and reflected in constraints.

## Example

**Input:** "I want to create a self-published cookbook of family recipes. My grandmother has about 40 recipes written on index cards and I want to turn them into a real printed book -- not for sale, just to give to family members at Christmas. I'm thinking about 20-25 copies. I have about 6 hours a week and want to be done by December 15. It's currently late September."

---

## Project Kickoff: Family Heirloom Cookbook

### Project Overview
| Field | Value |
|-------|-------|
| Project Name | Family Heirloom Cookbook |
| Description | Transform 40 handwritten family recipes into a professionally formatted, print-on-demand softcover cookbook and distribute 20-25 copies to family members at Christmas |
| Owner | User |
| Start Date | September 25 |
| Target Completion | December 15 (11 weeks) |
| Total Duration | 11 weeks |
| Time Budget | 6 hours/week × 11 weeks = 66 hours total |
| Collaborators | Solo (grandmother as recipe source -- Consulted) |

---

### Scope Statement

**In Scope:**
- Transcribe and standardize all 40 grandmother's recipes into a consistent written format (ingredient list + instructions + yield)
- Write brief introductory headnotes (2-4 sentences) for each recipe connecting it to family history or occasion
- Design the cookbook layout using a self-publishing or word-processing tool -- one consistent template throughout
- Source or photograph at least 10-12 food photos to illustrate key recipes
- Produce a print-ready PDF file meeting the specifications of a print-on-demand service
- Order 22 copies (20 for family + 2 buffer) from a print-on-demand service with delivery by December 10
- Write front matter: dedication page, brief family history introduction (1-2 pages), and table of contents organized by category (appetizers, mains, desserts, holiday)

**Out of Scope:**
- Publishing for commercial sale or distribution outside immediate family -- this is a gift item, not a product
- Original recipe development or modification -- recipes are transcribed as-is, with only format standardization
- Professional food photography -- phone photography with natural light is sufficient; stock photos are an acceptable alternative
- Nutritional analysis or allergen labeling -- this is a family cookbook, not a commercial food product
- eBook or digital distribution -- print only; a digital version could be a Phase 2 project after Christmas
- Translation into other languages

**Assumptions:**
- [ASSUMPTION] Grandmother's 40 index card recipes are legible and complete (no missing ingredients or instructions)
- [ASSUMPTION] A print-on-demand service (Lulu, Blurb, or Mixam) can deliver 22 softcover copies within 10-14 business days at acceptable quality and cost
- User has a smartphone capable of taking food photos adequate for print quality (12MP or higher)
- Recipes are all in English

**Constraints:**
- Hard deadline: copies must arrive by December 10 to allow for gift wrapping and any reprint if quality is unsatisfactory
- Budget: not stated by user -- [FLAG: confirm budget range before ordering printing; typical 22-copy softcover cookbooks run $150-$350 depending on page count and service]
- No prior book design experience assumed -- tool must be beginner-accessible

---

### Success Criteria
| # | Criterion | How Measured | Minimum Threshold | Ideal Target | Type |
|---|-----------|--------------|-------------------|--------------|------|
| 1 | All recipes transcribed and formatted | Count of formatted recipes in final document | All 40 recipes present | All 40 with headnotes | Quantity |
| 2 | Print order delivered by deadline | Delivery confirmation date | December 10 | December 7 (buffer for defects) | Date |
| 3 | Print quality acceptable | Visual review of one proof copy before bulk order | Text legible, photos not pixelated, binding intact | Professional-looking enough to be a cherished gift | Quality |
| 4 | Copies available for distribution | Count of copies in hand | 20 copies | 22 copies (20 + 2 buffer) | Quantity |
| 5 | Family recipes preserved in organized format | Book includes table of contents with categories | Recipes findable by category | Recipes also indexed by key ingredient or occasion | Functional |

---

### Milestone Plan

**Total project duration:** 11 weeks | **Milestones:** 6 | **Average milestone spacing:** 12 days

| # | Milestone | What Is True When Complete | Target Date | Completion Criteria | Dependencies | Critical Path? |
|---|-----------|---------------------------|-------------|-------------------|-------------|----------------|
| M1 | Recipe Audit Complete | All 40 index cards reviewed, gaps identified, grandmother consulted on any unclear cards | October 5 | Spreadsheet lists all 40 recipes with status (clear / needs clarification) and assigned categories | None | Yes |
| M2 | All Recipes Transcribed | All 40 recipes typed into working document in standard format | October 20 | 40 recipes in document, each with ingredient list, instructions, and yield; headnotes drafted for at least 20 | M1 | Yes |
| M3 | Photos Sourced | At least 10 photos selected or taken for key recipes | November 3 | 10-12 photos at print resolution (min 300dpi or 2000px on short edge) in a project folder | M2 (partial) | No |
| M4 | Layout Complete | Full cookbook designed in chosen tool, export-ready | November 17 | PDF exported, all 40 recipes formatted consistently, photos placed, front matter written | M2, M3 | Yes |
| M5 | Proof Ordered and Approved | One proof copy ordered, received, reviewed, and approved | December 1 | Proof physically in hand; visual review passed; any corrections applied to master file | M4 | Yes |
| M6 | Bulk Order Delivered *(Project Complete)* | 22 copies in hand, ready for gift distribution | December 10 | Delivery confirmation received; spot-check of 3 copies for quality | M5 | Yes |

**⚠ Critical path note:** M1 → M2 → M4 → M5 → M6 is the critical path. A delay at any of these milestones delays delivery. M3 (photography) has slack -- photos can be sourced in parallel with transcription. Begin photo collection at M1, not M3.

---

### Stakeholder Map

| Name | RACI Role | Primary Interest | Needs from Project | Communication Method | Frequency |
|------|-----------|-----------------|-------------------|---------------------|-----------|
| User | Responsible + Accountable | Preserving grandmother's recipes; creating a meaningful Christmas gift | Completed book in hand by December 10 | Self-tracking via weekly review | Weekly |
| Grandmother | Consulted | Recipes preserved accurately; family history honored | Be consulted on unclear recipes; see a copy of the finished book | Phone call or in-person visit | Once at M1, one at project completion |
| Family members (recipients) | Informed | Receiving a meaningful gift | No pre-announcement needed; surprise gift | N/A -- notified at Christmas delivery | Once |
| Print-on-demand service | External dependency | Order fulfillment | Print-ready PDF meeting their spec; payment | Order portal | At M4 (proof) and M5 (bulk order) |

**Decision Authority:** User has sole authority on all creative and scope decisions. Grandmother is consulted for recipe accuracy but is not a decision-maker on design or content selection.

---

### Risk Register

| # | Risk | Category | Likelihood (1-3) | Impact (1-3) | Score | Priority | Mitigation | Contingency |
|---|------|----------|------------------|--------------|-------|----------|------------|-------------|
| R1 | Printing service lead time longer than expected during holiday season | Execution | 3 | 3 | 9 | **HIGH** | Order proof by November 17 (not December 1); select a service with guaranteed lead times; check current holiday lead time estimates before finalizing timeline | If proof delayed past November 25, skip proof and order bulk directly with careful self-review of PDF; order from a second service in parallel |
| R2 | Recipe transcription takes longer than estimated (40 recipes × ~20 min each = ~13 hours) | Execution | 2 | 2 | 4 | Medium | Block 2 dedicated sessions per week for transcription starting week 1; do not wait until M2 deadline; batch by category | Reduce scope to the 25-30 most important/iconic recipes and note remaining 10-15 as "coming in next edition" |
| R3 | Book design tool has steep learning curve, causing layout delays | Execution | 2 | 2 | 4 | Medium | Select tool by end of week 1; use a pre-built cookbook template if available; limit customization in first version | Switch to a simpler tool (Google Docs with a clean template exported as PDF) -- less polished but fully functional |
| R4 | Photo quality insufficient for print | Scope | 2 | 1 | 2 | Low | Shoot photos with natural window light; use food staging basics (neutral plate, simple background); test-print one photo at a local print shop before bulk order | Replace with high-quality stock food photography from a free source; clearly selected for visual similarity to the dish |
| R5 | Motivation dip in weeks 5-7 (middle of project -- highest dropout risk) | Motivation | 2 | 3 | 6 | **HIGH** | Schedule the most enjoyable task (writing headnotes / family stories) during weeks 5-7; set a mid-project "preview" moment -- show the partial book to one family member to reinvigorate motivation | If blocked: set a "minimum viable cookbook" target of 20 recipes, formatted and printed; the project succeeds at that threshold |

**Highest priority risk:** R1 (score 9) -- holiday printing delays. Resolution: compress proof milestone to November 17, not December 1. Review current service lead times by October 10 (end of week 2).

---

### Communication and Accountability Plan

**Progress Tracking Tool:** A simple Google Sheet with one row per recipe (columns: Recipe Name, Category, Transcribed?, Headnote Written?, Photo Assigned?) serving as a visual progress tracker. Milestone status tracked in a second tab.

**Review Cadence:**
- Weekly self-review: Every Sunday evening, 10 minutes -- check recipe transcription count, update milestone completion percentage, note any blockers or questions for grandmother
- Milestone review: At each milestone completion, verify all completion criteria against the table above before marking done and advancing
- Plan review: November 1 (midpoint, week 5) -- compare actual progress to planned progress; assess whether December 10 deadline is still achievable; adjust scope if necessary

**Stakeholder Updates:**
- Grandmother: Phone call during week 1 to review unclear index cards; call or visit at project completion to present her copy before Christmas distribution
- Family members: No updates until Christmas delivery -- this is a surprise gift

**Decision Log:** Maintained in a note at the bottom of the Google Sheet. Format: [Date] | [Decision] | [Rationale]. Key decisions to log: which print-on-demand service was selected and why, which recipes were prioritized if scope reduction was needed, any design template choices made.

**Escalation:** If blocked on any single task for more than 48 hours (e.g., cannot reach grandmother, print service website is unclear), log the block and skip to the next available task. Do not let a single blocker stall all progress.

---

### Feasibility Check

| Check | Status | Note |
|-------|--------|------|
| Total hours available: 6/week × 11 weeks = 66 hours | **Sufficient** | Recipe transcription (~13 hrs) + layout (~15 hrs) + photos (~5 hrs) + front matter (~5 hrs) + admin/ordering (~5 hrs) ≈ 43 hrs; 23 hours of buffer for learning curves and revisions |
| Milestone spacing averages 12 days | **Appropriate** | Weekly review will catch drift; spacing matches task complexity |
| All success criteria traceable to scope | **Yes** | All 5 criteria map to in-scope deliverables |
| Highest risk (R1, score 9) has mitigation plan | **Yes** | Proof milestone moved to November 17; service lead times to be verified by October 10 |
| Budget not stated | **⚠ Flag** | Confirm budget range before M4; typical 22-copy softcover cookbooks cost $150-$350; this should be verified within the first 2 weeks |

---

### ⚡ Next Actions (Do These First)

1. **Photograph all 40 recipe index cards and create a recipe inventory spreadsheet (Google Sheets)**
   - Why first: this surfaces any illegible, incomplete, or duplicate recipes before any design or formatting work begins -- the earlier you find a gap, the more time you have to fill it
   - Time: ~90 minutes (30 min photographing, 60 min entering into spreadsheet with columns: Recipe Name, Category, Status, Notes)

2. **Research and select a print-on-demand service; check current holiday lead times**
   - Why second: the printing service's specifications (trim size, bleed requirements, file format, minimum resolution) must be known before designing the layout -- designing to the wrong spec is a costly mistake
   - Candidates to evaluate: Lulu (good cookbook templates, ships internationally), Blurb (strong photo book quality), Mixam (competitive pricing for short runs). Review current holiday lead time on each site.
   - Time: ~60 minutes

3. **Select and set up the layout tool; download a cookbook template if available**
   - Why third: choosing the tool and getting a working template in place means recipe transcription can flow directly into the final layout format -- avoids double-work of writing in one place and reformatting later
   - Tool options by experience level: Canva (beginner, cookbook templates available, exports print-quality PDF), Adobe InDesign (professional, steeper learning curve), Microsoft Word / Google Docs (simple, familiar, limited design control). Select the tool that matches your comfort level.
   - Time: ~60 minutes setup + 30-minute test with one recipe

---
*Kickoff completed: September 25. Next plan review: November 1 (midpoint check). Print order deadline: November 17 (proof). Project completion target: December 10.*
