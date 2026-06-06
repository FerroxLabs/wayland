---
name: employee-survey
description: |
  Designs employee engagement surveys with question categories, Likert scale structure, anonymity protocols, and analysis guidance using survey design methodology. Use when the user asks about employee surveys, engagement surveys, pulse surveys, employee satisfaction measurement, or workplace culture assessment.
  Do NOT use for customer surveys (use a research skill), interview evaluation (use interview-guide), or performance reviews (use performance-review).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "template planning research analysis strategy"
  category: "business-strategy"
  subcategory: "human-resources"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Employee Survey Design

## When to Use

**Use this skill when:**
- A user asks to design or build an employee engagement survey, satisfaction survey, or culture assessment from scratch
- A user needs to run a pulse survey -- a short, frequent check-in measuring sentiment on a specific theme (workload, manager support, return-to-office transition, post-reorg morale)
- A user needs to measure the employee Net Promoter Score (eNPS) as a standalone metric or embedded in a broader survey
- A user wants to assess a specific HR initiative -- onboarding experience, new benefits rollout, hybrid work policy effectiveness, or DEI program impact
- A user needs help analyzing or interpreting existing survey results, including identifying priority areas, spotting demographic differences, or structuring the action-planning process
- A user wants to establish a baseline measurement before a major organizational change (merger, restructure, leadership transition)
- A user needs to rebuild survey trust after a period of survey fatigue or poor follow-through on previous results
- A user is designing a lifecycle survey -- new hire 30/60/90-day check-ins or exit surveys measuring departure drivers

**Do NOT use this skill when:**
- The user wants a customer satisfaction or NPS survey (use a customer research or UX research skill -- the question design methodology, analysis, and anonymity considerations are fundamentally different)
- The user needs structured interview evaluation scorecards or hiring rubrics (use `interview-guide` -- rating candidates uses behavioral anchoring, not Likert engagement scales)
- The user wants to write formal performance reviews or conduct performance calibration (use `performance-review` -- performance assessment requires manager observation data, not anonymous self-report)
- The user needs a market research survey targeting external respondents (use `user-research-plan` -- sampling methodology, incentive structures, and statistical inference requirements differ substantially)
- The user is conducting a union election or labor relations process (this requires legal counsel and specialized labor relations expertise beyond survey design)

---

## Process

### Step 1: Establish Survey Purpose, Scope, and Success Criteria

Before writing a single question, gather the information that determines every subsequent decision.

- **Clarify the primary measurement objective:** Is this measuring overall organizational health, diagnosing a known problem (rising attrition, declining performance), evaluating a specific program, or satisfying a board/investor request for people metrics? The answer changes the question set entirely.
- **Define the audience precisely:** "All employees" is rarely the right scope if the company has contractors, contingent workers, or recent acquisitions. Clarify whether these populations are included, and if so, whether they need separate question modules (contractors cannot meaningfully rate internal career development).
- **Establish survey frequency and cadence:**
  - **Annual comprehensive survey:** 30-50 questions across 6-9 categories, full demographic cuts, used for strategic HR planning. Budget 15-20 minutes of employee time.
  - **Quarterly pulse survey:** 10-15 questions on 2-4 rotating or consistent themes. Target 5-8 minutes. Used for trend monitoring and rapid response.
  - **Always-on lifecycle surveys:** Triggered by events -- new hire 30-day check-in (8-10 questions), 90-day check-in (12-15 questions), exit survey (15-20 questions). Sent automatically, not at a scheduled calendar interval.
  - **Post-event surveys:** 5-8 questions within 48-72 hours of a specific event (all-hands meeting, policy change, reorg announcement). Extremely short, time-sensitive.
- **Identify the decision maker and decision it enables:** "Our CHRO wants to understand attrition risk by department" is a fundable decision. "Our CEO wants to make employees feel heard" is not -- push back and anchor to a specific business outcome.
- **Confirm whether comparison data exists:** Prior survey results, industry benchmarks (Gallup Q12, Qualtrics industry averages, Mercer engagement benchmarks), or peer company data all change how results will be interpreted. First-time surveys need a baseline-only framing.
- **Assess company size and its effect on anonymity:** Under 20 employees -- no demographic cuts at all. 20-50 employees -- department-level cuts only if departments have 5+ members. 50-200 employees -- department, tenure, and manager-level cuts where threshold is met. 200+ employees -- full demographic cross-tabulation is viable.

---

### Step 2: Select and Prioritize Question Categories

Standard engagement survey categories map to the major drivers of voluntary attrition and discretionary effort. Not all categories belong in every survey.

**The nine core categories and what each predicts:**

| Category | Primary Outcome Predicted | Minimum Questions |
|---|---|---|
| Role clarity and meaning | Task performance, discretionary effort | 3 |
| Manager effectiveness | Direct report retention, psychological safety | 4-5 |
| Team dynamics and collaboration | Productivity, inclusion, innovation | 3-4 |
| Growth and development | Attrition (especially high performers, under 35) | 3-4 |
| Company leadership and strategy | Organizational commitment, trust | 3-4 |
| Compensation and total rewards | Retention trigger, not engagement driver | 2-3 |
| Work-life balance and wellbeing | Burnout risk, long-term performance | 3-4 |
| Culture, belonging, and inclusion | DEI outcomes, retention of underrepresented groups | 3-5 |
| Tools, processes, and resources | Frustration, efficiency, tech-enabled productivity | 2-3 |

**Category selection rules:**
- A pulse survey should focus on no more than 3 categories -- the ones most relevant to the current business moment
- A comprehensive annual survey includes all 9 categories for the first baseline; subsequent surveys may drop or rotate categories based on prior results
- Always include manager effectiveness and growth -- these are the top two predictors of voluntary turnover in virtually every industry study (Gallup, McKinsey, Corporate Executive Board data all converge here)
- Compensation questions generate the most response bias -- employees with strong opinions about pay respond at higher rates. Do not drop this category, but interpret it knowing this bias exists
- Culture and belonging questions are legally sensitive in some jurisdictions -- frame questions around experience ("I feel I belong here") not demographic identity

---

### Step 3: Write and Review Every Question

Question quality determines result validity. Each question must pass a six-point quality check before inclusion.

**Six-point question quality check:**
1. **Single concept:** Does the question test exactly one idea? "My manager gives me feedback AND supports my career" tests two things -- split it.
2. **Behavioral specificity:** Vague questions like "My manager is good" are unactionable. Specific questions like "My manager gives me feedback within one week of completing a significant project" are coachable.
3. **Respondent knowledge:** Can every respondent answer this? "The company's financial strategy is sound" -- most employees cannot evaluate this. Reframe as "I trust that company leadership makes sound financial decisions."
4. **Scale alignment:** Every Likert item should be a statement of agreement (Strongly Disagree to Strongly Agree). Frequency scales ("Never" to "Always") are appropriate for behavioral questions ("My manager meets with me 1:1 regularly"). Do not mix scale types within a category.
5. **Neutral framing:** Remove all leading language. "Don't you agree that our DEI efforts have improved?" is leading. Write: "The company's DEI efforts have meaningfully improved the workplace in the past 12 months."
6. **Action linkage:** Can a manager or HR team do something in response to a low score on this question? If not, reconsider its inclusion.

**Likert scale standards:**
- Use a **5-point scale** (1=Strongly Disagree, 2=Disagree, 3=Neither Agree nor Disagree, 4=Agree, 5=Strongly Agree) as the default
- A **7-point scale** increases measurement precision but adds cognitive load -- use only when fine-grained discrimination is critical (e.g., academic research contexts)
- **Do not use a 4-point forced-choice scale** (eliminating the neutral midpoint) -- it artificially inflates positive scores and frustrates employees who genuinely have no opinion
- Apply the same scale to all Likert items -- never mix a 5-point Likert with a 10-point satisfaction scale in the same question block
- The **eNPS question** (0-10 likelihood to recommend as employer) is the one intentional exception to the 5-point rule -- use the standard 0-10 scale to maintain comparability with industry benchmarks

**Reverse-scored items:**
- Include at least 2-3 negatively worded items in every survey to detect acquiescence bias (the tendency to agree with any statement regardless of content)
- Standard reverse-scored items: "I am actively considering leaving the company in the next 12 months," "I often feel that my contributions go unnoticed," "Decision-making at this company seems arbitrary or unfair"
- Score these items inversely (5 becomes 1, 4 becomes 2, etc.) before computing category or overall averages
- Flag surveys where a respondent's reverse-scored item responses are dramatically inconsistent with their standard items -- this may indicate careless responding or systematic misunderstanding

**Open-text question placement:**
- Place one open-text question at the end of each category, not embedded in the middle
- Standard formula: "What one thing would most improve [category area] for you at [Company]?"
- Include a final global open-text question: "Is there anything else you'd like to share that the survey didn't cover?"
- Warn respondents not to include names, identifying details, or references to specific colleagues -- this protects both anonymity and legal liability
- Open-text responses must be read and themed by HR before any results are shared with managers

---

### Step 4: Design the Anonymity and Data Protection Protocol

Anonymity is not just an ethical obligation -- it is the primary driver of response honesty. Compromised anonymity produces data that overestimates satisfaction and underrepresents concern.

**Minimum reporting thresholds:**
- **5 respondents** is the industry-standard minimum for reporting any group-level result. Below this threshold, suppress results entirely and communicate clearly why.
- Some organizations use a **7-respondent threshold** in small teams where even 5 members might be identifiable by role or tenure -- use professional judgment and err toward protection.
- For demographic cross-tabulation (e.g., Women in Engineering department) apply the threshold to the intersection, not the individual categories -- if only 3 women are in the Engineering department, do not report that cross-tab even if both "Women" and "Engineering" separately have 5+ respondents.

**Survey platform considerations:**
- Internal survey tools (Google Forms on a company domain, Microsoft Forms with SSO) create a perception of non-anonymity even when technically anonymous -- IP addresses are logged, form completion times are recorded, SSO authentication is visible to admins
- Use a dedicated survey platform (Qualtrics, Culture Amp, Glint, Leapsome, SurveyMonkey Workday-connected) with explicit anonymity certifications
- If budget requires an internal tool, have IT confirm in writing that no individual-level data is accessible, and share that confirmation with employees in the survey introduction
- Third-party administration (an external firm collects and aggregates results before returning to HR) is the gold standard for organizations with trust deficits or recent employee relations issues

**Data governance:**
- Specify in advance who sees what: HR leadership sees full data, managers see team-level aggregates (above threshold only), employees see company-level results
- Establish data retention policies -- raw survey data (individual responses) should be deleted after analysis is complete, not retained indefinitely
- Open-text responses require additional care -- even anonymized qualitative responses can be identifiable if an employee describes a unique situation. Review all open-text data before distributing to managers.
- International surveys must account for data privacy laws -- GDPR (EU), PDPA (Singapore/Thailand), LGPD (Brazil), PIPEDA (Canada) may impose additional consent, storage, and deletion requirements

---

### Step 5: Write the Survey Introduction and Context-Setting Copy

The introduction is a contract with employees. It determines whether they trust the process enough to respond honestly.

**Required elements of a survey introduction:**
1. **Why the survey exists:** Connect explicitly to a business context ("Following our expansion to three new offices, we want to understand how the experience of working here may differ across locations") -- not "We value your feedback."
2. **What anonymity means specifically:** "Your responses are anonymous. Results are reported only at the group level, and no group smaller than 5 people will have results shared. Individual responses cannot be seen by your manager, HR, or anyone else."
3. **How long it takes:** State the actual average completion time, not the maximum. A survey with 32 questions takes approximately 10-12 minutes at average reading speed with 2-3 seconds per response. Do not say "only 5 minutes" if it takes 12.
4. **Deadline and completion rate goal:** "Please complete by [date]. We need at least 70% participation to have statistically reliable results we can act on."
5. **What happens with results:** "Results will be shared with all employees by [date], approximately 3-4 weeks after the survey closes. Each team will review results with their manager in a facilitated discussion."
6. **Connection to prior action (if applicable):** "Following last year's survey, we [specific action taken]. This year we want to measure whether that change has had an impact." This is the single most powerful driver of response rate improvement after a prior survey.

---

### Step 6: Design the Analysis Framework

Raw survey data is useless without a structured analysis approach. Design the analysis framework before the survey launches, not after.

**Scoring and benchmarking:**

- **Overall engagement index:** The mean of all Likert items (after reverse-scoring negatively worded items). Industry benchmarks vary: Gallup's global average employee engagement is approximately 23% "actively engaged" (on their Q12 scale); on a 5-point Likert scale, scores above 3.8 are generally considered strong, 3.4-3.8 moderate, below 3.4 concerning -- but internal trend is more meaningful than any external benchmark for the first 2-3 surveys.
- **Category scores:** Mean of all items within each category. Rank categories from highest to lowest. The lowest-scoring categories are not automatically the priority -- see the priority matrix below.
- **Favorable, neutral, unfavorable distribution:** Report the percentage of responses at each point on the scale. A mean of 3.5 could reflect a normal distribution (many moderate responses) or a bimodal distribution (half strongly agree, half strongly disagree) -- these require very different responses. Always report distribution, not just mean.
- **eNPS calculation:** % Promoters (scored 9-10) minus % Detractors (scored 0-6). Passives (7-8) are excluded from the calculation. eNPS ranges from -100 to +100. Industry averages vary significantly -- tech companies average approximately +10 to +20; professional services +5 to +15. Do not anchor to these without knowing sector-specific data.

**Priority matrix -- the most important analytical tool:**

The priority matrix plots each question category on two axes:
- **X-axis -- Current score:** How employees rate this category right now (low score = current pain point)
- **Y-axis -- Correlation with overall engagement:** How strongly this category's score predicts whether an employee rates the company favorably overall (high correlation = high-leverage driver)

This produces four quadrants:
- **High correlation, low score (top-left):** CRITICAL priority -- this is hurting overall engagement most. Act immediately.
- **High correlation, high score (top-right):** STRENGTH -- protect and maintain. Do not neglect this.
- **Low correlation, low score (bottom-left):** MONITOR -- employees are dissatisfied here, but it is not driving overall engagement loss. Investigate further before investing resources.
- **Low correlation, high score (bottom-right):** OPPORTUNITY -- employees are satisfied but this is not a major engagement driver. Mention in communications but deprioritize investment.

To calculate correlation with overall engagement: compute the Pearson correlation between each category's score and the respondent's overall satisfaction item score. This can be done in Excel (CORREL function) or any survey analytics platform.

**Demographic analysis:**
- Report demographic cuts only where group size exceeds threshold
- Look for **driver differences**: the category that most strongly predicts overall engagement often differs by demographic group -- manager effectiveness may drive engagement for employees under 2 years tenure while growth and career path drives it for employees with 3-7 years
- Flag any demographic group where the overall score differs from the company average by more than 0.5 points on a 5-point scale -- this is a meaningful gap requiring investigation
- Do not assume causality from demographic differences -- a low score for a specific department may reflect team composition, specific manager behavior, role type, or workload rather than anything identity-related

**Open-text analysis:**
- Use thematic coding to group qualitative responses into 5-8 recurring themes
- For surveys under 200 respondents, human coding by an HR analyst is sufficient and produces more nuanced themes than automated tools
- For 200+ respondents, natural language processing tools (available in Qualtrics, Culture Amp, or standalone tools like MonkeyLearn) can accelerate first-pass theme identification, but a human review of the top 20 responses per theme is essential to validate accuracy
- Count theme frequency (what percentage of open-text respondents mentioned this theme?) and weight by sentiment
- Do not share verbatim quotes with managers unless the respondent has explicitly consented to attribution -- paraphrase and aggregate

---

### Step 7: Plan Post-Survey Communication and Action Cycle

Survey fatigue is not caused by too many surveys -- it is caused by surveys that produce no visible action. Every survey must be paired with a committed communication and action cycle.

**Timeline for a standard annual survey:**
- **Week 0:** Survey opens. Send launch communication with context and anonymity assurance.
- **Week 1:** Mid-survey reminder. Share current response rate and why it matters ("We are at 58%, we need 70% for reliable team-level results").
- **Week 2-3:** Survey closes. Begin analysis.
- **Week 4-5:** HR leadership reviews results and selects 2-3 company-wide focus areas (not 8, not 10 -- 2-3 with real investment behind them).
- **Week 5-6:** All-hands results presentation. Share overall scores, strengths, and the 2-3 focus areas. Be transparent about scores that are concerning.
- **Week 6-8:** Team-level discussions. Managers share team results (above threshold) with their teams, facilitate a discussion, and identify 1-2 team-level actions.
- **Week 8-10:** Action planning complete. Each focus area has an owner, a set of actions, and a measurement milestone.
- **3 months later:** Progress update communication. "Here is what we said we would do and here is where we are."
- **Next survey:** Include a question that directly measures whether the prior year's action was effective.

**Choosing focus areas:**
- Use the priority matrix to identify the 2-3 highest-leverage improvements
- Focus areas must be actionable at the organizational level -- "compensation" is not a focus area unless leadership is prepared to act on it
- Communicate candidly about areas that scored low but are not a focus area: "We heard you on compensation. We are not in a position to change base salaries this year, but we are reviewing the bonus structure in Q2."

---

## Output Format

```
## Employee Engagement Survey Design: [Company Name or Survey Name]

### Survey Configuration Summary
- **Survey type:** [Comprehensive annual / Quarterly pulse / New hire onboarding / Exit / Post-event]
- **Target population:** [All employees / Department X / New hires 30-90 days / Departing employees]
- **Total headcount in scope:** [Number]
- **Estimated survey length:** [X questions / Y minutes average completion time]
- **Survey open date:** [Date]
- **Survey close date:** [Date -- typically 10-14 days open for annual, 5-7 days for pulse]
- **Target response rate:** [70%+ recommended for statistical reliability]
- **Anonymity threshold:** Minimum [5 or 7] respondents per reported group
- **Platform:** [Recommended platform and rationale]
- **Who sees results:** [HR leadership: full data | Managers: team-level aggregate only | Employees: company-level summary]

---

### Survey Introduction Text

**Subject line (email or Slack):** [Company name] Annual Engagement Survey -- Your Voice Shapes Our 2025 Priorities

---

We are launching our [year] Employee Engagement Survey and we need your honest input.

**Why this matters:** [Specific connection to business context -- e.g., "As we grow through our Series C expansion, we want to ensure the employee experience scales with us and that we are investing our people and culture programs where they matter most."]

**Time commitment:** This survey takes approximately [X] minutes to complete. Please complete it by [date].

**Your anonymity is protected:** Your responses are completely anonymous. Results are reported only at the group level. No group of fewer than [5/7] people will have results reported, and no individual responses can be seen by anyone -- not your manager, not HR, not leadership. [If using third-party platform: This survey is administered by [Platform Name], an independent platform, which means [Company Name] cannot see individual responses.]

**What happens next:** Results will be shared with all employees by [date, approximately 3-4 weeks after close]. Teams will discuss results together, and we will commit to specific actions from the findings.

[If applicable] **From last year's survey:** You told us [specific finding]. In response, we [specific action taken]. This year, we are asking whether that change made a difference.

[Survey link]

Thank you.
[CHRO or CEO name]

---

### Survey Questions

#### Category: [Category Name] -- [Brief description of what this measures]

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 1 | [Specific behavioral statement] | 1-5 Likert | Standard |
| 2 | [Specific behavioral statement] | 1-5 Likert | Standard |
| 3 | [Specific behavioral statement] | 1-5 Likert | Standard |
| 4 | [Negatively worded statement for bias detection, if applicable] | 1-5 Likert | Reverse |
| OT | What would most improve [category area] for you? | Open text | Qualitative |

*[Category mean will be calculated as the average of all standard items,
with reverse-scored items re-coded before inclusion.]*

---

#### [Repeat for each category -- include 6-9 categories for annual, 2-4 for pulse]

---

#### Global / Overall Items

| # | Question | Scale | Notes |
|---|----------|-------|-------|
| [X] | On a scale of 0-10, how likely are you to recommend [Company] as a place to work? | 0-10 | eNPS -- calculate separately from Likert average |
| [X] | Overall, I am satisfied with my experience working at [Company] | 1-5 Likert | Anchor item for priority matrix correlation |
| [X] | I am actively considering leaving [Company] in the next 12 months | 1-5 Likert | Reverse-scored; attrition risk indicator |
| OT | What is the single most important change [Company] could make to improve the employee experience? | Open text | Route to HR leadership only |

---

#### Demographic Questions (Optional -- clearly labeled as voluntary)

*Note: All demographic questions are optional and will only be used to report
aggregate patterns. No group with fewer than [5/7] respondents will be reported.*

| Question | Response Options |
|----------|-----------------|
| What department are you in? | [List of departments] |
| How long have you worked at [Company]? | Less than 6 months / 6-12 months / 1-3 years / 3-5 years / 5+ years |
| Where do you primarily work? | Fully remote / Hybrid / Fully in-office |
| What is your people manager level? | Individual contributor / Manager of individuals / Manager of managers |

---

### Analysis Plan

#### Scoring Summary Table

| Category | # Items | Mean Score | Favorable % | vs. Benchmark | vs. Prior Year |
|---|---|---|---|---|---|
| [Category 1] | [N] | [X.X / 5.0] | [X%] | [+/- X] | [+/- X] |
| [Category 2] | [N] | [X.X / 5.0] | [X%] | [+/- X] | [+/- X] |
| ... | | | | | |
| **Overall Engagement Index** | [Total] | [X.X / 5.0] | [X%] | | |
| **eNPS** | 1 | [Score] | N/A | | |

*Favorable = respondents who answered 4 or 5 on a 5-point scale.*

---

#### Priority Matrix

| Quadrant | Categories in This Quadrant | Recommended Action |
|---|---|---|
| Critical (high driver, low score) | [Categories] | Primary focus areas for action planning |
| Strength (high driver, high score) | [Categories] | Protect; mention in all-hands as a point of pride |
| Monitor (low driver, low score) | [Categories] | Investigate root cause; do not overspend yet |
| Maintain (low driver, high score) | [Categories] | Acknowledge; no major investment needed |

---

#### Demographic Findings

| Demographic Group | Overall Score | Notable Differences | Action Implication |
|---|---|---|---|
| [Group with N >= threshold] | [X.X] | [Category where this group differs by 0.5+] | [Specific follow-up] |
| [Group below threshold] | Suppressed | N/A | HR to note for qualitative follow-up |

---

#### Open-Text Theme Summary

| Theme | Frequency (% of respondents) | Sentiment | Example (paraphrased) | Priority |
|---|---|---|---|---|
| [Theme 1] | [X%] | [Positive/Negative/Mixed] | [Paraphrased representative comment] | [High/Med/Low] |
| [Theme 2] | [X%] | | | |
| ... | | | | |

---

### Post-Survey Action Plan

| Focus Area | Survey Evidence | Proposed Action | Owner | Target Date | Measurement |
|---|---|---|---|---|---|
| [Area 1 -- from Critical quadrant] | [Category score X.X; top open-text theme] | [Specific, observable action] | [Name/Role] | [Date] | [How progress will be measured in next survey or pulse] |
| [Area 2] | | | | | |

---

### Communication Timeline

| Milestone | Date | Owner | Channel | Content |
|---|---|---|---|---|
| Survey launch | [Date] | CHRO | Email + Slack | Introduction text above |
| Mid-survey reminder | [Date +7 days] | HR | Email | Response rate update + urgency |
| Survey close | [Date] | HR | Confirmation | Thank you + timeline for results |
| Results to HR leadership | [Date +14] | Analytics | Internal | Full data package |
| All-company results share | [Date +28] | CHRO/CEO | All-hands + email | Summary deck + 2-3 focus areas |
| Team-level discussions | [Weeks +5-7] | Managers | Team meetings | Facilitated discussion guide |
| Action plan published | [Week +10] | CHRO | Company wiki | Written commitments with owners |
| Progress update | [3 months later] | CHRO | All-hands | Status of actions + pulse data |
```

---

## Rules

1. **Never report results for any group with fewer than 5 respondents.** If the threshold is not met, suppress results explicitly ("Results for this group are not reported to protect anonymity") -- do not round up, average in, or show partial data. For organizations with trust deficits or identity-sensitive demographics, raise the threshold to 7.

2. **Use a consistent 5-point Likert scale for all standard items.** Mixing a 5-point scale for most questions with a 7-point scale for one category or a 10-point scale for satisfaction items (other than eNPS) makes comparison and averaging mathematically invalid. The eNPS 0-10 scale is the only intentional exception -- always calculate it separately, never average it with Likert items.

3. **Always include at least 2 reverse-scored items** to detect acquiescence bias (the tendency to agree regardless of content). Place them in different categories, not grouped together. Recode them before any analysis (score of 5 becomes 1, 4 becomes 2, etc.). If a respondent's reverse-scored responses are dramatically inconsistent with their directional responses, flag that response set for review before including in aggregates.

4. **Keep total question count at or below 40 for annual surveys and 15 for pulse surveys.** Completion rates drop sharply above these thresholds -- industry data shows a 20-30% increase in abandonment for surveys exceeding 20 minutes. If content requirements push beyond 40 questions, use a modular design: segment the survey into blocks with 20-25% random question sampling so no individual respondent answers all items, but all items are covered at the aggregate level.

5. **Every question must test a single, behaviorally specific concept.** Before including any question, apply this two-part test: (a) could you split this question into two distinct questions? If yes, split it. (b) Could a front-line manager read this question's low score and know what specific behavior to change? If no, rewrite it.

6. **Always include at least one open-text question per category.** Quantitative scores identify where a problem exists; open-text responses explain what it is and what to do about it. Open-text data must be reviewed by HR before distribution to managers and must never be shared verbatim without explicit respondent consent.

7. **The survey must be paired with a committed action timeline before it launches.** If leadership has not agreed to share results within 4 weeks, identify 2-3 public focus areas, and communicate specific actions within 10 weeks, do not launch the survey. A survey with no follow-through is actively worse than no survey -- it increases cynicism and destroys future response rates.

8. **Never ask about legally protected characteristics (age, religion, political views, pregnancy status, disability, sexual orientation) without legal review and specific business justification.** Tenure bands (not age), work location (not physical ability), and experience-based questions are acceptable proxies. When in doubt, omit the demographic question.

9. **All demographic questions must be clearly labeled as optional and must appear at the end of the survey, not the beginning.** Demographic questions at the start increase suspicion about anonymity and reduce response rates. Respondents are more willing to self-identify after they have already completed the substantive questions.

10. **Never ask questions where acting on a low score is outside the organization's capacity or intent.** A question like "Executive compensation is fairly distributed relative to the rest of the workforce" creates liability without actionability. If leadership is not prepared to change something, do not ask about it -- or explicitly frame the question as informational ("I understand how company decisions about pay are made") rather than evaluative.

11. **Translate all survey content professionally for multilingual workforces.** Do not use machine translation as the final product. Use back-translation validation: translate from English to target language, then have a second independent translator translate back to English without seeing the original. Discrepancies identify questions where meaning has been lost. A question that means something different in the translated version produces invalid data.

12. **Response rate targets must be communicated publicly.** "We need 70% participation to have reliable team-level results" is a specific, honest, motivating statement. Vague encouragements ("Please take a few minutes") produce lower response rates than specific outcome-linked appeals.

---

## Edge Cases

### Very Small Organizations (Fewer Than 25 Employees)

Anonymity is structurally compromised in small teams. Even "anonymous" surveys in a 12-person company can be reverse-engineered by role, tenure, or writing style. Do not collect demographic data at all. Report only company-level results. Consider using an external HR consultant to collect and aggregate results before returning to leadership -- this provides structural anonymity assurance that no internal administrator can offer. Frame the survey introduction transparently: "With our team of [X] people, we will only share company-level findings, not individual team or department results." If the team is under 10 people, consider one-on-one listening sessions facilitated by an external party instead of a structured survey.

### Post-Layoff or Organizational Crisis Surveys

Launching a survey within 90 days of a layoff requires specific calibration. Response rates will be lower and scores will be lower -- this is expected, not a failure of survey design. Use a short pulse format (8-12 questions) focused on trust, communication, and manager support rather than the full engagement battery. Acknowledge the situation directly in the survey introduction: "We know this has been a difficult period. We want to understand how you are experiencing this transition and what leadership can do better." Do not attempt to benchmark crisis-period results against prior annual surveys or external norms -- the populations and emotional contexts are incomparable. Use this pulse as a listening mechanism, not a scoring event. Results should inform leadership communication strategy. Specifically do not use low scores to identify "problem" departments for further scrutiny -- this will become known and will accelerate attrition among the people you most want to retain.

### Survey Fatigue and Low Response Rate Recovery

If a prior survey had below 50% participation, the problem is almost certainly not survey length -- it is a broken trust contract from previous surveys where results were not shared or acted on. Recovery requires three steps before a new survey can be effective: (1) Acknowledge the failure explicitly in all-hands or written communication ("We asked for your input in [year] and did not close the loop adequately. Here is what we learned and what we should have done differently."). (2) Launch a very short pulse (5-8 questions, 3 minutes) with a 5-day window as a trust-rebuilding exercise before the next comprehensive survey. (3) Share results from that pulse within 10 days and announce one specific action. This sequence resets the contract. Do not offer individual incentives for survey completion (raffles, gift cards) -- this introduces self-selection bias and signals that the content of responses is not itself valuable.

### Manager-Level Survey Visibility and Reporting

When managers receive team-level results, there is a common misuse pattern: managers identify who gave low scores based on the team composition, role distribution, or open-text phrasing, and address it in a targeted or retaliatory way. Prevent this through four structural controls: (1) Never give managers access to individual response data under any circumstances. (2) Round all reported means to one decimal place -- this reduces perceived precision and the ability to reverse-engineer individual responses. (3) Include a manager reporting guide that reframes low scores as system signals ("This score tells you about the environment your team is experiencing, not about individual people who dislike you"). (4) Facilitate the first team-level results discussion through HR rather than the manager alone, especially when scores are significantly below average.

### Multi-Country and Culturally Diverse Workforces

Survey response behavior is culturally variable in ways that directly affect interpretation. In many East Asian cultural contexts, middle-of-scale responses (3 out of 5) signal mild dissatisfaction rather than neutrality -- because direct disagreement with institutional statements is considered impolite. This means a 3.6 average in a Japanese office may indicate the same level of concern as a 3.0 in a North American office. Counter this by placing greater analytical weight on open-text responses and by comparing scores across time within each country rather than against a single global benchmark. Additionally: some languages require more words to express the same concept, making translated questions appear longer and increasing completion time. Build in a 20-30% time estimate buffer for translated versions. Political sensitivities in certain geographies may make specific questions legally risky -- questions about freedom of expression, political neutrality of the workplace, or right to organize require local legal review before inclusion.

### Annual Survey Versus Continuous Listening Architecture

Some organizations want to move from a once-a-year survey to a continuous listening approach -- frequent short pulses, always-on lifecycle surveys, and real-time feedback tools. This increases data richness but creates two significant risks: (1) **Respondent fatigue** if pulse cadence exceeds monthly without clear thematic variation. (2) **Alert desensitization** in HR -- when data is always flowing, it is easy for low scores to be normalized rather than acted upon. Design a continuous listening architecture with: a primary quarterly pulse of 8-10 questions covering core engagement drivers; automated lifecycle triggers (30-day new hire, 90-day new hire, voluntary resignation exit, involuntary exit); and an annual comprehensive survey as the strategic measurement anchor. Establish a clear escalation protocol for the continuous data -- define what threshold (e.g., a category score dropping below 3.2 or a 0.4 point decline in a single quarter) triggers a required response rather than just monitoring.

### Exit Surveys and Departure Data Integration

Exit surveys are structurally different from engagement surveys and require separate design. Departing employees are no longer worried about identification (they are leaving), so they will often answer more honestly -- but they are also emotionally activated, and scores can be influenced by the circumstances of departure. Key design principles for exit surveys: Ask about departure reasons using a multi-select question ("Which of the following factors influenced your decision to leave?") rather than open-ended only -- this produces categorizable trend data. Include a question about what would have made them stay, rated for feasibility ("If [factor] had been different, how likely would you have been to remain?"). Route exit survey data to CHRO and legal, not directly to the departing employee's manager -- this protects against retaliation risk and ensures departure reasons are analyzed structurally, not individually. Integrate exit survey results with engagement survey data to identify whether the categories with low engagement scores are also the categories most cited in exit reasons -- this closes the predictive validity loop.

---

## Example

**Input:** "We're a 200-person B2B SaaS company. We've done one previous annual survey (18 months ago) but the response rate was only 52% and we didn't share the results company-wide because leadership was nervous about the manager effectiveness scores. This created a lot of cynicism. We want to redo the survey this year, but we need to rebuild trust first. Our biggest concerns right now are manager quality, attrition among mid-level ICs (2-5 years tenure), and post-reorg morale following a restructure 4 months ago."

**Output:**

---

## Employee Engagement Survey Design: [Company] 2025

### Survey Configuration Summary

- **Survey type:** Trust-recovery pulse (Phase 1) followed by comprehensive annual survey (Phase 2) -- 6 weeks later
- **Target population:** All 200 employees, including employees hired in last 90 days
- **Phase 1 pulse -- questions:** 8 questions, estimated 4 minutes
- **Phase 2 annual -- questions:** 36 questions across 7 categories, estimated 14 minutes
- **Anonymity threshold:** 7 respondents minimum per group (elevated from standard 5 given prior trust issues)
- **Platform recommendation:** Dedicated third-party platform (Glint, Culture Amp, or Qualtrics) -- specifically not an internal Google or Microsoft Forms tool, given prior trust deficit around perceived access to individual responses
- **Who sees results:** HR leadership (full data) | Managers (team-level aggregate, Phase 2 only, groups of 7+ only) | All employees (company-level summary, both phases)

---

### Phase 1: Trust-Recovery Pulse Survey

**Launch date:** 2 weeks from today
**Close date:** 5 days after launch
**Results shared:** Within 10 days of close

#### Phase 1 Introduction Text

Subject line: A short survey -- and an honest conversation

---

Eighteen months ago we asked for your input and we did not close the loop. Results were not shared with the company. That was a mistake, and it undermined your confidence that this process was worth your time.

We are asking again -- but this time we are starting differently.

This is a very short survey: 8 questions, approximately 4 minutes. Its purpose is simple: to understand where things stand right now, four months after our restructuring, and to demonstrate that we will act on what you tell us.

Your responses are completely anonymous. This survey is administered through [Platform Name], an independent platform. [Company Name] cannot see individual responses. No results will be reported for any group with fewer than 7 people.

Please complete by [date]. We will share results with everyone -- including the scores that concern us -- within 10 days of the survey closing. We will then hold an all-hands Q&A.

[CHRO name]

---

#### Phase 1 Questions

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 1 | I understand why the recent organizational restructuring was necessary | 1-5 Likert | Standard |
| 2 | Leadership has communicated clearly about the impact of the restructuring | 1-5 Likert | Standard |
| 3 | I feel confident about the direction the company is heading | 1-5 Likert | Standard |
| 4 | My manager has supported me well through the recent organizational changes | 1-5 Likert | Standard |
| 5 | I feel the company genuinely values employee feedback | 1-5 Likert | Standard |
| 6 | I am actively considering leaving the company in the next 12 months | 1-5 Likert | Reverse |
| 7 | What is the most important thing leadership could do right now to improve trust and morale? | Open text | Qualitative |
| 8 | On a scale of 0-10, how likely are you to recommend [Company] as a place to work today? | 0-10 | eNPS |

**Phase 1 analysis:** Compute mean scores for items 1-5 (after reverse-scoring item 6). Calculate eNPS from item 8. Theme open-text responses from item 7 into 3-5 categories. Share all results -- including low scores -- in an all-hands within 10 days. Announce 1-2 specific commitments in response to the open-text themes.

---

### Phase 2: Comprehensive Annual Survey

**Launch date:** 6 weeks after Phase 1 results are shared (allowing time for the trust signal to land)
**Close date:** 12 days after launch
**Target response rate:** 75% (vs 52% prior year -- achievable if Phase 1 follow-through is executed well)
**Results shared company-wide:** Within 4 weeks of close

#### Phase 2 Introduction Text

Subject line: [Company] 2025 Engagement Survey -- 14 minutes to shape our next 12 months

---

Six weeks ago you told us [reference Phase 1 top finding -- e.g., "that communication during the restructuring fell short, and that trust in leadership needed to be rebuilt"]. In response, we committed to [specific action from Phase 1]. This survey is the next step.

This is our comprehensive annual survey -- 36 questions across 7 areas of the employee experience, designed to give us and you a clear picture of what is working and what needs to change.

**Time:** Approximately 14 minutes
**Deadline:** [Date]
**Anonymity:** Completely anonymous, administered by [Platform Name]. No group with fewer than 7 people will have results reported. Your manager cannot see your individual responses.
**What happens:** Results will be shared with all employees by [date]. Each team will review team-level results with their manager. We will commit to 2-3 company-wide focus areas with named owners, timelines, and progress updates.

[Survey link]

---

#### Phase 2 Questions

##### Category 1: Manager Effectiveness (Priority Category -- known concern)

*Measures quality of feedback, psychological safety, recognition, and development support from direct manager.*

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 1 | My manager gives me specific, actionable feedback on my work | 1-5 Likert | Standard |
| 2 | I feel comfortable raising concerns or disagreements with my manager | 1-5 Likert | Standard |
| 3 | My manager recognizes my contributions in a meaningful and timely way | 1-5 Likert | Standard |
| 4 | My manager actively supports my career development, not just my current role | 1-5 Likert | Standard |
| 5 | My manager communicates expectations clearly | 1-5 Likert | Standard |
| OT | What is one thing your manager could do differently to better support you? | Open text | Qualitative |

*Note: Item 2 measures psychological safety, which is the strongest predictor of whether employees surface problems early. A low score on item 2 with a higher score on items 1 and 3 often indicates a manager who is technically skilled but creates a fear-based dynamic.*

---

##### Category 2: Growth and Development (Priority Category -- mid-IC attrition concern)

*Measures career path clarity, access to learning, and perception of promotion fairness -- primary attrition drivers for 2-5 year tenure employees in tech.*

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 6 | I have a clear understanding of what I need to do to advance my career at [Company] | 1-5 Likert | Standard |
| 7 | I have access to learning and development resources that meaningfully help me grow | 1-5 Likert | Standard |
| 8 | Promotions at [Company] are based on merit and demonstrated contribution | 1-5 Likert | Standard |
| 9 | I am developing skills in my current role that will be valuable in my career | 1-5 Likert | Standard |
| OT | What would most accelerate your professional growth at [Company]? | Open text | Qualitative |

---

##### Category 3: Company Leadership and Post-Reorg Trust

*Elevated priority given 4-month-old restructuring. Measures transparency, strategic confidence, and leadership credibility.*

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 10 | I trust that [Company]'s senior leadership makes decisions that are in the best long-term interest of the company | 1-5 Likert | Standard |
| 11 | Senior leadership communicates openly and honestly, even when the news is difficult | 1-5 Likert | Standard |
| 12 | I have confidence in [Company]'s strategy for the next 12-18 months | 1-5 Likert | Standard |
| 13 | The reasoning behind the recent organizational changes has been explained clearly | 1-5 Likert | Standard |
| OT | What would increase your confidence in company leadership? | Open text | Qualitative |

---

##### Category 4: Role Clarity and Meaning

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 14 | I clearly understand what is expected of me in my role | 1-5 Likert | Standard |
| 15 | My work contributes meaningfully to the company's goals | 1-5 Likert | Standard |
| 16 | I have the tools and resources I need to do my job effectively | 1-5 Likert | Standard |
| OT | What resources or clarity would most help you do your best work? | Open text | Qualitative |

---

##### Category 5: Team Dynamics and Collaboration

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 17 | My team collaborates effectively to achieve shared goals | 1-5 Likert | Standard |
| 18 | I trust my teammates to do their part | 1-5 Likert | Standard |
| 19 | Workload is distributed fairly across my team | 1-5 Likert | Standard |
| 20 | My team operates in a psychologically safe environment where mistakes can be discussed openly | 1-5 Likert | Standard |
| OT | What would improve how your team works together? | Open text | Qualitative |

---

##### Category 6: Work-Life Balance and Wellbeing

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 21 | My workload is sustainable over the long term | 1-5 Likert | Standard |
| 22 | [Company]'s flexibility policies allow me to manage both my work and personal life effectively | 1-5 Likert | Standard |
| 23 | I feel supported in maintaining my wellbeing while meeting my work responsibilities | 1-5 Likert | Standard |
| OT | What one change would most improve your work-life balance? | Open text | Qualitative |

---

##### Category 7: Culture and Belonging

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 24 | I feel I belong at [Company] | 1-5 Likert | Standard |
| 25 | [Company]'s stated values are reflected in how decisions are made day-to-day | 1-5 Likert | Standard |
| 26 | People of all backgrounds are treated fairly at [Company] | 1-5 Likert | Standard |
| 27 | I feel comfortable being myself at work | 1-5 Likert | Standard |
| OT | How could [Company] better live its values? | Open text | Qualitative |

---

##### Reverse-Scored and Attrition Risk Items

| # | Question | Scale | Scoring |
|---|----------|-------|---------|
| 28 | I am actively considering leaving [Company] in the next 12 months | 1-5 Likert | Reverse (high score = high risk) |
| 29 | I often feel that my contributions go unrecognized at [Company] | 1-5 Likert | Reverse |
| 30 | I frequently feel overwhelmed by the volume of work expected of me | 1-5 Likert | Reverse |

*Note: Item 28 is the most direct attrition risk indicator. Cross-tabulate with tenure band
