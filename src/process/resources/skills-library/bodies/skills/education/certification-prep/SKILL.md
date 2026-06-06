---
name: certification-prep
description: |
  Creates professional certification exam preparation plans with domain coverage, time allocation, practice resources, and study strategies calibrated to the specific certification's exam format and weighting.
  Use when a professional asks to prepare for a certification exam (PMP, AWS, CPA, CISSP, etc.), create a cert study plan, or strategize for a professional exam.
  Do NOT use for academic exam preparation (use `exam-prep-plan`), for general skill building (use `learning-path`), or for language proficiency exams (use `language-level-assessment`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills step-by-step guide"
  category: "education"
  subcategory: "professional-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Certification Prep

## When to Use

Use this skill when a user explicitly needs to prepare for a credentialed professional certification exam with a defined exam blueprint, pass/fail threshold, and official issuing body. Specific trigger scenarios include:

- A professional asks to build a study plan for a named certification: PMP, CAPM, PMI-ACP, AWS Solutions Architect, AWS SysOps, AWS Developer, Azure Administrator, GCP Professional, CPA, CFA Level I/II/III, CISSP, CISM, CEH, CompTIA Security+, CompTIA Network+, SHRM-CP, PHR, Six Sigma Green Belt, Six Sigma Black Belt, CCIE, CCNA, CCNP, CISA, CRISC, LEED AP, CMA, CFP, or equivalent
- A user has a specific exam date (or wants to set one) and needs to reverse-engineer a study schedule from that date
- A user completed a practice exam and needs to interpret their domain scores and adjust their remaining study time
- A user wants to understand exam format, domain weighting, question types, and scoring mechanics for a specific certification
- A user is returning to a certification after a failed attempt and needs a targeted gap-analysis approach
- A user needs help choosing between multiple certification tracks (e.g., AWS Developer vs. AWS SysOps vs. AWS Solutions Architect) based on their role and goals

**Do NOT use when:**

- The user is preparing for an academic course exam, midterm, or final (use `exam-prep-plan` -- that skill handles course syllabi and academic grading structures)
- The user wants general professional skill development without a defined certification exam at the end (use `learning-path` -- certifications are a subset of learning paths and require exam-specific calibration)
- The user is preparing for a language proficiency test such as TOEFL, IELTS, DELF, or JLPT (use `language-level-assessment` -- those exams measure linguistic competency, not professional domain knowledge)
- The user wants to evaluate which career path to pursue at a high level, without a specific certification in mind (use `career-planning`)
- The user is an instructor designing a certification prep course for students (use a curriculum-design skill -- this skill serves the learner, not the teacher)
- The user needs help with a skills portfolio or work-sample submission that accompanies a certification application (use `portfolio-builder`)

---

## Process

### Step 1: Identify the Certification and Confirm Exam Details

Before building anything, lock down the exact exam you are preparing for. Ambiguity at this stage creates wasted study effort.

- Ask the user for the full certification name, issuing body, and exam code if known (e.g., PMP from PMI, CPA from AICPA/NASBA, CISSP from ISC2, AWS SAA-C03 from Amazon Web Services)
- Confirm whether the user is preparing for an initial attempt or a retake after a failed exam -- retake strategy differs significantly from first-attempt strategy
- Verify the current published exam blueprint or "exam outline" document from the issuing body -- domain weights and question counts change when exams are updated; cite the version year if the user knows it
- Confirm the passing score threshold: some exams use a scaled score (CISSP: 700/1000, PMP: "Above Target/Target/Below Target" performance bands), others use a fixed percentage (CompTIA exams typically 720/900), and others use psychometric standards that are not disclosed as a simple percentage (CFA: approximately 65-70% estimated but not officially stated)
- Confirm exam format: number of questions, time limit, question types (multiple choice, multiple response, drag-and-drop, scenario-based, simulation/lab, essay, calculation), whether the exam is adaptive (like CISSP's CAT format: 125-175 questions, ends early if competency is established), and whether there is a penalty for wrong answers (most modern professional exams do not have negative marking -- confirm this)

### Step 2: Assess the User's Starting Point

Accurate self-assessment prevents over-studying material the user already knows and under-studying their actual weak domains.

- Ask the user to rate their confidence in each official exam domain on a 1-5 scale, where 1 = no exposure, 2 = heard of it but not practiced, 3 = some experience, 4 = comfortable, 5 = expert
- Ask about years of hands-on professional experience in the domain -- for experience-heavy exams like PMP (requires 36-60 months of project management experience) or CISSP (requires 5 years in two or more of the 8 domains), prior experience dramatically changes how much conceptual study is needed
- Ask whether the user has taken any practice exams yet, and if so, what their domain-level scores were -- domain-level breakdowns are far more useful than a single overall percentage
- Ask about previous formal training: bootcamps, vendor-authorized courses, university coursework, or official study materials already acquired
- Identify the user's learning style preference: reading-heavy (study guides, official documentation), practice-question-heavy (question banks, drilling), or hands-on-heavy (labs, simulations, real environments) -- this shapes resource selection
- Ask about the user's available weekly study hours with honest constraints (full-time job, family obligations, travel schedule)

### Step 3: Calculate the Study Window and Calibrate Weekly Hours

This step translates raw inputs into a mathematically grounded schedule with clear milestones.

- Determine the exam date or help the user select one: most professional certifications require 150-400 hours of total study for a first-time candidate with relevant experience; candidates without background experience should plan for 400-600+ hours
- Specific benchmarks by exam: PMP requires roughly 200-300 hours for a working project manager; CPA FAR section requires 150-200 hours alone; CISSP requires 250-350 hours for experienced security professionals; AWS Solutions Architect Associate requires 80-120 hours for a working cloud engineer; CFA Level I requires 300+ hours per the CFA Institute's own recommendation; CompTIA Security+ requires 40-80 hours for a network professional
- Calculate: Total hours needed -- hours of prior study/experience credit = remaining study hours required. Divide by available weeks to determine weekly hour commitment. If the weekly commitment exceeds 25 hours, recommend extending the exam date rather than cramming
- Build in three mandatory buffer periods: a diagnostic week at the start (practice exams and gap analysis before committing to a study sequence), a consolidation week in the final third (cumulative practice tests, not new material), and an exam-week taper (no new material, light review only, rest)
- For retake candidates: apply a minimum 4-week targeted gap plan regardless of prior total study hours -- the focus is exclusively on failed domains plus question-type strategy, not re-reading everything

### Step 4: Build the Domain-Weighted Study Sequence

The sequence order is not alphabetical or arbitrary -- it follows a weighted-priority algorithm that maximizes score impact per study hour.

- Pull the official domain weights from the exam blueprint. Calculate the number of questions each domain represents: multiply total exam questions by domain percentage. A domain worth 26% of a 180-question exam contributes approximately 47 questions -- each percentage point in that domain is worth roughly 1.8 questions on the actual exam
- Score each domain's priority using this formula: Priority Score = (Domain Weight × (5 -- User Confidence Rating)). A domain worth 30% where the user rates themselves a 2 gets a score of 30 × 3 = 90. A domain worth 10% where they rate themselves a 1 gets 10 × 4 = 40. Rank domains highest-to-lowest by priority score and study them in that order
- Do not study all domains sequentially for equal time -- allocate study hours proportionally to priority score, not domain weight alone. A high-weight domain where the user is already strong deserves maintenance review (roughly 20% of its proportional time), not full study allocation
- Build in spaced repetition cycles: after completing each domain block, revisit domains studied more than 2 weeks ago with a 20-question targeted quiz before moving forward
- For scenario-based exams (PMP, CISSP, SHRM): after completing content study for each domain, dedicate a full session to scenario interpretation -- these exams test judgment and methodology application, not memorization. The question is almost always "what should you do FIRST" or "what is the BEST response" -- wrong answers are often correct actions taken at the wrong time

### Step 5: Select Resources Matched to Exam Type

Generic study guides are not interchangeable -- different exam types require different resource mixes.

- **Official materials first:** Every exam preparation plan must include the official exam guide or reference book published or endorsed by the issuing body (e.g., the PMBOK Guide for PMP, the Official ISC2 CISSP Study Guide, the AICPA Blueprints for CPA, the CFA Institute Curriculum for CFA). These define what is testable; third-party materials that contradict official materials should be deprioritized
- **Question bank selection by volume:** For any exam over 100 questions, the candidate needs access to a question bank containing at least 1,000 unique practice questions. Repeating the same 300 questions inflates perceived readiness without genuine preparation. Reputable question banks exist for all major certifications -- the key quality markers are: questions written to the current exam version, detailed answer rationale (not just the correct answer), domain tagging for score tracking, and similarity to actual question difficulty level
- **Hands-on labs for IT and cloud certifications:** AWS, Azure, GCP, CompTIA, and Cisco exams require lab time -- reading about EC2 instance configuration does not substitute for configuring one. Plan for dedicated lab hours (approximately 30-40% of total study time for associate-level cloud exams, 50%+ for professional and specialty levels)
- **Flashcards for memorization-heavy certifications:** CFA formulas, CPA standards, CISSP cryptographic algorithm details, and Six Sigma formula sheets all benefit from active recall flashcard systems. Digital flashcard tools with spaced repetition scheduling are more efficient than static paper cards
- **Official mock exams vs. third-party practice exams:** Official mock exams (when the issuing body offers them) most closely replicate actual question style and difficulty. Always take at least one official mock exam as part of the final preparation phase. Third-party question banks are valuable for volume drilling but may vary in difficulty calibration

### Step 6: Set Practice Exam Milestones and Scoring Thresholds

Practice exam scores are diagnostic instruments, not confidence builders -- interpret them rigorously.

- Week 1 diagnostic exam: Establish a baseline. Score does not matter yet; domain-level breakdown matters entirely. Record each domain score and feed it back into the priority formula from Step 4
- Mid-point practice exam (midway through the study window): Expect to see 5-10 percentage point improvement in studied domains. If a domain studied in full shows less than 5-point improvement, the study method for that domain is not working -- switch from passive reading to active practice questions or a different resource
- Final practice exams (last 2 weeks before exam): Take 2-3 full-length timed practice exams under simulated conditions (no interruptions, no references, same time of day as the scheduled exam). Target a practice score of 10-15 percentage points above the passing threshold to account for exam-day performance variance
- Domain-level passing threshold for final practice: Any domain scoring more than 8 percentage points below the estimated domain passing threshold in the final 2 weeks needs targeted re-study, not general review
- For adaptive exams (CISSP CAT): standard percentage scores are less meaningful. Focus on whether you are consistently answering at or above the competency threshold across domains -- a CAT exam ends when the testing engine is 95% confident you are above or below passing competency

### Step 7: Build the Physical Study Schedule

Convert all prior analysis into a week-by-week, session-by-session calendar.

- Define sessions in terms of hours, not pages or chapters -- pages per hour varies widely by material density. A typical study session should be 60-90 minutes for content absorption and 30-45 minutes for practice questions, with no session exceeding 3 hours without a break
- Schedule practice question sessions at least 3 times per week regardless of where you are in the study sequence -- consistent exposure to question logic and timing is as important as content knowledge
- Designate one session per week as a "review and error analysis" session: go through every wrong answer from the week's practice questions, categorize the error type (knowledge gap, misread question, faulty reasoning, knowledge but wrong application), and update the domain confidence ratings accordingly
- Block the 3 days before the exam: Day 3 before -- final targeted review of the two lowest-scoring domains only. Day 2 before -- light flashcard review and rest. Day 1 before (exam eve) -- no studying, early sleep, logistics preparation (exam center location, required ID, check-in time)
- Include a contingency buffer of at least 1 week in the schedule: if illness, work pressure, or life events compress study time, the contingency week absorbs the disruption without forcing a choice between cramming and rescheduling

### Step 8: Define Success Criteria and Contingency Plan

A complete certification prep plan includes explicit decision rules for the exam day and beyond.

- Define the reschedule trigger: if the final two practice exams average more than 5 percentage points below the passing threshold, recommend rescheduling the exam rather than sitting it unprepared. Most certification bodies allow rescheduling with 24-72 hours notice without full fee forfeiture
- Define a post-exam analysis protocol for retakes: if the candidate does not pass, they should document all question topics they recall (immediately after the exam, before memory fades) and cross-reference against domain performance feedback the issuing body provides. CISSP, PMP, and CPA all provide domain-level performance indicators on score reports -- use these as the retake study guide
- Define a maintenance plan for after passing: most certifications require Continuing Education (CE) credits for renewal (CISSP: 120 CPEs per 3-year cycle; PMP: 60 PDUs per 3-year cycle; CFA charter: annual requirements through CFA Institute). Note the renewal timeline in the plan

---

## Output Format

```
## Certification Prep Plan: [Full Certification Name and Issuing Body]

**Certification:** [Full name] -- [Issuing body]
**Exam Code:** [e.g., SAA-C03, PMP-2021, FAR]
**Exam Format:** [N questions] | [Time limit] | [Question types] | [Passing score or band]
**Adaptive Exam:** [Yes/No -- if yes, note CAT mechanics]
**Application Requirements Met:** [Yes/No/In Progress]
**Exam Date:** [Target date or TBD with recommended range]
**Study Start Date:** [Date]
**Study Window:** [N weeks]
**Total Hours Available:** [N hours/week × N weeks = N total hours]
**Target Practice Score:** [Passing threshold + 10-15%]
**Retake Attempt:** [Yes/No -- if Yes, note failed domains from prior attempt]

---

### Candidate Profile

| Factor | Detail |
|--------|--------|
| Years of relevant experience | [N years] |
| Prior formal training | [Bootcamp / self-study / university course / none] |
| Learning style | [Reading / Practice questions / Hands-on labs / Mixed] |
| Current baseline score | [% from diagnostic exam or "No baseline yet"] |
| Availability | [N hours/week, specific days/times if relevant] |

---

### Exam Domain Breakdown and Priority Analysis

| Domain | Official Weight | Est. Questions | Confidence (1-5) | Priority Score | Study Hours Allocated | Priority Rank |
|--------|----------------|---------------|-----------------|---------------|----------------------|---------------|
| [Domain 1 name] | [X]% | [N] | [1-5] | [Weight × (5-Conf)] | [N hrs] | [1st/2nd/etc.] |
| [Domain 2 name] | [X]% | [N] | [1-5] | [Priority Score] | [N hrs] | |
| [Domain 3 name] | [X]% | [N] | [1-5] | [Priority Score] | [N hrs] | |
| [Domain 4 name] | [X]% | [N] | [1-5] | [Priority Score] | [N hrs] | |
| [Domain 5 name] | [X]% | [N] | [1-5] | [Priority Score] | [N hrs] | |
| **TOTAL** | **100%** | **[N]** | -- | -- | **[N hrs]** | -- |

---

### Resource Plan

| Resource Type | Specific Resource | Purpose | When to Use |
|--------------|-----------------|---------|-------------|
| Official guide | [Title + edition] | Content foundation | Weeks 1-[N] |
| Question bank | [Source name] | Volume drilling | Throughout |
| Practice exam | [Official or third-party source] | Milestone assessment | Weeks [N], [N], [N] |
| Hands-on lab | [Platform or tool] | Applied skill building | [Applicable weeks] |
| Flashcard system | [Tool or deck] | Memorization | Daily, 15 min |
| Supplemental guide | [Title + reason] | Gap coverage for [Domain] | Week [N] |

---

### Weekly Study Schedule

| Week | Phase | Primary Focus | Secondary Focus | Hours | Key Activity |
|------|-------|--------------|----------------|-------|-------------|
| 1 | Diagnostic | Full diagnostic practice exam | Domain gap analysis | [N] | Establish baseline; update priority scores |
| 2-[N] | Domain Study | [Highest priority domain] | Error review sessions | [N] | Study guide + 50 Qs per session |
| [N]-[N] | Domain Study | [Next priority domains] | Spaced review of prior domains | [N] | Study + 20-Q domain quizzes |
| [N]-[N] | Integration | Cumulative practice tests | Weak domain targeting | [N] | 2 full-length timed exams |
| [N] | Final Review | Lowest-scoring domains only | Flashcard reinforcement | [N] | No new material |
| Exam Week | Taper | Light review Day 3 only | Rest and logistics | [N] | Confirm exam logistics; sleep |

---

### Practice Exam Milestones and Decision Gates

| Milestone | Timing | Target Score | If Below Target | If At/Above Target |
|-----------|--------|-------------|----------------|-------------------|
| Diagnostic | Week 1 | N/A (baseline only) | Note all domain gaps | Confirm priority rankings |
| Mid-point check | Week [N] | Passing threshold | Reassess low domains; switch methods | Continue current plan |
| Pre-final exam 1 | Week [N-2] | Passing threshold + 8% | Extend study by 1 week if possible | Begin taper phase |
| Pre-final exam 2 | Week [N-1] | Passing threshold + 10% | Consider rescheduling | Proceed to exam |

---

### Exam Day Protocol

- Arrive at test center [30] minutes early (or log in [15] minutes early for remote proctored)
- Bring required ID(s): [list specific IDs per certification body requirements]
- Use any provided scratch paper or whiteboard immediately at exam start to dump memorized formulas/mnemonics
- Time budget per question: [Exam time limit] ÷ [Max questions] = [X] minutes per question -- flag and move on if exceeded
- For situational/judgment questions: eliminate answers that are reactive/reactive-without-analysis first; the "best" answer almost always addresses root cause and follows the exam's prescribed methodology

---

### Post-Pass Maintenance

**Certification validity:** [N years]
**Renewal requirement:** [N CE credits / PDUs / CPEs per cycle]
**Renewal cycle start date:** Exam pass date
**First renewal deadline:** [Date]

---

### Key Insights and Personalized Recommendations

1. [Specific finding about the candidate's profile and its implications]
2. [Specific finding about their highest-risk domain given weight + confidence gap]
3. [Specific recommendation for question-type strategy based on this exam's format]

### Next Steps (First 7 Days)
1. [Day 1 action: Acquire specific resources listed above]
2. [Day 2-3 action: Take diagnostic exam under timed conditions]
3. [Day 4-5 action: Score by domain and update priority table]
4. [Day 6-7 action: Begin Week 2 highest-priority domain study]
```

---

## Rules

1. **Never build a plan without the official exam blueprint domain weights.** Domain weights are the structural foundation of the entire plan. Using outdated or assumed weights produces a flawed schedule. If the user does not have the current blueprint, tell them exactly where to find it (the certification body's official candidate handbook or exam outline document) before proceeding.

2. **Use the Priority Score formula, not intuition, to sequence domains.** The formula (Domain Weight × (5 -- Confidence)) prevents the common mistake of over-studying comfortable domains and under-studying high-weight weak domains. Override the formula only when a domain is a prerequisite for understanding another domain.

3. **Calibrate total hour estimates to the specific exam, not a generic "study 2 hours a day" prescription.** CFA Level I requires more than 4× the hours of CompTIA A+. Giving a single generic study cadence to all certifications is a disservice. Use the benchmarks in Step 3 and adjust based on the candidate's experience level.

4. **Never recommend a study schedule that requires more than 25 hours per week without flagging it as unsustainable.** Cognitive overload beyond this threshold produces diminishing returns. If the math demands more than 25 hours/week, the correct prescription is to push the exam date, not to schedule 30+ hours of study per week.

5. **Practice exam scores must be interpreted at the domain level, not the total score level.** A 75% overall practice score that hides a 52% in a 25-weight domain is a failing candidate who does not know it yet. Always analyze domain breakdowns in every practice milestone review.

6. **Scenario-based and situational judgment exams require dedicated answer strategy training, not just content mastery.** PMP, CISSP, SHRM, and similar exams specifically test how candidates choose between multiple technically correct answers. Students who study only content often fail because they do not understand the exam's decision-making framework (e.g., "what would PMI recommend" vs. "what would you do in real life").

7. **Do not recommend rescheduling lightly, but do recommend it clearly when final practice scores are more than 5 points below passing.** Sitting an exam unprepared wastes exam fees (PMP: $555 for PMI members, $405 for re-examination; CISSP: $749; CPA sections: $200-$300 each), waiting periods (some exams enforce 30-90 day wait between attempts), and psychological confidence. The reschedule rule in the Decision Gates table is not optional guidance -- it is a concrete decision rule.

8. **For IT and cloud certifications, lab hours are not optional.** A candidate who reads AWS documentation without hands-on lab time routinely fails performance-based questions and scenario questions that require operational knowledge. Flag any IT/cloud plan that allocates less than 25% of total hours to labs as underweighted in this area.

9. **Resource selection must match the current exam version.** Certifications update their exams every 2-5 years. A study guide written for PMP 5th edition PMBOK is actively harmful for a candidate taking the current PMP exam (based on PMBOK 7th edition + Agile Practice Guide). Always confirm the study guide edition matches the current exam code before recommending it.

10. **The plan must be personalized to the candidate's domain confidence ratings -- never produce a generic plan.** Two candidates sitting the same CISSP exam with different backgrounds (one a network engineer, one an application developer) need different domain sequences, different resource emphases, and different hour allocations. A plan that could apply to any CISSP candidate without modification is not following this skill.

---

## Edge Cases

**The user is preparing for an adaptive computer-based exam (e.g., CISSP CAT, NCLEX-RN):**
Adaptive exams do not behave like fixed-length exams. The test ends when the algorithm determines with 95% confidence that the candidate is above or below the passing standard. For CISSP CAT, this means the exam can end at 100 questions (the minimum) or continue to 175. Candidates should not interpret a short exam as failure, nor a long exam as certain failure. The study strategy remains domain-weighted, but the practice exam strategy must shift: track consistency of performance within each domain rather than total exam percentage. The candidate needs to maintain performance above threshold across all domains -- a catastrophic weak domain cannot be averaged away by strong domains in an adaptive format.

**The user failed the exam within the past 6 months and is preparing for a retake:**
Do not rebuild a generic plan from scratch. Instead: (1) Obtain the score report with domain-level feedback -- most certification bodies provide performance indicators such as "Above Passing Standard / Near Passing Standard / Below Passing Standard" per domain. (2) Apply a modified priority formula that doubles the weight of "Below Passing Standard" domains. (3) Do not revisit "Above Passing Standard" domains in depth -- a single review session per above-standard domain is sufficient to maintain knowledge. (4) Conduct a question-type audit: the failure may be content-based (wrong knowledge) or strategic (correct knowledge applied incorrectly under exam conditions). If the candidate reports answering quickly and finishing early, the failure is likely strategic, not knowledge-based.

**The user has less than 4 weeks until their exam date:**
A compressed timeline forces triage, not comprehensive coverage. (1) Immediately take a full diagnostic practice exam. (2) Identify all domains scoring above the passing threshold -- eliminate these from active study and replace with 2-3 maintenance questions per day. (3) Focus 80% of remaining time on the 2-3 highest-weight domains currently below passing. (4) Abandon trying to achieve full content mastery in weak domains -- focus on high-probability question topics within those domains. (5) If the diagnostic score is more than 15 percentage points below passing with less than 4 weeks remaining, recommend rescheduling clearly and explain the cost calculation.

**The user is preparing for a certification that requires experience verification in addition to passing the exam:**
Some certifications (CISSP requires an ISC2-approved sponsor and 5 years of experience; PMP requires documented project hours; CFA requires 4,000 hours of investment decision-making experience) have experience requirements that must be met before the credential is awarded even after passing. Confirm application eligibility before building any study plan. It is demoralizing and wasteful to pass the exam and then discover the experience requirement cannot be met. For candidates who are close to meeting experience requirements, calibrate the exam date to allow the experience to be documented before or immediately after passing.

**The user is preparing for multiple certifications in sequence (e.g., AWS Cloud Practitioner followed by AWS Solutions Architect Associate):**
Overlapping domain coverage creates an opportunity for knowledge stacking: material studied for the foundational cert reinforces the advanced cert. Identify shared domains between certifications and note which topics require deepening vs. which are already covered. Build a combined resource plan that avoids redundant re-reading. The sequencing rule: always pass and hold the lower-level cert before attempting the advanced cert, as lower-level content is assumed knowledge on advanced exams, not re-tested material.

**The exam uses a scoring method the user does not understand (e.g., CPA scaled scoring, CFA minimum passing score bands, or PMP "Above Target/Target/Below Target" performance bands):**
Many candidates interpret their score reports incorrectly. CPA exams are scored on a scale of 0-99 with a passing score of 75 -- this is not a percentage. A score of 75 does not mean 75% of questions answered correctly; it means the weighted combination of MCQ and task-based simulation performance converted to the scoring scale reached 75. CFA does not publish a numeric passing score; candidates receive "pass" or "fail" with topic-area performance indicators. Explain the specific scoring mechanics for the candidate's exam before they interpret any practice exam results, and explain what information the official score report will and will not provide.

**The user has no prior professional experience in the certification domain and is studying entirely from scratch:**
Adjust total hour estimates upward by 40-60% from the experience-based benchmarks. For experience-heavy exams like PMP and CISSP, which test applied judgment rather than textbook recall, this is a significant disadvantage that cannot be overcome by reading volume alone. Recommend the user seek experience-bridging resources: for PMP, a formal project management course approved by PMI; for CISSP, a structured boot camp or mentor relationship with an existing CISSP holder. For knowledge-only exams like CompTIA A+ or CFA Level I, the experience gap is less severe but study time should still be increased.

---

## Example

**Input:** "I want to pass the PMP exam in 10 weeks. I'm a working project manager with 6 years of experience, mostly in waterfall projects. I've never studied for the PMP before. I work full-time and can study about 12-15 hours per week. I haven't taken any practice exams yet."

**Output:**

---

## Certification Prep Plan: Project Management Professional (PMP)

**Certification:** Project Management Professional (PMP) -- Project Management Institute (PMI)
**Exam Code:** PMP (current version aligned to PMBOK 7th edition + Agile Practice Guide, 2021 Exam Content Outline)
**Exam Format:** 180 questions | 230 minutes | Multiple choice, multiple response, matching, hotspot, limited fill-in | "Above Target / Target / Below Target / Needs Improvement" performance bands per domain (no numeric score) | Passing = sufficient "At or Above Target" performance across all three domains
**Adaptive Exam:** No -- fixed 180 questions with two 10-minute optional breaks
**Application Requirements Met:** Confirm before scheduling -- requires 36 months of project leadership experience (non-degree) or 24 months (4-year degree), plus 35 hours of formal PM education. If education hours are not yet met, a PMI-approved training course must be completed before the exam date.
**Exam Date:** Target -- 10 weeks from study start
**Study Start Date:** [User-defined]
**Study Window:** 10 weeks
**Total Hours Available:** 12-15 hours/week × 10 weeks = 120-150 hours total
**Target Practice Score:** Domain performance in "At Target or Above" in all three domains on final practice exam
**Retake Attempt:** No (first attempt)

---

### Candidate Profile

| Factor | Detail |
|--------|--------|
| Years of relevant experience | 6 years as working project manager |
| Prior formal training | None confirmed -- must verify 35-hour education requirement |
| Learning style | To be determined (recommend mixed: reading + heavy scenario question drilling) |
| Current baseline score | No baseline yet -- diagnostic exam is first study action |
| Availability | 12-15 hours/week; assume 2-hour sessions on weekday evenings + 4-5 hours on weekends |

**Important pre-study action:** Confirm the 35-contact-hour requirement is satisfied. If not, enroll in a PMI-approved PMP prep course (typically 35 hours, available online) before the exam can be applied for. The course content can double as study material.

---

### Exam Domain Breakdown and Priority Analysis

The PMP Exam Content Outline (ECO) divides the exam into three domains:

| Domain | Official Weight | Est. Questions | Confidence (1-5) | Priority Score | Study Hours Allocated | Priority Rank |
|--------|----------------|---------------|-----------------|---------------|----------------------|---------------|
| People (Leading and managing the project team) | 42% | ~76 | 3 (waterfall PM, some team management) | 42 × (5-3) = **84** | 38 hours | **1st** |
| Process (Managing the technical aspects of the project) | 50% | ~90 | 4 (strong waterfall, weak agile) | 50 × (5-4) = **50** | 48 hours | **2nd** |
| Business Environment (Connecting projects to org strategy) | 8% | ~14 | 2 (limited exposure) | 8 × (5-2) = **24** | 14 hours | **3rd** |
| **TOTAL** | **100%** | **180** | -- | -- | **100 hours** | -- |

**Remaining 20-50 hours:** Practice exams, error analysis sessions, final review, and diagnostic week.

**Key insight:** Process domain carries the most questions (50%) but the candidate has reasonable waterfall experience. The critical gap is within Process: agile/hybrid delivery approaches now represent approximately 50% of PMP exam questions. A waterfall-experienced PM who does not study Scrum, Kanban, SAFe, and hybrid approaches will likely fail Process despite strong classical PM knowledge. People domain is weighted heavily and tests interpersonal judgment -- this requires scenario drilling, not memorization.

---

### Resource Plan

| Resource Type | Specific Resource | Purpose | When to Use |
|--------------|-----------------|---------|-------------|
| Official guide | PMBOK Guide 7th Edition + Agile Practice Guide (both free with PMI membership) | Content foundation for all three domains | Weeks 1-6 |
| Official guide supplement | "PMP Exam Prep" by Andrew Ramdayal (TIA Masterclass) or Rita Mulcahy's PMP Exam Prep 10th edition | Structured domain coverage + practice questions | Weeks 1-7 |
| Question bank | PM PrepCast Exam Simulator (1,800+ current-version questions with domain tagging) | Volume drilling, scenario practice | Weeks 2-10 |
| Official practice exam | PMI's official PMP practice exam (available through PMI.org after application approval) | Final calibration closest to real exam style | Week 9 |
| Agile supplement | Agile Practice Guide (free with PMI membership) + review of Scrum Guide (free) | Covers ~50% of exam's agile/hybrid content | Weeks 3-5 |
| Flashcard system | Anki deck focused on PMI process terminology, People domain conflict resolution approaches, and Business Environment governance concepts | Memorization of high-frequency testable terms | Daily, 15-20 minutes |

---

### Weekly Study Schedule

| Week | Phase | Primary Focus | Secondary Focus | Hours | Key Activity |
|------|-------|--------------|----------------|-------|-------------|
| 1 | Diagnostic | Full 180-question timed practice exam | Domain score analysis | 12-14 | Complete diagnostic under real conditions; map scores to three domains; update priority table |
| 2-3 | Domain Study | People domain -- leadership styles, conflict resolution, team development, motivation theories (Maslow, Herzberg, McGregor), virtual team management | Agile team roles (Scrum Master, Product Owner) | 13-15 | Read PMBOK 7 stewardship/leadership content + 50 People domain practice questions per session |
| 4-5 | Domain Study | Process domain: Agile/hybrid delivery -- Scrum ceremonies, sprint planning, backlog management, Kanban WIP limits, hybrid waterfall-agile transitions | Review People domain (20-Q quiz, 20 minutes) | 13-15 | Agile Practice Guide + Scrum Guide study; 50 scenario-based process questions per session |
| 6 | Domain Study | Process domain: Classical PM processes -- initiating, planning, executing, monitoring/controlling, closing; earned value management (EVM) calculations | Business Environment overview | 12-14 | EVM practice calculations; PMBOK 7 performance domains review |
| 7 | Domain Study | Business Environment -- organizational governance, benefits realization, compliance, project vs. program vs. portfolio | Spaced review: People + Agile process | 12-14 | 30 Business Environment questions + first full-length timed practice exam (milestone) |
| 8 | Integration | Full-length practice exam + error analysis | Targeted review of lowest domain | 13-15 | Take exam, score by domain, dedicate 50% of remaining hours to lowest-scoring domain |
| 9 | Final Review | Official PMI practice exam + scenario judgment review | Light flashcard reinforcement | 12-14 | Official exam + review all wrong answers; final agile concept check |
| 10 | Taper | Days 1-3: Targeted review of two weakest question types only | Days 4-6: Rest, logistics, light review | 8-10 | No new material; exam-day logistics confirmed; early sleep nights before exam |

---

### Practice Exam Milestones and Decision Gates

| Milestone | Timing | Target | If Below Target | If At/Above Target |
|-----------|--------|--------|----------------|-------------------|
| Diagnostic | Week 1 | Baseline only -- record domain breakdown | No action yet; use results to confirm priority sequence | Confirm priority rankings match the formula |
| Mid-point practice exam | Week 7 | "At Target" in at least 2 of 3 domains on third-party exam simulator | Identify which domain is still "Below Target"; increase study hours for that domain in weeks 8-9 | Begin integration phase on schedule |
| Pre-final practice exam 1 | Week 8 | "At or Above Target" in all 3 domains | Extend study by 1 week if exam date allows; focus exclusively on failing domain | Proceed to taper phase |
| Official PMI practice exam | Week 9 | Strong performance across all domains | Seriously consider rescheduling exam by 2-3 weeks | Proceed to exam with confidence |

**Reschedule rule:** If Week 8 full-length practice shows "Below Target" or "Needs Improvement" in Process or People domain, recommend rescheduling the exam. The PMP re-examination fee is $150 for PMI members. Rescheduling by 3-4 weeks costs less than the psychological and financial cost of failing.

---

### PMP-Specific Scenario Strategy

The PMP exam tests "what PMI recommends you do" -- not "what an experienced PM would instinctively do." This distinction causes high failure rates among experienced PMs who trust their instincts over methodology.

**Decision rules for situational questions:**

1. When asked "what should you do FIRST" -- almost always: consult the project management plan, communicate with the stakeholder, or assess the situation before acting. Never skip the analysis step.
2. When choosing between escalating to a sponsor vs. managing the issue yourself -- PMs manage within their authority; only escalate what cannot be resolved at the PM level.
3. When an agile question appears: identify whether the scenario is in a Scrum, Kanban, or hybrid context. The correct answer almost always empowers the team, removes impediments, or protects the sprint rather than directing work from above.
4. Wrong answers in PMP often describe technically correct actions taken in the wrong order or the wrong role's responsibility. Eliminate answers that have the PM doing a team member's work, or the team member making governance decisions.
5. Memorize this PMI value hierarchy: People > Process > Tools. An answer that addresses the human/communication dimension of a problem is almost always preferred over a purely technical solution.

---

### Exam Day Protocol

- Arrive at the Pearson VUE test center 30 minutes early; for online proctored, log in 15 minutes early
- Required ID: Government-issued photo ID matching the name on your PMI account exactly
- At exam start, use the whiteboard/scratch paper to immediately write: EVM formulas (EV-PV=SV, EV-AC=CV, EV/PV=SPI, EV/AC=CPI, BAC/CPI=EAC), key Scrum roles and ceremony names, and the PMI process group sequence
- Time budget: 230 minutes ÷ 180 questions = approximately 76 seconds per question. Flag questions you spend more than 90 seconds on; return to them after completing all other questions
- Two optional 10-minute breaks are available: take at least one. Mental fatigue is a real factor on a 230-minute exam
- For "select all that apply" questions: do not look for a pattern. Each option is independently correct or incorrect. These questions are often the hardest -- budget 90-120 seconds

---

### Post-Pass Maintenance

**Certification validity:** 3 years from exam pass date
**Renewal requirement:** 60 Professional Development Units (PDUs) per 3-year cycle
**PDU breakdown required:** Minimum 35 PDUs in "Education" category; maximum 25 in "Giving Back to the Profession" category
**Renewal cycle start date:** Day of exam pass
**First renewal deadline:** 3 years from pass date
**PDU tracking:** Log PDUs at PMI's Continuing Certification Requirements System (CCRS) portal
**Early action:** Join a local PMI chapter -- chapter activities, webinars, and volunteer roles generate PDUs at low cost

---

### Key Insights and Personalized Recommendations

1. **The agile knowledge gap is the highest exam risk.** With 6 years of waterfall experience, this candidate likely scores well on classical PM process questions but faces approximately 50% of questions touching agile or hybrid delivery approaches they have not practiced. Weeks 4-5 are the most critical weeks in this entire plan.
2. **Experience creates overconfidence in scenario questions.** Experienced PMs routinely choose answers based on what they would actually do in their workplace -- which differs from what PMI considers correct. Every scenario question practice session must be followed by reading the rationale for the correct answer even when the candidate got it right, to reinforce PMI's decision framework vs. real-world practice.
3. **The People domain (42%) is won through volume scenario practice, not reading.** There are no formulas to memorize in the People domain. Every point in People comes from interpreting situational judgment correctly. The recommendation is to complete at least 400 People domain practice questions before the exam, reviewing every answer rationale.

### Next Steps (First 7 Days)
1. **Day 1:** Confirm PMI membership status and verify 35-contact-hour education requirement is met; if not, enroll in a PMI-approved online prep course immediately
2. **Day 1-2:** Acquire PMBOK 7 and Agile Practice Guide (free download with PMI membership at $139/year -- cost is recovered in the free study materials alone)
3. **Day 2-3:** Set up PM PrepCast Exam Simulator account; configure for "full exam, mixed domains, 180 questions, 230 minutes"
4. **Day 3-4:** Take the full diagnostic practice exam under timed, uninterrupted conditions -- treat it as the real exam
5. **Day 5:** Score the diagnostic by domain; plug scores into the priority table above and confirm the study sequence
6. **Day 6-7:** Begin Week 2 People domain study with PMBOK 7 Chapter 2 (team performance) and the leadership/conflict resolution content from your selected study guide
