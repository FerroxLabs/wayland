---
name: skill-gap-analysis
description: |
  Creates competency-based skill gap analyses with current level, target level, gap identification, resources, and timeline for professionals planning their development. Produces a skills matrix with actionable development plan.
  Use when a professional asks to identify skill gaps, assess their competencies, plan professional development, or determine what skills to build next.
  Do NOT use for student learning objectives (use `learning-objectives`), for career change planning (use career-development skills), or for certification-specific preparation (use `certification-prep`).
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
# Skill Gap Analysis

## When to Use

Use this skill when a professional asks to assess their current competencies against a target role, project, or career milestone and needs an actionable development plan.

**Trigger scenarios:**
- A professional says "I want to move into a data engineering role -- what skills do I need to build?" and has an existing technical background to assess
- A manager needs to prepare for a promotion to senior director and wants to know what leadership competencies they are missing
- A team lead is assigned to a new technology stack (e.g., moving from on-premise infrastructure to cloud-native architecture) and needs to understand their readiness gaps
- A mid-career professional is told in a performance review that they "need to develop strategic thinking" and wants a concrete plan
- A consultant or freelancer wants to expand their service offerings into a new domain and needs to assess readiness before pitching clients

**Do NOT use when:**
- The user is a student mapping learning objectives to a course or curriculum -- use `learning-objectives` instead
- The user wants to change careers entirely and needs to evaluate multiple role options -- use career development planning skills, which address role fit scoring and labor market alignment
- The user is preparing for a specific certification exam (e.g., PMP, AWS Solutions Architect) -- use `certification-prep`, which structures study around exam blueprints and item domains
- The user is an HR professional designing a competency framework for their organization -- that is organizational design work, not individual professional development
- The user is a new graduate with fewer than 6 months of professional experience and no clear target role -- the analysis requires a baseline of real workplace experience to assess meaningfully; redirect to foundational career exploration first
- The request is about soft-skill coaching or behavioral change (e.g., "help me be less introverted") without a professional performance anchor -- this falls into coaching, not structured gap analysis
- The user has already completed a formal gap analysis and wants help executing the development plan -- direct them to project-planning or learning-design skills

---

## Process

### Step 1: Gather Context Through Structured Intake

Before building any matrix, collect the five inputs that define the scope of the analysis. If any are missing, ask targeted questions -- do not assume.

- **Current role and industry:** Job title, organization type, and years of experience in this role. This anchors the baseline.
- **Target state:** Is this a role promotion, a lateral move into a new function, a project-specific readiness check, or a specialization within their current role? Precision here determines which competency domains to evaluate.
- **Timeline to target:** Is this a 6-month sprint or a 3-year trajectory? This governs priority weighting and learning intensity recommendations.
- **Known strengths and weaknesses:** Ask the user what they believe they do well and where they feel underprepared. Self-perception data is imperfect but speeds up the analysis and surfaces blind spots when it conflicts with the evidence.
- **Constraints:** Weekly hours available for development (a realistic number -- most working professionals have 3--7 hours per week), budget, access to formal training, and whether they have a manager or mentor who can provide feedback.

### Step 2: Define the Competency Domain Map

Map the target role or goal to a set of competency domains. Do not create a single undifferentiated list of skills -- group them into domains so priorities can be set at two levels.

- Identify 4--6 competency domains relevant to the target. Common domain clusters: **Technical/Functional Skills**, **Leadership and People Skills**, **Business Acumen**, **Communication and Influence**, **Process and Execution**, **Domain Knowledge**.
- For each domain, identify 3--6 specific competencies. Aim for 15--25 total competencies. Fewer than 12 lacks diagnostic resolution; more than 30 becomes unmanageable without organizational HR tooling.
- Source competency definitions from job postings for the target role (extract the 8--12 skills that appear in more than 60% of postings), published competency frameworks (e.g., SHRM competency model for HR professionals, PMI Talent Triangle for project managers, SFIA framework for technology roles), or industry association standards.
- Write each competency as an observable behavior, not a vague trait. "Facilitates cross-functional alignment meetings with stakeholders at the VP level" is assessable. "Good communicator" is not.

### Step 3: Assess Current Level Using the 5-Point Behavioral Anchoring Scale

Rate each competency on a 5-point scale with specific behavioral anchors -- not just numeric labels. This is the most important step for validity.

- **Level 1 -- No exposure:** Has not performed this skill in a professional context. Cannot complete even basic tasks without instruction.
- **Level 2 -- Foundational awareness:** Has theoretical knowledge or has observed others do this. Can attempt tasks with close supervision or detailed guidance. Makes frequent errors.
- **Level 3 -- Independent practitioner:** Can perform this skill reliably in routine situations without supervision. Handles standard complexity. Produces acceptable-quality outputs.
- **Level 4 -- Advanced practitioner:** Handles complex, ambiguous, or high-stakes situations. Adapts approach to context. Can coach others and troubleshoot non-standard problems.
- **Level 5 -- Expert/thought leader:** Innovates within the domain. Sets standards, designs systems, or develops others' capability at scale. Recognized by peers as a go-to resource.
- Instruct the user to rate based on evidence, not confidence. The test is: "Can I describe a specific situation in the last 18 months where I demonstrated this skill at this level?" If they cannot cite an example, the level is likely overstated by 1 point.
- For higher-stakes analyses, build in a 360-calibration check: ask the user whether any colleague, manager, or mentor would rate them differently, and note the discrepancy explicitly rather than averaging it away.

### Step 4: Define Target Levels and Calculate Priority Gaps

Target levels are not always Level 5. Establish the minimum proficiency threshold required for the target state.

- For most individual contributor-to-manager transitions, the threshold shift is from Level 3 to Level 4 in functional skills and from Level 1--2 to Level 3 in people leadership.
- For lateral specialization moves, the technical skill threshold typically jumps 2 levels while existing domain knowledge transfers at full credit.
- Calculate **Gap Score** = Target Level minus Current Level. A negative gap means overqualification in that area (note it, but deprioritize).
- Calculate **Priority Weight** using a two-factor matrix:
  - **Criticality to target role:** High (this skill is required on Day 1), Medium (needed within 90 days), Low (useful but not gating)
  - **Gap size:** Large (gap of 3+), Moderate (gap of 2), Small (gap of 1)
- Assign priority tiers: **CRITICAL** = Large gap + High criticality. **HIGH** = Moderate gap + High criticality OR Large gap + Medium criticality. **MEDIUM** = Small gap + High criticality OR Moderate gap + Medium criticality. **LOW** = anything involving Low criticality or gap of 0.
- Never allow more than 3 CRITICAL items -- if the analysis yields more, re-examine whether the timeline is realistic or whether the target role definition needs adjustment.

### Step 5: Build the Development Plan With Learning Modality Matching

For each HIGH or CRITICAL gap, assign a specific intervention using the 70-20-10 learning model as the allocation framework.

- **70% -- Experiential learning:** Stretch assignments, project work, job shadowing, taking on a role responsibility before the formal promotion, leading a working group, volunteering for cross-functional projects. This is the highest-impact modality and the most underused.
- **20% -- Social/relational learning:** Mentorship from someone already in the target role, peer learning cohorts, communities of practice, structured feedback loops with a manager, book clubs with reflection discussion.
- **10% -- Formal/structured learning:** Online courses (self-paced or cohort-based), workshops, conferences, certifications, books. This modality is overweighted by most self-directed learners because it feels productive but has the lowest transfer rate without experiential reinforcement.
- For each competency gap, specify: the intervention type, the specific resource or opportunity, the estimated time investment per week, and the measurable outcome that signals progression to the next level.
- Time-box interventions. A CRITICAL gap addressed through a combination of 70-20-10 learning should show measurable progress within 60--90 days. If a gap is not moving after 90 days, the resource or approach needs to change, not the timeline.

### Step 6: Sequence and Phase the Development Plan

Professionals cannot develop all gaps simultaneously. Create a phased roadmap with realistic cognitive load.

- **Phase 1 (Months 1--3):** Address all CRITICAL gaps. Limit active development to 2--3 competencies maximum at once. Focus on the 70% experiential interventions because they produce the fastest real-world skill transfer.
- **Phase 2 (Months 4--6):** CRITICAL gaps should be at or near target. Begin HIGH-priority gaps. Reassess Phase 1 competencies -- advancement is rarely linear. Adjust ratings based on new evidence.
- **Phase 3 (Months 7--12):** Continue HIGH gaps. Begin selected MEDIUM gaps that have strategic value. Schedule a formal mid-point review of the entire matrix at Month 6.
- Build in a quarterly review trigger: every 90 days, re-rate all competencies, update the matrix, and recalculate gaps. Skills atrophy without use and accelerate with practice -- the matrix is a living document.
- Flag interdependencies: some skills must be developed before others unlock. For example, "facilitating executive-level presentations" cannot meaningfully advance before "structuring persuasive business narratives" reaches Level 3.

### Step 7: Define Success Metrics and Accountability Mechanisms

A development plan without observable success criteria is a wish list, not a plan.

- For each competency, define a **behavioral milestone**: a specific, observable demonstration that the professional has moved from their current level to the next. Frame it as "I will know I have reached Level X when I have successfully [observable action] in [context]."
- Identify a **validator**: who will confirm the milestone has been reached? Options include a manager, a mentor, a peer, output quality (e.g., a project deliverable reviewed against a rubric), or an external assessment (a portfolio review, a certification exam score, a 360 feedback score).
- Set a **review cadence**: monthly check-ins on activity completion, quarterly recalibration of competency ratings, and a formal milestone review at the end of each phase.
- Include a risk flag: if two consecutive monthly check-ins show no activity on a CRITICAL or HIGH priority gap, surface this explicitly and diagnose whether the barrier is time, motivation, resource access, or goal misalignment.

### Step 8: Deliver the Output and Frame the Conversation

Present the skills matrix and development plan together as an integrated artifact, not as two separate documents.

- Walk the user through the priority logic so they understand why certain gaps are ranked above others. They should be able to defend the prioritization to a manager or coach.
- Highlight any gaps where the self-assessment seems inconsistent (e.g., they rate themselves Level 4 in "stakeholder management" but have never led a project without a senior sponsor) and name it explicitly as a calibration risk.
- Identify the highest-leverage single action they can take in the next 7 days. This breaks inertia and creates commitment.
- Note any gaps that fall outside the 12-month horizon so the professional knows they are not forgotten -- just deferred.

---

## Output Format

```
## Skill Gap Analysis: [Name or Role]
**Date:** [Date]
**Current Role:** [Title, Industry, Years in Role]
**Target State:** [Specific role, project, or milestone]
**Timeline:** [Target date or duration]
**Development Hours Available:** [Hours per week]

---

### Competency Domain Map

| Domain | # of Competencies |
|--------|-------------------|
| [Domain 1] | [N] |
| [Domain 2] | [N] |
| [Domain 3] | [N] |
| [Domain 4] | [N] |
**Total competencies assessed:** [N]

---

### Skills Matrix

**Rating Scale:**
- 1 = No exposure
- 2 = Foundational awareness (needs close guidance)
- 3 = Independent practitioner (routine situations)
- 4 = Advanced practitioner (complex situations, can coach others)
- 5 = Expert/thought leader (innovates, sets standards)

| Domain | Competency | Current Level | Target Level | Gap | Criticality | Priority |
|--------|------------|:-------------:|:------------:|:---:|:-----------:|:--------:|
| [Domain] | [Competency as observable behavior] | [1-5] | [1-5] | [+/-N] | High/Med/Low | CRITICAL/HIGH/MED/LOW |
| [Domain] | [Competency] | [1-5] | [1-5] | [+/-N] | High/Med/Low | CRITICAL/HIGH/MED/LOW |
| ... | ... | ... | ... | ... | ... | ... |

**Priority Summary:**
- CRITICAL: [N competencies]
- HIGH: [N competencies]
- MEDIUM: [N competencies]
- LOW or Overqualified: [N competencies]

---

### Calibration Notes
- [Any competency where self-rating may be overstated and why]
- [Any competency where 360 input would significantly improve accuracy]
- [Any competency where current level may be understated due to recency bias]

---

### Development Plan

#### Phase 1: Months 1--3 -- Critical Gap Resolution
*Active development focus: [2-3 specific competencies]*

| Competency | Gap | Intervention Type | Specific Resource or Action | Hours/Week | Success Milestone | Validator |
|------------|:---:|:-----------------:|----------------------------|:----------:|-------------------|-----------|
| [Competency] | [N] | Experiential (70%) | [Specific stretch assignment or project] | [N] | [Observable behavior at next level] | [Person or evidence] |
| [Competency] | [N] | Social (20%) | [Specific mentor, peer, or feedback mechanism] | [N] | [Observable behavior] | [Validator] |
| [Competency] | [N] | Formal (10%) | [Specific course, book, or workshop] | [N] | [Completion + application] | [Output artifact] |

#### Phase 2: Months 4--6 -- High Priority Development
*Active development focus: [2-3 specific competencies]*

| Competency | Gap | Intervention Type | Specific Resource or Action | Hours/Week | Success Milestone | Validator |
|------------|:---:|:-----------------:|----------------------------|:----------:|-------------------|-----------|
| ... | ... | ... | ... | ... | ... | ... |

#### Phase 3: Months 7--12 -- Sustained Development
*Active development focus: [competencies continuing from Phase 2 + selected MEDIUM items]*

| Competency | Gap | Intervention Type | Specific Resource or Action | Hours/Week | Success Milestone | Validator |
|------------|:---:|:-----------------:|----------------------------|:----------:|-------------------|-----------|
| ... | ... | ... | ... | ... | ... | ... |

---

### Skill Interdependency Map
*Skills that must reach minimum proficiency before others can meaningfully develop:*

- [Prerequisite skill] (Level [N]) → unlocks → [Dependent skill]
- [Prerequisite skill] (Level [N]) → unlocks → [Dependent skill]

---

### Weekly Investment Summary

| Phase | Total Hours/Week | CRITICAL Competencies | HIGH Competencies | MEDIUM Competencies |
|-------|:----------------:|:---------------------:|:-----------------:|:-------------------:|
| Phase 1 (Months 1-3) | [N] | [N active] | 0 | 0 |
| Phase 2 (Months 4-6) | [N] | [Wrap-up] | [N active] | 0 |
| Phase 3 (Months 7-12) | [N] | [Complete] | [Wrap-up] | [N active] |

---

### Immediate Next Action (Next 7 Days)
**Action:** [Single most impactful action the professional can take this week]
**Why this first:** [Rationale -- how it unlocks Phase 1 momentum]
**Done looks like:** [What completing this action produces]

---

### Quarterly Review Schedule
- **Month 3:** Re-rate Phase 1 competencies. Confirm Phase 2 resources are secured.
- **Month 6:** Full matrix recalibration. Adjust Phase 3 plan based on actual progress.
- **Month 9:** Assess readiness for target state. Begin transition planning if on track.
- **Month 12:** Final review. If target not yet reached, diagnose and replan.

---

### Deferred Development (Beyond 12-Month Horizon)
*These gaps exist but are not gating the target state within the current timeline:*
- [Competency]: Current Level [N], will be revisited at [Month/Trigger]
```

---

## Rules

1. **Never begin building the matrix without all five intake inputs.** Role, target state, timeline, constraints, and self-assessed strengths/weaknesses must all be present. If any are missing, ask before proceeding -- assumptions here corrupt the entire output.

2. **Keep the total competency count between 15 and 25.** Fewer than 12 lacks diagnostic resolution and will miss real gaps. More than 30 overwhelms the professional and makes prioritization meaningless without dedicated HR software.

3. **Never assign more than 3 CRITICAL items.** If the analysis yields more than 3, either the timeline is unrealistic, the target role definition is too broad, or the professional is trying to close too large a gap in too short a period. Surface this tension explicitly rather than quietly labeling 6 items CRITICAL.

4. **Target levels are role-specific minimums, not aspirational maximums.** A Level 3 target is correct and valid when Level 3 is what the role requires. Do not automatically target Level 5 -- this overstates the development burden and distorts priorities.

5. **Write every competency as an observable behavior, not a trait or vague label.** "Delivers written executive briefings that require fewer than two revision cycles" is assessable. "Strong written communication" is not. If the user offers a vague skill name, ask them what doing it well looks like in their specific context before rating it.

6. **Apply the 70-20-10 allocation across the development plan, not within each individual competency.** The point is that the overall plan should be weighted toward experiential and social learning. A plan that consists exclusively of courses and books is miscalibrated -- name this explicitly if the user is defaulting to formal learning only.

7. **Flag calibration risks rather than silently accepting self-ratings.** If a user rates themselves Level 4 in a skill but cannot cite a recent concrete example, note the discrepancy. If they rate themselves Level 1 in a skill their role explicitly requires daily, that is a significant diagnostic signal worth discussing.

8. **Sequence competencies by interdependency before scheduling by phase.** A competency that is a prerequisite for three others takes higher scheduling priority than its own gap score alone would suggest. Map these dependencies before finalizing phase assignments.

9. **Every development action must have a named validator and a behavioral success milestone.** "Complete course X" is an activity, not a milestone. "Deliver a project kickoff presentation to 10+ stakeholders with no clarifying questions afterward" is a milestone. The validator can be the professional's manager, a mentor, a peer, or a portfolio artifact -- but it must be named.

10. **Explicitly state when a gap is outside the scope of this skill.** If the gap analysis reveals that the professional's issue is a career direction decision (choosing between two very different target roles), a mental health barrier to performance, an organizational/political barrier that skill development cannot solve, or a need for certification-specific study, name the out-of-scope issue and redirect to the appropriate resource rather than forcing it into the development plan.

---

## Edge Cases

### The Professional Dramatically Overestimates Their Current Level

This is common and predictable -- the Dunning-Kruger effect operates consistently in self-assessment contexts. Signs include: no concrete examples offered when probed, ratings inconsistent with their described responsibilities, or a very small total gap that seems implausible given the ambition of the target role.

**Handling:** Do not argue or lecture. Instead, apply the evidence-test protocol: for any competency rated Level 4 or 5, ask "Can you describe a specific situation in the last 18 months where you demonstrated this skill at that level?" If they cannot, lower the rating by 1 and note it as a calibration risk. If the user pushes back, document both ratings and explain that a 360 check (asking a manager or peer to independently rate them) would resolve the discrepancy. Building the plan on the more conservative estimate is the lower-risk approach.

### The User Has No Clear Target Role

Some professionals know they are stagnating or dissatisfied but cannot name a target state. They say things like "I just want to be more valuable" or "I know I need to develop but I don't know what."

**Handling:** This is out of scope for gap analysis without remediation. A gap analysis requires a defined destination. Before proceeding, help the user articulate a specific target state by asking: "If your career is going well in 2 years, what are you doing day-to-day that is different from now?" If they still cannot define a target, refer them to career exploration or role-fit assessment approaches before returning to this skill. If they can get to a directional target (e.g., "something in people management"), proceed with that as the target and note that the matrix will need revision once the target role is formalized.

### The Timeline Is Unrealistically Compressed

A professional with a gap of 3+ levels across 5 CRITICAL competencies who wants to be "ready in 90 days" is describing a plan that will fail. Accepting the timeline without comment and building a plan around it sets the professional up for discouragement.

**Handling:** Surface the misalignment explicitly. Calculate approximate development hours required: a 2-level gap in a complex competency typically requires 80--120 hours of deliberate practice and feedback plus real-world application time. Show the arithmetic. Then offer two options: extend the timeline to one that is achievable, or narrow the target scope to what can realistically be addressed in 90 days. Never simply compress the plan by removing the validation and experiential components -- that produces the illusion of a plan without the substance.

### The User Is in a Role Where Their Manager Controls All Development Opportunities

The 70% experiential learning component depends on access to stretch assignments and projects. Some professionals -- especially in hierarchical organizations, or in individual contributor roles with narrow scope -- have limited ability to self-direct experiential learning.

**Handling:** Explicitly map the experiential learning options to what is available within the user's actual authority. If stretch assignments require manager approval, include a step where the professional prepares a development conversation with their manager, using the gap analysis as the evidence base for the request. If organizational access is truly blocked, weight the 20% social learning modality more heavily (external communities of practice, external mentors, peer cohorts outside the organization) and be honest that progress will be slower.

### The Gap Analysis Reveals a Structural Career Ceiling, Not a Skills Gap

Sometimes the analysis shows that the professional is actually at Level 4--5 across all relevant competencies but is not advancing. The true barrier is not skill -- it is organizational, political, demographic, or structural.

**Handling:** Name this clearly. A gap analysis is designed to diagnose skill deficits. When the analysis reveals no meaningful skill deficit relative to the target, the problem is not solvable through a development plan -- it is a career strategy, advocacy, or organizational fit problem. Acknowledge the finding, validate its significance, and direct the user to appropriate resources (career coaching, organizational dynamics, job search strategy). Do not invent skill gaps to justify keeping the analysis alive.

### The Professional Needs to Assess Competencies in a Domain Where They Have No Benchmark

A professional pivoting into an entirely new field -- say, a marketing manager exploring a move into UX research -- may not know what "good" looks like in the target domain at all, making self-assessment impossible.

**Handling:** Before attempting current-level ratings, help the user build a benchmark reference. Have them review 10 job postings for the target role and extract the competencies listed. Point them toward published competency frameworks for the target domain (e.g., the User Research competency framework from industry associations). If they truly cannot assess their current level because the domain is unfamiliar, rate them at Level 1--2 by default and flag those ratings explicitly as estimates pending validation through informational interviews with practitioners or a structured introduction-to-the-domain activity. These items should carry an asterisk in the matrix indicating low-confidence ratings.

### Multiple Stakeholders Have Conflicting Definitions of the Target Role

This occurs frequently when a professional is being evaluated for a promotion or new role by a committee, or when the target "role" is internally defined and different leaders have different expectations.

**Handling:** When the target state is ambiguous, build the competency domain map against the most demanding or comprehensive interpretation of the role, then flag the ambiguity explicitly. Recommend that the professional seek explicit alignment from the decision-making stakeholders before investing heavily in the development plan. A development plan built against one hiring manager's definition of "senior" may not satisfy another's -- and discovering this after 6 months of development is expensive. Include a stakeholder alignment conversation as a Phase 1 activity with highest priority.

---

## Example

**Input:**
"I'm a software engineer with 4 years of experience, mostly doing backend development in Python and SQL. I want to become an engineering manager at my current company within 18 months. My manager has told me I need to work on leadership skills but has not been more specific. I probably have 5 hours a week for development. My main technical skills are strong -- I mentor junior devs sometimes and I run our team's incident reviews. But I've never managed a team, handled performance reviews, hired anyone, or run roadmap planning."

---

**Output:**

## Skill Gap Analysis: Engineering Manager Readiness
**Date:** Current
**Current Role:** Software Engineer (Backend), 4 years experience
**Target State:** Engineering Manager -- same company, existing IC-to-management track
**Timeline:** 18 months
**Development Hours Available:** 5 hours per week

---

### Competency Domain Map

| Domain | # of Competencies Assessed |
|--------|:--------------------------:|
| Technical Leadership and Architecture | 4 |
| People Management | 5 |
| Execution and Delivery Management | 4 |
| Communication and Influence | 4 |
| Business and Strategic Acumen | 3 |
**Total competencies assessed:** 20

---

### Skills Matrix

**Rating Scale:**
- 1 = No exposure
- 2 = Foundational awareness (needs close guidance)
- 3 = Independent practitioner (routine situations)
- 4 = Advanced practitioner (complex situations, can coach others)
- 5 = Expert/thought leader (innovates, sets standards)

| Domain | Competency | Current Level | Target Level | Gap | Criticality | Priority |
|--------|------------|:---:|:---:|:---:|:-----------:|:--------:|
| Technical Leadership | Conducts code reviews and sets code quality standards for a team | 4 | 4 | 0 | High | LOW (met) |
| Technical Leadership | Diagnoses and leads resolution of production incidents with cross-team impact | 4 | 3 | -1 | High | LOW (overqualified) |
| Technical Leadership | Translates business requirements into technical architecture decisions | 3 | 4 | +1 | High | MEDIUM |
| Technical Leadership | Evaluates technical tradeoffs and communicates them to non-technical stakeholders | 3 | 4 | +1 | High | MEDIUM |
| People Management | Conducts structured 1:1s that develop direct reports' skills and career growth | 2 | 4 | +2 | High | CRITICAL |
| People Management | Delivers performance feedback -- both reinforcing and developmental -- in formal review cycles | 1 | 3 | +2 | High | CRITICAL |
| People Management | Manages underperformance through documented improvement plans and escalation | 1 | 3 | +2 | High | HIGH |
| People Management | Conducts structured interviews and makes hiring recommendations | 1 | 3 | +2 | Medium | HIGH |
| People Management | Onboards new team members with 30-60-90 day plans | 2 | 3 | +1 | Medium | MEDIUM |
| Execution and Delivery | Runs sprint planning and backlog grooming for a team of 4--8 engineers | 2 | 4 | +2 | High | CRITICAL |
| Execution and Delivery | Tracks team velocity and identifies systemic delivery impediments | 2 | 3 | +1 | High | HIGH |
| Execution and Delivery | Manages project risk and communicates status to engineering leadership | 2 | 4 | +2 | High | HIGH |
| Execution and Delivery | Coordinates dependencies across multiple engineering teams | 2 | 3 | +1 | Medium | MEDIUM |
| Communication and Influence | Runs effective team ceremonies (standups, retrospectives, planning) | 3 | 4 | +1 | High | MEDIUM |
| Communication and Influence | Writes and presents engineering team status updates to directors and VPs | 2 | 4 | +2 | High | HIGH |
| Communication and Influence | Negotiates scope and timeline with product managers on behalf of the team | 2 | 4 | +2 | High | HIGH |
| Communication and Influence | Advocates for team resourcing and tooling decisions in engineering leadership forums | 1 | 3 | +2 | Medium | MEDIUM |
| Business and Strategic Acumen | Contributes to quarterly and annual engineering roadmap planning | 1 | 3 | +2 | High | HIGH |
| Business and Strategic Acumen | Understands business unit KPIs and connects team work to business outcomes | 2 | 3 | +1 | High | MEDIUM |
| Business and Strategic Acumen | Builds headcount justification and resource allocation cases | 1 | 3 | +2 | Low | LOW |

**Priority Summary:**
- CRITICAL: 3 competencies (1:1 development, performance feedback delivery, sprint planning and delivery)
- HIGH: 7 competencies
- MEDIUM: 7 competencies
- LOW or Overqualified: 3 competencies

---

### Calibration Notes

- **"Conducts code reviews and sets code quality standards"** was rated Level 4. This is plausible given 4 years of experience and junior mentoring -- but confirm that the user is setting team-level standards, not just reviewing individual PRs. If the latter, this may be Level 3.
- **"Runs effective team ceremonies"** rated Level 3. The user facilitates incident reviews, which is supporting evidence. However, running a retrospective with psychological safety or a planning session with scope conflict is harder than incident review facilitation. Treat this as a calibration risk -- may be Level 2 in contested situations.
- **All people management competencies** are rated Level 1--2 with no professional management experience. These ratings are likely accurate and are the highest-risk domain. A 360 from the user's manager should focus here.

---

### Skill Interdependency Map

- **Structured 1:1 facilitation** (Level 3) → unlocks → **Performance feedback delivery** (cannot do performance conversations without an existing 1:1 relationship and coaching vocabulary)
- **Sprint planning and delivery management** (Level 3) → unlocks → **Project risk communication to leadership** (cannot communicate delivery risk credibly without first having ownership of the delivery process)
- **Business KPI understanding** (Level 3) → unlocks → **Roadmap planning contribution** (cannot contribute to roadmap without connecting work to business outcomes)

---

### Development Plan

#### Phase 1: Months 1--6 -- Critical Gap Resolution
*Active development focus: Structured 1:1s, Performance feedback delivery, Sprint planning ownership*

| Competency | Gap | Modality | Specific Resource or Action | Hours/Week | Success Milestone | Validator |
|------------|:---:|:--------:|----------------------------|:----------:|-------------------|-----------|
| Structured 1:1s that develop direct reports | +2 | Experiential (70%) | Request to formally co-own 1:1s for 2 junior devs you already mentor -- shift from ad hoc check-ins to structured agenda with growth tracking | 1.5 | Run 8 consecutive weekly 1:1s with documented growth notes; junior devs report finding them valuable | Junior dev feedback + manager observation |
| Structured 1:1s | +2 | Social (20%) | Find an engineering manager mentor (internal or via local tech meetup) who will debrief your 1:1 approaches monthly | 0.5 | Complete 4 mentor debriefs with documented takeaways applied in subsequent 1:1s | Self-documented learning log |
| Structured 1:1s | +2 | Formal (10%) | Read "The Manager's Path" (Chapters 1--4) and "Radical Candor" (Part 1) -- focus specifically on 1:1 structure and feedback language | 0.5 | Apply at least 3 specific techniques from reading within 30 days and document what changed | Self-assessment + mentor review |
| Performance feedback delivery | +2 | Experiential (70%) | Ask your manager to include you as an observer in one mid-year and one year-end review cycle; debrief afterward. Separately, deliver a written developmental feedback note to a junior dev you mentor after each sprint | 1.0 | Deliver 6 written developmental feedback instances; draft a sample performance review for a junior dev that your manager reviews and rates as "ready to deliver" | Manager review of written feedback drafts |
| Performance feedback delivery | +2 | Social (20%) | Role-play a difficult feedback conversation (underperformance scenario) with your mentor each month | 0.25 | Complete 4 role-play sessions; mentor rates your delivery as "clear, specific, and non-defensive" | Mentor assessment |
| Sprint planning and delivery ownership | +2 | Experiential (70%) | Negotiate with your manager to take primary ownership of sprint planning facilitation for your team's next 6 sprints -- your manager moves to observer/backup role | 1.0 | Facilitate 6 sprints; team velocity variance under 15%; zero sprint planning meetings running over 90 minutes | Manager observation + sprint metrics |
| Sprint planning and delivery ownership | +2 | Social (20%) | Shadow a senior engineering manager's planning session once before taking ownership; debrief their facilitation choices | 0.25 | Complete shadow session + written debrief of 5 techniques observed | Self-documented debrief |
| Sprint planning and delivery ownership | +2 | Formal (10%) | Complete JIRA Software or Linear project management training (whichever your org uses) -- focus on backlog grooming workflows and sprint metrics | 0.5 | Configure a team velocity dashboard; manager confirms it is production-quality | Dashboard artifact |

**Phase 1 Total: ~5.5 hours/week** -- slightly over the 5-hour constraint. Recommend reducing the formal reading time to every other week and combining the mentor debrief sessions. This brings it to ~4.75 hours/week.

---

#### Phase 2: Months 7--12 -- High Priority Development
*Active development focus: Performance management (underperformance), Delivery risk communication, Scope negotiation with product*

| Competency | Gap | Modality | Specific Resource or Action | Hours/Week | Success Milestone | Validator |
|------------|:---:|:--------:|----------------------------|:----------:|-------------------|-----------|
| Managing underperformance through PIPs | +2 | Social (20%) | Study 2 real PIP cases with your HR business partner (anonymized); understand your company's legal and documentation requirements | 0.5 | Draft a hypothetical PIP scenario for a role you manage; HR or manager reviews for completeness and compliance | HR/manager review |
| Managing underperformance | +2 | Formal (10%) | Read "First, Break All the Rules" (Chapters on talent and fit) and your company's HR performance management policy documentation | 0.5 | Pass an internal HR training on performance management if available; otherwise document your company-specific process | Self-documented process map |
| Project risk communication to leadership | +2 | Experiential (70%) | Take ownership of writing the weekly engineering status update email to your director for 3 months -- your manager reviews before it sends initially, then transitions to spot-check | 1.0 | Director responds to at least 2 of your status updates with follow-up questions, demonstrating engagement; your manager rates them as "ready to send without review" by Week 10 | Director engagement + manager sign-off |
| Scope negotiation with product managers | +2 | Experiential (70%) | Lead scope discussion in at least 3 sprint planning meetings where product has requested more than team capacity allows -- document the negotiation outcome | 0.75 | Successfully negotiate a scope reduction that protects team capacity in at least 2 out of 3 attempts; product manager rates the conversation as "collaborative, not combative" | Product manager feedback |
| Scope negotiation | +2 | Social (20%) | Debrief each negotiation session with your mentor; review what worked and what created friction | 0.25 | Complete 3 debriefs with documented adjustments applied in subsequent sessions | Mentor assessment |
| Structured interviewing | +2 | Experiential (70%) | Request to join 2--3 interview panels as a non-primary interviewer; then request to lead 1 interview as the primary interviewer with your manager as backup | 0.5 | Complete 3 panel interviews; submit a written hiring recommendation for at least 1 candidate that your manager agrees with | Manager concurrence on recommendation |
| Roadmap planning contribution | +2 | Experiential (70%) | Request inclusion in the Q3 or Q4 roadmap planning process as a technical contributor; prepare a 1-pager on one technical initiative with business case | 0.75 | Present a technical initiative 1-pager to engineering director; 1-pager is incorporated into roadmap discussion | Director feedback + roadmap inclusion |

**Phase 2 Total: ~4.25 hours/week** -- sustainable within the 5-hour constraint, leaving buffer for Phase 1 maintenance activities.

---

#### Phase 3: Months 13--18 -- Sustained Development and Readiness Validation
*Active development focus: Selected MEDIUM competencies, full integration, and promotion readiness demonstration*

| Competency | Gap | Modality | Specific Resource or Action | Hours/Week | Success Milestone | Validator |
|------------|:---:|:--------:|----------------------------|:----------:|-------------------|-----------|
| Technical-to-business translation | +1 | Experiential (70%) | Lead a technical tradeoff discussion with product and design stakeholders for a major architectural decision -- document the options, tradeoffs, and recommendation | 0.75 | Stakeholders report that the recommendation was clear, well-justified, and helped them make a faster decision | Stakeholder feedback |
| Cross-team dependency coordination | +1 | Experiential (70%) | Volunteer to be the coordinating engineer on a project with at least one external team dependency; own the dependency tracking | 0.5 | Project completes with dependency-related delays under 1 sprint; external team lead rates coordination as "smooth" | External team lead feedback |
| Headcount justification | +2 | Formal/Social | Work with your manager to build the headcount case for your team's next hire -- own the draft; manager reviews | 0.5 | Draft is accepted by engineering director with minor revisions | Director approval |
| Full readiness demonstration | N/A | Experiential | Request a formal "acting manager" period of 4--8 weeks while your manager is on leave, at a conference, or on a stretch assignment | Variable | Team delivers on sprint commitments; no escalated people issues; manager returns to a team that rates the experience positively | Manager + team assessment |

**Phase 3 Total: ~2.0 hours/week structured development** -- the majority of development at this stage is embedded in daily work through the acting manager opportunity and ongoing ownership of delivery, communication, and 1:1s.

---

### Weekly Investment Summary

| Phase | Total Hours/Week | CRITICAL Active | HIGH Active | MEDIUM Active |
|-------|:----------------:|:---------------:|:-----------:|:-------------:|
| Phase 1 (Months 1--6) | ~4.75 | 3 | 0 | 0 |
| Phase 2 (Months 7--12) | ~4.25 | Wrap-up/maintain | 4--5 | 0 |
| Phase 3 (Months 13--18) | ~2.0 embedded | Complete | Completing | 3 |

---

### Immediate Next Action (Next 7 Days)

**Action:** Schedule a 30-minute conversation with your manager to present this gap analysis and formally request two specific opportunities: (1) to take primary facilitation ownership of the next sprint planning session, and (2) to formalize your mentoring of junior devs into structured weekly 1:1s with a growth-tracking agenda.

**Why this first:** Both requests require manager authorization. Waiting delays Phase 1 by weeks and signals passivity -- exactly the opposite of what a manager candidate needs to demonstrate. Walking into that conversation with a gap analysis document shows structured thinking, self-awareness, and initiative.

**Done looks like:** You leave the conversation with a confirmed date for your first facilitated sprint planning session and at least 1 junior dev formally assigned to your 1:1 structure.

---

### Quarterly Review Schedule

- **Month 3:** Re-rate all 3 CRITICAL competencies against behavioral milestones. If 1:1 facilitation has not reached Level 3, diagnose barrier -- is it access, skill, or feedback quality? Confirm Phase 2 mentor and HR access are in place.
- **Month 6:** Full matrix recalibration. Request a 360-style input from manager on people management and communication domains. Adjust Phase 2 plan based on actual progress vs. projected.
- **Month 9:** Assess trajectory -- are HIGH competencies moving? Identify whether the acting manager opportunity can be arranged for Months 14--16. Begin promotion conversation with manager if trajectory is on track.
- **Month 12:** Formal readiness check against company's engineering manager expectations (request the internal competency rubric from HR if one exists). Identify any remaining blockers to the formal promotion conversation.
- **Month 18:** Target: promotion decision point. If not yet promoted, produce a revised gap analysis based on updated feedback and negotiate revised timeline with specific conditions for promotion.

---

### Deferred Development (Beyond 18-Month Horizon)

- **Headcount justification and resource allocation:** Current Level 1, gap of +2. Not gating for first-year engineering manager -- this becomes relevant when managing a team of 6+ or seeking a senior manager title. Revisit at Month 12.
- **Advocacy in engineering leadership forums:** Current Level 1, gap of +2. Exposure will begin naturally once managing a team. Full development deferred until formal manager role is held.

---

### Key Calibration Insight

The user's strongest asset is technical credibility with their team -- they are already at or above target on 3 of 4 Technical Leadership competencies. This is a significant strategic advantage because engineering manager candidates who lack technical respect face a much harder path. The development burden is concentrated almost entirely in People Management and Execution domains, where the gaps are real but addressable with deliberate, structured effort over 18 months. The most common failure mode for technical-to-management transitions is underinvesting in the experiential component of people management -- taking a course on feedback delivery is not equivalent to delivering feedback. Every month without a real 1:1 structure, a real sprint to own, and real status reports to write is a month of development lost.
