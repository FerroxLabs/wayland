---
name: hire-employee
description: |
  Guides the user through a complete hiring process from job description
  creation through candidate sourcing, interviewing, evaluation, offer
  extension, and onboarding. Use when the user needs to hire for a specific
  role and wants a structured process covering every stage from defining
  the position to the new hire's first week.
  Do NOT use for freelance or contractor hiring (use start-freelancing
  workflow), for career-side interview preparation (use interview prep
  skills), or for organizational headcount planning (use business planning
  skills directly).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "template guide planning step-by-step"
  category: "business-operations"
  depends: "job-description cold-outreach-sequence interview-guide performance-review offer-letter onboarding-plan"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Hire an Employee

A six-step workflow that covers the complete hiring pipeline from job description creation through candidate sourcing, structured interviewing, candidate evaluation, offer extension, and onboarding. Each step produces documentation that creates a fair, consistent, and legally defensible hiring process.

**Estimated time:** 4-12 weeks (depending on role seniority, market competitiveness, and pipeline volume)

## When to Use

- User needs to hire for a specific open role and wants a structured process
- User is a hiring manager creating a hiring pipeline for the first time
- User wants to ensure a fair and consistent evaluation process across multiple candidates
- User is a founder making their first hire and needs guidance on each stage
- Do NOT use when: the user is hiring a freelancer or contractor (different legal and process requirements), when the user is preparing for interviews as a candidate (use interview prep skills), or for strategic headcount planning without an open role (use business planning skills)

## Prerequisites

Before starting this workflow, ensure:

1. **Approved headcount:** The role has been approved and budgeted. The user knows the salary range, reporting structure, and start date expectations.
2. **Role clarity:** The user has a general understanding of what the role does, even if the specific requirements are not yet documented. "We need a frontend developer" is enough to start; Step 1 will refine the details.
3. **Interview panel availability:** The people who will participate in interviews (hiring manager, team members, stakeholders) have committed time in their calendars for the hiring process timeline.
4. **Legal compliance awareness:** The user is aware of employment laws relevant to their jurisdiction (equal opportunity, ban-the-box, salary history restrictions). This workflow produces compliant documentation but does not substitute for legal counsel.

## Steps

**Step 1: Create Job Description** (uses: job-description)

Write a clear, compelling job description that attracts qualified candidates and sets accurate expectations. The job description is both a recruitment marketing document and a legal document.

- Input: Role title, team context, core responsibilities, required qualifications, salary range, and company information
- Output: A complete job description containing: role title and reporting structure, 5-8 specific responsibilities prioritized by importance, required qualifications separated from preferred qualifications, salary range and benefits summary, company description and team culture, and clear instructions for how to apply
- Key focus: Separate "required" from "preferred" qualifications rigorously. Research shows that underrepresented candidates are less likely to apply when they do not meet 100% of listed requirements. List only genuinely required qualifications as required. Move aspirational qualifications to "preferred" or "nice to have."

**Step 2: Source Candidates** (uses: cold-outreach-sequence)

Build a candidate pipeline through active sourcing (outreach to passive candidates) and inbound applications. Relying solely on inbound applications limits the pipeline to active job seekers, missing the strongest passive candidates.

- Input: Job description from Step 1, target candidate profile (industries, companies, experience levels to source from), and available sourcing channels (job boards, LinkedIn, referrals, recruiting agencies)
- Output: A sourcing plan containing: outreach message templates for cold contact with passive candidates (personalized by candidate background), a channel strategy listing where to post the job and where to actively source, a referral program framework for leveraging employee networks, initial candidate pipeline with response tracking, and a pipeline volume target (typically 3-5 qualified candidates per open role for final interviews)
- Key focus: Outreach messages must reference specific details about the candidate's background -- generic messages receive response rates below 5%. Personalized messages referencing a candidate's specific project, publication, or career trajectory receive response rates of 15-25%. Invest in personalization over volume.

**Step 3: Conduct Structured Interviews** (uses: interview-guide)

Design and execute a structured interview process that evaluates candidates consistently against the same criteria. Structured interviews are the single highest-validity selection method available.

- Input: Job description requirements from Step 1, candidate profiles from Step 2 pipeline, and the interview panel members and their availability
- Output: A structured interview guide containing: interview stages (phone screen, technical assessment, behavioral interview, team fit, final round) with time allocation and interviewer assignments, standardized questions tied to specific job requirements (each question maps to a required qualification), evaluation rubric with a numerical scoring system (1-5 scale per competency), interviewer calibration notes (what a "3" vs "5" answer looks like for each question), and a post-interview feedback template for each interviewer
- Key focus: Every interviewer must evaluate the same competencies using the same scoring rubric. When interviewers ask different questions and use different criteria, the hiring decision becomes a popularity contest rather than a skills assessment. Calibrate the interview panel before the first candidate interview by reviewing what strong, adequate, and weak answers look like for each question.

**Step 4: Evaluate Candidates** (uses: performance-review)

Systematically compare candidates against the evaluation criteria and make a data-driven hiring decision. The evaluation framework prevents both recency bias (favoring the last candidate interviewed) and halo effect bias (letting one strong answer overshadow weak areas).

- Input: Completed interview scorecards from Step 3 for all candidates, reference check results (if conducted), any work samples or assessment results, and the evaluation rubric from Step 3
- Output: A candidate evaluation matrix containing: aggregated scores for each candidate across all competencies, strengths and gaps per candidate tied to specific interview evidence, a stack-ranked candidate list with justification for the ranking, recommendation for the top candidate with supporting data, and a backup candidate recommendation in case the top choice declines
- Key focus: The evaluation matrix must be evidence-based. Each strength or gap cited must reference a specific interview answer, work sample, or reference check data point. "She seemed really smart" is not evidence. "She identified the performance bottleneck in the system design question within 2 minutes and proposed an indexing solution that matched our production approach" is evidence.

**Step 5: Extend Offer** (uses: offer-letter)

Draft and extend a competitive offer that the top candidate is likely to accept. The offer letter formalizes the employment terms and is often the candidate's first official document from the company.

- Input: Top candidate recommendation from Step 4, approved salary range and benefits package, start date target, and any special terms (signing bonus, equity, remote work arrangements, relocation assistance)
- Output: A complete offer package containing: formal offer letter with role title, compensation, start date, and reporting structure, benefits summary document, equity or bonus details (if applicable), response deadline (typically 5-7 business days), and a verbal offer script for the hiring manager to use before sending the written offer
- Key focus: The verbal offer should come before the written offer. A call from the hiring manager expressing excitement about the candidate's fit is more compelling than a cold email with an attached PDF. During the verbal offer, ask if the candidate has any concerns or competing offers that need to be addressed. Adjust the written offer based on this conversation when possible.

**Step 6: Onboard the New Hire** (uses: onboarding-plan)

Design and execute a structured onboarding experience that gets the new hire productive quickly and integrated into the team. Poor onboarding is the leading cause of early-stage employee turnover.

- Input: Offer acceptance confirmation, start date, role requirements from Step 1, team information, and any pre-boarding logistics (equipment, accounts, workspace)
- Output: A structured onboarding plan containing: pre-start checklist (equipment ordered, accounts created, team introduction email sent, first-week schedule shared), day 1 agenda (orientation, team introductions, workspace setup, initial context briefing), week 1 plan (role-specific training, key stakeholder meetings, first small deliverable), 30-60-90 day goals with clear milestones and check-in dates, and a feedback loop (weekly 1:1s for the first month, monthly thereafter)
- Key focus: The first 90 days determine whether the new hire stays long-term. Front-load relationship building and context transfer in week 1. Assign a peer buddy (not the manager) who the new hire can ask "dumb questions" without feeling judged. Define a small, achievable first deliverable that gives the new hire an early win within the first 2 weeks.

## Output Format

```
## Hiring Pipeline: [Role Title]

### Job Description
- **Title:** [role title]
- **Team:** [team name] reporting to [manager]
- **Salary Range:** [min]-[max] [currency]
- **Required Qualifications:** [count] listed
- **Location:** [on-site/remote/hybrid]
- **Posted to:** [channels list]

### Sourcing Pipeline
- **Total Candidates Sourced:** [count]
- **Channels:**
  | Channel              | Candidates | Response Rate |
  |---------------------|------------|---------------|
  | [channel 1]         | [count]    | [rate]        |
  | [channel 2]         | [count]    | [rate]        |
- **Referral Program:** [active/inactive]
- **Pipeline Target:** [count] qualified candidates for final round

### Interview Process
- **Stages:** [count] rounds
  1. [stage name] -- [duration] -- [interviewer]
  2. [stage name] -- [duration] -- [interviewer]
- **Questions per Competency:** [count per competency]
- **Scoring Rubric:** 1-5 scale, [count] competencies evaluated

### Candidate Evaluation
| Candidate     | Technical | Behavioral | Culture | Overall | Rank |
|---------------|-----------|------------|---------|---------|------|
| [name/ID]     | [score]   | [score]    | [score] | [avg]   | 1    |
| [name/ID]     | [score]   | [score]    | [score] | [avg]   | 2    |

- **Top Recommendation:** [candidate] -- [key evidence supporting selection]
- **Backup Candidate:** [candidate]

### Offer
- **Compensation:** [salary + equity/bonus details]
- **Start Date:** [date]
- **Response Deadline:** [date]
- **Verbal Offer:** [completed/pending]
- **Written Offer:** [sent/pending]
- **Status:** [accepted/pending/declined]

### Onboarding Plan
- **Pre-start Checklist:** [X/Y] items complete
- **Day 1 Agenda:** [scheduled/draft]
- **30-60-90 Day Goals:** [defined/pending]
- **Buddy Assigned:** [name]
```

## Decision Points

- **Before Step 1 (technical vs non-technical role):** Technical roles require a skills assessment or coding challenge in Step 3. Add a take-home assessment or live coding round to the interview process. Non-technical roles rely more heavily on behavioral interview questions and work sample reviews.
- **After Step 1 (remote vs in-office):** Remote roles require sourcing in Step 2 to cover a wider geographic area and the interview process in Step 3 to be fully virtual. Onboarding in Step 6 requires a dedicated remote onboarding plan with virtual team-building activities and asynchronous documentation instead of in-person shadow sessions.
- **After Step 2 (senior vs junior):** Senior hires typically come from passive sourcing (Step 2 outreach emphasis). Junior hires typically come from inbound applications (Step 2 job board emphasis). The interview process in Step 3 also differs: senior candidates get shorter, more strategic interviews; junior candidates get more skills-focused assessments.
- **After Step 3 (internal promotion vs external hire):** If an internal candidate emerges, adjust the evaluation in Step 4 to account for institutional knowledge and proven track record. Internal candidates have lower onboarding cost (Step 6) but may require backfill planning for their current role.
- **After Step 4:** If the top two candidates are within 5% of each other on the evaluation matrix, use a tiebreaker criterion aligned with the team's most critical current need (speed to productivity, specific technical skill, or leadership potential).

## Failure Handling

- **Step 2 fails (insufficient pipeline):** If sourcing produces fewer than 3 qualified candidates after 3 weeks, the problem is usually in Step 1 (job description too restrictive or compensation below market). Review the required qualifications and salary range. Consider removing 1-2 requirements or increasing the salary range by 10-15%. Expand sourcing channels to include recruiting agencies if budget allows.

- **Step 3 reveals misaligned expectations:** If multiple strong candidates fail the interview on the same question or competency, the job description requirements may not match the market reality. Return to Step 1 and recalibrate the role requirements. Do not lower the bar -- instead, redefine the bar to match what strong candidates in this market actually look like.

- **Step 4 produces no clear winner:** If all candidates score below the "strong hire" threshold, do not settle for the "least bad" option. Extend the sourcing timeline and return to Step 2 with refined targeting. A mediocre hire costs more than an extended vacancy -- the wrong person in the role requires re-hiring in 6-12 months with doubled cost.

- **Step 5 fails (offer rejected):** If the top candidate declines the offer, immediately assess why. If compensation was the issue, evaluate whether the budget can increase. If the role or company was the issue, that feedback improves Step 1 for the next attempt. Move to the backup candidate from Step 4 within 48 hours -- delay signals disinterest. If the backup is not strong enough, return to Step 2 for additional sourcing.

- **Step 6 reveals poor hire fit (first 30 days):** If the new hire struggles significantly in the first 30 days despite following the onboarding plan, schedule a candid conversation to identify the gap. The gap may be in the onboarding (missing context, unclear expectations) rather than the hire. Adjust the 30-60-90 plan. If the gap is fundamental (misrepresented skills, cultural misalignment), begin documenting performance concerns and prepare contingency sourcing.

- **User wants to change direction mid-workflow (role redefined):** If the role requirements change after Step 3 has begun, all existing candidate evaluations are invalid against the new requirements. Restart from Step 1 with the revised role. Communicate the change transparently to candidates already in the pipeline -- ghosting candidates damages the company's employer brand.

## Expected Outcome

When this workflow is complete, the user will have:

1. A well-defined job description that attracts qualified candidates
2. A candidate pipeline built through multiple sourcing channels
3. A structured interview process with consistent evaluation criteria
4. An evidence-based hiring decision with documented justification
5. An accepted offer with competitive compensation terms
6. A 30-60-90 day onboarding plan that sets the new hire up for success
7. Documentation for the entire process that can be reused for future hires

## Edge Cases

- **User is making their first-ever hire.** Add a sub-step before Step 1 covering employer setup: employment identification number, payroll system, employment agreement template, and required postings. First-time employers often underestimate the administrative prerequisites.
- **Hiring for a role that does not exist at the company yet.** Step 1 requires extra attention to defining the role boundaries. Interview other companies that have this role to understand typical responsibilities and qualifications. The evaluation in Step 4 should weight potential and adaptability more heavily than specific experience.
- **Urgent hire needed in under 2 weeks.** Compress the process: combine Steps 1-2 into a single day (use existing job description templates and activate referral networks immediately), limit Step 3 to 2 interview rounds (phone screen + final), and run Steps 5-6 in parallel (draft offer while planning onboarding). Accept higher risk in exchange for speed.
- **Candidate requests significant negotiation on terms.** In Step 5, if the candidate counters beyond the approved range, prepare a total compensation comparison showing the full package (salary + equity + benefits + growth trajectory). If the gap remains, evaluate whether the candidate justifies an exception. Document the exception rationale for internal equity consistency.
- **Hiring manager and team disagree on the top candidate.** In Step 4, separate the disagreement into specific competency scores. If the hiring manager favors candidate A on leadership and the team favors candidate B on technical skills, the tiebreaker is which competency is more critical for the role's first-year goals. Document the reasoning transparently.
- **Internal referral is a strong candidate.** Process the referral through the same interview pipeline as external candidates to ensure fairness. Skip Step 2 sourcing for this candidate but do not skip Steps 3-4 evaluation. Document the referral relationship for transparency. Pay the referral bonus only after the standard evaluation process confirms the hire.

## Example

**Input:** "We are a 20-person startup and need to hire a senior frontend engineer. The role is remote, salary range is $140K-$170K, and we need someone to start within 8 weeks. The team currently has 3 frontend engineers."

**Output:**

## Hiring Pipeline: Senior Frontend Engineer

### Job Description
- **Title:** Senior Frontend Engineer
- **Team:** Product Engineering, reporting to VP Engineering
- **Salary Range:** $140,000-$170,000 USD
- **Required Qualifications:** 5 listed (5+ years frontend, React/TypeScript proficiency, system design experience, mentorship track record, remote collaboration skills)
- **Location:** Remote (US time zones)
- **Posted to:** LinkedIn, Hacker News, React/TypeScript communities, company careers page

### Sourcing Pipeline
- **Total Candidates Sourced:** 47
- **Channels:**
  | Channel              | Candidates | Response Rate |
  |---------------------|------------|---------------|
  | LinkedIn outreach    | 28         | 18%           |
  | Inbound applications | 12         | n/a           |
  | Employee referrals   | 7          | n/a           |
- **Referral Program:** Active ($3,000 bonus after 90-day retention)
- **Pipeline Target:** 5 candidates for final round

### Interview Process
- **Stages:** 4 rounds
  1. Phone screen -- 30 min -- Recruiter
  2. Technical assessment (take-home) -- 3 hours -- Engineering panel
  3. System design + behavioral -- 90 min -- VP Engineering + Senior Engineer
  4. Team fit + culture -- 45 min -- 2 team members
- **Questions per Competency:** 2-3 per competency (React architecture, performance optimization, mentorship, collaboration)
- **Scoring Rubric:** 1-5 scale, 6 competencies evaluated

### Candidate Evaluation
| Candidate | Technical | System Design | Mentorship | Collaboration | Overall | Rank |
|-----------|-----------|---------------|------------|---------------|---------|------|
| Candidate A | 5       | 4             | 5          | 4             | 4.5     | 1    |
| Candidate B | 5       | 5             | 3          | 4             | 4.25    | 2    |
| Candidate C | 4       | 4             | 4          | 5             | 4.25    | 3    |

- **Top Recommendation:** Candidate A -- strongest combination of technical skill and mentorship ability, which is the team's most critical current need (3 junior engineers need senior guidance)
- **Backup Candidate:** Candidate B (strongest technically, may need mentorship coaching)

### Offer
- **Compensation:** $162,000 base + 0.15% equity (4-year vest, 1-year cliff) + $5,000 home office stipend
- **Start Date:** March 15
- **Response Deadline:** February 28 (7 business days)
- **Verbal Offer:** Completed -- candidate expressed strong interest, no competing offers
- **Written Offer:** Sent
- **Status:** Accepted

### Onboarding Plan
- **Pre-start Checklist:** 8/8 items complete (laptop shipped, accounts created, codebase access granted, team intro email sent)
- **Day 1 Agenda:** 9 AM team standup, 10 AM 1:1 with manager, 11 AM codebase walkthrough, 2 PM pair programming with buddy
- **30-60-90 Day Goals:** Day 30: ship first feature independently. Day 60: lead a code review session. Day 90: own a product area and mentor 1 junior engineer.
- **Buddy Assigned:** Sarah (mid-level frontend engineer, 18 months at company)
