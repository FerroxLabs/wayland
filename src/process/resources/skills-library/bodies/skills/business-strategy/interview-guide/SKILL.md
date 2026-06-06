---
name: interview-guide
description: |
  Creates a structured interview guide with behavioral and competency-based questions, scoring rubric, evaluation criteria, and interviewer instructions for consistent candidate assessment. Use when the user asks about interview guides, interview questions, structured interviews, behavioral interview design, or candidate evaluation rubrics.
  Do NOT use for resume writing, job description creation (use job-description), or interview preparation for candidates (use interview-prep skill).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "template planning checklist strategy guide"
  category: "business-strategy"
  subcategory: "human-resources"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Interview Guide

## When to Use

**Use this skill when:**
- A hiring manager, recruiter, or HR business partner needs to build a structured interview guide from scratch for a specific role, level, and round
- A company is standardizing its interview process across multiple roles and needs a repeatable guide format with behavioral questions, competency definitions, and scoring rubrics
- An interviewer panel needs calibration -- they have been asking unstructured questions and getting inconsistent hiring decisions
- An organization is concerned about legal exposure from inconsistent or undocumented interview practices and needs a defensible, job-related evaluation framework
- A recruiter is onboarding new interviewers who have never conducted structured interviews and needs a guide that includes not just questions but instructions for how to use it
- A company is hiring at volume (10+ identical roles) and needs to ensure every candidate receives the same experience and is scored against the same standard
- A talent team is building out an interview loop with 3-5 rounds and needs to map which competencies are assessed at which stage to avoid redundancy and coverage gaps

**Do NOT use this skill when:**
- A candidate wants to prepare for an interview they are attending (use the `interview-prep` skill)
- Someone needs to write a job description that will later feed into an interview guide (use the `job-description` skill first, then return here)
- An HR team needs a performance review or 360 feedback template (use the `performance-review` skill -- evaluation criteria are different from interview criteria)
- Someone needs to draft an offer letter or employment contract (use the `offer-letter` skill)
- The request is for a casual, unstructured reference check script (this skill focuses on candidate interviews, not reference checks)
- The user needs to design an assessment center with simulation exercises, role plays, or in-tray exercises as the primary evaluation method (those require a distinct exercise-design methodology)
- The request is purely about employer branding or candidate experience optimization without a structured evaluation component

---

## Process

### Step 1: Extract the Interview Context

Before generating any questions, gather these inputs from the user. If the user has not provided them, ask explicitly -- without this context the guide cannot be tailored to the role.

- **Role and level:** Title, seniority level (individual contributor vs. manager vs. director vs. executive), and team or department. A "Product Manager" guide is completely different from a "Senior Director of Product" guide -- scope, strategic depth, and leadership expectations all shift.
- **Interview round and format:** Phone screen (20-30 min), recruiter behavioral screen (30-45 min), hiring manager interview (45-60 min), panel behavioral interview (60 min), technical assessment round, case study round, or final executive interview. Each round has different objectives and question depth.
- **Competencies to assess:** The user may name these explicitly or you may need to infer them from a job description. Target 3-5 competencies per 60-minute interview. Fewer than 3 leaves gaps; more than 5 means each competency gets only one surface-level question.
- **Duration:** The single most important pacing constraint. A 30-minute screen can assess 2 competencies properly. A 60-minute behavioral interview can assess 3-4. Never crowd more competencies into a guide than the time permits.
- **Interviewer experience level:** A seasoned hiring manager needs less scaffolding than a peer interviewer doing their first behavioral interview. Adjust the instruction density in the guide accordingly.
- **Must-have vs. nice-to-have competencies:** Ask the user to distinguish these. If a candidate fails a must-have competency (e.g., data analysis for a data analyst role), they should not advance regardless of how well they score on nice-to-have competencies. This distinction must be reflected in the guide's decision logic.
- **Prior pain points:** Ask whether there are specific failure modes from past hires -- e.g., "we keep hiring people who can't influence without authority" or "candidates look great on paper but can't handle ambiguity." These shape question focus and rubric calibration.

---

### Step 2: Identify and Define the Competency Framework

A competency is a specific, observable cluster of behaviors that predict job performance. It is not a personality trait ("enthusiastic") or a credential ("has an MBA"). Good competency names are verb-heavy and behaviorally anchored.

**Common competency categories by function:**

| Function | Core Competencies Typically Assessed |
|----------|--------------------------------------|
| Product Management | Product sense, analytical reasoning, prioritization, cross-functional influence, user empathy |
| Engineering | Technical depth, system design thinking, debugging approach, code review collaboration, incident response |
| Sales | Pipeline management, objection handling, discovery questioning, deal qualification, forecasting discipline |
| People Management | Coaching and development, conflict resolution, delegation, performance management, organizational influence |
| Operations | Process design, stakeholder alignment, ambiguity tolerance, execution rigor, cross-functional coordination |
| Finance | Financial modeling, business case development, executive communication, risk quantification |

**Competency definition structure:** For each competency, define three things before writing any questions:
1. **What it means at this level** -- "Analytical Reasoning for a mid-level PM means the ability to size a problem, identify the right metric to move, and design a measurement approach" vs. "for a VP it means building a data strategy across the org."
2. **What excellent looks like** -- specific observable behaviors, not adjectives. "Uses primary and secondary metrics. Anticipates confounding variables. Quantifies tradeoffs in revenue terms."
3. **What poor performance looks like** -- "Relies on gut feel. Cannot explain why they chose a metric. Conflates outputs with outcomes."

**Limit competencies per round:** Assign each interview round its own distinct set of competencies. Map the entire interview loop on a grid before writing a single question. If three interviewers all ask about "communication," that is a coverage failure and creates a terrible candidate experience.

---

### Step 3: Write Behavioral Questions Using the STAR-L Framework

The standard STAR framework (Situation, Task, Action, Result) is widely known but often produces surface-level answers without the fifth element: **Learning**. Use the STAR-L model to also probe for what the candidate updated in their mental model or behavior as a result of the experience.

**Question construction rules:**
- Always open with a situation-anchor: "Tell me about a time when..." or "Describe a specific situation where..." or "Walk me through a recent example of..."
- Never use "What would you do if..." as a primary question. Hypotheticals reveal idealized self-perception, not actual behavior. Past behavior under conditions similar to the future role is far more predictive.
- Aim for a situation that is sufficiently recent (within the last 2-3 years) and at a scope relevant to the role. For a manager role, you want examples from a management context, not from 10 years ago as an individual contributor.
- Write 2-3 primary questions per competency, then select the best 1-2 based on time available. Extra questions serve as alternates if the first question doesn't yield useful data (candidate has no relevant example, or the answer is off-topic).

**Follow-up probe bank by STAR-L element:**

*Situation/Task probes (when the setup is vague):*
- "How large was the team or scope involved?"
- "What were the constraints -- budget, timeline, headcount?"
- "Who were the key stakeholders you were accountable to?"

*Action probes (when actions are described at a high level):*
- "What specifically did you do vs. what did others on the team do?"
- "When you say you 'worked with' the team, can you describe how you made decisions?"
- "What would the people who disagreed with you say about your approach?"

*Result probes (when outcomes are missing or vague):*
- "What was the measurable impact? Can you put a number to it?"
- "How did you know it worked?"
- "What happened to the project 6 months later?"

*Learning probes (the most-skipped, most valuable element):*
- "What would you do differently if you faced this situation again?"
- "What did that experience change about how you operate?"
- "If you were coaching a peer who had to navigate the same situation, what would you tell them?"

**Avoid these question types:**
- Brain teasers ("How many golf balls fit in a school bus?") -- banned by most reputable research as zero-validity predictors
- Questions that telegraph the answer ("We value collaboration here -- how do you collaborate?")
- Compound questions ("Tell me about a time you handled conflict AND what you would do differently") -- ask one at a time
- Questions based on unverified assumptions ("I see from your resume you led a team -- tell me about a time...")

---

### Step 4: Build Behaviorally Anchored Rating Scales (BARS)

Generic rubrics ("1=poor, 4=excellent") are not usable. Interviewers with no calibration will use the same rubric label to mean entirely different things, producing data that cannot be aggregated. The solution is a **Behaviorally Anchored Rating Scale (BARS)**: each score level is defined by specific observable behaviors, not adjectives.

**Four-point scale (recommended for most hiring contexts):**

Avoid five-point scales with a neutral midpoint -- interviewers default to the middle, which destroys variance. A forced four-point scale requires a directional judgment.

| Score | Label | Meaning |
|-------|-------|---------|
| 1 | Does Not Meet | Evidence is absent, contradictory, or clearly below the minimum bar for the role level |
| 2 | Approaching | Evidence is present but thin -- one weak example, limited scope, unclear impact, or skill shown at a lower level than required |
| 3 | Meets | Clear, specific example at the appropriate scope and level; impact is measurable; demonstrates the competency reliably |
| 4 | Exceeds | Multiple strong examples; demonstrates the competency above the role's requirements; pattern of excellence; evidence of teaching or scaling the competency to others |

**Writing BARS indicators:** Each score level should have 2-4 bullet points describing what a candidate who scored at that level actually said or did in the interview. These are written before the interview happens, based on your definition of the competency. Example for "Stakeholder Management, Score 3":
- Describes identifying who the key stakeholders were and what each cared about before taking action
- Explains a specific method used to align conflicting priorities (e.g., joint prioritization session, shared OKR mapping)
- Demonstrates that the outcome addressed stakeholder needs, with evidence of follow-through

**Calibration sessions:** If this guide will be used by multiple interviewers, run a 30-minute calibration session before the first hire. Present a written transcript of a fictional candidate's answer and have each interviewer score it independently, then discuss discrepancies. This is the single highest-leverage activity to reduce inter-rater variability.

---

### Step 5: Build the Interview Agenda With Time Allocation

Time management is the most common interview failure mode. Interviewers spend 25 minutes on the first question and then rush through the final competency in 5 minutes, producing no usable data for that section.

**Time budgeting formula for a 60-minute behavioral interview:**
- Opening and rapport: 5 minutes
- 3 competencies x 15 minutes each: 45 minutes
- Candidate questions: 8 minutes
- Close and next steps: 2 minutes

**Time budgeting formula for a 45-minute behavioral interview:**
- Opening: 3 minutes
- 3 competencies x 12 minutes each: 36 minutes
- Candidate questions: 5 minutes
- Close: 1 minute

**Per-question time management:** A 15-minute competency block typically allows for one strong behavioral question with 2-3 follow-up probes. Do not try to ask two full behavioral questions in 15 minutes -- you will get shallow answers to both. If the first question yields a rich, relevant answer, it is fine to stay on it. If the answer is vague, use your alternate question.

**Clock management signal:** Include a note in the guide for interviewers: "If you are past the halfway mark on time and still on the first competency, complete that question, write your score, and move on. Do not skip the candidate question period -- it is assessed."

---

### Step 6: Write Interviewer Instructions

The instructions section is often omitted from interview guides, and it is the reason the same questions produce different quality data across interviewers. Include the following:

**Before the interview:**
- Read the full guide including BARS anchors before the interview. Do not read questions for the first time while the candidate is in the room.
- Read the candidate's resume, but do not form hypotheses to confirm. Your job is to surface evidence, not validate first impressions.
- Prepare your scoring sheet with a notes column -- space to write verbatim or near-verbatim quotes, not paraphrases.

**During the interview:**
- Take notes on what the candidate said, not your interpretation. "Candidate said the project had a $200K cost overrun and they identified it 3 weeks late" is a usable note. "Candidate seemed to handle the pressure well" is not -- it is an inference.
- Silence after a question is not failure. Wait at least 5 seconds before probing. Many interviewers break silence prematurely and accidentally answer their own question.
- If a candidate gives a hypothetical answer to a behavioral question ("I would typically..."), redirect: "I appreciate that -- can you give me a specific example of when you did that?"
- If a candidate cannot provide an example from work (new graduate, career changer), ask for an academic, volunteer, or side project context. Score with that context in mind but note the difference in scope.
- Do NOT telegraph your reaction -- nodding enthusiastically when a candidate gives a strong answer and then asking a probe question signals that the probe is a follow-up to a good answer, not a routine follow-up.

**After the interview:**
- Score within 30 minutes of the interview ending. Memory degrades rapidly. Research shows that after 24 hours, interviewers begin to conflate candidates and reconstruct memories.
- Score each competency independently before writing your overall recommendation. Do not let halo bias (one great answer) or horn bias (one bad answer) drive the overall score.
- Submit your completed scorecard to the recruiter before the debrief meeting. Do not read other interviewers' scorecards before submitting your own.

**Illegal questions -- hard stop:** The following question topics are legally prohibited in most jurisdictions and must never appear in a structured guide or be asked ad-hoc:
- Marital status, family status, pregnancy plans, number of children
- Age or date of birth (asking for graduation year to infer age is also problematic)
- National origin, citizenship, native language (unless job-related for a specific documented reason)
- Religion or religious practices
- Disability status or medical history (the ADA allows you to ask whether a candidate can perform essential job functions with or without reasonable accommodation -- nothing more)
- Arrest record (conviction record may be askable in some jurisdictions -- know local law)

---

### Step 7: Design the Structured Debrief Protocol

The debrief meeting is where hiring decisions are made, and it is where the most bias enters the process if not structured carefully. The guide must include debrief instructions.

**Structured debrief protocol:**
1. Before the meeting, every interviewer submits their completed scorecard with individual competency scores and written evidence. Submission is a hard prerequisite for attending the debrief. No scorecard, no vote.
2. The recruiter or debrief facilitator compiles all scores into a summary grid showing each interviewer's ratings by competency. This grid is shared at the start of the debrief meeting, not before.
3. Each interviewer shares their scores and the specific evidence they observed -- starting with the person most likely to have a minority view, not the hiring manager (who would anchor everyone else).
4. Discuss discrepancies: if two interviewers assessed "Stakeholder Management" and scored it 2 and 4 respectively, explore why. Often one interviewer probed deeper or got a different example. This is not a voting situation -- it is an evidence-comparison exercise.
5. Apply the must-have threshold rule: any candidate who scored 1 on a must-have competency does not advance, regardless of other scores.
6. The hire decision is not an average -- a candidate with scores of 3, 3, 1, 3 is not a "2.5/hire." A score of 1 on a must-have is a no-hire.
7. Document the rationale in writing within 24 hours: what evidence led to the decision, what concerns remain, what would need to be true for a different decision.

---

## Output Format

The AI should generate the following structured document. Fill every section with role-specific content -- no generic placeholder text.

---

```markdown
## Interview Guide: [Role Title] -- [Round Name]

---

### Interview Overview

| Field | Details |
|-------|---------|
| Role | [Title, Level, Department] |
| Interview Round | [Round number and type: e.g., Round 2 -- Behavioral] |
| Duration | [X minutes] |
| Interviewer | [Name or role assignment] |
| Must-Have Competencies | [Competency names -- failure here = no hire] |
| Nice-to-Have Competencies | [Competency names -- failure here = a concern, not automatic disqualifier] |
| Guide Version | [Version number and date] |

---

### Pre-Interview Checklist (Interviewer)

- [ ] Read this guide fully, including BARS anchors, before the interview
- [ ] Reviewed candidate's resume without forming hypotheses to confirm
- [ ] Scoring sheet printed or open with notes column ready
- [ ] Interview room or video link confirmed and tested
- [ ] Time blocked for scorecard submission immediately after interview

---

### Competency 1: [Competency Name]
**Why this competency matters for this role:** [1-2 sentences linking competency to job performance]
**What excellent performance looks like:** [2-3 specific observable behaviors]
**What poor performance looks like:** [2-3 specific observable behaviors]

**Primary Question:**
> "[Behavioral question -- Tell me about a time...]"

Follow-up probes:
- "[Situation/Task probe if setup is unclear]"
- "[Action probe if actions are vague or group-attributed]"
- "[Result probe if outcome is missing or unquantified]"
- "[Learning probe -- what did this change for you?]"

**Alternate Question (use if primary yields no usable data):**
> "[Second behavioral question on the same competency]"

**Scoring Rubric -- [Competency Name]:**

| Score | Label | Behavioral Indicators |
|-------|-------|----------------------|
| 4 -- Exceeds | [Label] | [2-3 specific behaviors a 4-scorer demonstrates in the interview] |
| 3 -- Meets | [Label] | [2-3 specific behaviors a 3-scorer demonstrates in the interview] |
| 2 -- Approaching | [Label] | [2-3 specific behaviors a 2-scorer demonstrates in the interview] |
| 1 -- Does Not Meet | [Label] | [2-3 specific behaviors a 1-scorer demonstrates in the interview] |

**Interviewer Score:** _____ / 4
**Evidence (what the candidate said -- verbatim where possible):**
_______________________________________________

---

*(Repeat Competency block for each competency)*

---

### Interview Agenda

| Time | Activity | Interviewer Action |
|------|----------|--------------------|
| 0:00 -- 0:05 | Opening | Introduce yourself by name and role. Explain: "Today I'll be asking about specific past experiences. I'll take some notes. There's no trick here -- I just want to understand how you've approached situations similar to what you'd face here." |
| 0:05 -- 0:[X] | [Competency 1 Name] | Primary question + 2-3 probes. Target [X] minutes. If past [midpoint], complete and move on. |
| 0:[X] -- 0:[Y] | [Competency 2 Name] | Primary question + 2-3 probes. Target [X] minutes. |
| 0:[Y] -- 0:[Z] | [Competency 3 Name] | Primary question + 2-3 probes. Target [X] minutes. |
| 0:[Z] -- 0:[Z+8] | Candidate Questions | "What questions do you have for me?" Note the quality and depth of questions asked. |
| Last 2 min | Close | "We're at time. Thank you for your time today. [Recruiter name] will be in touch within [X] business days about next steps." |

**Clock management note:** If you are past the halfway point of your total interview time and still on Competency 1, wrap up that question, record your score, and move to Competency 2. Incomplete data on three competencies is better than deep data on one.

---

### Candidate Question Period -- Assessment Notes

The questions a candidate asks are informative data. Note:
- Are they asking about the role, the team, and the mission? (Suggests genuine interest in the work)
- Are they asking exclusively about compensation, benefits, and flexibility before any offer exists? (Not a red flag alone, but note if it dominates)
- Are they asking sophisticated questions that demonstrate they have researched the company and thought about the role? (Strong signal for senior roles)
- Do they ask nothing? (May indicate disengagement or excessive anxiety -- note context)

**Candidate Questions Asked:**
_______________________________________________

---

### Interviewer Scorecard

| Competency | Must-Have? | Score (1-4) | Evidence Summary |
|------------|-----------|-------------|-----------------|
| [Competency 1] | [Yes/No] | _____ | |
| [Competency 2] | [Yes/No] | _____ | |
| [Competency 3] | [Yes/No] | _____ | |
| [Competency 4 if applicable] | [Yes/No] | _____ | |

**Overall Recommendation:**
- [ ] Strong Hire -- Exceeds bar on all must-haves; strong evidence across competencies
- [ ] Hire -- Meets bar on all must-haves; solid evidence; no significant concerns
- [ ] Lean No Hire -- Meets some must-haves but gaps exist; concerns outweigh strengths
- [ ] No Hire -- Does not meet bar on one or more must-have competencies
- [ ] Strong No Hire -- Significant evidence of concerning behaviors or inability to perform in the role

**Decision Rationale (required):**
[Summarize the specific evidence that drove your recommendation. Reference competency names and examples cited. Do not write "gut feeling" or "culture fit" without behavioral evidence.]

**Top Strength Observed:**
**Primary Concern:**
**Open Questions for Debrief:**

*Submit this scorecard within 30 minutes of the interview and before reading any other interviewer's feedback.*

---

### Debrief Protocol

1. Facilitator shares compiled score grid (all interviewers, all competencies) at the start of the meeting -- not before.
2. Each interviewer states their scores and primary evidence. Begin with the interviewer with the most divergent view, not the hiring manager.
3. Discuss competencies where interviewers disagreed by 2+ points. Identify whether the divergence is due to different examples, different probing depth, or genuine rater disagreement.
4. Apply the must-have threshold: any Score 1 on a must-have competency = No Hire unless extraordinary countervailing evidence is presented and documented.
5. Document the decision and rationale within 24 hours.

**Debrief Decision:**
- [ ] Advance to next round
- [ ] Extend offer
- [ ] No hire -- [primary reason]

**Decision rationale documented by:** ___________________ **Date:** ___________

---

### Topics to Avoid (Legal Compliance)

The following topics may NOT be raised in this interview, including as casual conversation:
- Age, birth year, or graduation year (when used to infer age)
- Marital status, partnership status, family plans, or number of children
- National origin, citizenship status, or native language
- Religion or religious practices
- Disability status, medical history, or physical limitations
- Arrest record
- Military discharge status

If a candidate volunteers information in any of these categories, do not follow up on it and do not record it in your scorecard notes.
```

---

## Rules

1. **Never use generic rubric labels without behavioral anchors.** A rubric that says "4 = Excellent" is not usable. Every score level must have 2-4 specific behavioral indicators written for that competency before the interview begins. If an interviewer cannot point to a behavior the candidate exhibited that matches a specific score level, the rubric is not calibrated properly.

2. **The number of competencies must match the time available.** Do not try to assess more than 3 competencies in a 45-minute interview or more than 4 in a 60-minute interview. Over-loading the guide is the most common error -- it results in shallow data across all competencies rather than usable data on the critical ones. If the user asks for 6 competencies in a 45-minute guide, push back and help them prioritize.

3. **Behavioral questions are mandatory; hypotheticals are supplementary at best.** At least 80% of the questions in any guide must be behavioral ("Tell me about a time..."). Hypothetical questions ("What would you do if...") may be used occasionally for forward-looking roles where future context genuinely differs from past experience (e.g., asking a VP candidate about their vision), but they must never replace behavioral evidence for core competencies.

4. **Each competency must have at least one alternate question.** If a candidate has no relevant example for the primary question, you need a fallback. An alternate question addresses the same competency from a different angle or industry context. Without an alternate, the interviewer will either get no data on that competency or improvise a question -- neither is acceptable.

5. **Every question must have at least two follow-up probes -- one for action specificity and one for outcome.** Candidates naturally tell the best version of their story without being prompted for specifics. Probes force specificity. "What specifically did you do?" and "What was the measurable result?" are the minimum probes for every question. Without them, scores will be inflated because vague positive stories score higher than they should.

6. **The candidate question period (minimum 8 minutes for a 60-minute interview, minimum 5 minutes for a 45-minute interview) is mandatory.** It is not optional time to recover if the interview runs long. The candidate's questions are informative data and skipping this period is a significant negative signal about the organization.

7. **Score submission must precede debrief participation.** This is not a best practice -- it is a rule. Research on conformity bias (Asch, 1951) and more recent work on structured hiring (Schmidt & Hunter, 1998) consistently demonstrates that hearing one confident interviewer's opinion before forming your own is enough to substantially shift ratings. If a user asks to skip this step, explain the bias risk and offer a solution (e.g., async scorecards submitted to the recruiter).

8. **A Score 1 on a must-have competency is a no-hire, regardless of other scores.** The aggregation error -- averaging a 1 with several 4s and calling it a hire -- is one of the most common causes of bad hires. A candidate who cannot demonstrate a must-have competency at a minimum bar should not advance. Make this explicit in the guide's decision logic.

9. **Illegal question topics must be explicitly listed in every guide.** Do not assume interviewers know what they cannot ask. List the prohibited topics in the guide's reminders section. When generating a guide, always include this list. If a user asks for a question that touches on a prohibited topic (e.g., "ask about their availability on weekends"), reframe it legally ("Ask: 'This role requires occasional weekend availability. Is there anything that would prevent you from meeting that requirement?'") and explain the distinction.

10. **Competencies must be assigned across the interview loop without duplication.** Before generating a guide for one round, ask about the full loop. If three rounds are all assessing "communication," the organization is getting redundant data on that competency and no data on others. Create or reference a competency coverage map showing which competency is owned by which round and which interviewer. If a user cannot provide the full loop structure, note in the guide which competencies are being assessed here and flag that coverage mapping should be done before using the guide.

---

## Edge Cases

### Entry-Level or New Grad Candidates
Behavioral questions that assume years of professional experience will yield blank stares from recent graduates. Reframe every question to explicitly invite academic, internship, volunteer, and project contexts: "Tell me about a time -- in any context: class project, internship, club leadership -- when you had to influence someone who didn't report to you." Score responses at the appropriate scope -- a student organizing a 10-person class project that shipped on time is demonstrating project management at their level. Do not score them down for scope; score them on the quality of behavior within their scope. Add a note in the guide: "Candidates at this level may not have workplace examples for every question. Academic and extracurricular examples are acceptable. Adjust scope expectations accordingly in the BARS anchors."

### Internal Candidates Competing for a New Role
Internal candidates present several complications. First, interviewers already have impressions of them -- often positive if they are liked, which inflates scores, or sometimes negative if there has been friction. Second, generic behavioral questions may yield answers about the same company the interviewer works at, which creates anchoring to known context. Third, it can feel awkward for both parties to conduct a formal structured interview with a colleague. Handle this by: (a) noting in the guide that all interviewers must score internal candidates against the same rubric as external candidates, (b) replacing questions that say "at a previous company" with "in a context here or elsewhere," (c) specifically probing for examples from outside the interviewer's direct line of sight ("You mentioned a cross-functional project -- can you walk me through one I might not be familiar with?"), and (d) reminding interviewers that familiarity is not evidence -- only examples are.

### Executive-Level and C-Suite Candidates
Executive interviews require a fundamental shift in question design. Tactical behavioral questions ("Tell me about a bug you fixed") are irrelevant. The assessment is about organizational impact, board-level communication, strategic decision-making under ambiguity, and building and deploying human capital. Questions should be scoped to organizational transformation: "Walk me through a time you had to significantly restructure how your function operated -- what drove the need, how you built the case, how you executed, and what the org looked like 18 months later." Also add: (a) a board or executive presentation exercise where the candidate presents a strategic analysis, (b) a stakeholder simulation where the candidate handles a difficult board question or investor scenario, (c) reference check questions specifically designed to triangulate the competencies assessed in the interview. For executives, structured reference checks are more predictive than the interviews themselves -- build reference check questions into the guide.

### Technical Interview Rounds (Engineering, Data, Finance Modeling)
Behavioral rounds and technical rounds have different structures. Technical rounds assess not just whether the candidate gets the right answer, but how they think. The rubric must evaluate: (a) problem decomposition -- do they break the problem into tractable subproblems before starting?, (b) communication during the exercise -- do they think aloud, ask clarifying questions, and explain their reasoning?, (c) approach to ambiguity -- when constraints are undefined, do they make reasonable assumptions explicitly or freeze?, (d) response to hints and feedback -- do they incorporate guidance gracefully or defensively?, (e) output quality -- correctness, efficiency, and edge case handling for code; logic, assumptions, and scenario analysis for finance models. Never use the technical exercise as the only data point -- pair it with at least one behavioral question about how they have applied technical skills in a team context.

### High-Volume Hiring (10+ Identical Roles)
Standardization is non-negotiable at volume. Every single candidate must receive the same questions in the same order. Build a bank of 5 questions per competency so interviewers can rotate across candidates while maintaining structural equivalence. Require all interviewers to attend a calibration session where they independently score the same written transcript and then align. Track score distributions by interviewer -- if one interviewer gives 70% of candidates a score of 4 and another gives 70% a score of 2, you have a calibration problem, not a talent problem. In high-volume contexts, also consider using a structured scoring platform that prevents interviewers from seeing each other's scores, timestamps scorecard submission to confirm it precedes the debrief, and archives all evaluation data for legal defensibility.

### Remote/Video Interviews
Video interviews require additional guidance in the interviewer instructions. Note: (a) technical difficulties at the start do not reflect the candidate's communication ability -- allow 5 minutes of setup buffer, (b) silence is normal on video and should not be filled by the interviewer, (c) eye contact norms are different on video -- looking at the camera reads as eye contact, looking at the face reads as looking away, (d) take notes in a separate document rather than visibly typing during the interview (it creates an audible distraction and signals inattention), (e) record the interview only if legally permitted and with the candidate's explicit consent, and document this in the guide.

### Candidates With Non-Traditional Backgrounds or Career Gaps
A candidate who has been out of the workforce for 2 years for caregiving, medical reasons, or personal circumstances should not be evaluated differently on competency evidence. The behavioral questions should focus on examples from before the gap, with probes for recency updated as needed ("I know this was a few years ago -- can you tell me about any context since then, even informal or volunteer, where you've applied this skill?"). Do not probe the gap for personal reasons. If the competency evidence is several years old, note that in the scorecard as a consideration, not a disqualifier. Score on the quality of evidence that exists, not the absence of recent evidence due to circumstances outside the candidate's control.

---

## Example

**Input:** "I need an interview guide for a Senior Data Analyst role. It's a 60-minute behavioral round conducted by the hiring manager. I want to assess analytical rigor, stakeholder communication, and handling ambiguity. Analytical rigor is a must-have."

---

## Interview Guide: Senior Data Analyst -- Round 2 Behavioral

---

### Interview Overview

| Field | Details |
|-------|---------|
| Role | Senior Data Analyst, Analytics & Insights Team |
| Interview Round | Round 2 -- Behavioral Interview |
| Duration | 60 minutes |
| Interviewer | Hiring Manager |
| Must-Have Competencies | Analytical Rigor (Score 1 = automatic no-hire) |
| Nice-to-Have Competencies | Stakeholder Communication, Handling Ambiguity |
| Guide Version | v1.0 |

---

### Pre-Interview Checklist

- [ ] Read this full guide including BARS anchors before the interview begins
- [ ] Reviewed resume -- noted candidate's current tools (SQL, Python, Tableau) and industry context
- [ ] Scoring sheet open with notes column ready
- [ ] Video link tested and backup phone number available
- [ ] 30-minute block after interview held for scorecard completion

---

### Competency 1: Analytical Rigor (MUST-HAVE)

**Why this competency matters:** A Senior Data Analyst drives decisions that affect product, operations, and revenue. Errors in methodology, metric selection, or data interpretation at this level are not caught by a layer above -- this person is that layer.

**What excellent performance looks like:** Identifies the right question before choosing the method. Checks data quality before drawing conclusions. Distinguishes correlation from causation. Quantifies uncertainty and states assumptions explicitly. Proactively flags limitations in their own analysis.

**What poor performance looks like:** Presents correlation as causation without acknowledgment. Cannot explain why they chose a metric. Does not mention data quality checks. Cannot quantify confidence or uncertainty.

**Primary Question:**
> "Tell me about a time when you delivered an analysis, and someone pushed back on the methodology or the conclusion. What happened, and how did you handle it?"

Follow-up probes:
- "What was the specific concern they raised about your approach or data?"
- "Walk me through what you did to either validate or revise your analysis."
- "What did you find when you re-examined it? Were they right?"
- "What did that experience change about how you approach analysis reviews now?"

**Alternate Question (use if primary yields no usable data):**
> "Describe the most complex analysis you've built where you had to make significant methodological choices -- what decisions did you face, and how did you evaluate the options?"

**Scoring Rubric -- Analytical Rigor:**

| Score | Label | Behavioral Indicators |
|-------|-------|-----------------------|
| 4 -- Exceeds | Definitive Evidence | Describes a case where their own proactive quality check caught an error before delivery. Distinguishes statistical significance from practical significance. Explains trade-offs between methodologies (e.g., why they chose regression over a simpler ratio). Can articulate what would need to be true for their conclusion to be wrong. |
| 3 -- Meets | Clear Evidence | Provides a specific example of incorporating feedback that improved the analysis. Describes the data quality checks they ran. Can explain why they selected the metric they used and what it does and does not capture. |
| 2 -- Approaching | Thin Evidence | Describes a general process ("I always check my data") without a specific example. Cannot explain the methodological choice or defaults to "that's what everyone uses." Pushback was acknowledged but not substantively addressed. |
| 1 -- Does Not Meet | Insufficient Evidence | Cannot describe a specific analysis with rigor. Dismisses methodology questions as unimportant. Conflates correlation with causation without acknowledgment. No data quality checks mentioned. |

**Interviewer Score:** _____ / 4
**Evidence (what the candidate said):**
_______________________________________________

---

### Competency 2: Stakeholder Communication

**Why this competency matters:** At the senior level, an analyst is not just building analyses -- they are translating data into decisions for non-technical stakeholders including VPs, product managers, and finance partners. The ability to communicate uncertainty, caveats, and methodology in plain language is as critical as the technical work.

**What excellent performance looks like:** Adapts communication style to audience. Proactively translates technical findings into business implications. Manages stakeholder expectations when data cannot answer the question as asked. Receives and incorporates feedback on communication style.

**What poor performance looks like:** Defaults to full technical detail regardless of audience. Withholds caveats to avoid difficult conversations. Cannot explain what the data means for a business decision.

**Primary Question:**
> "Tell me about a time when you had to present an analysis to a senior leader or executive who didn't have a data background. What did you present, and how did you tailor your approach?"

Follow-up probes:
- "What did you leave out, and why did you make those choices?"
- "How did they respond? Did the communication land the way you intended?"
- "What would you do differently to make it more effective?"

**Alternate Question:**
> "Describe a situation where a stakeholder asked you to answer a business question that the data couldn't actually answer in the way they were framing it. How did you handle that?"

**Scoring Rubric -- Stakeholder Communication:**

| Score | Label | Behavioral Indicators |
|-------|-------|-----------------------|
| 4 -- Exceeds | Definitive Evidence | Describes adjusting communication style based on explicit feedback from a stakeholder. Identifies what an executive cares about (the decision, the risk, the revenue impact) vs. what an analyst finds interesting (the methodology). Has a specific example of reframing a technical limitation as a business risk, not a data failure. |
| 3 -- Meets | Clear Evidence | Describes intentionally simplifying a technical analysis for a non-technical audience. Can articulate what they included vs. excluded and why. Has an example of a stakeholder understanding and acting on their recommendation. |
| 2 -- Approaching | Thin Evidence | Mentions "keeping it simple" but cannot describe how. Stakeholder example is with a peer analyst, not a business stakeholder. Communication was one-directional -- no evidence of feedback or adaptation. |
| 1 -- Does Not Meet | Insufficient Evidence | Presents full technical detail regardless of audience. Cannot articulate how communication for a VP differs from communication for a fellow analyst. No examples of adapting to feedback. |

**Interviewer Score:** _____ / 4
**Evidence (what the candidate said):**
_______________________________________________

---

### Competency 3: Handling Ambiguity

**Why this competency matters:** Senior Analysts at this company work on problems where the question is often poorly defined, the data is incomplete, and the stakeholder needs an answer before perfect information is available. The ability to make structured progress under ambiguity -- rather than stalling waiting for clarity -- is essential at this level.

**What excellent performance looks like:** Breaks a vague question into tractable sub-questions before beginning. Makes explicit assumptions and states them to stakeholders. Delivers a provisional answer with clearly labeled uncertainty rather than waiting indefinitely. Iterates toward the answer rather than trying to solve it completely before sharing.

**What poor performance looks like:** Waits for complete requirements before starting. Asks clarifying questions but never commits to a directional finding. Treats ambiguity as a blocker rather than a condition to work around.

**Primary Question:**
> "Tell me about a time when you were asked to analyze something where the question itself wasn't clear -- you got a vague ask or a moving target. How did you approach it?"

Follow-up probes:
- "What did you do first when you realized the question was under-defined?"
- "How did you decide when you had enough information to proceed vs. when you needed more clarity?"
- "What did you deliver, and was the stakeholder satisfied with how you handled the ambiguity?"
- "What would you do differently to get ahead of that situation?"

**Alternate Question:**
> "Describe a situation where you had to make an analytical recommendation without having access to the ideal data. What was missing, and how did you handle it?"

**Scoring Rubric -- Handling Ambiguity:**

| Score | Label | Behavioral Indicators |
|-------|-------|-----------------------|
| 4 -- Exceeds | Definitive Evidence | Describes a structured decomposition of the ambiguous ask into answerable sub-questions. Made explicit assumptions and shared them with stakeholders before completing the work. Delivered iteratively -- "here's what I can tell you now, here's what I'll confirm next week." Outcome shows stakeholder trusted them to navigate ambiguity independently. |
| 3 -- Meets | Clear Evidence | Describes identifying and resolving ambiguity through structured clarifying questions. Made a decision about when to proceed vs. escalate. Delivered a finding with stated limitations. Stakeholder was able to make a decision from the output. |
| 2 -- Approaching | Thin Evidence | Asked clarifying questions but needed significant hand-holding. Describes ambiguity as a problem that someone else resolved for them. Waited significantly before proceeding. |
| 1 -- Does Not Meet | Insufficient Evidence | Cannot describe a specific ambiguous situation. Describes ambiguity as something that always gets resolved before they start. No examples of making progress without complete information. |

**Interviewer Score:** _____ / 4
**Evidence (what the candidate said):**
_______________________________________________

---

### Interview Agenda

| Time | Activity | Interviewer Action |
|------|----------|--------------------|
| 0:00 -- 0:05 | Opening | "Hi [Name], I'm [Your Name], and I'm the hiring manager for this role. Today's interview is about your past experiences -- I'll ask you to walk me through specific situations. I'll take some notes as we go. There's no trick here; I'm genuinely interested in how you work. Does that sound good?" |
| 0:05 -- 0:22 | Analytical Rigor | Primary question + 3-4 probes. Target 17 minutes. If past 0:18 and still on first probe, complete current probe and score. |
| 0:22 -- 0:38 | Stakeholder Communication | Primary question + 2-3 probes. Target 16 minutes. |
| 0:38 -- 0:52 | Handling Ambiguity | Primary question + 2-3 probes. Target 14 minutes. |
| 0:52 -- 1:00 | Candidate Questions | "What questions do you have for me?" Note specificity and depth of questions. Close: "We'll be in touch within 3 business days. Thank you for your time." |

**Clock management note:** Analytical Rigor is the must-have. Do not let this section compress the others -- if you are past 0:20 and still on Analytical Rigor, wrap up, score it, and move on. You need data on all three competencies.

---

### Candidate Question Period -- Assessment Notes

For a Senior Analyst, strong questions include: questions about the team's data stack and current analytical maturity, what decisions the team most wants to be able to answer that they cannot currently, what the biggest data quality challenges are, and how the role interfaces with product and engineering teams.

**Candidate Questions Asked:**
_______________________________________________
**Quality Assessment (informational only, not scored):**
_______________________________________________

---

### Interviewer Scorecard

| Competency | Must-Have? | Score (1-4) | Evidence Summary |
|------------|-----------|-------------|-----------------|
| Analytical Rigor | Yes | _____ | |
| Stakeholder Communication | No | _____ | |
| Handling Ambiguity | No | _____ | |

**Decision Logic:**
- Score 1 on Analytical Rigor = No Hire (must-have threshold not met)
- Score 2 on Analytical Rigor = Lean No Hire; requires explicit justification to advance
- Any score of 1 on Stakeholder Communication or Handling Ambiguity = note as a significant concern in rationale

**Overall Recommendation:**
- [ ] Strong Hire
- [ ] Hire
- [ ] Lean No Hire
- [ ] No Hire
- [ ] Strong No Hire

**Decision Rationale:**
[e.g., "Candidate met the Analytical Rigor bar -- Score 3. Provided a specific example of revising a retention cohort analysis after a product manager flagged an inconsistency in the denominator definition. She re-ran it, confirmed the error, and proactively sent a corrected version with a summary of what changed and why. Stakeholder Communication was Score 2 -- she described presenting to a VP but could not articulate what she adapted for that audience. Handling Ambiguity was Score 3 -- described decomposing a vague churn analysis request into three trackable sub-questions and checking back at 3-day intervals."]

**Top Strength:**
**Primary Concern:**
**Open Questions for Debrief:**

*Submit this scorecard within 30 minutes. Do not read other interviewers' scorecards before submitting.*

---

### Debrief Protocol

1. Hiring manager submits scorecard before debrief meeting.
2. Recruiter shares compiled score grid at the start of the debrief.
3. Recruiter (as facilitator) asks each interviewer to state scores and primary evidence before anyone comments on the overall decision.
4. Any Score 1 on Analytical Rigor triggers a no-hire decision with documentation.
5. Decision and rationale documented within 24 hours by recruiter.

---

### Topics to Avoid (Legal Compliance)

Do NOT ask about or follow up on any of the following:
- Age or year of graduation (unless directly relevant to credential verification with legal guidance)
- Marital or family status, plans for children, childcare arrangements
- National origin, citizenship, or native language
- Religious practices or holidays
- Disability status or medical history
- Arrest record

If the candidate volunteers information in any of these categories, do not follow up and do not record it in your notes.
