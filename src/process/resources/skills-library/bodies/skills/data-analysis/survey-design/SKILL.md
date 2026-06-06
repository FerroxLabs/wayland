---
name: survey-design
description: |
  Produces a complete survey with question set in recommended order, question type selection (Likert, multiple choice, open text, matrix) with rationale, response scale definitions, and an analysis plan for each question. Does not assume statistical background.
  Use when the user asks to create a survey, design a questionnaire, build a feedback form, or plan a research survey with analysis methodology.
  Do NOT use for interview guide creation (use qualitative-coding for interview analysis), A/B test design (use ab-test-design), or market sizing research (use competitive-intelligence).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research analysis template"
  category: "data-analysis"
  subcategory: "research-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Survey Design

## When to Use

**Use this skill when:**
- A user asks to build a customer satisfaction, employee engagement, product feedback, or post-event survey from scratch
- A user wants to collect structured quantitative or mixed-method data from a defined respondent population and needs question type selection, scale design, and an analysis plan
- A user is designing a Net Promoter Score (NPS), Customer Effort Score (CES), or Customer Satisfaction Score (CSAT) measurement program and needs a supporting question architecture
- A user has a business or research decision to make and needs to know what to ask, how to ask it, and what to do with the answers
- A user already has a list of questions they drafted and wants expert review of question type, ordering, scale balance, wording bias, and skip logic
- A user is building a recurring pulse survey (weekly, monthly, quarterly) and needs a minimal-question set with longitudinal tracking methodology
- A user needs to segment responses by audience attributes (tenure, role, geography) and must build that segmentation into the survey structure before launch

**Do NOT use when:**
- The user wants to analyze qualitative interview transcripts or code themes from existing interview notes -- use `qualitative-coding` instead
- The user wants to run a controlled experiment to compare two versions of something -- use `ab-test-design` instead, since surveys cannot establish causality
- The user is researching a market for sizing, competitor mapping, or trend intelligence -- use `competitive-intelligence` instead
- The user has already collected open-ended survey responses at scale and wants automated theme extraction -- use `text-mining-protocol` instead
- The user needs a discussion guide for 1:1 moderated user research sessions -- surveys are the wrong instrument for that context
- The user wants to conduct observational research, diary studies, or ethnographic fieldwork -- those require entirely different research designs
- The respondent population is fewer than 10 people -- at that size, conduct structured interviews instead; scaled questions will produce unreliable statistics

## Process

### Step 1: Establish the Decision Context and Success Criteria

Before writing a single question, clarify what decision this survey must inform and what would count as a successful outcome. This prevents the most common survey failure: collecting data that cannot be acted upon.

- Ask the user: "What will you do differently depending on what the survey results show?" If the user cannot articulate at least two different actions they might take, the survey is not ready to be designed.
- Identify the decision deadline -- if a product roadmap decision must be made in three weeks, the survey must launch immediately with a 7-10 day collection window, not a 30-day window.
- Confirm whether this survey will be compared to past data (benchmark comparison) or stands alone (baseline measurement). Benchmark comparisons require using identical question wording and scales from prior surveys.
- Determine whether statistical significance is a requirement. If the user needs to make claims like "Feature A is preferred by 70% of customers," they need to understand margin of error. For a population of 2,000 with a target margin of ±5% at 95% confidence, the required sample is approximately 322 responses. Use the formula n = (Z² × p × (1-p)) / e² where Z=1.96, p=0.5 (worst case), e=0.05.
- Establish the primary metric the survey will produce -- a single "headline number" that summarizes the survey's central finding (overall CSAT mean, NPS score, engagement index score, etc.).

### Step 2: Define Research Questions -- the Analytical Layer Above Survey Questions

Research questions (RQs) are the analytical questions the survey answers -- they are NOT survey questions themselves. Every survey question exists only to answer one or more RQs.

- Write 3-7 RQs before writing any survey questions. Fewer than 3 suggests the survey is too narrow; more than 7 suggests it should be split into two separate surveys.
- RQs must be answerable with data -- "Why do customers churn?" is not a valid RQ because surveys cannot determine causation. Reframe as "What factors are most strongly correlated with customers who rate their likelihood to renew as 1-3 out of 5?"
- Classify each RQ by analysis type: descriptive (what is the distribution?), comparative (does Group A differ from Group B?), or relational (do two variables correlate?). Each type requires a different question design.
- Prioritize RQs as P1 (must answer -- survey fails without this), P2 (important but survey still valid without it), or P3 (nice to have). This prioritization drives question ordering and cut decisions if the survey becomes too long.
- For each RQ, write out what the output will look like: "RQ1 will produce a mean satisfaction score that we will compare against our Q3 benchmark of 3.9/5.0." This forces clarity before any questions are written.

### Step 3: Design the Survey Architecture and Flow

The sequence of questions is as important as the questions themselves. Cognitive load, primacy effects, and social desirability all interact with question order.

- **Opening section (1-3 questions):** Begin with easy, non-threatening, behaviorally factual questions (how long have you used the product, how often do you use feature X). Never open with opinion or satisfaction questions -- respondents need 1-2 questions to orient themselves. Never open with demographics, which can feel intrusive.
- **Core section (5-15 questions):** Place P1 research questions early. Use funnel ordering: start with broad/general questions and narrow to specific topics. Ask about overall satisfaction before asking about specific attributes -- if specific questions come first, they anchor the overall rating (anchoring bias).
- **Sensitive section (if needed):** Net Promoter, compensation/budget questions, or workplace complaint topics go in the second half after the respondent is engaged. Sensitive questions placed in the first half increase abandonment by 20-40%.
- **Closing section (1-2 questions):** One open-ended "anything else?" question and one optional demographic question. Demographic questions at the end have better response rates than at the beginning.
- Apply the "newspaper test" to the flow: read the questions in order as a respondent would experience them. Does each question feel like a natural follow-up to the previous one?
- Total question budget: Volunteer respondents (customers, general public) drop completion rates by approximately 5-10% per question beyond 10 questions. Incentivized respondents (paid panel, captive employee survey) tolerate up to 20 questions. Academic research surveys with highly motivated participants can go to 30-40 questions but must be disclosed upfront.

### Step 4: Select Question Types with Explicit Rationale

Each question type has specific use cases, analytical affordances, and known pitfalls. Match the question type to what the data needs to do, not to what feels easiest to write.

| Data Need | Question Type | Analytical Output | Key Constraint |
|-----------|--------------|-------------------|----------------|
| Measure attitude strength | 5-point Likert | Mean, median, frequency distribution | Use when you need parametric statistics and have ≥30 responses |
| Measure subtle attitude differences | 7-point Likert | More sensitive mean comparison | Use when comparing subgroups or when scale sensitivity is critical |
| Standard loyalty measurement | NPS (0-10 numeric) | Promoter%, Detractor%, NPS score | Always use 11-point (0-10), never 10-point (1-10), to match industry benchmarks |
| Effort/ease measurement | CES (1-7 or 1-5) | Mean CES; lower is better (less effort) | Use "The company made it easy for me to..." phrasing, not "How easy was it?" |
| Categorical exclusive choice | Single-choice / radio | Frequency distribution, mode | Options must be mutually exclusive and exhaustive (include "Other") |
| Categorical multiple response | Multi-select / checkbox | Frequency per option, combination patterns | Report as "% of respondents who selected" not "% of responses" |
| Relative priority | Forced ranking | Average rank per item, rank order | Limit to 5-7 items; beyond 7, respondents rank randomly |
| Rate multiple attributes | Matrix / grid | Mean per row, attribute ranking | Limit to 5-7 rows; matrix questions on mobile are notorious for abandonment |
| Exact quantity | Numeric input | Mean, median, range | Use when you genuinely need a number, not an approximation |
| Exploratory insight | Open text | Thematic coding, word frequency | Maximum 2-3 per survey; always make them optional for non-critical surveys |
| Nuanced continuous attitude | Semantic differential / slider | Mean on a polar scale | Use for research where directionality matters (e.g., simple vs. complex) |

Key rules for question type selection:
- Never use a matrix for questions that have different sub-topic scales -- all rows in a matrix must use the same scale to be valid.
- Never use ranking when the goal is to understand absolute satisfaction -- a respondent can rank support #1 but still rate it as poor. Use rating first, ranking only for relative comparison.
- Multi-select questions cannot produce mean scores -- they can only produce frequency distributions. Never analyze multi-select results with means.

### Step 5: Write Each Question and Validate for Bias

Question wording is where most surveys fail. Apply these specific writing disciplines to every question:

- **Single-concept rule:** Each question must ask about exactly one thing. "Was the support team fast and knowledgeable?" is invalid -- speed and knowledge are independent dimensions. If both matter, write two questions.
- **8th-grade readability rule:** Use the Flesch-Kincaid readability standard. Sentences under 20 words. No industry jargon (say "customer support" not "post-sale success engagement"). Spell out acronyms.
- **Neutral framing rule:** Avoid loading words. "How useful did you find our onboarding resources?" is neutral. "How helpful was our comprehensive onboarding documentation?" is loaded with "comprehensive" and "helpful."
- **Avoid presupposition:** "What features do you use?" presupposes the respondent uses features. Reframe as "Which of the following features, if any, have you used in the past 30 days?"
- **Define the reference period:** Questions about satisfaction or behavior must specify a time frame. "How satisfied are you?" is vague. "How satisfied are you with your experience over the past 3 months?" is specific.
- **Avoid negatives and double negatives:** "Do you disagree that the product is not easy to use?" is cognitive torture. Reframe as "How easy is the product to use?"
- **Social desirability check:** For any question where the "right answer" is obvious (e.g., "Do you care about data security?"), consider indirect phrasing or behavioral anchors instead.

For each question, document:
1. Question text (final wording)
2. Question type and response options
3. Which RQ it answers
4. Analysis method
5. Skip logic (if any)
6. Optional vs. required designation

### Step 6: Define Response Scales with Precise Labels

Scales must be labeled at every point, balanced in polarity, and consistent throughout the survey. Mixing scales for similar questions (5-point for some, 7-point for others) creates analysis problems and confuses respondents.

**Standard scales with precise wording:**

- **5-point Likert Agreement:** Strongly Disagree / Disagree / Neither Agree nor Disagree / Agree / Strongly Agree
- **7-point Likert Agreement:** Strongly Disagree / Disagree / Somewhat Disagree / Neither Agree nor Disagree / Somewhat Agree / Agree / Strongly Agree
- **5-point Satisfaction:** Very Dissatisfied / Dissatisfied / Neither Satisfied nor Dissatisfied / Satisfied / Very Satisfied
- **5-point Frequency:** Never / Rarely / Sometimes / Often / Always (Note: these are ordinal, not interval -- do not compute means without caution)
- **5-point Importance:** Not at All Important / Slightly Important / Moderately Important / Very Important / Extremely Important
- **NPS (0-10):** "Not at all likely" anchored at 0, "Extremely likely" anchored at 10 -- no intermediate labels, just endpoint anchors
- **CES (1-7):** "Strongly Disagree" anchored at 1, "Strongly Agree" anchored at 7 -- statement format: "The company made it easy to handle my issue"
- **CSAT (1-5 or 1-3):** For quick post-interaction measurement, 3-point (Dissatisfied / Neutral / Satisfied) outperforms 5-point in response rate; for detailed tracking, use 5-point

**Scale selection rules:**
- 5-point scales: Use when response sensitivity is less important and survey fatigue is a concern
- 7-point scales: Use when comparing subgroups where small differences matter, when respondents are experts or highly motivated, and in academic or formal research contexts
- Never use even-numbered scales (4-point, 6-point) unless you explicitly want to force a directional response (no neutral midpoint). Forced-choice scales increase social desirability bias.
- Add "Not Applicable" only when there is a genuine possibility the question does not apply. Overusing N/A creates data gaps.

### Step 7: Build the Analysis Plan -- Pre-Register Before Launch

The analysis plan must be written before the survey launches, not after data collection. Post-hoc analysis decisions introduce confirmation bias.

- For every RQ, specify: input questions, statistical method, output metric, and decision rule.
- **Descriptive analysis** (frequency distribution, mean, median): Use for all scaled and categorical questions. Always report means with standard deviation for Likert data. Report medians for highly skewed distributions.
- **Comparison analysis** (cross-tabulation, subgroup means): Requires segmentation variables to be built into the survey. Identify every comparison you want to make (tenure vs. satisfaction, role vs. NPS) and ensure the segmentation question is included. For comparing two group means, use an independent samples t-test. For three or more groups, use one-way ANOVA. For small samples (n<30 per group), report results as directional only.
- **Correlation analysis** (do two variables move together?): Pearson correlation for interval data (Likert means). Spearman correlation for ordinal data. Report r value and significance (p < 0.05 threshold for most business applications).
- **Thematic coding** for open-ended questions: Requires at least two independent coders for research-grade reliability. For business surveys, one coder with a defined category scheme is acceptable. Code to mutually exclusive, collectively exhaustive (MECE) categories. Report inter-rater reliability (Cohen's Kappa) if research-grade results are needed (target κ > 0.70).
- **NPS calculation:** % of respondents scoring 9-10 (Promoters) minus % scoring 0-6 (Detractors). Passives (7-8) are excluded from the calculation. Industry NPS benchmarks vary widely -- SaaS B2B benchmarks are typically NPS 30-50 for leaders. Do not compare NPS across industries.
- **Decision rules:** Every analysis output must have a threshold that triggers an action. "If CSAT falls below 3.5/5.0 for any cohort of 50+ responses, the relevant team lead is notified within 5 business days."

### Step 8: Pre-Launch Validation Checklist

Before the survey goes live, apply these quality gates:

- **Cognitive interview test:** Have 3-5 people from the target audience take the survey out loud (saying what they are thinking as they answer). This reveals misunderstandings invisible to the designer.
- **Completion time test:** Measure actual median completion time on 10 testers. If actual time exceeds stated time by more than 25%, shorten the survey or adjust the time estimate.
- **Mobile rendering check:** Verify that matrix questions, sliders, and open-text fields render correctly on mobile. Over 60% of survey responses now come from mobile devices. Matrix questions on mobile require respondents to scroll horizontally and have 30-50% higher non-response rates.
- **Skip logic validation:** Test every skip logic path to confirm no respondent gets stranded on an inaccessible question or exits the survey prematurely.
- **Anonymity statement review:** If the survey is anonymous, verify that no combination of demographic questions (role + tenure + department + location) could identify an individual respondent. This is especially critical for employee surveys with small teams.
- **Scale consistency audit:** Confirm that all Likert items in the survey use the same number of points. Mixed-scale surveys disorient respondents and create analysis inconsistencies.

## Output Format

```
## Survey: [Survey Title]

### Survey Overview
- **Purpose:** [Specific decision this survey informs and the action it enables]
- **Target respondent:** [Defined segment -- active customers >30 days, full-time employees, etc.]
- **Distribution channel:** [Email link, in-app intercept, QR code, embedded web, SMS]
- **Expected sample size:** [Target responses / target population] ([Target response rate]%)
- **Minimum viable sample:** [Calculated based on margin of error requirements]
- **Estimated completion time:** [X minutes (based on pre-launch test)]
- **Survey open period:** [Launch date to close date]
- **Primary metric:** [The single headline number this survey produces]
- **Benchmark:** [Prior survey result or industry standard for comparison, if applicable]

### Research Questions

| ID | Research Question | Priority | Analysis Type | Survey Questions |
|----|------------------|----------|--------------|-----------------|
| RQ1 | [Specific, answerable analytical question] | P1 | Descriptive | Q2, Q3 |
| RQ2 | [Specific, answerable analytical question] | P1 | Comparative | Q4, Q5, Q6 |
| RQ3 | [Specific, answerable analytical question] | P2 | Relational | Q7, Q8 |

---

### Survey Questions

#### Section 1: [Section Name] (Opening -- Questions 1-X)
*Purpose: [What this section establishes]*

---

**Q[N]: [Question text]**
- **Type:** [Question type]
- **Required:** [Yes / No]
- **Response options:**
  - [Option 1]
  - [Option 2]
  - [Option 3]
  - [Other / Prefer not to say -- if applicable]
- **Answers RQ:** [RQ number(s)]
- **Analysis method:** [Frequency count / Mean and SD / Cross-tab variable / Thematic coding]
- **Decision rule:** [If X then Y]
- **Skip logic:** [If [answer], skip to Q[N]. Otherwise continue. / None]
- **Wording rationale:** [Why this phrasing was chosen -- notes on bias avoided]

---

#### Section 2: [Section Name] (Core -- Questions X-Y)
*Purpose: [What this section measures]*

[Repeat question block structure]

---

#### Section 3: [Section Name] (Closing -- Questions Y-Z)
*Purpose: [Qualitative and demographic capture]*

[Repeat question block structure]

---

### Response Scales Reference

| Scale Name | Point Count | Labels (Low → High) | Used In | Notes |
|-----------|------------|---------------------|---------|-------|
| [Scale name, e.g., Satisfaction] | 5 | Very Dissatisfied → Very Satisfied | Q2, Q4, Q7 | Interval-treated for mean analysis |
| [NPS] | 11 (0-10) | Not at all likely → Extremely likely | Q9 | Promoters=9-10, Passives=7-8, Detractors=0-6 |

---

### Analysis Plan

| RQ | Input Questions | Statistical Method | Output Metric | Decision Rule | Owner |
|----|----------------|-------------------|---------------|---------------|-------|
| RQ1 | Q2, Q3 | Mean + SD vs benchmark; t-test | Mean CSAT score (1-5) | If mean < [threshold], escalate to [team] | [Role] |
| RQ2 | Q4, Q5, Q6 | Cross-tab by Q1 segment; one-way ANOVA | % distribution by group | If [group] scores differ by >0.5 points, investigate | [Role] |
| RQ3 | Q7, Q8 | Pearson r; thematic coding | Correlation coefficient + top themes | If r > 0.4, theme qualifies as a driver | [Role] |

---

### Survey Administration Notes

**Pre-launch checklist:**
- [ ] Cognitive interview completed with 3-5 target respondents
- [ ] Completion time verified under [X] minutes
- [ ] Mobile rendering tested on iOS and Android
- [ ] All skip logic paths tested end-to-end
- [ ] Anonymity posture confirmed and stated in survey intro

**Anonymity statement (to include in survey intro):**
"[Your responses are completely anonymous / Your responses are confidential to the HR team but not anonymous]. Individual responses will not be shared with [relevant party]. Results will be reported in aggregate only."

**Distribution schedule:**
- Launch: [Date]
- Reminder 1: [Date -- typically Day 5 for a 14-day window]
- Reminder 2: [Date -- typically Day 11]
- Close: [Date]

**Minimum response check:** If fewer than [minimum viable n] responses are received by Day 7, expand distribution to [additional channel or population].
```

## Rules

1. **Every question must map to at least one research question.** If a question cannot be linked to a specific RQ, cut it. Unmapped questions increase survey length, reduce completion rates, and produce data no one uses. The most common version of this failure is demographic questions collected "just in case" with no analysis plan.

2. **Scaled questions must use consistent point counts throughout the survey.** A survey that mixes 5-point and 7-point Likert scales within the same section is analytically invalid. Respondents mentally recalibrate at each scale change, making cross-question comparisons unreliable. Choose one scale and apply it to all similar questions.

3. **Never use leading or loaded language.** Words like "excellent," "innovative," "helpful," "comprehensive," or "convenient" presuppose a positive evaluation before the respondent answers. Use neutral verbs: rate, describe, evaluate, indicate, select.

4. **Overall satisfaction must come before attribute-level satisfaction.** Asking "Rate our support, reliability, and onboarding" before "Overall, how satisfied are you?" causes contamination -- respondents anchor their overall rating on the specific attributes just evaluated, suppressing variance in the overall score.

5. **Open-ended questions may not exceed three per survey for general respondent populations.** Each open-ended question adds 2-4 minutes to completion time and requires qualitative analysis capacity to process. If more qualitative data is needed, design a follow-up interview study, not a longer survey.

6. **The minimum viable sample size must be calculated before the survey launches.** For a population of 500, a margin of error of ±5% at 95% confidence requires 217 responses. For a population of 10,000, the same criteria requires 370 responses. Surveys that close with fewer responses than the minimum viable sample must be reported with explicit confidence limitations.

7. **Matrix questions (grid format) must be limited to 5-7 rows maximum.** Beyond 7 rows, respondents engage in "straight-lining" (selecting the same column for every row) to complete the question quickly. Straight-lining is a form of response bias that inflates consistency and suppresses meaningful variance. Detect straight-lining during data cleaning by flagging responses with zero variance across all matrix rows.

8. **"Not Applicable" must not be added by default -- it must be justified.** N/A options create missing data. Use N/A only when a meaningful proportion of respondents (estimate > 15%) genuinely cannot answer the question. For all other questions, the absence of an N/A forces the respondent to engage with the question or skip it consciously.

9. **Frequency scales (Never, Rarely, Sometimes, Often, Always) are ordinal, not interval.** Never compute means on frequency scales and present them as precise measurements. Medians and frequency distributions are the correct outputs. If interval-level analysis is needed, replace frequency scales with numeric frequency questions ("How many times in the past 30 days did you...?").

10. **The analysis plan must be written in pre-registration form before launch.** Specify every comparison, threshold, and decision rule before any data is collected. Post-hoc analysis -- deciding what to compare after seeing the data -- introduces p-hacking risk and confirmation bias. This is equally important in commercial surveys as in academic research.

11. **NPS must always use the standard 0-10 scale with specific Promoter/Passive/Detractor cut points.** Never use a 1-10 scale or a 1-5 scale for NPS. The 0-6 Detractor / 7-8 Passive / 9-10 Promoter segmentation is fixed by the standard and cannot be adjusted without making results incomparable to any benchmark.

12. **Employee surveys require mandatory anonymity architecture review.** If a team or department has fewer than 10 people, suppress individual sub-group reporting and report only at the aggregate level. Identifiable individual responses in employee surveys violate psychological safety and produce dishonest answers.

## Edge Cases

### Small Sample Populations (Expected n < 30)

When fewer than 30 responses are expected, standard parametric statistics (means, t-tests, Pearson correlations) are unreliable. Redesign the survey to emphasize qualitative data: reduce scaled questions to a maximum of 3-4 critical ones, expand open-ended questions to 4-5, and use open-text coding as the primary analysis method. Report scaled results as percentages with explicit disclaimers: "Based on 22 responses; results are directional only and should not be treated as statistically significant." Consider whether structured interviews would serve the research question better. If the user insists on a quantitative approach with a small sample, use non-parametric statistics: Wilcoxon signed-rank instead of t-test, Spearman instead of Pearson, and chi-square with Yates correction for small expected cell counts.

### Longitudinal and Pulse Surveys (Repeated Over Time)

When a survey will be administered repeatedly (quarterly NPS, monthly pulse, annual engagement), question wording and scales must be frozen from the first administration. Any wording change invalidates trend analysis. Design the minimum question set (5-10 questions) that produces the headline metric for trend tracking. Use a "modular" architecture: a fixed core module (5-7 questions, identical each cycle) plus a rotating deep-dive module (3-5 questions that rotate each cycle to investigate different topics without adding survey fatigue). Document the version history of every survey iteration with change dates. When a question must be changed (e.g., to correct a bias discovered post-launch), treat it as a new question: run both old and new wording in parallel for one administration cycle to establish a "bridge score," then retire the old wording.

### Mixed-Method Surveys (Quantitative Goals + Qualitative Depth)

When a survey must serve both statistical measurement and exploratory qualitative goals, structure the survey in two stages: all quantitative questions first (scaled, categorical) in the core section, then qualitative questions last (open-ended) as optional closing questions. This ensures that respondents who hit survey fatigue and abandon after the core section have still produced analyzable quantitative data. Never interleave open-ended questions with scaled questions -- the cognitive switch between answering a 5-point scale and writing a paragraph disrupts flow and increases partial-completion rates. When analyzing the combined data, use "quantitative anchoring": first analyze the quantitative results to identify the key finding, then use the qualitative responses to explain and contextualize that finding, not to generate new hypotheses.

### Surveys Targeting Non-English Speakers or Low-Literacy Populations

Standard Likert phrasing ("Neither Agree nor Disagree") is difficult to process for populations with low reading proficiency or non-native language skills. Use visual scales: a 5-point smiley face scale (😞 😕 😐 🙂 😀) for satisfaction, star ratings for quality, or a thumbs up/down binary for simple yes/no evaluations. Keep all questions under 12 words. Avoid negatives entirely ("Is the product hard to use?" should become "Is the product easy to use?"). For translated surveys, use back-translation protocol: translate to target language, then have a different translator translate back to English, then compare the back-translation to the original to identify semantic drift. Never use automated translation alone for survey instruments.

### Sensitive Topic Surveys (Health, Finance, Workplace Complaints, DEI)

For surveys covering sensitive topics, three design changes are mandatory. First, lead the survey introduction with a clear, prominent anonymity guarantee -- state specifically who cannot see individual responses. Second, apply the "indirect question" technique for the most sensitive items: instead of "Have you experienced harassment at work?", ask "Have you witnessed or heard about any of the following behaviors in the past 12 months?" with a list. Indirect questions produce more honest responses because they reduce the personal threat of admission. Third, provide a "Prefer not to answer" option on every sensitive question -- its mere presence (even if not selected) reduces defensive answering patterns. For demographic questions involving race, gender identity, or disability status, use current government standards for category definitions (e.g., U.S. Census Bureau race categories or EEOC standards) to ensure comparability and legal defensibility.

### Survey Fatigue in Frequently Surveyed Populations

When the user's audience receives surveys frequently (e.g., SaaS customers who receive NPS, CSAT, onboarding, and renewal surveys), response rates and response quality degrade over time. Solutions: (1) Implement survey suppression logic -- do not survey the same respondent more than once per 60-90 day window across all survey types. (2) Reduce to a single-question transactional survey (one CSAT or CES question immediately post-interaction) rather than a 10-question satisfaction survey quarterly. (3) Use survey rotation -- divide the respondent pool into equal thirds, and each third receives a different survey each quarter, ensuring full coverage across four cycles while each individual receives only one survey per year. (4) Consider passive data collection (behavioral analytics, support ticket sentiment analysis) as a partial replacement for explicit survey questions. Survey fatigue surveys are a real phenomenon -- if a user asks why their response rate has dropped from 25% to 8%, survey fatigue and suppression strategies are the first diagnosis.

### Post-Event and Time-Bounded Surveys

For surveys distributed immediately after a specific event (webinar, conference, product launch, support interaction), the collection window must be short (24-72 hours maximum) because response quality degrades rapidly with time. The question scope must be tightly bounded to the event itself -- do not use a post-event survey to ask about general brand satisfaction. Apply CSAT or CES as the primary metric rather than NPS (NPS measures relationship loyalty, not event quality). For post-support surveys specifically, use Gartner's validated CES question: "The company made it easy for me to handle my issue" on a 7-point agreement scale. CES is more predictive of repurchase behavior and churn than CSAT for support interactions. For conferences or training events, use Kirkpatrick's four levels as the RQ framework: Reaction (did they enjoy it?), Learning (did they gain new knowledge?), Behavior (will they apply it?), and Results (will it impact their metrics?). Each level requires different question types.

### Surveys Requiring Regulatory or Institutional Compliance

Surveys in healthcare, academic research, financial services, or involving minors require specific design constraints. Academic and clinical surveys involving human subjects require Institutional Review Board (IRB) approval before launch -- the survey instrument itself is part of the IRB submission and cannot be modified after approval without re-submission. Healthcare surveys collecting Protected Health Information (PHI) must comply with HIPAA -- anonymous surveys are safest; if a survey collects contact information alongside health data, a Business Associate Agreement may be required between the survey platform and the organization. Surveys involving minors (under 18) require verifiable parental consent in most jurisdictions. Financial services surveys that could be interpreted as investment research must include standard disclaimer language. Flag these requirements explicitly to the user before proceeding with survey design.

## Example

**Input:** "We're launching a new onboarding flow for our B2B project management SaaS. We need to survey customers who went through the new onboarding in the past 60 days to understand whether it's working. We care about time-to-value, where people get stuck, and whether they feel confident using the product. We have about 300 customers who went through the new flow and we're hoping for at least 80-100 responses."

---

## Survey: New Onboarding Experience Assessment -- [Q1 2026]

### Survey Overview
- **Purpose:** Evaluate whether the redesigned onboarding flow achieves faster time-to-value, identify where users encounter friction or confusion, and measure post-onboarding product confidence -- to inform whether to scale the new flow to all customers or iterate further
- **Target respondent:** B2B customers who completed the new onboarding flow within the past 60 days (n=300 eligible)
- **Distribution channel:** In-app notification (Day 3 post-onboarding complete) + email link (Day 5 fallback for non-openers)
- **Expected sample size:** 90-120 responses from 300 eligible customers (30-40% response rate -- higher than average due to recency of experience)
- **Minimum viable sample:** 73 responses (population 300, margin of error ±10%, 95% confidence) -- below this, results are directional only
- **Estimated completion time:** 4-5 minutes (9 questions, validated by pre-launch test)
- **Survey open period:** 10 days from launch (close before 14-day mark when onboarding memory degrades)
- **Primary metric:** Post-Onboarding Confidence Score (mean on a 5-point scale, target ≥ 4.0/5.0)
- **Benchmark:** Pre-redesign onboarding satisfaction score of 3.2/5.0 (Q3 survey); no prior confidence score exists -- this is the baseline measurement

---

### Research Questions

| ID | Research Question | Priority | Analysis Type | Survey Questions |
|----|------------------|----------|--------------|-----------------|
| RQ1 | What is the post-onboarding confidence level compared to the pre-redesign baseline? | P1 | Descriptive + Comparative | Q2, Q3 |
| RQ2 | Which specific onboarding steps produce the most friction, confusion, or abandonment? | P1 | Descriptive + Diagnostic | Q4, Q5, Q6 |
| RQ3 | How long did customers perceive it took to feel productive with the product, and does that differ by company size? | P1 | Comparative | Q1, Q7 |
| RQ4 | What would most improve the onboarding experience for customers who report low confidence? | P2 | Relational + Qualitative | Q2, Q8 |
| RQ5 | Are there differences in confidence and friction by the respondent's role (admin vs end user)? | P2 | Comparative | Q9 (segmentation), all core questions |

---

### Survey Questions

#### Section 1: Orientation (Opening -- Questions 1)
*Purpose: Establish time-to-value perception before anchoring on specific satisfaction ratings*

---

**Q1: After completing the initial setup, how long did it take before you felt productive using [Product Name] for real work?**
- **Type:** Single-choice (radio)
- **Required:** Yes
- **Response options:**
  - Less than 1 day
  - 1-3 days
  - 4-7 days
  - 1-2 weeks
  - More than 2 weeks
  - I don't feel fully productive yet
- **Answers RQ:** RQ3 -- perceived time-to-value measurement
- **Analysis method:** Frequency distribution; cross-tabulate with Q9 (role) and company size if available from CRM enrichment
- **Decision rule:** If more than 30% of respondents select "More than 2 weeks" or "I don't feel fully productive yet," the onboarding flow requires a significant revision; escalate to Head of Product
- **Skip logic:** None
- **Wording rationale:** Opens with a behavioral/temporal question (not an opinion) to orient the respondent and avoid anchoring the confidence question that follows

---

#### Section 2: Confidence and Friction (Core -- Questions 2-7)
*Purpose: Measure the primary metrics (confidence, friction points) for RQ1, RQ2, and RQ3*

---

**Q2: Overall, how confident do you feel using [Product Name] after completing onboarding?**
- **Type:** 5-point Likert (Confidence scale)
- **Required:** Yes
- **Response options:** Not at all confident (1) / Slightly confident (2) / Moderately confident (3) / Very confident (4) / Extremely confident (5)
- **Answers RQ:** RQ1 -- primary metric (Post-Onboarding Confidence Score)
- **Analysis method:** Mean and SD; compare to baseline (no prior benchmark -- this is the baseline). Track as primary metric. Segment by Q9 (role) and Q1 (time-to-value).
- **Decision rule:** If mean ≥ 4.0/5.0, proceed to scale new onboarding to all customers. If 3.5-3.9, iterate on specific friction points identified in Q4-Q6. If < 3.5, conduct follow-up interviews before scaling.
- **Skip logic:** None
- **Wording rationale:** "Confident" is used rather than "satisfied" because the specific goal of onboarding is capability-building, not general happiness. Placed after Q1 to avoid overall confidence contaminating the time-to-value perception.

---

**Q3: Please rate your experience with each of the following aspects of the onboarding:**
- **Type:** Matrix (5-point Satisfaction scale)
- **Required:** Yes
- **Rows:**
  1. Initial account setup (first-time login, team invitation)
  2. Learning how to create your first project
  3. Understanding how to assign tasks and deadlines
  4. Connecting integrations (Slack, calendar, email)
  5. Finding help resources when stuck (tutorials, tooltips, help center)
- **Scale:** Very Dissatisfied (1) / Dissatisfied (2) / Neither Satisfied nor Dissatisfied (3) / Satisfied (4) / Very Satisfied (5)
- **Answers RQ:** RQ2 -- identify which specific onboarding modules produce friction
- **Analysis method:** Mean per row; rank all 5 modules from lowest to highest mean; flag any row with mean < 3.0/5.0 as a critical friction point
- **Decision rule:** Any module with mean < 3.0 receives a dedicated design sprint in the next two-week cycle
- **Skip logic:** None
- **Wording rationale:** Matrix limited to 5 rows to avoid straight-lining. Rows correspond directly to the five steps in the new onboarding flow (they were documented before this survey was designed). Generic labels like "Overall experience" are excluded from the matrix -- that is captured separately in Q2.

---

**Q4: Were there any steps during onboarding where you felt stuck or confused?**
- **Type:** Single-choice (radio)
- **Required:** Yes
- **Response options:**
  - Yes
  - No
- **Answers RQ:** RQ2 -- binary filter before follow-up diagnostic question
- **Analysis method:** Frequency (% yes vs % no); cross-tabulate with Q2 (do "stuck" respondents have lower confidence scores?)
- **Decision rule:** If more than 40% of respondents select Yes, the onboarding has a structural problem, not just isolated edge cases
- **Skip logic:** If No, skip to Q6
- **Wording rationale:** Binary question used here deliberately as a filter rather than asking everyone to identify friction points. Asking "Which steps confused you?" of someone who was never confused produces forced or false answers.

---

**Q5: [Displayed only if Q4 = Yes] Which part of the onboarding caused the most confusion or friction? Select all that apply.**
- **Type:** Multi-select (checkbox)
- **Required:** No (displayed conditionally)
- **Response options:**
  - Initial account setup
  - Creating my first project
  - Assigning tasks and deadlines
  - Setting up integrations
  - Finding help resources
  - Understanding what to do next at any given step
  - The amount of information felt overwhelming
  - Something else (please describe briefly): [short open text field]
- **Answers RQ:** RQ2 -- specific friction point identification
- **Analysis method:** Frequency per option (report as "% of respondents who encountered friction here" -- not as % of total responses). Compare Q5 frequencies to Q3 matrix means for consistency. If Q5 frequency ranking and Q3 mean ranking contradict each other, flag as an insight requiring qualitative follow-up.
- **Decision rule:** Top 2 friction options by frequency become the two onboarding design sprint priorities
- **Skip logic:** Shown only if Q4 = Yes
- **Wording rationale:** Multi-select used because multiple friction points can co-exist. "Something else" with a short text field captures unanticipated issues.

---

**Q6: How would you rate the quality of the help resources available during onboarding? (Tooltips, tutorial videos, help center articles)**
- **Type:** 5-point Likert (Satisfaction scale)
- **Required:** Yes
- **Response options:** Very Dissatisfied (1) / Dissatisfied (2) / Neither Satisfied nor Dissatisfied (3) / Satisfied (4) / Very Satisfied (5), plus "I did not use any help resources" option
- **Answers RQ:** RQ2 -- specific diagnostic on help resource quality (a known weakness from pre-redesign feedback)
- **Analysis method:** Mean excluding "did not use" responses; cross-tabulate with Q4 (did people who got stuck have lower help resource ratings?); report "did not use" rate separately as an indicator of self-sufficiency
- **Decision rule:** If mean < 3.5/5.0 among those who used help resources, assign content audit to documentation team before scaling
- **Skip logic:** None
- **Wording rationale:** "N/A" option (did not use) is included here because a meaningful proportion of users may have completed onboarding without needing help -- forcing a rating would produce invalid data. This is one of the justified uses of N/A per Rule 8.

---

**Q7: How does your confidence using [Product Name] today compare to your confidence immediately after completing onboarding?**
- **Type:** Single-choice (radio)
- **Required:** Yes
- **Response options:**
  - Much more confident now
  - Somewhat more confident now
  - About the same
  - Somewhat less confident now
  - Much less confident now
- **Answers RQ:** RQ3 -- measures whether product experience after onboarding reinforces or erodes onboarding gains
- **Analysis method:** Frequency distribution; flag any "less confident" response rate above 15% as a signal that the product experience (not just onboarding) is eroding confidence post-launch
- **Decision rule:** If more than 15% select "Somewhat" or "Much less confident now," the issue extends beyond onboarding into core product usability -- a separate product satisfaction survey should be initiated
- **Skip logic:** None
- **Wording rationale:** Comparative question rather than a repeat rating avoids the respondent having to recall a precise past rating. "Compared to" framing is cognitively easier and produces more reliable data.

---

#### Section 3: Open Feedback and Segmentation (Closing -- Questions 8-9)
*Purpose: Capture qualitative context and enable segmentation*

---

**Q8: What is the single most important improvement we could make to the onboarding experience?**
- **Type:** Open text (short -- 1-3 sentences; displayed with a visible character count of 280 max)
- **Required:** No
- **Response options:** Free text field
- **Answers RQ:** RQ4 -- qualitative improvement prioritization
- **Analysis method:** Thematic coding into MECE categories (Setup complexity, Guidance clarity, Pacing and length, Integration issues, Missing features, Other). Report top 3 themes by frequency. Cross-tabulate themes with Q2 confidence quintiles: do low-confidence respondents (score 1-2) identify different themes than high-confidence respondents (score 4-5)?
- **Decision rule:** Any theme identified by more than 20% of respondents who also scored Q2 ≤ 2 is a critical remediation priority
- **Skip logic:** None
- **Wording rationale:** "Single most important" forces prioritization -- without that constraint, respondents list everything and themes become unranked. The 280-character limit encourages brevity without being restrictive.

---

**Q9: What best describes your role when using [Product Name]? (Optional)**
- **Type:** Single-choice (radio)
- **Required:** No
- **Response options:**
  - Workspace Admin (sets up the account, invites team members)
  - Project Manager (creates and manages projects)
  - Team Member / Contributor (assigned tasks, works within projects)
  - Executive / Observer (views dashboards and reports)
  - Other
- **Answers RQ:** RQ5 -- segmentation variable for all core questions
- **Analysis method:** Cross-tabulate Q2 (confidence), Q3 (matrix scores), and Q1 (time-to-value) by role. Admins and end users have different onboarding journeys and are expected to show different friction patterns. Report role segments separately if n ≥ 20 per segment.
- **Decision rule:** If Admin and Contributor segments show confidence means that differ by more than 0.5 points, design role-specific onboarding tracks
- **Skip logic:** None
- **Wording rationale:** Role descriptions include behavioral descriptors, not just titles, because B2B respondents use different role titles across companies. Optional because demographics at the end have higher N/A rates and this segmentation is P2, not P1.

---

### Response Scales Reference

| Scale Name | Point Count | Labels (Low → High) | Used In | Notes |
|-----------|------------|---------------------|---------|-------|
| Confidence (5-point) | 5 | Not at all confident → Extremely confident | Q2 | Treated as interval for mean analysis; distinct from satisfaction |
| Satisfaction (5-point) | 5 | Very Dissatisfied → Very Satisfied | Q3, Q6 | Treated as interval for mean analysis; both endpoints explicitly labeled |
| Comparative change (5-point) | 5 | Much less confident now → Much more confident now | Q7 | Ordinal -- report frequencies, not mean |

---

### Analysis Plan

| RQ | Input Questions | Statistical Method | Output Metric | Decision Rule | Owner |
|----|----------------|-------------------|---------------|---------------|-------|
| RQ1: Post-onboarding confidence | Q2, segmented by Q9 (role) and Q1 (time-to-value) | Mean and SD; one-way ANOVA by role segment (if n ≥ 20 per group) | Mean Confidence Score (1-5); this is the new baseline | ≥ 4.0: scale new flow. 3.5-3.9: iterate on friction points. < 3.5: interview before scaling | Head of Onboarding |
| RQ2: Friction point identification | Q3 (matrix means), Q4 (stuck binary), Q5 (friction multi-select), Q6 (help resources) | Rank Q3 rows by mean; frequency distribution for Q5; compare Q3 and Q5 rankings for consistency | Ranked friction hotspot list; top 2 module priorities | Any Q3 row < 3.0 OR any Q5 option > 30% frequency triggers a design sprint | Product Designer |
| RQ3: Time-to-value by segment | Q1, Q7, segmented by Q9 | Frequency distribution for Q1; cross-tab Q1 × Q9 (role) using chi-square if n allows | % achieving productivity within 3 days; distribution by role | If >30% select > 2 weeks or "not yet productive," investigate whether role-specific tracks are needed | Product Manager |
| RQ4: Improvement prioritization | Q8, cross-referenced with Q2 quintiles | Thematic coding (MECE categories); frequency by theme; compare themes between low-confidence (Q2 ≤ 2) and high-confidence (Q2 ≥ 4) groups | Top 3 improvement themes; low-confidence theme list | Theme >20% among low-confidence group = critical remediation | Content and UX Lead |
| RQ5: Role-based differences | Q9 × Q2, Q3, Q1 | Cross-tabulation; subgroup means; one-way ANOVA if n ≥ 20 per role | Confidence and friction scores by role | If Admin vs. Contributor confidence differs by > 0.5 points, design role-specific tracks | Head of Onboarding |

---

### Survey Administration Notes

**Pre-launch checklist:**
- [ ] Cognitive interview completed with 5 recent onboarding completers (mix of roles)
- [ ] Completion time verified at under 5 minutes with 10 internal testers
- [ ] Mobile rendering tested (Q3 matrix rendered correctly on iOS Safari and Chrome Android)
- [ ] Skip logic Q4→Q5 tested: respondents selecting "No" on Q4 correctly skip Q5
- [ ] Anonymity posture confirmed: responses are anonymous; individual response cannot be tied to account or contact record

**Survey introduction text (to display before Q1):**
"You recently completed onboarding for [Product Name]. We'd love to know how it went -- your feedback directly shapes how we improve the experience for new customers. This survey takes about 4-5 minutes. Your responses are completely anonymous and will not be shared with your account team or sales contact."

**Anonymity statement:** Your responses are completely anonymous. Individual responses cannot be linked to your account, company, or
