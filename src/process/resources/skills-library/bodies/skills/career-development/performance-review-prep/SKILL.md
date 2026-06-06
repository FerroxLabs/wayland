---
name: performance-review-prep
description: |
  Produces a self-assessment narrative with structured achievement evidence including
  impact metrics, scope descriptions, and strength and growth framing. Includes goals
  for the next review period. Produces a complete self-review document.
  Use when the user needs to write a performance review self-assessment, prepare for
  an annual or quarterly review, or document their achievements for a review cycle.
  Do NOT use for promotion cases (use promotion-case-builder), salary negotiation
  (use salary-negotiation-script), or resume bullet writing (use resume-bullet-writer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "career planning template writing"
  category: "career-development"
  subcategory: "career-growth"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Performance Review Prep

## When to Use

- User needs to write a self-assessment for a performance review
- User wants to prepare for an annual, semi-annual, or quarterly review cycle
- User asks how to document their accomplishments for a review
- User wants a structured framework for presenting their work to their manager
- User asks "what should I write in my self-review?"
- Do NOT use when: user wants to build a promotion case (use `promotion-case-builder`), user wants to negotiate salary (use `salary-negotiation-script`), user needs resume help (use `resume-bullet-writer`)

## Process

1. **Gather review context.** Collect the inputs needed:
   - User's role, title, and team
   - Review period (start and end dates)
   - Review format: free-form narrative, structured categories, rating system, or OKR-based
   - Company values or competencies that the review assesses (if any)
   - Goals set at the beginning of the review period (if any)
   - Manager's priorities or what they value (if the user knows)
   - Any areas the user was asked to improve in the previous review

2. **Inventory achievements.** Build the complete list of accomplishments:
   - Walk through the review period month by month: what was shipped, launched, delivered, or completed?
   - For each achievement: what was the deliverable, who was the audience or stakeholder, what was the measurable outcome?
   - Categorize achievements by: impact (high/medium/low), visibility (who knows about it), and alignment with goals
   - Identify 3-5 "headline" achievements that represent the strongest evidence of impact
   - Note any achievements that were not in the original goals but added significant value

3. **Frame strengths with evidence.** Build the "what went well" narrative:
   - Select 3-4 core strengths demonstrated during the period
   - For each strength: provide 1-2 specific examples with metrics
   - Connect each strength to a company value or competency (if the company uses them)
   - Use the Impact-Action-Context structure: what was the impact, what did the user do, what was the context

4. **Frame growth areas constructively.** Build the "areas for development" narrative:
   - Identify 1-2 genuine growth areas (not fake weaknesses like "I work too hard")
   - For each: what was the challenge, what was learned, and what specific action the user will take
   - If the previous review identified improvement areas, address progress on each
   - Frame growth as forward-looking commitment, not apology
   - Be honest but strategic -- choose growth areas the user is genuinely working on

5. **Set goals for the next period.** Define forward-looking objectives:
   - 3-5 goals for the next review period
   - Each goal: specific, measurable, and tied to team or company priorities
   - Include at least 1 growth-focused goal (skill development, new competency)
   - Include at least 1 impact-focused goal (deliverable, metric improvement)
   - Note any resources or support needed to achieve each goal

6. **Assemble the self-review document.** Compile into the output format:
   - Executive summary (2-3 sentence overview of the period)
   - Achievement detail with metrics
   - Strengths with evidence
   - Growth areas with action plan
   - Goals for next period
   - Optional: feedback requests or discussion topics for the review meeting

## Output Format

```
## Self-Assessment: [Review Period]

**Name:** [User name]
**Role:** [Title, Team/Department]
**Review period:** [Start date] - [End date]
**Manager:** [Manager name]

---

### Summary

[2-3 sentence overview: What was the defining theme of this review period? What is the user most proud of? What is the trajectory?]

---

### Key Accomplishments

#### 1. [Accomplishment Title]
**Impact:** [Measurable outcome -- revenue, efficiency, quality, growth]
**What I did:** [Specific actions taken]
**Context:** [Why this mattered -- team need, business priority, challenge overcome]
**Goal alignment:** [Which goal or company priority this supported]

#### 2. [Accomplishment Title]
**Impact:** [Measurable outcome]
**What I did:** [Specific actions]
**Context:** [Why this mattered]
**Goal alignment:** [Goal supported]

#### 3. [Accomplishment Title]
**Impact:** [Measurable outcome]
**What I did:** [Specific actions]
**Context:** [Why this mattered]
**Goal alignment:** [Goal supported]

#### 4. [Accomplishment Title]
**Impact:** [Measurable outcome]
**What I did:** [Specific actions]
**Context:** [Why this mattered]
**Goal alignment:** [Goal supported]

#### 5. [Accomplishment Title]
**Impact:** [Measurable outcome]
**What I did:** [Specific actions]
**Context:** [Why this mattered]
**Goal alignment:** [Goal supported]

### Additional Contributions

- [Contribution not in original goals but added value]
- [Contribution not in original goals but added value]

---

### Strengths Demonstrated

**[Strength 1: Name]**
[1-2 specific examples with metrics. How this strength showed up in practice during this period.]

**[Strength 2: Name]**
[1-2 specific examples with metrics.]

**[Strength 3: Name]**
[1-2 specific examples with metrics.]

---

### Growth Areas

**[Growth Area 1: Name]**
- **Challenge:** [What was difficult or where performance fell short]
- **What I learned:** [Specific insight or lesson]
- **Action plan:** [Concrete step to improve, with timeline]

**[Growth Area 2: Name]**
- **Challenge:** [What was difficult]
- **What I learned:** [Insight]
- **Action plan:** [Concrete step]

---

### Previous Review Follow-Up

| Previous Growth Area | Progress Made | Status |
|---------------------|--------------|--------|
| [Area identified last review] | [What was done to address it] | [Addressed/In progress/Ongoing] |

---

### Goals for Next Period

| # | Goal | Metric | Category | Support Needed |
|---|------|--------|----------|---------------|
| 1 | [Specific goal] | [How success is measured] | [Impact/Growth] | [Resources, time, mentoring] |
| 2 | [Specific goal] | [Metric] | [Impact/Growth] | [Support] |
| 3 | [Specific goal] | [Metric] | [Impact/Growth] | [Support] |

---

### Discussion Topics for Review Meeting

- [Topic the user wants to discuss with their manager]
- [Question about priorities, career path, or support]
```

## Rules

1. Always produce a complete self-assessment document -- never tips about how to write one
2. Every accomplishment must include a measurable impact metric -- "contributed to the project" is not evidence; "delivered the feature 2 weeks ahead of schedule, enabling the Q3 launch" is evidence
3. Include at least 5 specific accomplishments for a full review period (6-12 months); at least 3 for a quarter
4. Growth areas must be genuine and specific -- not cliches like "I'm a perfectionist" or "I work too hard"
5. Growth areas must include a forward-looking action plan, not just an admission of weakness
6. NEVER fabricate metrics or achievements -- if the user cannot quantify, help them find the metric by asking probing questions
7. If the user set goals at the start of the period, explicitly address each one with progress and outcome
8. The summary must be 2-3 sentences maximum -- it sets the tone for the entire document
9. Frame the document to highlight upward trajectory -- even growth areas should show learning and improvement
10. Include at least 1 contribution that was not in the original goals -- this demonstrates initiative and adaptability

## Edge Cases

- **User is new to the role (first review period):** Adjust expectations. Focus on ramp-up speed, early contributions, and learning velocity rather than long-term impact metrics. Frame the self-assessment around "how quickly I became productive" rather than "what I accomplished over 12 months."
- **User had a difficult period (personal issues, burnout, underperformance):** Acknowledge the challenge honestly but briefly. Focus the narrative on what was still accomplished despite the difficulty, what was learned, and the specific plan for the next period. Do not overshare personal details in a written document.
- **Company uses a rating system (1-5, Exceeds/Meets/Below):** Add a self-rating recommendation with justification tied to the accomplishments. Frame the rating request as evidence-based: "Based on the accomplishments above, I believe my performance warrants a [rating] because [1-sentence justification]."
- **User cannot remember what they did:** Help them reconstruct by reviewing: calendar invites (what meetings and projects), email sent folder (what updates and deliverables), project management tools (what tasks completed), and any praise or feedback received. Walk through the period month by month.
- **User's manager changed mid-period:** Address both periods. Note contributions under each manager. Acknowledge that the new manager may not have full visibility into early-period work, and provide extra detail for that portion.

## Example

**Input:** "I need to write my annual self-assessment. I'm a Customer Success Manager on a 4-person team. My main wins this year: I kept our team's retention rate at 94% (company average is 88%), I onboarded 12 enterprise accounts including our largest-ever client ($500K ARR), I built a new onboarding playbook that the whole team now uses, and I presented our churn analysis to the leadership team. I need to improve on my technical product knowledge -- I sometimes need to escalate questions I should be able to answer myself. My goals last year were to maintain 90%+ retention and to mentor a new team member."

**Output:**

## Self-Assessment: Annual Review [Year]

**Name:** [User name]
**Role:** Customer Success Manager, Customer Success Team
**Review period:** January - December [Year]
**Manager:** [Manager name]

---

### Summary

This year I delivered above-target retention (94% vs. 88% company average), successfully onboarded our largest enterprise client to date ($500K ARR), and created a scalable onboarding playbook now used across the team. My focus for the next year is deepening my technical product knowledge to reduce escalations and handle complex technical questions independently.

---

### Key Accomplishments

#### 1. Maintained 94% Account Retention Rate
**Impact:** 94% retention vs. 88% company average, representing approximately $X in preserved ARR
**What I did:** Proactive quarterly business reviews with all accounts, identified at-risk signals early, and intervened with recovery plans for 4 accounts that showed churn indicators
**Context:** Retention is the team's primary metric and directly affects company revenue growth
**Goal alignment:** Exceeded the 90%+ retention goal set at the start of the year

#### 2. Onboarded 12 Enterprise Accounts Including Largest Client ($500K ARR)
**Impact:** $500K ARR from our single largest account; 12 enterprise accounts totaling approximately $X in new ARR successfully launched
**What I did:** Led the entire onboarding process: kickoff calls, implementation planning, training sessions, and go-live support for each account
**Context:** The $500K account required a custom onboarding track with executive stakeholders, making it the most complex onboarding our team has handled
**Goal alignment:** Supports company growth target for enterprise segment

#### 3. Built New Onboarding Playbook Adopted Team-Wide
**Impact:** Standardized onboarding across the 4-person team; reduced average time-to-value from 6 weeks to 4 weeks for new enterprise accounts
**What I did:** Documented the onboarding process step-by-step based on patterns from 12 enterprise onboardings, created templates for kickoff decks, training schedules, and success milestone checklists
**Context:** Previously, each CSM had their own approach, leading to inconsistent client experiences and no knowledge transfer when accounts were reassigned
**Goal alignment:** Not in original goals -- self-initiated based on team need

#### 4. Presented Churn Analysis to Executive Team
**Impact:** Executive team adopted two of three recommended interventions for at-risk account management
**What I did:** Analyzed churn patterns across 18 months of data, identified 3 leading indicators, and presented findings with specific recommendations to the VP of Sales and CRO
**Context:** First time a CSM presented directly to the executive team; expanded the team's visibility with senior leadership
**Goal alignment:** Supports company retention strategy

#### 5. Mentored New Team Member Through Onboarding and First Quarter
**Impact:** New CSM [Name] independently managed their first 5 accounts by end of Q2 and retained all of them
**What I did:** Served as primary buddy: weekly 1:1s, shadowed my client calls, co-led their first 3 onboardings, provided feedback on their QBR presentations
**Context:** Team grew from 3 to 4 members; effective onboarding was critical to maintain service quality during growth
**Goal alignment:** Directly addressed the mentoring goal from last year's review

### Additional Contributions

- Created a shared library of QBR templates and client communication templates used by all 4 CSMs
- Volunteered to lead the team's weekly pipeline review meeting when our manager was on leave for 3 weeks

---

### Strengths Demonstrated

**Proactive Client Management**
Maintained 94% retention by identifying at-risk accounts before they escalated. Specifically, I caught churn signals in 4 accounts and intervened with targeted recovery plans -- all 4 accounts renewed.

**Process Building and Documentation**
The onboarding playbook I created reduced time-to-value by 2 weeks and is now the team standard. This reflects a pattern: I look for repeatable processes and codify them.

**Executive Communication**
The churn analysis presentation to the executive team led to concrete action on 2 of 3 recommendations. This was the first CSM-level presentation to executives and helped raise the team's strategic visibility.

---

### Growth Areas

**Technical Product Knowledge**
- **Challenge:** I escalated approximately 15-20 technical questions to engineering this year that I could have answered with deeper product knowledge, particularly around our API integrations and data pipeline features
- **What I learned:** The most common escalations fall into 3 categories (API authentication, data export configurations, webhook setup) -- these are learnable patterns, not edge cases
- **Action plan:** Complete the internal technical certification program by end of Q1; shadow 3 engineering support calls per month for the next quarter; goal is to reduce escalations by 50% in the next review period

---

### Previous Review Follow-Up

| Previous Growth Area | Progress Made | Status |
|---------------------|--------------|--------|
| Maintain 90%+ retention | Achieved 94%, exceeding the 90% target | Addressed |
| Mentor a new team member | Mentored [Name] through onboarding; they are now independent | Addressed |

---

### Goals for Next Period

| # | Goal | Metric | Category | Support Needed |
|---|------|--------|----------|---------------|
| 1 | Maintain 93%+ retention rate | Retention rate at or above 93% | Impact | Continued access to churn analytics dashboard |
| 2 | Complete technical certification | Pass internal cert exam by end of Q1 | Growth | Time allocation for study (4 hrs/week for 8 weeks) |
| 3 | Reduce technical escalations by 50% | From ~18/year to ~9/year | Growth | Shadowing opportunities with engineering support |
| 4 | Onboard 15+ enterprise accounts | Successfully launched with positive NPS | Impact | Support from solutions engineering for complex accounts |

---

### Discussion Topics for Review Meeting

- Career path: What does the Senior CSM role look like, and what additional evidence would support that progression?
- Technical growth: Is the internal certification the right path, or would a different approach be more valuable?
- Team process: Would the onboarding playbook benefit from a formal review and update cycle?
